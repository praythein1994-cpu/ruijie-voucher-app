package com.ruijie.voucher;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.JsResult;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;

/**
 * Hosts the Ruijie Voucher web app (bundled in assets/www) in a WebView.
 * The RuijieBridge JS interface gives the page native HTTPS access
 * (no CORS inside native code, so no proxy server is needed) and
 * native Android printing for the thermal-printer ticket layout.
 */
public class MainActivity extends Activity {

    private WebView webView;
    private RuijieBridge bridge;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        setContentView(webView);

        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);          // localStorage for credentials/settings
        s.setLoadWithOverviewMode(true);
        s.setUseWideViewPort(true);
        s.setBuiltInZoomControls(false);
        s.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(bridge = new RuijieBridge(this, webView), "RuijieBridge");

        // JS alert()/confirm() need a WebChromeClient — without it, confirm()
        // silently returns false and the delete / sign-out flows do nothing.
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsAlert(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton(android.R.string.ok, (d, w) -> result.confirm())
                        .setCancelable(false)
                        .show();
                return true;
            }

            @Override
            public boolean onJsConfirm(WebView view, String url, String message, final JsResult result) {
                new AlertDialog.Builder(MainActivity.this)
                        .setMessage(message)
                        .setPositiveButton(android.R.string.ok, (d, w) -> result.confirm())
                        .setNegativeButton(android.R.string.cancel, (d, w) -> result.cancel())
                        .setCancelable(false)
                        .show();
                return true;
            }
        });

        webView.loadUrl("file:///android_asset/www/index.html");

        // Bluetooth runtime permissions (API 31+) for the thermal-printer feature.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            String[] perms = new String[]{
                    android.Manifest.permission.BLUETOOTH_SCAN,
                    android.Manifest.permission.BLUETOOTH_CONNECT};
            boolean need = false;
            for (String p : perms) {
                if (checkSelfPermission(p) != PackageManager.PERMISSION_GRANTED) { need = true; break; }
            }
            if (need) requestPermissions(perms, 1001);
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        // System file-picker result for the diagnostics report save.
        if (requestCode == RuijieBridge.REQ_DIAG_SAVE && bridge != null) {
            bridge.onDiagSaveResult(resultCode, data);
        }
    }

    private long lastBackPress = 0;

    /**
     * Pure back-press decision — no Android dependencies, unit-testable.
     * Returns one of "close-modal", "go-back", "exit", "toast".
     * v1.5.70: an open modal (voucher preview, print layout, …) must close
     * on system back even when the WebView has no history (fresh launch →
     * tap voucher → back used to show the exit toast instead).
     */
    static String decideBackAction(boolean modalOpen, boolean canGoBack, long nowMs, long lastBackPressMs) {
        if (modalOpen) return "close-modal";
        if (canGoBack) return "go-back";
        if (nowMs - lastBackPressMs < 2000) return "exit";
        return "toast";
    }

    private void doExitBack() {
        super.onBackPressed();
    }

    @Override
    public void onBackPressed() {
        if (webView == null) {
            super.onBackPressed();
            return;
        }
        // Ask the page first: a modal closes on back regardless of history.
        // evaluateJavascript is async; the callback runs on the UI thread.
        final WebView wv = webView;
        wv.evaluateJavascript(
            "(function(){try{return (typeof anyModalOpen==='function'&&anyModalOpen())?'modal':'none';}catch(e){return 'none';}})()",
            value -> {
                boolean modalOpen = value != null && value.contains("modal");
                long now = System.currentTimeMillis();
                String action = decideBackAction(modalOpen, wv.canGoBack(), now, lastBackPress);
                if ("close-modal".equals(action)) {
                    wv.evaluateJavascript("try{closeAnyModal()}catch(e{})", null);
                } else if ("go-back".equals(action)) {
                    wv.goBack();
                } else if ("exit".equals(action)) {
                    doExitBack();
                } else {
                    lastBackPress = now;
                    android.widget.Toast.makeText(MainActivity.this, "ထွက်ရန် back ထပ်နှိပ်ပါ", android.widget.Toast.LENGTH_SHORT).show();
                }
            });
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("RuijieBridge");
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
