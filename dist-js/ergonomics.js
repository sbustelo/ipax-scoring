/* IPAX Scoring System v0.1.20 • 2026-10-22
 * Santiago Bustelo, https://ipax.bustelo.com.ar/ */
 
 /**
 * IPAX Scoring System - Ergonomics  (continuous edition)
 * JSOL-style pseudocode (hand-written, pending real JSOL compiler).
 * Pure functions for biological modeling and rewards. Pure ESM.
 *
 * DESIGN RULES (enforced by tests/nobranch.test.mjs and tests/continuity.test.mjs)
 *   R1  No `if`, ternary or `switch` in this file: every gate, ramp and weight is
 *       built from ipax-curves.js primitives (smoothstep, ramp, clamp, gauss).
 *   R2  No term is silenced below a threshold. IPAX 1 added some penalties only
 *       when they exceeded 0.1 or 0.15, creating a jump of that size. Here every
 *       term is always accumulated; thresholds survive only as DISPLAY thresholds
 *       (which warnings are listed), see P.display_min_*.
 *   R3  Every hard gate of IPAX 1 (e.g. "chroma > 0.12 on both colors") becomes a
 *       smoothstep ramp that is fully open AT AND INSIDE the original gate and
 *       tapers to zero OUTSIDE it. Inside the original domain each term equals its
 *       IPAX 1 value (verified against the previous release). Decision D-07.
 *   R4  Hue is meaningless for near-neutral colors: every hue-based term is weighted
 *       by chroma through a smoothstep (decision D-05).
 *   R5  Every lightness/chroma threshold reads the regularized coordinates lEff and
 *       cEff (identical to l and c except near black; decision D-06).
 *   R6  The boolean "dark context" is replaced by two continuous weights
 *       wDark and wLight (decision D-08).
 *   R7  No rounding inside the core. Display rounding (2 decimals) is applied
 *       only to the `val` shown in warnings.
 *
 * Literature (docs/REFERENCES.md). The functional forms and constants of the
 * penalty terms are IPAX 1 heuristics; the literature motivates the DIRECTION of
 * each effect, not its magnitude:
 *   jitter / isoluminance     LH1987 (form perception degrades at isoluminance; contested: BLOBS)
 *   chromostereopsis          CHROMO-KITAOKA, CHROMO-TMS93, CHROMO-OZ15 (strongest red/blue, observer-dependent)
 *   S-cone                    SCONE-NASA, SCONE-PMC, LEGGE-IV
 *   simultaneous contrast     SCC-SK08, SCC-BRENNER03, SCC-VSS, SCC-SCIREP20
 *   halation / mydriasis      POL-2013, POL-2014 (pupil size explains positive-polarity advantage), PUPIL-WY (large pupil, worse optics)
 *   glare                     POL-2013 (display luminance)
 *   Helmholtz-Kohlrausch      HK-FP91, HK-2023, HK-PLOS
 */
import { P } from './ipax-params.js';
import { Curves as C } from './ipax-curves.js';

/** Display rounding (R7). Never used for accumulation. */
const $fRound2 = function ($nV) {
    return Math.round($nV * 100.0) / 100.0;
};

