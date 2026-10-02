package com.ruijie.voucher.printer;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.os.Build;
import android.util.Log;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.locks.ReentrantLock;

/**
 * Bluetooth thermal-printer manager: discovery, RFCOMM/SPP connect,
 * connection health monitoring, single/batch/test voucher printing.
 *
 * Ported from printer-v1-fix1.2-p1994 (BluetoothPrinterManager.kt), behavior identical.
 * Kotlin coroutines are replaced by plain Java threads; StateFlow by volatile
 * fields. The print-history repository dependency is dropped (this app has no
 * print-history database); print behavior itself is unchanged.
 */
public class BluetoothPrinterManager {

    private static final String TAG = "BluetoothPrinterManager";
    private static final String PREFS_NAME = "printer_v1_device_prefs";
    private static final String KEY_LAST_DEVICE_ADDRESS = "key_last_device_address";
    private static final String KEY_LAST_DEVICE_NAME = "key_last_device_name";
    private static final String KEY_DEFAULT_DEVICE_ADDRESS = "key_default_device_address";
    private static final String KEY_DEFAULT_DEVICE_NAME = "key_default_device_name";
    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

    // Connection states (mirrors Kotlin sealed class PrinterConnectionState)
    public static final String STATE_DISCONNECTED = "DISCONNECTED";
    public static final String STATE_CONNECTING = "CONNECTING";
    public static final String STATE_CONNECTED = "CONNECTED";
    public static final String STATE_ERROR = "ERROR";

    /** Socket abstraction (mirrors Kotlin PrinterSocket). */
    public interface PrinterSocket {
        boolean isConnected();
        InputStream getInputStream() throws IOException;
        OutputStream getOutputStream() throws IOException;
        void close() throws IOException;
    }

    public static class RealBluetoothSocket implements PrinterSocket {
        private final BluetoothSocket socket;
        public RealBluetoothSocket(BluetoothSocket socket) { this.socket = socket; }
        @Override public boolean isConnected() { return socket.isConnected(); }
        @Override public InputStream getInputStream() throws IOException { return socket.getInputStream(); }
        @Override public OutputStream getOutputStream() throws IOException { return socket.getOutputStream(); }
        @Override public void close() throws IOException { socket.close(); }
    }

    /** Test seam (mirrors Kotlin socketFactory override). */
    public interface SocketFactory {
        PrinterSocket create(BluetoothDevice device) throws Exception;
    }

    public static class DiscoveredPrinter {
        public final String name;
        public final String address;
        public final boolean paired;
        public DiscoveredPrinter(String name, String address, boolean paired) {
            this.name = name; this.address = address; this.paired = paired;
        }
    }

    /** Voucher fields for printing (replaces RuijieVoucherItem dependency). */
    public static class VoucherData {
        public final String code;
        public final String profile;
        public final String period;
        public final String quota;
        public final String status;
        public VoucherData(String code, String profile, String period, String quota, String status) {
            this.code = code; this.profile = profile; this.period = period;
            this.quota = quota; this.status = status;
        }
    }

    private final Context appContext;
    private final SharedPreferences prefs;

    private final BluetoothManager bluetoothManager;
    private final BluetoothAdapter bluetoothAdapter;

    // State (replaces MutableStateFlow)
    private volatile String connState = STATE_DISCONNECTED;
    private volatile String connDeviceName;
    private volatile String connDeviceAddress;
    private volatile String connError;
    private final CopyOnWriteArrayList<DiscoveredPrinter> discoveredDevices = new CopyOnWriteArrayList<>();
    private volatile boolean scanning;

    // Batch print progress
    private volatile boolean printIsPrinting;
    private volatile int printCurrent;
    private volatile int printTotal;
    private volatile String printMessage = "";

    // Last async print result (JSON set by bg threads, consumed by bridge)
    private volatile String lastResultJson;

    private volatile PrinterSocket currentSocket;
    private volatile OutputStream outputStream;
    private volatile InputStream inputStream;
    private volatile String currentConnectedAddress;
    private volatile String currentConnectedName;

