package com.ruijie.voucher.printer;

import com.ruijie.voucher.printer.PrinterEnums.AppFontFamily;
import com.ruijie.voucher.printer.PrinterEnums.AppFontStyle;
import com.ruijie.voucher.printer.PrinterEnums.AppFontWeight;
import com.ruijie.voucher.printer.PrinterEnums.LetterSpacingMode;
import com.ruijie.voucher.printer.PrinterEnums.PrintAlignment;
import com.ruijie.voucher.printer.PrinterEnums.TypographyPreset;

import org.json.JSONArray;
import org.json.JSONObject;

/**
 * Customizable print layout and typography settings for thermal voucher slips.
 * Default values preserve the standard 58mm PP583 thermal printer layout.
 *
 * Ported from printer-v1-fix1.2-p1994 (PrintDesignSettings.kt), behavior identical.
 * Kotlin data-class copy() is mirrored by {@link #copy()}.
 */
public class PrintDesignSettings {

    /** One user-defined free-text line (label + value, independently editable). */
    public static class CustomLine {
        public String label = "";
        public String value = "";
        public float fontSize = 20f;
        public boolean bold = false;
        public PrintAlignment alignment = PrintAlignment.LEFT;
        public float dxMm = 0f; // v1.5.58: free horizontal nudge in mm (+right / -left)

        public CustomLine() {}

        public CustomLine copy() {
            CustomLine c = new CustomLine();
            c.label = label;
            c.value = value;
            c.fontSize = fontSize;
            c.bold = bold;
            c.alignment = alignment;
            c.dxMm = dxMm;
            return c;
        }
    }

    // 1. Voucher Code
    public boolean showVoucherCode;
    public float codeFontSize;
    public boolean codeBold;
    public AppFontWeight codeFontWeight;
    public AppFontStyle codeFontStyle;
    public PrintAlignment codeAlignment;
    public boolean codeSpaced;
    public long codeColor;
    public boolean showCodeLabel;
    public String codeLabelText;

    // 2. Profile Name
    public boolean showProfileName;
    public float profileNameFontSize;
    public boolean profileNameBold;
    public AppFontWeight profileNameFontWeight;
    public AppFontStyle profileNameFontStyle;
    public PrintAlignment profileNameAlignment;
    public boolean showProfileNameLabel;
    public String profileNameLabelText;
    public long profileNameColor;

    // 3. Period
    public boolean showPeriod;
    public float periodFontSize;
    public boolean periodBold;
    public AppFontWeight periodFontWeight;
    public AppFontStyle periodFontStyle;
    public PrintAlignment periodAlignment;
    public boolean showPeriodLabel;
    public String periodLabelText;
    public long periodColor;

    // 4. Quota
    public boolean showQuota;
    public float quotaFontSize;
    public boolean quotaBold;
    public AppFontWeight quotaFontWeight;
    public AppFontStyle quotaFontStyle;
    public PrintAlignment quotaAlignment;
    public boolean showQuotaLabel;
    public String quotaLabelText;
    public long quotaColor;

    // 5. Header (Customer / Site / Brand Name)
    public boolean showHeader;
    public float headerFontSize;
    public boolean headerBold;
    public AppFontWeight headerFontWeight;
    public AppFontStyle headerFontStyle;
    public PrintAlignment headerAlignment;
    public String headerSeparator;
    public String customHeaderName;
    public long headerColor;

    // 6. Inside Voucher Spacing
    public int insideVoucherSpacing;

    // 7. Between Voucher Blank-Line Spacing
    public int betweenVoucherSpacing;
    // 7b. v1.5.60: tear-off guide line between vouchers + middle divider on docked rows
    public boolean tearLine;
    public boolean midDivider;

    // 8. Print Date/Time
    public boolean showPrintDateTime;
    public float printDateTimeFontSize;
    public boolean printDateTimeBold;
    public AppFontWeight printDateTimeFontWeight;
    public AppFontStyle printDateTimeFontStyle;
    public PrintAlignment printDateTimeAlignment;
    public long printDateTimeColor;
    public boolean showPrintDateTimeLabel;
    public String printDateTimeLabelText;

