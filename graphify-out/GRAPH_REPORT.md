# Graph Report - c:\Users\Regondi Calidad\Desktop\QM\ClimaTrack  (2026-11-17)

## Corpus Check
- Corpus is ~16,755 words - fits in a single context window. You may not need a graph.

## Summary
- 142 nodes · 293 edges · 10 communities (8 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7

## God Nodes (most connected - your core abstractions)
1. `ClimaTrackApp` - 31 edges
2. `ClimaTrackCacheService` - 14 edges
3. `keywords` - 13 edges
4. `GasRefrigerantEngine` - 9 edges
5. `Formatters` - 7 edges
6. `Sanitizer` - 7 edges
7. `setStorageItem()` - 6 edges
8. `safeReadArray()` - 6 edges
9. `ServiceOrderService` - 6 edges
10. `CryptoSeal` - 6 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (10 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.15
Nodes (4): ClimaTrackApp, ExportService, Formatters, Sanitizer

### Community 1 - "Community 1"
Cohesion: 0.13
Nodes (10): CompressorHealthScoring, REFRIGERANT_CATALOG, SLA_TIERS, SlaEmergencyDispatcher, DualCurrencyContractService, WhatsAppClimaNotifierService, contractSample, emergencyTicket (+2 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (24): author, description, keywords, license, main, name, scripts, security:full (+16 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (6): GasRefrigerantEngine, ServiceOrderService, CryptoSeal, deepSort(), K_CONSTANTS, toUtf8BinaryString()

### Community 4 - "Community 4"
Cohesion: 0.20
Nodes (6): ClimaTrackCacheService, getStorageItem(), memoryStore, removeStorageItem(), safeReadArray(), setStorageItem()

### Community 5 - "Community 5"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

## Knowledge Gaps
- **39 isolated node(s):** `name`, `short_name`, `description`, `start_url`, `display` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ClimaTrackApp` connect `Community 0` to `Community 1`, `Community 3`, `Community 4`?**
  _High betweenness centrality (0.159) - this node is a cross-community bridge._
- **Why does `ClimaTrackCacheService` connect `Community 4` to `Community 1`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `GasRefrigerantEngine` connect `Community 3` to `Community 1`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `name`, `short_name`, `description` to the rest of the system?**
  _39 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.13105413105413105 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._