package com.ruijie.voucher;

import android.app.job.JobParameters;
import android.app.job.JobService;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Background Auto-Kick (v1.5.66).
 *
 * A persisted JobScheduler job (every 15 min — Android's minimum periodic
 * interval) that disconnects quota-spent / time-expired voucher clients even
 * when the phone screen is off and the app is closed.
 *
 * Each run:
 *  1. Fetches all vouchers via the Cloud Open API (same call the web app
 *     uses: open/auth/voucher/getList/{groupId}).
 *  2. Finds SPENT vouchers: Cloud status "2" but quota fully used or hours
 *     fully used (missing usage is never guessed — same rule as the app).
 *  3. Resolves each spent voucher's portal auth record and kicks it through
 *     the SSO portal session (/samTransfer/kick/user/offline) — the exact
 *     envelope the manual Disconnect button uses. The voucher is NEVER
 *     deleted; only the client session is dropped.
 *  4. A per-voucher 5-minute cooldown (mirrors the in-app auto-kick) stops
 *     kick loops. A dead SSO session notifies at most once per 24h.
 */
public class AutoKickJob extends JobService {

    static final String CHANNEL_ID = "autokick";
    private static final int NOTIF_ID_KICKED = 0xA1C4;
    private static final int NOTIF_ID_SSO = 0xA1C5;
    private static final long SSO_WARN_TTL_MS = 24L * 3600 * 1000;
    private static final int AUTH_PAGE_SIZE = 1000;
    private static final int AUTH_MAX_PAGES = 5;

    @Override
    public boolean onStartJob(JobParameters params) {
        new Thread(() -> {
            try {
                runKickOnce(this);
            } catch (Exception ignored) {
            } finally {
                try { jobFinished(params, false); } catch (Exception ignored) {}
                // v1.5.116: chain the next one-shot run for sub-15-min intervals.
                try {
                    if (AutoKick.getIntervalMin(this) < 15) {
                        AutoKick.schedule(this);
                    }
                } catch (Exception ignored) {}
            }
        }).start();
        return true; // work continues on our thread
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        return true; // reschedule if interrupted
    }

    /** One kick cycle. Also called from RuijieBridge.autoKickNow(). */
    public static KickResult runKickOnce(Context ctx) {
        KickResult r = new KickResult();
        SharedPreferences p = AutoKick.prefs(ctx);
        if (!p.getBoolean("enabled", false)) return r;
        String cloud = p.getString("cloud", "");
        String appid = p.getString("appid", "");
        String secret = p.getString("secret", "");
        long groupId = p.getLong("groupId", 0);
        if (cloud.isEmpty() || appid.isEmpty() || secret.isEmpty() || groupId == 0) {
            r.error = "no-config";
            return r;
        }
        r.ran = true;
        JSONArray vouchers;
        try {
            vouchers = CloudApiClient.getVouchers(cloud, appid, secret, groupId);
        } catch (Exception e) {
            r.error = "vouchers";
            return r;
        }
        List<String> spent = new ArrayList<>();
        for (int i = 0; i < vouchers.length(); i++) {
            JSONObject v = vouchers.optJSONObject(i);
            if (v == null) continue;
            String code = v.optString("voucherCode", "").trim();
            if (!code.isEmpty() && isVoucherSpent(v)) spent.add(code);
        }
        r.spent = spent.size();
        if (spent.isEmpty()) return r;

        SsoSession sso = SsoSession.getInstance();
        boolean loggedIn;
        try { loggedIn = sso.isLoggedIn(); } catch (Exception e) { loggedIn = false; }
        if (!loggedIn) {
            warnSsoExpired(ctx, p);
            r.error = "sso";
            return r;
        }
        long now = System.currentTimeMillis();
        List<String> kickedCodes = new ArrayList<>();
        for (String code : spent) {
            if (!cooldownOk(p, code, now)) continue;
            try {
                JSONObject rec = findAuthRecord(sso, groupId, code);
                if (rec == null) continue; // no portal record — never kick blind
                String body = sso.webProxy("/samTransfer/kick/user/offline",
                        kickEnvelope(groupId, rec).toString());
                int c = new JSONObject(body).optInt("code", -1);
                if (c != 0) continue; // portal rejected — keep the voucher, try next cycle
                p.edit().putLong("kick_" + code, now).apply();
                kickedCodes.add(code);
            } catch (SecurityException se) {
                warnSsoExpired(ctx, p); // session died mid-run
                break;
            } catch (Exception ignored) { /* per-voucher hiccup: continue */ }
        }
        r.kicked = kickedCodes.size();
        if (!kickedCodes.isEmpty()) notifyKicked(ctx, kickedCodes);
        return r;
    }

