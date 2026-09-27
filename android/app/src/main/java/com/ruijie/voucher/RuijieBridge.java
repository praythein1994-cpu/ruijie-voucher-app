package com.ruijie.voucher;

import android.app.Activity;
import android.content.Context;
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
        String url = cloud + "/service/api/" + path + "?" + qs;
        String resp = httpsJson(url, method, "POST".equals(method) ? (body != null ? body.toString() : "{}") : null);
        int code = new JSONObject(resp).optInt("code", -1);
        if (code == 4 && !retried) { // token invalid -> refresh once and retry
            token = getToken(cloud, appid, secret, true);
            String qs2 = buildQuery(query) + "&access_token=" + URLEncoder.encode(token, "UTF-8");
            resp = httpsJson(cloud + "/service/api/" + path + "?" + qs2, method,
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
            JSONObject o = new JSONObject();
            o.put("state", m.getConnectionState());
            o.put("deviceName", m.getConnectedDeviceName());
            o.put("deviceAddress", m.getConnectedDeviceAddress());
            o.put("error", m.getConnectionError());
            o.put("scanning", m.isScanning());
            o.put("supported", m.isBluetoothSupported());
            o.put("enabled", m.isBluetoothEnabled());
            o.put("lastPrinterName", m.getLastPrinterName());
            o.put("lastPrinterAddress", m.getLastPrinterAddress());
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
     * Auto-connect to the last used printer (stored MAC, no scan).
     * Async — poll btState() for CONNECTED.
     */
    @JavascriptInterface
    public String btAutoConnect() {
        try {
            BluetoothPrinterManager m = bt();
            if (!m.isBluetoothSupported()) return btErr("Bluetooth not supported on this device");
            if (!m.isBluetoothEnabled()) return btErr("Bluetooth is turned off");
            String addr = m.getLastPrinterAddress();
            if (addr == null || addr.isEmpty()) return btErr("No saved printer yet");
            m.autoConnectAsync();
            JSONObject o = new JSONObject();
            o.put("ok", true);
            o.put("address", addr);
            o.put("name", m.getLastPrinterName());
            return o.toString();
        } catch (Exception e) {
            return btErr(e.getMessage());
        }
    }

    @JavascriptInterface
    public String btDisconnect() {
        try {
            bt().disconnect();
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
}
