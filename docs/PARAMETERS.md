# IPAX 1 (continuous) - Parameter registry

GENERATED FILE. Do not edit by hand: run `node tools/gen-docs.mjs` after changing `dist-js/ipax-params.js`.

Provenance classes: **NORM** published standard · **LIT** from literature · **IPAX1** inherited unchanged from the original code (empirical heuristic, not validated) · **DESIGN** introduced by the continuity refactor (decision D-xx in DECISIONS.md) · **DISPLAY** presentation threshold, never changes the score.

Reference ids (e.g. `WCAG-RL`) are defined in REFERENCES.md; `D-xx` ids in DECISIONS.md.

Totals: 92 parameters (NORM6, DESIGN18, IPAX160, LIT1, DISPLAY7).

## WCAG / legal base, large-text telemetry and APCA mode

| Parameter | Value | Unit | Class | Refs | Note |
|---|---|---|---|---|---|
| `wcag_flare` | 0.05 | relative luminance | NORM | `WCAG-CR` | Constant added to both luminances in the WCAG 2 contrast ratio. Interpreted in IPAX 2 as an implicit ambient flare term (decision D-12). |
| `knot_ratio_level1` | 3 | contrast ratio | NORM | `WCAG-143`, `ARDITI-FAYE` | WCAG 2 minimum for large text (AA large). IPAX level 1. |
| `knot_ratio_level2` | 4.5 | contrast ratio | NORM | `WCAG-143`, `ARDITI-FAYE` | WCAG 2 AA minimum (compensates ~20/40 acuity, 3 x 1.5). IPAX level 2. |
| `knot_ratio_level3` | 7 | contrast ratio | NORM | `WCAG-146`, `WCAG-143` | WCAG 2 AAA (compensates ~20/80 acuity). IPAX level 3. Last LEGAL level. |
| `knot_ratio_level4` | 10 | contrast ratio | DESIGN | `D-03`, `FAA-HFDS` | Beyond-legal level. Ergonomic target for optimal legibility (FAA Human Factors Design Standard). |
| `knot_ratio_level5` | 15 | contrast ratio | DESIGN | `D-03`, `FAA-HFDS` | Beyond-legal level. Threshold above which visual discomfort may occur (FAA Human Factors Design Standard). |
| `softmin_tau` | 0.05 | score points | DESIGN | `D-04`, `LSE` | Smoothing width of the softmin used to combine WCAG and APCA base scores when an APCA engine is injected. Maximum deviation from min() is tau*ln(2). |
| `large_text_px_normal` | 24 | CSS px | NORM | `WCAG-LARGE` | WCAG large-scale text, normal weight: 18 pt = 24 px. Telemetry (wcag.fontSize) for the 3:1 to 4.49:1 zone only; does not enter the score. |
| `large_text_px_bold` | 18.5 | CSS px | IPAX1 | `WCAG-LARGE` | Large-scale bold text. IPAX 1 value (v0.1.04+); WCAG 14 pt bold = 18.67 px. Telemetry only. |
| `bold_weight_min` | 700 | font-weight | NORM | `WCAG-LARGE` | Weight from which text counts as bold for the large-text size. |
| `apca_node_red` | 15 | \|Lc\| | DESIGN | `D-04` | APCA minimum for non-text elements: visible, not legible. Scale level 1 (red). It has NO WCAG equivalent: WCAG only says "fail" below 3:1. Used only with an injected engine. |
| `red_cap_level` | 1 | score | DESIGN | - | Score ceiling of a pair that fails WCAG (< 3:1) when an APCA engine decides between black and red. In WCAG-only mode the sub-3:1 ramp approaches this value. Pending entry in docs/DECISIONS.md. |
| `legal_min_level` | 2 | score | DESIGN | - | Scale level of the minimum legal tier (orange: WCAG 3:1, Lc 30). Ergonomic floor: ergonomics cannot take a pair below min(base, this level), so it never demotes a pair out of orange and never touches red or black. Keyed on the base, not on the WCAG level. Pending entry in docs/DECISIONS.md. |
| `apca_node_level1` | 30 | \|Lc\| | IPAX1 | `D-04` | IPAX 1 tier boundary, inherited. Used only in baseMode "auto" when an engine is injected. No APCA code or table is embedded. |
| `apca_node_level2` | 45 | \|Lc\| | IPAX1 | `D-04` | IPAX 1 tier boundary, inherited (mode "auto" with engine only). |
| `apca_node_level3` | 60 | \|Lc\| | IPAX1 | `D-04` | IPAX 1 tier boundary, inherited (mode "auto" with engine only). |
| `apca_node_level4` | 75 | \|Lc\| | IPAX1 | `D-04` | IPAX 1 tier boundary, inherited (mode "auto" with engine only). |
| `apca_node_level5` | 90 | \|Lc\| | IPAX1 | `D-04` | IPAX 1 tier boundary, inherited (mode "auto" with engine only). |

