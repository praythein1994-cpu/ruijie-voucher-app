package com.ruijie.voucher;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Ruijie Cloud account credentials encrypted with an AES-256-GCM key held
 * in the Android Keystore. The key never leaves the Keystore; only the
 * (IV + ciphertext) blob is kept in private SharedPreferences.
 *
 * The key is NOT bound to user authentication: it must be usable for
 * silent auto-login without prompting. If the Keystore entry is ever
 * lost (rare), load() returns null and the user simply logs in again.
 */
public class SecureCredentialStore {
    private static final String PREFS = "ruijie_sso_secure";
    private static final String KEY_ALIAS = "ruijie_sso_key_v1";
    private static final String K_BLOB = "cred_blob";
    private static final String K_AUTOLOGIN = "auto_login";
    private static final String K_REMEMBER = "remember_wanted";
    private static final String ANDROID_KEYSTORE = "AndroidKeyStore";
    private static final int GCM_IV_LEN = 12;
    private static final int GCM_TAG_BITS = 128;

    private final Context ctx;

    public SecureCredentialStore(Context ctx) {
        this.ctx = ctx.getApplicationContext();
    }

    private SharedPreferences prefs() {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private SecretKey getOrCreateKey() throws Exception {
        KeyStore ks = KeyStore.getInstance(ANDROID_KEYSTORE);
        ks.load(null);
        SecretKey key = (SecretKey) ks.getKey(KEY_ALIAS, null);
        if (key != null) return key;
        KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE);
        KeyGenParameterSpec spec = new KeyGenParameterSpec.Builder(KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true)
                .build();
        kg.init(spec);
        return kg.generateKey();
    }

    /** Encrypt and save email+password. False when the Keystore is unusable. */
    public synchronized boolean save(String email, String password) {
        try {
            String json = "{\"e\":" + quote(email) + ",\"p\":" + quote(password) + "}";
            SecretKey key = getOrCreateKey();
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, key);
            byte[] iv = c.getIV();
            byte[] ct = c.doFinal(json.getBytes(StandardCharsets.UTF_8));
            byte[] blob = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, blob, 0, iv.length);
            System.arraycopy(ct, 0, blob, iv.length, ct.length);
            prefs().edit().putString(K_BLOB, Base64.encodeToString(blob, Base64.NO_WRAP)).apply();
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Decrypted {"e":email,"p":password} JSON, or null when nothing is
     * stored or the blob cannot be decrypted.
     */
    public synchronized String loadJson() {
        try {
            String b64 = prefs().getString(K_BLOB, null);
            if (b64 == null) return null;
            byte[] blob = Base64.decode(b64, Base64.NO_WRAP);
            if (blob.length <= GCM_IV_LEN) return null;
            byte[] iv = new byte[GCM_IV_LEN];
            byte[] ct = new byte[blob.length - GCM_IV_LEN];
            System.arraycopy(blob, 0, iv, 0, GCM_IV_LEN);
            System.arraycopy(blob, GCM_IV_LEN, ct, 0, ct.length);
            KeyStore ks = KeyStore.getInstance(ANDROID_KEYSTORE);
            ks.load(null);
            SecretKey key = (SecretKey) ks.getKey(KEY_ALIAS, null);
            if (key == null) return null;
            Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
            c.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(GCM_TAG_BITS, iv));
            return new String(c.doFinal(ct), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return null; // key lost or blob corrupt -> treat as "no saved account"
        }
    }

    public synchronized boolean has() {
        return loadJson() != null;
    }

    /** Forget the saved credentials (flags untouched). */
    public synchronized void clear() {
        prefs().edit().remove(K_BLOB).apply();
    }

    public synchronized void setAutoLogin(boolean on) {
        prefs().edit().putBoolean(K_AUTOLOGIN, on).apply();
    }

    public synchronized boolean getAutoLogin() {
        return prefs().getBoolean(K_AUTOLOGIN, false);
    }

    public synchronized void setRememberWanted(boolean on) {
        prefs().edit().putBoolean(K_REMEMBER, on).apply();
    }

    public synchronized boolean getRememberWanted() {
        return prefs().getBoolean(K_REMEMBER, true);
    }

    private static String quote(String s) {
        if (s == null) return "\"\"";
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", "\\n").replace("\r", "\\r") + "\"";
    }
}