    // 9. Status
    public boolean showStatus;
    public float statusFontSize;
    public boolean statusBold;
    public AppFontWeight statusFontWeight;
    public AppFontStyle statusFontStyle;
    public PrintAlignment statusAlignment;
    public long statusColor;

    // 10. Global Font Family
    public AppFontFamily fontFamily;

    // 11. Letter Spacing
    public LetterSpacingMode letterSpacingMode;
    public float customLetterSpacing;

    // 12. Line Spacing (extra pixels)
    public float lineSpacingExtra;

    // 13. Text Shadow
    public boolean textShadowEnabled;
    public long shadowColor;
    public float shadowOpacity;
    public float shadowBlur;
    public float shadowOffsetX;
    public float shadowOffsetY;

    // 14. Text Outline / Stroke
    public boolean textOutlineEnabled;
    public long outlineColor;
    public float outlineWidth;

    // 15. Active Preset
    public TypographyPreset activePreset;

    // 16. Custom free-text lines (max 5; rendered after profile, before period)
    public java.util.List<CustomLine> customLines;

    public PrintDesignSettings() {
        showVoucherCode = true;
        codeFontSize = 28f;
        codeBold = false;
        codeFontWeight = AppFontWeight.REGULAR;
        codeFontStyle = AppFontStyle.NORMAL;
        codeAlignment = PrintAlignment.LEFT;
        codeSpaced = true;
        codeColor = 0xFF000000L;
        showCodeLabel = false;
        codeLabelText = "Voucher Code";

        showProfileName = true;
        profileNameFontSize = 24f;
        profileNameBold = false;
        profileNameFontWeight = AppFontWeight.REGULAR;
        profileNameFontStyle = AppFontStyle.NORMAL;
        profileNameAlignment = PrintAlignment.LEFT;
        showProfileNameLabel = true;
        profileNameLabelText = "Profile Name";
        profileNameColor = 0xFF000000L;

        showPeriod = true;
        periodFontSize = 24f;
        periodBold = false;
        periodFontWeight = AppFontWeight.REGULAR;
        periodFontStyle = AppFontStyle.NORMAL;
        periodAlignment = PrintAlignment.LEFT;
        showPeriodLabel = true;
        periodLabelText = "Period";
        periodColor = 0xFF000000L;

        showQuota = false;
        quotaFontSize = 24f;
        quotaBold = false;
        quotaFontWeight = AppFontWeight.REGULAR;
        quotaFontStyle = AppFontStyle.NORMAL;
        quotaAlignment = PrintAlignment.LEFT;
        showQuotaLabel = true;
        quotaLabelText = "Quota";
        quotaColor = 0xFF000000L;

        showHeader = true;
        headerFontSize = 26f;
        headerBold = false;
        headerFontWeight = AppFontWeight.REGULAR;
        headerFontStyle = AppFontStyle.NORMAL;
        headerAlignment = PrintAlignment.LEFT;
        headerSeparator = " - ";
        customHeaderName = "";
        headerColor = 0xFF000000L;

        insideVoucherSpacing = 0;
        betweenVoucherSpacing = 1;
        tearLine = false;
        midDivider = false;

        showPrintDateTime = false;
        printDateTimeFontSize = 20f;
        printDateTimeBold = false;
        printDateTimeFontWeight = AppFontWeight.REGULAR;
        printDateTimeFontStyle = AppFontStyle.NORMAL;
        printDateTimeAlignment = PrintAlignment.LEFT;
        printDateTimeColor = 0xFF000000L;
        showPrintDateTimeLabel = false;
        printDateTimeLabelText = "Print Date/Time";

        showStatus = false;
        statusFontSize = 20f;
        statusBold = false;
        statusFontWeight = AppFontWeight.REGULAR;
        statusFontStyle = AppFontStyle.NORMAL;
        statusAlignment = PrintAlignment.LEFT;
        statusColor = 0xFF000000L;

        fontFamily = AppFontFamily.DEFAULT;

        letterSpacingMode = LetterSpacingMode.NORMAL;
        customLetterSpacing = 0f;

        lineSpacingExtra = 0f;

        textShadowEnabled = false;
        shadowColor = 0x88000000L;
        shadowOpacity = 0.5f;
        shadowBlur = 3f;
        shadowOffsetX = 2f;
        shadowOffsetY = 2f;

        textOutlineEnabled = false;
        outlineColor = 0xFF000000L;
        outlineWidth = 1f;

        activePreset = TypographyPreset.DEFAULT;
        customLines = new java.util.ArrayList<>();
    }

