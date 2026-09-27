package com.ruijie.voucher.printer;

/**
 * Modular paper specification for thermal printers.
 * Default is 58mm (384 dots width).
 * Ready for 80mm (576 dots width) without modifying rendering code.
 *
 * Ported from printer-v1-fix1.2-p1994 (PaperConfiguration.kt), behavior identical.
 */
public class PaperConfiguration {

    public final int widthDots;
    public final int paperWidthMm;
    public final float printableWidthMm;
    public final int defaultDpi;

    public PaperConfiguration() {
        this(384, 58, 48f, 203);
    }

    public PaperConfiguration(int widthDots, int paperWidthMm, float printableWidthMm, int defaultDpi) {
        this.widthDots = widthDots;
        this.paperWidthMm = paperWidthMm;
        this.printableWidthMm = printableWidthMm;
        this.defaultDpi = defaultDpi;
    }

    public int getWidthBytes() {
        return (widthDots + 7) / 8;
    }

    public static final PaperConfiguration STANDARD_58MM = new PaperConfiguration(
            384, 58, 48f, 203);

    public static final PaperConfiguration STANDARD_80MM = new PaperConfiguration(
            576, 80, 72f, 203);
}
