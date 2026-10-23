# IPAX — References

Each identifier (`WCAG-RL`, `PUPIL-WY`, …) is the one that appears in the code comments (`src/*.js`) and in `docs/PARAMETERS.md`. This file is the only reference list: if the code cites an id that is not here, it is an error.

## How to read the verification status

| Status | Meaning |
|---|---|
| **A** | The page was opened and read during this work session. |
| **B** | It appears in search results with title, abstract or snippet; **the full text was not read**. |
| **C** | It is known only from an indirect citation by another source; the original was not opened. |
| **D** | Canonical or stable URL that was not opened in this session. |

Usage rule: a reference marked **A** or **B** supports the *direction* of an effect or the cited definition. No reference in this list by itself fixes the **magnitude** of an IPAX 1 penalty: those magnitudes are project heuristics (class `IPAX1` in the parameter registry) and are pending calibration and validation. Before presenting this document to a third party, open and re-read every source marked **B**, **C** and **D**.

---

## 1. Normative and legal basis (WCAG)

### WCAG-CR — Definition of *contrast ratio* (WCAG 2.2)
- Source: W3C, *Web Content Accessibility Guidelines 2.2*, definition "contrast ratio".
- URL: https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
- Supports: `(L1 + 0.05) / (L2 + 0.05)` with L1 the relative luminance of the lighter color. Origin of `wcag_flare = 0.05` and of the formula in `ColorMath.calculateWcagContrast`.
- Status: **D** (the content of the definition was seen in the W3C pages returned by search).
- Note: IPAX 2 reinterprets the 0.05 as an implicit environmental flare (decision D-12). That interpretation is **ours**, not the W3C's.

### WCAG-RL — Definition of *relative luminance*
- Source: W3C, WCAG 2.2, definition "relative luminance".
- URL: https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
- Supports: `Y = 0.2126 R + 0.7152 G + 0.0722 B` over linearized sRGB; threshold of the linear part of sRGB.
- Status: **D** (content seen via search).

### WCAG-LARGE — Large-scale text
- URL: https://www.w3.org/TR/WCAG22/#dfn-large-scale
- Supports: large text = at least 18 pt (≈ 24 px) or 14 pt bold (≈ 18.67 px). IPAX 1 uses 24 px and 18.5 px (`large_text_px_*`); telemetry only.
- Status: **D**.

### WCAG-360 — Threshold 0.03928 vs 0.04045
- Source: community WCAG issue about the threshold discrepancy.
- URL: https://github.com/w3c/wcag/issues/360
- Supports: the historical WCAG text used 0.03928; the sRGB standard value is 0.04045 (the one IPAX uses and the one in force in WCAG 2.2). The difference in luminance is less than 1e-5.
- Status: **B**.

### WCAG-143 — Understanding SC 1.4.3 (Contrast Minimum)
- URL: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Supports: justification of 3:1 (large text), 4.5:1 (AA) and their origin: 3:1 comes from ISO 9241-3 and ANSI-HFES-100-1988; 4.5:1 is obtained by multiplying by 1.5 to compensate for the loss of contrast sensitivity at an acuity of ≈ 20/40 (citing Arditi and Faye).
- Status: **B** (content seen via search).
- Use in IPAX: knots of the base curve (levels 1 and 2) and basis for the geometric step ×1.5 (D-03).

### WCAG-146 — Understanding SC 1.4.6 (Contrast Enhanced)
- URL: https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html
- Supports: AAA = 7:1 (≈ 4.5 × 1.5), associated with an acuity of ≈ 20/80.
- Status: **B**.

### ARDITI-FAYE — Contrast and acuity in low vision
- Source: Arditi, A. and Faye, E., *Monocular and binocular letter contrast sensitivity and letter acuity in a diverse ophthalmologic practice* (cited by WCAG).
- URL: not opened; cited through WCAG-143.
- Supports (according to WCAG): factor 1.5 of contrast sensitivity loss per doubling of acuity loss. NOTA ESTRUCTURAL: La extrapolación matemática de este factor para proyectar el Nivel 4 (10:1) y Nivel 5 (15:1) es una elaboración analítica propia de IPAX y no cuenta con validación experimental directa en esta fuente.
- Status: **C**.
- Documented caveat: in public W3C lists it was noted that the acuity–contrast relationship is not deterministic and depends on assumptions about display hardware:
  - https://lists.w3.org/Archives/Public/w3c-wai-gl/2015OctDec/0050.html (**B**)
  - https://lists.w3.org/Archives/Public/public-comments-wcag20/2004Sep/0005.html (**B**)
  That second point is the one IPAX 2 models with the flare `F` and the environment profile.

