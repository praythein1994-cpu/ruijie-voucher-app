package com.ruijie.voucher.printer;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Typeface;

import com.ruijie.voucher.printer.PrinterEnums.AppFontFamily;
import com.ruijie.voucher.printer.PrinterEnums.AppFontStyle;
import com.ruijie.voucher.printer.PrinterEnums.AppFontWeight;
import com.ruijie.voucher.printer.PrinterEnums.LetterSpacingMode;
import com.ruijie.voucher.printer.PrinterEnums.PrintAlignment;

import java.io.ByteArrayOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/**
 * Single source of truth for both Live Preview and Thermal Printer output.
 * Guarantees identical pixel-perfect output between preview screen and thermal slip.
 *
 * Ported from printer-v1-fix1.2-p1994 (PrintRenderer.kt), behavior identical.
 * The RuijieVoucherItem overload is replaced by explicit voucher fields
 * (the Kotlin second overload), so no app-model dependency remains.
 */
public final class PrintRenderer {

    private PrintRenderer() {}

    /** Build Paint configured with full typography settings. */
    public static Paint createPaint(
            float fontSize,
            AppFontWeight fontWeight,
            AppFontStyle fontStyle,
            AppFontFamily fontFamily,
            long colorLong,
            PrintAlignment alignment,
            LetterSpacingMode letterSpacingMode,
            float customLetterSpacing,
            boolean textShadowEnabled,
            long shadowColor,
            float shadowOpacity,
            float shadowBlur,
            float shadowOffsetX,
            float shadowOffsetY,
            boolean isThermalOutput) {

        Typeface baseTf;
        switch (fontFamily) {
            case MONOSPACE: baseTf = Typeface.MONOSPACE; break;
            case SERIF: baseTf = Typeface.SERIF; break;
            case SANS_SERIF: baseTf = Typeface.SANS_SERIF; break;
            case DEFAULT:
            default: baseTf = Typeface.DEFAULT; break;
        }
        boolean isBold = fontWeight == AppFontWeight.BOLD || fontWeight == AppFontWeight.SEMI_BOLD;
        boolean isItalic = fontStyle == AppFontStyle.ITALIC;
        int style;
        if (isBold && isItalic) style = Typeface.BOLD_ITALIC;
        else if (isBold) style = Typeface.BOLD;
        else if (isItalic) style = Typeface.ITALIC;
        else style = Typeface.NORMAL;
        Typeface tf = Typeface.create(baseTf, style);

        Paint p = new Paint();
        p.setColor((int) (colorLong & 0xFFFFFFFFL));
        p.setTextSize(fontSize);
        p.setTypeface(tf);
        switch (alignment) {
            case LEFT: p.setTextAlign(Paint.Align.LEFT); break;
            case CENTER: p.setTextAlign(Paint.Align.CENTER); break;
            case RIGHT: p.setTextAlign(Paint.Align.RIGHT); break;
        }
        p.setStyle(Paint.Style.FILL);
        p.setAntiAlias(!isThermalOutput);

        if (letterSpacingMode == LetterSpacingMode.CUSTOM) {
            p.setLetterSpacing(Math.max(-0.08f, Math.min(0.25f, customLetterSpacing)));
        } else {
            p.setLetterSpacing(letterSpacingMode.value);
        }

        if (textShadowEnabled && !isThermalOutput) {
            int alpha = (int) (Math.max(0.1f, Math.min(1.0f, shadowOpacity)) * 255);
            int shadowColorInt = ((int) shadowColor & 0x00FFFFFF) | (alpha << 24);
            p.setShadowLayer(Math.max(0.1f, shadowBlur), shadowOffsetX, shadowOffsetY, shadowColorInt);
        }
        return p;
    }

    /** Convenience overload with defaults (mirrors Kotlin default args). */
    public static Paint createPaint(float fontSize, AppFontWeight fontWeight, AppFontStyle fontStyle,
                                    AppFontFamily fontFamily, long colorLong, boolean isThermalOutput) {
        return createPaint(fontSize, fontWeight, fontStyle, fontFamily, colorLong,
                PrintAlignment.LEFT, LetterSpacingMode.NORMAL, 0f,
                false, 0x88000000L, 0.5f, 3f, 2f, 2f, isThermalOutput);
    }

    /** Custom label text, or the classic fallback when empty. */
    private static String labelOrDefault(String custom, String fallback) {
        if (custom == null) return fallback;
        String s = custom.trim();
        return s.isEmpty() ? fallback : s;
    }

