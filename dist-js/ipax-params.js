/**
 * IPAX 1 (continuous) - Parameter Registry
 * ----------------------------------------------------------------------------
 * SINGLE SOURCE OF TRUTH for every numeric constant used by the scoring core.
 * No module may contain a "magic number" that is not declared here, except
 * mathematical identities (0, 1, 2, 3 in smoothstep, 360 for hue wrap, etc.).
 *
 * Each entry: { v, unit, cls, refs, note }
 *
 *   cls  (provenance class):
 *     NORM    Normative definition taken from a published standard (WCAG, sRGB, CIE).
 *     LIT     Value or functional form derived from published literature.
 *     IPAX1   Inherited unchanged from the original IPAX 1 code base. It is an
 *             empirical heuristic of the project, NOT validated against data.
 *             Pending calibration (see docs/DECISIONS.md, section 7).
 *     DESIGN  Introduced by the continuity refactor (this version) to remove a
 *             discontinuity. Engineering choice, documented in docs/DECISIONS.md
 *             (decision log D-xx). Pending calibration.
 *     DISPLAY Presentation-layer threshold. It only decides which warnings are
 *             SHOWN; it never changes the numeric score.
 *
 *   refs: IDs of docs/REFERENCES.md (e.g. "WCAG-RL"). "D-xx" are decisions of docs/DECISIONS.md.
 *
 * The generated table docs/PARAMETERS.md is built from this file by tools/gen-docs.mjs.
 * Pure ESM, zero dependencies.
 */

