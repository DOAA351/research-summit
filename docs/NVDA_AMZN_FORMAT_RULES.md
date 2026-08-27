# NVDA rebuild — AMZN format rules (per section)

The rule for the NVDA rebuild: **replicate AMZN's actual format exactly**, using the same shared
engines/builders AMZN uses, populated with NVDA data. Reusing the old NVDA content was the mistake.
All CSS is global (css/overview.css, css/results.css) — no CSS authoring needed.

## OVERVIEW — standardized 7 blocks (amzn.js stdOverviewBody 545-591)
Fixed order, NOT the old NVDA boxes:
1. `stdKeyFacts()` — 10-cell 5×2 grid (STD_FACTS); market-cap cell is `#…Mc` live.
2. lede paragraph (one tight `.ov-lede`).
3. `stdFourQuad()` — 2×2 (What sells · Who buys · How earns · The edge), ≤30 words/cell, never collapsed.
4. collapsible **How it makes money** — `stdMoneyMap()` (segment⇄geo toggle, ≥2 slices).
5. collapsible **Products** — `stdProducts()` (family card → pop-up).
6. collapsible **Competitors** — `stdPeerScatter('ov')` (SVG scatter; X=multiple, Y=growth, size=live mcap).
7. collapsible **Timeline** — `stdTimeline()` (genesis-first).
NO margins block in Overview. Helpers to port: stdKeyFacts/stdFourQuad/stdMoneyMap/stdProducts/stdPeerScatter/stdTimeline/collapsible/stdOverviewBody + data STD_FACTS/STD_BIZ/GMM_SEG/GMM_GEO/A_PRODUCTS/TIMELINE/A_PEERS.

## DEEP DIVE spine (5 tabs; Miscellaneous OMITTED for NVDA)