    private volatile Thread socketReaderThread;
    private volatile Thread healthCheckThread;
    private final ReentrantLock printMutex = new ReentrantLock();

    // Test overrides & configuration
    public volatile SocketFactory socketFactory;
    public volatile long healthCheckIntervalMs = 3000L;

    // Manual tap-to-connect only (V1 style) — no auto-connect, no backoff.
    private volatile boolean userInitiatedDisconnect = false;

    public BluetoothPrinterManager(Context context) {
        this.appContext = context.getApplicationContext();
        this.prefs = appContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        this.bluetoothManager = (BluetoothManager) appContext.getSystemService(Context.BLUETOOTH_SERVICE);
        this.bluetoothAdapter = bluetoothManager != null ? bluetoothManager.getAdapter() : null;
        registerConnectionReceiver();
        refreshPairedDevices();
    }

    /** True only for an explicit user disconnect. */
    public void setUserInitiatedDisconnect(boolean v) { userInitiatedDisconnect = v; }

    /** Live socket check so btState() never reports a stale CONNECTED. */
    public boolean isSocketAlive() {
        try {
            PrinterSocket s = currentSocket;
            return s != null && s.isConnected();
        } catch (Exception e) {
            return false;
        }
    }

    public boolean isBluetoothSupported() { return bluetoothAdapter != null; }

    public boolean isBluetoothEnabled() {
        try {
            return bluetoothAdapter != null && bluetoothAdapter.isEnabled();
        } catch (SecurityException e) {
            return false;
        }
    }

    public String getConnectionState() { return connState; }
    public String getConnectedDeviceName() { return connDeviceName; }
    public String getConnectedDeviceAddress() { return connDeviceAddress; }
    public String getConnectionError() { return connError; }
    public boolean isScanning() { return scanning; }
    public List<DiscoveredPrinter> getDiscoveredDevices() { return new ArrayList<>(discoveredDevices); }

    public boolean isPrintIsPrinting() { return printIsPrinting; }
    public int getPrintCurrent() { return printCurrent; }
    public int getPrintTotal() { return printTotal; }
    public String getPrintMessage() { return printMessage; }

    /** Returns and clears the last async print result JSON. */
    public String takeLastResult() {
        String r = lastResultJson;
        lastResultJson = null;
        return r;
    }

    private void setState(String state, String deviceName, String deviceAddress, String error) {
        connState = state;
        connDeviceName = deviceName;
        connDeviceAddress = deviceAddress;
        connError = error;
    }

    private void setLastResult(boolean ok, String message) {
        lastResultJson = "{\"ok\":" + ok + ",\"message\":" + jsonStr(message) + "}";
    }

    private static String jsonStr(String s) {
        if (s == null) return "null";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r") + "\"";
    }