---

## 2. Color spaces and lightness

### OKLAB — Oklab
- Source: Ottosson, B. (2020), *A perceptual color space for image processing*.
- URL: https://bottosson.github.io/posts/oklab/
- Supports: matrices M1 and M2 used in `ColorMath.hexToOklch` (in IPAX 1 rounded to 5 decimals; maximum deviation measured against the published constants: 1.03e-5).
- Status: **D** (the URL is known by citation from OKHSL; the published constants are used only as verification in the tests).

### OKHSL — Okhsv and Okhsl (estimated lightness L_r)
- Source: Ottosson, B. (2021), *Two new color spaces for color picking – Okhsv and Okhsl*.
- URL: https://bottosson.github.io/posts/colorpicker/
- Supports: Oklab "has no concept of reference white" (its L is independent of scale) and the author proposes a lightness estimate L_r (a *toe* function) that, with a defined reference white, looks more like CIELAB.
- Status: **A**.
- Use in IPAX: justifies treating the dark end of L with care (D-06). Important clarification: L_r compresses the dark end but **is still a cube root of Y near 0**, so it does not bound the slope per hex step; that is why IPAX uses a linear segment in Y like CIELAB and sRGB (CIELAB, CIE-LSTAR).

### CIELAB — CIELAB, linear segment of L*
- URL: https://en.wikipedia.org/wiki/CIELAB_color_space
- Supports: below `Y/Yn = (6/29)^3 ≈ 0.008856`, L* is linear in Y (`L* = (29/3)^3 · Y/Yn ≈ 903.3 · Y/Yn`); the linear part avoids the infinite slope of the cube root at 0. The join point (6/29) is the value of `toe_knee_l`.
- Status: **B** (secondary source; the primary definition is CIE 15).

### CIE-LSTAR — L* constants and their join
- URL: https://photonstophotos.net/GeneralTopics/Exposure/Psychometric_Lightness_and_Gamma.htm
- Supports: linear/cubic form of L* and the constant 903.3 / 0.008856.
- Status: **B**.
- Note: the join with the traditional constants 0.008856 and 903.3 has a tiny numerical discontinuity; the IPAX *toe* uses `L³/knee²`, which joins exactly at the knee (C0 continuity by construction, proven in `tests/invariants.test.mjs`).

---

## 3. Mathematics of the curves

### GLSL-SMOOTHSTEP — Hermite interpolation
- URL: https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml
- Supports: `t = clamp((x−e0)/(e1−e0), 0, 1); t·t·(3−2t)`, a native GLSL function. `Curves.sstep` is identical, so the core transpiles 1:1 to a shader (SSOT of the IPAX 2 simulator).
- Status: **B**.

### LSE — log-sum-exp / softmin
- URL: https://en.wikipedia.org/wiki/LogSumExp
- Supports: `softmin(a,b) = −τ·ln(e^{−a/τ} + e^{−b/τ})`; bound `min(a,b) − τ·ln2 ≤ softmin ≤ min(a,b)`. Used only with an injected APCA engine, mode `auto` (D-04).
- Status: **D**.

---

## 4. Pupil and optics

### PUPIL-WY — Unified pupil formula
- Source: Watson, A. B. and Yellott, J. I. (2012), *A unified formula for light-adapted pupil size*, Journal of Vision.
- URL: https://humansystems.arc.nasa.gov/publications/watson_formula_pupilsize.pdf
- Supports: the Stanley–Davies form `D = 7.75 − 5.75·[(L·a/846)^0.41 / ((L·a/846)^0.41 + 2)]` (L in cd/m², a in deg²), and that the best optical quality generally occurs with smaller pupils.
- Status: **A**.
- Use in IPAX 1: motivates the **direction** of halation and mydriasis (dark field → large pupil → worse retinal image) and the order of magnitude of `mydriasis_l_span` (≈ 0.4 cd/m² on a 250-nit display, where the pupil is already near its maximum). It does not fix any gain.
- Documented correction: the version of that formula that circulated in the Gemini interconsultation had the 846 outside the exponent and a different denominator; the correct one is the one above.

