// themes-data/nvda.js — the durable "theme record" for NVDA's Notes / Watch List.
// A flat array of tracked analytical threads, each with per-quarter updates drawn from the
// earnings calls (docs/calls/NVDA.md). `seg` is the prose segment label (mapped to a dataset
// key by THEME_SEG in segments.js if the segments engine is wired). st.k = 'watch' (open
// question) | 'trend' (confirmed direction). Newest updates first. Verbatim/observed only —
// no invented management quotes.
//
// It lives in its own file (like themes-data/amzn.js) because the overview module imports the
// Supabase CDN chain; keeping the theme data here avoids that coupling.

export var NVDA_THEMES = [
  {
    seg: 'Data Center', theme: 'The new segment framework (Hyperscale / ACIE)',
    st: { k: 'watch', since: 'Q1 2027', last: 'Q1 2027' },
    why: 'In Q1 FY2027 NVIDIA re-cut Data Center into Hyperscale and ACIE (AI clouds, industrial, enterprise). Watch whether ACIE — the more fragmented, higher-growth cut Jensen expects to lead long-term — keeps outpacing Hyperscale.',
    updates: [
      { q: 'Q1 2027', items: [
        'New framework introduced: Data Center (Hyperscale + ACIE) and Edge Computing; nine quarters of recast history posted.',
        'Hyperscale $38B (~50% of DC, +12% QoQ); ACIE $37B (+31% QoQ, AI-cloud revenue >3x YoY).',
        'Jensen: "we should be growing faster than hyperscale CapEx" — expects the second (ACIE) category to grow faster long-term.'
      ] }
    ]
  },
  {
    seg: 'Data Center', theme: 'Networking as the fastest-growing line',
    st: { k: 'trend', since: 'Q3 2026', last: 'Q1 2027' },
    why: 'Networking (NVLink, InfiniBand, Spectrum-X) has accelerated every quarter and is now, by NVIDIA’s claim, the largest networking business in the world — central to the "sell the whole rack" thesis.',
    updates: [
      { q: 'Q1 2027', items: ['DC networking $15B, nearly tripled YoY; Spectrum-X "larger than all ethernet network peers combined"; InfiniBand >4x YoY.'] },
      { q: 'Q4 2026', items: ['Networking $11B (+>3.5x YoY); FY2026 networking >$31B (>10x vs FY2021, the year Mellanox was acquired).'] },
      { q: 'Q3 2026', items: ['Networking $8.2B (+162% YoY).'] }
    ]
  },
  {
    seg: 'Data Center', theme: 'China / export controls (H20 → H200)',
    st: { k: 'watch', since: 'Q1 2026', last: 'Q1 2027' },
    why: 'Export controls removed China Data Center compute from the model. Guidance assumes zero China DC compute; any reopening is upside not in the numbers. TAM NVIDIA cannot serve estimated ~$50B.',
    updates: [
      { q: 'Q1 2027', items: ['H200 China licenses approved but zero revenue generated; uncertain any imports allowed. No China DC compute in the outlook.'] },
      { q: 'Q2 2026', items: ['$650M H20 sold to an unrestricted non-China customer; $2-5B China shippable in Q3 if geopolitics resolve (USG floated a 15% cut).'] },
      { q: 'Q1 2026', items: ['$4.5B H20 charge (inventory + purchase obligations) after the April-9 export ban; $2.5B unshippable; China TAM ~$50B "effectively closed."'] }
    ]
  },
  {
    seg: 'Data Center', theme: 'Vera Rubin ramp & the annual cadence',
    st: { k: 'watch', since: 'Q3 2026', last: 'Q1 2027' },
    why: 'The next platform after Blackwell. NVIDIA holds a $1T Blackwell+Rubin revenue view through calendar 2027 and an annual product cadence. Watch the H2-2026 ramp slope and whether it matches Blackwell’s.',
    updates: [
      { q: 'Q1 2027', items: ['Vera Rubin production shipments start H2 (Q3), ramping Q4; up to 35x higher inference throughput vs Blackwell. $1T Blackwell+Rubin revenue foreseen 2025→CY2027.'] },
      { q: 'Q4 2026', items: ['Rubin unveiled at CES (6 chips); first Vera Rubin samples shipped; production H2.'] },
      { q: 'Q3 2026', items: ['$500B Blackwell+Rubin visibility (start of year → end CY2026); Rubin silicon back from partners.'] }
    ]
  },
  {
    seg: 'Data Center', theme: 'Vera CPU — a new $200B TAM',
    st: { k: 'watch', since: 'Q1 2027', last: 'Q1 2027' },
    why: 'Standalone Vera CPU (agentic-AI CPU) is a market NVIDIA has never addressed. Watch whether the ~$20B visibility this year converts and whether it becomes the largest source of upside above the $1T Blackwell+Rubin view.',
    updates: [
      { q: 'Q1 2027', items: ['Jensen: "$20 billion is for a standalone CPU"; Vera opens "a brand-new $200 billion TAM"; ~$20B total CPU revenue visibility this year across four Vera use cases.'] }
    ]
  },
  {
    seg: 'Edge Computing', theme: 'Physical AI (robotics, automotive)',
    st: { k: 'trend', since: 'Q4 2026', last: 'Q1 2027' },
    why: 'Edge Computing = on-device agentic & physical AI. Physical AI (robotics, AV) is framed as the next leg after agentic; watch the trailing-12-month physical-AI revenue and auto/robotics design wins.',
    updates: [
      { q: 'Q1 2027', items: ['Physical AI >$9B trailing-12-month revenue; Uber partnership to power a Robotaxi fleet across ~30 cities / four continents by 2028.'] },
      { q: 'Q4 2026', items: ['Physical AI >$6B FY2026 revenue; robotaxi fleets (Waymo, Tesla, Uber, WeRide, Zoox).'] }
    ]
  },
  {
    seg: 'Company', theme: 'Gross-margin sustainability (mid-70s)',
    st: { k: 'watch', since: 'Q3 2026', last: 'Q1 2027' },
    why: 'Management commits to holding gross margins in the mid-70s despite rising input (memory) costs. Jensen ties it to delivering generational performance-per-watt leaps. Watch the Blackwell→Rubin transition and memory pricing.',
    updates: [
      { q: 'Q1 2027', items: ['GAAP GM 74.9% / non-GAAP 75%, flat sequentially; full-year guided mid-70s.'] },
      { q: 'Q4 2026', items: ['Jensen: "The single most important lever of our gross margins is actually delivering generational leaps to our customers."'] },
      { q: 'Q3 2026', items: ['GM guided mid-70s for FY2027 despite rising input costs.'] }
    ]
  },
  {
    seg: 'Company', theme: 'Capital return (dividend + buyback)',
    st: { k: 'trend', since: 'Q1 2027', last: 'Q1 2027' },
    why: 'Capital return stepped up materially in Q1 FY2027. Watch the ~50%-of-FCF return commitment against a rising FCF base.',
    updates: [
      { q: 'Q1 2027', items: ['Dividend raised $0.01→$0.25 (Jensen corrected the $0.20 print live); +$80B buyback authorization (on top of $39B remaining); plan to return ~50% of FCF this year; record $49B FCF.'] }
    ]
  }
];
