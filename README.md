# IPAX Scoring System

IPAX is an algorithmic scoring system that integrates WCAG 2.x calculations, the APCA contrast model, and optical ergonomics metrics into a 6-point scale. It evaluates baseline contrast and applies mathematical modifiers for halation, macular glare, and chromatic fatigue.

## Usage

*Working minimal example: [examples/11-minimal.html](examples/11-minimal.html)*

```javascript
import { IPAXOrchestrator } from '../../dist-js/orchestrator.js';
import { apcaEngine } from './apca-bridge.js';

const result = IPAXOrchestrator.getScore({
    colors: { text: '#FFFFFF', bg: '#111111' },
    env: { apcaEngine: apcaEngine },
    dict: dictionaryObject
});
```



## Philosophy: The Legal Floor & Code Simplicity

IPAX operates under a strict separation of concerns between **legal compliance** and **design quality** (ergonomics):

1. **The Law is the Law:** As of today, WCAG 2.x is the active legislation in most jurisdictions. Therefore, WCAG 2.x acts as the absolute, non-negotiable floor for the IPAX score. If a color pair fails WCAG 2.x, it fails IPAX, even if modern continuous algorithms (like APCA) deem it ergonomically safe. IPAX will always evaluate the worst-case legal scenario.
2. **Design quality:** APCA is a better model for human perception, rejecting pairs that WCAG 2 formula approves. On top of that, IPAX considers ergonomic penalties for halation, glare, hue induction and other documented fenomena to inform better design decisions.


## The IPAX Score

*For even more detail and examples: [IPAX-SCORING](docs/IPAX-SCORING.md)*

Scores 2 to 4 indicate adherence to technical readability thresholds. Score 1 indicates *barely perceptible* contrast that fall below the legal minimum for readable text. Scores 5 and 6 go beyond legal legislation, indicating optical stability and a reduction of visual fatigue under sustained use.

| IPAX Score | APCA Grade | WCAG Grade | Status |
| --- | --- | --- | --- |
| **6** | Gold (≥ Lc 90) | AAA Max (15.0:1) | Optimal optical comfort. |
| **5** | Silver (≥ Lc 75) | AAA High (10.0:1) | Stable for sustained reading. |
| **4** | Bronze (≥ Lc 60) | AAA (7.0:1) | Maximum compliance threshold. |
| **3** | Basic (≥ Lc 45) | AA (4.5:1) | Baseline legal compliance. |
| **2** | Large (≥ Lc 30) | Large (3.0:1) | Restricted to large text. |
| **1** | Non-text (≥ Lc 15) | N/A | Visible, not legible: icons and graphics. |
| **X** | Fail | Fail | Does not meet contrast minimums. |

## IPAX Algorithm Cascade

1.  **Color Space Translation ($mTxtOklch,$mBgOklch, $nTxtY,$nBgY):** Converts the input HEX colors to OKLCH (to evaluate perceptual hue, chroma, and lightness) and Relative Luminance (Y) to maintain backward compatibility with standard normative formulas.
2.  **WCAG Evaluation ($nWcagScore):** Calculates the standard contrast ratio (0 to 21). Segments the result into scores: 0 (Fail), 2 (Large), 3 (AA), 4 (AAA).
3.  **APCA Evaluation ($nApcaScore):** Extracts the absolute Lc value. Segments the result into scores: 0 (Fail), 1 (Non-text), 2 (Large), 3 (Basic), 4 (Bronze), 5 (Silver), 6 (Gold).
4.  **Normative Intersection ($nComplianceLevel):** Takes the strict **minimum** between the WCAG and APCA scores: `Math.floor(Math.min($nWcagScore, $nApcaScore))`. If _either_ system fails (0), the entire baseline compliance is immediately set to 0.
5.  **Base Score Calculation ($nBase):** A continuous, granular base score is computed using piecewise-linear interpolation over the contrast ratios (WCAG mapping to 0/2/3/4/5/6 and APCA mapping to 0-6). This translates discrete brackets into a smooth mathematical curve (e.g., resulting in 1.4 or 2.7) without abrupt step jumps.
6.  **Continuous Penalty Accumulation ($nTotalPenalty):** Evaluates ergonomic flaws (Jitter, Glare, Halation, Chromostereopsis, etc.) based on the OKLCH model. Penalties are driven by continuous curves (smoothsteps and gaussians) rather than hard thresholds, ensuring smooth transitions across the color space. These values are accumulated and subtracted from the base score.
7.  **Defensive Legal Ceiling:** The core ensures that no matter the rewards applied, the final grade cannot structurally exceed the legal tier determined by WCAG. The legal level dictates the hard ceiling for the final score.
8.  **Rewards and Ceilings:** Bonus points for fatigue reduction are considered. The final score is rigidly capped to never exceed the inherent unpenalized base score (`final ≤ base`).

## About APCA and its license

APCA unlocks IPAX scores 5 and 6. Without it, IPAX still works fully, it just falls back to WCAG 2.x, using 10:1 and 15:1 as upper tiers.

The official `apca-w3` library depends on `colorparsley`, licensed under AGPL. This repository never copies, bundles, or commits that source. `example/js/apca-bridge.js` fetches `apca-w3` from a public CDN (`esm.sh`) at runtime, in the browser of whoever runs the example. If that succeeds, IPAX gets APCA and can grade design quality; if it fails, IPAX degrades to WCAG-only automatically. Including IPAX in your own project doesn't pull any AGPL code into your codebase.

## Documentation and Sandbox

Live testing environment and documentation: [https://ipax.bustelo.com.ar/](https://ipax.bustelo.com.ar/)


## ☕ Say thanks

The IPAX Score system is maintained on personal time, for free, with no plan to charge for it. If you want to say thanks, you can [buy me a coffee](https://cafecito.bustelo.com.ar/).

Entirely optional, never required.

---

*IPAX v0.1.20 — 2026-10-22, Santiago Bustelo • [Apache 2.0 / CC BY 4.0 License](LICENSE).*