# Origins

IPAX is the result of more than a year of standalone research in color, accessibility, design systems and design quality, as well as the models and frameworks needed to build and iterate every piece, with several parallel lines that later converged.

## The Tricontrast line

**August 2025** — Original investigation into what I called the _Tricontrast color space_: accessible design systems built on just 3 tokens (white, black, accent), where
the accent holds a 4.5:1 contrast ratio simultaneously against pure white and pure black. This research produced two distinct outcomes:

1. The design now running live on bustelo.com.ar, using 3 colors (paper/ink/accent), light and dark modes, and a user-selectable accent. It started as a curated set of accent options; later, learnings from building IPAX fed back into it, so the accent can now also be defined as a calculated _Tricontrast_ color.
2. The idea of how to develop Tricontrast as a tool, whicih became the theoretical foundation of IPAX.

**[Tricontrast Lab](https://www.bustelo.com.ar/apps/tricontrast/)** — A separate web app built on top of the same Tricontrast research: load an image, remap its colors to define what cuts to white, what cuts to black, and what maps to an accessible accent. It reached a published, stable version at **TcL1.3890**.
Around mid-September, 2025, this prototype helped to build a long-term vision: treating colors as manipulable objects themselves, instead of attributes of shapes or images.

## The framework line

In order to make further development possible while iterating the model foundations, I need to develop a new framework.
That became **j0**, on which the current IPAX Design Lab is built on.
I did several experiments to stress out j0's architecture, as well as iterating the IPAX CSS architecture.
That spanned [FlowStyler](https://flowstyler.com/), technically the first word processor for Unicode styles, sporting a multi-language UI and CMS.


## The k0 line (Kambrica Zero)

Separate from both of the above: **k0**, the grammatical base for Kambrica's projects, is the line of research into a universal accessible design-system grammar that ended being the IPAX system. It started from the initial 3 Tricontrast tokens, arranged into 6 contextual combinations following Swiss design-school conventions, then moved into APCA and OKLCH.

* **September 13, 2025 (k0 1.4.06)** — First stable prototype.
* **January 10, 2026** — First prototype combining Ink/Accent/Paper into 6 combinations.
* **January 12, 2026 (k0 1.4.30 / k0 1.4.32)** — First prototypes defining luminance zones: 7 zones from ultra-paper to ultra-ink, then opening accent into paperx/paper accent↓/accent/accent↑/ink/inkx.
* **January 24, 2026 (k0 1.4.64)** — First version where colors positioned on the luminance topology could be moved to adjust luminance directly (RGB model, pre-OKLCH).
* **January 29 – March 11, 2026 (k0 1.5.02)** — First version with bounds comparing pairwise contrast, WCAG and APCA calculations, across 9 tokens (Paperx, Paper, Accent-1-pp, Accent-1-p, Accent-1, Accent-1-i, Accent-1-ii, Ink, Inkx).
* **March 25, 2026 (k0-1.6)** — Stress-tested against real cases; last version built on the K0 model.

Today the grammar is down to essentially 4 tokens: accent can equal accent-p, and paperx/inkx can safely be supposed to equal white and black, and no longer counted separately.


## Where the IPAX score comes from

Working across these systems, WCAG's AA/AAA labeling and APCA's Lc values turned out to be illegible once displayed at high information density (dense color-system graphics, many pairs at once). That pushed toward a single score, that after iterating many options, I settled on X/1-to-5. Investigating that scale surfaced a deeper problem: both WCAG and APCA reward genuinely terrible combinations (e.g. #000 on #0f0) as passing. That gap is where ergonomics entered as the missing piece, ergonomics being what turns IPAX from an accessibility checker into a design-quality measure, accessibility being only the foundation it stands on.

The thread underneath all of this: updating Swiss School design principles to modern design-quality standards, starting from accessibility.


## First official release

**July 2, 2026** — First stable IPAX engine presented at Rosenverse (Rosenfeld Media). This is where the versioned history in `CHANGELOG.md` begins as **v0.1.0**.


## JSOL

**August 2026** — JSOL was born directly out of IPAX's own needs: porting the color math so it produces guaranteed-identical results across every language IPAX could run in, verified through JSOL's own contract system.

That’s a limitation APCA has (as sept. 19, 2026) being published only in JavaScript with a restrictive license to prevent math drift. Looking for a way to overcome this limitation and finding only over engineered solutions unsuitable for a lightweight pipeline, I decided to build my own.
