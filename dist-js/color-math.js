/**
 * IPAX Scoring System - Color Math
 * JSOL-style pseudocode (hand-written, pending real JSOL compiler).
 * Pure functions for color space conversion and luminance. Pure ESM, zero dependencies.
 */
export const ColorMath = {
    hexToOklch($sHex) {
        const $aRes = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec($sHex);
        if (!$aRes) return null;

        const $nR = parseInt($aRes[1], 16) / 255.0;
        const $nG = parseInt($aRes[2], 16) / 255.0;
        const $nB = parseInt($aRes[3], 16) / 255.0;

        const $fLin = function ($nC) {
            if ($nC <= 0.04045) {
                return $nC / 12.92;
            }
            return Math.pow(($nC + 0.055) / 1.055, 2.4);
        };

        const $nRl = $fLin($nR);
        const $nGl = $fLin($nG);
        const $nBl = $fLin($nB);

        const $nL_RGB = 0.41222 * $nRl + 0.53633 * $nGl + 0.05145 * $nBl;
        const $nM_RGB = 0.21190 * $nRl + 0.68070 * $nGl + 0.10740 * $nBl;
        const $nS_RGB = 0.08830 * $nRl + 0.28172 * $nGl + 0.62998 * $nBl;

        const $nL_ = Math.cbrt($nL_RGB);
        const $nM_ = Math.cbrt($nM_RGB);
        const $nS_ = Math.cbrt($nS_RGB);

        const $nL = 0.21045 * $nL_ + 0.79362 * $nM_ - 0.00407 * $nS_;
        const $nA = 1.97799 * $nL_ - 2.42859 * $nM_ + 0.45059 * $nS_;
        const $nB_ = 0.02590 * $nL_ + 0.78277 * $nM_ - 0.80868 * $nS_;

        let $nH = Math.atan2($nB_, $nA) * (180.0 / Math.PI);
        if ($nH < 0) {
            $nH = $nH + 360.0;
        }

        const $nC = Math.sqrt($nA * $nA + $nB_ * $nB_);

        return {
            l: $nL,
            c: $nC,
            h: $nH,
            hex: $sHex.toUpperCase()
        };
    },

    relativeLuminanceWCAG($sHex) {
        const $aRes = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec($sHex);
        if (!$aRes) return 0;

        const $nR = parseInt($aRes[1], 16) / 255.0;
        const $nG = parseInt($aRes[2], 16) / 255.0;
        const $nB = parseInt($aRes[3], 16) / 255.0;

        const $fLin = function ($nC) {
            if ($nC <= 0.04045) {
                return $nC / 12.92;
            }
            return Math.pow(($nC + 0.055) / 1.055, 2.4);
        };

        return 0.2126 * $fLin($nR) + 0.7152 * $fLin($nG) + 0.0722 * $fLin($nB);
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

    calculateWcagContrast($nTxtY, $nBgY) {
        const $nL1 = Math.max($nTxtY, $nBgY);
        const $nL2 = Math.min($nTxtY, $nBgY);
        return ($nL1 + 0.05) / ($nL2 + 0.05);
    }
};