const META = {

    // ---------------------------------------------------------------- WCAG / legal base
    wcag_flare: {
        v: 0.05, unit: 'relative luminance', cls: 'NORM', refs: ['WCAG-CR'],
        note: 'Constant added to both luminances in the WCAG 2 contrast ratio. Interpreted in IPAX 2 as an implicit ambient flare term (decision D-12).'
    },
    knot_ratio_level1: {
        v: 3, unit: 'contrast ratio', cls: 'NORM', refs: ['WCAG-143', 'ARDITI-FAYE'],
        note: 'WCAG 2 minimum for large text (AA large). IPAX level 1.'
    },
    knot_ratio_level2: {
        v: 4.5, unit: 'contrast ratio', cls: 'NORM', refs: ['WCAG-143', 'ARDITI-FAYE'],
        note: 'WCAG 2 AA minimum (compensates ~20/40 acuity, 3 x 1.5). IPAX level 2.'
    },
    knot_ratio_level3: {
        v: 7, unit: 'contrast ratio', cls: 'NORM', refs: ['WCAG-146', 'WCAG-143'],
        note: 'WCAG 2 AAA (compensates ~20/80 acuity). IPAX level 3. Last LEGAL level.'
    },
    knot_ratio_level4: {
        v: 10, unit: 'contrast ratio', cls: 'DESIGN', refs: ['D-03', 'WCAG-143', 'ARDITI-FAYE'],
        note: 'Beyond-legal level. Extrapolation of the x1.5 geometric step implied by the WCAG rationale (3 -> 4.5 -> ~7 -> ~10). HYPOTHESIS, not validated.'
    },
    knot_ratio_level5: {
        v: 15, unit: 'contrast ratio', cls: 'DESIGN', refs: ['D-03', 'WCAG-143', 'ARDITI-FAYE'],
        note: 'Beyond-legal level (~15.2 if the x1.5 step is continued). HYPOTHESIS, not validated. Maximum WCAG ratio is 21.'
    },
    softmin_tau: {
        v: 0.05, unit: 'score points', cls: 'DESIGN', refs: ['D-04', 'LSE'],
        note: 'Smoothing width of the softmin used to combine WCAG and APCA base scores when an APCA engine is injected. Maximum deviation from min() is tau*ln(2).'
    },

    large_text_px_normal: { v: 24, unit: 'CSS px', cls: 'NORM', refs: ['WCAG-LARGE'], note: 'WCAG large-scale text, normal weight: 18 pt = 24 px. Telemetry (wcag.fontSize) for the 3:1 to 4.49:1 zone only; does not enter the score.' },
    large_text_px_bold: { v: 18.5, unit: 'CSS px', cls: 'IPAX1', refs: ['WCAG-LARGE'], note: 'Large-scale bold text. IPAX 1 value (v0.1.04+); WCAG 14 pt bold = 18.67 px. Telemetry only.' },
    bold_weight_min: { v: 700, unit: 'font-weight', cls: 'NORM', refs: ['WCAG-LARGE'], note: 'Weight from which text counts as bold for the large-text size.' },

    // ---------------------------------------------------------------- Optional APCA nodes (mode "auto" with an engine)
    apca_node_level1: { v: 30, unit: '|Lc|', cls: 'IPAX1', refs: ['D-04'], note: 'IPAX 1 tier boundary, inherited. Used only in baseMode "auto" when an engine is injected. No APCA code or table is embedded.' },
    apca_node_level2: { v: 45, unit: '|Lc|', cls: 'IPAX1', refs: ['D-04'], note: 'IPAX 1 tier boundary, inherited (mode "auto" with engine only).' },
    apca_node_level3: { v: 60, unit: '|Lc|', cls: 'IPAX1', refs: ['D-04'], note: 'IPAX 1 tier boundary, inherited (mode "auto" with engine only).' },
    apca_node_level4: { v: 75, unit: '|Lc|', cls: 'IPAX1', refs: ['D-04'], note: 'IPAX 1 tier boundary, inherited (mode "auto" with engine only).' },
    apca_node_level5: { v: 90, unit: '|Lc|', cls: 'IPAX1', refs: ['D-04'], note: 'IPAX 1 tier boundary, inherited (mode "auto" with engine only).' },

    // ---------------------------------------------------------------- Regularization near black
    toe_knee_l: {
        v: 6 / 29, unit: 'OKLab L', cls: 'LIT', refs: ['D-06', 'CIELAB', 'CIE-LSTAR', 'OKLAB', 'OKHSL'],
        note: 'Knee of the near-black toe = delta = 6/29, the junction of the linear and cube-root segments of CIELAB L* (Y = delta^3 = 0.008856). Below it, lightness is mapped linearly in luminance (L_eff = L^3/knee^2) and chroma is scaled by (L/knee)^2, removing the infinite slope of the cube root at black. IPAX 1 values are unchanged for L >= 0.2069 (sRGB gray >= #181818). Smaller knees (0.12, 0.15, 0.18) were tested and gave a worst per-hex-step change of 0.23, 0.15, 0.11 near black (docs/DECISIONS.md D-06); 6/29 gives 0.08.'
    },
    polarity_width: {
        v: 0.05, unit: 'OKLab L (signed)', cls: 'DESIGN', refs: ['D-08'],
        note: 'Half-width of the smoothstep that replaces the boolean dark/light context (isDarkContext).'
    },

    // ---------------------------------------------------------------- Jitter (isoluminant chromatic pair)
    jitter_dl_max: { v: 0.15, unit: 'OKLab L', cls: 'IPAX1', refs: ['LH1987', 'BLOBS'], note: 'Lightness difference below which a chromatic pair is considered isoluminant.' },
    jitter_chroma_gate_hi: { v: 0.05, unit: 'OKLab C', cls: 'IPAX1', refs: ['D-07'], note: 'Original hard gate (C > 0.05 on both colors). Fully open at and above this value.' },
    jitter_chroma_gate_lo: { v: 0.02, unit: 'OKLab C', cls: 'DESIGN', refs: ['D-07'], note: 'Start of the smoothstep ramp that replaces the hard chroma gate.' },
    jitter_chroma_gain: { v: 2.0, unit: '1/C', cls: 'IPAX1', refs: [], note: 'chromaF = min(1, (Ct + Cb) * gain).' },
    jitter_max: { v: 1.5, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Maximum jitter penalty.' },

    // ---------------------------------------------------------------- Chromostereopsis
    chromo_chroma_gate_hi: { v: 0.12, unit: 'OKLab C', cls: 'IPAX1', refs: ['D-07'], note: 'Original hard gate (both colors). Fully open at and above this value.' },
    chromo_chroma_gate_lo: { v: 0.08, unit: 'OKLab C', cls: 'DESIGN', refs: ['D-07'], note: 'Start of the smoothstep ramp.' },
    chromo_hue_start: { v: 30, unit: 'degrees', cls: 'IPAX1', refs: ['CHROMO-KITAOKA', 'CHROMO-TMS93'], note: 'Hue difference below which the effect is zero. Literature: strongest for red/blue; varies between observers.' },
    chromo_hue_span: { v: 60, unit: 'degrees', cls: 'IPAX1', refs: [], note: 'Hue-difference span of the linear activation ramp.' },
    chromo_gain: { v: 25, unit: '1/C^2', cls: 'IPAX1', refs: [], note: 'Penalty = Ct * Cb * gain * activation.' },
    chromo_max: { v: 2.0, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Cap of the single term.' },

    // ---------------------------------------------------------------- S-cone
    scone_chroma_gate_hi: { v: 0.12, unit: 'OKLab C', cls: 'IPAX1', refs: ['D-07'], note: 'Original hard gate on text chroma.' },
    scone_chroma_gate_lo: { v: 0.08, unit: 'OKLab C', cls: 'DESIGN', refs: ['D-07'], note: 'Start of the smoothstep ramp.' },
    scone_l_gate_lo: { v: 0.6, unit: 'OKLab L', cls: 'IPAX1', refs: ['SCONE-NASA'], note: 'Original gate (text darker than 0.6). Fully open at and below this value.' },
    scone_l_gate_hi: { v: 0.7, unit: 'OKLab L', cls: 'DESIGN', refs: ['D-07'], note: 'End of the smoothstep ramp.' },
    scone_hue_center: { v: 260, unit: 'degrees', cls: 'IPAX1', refs: ['SCONE-NASA', 'SCONE-PMC'], note: 'Blue hue center. S-cones are sparse (~1% of foveal cones) with poor spatial resolution.' },
    scone_hue_halfwidth: { v: 30, unit: 'degrees', cls: 'IPAX1', refs: [], note: 'Triangular activation half-width.' },
    scone_chroma_gain: { v: 3.0, unit: '1/C', cls: 'IPAX1', refs: [], note: 'Penalty = min(1, C * gain) * hue activation.' },
    scone_max: { v: 1.0, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Cap of the single term.' },

    // ---------------------------------------------------------------- Simultaneous contrast ("Hue induction")
    simc_bg_chroma_lo: { v: 0.08, unit: 'OKLab C', cls: 'IPAX1', refs: ['SCC-SK08', 'SCC-BRENNER03'], note: 'Background chroma where induction starts.' },
    simc_bg_chroma_span: { v: 0.06, unit: 'OKLab C', cls: 'IPAX1', refs: [], note: 'Background chroma span to full strength.' },
    simc_txt_chroma_span: { v: 0.06, unit: 'OKLab C', cls: 'IPAX1', refs: [], note: 'Text chroma at which the text is no longer susceptible (near-achromatic text only).' },
    simc_opp_center: { v: 120, unit: 'degrees', cls: 'IPAX1', refs: [], note: 'Center of the hue-difference gaussian (only for text with a defined hue).' },
    simc_opp_sigma: { v: 50, unit: 'degrees', cls: 'IPAX1', refs: [], note: 'Sigma of the hue-difference gaussian.' },
    simc_neutral_act: {
        v: 1.0, unit: 'activation', cls: 'DESIGN', refs: ['D-05', 'SCC-VSS', 'SCC-BRENNER03'],
        note: 'Activation used for achromatic text (hue undefined). Equals the maximum of the original gaussian. Rationale: induction on a neutral target is driven by the surround, not by the target hue; magnitude is broadly similar across surround hues. Alternative behaviour-preserving value: 0.61 (mean of the original gaussian over uniform hue differences). Pending calibration.'
    },
    simc_txt_chroma_gate_lo: { v: 0.02, unit: 'OKLab C', cls: 'DESIGN', refs: ['D-05'], note: 'Text chroma below which hue is treated as undefined (weight 0).' },
    simc_txt_chroma_gate_hi: { v: 0.06, unit: 'OKLab C', cls: 'DESIGN', refs: ['D-05'], note: 'Text chroma above which hue is treated as defined (weight 1).' },
    simc_max: { v: 1.0, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Cap of the single term.' },
    chroma_total_cap: { v: 2.0, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Cap on the sum of chromo + scone + simc (proportional rescaling).' },

    // ---------------------------------------------------------------- Dark polarity: halation, mydriasis
    halation_gain: { v: 0.8, unit: 'score points', cls: 'IPAX1', refs: ['POL-2013', 'POL-2014', 'PUPIL-WY'], note: 'Maximum halation penalty at full activation and unit lightness difference.' },
    halation_exp: { v: 2.5, unit: 'exponent', cls: 'IPAX1', refs: [], note: 'Exponent on the lightness difference.' },
    halation_bg_l_max: { v: 0.25, unit: 'OKLab L', cls: 'IPAX1', refs: [], note: 'Background lightness at which halation activation reaches zero (linear ramp from 0).' },
    halation_txt_l_min: { v: 0.75, unit: 'OKLab L', cls: 'IPAX1', refs: [], note: 'Text lightness at which halation activation starts.' },
    halation_txt_l_span: { v: 0.25, unit: 'OKLab L', cls: 'IPAX1', refs: [], note: 'Text lightness span to full activation.' },
    mydriasis_gain: { v: 0.4, unit: 'score points', cls: 'IPAX1', refs: ['POL-2014', 'PUPIL-WY'], note: 'Maximum mydriasis penalty (pure black background).' },
    mydriasis_l_span: {
        v: 0.12, unit: 'OKLab L', cls: 'DESIGN', refs: ['D-06', 'PUPIL-WY'],
        note: 'IPAX 1 used 0.04, equivalent to Y < 6.4e-5, below the smallest non-zero 8-bit luminance (3.0e-4): only #000000 triggered it. Widened so that the penalty fades over several hex steps. 0.12 = Y 1.7e-3, about 0.4 cd/m2 on a 250-nit display, where the pupil is near its maximum.'
    },

    // ---------------------------------------------------------------- Light polarity: glare
    glare_l_start: { v: 0.96, unit: 'OKLab L', cls: 'IPAX1', refs: ['POL-2013'], note: 'Background lightness where glare starts.' },
    glare_l_span: { v: 0.04, unit: 'OKLab L', cls: 'IPAX1', refs: [], note: 'Lightness span to full glare.' },
    glare_gain: { v: 1.0, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Maximum glare penalty (pure white background).' },

    // ---------------------------------------------------------------- Helmholtz-Kohlrausch
    hk_chroma_lo: { v: 0.08, unit: 'OKLab C', cls: 'IPAX1', refs: ['HK-FP91', 'HK-2023'], note: 'Chroma where the HK term starts.' },
    hk_chroma_span: { v: 0.20, unit: 'OKLab C', cls: 'IPAX1', refs: [], note: 'Chroma span to full strength.' },
    hk_gain: { v: 0.5, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Maximum HK penalty.' },
    hk_hue_denom: { v: 2500, unit: 'degrees^2', cls: 'IPAX1', refs: ['HK-2023', 'HK-PLOS'], note: '2*sigma^2 of the hue gaussians centered at red (0) and blue (270). Literature: strong in blue, negligible in yellow, peak around red-magenta.' },
    hk_red_center: { v: 0, unit: 'degrees', cls: 'IPAX1', refs: [], note: 'Red hue center.' },
    hk_blue_center: { v: 270, unit: 'degrees', cls: 'IPAX1', refs: [], note: 'Blue hue center.' },
    hk_max: { v: 0.5, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Cap of the single term.' },
    hk_gate_score_lo: { v: 3.0, unit: 'score', cls: 'DESIGN', refs: ['D-09'], note: 'Base score where the HK term starts to apply. Replaces the IPAX 1 gate |Lc| >= 75 (APCA-specific).' },
    hk_gate_score_hi: { v: 4.0, unit: 'score', cls: 'IPAX1', refs: ['D-09'], note: 'Base score where the HK term is fully applied (IPAX 1: |Lc| >= 75, mapped to level 4).' },

    // ---------------------------------------------------------------- Rewards
    reward_gate_score_lo: { v: 2.0, unit: 'score', cls: 'IPAX1', refs: [], note: 'Rewards start to apply above this score (smoothstep).' },
    reward_gate_score_hi: { v: 3.5, unit: 'score', cls: 'IPAX1', refs: [], note: 'Rewards fully apply above this score.' },
    reward_penalty_ref: { v: 0.8, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Total penalty at which rewards are fully suppressed.' },
    paper_mid: { v: 0.915, unit: 'OKLab L', cls: 'IPAX1', refs: ['POL-2013', 'POL-2014'], note: 'Center of the paper-tone bonus. Heuristic; brighter positive-polarity displays reduce pupil size, but no literature value for this center.' },
    paper_width: { v: 0.027, unit: 'OKLab L', cls: 'IPAX1', refs: [], note: 'Sigma of the paper-tone bonus.' },
    paper_gain: { v: 0.2, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Maximum paper-tone bonus.' },
    relief_chroma_max: { v: 0.03, unit: 'OKLab C', cls: 'IPAX1', refs: [], note: 'Background chroma at which the chromatic-relief bonus reaches zero.' },
    relief_gain: { v: 0.2, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Maximum chromatic-relief bonus.' },
    swiss_txt_chroma_max: { v: 0.02, unit: 'OKLab C', cls: 'IPAX1', refs: [], note: 'Text chroma at which the neutral-text-on-tint bonus reaches zero.' },
    swiss_bg_c_mid: { v: 0.07, unit: 'OKLab C', cls: 'IPAX1', refs: [], note: 'Center of the background-tint gaussian.' },
    swiss_bg_c_sigma: { v: 0.04, unit: 'OKLab C', cls: 'IPAX1', refs: [], note: 'Sigma of the background-tint gaussian.' },
    swiss_gain: { v: 0.15, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Maximum neutral-on-tint bonus.' },
    swiss_gate_lo_start: { v: 0.015, unit: 'OKLab C', cls: 'DESIGN', refs: ['D-07'], note: 'Start of the ramp below the original lower bound (0.03).' },
    swiss_gate_lo_end: { v: 0.03, unit: 'OKLab C', cls: 'IPAX1', refs: ['D-07'], note: 'Original lower bound of the background tint (fully open at and above).' },
    swiss_gate_hi_start: { v: 0.12, unit: 'OKLab C', cls: 'IPAX1', refs: ['D-07'], note: 'Original upper bound (fully open at and below).' },
    swiss_gate_hi_end: { v: 0.16, unit: 'OKLab C', cls: 'DESIGN', refs: ['D-07'], note: 'End of the ramp above the original upper bound.' },
    reward_total_cap: { v: 0.5, unit: 'score points', cls: 'IPAX1', refs: [], note: 'Cap of the total reward.' },

    // ---------------------------------------------------------------- Display-only thresholds (never change the score)
    display_min_chroma_terms: { v: 0.15, unit: 'score points', cls: 'DISPLAY', refs: ['D-10'], note: 'chromostereopsis, s_cone, sim_contrast warnings are listed above this value.' },
    display_min_jitter: { v: 0.2, unit: 'score points', cls: 'DISPLAY', refs: ['D-10'], note: 'jitter warning threshold.' },
    display_min_halation: { v: 0.15, unit: 'score points', cls: 'DISPLAY', refs: ['D-10'], note: 'halation warning threshold.' },
    display_min_mydriasis: { v: 0.1, unit: 'score points', cls: 'DISPLAY', refs: ['D-10'], note: 'mydriasis warning threshold.' },
    display_min_glare: { v: 0.1, unit: 'score points', cls: 'DISPLAY', refs: ['D-10'], note: 'glare warning threshold.' },
    display_min_hk: { v: 0.1, unit: 'score points', cls: 'DISPLAY', refs: ['D-10'], note: 'hk_effect warning threshold.' },
    display_min_reward: { v: 0.02, unit: 'score points', cls: 'DISPLAY', refs: ['D-10'], note: 'Individual bonus listing threshold.' }
};

/** Flat read-only view: P.wcag_flare -> 0.05 */
export const P = Object.freeze(Object.fromEntries(Object.entries(META).map(([k, m]) => [k, m.v])));

/** Full metadata (read-only) for documentation and audit tooling. */
export const PARAM_META = Object.freeze(META);
