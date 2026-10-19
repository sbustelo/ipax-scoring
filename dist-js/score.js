/**
 * IPAX Scoring System - Core Engine  (continuous edition)
 * JSOL-style pseudocode (hand-written, pending real JSOL compiler).
 * Pure computational logic. Pure ESM.
 *
 * ARCHITECTURE (one direction of dependency, no cycles)
 *   ipax-params  ->  ipax-curves  ->  color-math  ->  ergonomics  ->  score  ->  orchestrator
 *
 * SCORE PIPELINE
 *   1. Colors -> OKLCH (+ regularized lEff/cEff) and relative luminance Y.
 *   2. WCAG contrast ratio r = (Y1 + 0.05) / (Y2 + 0.05)                       [WCAG-CR]
 *   3. BASE SCORE  s_base = piecewise-linear interpolation of ln(r) through the knots
 *        ratio: 1   3   4.5   7   10   15
 *        score: 0   1   2     3   4    5                                       [D-01, D-03]
 *      Levels 1-3 are the legal levels (AA large, AA, AAA); 4-5 are beyond the law.
 *      baseMode 'auto' (default, as in IPAX 1 v0.1.06): if an APCA engine is injected,
 *      s_base = softmin(s_wcag_released, s_apca), where the WCAG score binds the levels
 *      0-3 and is released (reaches 5) at ratio 10; otherwise s_base = s_wcag.   [D-04]
 *      baseMode 'wcag' forces the WCAG-only base whatever the host injects.
 *   4. Penalties (ergonomics.js), always accumulated, no thresholds.            [D-02]
 *   5. Rewards, gated smoothly.
 *   6. final = clamp( min( s_base, s_base - penalties + rewards ), 0, 5 ).
 *
 * LEGAL CEILING (structural, auditable)                                         [D-01]
 *   final <= s_base by construction, therefore floor(final) can never exceed the
 *   level the law assigns to the color pair, whatever penalties, rewards or
 *   future plugins do. The legal level itself (legalLevel) is the ONLY step
 *   function of the engine, because the law is a step function. It is computed
 *   from the standard WCAG ratio of the colors alone.
 *
 * CONTINUITY
 *   Every quantity except legalLevel, wcagGrade, wcagFontSize and the APCA
 *   telemetry labels is a continuous function of the colors. Those four are
 *   discrete by nature and are NOT used by the score.
 */
import { ColorMath } from './color-math.js';
import { Ergonomics } from './ergonomics.js';
import { P } from './ipax-params.js';
import { Curves as C } from './ipax-curves.js';

// Knots of the base curve. Ratio 1 (no contrast) maps to score 0.
const KNOT_RATIOS = [1.0, P.knot_ratio_level1, P.knot_ratio_level2, P.knot_ratio_level3, P.knot_ratio_level4, P.knot_ratio_level5];
const KNOT_LN = KNOT_RATIOS.map(function ($n) { return Math.log($n); });
const KNOT_SCORES = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0];
// WCAG score used while an APCA engine decides levels 4-5 (IPAX 1 v0.1.06 semantics): it binds levels 0-3 and is
// released (score 5, i.e. not binding) from the level-4 ratio on. D-04.
const RELEASED_LN = [0.0, Math.log(P.knot_ratio_level1), Math.log(P.knot_ratio_level2), Math.log(P.knot_ratio_level3), Math.log(P.knot_ratio_level4)];
const RELEASED_SCORES = [0.0, 1.0, 2.0, 3.0, 5.0];
const APCA_NODES = [0.0, P.apca_node_level1, P.apca_node_level2, P.apca_node_level3, P.apca_node_level4, P.apca_node_level5];

