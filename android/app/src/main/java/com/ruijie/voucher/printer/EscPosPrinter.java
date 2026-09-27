package com.ruijie.voucher.printer;

import android.graphics.Bitmap;

import com.ruijie.voucher.printer.PrinterEnums.PrintAlignment;

import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.nio.charset.Charset;

/**
 * Dedicated ESC/POS command layer for 58mm / 80mm thermal printers.
 *
 * Ported from printer-v1-fix1.2-p1994 (EscPosPrinter.kt), behavior identical.
 */
public class EscPosPrinter {

    private final OutputStream outputStream;
    private final Charset charset;

    public EscPosPrinter(OutputStream outputStream) {
        this.outputStream = outputStream;
        this.charset = Charset.forName("GBK"); // or UTF-8 / CP437 / ISO-8859-1
    }

    /** ESC @ (1B 40) - Initialize printer */
    public EscPosPrinter initialize() {
        write(new byte[]{0x1B, 0x40});
        return this;
    }

    /**
     * ESC a n (1B 61 n) - Select justification
     * 0: Left, 1: Center, 2: Right
     */
    public EscPosPrinter setAlignment(PrintAlignment alignment) {
        int code;
        switch (alignment) {
            case CENTER: code = 1; break;
            case RIGHT: code = 2; break;
            case LEFT:
            default: code = 0; break;
        }
        write(new byte[]{0x1B, 0x61, (byte) code});
        return this;
    }

    /** ESC E n (1B 45 n) - Turn emphasized mode on/off */
    public EscPosPrinter setBold(boolean bold) {
        write(new byte[]{0x1B, 0x45, (byte) (bold ? 1 : 0)});
        return this;
    }

    /** GS ! n (1D 21 n) - Select character size */
    public EscPosPrinter setTextSize(int widthMultiplier, int heightMultiplier) {
        int w = Math.max(0, Math.min(7, widthMultiplier - 1));
        int h = Math.max(0, Math.min(7, heightMultiplier - 1));
        int n = (w << 4) | h;
        write(new byte[]{0x1D, 0x21, (byte) n});
        return this;
    }

    /** LF (0A) - Print and line feed */
    public EscPosPrinter lineFeed(int lines) {
        int n = Math.max(1, lines);
        for (int i = 0; i < n; i++) write(new byte[]{0x0A});
        return this;
    }

    public EscPosPrinter lineFeed() {
        return lineFeed(1);
    }

    /** ESC d n (1B 64 n) - Print and feed n lines */
    public EscPosPrinter feedPaper(int lines) {
        if (lines > 0) {
            int n = Math.max(1, Math.min(255, lines));
            write(new byte[]{0x1B, 0x64, (byte) n});
        }
        return this;
    }

    public EscPosPrinter feedPaper() {
        return feedPaper(3);
    }

    /** Prints raw text with character encoding */
    public EscPosPrinter printText(String text) {
        write(text.getBytes(charset));
        return this;
    }

    public EscPosPrinter printTextLine(String text) {
        printText(text);
        lineFeed();
        return this;
    }

    /** Prints raster bit image using GS v 0 */
    public EscPosPrinter printRasterBitmap(Bitmap bitmap) {
        write(PrintRenderer.convertBitmapToEscPosRaster(bitmap));
        return this;
    }

    /**
     * GS V m (1D 56 00) - Partial/Full paper cut.
     * Safely executes without crashing if the printer does not have a cutter.
     */
    public EscPosPrinter cutPaper(boolean partial) {
        try {
            write(new byte[]{0x1D, 0x56, (byte) (partial ? 0x01 : 0x00)});
        } catch (Exception ignored) {
            // Safe fallback if cutting is unsupported
        }
        return this;
    }

    public void flush() {
        try {
            if (outputStream != null) outputStream.flush();
        } catch (Exception ignored) {}
    }

    private void write(byte[] bytes) {
        try {
            if (outputStream != null) outputStream.write(bytes);
        } catch (Exception ignored) {}
    }

    /**
     * Builds the complete ESC/POS byte sequence for a rendered voucher bitmap.
     */
    public static byte[] buildVoucherEscPosBytes(Bitmap bitmap, int feedLinesAfter) {
        ByteArrayOutputStream stream = new ByteArrayOutputStream();
        try {
            // 1. ESC @ (Initialize)
            stream.write(new byte[]{0x1B, 0x40});
            // 2. GS v 0 (Raster image)
            stream.write(PrintRenderer.convertBitmapToEscPosRaster(bitmap));
            // 3. ESC d n (Paper feed)
            if (feedLinesAfter > 0) {
                stream.write(new byte[]{0x1B, 0x64, (byte) feedLinesAfter});
            }
        } catch (Exception ignored) {}
        return stream.toByteArray();
    }
}