## Near-black regularization and polarity

| Parameter | Value | Unit | Class | Refs | Note |
|---|---|---|---|---|---|
| `toe_knee_l` | 0.206897 | OKLab L | LIT | `D-06`, `CIELAB`, `CIE-LSTAR`, `OKLAB`, `OKHSL` | Knee of the near-black toe = delta = 6/29, the junction of the linear and cube-root segments of CIELAB L* (Y = delta^3 = 0.008856). Below it, lightness is mapped linearly in luminance (L_eff = L^3/knee^2) and chroma is scaled by (L/knee)^2, removing the infinite slope of the cube root at black. IPAX 1 values are unchanged for L >= 0.2069 (sRGB gray >= #181818). Smaller knees (0.12, 0.15, 0.18) were tested and gave a worst per-hex-step change of 0.23, 0.15, 0.11 near black (docs/DECISIONS.md D-06); 6/29 gives 0.08. |
| `polarity_width` | 0.05 | OKLab L (signed) | DESIGN | `D-08` | Half-width of the smoothstep that replaces the boolean dark/light context (isDarkContext). |

## Chromatic penalties (jitter, chromostereopsis, S-cone, simultaneous contrast)

| Parameter | Value | Unit | Class | Refs | Note |
|---|---|---|---|---|---|
| `jitter_dl_max` | 0.15 | OKLab L | IPAX1 | `LH1987`, `BLOBS` | Lightness difference below which a chromatic pair is considered isoluminant. |
| `jitter_chroma_gate_hi` | 0.05 | OKLab C | IPAX1 | `D-07` | Original hard gate (C > 0.05 on both colors). Fully open at and above this value. |
| `jitter_chroma_gate_lo` | 0.02 | OKLab C | DESIGN | `D-07` | Start of the smoothstep ramp that replaces the hard chroma gate. |
| `jitter_chroma_gain` | 2 | 1/C | IPAX1 | - | chromaF = min(1, (Ct + Cb) * gain). |
| `jitter_max` | 1.5 | score points | IPAX1 | - | Maximum jitter penalty. |
| `chromo_chroma_gate_hi` | 0.12 | OKLab C | IPAX1 | `D-07` | Original hard gate (both colors). Fully open at and above this value. |
| `chromo_chroma_gate_lo` | 0.08 | OKLab C | DESIGN | `D-07` | Start of the smoothstep ramp. |
| `chromo_hue_start` | 30 | degrees | IPAX1 | `CHROMO-KITAOKA`, `CHROMO-TMS93` | Hue difference below which the effect is zero. Literature: strongest for red/blue; varies between observers. |
| `chromo_hue_span` | 60 | degrees | IPAX1 | - | Hue-difference span of the linear activation ramp. |
| `chromo_gain` | 25 | 1/C^2 | IPAX1 | - | Penalty = Ct * Cb * gain * activation. |
| `chromo_max` | 2 | score points | IPAX1 | - | Cap of the single term. |
| `scone_chroma_gate_hi` | 0.12 | OKLab C | IPAX1 | `D-07` | Original hard gate on text chroma. |
| `scone_chroma_gate_lo` | 0.08 | OKLab C | DESIGN | `D-07` | Start of the smoothstep ramp. |
| `scone_l_gate_lo` | 0.6 | OKLab L | IPAX1 | `SCONE-NASA` | Original gate (text darker than 0.6). Fully open at and below this value. |
| `scone_l_gate_hi` | 0.7 | OKLab L | DESIGN | `D-07` | End of the smoothstep ramp. |
| `scone_hue_center` | 260 | degrees | IPAX1 | `SCONE-NASA`, `SCONE-PMC` | Blue hue center. S-cones are sparse (~1% of foveal cones) with poor spatial resolution. |
| `scone_hue_halfwidth` | 30 | degrees | IPAX1 | - | Triangular activation half-width. |
| `scone_chroma_gain` | 3 | 1/C | IPAX1 | - | Penalty = min(1, C * gain) * hue activation. |
| `scone_max` | 1 | score points | IPAX1 | - | Cap of the single term. |
| `simc_bg_chroma_lo` | 0.08 | OKLab C | IPAX1 | `SCC-SK08`, `SCC-BRENNER03` | Background chroma where induction starts. |
| `simc_bg_chroma_span` | 0.06 | OKLab C | IPAX1 | - | Background chroma span to full strength. |
| `simc_txt_chroma_span` | 0.06 | OKLab C | IPAX1 | - | Text chroma at which the text is no longer susceptible (near-achromatic text only). |
| `simc_opp_center` | 120 | degrees | IPAX1 | - | Center of the hue-difference gaussian (only for text with a defined hue). |
| `simc_opp_sigma` | 50 | degrees | IPAX1 | - | Sigma of the hue-difference gaussian. |
| `simc_neutral_act` | 1 | activation | DESIGN | `D-05`, `SCC-VSS`, `SCC-BRENNER03` | Activation used for achromatic text (hue undefined). Equals the maximum of the original gaussian. Rationale: induction on a neutral target is driven by the surround, not by the target hue; magnitude is broadly similar across surround hues. Alternative behaviour-preserving value: 0.61 (mean of the original gaussian over uniform hue differences). Pending calibration. |
| `simc_txt_chroma_gate_lo` | 0.02 | OKLab C | DESIGN | `D-05` | Text chroma below which hue is treated as undefined (weight 0). |
| `simc_txt_chroma_gate_hi` | 0.06 | OKLab C | DESIGN | `D-05` | Text chroma above which hue is treated as defined (weight 1). |
| `simc_max` | 1 | score points | IPAX1 | - | Cap of the single term. |
| `chroma_total_cap` | 2 | score points | IPAX1 | - | Cap on the sum of chromo + scone + simc (proportional rescaling). |

## Luminance penalties (halation, mydriasis, glare)

| Parameter | Value | Unit | Class | Refs | Note |
|---|---|---|---|---|---|
| `halation_gain` | 0.8 | score points | IPAX1 | `POL-2013`, `POL-2014`, `PUPIL-WY` | Maximum halation penalty at full activation and unit lightness difference. |
| `halation_exp` | 2.5 | exponent | IPAX1 | - | Exponent on the lightness difference. |
| `halation_bg_l_max` | 0.25 | OKLab L | IPAX1 | - | Background lightness at which halation activation reaches zero (linear ramp from 0). |
| `halation_txt_l_min` | 0.75 | OKLab L | IPAX1 | - | Text lightness at which halation activation starts. |
| `halation_txt_l_span` | 0.25 | OKLab L | IPAX1 | - | Text lightness span to full activation. |
| `mydriasis_gain` | 0.4 | score points | IPAX1 | `POL-2014`, `PUPIL-WY` | Maximum mydriasis penalty (pure black background). |
| `mydriasis_l_span` | 0.12 | OKLab L | DESIGN | `D-06`, `PUPIL-WY` | IPAX 1 used 0.04, equivalent to Y < 6.4e-5, below the smallest non-zero 8-bit luminance (3.0e-4): only #000000 triggered it. Widened so that the penalty fades over several hex steps. 0.12 = Y 1.7e-3, about 0.4 cd/m2 on a 250-nit display, where the pupil is near its maximum. |
| `glare_l_start` | 0.96 | OKLab L | IPAX1 | `POL-2013` | Background lightness where glare starts. |
| `glare_l_span` | 0.04 | OKLab L | IPAX1 | - | Lightness span to full glare. |
| `glare_gain` | 1 | score points | IPAX1 | - | Maximum glare penalty (pure white background). |

## Helmholtz-Kohlrausch

| Parameter | Value | Unit | Class | Refs | Note |
|---|---|---|---|---|---|
| `hk_chroma_lo` | 0.08 | OKLab C | IPAX1 | `HK-FP91`, `HK-2023` | Chroma where the HK term starts. |
| `hk_chroma_span` | 0.2 | OKLab C | IPAX1 | - | Chroma span to full strength. |
| `hk_gain` | 0.5 | score points | IPAX1 | - | Maximum HK penalty. |
| `hk_hue_denom` | 2500 | degrees^2 | IPAX1 | `HK-2023`, `HK-PLOS` | 2*sigma^2 of the hue gaussians centered at red (0) and blue (270). Literature: strong in blue, negligible in yellow, peak around red-magenta. |
| `hk_red_center` | 0 | degrees | IPAX1 | - | Red hue center. |
| `hk_blue_center` | 270 | degrees | IPAX1 | - | Blue hue center. |
| `hk_max` | 0.5 | score points | IPAX1 | - | Cap of the single term. |
| `hk_gate_score_lo` | 4 | score | DESIGN | `D-09` | Base score where the HK term starts to apply (0-6 scale: previous value 3.0, +1). Replaces the IPAX 1 gate \|Lc\| >= 75 (APCA-specific). |
| `hk_gate_score_hi` | 5 | score | IPAX1 | `D-09` | Base score where the HK term is fully applied (IPAX 1: \|Lc\| >= 75; 0-6 scale: level 5). |

## Rewards

| Parameter | Value | Unit | Class | Refs | Note |
|---|---|---|---|---|---|
| `reward_gate_score_lo` | 3 | score | IPAX1 | - | Rewards start to apply above this score (smoothstep). 0-6 scale: previous value 2.0, +1. |
| `reward_gate_score_hi` | 4.5 | score | IPAX1 | - | Rewards fully apply above this score. 0-6 scale: previous value 3.5, +1. |
| `reward_penalty_ref` | 0.8 | score points | IPAX1 | - | Total penalty at which rewards are fully suppressed. |
| `paper_mid` | 0.915 | OKLab L | IPAX1 | `POL-2013`, `POL-2014` | Center of the paper-tone bonus. Heuristic; brighter positive-polarity displays reduce pupil size, but no literature value for this center. |
| `paper_width` | 0.027 | OKLab L | IPAX1 | - | Sigma of the paper-tone bonus. |
| `paper_gain` | 0.2 | score points | IPAX1 | - | Maximum paper-tone bonus. |
| `relief_chroma_max` | 0.03 | OKLab C | IPAX1 | - | Background chroma at which the chromatic-relief bonus reaches zero. |
| `relief_gain` | 0.2 | score points | IPAX1 | - | Maximum chromatic-relief bonus. |
| `swiss_txt_chroma_max` | 0.02 | OKLab C | IPAX1 | - | Text chroma at which the neutral-text-on-tint bonus reaches zero. |
| `swiss_bg_c_mid` | 0.07 | OKLab C | IPAX1 | - | Center of the background-tint gaussian. |
| `swiss_bg_c_sigma` | 0.04 | OKLab C | IPAX1 | - | Sigma of the background-tint gaussian. |
| `swiss_gain` | 0.15 | score points | IPAX1 | - | Maximum neutral-on-tint bonus. |
| `swiss_gate_lo_start` | 0.015 | OKLab C | DESIGN | `D-07` | Start of the ramp below the original lower bound (0.03). |
| `swiss_gate_lo_end` | 0.03 | OKLab C | IPAX1 | `D-07` | Original lower bound of the background tint (fully open at and above). |
| `swiss_gate_hi_start` | 0.12 | OKLab C | IPAX1 | `D-07` | Original upper bound (fully open at and below). |
| `swiss_gate_hi_end` | 0.16 | OKLab C | DESIGN | `D-07` | End of the ramp above the original upper bound. |
| `reward_total_cap` | 0.5 | score points | IPAX1 | - | Cap of the total reward. |

## Display-only thresholds

| Parameter | Value | Unit | Class | Refs | Note |
|---|---|---|---|---|---|
| `display_min_chroma_terms` | 0.15 | score points | DISPLAY | `D-10` | chromostereopsis, s_cone, sim_contrast warnings are listed above this value. |
| `display_min_jitter` | 0.2 | score points | DISPLAY | `D-10` | jitter warning threshold. |
| `display_min_halation` | 0.15 | score points | DISPLAY | `D-10` | halation warning threshold. |
| `display_min_mydriasis` | 0.1 | score points | DISPLAY | `D-10` | mydriasis warning threshold. |
| `display_min_glare` | 0.1 | score points | DISPLAY | `D-10` | glare warning threshold. |
| `display_min_hk` | 0.1 | score points | DISPLAY | `D-10` | hk_effect warning threshold. |
| `display_min_reward` | 0.02 | score points | DISPLAY | `D-10` | Individual bonus listing threshold. |

