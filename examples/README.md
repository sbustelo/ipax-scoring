# IPAX Scoring System — Examples & Inspector Suite

This directory provides everything from minimal integration boilerplate code to advanced visual analysis tools used to debug the continuous mathematics of the IPAX scoring engine.

## Directory Structure

The files are prefixed numerically to guide you from basic implementation up to advanced analytical consoles:


### 10-Series: Integration Basics
These examples demonstrate how to integrate the IPAX Orchestrator into your own web applications.
*   **`10-calculator-en.html` & `10-calculator-es.html`**: The full IPAX Calculator UI. Demonstrates advanced integration using semantic JSON dictionaries to translate grades, penalties, and textual feedback (`js/ipax-integration.js`).  
**Online demo:** https://ipax.bustelo.com.ar/?m=map-score  

*   **`11-minimal.html`**: The absolute minimal integration. Bypasses complex UIs and dictionaries, returning raw numerical data. Ideal for developers building custom tooling (`js/ipax-integration-minimal.js`).

### 20-Series: Sweep & Visual Inspectors (The Workbench)
Advanced tools designed to map the entire color space and compare the behavior of WCAG 2, APCA, and IPAX side-by-side.
*   **`20-map-score.html`**: Generates 256x256 quantized comparative maps of WCAG, APCA, and IPAX scores by sweeping Lightness (L) for both text and background, across user-defined constant Chroma (C) and Hue (H) values for each.  
**Online demo:** https://ipax.bustelo.com.ar/?m=map-score  

*   **`21-map-contrast.html`**: A line chart demonstrating the non-monotonic nature of IPAX. Shows why infinite photometric contrast does not always equal optimal legibility.  
**Online demo:** https://ipax.bustelo.com.ar/?m=map-contrast  

*   **`22-map-decomposition.html`**: Decomposed 2D maps of all individual ergonomic penalties (Halation, Glare, Chromostereopsis, etc.).  
**Online demo:** https://ipax.bustelo.com.ar/?m=map-decomposition

### 30-Series: Normative Diagnostics
*   **`30-cases.html`**: An automated sweep tool that looks for example contrast pairs for 0 to 6 score levels, isolates mathematical edge cases where WCAG and APCA diverge drastically, and documents severe ergonomic penalty drops.  
**Online demo:** https://ipax.bustelo.com.ar/?m=cases

## Integration Architecture Notes
*   **`dist-js/`**: The core mathematical engine. Requires zero dependencies. Always include this directory intact.
*   **`js/apca-bridge.js`**: Dynamically imports the APCA engine via CDN to prevent AGPL license contamination in your project.
*   **`data/`**: JSON dictionaries required *only* if you use the advanced `ipax-integration.js` to get translated semantic text instead of raw numbers.


### Portability: Asset Isolation Strategy

To maximize portability, all example scripts resolve dependencies using an **Iterative Upward Search Strategy**.

Examples support two operational deployment modes:

1. **Embedded Mode (Repository Root):**
   When served from the repository root, scripts resolve core engines and dictionaries by walking backwards up the tree (`../../dist-js/`, `../../data/`).

2. **Standalone Mode (Isolated `examples/` Directory):**
   You may copy or symlink the `dist-js/` and `data/` directories directly inside `examples/`:
   ```text
   examples/
   ├── data/          <-- Local override/copy of dictionaries
   ├── dist-js/       <-- Local override/copy of core engine
   ├── 10-calculator-en.html
   ├── 20-sweep-compare.html
   └── 30-cases.html

---

_IPAX Scoring System v0.1.20 • 2026-10-22, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data)._