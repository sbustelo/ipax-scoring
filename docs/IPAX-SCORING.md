# IPAX Scoring System

_v0.1.21 • 2026-10-23 • Santiago Bustelo_

IPAX combines WCAG 2.x, APCA, and optical ergonomics into a continuous 0–6 scale for evaluating color combinations.

The score represents both contrast performance and modeled ergonomic quality. It does not replace the individual WCAG or APCA results, which remain available separately.

The scoring engine is implemented in `dist-js/`. Its numerical parameters are defined in `dist-js/ipax-params.js`, the single source of truth for parameter values and provenance.

Names and descriptions of the scoring levels are defined in `data/dictionary.en.json` and `data/dictionary.es.json`.

## 1. Scoring strategy

IPAX v0.1.21 implements a Strict scoring strategy: WCAG 2.x and APCA are evaluated independently, and their continuous results are combined conservatively when an APCA engine is available.

### Why combine WCAG and APCA?

WCAG 2.x and APCA use different mathematical models. Consequently, they can disagree about the suitability of a color pair.

Their thresholds cannot be converted directly into one another.

IPAX aligns them **semantically**, according to their intended uses, rather than treating their numerical values as mathematically equivalent.

For example, WCAG AA (4.5:1) and APCA Basic (Lc 45) are associated with IPAX Score 3.

This alignment is an IPAX design decision, not a normative equivalence between WCAG and APCA.

See [APCA/WCAG Semantic Alignment](APCA-WCAG-ALIGNMENT.md).

### WCAG compliance and perceptual evaluation

WCAG 2.x provides the contrast thresholds used for determining WCAG conformance.

APCA contributes an additional perceptual contrast evaluation when its engine is available.

Neither evaluation is replaced by the IPAX score. The scoring result retains the individual WCAG and APCA measurements.

## 2. Continuous base score

IPAX calculates a continuous base score before applying ergonomic adjustments.

The score uses a 0–6 scale, with intermediate values representing positions between the defined thresholds.

### WCAG mapping

WCAG contrast ratios are mapped through a piecewise interpolation using the following reference points:

| WCAG contrast ratio | IPAX level |
|---|---|
| Below 3:1 | Below 2 |
| 3:1 | 2 |
| 4.5:1 | 3 |
| 7:1 | 4 |
| 10:1 | 5 |
| 15:1 | 6 |

These reference points define the WCAG-based continuous mapping. They do not replace the discrete WCAG conformance classification.

The 10:1 and 15:1 references extend the scale beyond WCAG AAA. They are informed by the FAA Human Factors Design Standard but are not additional WCAG conformance levels.

The FAA-HFDS identifies 6:1–10:1 as a range for optimum character legibility and warns that contrast above 15:1 may cause visual discomfort.

IPAX uses these references as part of its scoring model. Ergonomic adjustments subsequently account for potential discomfort.

### APCA mapping

When an APCA engine is available, IPAX also maps absolute APCA Lc values onto the scale.

| Absolute APCA Lc | IPAX level |
|---|---|
| 15 | 1 |
| 30 | 2 |
| 45 | 3 |
| 60 | 4 |
| 75 | 5 |
| 90 | 6 |

Score 1 was introduced in v0.1.20 to distinguish visually discernible non-text elements from readable text.

It has no WCAG contrast-ratio equivalent.

These mappings establish reference points for the continuous score. They do not imply that WCAG and APCA are mathematically interchangeable.

### Combining WCAG and APCA

When APCA is available, IPAX combines two continuous evaluations using a soft minimum (`softmin`):

- The WCAG-derived value, calculated through `fromRatioReleased()`.
- The APCA-derived value, calculated through `fromApcaLc()`.

The soft minimum provides a smooth approximation of the lower result, avoiding a hard transition when the limiting model changes.

Its smoothing parameter is defined by `softmin_tau` in `dist-js/ipax-params.js`.

The WCAG-derived continuous value is not the same as the discrete WCAG conformance level. The latter is calculated independently from the applicable contrast thresholds.

When APCA is unavailable, IPAX uses its WCAG-only scoring path, including the extended upper reference ratios.

The scoring engine does not bundle APCA.

## 3. Ergonomic evaluation

After calculating the base score, IPAX evaluates optical and perceptual effects that may influence visual comfort.

The model uses OKLCH-derived properties and continuous activation functions to calculate penalties.

The evaluated phenomena include:

