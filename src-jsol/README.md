# src-jsol/

This directory will hold the JSOL source for the rewrite of the IPAX core scoring pipeline (see the Roadmap section of `../docs/CHANGELOG.md`). It is currently empty; the core engine lives in `dist-js/` while the JSOL rewrite is in progress.

## What is JSOL?

JSOL (JavaScript Source Of Logic) is a _single source of truth for business logic_.

Its goal is to be able to define and test business logic once, and compile it across different codebases with exactly the same results. It's a deliberately simple, strict subset of syntax with standard functions designed to remove ambiguity between languages, and contracts that verify the compiled code produces bit-for-bit identical results on every target.

JSOL was built so IPAX's core math (color space conversion, contrast scoring, ergonomic penalty accumulation) can run identically wherever IPAX is embedded, regardless of host language.

- Documentation and interactive REPL: https://jsol.bustelo.com.ar/
- Compiler and language repo: https://github.com/sbustelo/JSOL