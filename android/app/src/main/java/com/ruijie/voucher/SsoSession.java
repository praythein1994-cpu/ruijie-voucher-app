package com.ruijie.voucher;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

/**
 * Ruijie Cloud account (SSO) session.
 *
 * The user signs in with their Ruijie Cloud account inside an in-app dialog.
 * Our own branded header "covers" the official CAS login page — the dialog
 * keeps the whole flow inside the app's look and feel. The credential form
 * itself stays Ruijie's official page, so the password only ever goes to
 * Ruijie and never touches our code.
 *
 * After login, SSO cookies held by CookieManager authenticate session
 * requests, which use the portal's internal webproxy API. This is the only
 * path that supports voucher delete — the public Open API has no delete
 * endpoint.
 */
public class SsoSession {

    public static final String SSO_LOGIN_URL = "https://cloud.ruijienetworks.com/sso/";
    public static final String WEBPROXY_BASE = "https://cloud-as.ruijienetworks.com/webproxy/common/api";
    private static final int TIMEOUT_MS = 30000;
    private static final int BRAND_BLUE = Color.parseColor("#007AFF");

    private static SsoSession instance;

    public static synchronized SsoSession getInstance() {
        if (instance == null) instance = new SsoSession();
        return instance;
    }

    private SsoSession() {}

    /** Cheap check: SSO cookies present? (True validity is proven by API response codes.) */
    public boolean isLoggedIn() {
        try {
            CookieManager cm = CookieManager.getInstance();
            String c1 = cm.getCookie("https://cloud.ruijienetworks.com");
            String c2 = cm.getCookie("https://cloud-as.ruijienetworks.com");
            return (c1 != null && !c1.isEmpty()) || (c2 != null && !c2.isEmpty());
        } catch (Exception e) {
            return false;
        }
    }

    public void logout() {
        try {
            CookieManager cm = CookieManager.getInstance();
            cm.removeAllCookies(null);
            cm.flush();
        } catch (Exception ignored) { /* best effort */ }
    }

