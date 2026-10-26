# IPAX — References

This document is the reference registry for the IPAX Scoring System.

Each reference identifier (`WCAG-RL`, `PUPIL-WY`, etc.) corresponds to an identifier used in source-code comments and project documentation. References cited in the implementation should be registered here.

**Parameter values are not maintained in this document.** The Single Source of Truth (SSOT) for numerical parameters is [`dist-js/ipax-params.js`](../dist-js/ipax-params.js). Any discussion of parameter values, including gains, thresholds, exponents, and caps, must refer to that file rather than duplicating its contents.

The reference registry establishes the scientific, technical, or normative basis for individual concepts. It does not establish the quantitative validity of IPAX's ergonomic scoring model.

## How to read the verification status

| Status | Meaning |
|---|---|
| **A** | The source was opened and read during the research or documentation session in which its status was assigned. |
| **B** | The source appeared in search results with a title, abstract, or snippet; the full text was not read. |
| **C** | The source is known only through an indirect citation; the original was not opened. |
| **D** | A canonical or stable URL is recorded, but the source was not directly verified. |

These statuses record the provenance of the original research. They are not automatically upgraded when this document is edited.

**Evidence rule:** A reference may support the existence, definition, or direction of an effect without supporting its magnitude in the IPAX model.

Numerical ergonomic parameters are project-specific modeling decisions unless explicitly identified otherwise. Their current values and provenance classifications are maintained in [`dist-js/ipax-params.js`](../dist-js/ipax-params.js).

Before using this registry as an externally verified bibliography, recheck the original sources, particularly those marked **B**, **C**, or **D**.

---

## 1. Normative and legal basis (WCAG)

### WCAG-CR — Definition of *contrast ratio* (WCAG 2.2)

- Source: W3C, *Web Content Accessibility Guidelines 2.2*, definition of contrast ratio.
- URL: https://www.w3.org/TR/WCAG22/#dfn-contrast-ratio
- Supports: `(L1 + 0.05) / (L2 + 0.05)`, where `L1` is the relative luminance of the lighter color.
- Status: **D**.
- Use in IPAX: Normative basis for WCAG contrast-ratio calculations and the WCAG component of the scoring model.

The WCAG contrast formula includes the constant `0.05`. IPAX 2 investigates an interpretation of this constant as an implicit environmental flare term (decision D-12).

**That interpretation belongs to IPAX; it is not a claim made by WCAG.**

The corresponding implementation parameters are defined in [`dist-js/ipax-params.js`](../dist-js/ipax-params.js).

### WCAG-RL — Definition of *relative luminance*

- Source: W3C, WCAG 2.2, definition of relative luminance.
- URL: https://www.w3.org/TR/WCAG22/#dfn-relative-luminance
- Supports: `Y = 0.2126 R + 0.7152 G + 0.0722 B` over linearized sRGB, including the standard sRGB transfer function.
- Status: **D**.
- Use in IPAX: WCAG relative-luminance calculation, independently of the OKLCH representation used by the ergonomic model.

### WCAG-LARGE — Large-scale text

- Source: W3C, WCAG 2.2, definition of large-scale text.
- URL: https://www.w3.org/TR/WCAG22/#dfn-large-scale
- Supports: Large-scale text is at least 18 pt (24 CSS px), or 14 pt (approximately 18.67 CSS px) when bold.
- Status: **D**.
- Use in IPAX: WCAG typography requirements for text using the 3:1 contrast threshold.

WCAG does not prescribe a universal minimum font size for text meeting the applicable 4.5:1 or 7:1 contrast requirement.

IPAX's implementation-specific typography constants are maintained in [`dist-js/ipax-params.js`](../dist-js/ipax-params.js). Typography recommendations are separate from the color-pair score.

### WCAG-360 — Threshold 0.03928 vs. 0.04045

