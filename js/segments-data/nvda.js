// segments-data/nvda.js — the Segments tab dataset for NVIDIA (NVDA).
// Mirrors segments-data/amzn.js exactly in shape; contract in docs/SEGMENTS_CONVENTIONS.md.
//
// A BRIDGE is a target plus terms whose product equals it — the one shape that covers
// "revenue = subscribers x ARPU" and AWS's "revenue = capacity x revenue per $ of capacity".
// NVIDIA discloses NO capacity, no unit count, no ASP and no operating income by market
// platform, so there is no product identity to build a bridge on at the segment level: the
// `bridges` arrays are intentionally empty and the identities live in `interactions` as
// bridge:null (NOT CHARTED), quoting management's own $/GW framing instead of inventing terms.
//
// Drivers marked `from: results:<key>` are POINTERS into js/results-data/nvda.js — segment
// revenue keeps exactly one home there and is never copied here. NVIDIA reports revenue by
// market platform but NOT operating income by platform, so drivers.opinc is OMITTED (pointing
// at a non-existent results key would blank section 1).
//
// Series are period-keyed, `act` and `summit` separately, on the dataset axis. Reported periods
// carry no `summit` value. Forward per-segment figures are Bloomberg consensus by segment, held
// in the Results dataset's `cons` column, not here.
//
// Fiscal note: NVDA's fiscal year ends late January; "1Q26" = the quarter ended ~Apr 2025
// (Q1 FY2026). The dataset axis uses the same fiscal labels as the Results dataset.