    /** Backwards-compatibility aliases (mirrors Kotlin val lineSpacing / blankLines). */
    public int getLineSpacing() { return insideVoucherSpacing; }
    public int getBlankLines() { return betweenVoucherSpacing; }

    /** Field-by-field copy (mirrors Kotlin data-class copy()). */
    public PrintDesignSettings copy() {
        PrintDesignSettings c = new PrintDesignSettings();
        c.showVoucherCode = showVoucherCode;
        c.codeFontSize = codeFontSize;
        c.codeBold = codeBold;
        c.codeFontWeight = codeFontWeight;
        c.codeFontStyle = codeFontStyle;
        c.codeAlignment = codeAlignment;
        c.codeSpaced = codeSpaced;
        c.codeColor = codeColor;
        c.showCodeLabel = showCodeLabel;
        c.codeLabelText = codeLabelText;
        c.showProfileName = showProfileName;
        c.profileNameFontSize = profileNameFontSize;
        c.profileNameBold = profileNameBold;
        c.profileNameFontWeight = profileNameFontWeight;
        c.profileNameFontStyle = profileNameFontStyle;
        c.profileNameAlignment = profileNameAlignment;
        c.showProfileNameLabel = showProfileNameLabel;
        c.profileNameLabelText = profileNameLabelText;
        c.profileNameColor = profileNameColor;
        c.showPeriod = showPeriod;
        c.periodFontSize = periodFontSize;
        c.periodBold = periodBold;
        c.periodFontWeight = periodFontWeight;
        c.periodFontStyle = periodFontStyle;
        c.periodAlignment = periodAlignment;
        c.showPeriodLabel = showPeriodLabel;
        c.periodLabelText = periodLabelText;
        c.periodColor = periodColor;
        c.showQuota = showQuota;
        c.quotaFontSize = quotaFontSize;
        c.quotaBold = quotaBold;
        c.quotaFontWeight = quotaFontWeight;
        c.quotaFontStyle = quotaFontStyle;
        c.quotaAlignment = quotaAlignment;
        c.showQuotaLabel = showQuotaLabel;
        c.quotaLabelText = quotaLabelText;
        c.quotaColor = quotaColor;
        c.showHeader = showHeader;
        c.headerFontSize = headerFontSize;
        c.headerBold = headerBold;
        c.headerFontWeight = headerFontWeight;
        c.headerFontStyle = headerFontStyle;
        c.headerAlignment = headerAlignment;
        c.headerSeparator = headerSeparator;
        c.customHeaderName = customHeaderName;
        c.headerColor = headerColor;
        c.insideVoucherSpacing = insideVoucherSpacing;
        c.betweenVoucherSpacing = betweenVoucherSpacing;
        c.tearLine = tearLine;
        c.midDivider = midDivider;
        c.showPrintDateTime = showPrintDateTime;
        c.printDateTimeFontSize = printDateTimeFontSize;
        c.printDateTimeBold = printDateTimeBold;
        c.printDateTimeFontWeight = printDateTimeFontWeight;
        c.printDateTimeFontStyle = printDateTimeFontStyle;
        c.printDateTimeAlignment = printDateTimeAlignment;
        c.printDateTimeColor = printDateTimeColor;
        c.showPrintDateTimeLabel = showPrintDateTimeLabel;
        c.printDateTimeLabelText = printDateTimeLabelText;
        c.showStatus = showStatus;
        c.statusFontSize = statusFontSize;
        c.statusBold = statusBold;
        c.statusFontWeight = statusFontWeight;
        c.statusFontStyle = statusFontStyle;
        c.statusAlignment = statusAlignment;
        c.statusColor = statusColor;
        c.fontFamily = fontFamily;
        c.letterSpacingMode = letterSpacingMode;
        c.customLetterSpacing = customLetterSpacing;
        c.lineSpacingExtra = lineSpacingExtra;
        c.textShadowEnabled = textShadowEnabled;
        c.shadowColor = shadowColor;
        c.shadowOpacity = shadowOpacity;
        c.shadowBlur = shadowBlur;
        c.shadowOffsetX = shadowOffsetX;
        c.shadowOffsetY = shadowOffsetY;
        c.textOutlineEnabled = textOutlineEnabled;
        c.outlineColor = outlineColor;
        c.outlineWidth = outlineWidth;
        c.activePreset = activePreset;
        c.customLines = new java.util.ArrayList<>();
        if (customLines != null) {
            for (CustomLine cl : customLines) c.customLines.add(cl == null ? new CustomLine() : cl.copy());
        }
        return c;
    }

