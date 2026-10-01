package com.ruijie.voucher;

import android.app.Activity;
import android.app.Dialog;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import org.json.JSONArray;import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * In-app portal network recorder (v1.5.106).
 *
 * The user taps Record in More → a full-screen dialog opens the Ruijie portal
 * in a WebView (session cookies are shared with the SSO login via
 * CookieManager). A JavaScript interceptor installed on every page captures
 * fetch/XHR calls. The user performs portal actions normally, then taps Stop.
 * The captured API calls are filtered, de-duplicated, saved as a .txt file,
 * and offered via the Android share sheet — zero DevTools knowledge needed.
 *
 * Token-conscious by design: static assets (.js/.css/images/fonts) are
 * skipped, identical requests are de-duplicated, and bodies are truncated.
 */
public class PortalRecorder {

    /**
     * Portal home. Requires a valid portal session (established via SSO
     * login) — without it nginx returns 403. The bridge ensures SSO login
     * before opening the recorder, so by the time we load this the
     * session cookies are in place.
     */
    private static final String PORTAL_URL = "https://cloud-as.ruijienetworks.com/macc5/";

    /** File extensions never recorded (static assets, not API calls). */
    private static final String[] SKIP_EXT = {
        ".js", ".css", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico",
        ".woff", ".woff2", ".ttf", ".eot", ".map", ".webp"
    };

    public interface DoneCallback {
        void onDone(String filePath, int count);
    }

    public static void show(final Activity activity, final DoneCallback cb) {
        show(activity, null, cb);
    }

