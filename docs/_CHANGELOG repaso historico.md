# IPAX Scoring System: Version History & Roadmap

## Roadmap (v1.2.0 - Upcoming JSOL Engine)

The next major milestone involves recompiling the core mathematical engine into JSOL and integrating physiological data.

* **JSOL Transpilation:** Full rewrite and transpilation of the core scoring pipeline into [pure JSOL](https://jsol.bustelo.com.ar/).
* **Redefinition of Excellence (Scores 4 & 5):** I'm considering shifting from APCA-dictated thresholds to strictly ergonomic definitions. Score 4 could denote "no active aggression": adequate contrast, zero significant penalties. Score 5 could denote "actively supports reading": robust across environments and observers.
* **Subthreshold Value Exposure:** Ergonomic penalties (e.g., halation under 0.15, glare) could no longer be silently discarded if they fall below the reporting floor. The core could calculate and expose every value; presentation layers will decide how to handle them.

---

## v1.02 / 09 - Beta (September 19, 2026)
*Current Transition Build*

1.02 - 
Theme Builder

1.09
This version bridges the gap between the initial prototypes and the upcoming JSOL core, focusing on stabilization.

* **First version on gitHub:** Major refactoring for publishing the IPAX core outside of the prototype. The new IPAX Orchestrator should allow the core to be built on pure JSOL so PHP, Python and other languages can be supported.
* **APCA IoC Decoupling:** To prevent AGPL license contamination, the APCA dependency is dynamically injected via Inversion of Control (`config.env.apcaEngine`) by the Orchestrator.
* **Architectural Overhaul:** Migrated from `window.IPAX` global namespace and IIFEs to pure, zero-dependency ES Modules (`dist-js/*`).
* **Strict Cross-Compliance Floor:** Refactored the core logic so that if the normative intersection (`nComplianceLevel` - the minimum between WCAG and APCA) passes (≥ 1), ergonomic penalties can never drop the final score below 1.0.
* **Example UI:** A simple example UI with clean JavaScript code for understanding how to initialize and use the new IPAX Orchestrator.

JSOL was born on august 2026 to support future development of IPAX.

---

## v1.01 (July 12, 2026)
*Core Math & Integrity Patch*

* **Direct sRGB Luminance:** Fixed a bug where WCAG contrast was being computed through an OKLCH -> OKLab -> LMS roundtrip. Introduced `relativeLuminanceWCAG()` to compute linear sRGB directly from HEX, aligning with the official WCAG 2.0 specification. OKLCH remains exclusively for ergonomic physiological modeling.
* **Strict Score Clamping:** Implemented a strict boundary clamp (`Math.min(complianceLevel + 0.9, boostedScore)`). Fixed a critical flaw where ergonomic rewards could artificially inflate a score into the next legal normative grade (e.g., boosting a 2.9 to a 3.0), ensuring the score never overstates standard certifications.

---

## v1.0 (April / May 2026)
*Initial Stable Release*

First stable engine [presented at Rosenverse (Rosenfeld Media)](https://rosenverse.rosenfeldmedia.com/videos/bridging-the-gap-between-compliance-and-design-quality) on july 2, 2026.

* **Unified Scoring Scale:** Introduced the 5-point scoring, merging WCAG 2.x and APCA models into a single composite resolver.
* **Biological Modifier Engine:** Established the foundational ergonomic modifiers to penalize isoluminant jitter, chromostereopsis, macular glare, and mydriatic aberration based on the OKLCH color space.
* **Reward Gating:** Introduced multiplicative smoothstep gating, allowing ergonomic rewards (e.g., Paper Tone) to gracefully fade in only if the biological score is healthy, and revoking them entirely if severe scatter penalties exist.

Features: sandbox, sampler, font sizer.

---

May 2026
(unpublished) first j0 engine, tested on other projects (flowstyler.com).
UI library was unstable, led to refactor JS architecture and (up to september) CSS tokens & cascading

Features: design lab
- rebuilt from scracth: topology , support for OKLCH/RGB math at core.
- First CMYK engine, testing from naïve implementation (just opposite of RGB) to 11x11x11 LUT (extensive testing looking for acceptable error margin vs. performance).
- iterations of k1 engine, which led to j0.

…

... investigación en modelos de color, espacio CYMK, cómo combinar colores, ISCC...


25 de marzo 2026, k0-1.6
Puesta a prueba y estabilización del modelo con casos reales.
Última versión con el modelo K0, 

29 de enero - desarrollo durante febrero hasta 11 de marzo 2026 k0-1.5.02.js
Primer versión con cotas comparando contraste entre pares.
Calculos WCAG y APCA.
El sistema usaba 9 tokens.
Paperx
Paper
Accent-1-pp
Accent-1-p
Accent-1
Accent-1-i
Accent-1-ii
Ink
Inkx

"CIERRE DE SISTEMA ANTES DE SEPARAR IPA"

24 de enero 2026, k0-1.4.64
Primer versión que en la que los colores sobre la topologia de luminancia, se pueden mover para ajustar su luminancia.
Usaba modelo RGB y conversiones con color.js, no usaba aún OKLCH.
Se experimentó abriendo el acento en dos zonas más, resultando en:
Paperx
Paper
PP
P
MAIN
I
II
Ink
Inkx


12 de enero 2026: k0 1.4.30, k0 1.4.32
Primeros prototipos definendo zonas de luminancia.
Base del Design Lab.

12 de enero 2026 k0 1 .4.30
Paper↓ (paperx) – L* 95-100 – Ultra Paper
Paper – L* 80-95 – Primary surface
Accent↓ (on-ink) – L* 60-80 – Light accent
Accent – L* 40-60 – Tricontrast zone
Accent↑ (on-paper) – L* 20-40 – Dark accent
Ink – L* 5-20 – Primary content
Ink↑ (inkx) – L* 0-5 – Ultra Ink

12 de enero 2026 k0 1.4.32: primer versión que abre acentos y define los roles abiertos:
paperx
paper
accent↓
accent
accent↑
ink
inkx



10 enero 2026
Primer prototipo combinando Ink / Accent / Paper en 6 combinaciones.


13 sept 2025: k0 1.4.06
First stable prototype of Tricontrast Lab, explorando un primer modelo mínimo de color systems accesibles empleando 3 colores: Ink / Accent / Paper.

TriContrast Lab define un espacio de colores formado por dos colores de alto contraste y un tercer color que mantiene legibilidad óptima con ambos, cumpliendo estándares WCAG de accesibilidad.
https://www.bustelo.com.ar/apps/tricontrast/


15 ago 2025
Primeros experimentos con el espacio Tricontrast: colores que mantienen contraste 4.5:1 simultánteamente contra blanco y contra negro.
De estos experimentos se asentaron las decisiones de diseño de mi sitio bustelo.com.ar
y posteriormente el módulo para ajustes de diseño.