- Source: W3C WCAG GitHub issue #360.
- URL: https://github.com/w3c/wcag/issues/360
- Supports: The historical discrepancy between the sRGB transfer-function thresholds `0.03928` and `0.04045`. WCAG 2.2 uses `0.04045`.
- Status: **B**.
- Use in IPAX: Verification of the sRGB linearization used for WCAG relative luminance.

### WCAG-143 — Understanding SC 1.4.3 (Contrast Minimum)

- Source: W3C, *Understanding Success Criterion 1.4.3: Contrast (Minimum)*.
- URL: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html
- Supports: WCAG's 3:1 requirement for large-scale text and 4.5:1 requirement for normal text, together with the historical rationale involving contrast sensitivity and visual acuity.
- Status: **B**.
- Use in IPAX: Normative basis for WCAG contrast classification and reference points for the scoring model.

The numerical mapping from WCAG contrast ratios to IPAX scores is an IPAX design decision, not a WCAG requirement.

### WCAG-146 — Understanding SC 1.4.6 (Contrast Enhanced)

- Source: W3C, *Understanding Success Criterion 1.4.6: Contrast (Enhanced)*.
- URL: https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html
- Supports: The enhanced contrast requirement of 7:1 for normal text and 4.5:1 for large-scale text.
- Status: **B**.
- Use in IPAX: Normative basis for WCAG AAA contrast classification.

### ARDITI-FAYE — Contrast sensitivity and visual acuity

- Source: Arditi, A., and Faye, E., *Monocular and binocular letter contrast sensitivity and letter acuity in a diverse ophthalmologic practice*.
- Original URL: Not directly verified; cited through WCAG-143.
- Supports: The relationship between reductions in visual acuity and contrast sensitivity as discussed in WCAG's rationale.
- Status: **C**.

The relationship is not deterministic and depends on assumptions about visual conditions and display characteristics.

Related W3C discussions:

- https://lists.w3.org/Archives/Public/w3c-wai-gl/2015OctDec/0050.html — **B**.
- https://lists.w3.org/Archives/Public/public-comments-wcag20/2004Sep/0005.html — **B**.

Use in IPAX: Research context for environmental and physiological modeling. These sources do not establish a direct conversion between IPAX scores and visual acuity.

---

## 2. Color spaces and lightness

### OKLAB — Oklab

- Source: Ottosson, B. (2020), *A perceptual color space for image processing*.
- URL: https://bottosson.github.io/posts/oklab/
- Supports: Oklab color-space transformations, including the matrices used to convert between linear RGB and Oklab.
- Status: **D**.
- Use in IPAX: Mathematical basis for OKLCH conversion and the lightness, chroma, and hue coordinates used by ergonomic calculations.

The precision of implementation constants and their numerical deviations from published values must be established by implementation tests, not inferred from this reference alone.

### OKHSL — Okhsv and Okhsl

- Source: Ottosson, B. (2021), *Two new color spaces for color picking — Okhsv and Okhsl*.
- URL: https://bottosson.github.io/posts/colorpicker/
- Supports: Discussion of perceptual lightness, reference-white assumptions, and the use of a toe function to improve behavior near black.
- Status: **A**.
- Use in IPAX: Research context for regularizing lightness near absolute black (decision D-06).

IPAX uses its own regularization strategy. The cited Okhsl toe function is not presented as the implementation of IPAX's regularization.

### CIELAB — CIELAB linear segment of L*

- Source: CIELAB color-space definition; secondary explanation.
- URL: https://en.wikipedia.org/wiki/CIELAB_color_space
- Supports: The piecewise definition of CIELAB lightness, including a linear segment below the cube-root transition.
- Status: **B**.
- Primary normative reference: CIE 15.
- Use in IPAX: Mathematical precedent for avoiding an unbounded derivative at absolute black.

The corresponding IPAX transition parameters are defined in [`dist-js/ipax-params.js`](../dist-js/ipax-params.js).

### CIE-LSTAR — L* constants and transition

- Source: *Psychometric Lightness and Gamma*.
- URL: https://photonstophotos.net/GeneralTopics/Exposure/Psychometric_Lightness_and_Gamma.htm
- Supports: The linear/cubic structure of CIELAB lightness and its transition constants.
- Status: **B**.
- Use in IPAX: Reference for the mathematical construction of a continuous near-black regularization.

