package com.ruijie.voucher;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
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

        webView.addJavascriptInterface(new RuijieBridge(this, webView), "RuijieBridge");
        webView.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
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