export const Ergonomics = {

    // ======================================================================
    // Polarity weights (D-08). Auto mode: smooth function of the signed lightness
    // difference. wLight + wDark = 1. Forced modes are handled by the caller.
    // ======================================================================
    polarityWeights($mTxt, $mBg) {
        const $nWLight = C.sstep(-P.polarity_width, P.polarity_width, $mBg.lEff - $mTxt.lEff);
        return { wDark: 1.0 - $nWLight, wLight: $nWLight };
    },

    // ======================================================================
    // Chromatic terms
    // ======================================================================

    /** Isoluminant chromatic pair ("jitter"). LH1987. */
    jitter($mTxt, $mBg) {
        const $nIso = 1.0 - C.clamp01(Math.abs($mTxt.lEff - $mBg.lEff) / P.jitter_dl_max);
        const $nChromaF = Math.min(1.0, ($mTxt.cEff + $mBg.cEff) * P.jitter_chroma_gain);
        const $nGate = C.sstep(P.jitter_chroma_gate_lo, P.jitter_chroma_gate_hi, $mTxt.cEff)
            * C.sstep(P.jitter_chroma_gate_lo, P.jitter_chroma_gate_hi, $mBg.cEff);
        return Math.min(P.jitter_max, P.jitter_max * $nIso * $nChromaF * $nGate);
    },

    /** Chromostereopsis: saturated pairs with large hue difference. */
    chromostereopsis($mTxt, $mBg) {
        const $nHueDelta = C.hueDistance($mTxt.h, $mBg.h);
        const $nAct = C.clamp01(($nHueDelta - P.chromo_hue_start) / P.chromo_hue_span);
        const $nGate = C.sstep(P.chromo_chroma_gate_lo, P.chromo_chroma_gate_hi, $mTxt.cEff)
            * C.sstep(P.chromo_chroma_gate_lo, P.chromo_chroma_gate_hi, $mBg.cEff);
        return Math.min(P.chromo_max, $mTxt.cEff * $mBg.cEff * P.chromo_gain * $nAct * $nGate);
    },

    /** S-cone: saturated dark blue text (poor S-cone spatial resolution). */
    sCone($mTxt) {
        const $nBlueAct = Math.max(0.0, 1.0 - Math.abs($mTxt.h - P.scone_hue_center) / P.scone_hue_halfwidth);
        const $nGateC = C.sstep(P.scone_chroma_gate_lo, P.scone_chroma_gate_hi, $mTxt.cEff);
        const $nGateL = 1.0 - C.sstep(P.scone_l_gate_lo, P.scone_l_gate_hi, $mTxt.lEff);
        return Math.min(P.scone_max, Math.min(1.0, $mTxt.cEff * P.scone_chroma_gain) * $nBlueAct * $nGateC * $nGateL);
    },

    /**
     * Simultaneous contrast ("Hue Induction"). A near-neutral target takes the
     * complementary tint of a chromatic surround (SCC-SK08, SCC-BRENNER03).
     * D-05: for an achromatic text the hue is undefined, so the activation must not
     * depend on it. It is blended from a hue-independent value (simc_neutral_act)
     * to the original hue-difference gaussian as the text chroma becomes defined.
     */
    simContrast($mTxt, $mBg) {
        const $nBgStrength = C.clamp01(($mBg.cEff - P.simc_bg_chroma_lo) / P.simc_bg_chroma_span);
        const $nSusceptibility = C.clamp01(1.0 - $mTxt.cEff / P.simc_txt_chroma_span);
        const $nHueDelta = C.hueDistance($mTxt.h, $mBg.h);
        const $nOpponent = C.gauss($nHueDelta, P.simc_opp_center, 2.0 * P.simc_opp_sigma * P.simc_opp_sigma);
        const $nHueDefined = C.sstep(P.simc_txt_chroma_gate_lo, P.simc_txt_chroma_gate_hi, $mTxt.cEff);
        const $nAct = (1.0 - $nHueDefined) * P.simc_neutral_act + $nHueDefined * $nOpponent;
        return Math.min(P.simc_max, $nBgStrength * $nSusceptibility * $nAct);
    },

    /** The three chromatic terms with the proportional cap of IPAX 1. */
    chromaticTerms($mTxt, $mBg) {
        const $nChromo = Ergonomics.chromostereopsis($mTxt, $mBg);
        const $nScone = Ergonomics.sCone($mTxt);
        const $nSim = Ergonomics.simContrast($mTxt, $mBg);
        const $nRaw = $nChromo + $nScone + $nSim;
        const $nScale = Math.min(1.0, P.chroma_total_cap / Math.max($nRaw, 1e-12));
        return { chromo: $nChromo * $nScale, scone: $nScone * $nScale, sim: $nSim * $nScale };
    },

    // ======================================================================
    // Luminance-related terms (polarity dependent)
    // ======================================================================

    /** Halation: light text on a dark background (optical bleeding). POL-2013/2014, PUPIL-WY. */
    halation($mTxt, $mBg, $nWDark) {
        const $nBgAct = C.clamp01((P.halation_bg_l_max - $mBg.lEff) / P.halation_bg_l_max);
        const $nTxtAct = C.clamp01(($mTxt.lEff - P.halation_txt_l_min) / P.halation_txt_l_span);
        const $nDeltaL = Math.max(0.0, $mTxt.lEff - $mBg.lEff);
        return P.halation_gain * Math.pow($nDeltaL, P.halation_exp) * $nBgAct * $nTxtAct * $nWDark;
    },

    /** Mydriasis: very dark field, dilated pupil, worse retinal image. D-06. */
    mydriasis($mBg, $nWDark) {
        return P.mydriasis_gain * (1.0 - C.sstep(0.0, P.mydriasis_l_span, $mBg.lEff)) * $nWDark;
    },

    /** Glare: very bright background field. */
    glare($mBg, $nWLight) {
        return P.glare_gain * C.ramp(P.glare_l_start, P.glare_l_start + P.glare_l_span, $mBg.lEff) * $nWLight;
    },

    /** Helmholtz-Kohlrausch of one color (HK-FP91, HK-2023): hue and chroma dependent. */
    hkOne($mColor) {
        const $nChromaAct = C.clamp01(($mColor.cEff - P.hk_chroma_lo) / P.hk_chroma_span);
        const $nDRed = C.hueDistance($mColor.h, P.hk_red_center);
        const $nDBlue = C.hueDistance($mColor.h, P.hk_blue_center);
        const $nHueAct = Math.max(C.gauss($nDRed, 0.0, P.hk_hue_denom), C.gauss($nDBlue, 0.0, P.hk_hue_denom));
        return Math.min(P.hk_max, P.hk_gain * $nHueAct * $nChromaAct);
    },

    /** HK term of the pair, gated by how high the base score already is (D-09). */
    hk($mTxt, $mBg, $nBaseScore) {
        const $nGate = C.sstep(P.hk_gate_score_lo, P.hk_gate_score_hi, $nBaseScore);
        return Math.max(Ergonomics.hkOne($mTxt), Ergonomics.hkOne($mBg)) * $nGate;
    },

    // ======================================================================
    // Aggregation
    // ======================================================================

    /**
     * @param {Object} $mTxt  OKLCH text (with lEff, cEff)
     * @param {Object} $mBg   OKLCH background
     * @param {number} $nWDark weight of dark polarity [0,1]
     * @param {number} $nWLight weight of light polarity [0,1]
     * @param {number} $nBaseScore base score (gate of the HK term)
     * @returns {{terms:Object, totalPenalty:number, warnings:Array}}
     */
    calculatePenalties($mTxt, $mBg, $nWDark, $nWLight, $nBaseScore) {
        const $mChroma = Ergonomics.chromaticTerms($mTxt, $mBg);
        const $mTerms = {
            jitter: Ergonomics.jitter($mTxt, $mBg),
            chromostereopsis: $mChroma.chromo,
            s_cone: $mChroma.scone,
            sim_contrast: $mChroma.sim,
            halation: Ergonomics.halation($mTxt, $mBg, $nWDark),
            mydriasis: Ergonomics.mydriasis($mBg, $nWDark),
            glare: Ergonomics.glare($mBg, $nWLight),
            hk_effect: Ergonomics.hk($mTxt, $mBg, $nBaseScore)
        };

        const $nTotal = $mTerms.jitter + $mTerms.chromostereopsis + $mTerms.s_cone + $mTerms.sim_contrast
            + $mTerms.halation + $mTerms.mydriasis + $mTerms.glare + $mTerms.hk_effect;

        // Display layer only (R2): which terms are LISTED. Order as in IPAX 1.
        const $aCandidates = [
            { slug: 'jitter', val: $mTerms.jitter, min: P.display_min_jitter },
            { slug: 'chromostereopsis', val: $mTerms.chromostereopsis, min: P.display_min_chroma_terms },
            { slug: 's_cone', val: $mTerms.s_cone, min: P.display_min_chroma_terms },
            { slug: 'sim_contrast', val: $mTerms.sim_contrast, min: P.display_min_chroma_terms },
            { slug: 'halation', val: $mTerms.halation, min: P.display_min_halation },
            { slug: 'mydriasis', val: $mTerms.mydriasis, min: P.display_min_mydriasis },
            { slug: 'glare', val: $mTerms.glare, min: P.display_min_glare },
            { slug: 'hk_effect', val: $mTerms.hk_effect, min: P.display_min_hk }
        ];
        const $aWarnings = $aCandidates
            .filter(function ($m) { return $m.val > $m.min; })
            .map(function ($m) { return { slug: $m.slug, val: $fRound2($m.val) }; });

        return { terms: $mTerms, totalPenalty: $nTotal, warnings: $aWarnings };
    },

    /**
     * Rewards (reduce fatigue). Gated smoothly by the score after penalties and by the
     * total penalty. They can never lift the final score above the base score
     * (the caller applies min(base, ...)), which preserves the legal ceiling.
     */
    calculateRewards($mTxt, $mBg, $nWLight, $nScoreAfterPenalty, $nTotalPenalty) {
        const $nBioAct = C.sstep(P.reward_gate_score_lo, P.reward_gate_score_hi, $nScoreAfterPenalty);
        const $nPenAct = Math.max(0.0, 1.0 - $nTotalPenalty / P.reward_penalty_ref);
        const $nGating = $nBioAct * $nPenAct;

        // Paper tone: positive polarity only (weight wLight). The IPAX 1 cut at l <= 0.95 is removed
        // (it dropped 0.086 to 0); the gaussian decays by itself.
        const $nPaper = P.paper_gain * C.gauss($mBg.lEff, P.paper_mid, 2.0 * P.paper_width * P.paper_width) * $nWLight;

        // Chromatic relief: neutral background.
        const $nRelief = P.relief_gain * C.clamp01(1.0 - $mBg.cEff / P.relief_chroma_max);

        // Neutral text on a lightly tinted background. Original open interval (0.03, 0.12) becomes
        // a plateau with tapered edges.
        const $nTxtNeutrality = C.clamp01(1.0 - $mTxt.cEff / P.swiss_txt_chroma_max);
        const $nBgIntent = C.gauss($mBg.cEff, P.swiss_bg_c_mid, 2.0 * P.swiss_bg_c_sigma * P.swiss_bg_c_sigma);
        const $nBgGate = C.sstep(P.swiss_gate_lo_start, P.swiss_gate_lo_end, $mBg.cEff)
            * (1.0 - C.sstep(P.swiss_gate_hi_start, P.swiss_gate_hi_end, $mBg.cEff));
        const $nSwiss = P.swiss_gain * $nTxtNeutrality * $nBgIntent * $nBgGate;

        const $nTotal = Math.min(P.reward_total_cap, ($nPaper + $nRelief + $nSwiss) * $nGating);

        const $aCandidates = [
            { slug: 'paper_tone', val: $nPaper },
            { slug: 'chromatic_relief', val: $nRelief },
            { slug: 'achromatic_tint_contrast', val: $nSwiss }
        ];
        const $aBonuses = $aCandidates.filter(function ($m) {
            return $m.val > P.display_min_reward && $nGating > 0.0;
        });

        return {
            totalReward: $nTotal,
            gating: $nGating,
            terms: { paper_tone: $nPaper, chromatic_relief: $nRelief, achromatic_tint_contrast: $nSwiss },
            bonuses: $aBonuses
        };
    }
};
