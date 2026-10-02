package com.ruijie.voucher;

import android.app.Activity;
import android.app.Dialog;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.drawable.GradientDrawable;
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
        // v1.5.112: zoom controls — gateway eWeb is desktop-sized, user
        // needs to zoom out/in to reach all buttons.
        ws.setBuiltInZoomControls(true);
        ws.setDisplayZoomControls(true);
        ws.setSupportZoom(true);
        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cm.setAcceptThirdPartyCookies(webView, true);
        }
        webView.setWebChromeClient(new WebChromeClient());

        // v1.5.114: compact iOS-style top UI — one slim bar (~40dp) with a
        // collapsible URL row. Replaces the 3 stacked bars (~128dp) that
        // covered the page content.
        // v1.5.118: iOS Liquid Glass floating sheet — rounded 20dp,
        // dark translucent material + hairline ring, floats with margins
        // (was a full-width square near-black bar).
        final LinearLayout topWrap = new LinearLayout(activity);
        topWrap.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable panelBg = new GradientDrawable();
        panelBg.setShape(GradientDrawable.RECTANGLE);
        panelBg.setCornerRadius(dpF(activity, 20f));
        panelBg.setColor(Color.parseColor("#D61C1C1E"));
        panelBg.setStroke(dp(activity, 1), Color.parseColor("#40FFFFFF"));
        topWrap.setBackground(panelBg);
        topWrap.setPadding(dp(activity, 10), dp(activity, 8),
                dp(activity, 10), dp(activity, 8));

        // v1.5.115: iOS AssistiveTouch-style floating ball. ~48dp, draggable,
        // shows the capture count. Tap to open the control panel.
        // v1.5.118: iOS Liquid Glass — true circle, dark translucent
        // material + hairline white ring (was a square black box).
        final TextView floatBall = new TextView(activity);
        floatBall.setText("\uD83D\uDD34 0");
        floatBall.setTextColor(Color.WHITE);
        floatBall.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        floatBall.setGravity(Gravity.CENTER);
        GradientDrawable ballBg = new GradientDrawable();
        ballBg.setShape(GradientDrawable.OVAL);
        ballBg.setColor(Color.parseColor("#A61C1C1E"));
        ballBg.setStroke(dp(activity, 1), Color.parseColor("#66FFFFFF"));
        floatBall.setBackground(ballBg);
        final int ballSize = dp(activity, 56);
        final FrameLayout.LayoutParams ballLp = new FrameLayout.LayoutParams(
                ballSize, ballSize);
        ballLp.gravity = Gravity.TOP | Gravity.END;
        ballLp.topMargin = dp(activity, 80);
        ballLp.rightMargin = dp(activity, 12);
        root.addView(floatBall, ballLp);

        // Tap ball -> show panel; the panel's ✕ hides it back to the ball.
        floatBall.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                topWrap.setVisibility(View.VISIBLE);
                floatBall.setVisibility(View.GONE);
            }
        });
        // v1.5.116: custom long-press (1.5s) to quit — the framework's
        // ~500ms long-press fired while the user was just trying to drag.
        // Cancelled as soon as a drag starts or the finger lifts.
        final android.os.Handler ballHandler = new android.os.Handler(
                android.os.Looper.getMainLooper());
        final Runnable ballLongPress = new Runnable() {
            @Override public void run() {
                Toast.makeText(activity, "Recorder ပိတ်လိုက်ပြီ",
                        Toast.LENGTH_SHORT).show();
                dialog.dismiss();
            }
        };
        // Draggable like AssistiveTouch (tap = open panel).
        // Only consumes the gesture while dragging.
        floatBall.setOnTouchListener(new View.OnTouchListener() {
            float startRawX, startRawY;
            int startTop, startRight;
            boolean dragging;
            @Override public boolean onTouch(View v, android.view.MotionEvent e) {
                switch (e.getAction()) {
                    case android.view.MotionEvent.ACTION_DOWN:
                        startRawX = e.getRawX();
                        startRawY = e.getRawY();
                        startTop = ballLp.topMargin;
                        startRight = ballLp.rightMargin;
                        dragging = false;
                        ballHandler.postDelayed(ballLongPress, 1500);
                        return false;
                    case android.view.MotionEvent.ACTION_MOVE:
                        float ddx = startRawX - e.getRawX();
                        float ddy = e.getRawY() - startRawY;
                        if (!dragging
                                && Math.abs(ddx) + Math.abs(ddy)
                                        > dp(activity, 8)) {
                            dragging = true;
                        }
                        if (dragging) {
                            ballHandler.removeCallbacks(ballLongPress);
                            ballLp.topMargin =
                                    Math.max(0, (int) (startTop + ddy));
                            ballLp.rightMargin =
                                    Math.max(0, (int) (startRight + ddx));
                            floatBall.setLayoutParams(ballLp);
                            return true;
                        }
                        return false;
                    case android.view.MotionEvent.ACTION_UP:
                    case android.view.MotionEvent.ACTION_CANCEL:
                        ballHandler.removeCallbacks(ballLongPress);
                        if (dragging) {
                            dragging = false;
                            return true;
                        }
                        return false;
                    default:
                        return false;
                }
            }
        });

        // Row 1: always visible — count, save, reload, close, collapse.
        final LinearLayout bar = new LinearLayout(activity);
        bar.setOrientation(LinearLayout.HORIZONTAL);
        bar.setGravity(Gravity.CENTER_VERTICAL);

        final TextView recLabel = new TextView(activity);
        recLabel.setText("\uD83D\uDD34 0");
        recLabel.setTextColor(Color.WHITE);
        recLabel.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        recLabel.setPadding(dp(activity, 4), 0, dp(activity, 4), 0);
        LinearLayout.LayoutParams lpLabel = new LinearLayout.LayoutParams(0,
                ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        bar.addView(recLabel, lpLabel);

        final Button stopBtn = glassIconBtn(activity, "\u23F9");
        stopBtn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                stopAndSave(activity, dialog, webView, cb);
            }
        });
        bar.addView(stopBtn);

        final Button reloadBtn = glassIconBtn(activity, "\u21BB");
        reloadBtn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) { webView.reload(); }
        });
        bar.addView(reloadBtn);

        final Button closeBtn = glassIconBtn(activity, "\u2715");
        closeBtn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                topWrap.setVisibility(View.GONE);
                floatBall.setVisibility(View.VISIBLE);
            }
        });
        bar.addView(closeBtn);

        topWrap.addView(bar);

        // Row 2: URL row — collapsible.
        final LinearLayout addrBar = new LinearLayout(activity);
        addrBar.setOrientation(LinearLayout.HORIZONTAL);
        addrBar.setGravity(Gravity.CENTER_VERTICAL);
        addrBar.setPadding(0, dp(activity, 4), 0, 0);

        final android.widget.EditText urlInput =
                new android.widget.EditText(activity);
        urlInput.setHint("URL or IP");
        urlInput.setTextColor(Color.WHITE);
        urlInput.setHintTextColor(Color.parseColor("#888888"));
        urlInput.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        urlInput.setSingleLine(true);
        // v1.5.118: iOS search-field — rounded 12dp translucent fill
        // (was a square #44FFFFFF box).
        GradientDrawable urlBg = new GradientDrawable();
        urlBg.setShape(GradientDrawable.RECTANGLE);
        urlBg.setCornerRadius(dpF(activity, 12f));
        urlBg.setColor(Color.parseColor("#2EFFFFFF"));
        urlInput.setBackground(urlBg);
        urlInput.setPadding(dp(activity, 8), dp(activity, 4),
                dp(activity, 8), dp(activity, 4));
        LinearLayout.LayoutParams urlInputLp = new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        addrBar.addView(urlInput, urlInputLp);

        final Button goBtn = glassPillBtn(activity, "Go");
        goBtn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                String u = urlInput.getText().toString().trim();
                if (u.isEmpty()) return;
                try {
                    android.view.inputmethod.InputMethodManager imm =
                            (android.view.inputmethod.InputMethodManager)
                            activity.getSystemService(
                                    android.content.Context.INPUT_METHOD_SERVICE);
                    imm.hideSoftInputFromWindow(urlInput.getWindowToken(), 0);
                } catch (Exception ignored) {}
                webView.loadUrl(normalizeUrl(u));
            }
        });
        addrBar.addView(goBtn);
        topWrap.addView(addrBar);

        // Collapse toggle: hide/show the URL row.
        final Button collapseBtn = glassIconBtn(activity, "\u2303");
        collapseBtn.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                boolean show = addrBar.getVisibility() != View.VISIBLE;
                addrBar.setVisibility(show ? View.VISIBLE : View.GONE);
                collapseBtn.setText(show ? "\u2303" : "\u2304");
            }
        });
        bar.addView(collapseBtn);

        FrameLayout.LayoutParams topLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        topLp.gravity = Gravity.TOP;
        // v1.5.118: float like an iOS sheet — 12dp margins on all sides.
        int sheetM = dp(activity, 12);
        topLp.leftMargin = sheetM;
        topLp.rightMargin = sheetM;
        topLp.topMargin = sheetM;
        // v1.5.115: panel starts hidden — the floating ball is the UI.
        topWrap.setVisibility(View.GONE);
        root.addView(topWrap, topLp);


        final ProgressBar progress = new ProgressBar(activity, null,
                android.R.attr.progressBarStyleHorizontal);
        FrameLayout.LayoutParams progLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(activity, 3));
        progLp.gravity = Gravity.TOP;
        progLp.topMargin = dp(activity, 0);
        root.addView(progress, progLp);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url,
                                     android.graphics.Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                // v1.5.112: keep the address bar in sync with navigation.
                if (url != null && !url.isEmpty()
                        && !url.equals(urlInput.getText().toString())) {
                    urlInput.setText(url);
                }
                injectInterceptor(view);
                updateCount(view, recLabel, floatBall);
            }
            @Override
            public void onReceivedError(WebView view,
                                        WebResourceRequest request,
                                        android.webkit.WebResourceError error) {
                String msg = "Load error: " +
                    (error != null ? error.getDescription() : "?");
                Toast.makeText(activity, msg, Toast.LENGTH_LONG).show();
            }
            @Override
            @SuppressWarnings("deprecation")
            public void onReceivedError(WebView view, int errorCode,
                                        String description, String failingUrl) {
                String msg = "Load error: " + description;
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
    private static void updateCount(WebView view, final TextView label,
                                    final TextView ball) {
        view.evaluateJavascript(
            "(function(){try{return JSON.parse(sessionStorage.getItem('__nrLogs')||'[]').length}catch(e){return 0}})()",
            value -> {
                try {
                    label.setText("\uD83D\uDD34 Recording… (" + value + ")");
                    if (ball != null) {
                        ball.setText("\uD83D\uDD34 " + value);
                    }
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
     * v1.5.114: save the .txt into the public Downloads folder and offer
     * share. Tries MediaStore (API 29+), then direct Download/ write
     * (older APIs). Reports exactly where the file landed — no more
     * hunting with ZArchiver.
     */
    private static void shareFile(Activity activity, File f) {
        String name = f.getName();
        Uri shareUri = null;
        String savedWhere = null;

        // Path 1: MediaStore Downloads (API 29+).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            try {
                ContentValues cv = new ContentValues();
                cv.put(MediaStore.Downloads.DISPLAY_NAME, name);
                cv.put(MediaStore.Downloads.MIME_TYPE, "text/plain");
                cv.put(MediaStore.Downloads.RELATIVE_PATH,
                        Environment.DIRECTORY_DOWNLOADS);
                ContentResolver cr = activity.getContentResolver();
                Uri uri = cr.insert(
                        MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                if (uri != null) {
                    try (java.io.OutputStream os = cr.openOutputStream(uri);
                         java.io.InputStream is =
                                 new java.io.FileInputStream(f)) {
                        byte[] buf = new byte[8192];
                        int n;
                        while ((n = is.read(buf)) > 0) os.write(buf, 0, n);
                    }
                    shareUri = uri;
                    savedWhere = "Downloads/" + name;
                }
            } catch (Exception e) {
                savedWhere = null; // try next path
            }
        }

        // Path 2: direct write to the public Download folder.
        if (shareUri == null) {
            try {
                File dl = Environment.getExternalStoragePublicDirectory(
                        Environment.DIRECTORY_DOWNLOADS);
                if (dl != null) {
                    dl.mkdirs();
                    File out = new File(dl, name);
                    try (java.io.InputStream is =
                                 new java.io.FileInputStream(f);
                         java.io.OutputStream os =
                                 new java.io.FileOutputStream(out)) {
                        byte[] buf = new byte[8192];
                        int n;
                        while ((n = is.read(buf)) > 0) os.write(buf, 0, n);
                    }
                    savedWhere = "Downloads/" + name;
                    // No FileProvider (no AndroidX): the file sits in the
                    // public Downloads folder; the toast names it.
                }
            } catch (Exception e) {
                savedWhere = null;
            }
        }

        if (savedWhere != null) {
            Toast.makeText(activity,
                    "Saved: " + savedWhere, Toast.LENGTH_LONG).show();
        } else {
            Toast.makeText(activity,
                    "Downloads save failed — file at: "
                            + f.getAbsolutePath(),
                    Toast.LENGTH_LONG).show();
        }

        // Share sheet (optional — the file is already saved).
        try {
            Intent share = new Intent(Intent.ACTION_SEND);
            share.setType("text/plain");
            if (shareUri != null) {
                share.putExtra(Intent.EXTRA_STREAM, shareUri);
                share.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            } else {
                share.putExtra(Intent.EXTRA_TEXT,
                        "Capture saved at: " + f.getAbsolutePath());
            }
            share.putExtra(Intent.EXTRA_SUBJECT, "Portal network capture");
            activity.startActivity(Intent.createChooser(share,
                    "Send capture file"));
        } catch (Exception ignored) {}
    }

    private static int dp(Activity a, int v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v,
                a.getResources().getDisplayMetrics());
    }

    /**
     * v1.5.118: iOS Control-Center-style circular icon button — 38dp
     * translucent-white circle, white glyph. Replaces smallBtn (which was
     * a borderless Android Button — square, wrong look).
     */
    static Button glassIconBtn(Activity a, String text) {
        Button b = new Button(a);
        b.setText(text);
        b.setTextColor(Color.WHITE);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 15);
        b.setGravity(Gravity.CENTER);
        b.setMinWidth(0);
        b.setMinimumWidth(0);
        b.setPadding(0, 0, 0, 0);
        // Strip the default Android button background completely.
        GradientDrawable d = new GradientDrawable();
        d.setShape(GradientDrawable.OVAL);
        d.setColor(Color.parseColor("#33FFFFFF"));
        b.setBackground(d);
        int s = dp(a, 38);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(s, s);
        int m = dp(a, 3);
        lp.setMargins(m, 0, m, 0);
        b.setLayoutParams(lp);
        return b;
    }

    /**
     * v1.5.118: iOS capsule button for short text labels ("Go").
     */
    static Button glassPillBtn(Activity a, String text) {
        Button b = new Button(a);
        b.setText(text);
        b.setTextColor(Color.WHITE);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 13);
        b.setGravity(Gravity.CENTER);
        b.setMinWidth(0);
        b.setMinimumWidth(0);
        b.setPadding(dp(a, 14), dp(a, 6), dp(a, 14), dp(a, 6));
        GradientDrawable d = new GradientDrawable();
        d.setShape(GradientDrawable.RECTANGLE);
        d.setCornerRadius(dpF(a, 100f)); // fully rounded capsule
        d.setColor(Color.parseColor("#33FFFFFF"));
        b.setBackground(d);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT);
        int m = dp(a, 3);
        lp.setMargins(m, 0, m, 0);
        b.setLayoutParams(lp);
        return b;
    }

    private static float dpF(Activity a, float v) {
        return TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v,
                a.getResources().getDisplayMetrics());
    }

    /**
     * v1.5.112: normalize user-typed addresses. Bare IPs/hostnames get
     * http:// (gateway eWeb is plain HTTP); anything with :// passes
     * through untouched.
     */
    static String normalizeUrl(String u) {
        String t = u.trim();
        if (t.contains("://")) return t;
        return "http://" + t;
    }
}
