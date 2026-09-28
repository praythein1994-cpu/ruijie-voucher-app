package com.ruijie.voucher;

import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;

import org.json.JSONObject;

/** Schedules / cancels the periodic DeviceMonitorJob and owns its prefs. */
public class DeviceMonitor {

    public static final int JOB_ID = 7101;
    private static final long INTERVAL_MS = 15L * 60 * 1000; // JobScheduler minimum

    public static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(DeviceMonitorJob.PREFS, Context.MODE_PRIVATE);
    }

    public static void schedule(Context ctx) {
        try {
            JobScheduler js = ctx.getSystemService(JobScheduler.class);
            if (js == null) return;
            JobInfo job = new JobInfo.Builder(JOB_ID, new ComponentName(ctx, DeviceMonitorJob.class))
                    .setPeriodic(INTERVAL_MS)
                    .setPersisted(true) // survives reboot (needs RECEIVE_BOOT_COMPLETED)
                    .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY)
                    .build();
            js.schedule(job);
        } catch (Exception ignored) {}
    }

    public static void cancel(Context ctx) {
        try {
            JobScheduler js = ctx.getSystemService(JobScheduler.class);
            if (js != null) js.cancel(JOB_ID);
        } catch (Exception ignored) {}
    }

    public static boolean isScheduled(Context ctx) {
        try {
            JobScheduler js = ctx.getSystemService(JobScheduler.class);
            if (js == null) return false;
            for (JobInfo j : js.getAllPendingJobs()) {
                if (j.getId() == JOB_ID) return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    /** Save the Cloud connection the monitor should poll with. */
    public static void saveConfig(Context ctx, String cloud, String appid, String secret, long groupId) {
        prefs(ctx).edit()
                .putString("cloud", cloud == null ? "" : cloud)
                .putString("appid", appid == null ? "" : appid)
                .putString("secret", secret == null ? "" : secret)
                .putLong("groupId", groupId)
                .apply();
    }

    public static boolean hasConfig(Context ctx) {
        SharedPreferences p = prefs(ctx);
        return !p.getString("cloud", "").isEmpty()
                && !p.getString("appid", "").isEmpty()
                && !p.getString("secret", "").isEmpty()
                && p.getLong("groupId", 0) != 0;
    }

    public static JSONObject configJson(Context ctx) {
        SharedPreferences p = prefs(ctx);
        JSONObject o = new JSONObject();
        try {
            o.put("cloud", p.getString("cloud", ""));
            o.put("appid", p.getString("appid", ""));
            o.put("hasSecret", !p.getString("secret", "").isEmpty());
            o.put("groupId", p.getLong("groupId", 0));
        } catch (Exception ignored) {}
        return o;
    }
}
