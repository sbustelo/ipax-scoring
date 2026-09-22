# IPAX Scoring System

IPAX is an algorithmic scoring system that integrates WCAG 2.x calculations, the APCA contrast model, and optical ergonomics metrics into a 5-point scale. It evaluates baseline contrast and applies mathematical modifiers for halation, macular glare, and chromatic fatigue.

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

## The IPAX Score

Scores X to 3 indicate adherence to technical readability thresholds. Scores 4 and 5 indicate optical stability and reduction of visual fatigue under sustained use.

| IPAX Score | APCA Grade | WCAG Grade | Status |
| --- | --- | --- | --- |
| **5** | Gold (≥ Lc 90) | \\- | Optimal optical comfort. |
| **4** | Silver (≥ Lc 75) | \\- | Stable for sustained reading. |
| **3** | Bronze (≥ Lc 60) | AAA (7.0:1) | Maximum compliance threshold. |
| **2** | Basic (≥ Lc 45) | AA (4.5:1) | Baseline legal compliance. |
| **1** | Large (≥ Lc 30) | Large (3.0:1) | Restricted to large text. |
| **X** | Fail | Fail (<3.0:1) | Does not meet contrast minimums. |

## IPAX Algorithm Cascade

1.  **Color Space Translation ($mTxtOklch,$mBgOklch, $nTxtY,$nBgY):** Converts the input HEX colors to OKLCH (to evaluate perceptual hue, chroma, and lightness) and Relative Luminance (Y) to maintain backward compatibility with standard normative formulas.
2.  **WCAG Evaluation ($nWcagScore):** Calculates the standard contrast ratio (0 to 21). Segments the result into scores: 0 (Fail), 1 (Large), 2 (AA), 3 (AAA).
3.  **APCA Evaluation ($nApcaScore):** Extracts the absolute Lc value. Segments the result into scores: 0 (Fail), 1 (Large), 2 (Basic), 3 (Bronze), 4 (Silver), 5 (Gold).
4.  **Normative Intersection ($nComplianceLevel):** Takes the strict **minimum** between the WCAG and APCA scores: `Math.floor(Math.min($nWcagScore, $nApcaScore))`. If _either_ system fails (0), the entire baseline compliance is immediately set to 0.
5.  **Fractional Calculation ($nRawScore):** If the baseline compliance is level 1 or 2, linear interpolation (`$fGetDec`) is applied within that level's boundaries (e.g., resulting in 1.4 or 2.7). This provides granular scoring without jumping to the next integer bracket.
6.  **Penalty Accumulation ($nTotalPenalty):** Evaluates ergonomic flaws (Jitter, Glare, Halation, Chromostereopsis, etc.) based on the OKLCH model. These values are always subtracted from the score.
7.  **Defensive Floor Application ($nFloor):** The raw score (`$nRawScore`) is reduced by the penalties. If `$nComplianceLevel` is >= 1 (meaning it passed BOTH WCAG and APCA minimums), the final score is clamped so it cannot drop below 1.0. If `$nComplianceLevel` was already 0 (a fail in either system), the floor is 0.
8.  **Rewards and Ceilings:** Bonus points for fatigue reduction (e.g., Paper Tone) are added to the post-penalty score. Upper bounds (max 3.0 or 5.0) are applied to ensure bonuses do not artificially inflate a score beyond its APCA capability limit.

## About APCA and its license

APCA unlocks IPAX scores 4 and 5. Without it, IPAX still works fully, it just falls back to WCAG 2.x and caps the score at 3.0.

The official `apca-w3` library depends on `colorparsley`, licensed under AGPL. This repository never copies, bundles, or commits that source. `example/js/apca-bridge.js` fetches `apca-w3` from a public CDN (`esm.sh`) at runtime, in the browser of whoever runs the example. If that succeeds, IPAX gets APCA and can score up to 5; if it fails, IPAX degrades to WCAG-only automatically. Including IPAX in your own project doesn't pull any AGPL code into your codebase.

## Documentation and Sandbox

Live testing environment and documentation: [https://ipax.bustelo.com.ar/](https://ipax.bustelo.com.ar/)


## ☕ Say thanks

This project is maintained on personal time, for free, with no plan to charge for it. If you want to say thanks, you can [buy me a coffee](https://cafecito.bustelo.com.ar/).

Entirely optional, never required.

---

*IPAX v0.1.03 — 2026-09-22, Santiago Bustelo • [Apache 2.0 / CC BY 4.0 License](LICENSE).*