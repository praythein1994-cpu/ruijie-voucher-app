package com.ruijie.voucher;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.cert.X509Certificate;

import javax.net.ssl.HostnameVerifier;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLSession;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;

/**
 * Direct LAN client for the Ruijie gateway's local eWeb API
 * (https://&lt;gateway-ip&gt;/cgi-bin/luci/api/...).
 *
 * The gateway serves HTTPS with a self-signed certificate that Android
 * does not trust, so this client uses a trust-all SSL context scoped
 * ONLY to gateway calls (never for cloud traffic). The gateway is a
 * LAN device the user owns; the password is entered in the app's
 * Settings and never leaves the device except to the gateway itself.
 *
 * Captured wire format (Chrome DevTools, read-only, 2026-09-28):
 *   Login: POST /cgi-bin/luci/api/auth
 *     {"method":"login","params":{"username":"admin","time":"<unix>",
 *       "isCheckReadAgreement":"true","encry":true,"pwd":"<AES-base64>"}}
 *     -> {"code":0,"data":{"token":"...","sn":"...","sid":"..."}}
 *   Device list: POST /cgi-bin/luci/api/cmd?auth=<sid>
 *     {"method":"cmdArr","params":{"device":"pc","params":[
 *       {"method":"acConfig.get","params":{"module":"network_group",...}},
 *       {"method":"devSta.get","params":{"module":"ap_list",...}},
 *       {"method":"devSta.get","params":{"module":"esw_neighbor",...}},
 *       {"method":"devSta.get","params":{"module":"neighbor",...,
 *          "data":{"product":"GW_RGOS|FW_NTOS|NBR_NTOS"}}},
 *       {"method":"devSta.get","params":{"module":"all_ap_list",...}}, ...]}}
 */
public class GatewayClient {

    private static final int TIMEOUT_MS = 20000;

    /** Set-Cookie headers from the most recent post() call (for sid fallback). */
    private static volatile java.util.List<String> lastCookies = java.util.Collections.emptyList();

    public static java.util.List<String> lastCookies() { return lastCookies; }

    /**
     * Fetch the gateway login page and extract the per-render AES key.
     * Newer Ruijie firmware rotates the GibberishAES key on every login-page
     * render: the page contains GibberishAES.enc(passwordEl.value, "<hex>")
     * and the server remembers that key per source IP. The static
     * "RjYkhwzx$2018!" key only works on older firmware; using it on newer
     * firmware makes the server reply {"msg":"Auth key is nil.","reload":true}.
     * Returns the hex key, or null if it cannot be extracted.
     */
    public static String fetchLoginKey(String ip) {
        try {
            String html = get(ip, "/cgi-bin/luci/");
            if (html == null) return null;
            // GibberishAES.enc(<pwd-expr>, "<hex>") — hex key is 16+ chars.
            java.util.regex.Matcher m = java.util.regex.Pattern.compile(
                    "GibberishAES\\.enc\\([^,]+,\\s*[\"']([0-9a-fA-F]{16,})[\"']\\)")
                    .matcher(html);
            if (m.find()) return m.group(1);
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /** GET a path from the gateway; returns the raw response body. */
    public static String get(String ip, String path) throws Exception {
        String urlStr = "https://" + ip + path;
        HttpsURLConnection c = (HttpsURLConnection) new URL(urlStr).openConnection();
        c.setSSLSocketFactory(trustAllFactory());
        c.setHostnameVerifier(TRUST_ALL_HOST);
        c.setRequestMethod("GET");
        c.setConnectTimeout(TIMEOUT_MS);
        c.setReadTimeout(TIMEOUT_MS);
        c.setRequestProperty("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8");
        c.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");
        int status = c.getResponseCode();
        InputStream in = (status >= 200 && status < 300) ? c.getInputStream() : c.getErrorStream();
        StringBuilder sb = new StringBuilder();
        if (in != null) {
            try (BufferedReader br = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8))) {
                String line;
                while ((line = br.readLine()) != null) {
                    sb.append(line).append('\n');
                    if (sb.length() > 2_000_000) break; // Cap at ~2MB
                }
            }
        }
        if (status < 200 || status >= 300) {
            throw new Exception("Gateway HTTP " + status);
        }
        return sb.toString();
    }

    private static volatile javax.net.ssl.SSLSocketFactory trustAllFactory;
    private static final HostnameVerifier TRUST_ALL_HOST = new HostnameVerifier() {
        @Override public boolean verify(String hostname, SSLSession session) { return true; }
    };

    private static javax.net.ssl.SSLSocketFactory trustAllFactory() throws Exception {
        if (trustAllFactory == null) {
            synchronized (GatewayClient.class) {
                if (trustAllFactory == null) {
                    TrustManager[] tm = new TrustManager[]{ new X509TrustManager() {
                        @Override public void checkClientTrusted(X509Certificate[] c, String a) {}
                        @Override public void checkServerTrusted(X509Certificate[] c, String a) {}
                        @Override public X509Certificate[] getAcceptedIssuers() { return new X509Certificate[0]; }
                    }};
                    SSLContext sc = SSLContext.getInstance("TLS");
                    sc.init(null, tm, new SecureRandom());
                    trustAllFactory = sc.getSocketFactory();
                }
            }
        }
        return trustAllFactory;
    }

    private static String md5Hex(String s) throws Exception {
        java.security.MessageDigest md = java.security.MessageDigest.getInstance("MD5");
        byte[] d = md.digest(s.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(32);
        for (byte b : d) sb.append(String.format("%02x", b & 0xff));
        return sb.toString();
    }

    /** POST a JSON body to the gateway; returns the raw response body. */
    public static String post(String ip, String path, String query, String bodyJson) throws Exception {
        String urlStr = "https://" + ip + path + (query != null && !query.isEmpty() ? "?" + query : "");
        HttpsURLConnection c = (HttpsURLConnection) new URL(urlStr).openConnection();
        c.setSSLSocketFactory(trustAllFactory());
        c.setHostnameVerifier(TRUST_ALL_HOST);
        c.setRequestMethod("POST");
        c.setConnectTimeout(TIMEOUT_MS);
        c.setReadTimeout(TIMEOUT_MS);
        c.setRequestProperty("Content-Type", "application/json");
        c.setRequestProperty("Accept", "application/json, text/plain, */*");
        c.setRequestProperty("X-Requested-With", "XMLHttpRequest");
        c.setRequestProperty("Origin", "https://" + ip);
        c.setRequestProperty("Referer", "https://" + ip + "/");
        c.setRequestProperty("User-Agent",
                "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36");
        byte[] bytes = bodyJson.getBytes(StandardCharsets.UTF_8);
        // Anti-bot headers required by newer firmware on /api/cmd
        // (verified against live ReyeeOS 2.390.1.1823).
        if (path != null && path.contains("/api/cmd")) {
            try {
                String bodyStr = new String(bytes, StandardCharsets.UTF_8);
                c.setRequestProperty("Content-Accept", md5Hex("Web@Rj$2020!" + bytes.length));
                c.setRequestProperty("Contents-Accept", md5Hex("Web@Rj$2020!" + bodyStr));
            } catch (Exception ignored) {}
        }
        c.setDoOutput(true);
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
        if (status < 200 || status >= 300) {
            throw new Exception("Gateway HTTP " + status + ": " + sb.toString().substring(0, Math.min(160, sb.length())));
        }
        java.util.List<String> cookies = c.getHeaderFields().get("Set-Cookie");
        lastCookies = (cookies != null) ? cookies : java.util.Collections.<String>emptyList();
        return sb.toString();
    }
}
