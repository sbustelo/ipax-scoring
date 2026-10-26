# IPAX & APCA: Algorithmic Intersection & Semantic Alignment

This document explains the design decisions behind IPAX's integration of WCAG 2.x and APCA, including their mathematical differences, semantic alignment, and separation from ergonomic evaluation.

For the scoring implementation, see [IPAX Scoring System](IPAX-SCORING.md).

## 1. The Mathematical Incompatibility

WCAG 2.x and APCA evaluate contrast using different mathematical models.

WCAG 2.x calculates a contrast ratio from the relative luminance of two colors. The result is independent of text size, weight, and contrast polarity.

APCA calculates perceptual lightness contrast (`Lc`) using a model designed to account for characteristics of human visual perception, including differences between light-on-dark and dark-on-light polarity.

APCA also provides font-usage guidance through separate lookup tables, relating contrast to text size and weight.

Consequently, the two algorithms can produce substantially different evaluations of the same color pair.

Neither WCAG contrast ratios nor APCA Lc values can be directly substituted for one another.

### Why the disagreement matters

A color pair may satisfy WCAG AA while producing an APCA result that restricts its use to larger or heavier text.

Conversely, a pair may produce an APCA result associated with a particular typographic use while failing the corresponding WCAG contrast requirement.

These disagreements are especially relevant when evaluating different contrast polarities.

IPAX preserves both measurements rather than attempting to convert one into the other.

For executable examples of these disagreements, see [IPAX Scoring Cases](../examples/30-cases.html).

## 2. The Problem with Mathematical Translation

The APCA Contrast Legend includes approximate comparisons between APCA Lc values and WCAG 2.x contrast ratios.

These comparisons are useful for understanding the differences between the models, but they do not establish mathematical equivalence or interchangeable conformance thresholds.

IPAX does not use them as conversion formulas.

Instead, IPAX aligns selected WCAG and APCA thresholds according to their intended applications.

This distinction is important because requiring a direct numerical correspondence between the two models would introduce assumptions that neither algorithm establishes.

A WCAG contrast ratio and an APCA Lc value describe different aspects of contrast. Their relationship varies with the colors and contrast polarity.

Therefore, IPAX uses a semantic alignment strategy rather than a mathematical translation strategy.

## 3. The IPAX Solution: Semantic Alignment

IPAX associates WCAG and APCA thresholds according to their intended use cases.

For example:

- **WCAG AA (4.5:1):** the minimum contrast requirement for standard text under WCAG 2.x.
- **APCA Basic (Lc 45):** a perceptual contrast reference associated with restricted typographic applications in the IPAX model.

IPAX associates both reference points with **Score 3 (Acceptable)**.

This is a design decision about how to construct a shared scoring scale. It does not mean that WCAG 4.5:1 and APCA Lc 45 are mathematically equivalent or that they permit identical typography.

### Semantic reference points

| IPAX level | WCAG-based reference | APCA reference |
|---|---|---|
| 1 | No corresponding WCAG threshold | Lc 15 |
| 2 | 3:1 | Lc 30 |
| 3 | 4.5:1 | Lc 45 |
| 4 | 7:1 | Lc 60 |
| 5 | 10:1 | Lc 75 |
| 6 | 15:1 | Lc 90 |

The WCAG-based references at 10:1 and 15:1 extend the IPAX scale beyond WCAG AAA. They are not additional WCAG conformance levels.

Score 1, introduced in v0.1.20, represents a low perceptual contrast reference for discernible non-text elements. It has no WCAG contrast-ratio equivalent.

The complete mappings and interpolation rules are documented in [IPAX Scoring System](IPAX-SCORING.md).

### Algorithmic intersection

When APCA is available, IPAX calculates separate continuous values from the WCAG contrast ratio and the absolute APCA Lc result.

The scoring core combines them using a **soft minimum** (`softmin`), a smooth approximation of the lower value.

