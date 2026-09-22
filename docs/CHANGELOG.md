# IPAX Scoring System — Changelog

## Roadmap — v0.1.04 (JSOL Parity)

The core scoring pipeline is planned to be rewritten in JSOL and verified, via JSOL's own contract system, to produce identical results across every target (JavaScript, PHP, Python).

* **JSOL Transpilation:** Full rewrite of the core scoring pipeline into [pure JSOL](https://jsol.bustelo.com.ar/), spawned directly by IPAX's need to port its color math with guaranteed cross-language consistency.
* **Redefinition of Excellence (Scores 4 & 5):** Considering a shift from APCA-dictated thresholds to strictly ergonomic definitions. Score 4: "no active aggression" (adequate contrast, zero significant penalties). Score 5: "actively supports reading" (robust across environments and observers).
* **Subthreshold Value Exposure:** Ergonomic penalties (e.g. halation under 0.15, glare) will no longer be silently discarded below the reporting floor. The core will calculate and expose every value; presentation layers may decide how to handle them.

---

## v0.1.03 — September 19, 2026
*First public release of the score algorithm outside the ipax.bustelo.com.ar core*

* **First version on GitHub:** Major refactoring for publishing the IPAX core outside of the prototype. The new IPAX Orchestrator allows the core to be built on pure JSOL so PHP, Python and other languages can be supported. The published algorithm is the SSOT of every IPAX tool.
* **Theme Builder:** Published as a standalone tool (`builder.php`) alongside sandbox, sampler and font sizer.
* **APCA IoC Decoupling:** To prevent AGPL license contamination, the APCA dependency is dynamically injected via Inversion of Control (`config.env.apcaEngine`) by the Orchestrator.
* **Architectural Overhaul:** Migrated from `window.IPAX` global namespace and IIFEs to pure, zero-dependency ES Modules (`dist-js/*`).
* **Strict Cross-Compliance Floor:** Refactored the core logic so that if the normative intersection (`nComplianceLevel`, the minimum between WCAG and APCA) passes (≥ 1), ergonomic penalties can never drop the final score below 1.0.
* **Example UI:** A simple example UI with clean JavaScript code for understanding how to initialize and use the new IPAX Orchestrator.

---

## v0.1.02 — July 12, 2026
*Core Math & Integrity Patch*

* **Direct sRGB Luminance:** Fixed a bug where WCAG contrast was being computed through an OKLCH → OKLab → LMS roundtrip. Introduced `relativeLuminanceWCAG()` to compute linear sRGB directly from HEX, aligning with the official WCAG 2.0 specification. OKLCH remains exclusively for ergonomic physiological modeling.
* **Strict Score Clamping:** Implemented a strict boundary clamp (`Math.min(complianceLevel + 0.9, boostedScore)`). Fixed a critical flaw where ergonomic rewards could artificially inflate a score into the next legal normative grade (e.g. boosting a 2.9 to a 3.0).

---

## v0.1.0 — April/May 2026
*First public release*

First stable engine [presented at Rosenverse (Rosenfeld Media)](https://rosenverse.rosenfeldmedia.com/videos/bridging-the-gap-between-compliance-and-design-quality) on July 2, 2026.

* **Unified Scoring Scale:** Introduced the 5-point scoring, merging WCAG 2.x and APCA models into a single composite resolver.
* **Biological Modifier Engine:** Established the foundational ergonomic modifiers to penalize isoluminant jitter, chromostereopsis, macular glare, and mydriatic aberration based on the OKLCH color space.
* **Reward Gating:** Introduced multiplicative smoothstep gating, allowing ergonomic rewards (e.g. Paper Tone) to gracefully fade in only if the biological score is healthy, revoking them entirely if severe scatter penalties exist.

Features: Sandbox, Sampler, Font sizer.