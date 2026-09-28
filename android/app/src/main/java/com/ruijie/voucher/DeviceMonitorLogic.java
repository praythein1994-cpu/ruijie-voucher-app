package com.ruijie.voucher;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Pure device-offline detection logic - no Android imports, so it can be
 * unit-tested on a desktop JVM. Mirrors the web app's devStatus() rules.
 */
public class DeviceMonitorLogic {

    /** Minimal device snapshot used for transition detection. */
    public static class Device {
        public String key;    // serialNumber || mac
        public String name;   // aliasName || name || key
        public String type;   // commonType, upper-cased
        public boolean online;

        public Device(String key, String name, String type, boolean online) {
            this.key = key;
            this.name = name;
            this.type = type;
            this.online = online;
        }
    }

    /** Same truth table as js devStatus(): which raw statuses count as online. */
    public static boolean isOnline(String raw) {
        if (raw == null) return false;
        String v = raw.trim().toLowerCase();
        return v.equals("on") || v.equals("online") || v.equals("1")
                || v.equals("up") || v.equals("connected") || v.equals("normal");
    }

    /** The user asked for APs and Gateways. */
    public static boolean isMonitoredType(String commonType) {
        if (commonType == null) return false;
        String t = commonType.trim().toUpperCase();
        return t.equals("AP") || t.equals("GATEWAY");
    }

    public static String deviceKey(String serial, String mac) {
        if (serial != null && !serial.trim().isEmpty()) return serial.trim();
        if (mac != null && !mac.trim().isEmpty()) return mac.trim().toUpperCase();
        return "";
    }

    public static String deviceName(String alias, String name, String key) {
        if (alias != null && !alias.trim().isEmpty()) return alias.trim();
        if (name != null && !name.trim().isEmpty()) return name.trim();
        return key;
    }

    /**
     * Returns devices that transitioned online -> offline since the previous
     * run. Devices never seen before (prev == null) are NOT reported, so the
     * very first run never spams.
     */
    public static List<Device> newlyOffline(Map<String, Boolean> prev, List<Device> current) {
        List<Device> out = new ArrayList<>();
        if (prev == null || current == null) return out;
        for (Device d : current) {
            if (d.key == null || d.key.isEmpty()) continue;
            Boolean was = prev.get(d.key);
            if (was != null && was && !d.online) out.add(d);
        }
        return out;
    }

    /** Fold the current snapshot into the persisted state map. */
    public static Map<String, Boolean> foldState(Map<String, Boolean> prev, List<Device> current) {
        if (prev == null) prev = new java.util.HashMap<>();
        if (current == null) return prev;
        for (Device d : current) {
            if (d.key != null && !d.key.isEmpty()) prev.put(d.key, d.online);
        }
        return prev;
    }
}
