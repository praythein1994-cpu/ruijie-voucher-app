package com.ruijie.voucher;

import android.util.Base64;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;

/**
 * Password encryption compatible with the gateway eWeb login page, which
 * uses Gibberish-AES v1.0.0 ("OpenSSL compatible AES CBC encryption"):
 *   GibberishAES.enc(plaintext, passphrase)
 *
 * Wire format (matches the captured login request's pwd field):
 *   Base64("Salted__" + salt[8] + AES-256-CBC(plaintext))
 * Key derivation: OpenSSL EVP_BytesToKey — D_i = MD5(D_{i-1} + passphrase
 * + salt), 1 iteration, 48 bytes out (32-byte key + 16-byte IV).
 * A fresh random salt is generated per call, so every encryption of the
 * same password yields different (but equally valid) ciphertext.
 */
public class GatewayCrypto {

    /**
     * Encrypt plaintext exactly like GibberishAES.enc(plaintext, passphrase).
     */
    public static String gibberishAesEnc(String plaintext, String passphrase) throws Exception {
        byte[] salt = new byte[8];
        new SecureRandom().nextBytes(salt);

        byte[] passBytes = passphrase.getBytes(StandardCharsets.UTF_8);
        MessageDigest md5 = MessageDigest.getInstance("MD5");
        byte[] dx = new byte[0];
        byte[] keyIv = new byte[0];
        while (keyIv.length < 48) {
            md5.reset();
            md5.update(dx);
            md5.update(passBytes);
            md5.update(salt);
            dx = md5.digest();
            byte[] grown = new byte[keyIv.length + dx.length];
            System.arraycopy(keyIv, 0, grown, 0, keyIv.length);
            System.arraycopy(dx, 0, grown, keyIv.length, dx.length);
            keyIv = grown;
        }
        byte[] key = Arrays.copyOfRange(keyIv, 0, 32);
        byte[] iv = Arrays.copyOfRange(keyIv, 32, 48);

        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(key, "AES"), new IvParameterSpec(iv));
        byte[] ct = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));

        byte[] header = "Salted__".getBytes(StandardCharsets.US_ASCII);
        byte[] out = new byte[header.length + salt.length + ct.length];
        System.arraycopy(header, 0, out, 0, header.length);
        System.arraycopy(salt, 0, out, header.length, salt.length);
        System.arraycopy(ct, 0, out, header.length + salt.length, ct.length);
        return Base64.encodeToString(out, Base64.NO_WRAP);
    }

    /**
     * Firmware key-seed, byte-identical to the value embedded in the
     * gateway eWeb bundle, whose key derivation is:
     *   var Zt = (window.sctM || "Rj")
     *          + GibberishAES.dec("<seed>", "web").replace(/\s+/g, "");
     * The runtime password key is "Rj" + whitespace-stripped decrypted
     * seed (window.sctM is undefined in the app, so the bundle's "Rj"
     * default applies). The seed is stored encrypted, exactly as the
     * firmware ships it; the working key is derived at runtime and never
     * hardcoded.
     */
    private static final String GW_KEY_SEED_ENC =
            "U2FsdGVkX1+gwUMwIGpcEXYLnXoVg7IcwccoiHU1dfI=";

    /**
     * Derive the gateway login password key exactly like the eWeb bundle.
     * Matches: (window.sctM || "Rj") + dec(seed,"web").replace(/\s+/g,"").
     */
    public static String gatewayPasswordKey() throws Exception {
        String inner = gibberishAesDec(GW_KEY_SEED_ENC, "web").replaceAll("\\s+", "");
        if (inner.isEmpty()) throw new Exception("empty gateway key seed");
        return "Rj" + inner;
    }

    /**
     * Decrypt (for self-test only): verifies our encryption round-trips
     * and matches the OpenSSL format.
     */
    public static String gibberishAesDec(String b64, String passphrase) throws Exception {
        byte[] raw = Base64.decode(b64, Base64.DEFAULT);
        if (raw.length < 16 || !"Salted__".equals(new String(raw, 0, 8, StandardCharsets.US_ASCII)))
            throw new Exception("not Salted__ format");
        byte[] salt = Arrays.copyOfRange(raw, 8, 16);
        byte[] ct = Arrays.copyOfRange(raw, 16, raw.length);
        byte[] passBytes = passphrase.getBytes(StandardCharsets.UTF_8);
        MessageDigest md5 = MessageDigest.getInstance("MD5");
        byte[] dx = new byte[0];
        byte[] keyIv = new byte[0];
        while (keyIv.length < 48) {
            md5.reset();
            md5.update(dx);
            md5.update(passBytes);
            md5.update(salt);
            dx = md5.digest();
            byte[] grown = new byte[keyIv.length + dx.length];
            System.arraycopy(keyIv, 0, grown, 0, keyIv.length);
            System.arraycopy(dx, 0, grown, keyIv.length, dx.length);
            keyIv = grown;
        }
        Cipher cipher = Cipher.getInstance("AES/CBC/PKCS5Padding");
        cipher.init(Cipher.DECRYPT_MODE,
                new SecretKeySpec(Arrays.copyOfRange(keyIv, 0, 32), "AES"),
                new IvParameterSpec(Arrays.copyOfRange(keyIv, 32, 48)));
        return new String(cipher.doFinal(ct), StandardCharsets.UTF_8);
    }
}
