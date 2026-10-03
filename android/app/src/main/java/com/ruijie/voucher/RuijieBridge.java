package com.ruijie.voucher;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.ruijie.voucher.printer.BluetoothPrinterManager;
import com.ruijie.voucher.printer.PaperConfiguration;
import com.ruijie.voucher.printer.PrintDesignSettings;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * JS bridge injected as window.RuijieBridge.
 *
 * apiCall(id, payloadJson): performs a Ruijie Cloud API call with native
 * HTTPS (WebView/CORS restrictions do not apply to native code), handling
 * access-token fetch/cache/refresh exactly like the Node proxy.
 * The Ruijie JSON response is base64-encoded and delivered back to JS via
 * window._bridgeResolve(id, b64).
 *
 * printHtml(b64Html, paperMm): prints ticket HTML through Android's
 * PrintManager (window.print() is a no-op inside a WebView).
 */
public class RuijieBridge {

    private static final String FIXED_TOKEN_PARAM = "d63dss0a81e4415a889ac5b78fsc904a"; // per Ruijie doc: fixed
    private static final long TOKEN_TTL_MS = 25L * 24 * 3600 * 1000; // doc says 30 days; refresh early
    private static final int TIMEOUT_MS = 30000;

    private final Activity activity;
    private final WebView webView;
    private final ExecutorService pool = Executors.newCachedThreadPool();
    private final Map<String, TokenEntry> tokenCache = new ConcurrentHashMap<>();
    private WebView printWebView; // kept referenced while a print job is prepared
    private BluetoothPrinterManager btPrinter; // lazy: Bluetooth thermal printer (ESC/POS)

    private static class TokenEntry {
        String token;
        long fetchedAt;
    }

    RuijieBridge(Activity activity, WebView webView) {
        this.activity = activity;
        this.webView = webView;
    }

    // ── API ──────────────────────────────────────────────────────────

