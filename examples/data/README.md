# IPAX Data Directory (Examples Stub)

To make the `examples/` directory standalone and portable, you can replace or populate this stub directory with a **symlink** or a **direct copy** of the primary `data/` distribution directory located at the project root (`../../data`).

## Resolution Fallback

When examples run without a local `examples/data/` copy, the dynamic path resolver (`path-resolver.js`) automatically traverses upward to locate and load the dictionary JSON files from the root repository levels (`../data/` or `../../data/`).

---

_IPAX Scoring System v0.1.20 • 2026-10-22, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data)._