/**
 * IPAX Scoring System - Core Engine  (continuous edition, scale 0-6)
 * Pure computational logic. Pure ESM.
 *
 * ARCHITECTURE (one direction of dependency, no cycles)
 *   ipax-params  ->  ipax-curves  ->  color-math  ->  ergonomics  ->  score  ->  orchestrator
 *
 * SCALE 0-6 (labels are arbitrary; positions match the six APCA tiers 1:1)
 *   0 black | 1 red (APCA Lc 15: visible, not legible) | 2 orange (WCAG 3:1 / Lc 30) | 3 yellow (4.5 / 45)
 *   4 cyan (7 / 60) | 5 lime (10 / 75) | 6 dark green (15 / 90)
 *   Level 1 has NO WCAG equivalent: below 3:1 WCAG only says "fail". It exists only with an APCA engine.
 *
 * SCORE PIPELINE
 *   1. Colors -> OKLCH (+ regularized lEff/cEff) and relative luminance Y.
 *   2. WCAG contrast ratio r = (Y1 + 0.05) / (Y2 + 0.05)                       [WCAG-CR]
 *   3. BASE SCORE
 *        WCAG: r >= 3 -> piecewise-linear in ln(r) through ratio 3 4.5 7 10 15 -> score 2 3 4 5 6.
 *              r <  3 -> ramp 0..1 (WCAG-only mode); with an APCA engine it is capped at red (1).
 *        APCA: |Lc| nodes 0 15 30 45 60 75 90 -> score 0 1 2 3 4 5 6.
 *      baseMode 'auto' (default): with an injected APCA engine,
 *        s_base = softmin(s_wcag_released, s_apca); the WCAG score binds levels up to 4 and is
 *        released (reaches 6) at ratio 10. Without an engine, s_base = s_wcag.
 *      baseMode 'wcag' forces the WCAG-only base whatever the host injects.
 *      WCAG fail therefore caps the pair at red, and APCA decides black vs red.
 *   4. Penalties (ergonomics.js), always accumulated, no thresholds.
 *   5. Rewards, gated smoothly.
 *   6. final = min( s_base, s_base - penalties + rewards ).
 *   7. ERGONOMIC FLOOR: ergonomics cannot take a pair below the orange level (2), nor touch a pair whose
 *      base is already lower (red, black): final = max(final, min(s_base, 2)). Keyed on the BASE, not on the
 *      WCAG level (an APCA-orange pair with a WCAG-yellow ratio must not be demoted to red either).
 *
 * LEGAL CEILING (structural, auditable)
 *   final <= s_base by construction (the floor in step 7 never exceeds s_base either).
 *   The legal level (legalLevel) is a step function because the law is a step function.
 *
 * CONTINUITY
 *   The score is continuous in the colors EXCEPT at the WCAG step at ratio 3 (base jumps from the red
 *   cap to orange). The floor of step 7 is continuous. Ergonomic terms stay continuous.
 */
import { ColorMath } from './color-math.js';
import { Ergonomics } from './ergonomics.js';
import { P } from './ipax-params.js';
import { Curves as C } from './ipax-curves.js';

// Knots of the WCAG base curve, scale positions 2..6 (ratio 3 -> 2 ... ratio 15 -> 6).
const KNOT_RATIOS = [P.knot_ratio_level1, P.knot_ratio_level2, P.knot_ratio_level3, P.knot_ratio_level4, P.knot_ratio_level5];
const KNOT_LN = KNOT_RATIOS.map(function ($n) { return Math.log($n); });
const KNOT_SCORES = [2.0, 3.0, 4.0, 5.0, 6.0];
// WCAG score used while an APCA engine decides the upper levels: it binds up to level 4 (ratio 7) and is
// released (score 6, i.e. not binding) from the ratio-10 knot on.
const RELEASED_LN = [Math.log(P.knot_ratio_level1), Math.log(P.knot_ratio_level2), Math.log(P.knot_ratio_level3), Math.log(P.knot_ratio_level4)];
const RELEASED_SCORES = [2.0, 3.0, 4.0, 6.0];
// APCA nodes: Lc 0 -> 0, 15 -> 1 (red), 30 -> 2, 45 -> 3, 60 -> 4, 75 -> 5, 90 -> 6.
const APCA_NODES = [0.0, P.apca_node_red, P.apca_node_level1, P.apca_node_level2, P.apca_node_level3, P.apca_node_level4, P.apca_node_level5];
const APCA_SCORES = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0];