This implements the Strict strategy: disagreement between the models can reduce the combined base score.

The combination operates on continuous values, not on the discrete WCAG conformance classification or APCA presentation labels.

When APCA is unavailable, IPAX uses its WCAG-only scoring path.

### Preserving WCAG requirements

IPAX maintains a separate, discrete WCAG classification based on the actual contrast ratio.

**WCAG levels are never rounded up or promoted by APCA or ergonomic rewards.**

For example, a ratio below 4.5:1 does not qualify for WCAG AA, regardless of its APCA result or proximity to the threshold.

The final IPAX score may be lower than the WCAG level because of the APCA evaluation, ergonomic penalties, or both.

The Orchestrator exposes this distinction through its score representations, including the structural format `N(M)`, where `N` is the final IPAX level and `M` is the independently determined WCAG level.

These representations are documented in [IPAX Scoring System](IPAX-SCORING.md).

## 4. Separation of Concerns: Contrast and Ergonomics

IPAX separates three responsibilities:

1. **WCAG 2.x — Normative contrast evaluation.** Calculates the contrast ratio and determines the applicable WCAG contrast tier.
2. **APCA — Perceptual contrast evaluation.** Supplies a continuous Lc value and, when its font lookup is available, typographic usage guidance.
3. **IPAX — Scoring and ergonomic evaluation.** Combines the contrast models and applies parameterized ergonomic penalties and rewards.

This separation avoids treating an APCA contrast measurement as a direct measurement of visual comfort.

### APCA does not calculate IPAX ergonomic penalties

The APCA algorithm produces a contrast value. It does not calculate IPAX's penalties for halation, glare, mydriasis, chromostereopsis, or other modeled ergonomic effects.

Likewise, APCA font-usage recommendations should not be interpreted as ergonomic penalties.

A high absolute Lc value indicates high perceptual contrast according to APCA. It does not, by itself, establish that the color pair is optimal for sustained reading.

### IPAX ergonomic adjustments

IPAX evaluates additional optical and perceptual phenomena using parameterized models.

For example, high-luminance text on a very dark background may activate penalties associated with halation and mydriasis.

These adjustments can reduce a high contrast-derived base score to a lower final IPAX score.

IPAX does not directly measure an individual's visual fatigue, optical scatter, or physiological response. Its ergonomic terms are model-based estimates informed by published research and documented engineering decisions.

The scientific evidence supporting a phenomenon does not necessarily validate the numerical magnitude assigned to its penalty.

Parameter provenance and limitations are documented in [PARAMETERS.md](PARAMETERS.md) and [REFERENCES.md](REFERENCES.md).

### Legal compliance and ergonomic quality

A color pair can satisfy WCAG AAA and still receive a lower final IPAX score because of APCA disagreement or ergonomic penalties.

This is intentional.

WCAG conformance and modeled ergonomic quality answer different questions. IPAX reports both rather than allowing one to conceal the other.

The ergonomic floor prevents penalties from reducing a sufficiently high base score below Score 2. It does not modify the WCAG classification.

The final score is also capped at its unpenalized base: ergonomic rewards cannot promote a pair beyond its contrast-derived score.

## 5. References

- **W3C — WCAG 2.2, Understanding Contrast (Minimum):** [Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- **W3C — WCAG 2.2, Understanding Contrast (Enhanced):** [Understanding SC 1.4.6](https://www.w3.org/WAI/WCAG22/Understanding/contrast-enhanced.html)
- **W3C — WCAG 3 discussion:** [Issue #221](https://github.com/w3c/wcag3/issues/221)
- **SAPC-APCA:** [Myndex/SAPC-APCA](https://github.com/Myndex/SAPC-APCA)
- **IPAX parameter provenance:** [PARAMETERS.md](PARAMETERS.md)
- **IPAX scientific references:** [REFERENCES.md](REFERENCES.md)


---

*IPAX Scoring System v0.1.21 • 2026-10-26, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data).*