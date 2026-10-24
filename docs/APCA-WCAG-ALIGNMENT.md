# IPAX & APCA: Algorithmic Intersection & Semantic Alignment

This document outlines the architectural separation of concerns between the APCA contrast algorithm, WCAG 2.x calculations, and the IPAX ergonomic scoring system. It serves as the reference of IPAX design decisions for its APCA and WCAG equivalence scale, based on a Semantic Alignment Strategy.

## 1. The Mathematical Incompatibility

WCAG 2.x and APCA (SAPC) evaluate light and contrast through fundamentally different biological and physical models. They are mathematically incompatible. 

WCAG 2.x relies on a simple relative _luminance ratio_ that fails to account for spatial frequency, text weight, or the non-linear perception of contrast in dark mode vs. light mode. APCA models the human visual system's actual response to _lightness contrast_ (Lc).

This divergence causes extreme asymmetry in how both algorithms grade the exact same color pairs. 

### Empirical Proof: The Polar Extremes

Case A: Light Polarity (APCA Approves, WCAG Collapses)  
Pure white text (#FFFFFF) on a mid-light grey surface (#B4B4B4).
*   WCAG 2.x: 2.07:1 (Fail)
*   APCA: Lc 45 (Basic — Passes minimum for standard text)

```json
{
  "input": { "text": "#FFFFFF", "bg": "#B4B4B4", "darkMode": false },
  "wcag": { "score": 0, "ratio": 2.07, "grade": "Fail" },
  "apca": { "score": 3, "lc": 45, "grade": "Basic" }
}
```


Case B: Dark Polarity (WCAG Inflates, APCA Penalizes)  
Mid-dark grey text (#969696) on a near-black surface (#010101).
*   WCAG 2.x: 7.05:1 (AAA — Maximum Legal Grade)
*   APCA: Lc -45.6 (Basic — Passes minimum for standard text)

```json
{
  "input": { "text": "#969696", "bg": "#010101", "darkMode": true },
  "wcag": { "score": 4, "ratio": 7.05, "grade": "AAA" },
  "apca": { "score": 3, "lc": -45.6, "grade": "Basic" }
}
```

## 2. The Problem with Mathematical Translation

The official APCA Contrast Legend proposes a tentative mathematical correspondence mapping to WCAG, suggesting:
*   APCA Lc 60 is "similar" to WCAG 4.5:1
*   APCA Lc 45 is "similar" to WCAG 3:1

Rather than using this mapping, IPAX operates under a "Strict" strategy to ensure both legal compliance and optical safety: a color pair is only approved _if it passes both algorithms._ 

If IPAX adopted APCA's mathematical mapping (demanding Lc 60 and 4.5:1 simultaneously for baseline text), the viable intersection space would collapse. Because WCAG severely punishes light-mode pairs and APCA severely punishes dark-mode pairs, enforcing the worst-case scenario mathematically would reject a massive percentage of functionally readable, industry-standard color palettes. The tool would become theoretically pure, but practically unusable for designers, which are IPAX main target as a practical Score to inform design decisions.

## 3. The IPAX Solution: Semantic Alignment

Instead of aligning the formulas mathematically, IPAX aligns them semantically by use-case intent.

*   WCAG defines AA (4.5:1) as the "baseline legal compliance for standard text."
*   APCA defines Basic (Lc 45) as the "baseline physical requirement for standard text."

IPAX anchors its Level 3 (Acceptable) to this semantic intersection: min(WCAG AA, APCA Basic). By aligning the intent of the thresholds rather than their numerical equivalence, IPAX creates a functional design space that guarantees legal compliance without violating the laws of physical optics.

## 4. Extreme Contrast & Biological Penalties

The official APCA mathematical algorithm (`apca-w3`) returns a continuous lightness contrast value (`Lc`) and, via its lookup tables, a recommended minimum font size. *The algorithm itself does not return semantic grades or penalties for extreme contrast.* A pair of `#FFFFFF` on `#000000` will consistently yield an `Lc` of ~106.

The semantic labels often associated with APCA (e.g., "Small Text Only" for `Lc > 105`) are presentation-layer UI conditionals hardcoded in the SAPC-APCA web tool, not inherent penalties within the math. 

A critical misconception arises at the top of the scale: when the APCA UI flags `Lc > 105` as "Small Text Only", it is technically expressing a *permission* (the contrast is high enough to support very small text) rather than a programmatic penalty, even though literature warns against using such extreme contrast for large blocks of text due to halation.

To prevent architectural coupling, IPAX strictly separates normative math from biological ergonomics:

1. APCA as a Mathematical Baseline: IPAX consumes the APCA engine solely to extract the raw Lc value and absolute font sizing.
2. IPAX Ergonomic Penalties: The responsibility of penalizing extreme contrast falls entirely on IPAX's core (ergonomics.js). Through continuous biological models, IPAX calculates the actual optical scatter (Halation, Macular Glare, Mydriasis, Chromatic Clash).
3. Final Grading: If a pair has an Lc of 106, the base score is mathematically high, but IPAX ergonomic penalties for halation and glare will directly degrade the final score (e.g., dropping it from a Level 6 "Optimal" to a Level 4 "Good"). 

Therefore, IPAX accurately reports that the combination is legally compliant and has high photometric contrast, but algorithmically flags it as physiologically harmful for sustained continuous reading".

## 5. References

* **W3C/WCAG3 Active Discussion (Issue #221):** [https://github.com/w3c/wcag3/issues/221](https://github.com/w3c/wcag3/issues/221)"
* **Myndex SAPC-APCA Web Tool Logic:** [Myndex/SAPC-APCA](https://github.com/Myndex/SAPC-APCA)"

---

_IPAX Scoring System v0.1.20 • 2026-10-22, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data)._