### POL-2013 / POL-2014 / POL-NN — Positive polarity advantage
- POL-2013: Piepenbrock, C., Mayr, S., Mund, I. and Buchner, A. (2013), *Positive display polarity is advantageous for both younger and older adults*, Ergonomics 56(7):1116-24. URL: https://doi.org/10.1080/00140139.2013.790485 (**B**).
- POL-2014: Piepenbrock, C., Mayr, S. and Buchner, A. (2014), Ergonomics. URL: https://doi.org/10.1080/00140139.2014.960014 (**B**).
- POL-NN (secondary): https://www.nngroup.com/articles/dark-mode/ (**B**).
- Support: dark text on a light background performs better in reading and proofreading tasks, in both younger and older adults; one proposed explanation is pupil size tied to display luminance.
- Use in IPAX 1: direction of `halation`, `mydriasis`, `glare` and `paper_tone`. It does **not** support any gain or threshold value.
- Caveat: the effect is moderate in size and depends on display luminance and environment.

---

## 5. Chromatic terms

### LH1987 and BLOBS — Isoluminance (term `jitter`)
- LH1987: Livingstone, M. S. and Hubel, D. H. (1987), *Psychophysical evidence for separate channels for the perception of form, color, movement, and depth*, J. Neurosci. 7(11):3416–3468. URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC6569044 (**B**).
- BLOBS (evidence against a strong reading): *Blobs versus bars: psychophysical evidence supports two types of orientation response in human color vision*. URL: https://research.aston.ac.uk/en/publications/blobs-versus-bars-psychophysical-evidence-supports-two-types-of-o/ (**B**).
- Support: LH1987 proposes that purely chromatic (isoluminant) contrast poorly supports form, motion and depth; later work shows that color vision does contribute oriented responses, so the evidence is **mixed**.
- Use: direction of the `jitter` term. Magnitude: IPAX 1 heuristic.