    public static Bitmap renderVoucher(
            String code,
            String profileName,
            String validPeriod,
            String quota,
            String status,
            PrintDesignSettings settings,
            PaperConfiguration paperConfig,
            String siteName,
            String printDateTime,
            boolean isThermalOutput) {

        int width = paperConfig.widthDots; // 384 for 58mm, 576 for 80mm
        // v1.5.58: dots per mm for the free custom-line nudge (dxMm)
        float dotsPerMm = paperConfig.paperWidthMm > 0 ? (float) width / paperConfig.paperWidthMm : 0f;

        // Dynamic site/brand name
        String rawSite = (siteName != null && !siteName.trim().isEmpty()) ? siteName : "WiFi";
        String dynamicSiteName;
        if (settings.customHeaderName != null && !settings.customHeaderName.trim().isEmpty()) {
            dynamicSiteName = settings.customHeaderName.trim();
        } else {
            String t = rawSite.trim();
            if (t.startsWith("(") && t.endsWith(")") && t.length() >= 2) {
                t = t.substring(1, t.length() - 1).trim();
            }
            dynamicSiteName = t;
        }

        // Format voucher code strictly preserving actual Cloud characters
        StringBuilder cleanSb = new StringBuilder();
        for (int i = 0; i < code.length(); i++) {
            char ch = code.charAt(i);
            if (!Character.isWhitespace(ch)) cleanSb.append(ch);
        }
        String cleanCode = cleanSb.toString();
        String formattedCode;
        if (settings.codeSpaced) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < cleanCode.length(); i++) {
                if (i > 0) sb.append(' ');
                sb.append(cleanCode.charAt(i));
            }
            formattedCode = sb.toString();
        } else {
            formattedCode = cleanCode;
        }

        String actualProfileName = (profileName == null || profileName.isEmpty()) ? "WiFi Voucher" : profileName;
        String actualValidPeriod = (validPeriod == null || validPeriod.isEmpty()) ? "Unlimited" : validPeriod;
        String actualQuota = (quota == null || quota.isEmpty()) ? "Unlimited" : quota;
        String actualStatus = (status == null || status.isEmpty()) ? "Not Used" : status;

        boolean hasLine1 = settings.showHeader || settings.showVoucherCode;
        boolean hasLine2 = settings.showProfileName;
        boolean hasLine3 = settings.showPeriod;
        boolean hasLine4 = settings.showQuota;
        boolean hasLine5 = settings.showPrintDateTime;
        boolean hasLine6 = settings.showStatus;

        int spacingLevel = Math.max(0, Math.min(4, settings.insideVoucherSpacing));
        float extraSpacing = (spacingLevel * 8) + Math.max(-4f, settings.lineSpacingExtra);

        float currentY = 28f;
        Float line1Y = null, line2Y = null, line3Y = null, line4Y = null, line5Y = null, line6Y = null;

        // Custom free-text lines: the FIRST visible line docks — its label shares the
        // profile row (right side), its value shares the validity row (right side).
        // Lines 2..n keep their own rows between profile and validity.
        // The JS bridge already filters hidden lines; re-validate text presence here.
        java.util.List<PrintDesignSettings.CustomLine> visCls = new java.util.ArrayList<>();
        if (settings.customLines != null) {
            for (PrintDesignSettings.CustomLine cl : settings.customLines) {
                if (cl == null) continue;
                boolean hasLabel = cl.label != null && !cl.label.trim().isEmpty();
                boolean hasValue = cl.value != null && !cl.value.trim().isEmpty();
                if (!hasLabel && !hasValue) continue;
                visCls.add(cl);
                if (visCls.size() >= 5) break;
            }
        }
        PrintDesignSettings.CustomLine dockCl = visCls.isEmpty() ? null : visCls.get(0);
        String dockLabel = (dockCl != null && dockCl.label != null) ? dockCl.label.trim() : "";
        String dockValue = (dockCl != null && dockCl.value != null) ? dockCl.value.trim() : "";
        boolean dockLabelOnProfile = !dockLabel.isEmpty() && hasLine2;
        boolean dockValueOnPeriod = !dockValue.isEmpty() && hasLine3;

        if (hasLine1) {
            line1Y = currentY;
            currentY += Math.max(24f, Math.max(settings.headerFontSize, settings.codeFontSize) + 4f) + extraSpacing;
        }
        if (hasLine2) {
            line2Y = currentY;
            float rowH = Math.max(22f, settings.profileNameFontSize + 4f);
            if (dockLabelOnProfile) rowH = Math.max(rowH, Math.max(18f, dockCl.fontSize + 4f));
            currentY += rowH + extraSpacing;
        }

        // Own-row custom lines: lines 2..n fully, plus the first line's undocked parts
        java.util.List<PrintDesignSettings.CustomLine> ownCls = new java.util.ArrayList<>();
        java.util.List<java.util.List<String>> ownParts = new java.util.ArrayList<>();
        java.util.List<Float> clY = new java.util.ArrayList<>();
        for (int ci = 0; ci < visCls.size(); ci++) {
            PrintDesignSettings.CustomLine cl = visCls.get(ci);
            String l = cl.label == null ? "" : cl.label.trim();
            String v = cl.value == null ? "" : cl.value.trim();
            java.util.List<String> parts = new java.util.ArrayList<>();
            if (ci == 0) {
                if (!dockLabelOnProfile && !l.isEmpty()) parts.add(l);
                if (!dockValueOnPeriod && !v.isEmpty()) parts.add(v);
            } else {
                if (!l.isEmpty()) parts.add(l);
                if (!v.isEmpty()) parts.add(v);
            }
            if (parts.isEmpty()) continue;
            ownCls.add(cl);
            ownParts.add(parts);
            clY.add(currentY);
            currentY += Math.max(18f, cl.fontSize + 4f) * parts.size() + extraSpacing;
        }

        if (hasLine3) {
            line3Y = currentY;
            float rowH = Math.max(20f, settings.periodFontSize + 4f);
            if (dockValueOnPeriod) rowH = Math.max(rowH, Math.max(18f, dockCl.fontSize + 4f));
            currentY += rowH + extraSpacing;
        }
        if (hasLine4) {
            line4Y = currentY;
            currentY += Math.max(20f, settings.quotaFontSize + 4f) + extraSpacing;
        }
        if (hasLine5) {
            line5Y = currentY;
            currentY += Math.max(18f, settings.printDateTimeFontSize + 4f) + extraSpacing;
        }
        if (hasLine6) {
            line6Y = currentY;
            currentY += Math.max(18f, settings.statusFontSize + 4f) + extraSpacing;
        }

        // Default 58mm compact layout maintains 110 dots height if uncustomized
        boolean isDefaultLayout = hasLine1 && hasLine2 && hasLine3 && !hasLine4 && !hasLine5 && !hasLine6
                && visCls.isEmpty()
                && spacingLevel == 0 && settings.lineSpacingExtra == 0f
                && settings.headerFontSize == 26f && settings.codeFontSize == 28f
                && settings.profileNameFontSize == 24f && settings.periodFontSize == 24f;

        int height = (isDefaultLayout && width == 384) ? 110 : Math.max(60, (int) (currentY - 2f));

        Bitmap bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        canvas.drawColor((int) 0xFFFFFFFFL); // Pure solid white background

        final float maxAvailableWidth = Math.max(100f, width - 32f);

        // Custom label texts (fall back to the classic English labels)
        final String codeLbl = labelOrDefault(settings.codeLabelText, "Voucher Code");
        final String profileLbl = labelOrDefault(settings.profileNameLabelText, "Profile Name");
        final String periodLbl = labelOrDefault(settings.periodLabelText, "Period");
        final String quotaLbl = labelOrDefault(settings.quotaLabelText, "Quota");
        final String dtLbl = labelOrDefault(settings.printDateTimeLabelText, "Print Date/Time");
        // Shared label-column width keeps the ":" vertically aligned across profile/period/quota lines
        Paint labelMeasurePaint = createPaint(22f, AppFontWeight.REGULAR, AppFontStyle.NORMAL,
                settings.fontFamily, 0xFF000000L, isThermalOutput);
        final float labelColumnWidth = Math.max(labelMeasurePaint.measureText(profileLbl),
                Math.max(labelMeasurePaint.measureText(periodLbl), labelMeasurePaint.measureText(quotaLbl)));

        // 1. Line 1: Header / Voucher Code
        if (hasLine1) {
            AppFontWeight headerWeight = settings.headerBold ? AppFontWeight.BOLD : settings.headerFontWeight;
            AppFontWeight codeWeight = settings.codeBold ? AppFontWeight.BOLD : settings.codeFontWeight;

            if (settings.showHeader && settings.showVoucherCode) {
                Paint brandPaint = createPaint(settings.headerFontSize, headerWeight, settings.headerFontStyle,
                        settings.fontFamily, settings.headerColor, PrintAlignment.LEFT,
                        settings.letterSpacingMode, settings.customLetterSpacing,
                        settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                        settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);
                Paint codePaint = createPaint(settings.codeFontSize, codeWeight, settings.codeFontStyle,
                        settings.fontFamily, settings.codeColor, PrintAlignment.LEFT,
                        settings.letterSpacingMode, settings.customLetterSpacing,
                        settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                        settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);

                String brandPrefix = dynamicSiteName + settings.headerSeparator;
                String codeText = (settings.showCodeLabel ? codeLbl + " : " : "") + formattedCode;
                float brandWidth = brandPaint.measureText(brandPrefix);
                float codeWidth = codePaint.measureText(codeText);

                // Responsive auto-scale: guarantees text never overflows, wraps, or goes vertical
                if ((brandWidth + codeWidth) > maxAvailableWidth && (brandWidth + codeWidth) > 0f) {
                    float scale = maxAvailableWidth / (brandWidth + codeWidth);
                    brandPaint.setTextSize(brandPaint.getTextSize() * scale);
                    codePaint.setTextSize(codePaint.getTextSize() * scale);
                    brandWidth = brandPaint.measureText(brandPrefix);
                    codeWidth = codePaint.measureText(codeText);
                }

                float totalWidth = brandWidth + codeWidth;
                float startX;
                switch (settings.headerAlignment) {
                    case CENTER: startX = Math.max(16f, (width - totalWidth) / 2f); break;
                    case RIGHT: startX = Math.max(16f, width - 16f - totalWidth); break;
                    case LEFT:
                    default: startX = 16f; break;
                }

                drawWithOutline(canvas, settings, brandPrefix, startX, line1Y, brandPaint, isThermalOutput);
                drawWithOutline(canvas, settings, codeText, startX + brandWidth, line1Y, codePaint, isThermalOutput);
            } else if (settings.showHeader) {
                Paint brandPaint = createPaint(settings.headerFontSize, headerWeight, settings.headerFontStyle,
                        settings.fontFamily, settings.headerColor, settings.headerAlignment,
                        settings.letterSpacingMode, settings.customLetterSpacing,
                        settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                        settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);
                float measured = brandPaint.measureText(dynamicSiteName);
                if (measured > maxAvailableWidth && measured > 0f) {
                    brandPaint.setTextSize(brandPaint.getTextSize() * (maxAvailableWidth / measured));
                }
                float x;
                switch (settings.headerAlignment) {
                    case CENTER: x = width / 2f; break;
                    case RIGHT: x = width - 16f; break;
                    case LEFT:
                    default: x = 16f; break;
                }
                drawWithOutline(canvas, settings, dynamicSiteName, x, line1Y, brandPaint, isThermalOutput);
            } else { // showVoucherCode only
                Paint codePaint = createPaint(settings.codeFontSize, codeWeight, settings.codeFontStyle,
                        settings.fontFamily, settings.codeColor, settings.codeAlignment,
                        settings.letterSpacingMode, settings.customLetterSpacing,
                        settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                        settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);
                String codeText = (settings.showCodeLabel ? codeLbl + " : " : "") + formattedCode;
                float measured = codePaint.measureText(codeText);
                if (measured > maxAvailableWidth && measured > 0f) {
                    codePaint.setTextSize(codePaint.getTextSize() * (maxAvailableWidth / measured));
                }
                float x;
                switch (settings.codeAlignment) {
                    case CENTER: x = width / 2f; break;
                    case RIGHT: x = width - 16f; break;
                    case LEFT:
                    default: x = 16f; break;
                }
                drawWithOutline(canvas, settings, codeText, x, line1Y, codePaint, isThermalOutput);
            }
        }

        // 2. Line 2: Profile Name
        float profileRowW = 0f;
        if (hasLine2) {
            AppFontWeight profileWeight = settings.profileNameBold ? AppFontWeight.BOLD : settings.profileNameFontWeight;
            Paint profileNamePaint = createPaint(settings.profileNameFontSize, profileWeight, settings.profileNameFontStyle,
                    settings.fontFamily, settings.profileNameColor, settings.profileNameAlignment,
                    settings.letterSpacingMode, settings.customLetterSpacing,
                    settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                    settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);

            if (settings.showProfileNameLabel) {
                if (settings.profileNameAlignment == PrintAlignment.LEFT) {
                    Paint labelPaint = createPaint(22f, AppFontWeight.REGULAR, AppFontStyle.NORMAL,
                            settings.fontFamily, settings.profileNameColor, isThermalOutput);
                    float colonX = 16f + labelColumnWidth + 6f;
                    float valueX = colonX + labelPaint.measureText(": ");
                    profileNamePaint.setTextAlign(Paint.Align.LEFT);

                    float availableForValue = (width - 16f) - valueX;
                    float valWidth = profileNamePaint.measureText(actualProfileName);
                    if (valWidth > availableForValue && valWidth > 0f) {
                        profileNamePaint.setTextSize(profileNamePaint.getTextSize() * (availableForValue / valWidth));
                    }

                    drawWithOutline(canvas, settings, profileLbl, 16f, line2Y, labelPaint, isThermalOutput);
                    drawWithOutline(canvas, settings, ":", colonX, line2Y, labelPaint, isThermalOutput);
                    drawWithOutline(canvas, settings, actualProfileName, valueX, line2Y, profileNamePaint, isThermalOutput);
                    profileRowW = valueX + Math.min(valWidth, availableForValue);
                } else {
                    String fullText = profileLbl + " : " + actualProfileName;
                    float measured = profileNamePaint.measureText(fullText);
                    if (measured > maxAvailableWidth && measured > 0f) {
                        profileNamePaint.setTextSize(profileNamePaint.getTextSize() * (maxAvailableWidth / measured));
                    }
                    float x = settings.profileNameAlignment == PrintAlignment.CENTER ? width / 2f
                            : settings.profileNameAlignment == PrintAlignment.RIGHT ? width - 16f : 16f;
                    drawWithOutline(canvas, settings, fullText, x, line2Y, profileNamePaint, isThermalOutput);
                    profileRowW = Math.min(measured, maxAvailableWidth);
                }
            } else {
                float measured = profileNamePaint.measureText(actualProfileName);
                if (measured > maxAvailableWidth && measured > 0f) {
                    profileNamePaint.setTextSize(profileNamePaint.getTextSize() * (maxAvailableWidth / measured));
                }
                float x;
                switch (settings.profileNameAlignment) {
                    case CENTER: x = width / 2f; break;
                    case RIGHT: x = width - 16f; break;
                    case LEFT:
                    default: x = 16f; break;
                }
                drawWithOutline(canvas, settings, actualProfileName, x, line2Y, profileNamePaint, isThermalOutput);
                profileRowW = Math.min(measured, maxAvailableWidth);
            }
        }

        // 2b-dock: first custom line's label shares the profile row (right side)
        if (dockLabelOnProfile) {
            drawDockPart(canvas, settings, dockCl, dockLabel, line2Y, profileRowW, width, maxAvailableWidth, dotsPerMm, isThermalOutput);
        }

        // 2c. Custom free-text lines on their own rows (label stacked above value, own size/bold/align)
        for (int k = 0; k < ownCls.size(); k++) {
            PrintDesignSettings.CustomLine cl = ownCls.get(k);
            float y = clY.get(k);
            float lh = Math.max(18f, cl.fontSize + 4f);
            AppFontWeight clW = cl.bold ? AppFontWeight.BOLD : AppFontWeight.REGULAR;
            PrintAlignment pa = cl.alignment == null ? PrintAlignment.LEFT : cl.alignment;
            for (String part : ownParts.get(k)) {
                if (part.isEmpty()) continue;
                Paint clPaint = createPaint(cl.fontSize, clW, AppFontStyle.NORMAL,
                        settings.fontFamily, 0xFF000000L, pa,
                        settings.letterSpacingMode, settings.customLetterSpacing,
                        settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                        settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);
                float measured = clPaint.measureText(part);
                if (measured > maxAvailableWidth && measured > 0f) {
                    clPaint.setTextSize(clPaint.getTextSize() * (maxAvailableWidth / measured));
                }
                float drawnW = Math.min(measured, maxAvailableWidth);
                // v1.5.58: free horizontal nudge (+mm right / -mm left), clamped on-paper
                float dxDots = cl.dxMm * dotsPerMm;
                float x;
                if (pa == PrintAlignment.CENTER) {
                    x = width / 2f + dxDots;
                    x = Math.min(width - drawnW / 2f - 8f, Math.max(drawnW / 2f + 8f, x));
                } else if (pa == PrintAlignment.RIGHT) {
                    x = width - 16f + dxDots;
                    x = Math.min(width - 8f, Math.max(drawnW + 8f, x));
                } else {
                    x = 16f + dxDots;
                    x = Math.min(Math.max(8f, width - 8f - drawnW), Math.max(8f, x));
                }
                drawWithOutline(canvas, settings, part, x, y, clPaint, isThermalOutput);
                y += lh;
            }
        }

        // 3. Line 3: Period
        float periodRowW = 0f;
        if (hasLine3) {
            AppFontWeight periodWeight = settings.periodBold ? AppFontWeight.BOLD : settings.periodFontWeight;
            Paint periodPaint = createPaint(settings.periodFontSize, periodWeight, settings.periodFontStyle,
                    settings.fontFamily, settings.periodColor, settings.periodAlignment,
                    settings.letterSpacingMode, settings.customLetterSpacing,
                    settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                    settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);

            if (settings.showPeriodLabel) {
                if (settings.periodAlignment == PrintAlignment.LEFT) {
                    Paint labelPaint = createPaint(22f, AppFontWeight.REGULAR, AppFontStyle.NORMAL,
                            settings.fontFamily, settings.periodColor, isThermalOutput);
                    float colonX = 16f + labelColumnWidth + 6f;
                    float valueX = colonX + labelPaint.measureText(": ");
                    periodPaint.setTextAlign(Paint.Align.LEFT);

                    float availableForValue = (width - 16f) - valueX;
                    float valWidth = periodPaint.measureText(actualValidPeriod);
                    if (valWidth > availableForValue && valWidth > 0f) {
                        periodPaint.setTextSize(periodPaint.getTextSize() * (availableForValue / valWidth));
                    }

                    drawWithOutline(canvas, settings, periodLbl, 16f, line3Y, labelPaint, isThermalOutput);
                    drawWithOutline(canvas, settings, ":", colonX, line3Y, labelPaint, isThermalOutput);
                    drawWithOutline(canvas, settings, actualValidPeriod, valueX, line3Y, periodPaint, isThermalOutput);
                    periodRowW = valueX + Math.min(valWidth, availableForValue);
                } else {
                    String fullText = periodLbl + " : " + actualValidPeriod;
                    float measured = periodPaint.measureText(fullText);
                    if (measured > maxAvailableWidth && measured > 0f) {
                        periodPaint.setTextSize(periodPaint.getTextSize() * (maxAvailableWidth / measured));
                    }
                    float x = settings.periodAlignment == PrintAlignment.CENTER ? width / 2f
                            : settings.periodAlignment == PrintAlignment.RIGHT ? width - 16f : 16f;
                    drawWithOutline(canvas, settings, fullText, x, line3Y, periodPaint, isThermalOutput);
                    periodRowW = Math.min(measured, maxAvailableWidth);
                }
            } else {
                float measured = periodPaint.measureText(actualValidPeriod);
                if (measured > maxAvailableWidth && measured > 0f) {
                    periodPaint.setTextSize(periodPaint.getTextSize() * (maxAvailableWidth / measured));
                }
                float x;
                switch (settings.periodAlignment) {
                    case CENTER: x = width / 2f; break;
                    case RIGHT: x = width - 16f; break;
                    case LEFT:
                    default: x = 16f; break;
                }
                drawWithOutline(canvas, settings, actualValidPeriod, x, line3Y, periodPaint, isThermalOutput);
                periodRowW = Math.min(measured, maxAvailableWidth);
            }
        }

        // 3b-dock: first custom line's value shares the validity row (right side)
        if (dockValueOnPeriod) {
            drawDockPart(canvas, settings, dockCl, dockValue, line3Y, periodRowW, width, maxAvailableWidth, dotsPerMm, isThermalOutput);
        }

        // 4. Line 4: Quota
        if (hasLine4) {
            AppFontWeight quotaWeight = settings.quotaBold ? AppFontWeight.BOLD : settings.quotaFontWeight;
            Paint quotaPaint = createPaint(settings.quotaFontSize, quotaWeight, settings.quotaFontStyle,
                    settings.fontFamily, settings.quotaColor, settings.quotaAlignment,
                    settings.letterSpacingMode, settings.customLetterSpacing,
                    settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                    settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);

            if (settings.showQuotaLabel) {
                if (settings.quotaAlignment == PrintAlignment.LEFT) {
                    Paint labelPaint = createPaint(22f, AppFontWeight.REGULAR, AppFontStyle.NORMAL,
                            settings.fontFamily, settings.quotaColor, isThermalOutput);
                    float colonX = 16f + labelColumnWidth + 6f;
                    float valueX = colonX + labelPaint.measureText(": ");
                    quotaPaint.setTextAlign(Paint.Align.LEFT);

                    float availableForValue = (width - 16f) - valueX;
                    float valWidth = quotaPaint.measureText(actualQuota);
                    if (valWidth > availableForValue && valWidth > 0f) {
                        quotaPaint.setTextSize(quotaPaint.getTextSize() * (availableForValue / valWidth));
                    }

                    drawWithOutline(canvas, settings, quotaLbl, 16f, line4Y, labelPaint, isThermalOutput);
                    drawWithOutline(canvas, settings, ":", colonX, line4Y, labelPaint, isThermalOutput);
                    drawWithOutline(canvas, settings, actualQuota, valueX, line4Y, quotaPaint, isThermalOutput);
                } else {
                    String fullText = quotaLbl + " : " + actualQuota;
                    float measured = quotaPaint.measureText(fullText);
                    if (measured > maxAvailableWidth && measured > 0f) {
                        quotaPaint.setTextSize(quotaPaint.getTextSize() * (maxAvailableWidth / measured));
                    }
                    float x = settings.quotaAlignment == PrintAlignment.CENTER ? width / 2f
                            : settings.quotaAlignment == PrintAlignment.RIGHT ? width - 16f : 16f;
                    drawWithOutline(canvas, settings, fullText, x, line4Y, quotaPaint, isThermalOutput);
                }
            } else {
                float measured = quotaPaint.measureText(actualQuota);
                if (measured > maxAvailableWidth && measured > 0f) {
                    quotaPaint.setTextSize(quotaPaint.getTextSize() * (maxAvailableWidth / measured));
                }
                float x;
                switch (settings.quotaAlignment) {
                    case CENTER: x = width / 2f; break;
                    case RIGHT: x = width - 16f; break;
                    case LEFT:
                    default: x = 16f; break;
                }
                drawWithOutline(canvas, settings, actualQuota, x, line4Y, quotaPaint, isThermalOutput);
            }
        }

        // 5. Line 5: Print Date/Time
        if (hasLine5) {
            String actualDateTime = (printDateTime != null && !printDateTime.trim().isEmpty()) ? printDateTime
                    : new SimpleDateFormat("yyyy-MM-dd HH:mm", Locale.US).format(new Date());
            String dtText = settings.showPrintDateTimeLabel ? dtLbl + " : " + actualDateTime : actualDateTime;
            AppFontWeight dtWeight = settings.printDateTimeBold ? AppFontWeight.BOLD : settings.printDateTimeFontWeight;

            Paint dateTimePaint = createPaint(settings.printDateTimeFontSize, dtWeight, settings.printDateTimeFontStyle,
                    settings.fontFamily, settings.printDateTimeColor, settings.printDateTimeAlignment,
                    settings.letterSpacingMode, settings.customLetterSpacing,
                    settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                    settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);

            float measured = dateTimePaint.measureText(dtText);
            if (measured > maxAvailableWidth && measured > 0f) {
                dateTimePaint.setTextSize(dateTimePaint.getTextSize() * (maxAvailableWidth / measured));
            }

            float x;
            switch (settings.printDateTimeAlignment) {
                case CENTER: x = width / 2f; break;
                case RIGHT: x = width - 16f; break;
                case LEFT:
                default: x = 16f; break;
            }
            drawWithOutline(canvas, settings, dtText, x, line5Y, dateTimePaint, isThermalOutput);
        }

        // 6. Line 6: Status
        if (hasLine6) {
            AppFontWeight statusWeight = settings.statusBold ? AppFontWeight.BOLD : settings.statusFontWeight;
            Paint statusPaint = createPaint(settings.statusFontSize, statusWeight, settings.statusFontStyle,
                    settings.fontFamily, settings.statusColor, settings.statusAlignment,
                    settings.letterSpacingMode, settings.customLetterSpacing,
                    settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                    settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);

            String statusText = "Status: " + actualStatus;
            float measured = statusPaint.measureText(statusText);
            if (measured > maxAvailableWidth && measured > 0f) {
                statusPaint.setTextSize(statusPaint.getTextSize() * (maxAvailableWidth / measured));
            }

            float x;
            switch (settings.statusAlignment) {
                case CENTER: x = width / 2f; break;
                case RIGHT: x = width - 16f; break;
                case LEFT:
                default: x = 16f; break;
            }
            drawWithOutline(canvas, settings, statusText, x, line6Y, statusPaint, isThermalOutput);
        }

        return bitmap;
    }

    /** Convenience overload with default paper/site/datetime (mirrors Kotlin default args). */
    public static Bitmap renderVoucher(String code, String profileName, String validPeriod,
                                       String quota, String status, PrintDesignSettings settings) {
        return renderVoucher(code, profileName, validPeriod, quota, status, settings,
                PaperConfiguration.STANDARD_58MM, null, null, false);
    }

    /** Helper to draw text with optional outline (preview only; thermal never outlines). */
    // Draws a docked custom-line part on the right side of a shared row
    // (first custom line's label on the profile row, value on the validity row).
    // Auto-scales to the width remaining beside the row's main content.
    private static void drawDockPart(Canvas canvas, PrintDesignSettings settings,
                                     PrintDesignSettings.CustomLine cl, String text, float y,
                                     float rowContentW, int width, float maxAvailableWidth,
                                     float dotsPerMm, boolean isThermalOutput) {
        AppFontWeight clW = cl.bold ? AppFontWeight.BOLD : AppFontWeight.REGULAR;
        Paint p = createPaint(cl.fontSize, clW, AppFontStyle.NORMAL,
                settings.fontFamily, 0xFF000000L, PrintAlignment.RIGHT,
                settings.letterSpacingMode, settings.customLetterSpacing,
                settings.textShadowEnabled, settings.shadowColor, settings.shadowOpacity,
                settings.shadowBlur, settings.shadowOffsetX, settings.shadowOffsetY, isThermalOutput);
        float avail = Math.max(24f, maxAvailableWidth - rowContentW - 12f);
        float w = p.measureText(text);
        if (w > avail && w > 0f) {
            p.setTextSize(p.getTextSize() * (avail / w));
        }
        float drawnW = Math.min(w, avail);
        // v1.5.58: free horizontal nudge (+mm right / -mm left), clamped on-paper
        float edgeX = width - 16f + cl.dxMm * dotsPerMm;
        edgeX = Math.min(width - 8f, Math.max(drawnW + 8f, edgeX));
        drawWithOutline(canvas, settings, text, edgeX, y, p, isThermalOutput);
    }

    private static void drawWithOutline(Canvas canvas, PrintDesignSettings settings,
                                        String text, float x, float y, Paint fillPaint,
                                        boolean isThermalOutput) {
        if (settings.textOutlineEnabled && !isThermalOutput) {
            Paint strokePaint = new Paint(fillPaint);
            strokePaint.setStyle(Paint.Style.STROKE);
            strokePaint.setStrokeWidth(Math.max(1f, Math.min(4f, settings.outlineWidth)));
            strokePaint.setColor((int) (settings.outlineColor & 0xFFFFFFFFL));
            strokePaint.clearShadowLayer();
            canvas.drawText(text, x, y, strokePaint);
        }
        canvas.drawText(text, x, y, fillPaint);
    }

    /**
     * Converts a sharp monochrome Bitmap into ESC/POS Raster Bit Image (GS v 0).
     */
    public static byte[] convertBitmapToEscPosRaster(Bitmap bitmap) {
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        int widthBytes = (width + 7) / 8;

        byte xL = (byte) (widthBytes % 256);
        byte xH = (byte) (widthBytes / 256);
        byte yL = (byte) (height % 256);
        byte yH = (byte) (height / 256);

        ByteArrayOutputStream output = new ByteArrayOutputStream();
        // GS v 0 0 xL xH yL yH
        output.write(new byte[]{0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH}, 0, 8);

        for (int y = 0; y < height; y++) {
            for (int xByte = 0; xByte < widthBytes; xByte++) {
                int byteVal = 0;
                for (int bit = 0; bit < 8; bit++) {
                    int x = xByte * 8 + bit;
                    if (x < width) {
                        int pixel = bitmap.getPixel(x, y);
                        int a = (pixel >>> 24) & 0xFF;
                        int r = (pixel >> 16) & 0xFF;
                        int g = (pixel >> 8) & 0xFF;
                        int b = pixel & 0xFF;
                        int luminance = (int) (r * 0.299 + g * 0.587 + b * 0.114);
                        // 1-bit monochrome binarization: dark pixel = 1, light background = 0
                        if (a > 30 && luminance < 230) {
                            byteVal |= (0x80 >> bit);
                        }
                    }
                }
                output.write(byteVal);
            }
        }
        return output.toByteArray();
    }
}
