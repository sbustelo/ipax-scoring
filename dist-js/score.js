/**
 * IPAX Scoring System - Core Engine
 * JSOL-style pseudocode (hand-written, pending real JSOL compiler).
 * Pure computational logic, ceiling clamping, and penalty aggregation.
 */
import { ColorMath } from './color-math.js';
import { Ergonomics } from './ergonomics.js';

export const IPAX_CORE = {
    getScore($sTextHex,$sBgHex, $nApcaLc,$bApcaAvailable, $nFontWeight,$sForceContext) {

        // STEP 1: COLOR SPACE CONVERSION
        // Convert HEX inputs to OKLCH for ergonomic modeling (perceptual lightness, chroma, hue).
        // Convert HEX inputs to Relative Luminance (Y) for backward-compatible normative formulas.
        const $mTxtOklch = ColorMath.hexToOklch($sTextHex);
        const $mBgOklch = ColorMath.hexToOklch($sBgHex);
        const $nTxtY = ColorMath.relativeLuminanceWCAG($sTextHex);
        const $nBgY = ColorMath.relativeLuminanceWCAG($sBgHex);

        if ($mTxtOklch === null || $mBgOklch === null) {
            return null;
        }

        // STEP 2: WCAG 2.x EVALUATION
        // Calculate standard contrast ratio and determine base score (0 to 3).
        const $nWcagRatio = ColorMath.calculateWcagContrast($nTxtY,$nBgY);

        let $nWcagScore = 0;
        let $sWcagGrade = "Fail";
        let $nWcagFontSize = null;

        if ($nWcagRatio >= 7.0) {$nWcagScore = 3; $sWcagGrade = "AAA"; $nWcagFontSize = 16; }
        else if ($nWcagRatio >= 4.5) {$nWcagScore = 2; $sWcagGrade = "AA"; $nWcagFontSize = 16; }
        else if ($nWcagRatio >= 3.0) {$nWcagScore = 1; $sWcagGrade = "AA (Large text)"; $nWcagFontSize = 24; }

        // STEP 3: APCA EVALUATION
        // Process Lightness Contrast (Lc) if the external engine is available.
        // Segments into scores (0 to 5).
        let $nAbsLc = Math.abs($nApcaLc);
        let $nApcaScore = null;
        let $sApcaGrade = "Unavailable";

        if ($bApcaAvailable) {$nApcaScore = 0;
            $sApcaGrade = "Fail";
            if ($nAbsLc >= 90) { $nApcaScore = 5; $sApcaGrade = "Gold"; }
            else if ($nAbsLc >= 75) { $nApcaScore = 4; $sApcaGrade = "Silver"; }
            else if ($nAbsLc >= 60) { $nApcaScore = 3; $sApcaGrade = "Bronze"; }
            else if ($nAbsLc >= 45) { $nApcaScore = 2; $sApcaGrade = "Basic"; }
            else if ($nAbsLc >= 30) { $nApcaScore = 1; $sApcaGrade = "Large text only"; }
        }

        // STEP 4: NORMATIVE INTERSECTION (COMPLIANCE LEVEL)
        // Strict minimum between WCAG and APCA. If either fails (0), the compliance level is 0.
        let $nComplianceLevel = $bApcaAvailable ? Math.floor(Math.min($nWcagScore, $nApcaScore)) :$nWcagScore;

        if (!$bApcaAvailable && $nComplianceLevel > 3) {$nComplianceLevel = 3;
        }

        let $nRawScore = 0.0;

        // Helper for linear interpolation to provide granular decimal scoring within a level.
        const $fGetDec = function ($nV,$nLvl, $nLo1,$nHi1, $nLo2,$nHi2) {
            if ($nLvl === 1) {
                if ($nV >=$nHi1) return 0.9;
                if ($nV <=$nLo1) return 0.0;
                return Math.round(((($nV - $nLo1) / ($nHi1 - $nLo1)) * 0.9) * 10.0) / 10.0;
			} else if ($nLvl === 2) {
                if ($nV >=$nHi2) return 0.9;
                if ($nV <=$nLo2) return 0.0;
                return Math.round(((($nV -$nLo2) / ($nHi2 -$nLo2)) * 0.9) * 10.0) / 10.0;
            }
            return 0.0;
        };

        // STEP 5: FRACTIONAL RAW SCORE CALCULATION
        if ($nComplianceLevel < 3) {
            const $nWcagDec =$fGetDec($nWcagRatio,$nComplianceLevel, 3.0, 4.5, 4.5, 7.0);
            const $nApcaDec =$bApcaAvailable ? $fGetDec($nAbsLc, $nComplianceLevel, 30.0, 60.0, 60.0, 75.0) :$nWcagDec;
            $nRawScore =$nComplianceLevel + Math.min($nWcagDec,$nApcaDec);
        } else if ($bApcaAvailable &&$nAbsLc < 75.0) {
            $nRawScore = 3.0 + Math.min(0.9, Math.max(0.0, ($nAbsLc - 60.0) / 15.0) * 0.9);
        } else if ($bApcaAvailable) {$nRawScore = $nAbsLc >= 90.0 ? 5.0 : 4.0;         } else {$nRawScore = 3.0;
        }

        // Determine visual polarity context (Light/Dark mode)
        let $bIsDarkContext = false;
        if ($sForceContext === 'dark') {$bIsDarkContext = true;
        } else if ($sForceContext === 'light') {$bIsDarkContext = false;
        } else {
            $bIsDarkContext = $mBgOklch.l <$mTxtOklch.l;
        }

        // STEP 6: PENALTY ACCUMULATION (ERGONOMIC FLAWS)
        let $nTotalPenalty = 0.0;
        let $aPenalties = [];

        if (!$bApcaAvailable) {$aPenalties.push({ slug: 'apca_unavailable', val: 1.0 });
        }

        const $nDeltaL = Math.abs($mTxtOklch.l -$mBgOklch.l);
        if ($nDeltaL < 0.15 && $mTxtOklch.c > 0.05 &&$mBgOklch.c > 0.05) {
            const $nIsoAct = Math.max(0.0, 1.0 - ($nDeltaL / 0.15));
            const $nChromaF = Math.min(1.0, ($mTxtOklch.c +$mBgOklch.c) * 2.0);
            const $nJitterPenalty = Math.min(1.5, Math.round((1.5 * $nIsoAct * $nChromaF) * 100.0) / 100.0);
            if ($nJitterPenalty > 0.2) {$aPenalties.push({ slug: 'jitter', val: $nJitterPenalty });$nTotalPenalty = $nTotalPenalty +$nJitterPenalty;
            }
        }

        const $mErgoData = Ergonomics.calculatePenalties($mTxtOklch,$mBgOklch, $bIsDarkContext);$nTotalPenalty = $nTotalPenalty +$mErgoData.totalPenalty;

        for (let $i = 0; $i < $mErgoData.warnings.length; $i = $i + 1) {$aPenalties.push($mErgoData.warnings[$i]);
        }

        if ($bApcaAvailable &&$nAbsLc >= 75.0) {
            const $nHkPenaltyRaw = Math.max(Ergonomics.calculateHK($mTxtOklch), Ergonomics.calculateHK($mBgOklch));
            if ($nHkPenaltyRaw > 0.1) {
                const $nHkPenalty = Math.round($nHkPenaltyRaw * 100.0) / 100.0;
                $nTotalPenalty = $nTotalPenalty +$nHkPenalty;
                $aPenalties.push({ slug: 'hk_effect', val:$nHkPenalty });
            }
        }

        // STEP 7: DEFENSIVE FLOOR APPLICATION
        // If the cross-compliance passed (>=1), ergonomic penalties cannot drop the score below 1.0.
        // If the cross-compliance level (the MINIMUM between WCAG and APCA) failed (0), the floor is 0.
        const $nFloor = $nComplianceLevel >= 1 ? 1.0 : 0.0;
        let $nFinalScore = Math.max($nFloor, $nRawScore -$nTotalPenalty);

        // STEP 8: REWARDS AND CEILINGS
        // Add bonuses for fatigue reduction, but cap the final score based on the underlying compliance limit.
        let $aRewards = [];
        const $mRewardData = Ergonomics.calculateRewards($mTxtOklch, $mBgOklch,$bIsDarkContext, $nFinalScore,$nTotalPenalty);

        if ($mRewardData.totalReward > 0.0) {
            let $nBoostedScore = $nFinalScore +$mRewardData.totalReward;

            if (!$bApcaAvailable) {
                $nFinalScore = Math.min(3.0,$nBoostedScore);
            } else if ($nComplianceLevel < 3) {$nFinalScore = Math.min($nComplianceLevel + 0.9,$nBoostedScore);
            } else {
                $nFinalScore = Math.min(5.0,$nBoostedScore);
            }

            for (let $j = 0; $j < $mRewardData.bonuses.length; $j = $j + 1) {$aRewards.push($mRewardData.bonuses[$j]);
            }
        }

        return {
            finalScore: $nFinalScore,
            wcagScore: $nWcagScore,
            wcagRatio: $nWcagRatio,
            wcagGrade: $sWcagGrade,
            wcagFontSize: $nWcagFontSize,
            apcaScore: $nApcaScore,
            apcaGrade: $sApcaGrade,
            isDarkContext: $bIsDarkContext,
            totalPenalty: $nTotalPenalty,
            penalties: $aPenalties,
            rewards: $aRewards,
            raw: {
                txtOklch: $mTxtOklch,
                bgOklch: $mBgOklch,
                txtY: $nTxtY,
                bgY: $nBgY,
                apcaLc: $nApcaLc
            }
        };
    }
};