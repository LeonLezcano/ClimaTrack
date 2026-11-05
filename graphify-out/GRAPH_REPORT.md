# Graph Report - .  (2026-11-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 109 nodes · 209 edges · 13 communities (6 shown, 7 thin omitted)
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
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12

## God Nodes (most connected - your core abstractions)
1. `ClimaTrackApp` - 19 edges
2. `keywords` - 13 edges
3. `GasRefrigerantEngine` - 9 edges
4. `ClimaTrackCacheService` - 8 edges
5. `Formatters` - 7 edges
6. `Sanitizer` - 7 edges
7. `ServiceOrderService` - 6 edges
8. `CryptoSeal` - 6 edges
9. `CompressorHealthScoring` - 5 edges
10. `SlaEmergencyDispatcher` - 5 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Import Cycles
- None detected.

## Communities (13 total, 7 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.24
Nodes (3): ClimaTrackApp, Formatters, Sanitizer

### Community 1 - "Community 1"
Cohesion: 0.22
Nodes (6): REFRIGERANT_CATALOG, ServiceOrderService, CryptoSeal, deepSort(), K_CONSTANTS, toUtf8BinaryString()

### Community 2 - "Community 2"
Cohesion: 0.15
Nodes (13): keywords, energia-solar, epod, frio-industrial, grupos-electrogenos, hvac, r134a, r404a (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.17
Nodes (11): author, description, license, main, name, scripts, security:full, test (+3 more)

### Community 4 - "Community 4"
Cohesion: 0.29
Nodes (5): ClimaTrackCacheService, getStorageItem(), memoryStore, removeStorageItem(), setStorageItem()

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (4): contractSample, emergencyTicket, sampleOrder, sealedOrder

## Knowledge Gaps
- **29 isolated node(s):** `name`, `version`, `description`, `type`, `main` (+24 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `ClimaTrackApp` connect `Community 0` to `Community 8`, `Community 5`, `Community 7`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `ClimaTrackCacheService` connect `Community 4` to `Community 6`, `Community 7`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Why does `GasRefrigerantEngine` connect `Community 5` to `Community 1`, `Community 6`, `Community 7`?**
  _High betweenness centrality (0.050) - this node is a cross-community bridge._
- **What connects `name`, `version`, `description` to the rest of the system?**
  _29 weakly-connected nodes found - possible documentation gaps or missing edges._