IPAX's exact continuity properties are implementation claims and must be verified by its tests.

---

## 3. Mathematics of the curves

### GLSL-SMOOTHSTEP — Hermite interpolation

- Source: Khronos Group, OpenGL reference for `smoothstep`.
- URL: https://registry.khronos.org/OpenGL-Refpages/gl4/html/smoothstep.xhtml
- Supports:

  `t = clamp((x − e0) / (e1 − e0), 0, 1)`

  `smoothstep = t²(3 − 2t)`

- Status: **B**.
- Use in IPAX: Mathematical reference for the continuous interpolation primitive implemented in `dist-js/ipax-curves.js`.

The function's suitability for shader implementations follows from its standard GLSL definition. Full cross-target numerical equivalence remains an implementation-verification requirement.

### LSE — Log-sum-exp / softmin

- Source: LogSumExp mathematical identity.
- URL: https://en.wikipedia.org/wiki/LogSumExp
- Supports:

  `softmin(a, b) = −τ ln(e^(−a/τ) + e^(−b/τ))`

  For positive `τ`:

  `min(a, b) − τ ln(2) ≤ softmin(a, b) ≤ min(a, b)`

- Status: **D**.
- Use in IPAX: Mathematical basis for combining continuous scoring components without introducing a hard minimum.

The smoothing parameter is defined in [`dist-js/ipax-params.js`](../dist-js/ipax-params.js).

---

## 4. Pupil and optics

### PUPIL-WY — Unified pupil formula

- Source: Watson, A. B., and Yellott, J. I. (2012), *A unified formula for light-adapted pupil size*, Journal of Vision.
- URL: https://humansystems.arc.nasa.gov/publications/watson_formula_pupilsize.pdf
- Supports: A model relating pupil diameter to luminance, adapting-field size, age, and observer characteristics.
- Status: **A**.

One of the formulations discussed is the Stanley–Davies relationship:

`D = 7.75 − 5.75 × [(L × a / 846)^0.41 / ((L × a / 846)^0.41 + 2)]`

where `L` represents luminance and `a` represents adapting-field area.

- Use in IPAX: Supports investigating the relationship between dark viewing conditions, pupil dilation, and retinal-image quality.

This source does not establish the numerical gains or thresholds of IPAX's halation and mydriasis penalties.

Those values are maintained in [`dist-js/ipax-params.js`](../dist-js/ipax-params.js).

### POL-2013 / POL-2014 / POL-NN — Positive display polarity

**POL-2013**

- Source: Piepenbrock, C., Mayr, S., Mund, I., and Buchner, A. (2013), *Positive display polarity is advantageous for both younger and older adults*, Ergonomics, 56(7), 1116–1124.
- URL: https://doi.org/10.1080/00140139.2013.790485
- Status: **B**.

**POL-2014**

- Source: Piepenbrock, C., Mayr, S., and Buchner, A. (2014), Ergonomics.
- URL: https://doi.org/10.1080/00140139.2014.960014
- Status: **B**.

**POL-NN**

- Source: Nielsen Norman Group, *Dark Mode vs. Light Mode: Which Is Better?*
- URL: https://www.nngroup.com/articles/dark-mode/
- Status: **B**.

Supports: Experimental findings favoring positive display polarity—dark text on a light background—for certain reading and proofreading tasks, including studies involving younger and older adults.

Pupil size is one proposed explanatory factor.

- Use in IPAX: Supports investigating polarity-dependent effects involving pupil dilation, glare, halation, and perceived reading comfort.

These findings do not establish that positive polarity is universally superior or that negative polarity is intrinsically inaccessible.

They do not determine IPAX penalty magnitudes.

---

## 5. Chromatic terms

### LH1987 / BLOBS — Isoluminance and form perception

**LH1987**

