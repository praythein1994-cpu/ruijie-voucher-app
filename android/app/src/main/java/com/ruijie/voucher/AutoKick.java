package com.ruijie.voucher;

import android.app.job.JobInfo;
import android.app.job.JobScheduler;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

/**
 * Background Auto-Kick (v1.5.66): disconnects quota-spent / time-expired
 * voucher clients even when the phone screen is off and the app is closed.
 *
 * Mirrors the DeviceMonitor (v1.5.52) pattern: a persisted JobScheduler job
 * (15 min — Android's minimum periodic interval) that runs AutoKickJob.
 * The Settings auto-kick toggle enables BOTH the in-app scan (while the app
 * is open) and this background job (screen off). Kick itself goes through
 * the SSO portal session, exactly like the manual Disconnect button —
 * the voucher is never deleted.
 */
public class AutoKick {

    public static final int JOB_ID = 7201;
    static final String PREFS = "autokick";
    static final String INTERVAL_MIN_KEY = "intervalMin";
    static final int DEFAULT_INTERVAL_MIN = 15;
    /** v1.5.116: user-configurable check interval (minutes, min 1).
     *  JobScheduler.setPeriodic() enforces a 15-minute minimum, so
     *  intervals under 15 use one-shot jobs that reschedule on each run. */
    public static int getIntervalMin(android.content.Context ctx) {
        try {
            return Math.max(1,
                    prefs(ctx).getInt(INTERVAL_MIN_KEY, DEFAULT_INTERVAL_MIN));
        } catch (Exception e) { return DEFAULT_INTERVAL_MIN; }
    }
    public static void setIntervalMin(android.content.Context ctx, int min) {
        int m = Math.max(1, min);
        try { prefs(ctx).edit().putInt(INTERVAL_MIN_KEY, m).apply(); } catch (Exception ignored) {}
        try {
            if (prefs(ctx).getBoolean("enabled", false)) schedule(ctx);
        } catch (Exception ignored) {}
    }
    private static long getIntervalMs(android.content.Context ctx) {
        return (long) getIntervalMin(ctx) * 60 * 1000;
    }
    /** Per-voucher kick cooldown — mirrors the in-app 5-minute cooldown. */
    static final long KICK_COOLDOWN_MS = 5L * 60 * 1000;

    public static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /**
     * Primary entry point (v1.5.204+): battery-heavy but RELIABLE foreground
     * service first (user choice 2026-10-08 — reliability over battery).
     * Falls back to the JobScheduler job when the foreground service cannot
     * start (e.g. Android 12+ background-start restrictions).
     */
    public static void schedule(Context ctx) {
        if (startForegroundService(ctx)) return;
        scheduleJob(ctx);
    }

    /** The old JobScheduler path — kept as the fallback, unchanged. */
    public static void scheduleJob(Context ctx) {
        try {
            JobScheduler js = ctx.getSystemService(JobScheduler.class);
            if (js == null) return;
            long intervalMs = getIntervalMs(ctx);
            JobInfo.Builder b = new JobInfo.Builder(JOB_ID,
                    new ComponentName(ctx, AutoKickJob.class))
                    .setPersisted(true) // survives reboot (needs RECEIVE_BOOT_COMPLETED)
                    .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY);
            if (intervalMs >= 15L * 60 * 1000) {
                b.setPeriodic(intervalMs); // efficient system-batched
            } else {
                // One-shot: rescheduled at the end of each run (see AutoKickJob).
                b.setMinimumLatency(intervalMs)
                 .setOverrideDeadline(intervalMs + 60 * 1000);
            }
            js.schedule(b.build());
        } catch (Exception ignored) {}
    }

    public static void cancel(Context ctx) {
        stopForegroundService(ctx);
        try {
            JobScheduler js = ctx.getSystemService(JobScheduler.class);
            if (js != null) js.cancel(JOB_ID);
        } catch (Exception ignored) {}
    }

    /** True when EITHER the foreground service is running or the fallback
     *  job is pending — the web UI uses this for the toggle status. */
    public static boolean isScheduled(Context ctx) {
        return isServiceRunning(ctx) || isJobScheduled(ctx);
    }

    /** Start the foreground service. Returns false when it cannot start
     *  (e.g. Android 12+ ForegroundServiceStartNotAllowedException from
     *  the background) — the caller then falls back to the job. */
    public static boolean startForegroundService(Context ctx) {
        try {
            Intent i = new Intent(ctx, AutoKickService.class);
            if (Build.VERSION.SDK_INT >= 26) ctx.startForegroundService(i);
            else ctx.startService(i);
            return true;
        } catch (Exception ignored) {
            return false;
        }
    }

    public static void stopForegroundService(Context ctx) {
        try { ctx.stopService(new Intent(ctx, AutoKickService.class)); }
        catch (Exception ignored) {}
    }

    public static boolean isServiceRunning(Context ctx) {
        try {
            android.app.ActivityManager am =
                    (android.app.ActivityManager) ctx.getSystemService(Context.ACTIVITY_SERVICE);
            if (am == null) return false;
            for (android.app.ActivityManager.RunningServiceInfo s
                    : am.getRunningServices(Integer.MAX_VALUE)) {
                if (AutoKickService.class.getName().equals(s.service.getClassName())) return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    private static boolean isJobScheduled(Context ctx) {
        try {
            JobScheduler js = ctx.getSystemService(JobScheduler.class);
            if (js == null) return false;
            for (JobInfo j : js.getAllPendingJobs()) {
                if (j.getId() == JOB_ID) return true;
            }
        } catch (Exception ignored) {}
        return false;
    }

    /** Save the Cloud connection the background kick polls with. */
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
}