### CHROMO-KITAOKA, CHROMO-TMS93, CHROMO-OZ15 — Chromostereopsis
- CHROMO-KITAOKA: Kitaoka, A. (2015), reference-work entry *Chromostereopsis*. URL: https://www.psy.ritsumei.ac.jp/akitaoka/Kitaoka2015_ReferenceWorkEntry_Chromostereopsis.pdf (**B**).
- CHROMO-TMS93: Thompson, P., May, K. and Stone, R. (1993), *Chromostereopsis: a multicomponent depth effect?*, Displays 14(4). URL: https://www-users.york.ac.uk/~pt2/ThompsonMayStone1993.pdf (**B**).
- CHROMO-OZ15: Ozolinsh, M. and Muizniece, K. (2015), Frontiers in Psychology 6:337. URL: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.00337/pdf (**B**).
- Support: the effect is stronger with saturated red and blue and varies between observers (some perceive it with inverted sign).
- Use: direction of `chromostereopsis`. Reading studies with text/background color combinations showed no large effects on reading speed (see the work of the UGR group, https://colorimaginglab.ugr.es/pages/pdfs/visionresearch_2020/ — URL as returned by search, **B**). Conclusion: the term is an ergonomic warning, not a proof of illegibility.

### SCONE-NASA, SCONE-PMC, LEGGE-IV — S cones and blue text
- SCONE-NASA: NASA, *Color Usage* (blue on black). URL: https://colorusage.arc.nasa.gov/blue_2.php (**B**).
- SCONE-PMC: article on S-cone density (≈ 1 % of cones in the central fovea, rising to ≈ 6–8 % around 2°). URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC4289478 (**B**). Original by Curcio et al. (1991, J. Comp. Neurol.) and Williams, MacLeod and Hayhoe (1981, foveal tritanopia): **C**.
- LEGGE-IV: Legge, G.E., Rubin, G.S. and Luebker, A. (1986). *Psychophysics of reading. IV. Wavelength effects in normal and low vision*, JOSA A 3(1):40-51. URL: https://legge.dl8.umn.edu/sites/legge.psych.umn.edu/files/files/media/legge86_psychophysics_of_reading._iv._wavelength_effects_in_normal_and_low_vision.pdf (**B**).
- Support: S cones are sparse and of low spatial resolution; legibility is determined mostly by luminance contrast and not by the specific color.
- Use: direction of `s_cone` (dark blue text, high chroma).

### SCC-SK08, SCC-BRENNER03, SCC-VSS, SCC-SCIREP20 — Simultaneous chromatic induction
- SCC-SK08: Shevell, S. K. and Kingdom, F. A. A. (2008), *Color in complex scenes*, Annu. Rev. Psychol. URL: https://mvr.mcgill.ca/Fred/Papers/Shevell&Kingdom_2008.pdf (**B**).
- SCC-BRENNER03: Brenner, E. et al. (2003), *Chromatic induction* (Vision Research). URL: https://personal.fgb.vu.nl/~jsmeets/2003/Chromatic_induction-VIR03.pdf (**B**).
- SCC-VSS: conference abstract (Vision Sciences Society) on chromatic induction: the strength of induction at different surround hue angles is highly correlated, consistent with a broad factor mediating induction. URL: https://visionsciences.org/presentation/?id=2380 (**B**).
- SCC-SCIREP20: Scientific Reports (2020). URL: https://link.springer.com/article/10.1038/s41598-020-77241-5 (**B**). It notes that the luminance contrast between center and surround affects the magnitude of simultaneous color contrast.
- Support: a neutral target adopts the complementary tint of the chromatic surround; induction decreases with distance from the surround.
- Use: basis for D-05 (induction on **achromatic** text depends on the surround, not on the text's "hue"). Pending: the effect of magnitude with high luminance contrast (black on yellow) is not calibrated.

### HK-FP91, HK-2023, HK-PLOS — Helmholtz–Kohlrausch effect
- HK-FP91: Fairchild, M. D. and Pirrotta, E. (1991), Color Research & Application 16 — cited in the Wikipedia review. URL: https://en.wikipedia.org/wiki/Helmholtz%E2%80%93Kohlrausch_effect (**B**). Original: **C**.
- HK-2023: High, G., Green, P. and Nussbaum, P. (2023), *The Helmholtz–Kohlrausch effect on display-based light colors and simulated substrate colors*, Color Res. Appl. 48(2):167–177. URL: https://hdl.handle.net/11250/3110488 (**B**). Finding noted in the abstract: strong effect in bluish colors, negligible in yellowish ones, peak around red-magenta.
- HK-PLOS: *The Brightness of Colour*, PLoS ONE (2009). URL: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC2659800/ (**B**; verify authors).
- Support: saturated colors appear brighter than a gray of the same luminance, with hue dependence.
- Use: shape of `hk_effect` (Gaussians in red and blue). The score gate (D-09) and the gain are IPAX 1 heuristics.

---

## 6. Reading margin (context for levels 4 and 5)

Levels 4 and 5 (ratios 10:1 and 15:1) are an extrapolation of the ×1.5 step implicit in the WCAG justification (3 → 4.5 → ≈ 7 → ≈ 10 → ≈ 15). **No** source in this list validates those values. The low-vision literature uses the idea of *reserve* (acuity and contrast above threshold for fluent reading); in this session only one secondary source mentioning an acuity reserve of approximately 2:1 was seen:
- https://lists.w3.org/Archives/Public/public-low-vision-a11y-tf/2017May/0007.html (**B**, secondary)
- Whittaker, S. G. and Lovie-Kitchin, J. (1993) and Lovie-Kitchin and Whittaker (1999): **C**, not opened.
A source that gave a contrast reserve value ("10:1") was study material with no clear authorship and **was discarded**. The contrast values for levels 4 and 5 are **hypotheses** (D-03).

---

## 7. What is NOT supported by this list (explicit statement)

1. No gain, threshold or exponent of the IPAX 1 penalties (`halation_gain = 0.8`, `glare_gain = 1.0`, `chromo_gain = 25`, etc.).
2. The knots 10:1 and 15:1.
3. The HK score gate and the choice of `simc_neutral_act = 1.0`.
4. The equivalence between an IPAX level and a specific acuity or reading ability.

---

_IPAX Scoring System v0.1.20 • 2026-10-22, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data)._