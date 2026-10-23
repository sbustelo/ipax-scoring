# IPAX Distribution Core Directory (Examples Stub)

To make the `examples/` directory standalone and portable, you can replace or populate this stub directory with a **symlink** or a **direct copy** of the primary `dist-js/` core distribution directory located at the project root (`../../dist-js`).

## Resolution Fallback

When examples run without a local `examples/dist-js/` copy, the dynamic path resolver (`path-resolver.js`) automatically traverses upward to locate and import the core JavaScript engine modules from the root repository levels (`../dist-js/` or `../../dist-js/`).

---

_IPAX Scoring System v0.1.20 • 2026-10-22, [Santiago Bustelo](https://www.bustelo.com.ar/). [Apache-2.0](../LICENSE) (code), [CC BY 4.0](../LICENSE) (literature and data)._