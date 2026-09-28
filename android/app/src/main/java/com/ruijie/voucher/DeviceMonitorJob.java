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
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

/**
 * Periodic background device-offline check (APs + Gateways).
 * Runs even when the app is closed; scheduled via JobScheduler (15 min,
 * persisted across reboots). Notifies once per online -> offline transition.
 */
public class DeviceMonitorJob extends JobService {

    static final String PREFS = "devmon";
    static final String CHANNEL_ID = "devmon_offline";
    private static final int NOTIF_ID_BASE = 0xD310; // distinct id per device key hash

    @Override
    public boolean onStartJob(JobParameters params) {
        new Thread(() -> {
            try {
                runCheckOnce(this);
            } catch (Exception ignored) {
            } finally {
                try { jobFinished(params, false); } catch (Exception ignored) {}
            }
        }).start();
        return true; // work continues on our thread
    }

    @Override
    public boolean onStopJob(JobParameters params) {
        return true; // reschedule if interrupted
    }

    /** One check cycle. Also called from RuijieBridge.monitorCheckNow(). */
    public static void runCheckOnce(Context ctx) {
        SharedPreferences p = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        if (!p.getBoolean("enabled", false)) return;
        String cloud = p.getString("cloud", "");
        String appid = p.getString("appid", "");
        String secret = p.getString("secret", "");
        long groupId = p.getLong("groupId", 0);
        if (cloud.isEmpty() || appid.isEmpty() || secret.isEmpty() || groupId == 0) return;

        JSONArray arr = new JSONArray();
        // Query AP and Gateway separately: common_type is mandatory, and a
        // per-type failure (e.g. Gateway 404 on some Cloud hosts) must not
        // kill the other type's check. Missing types simply contribute no
        // devices — newlyOffline() never alerts for absent devices.
        for (String t : new String[]{"AP", "GATEWAY"}) {
            try {
                JSONArray part = CloudApiClient.getDevices(cloud, appid, secret, groupId, t);
                for (int i = 0; i < part.length(); i++) arr.put(part.opt(i));
            } catch (Exception ignored) { /* per-type hiccup: stay silent */ }
        }

        List<DeviceMonitorLogic.Device> cur = new ArrayList<>();
        for (int i = 0; i < arr.length(); i++) {
            JSONObject d = arr.optJSONObject(i);
            if (d == null) continue;
            String type = d.optString("commonType", "");
            if (!DeviceMonitorLogic.isMonitoredType(type)) continue;
            String key = DeviceMonitorLogic.deviceKey(
                    d.optString("serialNumber", d.optString("sn", "")),
                    d.optString("mac", ""));
            if (key.isEmpty()) continue;
            String name = DeviceMonitorLogic.deviceName(
                    d.optString("aliasName", d.optString("alias", d.optString("deviceAliasName", ""))),
                    d.optString("name", ""), key);
            boolean online = DeviceMonitorLogic.isOnline(d.optString("onlineStatus", d.optString("status", "")));
            cur.add(new DeviceMonitorLogic.Device(key, name, type.trim().toUpperCase(), online));
        }

        Map<String, Boolean> prev = loadState(p);
        List<DeviceMonitorLogic.Device> off = DeviceMonitorLogic.newlyOffline(prev, cur);
        for (DeviceMonitorLogic.Device d : off) {
            notifyOffline(ctx, d);
        }
        saveState(p, DeviceMonitorLogic.foldState(prev, cur));
    }

    private static Map<String, Boolean> loadState(SharedPreferences p) {
        Map<String, Boolean> m = new HashMap<>();
        try {
            JSONObject o = new JSONObject(p.getString("lastState", "{}"));
            Iterator<String> it = o.keys();
            while (it.hasNext()) {
                String k = it.next();
                m.put(k, o.optBoolean(k, false));
            }
        } catch (Exception ignored) {}
        return m;
    }

    private static void saveState(SharedPreferences p, Map<String, Boolean> m) {
        try {
            JSONObject o = new JSONObject();
            for (Map.Entry<String, Boolean> e : m.entrySet()) o.put(e.getKey(), e.getValue());
            p.edit().putString("lastState", o.toString()).apply();
        } catch (Exception ignored) {}
    }

    private static void ensureChannel(Context ctx) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;
        NotificationChannel ch = nm.getNotificationChannel(CHANNEL_ID);
        if (ch != null) return;
        ch = new NotificationChannel(CHANNEL_ID, "Device offline alerts",
                NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Alerts when a monitored AP or Gateway goes offline");
        AudioAttributes aa = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
        ch.setSound(Uri.parse("android.resource://" + ctx.getPackageName() + "/" + R.raw.devmon_alert), aa);
        ch.enableVibration(true);
        nm.createNotificationChannel(ch);
    }

    private static void notifyOffline(Context ctx, DeviceMonitorLogic.Device d) {
        try {
            ensureChannel(ctx);
            NotificationManager nm = ctx.getSystemService(NotificationManager.class);
            if (nm == null) return;
            Intent open = new Intent(ctx, MainActivity.class);
            open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent pi = PendingIntent.getActivity(ctx, 0, open,
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            Bitmap large = null;
            try { large = BitmapFactory.decodeResource(ctx.getResources(), R.drawable.ic_devmon_circle); }
            catch (Exception ignored) {}
            String typeLabel = "GATEWAY".equals(d.type) ? "Gateway" : "AP";
            final Uri soundUri = Uri.parse("android.resource://" + ctx.getPackageName() + "/" + R.raw.devmon_alert);
            Notification.Builder b;
            if (Build.VERSION.SDK_INT >= 26) {
                b = new Notification.Builder(ctx, CHANNEL_ID);
            } else {
                // Pre-O: no channels; attach the sound directly.
                b = new Notification.Builder(ctx).setSound(soundUri);
            }
            b.setSmallIcon(R.drawable.ic_wifi_off)
                    .setContentTitle(typeLabel + " offline: " + d.name)
                    .setContentText(d.name + " (" + d.key + ") just went offline")
                    .setPriority(Notification.PRIORITY_HIGH)
                    .setCategory(Notification.CATEGORY_ALARM)
                    .setAutoCancel(true)
                    .setContentIntent(pi)
                    .setDefaults(Notification.DEFAULT_VIBRATE | Notification.DEFAULT_LIGHTS);
            if (large != null) b.setLargeIcon(large);
            if (Build.VERSION.SDK_INT >= 31) b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
            nm.notify(NOTIF_ID_BASE + Math.abs(d.key.hashCode() % 100000), b.build());
        } catch (Exception ignored) {}
    }
}
