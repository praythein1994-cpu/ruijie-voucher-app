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
}