/** Base curves (exported for audit tooling and tests). */
export const IPAX_BASE = {
    /** Base score in [0,6] from a WCAG contrast ratio r >= 1 (WCAG-only semantics). */
    fromRatio($nRatio) {
        if ($nRatio < P.knot_ratio_level1) {
            // Below 3:1 WCAG only says "fail". Ramp 0..red_cap; no red equivalence is invented for WCAG.
            return P.red_cap_level * Math.log($nRatio) / Math.log(P.knot_ratio_level1);
        }
        return C.interpLinear(Math.log($nRatio), KNOT_LN, KNOT_SCORES);
    },
    /** WCAG score with the upper levels released to the APCA engine (mode 'auto' with engine). */
    fromRatioReleased($nRatio) {
        if ($nRatio < P.knot_ratio_level1) {
            // WCAG fail: caps the pair at red; APCA decides black vs red.
            return P.red_cap_level;
        }
        return C.interpLinear(Math.log($nRatio), RELEASED_LN, RELEASED_SCORES);
    },
    /** WCAG position on the 0-6 scale (0 fail, 2..6 from the 3, 4.5, 7, 10, 15 steps). Discrete: labels and telemetry only. */
    extendedLevel($nRatio) {
        if ($nRatio >= P.knot_ratio_level5) return 6;
        if ($nRatio >= P.knot_ratio_level4) return 5;
        if ($nRatio >= P.knot_ratio_level3) return 4;
        if ($nRatio >= P.knot_ratio_level2) return 3;
        if ($nRatio >= P.knot_ratio_level1) return 2;
        return 0;
    },
    /** Base score in [0,6] from |Lc| (only with an injected engine). */
    fromApcaLc($nAbsLc) {
        return C.interpLinear($nAbsLc, APCA_NODES, APCA_SCORES);
    },
    /** Legal level on the 0-6 scale (0 fail, 2 = 3:1, 3 = 4.5:1, 4 = 7:1). Step function: the law is a step function. */
    legalLevel($nRatio) {
        if ($nRatio >= P.knot_ratio_level3) return 4;
        if ($nRatio >= P.knot_ratio_level2) return 3;
        if ($nRatio >= P.knot_ratio_level1) return 2;
        return 0;
    }
};