    /** Resets all custom colors back to pure default black. */
    public PrintDesignSettings resetColors() {
        PrintDesignSettings c = copy();
        c.codeColor = 0xFF000000L;
        c.profileNameColor = 0xFF000000L;
        c.periodColor = 0xFF000000L;
        c.quotaColor = 0xFF000000L;
        c.headerColor = 0xFF000000L;
        c.printDateTimeColor = 0xFF000000L;
        c.statusColor = 0xFF000000L;
        c.shadowColor = 0x88000000L;
        c.outlineColor = 0xFF000000L;
        return c;
    }

    /** Applies a standard typography preset (mirrors Kotlin applyPreset). */
    public PrintDesignSettings applyPreset(TypographyPreset preset) {
        PrintDesignSettings c = copy();
        c.activePreset = preset;
        switch (preset) {
            case DEFAULT:
                c.codeFontSize = 28f; c.codeBold = false; c.codeFontWeight = AppFontWeight.REGULAR;
                c.profileNameFontSize = 24f; c.profileNameBold = false; c.profileNameFontWeight = AppFontWeight.REGULAR;
                c.periodFontSize = 24f; c.periodBold = false;
                c.headerFontSize = 26f; c.headerBold = false;
                c.printDateTimeFontSize = 20f; c.statusFontSize = 20f;
                c.letterSpacingMode = LetterSpacingMode.NORMAL; c.customLetterSpacing = 0f;
                c.lineSpacingExtra = 0f; c.textShadowEnabled = false; c.textOutlineEnabled = false;
                break;
            case COMPACT:
                c.codeFontSize = 22f; c.codeBold = false; c.codeFontWeight = AppFontWeight.REGULAR;
                c.profileNameFontSize = 20f; c.profileNameBold = false; c.profileNameFontWeight = AppFontWeight.REGULAR;
                c.periodFontSize = 20f; c.periodBold = false;
                c.headerFontSize = 22f; c.headerBold = false;
                c.printDateTimeFontSize = 18f; c.statusFontSize = 18f;
                c.letterSpacingMode = LetterSpacingMode.COMPACT; c.customLetterSpacing = -0.03f;
                c.lineSpacingExtra = 0f; c.textShadowEnabled = false; c.textOutlineEnabled = false;
                break;
            case BOLD_VOUCHER:
                c.codeFontSize = 32f; c.codeBold = true; c.codeFontWeight = AppFontWeight.BOLD;
                c.profileNameFontSize = 24f; c.profileNameBold = true; c.profileNameFontWeight = AppFontWeight.SEMI_BOLD;
                c.periodFontSize = 24f; c.periodBold = false;
                c.headerFontSize = 28f; c.headerBold = true; c.headerFontWeight = AppFontWeight.BOLD;
                c.printDateTimeFontSize = 20f; c.statusFontSize = 20f;
                c.letterSpacingMode = LetterSpacingMode.NORMAL; c.lineSpacingExtra = 2f;
                break;
            case LARGE_VOUCHER:
                c.codeFontSize = 36f; c.codeBold = true; c.codeFontWeight = AppFontWeight.BOLD;
                c.profileNameFontSize = 28f; c.profileNameBold = true; c.profileNameFontWeight = AppFontWeight.MEDIUM;
                c.periodFontSize = 26f; c.periodBold = false;
                c.headerFontSize = 30f; c.headerBold = true; c.headerFontWeight = AppFontWeight.BOLD;
                c.printDateTimeFontSize = 22f; c.statusFontSize = 22f;
                c.letterSpacingMode = LetterSpacingMode.WIDE; c.lineSpacingExtra = 4f;
                break;
            case CUSTOM:
                break;
        }
        return c;
    }

