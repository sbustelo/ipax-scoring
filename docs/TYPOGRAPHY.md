# IPAX Typography & Font Size Logic

2026, [Santiago Bustelo](https://www.bustelo.com.ar/)  
[Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data)  
v0.1.06 • 2026-10-16

---

This document outlines how the IPAX Scoring System handles font size requirements, merging the strict legal compliance of WCAG 2.x with the ergonomic biological models of APCA.

## 1. The Legal Floor vs. Ergonomics

IPAX does not legislate; it evaluates accesibility and ergonomics to guide better design decisions. 

The current normative legislation (WCAG 2.x) acts as the absolute legal floor. Ergonomic models (APCA) are applied to improve biological comfort, but they can never override a legal minimum. 

### The WCAG 2.x Model
WCAG 2.x **does not establish a universal minimum font size**. It only regulates typography when a color pair fails the standard 4.5:1 ratio but achieves at least 3.0:1. In this specific scenario, the law strictly demands "Large Text", which maps to two rigid anchors:
*   **Normal Weight (< 700):** Minimum 24px (18pt).
*   **Bold Weight (≥ 700):** Minimum 18.5px (14pt).

### The APCA Model
APCA introduces a comprehensive experimental matrix. Instead of binary thresholds, it calculates the ergonomic minimum font size based on the exact Lightness Contrast (Lc), mapping specific requirements for every font weight from 100 to 900.

## 2. The IPAX Intersection Logic

To provide actionable data without risking legal non-compliance, IPAX decouples and then intersects both models:

1. **The Legal Clamp:** If a color pair falls into the WCAG "Large Text" zone (3.0:1 to 4.49:1), the 24px / 18.5px requirements become a strict legal floor. If APCA recommends a smaller size (e.g., 18px), IPAX clamps the output to the WCAG legal minimum. If APCA recommends a larger size due to ergonomic stress (e.g., 32px), the larger size is recommended.
2. **The Unconstrained Zone:** If a color pair exceeds 4.5:1, WCAG imposes no size restrictions. Here, APCA dictates the optimal ergonomic minimum (e.g., 12px or 15px).
3. **The Graceful Degradation (Fallback):** If the APCA engine or its reference matrix is unavailable, IPAX abandons typographic guessing. It defaults strictly to WCAG's legal floors. For high-contrast pairs where WCAG has no rule, the UI defaults to a 16px industry convention, explicitly warning the user that WCAG does not mandate a minimum.

## 3. Integration into the Design Process

IPAX is designed to bridge the gap between accessibility testing and real-world design workflows. 

### The "Color-First" Approach (Current Implementation)
Standard accessibility checkers may require the designer to input both colors *and* font size just to return a binary "Pass/Fail". This would create a tedious trial-and-error loop.

In day-to-day UI design, brand colors are usually rigid, while typography is more flexible. By requiring only the color pair as input, IPAX outputs the exact minimum font sizes required for both Normal and Bold text. The designer doesn't guess; the tool provides the exact typographic constraints needed to make those specific colors legal and ergonomic.

### The "Size-First" Approach (Future Scope for IPAX tools)
This architecture leaves the door open for inverse applications. In early phases of building a design system or a brand manual, a designer might lock a font size (e.g., "Our secondary labels must be 12px"). A "Size-First" algorithm could then take that rigid typographic constraint and automatically shift the lightness/chroma of the proposed colors until they meet the required compliance for that specific size.

### The "Size-First" Approach (Future Scope for IPAX tools)
This architecture leaves the door open for inverse applications. In early phases of building a design system or a brand manual, a designer might lock a font size (e.g., "Our secondary labels must be 12px"). A "Size-First" algorithm could then take that rigid typographic constraint and automatically shift the lightness/chroma of the proposed colors until they meet the required compliance for that specific size.

## 4. Truth Table & Output Matrix

To ensure clarity in the UI, the presentation layer must communicate both the legal constraint and the ergonomic recommendation based on the core's output. The following matrix dictates the UI states across different ratios and availability scenarios:

| Scenario | WCAG Legal Rule | APCA Output | Effective Output Size | Presentation String (UI Template) |
| :--- | :--- | :--- | :--- | :--- |
| **Ratio $\ge 4.5$<br>APCA OK** | Unconstrained (`null`) | $15\text{px}$ (Normal)<br>$12\text{px}$ (Bold) | **15px** (Normal)<br>**12px** (Bold) | `15px (APCA) · WCAG has no minimum (convention 16px)`<br>`12px (APCA) · WCAG has no minimum (convention 16px)` |
| **Ratio $3.0 - 4.49$<br>APCA OK (Smaller)** | $24\text{px}$ (Normal)<br>$18.5\text{px}$ (Bold) | $18\text{px}$ (Normal)<br>$14\text{px}$ (Bold) | **24px** (Normal)<br>**18.5px** (Bold) | `24px (WCAG legal floor; APCA suggested 18px)`<br>`18.5px (WCAG Bold floor; APCA suggested 14px)` |
| **Ratio $3.0 - 4.49$<br>APCA OK (Larger)** | $24\text{px}$ (Normal)<br>$18.5\text{px}$ (Bold) | $32\text{px}$ (Normal)<br>$24\text{px}$ (Bold) | **32px** (Normal)<br>**24px** (Bold) | `32px (APCA ergonomics; WCAG minimum 24px)`<br>`24px (APCA ergonomics; WCAG minimum 18.5px)` |
| **Ratio $\ge 4.5$<br>No APCA** | Unconstrained (`null`) | Unavailable (`null`) | **16px** (Normal)<br>**16px** (Bold) | `16px (Standard convention; WCAG has no minimum)`<br>`16px (Standard convention; WCAG has no minimum)` |
| **Ratio $3.0 - 4.49$<br>No APCA** | $24\text{px}$ (Normal)<br>$18.5\text{px}$ (Bold) | Unavailable (`null`) | **24px** (Normal)<br>**18.5px** (Bold) | `24px (WCAG Large Text mandatory floor)`<br>`18.5px (WCAG Bold mandatory floor)` |
| **Ratio $< 3.0$** | Illegal | Spot / Unviable | **Not viable** | `Not viable for text (WCAG normative failure)` |

*Note: 16px is used as the standard web convention (1rem) when WCAG does not enforce a minimum and APCA is unavailable.*

---

*IPAX Scoring System v0.1.06 • 2026-10-16, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data).*