export var nvdaSegments = {
  updated: 'Aug 2026',
  source: 'Segment revenue is read from the Results dataset: reported actuals from NVIDIA\'s recast "Revenue by Market Platform" table (Q1 FY2027 CFO commentary, nine quarters recast) and the FY2026 10-K; forward per-segment figures are Bloomberg consensus by segment. NVIDIA does not report operating income, PP&E or capex by market platform, so no segment profitability or capacity series exists to reconcile against — the bridges the AWS/retail datasets carry cannot be built here. Sub-line figures (Data Center networking; the old Gaming/Pro Viz/Auto/OEM split; the GAAP Compute & Networking / Graphics cut) are NVIDIA-reported, assembled from the earnings calls (docs/calls/NVDA.md) and the 10-K. Verbatim management commentary is from the same calls.',
  axis: { q: ['1Q26', '2Q26', '3Q26', '4Q26', '1Q27', '2Q27', '3Q27', '4Q27', '1Q28'], y: ['2022', '2023', '2024', '2025', '2026', '2027', '2028', '2029'] },
  shared: {
    // Data Center networking (NVLink / InfiniBand / Spectrum-X) — stated on the calls, not split
    // out in the segment note. Quarterly figures are management's rounded call figures; FY2026 is
    // the ">$31B" full-year figure. The clearest disclosed sub-line inside Data Center.
    dc_networking: { label: 'Data Center networking', short: 'Networking', unit: 'usdM', src: 'Earnings calls (NVLink / InfiniBand / Spectrum-X, rounded)', scope: 'segment',
      q: { act: { '1Q26': 5000, '2Q26': 7300, '3Q26': 8200, '4Q26': 11000, '1Q27': 15000 }, summit: {} },
      y: { act: { '2026': 31000 }, summit: {} },
    },
    // Old-framework market platforms (reported through the FY2026 10-K), now folded into Edge
    // Computing. `q` carries the FY2026 quarterly split (1Q26–4Q26) as reported verbatim on the
    // earnings calls — the old-framework lines were folded into Edge from 1Q27, so no forward
    // quarters. `summit` carries the Bloomberg forward-by-segment annual estimate (FY2027–FY2029).
    gaming_y: { label: 'Gaming', short: 'Gaming', unit: 'usdM', src: '10-K market-platform table; quarterly = earnings calls; forward = BBG by segment', scope: 'company',
      q: { act: { '1Q26': 3800, '2Q26': 4300, '3Q26': 4300, '4Q26': 3700 } },
      y: { act: { '2024': 10447, '2025': 11350, '2026': 16000 }, summit: { '2027': 12076, '2028': 17571, '2029': 19578 } },
    },
    proviz_y: { label: 'Professional Visualization', short: 'Pro Viz', unit: 'usdM', src: '10-K market-platform table; quarterly = earnings calls; forward = BBG by segment', scope: 'company',
      q: { act: { '1Q26': 509, '2Q26': 601, '3Q26': 760, '4Q26': 1300 } },
      y: { act: { '2024': 1553, '2025': 1878, '2026': 3200 }, summit: { '2027': 4752, '2028': 7457, '2029': 7767 } },
    },
    auto_y: { label: 'Automotive & Robotics', short: 'Automotive', unit: 'usdM', src: '10-K market-platform table; quarterly = earnings calls; forward = BBG by segment', scope: 'company',
      q: { act: { '1Q26': 567, '2Q26': 586, '3Q26': 592, '4Q26': 604 } },
      y: { act: { '2024': 1091, '2025': 1694, '2026': 2300 }, summit: { '2027': 2228, '2028': 3605, '2029': 4729 } },
    },
    oem_y: { label: 'OEM & Other', short: 'OEM', unit: 'usdM', src: '10-K market-platform table; forward = BBG by segment', scope: 'company',
      y: { act: { '2024': 306, '2025': 389, '2026': 700 }, summit: { '2027': 616, '2028': 966, '2029': 1063 } },
    },
    // GAAP reportable (operating) segments — the two NVIDIA reports in the financial statements,
    // as opposed to the market-platform view. Sparse: only the three quarters the Q1 FY2027 CFO
    // commentary recast (1Q26, 4Q26, 1Q27). Own axis, declared on the `other` cut below.
    gaap_cn: { label: 'Compute & Networking', short: 'Compute & Networking', unit: 'usdM', src: 'Q1 FY2027 CFO commentary (GAAP reportable segments)', scope: 'company',
      q: { act: { '1Q26': 39589, '4Q26': 61651, '1Q27': 74550 }, summit: {} },
    },
    gaap_gfx: { label: 'Graphics', short: 'Graphics', unit: 'usdM', src: 'Q1 FY2027 CFO commentary (GAAP reportable segments)', scope: 'company',
      q: { act: { '1Q26': 4473, '4Q26': 6476, '1Q27': 7065 }, summit: {} },
    },
  },
  // NVIDIA reports no PP&E, capex, EBITDA or D&A by market platform, so the ratio family the
  // AWS/retail datasets derive (revenue per $ of capacity, capex intensity, EBITDA margin) cannot
  // be computed here. Left intentionally empty rather than filled with company-level numbers that
  // do not belong to a segment.
  derived: {},
  overview: {
    lede: '',
    tenK: { text: 'We have two market platforms, Data Center and Edge Computing. Within Data Center, we report two sub-markets: Hyperscale — the public cloud and the world\'s largest consumer internet companies — and ACIE, the AI clouds, industrial and enterprise, and sovereign AI purpose-built data centers and AI factories. Edge Computing is the devices for agentic and physical AI: PCs, gaming consoles, workstations, AI-RAN base stations, robotics and automotive.', where: 'Q1 FY2027 CFO commentary — Revenue by Market Platform' },
    interactions: [
      { name: 'Networking rides Data Center', what: 'NVIDIA increasingly sells the whole rack, not the chip: the networking (NVLink, InfiniBand, Spectrum-X) is attached to the GPU systems and is now roughly two-thirds of Data Center revenue when it ships inside Grace Blackwell systems. It is the fastest-growing line in the company but has no reportable segment of its own — it lives inside Data Center and its size only shows up on the calls.', evidence: 'FY2026 networking exceeded $31B (>10x the FY2021 Mellanox-acquisition year); Q1 FY2027 networking $15B, nearly tripled YoY; GPU attach rate over 75%.' },
      { name: 'China / H20 moves the reported line', what: 'US export controls decide how much of the addressable Data Center demand NVIDIA is allowed to book. A rule change can strand inventory and purchase commitments in the quarter it lands, and every outlook since assumes zero China Data Center compute — so the reported top line is a policy variable as much as a demand one.', evidence: 'Q1 FY2026 carried a ~$4.5B H20 inventory/purchase-obligation charge and $2.5B unshippable; H20 was ~$50M in Q3 FY2026 as orders never materialised; guidance from Q1 FY2027 assumes no China Data Center compute revenue.' },
      { name: 'Hyperscale vs ACIE mix', what: 'Data Center is two very different customer bases sold the same stack: five or six hyperscalers, versus a long tail of a couple hundred thousand AI-native clouds, enterprises and sovereigns (ACIE). Management expects ACIE to grow faster over time, so the mix inside Data Center — not just its total — is what moves the growth rate.', evidence: 'Q1 FY2027: Hyperscale $38B (+12% QoQ, ~50% of DC) vs ACIE $37B (+31% QoQ, AI-cloud revenue more than tripled YoY); partner data centers >10 MW nearly doubled to over 80 sites.' },
      { name: 'Edge is now one line', what: 'The consumer and embedded businesses that were once four separate segments — Gaming, Pro Viz, Automotive and OEM — were regrouped in FY2027 into a single Edge Computing platform. Read against the old split, the change means the segment\'s reported growth now blends gaming\'s cyclicality with the faster physical-AI ramp.', evidence: 'Edge Computing $6.4B in Q1 FY2027 (+10% QoQ, +29% YoY); physical AI exceeded $9B of revenue over the trailing 12 months.' },
    ]
  },
  customers: {
    classes: [
      { key: 'oems', label: 'OEMs, ODMs & system builders', text: 'NVIDIA sells its data-center platforms and GPUs to original equipment manufacturers, original device manufacturers and system builders that integrate them into servers and rack-scale systems for cloud and enterprise buyers.', where: 'Item 1 — Business (Sales & Customers)' },
      { key: 'csps', label: 'Cloud service providers & consumer internet', text: 'A significant portion of Data Center revenue is attributable to a small number of large cloud service providers and consumer internet companies (the "Hyperscale" sub-market) that buy accelerated-computing systems at scale to train and serve AI.', where: 'Item 1 — Business' },
      { key: 'acie', label: 'AI clouds, enterprise, industrial & sovereign', text: 'NVIDIA sells to AI-native cloud providers, enterprises and industrial companies building their own AI factories, and to sovereign-AI buyers standing up national accelerated-computing infrastructure (the "ACIE" sub-market).', where: 'Item 1 — Business' },
      { key: 'aib', label: 'Add-in-board makers & distributors', text: 'For its consumer and professional graphics products NVIDIA sells to add-in-board manufacturers, distributors and retailers who build and sell GeForce and RTX products to gamers, creators and professionals.', where: 'Item 1 — Business' },
      { key: 'auto', label: 'Automotive & robotics customers', text: 'NVIDIA sells DRIVE, Jetson and Isaac platforms to automakers, tier-one suppliers and robotics companies for self-driving and physical-AI applications.', where: 'Item 1 — Business' },
    ],
    concentration: { disclosed: true, note: 'NVIDIA discloses a limited customer concentration. Its 10-K states that a small number of customers each account for 10% or more of total revenue — including at least one direct customer above the 10% threshold, and one or more indirect customers (which buy NVIDIA products through system integrators and distributors) estimated to represent 10% or more — with the concentration attributable to the Compute & Networking segment. This is a genuine concentration disclosure, unlike Amazon\'s filing, but NVIDIA does not name the customers: the named list on this tab comes from the earnings calls, not the concentration note.' },
    cite: { form: '10-K', period: '2026-01-25', accession: null, url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=10-K' },
    splc: null,
  },
  other: [
    {
      key: 'old', label: 'Old framework', sub: 'Data Center · Gaming · Pro Viz · Automotive · OEM',
      lede: 'The market-platform split as NVIDIA reported it through the FY2026 10-K, before the FY2027 recast. Same total revenue, cut the old way: one enormous Data Center line and the four consumer/embedded platforms — Gaming, Professional Visualization, Automotive & Robotics and OEM — that were folded into Edge Computing in FY2027. Keeping it lets the reported history join up across the framework change.',
      caveat: 'This is not additional revenue — it disaggregates the SAME consolidated net sales as the recast Data Center / Edge view. The forward years (FY2027–FY2029) are Bloomberg consensus by segment, not company guidance; the old quarterly split of the non-Data-Center lines was never disclosed, so this cut is annual only.',
      note: 'Annual only. FY2024 is the last year before the recast; FY2027–FY2029 are Bloomberg estimates and render as forecast.',
      axis: { y: ['2024', '2025', '2026', '2027', '2028', '2029'] },
      views: ['y'],
      tenK: { text: 'Revenue by Market Platform (as reported through the FY2026 Annual Report on Form 10-K): Data Center; Gaming; Professional Visualization; Automotive; and OEM & Other.', where: 'FY2026 Form 10-K — Revenue by Market Platform' },
      cite: { form: '10-K', period: '2026-01-25', accession: null, url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=10-K' },
      series: [
        { key: 'dc_rev', ref: 'results:dc_rev', label: 'Data Center' },
        { key: 'gaming', ref: 'shared:gaming_y', label: 'Gaming' },
        { key: 'proviz', ref: 'shared:proviz_y', label: 'Professional Visualization' },
        { key: 'auto', ref: 'shared:auto_y', label: 'Automotive & Robotics' },
        { key: 'oem', ref: 'shared:oem_y', label: 'OEM & Other' },
      ],
    },
    {
      key: 'gaap', label: 'GAAP segments', sub: 'Compute & Networking · Graphics',
      lede: 'The two reportable operating segments NVIDIA carries in the financial statements — Compute & Networking (data-center compute, networking, automotive, Jetson) and Graphics (GeForce, Pro Viz, GRID) — as opposed to the market-platform view management talks to. It is the cut the auditors sign, and the one the customer-concentration disclosure is attributed to.',
      caveat: 'Sparse: only the three quarters recast in the Q1 FY2027 CFO commentary (1Q26, 4Q26, 1Q27) are carried, so this is a three-point picture, not a time series. Compute & Networking + Graphics tie to total revenue in each quarter shown.',
      note: 'Quarterly, three periods only. The two lines sum to consolidated revenue.',
      axis: { q: ['1Q26', '4Q26', '1Q27'] },
      views: ['q'],
      tenK: { text: 'We report our business in two reportable segments — the Compute & Networking segment and the Graphics segment — as reviewed by our chief operating decision maker.', where: 'Note — Segment Information (GAAP reportable segments)' },
      cite: { form: '10-K', period: '2026-01-25', accession: null, url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=10-K' },
      series: [
        { key: 'gaap_cn', ref: 'shared:gaap_cn', label: 'Compute & Networking' },
        { key: 'gaap_gfx', ref: 'shared:gaap_gfx', label: 'Graphics' },
      ],
    },
  ],
  segments: [
    {
      key: 'dc', label: 'Data Center', short: 'DC',
      lede: 'The whole company, effectively — roughly 90% of revenue and the reason NVIDIA is the center of the AI build-out. It sells accelerated-computing systems (GPUs, Grace CPUs and the networking that fuses them into one machine) to two very different bases: a handful of hyperscalers, and the long tail of AI clouds, enterprise and sovereigns. NVIDIA discloses no units, no ASP and no operating income by platform, so a price x quantity or a margin bridge cannot be built honestly — management sizes the business by dollars-per-gigawatt instead.',
      sells: [
        { name: 'GPUs (Blackwell → Rubin)', what: 'The accelerators themselves — Hopper, Blackwell / Blackwell Ultra, and the ramping Vera Rubin generation — that train and serve AI.' },
        { name: 'Grace CPUs & systems', what: 'The Grace CPU and the rack-scale systems (GB200 / GB300 NVL72) NVIDIA increasingly ships whole rather than as a chip.' },
        { name: 'Networking', what: 'NVLink, InfiniBand and Spectrum-X — the fastest-growing line, sold attached to the GPU systems.' },
        { name: 'Hyperscale vs ACIE', what: 'The same stack sold to two sub-markets: the big clouds (Hyperscale) and everyone else building AI factories (ACIE).' },
      ],
      summary: 'Data Center sells accelerated-computing platforms — GPUs, Grace CPUs and networking — for AI training and inference. It is ~90% of revenue and split into two reported sub-markets: Hyperscale (the big clouds and consumer-internet giants) and ACIE (AI clouds, industrial, enterprise and sovereign). Networking, sold attached to the systems, is the fastest-growing line inside it.',
      brief: 'Sells the machines that train and run AI. Increasingly NVIDIA sells the whole rack — GPUs, its own CPU and the networking that ties thousands of chips into one computer — not just the chip. Half of it goes to five or six hyperscalers; the other half to a couple hundred thousand AI clouds, enterprises and governments building their own AI data centers.',
      tenK: { text: 'Data center computing revenue of $60 billion (+77% YoY); data center networking revenue of $15 billion (nearly tripled YoY). Within Data Center we report two sub-markets: Hyperscale — the public cloud and the world\'s largest consumer internet companies — and ACIE, addressing AI purpose-built data centers and AI factories across industries and countries.', verbatim: true, cite: 'NVIDIA, Q1 FY2027 CFO commentary (quarter ended Apr 26, 2026)', url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=8-K', where: 'Revenue by Market Platform', needs: null },
      products: [
        { name: 'Hyperscale', what: 'The public clouds and the world\'s largest consumer-internet companies — about half of Data Center. They buy GB300 NVL72 racks and Grace Blackwell superchips at massive scale.',
          customers: {
            archetype: { text: 'A significant portion of Data Center revenue is attributable to a small number of large cloud service providers and consumer internet companies that buy accelerated-computing systems at scale to train and serve AI.', where: 'Item 1 — Business' },
            named: [{ name: 'Microsoft', q: 'Q1 2027', what: 'Fairwater, described as the most powerful AI data center, live ahead of schedule' }, { name: 'Amazon Web Services', q: 'Q1 2027', what: 'adding more than 1 million Blackwell and Rubin GPUs starting this year' }, { name: 'Google Cloud', q: 'Q1 2027', what: 'A5X instances supporting up to 960,000 Rubin GPUs' }, { name: 'Meta', q: 'Q1 2026', what: 'named among Spectrum-X networking adopters' }],
            note: 'The hyperscalers are also NVIDIA\'s largest concentration risk — they design their own custom silicon (TPU, Trainium, Maia) alongside buying GPUs. NVIDIA does not name them in the concentration disclosure; these come from the calls.',
            concentration: 'NVIDIA\'s 10-K discloses that a small number of customers each account for 10% or more of total revenue, attributable to the Compute & Networking segment — but it does not name them. The named customers here come from the earnings calls, and any sizing of a customer is an estimate, not a disclosure.',
          },
          management: [{ q: 'Q1 2027', text: 'Hyperscale revenue of $38 billion was approximately 50% of Data Center revenue and increased 12% quarter-over-quarter.' }, { q: 'Q1 2027', text: 'The easiest go-to-market is the hyperscaler, because there are only five or six of them. — Jensen Huang' }, { q: 'Q4 2025', text: 'Large CSPs were about half of Data Center revenue and roughly doubled year-on-year.' }],
        },
        { name: 'ACIE — AI Clouds, Industrial & Enterprise', what: 'Purpose-built AI data centers and AI factories outside the mega-clouds: AI-native clouds, enterprises, industrials and sovereign-AI buyers. Same stack as Hyperscale, a far more fragmented base — and the faster-growing one.',
          customers: {
            archetype: { text: 'NVIDIA sells to AI-native cloud providers, enterprises and industrial companies building their own AI factories, and to sovereign-AI buyers standing up national accelerated-computing infrastructure.', where: 'Item 1 — Business' },
            named: [{ name: 'OpenAI', q: 'Q3 2026 → Q1 2027', what: 'strategic partnership to build at least 10 GW; GPT-5.5 co-designed for and served on Blackwell' }, { name: 'Anthropic', q: 'Q3 2026 → Q4 2026', what: 'first-time NVIDIA adoption, up to 1 GW Grace Blackwell + Vera Rubin; NVIDIA committed a $10B investment' }, { name: 'xAI', q: 'Q2 2025', what: 'Spectrum-X Ethernet-for-AI adopter' }, { name: 'CoreWeave', q: 'Q4 2026', what: 'named among AI-cloud ecosystem investments' }, { name: 'Saudi Arabia (KSA)', q: 'Q3 2026', what: '400,000–600,000 GPUs over three years (sovereign AI)' }],
            note: 'ACIE is where the sovereign and AI-native cloud names land. AI-cloud revenue within ACIE more than tripled year-over-year in Q1 FY2027.',
            concentration: 'NVIDIA\'s 10-K discloses that a small number of customers each account for 10% or more of total revenue, attributable to the Compute & Networking segment — but it does not name them. The named customers here come from the earnings calls, and any sizing of a customer is an estimate, not a disclosure.',
          },
          management: [{ q: 'Q1 2027', text: 'ACIE revenue was $37 billion and grew 31% quarter-over-quarter, including AI cloud revenue that more than tripled year-over-year.' }, { q: 'Q1 2027', text: 'The rest of the industry represents a couple of 250,000 companies around the world… that segment is growing incredibly fast. — Jensen Huang' }, { q: 'Q4 2026', text: 'Sovereign AI exceeded $30 billion in FY2026, more than 3x year-over-year.' }],
        },
        { name: 'Networking', what: 'NVLink inside the rack, InfiniBand and Spectrum-X Ethernet between racks — the Mellanox stack that lets a whole data center behave as one computer. Sold attached to the GPU systems and the fastest-growing line in the company.',
          customers: {
            archetype: { text: 'NVIDIA sells its data-center platforms — including networking — to cloud service providers, consumer internet companies, enterprises and system builders that deploy accelerated computing at scale.', where: 'Item 1 — Business' },
            named: [{ name: 'Spectrum-X adopters', q: 'Q1 2026', what: 'Google Cloud and Meta named among early Spectrum-X Ethernet-for-AI adopters' }],
            note: 'Networking has no reportable segment of its own — it sits inside Data Center and its size is only given on the calls.',
            concentration: 'No customer concentration is disclosed for the networking line specifically; the company-level concentration note sits in the Compute & Networking segment.',
          },
          management: [{ q: 'Q4 2026', text: 'Networking generated $11 billion in revenue, up more than 3.5x year-over-year; for the full year our networking business exceeded $31 billion, up more than 10x compared to fiscal year 2021, the year we acquired Mellanox.' }, { q: 'Q3 2026', text: 'Our networking business, purpose-built for AI and now the largest in the world, generated revenue of $8.2 billion, up 162% year-over-year.' }, { q: 'Q1 2027', text: 'Spectrum-X is now larger than all ethernet network peers combined; InfiniBand grew more than 4x year-over-year.' }],
        },
      ],
      kpis: [
        { name: 'Data Center revenue', definition: 'Data Center market-platform revenue as recast in the "Revenue by Market Platform" table — GPUs, Grace CPUs and networking for AI training and inference. Roughly 90% of company revenue.', filing: 'Reported in NVIDIA\'s recast Revenue by Market Platform (Q1 FY2027 CFO commentary) and, at the operating-segment level, inside Compute & Networking in the 10-K segment note.', unit: 'usdM', periodicity: 'Quarterly and annual', source: 'CFO commentary / 10-K', series: 'results:dc_rev', needs: null },
        { name: 'Hyperscale revenue', definition: 'The Data Center sub-market for the public clouds and the largest consumer-internet companies — about half of Data Center.', filing: 'Disclosed in the recast Revenue by Market Platform table; nine quarters of history posted (1Q25 onward).', unit: 'usdM', periodicity: 'Quarterly and annual', source: 'CFO commentary (recast)', series: 'results:hyper_rev', needs: null },
        { name: 'ACIE revenue', definition: 'The Data Center sub-market for AI clouds, industrial, enterprise and sovereign buyers — the more fragmented, faster-growing half of Data Center.', filing: 'Disclosed in the recast Revenue by Market Platform table; nine quarters of history posted (1Q25 onward).', unit: 'usdM', periodicity: 'Quarterly and annual', source: 'CFO commentary (recast)', series: 'results:acie_rev', needs: null },
        { name: 'Networking revenue', definition: 'The NVLink / InfiniBand / Spectrum-X networking sold attached to Data Center systems. The clearest sub-line inside Data Center and the fastest-growing, but given on the calls rather than in the segment note.', filing: null, unit: 'usdM', periodicity: 'Quarterly (annual FY2026 only)', source: 'Earnings calls (rounded figures)', series: 'shared:dc_networking', needs: 'Quarterly figures are management\'s rounded call numbers; a precise networking series would have to be keyed from each release. Data Center compute is the residual (Data Center revenue − networking) and is not stored separately.' },
      ],
      kpiNote: 'NVIDIA publishes segment revenue and, since Q1 FY2027, the Hyperscale/ACIE recast — but no unit count, no average selling price, no operating income and no capacity figure by platform. That absence is why there is no revenue bridge below: the terms for a price x quantity or a capacity x yield build do not exist. Management sizes the business instead by dollars-per-gigawatt (Hopper ~$20–25B/GW, Grace Blackwell ~$30B, Rubin higher), quoted in What management has said.',
      interactions: [
        { name: 'Hyperscale + ACIE', relation: 'Data Center revenue = Hyperscale + ACIE', bridge: null,
          lines: ['Hyperscale', 'ACIE — AI Clouds, Industrial & Enterprise'],
          why: 'An additive split, not a product identity — the two sub-markets sum to Data Center. It is charted as two KPI series above rather than as a bridge, because there is no multiplicative term (price, capacity) NVIDIA discloses to decompose either one.',
          data: 'Both sub-markets reported quarterly since 1Q25 (recast). Charted as KPIs, not as a bridge.' },
        { name: 'Compute + networking', relation: 'Data Center revenue = compute systems + attached networking', bridge: null,
          lines: ['Networking'],
          why: 'The other additive split. Networking is disclosed on the calls and is now roughly two-thirds of Data Center when it ships inside Grace Blackwell systems; compute is the residual. Additive, so it is a KPI line rather than a bridge.',
          data: 'Networking charted as a KPI (call figures); compute is Data Center revenue minus networking and is not stored separately.' },
        { name: 'GPUs × content-per-gigawatt', relation: 'Data Center revenue = AI capacity built (GW) × NVIDIA content per GW', bridge: null,
          lines: ['GPUs (Blackwell → Rubin)'],
          why: 'The closest thing to a price x quantity NVIDIA gives — and it gives it only as management framing, never as a reported series. Neither term is disclosed: the GW figures are third-party analyst estimates and the content-per-GW is a management point figure.',
          data: 'NOT CHARTED — no reported series for either term. Management quotes Hopper ~$20–25B/GW, Grace Blackwell ~$30B, Rubin higher, in What management has said.' },
      ],
      adjacencies: [
        { name: 'China / H20', why: 'US export controls cap how much Data Center demand NVIDIA can book. A rule change strands inventory and purchase commitments in the quarter it lands, and every outlook assumes zero China Data Center compute — so part of Data Center\'s reported growth is a policy variable.', series: null, needs: 'H20 revenue is given as point figures on the calls (Q1 FY2026 $4.6B recognised, $2.5B unshippable, $4.5B charge; Q3 FY2026 ~$50M) and is not loaded as a series.' },
        { name: 'Vera Rubin ramp', why: 'The next-generation platform (Rubin GPU + Vera CPU) ramps H2 FY2027. Management frames Vera as a standalone CPU opportunity with a new ~$200B TAM — revenue that would sit inside Data Center but is not yet a reported line.', series: null, needs: 'Not separately reported. Management gives TAM and cadence figures on the calls.' },
      ],
      drivers: {
        rev: { from: 'results:dc_rev' },
      },
      bridges: [],
      highlights: []
    },
    {
      key: 'edge', label: 'Edge Computing', short: 'Edge',
      lede: 'The other ~10% — on-device and physical AI. In FY2027 NVIDIA folded four once-separate platforms (Gaming, Professional Visualization, Automotive and OEM) into a single Edge Computing line, so its reported growth now blends gaming\'s cyclicality with the faster physical-AI ramp. Same disclosure limits as Data Center: no units, no ASP, no segment operating income.',
      sells: [
        { name: 'Gaming (GeForce / RTX)', what: 'Consumer GPUs for gamers, creators and AI enthusiasts — the original business, now a small slice.' },
        { name: 'Professional Visualization', what: 'RTX workstations and Omniverse for design, simulation and digital twins.' },
        { name: 'Automotive & Robotics', what: 'DRIVE for self-driving and Jetson / Isaac for robotics — the physical-AI ramp.' },
        { name: 'OEM & Other', what: 'The residual OEM and embedded line.' },
      ],
      summary: 'Edge Computing is on-device and physical AI: Gaming (GeForce / RTX), Professional Visualization (RTX workstations, Omniverse), Automotive & Robotics (DRIVE, Jetson, Isaac) and OEM. NVIDIA regrouped these four once-separate market platforms into one Edge line in FY2027. About 10% of revenue.',
      brief: 'Everything that isn\'t the data center. GeForce cards for gamers, RTX workstations for professionals, the DRIVE computer for self-driving cars and the Jetson brain for robots. Once four separate reporting lines, now bundled into one "Edge Computing" number — small next to Data Center, but the home of the physical-AI story.',
      tenK: { text: 'Our Edge Computing market platform generated $6.4 billion, up 10% quarter-over-quarter and 29% year-over-year. Edge Computing is the devices for agentic and physical AI: PCs, gaming consoles, workstations, AI-RAN base stations, robotics and automotive. Our physical AI continues to gain momentum, exceeding $9 billion in revenue over the last 12 months.', verbatim: true, cite: 'NVIDIA, Q1 FY2027 CFO commentary (quarter ended Apr 26, 2026)', url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001045810&type=8-K', where: 'Revenue by Market Platform', needs: null },
      products: [
        { name: 'Gaming (GeForce / RTX)', what: 'Consumer GPUs — GeForce and RTX — for gamers, creators and AI enthusiasts, sold through add-in-board makers, distributors and retailers. The Blackwell RTX 50 series drove the FY2026 ramp; supply, not demand, is the swing factor.',
          customers: {
            archetype: { text: 'For its consumer graphics products NVIDIA sells to add-in-board manufacturers, distributors and retailers who build and sell GeForce and RTX products to gamers, creators and professionals.', where: 'Item 1 — Business' },
            named: [],
            note: 'A consumer business — hundreds of millions of gamers, none individually material. The named-customer question does not apply.',
            concentration: 'No customer concentration is disclosed for Gaming; NVIDIA\'s concentration note sits in the Compute & Networking segment, not Graphics.',
          },
          management: [{ q: 'Q4 2026', text: 'Gaming revenue of $3.7 billion increased 47% year-on-year, driven by strong Blackwell demand and improved supply; we expect supply constraints to be a headwind to gaming in Q1 and beyond.' }, { q: 'Q3 2026', text: 'Gaming revenue was $4.3 billion, up 30% year-on-year, driven by strong demand as Blackwell momentum continued.' }, { q: 'Q4 2025', text: 'Gaming revenue of $2.5 billion decreased 22% sequentially and 11% year-on-year; Q4 shipments were impacted by supply constraints.' }],
        },
        { name: 'Professional Visualization', what: 'RTX workstation GPUs and the Omniverse platform for design, simulation, prototyping and industrial digital twins. Crossed $1B in a quarter for the first time in Q4 FY2026, driven by DGX Spark.',
          customers: {
            archetype: { text: 'NVIDIA sells professional visualization products to workstation OEMs, system integrators and enterprises across design, media, manufacturing and scientific computing.', where: 'Item 1 — Business' },
            named: [],
            note: 'No individually named Pro Viz customers on the calls; growth is attributed to RTX workstation adoption and DGX Spark.',
            concentration: 'No customer concentration is disclosed for Professional Visualization.',
          },
          management: [{ q: 'Q4 2026', text: 'Professional visualization crossed the $1 billion mark for the first time, with revenue of $1.3 billion, up 159% year-over-year and 74% sequentially.' }, { q: 'Q3 2026', text: 'Professional visualization revenue was $760 million, up 56% year-over-year, another record, driven by DGX Spark.' }],
        },
        { name: 'Automotive & Robotics', what: 'The DRIVE self-driving computer and the Jetson / Isaac robotics platforms — the physical-AI ramp. Automotive revenue is in-car compute only; the robotics and Uber Robotaxi partnerships sit here.',
          customers: {
            archetype: { text: 'NVIDIA sells DRIVE, Jetson and Isaac platforms to automakers, tier-one suppliers and robotics companies for self-driving and physical-AI applications.', where: 'Item 1 — Business' },
            named: [{ name: 'Uber', q: 'Q3 2026 → Q1 2027', what: 'partnership to scale a Level-4-ready autonomous fleet; Robotaxi across nearly 30 cities and four continents by 2028' }, { name: 'Volvo', q: 'Q3 2025', what: 'EX90 on NVIDIA DRIVE (Orin)' }],
            note: 'Automotive revenue includes only in-car compute; NVIDIA also frames a broader automotive vertical (~$5B expected in FY2026 including Data Center training).',
            concentration: 'No customer concentration is disclosed for Automotive & Robotics specifically.',
          },
          management: [{ q: 'Q4 2026', text: 'Automotive revenue of $604 million was up 6% year-over-year, driven by robust demand for self-driving solutions.' }, { q: 'Q3 2026', text: 'Automotive revenue was $592 million, up 32% year-over-year; we are partnering with Uber to scale the world\'s largest Level 4 ready autonomous fleet.' }, { q: 'Q4 2025', text: 'Automotive revenue was a record $570 million, up 103% year-on-year; the automotive vertical is expected to grow to approximately $5 billion this fiscal year.' }],
        },
      ],
      kpis: [
        { name: 'Edge Computing revenue', definition: 'The Edge Computing market-platform revenue — Gaming, Pro Viz, Automotive and OEM combined, as recast in FY2027.', filing: 'Reported in NVIDIA\'s recast Revenue by Market Platform table; at the operating-segment level most of it sits in Graphics.', unit: 'usdM', periodicity: 'Quarterly and annual', source: 'CFO commentary / 10-K', series: 'results:edge_rev', needs: null },
        { name: 'Gaming revenue', definition: 'GeForce / RTX consumer GPU revenue — the largest Edge line. Reported separately through the FY2026 10-K, before the Edge regrouping.', filing: 'Old-framework market-platform line (10-K through FY2026).', unit: 'usdM', periodicity: 'Quarterly (FY2026) and annual', source: '10-K; quarterly = calls; forward = BBG by segment', series: 'shared:gaming_y', needs: 'FY2026 quarters (1Q26–4Q26) are loaded from the calls; the earlier quarterly split (FY2024–FY2025) and the forward (FY2027+, folded into Edge) are annual only.' },
        { name: 'Professional Visualization revenue', definition: 'RTX workstation and Omniverse revenue. Reported separately through the FY2026 10-K.', filing: 'Old-framework market-platform line (10-K through FY2026).', unit: 'usdM', periodicity: 'Quarterly (FY2026) and annual', source: '10-K; quarterly = calls; forward = BBG by segment', series: 'shared:proviz_y', needs: null },
        { name: 'Automotive & Robotics revenue', definition: 'In-car compute (DRIVE) plus robotics (Jetson / Isaac). Reported separately through the FY2026 10-K.', filing: 'Old-framework market-platform line (10-K through FY2026).', unit: 'usdM', periodicity: 'Quarterly (FY2026) and annual', source: '10-K; quarterly = calls; forward = BBG by segment', series: 'shared:auto_y', needs: null },
      ],
      kpiNote: 'Edge Computing is a FY2027 regrouping of four platforms NVIDIA used to report separately. The old lines (Gaming, Pro Viz, Automotive, OEM) are carried annually so the history joins up, with the FY2026 quarters loaded from the calls; the recast Edge total is the quarterly series. As with Data Center, NVIDIA discloses no units, no ASP and no operating income by platform, so there is no price x quantity bridge.',
      interactions: [
        { name: 'Gaming + Pro Viz + Auto + OEM', relation: 'Edge Computing = Gaming + Professional Visualization + Automotive & Robotics + OEM', bridge: null,
          lines: ['Gaming (GeForce / RTX)', 'Professional Visualization', 'Automotive & Robotics'],
          why: 'Edge is the sum of the four old market platforms. An additive roll-up, not a product identity — charted as the old-framework cut on the Other tab rather than as a bridge.',
          data: 'The four lines are reported annually through FY2026 (Other ▸ Old framework); the recast Edge total is quarterly.' },
        { name: 'Units × ASP', relation: 'Gaming revenue = GPUs shipped × average selling price', bridge: null,
          lines: ['Gaming (GeForce / RTX)'],
          why: 'The textbook consumer-hardware identity, and one NVIDIA does not give you: it discloses neither unit shipments nor ASP for Gaming. Management frames Gaming by supply availability and Blackwell demand instead.',
          data: 'NOT CHARTED — neither term is disclosed.' },
      ],
      adjacencies: [
        { name: 'Physical AI', why: 'Robotics and automotive are the fastest-growing part of Edge and the one management talks up most — physical AI exceeded $9B of revenue over the trailing 12 months by Q1 FY2027 — but it is not a reported line of its own.', series: null, needs: 'Physical-AI revenue is a management aggregate given on the calls, not a reported series.' },
      ],
      drivers: {
        rev: { from: 'results:edge_rev' },
      },
      bridges: [],
      highlights: []
    },
  ]
};