- Source: Livingstone, M. S., and Hubel, D. H. (1987), *Psychophysical evidence for separate channels for the perception of form, color, movement, and depth*, Journal of Neuroscience, 7(11), 3416–3468.
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC6569044
- Status: **B**.

**BLOBS**

- Source: *Blobs versus bars: psychophysical evidence supports two types of orientation response in human color vision*.
- URL: https://research.aston.ac.uk/en/publications/blobs-versus-bars-psychophysical-evidence-supports-two-types-of-o/
- Status: **B**.

Supports: The distinction between luminance-mediated and chromatic contributions to visual form perception.

The evidence does not support treating chromatic contrast as incapable of conveying spatial structure.

- Use in IPAX: Research basis for the direction of the `jitter` term under isoluminant conditions.

The penalty magnitude is an IPAX modeling decision, defined in [`dist-js/ipax-params.js`](../dist-js/ipax-params.js).

### CHROMO-KITAOKA / CHROMO-TMS93 / CHROMO-OZ15 — Chromostereopsis

**CHROMO-KITAOKA**

- Source: Kitaoka, A. (2015), *Chromostereopsis*.
- URL: https://www.psy.ritsumei.ac.jp/akitaoka/Kitaoka2015_ReferenceWorkEntry_Chromostereopsis.pdf
- Status: **B**.

**CHROMO-TMS93**

- Source: Thompson, P., May, K., and Stone, R. (1993), *Chromostereopsis: a multicomponent depth effect?*, Displays, 14(4).
- URL: https://www-users.york.ac.uk/~pt2/ThompsonMayStone1993.pdf
- Status: **B**.

**CHROMO-OZ15**

- Source: Ozolinsh, M., and Muizniece, K. (2015), Frontiers in Psychology, 6:337.
- URL: https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.00337/pdf
- Status: **B**.

Supports: Chromostereopsis can arise from chromatic differences, particularly involving saturated red and blue, and varies between observers.

- Use in IPAX: Research basis for a chromostereopsis warning.

The phenomenon does not establish that affected color combinations are universally illegible.

Related reading research:

- University of Granada, Color Imaging Lab.
- URL: https://colorimaginglab.ugr.es/pages/pdfs/visionresearch_2020/
- Status: **B**.

The chromostereopsis penalty is a project heuristic, not a direct conversion from measured reading-speed impairment.

### SCONE-NASA / SCONE-PMC / LEGGE-IV — S cones and blue text

**SCONE-NASA**

- Source: NASA, *Color Usage*.
- URL: https://colorusage.arc.nasa.gov/blue_2.php
- Status: **B**.

**SCONE-PMC**

- Source: Research on S-cone distribution and density.
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC4289478
- Status: **B**.

Related primary research:

- Curcio et al. (1991), Journal of Comparative Neurology.
- Williams, MacLeod, and Hayhoe (1981), research on foveal tritanopia.
- Status: **C**.

**LEGGE-IV**

- Source: Legge, G. E., Rubin, G. S., and Luebker, A. (1986), *Psychophysics of reading. IV. Wavelength effects in normal and low vision*, JOSA A, 3(1), 40–51.
- URL: https://legge.dl8.umn.edu/sites/legge.psych.umn.edu/files/files/media/legge86_psychophysics_of_reading._iv._wavelength_effects_in_normal_and_low_vision.pdf
- Status: **B**.

Supports: The distribution and spatial properties of S-cone vision, together with the importance of luminance contrast in reading performance.

- Use in IPAX: Research context for the `s_cone` penalty associated with certain high-chroma blue text combinations.

These references do not justify treating all blue text as inaccessible or assigning a universal penalty independent of viewing conditions.

### SCC-SK08 / SCC-BRENNER03 / SCC-VSS / SCC-SCIREP20 — Simultaneous chromatic induction

**SCC-SK08**

- Source: Shevell, S. K., and Kingdom, F. A. A. (2008), *Color in complex scenes*, Annual Review of Psychology.
- URL: https://mvr.mcgill.ca/Fred/Papers/Shevell&Kingdom_2008.pdf
- Status: **B**.