    /** Result of one run (for the bridge "check now" path and tests). */
    public static class KickResult {
        public boolean ran = false;
        public int spent = 0;
        public int kicked = 0;
        public String error = "";
    }

    // ── Pure logic: unit-testable without network ────────────────────

    /** SPENT = Cloud still says "In use" (2) but quota or hours are fully used.
     *  Missing usage is never guessed (mirrors voucherQuotaGone/HoursGone). */
    static boolean isVoucherSpent(JSONObject v) {
        if (!"2".equals(v.optString("status", ""))) return false;
        return quotaGone(v) || hoursGone(v);
    }

    static boolean quotaGone(JSONObject v) {
        double q = v.optDouble("quota", 0), uq = v.optDouble("usedQuota", 0);
        return q > 0 && uq >= q;
    }

    static boolean hoursGone(JSONObject v) {
        double per = v.optDouble("timePeriod", 0), ut = v.optDouble("usedTime", 0);
        return per > 0 && ut >= per;
    }

    /** 5-minute per-voucher cooldown — mirrors the in-app auto-kick. */
    static boolean cooldownOk(SharedPreferences p, String code, long now) {
        long last = p.getLong("kick_" + code, 0);
        return now - last >= AutoKick.KICK_COOLDOWN_MS;
    }

    /**
     * The kick envelope, field-identical to the web app's ssoKickEnvelope()
     * (verified 2026-09-29 from the portal's own Disconnect request):
     * params is an OBJECT {group_id, account, auth_type:"15", mac
     * (dotted-lowercase), id}; auth_type "15" = Voucher.
     */
    static JSONObject kickEnvelope(long groupId, JSONObject rec) throws Exception {
        String api = "/samTransfer/kick/user/offline";
        JSONObject env = new JSONObject();
        env.put("api", api);
        JSONObject authParams = new JSONObject();
        authParams.put("api", api);
        authParams.put("method", "POST");
        env.put("authParams", authParams);
        env.put("method", "POST");
        env.put("module", "default");
        JSONObject params = new JSONObject();
        params.put("group_id", groupId);
        params.put("account", rec.optString("account", ""));
        String authType = rec.optString("authType", "");
        if (authType.isEmpty()) authType = rec.optString("auth_type", "");
        params.put("auth_type", authType);
        String mac = rec.optString("userMac", "");
        if (mac.isEmpty()) mac = rec.optString("mac", "");
        params.put("mac", mac.toLowerCase());
        params.put("id", rec.optLong("id", 0));
        env.put("params", params);
        JSONObject querys = new JSONObject();
        querys.put("lang", "en");
        querys.put("cloudType", "smb");
        env.put("querys", querys);
        return env;
    }