export const IPAX_CORE = {
    /**
     * @param {string} $sTextHex
     * @param {string} $sBgHex
     * @param {number} $nApcaLc          APCA Lc from an external engine (optional)
     * @param {boolean} $bApcaAvailable
     * @param {number} $nFontWeight      kept for API compatibility (not used by the score)
     * @param {string} $sForceContext    'auto' | 'dark' | 'light'
     * @param {string} $sBaseMode        'auto' (default: APCA if injected) | 'wcag' (WCAG only)
     */
    getScore($sTextHex, $sBgHex, $nApcaLc, $bApcaAvailable, $nFontWeight, $sForceContext, $sBaseMode) {

        // STEP 1: COLOR SPACE CONVERSION
        const $mTxtOklch = ColorMath.hexToOklch($sTextHex);
        const $mBgOklch = ColorMath.hexToOklch($sBgHex);
        if ($mTxtOklch === null || $mBgOklch === null) {
            return null;
        }
        const $nTxtY = ColorMath.relativeLuminanceWCAG($sTextHex);
        const $nBgY = ColorMath.relativeLuminanceWCAG($sBgHex);
        const $sMode = ($sBaseMode === 'wcag') ? 'wcag' : 'auto';
        const $bUseApca = ($sMode === 'auto') && $bApcaAvailable;

        // STEP 2: WCAG 2.x EVALUATION (labels are discrete by nature and do not enter the score)
        const $nWcagRatio = ColorMath.calculateWcagContrast($nTxtY, $nBgY);
        const $nLegalLevel = IPAX_BASE.legalLevel($nWcagRatio);
        // Without an APCA engine WCAG also grades the upper levels (10:1, 15:1); with an engine it stops at 7:1 (level 4).
        const $nExtLevel = IPAX_BASE.extendedLevel($nWcagRatio);
        const $nWcagScore = $bUseApca ? Math.min(4, $nExtLevel) : $nExtLevel;
        // Index = position on the 0-6 scale. Index 1 (red) has no WCAG equivalent and is never produced.
        const $aWcagGrades = ['Fail', 'Fail', 'AA (Large text)', 'AA', 'AAA', 'AAA (High)', 'AAA (Max)'];
        const $sWcagGrade = $aWcagGrades[$nWcagScore];
        const $nLargeTextPx = $nFontWeight >= P.bold_weight_min ? P.large_text_px_bold : P.large_text_px_normal;
        const $nWcagFontSize = ($nWcagScore === 2) ? $nLargeTextPx : null;

        // STEP 3: APCA TELEMETRY (only if the host injected an engine). Labels are discrete by nature.
        const $nAbsLc = Math.abs($nApcaLc);
        let $nApcaScore = null;
        let $sApcaGrade = 'Unavailable';
        if ($bApcaAvailable) {
            $nApcaScore = 0;
            $sApcaGrade = 'Fail';
            if ($nAbsLc >= P.apca_node_level5) { $nApcaScore = 6; $sApcaGrade = 'Gold'; }
            else if ($nAbsLc >= P.apca_node_level4) { $nApcaScore = 5; $sApcaGrade = 'Silver'; }
            else if ($nAbsLc >= P.apca_node_level3) { $nApcaScore = 4; $sApcaGrade = 'Bronze'; }
            else if ($nAbsLc >= P.apca_node_level2) { $nApcaScore = 3; $sApcaGrade = 'Basic'; }
            else if ($nAbsLc >= P.apca_node_level1) { $nApcaScore = 2; $sApcaGrade = 'Large text only'; }
            else if ($nAbsLc >= P.apca_node_red) { $nApcaScore = 1; $sApcaGrade = 'Non-text only'; }
        }

        // STEP 4: BASE SCORE
        const $nBaseWcag = IPAX_BASE.fromRatio($nWcagRatio);
        let $nBase = $nBaseWcag;
        const $aPenalties = [];
        if ($bUseApca) {
            $nBase = C.softmin(IPAX_BASE.fromRatioReleased($nWcagRatio), IPAX_BASE.fromApcaLc($nAbsLc), P.softmin_tau);
        } else if ($sMode === 'auto') {
            // The warning is VISIBLE (value 0: informative, it does not change the score).
            $aPenalties.push({ slug: 'apca_unavailable', val: 0.0 });
        }

        // STEP 5: POLARITY WEIGHTS (continuous; forced modes are configuration, not math)
        let $mPol = Ergonomics.polarityWeights($mTxtOklch, $mBgOklch);
        let $bIsDarkContext = $mBgOklch.l < $mTxtOklch.l;
        if ($sForceContext === 'dark') {
            $mPol = { wDark: 1.0, wLight: 0.0 };
            $bIsDarkContext = true;
        } else if ($sForceContext === 'light') {
            $mPol = { wDark: 0.0, wLight: 1.0 };
            $bIsDarkContext = false;
        }

        // STEP 6: PENALTIES (always accumulated)
        const $mErgo = Ergonomics.calculatePenalties($mTxtOklch, $mBgOklch, $mPol.wDark, $mPol.wLight, $nBase);
        for (let $i = 0; $i < $mErgo.warnings.length; $i = $i + 1) {
            $aPenalties.push($mErgo.warnings[$i]);
        }
        const $nTotalPenalty = $mErgo.totalPenalty;
        const $nAfterPenalty = Math.max(0.0, $nBase - $nTotalPenalty);

        // STEP 7: REWARDS
        const $mReward = Ergonomics.calculateRewards($mTxtOklch, $mBgOklch, $mPol.wLight, $nAfterPenalty, $nTotalPenalty);

        // STEP 8: FINAL SCORE with the structural legal ceiling...
        let $nFinalScore = Math.min($nBase, $nAfterPenalty + $mReward.totalReward);

        // ...and the ERGONOMIC FLOOR: ergonomics never takes a pair below the orange level (P.legal_min_level)
        // and never touches a pair whose base is already lower (red, black): floor = min(base, 2).
        // Keyed on the base, not on the WCAG level. Continuous. It never exceeds the base.
        const $nFloor = Math.min($nBase, P.legal_min_level);
        const $bLegalFloorActive = $nFloor > $nFinalScore;
        $nFinalScore = Math.max($nFinalScore, $nFloor);

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
            rewards: $mReward.bonuses,
            raw: {
                txtOklch: $mTxtOklch,
                bgOklch: $mBgOklch,
                txtY: $nTxtY,
                bgY: $nBgY,
                apcaLc: $nApcaLc,
                baseMode: $sMode,
                baseScore: $nBase,
                baseScoreWcag: $nBaseWcag,
                legalLevel: $nLegalLevel,
                legalFloorActive: $bLegalFloorActive,
                polarity: $mPol,
                penaltyTerms: $mErgo.terms,
                rewardTerms: $mReward.terms,
                rewardGating: $mReward.gating,
                totalReward: $mReward.totalReward
            }
        };
    }
};