- Chromatic jitter and isoluminance.
- Chromostereopsis.
- S-cone-related strain.
- Simultaneous contrast and hue induction.
- Halation.
- Mydriasis-related effects in dark contexts.
- Glare in light contexts.
- Helmholtz–Kohlrausch effects.

These effects are modeled through parameterized functions rather than binary pass/fail rules.

The existence or direction of a phenomenon may be supported by published research without its specific numerical penalty having been independently validated.

Parameter provenance and evidence limitations are documented in [PARAMETERS.md](PARAMETERS.md) and [REFERENCES.md](REFERENCES.md).

### Penalties

Ergonomic penalties reduce the continuous base score.

Individual terms and combined contributions are subject to the limits defined in `dist-js/ipax-params.js`.

### Rewards

IPAX also models potentially favorable characteristics, including:

- Paper-tone backgrounds.
- Reduced chromatic adaptation load.
- Achromatic text over lightly tinted backgrounds.

Rewards are subject to activation conditions and a total cap.

They can compensate for ergonomic penalties but **cannot increase the final score beyond its unpenalized base**.

Therefore:

`final score ≤ base score`

A high final score does not necessarily imply that no penalties were activated. Penalties may have been partially or fully compensated by eligible rewards.

## 4. Ergonomic floor

IPAX prevents ergonomic adjustments from reducing a sufficiently high base score below Score 2.

The relevant parameter is:

`legal_min_level = 2`

The floor is applied relative to the base score:

`ergonomic floor = min(base score, legal_min_level)`

Consequently:

- A base score of 4 can be reduced to 2 by ergonomic penalties.
- A base score of 2 cannot be reduced below 2 by ergonomic penalties.
- A base score below 2 does not receive an artificial increase to 2.

This floor limits ergonomic degradation. It does not restore the original WCAG level, modify the contrast ratio, or establish WCAG conformance.

The discrete WCAG classification remains independently determined by the applicable contrast thresholds.

## 5. Interpreting the score

IPAX defines seven named levels, from 0 to 6.

| Score | Name | Intended interpretation |
|---|---|---|
| 6 | Excellent | Highest modeled ergonomic quality for sustained reading. |
| 5 | Very Good | Strong contrast and favorable ergonomic performance. |
| 4 | Good | High contrast, potentially affected by ergonomic penalties. |
| 3 | Acceptable | Baseline contrast tier associated with standard text. |
| 2 | Functional | Limited-use contrast tier, including large text and certain non-text or inactive elements. |
| 1 | Low | Discernible non-text baseline; insufficient for readable text. |
| 0 | Fail | Insufficient contrast for the modeled minimum requirements. |

The authoritative names and descriptions are maintained in the JSON dictionaries.

### Typical use cases

The following use cases describe the intended applications of each IPAX level. They are **indicative, not guarantees of accessibility conformance**.

Actual suitability depends on the individual WCAG and APCA results, typography, element semantics, and applicable accessibility requirements.

#### Score 0: Fail

**Typical use cases:** None. Insufficient contrast for the modeled minimum requirements.

#### Score 1: Low

**Typical use cases:** Separators, structural borders, thick focus outlines, decorative hints, and disabled graphics. Not suitable for text.

#### Score 2: Functional

**Typical use cases:** Disabled/inactive text, input placeholders, copyright bugs, large semantic non-text elements (icons ≥ 4px), and active large text (WCAG 24px+).

#### Score 3: Acceptable

**Typical use cases:** Standard UI text, secondary labels, buttons, navigation links, and short-form data.

#### Score 4: Good

**Typical use cases:** High-impact headlines, UI controls, badges, and short paragraphs. Not recommended for immersive long-form reading if the score results from substantial ergonomic penalties.

#### Score 5: Very Good

**Typical use cases:** General web content, standard articles, data-heavy dashboards, and forms.

#### Score 6: Excellent

**Typical use cases:** Immersive reading environments, e-books, long-form documentation, and focused editorial content.

### Rounding and quantization

**WCAG levels are never rounded up.** They are assigned from the actual contrast ratio using the applicable WCAG thresholds. A contrast ratio below 4.5:1 does not qualify for WCAG AA, regardless of how close it is to that threshold.

IPAX calculates a continuous score independently of this discrete WCAG classification.

The Orchestrator applies JavaScript's `Math.round(scoreExact * 10) / 10` to produce the public `score`, rounding to the nearest tenth, with halfway values rounded upward for nonnegative scores.

