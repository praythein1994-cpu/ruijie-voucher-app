package com.ruijie.voucher;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Restarts background auto-kick after a reboot.
 *
 * A foreground service does not survive reboots on its own (unlike the
 * persisted JobScheduler job, which the system restores automatically).
 * If auto-kick was enabled, re-run AutoKick.schedule(), which starts the
 * foreground service — or falls back to the JobScheduler job when the
 * service cannot start from the background (Android 12+ restrictions).
 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String action = intent.getAction();
        if (!Intent.ACTION_BOOT_COMPLETED.equals(action)
                && !"android.intent.action.QUICKBOOT_POWERON".equals(action)) {
            return;
        }
        try {
            boolean enabled = context.getSharedPreferences(AutoKick.PREFS, Context.MODE_PRIVATE)
                    .getBoolean("enabled", false);
            if (enabled) {
                AutoKick.schedule(context.getApplicationContext());
            }
        } catch (Exception ignored) {}
    }
}