**SCC-BRENNER03**

- Source: Brenner, E., et al. (2003), *Chromatic induction*, Vision Research.
- URL: https://personal.fgb.vu.nl/~jsmeets/2003/Chromatic_induction-VIR03.pdf
- Status: **B**.

**SCC-VSS**

- Source: Vision Sciences Society conference abstract concerning chromatic induction.
- URL: https://visionsciences.org/presentation/?id=2380
- Status: **B**.

**SCC-SCIREP20**

- Source: Scientific Reports (2020).
- URL: https://link.springer.com/article/10.1038/s41598-020-77241-5
- Status: **B**.

Supports: The appearance of a target color can be influenced by the chromatic and luminance properties of its surround.

- Use in IPAX: Research basis for modeling simultaneous chromatic induction, including the influence of chromatic surrounds on achromatic text (decision D-05).

The current model's activation functions and penalty magnitudes are project-specific.

Their values are defined in [`dist-js/ipax-params.js`](../dist-js/ipax-params.js).

### HK-FP91 / HK-2023 / HK-PLOS — Helmholtz–Kohlrausch effect

**HK-FP91**

- Source: Fairchild, M. D., and Pirrotta, E. (1991), Color Research & Application, 16.
- Secondary URL: https://en.wikipedia.org/wiki/Helmholtz%E2%80%93Kohlrausch_effect
- Status: **B** for the secondary reference; **C** for the original publication.

**HK-2023**

- Source: High, G., Green, P., and Nussbaum, P. (2023), *The Helmholtz–Kohlrausch effect on display-based light colors and simulated substrate colors*, Color Research & Application, 48(2), 167–177.
- URL: https://hdl.handle.net/11250/3110488
- Status: **B**.

**HK-PLOS**

- Source: *The Brightness of Colour*, PLoS ONE (2009).
- URL: https://pmc.ncbi.nlm.nih.gov/articles/PMC2659800/
- Status: **B**.

Supports: Highly saturated colors can appear brighter than achromatic stimuli with comparable luminance, with effects that vary by hue and viewing conditions.

- Use in IPAX: Research basis for the `hk_effect` term.

The choice of hue-dependent response curves, score gating, and reward magnitude belongs to the IPAX model.

The corresponding parameters are defined in [`dist-js/ipax-params.js`](../dist-js/ipax-params.js).

---

## 6. Ergonomic limits for optimal legibility and visual discomfort

The FAA Human Factors Design Standard provides historical reference points for the contrast ratios of 10:1 and 15:1 used in earlier IPAX scoring scales.

These references inform the project's investigation of excessive contrast and visual discomfort. They do not define the current IPAX 0–6 scale or establish universal physiological thresholds.

### NATS-1999 / FAA-HFDS — Human Factors Design Standard

- Source: Federal Aviation Administration (FAA), *Human Factors Design Standard* (HF-STD-001B), Chapter 8, citing National Air Traffic Services (1999).
- URL: https://hf.tc.faa.gov/hfds/
- Supports: Guidance concerning character contrast for optimum legibility and the possibility of visual discomfort at very high contrast ratios.
- Status: **D**.
- Use in IPAX: Historical reference for the 10:1 and 15:1 contrast thresholds.

These values do not directly determine the current IPAX scoring levels.

They should not be interpreted as universally applicable physiological boundaries or as WCAG requirements.

### MYNDEX-FAA — APCA author on excessive contrast and optical phenomena

- Source: W3C WCAG GitHub repository, issue #675, comment by Andrew Somers (Myndex).
- URL: https://github.com/w3c/wcag/issues/675
- Supports: Discussion of excessive contrast, halation, glare, scatter, chromatic aberration, and visual discomfort, including references to FAA human-factors guidance.
- Status: **A**.
- Use in IPAX: Supports investigating excessive-contrast phenomena separately from baseline contrast calculations.

The cited observations do not establish quantitative penalty magnitudes or validate the IPAX ergonomic model.