/** Base curves (exported for audit tooling and tests). */
export const IPAX_BASE = {
    /** Continuous base score in [0,5] from a WCAG contrast ratio r >= 1. */
    fromRatio($nRatio) {
        return C.interpLinear(Math.log($nRatio), KNOT_LN, KNOT_SCORES);
    },
    /** WCAG score with levels 4-5 released to the APCA engine (mode 'auto' with engine). */
    fromRatioReleased($nRatio) {
        return C.interpLinear(Math.log($nRatio), RELEASED_LN, RELEASED_SCORES);
    },
    /** WCAG level 0-5 (extended with the 10:1 and 15:1 steps) from the ratio. Discrete: labels and telemetry only. */
    extendedLevel($nRatio) {
        if ($nRatio >= P.knot_ratio_level5) return 5;
        if ($nRatio >= P.knot_ratio_level4) return 4;
        if ($nRatio >= P.knot_ratio_level3) return 3;
        if ($nRatio >= P.knot_ratio_level2) return 2;
        if ($nRatio >= P.knot_ratio_level1) return 1;
        return 0;
    },
    /** Continuous base score in [0,5] from |Lc| (only with an injected engine). */
    fromApcaLc($nAbsLc) {
        return C.interpLinear($nAbsLc, APCA_NODES, KNOT_SCORES);
    },
    /** THE ONLY STEP FUNCTION: legal level (0-3) from the standard WCAG ratio. */
    legalLevel($nRatio) {
        if ($nRatio >= P.knot_ratio_level3) return 3;
        if ($nRatio >= P.knot_ratio_level2) return 2;
        if ($nRatio >= P.knot_ratio_level1) return 1;
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
        // IPAX 1 v0.1.04-06 contract: without an APCA engine WCAG also grades levels 4 and 5 (10:1, 15:1).
        const $nExtLevel = IPAX_BASE.extendedLevel($nWcagRatio);
        const $nWcagScore = $bUseApca ? Math.min(3, $nExtLevel) : $nExtLevel;
        const $aWcagGrades = ['Fail', 'AA (Large text)', 'AA', 'AAA', 'AAA (High)', 'AAA (Max)'];
        const $sWcagGrade = $aWcagGrades[$nWcagScore];
        const $nLargeTextPx = $nFontWeight >= P.bold_weight_min ? P.large_text_px_bold : P.large_text_px_normal;
        const $nWcagFontSize = ($nWcagScore === 1) ? $nLargeTextPx : null;

        // STEP 3: APCA TELEMETRY (only if the host injected an engine). Labels are discrete by nature.
        const $nAbsLc = Math.abs($nApcaLc);
        let $nApcaScore = null;
        let $sApcaGrade = 'Unavailable';
        if ($bApcaAvailable) {
            $nApcaScore = 0;
            $sApcaGrade = 'Fail';
            if ($nAbsLc >= P.apca_node_level5) { $nApcaScore = 5; $sApcaGrade = 'Gold'; }
            else if ($nAbsLc >= P.apca_node_level4) { $nApcaScore = 4; $sApcaGrade = 'Silver'; }
            else if ($nAbsLc >= P.apca_node_level3) { $nApcaScore = 3; $sApcaGrade = 'Bronze'; }
            else if ($nAbsLc >= P.apca_node_level2) { $nApcaScore = 2; $sApcaGrade = 'Basic'; }
            else if ($nAbsLc >= P.apca_node_level1) { $nApcaScore = 1; $sApcaGrade = 'Large text only'; }
        }

        // STEP 4: BASE SCORE (continuous)
        const $nBaseWcag = IPAX_BASE.fromRatio($nWcagRatio);
        let $nBase = $nBaseWcag;
        const $aPenalties = [];
        if ($bUseApca) {
            $nBase = C.softmin(IPAX_BASE.fromRatioReleased($nWcagRatio), IPAX_BASE.fromApcaLc($nAbsLc), P.softmin_tau);
        } else if ($sMode === 'auto') {
            // v0.1.05: the warning is VISIBLE (value 0: informative, it does not change the score).
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

        // STEP 8: FINAL SCORE with the structural legal ceiling.
        const $nFinalScore = Math.min($nBase, $nAfterPenalty + $mReward.totalReward);

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
                polarity: $mPol,
                penaltyTerms: $mErgo.terms,
                rewardTerms: $mReward.terms,
                rewardGating: $mReward.gating,
                totalReward: $mReward.totalReward
            }
        };
    }
};