    public String toJson() {
        try {
            JSONObject obj = new JSONObject();
            obj.put("showVoucherCode", showVoucherCode);
            obj.put("codeFontSize", (double) codeFontSize);
            obj.put("codeBold", codeBold);
            obj.put("codeFontWeight", codeFontWeight.name());
            obj.put("codeFontStyle", codeFontStyle.name());
            obj.put("codeAlignment", codeAlignment.name());
            obj.put("codeSpaced", codeSpaced);
            obj.put("codeColor", codeColor);
            obj.put("showCodeLabel", showCodeLabel);
            obj.put("codeLabelText", codeLabelText);

            obj.put("showProfileName", showProfileName);
            obj.put("profileNameFontSize", (double) profileNameFontSize);
            obj.put("profileNameBold", profileNameBold);
            obj.put("profileNameFontWeight", profileNameFontWeight.name());
            obj.put("profileNameFontStyle", profileNameFontStyle.name());
            obj.put("profileNameAlignment", profileNameAlignment.name());
            obj.put("showProfileNameLabel", showProfileNameLabel);
            obj.put("profileNameLabelText", profileNameLabelText);
            obj.put("profileNameColor", profileNameColor);

            obj.put("showPeriod", showPeriod);
            obj.put("periodFontSize", (double) periodFontSize);
            obj.put("periodBold", periodBold);
            obj.put("periodFontWeight", periodFontWeight.name());
            obj.put("periodFontStyle", periodFontStyle.name());
            obj.put("periodAlignment", periodAlignment.name());
            obj.put("showPeriodLabel", showPeriodLabel);
            obj.put("periodLabelText", periodLabelText);
            obj.put("periodColor", periodColor);

            obj.put("showQuota", showQuota);
            obj.put("quotaFontSize", (double) quotaFontSize);
            obj.put("quotaBold", quotaBold);
            obj.put("quotaFontWeight", quotaFontWeight.name());
            obj.put("quotaFontStyle", quotaFontStyle.name());
            obj.put("quotaAlignment", quotaAlignment.name());
            obj.put("showQuotaLabel", showQuotaLabel);
            obj.put("quotaLabelText", quotaLabelText);
            obj.put("quotaColor", quotaColor);

            obj.put("showHeader", showHeader);
            obj.put("headerFontSize", (double) headerFontSize);
            obj.put("headerBold", headerBold);
            obj.put("headerFontWeight", headerFontWeight.name());
            obj.put("headerFontStyle", headerFontStyle.name());
            obj.put("headerAlignment", headerAlignment.name());
            obj.put("headerSeparator", headerSeparator);
            obj.put("customHeaderName", customHeaderName);
            obj.put("headerColor", headerColor);

            obj.put("insideVoucherSpacing", insideVoucherSpacing);
            obj.put("betweenVoucherSpacing", betweenVoucherSpacing);
            obj.put("tearLine", tearLine);
            obj.put("midDivider", midDivider);

            obj.put("showPrintDateTime", showPrintDateTime);
            obj.put("printDateTimeFontSize", (double) printDateTimeFontSize);
            obj.put("printDateTimeBold", printDateTimeBold);
            obj.put("printDateTimeFontWeight", printDateTimeFontWeight.name());
            obj.put("printDateTimeFontStyle", printDateTimeFontStyle.name());
            obj.put("printDateTimeAlignment", printDateTimeAlignment.name());
            obj.put("printDateTimeColor", printDateTimeColor);
            obj.put("showPrintDateTimeLabel", showPrintDateTimeLabel);
            obj.put("printDateTimeLabelText", printDateTimeLabelText);

            obj.put("showStatus", showStatus);
            obj.put("statusFontSize", (double) statusFontSize);
            obj.put("statusBold", statusBold);
            obj.put("statusFontWeight", statusFontWeight.name());
            obj.put("statusFontStyle", statusFontStyle.name());
            obj.put("statusAlignment", statusAlignment.name());
            obj.put("statusColor", statusColor);

            obj.put("fontFamily", fontFamily.name());
            obj.put("letterSpacingMode", letterSpacingMode.name());
            obj.put("customLetterSpacing", (double) customLetterSpacing);
            obj.put("lineSpacingExtra", (double) lineSpacingExtra);

            obj.put("textShadowEnabled", textShadowEnabled);
            obj.put("shadowColor", shadowColor);
            obj.put("shadowOpacity", (double) shadowOpacity);
            obj.put("shadowBlur", (double) shadowBlur);
            obj.put("shadowOffsetX", (double) shadowOffsetX);
            obj.put("shadowOffsetY", (double) shadowOffsetY);

            obj.put("textOutlineEnabled", textOutlineEnabled);
            obj.put("outlineColor", outlineColor);
            obj.put("outlineWidth", (double) outlineWidth);

            obj.put("activePreset", activePreset.name());

            JSONArray cla = new JSONArray();
            if (customLines != null) {
                for (CustomLine cl : customLines) {
                    if (cl == null) continue;
                    JSONObject o = new JSONObject();
                    o.put("label", cl.label == null ? "" : cl.label);
                    o.put("value", cl.value == null ? "" : cl.value);
                    o.put("fontSize", (double) cl.fontSize);
                    o.put("bold", cl.bold);
                    o.put("alignment", cl.alignment == null ? "LEFT" : cl.alignment.name());
                    o.put("dxMm", (double) cl.dxMm);
                    cla.put(o);
                }
            }
            obj.put("customLines", cla);
            return obj.toString();
        } catch (Exception e) {
            return "{}";
        }
    }

