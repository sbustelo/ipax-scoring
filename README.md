# IPAX Scoring System

_v0.1.21 • 2026-10-23 • Santiago Bustelo • [ipax.bustelo.com.ar](https://ipax.bustelo.com.ar/)_

> **Pre-release notice:** _Ergonomic parameters, calibration, and results are subject to change before v1.0. This version is published for experimentation, technical review, community feedback, and early adoption._

IPAX Scoring combines WCAG 2.x, APCA (when available), and optical ergonomics into a single compact 0–6 scale, making it easier to evaluate color combinations, accessibility, and reading comfort. Its [scoring model](docs/IPAX-SCORING.md) integrates normative contrast requirements, perceptual contrast evaluation, and ergonomic adjustments.

Contrast alone doesn't tell the whole story. Excessive contrast, glare, halation, and chromatic interference can affect visual comfort even when a color pair passes conventional accessibility checks. These concerns are particularly relevant to people with visual conditions such as astigmatism, which affects an estimated [40% of adults](https://www.researchgate.net/publication/368334523_Epidemiology_and_Burden_of_Astigmatism_A_Systematic_Literature_Review).

The scoring engine is open source. Its parameters, references, design decisions, and limitations are documented for inspection and discussion.

## Try IPAX

**[Live testing environment and documentation](https://ipax.bustelo.com.ar/)**

The repository includes interactive tools for exploring how the scoring model behaves across different color combinations.

| Tool | What it shows | Source code |
|---|---|---|
| **Calculator** | Interactive color-pair evaluation, including contrast, typography, ergonomic penalties, and scoring details. | [10-calculator-en.html](examples/10-calculator-en.html) |
| **Score Map** | IPAX scores across color combinations. | [20-map-score.html](examples/20-map-score.html) |
| **Contrast Map** | Contrast calculations and their relationship to the scoring model. | [21-map-contrast.html](examples/21-map-contrast.html) |
| **Score Decomposition** | Individual ergonomic contributions to the final score. | [22-map-decomposition.html](examples/22-map-decomposition.html) |
| **Diagnostic Cases** | A sweep of 262,144 color combinations to examine thresholds, penalties, and disagreements. | [30-cases.html](examples/30-cases.html) |
| **APCA/WCAG Semantic Alignment** | The consequences of mathematical versus semantic alignment between the two contrast models. | [31-apca-wcag-alignment.html](examples/31-apca-wcag-alignment.html) |

## Integration examples

- **[Minimal integration](examples/11-minimal.html):** A stripped-down example showing how to call the scoring engine without the calculator's UI and rendering logic.
- **[Spanish calculator](examples/10-calculator-es.html):** Demonstrates the separation of the scoring algorithm from localized content through interchangeable JSON dictionaries.

## Usage

```javascript
import { IPAXOrchestrator } from '../../dist-js/orchestrator.js';
import { apcaEngine } from './apca-bridge.js';

const result = IPAXOrchestrator.getScore({
    colors: { text: '#FFFFFF', bg: '#111111' },
    env: { apcaEngine: apcaEngine },
    dict: dictionaryObject
});
```

This snippet illustrates the orchestrator API. For a working browser implementation without localization dependencies, see [Minimal integration](examples/11-minimal.html).

The core uses ES modules and does not bundle APCA. An APCA engine can be injected through the orchestrator; otherwise, IPAX falls back to WCAG-only calculations.

## How the score works

IPAX uses a continuous 0–6 scale, with discrete levels indicating different contrast and design-quality thresholds.

The following levels, thresholds, and descriptions are defined in the project's single source of truth, [`data/dictionary.en.json`](data/dictionary.en.json).

| Score | Name | APCA | WCAG / FAA-HFDS | Description |
|---|---|---|---|---|
| **6** | Excellent | Gold (≥ Lc 90) | FAA-HFDS Limit (≥ 15:1) | Optimal optical comfort for continuous reading.* |
| **5** | Very Good | Silver (≥ Lc 75) | FAA-HFDS Optimal (≥ 10:1) | Strong contrast, but potential for fatigue over extended use. |
| **4** | Good | Bronze (≥ Lc 60) | AAA (≥ 7:1) | Maximum legal threshold; high contrast may incur overstimulation. |
| **3** | Acceptable | Basic (≥ Lc 45) | AA (≥ 4.5:1) | Baseline legal compliance for standard text. |
| **2** | Functional | Large (≥ Lc 30) | Large (≥ 3:1) | Restricted to large text (WCAG) or inactive/disabled text (APCA). |
| **1** | Low | Non-text (≥ Lc 15) | Fail | Visible baseline; strictly non-text elements (icons, borders). Fails WCAG for text. |
| **0** | Fail | Fail | Fail | No compliance: fails both WCAG and APCA minimums. |

*Level 6 is reached only when no ergonomic penalties reduce the score. The FAA Human Factors Design Standard recommends character contrast between 6:1 and 10:1 for optimum legibility and warns that contrast above 15:1 may cause visual discomfort. IPAX uses 15:1 as a high-contrast reference point, not as an FAA recommendation for optimal comfort. Ergonomic penalties account for potential discomfort at high contrast.

APCA and WCAG/FAA-HFDS thresholds are aligned by intended use, not through direct mathematical conversion. See [APCA/WCAG Semantic Alignment](docs/APCA-WCAG-ALIGNMENT.md).


### Contrast requirements and ergonomic penalties

IPAX separates contrast compliance from ergonomic evaluation.

The baseline score is derived from WCAG 2.x and, when available, APCA. Ergonomic penalties and rewards then adjust the continuous score.

**Ergonomic penalties cannot demote a color pair below the applicable minimum legal tier.** For example, a pair with a baseline score of 4 can be reduced to 2 by ergonomic penalties, but not to 1 or 0.

This allows IPAX to preserve the distinction between contrast requirements and design quality.






## Research and documentation

Further documentation is available:

| Document | Contents |
|---|---|
| [IPAX-SCORING.md](docs/IPAX-SCORING.md) | Scoring levels, intended uses, and evaluated color pairs. |
| [APCA-WCAG-ALIGNMENT.md](docs/APCA-WCAG-ALIGNMENT.md) | Semantic alignment strategy and algorithmic disagreements. |
| [TYPOGRAPHY.md](docs/TYPOGRAPHY.md) | WCAG and APCA typography requirements and intersection logic. |
| [PARAMETERS.md](docs/PARAMETERS.md) | Registry of 92 parameters, including values, provenance, and references. |
| [REFERENCES.md](docs/REFERENCES.md) | Normative sources, scientific literature, verification status, and evidence limitations. |
| [HISTORY.md](docs/HISTORY.md) | Research origins and evolution from Tricontrast and k0 to IPAX. |
| [CHANGELOG.md](docs/CHANGELOG.md) | Version history, implementation changes, and roadmap. |

### Parameter provenance

IPAX distinguishes between:

- **NORM:** Values defined by published standards.
- **LIT:** Values derived from literature.
- **IPAX1:** Empirical heuristics inherited from the original implementation.
- **DESIGN:** Parameters introduced through documented design decisions.
- **DISPLAY:** Presentation thresholds that do not affect the score.

Scientific references support the existence or direction of the modeled effects. They do not necessarily establish the numerical magnitude of each penalty.

The registry explicitly identifies parameters that remain empirical heuristics and require further calibration or validation.

See [PARAMETERS.md](docs/PARAMETERS.md) and [REFERENCES.md](docs/REFERENCES.md).

## About APCA and its license

APCA enables IPAX to evaluate contrast using both WCAG 2.x and APCA. Without an APCA engine, IPAX continues operating with WCAG calculations, extending its upper scoring levels using the FAA-HFDS reference ratios of 10:1 and 15:1.

The official `apca-w3` library depends on `colorparsley`, licensed under AGPL.

IPAX does not copy, bundle, or distribute that code. The example bridge (`examples/js/apca-bridge.js`) loads APCA independently at runtime from `esm.sh` and injects it into the orchestrator.

## Origins

IPAX emerged from research begun in August 2025 into accessible color systems, contrast models, and design-system architecture.

The work developed through experiments combining WCAG, APCA, and OKLCH. The need to evaluate large numbers of color pairs led to a unified scoring model; the limitations of contrast-only evaluation led to the introduction of ergonomic factors.

The first stable IPAX engine was presented at Rosenverse (Rosenfeld Media) on July 2, 2026.

See [HISTORY.md](docs/HISTORY.md) for the development timeline.

## Community projects and contributions

### [ipax-tools](https://github.com/roysland/ipax-tools) — Øyvind Røysland

An independent toolkit extending IPAX to command-line applications,
AI agents, and development workflows.

The project includes a modular scoring engine, CLI and MCP server,
Tailwind integration utilities, and experimental tools for evaluating
color combinations.

Beyond the implementation, Øyvind has contributed valuable testing
and observations on visual sensitivity, ambient conditions, and the
limitations of evaluating color pairs in isolation.

His experiments on surrounding visual context have helped identify
questions for future research into IPAX's ergonomic model.

Thank you, Øyvind, for your initiative, generosity, and thoughtful
contributions.


## About the IPAX System

IPAX Scoring is a foundational building block of the broader **IPAX System**: an open architecture that brings design, engineering, branding, and accessibility together.

IPAX applies software engineering principles such as **abstraction, composition, and encapsulation** to reduce combinatorial complexity, making Design Systems more manageable, adaptive, expressive, and accessible.

The system takes its name from its color composition grammar: **Ink, Paper, Accents, and eXtended colors**. By establishing contextual roles and composition rules, IPAX reduces the number of color combinations a Design System needs to define, maintain, and evaluate.

The architecture is [documented openly under CC BY 4.0, while the scoring engine is released under Apache 2.0](LICENSE).

- [IPAX System Architecture](docs/IPAX-SYSTEM.md) — Principles, color grammar, composition rules, and complexity reduction.
- [IPAX Color System Audit](https://ipax.bustelo.com.ar/audit.php) — Evaluate color systems using IPAX Scoring.
- [IPAX Theme Builder](https://ipax.bustelo.com.ar/builder.php) — Interactive exploration of the composition architecture.


## ☕ Say thanks

IPAX Scoring is developed and maintained independently as an open-source project.

If you find it useful, you can [buy me a coffee](https://cafecito.bustelo.com.ar/).

Entirely optional, never required.

---

_IPAX v0.1.21 • 2026-10-23 • Santiago Bustelo • [Apache 2.0 / CC BY 4.0 License](LICENSE)_