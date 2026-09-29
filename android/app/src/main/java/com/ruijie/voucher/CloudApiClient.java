package com.ruijie.voucher;

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
import java.util.Iterator;

/**
 * Static Ruijie Cloud Open-API client for background use (JobService has no
 * Activity/WebView). Same token + call semantics as RuijieBridge's native
 * HTTPS path: direct HTTPS to the cloud host, no proxy needed.
 */
public class CloudApiClient {

    private static final String FIXED_TOKEN_PARAM = "d63dss0a81e4415a889ac5b78fsc904a"; // per Ruijie doc: fixed
    private static final long TOKEN_TTL_MS = 25L * 24 * 3600 * 1000; // doc says 30 days; refresh early
    private static final int TIMEOUT_MS = 30000;

    private static final Object LOCK = new Object();
    private static String cachedToken = null;
    private static long cachedAt = 0;
    private static String cachedKey = null;

    /** GET maint/devices for a group + device type. Returns the raw device
     *  array (may be empty, never null). common_type is MANDATORY per the
     *  Ruijie manual (AP / Switch / Gateway) — without it the call fails. */
    public static JSONArray getDevices(String cloud, String appid, String secret,
                                       long groupId, String commonType) throws Exception {
        JSONObject query = new JSONObject();
        query.put("group_id", groupId);
        query.put("common_type", commonType);
        query.put("page", 0);
        query.put("per_page", 100);
        String resp = apiCall(cloud, appid, secret, "GET", "maint/devices", query, null, false);
        JSONObject rj = new JSONObject(resp);
        if (rj.optInt("code", -1) != 0) {
            throw new Exception("Ruijie: " + rj.optString("msg", "code " + rj.optInt("code", -1)));
        }
        JSONObject data = rj.optJSONObject("data");
        if (data == null) data = rj;
        JSONArray arr = data.optJSONArray("deviceList");
        if (arr == null) arr = data.optJSONArray("list");
        if (arr == null) arr = data.optJSONArray("devices");
        if (arr == null) arr = new JSONArray();
        return arr;
    }

    /** GET open/auth/voucher/getList/{groupId} (all pages). Returns the raw
     *  voucher array (may be empty, never null). Same envelope the web app's
     *  Api.voucherListAll() uses: {code:0, voucherData:{count, list}}. */
    public static JSONArray getVouchers(String cloud, String appid, String secret,
                                       long groupId) throws Exception {
        JSONArray out = new JSONArray();
        int start = 0, pageSize = 200, total = Integer.MAX_VALUE;
        while (start < total) {
            JSONObject query = new JSONObject();
            query.put("start", start);
            query.put("pageSize", pageSize);
            String resp = apiCall(cloud, appid, secret, "GET",
                    "open/auth/voucher/getList/" + groupId, query, null, false);
            JSONObject rj = new JSONObject(resp);
            if (rj.optInt("code", -1) != 0) {
                throw new Exception("Ruijie: " + rj.optString("msg", "code " + rj.optInt("code", -1)));
            }
            JSONObject vd = rj.optJSONObject("voucherData");
            if (vd == null) vd = new JSONObject();
            total = vd.optInt("count", 0);
            JSONArray list = vd.optJSONArray("list");
            if (list == null) list = new JSONArray();
            for (int i = 0; i < list.length(); i++) out.put(list.opt(i));
            start += list.length();
            if (list.length() == 0) break;
        }
        return out;
    }

    private static String apiCall(String cloud, String appid, String secret,
                                  String method, String path, JSONObject query, JSONObject body,
                                  boolean retried) throws Exception {
        String token = getToken(cloud, appid, secret, false);
        String qs = buildQuery(query) + "&access_token=" + URLEncoder.encode(token, "UTF-8");
        String apiPath = path.startsWith("/") ? path.substring(1) : "service/api/" + path;
        String url = cloud + "/" + apiPath + "?" + qs;
        String resp = httpsJson(url, method, "POST".equals(method) ? (body != null ? body.toString() : "{}") : null);
        JSONObject rj = new JSONObject(resp);
        int code = rj.optInt("code", -1);
        boolean tokenBad = code == 4 || "Login timeout".equalsIgnoreCase(rj.optString("msg", ""));
        if (tokenBad && !retried) {
            token = getToken(cloud, appid, secret, true);
            String qs2 = buildQuery(query) + "&access_token=" + URLEncoder.encode(token, "UTF-8");
            resp = httpsJson(cloud + "/" + apiPath + "?" + qs2, method,
                    "POST".equals(method) ? (body != null ? body.toString() : "{}") : null);
        }
        return resp;
    }

    private static String getToken(String cloud, String appid, String secret, boolean force) throws Exception {
        String key = cloud + "|" + appid;
        synchronized (LOCK) {
            if (!force && cachedToken != null && key.equals(cachedKey)
                    && (System.currentTimeMillis() - cachedAt) < TOKEN_TTL_MS) {
                return cachedToken;
            }
        }
        String old;
        synchronized (LOCK) { old = key.equals(cachedKey) ? cachedToken : null; }
        if (old != null) {
            try {
                String rurl = cloud + "/service/api/token/refresh?appid=" + URLEncoder.encode(appid, "UTF-8")
                        + "&secret=" + URLEncoder.encode(secret, "UTF-8")
                        + "&access_token=" + URLEncoder.encode(old, "UTF-8");
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
            String s = tj.toString();
            throw new Exception("Ruijie token request failed: " + s.substring(0, Math.min(300, s.length())));
        }
        cacheToken(key, tj.getString("accessToken"));
        return tj.getString("accessToken");
    }

    private static void cacheToken(String key, String token) {
        synchronized (LOCK) {
            cachedKey = key;
            cachedToken = token;
            cachedAt = System.currentTimeMillis();
        }
    }

    private static String buildQuery(JSONObject query) throws Exception {
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

    private static String httpsJson(String urlStr, String method, String payload) throws Exception {
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
}