    @SuppressLint("MissingPermission")
    private final BroadcastReceiver discoveryReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent intent) {
            String action = intent != null ? intent.getAction() : null;
            if (BluetoothDevice.ACTION_FOUND.equals(action)) {
                BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                if (device != null) {
                    String name;
                    try { name = device.getName(); } catch (SecurityException e) { name = null; }
                    if (name == null) name = "Bluetooth Device";
                    String address = device.getAddress();
                    boolean paired;
                    try { paired = device.getBondState() == BluetoothDevice.BOND_BONDED; }
                    catch (SecurityException e) { paired = false; }
                    boolean exists = false;
                    for (DiscoveredPrinter d : discoveredDevices) {
                        if (d.address.equals(address)) { exists = true; break; }
                    }
                    if (!exists) discoveredDevices.add(new DiscoveredPrinter(name, address, paired));
                }
            } else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action)) {
                scanning = false;
            }
        }
    };

    @SuppressLint("MissingPermission")
    private BluetoothDevice intentDevice(Intent intent) {
        if (intent == null) return null;
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                return intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice.class);
            } else {
                return intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
            }
        } catch (Exception e) {
            return null;
        }
    }

    @SuppressLint("MissingPermission")
    private final BroadcastReceiver connectionEventReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context c, Intent intent) {
            String action = intent != null ? intent.getAction() : null;
            if (action == null) return;
            if (BluetoothAdapter.ACTION_STATE_CHANGED.equals(action)) {
                int state = intent.getIntExtra(BluetoothAdapter.EXTRA_STATE, BluetoothAdapter.ERROR);
                if (state == BluetoothAdapter.STATE_TURNING_OFF || state == BluetoothAdapter.STATE_OFF) {
                    Log.i(TAG, "Bluetooth turned off broadcast received. Transitioning to Disconnected.");
                    handleConnectionLost("Bluetooth is turned off");
                }
            } else if (BluetoothDevice.ACTION_ACL_DISCONNECTED.equals(action)
                    || BluetoothDevice.ACTION_ACL_DISCONNECT_REQUESTED.equals(action)) {
                BluetoothDevice device = intentDevice(intent);
                String currentAddr = currentConnectedAddress;
                if (currentAddr != null && (device == null || currentAddr.equals(device.getAddress()))) {
                    Log.i(TAG, "ACL disconnected for connected device (" + currentAddr + "). Transitioning to Disconnected.");
                    handleConnectionLost("Bluetooth connection lost (Printer powered off or out of range)");
                }
            }
        }
    };

    private boolean connectionReceiverRegistered = false;
    private boolean discoveryReceiverRegistered = false;

    private void registerConnectionReceiver() {
        if (!connectionReceiverRegistered) {
            IntentFilter filter = new IntentFilter();
            filter.addAction(BluetoothAdapter.ACTION_STATE_CHANGED);
            filter.addAction(BluetoothDevice.ACTION_ACL_CONNECTED);
            filter.addAction(BluetoothDevice.ACTION_ACL_DISCONNECTED);
            filter.addAction(BluetoothDevice.ACTION_ACL_DISCONNECT_REQUESTED);
            try {
                appContext.registerReceiver(connectionEventReceiver, filter);
                connectionReceiverRegistered = true;
            } catch (Exception e) {
                Log.e(TAG, "Failed to register connection receiver", e);
            }
        }
    }

    private void unregisterConnectionReceiver() {
        if (connectionReceiverRegistered) {
            try { appContext.unregisterReceiver(connectionEventReceiver); } catch (Exception ignored) {}
            connectionReceiverRegistered = false;
        }
    }

    @SuppressLint("MissingPermission")
    public List<DiscoveredPrinter> refreshPairedDevices() {
        List<DiscoveredPrinter> paired = new ArrayList<>();
        try {
            Set<BluetoothDevice> bonded = bluetoothAdapter != null ? bluetoothAdapter.getBondedDevices() : null;
            if (bonded != null) {
                for (BluetoothDevice device : bonded) {
                    String name;
                    try { name = device.getName(); } catch (SecurityException e) { name = null; }
                    if (name == null) name = "Bluetooth Printer";
                    paired.add(new DiscoveredPrinter(name, device.getAddress(), true));
                }
            }
            discoveredDevices.clear();
            discoveredDevices.addAll(paired);
        } catch (Exception ignored) {}
        return paired;
    }

    @SuppressLint("MissingPermission")
    public void startScan() {
        if (!isBluetoothEnabled()) return;
        refreshPairedDevices();
        try {
            if (bluetoothAdapter.isDiscovering()) {
                try { bluetoothAdapter.cancelDiscovery(); } catch (Exception ignored) {}
            }
            IntentFilter filter = new IntentFilter();
            filter.addAction(BluetoothDevice.ACTION_FOUND);
            filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);
            try {
                appContext.registerReceiver(discoveryReceiver, filter);
                discoveryReceiverRegistered = true;
            } catch (Exception ignored) {}
            bluetoothAdapter.startDiscovery();
            scanning = true;
        } catch (Exception e) {
            scanning = false;
        }
    }

    @SuppressLint("MissingPermission")
    public void stopScan() {
        try {
            if (bluetoothAdapter != null && bluetoothAdapter.isDiscovering()) {
                bluetoothAdapter.cancelDiscovery();
            }
            if (discoveryReceiverRegistered) {
                appContext.unregisterReceiver(discoveryReceiver);
                discoveryReceiverRegistered = false;
            }
        } catch (Exception ignored) {
        } finally {
            scanning = false;
        }
    }

    /** Async connect by device address (runs on a background thread). */
    public void connectAsync(final String address) {
        userInitiatedDisconnect = false;
        Thread t = new Thread(() -> doConnect(address));
        t.setDaemon(true);
        t.start();
    }

    @SuppressLint("MissingPermission")
    private void doConnect(String address) {
        disconnectInternal();
        if (!isBluetoothEnabled()) {
            setState(STATE_ERROR, null, null, "Bluetooth is turned off. Please turn on Bluetooth.");
            setLastResult(false, "Bluetooth is turned off. Please turn on Bluetooth.");
            return;
        }
        BluetoothDevice device = findDevice(address);
        if (device == null) {
            setState(STATE_ERROR, null, null, "Device not found: " + address);
            setLastResult(false, "Device not found: " + address);
            return;
        }
        String deviceName;
        try { deviceName = device.getName(); } catch (SecurityException e) { deviceName = null; }
        if (deviceName == null) deviceName = "Thermal Printer";
        final String finalName = deviceName;

        setState(STATE_CONNECTING, finalName, address, null);

        try {
            if (bluetoothAdapter.isDiscovering()) {
                try { bluetoothAdapter.cancelDiscovery(); } catch (Exception ignored) {}
            }
            PrinterSocket socket;
            if (socketFactory != null) {
                socket = socketFactory.create(device);
            } else {
                BluetoothSocket rawSocket;
                try {
                    rawSocket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                } catch (Exception e) {
                    rawSocket = (BluetoothSocket) device.getClass()
                            .getMethod("createRfcommSocket", int.class)
                            .invoke(device, 1);
                }
                rawSocket.connect();
                socket = new RealBluetoothSocket(rawSocket);
            }

            if (!socket.isConnected()) throw new IOException("Socket reported not connected");

            currentSocket = socket;
            outputStream = socket.getOutputStream();
            inputStream = socket.getInputStream();
            currentConnectedAddress = address;
            currentConnectedName = finalName;

            prefs.edit()
                    .putString(KEY_LAST_DEVICE_ADDRESS, address)
                    .putString(KEY_LAST_DEVICE_NAME, finalName)
                    .apply();

            if (userInitiatedDisconnect) {
                // User tapped disconnect while this attempt was in flight.
                try { socket.close(); } catch (Exception ignored) {}
                setLastResult(false, "Disconnected by user");
                return;
            }
            setState(STATE_CONNECTED, finalName, address, null);
            setLastResult(true, "Connected to " + finalName);
            userInitiatedDisconnect = false;
            startContinuousMonitoring(socket);
        } catch (Exception e) {
            disconnectInternal();
            String msg = "Connection to " + finalName + " failed: "
                    + (e.getMessage() != null ? e.getMessage() : "Device unreachable");
            setState(STATE_ERROR, null, null, msg);
            setLastResult(false, msg);
        }
    }

    @SuppressLint("MissingPermission")
    private BluetoothDevice findDevice(String address) {
        try {
            Set<BluetoothDevice> bonded = bluetoothAdapter != null ? bluetoothAdapter.getBondedDevices() : null;
            if (bonded != null) {
                for (BluetoothDevice d : bonded) {
                    if (address.equals(d.getAddress())) return d;
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    public void handleConnectionLost(String reason) {
        Log.i(TAG, "handleConnectionLost: " + reason);
        stopContinuousMonitoring();
        try { if (outputStream != null) outputStream.close(); } catch (Exception ignored) {}
        try { if (inputStream != null) inputStream.close(); } catch (Exception ignored) {}
        try { if (currentSocket != null) currentSocket.close(); } catch (Exception ignored) {}
        outputStream = null;
        inputStream = null;
        currentSocket = null;
        currentConnectedAddress = null;
        currentConnectedName = null;
        if (!STATE_DISCONNECTED.equals(connState)) {
            setState(STATE_DISCONNECTED, null, null, null);
        }
    }

    /** Explicit user disconnect: never auto-reconnect afterwards. */
    public void userDisconnect() {
        userInitiatedDisconnect = true;
        disconnectInternal();
    }

    /** Internal teardown (connect retry, cleanup): keeps the user-disconnect flag as-is. */
    private void disconnectInternal() {
        handleConnectionLost("Internal disconnect");
    }

    public void disconnect() {
        userDisconnect();
    }

    public void cleanup() {
        stopScan();
        disconnect();
        unregisterConnectionReceiver();
    }

    private void startContinuousMonitoring(final PrinterSocket socket) {
        stopContinuousMonitoring();

        // 1. Socket InputStream reader: EOF (-1) / IOException means the printer went away.
        socketReaderThread = new Thread(() -> {
            try {
                InputStream in = socket.getInputStream();
                byte[] buffer = new byte[64];
                while (!Thread.currentThread().isInterrupted() && currentSocket == socket) {
                    int bytesRead;
                    try {
                        bytesRead = in.read(buffer);
                    } catch (IOException e) {
                        if (currentSocket == socket) {
                            Log.d(TAG, "Socket reader IOException: " + e.getMessage());
                            handleConnectionLost("Printer socket error: " + e.getMessage());
                        }
                        break;
                    }
                    if (bytesRead == -1) {
                        Log.d(TAG, "Socket reader hit EOF (-1). Remote printer disconnected.");
                        handleConnectionLost("Remote printer closed connection (EOF)");
                        break;
                    }
                    Log.d(TAG, "Received " + bytesRead + " bytes from printer");
                }
            } catch (Exception e) {
                if (currentSocket == socket) {
                    Log.d(TAG, "Socket reader Exception: " + e.getMessage());
                    handleConnectionLost("Printer communication interrupted: " + e.getMessage());
                }
            }
        });
        socketReaderThread.setDaemon(true);
        socketReaderThread.start();

        // 2. Active non-destructive health check: periodic DLE EOT 1 (0x10, 0x04, 0x01).
        // Does NOT print, feed, cut, or alter any configuration.
        healthCheckThread = new Thread(() -> {
            while (!Thread.currentThread().isInterrupted()
                    && currentSocket == socket
                    && STATE_CONNECTED.equals(connState)) {
                try {
                    Thread.sleep(healthCheckIntervalMs);
                } catch (InterruptedException e) {
                    break;
                }
                if (Thread.currentThread().isInterrupted() || currentSocket != socket) break;

                if (!isBluetoothEnabled()) {
                    Log.d(TAG, "Active health check: Bluetooth disabled.");
                    handleConnectionLost("Bluetooth is turned off");
                    break;
                }
                if (!socket.isConnected()) {
                    Log.d(TAG, "Active health check: Socket reported disconnected.");
                    handleConnectionLost("Printer socket disconnected");
                    break;
                }
                if (printMutex.tryLock()) {
                    try {
                        OutputStream stream = outputStream;
                        if (stream != null) {
                            stream.write(new byte[]{0x10, 0x04, 0x01});
                            stream.flush();
                        } else {
                            handleConnectionLost("Printer output stream closed");
                            break;
                        }
                    } catch (IOException e) {
                        Log.d(TAG, "Active health check ping failed: " + e.getMessage());
                        handleConnectionLost("Printer became unreachable: " + e.getMessage());
                        break;
                    } catch (Exception e) {
                        Log.d(TAG, "Active health check error: " + e.getMessage());
                        handleConnectionLost("Printer error: " + e.getMessage());
                        break;
                    } finally {
                        printMutex.unlock();
                    }
                }
            }
        });
        healthCheckThread.setDaemon(true);
        healthCheckThread.start();
    }

    private void stopContinuousMonitoring() {
        Thread r = socketReaderThread;
        socketReaderThread = null;
        if (r != null) r.interrupt();
        Thread h = healthCheckThread;
        healthCheckThread = null;
        if (h != null) h.interrupt();
    }

    public String getLastPrinterName() { return prefs.getString(KEY_LAST_DEVICE_NAME, null); }
    public String getLastPrinterAddress() { return prefs.getString(KEY_LAST_DEVICE_ADDRESS, null); }

    /** Explicitly chosen default printer (user tapped "Set as Default"). */
    public void setDefaultPrinter(String address, String name) {
        prefs.edit()
                .putString(KEY_DEFAULT_DEVICE_ADDRESS, address)
                .putString(KEY_DEFAULT_DEVICE_NAME, name)
                .apply();
        Log.i(TAG, "Default printer set: " + name + " (" + address + ")");
    }
    public void clearDefaultPrinter() {
        prefs.edit()
                .remove(KEY_DEFAULT_DEVICE_ADDRESS)
                .remove(KEY_DEFAULT_DEVICE_NAME)
                .apply();
        Log.i(TAG, "Default printer cleared");
    }
    public String getDefaultPrinterAddress() { return prefs.getString(KEY_DEFAULT_DEVICE_ADDRESS, null); }
    public String getDefaultPrinterName() { return prefs.getString(KEY_DEFAULT_DEVICE_NAME, null); }

    // ── Printing ─────────────────────────────────────────────────────

    private boolean checkReadyForPrint() {
        if (!isBluetoothEnabled()) {
            handleConnectionLost("Bluetooth is turned off");
            setLastResult(false, "Bluetooth is turned off. Please turn on Bluetooth and connect the printer.");
            return false;
        }
        PrinterSocket socket = currentSocket;
        OutputStream stream = outputStream;
        if (socket == null || stream == null || !socket.isConnected()
                || !STATE_CONNECTED.equals(connState)) {
            handleConnectionLost("Printer is not connected");
            setLastResult(false, "Bluetooth printer is disconnected.");
            return false;
        }
        return true;
    }

    private String nowDateTime() {
        return new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(new Date());
    }

    /** v1.5.60: dashed tear-off guide line between vouchers.
     *  Printed as one text line: exactly one line of paper, identical to
     *  feedPaper(1). So betweenSpacing=0 + tear line == betweenSpacing=1,
     *  and for N>=1 the line replaces one blank feed (zero extra paper). */
    private void printTearLine(EscPosPrinter escPos, PaperConfiguration paperConfig, int betweenSpacing) {
        int pairs = Math.max(8, paperConfig.widthDots / 24); // 16 for 58mm, 24 for 80mm
        StringBuilder sb = new StringBuilder(pairs * 2);
        for (int i = 0; i < pairs; i++) sb.append("- ");
        escPos.printTextLine(sb.toString().trim());
        int rest = Math.max(0, betweenSpacing - 1);
        if (rest > 0) escPos.feedPaper(rest);
        escPos.flush();
    }

    /** Async single-voucher print (background thread). */
    public void printSingleAsync(final VoucherData voucher, final PrintDesignSettings settings,
                                 final PaperConfiguration paperConfig, final String siteName,
                                 final int copies) {
        Thread t = new Thread(() -> {
            if (!checkReadyForPrint()) return;
            printMutex.lock();
            try {
                OutputStream stream = outputStream;
                EscPosPrinter escPos = new EscPosPrinter(stream);
                String printDateTime = nowDateTime();
                android.graphics.Bitmap bitmap = PrintRenderer.renderVoucher(
                        voucher.code, voucher.profile, voucher.period, voucher.quota, voucher.status,
                        settings, paperConfig, siteName, printDateTime, true);

                int n = Math.max(1, copies);
                for (int copyIndex = 0; copyIndex < n; copyIndex++) {
                    if (currentSocket == null || !currentSocket.isConnected()) {
                        handleConnectionLost("Printer disconnected during print");
                        setLastResult(false, "Bluetooth printer disconnected during printing.");
                        return;
                    }
                    escPos.initialize();
                    escPos.printRasterBitmap(bitmap);
                    escPos.feedPaper(3);
                    escPos.flush();

                    if (copyIndex < n - 1) {
                        int betweenSpacing = Math.max(0, Math.min(8, settings.betweenVoucherSpacing));
                        if (settings.tearLine) {
                            printTearLine(escPos, paperConfig, betweenSpacing);
                        } else if (betweenSpacing > 0) {
                            escPos.feedPaper(betweenSpacing);
                            escPos.flush();
                        }
                        try { Thread.sleep(300); } catch (InterruptedException ie) { return; }
                    }
                }
                setLastResult(true, "Printed " + voucher.code);
            } catch (Exception e) {
                handleConnectionLost("Printer disconnected during print: " + e.getMessage());
                setLastResult(false, "Bluetooth printer disconnected during printing.");
            } finally {
                printMutex.unlock();
            }
        });
        t.setDaemon(true);
        t.start();
    }

    /** Async batch print with progress (background thread). */
    public void printBatchAsync(final List<VoucherData> vouchers, final PrintDesignSettings settings,
                                final PaperConfiguration paperConfig, final String siteName,
                                final int copiesPerVoucher) {
        Thread t = new Thread(() -> {
            if (!checkReadyForPrint()) return;
            int copies = Math.max(1, copiesPerVoucher);
            final int totalJobs = vouchers.size() * copies;
            int printedJobs = 0;

            printIsPrinting = true;
            printCurrent = 0;
            printTotal = totalJobs;
            printMessage = "Printing 0 / " + totalJobs + "...";

            printMutex.lock();
            try {
                OutputStream stream = outputStream;
                EscPosPrinter escPos = new EscPosPrinter(stream);
                String printDateTime = nowDateTime();

                for (VoucherData voucher : vouchers) {
                    android.graphics.Bitmap bitmap = PrintRenderer.renderVoucher(
                            voucher.code, voucher.profile, voucher.period, voucher.quota, voucher.status,
                            settings, paperConfig, siteName, printDateTime, true);

                    for (int c = 0; c < copies; c++) {
                        if (currentSocket == null || !currentSocket.isConnected()) {
                            handleConnectionLost("Printer disconnected during print");
                            setLastResult(false, "Bluetooth printer disconnected during printing.");
                            return;
                        }
                        escPos.initialize();
                        escPos.printRasterBitmap(bitmap);
                        escPos.feedPaper(3);
                        escPos.flush();

                        printedJobs++;
                        printCurrent = printedJobs;
                        printMessage = "Printing " + printedJobs + " / " + totalJobs + "...";

                        int betweenSpacing = Math.max(0, Math.min(8, settings.betweenVoucherSpacing));
                        if (printedJobs < totalJobs) {
                            if (settings.tearLine) {
                                printTearLine(escPos, paperConfig, betweenSpacing);
                            } else if (betweenSpacing > 0) {
                                escPos.feedPaper(betweenSpacing);
                                escPos.flush();
                            }
                        }
                        try { Thread.sleep(350); } catch (InterruptedException ie) { return; }
                    }
                }
                setLastResult(true, "Printed " + printedJobs + " / " + totalJobs);
            } catch (Exception e) {
                handleConnectionLost("Printer disconnected during print: " + e.getMessage());
                setLastResult(false, "Bluetooth printer disconnected during printing.");
            } finally {
                printMutex.unlock();
                printIsPrinting = false;
                printCurrent = printedJobs;
                printTotal = totalJobs;
            }
        });
        t.setDaemon(true);
        t.start();
    }

    /** Async test receipt print (background thread). */
    public void printTestAsync(final PrintDesignSettings settings, final String siteName) {
        final VoucherData test = new VoucherData("8A7K29PD", "Cloud Voucher", "3 Hours", "1 GB", "Not Used");
        printSingleAsync(test, settings, PaperConfiguration.STANDARD_58MM, siteName, 1);
    }
}
