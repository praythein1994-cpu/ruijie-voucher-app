package com.ruijie.voucher;

import android.app.Activity;
import android.app.Dialog;
import android.webkit.JavascriptInterface;

/**
 * JS bridge for the SSO login dialog's WebView, exposed as "SsoCover".
 * Gives the injected glassmorphism cover access to the encrypted
 * credential store and dialog control.
 *
 * Credential VALUES only cross this bridge when the cover needs them to
 * autofill the official Ruijie page (the requested remember/auto-login
 * feature). Nothing is logged; the password never leaves the device
 * except inside the official Ruijie login submission.
 */
public class SsoCoverBridge {
    private final Activity activity;
    private final Dialog dialog;
    private final SecureCredentialStore store;
    private final boolean[] fired;
    private final SsoSession.LoginCallback cb;

    public SsoCoverBridge(Activity activity, Dialog dialog, SecureCredentialStore store,
                          boolean[] fired, SsoSession.LoginCallback cb) {
        this.activity = activity;
        this.dialog = dialog;
        this.store = store;
        this.fired = fired;
        this.cb = cb;
    }

    /**
     * Cover preferences: {"hasCreds":bool,"email":"..","autoLogin":bool,
     * "rememberWanted":bool}. Never includes the password.
     */
    @JavascriptInterface
    public String getPrefs() {
        try {
            org.json.JSONObject r = new org.json.JSONObject();
            String j = store.loadJson();
            r.put("hasCreds", j != null);
            r.put("autoLogin", store.getAutoLogin());
            r.put("rememberWanted", store.getRememberWanted());
            r.put("email", j != null ? new org.json.JSONObject(j).optString("e", "") : "");
            return r.toString();
        } catch (Exception e) {
            return "{\"hasCreds\":false,\"autoLogin\":false,\"rememberWanted\":true,\"email\":\"\"}";
        }
    }

    /** {"email":"..","password":".."} or "null" — for autofilling the official page. */
    @JavascriptInterface
    public String getSavedCreds() {
        String j = store.loadJson();
        if (j == null) return "null";
        try {
            org.json.JSONObject o = new org.json.JSONObject(j);
            org.json.JSONObject r = new org.json.JSONObject();
            r.put("email", o.optString("e", ""));
            r.put("password", o.optString("p", ""));
            return r.toString();
        } catch (Exception e) {
            return "null";
        }
    }

    /** Persist credentials (Keystore-encrypted) and the auto-login flag. */
    @JavascriptInterface
    public boolean saveCreds(String email, String password, boolean autoLogin) {
        boolean ok = store.save(email == null ? "" : email, password == null ? "" : password);
        if (ok) store.setAutoLogin(autoLogin);
        return ok;
    }

    @JavascriptInterface
    public void setRememberWanted(boolean on) {
        store.setRememberWanted(on);
    }

    @JavascriptInterface
    public void clearCreds() {
        store.clear();
    }

    /** Dismiss the dialog as cancelled (cover's own close control). */
    @JavascriptInterface
    public void cancel() {
        activity.runOnUiThread(() -> {
            if (!fired[0]) {
                fired[0] = true;
                dialog.dismiss();
                cb.onCancel();
            }
        });
    }
}