    /**
     * v1.5.111: startUrl is the real portal URL captured from the SSO
     * dialog's successful login (SsoSession.getLastPortalUrl()). Falls
     * back to the portal home guess when null.
     */
    public static void show(final Activity activity, final String startUrl,
                            final DoneCallback cb) {
        final Dialog dialog = new Dialog(activity, android.R.style.Theme_NoTitleBar_Fullscreen);

        final FrameLayout root = new FrameLayout(activity);

        // WebView
        final WebView webView = new WebView(activity);
        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);
        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cm.setAcceptThirdPartyCookies(webView, true);
        }
        webView.setWebChromeClient(new WebChromeClient());

        // Top recording bar: indicator + count + stop button
        final LinearLayout bar = new LinearLayout(activity);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);
        bar.setBackgroundColor(Color.parseColor("#CC000000"));
        bar.setPadding(dp(activity, 12), dp(activity, 10), dp(activity, 12), dp(activity, 10));

        final TextView recLabel = new TextView(activity);
        recLabel.setText("\uD83D\uDD34 Recording… (0)");
        recLabel.setTextColor(Color.WHITE);
        recLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        LinearLayout.LayoutParams lpLabel = new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        bar.addView(recLabel, lpLabel);

        final Button stopBtn = new Button(activity);
        stopBtn.setText("Stop & Save");
        stopBtn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                stopAndSave(activity, dialog, webView, cb);
            }
        });
        bar.addView(stopBtn);

        // v1.5.108: reload button + URL display for diagnosing blank pages
        final Button reloadBtn = new Button(activity);
        reloadBtn.setText("↻");
        reloadBtn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { webView.reload(); }
        });
        bar.addView(reloadBtn);

        final Button closeBtn = new Button(activity);
        closeBtn.setText("✕");
        closeBtn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { dialog.dismiss(); }
        });
        bar.addView(closeBtn);

        // URL line under the bar — shows where the WebView actually is
        final TextView urlLine = new TextView(activity);
        urlLine.setTextColor(Color.WHITE);
        urlLine.setTextSize(TypedValue.COMPLEX_UNIT_SP, 11);
        urlLine.setBackgroundColor(Color.parseColor("#AA000000"));
        urlLine.setPadding(dp(activity, 12), dp(activity, 4),
                dp(activity, 12), dp(activity, 4));
        urlLine.setSingleLine(true);
        android.text.TextUtils.TruncateAt ellipsize =
                android.text.TextUtils.TruncateAt.MIDDLE;
        urlLine.setEllipsize(ellipsize);

        FrameLayout.LayoutParams barLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        barLp.gravity = Gravity.TOP;
        root.addView(bar, barLp);

        FrameLayout.LayoutParams urlLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        urlLp.gravity = Gravity.TOP;
        urlLp.topMargin = dp(activity, 56);
        root.addView(urlLine, urlLp);

        final ProgressBar progress = new ProgressBar(activity, null,
                android.R.attr.progressBarStyleHorizontal);
        FrameLayout.LayoutParams progLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(activity, 4));
        progLp.gravity = Gravity.TOP;
        progLp.topMargin = dp(activity, 80);
        root.addView(progress, progLp);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url,
                                     android.graphics.Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
                urlLine.setText(url != null ? url : "");
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                urlLine.setText(url != null ? url : "");
                injectInterceptor(view);
                updateCount(view, recLabel);
            }
            @Override
            public void onReceivedError(WebView view,
                                        WebResourceRequest request,
                                        android.webkit.WebResourceError error) {
                String msg = "Load error: " +
                    (error != null ? error.getDescription() : "?");
                urlLine.setText(msg);
                Toast.makeText(activity, msg, Toast.LENGTH_LONG).show();
            }
            @Override
            @SuppressWarnings("deprecation")
            public void onReceivedError(WebView view, int errorCode,
                                        String description, String failingUrl) {
                String msg = "Load error: " + description;
                urlLine.setText(msg);
                Toast.makeText(activity, msg, Toast.LENGTH_LONG).show();
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view,
                                                    WebResourceRequest request) {
                return false;
            }
            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return false;
            }
        });

        dialog.setContentView(root);
        dialog.setOnCancelListener(d -> { /* user closed via back */ });
        dialog.show();
        String target = startUrl != null && !startUrl.isEmpty()
                ? startUrl : PORTAL_URL;
        webView.loadUrl(target);
    }

    /** Install (or re-install) the fetch/XHR interceptor on the current page. */
    private static void injectInterceptor(WebView view) {
        // Guarded by window.__nrOn so SPA navigations don't double-wrap.
        // The log lives in sessionStorage so it survives the SSO redirect
        // chain (CAS login -> ticket -> portal are full page loads).
        String js = "(function(){" +
            "if(window.__nrOn)return;window.__nrOn=true;" +
            "function getLog(){try{return JSON.parse(sessionStorage.getItem('__nrLogs')||'[]')}catch(e){return[]}}" +
            "function setLog(l){try{sessionStorage.setItem('__nrLogs',JSON.stringify(l.slice(-500)))}catch(e){}}" +
            "var SKIP=/\\.(js|css|png|jpe?g|gif|svg|ico|woff2?|ttf|eot|map|webp)([?#]|$)/i;" +
            "function rec(m,u,b){" +
            "  try{" +
            "    u=String(u); if(SKIP.test(u))return;" +
            "    var l=getLog();" +
            "    l.push({m:m,u:u.slice(0,300),b:b?String(b).slice(0,2000):null});" +
            "    setLog(l);" +
            "  }catch(e){}" +
            "};" +
            "var _f=window.fetch;" +
            "window.fetch=function(u,o){" +
            "  rec((o&&o.method)||'GET',u,o&&o.body);" +
            "  return _f.apply(this,arguments);" +
            "};" +
            "var _o=XMLHttpRequest.prototype.open,_s=XMLHttpRequest.prototype.send;" +
            "XMLHttpRequest.prototype.open=function(m,u){this.__m=m;this.__u=u;return _o.apply(this,arguments);};" +
            "XMLHttpRequest.prototype.send=function(b){rec(this.__m,this.__u,b);return _s.apply(this,arguments);};" +
            "})();";
        view.evaluateJavascript(js, null);
    }

    /** Refresh the "Recording… (N)" counter. */
    private static void updateCount(WebView view, final TextView label) {
        view.evaluateJavascript(
            "(function(){try{return JSON.parse(sessionStorage.getItem('__nrLogs')||'[]').length}catch(e){return 0}})()",
            value -> {
                try {
                    label.setText("\uD83D\uDD34 Recording… (" + value + ")");
                } catch (Exception ignored) {}
            });
    }

    private static void stopAndSave(final Activity activity, final Dialog dialog,
                                    WebView webView, final DoneCallback cb) {
        webView.evaluateJavascript(
            "(function(){try{return sessionStorage.getItem('__nrLogs')||'[]'}catch(e){return '[]'}})()",
            json -> {
            try {
                String raw = json;
                // evaluateJavascript wraps the result in quotes; unwrap.
                if (raw != null && raw.length() >= 2 && raw.startsWith("\"")) {
                    raw = new JSONObject("{\"v\":" + raw + "}").getString("v");
                }
                JSONArray arr = new JSONArray(raw == null ? "[]" : raw);
                StringBuilder sb = new StringBuilder();
                SimpleDateFormat sdf = new SimpleDateFormat(
                        "yyyy-MM-dd HH:mm:ss", Locale.US);
                sb.append("Portal network capture — ")
                  .append(sdf.format(new Date())).append("\n");
                sb.append("========================================\n\n");

                Set<String> seen = new HashSet<>();
                int kept = 0;
                for (int i = 0; i < arr.length(); i++) {
                    JSONObject o = arr.getJSONObject(i);
                    String m = o.optString("m", "?");
                    String u = o.optString("u", "?");
                    String b = o.isNull("b") ? null : o.optString("b", null);
                    // De-dupe identical method+url+body
                    String key = m + "|" + u + "|" + (b == null ? "" : b);
                    if (!seen.add(key)) continue;
                    kept++;
                    sb.append("--- [").append(kept).append("] ")
                      .append(m).append(" ").append(u).append("\n");
                    sb.append(b == null ? "(no body)" : b).append("\n\n");
                }
                if (kept == 0) {
                    sb.append("(no API calls captured)\n");
                }
                sb.append("\nTotal unique API calls: ").append(kept).append("\n");

                File dir = activity.getExternalFilesDir(null);
                if (dir == null) dir = activity.getFilesDir();
                String name = "portal-capture-" +
                        new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US)
                                .format(new Date()) + ".txt";
                File f = new File(dir, name);
                try (FileOutputStream fos = new FileOutputStream(f)) {
                    fos.write(sb.toString().getBytes(StandardCharsets.UTF_8));
                }

                dialog.dismiss();
                Toast.makeText(activity,
                        "Saved: " + name + " (" + kept + " calls)",
                        Toast.LENGTH_LONG).show();
                shareFile(activity, f);
                if (cb != null) cb.onDone(f.getAbsolutePath(), kept);
            } catch (Exception e) {
                Toast.makeText(activity,
                        "Capture failed: " + e.getMessage(),
                        Toast.LENGTH_LONG).show();
            }
        });
    }

    /**
     * Publish the .txt into the public Downloads collection via MediaStore
     * (framework API — no AndroidX needed) and share the content:// URI.
     * The user picks any app (chat, mail, drive…) to send the file.
     */
    private static void shareFile(Activity activity, File f) {
        try {
            String name = f.getName();
            ContentValues cv = new ContentValues();
            cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
            cv.put(MediaStore.Downloads.MIME_TYPE, "text/plain");
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                cv.put(MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS);
            }
            ContentResolver cr = activity.getContentResolver();
            Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
            if (uri != null) {
                try (java.io.OutputStream os = cr.openOutputStream(uri);
                     java.io.InputStream is = new java.io.FileInputStream(f)) {
                    byte[] buf = new byte[8192];
                    int n;
                    while ((n = is.read(buf)) > 0) os.write(buf, 0, n);
                }
                Intent share = new Intent(Intent.ACTION_SEND);
                share.setType("text/plain");
                share.putExtra(Intent.EXTRA_STREAM, uri);
                share.putExtra(Intent.EXTRA_SUBJECT, "Portal network capture");
                share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                activity.startActivity(Intent.createChooser(share,
                        "Send capture file"));
                return;
            }
        } catch (Exception e) {
            // fall through to path toast
        }
        Toast.makeText(activity, "Saved to: " + f.getAbsolutePath(),
                Toast.LENGTH_LONG).show();
    }

    private static int dp(Activity a, int v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v,
                a.getResources().getDisplayMetrics());
    }
}
