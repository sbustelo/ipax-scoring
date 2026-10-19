# IPAX Scoring System — Changelog

## Roadmap — IPAX 2.0 (Environmental & Physiological Simulator)

Evolving the engine from a color-contrast calculator into a full perceptual simulator based on the physical properties of light and the human eye. As a first step in this direction, we developed the IPAX Simulator, which models how light and color are perceived based on temperature, paper or screen quality, illumination, reflections, shadows, and adaptation to bright, indoor, or scotopic light:

- [Color in Design Systems (Kambrica)](https://www.kambrica.com/en/color-in-design-systems/)
- [Dark Mode vs Night Mode (Kambrica)](https://www.kambrica.com/en/dark-mode-vs-night-mode/)
- **Thermodynamic Fatigue:** Modeling glare, halation, and mydriasis by crossing OKLCH lightness with maximum/minimum nits and ambient lux.
- **Ciliary Muscular Effort:** Calculating legibility through spatial frequency (arcminutes) and 2D optical mass instead of CSS pixels.
- **Pathology Tensors:** Supporting clinical conditions (cataracts, astigmatism, maculopathy, photophobia) as physical light-degradation multipliers.
- **Redefinition of Excellence (Scores 4 & 5):** Considering a shift from APCA-dictated thresholds to strictly ergonomic definitions. Score 4: "no active aggression" (adequate contrast, zero significant penalties). Score 5: "actively supports reading" (robust across environments and observers).

## Roadmap — Future (JSOL Parity)

The core scoring pipeline is planned to be rewritten in JSOL and verified, via JSOL's own contract system, to produce identical results across every target (JavaScript, PHP, Python).

- **JSOL Transpilation:** Full rewrite of the core scoring pipeline into [pure JSOL](https://jsol.bustelo.com.ar/), spawned directly by IPAX's need to port its color math with guaranteed cross-language consistency.

---

## v0.1.10 - October 19, 2026

This release transitions the core engine to a fully continuous biological model.

### Added

- **Parameter SSOT (`dist-js/ipax-params.js`):** Single Source of Truth (SSOT) for all constants, categorized by provenance.
- **Math Primitives (`dist-js/ipax-curves.js`):** Isolated continuous mathematical primitives (`sstep`, `gauss`, `softmin`). These functions are 1:1 portable to GLSL shaders.

### Changed

- **Branchless Ergonomics:** Rewrote `dist-js/ergonomics.js` to be a fully continuous (C0/C1) engine. All hard thresholds (`if`/`else`, `switch`, ternary operators) for penalties and rewards were replaced by continuous interpolation and smoothstep gates.
- **Subthreshold Value Exposure & Strict Accumulation:** Ergonomic penalties are no longer silently discarded below a reporting floor during computation. Every penalty is mathematically accumulated; thresholds now solely dictate UI warnings in the presentation layer.
- **Continuous Base Score:** Replaced discrete score steps with piecewise-linear interpolation over `ln(ratio)`.
- **Continuous Polarity:** Replaced the boolean `isDarkContext` with continuous polarity weights (`wDark`, `wLight`) derived from a smoothstep of the lightness difference.
- **Black Regularization:** Regularized OKLab L and Chroma near absolute black using a linear toe ($L < 6/29$), solving the infinite derivative singularity of the CIELAB/OKLab cube root.
- **Hue activation logic:** Simultaneous Contrast was updated to treat achromatic text properly (transitioning smoothly via chroma weight).

---

## v0.1.06 - October 16, 2026

This release solidifies the typographic intersection logic.

### Added

- Created `docs/TYPOGRAPHY.md` to document the architectural decoupling and intersection logic between WCAG normative sizing and APCA ergonomic sizing.
- The Orchestrator now outputs symbolic grades (e.g., `2+` or `3-`). A `+` is awarded for a decimal surplus `>= 0.7` towards the next integer, and a `-` indicates ergonomic penalties pierced the normative legal base.

### Changed

- Eradicated heuristic fallback for APCA font sizes in `dist-js/orchestrator.js`.
- Implemented a strict legal clamp: if APCA recommends a font size smaller than the WCAG minimum for the "Large Text" zone (3.0:1 to 4.49:1), the output is clamped to the WCAG legal requirement (24px for Normal, 18.5px for Bold).
- If the APCA matrix is unavailable, the Orchestrator again gracefully defaults to WCAG sizing rules instead of synthesizing approximate numbers.

---

## v0.1.05 - October 15, 2026

This release finalizes the architecture of the examples, centralizing all semantic definitions in the JSON dictionary and establishing clear integration patterns.

### Added

- Created `example/simple.html` as a minimal integration boilerplate for developers.
- Implemented `example/index.es.html` to demonstrate dynamic localization via the HTML `lang` attribute.

### Changed

- Converted `dictionary.[lang].json` into the strict Single Source of Truth (SSOT) for the scoring reference table.
- Refactored `example/index.html` to use a native `<template>` tag for hydrating the score reference table, eradicating HTML string injection in JavaScript.
- Updated `example/js/ipax-integration.js` to dynamically resolve language dictionaries with a robust iterative fallback to English if network or file system fails.
- Extracted grade labels in the UI directly from the SSOT (`dictionaryObject.scale`), ensuring parity across languages and environments.

### Fixed

- Fixed visual bug in `ipax-scene-pair.js` and `example/index.html` where the "APCA Engine Unavailable" warning was silently filtered out of the active penalties list.
- Fixed WCAG minimum ratio formatting in the reference table to consistently include the "≥" symbol.

---

## v0.1.04 - September 22 / October 15, 2026

- **Iterating scoring & grading:** Evaluating if smoothing curves for penalties and rewards, if supported by literature, can improve experience. Grading styles: 1.8 vs 1.8(2) vs. 1(2).
- Legacy object (scoring string) is deprecated.
- If APCA is unavailable, use WCAG for levels 4 & 5 (contrast 10:1 and 15:1 respectively).
- Example UI updated to consume the new raw data structure instead of the legacy scoring string.

---

## v0.1.03 — September 19, 2026

_First public release of the score algorithm outside the ipax.bustelo.com.ar core_

- **First version on GitHub:** Major refactoring for publishing the IPAX core outside of the prototype. The new IPAX Orchestrator allows the core to be built on pure JSOL so PHP, Python and other languages can be supported. The published algorithm is the SSOT of every IPAX tool.
- **Theme Builder:** Published as a standalone tool (`builder.php`) alongside sandbox, sampler and font sizer.
- **APCA IoC Decoupling:** To prevent AGPL license contamination, the APCA dependency is dynamically injected via Inversion of Control (`config.env.apcaEngine`) by the Orchestrator.
- **Architectural Overhaul:** Migrated from `window.IPAX` global namespace and IIFEs to pure, zero-dependency ES Modules (`dist-js/*`).
- **Strict Cross-Compliance Floor:** Refactored the core logic so that if the normative intersection (`nComplianceLevel`, the minimum between WCAG and APCA) passes (≥ 1), ergonomic penalties can never drop the final score below 1.0.
- **Example UI:** A simple example UI with clean JavaScript code for understanding how to initialize and use the new IPAX Orchestrator.

---

## v0.1.02 — July 12, 2026

_Core Math & Integrity Patch_

- **Direct sRGB Luminance:** Fixed a bug where WCAG contrast was being computed through an OKLCH → OKLab → LMS roundtrip. Introduced `relativeLuminanceWCAG()` to compute linear sRGB directly from HEX, aligning with the official WCAG 2.0 specification. OKLCH remains exclusively for ergonomic physiological modeling.
- **Strict Score Clamping:** Implemented a strict boundary clamp (`Math.min(complianceLevel + 0.9, boostedScore)`). Fixed a critical flaw where ergonomic rewards could artificially inflate a score into the next legal normative grade (e.g. boosting a 2.9 to a 3.0).

---

## v0.1.0 — April/May 2026

_First public release_

First stable engine [presented at Rosenverse (Rosenfeld Media)](https://rosenverse.rosenfeldmedia.com/videos/bridging-the-gap-between-compliance-and-design-quality) on July 2, 2026.

- **Unified Scoring Scale:** Introduced the 5-point scoring, merging WCAG 2.x and APCA models into a single composite resolver.
- **Biological Modifier Engine:** Established the foundational ergonomic modifiers to penalize isoluminant jitter, chromostereopsis, macular glare, and mydriatic aberration based on the OKLCH color space.
- **Reward Gating:** Introduced multiplicative smoothstep gating, allowing ergonomic rewards (e.g. Paper Tone) to gracefully fade in only if the biological score is healthy, revoking them entirely if severe scatter penalties exist.

Features: Sandbox, Sampler, Font sizer.

---

_IPAX Scoring System v0.1.10 • 2026-10-19, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data)._