---

## 7. Typography and APCA reference-font matching

### ARC-FONT — APCA Readability Criterion: Font Size and Weight

- Source: Accessible Readability Criterion (ARC), *Visual Readability Contrast — Test Methods*.
- URL: https://readtech.org/ARC/tests/visual-readability-contrast/?tn=methods#size-weight
- Supports: The ARC/APCA reference-font matching procedure, including comparison of rendered x-height measurements to adapt minimum font-size recommendations to a target typeface.
- Status: **D**.
- Use in IPAX: Basis for the experimental automation of reference-font matching through rasterized x-height measurements in [IPAX Font Sizer](https://ipax.bustelo.com.ar/fontsizer.php).

The reference-font matching procedure is documented by ARC. Its automated implementation in IPAX is experimental.

The resulting size adjustment is a typography recommendation and does not modify the IPAX color-pair score.

### ARC-FONT-TABLE — APCA Font Size and Weight Recommendations

- Source: Accessible Readability Criterion (ARC), *Visual Readability Contrast*.
- URL: https://readtech.org/ARC/tests/visual-readability-contrast/?tn=criterion
- Supports: Evaluation of APCA contrast values (`Lc`) in conjunction with font size and weight.
- Status: **D**.
- Use in IPAX: Reference for APCA typography recommendations exposed independently from the WCAG classification and IPAX score.

The IPAX Orchestrator exposes the WCAG minimum font size and APCA font recommendation separately.

The example UI combines those recommendations for presentation, respecting the applicable WCAG minimum when both values are available.

Font size and weight are not additional inputs to the IPAX color-pair score.

### APCA-FONT-DISCUSSION — Typeface Stroke Contrast and Reference-Font Matching

- Source: Myndex SAPC-APCA, GitHub Discussion #115.
- URL: https://github.com/Myndex/SAPC-APCA/discussions/115
- Supports: Discussion of typeface characteristics, differences between thick and thin strokes, and the challenges of establishing automated equivalence between fonts.
- Status: **D**.
- Use in IPAX: Research context for the experimental Optical Density (2D Mass) and Thin Stroke Energy methods.

These methods are not normative APCA procedures.

Their predictive validity for reading performance has not been established.

### IPAX-FONT-EXPERIMENTS — Experimental Typography Tools

- Source: IPAX Font Sizer.
- URL: https://ipax.bustelo.com.ar/fontsizer.php
- Type: Project implementation, not an independent scientific reference.
- Supports: Reproducibility and inspection of the project's experimental font-normalization methods.
- Status: **D**.

The tool currently explores three approaches:

1. **X-height Normalization:** Rasterizes the lowercase `x` of the target and reference fonts and derives a size multiplier from their measured heights.
2. **Optical Density (2D Mass):** Compares rasterized ink coverage, with experimental language-dependent weighting.
3. **Thin Stroke Energy:** Investigates the font size required to keep thin strokes above a configurable pixel threshold.

The Thin Stroke Energy threshold is an experimental parameter, not a normative WCAG or APCA requirement.

These experiments are separate from the IPAX scoring engine.

---

## 8. What is NOT supported by this list (explicit statement)

1. The numerical gains, thresholds, exponents, and caps assigned to IPAX ergonomic penalties and rewards. These are project parameters requiring calibration and validation. Their current values are defined exclusively in [`dist-js/ipax-params.js`](../dist-js/ipax-params.js), the Single Source of Truth (SSOT).
2. The quantitative accuracy of the current ergonomic model as a predictor of visual fatigue, discomfort, or reading performance.
3. The equivalence between an IPAX score and a specific level of visual acuity, reading ability, or clinical condition.
4. The experimental Optical Density and Thin Stroke Energy methods as validated substitutes for ARC/APCA reference-font qualification.
5. The interpretation of an IPAX score as a complete legal accessibility certification. WCAG contrast classification is only one part of accessibility conformance.

---

*IPAX Scoring System v0.1.21 • 2026-10-26, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data).*