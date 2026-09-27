package com.ruijie.voucher.printer;

/**
 * Print design enums. Ported from printer-v1-fix1.2-p1994
 * (PrintDesignSettings.kt), behavior identical.
 */
public final class PrinterEnums {

    private PrinterEnums() {}

    public enum PrintAlignment {
        LEFT("Left"), CENTER("Center"), RIGHT("Right");

        public final String displayName;
        PrintAlignment(String displayName) { this.displayName = displayName; }

        public static PrintAlignment fromString(String value) {
            if (value != null) {
                for (PrintAlignment a : values()) {
                    if (a.name().equalsIgnoreCase(value)) return a;
                }
            }
            return LEFT;
        }
    }

    public enum AppFontWeight {
        REGULAR("Regular", 400),
        MEDIUM("Medium", 500),
        SEMI_BOLD("Semi Bold", 600),
        BOLD("Bold", 700);

        public final String displayName;
        public final int weightValue;
        AppFontWeight(String displayName, int weightValue) {
            this.displayName = displayName;
            this.weightValue = weightValue;
        }

        public static AppFontWeight fromString(String value) {
            if (value != null) {
                for (AppFontWeight w : values()) {
                    if (w.name().equalsIgnoreCase(value)) return w;
                }
            }
            return REGULAR;
        }
    }

    public enum AppFontStyle {
        NORMAL("Normal"), ITALIC("Italic");

        public final String displayName;
        AppFontStyle(String displayName) { this.displayName = displayName; }

        public static AppFontStyle fromString(String value) {
            if (value != null) {
                for (AppFontStyle s : values()) {
                    if (s.name().equalsIgnoreCase(value)) return s;
                }
            }
            return NORMAL;
        }
    }

    public enum AppFontFamily {
        DEFAULT("Default"), SANS_SERIF("Sans Serif"), SERIF("Serif"), MONOSPACE("Monospace");

        public final String displayName;
        AppFontFamily(String displayName) { this.displayName = displayName; }

        public static AppFontFamily fromString(String value) {
            if (value != null) {
                for (AppFontFamily f : values()) {
                    if (f.name().equalsIgnoreCase(value)) return f;
                }
            }
            return DEFAULT;
        }
    }

    public enum LetterSpacingMode {
        COMPACT("Compact", -0.03f),
        NORMAL("Normal", 0f),
        WIDE("Wide", 0.10f),
        CUSTOM("Custom", 0f);

        public final String displayName;
        public final float value;
        LetterSpacingMode(String displayName, float value) {
            this.displayName = displayName;
            this.value = value;
        }

        public static LetterSpacingMode fromString(String value) {
            if (value != null) {
                for (LetterSpacingMode m : values()) {
                    if (m.name().equalsIgnoreCase(value)) return m;
                }
            }
            return NORMAL;
        }
    }

    public enum TypographyPreset {
        DEFAULT("Default"),
        COMPACT("Compact"),
        BOLD_VOUCHER("Bold Voucher"),
        LARGE_VOUCHER("Large Voucher"),
        CUSTOM("Custom");

        public final String displayName;
        TypographyPreset(String displayName) { this.displayName = displayName; }

        public static TypographyPreset fromString(String value) {
            if (value != null) {
                for (TypographyPreset p : values()) {
                    if (p.name().equalsIgnoreCase(value)) return p;
                }
            }
            return DEFAULT;
        }
    }
}
