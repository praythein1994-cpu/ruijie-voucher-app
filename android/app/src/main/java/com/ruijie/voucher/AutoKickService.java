package com.ruijie.voucher;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

/**
 * Battery-heavy but RELIABLE background auto-kick (user choice 2026-10-08:
 * "battery ပိုစားတဲ့နည်းပဲရွေးမယ်" — reliability over battery).
 *
 * A foreground service with a persistent (non-swipeable) notification, so
 * Android keeps the process alive instead of deferring/killing it the way
 * JobScheduler jobs can be deferred. Each cycle runs
 * AutoKickJob.runKickOnce() on a worker thread, then reschedules using the
 * user-configured interval (Settings → auto-kick interval, min 1 minute),
 * read fresh every cycle so Settings changes apply live.
 *
 * START_STICKY: the system restarts the service if it gets killed.
 * JobScheduler remains as a fallback — see AutoKick.schedule(), which uses
 * the job when the foreground service cannot start (e.g. Android 12+
 * background-start restrictions).
 */
public class AutoKickService extends Service {

    /** Distinct from AutoKick.JOB_ID (7201) and the kick notifs (0xA1C4/5). */
    static final int NOTIF_ID = 7202;
    private static final String CHANNEL_ID = "autokick";

    private Handler handler;

    private final Runnable kickRunnable = new Runnable() {
        @Override public void run() {
            // Network I/O must stay off the main thread.
            new Thread(() -> {
                try {
                    AutoKickJob.runKickOnce(getApplicationContext());
                } catch (Exception ignored) { /* next cycle retries */ }
            }).start();
            // Fresh interval each cycle — honors Settings changes live.
            long nextMs = (long) AutoKick.getIntervalMin(getApplicationContext()) * 60 * 1000;
            try {
                handler.postDelayed(this, nextMs);
            } catch (Exception ignored) {}
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
        ensureChannel();
        // Must be called quickly after start (Android 8+ requirement).
        startForeground(NOTIF_ID, buildNotification());
        handler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        // (Re)start the loop; a repeat start just resets the timer so the
        // latest Settings interval applies immediately.
        try {
            if (handler == null) handler = new Handler(Looper.getMainLooper());
            handler.removeCallbacks(kickRunnable);
            handler.post(kickRunnable); // kick now, then every interval
        } catch (Exception ignored) {}
        return START_STICKY; // restart if the system kills us
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        // Task swiped away: START_STICKY asks the system to restart us;
        // belt-and-suspenders also re-request scheduling through AutoKick
        // (which re-starts the service or falls back to the job).
        try { AutoKick.schedule(getApplicationContext()); } catch (Exception ignored) {}
        super.onTaskRemoved(rootIntent);
    }

    @Override
    public void onDestroy() {
        try {
            if (handler != null) handler.removeCallbacks(kickRunnable);
        } catch (Exception ignored) {}
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) { return null; }

    private void ensureChannel() {
        if (Build.VERSION.SDK_INT < 26) return;
        try {
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID, "Auto-kick", NotificationManager.IMPORTANCE_LOW);
            ch.setDescription("Background auto-disconnect of spent voucher clients");
            nm.createNotificationChannel(ch);
        } catch (Exception ignored) {}
    }

    private Notification buildNotification() {
        Intent open = new Intent(this, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pi = PendingIntent.getActivity(this, 7202, open,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26
                ? new Notification.Builder(this, CHANNEL_ID)
                : new Notification.Builder(this);
        b.setContentTitle("P Manager Auto-Kick")
                .setContentText("Monitoring for expired voucher clients…")
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentIntent(pi)
                .setOngoing(true); // persistent — user can't swipe it away
        if (Build.VERSION.SDK_INT >= 31) {
            b.setForegroundServiceBehavior(Notification.FOREGROUND_SERVICE_IMMEDIATE);
        }
        return b.build();
    }
}