    @JavascriptInterface
    public void apiCall(final String callId, final String payloadJson) {
        pool.execute(() -> {
            String b64;
            try {
                JSONObject p = new JSONObject(payloadJson);
                String cloud = p.optString("cloud", "https://cloud-as.ruijienetworks.com").replaceAll("/+$", "");
                String appid = p.getString("appid");
                String secret = p.getString("secret");
                String method = p.optString("method", "GET").toUpperCase();
                String path = p.getString("path");
                JSONObject query = p.optJSONObject("query");
                JSONObject body = p.optJSONObject("body");

                String result = doApiCall(cloud, appid, secret, method, path, query, body, false);
                b64 = Base64.encodeToString(result.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
            } catch (Exception e) {
                String b64err;
                try {
                    String err = new JSONObject().put("code", -97).put("msg", "Bridge error: " + e.getMessage()).toString();
                    b64err = Base64.encodeToString(err.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
                } catch (Exception ex) {
                    b64err = "";
                }
                b64 = b64err;
            }
            final String out = b64;
            final String safeId = callId.replaceAll("[^A-Za-z0-9_]", "");
            webView.post(() -> webView.evaluateJavascript(
                    "window._bridgeResolve('" + safeId + "','" + out + "')", null));
        });
    }

    private String doApiCall(String cloud, String appid, String secret,
                             String method, String path, JSONObject query, JSONObject body,
                             boolean retried) throws Exception {
        String token = getToken(cloud, appid, secret, false);
        String qs = buildQuery(query) + "&access_token=" + URLEncoder.encode(token, "UTF-8");
        // v1.5.23: a leading "/" means absolute path on the cloud host (e.g. logbiz
        // APIs live at /logbizagent/..., NOT under /service/api/).
        String apiPath = path.startsWith("/") ? path.substring(1) : "service/api/" + path;
        String url = cloud + "/" + apiPath + "?" + qs;
        String resp = httpsJson(url, method, "POST".equals(method) ? (body != null ? body.toString() : "{}") : null);
        JSONObject rj = new JSONObject(resp);
        int code = rj.optInt("code", -1);
        // code 4 = token invalid per Ruijie docs. "Login timeout" is Ruijie's
        // answer when a cached token died server-side (e.g. secret rotated or
        // token expired before our 25-day TTL) — refresh and retry once
        // instead of failing forever.
        boolean tokenBad = code == 4 || "Login timeout".equalsIgnoreCase(rj.optString("msg", ""));
        if (tokenBad && !retried) { // token invalid -> refresh once and retry
            token = getToken(cloud, appid, secret, true);
            String qs2 = buildQuery(query) + "&access_token=" + URLEncoder.encode(token, "UTF-8");
            resp = httpsJson(cloud + "/" + apiPath + "?" + qs2, method,
                    "POST".equals(method) ? (body != null ? body.toString() : "{}") : null);
        }
        return resp;
    }

    private String getToken(String cloud, String appid, String secret, boolean force) throws Exception {
        String key = cloud + "|" + appid;
        TokenEntry cached = tokenCache.get(key);
        if (!force && cached != null && (System.currentTimeMillis() - cached.fetchedAt) < TOKEN_TTL_MS) {
            return cached.token;
        }
        // try the refresh endpoint first when we hold an old token
        if (cached != null && cached.token != null) {
            try {
                String rurl = cloud + "/service/api/token/refresh?appid=" + URLEncoder.encode(appid, "UTF-8")
                        + "&secret=" + URLEncoder.encode(secret, "UTF-8")
                        + "&access_token=" + URLEncoder.encode(cached.token, "UTF-8");
                JSONObject rj = new JSONObject(httpsJson(rurl, "GET", null));
                String nt = rj.optString("accessToken", rj.optString("access_token", ""));
                if (rj.optInt("code", -1) == 0 && !nt.isEmpty()) {
                    cacheToken(key, nt);
                    return nt;
                }
            } catch (Exception ignored) { /* fall through to full login */ }
        }
        String turl = cloud + "/service/api/oauth20/client/access_token?token=" + FIXED_TOKEN_PARAM;
        JSONObject tj = new JSONObject(httpsJson(turl, "POST",
                new JSONObject().put("appid", appid).put("secret", secret).toString()));
        if (tj.optInt("code", -1) != 0 || tj.optString("accessToken", "").isEmpty()) {
            throw new Exception("Ruijie token request failed: " + tj.toString().substring(0, Math.min(300, tj.toString().length())));
        }
        cacheToken(key, tj.getString("accessToken"));
        return tj.getString("accessToken");
    }

    private void cacheToken(String key, String token) {
        TokenEntry e = new TokenEntry();
        e.token = token;
        e.fetchedAt = System.currentTimeMillis();
        tokenCache.put(key, e);
    }

    private String buildQuery(JSONObject query) throws Exception {
        if (query == null) return "";
        StringBuilder sb = new StringBuilder();
        Iterator<String> it = query.keys();
        while (it.hasNext()) {
            String k = it.next();
            if (sb.length() > 0) sb.append('&');
            sb.append(URLEncoder.encode(k, "UTF-8"))
              .append('=')
              .append(URLEncoder.encode(query.optString(k, ""), "UTF-8"));
        }
        return sb.toString();
    }

    private String httpsJson(String urlStr, String method, String payload) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(urlStr).openConnection();
        c.setRequestMethod(method);
        c.setConnectTimeout(TIMEOUT_MS);
        c.setReadTimeout(TIMEOUT_MS);
        c.setRequestProperty("Content-Type", "application/json");
        c.setRequestProperty("Accept", "application/json");
        if (payload != null) {
            c.setDoOutput(true);
            byte[] bytes = payload.getBytes(StandardCharsets.UTF_8);
            c.setRequestProperty("Content-Length", String.valueOf(bytes.length));
            try (OutputStream os = c.getOutputStream()) {
                os.write(bytes);
            }
        }
        int status = c.getResponseCode();
        InputStream in = (status >= 200 && status < 300) ? c.getInputStream() : c.getErrorStream();
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line);
        }
        return sb.toString();
    }

    // ── PRINT ────────────────────────────────────────────────────────

    @JavascriptInterface
    public void printHtml(final String b64Html, final String paperMm) {
        activity.runOnUiThread(() -> {
            try {
                String html = new String(Base64.decode(b64Html, Base64.DEFAULT), StandardCharsets.UTF_8);
                printWebView = new WebView(activity);
                printWebView.getSettings().setJavaScriptEnabled(false);
                int widthMils = "58".equals(paperMm) ? 2283 : 3150; // 58/80mm in mils
                PrintAttributes attrs = new PrintAttributes.Builder()
                        .setMediaSize(new PrintAttributes.MediaSize("receipt", "Receipt", widthMils, 7874))
                        .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                        .build();
                PrintManager pm = (PrintManager) activity.getSystemService(Context.PRINT_SERVICE);
                printWebView.setWebViewClient(new WebViewClient() {
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        PrintDocumentAdapter adapter;
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                            adapter = view.createPrintDocumentAdapter("voucher");
                        } else {
                            adapter = view.createPrintDocumentAdapter();
                        }
                        if (pm != null) pm.print("Ruijie Voucher", adapter, attrs);
                    }
                });
                printWebView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
            } catch (Exception ignored) { /* nothing to report back */ }
        });
    }

    // ── BLUETOOTH THERMAL PRINTER (ESC/POS, printer-v1 engine) ──
    // Direct Bluetooth thermal printing, ported from printer-v1-fix1.2-p1994.
    // Scan/connect/print run on background threads; JS polls btState/btDevices/
    // btProgress/btLastResult. All methods return JSON strings and never throw.

    private synchronized BluetoothPrinterManager bt() {
        if (btPrinter == null) btPrinter = new BluetoothPrinterManager(activity);
        return btPrinter;
    }

    private static String btErr(String msg) {
        return "{\"ok\":false,\"message\":" + JSONObject.quote(msg != null ? msg : "error") + "}";
    }

    /** {"state","deviceName","deviceAddress","error","scanning","supported","enabled"} */
    @JavascriptInterface
    public String btState() {
        try {
            BluetoothPrinterManager m = bt();
            String state = m.getConnectionState();
            // Never report a stale CONNECTED: verify the socket is actually alive.
            if (BluetoothPrinterManager.STATE_CONNECTED.equals(state) && !m.isSocketAlive()) {
                state = BluetoothPrinterManager.STATE_DISCONNECTED;
            }
            JSONObject o = new JSONObject();
            o.put("state", state);
            o.put("deviceName", m.getConnectedDeviceName());
            o.put("deviceAddress", m.getConnectedDeviceAddress());
            o.put("error", m.getConnectionError());
            o.put("scanning", m.isScanning());
            o.put("supported", m.isBluetoothSupported());
            o.put("enabled", m.isBluetoothEnabled());
            o.put("lastPrinterName", m.getLastPrinterName());
            o.put("lastPrinterAddress", m.getLastPrinterAddress());
            o.put("defaultPrinterName", m.getDefaultPrinterName());
            o.put("defaultPrinterAddress", m.getDefaultPrinterAddress());
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /** Starts discovery. Returns {"ok":true} immediately; poll btDevices(). */
    @JavascriptInterface
    public String btScan() {
        try {
            BluetoothPrinterManager m = bt();
            if (!m.isBluetoothSupported()) return btErr("Bluetooth not supported on this device");
            if (!m.isBluetoothEnabled()) return btErr("Bluetooth is turned off");
            m.startScan();
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /** [{"name","address","paired"}] — paired devices first, then discovered. */
    @JavascriptInterface
    public String btDevices() {
        try {
            JSONArray arr = new JSONArray();
            for (BluetoothPrinterManager.DiscoveredPrinter d : bt().getDiscoveredDevices()) {
                JSONObject o = new JSONObject();
                o.put("name", d.name);
                o.put("address", d.address);
                o.put("paired", d.paired);
                arr.put(o);
            }
            return arr.toString();
        } catch (Exception e) {
            return "[]";
        }
    }

    /** Async connect by MAC address. Poll btState() for CONNECTED. */
    @JavascriptInterface
    public String btConnect(String address) {
        try {
            if (address == null || address.trim().isEmpty()) return btErr("No device address");
            bt().connectAsync(address.trim());
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /**
     * Single-shot auto-connect to the default (else last-used) printer.
     * V1-style: tries once, fails silently, never retries, never backs off.
     * Async — poll btState() for CONNECTED.
     */
    @JavascriptInterface
    public String btAutoConnect() {
        try {
            BluetoothPrinterManager m = bt();
            if (!m.isBluetoothSupported()) return btErr("Bluetooth not supported on this device");
            if (!m.isBluetoothEnabled()) return btErr("Bluetooth is turned off");
            m.autoConnectDefault();
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /** Set the default printer (starred in the device list). */
    @JavascriptInterface
    public String btSetDefault(String address) {
        try {
            if (address == null || address.trim().isEmpty()) return btErr("No device address");
            String addr = address.trim();
            String name = null;
            for (BluetoothPrinterManager.DiscoveredPrinter d : bt().getDiscoveredDevices()) {
                if (addr.equals(d.address)) { name = d.name; break; }
            }
            if (name == null) name = bt().getLastPrinterName();
            bt().setDefaultPrinter(addr, name);
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("address", addr);
            o.put("name", name);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /** Clear the default printer (falls back to last-used printer). */
    @JavascriptInterface
    public String btClearDefault() {
        try {
            bt().clearDefaultPrinter();
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    @JavascriptInterface
    public String btDisconnect() {
        try {
            bt().userDisconnect();
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /**
     * Print vouchers via Bluetooth.
     * vouchersJson: [{"code","profile","period","quota","status"}]
     * settingsJson: PrintDesignSettings JSON (printer-v1 keys)
     * siteName: header brand text; paperMm: "58" or "80"; copiesPerVoucher: int
     * Runs async — poll btProgress()/btLastResult().
     */
    @JavascriptInterface
    public String btPrint(String vouchersJson, String settingsJson, String siteName,
                          String paperMm, int copiesPerVoucher) {
        try {
            BluetoothPrinterManager m = bt();
            JSONArray arr = new JSONArray(vouchersJson != null ? vouchersJson : "[]");
            if (arr.length() == 0) return btErr("Nothing to print");
            java.util.List<BluetoothPrinterManager.VoucherData> list = new java.util.ArrayList<>();
            for (int i = 0; i < arr.length(); i++) {
                JSONObject v = arr.getJSONObject(i);
                list.add(new BluetoothPrinterManager.VoucherData(
                        v.optString("code", ""),
                        v.optString("profile", ""),
                        v.optString("period", ""),
                        v.optString("quota", ""),
                        v.optString("status", "")));
            }
            PrintDesignSettings settings = PrintDesignSettings.fromJson(settingsJson);
            PaperConfiguration paper = "80".equals(paperMm)
                    ? PaperConfiguration.STANDARD_80MM : PaperConfiguration.STANDARD_58MM;
            m.printBatchAsync(list, settings, paper,
                    siteName != null ? siteName : "", Math.max(1, copiesPerVoucher));
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /** Test receipt. Runs async — poll btLastResult(). */
    @JavascriptInterface
    public String btTestPrint(String settingsJson, String siteName) {
        try {
            bt().printTestAsync(PrintDesignSettings.fromJson(settingsJson),
                    siteName != null ? siteName : "");
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /** {"printing","current","total","message"} */
    @JavascriptInterface
    public String btProgress() {
        try {
            BluetoothPrinterManager m = bt();
            JSONObject o = new JSONObject();
            o.put("printing", m.isPrintIsPrinting());
            o.put("current", m.getPrintCurrent());
            o.put("total", m.getPrintTotal());
            o.put("message", m.getPrintMessage());
            return o.toString();
        } catch (Exception e) {
            return "{\"printing\":false,\"current\":0,\"total\":0,\"message\":\"\"}";
        }
    }

    /** Returns and clears the last async print result: {"ok","message"} or null. */
    @JavascriptInterface
    public String btLastResult() {
        try {
            String r = bt().takeLastResult();
            return r != null ? r : "null";
        } catch (Exception e) {
            return "null";
        }
    }

    // ── SSO SESSION (Ruijie account login) ───────────────────────
    // Enables voucher delete via the portal's internal webproxy API, which
    // the public Open API does not offer. The login dialog keeps the
    // official Ruijie CAS page inside our branded header.

    /** Open the Ruijie account login dialog. Result events go to window._ssoEvent(name). */
    @JavascriptInterface
    public void ssoLogin() {
        activity.runOnUiThread(() -> SsoSession.getInstance().showLoginDialog(activity,
                new SsoSession.LoginCallback() {
                    @Override public void onSuccess() {
                        webView.post(() -> webView.evaluateJavascript(
                                "window._ssoEvent&&window._ssoEvent('login')", null));
                    }
                    @Override public void onCancel() {
                        webView.post(() -> webView.evaluateJavascript(
                                "window._ssoEvent&&window._ssoEvent('cancel')", null));
                    }
                }));
    }

    // ── PORTAL NETWORK RECORDER (v1.5.106) ────────────────────────
    // Opens the Ruijie portal in a full-screen WebView with a fetch/XHR
    // interceptor. The user performs portal actions normally, taps Stop,
    // and the captured API calls are saved as a .txt file + share sheet.
    // Zero DevTools knowledge needed on the user's side.

    /** Open the portal network recorder. Result events go to window._recEvent(name, detail). */
    @JavascriptInterface
    public void startPortalRecorder() {        activity.runOnUiThread(() -> {
            // v1.5.110: ALWAYS run the proven SSO login dialog first.
            // isLoggedIn() only checks cookie presence — a stale session
            // still returns true and /macc5/ then 403s. The SSO dialog
            // sails through when the session is truly valid, or shows the
            // login form when it isn't. Either way the recorder opens with
            // a live portal session.
            SsoSession.getInstance().showLoginDialog(activity,
                    new SsoSession.LoginCallback() {
                        @Override public void onSuccess() {
                            openRecorder();
                        }
                        @Override public void onCancel() {
                            webView.post(() -> webView.evaluateJavascript(
                                    "window._recEvent&&window._recEvent('cancel')", null));
                        }
                    });
        });
    }

    private void openRecorder() {
        // v1.5.111: load the real portal URL the SSO dialog reached —
        // a hardcoded /macc5/ 403s even with a fresh login.
        final String portalUrl = SsoSession.getLastPortalUrl();
        PortalRecorder.show(activity, portalUrl,
                (filePath, count) -> webView.post(() -> webView.evaluateJavascript(
                        "window._recEvent&&window._recEvent('done'," +
                                count + ")", null)));
    }

    /** v1.5.147: Open the gateway network recorder. The user logs in to the
     * gateway eWeb manually inside the recorder, performs actions, then taps
     * Stop. Result events go to window._gwRecEvent(name, detail). */
    @JavascriptInterface
    public void startGatewayRecorder() {
        activity.runOnUiThread(() -> {
            GatewayRecorder.show(activity,
                    (filePath, count) -> webView.post(() -> webView.evaluateJavascript(
                            "window._gwRecEvent&&window._gwRecEvent('done'," +
                                    count + ")", null)));
        });
    }

    /** fix1: silent SSO login for app entry — the dialog is hidden (window
     * alpha 0) while the login runs; the app shows an iOS-style loading
     * overlay instead. The dialog is revealed automatically if the login
     * needs the user (captcha / 2FA / error). Result events go to
     * window._ssoEvent(name). */
    @JavascriptInterface
    public void ssoLoginSilent() {
        activity.runOnUiThread(() -> SsoSession.getInstance().showLoginDialog(activity, true,
                new SsoSession.LoginCallback() {
                    @Override public void onSuccess() {
                        webView.post(() -> webView.evaluateJavascript(
                                "window._ssoEvent&&window._ssoEvent('login')", null));
                    }
                    @Override public void onCancel() {
                        webView.post(() -> webView.evaluateJavascript(
                                "window._ssoEvent&&window._ssoEvent('cancel')", null));
                    }
                }));
    }

    /** Synchronous status JSON: {"loggedIn":true/false}. */
    @JavascriptInterface
    public String ssoStatus() {
        boolean in = SsoSession.getInstance().isLoggedIn();
        return "{\"loggedIn\":" + (in ? "true" : "false") + "}";
    }

    /**
     * Async webproxy call with the SSO session cookies.
     * Response (raw body) is base64-encoded and delivered via
     * window._ssoResolve(id, b64).
     */
    @JavascriptInterface
    public void ssoRequest(final String callId, final String apiPath, final String envelopeJson) {
        pool.execute(() -> {
            String result;
            boolean sessionDead = false;
            try {
                result = SsoSession.getInstance().webProxy(apiPath, envelopeJson);
            } catch (SecurityException se) {
                result = "{\"code\":401,\"msg\":\"" + se.getMessage().replace("\"", "'") + "\"}";
                sessionDead = true; // stale cookies cleared; refresh the Settings card
            } catch (Exception e) {
                String m = e.getMessage() == null ? "unknown error" : e.getMessage().replace("\"", "'");
                result = "{\"code\":-97,\"msg\":\"SSO request failed: " + m + "\"}";
            }
            String b64 = Base64.encodeToString(result.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
            final String out = b64;
            final String safeId = callId.replaceAll("[^A-Za-z0-9_]", "");
            final boolean fireLogout = sessionDead;
            webView.post(() -> {
                webView.evaluateJavascript(
                        "window._ssoResolve('" + safeId + "','" + out + "')", null);
                if (fireLogout) webView.evaluateJavascript(
                        "window._ssoEvent&&window._ssoEvent('logout')", null);
            });
        });
    }

    /** Clear SSO cookies. Fires window._ssoEvent('logout'). */
    @JavascriptInterface
    public void ssoLogout() {
        SsoSession.getInstance().logout();
        webView.post(() -> webView.evaluateJavascript(
                "window._ssoEvent&&window._ssoEvent('logout')", null));
    }

    // ── SSO SAVED ACCOUNT (remember / auto-login, v1.5.52) ──────
    // Credentials are Keystore-encrypted on this device; only the email
    // (never the password) is ever exposed to the web layer.

    /** JSON: {"has":bool,"email":"..","autoLogin":bool,"rememberWanted":bool}. */
    @JavascriptInterface
    public String ssoAccountInfo() {
        try {
            SecureCredentialStore store = new SecureCredentialStore(activity);
            String j = store.loadJson();
            org.json.JSONObject o = new org.json.JSONObject();
            o.put("has", j != null);
            o.put("email", j != null ? new org.json.JSONObject(j).optString("e", "") : "");
            o.put("autoLogin", store.getAutoLogin());
            o.put("rememberWanted", store.getRememberWanted());
            return o.toString();
        } catch (Exception e) {
            return "{\"has\":false,\"email\":\"\",\"autoLogin\":false,\"rememberWanted\":true}";
        }
    }

    /** Persist the auto-login flag (credentials are saved by the cover on sign-in). */
    @JavascriptInterface
    public void ssoSetAutoLogin(boolean on) {
        try { new SecureCredentialStore(activity).setAutoLogin(on); }
        catch (Exception ignored) {}
    }

    /**
     * Persist the remember-wanted flag. Turning it OFF also forgets any
     * saved credentials immediately.
     */
    @JavascriptInterface
    public void ssoSetRemember(boolean on) {
        try {
            SecureCredentialStore store = new SecureCredentialStore(activity);
            store.setRememberWanted(on);
            if (!on) { store.clear(); store.setAutoLogin(false); }
        } catch (Exception ignored) {}
    }

    /** Forget the saved SSO account credentials (SSO cookies untouched). */
    @JavascriptInterface
    public void ssoForgetAccount() {
        try { new SecureCredentialStore(activity).clear(); }
        catch (Exception ignored) {}
    }

    /**
     * Save portal account credentials from a named profile (v1.5.79).
     * Keystore-encrypted via SecureCredentialStore; never logged.
     * Marks remember-wanted so the SSO cover auto-submits on next login.
     */
    @JavascriptInterface
    public void ssoSaveCreds(String email, String password) {
        try {
            if (email == null || email.trim().isEmpty()) return;
            SecureCredentialStore store = new SecureCredentialStore(activity);
            store.save(email.trim(), password == null ? "" : password);
            store.setRememberWanted(true);
        } catch (Exception ignored) {}
    }

    // ── DIAGNOSTICS ──────────────────────────────────────────────
    // In-app diagnosis tool (Settings → စစ်ဆေးမှုများ). Login tests and
    // voucher tests are selectable; the report is saved as .txt through
    // the system file picker so the user chooses where it goes.

    /** Request code for the ACTION_CREATE_DOCUMENT report-save picker. */
    public static final int REQ_DIAG_SAVE = 2001;
    private byte[] pendingDiagContent;

    /**
     * Cookie NAMES (never values) present per SSO URL — lets the
     * diagnosis tell "cookies exist" apart from "session alive".
     * Includes the full webproxy URL because the portal session cookie
     * may be path-scoped (e.g. Path=/webproxy), which the bare domain
     * does not reveal.
     */
    @JavascriptInterface
    public String diagCookieInfo() {
        try {
            android.webkit.CookieManager cm = android.webkit.CookieManager.getInstance();
            JSONObject o = new JSONObject();
            String[] urls = {"https://cloud-as.ruijienetworks.com",
                    "https://cloud-as.ruijienetworks.com/webproxy/common/api",
                    "https://cloud.ruijienetworks.com"};
            for (String u : urls) {
                JSONArray names = new JSONArray();
                String c = cm.getCookie(u);
                if (c != null) {
                    for (String p : c.split(";")) {
                        String n = p.trim().split("=", 2)[0];
                        if (!n.isEmpty()) names.put(n);
                    }
                }
                o.put(u, names);
            }
            return o.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    /**
     * Login dialog redirect trace (URLs only, no credentials) for
     * diagnostics. Proves whether the portal SSO handshake completed.
     */
    @JavascriptInterface
    public String diagLoginTrace() {
        try { return SsoSession.getLoginTraceJson(); }
        catch (Exception e) { return "{\"result\":\"error\",\"at\":\"\",\"urls\":[]}"; }
    }

    /**
     * Portal session probe: posts the delete envelope for a voucher code
     * that cannot exist. Returns {"http":N,"notLogin":bool,"snippet":"…"}
     * — nothing real is deleted.
     */
    @JavascriptInterface
    public String portalProbe(String envelopeJson) {
        try { return SsoSession.getInstance().portalProbe(envelopeJson); }
        catch (Exception e) {
            String m = String.valueOf(e.getMessage()).replace('"', '\'');
            return "{\"error\":\"" + m + "\"}";
        }
    }

    /**
     * Save the diagnostic report: opens the system file picker
     * (ACTION_CREATE_DOCUMENT) so the user picks where the .txt goes.
     * Result is delivered via window._diagEvent('saved'|'cancel'|'error').
     */
    @JavascriptInterface
    public void diagSaveReport(final String filename, final String contentB64) {
        try {
            pendingDiagContent = Base64.decode(contentB64, Base64.DEFAULT);
            Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            i.addCategory(Intent.CATEGORY_OPENABLE);
            i.setType("text/plain");
            i.putExtra(Intent.EXTRA_TITLE, filename);
            activity.startActivityForResult(i, REQ_DIAG_SAVE);
        } catch (Exception e) {
            fireDiagEvent("error", e.getMessage());
        }
    }

    /** Called from MainActivity.onActivityResult for REQ_DIAG_SAVE. */
    public void onDiagSaveResult(int resultCode, Intent data) {
        if (pendingDiagContent == null) return;
        byte[] content = pendingDiagContent;
        pendingDiagContent = null;
        if (resultCode == Activity.RESULT_OK && data != null && data.getData() != null) {
            try {
                Uri uri = data.getData();
                OutputStream os = activity.getContentResolver().openOutputStream(uri);
                if (os == null) throw new Exception("cannot open output");
                os.write(content);
                os.close();
                fireDiagEvent("saved", "");
            } catch (Exception e) {
                fireDiagEvent("error", e.getMessage());
            }
        } else {
            fireDiagEvent("cancel", "");
        }
    }

    private void fireDiagEvent(final String name, final String info) {
        final String safe = info == null ? "" : info.replace("\\", "\\\\").replace("'", "\\'");
        webView.post(() -> webView.evaluateJavascript(
                "window._diagEvent&&window._diagEvent('" + name + "','" + safe + "')", null));
    }

    // ── GATEWAY-LOCAL (LAN eWeb) ─────────────────────────────────────
    // Direct connection to the user's own gateway over the LAN
    // (e.g. https://100.88.200.103). Android-APK-only: the https web app
    // cannot reach a LAN http(s) IP. Used to show devices that Ruijie
    // Cloud never sees (e.g. China-version APs) — the full 9-device view.
    //
    // Login password encryption: the gateway's login page encrypts the
    // password with Gibberish-AES (OpenSSL-compatible AES-256-CBC,
    // "Salted__" format) — replicated in GatewayCrypto. The passphrase
    // is derived at runtime exactly like the eWeb bundle:
    //   (window.sctM || "Rj") + GibberishAES.dec(<seed>, "web").replace(/\s+/g,"")
    // and the encrypted password has whitespace stripped, matching the
    // bundle's GibberishAES.enc(e, t || Zt).replace(/\s/g, "") helper.

    /**
     * Passphrase for the gateway login page's GibberishAES.enc call,
     * derived at runtime from the firmware key-seed (see GatewayCrypto).
     * Null when derivation fails, in which case GW_PWD_ENC_READY is false
     * and login reports "not ready" instead of sending a bad password.
     */
    private static final String GW_PWD_PASSPHRASE = deriveGwKey();
    /** True once GW_PWD_PASSPHRASE is derived from the firmware key-seed. */
    private static final boolean GW_PWD_ENC_READY = GW_PWD_PASSPHRASE != null;

    private static String deriveGwKey() {
        try {
            return GatewayCrypto.gatewayPasswordKey();
        } catch (Exception e) {
            return null;
        }
    }

    private void gwResolve(final String callId, final String json) {
        String b64 = Base64.encodeToString(json.getBytes(StandardCharsets.UTF_8), Base64.NO_WRAP);
        final String out = b64;
        final String safeId = callId.replaceAll("[^A-Za-z0-9_]", "");
        webView.post(() -> webView.evaluateJavascript(
                "window._gwResolve('" + safeId + "','" + out + "')", null));
    }

    private String gwErr(String msg) {
        try {
            return new JSONObject().put("code", -97)
                    .put("msg", "Gateway: " + msg).toString();
        } catch (Exception e) {
            return "{\"code\":-97,\"msg\":\"Gateway error\"}";
        }
    }

    /**
     * Gateway login. The plaintext password is AES-encrypted natively
     * (Gibberish-AES compatible) and never crosses the JS bridge.
     * Resolves {"code":0,"data":{"token":..,"sn":..,"sid":..}} verbatim.
     *
     * Key strategy (v1.5.21): newer Ruijie firmware rotates the login-page
     * AES key on every render (server remembers it per source IP). We GET
     * /cgi-bin/luci/ first, extract the key from the GibberishAES.enc call,
     * and log in immediately with it. If extraction fails (older firmware),
     * we fall back to the static bundle-derived key.
     *
     * v1.5.29: if the dynamic key yields no session (empty data / no sid),
     * retry once with the static key — the extracted key can be stale or
     * from the wrong call site after a firmware change. Whichever key
     * produces a sid wins; _keyMode reports it, _tried lists attempts.
     */
    @JavascriptInterface
    public void gatewayLogin(final String callId, final String ip, final String username, final String passwordPlain) {
        pool.execute(() -> {
            if (!GW_PWD_ENC_READY) {
                gwResolve(callId, gwErr("password encrypt \u1014\u100a\u103a\u1038\u101c\u1004\u103a\u1038 \u1019\u101e\u1004\u103a\u1001\u1031\u1038\u1010\u1031\u1038\u1010\u1032\u1037 — gateway login JS \u1000 \u101b\u1005\u103a\u1015\u103c\u102e\u1038\u1015\u102b\u1038\u1019\u103e\u1010\u103a\u1038\u101c\u102d\u102f\u1015\u103a\u1015\u102b\u1038"));
                return;
            }
            try {
                String cleanIp = ip.trim().replaceAll("^https?://", "").replaceAll("/.*$", "");
                // v1.5.21: try the per-render dynamic key from the login page
                // first (newer firmware); fall back to the static key.
                // v1.5.29: retry with the static key when the dynamic key
                // yields no session (stale/wrong key after firmware change).
                String dynKey = GatewayClient.fetchLoginKey(cleanIp);
                boolean useDyn = (dynKey != null && !dynKey.isEmpty());
                String[] keysToTry = useDyn
                        ? new String[]{ dynKey, GW_PWD_PASSPHRASE }
                        : new String[]{ GW_PWD_PASSPHRASE };
                String[] modes = useDyn
                        ? new String[]{ "dynamic", "static" }
                        : new String[]{ "static" };
                String resp = null;
                String usedMode = modes[0];
                StringBuilder tried = new StringBuilder();
                JSONObject lastJ = null;
                for (int ki = 0; ki < keysToTry.length; ki++) {
                    if (tried.length() > 0) tried.append(",");
                    tried.append(modes[ki]);
                    usedMode = modes[ki];
                    String pwdEnc = GatewayCrypto.gibberishAesEnc(passwordPlain, keysToTry[ki])
                            .replaceAll("\\s+", ""); // bundle: GibberishAES.enc(e, t || Zt).replace(/\s/g, "")
                    long ts = System.currentTimeMillis() / 1000L;
                    JSONObject params = new JSONObject()
                            .put("username", username)
                            .put("time", String.valueOf(ts))
                            .put("isCheckReadAgreement", "true")
                            .put("encry", true)
                            .put("pwd", pwdEnc);
                    JSONObject body = new JSONObject()
                            .put("method", "login")
                            .put("params", params);
                    resp = GatewayClient.post(cleanIp, "/cgi-bin/luci/api/auth", null, body.toString());
                    try {
                        JSONObject j = new JSONObject(resp);
                        lastJ = j;
                        // Success = any session indicator: sid/stok in data
                        // or top-level, or a session cookie.
                        JSONObject dd = j.optJSONObject("data");
                        boolean hasSid = (dd != null && (dd.has("sid") || dd.has("stok")))
                                || j.has("sid") || j.has("stok")
                                || !GatewayClient.lastCookies().isEmpty();
                        if (hasSid) break;
                    } catch (Exception je) {
                        lastJ = null; // non-JSON response: retrying won't help
                        break;
                    }
                }
                // Attach Set-Cookie headers: some firmware omits sid in the body
                // and only returns it as the <sn>=<sid> session cookie.
                // Also report which key mode was used (dynamic vs static).
                try {
                    JSONObject j = (lastJ != null) ? lastJ : new JSONObject(resp);
                    JSONArray arr = new JSONArray();
                    for (String ck : GatewayClient.lastCookies()) arr.put(ck);
                    j.put("_cookies", arr);
                    j.put("_keyMode", usedMode);
                    j.put("_tried", tried.toString());
                    gwResolve(callId, j.toString());
                } catch (Exception je) {
                    gwResolve(callId, resp);
                }
            } catch (Exception e) {
                gwResolve(callId, gwErr(e.getMessage() == null ? "login failed" : e.getMessage()));
            }
        });
    }

    /**
     * Raw gateway cmd call: POST /cgi-bin/luci/api/cmd?auth=<sid> with a
     * cmdArr envelope. Resolves the gateway's JSON verbatim.
     */
    @JavascriptInterface
    public void gatewayCmd(final String callId, final String ip, final String sid, final String bodyJson) {
        pool.execute(() -> {
            try {
                String cleanIp = ip.trim().replaceAll("^https?://", "").replaceAll("/.*$", "");
                String resp = GatewayClient.post(cleanIp, "/cgi-bin/luci/api/cmd", "auth=" + sid, bodyJson);
                gwResolve(callId, resp);
            } catch (Exception e) {
                gwResolve(callId, gwErr(e.getMessage() == null ? "request failed" : e.getMessage()));
            }
        });
    }

    // ── DEVICE OFFLINE MONITOR (v1.5.52) ─────────────────────────
    // Background JobScheduler check (APs + Gateways) that notifies with a
    // circular badge + custom sound even when the app is closed.

    /** {enabled, scheduled, hasConfig} for the Settings toggle. */
    @JavascriptInterface
    public String monitorInfo() {
        try {
            JSONObject o = new JSONObject();
            o.put("enabled", DeviceMonitor.prefs(activity).getBoolean("enabled", false));
            o.put("scheduled", DeviceMonitor.isScheduled(activity));
            o.put("hasConfig", DeviceMonitor.hasConfig(activity));
            o.put("canNotify", Build.VERSION.SDK_INT < 33
                    || activity.checkSelfPermission("android.permission.POST_NOTIFICATIONS")
                        == android.content.pm.PackageManager.PERMISSION_GRANTED);
            return o.toString();
        } catch (Exception e) {
            return "{\"enabled\":false,\"scheduled\":false,\"hasConfig\":false,\"canNotify\":false}";
        }
    }

    /** Save the Cloud connection the background monitor polls with. Never logs the secret. */
    @JavascriptInterface
    public void monitorSync(String json) {
        try {
            JSONObject o = new JSONObject(json);
            DeviceMonitor.saveConfig(activity,
                    o.optString("cloud", ""),
                    o.optString("appid", ""),
                    o.optString("secret", ""),
                    o.optLong("groupId", 0));
        } catch (Exception ignored) {}
    }

    /** Turn the background monitor on/off (schedules or cancels the job). */
    @JavascriptInterface
    public void monitorSetEnabled(boolean on) {
        try {
            DeviceMonitor.prefs(activity).edit().putBoolean("enabled", on).apply();
            if (on) DeviceMonitor.schedule(activity);
            else DeviceMonitor.cancel(activity);
        } catch (Exception ignored) {}
    }

    /** Run one check right now on a background thread. */
    @JavascriptInterface
    public void monitorCheckNow() {
        pool.execute(() -> {
            try { DeviceMonitorJob.runCheckOnce(activity.getApplicationContext()); }
            catch (Exception ignored) {}
        });
    }

    /** Ask for the Android 13+ notification permission (no-op below 33). */
    @JavascriptInterface
    public void monitorRequestPermission() {
        try {
            if (Build.VERSION.SDK_INT >= 33) {
                activity.requestPermissions(
                        new String[]{"android.permission.POST_NOTIFICATIONS"}, 7102);
            }
        } catch (Exception ignored) {}
    }

    // ── BACKGROUND AUTO-KICK (v1.5.66) ──────────────────────────
    // JobScheduler job that disconnects quota/time-spent voucher clients
    // even when the screen is off. Same toggle as the in-app auto-kick.

    /** {enabled, scheduled, hasConfig} for the Settings auto-kick toggle. */
    @JavascriptInterface
    public String autoKickInfo() {
        try {
            JSONObject o = new JSONObject();
            o.put("enabled", AutoKick.prefs(activity).getBoolean("enabled", false));
            o.put("scheduled", AutoKick.isScheduled(activity));
            o.put("hasConfig", AutoKick.hasConfig(activity));
            o.put("intervalMin", AutoKick.getIntervalMin(activity));
            return o.toString();
        } catch (Exception e) {
            return "{\"enabled\":false,\"scheduled\":false,\"hasConfig\":false}";
        }
    }

    /** Push the current Cloud connection into the background auto-kick. */
    @JavascriptInterface
    public void autoKickSync(String json) {
        try {
            JSONObject o = new JSONObject(json);
            AutoKick.saveConfig(activity,
                    o.optString("cloud", ""),
                    o.optString("appid", ""),
                    o.optString("secret", ""),
                    o.optLong("groupId", 0));
        } catch (Exception ignored) {}
    }

    /** Turn background auto-kick on/off (schedules or cancels the job). */
    @JavascriptInterface
    public void autoKickSetEnabled(boolean on) {
        try {
            AutoKick.prefs(activity).edit().putBoolean("enabled", on).apply();
            if (on) AutoKick.schedule(activity);
            else AutoKick.cancel(activity);
        } catch (Exception ignored) {}
    }

    /** v1.5.116: set the background auto-kick check interval (minutes, min 15). */
    @JavascriptInterface
    public void autoKickSetInterval(int min) {
        try { AutoKick.setIntervalMin(activity, min); }
        catch (Exception ignored) {}
    }

    /** Run one background kick cycle right now on a background thread. */
    @JavascriptInterface
    public void autoKickNow() {
        pool.execute(() -> {
            try { AutoKickJob.runKickOnce(activity.getApplicationContext()); }
            catch (Exception ignored) {}
        });
    }

    /* ── In-app update (APK) ────────────────────────────── */
    /** Current app version: {"versionName","versionCode","packageName"}. */
    @JavascriptInterface
    public String appVersion() {
        try {
            android.content.pm.PackageInfo pi = activity.getPackageManager()
                    .getPackageInfo(activity.getPackageName(), 0);
            JSONObject o = new JSONObject();
            o.put("versionName", pi.versionName != null ? pi.versionName : "");
            long vc = android.os.Build.VERSION.SDK_INT >= 28
                    ? pi.getLongVersionCode() : pi.versionCode;
            o.put("versionCode", vc);
            o.put("packageName", activity.getPackageName());
            return o.toString();
        } catch (Exception e) {
            return "{\"versionName\":\"\",\"versionCode\":0,\"packageName\":\"\"}";
        }
    }

    /* ── v1.5.143: device identity for the app install registry ──
     * Stable per-app ANDROID_ID + model info. No permissions needed. */
    @JavascriptInterface
    public String deviceInfo() {
        try {
            JSONObject o = new JSONObject();
            String androidId = android.provider.Settings.Secure.getString(
                    activity.getContentResolver(),
                    android.provider.Settings.Secure.ANDROID_ID);
            o.put("id", androidId != null ? androidId : "");
            o.put("model", android.os.Build.MODEL != null ? android.os.Build.MODEL : "");
            o.put("manufacturer", android.os.Build.MANUFACTURER != null ? android.os.Build.MANUFACTURER : "");
            o.put("brand", android.os.Build.BRAND != null ? android.os.Build.BRAND : "");
            o.put("android", android.os.Build.VERSION.RELEASE != null ? android.os.Build.VERSION.RELEASE : "");
            return o.toString();
        } catch (Exception e) {
            return "{\"id\":\"\",\"model\":\"\",\"manufacturer\":\"\",\"brand\":\"\",\"android\":\"\"}";
        }
    }

    /** Enqueue an APK download via DownloadManager. Returns {"ok","id"}. */
    @JavascriptInterface
    public String updateDownload(String url, String fileName) {
        try {
            if (url == null || url.trim().isEmpty()) return btErr("Empty URL");
            String fn = (fileName == null || fileName.trim().isEmpty())
                    ? "update.apk" : fileName.trim();
            android.app.DownloadManager dm = (android.app.DownloadManager)
                    activity.getSystemService(Context.DOWNLOAD_SERVICE);
            android.app.DownloadManager.Request req =
                    new android.app.DownloadManager.Request(Uri.parse(url.trim()));
            req.setTitle(fn);
            req.setDescription("App update");
            req.setNotificationVisibility(
                    android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            req.setMimeType("application/vnd.android.package-archive");
            req.setDestinationInExternalPublicDir(
                    android.os.Environment.DIRECTORY_DOWNLOADS, "RuijieVoucher/" + fn);
            long id = dm.enqueue(req);
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("id", id);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /** Query a DownloadManager download: {"status","soFar","total"}. */
    @JavascriptInterface
    public String updateQuery(long id) {
        JSONObject o = new JSONObject();
        try {
            android.app.DownloadManager dm = (android.app.DownloadManager)
                    activity.getSystemService(Context.DOWNLOAD_SERVICE);
            android.app.DownloadManager.Query q = new android.app.DownloadManager.Query();
            q.setFilterById(id);
            android.database.Cursor c = dm.query(q);
            try {
                if (c != null && c.moveToFirst()) {
                    int st = c.getInt(c.getColumnIndex(
                            android.app.DownloadManager.COLUMN_STATUS));
                    long soFar = c.getLong(c.getColumnIndex(
                            android.app.DownloadManager.COLUMN_BYTES_DOWNLOADED_SO_FAR));
                    long total = c.getLong(c.getColumnIndex(
                            android.app.DownloadManager.COLUMN_TOTAL_SIZE_BYTES));
                    String status;
                    switch (st) {
                        case android.app.DownloadManager.STATUS_SUCCESSFUL: status = "success"; break;
                        case android.app.DownloadManager.STATUS_FAILED: status = "failed"; break;
                        case android.app.DownloadManager.STATUS_PAUSED: status = "paused"; break;
                        case android.app.DownloadManager.STATUS_RUNNING: status = "running"; break;
                        default: status = "pending";
                    }
                    o.put("status", status);
                    o.put("soFar", soFar);
                    o.put("total", total);
                } else {
                    o.put("status", "unknown");
                    o.put("soFar", 0);
                    o.put("total", 0);
                }
            } finally {
                if (c != null) c.close();
            }
            return o.toString();
        } catch (Exception e) {
            try { o.put("status", "error"); o.put("soFar", 0); o.put("total", 0); } catch (Exception ignored) {}
            return o.toString();
        }
    }

    /** True when the app may request package installs (Android 8+). */
    @JavascriptInterface
    public boolean updateCanInstall() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 26) {
                return activity.getPackageManager().canRequestPackageInstalls();
            }
            return true;
        } catch (Exception e) {
            return true;
        }
    }

    /** Open the "install unknown apps" settings page for this app. */
    @JavascriptInterface
    public String updateOpenInstallSettings() {
        try {
            Intent i = new Intent(
                    android.provider.Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:" + activity.getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(i);
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /** Launch the system installer for a completed download. */
    @JavascriptInterface
    public String updateInstall(long id) {
        try {
            android.app.DownloadManager dm = (android.app.DownloadManager)
                    activity.getSystemService(Context.DOWNLOAD_SERVICE);
            Uri uri = dm.getUriForDownloadedFile(id);
            if (uri == null) return btErr("Download not found");
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(i);
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /** Ask the user for the POST_NOTIFICATIONS runtime permission (Android 13+).
     * Safe no-op on older versions or when already granted. */
    @JavascriptInterface
    public String updateNotifRequest() {
        try {
            if (android.os.Build.VERSION.SDK_INT >= 33) {
                if (activity.checkSelfPermission(
                        android.Manifest.permission.POST_NOTIFICATIONS)
                        != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    activity.requestPermissions(
                            new String[]{ android.Manifest.permission.POST_NOTIFICATIONS }, 9001);
                }
            }
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    /** Post a high-priority system notification (e.g. "update downloaded").
     * Tapping it reopens the app. Silently skipped when notifications are
     * disabled for the app — never crashes. */
    @JavascriptInterface
    public String updateNotify(String title, String text) {
        try {
            android.app.NotificationManager nm = (android.app.NotificationManager)
                    activity.getSystemService(Context.NOTIFICATION_SERVICE);
            if (!nm.areNotificationsEnabled()) {
                JSONObject o = new JSONObject();
                o.put("ok", false);
                o.put("reason", "disabled");
                return o.toString();
            }
            String chId = "app_updates";
            if (android.os.Build.VERSION.SDK_INT >= 26) {
                android.app.NotificationChannel ch = new android.app.NotificationChannel(
                        chId, "App updates",
                        android.app.NotificationManager.IMPORTANCE_HIGH);
                nm.createNotificationChannel(ch);
            }
            android.content.Intent li = activity.getPackageManager()
                    .getLaunchIntentForPackage(activity.getPackageName());
            int flags = android.app.PendingIntent.FLAG_UPDATE_CURRENT;
            if (android.os.Build.VERSION.SDK_INT >= 23) {
                flags |= android.app.PendingIntent.FLAG_IMMUTABLE;
            }
            android.app.PendingIntent pi = android.app.PendingIntent.getActivity(
                    activity, 0, li, flags);
            android.app.Notification.Builder b =
                    android.os.Build.VERSION.SDK_INT >= 26
                            ? new android.app.Notification.Builder(activity, chId)
                            : new android.app.Notification.Builder(activity);
            b.setContentTitle(title != null ? title : "Update")
                    .setContentText(text != null ? text : "")
                    .setSmallIcon(android.R.drawable.stat_sys_download_done)
                    .setContentIntent(pi)
                    .setAutoCancel(true);
            nm.notify(2001, b.build());
            JSONObject o = new JSONObject();
            o.put("ok", true);
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }
}
