# IPAX Scoring System

This document details the scoring logic for IPAX v0.1.20. The system distills the complexities of WCAG 2.x, APCA (WCAG 3 candidate), and optical ergonomics into a single 0-to-6 scale. 

*(Note: The JSON source of truth for these levels can be found in `data/dictionary.en.json` and `data/dictionary.es.json`).*

## IPAX *Strict* Strategy

Currently (as v.0.1.20), IPAX evaluates color pairs using a **Strict** strategy, based on the following rationale:

*   **The Disagreement:**  The math behind WCAG 2 and APCA is fundamentally different and mathematically incompatible. There are color pairs that APCA approves but WCAG 2 fails (e.g., `#FFFFFF` on `#B4B4B4` yields a failing WCAG 2.07 but a passing APCA Lc 45), and vice versa (e.g., `#969696` on `#010101` yields a WCAG 7.05 AAA but a baseline APCA Lc 45).
*   **The Semantic Alignment (vs Mathematical):** The official [APCA Contrast Legend](https://apcacontrast.com/#:~:text=APCA%20Contrast%20Legend) proposes a stricter mathematical correspondence (e.g., mapping Lc 45 to WCAG 3.0:1 instead of 4.5:1). If IPAX adopted this mathematical scale while enforcing its "Strict" strategy of rejecting any color that either algorithm fails, the valid design space would collapse almost entirely. Because IPAX is a practical scoring tool rather than a new normative standard, it maps the formulas *semantically*. It aligns their intended use cases (e.g., mapping both APCA Basic and WCAG AA as the "standard text minimum") instead of their math.
*   **The Legal Reality:** Today, the legal standard is WCAG 2. Therefore, if a color pair fails WCAG 2, it is not legally compliant.
*   **The Physical Reality:** WCAG 2's math is flawed, particularly in dark mode, often approving color combinations that are physically unreadable. APCA accurately catches these failures.

To guarantee both **accessibility** and **compliance**, the Strict strategy takes the lowest common denominator of this semantic intersection.  
Under this strategy, a design is only considered compliant (Score 2, 3, or 4) if it meets the physical readability standards of APCA *and* the legal thresholds of WCAG 2.

---

## Score 0: Fail
**No compliance / No accessibility**

Under the Strict strategy, a score of 0 means the color pair fails to meet the minimum required contrast thresholds for both WCAG 2 and APCA. It is completely unusable.

### IPAX Score 0 Examples
*   `#000000` on `#000066`, `#000000` on `#000099`, `#000000` on `#0000CC`

---

## Score 1: Low / Non-Text (APCA Base)
**Visible, but not legally compliant for text.**

Score 1 represents the absolute baseline of visual discernibility. It is strictly for non-text elements. Under the Strict strategy, Score 1 also captures the "intersection zone": cases that completely fail WCAG 2 (legally non-compliant) but have enough physical luminance contrast to be detected by APCA. 

At this level, elements are visible but cannot be read fluently. An element can also drop down to Score 1 from a higher level if it incurs severe ergonomic penalties (such as intense chromostereopsis).

**Official APCA Definition (L<sub>c</sub> 15):**
> *"The absolute minimum for any non-text that needs to be discernible, and is no less than 6px (solid) in its smallest dimension. This may include dividers, and in some cases large buttons or thick focus visible outlines, but does not include fine details which have a higher minimum. Designers should treat anything below this level as invisible, as it will not be visible for many users."* — [apca-w3](https://github.com/Myndex/apca-w3/blob/master/docs/APCA_in_a_Nutshell.md)

### IPAX Score 1: Typical Use cases
Separators, structural borders, thick focus outlines, decorative hints, disabled graphics. *Strictly prohibited for text.*

### IPAX Score 1 Examples
*   **Intersection (APCA Pass / WCAG Fail):** `#9E9E9E` on `#EAEAEA`
*   **Ergonomic Collapse:** `#0000FF` on `#000000` (S-Cone Strain), `#FF0000` on `#0000FF` (Chromostereopsis)

---

## Scores 2 to 4: Accessibility Compliance
**The Safe Zone.** 
Scores 2 through 4 indicate that a color pair meets both legal (WCAG 2) and technical (APCA) thresholds for readability. Reaching 3 or 4 means the design is safe: it passes current accessibility requirements. 


## Score 2: Functional
**Restricted to large text (WCAG 2) or inactive/disabled/secondary text (APCA).**
The minimum threshold where typography becomes functional for specific, non-continuous reading roles. It bridges a critical divergence between WCAG 2 and APCA regarding disabled and secondary elements under the Strict strategy:

*   **WCAG 2:** Meets the 3.0:1 minimum ratio. Legally restricted to Large Text (at least 18pt / 24px normal, or 14pt / 18.67px bold).
*   **The WCAG 2 Exemption:** For active elements, WCAG 2 requires a 3.0:1 ratio for **Large Text** (at least 18pt / 24px normal, or 14pt / 18.67px bold). Crucially, WCAG 2 **completely waives** contrast requirements for inactive or disabled text:
    > *"Incidental: Text or images of text that are part of an inactive user interface component, that are pure decoration, that are not visible to anyone, or that are part of a picture that contains other significant visual content, have no contrast requirement."* — [W3C WCAG 2.2 SC 1.4.3]
*   **The APCA Floor (L<sub>c</sub> 30):** Unlike WCAG, APCA does not grant total exemptions to text based on semantic state alone. It establishes L<sub>c</sub> 30 as the absolute physical floor for "spot readable" text.
    > *"The absolute minimum for any text not listed above, including text considered as 'spot readable'. This includes placeholder text and disabled element text..."*
*   **IPAX Strict Synthesis:** Because WCAG 2 imposes *zero* contrast requirement on inactive components, relying solely on the law can result in disabled text or placeholders that are completely invisible (especially in dark mode). By enforcing Score 2, IPAX guarantees the component is both legally compliant (exempt under WCAG) and physically discernible without optical strain (APCA L<sub>c</sub> 30).

### IPAX Score 2: Typical Use cases
Disabled/inactive text, input placeholders, copyright bugs, large semantic non-text (icons $\ge 4\text{px}$), and active Large Text (WCAG 24px+).

### IPAX Score 2 Examples
*   **Pure (Zero Penalty):** `#000000` on `#996666`, `#001515` on `#669999`, `#001533` on `#0066FF`, `#001533` on `#009900`
*   **Penalty Drop:** `#767676` on `#FFFFFF` (WCAG AA Limit), `#000000` on `#0066FF`, `#000000` on `#009900`, `#000000` on `#0099FF`


### Score 3: Acceptable
**Baseline legal compliance for standard text.**
Meets the WCAG AA (4.5:1) and APCA Basic (L<sub>c</sub> 45) thresholds.

*   **WCAG 2:** Meets the 4.5:1 minimum ratio (Level AA). Valid for normal body text.
*   **APCA (L<sub>c</sub> 45):**
    > *"The minimum for larger, heavier text (36px normal weight or 24px bold) such as headlines, and large text that should be fluently readable but is not body text. This is also the minimum for pictograms with fine details, or smaller outline icons."*

### IPAX Score 3: Typical Use cases
Standard UI text, secondary labels, buttons, navigation links, short form data.

### IPAX Score 3 Examples
*   **Pure (Zero Penalty):** `#000000` on `#669999`, `#000000` on `#999966`, `#000000` on `#999999`
*   **Penalty Drop:** `#000000` on `#00CC00`, `#000000` on `#00CC33`, `#000000` on `#00CC66`

---

### Score 4: Good
**Maximum legal threshold OR high contrast with penalties.**
Meets WCAG AAA (7.0:1) and APCA Bronze (L<sub>c</sub> 60). Crucially, extremely high-contrast pairs (like `#000000` on `#FFFFFF` or `#FFFFFF` on `#000000`) often fall into this score because their maximum theoretical base score is degraded by physical penalties (Halation, Macular Glare).

*   **WCAG 2:** Meets the 7.0:1 minimum ratio (Level AAA). 
*   **APCA (L<sub>c</sub> 60):**
    > *"The minimum level recommended for content text that is not body, column, or block text. In other words, text you want people to read. The minimums: no smaller than 48px/200, 36px/300, 24px normal weight (400), 21px/500, 18px/600, 16px/700 (bold)..."*

### IPAX Score 4: Typical Use cases
High-impact headlines, UI controls, badges, short paragraphs. *Not recommended* for immersive long-form reading if the score was reached via penalty degradation (overstimulation).

### IPAX Score 4 Examples
*   **Pure (Zero Penalty):** `#000000` on `#99CCCC`, `#000033` on `#CCCC99`
*   **Penalty Drop (Extreme Contrast):** `#FFFFFF` on `#000000` (Halation + Mydriasis), `#000000` on `#FFFF00` (Glare + Chroma), `#000000` on `#00F400`

---

## Scores 5 and 6: Design Quality & Ergonomics
**The IPAX Zone.** 
Everything beyond Score 4 is an improvement in design quality, not a legal compliance requirement. 

High contrast (which WCAG and APCA reward mathematically) can improve detectability, but taking it to the extreme can increase visual fatigue, become uncomfortable over time, or fail users with astigmatism or light sensitivity. 

IPAX introduces penalties for physical phenomena like **Halation** (irradiation), **Macular Glare**, and **Chromatic Fatigue**. Scores 5 and 6 represent combinations that survive these penalties—meaning they are not only readable, but perfectly stable and comfortable for sustained use in real interfaces.

### Score 5: Very Good
**Strong contrast, but potential for fatigue.**
Excellent base contrast (APCA L<sub>c</sub> 75), but lacks absolute optical comfort. It can cause visual fatigue over extended periods or be slightly harmful to users with astigmatism or light sensitivity due to lack of ergonomic mitigation.
*   **APCA (L<sub>c</sub> 75):**
    > *"The minimum level for columns of body text with a font no smaller than 24px/300 weight, 18px/400, 16px/500 and 14px/700. This level may be used with non-body text with a font no smaller than 15px/400."*

### IPAX Score 5: Typical Use cases
General web content, standard articles, data-heavy dashboards, forms.

### IPAX Score 5 Examples
*   **Pure (Zero Penalty):** `#000000` on `#CCCCCC`, `#000000` on `#CCCCFF`, `#000000` on `#FFCCCC`
*   **Penalty Drop:** `#000000` on `#66F4F4`, `#000000` on `#66FF99`, `#000000` on `#66FFF4`

---

### Score 6: Excellent
**Optimal optical comfort (Recommended for continuous reading).**
The pinnacle of readability. Reached when APCA contrast is high (L<sub>c</sub> 90), physical penalties are zero, and/or ergonomic **Rewards** are active.
*   **APCA (L<sub>c</sub> 90):**
    > *"Preferred level for fluent text and columns of body text with a font no smaller than 18px/weight 300 or 14px/weight 400 (normal), or non-body text with a font no smaller than 12px/400... Lc 90 is a suggested maximum for very large and bold fonts (greater than 36px bold), and large areas of color."*

* **Reward Examples that elevate to Score 6:**
  * **Paper Tone:** Using a warm, off-white background (e.g., `#F5F2EB`) with dark text. It mitigates macular glare completely while preserving positive polarity.
  * **Chromatic Relief:** Completely neutral backgrounds (`#EAEAEA`) that eliminate chromatic adaptation load, freeing visual processing resources.
  * **Achromatic Tint Contrast:** Purely neutral text over a lightly tinted background, eliminating chromatic aberration directly on the typographic glyphs.

### IPAX Score 6: Typical Use cases
Immersive reading environments, e-books, long-form documentation, focused editorial content.

### IPAX Score 6 Examples
*   **Optimal (High APCA, Zero Penalties):** `#000000` on `#CCFFFF`, `#000000` on `#F4F4F4`, `#000000` on `#CCF4F4`

---

*Note: For a comprehensive list of evaluated pairs, edge cases, and a full mapping of ergonomic penalty drops across the matrix, run the `examples/30-cases.html` sweep tool directly in your browser.*


---

_IPAX Scoring System v0.1.20 • 2026-10-22, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data)._