For example, a base score of `5.9653` reduced by `1.6` in ergonomic penalties produces a final score of `4.3653`.

With a discrete WCAG level of `4`, the Orchestrator reports:

| Property | Value |
|---|---|
| `scoreExact` | `4.3653…` |
| `score` | `4.4` |
| `grades.structural` | `4` |
| `grades.analytical` | `4.4` |
| `grades.symbolic` | `4` |

The integer IPAX grade is obtained with `Math.floor(score)`, after rounding to one decimal place. This operation discards the fractional part; it does not round to the nearest integer.

The WCAG level remains independently determined by its contrast thresholds and is unaffected by IPAX rounding or ergonomic adjustments.

### Score representations

IPAX provides three alternative representations of the same scoring result.

These representations are generated by the Orchestrator. They do not change the underlying score or the individual WCAG and APCA evaluations.

#### Structural

The structural format uses the integer part of the rounded IPAX score.

When that integer is lower than the discrete WCAG level, the output is `N(M)`, where:

- `N` is the final IPAX level.
- `M` is the independently determined WCAG level.

Otherwise, the output is simply `N`.

Level 0 is displayed as `X`.

Examples: `2(4)`, `3`, `X`.

The difference between `N` and `M` may result from APCA's contribution to the base score, ergonomic adjustments, or both.

The structural format exposes this difference without altering the WCAG classification.

#### Analytical

The analytical format displays the continuous score rounded to one decimal place.

It retains the fractional information discarded by the structural format, making it useful for examining the effects of ergonomic adjustments and progress toward the next level.

Examples: `2.7`, `3.4`, `5.9`.

The exact, unrounded numerical result is also available through `scoreExact`.

#### Symbolic

The symbolic format provides a compact alternative:

- **Degraded:** displays the discrete WCAG level followed by `-`, such as `4-`.
- **Not degraded, fractional part ≥ 0.7:** displays the IPAX integer level followed by `+`, such as `3+`.
- **Otherwise:** displays the IPAX integer level without a suffix, such as `3`.

The `+` threshold is currently **0.7**, measured against the score rounded to one decimal place.

Level 0 is displayed as `X`.

As with the structural format, the `-` suffix indicates a difference between the final IPAX level and the discrete WCAG level. It does not necessarily indicate an ergonomic penalty.

#### Experimental status

These formats are alternative representations of the same result, not separate scoring methods.

Their usefulness is being evaluated with designers, developers, accessibility specialists, and other users. This evaluation will determine whether the formats should be retained, consolidated, modified, or replaced.

The Orchestrator exposes them through `grades.structural`, `grades.analytical`, and `grades.symbolic`.

The `string` property currently duplicates `grades.structural` for backward compatibility.

## 6. Parameter provenance

All numerical constants used by the scoring core are registered in `dist-js/ipax-params.js`.

Each parameter includes its value, unit, provenance classification, references, and explanatory notes.

The classifications are:

- **NORM:** Defined by published standards.
- **LIT:** Derived from published literature.
- **IPAX1:** Inherited from the original IPAX implementation.
- **DESIGN:** Introduced through documented engineering decisions.
- **DISPLAY:** Used exclusively to control presentation and warnings.

`docs/PARAMETERS.md` is generated from this registry.

Scientific references may support the existence or direction of an effect without establishing the numerical magnitude assigned to its penalty.

Heuristic parameters requiring further calibration or validation are identified in the registry.

## 7. Implementation and testing

The scoring implementation is contained in `dist-js/`.

The Orchestrator exposes the scoring interface and returns the final score together with the individual contrast evaluations and diagnostic details.

For a working browser integration, see:

[Minimal integration](../examples/11-minimal.html)

For interactive inspection of color combinations, thresholds, ergonomic penalties, and disagreements between models, use:

[Diagnostic Cases](../examples/30-cases.html)

The diagnostic tool evaluates 262,144 color combinations using the scoring engine.

Examples of specific color pairs are intentionally not maintained in this document. Their current results should be obtained from the executable examples rather than duplicated in static documentation.

## 8. Related documentation

- [APCA/WCAG Semantic Alignment](APCA-WCAG-ALIGNMENT.md)
- [Typography](TYPOGRAPHY.md)
- [Parameters](PARAMETERS.md)
- [References](REFERENCES.md)
- [History](HISTORY.md)
- [Changelog](CHANGELOG.md)


---

*IPAX Scoring System v0.1.21 • 2026-10-26, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data).*