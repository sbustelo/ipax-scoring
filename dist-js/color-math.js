/**
 * IPAX Scoring System - Color Math  (continuous edition)
 * JSOL-style pseudocode (hand-written, pending real JSOL compiler).
 * Pure functions for color space conversion and luminance. Pure ESM.
 *
 * Changes with respect to IPAX 1:
 *   - hexToOklch also returns lEff and cEff: lightness and chroma regularized
 *     near black (decision D-06). l, c, h are unchanged.
 *   - The sRGB linearization is defined once (linearizeSrgb) instead of twice.
 *   Numeric behaviour of l, c, h, relativeLuminanceWCAG, calculateWcagContrast
 *   is bit-identical to IPAX 1.
 *
 * References (docs/REFERENCES.md):
 *   WCAG-RL     Relative luminance: Y = 0.2126 R + 0.7152 G + 0.0722 B on linearized sRGB.
 *   WCAG-CR     Contrast ratio: (L1 + 0.05) / (L2 + 0.05).
 *   WCAG-360    The WCAG text historically used the threshold 0.03928; the sRGB
 *               standard value is 0.04045 (used here, and in WCAG 2.2). The
 *               difference is below 1e-5 in luminance.
 *   OKLAB       Ottosson (2020). Matrices below are the 5-decimal roundings of the
 *               published constants (max deviation ~1e-5).
 *   OKHSL       Ottosson (2021): Oklab "has no concept of reference white"; his L_r
 *               lightness estimate is closer to CIELAB for a defined white.
 *   CIELAB / CIE-LSTAR  Linear segment of L* below Y = (6/29)^3 keeps the slope
 *               finite at black. OKLab L = cbrt-based has infinite slope at 0.
 */
import { P } from './ipax-params.js';
import { Curves } from './ipax-curves.js';

export const ColorMath = {

    /** sRGB transfer function inverse (IEC 61966-2-1), channel in [0,1] -> linear. */
    linearizeSrgb($nC) {
        if ($nC <= 0.04045) {
            return $nC / 12.92;
        }
        return Math.pow(($nC + 0.055) / 1.055, 2.4);
    },

    parseHex($sHex) {
        const $aRes = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec($sHex);
        if (!$aRes) return null;
        return [parseInt($aRes[1], 16) / 255.0, parseInt($aRes[2], 16) / 255.0, parseInt($aRes[3], 16) / 255.0];
    },

    hexToOklch($sHex) {
        const $aRgb = ColorMath.parseHex($sHex);
        if ($aRgb === null) return null;

        const $nRl = ColorMath.linearizeSrgb($aRgb[0]);
        const $nGl = ColorMath.linearizeSrgb($aRgb[1]);
        const $nBl = ColorMath.linearizeSrgb($aRgb[2]);

        // Linear sRGB -> LMS (OKLAB, M1 matrix, 5-decimal rounding as in IPAX 1)
        const $nL_RGB = 0.41222 * $nRl + 0.53633 * $nGl + 0.05145 * $nBl;
        const $nM_RGB = 0.21190 * $nRl + 0.68070 * $nGl + 0.10740 * $nBl;
        const $nS_RGB = 0.08830 * $nRl + 0.28172 * $nGl + 0.62998 * $nBl;

        const $nL_ = Math.cbrt($nL_RGB);
        const $nM_ = Math.cbrt($nM_RGB);
        const $nS_ = Math.cbrt($nS_RGB);

        // LMS' -> Lab (OKLAB, M2 matrix)
        const $nL = 0.21045 * $nL_ + 0.79362 * $nM_ - 0.00407 * $nS_;
        const $nA = 1.97799 * $nL_ - 2.42859 * $nM_ + 0.45059 * $nS_;
        const $nB_ = 0.02590 * $nL_ + 0.78277 * $nM_ - 0.80868 * $nS_;

        // NOTE: for an achromatic color a = b = 0 and atan2(0, 0) = 0. That hue is
        // an artifact, not a physical hue: every consumer must weight hue-based
        // terms by a smoothstep of chroma (decision D-05, D-07).
        let $nH = Math.atan2($nB_, $nA) * (180.0 / Math.PI);
        if ($nH < 0) {
            $nH = $nH + 360.0;
        }

        const $nC = Math.sqrt($nA * $nA + $nB_ * $nB_);

        return {
            l: $nL,
            c: $nC,
            h: $nH,
            lEff: Curves.toeL($nL, P.toe_knee_l),
            cEff: $nC * Curves.toeChromaScale($nL, P.toe_knee_l),
            hex: $sHex.toUpperCase()
        };
    },

    relativeLuminanceWCAG($sHex) {
        const $aRgb = ColorMath.parseHex($sHex);
        if ($aRgb === null) return 0;
        return 0.2126 * ColorMath.linearizeSrgb($aRgb[0]) + 0.7152 * ColorMath.linearizeSrgb($aRgb[1]) + 0.0722 * ColorMath.linearizeSrgb($aRgb[2]);
    },

    getY($nL, $nC, $nH) {
        const $nHRad = $nH * Math.PI / 180.0;
        const $nA = $nC * Math.cos($nHRad);
        const $nB_ = $nC * Math.sin($nHRad);

        const $nL_ = $nL + 0.39633 * $nA + 0.21580 * $nB_;
        const $nM_ = $nL - 0.10556 * $nA - 0.06385 * $nB_;
        const $nS_ = $nL - 0.08948 * $nA - 1.29149 * $nB_;

        const $nRLin = Math.max(0, Math.min(1, 4.0767 * Math.pow($nL_, 3) - 3.3077 * Math.pow($nM_, 3) + 0.2309 * Math.pow($nS_, 3)));
        const $nGLin = Math.max(0, Math.min(1, -1.2684 * Math.pow($nL_, 3) + 2.6097 * Math.pow($nM_, 3) - 0.3413 * Math.pow($nS_, 3)));
        const $nBLin = Math.max(0, Math.min(1, -0.0041 * Math.pow($nL_, 3) - 0.7034 * Math.pow($nM_, 3) + 1.7076 * Math.pow($nS_, 3)));

        return 0.2126 * $nRLin + 0.7152 * $nGLin + 0.0722 * $nBLin;
    },

    /** WCAG 2 contrast ratio (WCAG-CR). The flare constant lives in the parameter registry. */
    calculateWcagContrast($nTxtY, $nBgY) {
        const $nL1 = Math.max($nTxtY, $nBgY);
        const $nL2 = Math.min($nTxtY, $nBgY);
        return ($nL1 + P.wcag_flare) / ($nL2 + P.wcag_flare);
    }
};
