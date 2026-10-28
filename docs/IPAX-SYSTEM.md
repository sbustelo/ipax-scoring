# IPAX System Architecture

**Conceptual architecture and engineering decisions**  
**Status:** Open specification; implementation and validation are evolving.  
**License:** [CC BY 4.0](../LICENSE) for this documentation. Software implementations have their own licenses.

> **Scope.** This document describes the **IPAX System**: a color-role grammar and a set of architectural constraints for building adaptive Design Systems. It does **not** describe the internal software architecture of the [IPAX Scoring engine](../README.md), nor does it imply that any implementation of the IPAX System is included in the [scoring repository](https://github.com/sbustelo/ipax-scoring/).

## 1. The problem: combinatorial complexity

A Design System has to account for themes, surfaces, semantic meanings, interaction states, and component variants. When every combination is specified independently, the number of decisions grows multiplicatively. Maintaining the resulting matrix, and checking its accessibility, becomes increasingly costly and difficult.

IPAX is designed to address this problem **before** individual color pairs are evaluated: it defines a limited vocabulary of roles, rules for composing them, and explicit boundaries on which combinations are valid. Instead of treating every possible pair as an independent design decision, the system derives combinations from a smaller set of inputs.

This does not eliminate the need to test rendered interfaces. It reduces the number of combinations the architecture is designed to produce and makes exceptions identifiable.

## 2. The system and its scoring engine

Two related layers serve different purposes:

- **IPAX System:** the conceptual architecture—roles, contexts, composition rules, and theme adaptation.
- **IPAX Scoring:** a foundational evaluation engine combining WCAG 2.x, APCA (when available), and experimental optical-ergonomic factors into a compact 0–6 score, with diagnostic details.

The grammar defines **which combinations to construct and evaluate**. Scoring helps assess **how those combinations perform**. A score is not a substitute for the grammar, and a grammar is not a certification of accessibility.

## 3. Software engineering principles

### 3.1 Abstraction: roles instead of hardcoded colors

Components express what a color **does** (e.g. ink, paper, or accent in a particular context) rather than embedding specific hex values or assuming a particular theme.

The same component-level intent can therefore be resolved differently in Light, Dark, or other themes without rewriting the component's semantic role.


### 3.2 Encapsulation: hide resolution rules from consumers

A component should not need to know the entire palette, calculate contrast, or implement theme-specific branching to obtain an appropriate color. Those decisions belong to the system's role-resolution and composition layer.

Encapsulation does not mean that accessibility can be guaranteed independently of actual component usage, typography, surroundings, or display conditions.

### 3.3 Composition over configuration: derive combinations

Instead of configuring every color pair as a separate token, IPAX derives allowed pairs by composing a small set of roles under explicit rules.

For example, an accent is evaluated against the two principal anchors (Ink and Paper) rather than being assumed compatible with every other accent. A deliberate accent-on-accent combination is an **exception** that must be documented and evaluated separately.


### 3.4 Single source of truth: centralize foundational decisions

A theme begins with a manageable set of foundational role values. Contextual variants are derived from those values or explicitly overridden where needed.

This principle does not forbid overrides; it makes them visible and intentional instead.

### 3.5 Constraint-based design: restrict the valid space

Not every theoretically possible color pairing should be a supported pairing. IPAX's composition grammar restricts the combinations that components are expected to use.

This is the most powerful mechanism for reducing combinatorial complexity, as it drastically reduces the **supported decision space** from the total mathematical number of possible token combinations.


## 4. The IPAX color grammar

IPAX takes its name from its four color-role families:

| Role | Meaning |
| --- | --- |
| **I — Ink** | One of the two foundational color anchors; generally associated with text/foreground in a Light theme. |
| **P — Paper** | The other foundational anchor; generally associated with the principal surface in a Light theme. |
| **A — Accents** | Colors used for emphasis, actions, and other differentiated roles, contextualized against the anchors. |
| **X — eXtended colors** | Colors beyond the luminance range defined by Ink and Paper, typically black (#000000) and white (#FFFFFF). They extend the available palette without requiring additional WCAG 2 contrast checks, provided the relevant luminance relationships are preserved. |

The roles are **contextual**, not synonyms for fixed RGB values. In Dark themes, the lightness relationship between Ink and Paper reverses. Components refer to their roles and contexts rather than to a hardcoded Light/Dark choice.

The initial Ink–Paper–Accent vocabulary draws on the restrained color relationships associated with Swiss graphic design: two principal neutrals and a selected accent. IPAX turns that design vocabulary into a reusable composition grammar.

#### Why "Ink" and "Paper"?

When naming the roles, I wanted terms that wouldn't clash with `text` and `surface`, already widely used in Design Systems.

I ended up borrowing them from the ZX Spectrum, my first color computer. Its BASIC language let you define foreground and background colors with commands such as `INK 0: PAPER 7` (black on white) or `INK 6: PAPER 1` (yellow on blue).

Decades later, those same two words turned out to be a useful way to describe color roles independently of any particular theme.


### eXtended colors: expanding the palette without expanding the audit

Ink and Paper don't have to be black and white. In fact, IPAX generally favors less extreme colors for everyday reading.

For example, a light theme might use `#2B2B2B` for Ink and `#EDEDED` for Paper. That leaves two additional ranges: colors darker than Ink (`ink-x`) and colors lighter than Paper (`paper-x`).

In practice, these are often black (`#000000`) and white (`#FFFFFF`). IPAX keeps them configurable to avoid imposing unnecessary restrictions.

The useful property is that **extended colors don't need to multiply the number of contrast checks**.

Suppose an accent passes the required contrast threshold against Paper. Any `paper-x` color with greater luminance will also pass the same WCAG contrast threshold against that accent. The same reasoning applies to `ink-x` colors darker than Ink.

This lets a Design System use extended colors for additional surfaces and *deep* variants without testing every possible combination individually.

The distinction matters: **this is a property of luminance-based contrast, not a guarantee of ergonomic comfort**. APCA and IPAX's ergonomic adjustments may respond differently to changes in background luminance, polarity, or other factors.

Extended colors therefore reduce the number of necessary WCAG contrast checks, while combinations that require broader perceptual or ergonomic guarantees may still need evaluation.




### 4.1 The six basic pair contexts

Given Ink (I), Paper (P), and Accent (A), the six directed combinations between different roles are:

- Ink on Paper; Paper on Ink.
- Accent on Paper; Paper on Accent.
- Accent on Ink; Ink on Accent.

Direction matters: foreground and background are not necessarily interchangeable for perceptual evaluation, particularly when APCA is involved.

These are the basic **role contexts**, not a claim that every resulting combination is automatically suitable for every text size, weight, or use.


### 4.2 Contextual accent variants

A single static accent color cannot be assumed to work equally well as foreground and background across Light and Dark themes.

In August 2025, I explored this problem while redesigning my professional website [bustelo.com.ar](https://bustelo.com.ar/), adapting the visual language of the Swiss School of Graphic Design (with its use of black, white, and a single accent color), to current accessibility requirements.

Under WCAG 2, I found that 292,107 colors (1.74% of the RGB color space) achieve at least 4.5:1 contrast against both pure white and pure black. I called this intersection the *Tricontrast color space*.

Instead of choosing a conventional accent such as red, I selected `#C100FA` for its strong chromatic contrast and its position in the purple region. Unlike colors corresponding to individual wavelengths of visible light (such as red, yellow, green, cyan, or blue), purple is a non-spectral color produced by the human visual system. I found this a fitting metaphor for UX's focus on human factors.

The website also provided design settings that let visitors switch between Light and Dark modes and choose an accent color from the Tricontrast space, including some presets.

While this approach satisfies WCAG 2 AA contrast requirements for both color pairings, APCA and IPAX expose its limitations. `#C100FA` achieves WCAG 2 AA against both white (4.51:1) and black (4.64:1), but IPAX 0.1.21 assigns both combinations a score of 2 instead of 3, accounting for perceptual and ergonomic factors that WCAG 2 does not evaluate.

IPAX therefore contextualizes the accent into a four-position role sequence:

1. **ink**
2. **accent-i**: accent that can be used as _ink_ (against Paper)
3. **accent-p**: accent used as _paper_ (against Ink)
4. **paper**

IPAX also preserves an independent **accent** token for cases where the color only needs to work against a single, fixed counterpart. For example, primary buttons can retain the same brand color and text color across Light and Dark themes (e.g., white text on a deep purple background). This allows organizations to preserve their exact brand colors without compromising the accessibility of the rest of the system.

These are **semantic positions**, not universally fixed luminance values. Their concrete colors depend on the theme and must be evaluated in their intended contexts.



### 4.3 Additional Accent Roles

The system can define additional *accent roles*, including semantic groups and specialized roles such as links or muted content.

In IPAX, every accent role is defined as a pair of contextual colors: one that works against Paper and another that works against Ink, rather than as a single standalone color.


## 5. Beyond this spec

The IPAX architecture described here represents the part of the system I consider stable, following more than a year of research, development, and application in real-world projects.

Every organization, brand, and Design System presents different requirements. This specification establishes the foundations, not a universal implementation.

There is much more to IPAX than what is documented here. If you find these ideas useful, interesting, or inspiring, I'm available for consulting, collaboration, and the development of tools tailored to your project's needs.

[Get in touch](https://www.kambrica.com/en/home/#contacto/)



---

*IPAX Scoring System v0.1.21 • 2026-10-27, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data).*