    public static PrintDesignSettings fromJson(String jsonStr) {
        if (jsonStr == null || jsonStr.trim().isEmpty()) return new PrintDesignSettings();
        try {
            JSONObject obj = new JSONObject(jsonStr);
            PrintDesignSettings s = new PrintDesignSettings();

            int inside;
            if (obj.has("insideVoucherSpacing")) inside = obj.optInt("insideVoucherSpacing", 0);
            else inside = obj.optInt("lineSpacing", 0);
            s.insideVoucherSpacing = Math.max(0, Math.min(4, inside));

            int between;
            if (obj.has("betweenVoucherSpacing")) between = obj.optInt("betweenVoucherSpacing", 1);
            else if (obj.has("blankLines")) between = obj.optInt("blankLines", 1);
            else between = 1;
            s.betweenVoucherSpacing = Math.max(0, Math.min(8, between));
            s.tearLine = obj.optBoolean("tearLine", false);
            s.midDivider = obj.optBoolean("midDivider", false);

            boolean codeB = obj.optBoolean("codeBold", false);
            boolean profB = obj.optBoolean("profileNameBold", false);
            boolean perB = obj.optBoolean("periodBold", false);
            boolean quoB = obj.optBoolean("quotaBold", false);
            boolean headB = obj.optBoolean("headerBold", false);
            boolean dtB = obj.optBoolean("printDateTimeBold", false);
            boolean stB = obj.optBoolean("statusBold", false);

            s.showVoucherCode = obj.optBoolean("showVoucherCode", true);
            s.codeFontSize = (float) obj.optDouble("codeFontSize", 28.0);
            s.codeBold = codeB;
            s.codeFontWeight = obj.has("codeFontWeight") ? AppFontWeight.fromString(obj.optString("codeFontWeight"))
                    : (codeB ? AppFontWeight.BOLD : AppFontWeight.REGULAR);
            s.codeFontStyle = AppFontStyle.fromString(obj.optString("codeFontStyle", "NORMAL"));
            s.codeAlignment = PrintAlignment.fromString(obj.optString("codeAlignment", "LEFT"));
            s.codeSpaced = obj.optBoolean("codeSpaced", true);
            s.codeColor = obj.optLong("codeColor", 0xFF000000L);
            s.showCodeLabel = obj.optBoolean("showCodeLabel", false);
            s.codeLabelText = obj.optString("codeLabelText", "Voucher Code");

            s.showProfileName = obj.optBoolean("showProfileName", true);
            s.profileNameFontSize = (float) obj.optDouble("profileNameFontSize", 24.0);
            s.profileNameBold = profB;
            s.profileNameFontWeight = obj.has("profileNameFontWeight") ? AppFontWeight.fromString(obj.optString("profileNameFontWeight"))
                    : (profB ? AppFontWeight.BOLD : AppFontWeight.REGULAR);
            s.profileNameFontStyle = AppFontStyle.fromString(obj.optString("profileNameFontStyle", "NORMAL"));
            s.profileNameAlignment = PrintAlignment.fromString(obj.optString("profileNameAlignment", "LEFT"));
            s.showProfileNameLabel = obj.optBoolean("showProfileNameLabel", true);
            s.profileNameLabelText = obj.optString("profileNameLabelText", "Profile Name");
            s.profileNameColor = obj.optLong("profileNameColor", 0xFF000000L);

            s.showPeriod = obj.optBoolean("showPeriod", true);
            s.periodFontSize = (float) obj.optDouble("periodFontSize", 24.0);
            s.periodBold = perB;
            s.periodFontWeight = obj.has("periodFontWeight") ? AppFontWeight.fromString(obj.optString("periodFontWeight"))
                    : (perB ? AppFontWeight.BOLD : AppFontWeight.REGULAR);
            s.periodFontStyle = AppFontStyle.fromString(obj.optString("periodFontStyle", "NORMAL"));
            s.periodAlignment = PrintAlignment.fromString(obj.optString("periodAlignment", "LEFT"));
            s.showPeriodLabel = obj.optBoolean("showPeriodLabel", true);
            s.periodLabelText = obj.optString("periodLabelText", "Period");
            s.periodColor = obj.optLong("periodColor", 0xFF000000L);

            s.showQuota = obj.optBoolean("showQuota", false);
            s.quotaFontSize = (float) obj.optDouble("quotaFontSize", 24.0);
            s.quotaBold = quoB;
            s.quotaFontWeight = obj.has("quotaFontWeight") ? AppFontWeight.fromString(obj.optString("quotaFontWeight"))
                    : (quoB ? AppFontWeight.BOLD : AppFontWeight.REGULAR);
            s.quotaFontStyle = AppFontStyle.fromString(obj.optString("quotaFontStyle", "NORMAL"));
            s.quotaAlignment = PrintAlignment.fromString(obj.optString("quotaAlignment", "LEFT"));
            s.showQuotaLabel = obj.optBoolean("showQuotaLabel", true);
            s.quotaLabelText = obj.optString("quotaLabelText", "Quota");
            s.quotaColor = obj.optLong("quotaColor", 0xFF000000L);

            s.showHeader = obj.optBoolean("showHeader", true);
            s.headerFontSize = (float) obj.optDouble("headerFontSize", 26.0);
            s.headerBold = headB;
            s.headerFontWeight = obj.has("headerFontWeight") ? AppFontWeight.fromString(obj.optString("headerFontWeight"))
                    : (headB ? AppFontWeight.BOLD : AppFontWeight.REGULAR);
            s.headerFontStyle = AppFontStyle.fromString(obj.optString("headerFontStyle", "NORMAL"));
            s.headerAlignment = PrintAlignment.fromString(obj.optString("headerAlignment", "LEFT"));
            s.headerSeparator = obj.optString("headerSeparator", " - ");
            s.customHeaderName = obj.optString("customHeaderName", "");
            s.headerColor = obj.optLong("headerColor", 0xFF000000L);

            s.showPrintDateTime = obj.optBoolean("showPrintDateTime", false);
            s.printDateTimeFontSize = (float) obj.optDouble("printDateTimeFontSize", 20.0);
            s.printDateTimeBold = dtB;
            s.printDateTimeFontWeight = obj.has("printDateTimeFontWeight") ? AppFontWeight.fromString(obj.optString("printDateTimeFontWeight"))
                    : (dtB ? AppFontWeight.BOLD : AppFontWeight.REGULAR);
            s.printDateTimeFontStyle = AppFontStyle.fromString(obj.optString("printDateTimeFontStyle", "NORMAL"));
            s.printDateTimeAlignment = PrintAlignment.fromString(obj.optString("printDateTimeAlignment", "LEFT"));
            s.printDateTimeColor = obj.optLong("printDateTimeColor", 0xFF000000L);
            s.showPrintDateTimeLabel = obj.optBoolean("showPrintDateTimeLabel", false);
            s.printDateTimeLabelText = obj.optString("printDateTimeLabelText", "Print Date/Time");

            s.showStatus = obj.optBoolean("showStatus", false);
            s.statusFontSize = (float) obj.optDouble("statusFontSize", 20.0);
            s.statusBold = stB;
            s.statusFontWeight = obj.has("statusFontWeight") ? AppFontWeight.fromString(obj.optString("statusFontWeight"))
                    : (stB ? AppFontWeight.BOLD : AppFontWeight.REGULAR);
            s.statusFontStyle = AppFontStyle.fromString(obj.optString("statusFontStyle", "NORMAL"));
            s.statusAlignment = PrintAlignment.fromString(obj.optString("statusAlignment", "LEFT"));
            s.statusColor = obj.optLong("statusColor", 0xFF000000L);

            s.fontFamily = AppFontFamily.fromString(obj.optString("fontFamily", "DEFAULT"));
            s.letterSpacingMode = LetterSpacingMode.fromString(obj.optString("letterSpacingMode", "NORMAL"));
            s.customLetterSpacing = (float) obj.optDouble("customLetterSpacing", 0.0);
            s.lineSpacingExtra = (float) obj.optDouble("lineSpacingExtra", 0.0);

            s.textShadowEnabled = obj.optBoolean("textShadowEnabled", false);
            s.shadowColor = obj.optLong("shadowColor", 0x88000000L);
            s.shadowOpacity = (float) obj.optDouble("shadowOpacity", 0.5);
            s.shadowBlur = (float) obj.optDouble("shadowBlur", 3.0);
            s.shadowOffsetX = (float) obj.optDouble("shadowOffsetX", 2.0);
            s.shadowOffsetY = (float) obj.optDouble("shadowOffsetY", 2.0);

            s.textOutlineEnabled = obj.optBoolean("textOutlineEnabled", false);
            s.outlineColor = obj.optLong("outlineColor", 0xFF000000L);
            s.outlineWidth = (float) obj.optDouble("outlineWidth", 1.0);

            s.activePreset = TypographyPreset.fromString(obj.optString("activePreset", "DEFAULT"));

            s.customLines = new java.util.ArrayList<>();
            JSONArray cla = obj.optJSONArray("customLines");
            if (cla != null) {
                for (int i = 0; i < cla.length() && s.customLines.size() < 5; i++) {
                    JSONObject o = cla.optJSONObject(i);
                    if (o == null) continue;
                    CustomLine cl = new CustomLine();
                    cl.label = o.optString("label", "");
                    cl.value = o.optString("value", "");
                    cl.fontSize = Math.max(8f, Math.min(48f, (float) o.optDouble("fontSize", 20.0)));
                    cl.bold = o.optBoolean("bold", false);
                    cl.alignment = PrintAlignment.fromString(o.optString("alignment", "LEFT"));
                    cl.dxMm = Math.max(-20f, Math.min(20f, (float) o.optDouble("dxMm", 0.0)));
                    s.customLines.add(cl);
                }
            }
            return s;
        } catch (Exception e) {
            return new PrintDesignSettings();
        }
    }
}