### TOP LINE — sub-tabs General·Segments·Other·Customers (data-ovst segov/segdrv/segoth/segcus)
- Rendered 100% by the SHARED engine js/segments.js — NO engine changes. AMZN just imports 4 builders (segmentsOverviewHtml/segmentsHtml/segmentsOtherHtml/segmentsCustomersHtml + inits) and calls with 'AMZN'.
- General = segment size/growth cards + stacked revenue chart (amount/share/growth) + interactions.
- Segments = one segment at a time: filing def + OURS note + **segment top-line via the RESULTS engine** (registerResultsData) + products master-detail + KPIs + interactions + management quotes (from themes-data).
- Other = alternative cuts (old framework, GAAP cut) — "never additive".
- Customers = classes + named-on-call + SPLC census.
- REPLICATE: create js/segments-data/nvda.js (mirror amznSegments), add per-segment metrics to results-data/nvda.js for drivers.rev={from:'results:<key>'} pointers (OMIT opinc — NVDA doesn't report segment OI), register in segments.js (SEGMENTS_DATA/THEME_SEG/THEME_SRC), wire 4 sub-tabs in nvda.js. Both frameworks: recast as segments[], old as other[]. DON'T ship empty (UBER trap): tenK/products/kpis/interactions/drivers.rev all populated; summit:{} only where genuinely unprojected.

### BOTTOM LINE — sub-tabs General·Segments·Supply Chain (data-ovst margins/segments/supplychain)
- CHART-HEAVY. Built on the ported atomic chart engine (amzn.js 2945-3131: _aCharts, aStdScaffold/aStdRender/aStdWire, rsAttachBrush, aTbl, aBuildAutoTbl, aCollap, aZoom + ASTD_* consts + acxRGBA).
- General = a chart-picker (aGeneralPicker) showing ONE of: **margins** (dual-axis $B bars + margin-% lines, metric dropdown, mode pills, range presets, slider, table) · **bridge** (waterfall rev→costs→op income) · **net** (waterfall OI→interest→tax→NI) · **SBC** (dual-axis bars+lines dilution / by-line). THEN a collapsed **expense deep-dives** section (expenseTabsBody + EW_LINES): per expense line = KPI tiles + verbatim 10-K definition + composition boxes + share-of-rev sparkline + drivers + verbatim {q,who,txt} call timeline (ewBase).
- Segments = SAB charts (segfc dual-axis OI/EBITDA by segment, segoi revenue-vs-profit mix, seg bridge).
- Supply Chain = KPI grid + dependency cards (A_SPLC_INFRA) + table (A_SPLC_RETAIL) + dependency bars (A_SPLC_DEP) + Chart.js geo bar (A_SPLC_GEO).
- REPLICATE for NVDA: expense lines = Cost of revenue, R&D, SG&A (+ SBC by line); supply chain = TSMC/CoWoS, HBM (SK hynix/Samsung/Micron), Foxconn/Wistron/Quanta, Amkor (upstream) + hyperscaler customers (downstream, concentration) + Taiwan-heavy geo. 10-K defs verbatim from NVDA FY2026 10-K; commentary verbatim from docs/calls/NVDA.md (NEVER web search).

### EVOLUTION — sub-tabs Earnings·Results·Estimates  ✅ Results/Estimates ALREADY correct (results.js engine)
- Results = resultsHtml('NVDA'); Estimates = resultsEvoHtml('NVDA'). DONE, format-identical to AMZN.
- Earnings = Setup (resultsHtml('NVDA_SETUP')) + Post-Results + Notes/Watch List (per EARNINGS_CONVENTIONS). Currently Setup + consensus; align phases later.

### VALUATION — sub-tabs Historic Multiple·Peers·Target Multiple/PEG·Sensitivity Analysis
- data-ovst: histmult · peers · targetmult · sensitivity. NO "Calculator" sub-tab (AMZN has none — DROP mine).
- Historic Multiple = dense daily P/E & EV/EBITDA lines, dual right axes, avg tag + current badge, range slider, table (nvda-histmult.js ✓).
- Peers = inline SVG bubble scatter (stdPeerScatter('dd')) — X=multiple, Y=growth, size=live mcap, add/remove tickers, comps table excluding self. MISSING in NVDA — must add (peers = AMD/AVGO/INTC/QCOM, hl:true on NVDA).
- Target Multiple/PEG = revision-log chart + PEG (nvda-target-multiple.js ✓).
- Sensitivity = 5×5 implied-price grid over 2 drivers (nvda-sensitivity.js ✓, consolidated rev-growth×gross-margin).
- REPLICATE: drop calc; add Peers via ported stdPeerScatter + N_PEERS; align keys target→targetmult, sens→sensitivity (+ update selectors in the twins).

### MANAGEMENT — sub-tabs Executives & Board·Ownership·Governance & SBC·Track Record (team/ownership/governance/track)
- Executives & Board = shared makeManagement() mold (management.js): lede + exec card grid (CV modal) + board grid (independent/insider tags) + governance tiles.
- Ownership = lede + KPI tiles + ewBoxes(Founder/Institutions) + capital-return note + `<div id="dd-mgmt-slot">` (Fiscal.ai live table auto-filled by companies.js). Keep NVDA's live-price ownTable() nested too.
- Governance & SBC = tiles + 4 ewBoxes + SBC narrative note (NO canvas — points to Bottom Line ▸ General).
- Track Record = color legend + 2-col rating-colored cards (data-detail="exec:id") → modal.
- REPLICATE: NVDA_MGMT=makeManagement({brand, lede, execs[6 leaders], board[13 dirs], gov, foot}); nvdaOwnBody/nvdaGovBody/nvdaTrackBody (port amznOwnBody/GovBody/TrackBody); port ewBoxes+.ew-kpis/.ew-tile CSS; add modal skeleton + wireModal; wire sub-tabs.

## Shared foundation to port ONCE (into nvda.js or a shared module)
chart engine 2945-3131 + acxRGBA + ASTD_* ; scatter machinery stdPeerScatter/A_SC/aScRenderOne/aScTableOne/aScChipsOne/wireScatters/wireScChips/aLiveOne/aScFetchCaps ; expense pattern EW_CSS/ewBase/ewBoxes/ewSpark/ewCallsBlock/ewCallTimeline/expenseTabsBody ; aCollap/aTbl/wireModal + ov-modal-back skeleton.