    /**
     * POST a webproxy envelope with the SSO cookies.
     * Returns the raw response body. Throws SecurityException when the
     * session is rejected (401/403) so callers can prompt re-login.
     */
    public String webProxy(String apiPath, String envelopeJson) throws Exception {
        String clean = apiPath.startsWith("/") ? apiPath.substring(1) : apiPath;
        String urlStr = WEBPROXY_BASE + "?" + clean;
        HttpURLConnection c = (HttpURLConnection) new URL(urlStr).openConnection();
        c.setRequestMethod("POST");
        c.setConnectTimeout(TIMEOUT_MS);
        c.setReadTimeout(TIMEOUT_MS);
        c.setRequestProperty("Content-Type", "application/json");
        c.setRequestProperty("Accept", "application/json, text/plain, */*");
        c.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");
        String cookies = null;
        try {
            cookies = CookieManager.getInstance().getCookie("https://cloud-as.ruijienetworks.com");
            if (cookies == null || cookies.isEmpty()) {
                cookies = CookieManager.getInstance().getCookie("https://cloud.ruijienetworks.com");
            }
        } catch (Exception ignored) { /* no cookies */ }
        if (cookies != null && !cookies.isEmpty()) c.setRequestProperty("Cookie", cookies);
        byte[] bytes = envelopeJson.getBytes(StandardCharsets.UTF_8);
        c.setDoOutput(true);
        c.setRequestProperty("Content-Length", String.valueOf(bytes.length));
        try (OutputStream os = c.getOutputStream()) {
            os.write(bytes);
        }
        int status = c.getResponseCode();
        InputStream in = (status >= 200 && status < 300) ? c.getInputStream() : c.getErrorStream();
        StringBuilder sb = new StringBuilder();
        if (in != null) {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) sb.append(line);
            }
        }
        if (status == 401 || status == 403) {
            throw new SecurityException("Session expired (HTTP " + status + ") — please log in again");
        }
        return sb.toString();
    }

    // ── login dialog ─────────────────────────────────────────────

    public interface LoginCallback {
        void onSuccess();
        void onCancel();
    }

    /**
     * Shows the Ruijie account login inside our branded dialog.
     * Must be called on the UI thread.
     */
    public void showLoginDialog(Activity activity, LoginCallback cb) {
        final Dialog dialog = new Dialog(activity, android.R.style.Theme_NoTitleBar_Fullscreen);
        final boolean[] fired = {false};

        LinearLayout root = new LinearLayout(activity);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.WHITE);

        // Branded header — this is what "covers" the official login page.
        LinearLayout header = new LinearLayout(activity);
        header.setOrientation(LinearLayout.HORIZONTAL);
        header.setGravity(Gravity.CENTER_VERTICAL);
        header.setBackgroundColor(BRAND_BLUE);
        int pad = dp(activity, 16);
        header.setPadding(pad, dp(activity, 14), pad, dp(activity, 14));

        LinearLayout titles = new LinearLayout(activity);
        titles.setOrientation(LinearLayout.VERTICAL);
        LinearLayout.LayoutParams titlesLp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        titles.setLayoutParams(titlesLp);

        TextView title = new TextView(activity);
        title.setText("Ruijie အကောင့်ဖြင့် ဝင်ရောက်မည်");
        title.setTextColor(Color.WHITE);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setTextSize(TypedValue.COMPLEX_UNIT_SP, 17);
        titles.addView(title);

        TextView sub = new TextView(activity);
        sub.setText("အကောင့်အချက်အလက်များသည် Ruijie သို့သာ တိုက်ရိုက်ပေးပို့ပါသည်");
        sub.setTextColor(Color.parseColor("#D6E8FF"));
        sub.setTextSize(TypedValue.COMPLEX_UNIT_SP, 12);
        titles.addView(sub);
        header.addView(titles);

        TextView close = new TextView(activity);
        close.setText("✕");
        close.setTextColor(Color.WHITE);
        close.setTextSize(TypedValue.COMPLEX_UNIT_SP, 22);
        close.setPadding(dp(activity, 8), dp(activity, 4), dp(activity, 8), dp(activity, 4));
        close.setOnClickListener(new View.OnClickListener() {
            @Override public void onClick(View v) {
                if (!fired[0]) {
                    fired[0] = true;
                    dialog.dismiss();
                    cb.onCancel();
                }
            }
        });
        header.addView(close);
        root.addView(header);

        final ProgressBar progress = new ProgressBar(activity, null, android.R.attr.progressBarStyleHorizontal);
        progress.setLayoutParams(new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(activity, 4)));
        root.addView(progress);

        WebView webView = new WebView(activity);
        LinearLayout.LayoutParams wvLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f);
        webView.setLayoutParams(wvLp);
        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);

        CookieManager cm = CookieManager.getInstance();
        cm.setAcceptCookie(true);

        final Dialog dlgRef = dialog;
        final LoginCallback cbRef = cb;
        final boolean[] firedRef = fired;
        webView.setWebViewClient(new WebViewClient() {
            private void checkAuth(String url) {
                if (firedRef[0]) return;
                if (isAuthenticatedUrl(url)) {
                    firedRef[0] = true;
                    try { CookieManager.getInstance().flush(); } catch (Exception ignored) {}
                    dlgRef.dismiss();
                    cbRef.onSuccess();
                }
            }
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
                checkAuth(url);
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                checkAuth(url);
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                checkAuth(request.getUrl().toString());
                return false;
            }
            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                checkAuth(url);
                return false;
            }
        });
        root.addView(webView);

        dialog.setContentView(root);
        dialog.setOnCancelListener(new android.content.DialogInterface.OnCancelListener() {
            @Override public void onCancel(android.content.DialogInterface d) {
                if (!fired[0]) {
                    fired[0] = true;
                    cb.onCancel();
                }
            }
        });
        dialog.show();
        webView.loadUrl(SSO_LOGIN_URL);
    }

    /** True once the WebView has left the SSO pages and reached the portal. */
    private static boolean isAuthenticatedUrl(String url) {
        if (url == null || url.isEmpty()) return false;
        if (url.contains("/sso/")) return false;
        return url.contains("/macc5/") || url.contains("/dashboard")
                || url.contains("/project") || url.contains("/intlSamVoucher")
                || url.contains("/common/api");
    }

    private static int dp(Activity activity, int dp) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp,
                activity.getResources().getDisplayMetrics());
    }
}