    /** Find the portal auth record for a voucher code (exact account match,
     *  like the web app's kickAuthRecord). Never returns a record without
     *  id + account — the caller must never kick blind. */
    static JSONObject findAuthRecord(SsoSession sso, long groupId, String code) {
        String apiPath = "/samTransfer/authuserinfos/bypage?cloudType=smb";
        long fetched = 0;
        try {
            for (int page = 1; page <= AUTH_MAX_PAGES; page++) {
                JSONObject env = new JSONObject();
                env.put("api", apiPath);
                env.put("method", "POST");
                env.put("module", "default");
                JSONObject params = new JSONObject();
                params.put("group_id", groupId);
                params.put("page", page);
                params.put("size", AUTH_PAGE_SIZE);
                env.put("params", params);
                JSONObject querys = new JSONObject();
                querys.put("lang", "en");
                env.put("querys", querys);
                String body = sso.webProxy(apiPath, env.toString());
                JSONObject j = new JSONObject(body);
                if (j.optInt("code", -1) != 0) return null;
                JSONObject data = j.optJSONObject("data");
                JSONObject res = data != null ? data.optJSONObject("result") : null;
                if (res == null) return null;
                JSONArray list = res.optJSONArray("list");
                if (list == null) return null;
                for (int i = 0; i < list.length(); i++) {
                    JSONObject rec = list.optJSONObject(i);
                    if (rec == null) continue;
                    if (code.equals(rec.optString("account", "").trim())
                            && rec.optLong("id", 0) != 0
                            && !rec.optString("account", "").isEmpty()) {
                        return rec;
                    }
                }
                fetched += list.length();
                long total = res.optLong("total", fetched);
                if (list.length() == 0 || fetched >= total) break;
            }
        } catch (SecurityException se) {
            throw se; // dead session — let the caller warn
        } catch (Exception ignored) { /* best effort */ }
        return null;
    }

    // ── Notifications ────────────────────────────────────────────────

    private static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        try {
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm == null) return;
            if (nm.getNotificationChannel(CHANNEL_ID) != null) return;
            NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "Auto-kick",
                    NotificationManager.IMPORTANCE_DEFAULT);
            ch.setDescription("Background auto-disconnect of spent voucher clients");
            nm.createNotificationChannel(ch);
        } catch (Exception ignored) {}
    }

    private static PendingIntent openApp(Context ctx, int req) {
        Intent open = new Intent(ctx, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(ctx, req, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static void notifyKicked(Context ctx, List<String> codes) {
        try {
            ensureChannel(ctx);
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm == null) return;
            int n = codes.size();
            Notification.Builder b = Build.VERSION.SDK_INT >= 26
                    ? new Notification.Builder(ctx, CHANNEL_ID)
                    : new Notification.Builder(ctx);
            b.setSmallIcon(android.R.drawable.ic_lock_power_off)
                    .setContentTitle("Auto-kick: " + n + (n == 1 ? " client" : " clients") + " disconnected")
                    .setContentText("Quota/time-spent voucher clients were auto-disconnected")
                    .setAutoCancel(true)
                    .setContentIntent(openApp(ctx, 7201));
            if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
            nm.notify(NOTIF_ID_KICKED, b.build());
        } catch (Exception ignored) {}
    }

    /** Dead SSO session: tell the user to open the app and log in again,
     *  at most once per 24h so a dead session doesn't spam every 15 min. */
    private static void warnSsoExpired(Context ctx, SharedPreferences p) {
        try {
            long now = System.currentTimeMillis();
            if (now - p.getLong("lastSsoWarn", 0) < SSO_WARN_TTL_MS) return;
            p.edit().putLong("lastSsoWarn", now).apply();
            ensureChannel(ctx);
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm == null) return;
            Notification.Builder b = Build.VERSION.SDK_INT >= 26
                    ? new Notification.Builder(ctx, CHANNEL_ID)
                    : new Notification.Builder(ctx);
            b.setSmallIcon(android.R.drawable.ic_dialog_alert)
                    .setContentTitle("Auto-kick paused: Ruijie session expired")
                    .setContentText("Open the app and log in again to keep background auto-kick working")
                    .setAutoCancel(true)
                    .setContentIntent(openApp(ctx, 7202));
            if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
            nm.notify(NOTIF_ID_SSO, b.build());
        } catch (Exception ignored) {}
    }
}
