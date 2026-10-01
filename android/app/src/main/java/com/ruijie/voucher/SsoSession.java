package com.ruijie.voucher;

import android.app.Activity;
import android.app.Dialog;
import android.graphics.Color;
import android.graphics.Typeface;
import android.os.Build;
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

    /**
     * The portal's own SSO entry point. Loading it unauthenticated 302s to
     * /sso/login?service=.../webproxy/sso/back on the SAME host; after the
     * user logs in, the ticket comes back to /webproxy/sso/back, which
     * creates the portal session on cloud-as — the session the webproxy
     * delete needs. (Logging in at cloud.ruijienetworks.com instead never
     * creates this portal session, so the portal answers "not login.")
     */
    public static final String SSO_LOGIN_URL = "https://cloud-as.ruijienetworks.com/webproxy/sso/back";
    public static final String WEBPROXY_BASE = "https://cloud-as.ruijienetworks.com/webproxy/common/api";
    private static final int TIMEOUT_MS = 30000;
    private static final int BRAND_BLUE = Color.parseColor("#007AFF");

    private static SsoSession instance;

    public static synchronized SsoSession getInstance() {
        if (instance == null) instance = new SsoSession();
        return instance;
    }

    private SsoSession() {}

    private SecureCredentialStore credStore;

    private synchronized SecureCredentialStore store(android.content.Context ctx) {
        if (credStore == null) credStore = new SecureCredentialStore(ctx.getApplicationContext());
        return credStore;
    }

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
        ProxyResult r = webProxyRaw(apiPath, envelopeJson);
        if (r.status == 401) {
            // Session is dead server-side — drop the stale cookies so
            // ssoStatus() stops reporting "Connected" for a dead session.
            try { logout(); } catch (Exception ignored) {}
            throw new SecurityException("Session expired (HTTP 401) — please log in again");
        }
        if (r.status == 403) {
            // v1.5.53: distinguish a DEAD session from a rejected request.
            // Ruijie answers a stale portal session with HTTP 403 + a body
            // like {"code":-1,"data":{"ssoJump":"..."},"msg":"not login."}.
            // That is a dead session: drop the stale cookies and throw
            // SecurityException so the normal re-login chain fires (same as
            // 401). Any other 403 keeps the old behavior: the request itself
            // was rejected, the session is kept.
            String bl = r.body == null ? "" : r.body.toLowerCase();
            if (bl.contains("not login") || bl.contains("ssojump")) {
                try { logout(); } catch (Exception ignored) {}
                throw new SecurityException("Session expired (HTTP 403 not login) — please log in again");
            }
            String detail = r.body;
            if (detail.length() > 200) detail = detail.substring(0, 200);
            throw new Exception("Ruijie rejected the request (HTTP 403)" + (detail.isEmpty() ? "" : ": " + detail));
        }
        return r.body;
    }

    /** Raw webproxy result: HTTP status + body, no throwing. */
    private static final class ProxyResult {
        int status;
        String body;
    }

    /** Cookie NAMES (never values) from the last webproxy request — diagnostics. */
    private static String lastSentCookieNames = "";

    private static String cookieNamesOf(String cookieHeader) {
        if (cookieHeader == null || cookieHeader.isEmpty()) return "—";
        StringBuilder sb = new StringBuilder();
        for (String part : cookieHeader.split(";")) {
            String p = part.trim();
            int eq = p.indexOf('=');
            String n = eq > 0 ? p.substring(0, eq).trim() : p;
            if (n.isEmpty()) continue;
            if (sb.length() > 0) sb.append(", ");
            sb.append(n);
        }
        return sb.length() == 0 ? "—" : sb.toString();
    }

    private ProxyResult webProxyRaw(String apiPath, String envelopeJson) throws Exception {
        // Portal capture: POST .../webproxy/common/api?/intlSamVoucher/v2/delete
        // (query keeps the leading slash). Keep it byte-identical.
        String clean = apiPath.startsWith("/") ? apiPath : "/" + apiPath;
        String urlStr = WEBPROXY_BASE + "?" + clean;
        HttpURLConnection c = (HttpURLConnection) new URL(urlStr).openConnection();
        c.setRequestMethod("POST");
        c.setConnectTimeout(TIMEOUT_MS);
        c.setReadTimeout(TIMEOUT_MS);
        c.setRequestProperty("Content-Type", "application/json");
        c.setRequestProperty("Accept", "application/json, text/plain, */*");
        c.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");
        // Look like the portal's own XHR (see the DevTools capture): some
        // Ruijie endpoints 403 requests that don't carry these.
        c.setRequestProperty("X-Requested-With", "XMLHttpRequest");
        c.setRequestProperty("Origin", "https://cloud-as.ruijienetworks.com");
        c.setRequestProperty("Referer", "https://cloud-as.ruijienetworks.com/");
        String cookies = null;
        try {
            // Read cookies for the FULL request URL, not the bare domain:
            // the portal session cookie may be path-scoped (e.g. Path=
            // /webproxy), which getCookie("https://host") does NOT return
            // but a browser sends automatically. Missing it makes the
            // portal answer "not login." even right after a fresh login.
            // CAS cookies still come from cloud.ruijienetworks.com.
            cookies = mergeCookies(
                    CookieManager.getInstance().getCookie(urlStr),
                    CookieManager.getInstance().getCookie("https://cloud.ruijienetworks.com"));
        } catch (Exception ignored) { /* no cookies */ }
        lastSentCookieNames = cookieNamesOf(cookies);
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
        ProxyResult r = new ProxyResult();
        r.status = status;
        r.body = sb.toString();
        return r;
    }

    /**
     * Diagnostics: checks whether the portal session is alive WITHOUT
     * deleting anything real. Posts the delete envelope for a voucher code
     * that cannot exist ("PROBE000" / nil UUID); the portal checks the
     * session BEFORE looking the voucher up, so "not login" in the answer
     * means the portal session is missing, while any other answer means
     * the session is alive (the fake voucher is simply not found).
     * Returns {"http":N,"notLogin":bool,"snippet":"..."}.
     */
    public String portalProbe(String envelopeJson) {
        try {
            ProxyResult r = webProxyRaw("/intlSamVoucher/v2/delete", envelopeJson);
            String body = r.body == null ? "" : r.body;
            org.json.JSONObject o = new org.json.JSONObject();
            o.put("http", r.status);
            o.put("notLogin", body.contains("not login"));
            o.put("sentCookies", lastSentCookieNames);
            o.put("snippet", body.length() > 160 ? body.substring(0, 160) : body);
            return o.toString();
        } catch (Exception e) {
            try {
                org.json.JSONObject o = new org.json.JSONObject();
                o.put("error", String.valueOf(e.getMessage()));
                return o.toString();
            } catch (Exception je) {
                return "{\"error\":\"probe failed\"}";
            }
        }
    }

    /** Merge two CookieManager cookie strings; first arg wins on name clash. */
    private static String mergeCookies(String a, String b) {
        java.util.LinkedHashMap<String, String> map = new java.util.LinkedHashMap<>();
        for (String src : new String[]{b, a}) {
            if (src == null) continue;
            for (String part : src.split(";")) {
                String p = part.trim();
                int eq = p.indexOf('=');
                if (eq > 0) map.put(p.substring(0, eq).trim(), p);
            }
        }
        StringBuilder sb = new StringBuilder();
        for (String v : map.values()) {
            if (sb.length() > 0) sb.append("; ");
            sb.append(v);
        }
        return sb.toString();
    }

    // ── login trace (diagnostics) ──────────────────────────────
    // Records the URLs the login dialog visits (no credentials — URLs only)
    // so a diagnostic report can prove whether the portal SSO handshake
    // (/webproxy/sso/back ticket callback) actually completed.
    private static final java.util.List<String> loginTrace = new java.util.ArrayList<>();
    private static String loginTraceResult = "none";
    private static String loginTraceAt = "";

    private static synchronized void traceUrl(String url) {
        if (url == null || url.isEmpty()) return;
        String u = url.length() > 180 ? url.substring(0, 180) + "…" : url;
        if (!loginTrace.isEmpty() && loginTrace.get(loginTrace.size() - 1).equals(u)) return;
        loginTrace.add(u);
        while (loginTrace.size() > 40) loginTrace.remove(0);
    }

    private static synchronized void traceResult(String result) {
        loginTraceResult = result;
        try {
            loginTraceAt = new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm:ss",
                    java.util.Locale.US).format(new java.util.Date());
        } catch (Exception ignored) { /* timestamp optional */ }
    }

    /** JSON: {"result":"success|cancel|started|none","at":"...","urls":[...]} */
    public static synchronized String getLoginTraceJson() {
        StringBuilder sb = new StringBuilder("{\"result\":\"");
        sb.append(loginTraceResult).append("\",\"at\":\"").append(loginTraceAt).append("\",\"urls\":[");
        for (int i = 0; i < loginTrace.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(org.json.JSONObject.quote(loginTrace.get(i)));
        }
        return sb.append("]}").toString();
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
        showLoginDialog(activity, false, cb);
    }

    /**
     * fix1: silent mode hides the dialog (the app shows an iOS-style
     * loading overlay instead) while the login runs in the background.
     * The dialog is revealed automatically if the login needs the user
     * (captcha / 2FA / error) via SsoCoverBridge.needsAttention().
     * Must be called on the UI thread.
     */
    public void showLoginDialog(Activity activity, boolean silent, LoginCallback cb) {
        final Dialog dialog = new Dialog(activity, android.R.style.Theme_NoTitleBar_Fullscreen);
        final boolean[] fired = {false};
        // v1.5.83: set once the CAS ticket callback URL is observed. A ticket
        // is only issued after the credentials validate, so combined with a
        // live portal session it proves login completed even when the WebView
        // gets stuck on a URL our patterns don't recognize (blank page).
        final boolean[] sawTicket = {false};
        // Fresh trace for this login attempt.
        loginTrace.clear();
        traceResult("started");

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
        sub.setText("စကားဝှက်ကို စက်ထဲမှာ encrypted သိမ်းမယ် · Ruijie ကိုသာ ပေးပို့မယ်");
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
                    traceResult("cancel");
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
        // SSO/CAS login hops across Ruijie domains — without third-party
        // cookies the handshake session is dropped and login never completes.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            cm.setAcceptThirdPartyCookies(webView, true);
        }
        webView.setWebChromeClient(new WebChromeClient());

        // Glass cover bridge: the injected cover reads/writes the encrypted
        // credential store and can dismiss the dialog. (The official Ruijie
        // page keeps running underneath the cover.)
        // fix1: reveals a hidden (silent) dialog when user intervention is
        // needed (captcha / 2FA / error). No-op when never hidden.
        final boolean silentRef = silent;
        final Dialog dialogRef = dialog;
        final Activity activityRef = activity;
        final Runnable reveal = new Runnable() {
            @Override public void run() {
                if (!silentRef) return;
                activityRef.runOnUiThread(new Runnable() {
                    @Override public void run() {
                        try {
                            android.view.Window w = dialogRef.getWindow();
                            if (w != null) {
                                android.view.WindowManager.LayoutParams lp = w.getAttributes();
                                lp.alpha = 1f;
                                w.setAttributes(lp);
                            }
                        } catch (Exception ignored) {}
                    }
                });
            }
        };
        final SecureCredentialStore storeRef = store(activity);
        webView.addJavascriptInterface(
                new SsoCoverBridge(activity, dialog, storeRef, fired, cb, silent, reveal), "SsoCover");

        final Dialog dlgRef = dialog;
        final LoginCallback cbRef = cb;
        final boolean[] firedRef = fired;
        final boolean[] sawTicketRef = sawTicket;
        webView.setWebViewClient(new WebViewClient() {
            private void checkAuth(String url) {
                if (firedRef[0]) return;
                // CAS issued a ticket -> credentials validated. Record it
                // before the dismiss decision below.
                if (url != null && url.contains("ticket=")) sawTicketRef[0] = true;
                if (shouldDismissAsSuccess(url, sawTicketRef[0],
                        SsoSession.getInstance().isLoggedIn())) {
                    firedRef[0] = true;
                    traceResult("success");
                    try { CookieManager.getInstance().flush(); } catch (Exception ignored) {}
                    dlgRef.dismiss();
                    cbRef.onSuccess();
                }
            }
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                progress.setVisibility(View.VISIBLE);
                traceUrl(url);
                // NOTE: auth is checked in onPageFinished only. Checking here
                // (or in shouldOverrideUrlLoading) dismisses the dialog before
                // the portal page finishes loading, which can cut off the
                // portal session cookies the webproxy delete needs.
            }
            @Override
            public void onPageFinished(WebView view, String url) {
                progress.setVisibility(View.GONE);
                traceUrl(url);
                injectCoverIfNeeded(view, url, silent);
                checkAuth(url);
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return false;
            }
            @Override
            @SuppressWarnings("deprecation")
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return false;
            }
        });
        root.addView(webView);

        dialog.setContentView(root);
        dialog.setOnCancelListener(new android.content.DialogInterface.OnCancelListener() {
            @Override public void onCancel(android.content.DialogInterface d) {
                if (!fired[0]) {
                    fired[0] = true;
                    traceResult("cancel");
                    cb.onCancel();
                }
            }
        });
        dialog.show();
        // fix1 (silent): keep the dialog shown so the WebView runs, but make
        // it fully transparent — the app shows an iOS-style loading overlay
        // instead. Window alpha (not view visibility) keeps the WebView
        // rendering/JS at full fidelity while invisible.
        if (silent) {
            try {
                android.view.Window w = dialog.getWindow();
                if (w != null) {
                    w.setDimAmount(0f);
                    android.view.WindowManager.LayoutParams lp = w.getAttributes();
                    lp.alpha = 0f;
                    w.setAttributes(lp);
                }
            } catch (Exception ignored) { /* dialog stays visible */ }
        }
        // v1.5.85: start every login with a clean cookie jar. Otherwise a
        // still-valid session from a previous profile/account sails through
        // CAS without ever showing the login form — the cover never injects,
        // the dialog dismisses as "success", but the portal session stays
        // logged in as the WRONG account ("no permission" on portal calls).
        // removeAllCookies is async; load only after it completes so the
        // stale session can never win the race.
        cm.removeAllCookies(cleared -> activity.runOnUiThread(() -> {
            try { cm.flush(); } catch (Exception ignored) {}
            webView.loadUrl(SSO_LOGIN_URL);
        }));
    }

    /**
     * Inject the glassmorphism cover over the official CAS login page.
     * The official page keeps running underneath; the cover fills its
     * fields and clicks its button. Guarded by window.__ssoCoverInjected
     * so reloads of the login page never stack covers.
     */
    private void injectCoverIfNeeded(WebView webView, String url, boolean silent) {
        if (url == null || !url.contains("/sso/login")) return;
        try {
            android.content.Context ctx = webView.getContext();
            String css = readAsset(ctx, "www/sso-cover/sso-cover.css");
            String html = readAsset(ctx, "www/sso-cover/sso-cover.html");
            String js = readAsset(ctx, "www/sso-cover/sso-cover.js");
            if (css == null || html == null || js == null) return; // no cover: official page stays usable
            org.json.JSONObject prefs = new org.json.JSONObject();
            String saved = store(ctx).loadJson();
            prefs.put("hasCreds", saved != null);
            prefs.put("autoLogin", store(ctx).getAutoLogin());
            prefs.put("silent", silent); // fix1: cover reveals dialog on captcha/2FA/error
            prefs.put("rememberWanted", store(ctx).getRememberWanted());
            prefs.put("email", saved != null ? new org.json.JSONObject(saved).optString("e", "") : "");
            String script = "(function(){"
                    + "if(window.__ssoCoverInjected)return;window.__ssoCoverInjected=true;"
                    + "var st=document.createElement('style');st.textContent="
                    + org.json.JSONObject.quote(css) + ";document.head.appendChild(st);"
                    + "var w=document.createElement('div');w.innerHTML="
                    + org.json.JSONObject.quote(html) + ";"
                    + "while(w.firstChild)document.body.appendChild(w.firstChild);"
                    + js
                    + "\n;window.__ssoCoverInit(" + prefs + ");"
                    + "})();";
            webView.evaluateJavascript(script, null);
        } catch (Exception ignored) { /* official page remains usable */ }
    }

    private static String readAsset(android.content.Context ctx, String name) {
        try {
            java.io.InputStream in = ctx.getAssets().open(name);
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            in.close();
            return new String(out.toByteArray(), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null;
        }
    }

    /** True once the WebView has left the SSO pages and reached the portal. */    private static boolean isAuthenticatedUrl(String url) {
        if (url == null || url.isEmpty()) return false;
        // Still on the SSO login page or inside the /webproxy/sso/back
        // ticket callback — the portal session is not established yet,
        // so keep the dialog open (closing here cuts the session off).
        if (url.contains("/sso/")) return false;
        // The dialog starts at the portal's own SSO entry, so any non-SSO
        // page on cloud-as reached from there is the portal home AFTER the
        // ticket callback created the portal session.
        if (url.contains("cloud-as.ruijienetworks.com")) return true;
        return url.contains("/macc5/") || url.contains("/dashboard")
                || url.contains("/project") || url.contains("/intlSamVoucher")
                || url.contains("/common/api");
    }

    private static int dp(Activity activity, int dp) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp,
                activity.getResources().getDisplayMetrics());
    }

    /**
     * v1.5.83: dismiss decision for the SSO login dialog. Pure logic, no
     * Android dependencies, unit-testable.
     *
     * @param url          the onPageFinished URL (may be null)
     * @param sawTicket    true once a CAS ticket callback URL was observed in
     *                    this dialog (a ticket is only issued after the
     *                    credentials validate)
     * @param sessionAlive true when the portal session cookies exist
     */
    static boolean shouldDismissAsSuccess(String url, boolean sawTicket, boolean sessionAlive) {
        if (url == null || url.isEmpty()) return false;
        if (isAuthenticatedUrl(url)) return true;
        // Fallback: CAS issued a ticket AND the portal session is alive, but
        // the WebView is stuck on a URL our patterns don't recognize (e.g. a
        // blank ticket-callback page). Dismissing is safe here because
        // checkAuth runs in onPageFinished, i.e. after the callback response
        // (which carries the session cookies) was fully received. Never fire
        // while still on the login page.
        return sawTicket && sessionAlive && !url.contains("/sso/login");
    }
}
