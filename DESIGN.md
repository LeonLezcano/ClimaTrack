# ClimaTrack - Design System & Visual Direction

> **Mode:** `Operate` (Industrial Cold-Chain, HVAC & Backup Power Operations Console)
> **Dial:** `ENERGY 4 / RHYTHM 4 / MOTION 2`

---

## 1. Competitive Benchmarking & Product Scene

ClimaTrack operates in mechanical rooms, refrigeration racks, sub-zero cold storage loading docks (-18 C to 4 C), and 24/7 dispatch desks. Interface choices are anchored to three sector benchmarks:

1. **ServiceTitan (Field Dispatch & Technical Work Orders):** High-density tabular work orders, unambiguous action hierarchy, large mobile tap targets for gloved field technicians.
2. **Sensitech ColdStream (Cold-Chain Excursion & SLA Telemetry):** Restrained dark slate instrument canvas that reduces glare in dim machine rooms and surfaces temperature/SLA threshold breaches immediately without neon noise.
3. **Emerson Copeland / Danfoss Coolselector (Thermodynamic Diagnostics):** Tabular monospace numerals (`tabular-nums`) for gauge pressure (PSI), line temperatures (C), superheat, subcooling, and compressor amperage (A).

---

## 2. Color Palette Tokens

Single dark instrumental theme calibrated for WCAG 2.1 AA contrast (`>= 4.5:1` normal text, `>= 3:1` large text and UI boundaries).

### Neutral Surfaces (3 Tiers + Hairline Borders)
| Token | Hex | Role |
|---|---|---|
| `--ct-bg-canvas` | `#080f1d` | Application background canvas |
| `--ct-bg-chrome` | `#0c1629` | Top header, desktop sidebar, mobile bottom nav |
| `--ct-bg-panel` | `#0f1b30` | Primary cards, tables, calculator, and modal dialogs |
| `--ct-bg-inset` | `#091224` | Form inputs, selects, and textareas |
| `--ct-border-hairline` | `#1e3256` | Card outlines, section dividers, and table hairlines |

### Ink & Typography Hierarchy
| Token | Hex | Contrast on `#0f1b30` | Role |
|---|---|---|---|
| `--ct-ink-primary` | `#f0f6ff` | ~15.4:1 | Headings, key metrics, primary values |
| `--ct-ink-secondary` | `#c5d7ed` | ~10.8:1 | Body copy, table cells, navigation labels |
| `--ct-ink-muted` | `#94add1` | ~6.8:1 | Field labels, timestamps, metadata, empty states |

### Core Actions & Semantic Status
| Role | Surface / Fill | Foreground | Contrast | Usage |
|---|---|---|---|---|
| Primary Action (Sky Deep) | `#0369a1` (hover `#075985`) | `#ffffff` | ~5.9:1 | New Service Order, New Dual-Currency Contract, Save actions |
| Telemetry Highlight | `#0b2436` | `#38bdf8` | ~8.2:1 | Active diagnostic values, order tags, focus rings |
| Critical Cold-Chain SLA | `#be123c` (hover `#9f1239`) | `#ffffff` | ~6.4:1 | Dispatch Emergency 24/7, breached SLA actions |
| Verified / ePOD Sealed | `#047857` (hover `#065f46`) | `#ffffff` | ~5.5:1 | Confirm Arrival & Seal SHA-256, online status, ATS pass |
| Preventive / Offline Alert | `#291f0b` | `#fbbf24` | ~9.1:1 | Compressor degradation warnings, offline local-cache state |

---

## 3. Typography & Hierarchy

External font CDNs are intentionally omitted to guarantee 100% offline-first rendering under strict CSP (`font-src 'self' data:`).

- **UI Sans:** `'IBM Plex Sans', 'Segoe UI', system-ui, -apple-system, sans-serif`
- **Tabular Telemetry Mono:** `'IBM Plex Mono', 'Cascadia Mono', 'Consolas', ui-monospace, monospace` (strictly for PSI, C, A, ARS/USD amounts, IDs, and SHA-256 digests; `font-variant-numeric: tabular-nums`)

### Scale (Strict Descending Hierarchy, Ratio >= 1.25x)
- `h1` (Active view title): `1.75rem` (28px), `line-height: 2.15rem`, `font-weight: 800`, `letter-spacing: -0.02em`
- `h2` (Section / panel heading): `1.25rem` (20px), `line-height: 1.75rem`, `font-weight: 700`
- `h3` (Card / dialog heading): `1rem` (16px), `line-height: 1.5rem`, `font-weight: 700`
- `body` (Standard UI text): `0.875rem` (14px), `line-height: 1.35rem`, `font-weight: 400`
- `caption / badge / metadata`: `0.75rem` (12px minimum; no sub-12px functional text)

---

## 4. Layout Rhythm, Surface Rules & Accessibility

- **Flat Surface Architecture:** Cards use single-level `1px` hairline borders (`#1e3256`) and internal horizontal dividers (`border-t border-[#1e3256] pt-3`). Nested bordered cards and decorative left/right accent stripes (`border-l-4`) are prohibited.
- **Iconography:** Uniform-stroke (`1.75px`) inline SVG icons with `aria-hidden="true"`. Decorative Unicode emojis are prohibited in UI chrome.
- **Mobile-First Field Ergonomics:** Pinch-zoom enabled (`width=device-width, initial-scale=1.0`), `>= 44x44px` `.touch-target` controls across mobile bottom tabs, card actions, and modal close buttons, responsive `grid-cols-1 sm:grid-cols-2` forms, and `col-span-full` empty states.
- **Keyboard & Screen Reader Semantics:** Explicit `<label for="...">` bindings, `role="tablist"` / `role="tab"` / `aria-selected` / `role="tabpanel"`, `role="dialog" aria-modal="true"` modals with `Escape` closing and focus restoration, and high-contrast `2px solid #38bdf8` `:focus-visible` outlines.
- **Motion & Print:** Zero infinite pulse/bounce animations; full `@media (prefers-reduced-motion: reduce)` reset; `@media print` switches canvas to `#ffffff` with `#0f172a` ink and hides `.no-print` navigation.
- **Truthful Telemetry & Demo Isolation:** Seeded facilities are explicitly tagged `[DEMO]` and persisted via `ClimaTrackCacheService` with user-controlled demo purge (`climatrack_demo_purged`). Network status reflects `navigator.onLine` live events.
