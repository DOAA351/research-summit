// overviews/nvda-overview.js — STANDARDIZED Overview for NVIDIA Corporation (NASDAQ: NVDA)
//
// A self-contained rebuild that is FORMAT-IDENTICAL to AMZN's standardized 7-block Overview
// (amzn.js stdOverviewBody). It ports AMZN's std* helpers + collapsible() + the inline <style>
// block VERBATIM (adapted to NVIDIA green + nvda* ids), populated with NVIDIA's real reported
// numbers/prose mined from the legacy js/overviews/nvidia.js. NO extra blocks: exactly the 7
// std blocks, in order — no margins panel, no technology/industry tabs, no old NVDA box layout.
//
// The 7 blocks (docs/OVERVIEW_CONVENTIONS.md §4, docs/NVDA_AMZN_FORMAT_RULES.md):
//   1 stdKeyFacts()  — 10-cell 5x2 grid (green 3px top accent); market-cap cell #nvdaMc is live.
//   2 lede           — one tight paragraph (.ov-lede).
//   3 stdFourQuad()  — 2x2 (What sells · Who buys · How earns · The edge), never collapsed.
//   4 collapsible "How NVIDIA makes money" — stdMoneyMap() (Segments ⇄ Geography toggle).
//   5 collapsible "Products & platforms"   — stdProducts() (family card → pop-up).
//   6 collapsible "Competitors — peer map"  — nvdaScatterHtml('ov') (SVG scatter; nvda-peers.js).
//   7 collapsible "Timeline"                — stdTimeline() (genesis-first).
//
// Named nvdaOverview2 to avoid clashing with the existing nvdaOverview export in nvda.js — the
// main file re-exports appropriately. Exports: export var nvdaOverview2 = { body, init }.
//
// Sources: NVIDIA FY2026 Form 10-K and Q1 FY2027 press release / CFO commentary (quarter ended
// Apr 26, 2026); NVIDIA IR for qualitative content and history. Live market cap via
// api.liveQuote (Massive), routed through nvda-peers.js. Peer multiples are seeded approximations
// (labeled), never presented as live. All figures split-adjusted for the Jun 2024 10-for-1 split.

import { nvdaScatterHtml, wireNvdaScatters } from './nvda-peers.js';

// ─── esc: encodes & (matches nvidia.js / nvda-peers.js); raw-HTML fields are inserted unescaped ──
function esc(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ─── Brand: NVIDIA green + palette ───────────────────────────────────────────────────────────
var BRAND='#76B900', BRAND2='#4E7A00';
var GREEN='#1F8A70', TEAL='#5cc0a6', BLUE='#2D6A9F', PURPLE='#5B53A8', AMBER='#C0772C', GRAY='#9AA6B4';

function collapsible(title, inner, open){
  return '<div class="ov-collap'+(open?' open':'')+'">'+
    '<button type="button" class="ov-collap-h"><span class="ov-collap-ic">'+(open?'▾':'▸')+'</span>'+esc(title)+'</button>'+
    '<div class="ov-collap-b"'+(open?'':' hidden')+'>'+inner+'</div></div>';
}

// ═════════════════════════════════════════════════════════════════════════════════════════════
// DATA — Overview (real NVIDIA figures from the legacy nvidia.js / FY2026 10-K)
// ═════════════════════════════════════════════════════════════════════════════════════════════
// Key Facts — 10 cells (5×2). Market-cap cell fills live (#nvdaMc).
var STD_FACTS=[
  ['Model','Fabless chip designer'],
  ['HQ','Santa Clara, CA, USA'],
  ['Founded','1993'],
  ['Fiscal year','Ends late January'],
  ['Last quarter','Q1 FY2027 · Apr 26, 2026'],
  ['CEO','Jensen Huang · founder, CEO since 1993'],
  ['Revenue TTM','$215.9B'],
  ['Data Center','$193.7B · ~90%'],
  ['Diluted EPS','$4.90 (GAAP)'],
  ['Market cap','live'],
];

var NVDA_LEDE='NVIDIA is a fabless designer of accelerated-computing platforms and the company at the center of the AI build-out. It designs the GPUs, Grace CPUs and full rack-scale systems that train and run modern AI, then outsources manufacturing to TSMC, sources HBM memory from SK hynix / Micron / Samsung, and assembles systems through partners such as Foxconn. Its durable advantage is not just the chip but the full stack on top of it — the CUDA software platform and a two-decade developer ecosystem, plus the NVLink / InfiniBand / Spectrum networking acquired via Mellanox.';

// 2x2 quadrant (each cell ≤ ~30 words) — from the legacy BIZ. b[1] is raw HTML (may hold &amp;).
var STD_BIZ=[
  ['What it sells','AI-compute <b>platforms</b> — GPUs, full rack-scale systems and the CUDA software that trains and runs modern AI.'],
  ['Who buys it','Hyperscalers, cloud providers, enterprises and <b>sovereign-AI</b> buyers.'],
  ['How it earns','<b>~90% Data Center</b> — selling AI training &amp; inference compute; the rest is Edge (gaming, pro-viz, auto, robotics).'],
  ['The edge','CUDA&#39;s <b>20-year software lock-in</b> plus the full networking &amp; systems stack — not just the chip.'],
];

// How it makes money — FY2026 per the reported "Revenue by Market Platform" recast (10-K / Q1 FY27
// CFO commentary). Two views of the SAME total. Segments reconcile to $215.9B; geography is
// approximate FY2025 by billing location (labeled), so it is shown as directional shares only.
// [name, bar-width %, inside-bar label, right label, color]
var GMM_SEG=[
  ['Hyperscale', 48.9, '$105.6B', '49%', GREEN],
  ['ACIE', 40.8, '$88.1B', '41%', TEAL],
  ['Edge Computing', 10.3, '$22.2B', '10%', BLUE],
];
var GMM_GEO=[
  ['United States', 47, '', '~47%', GREEN],
  ['Singapore*', 18, '', '~18%', BLUE],
  ['Taiwan', 16, '', '~16%', PURPLE],
  ['China', 13, '', '~13%', AMBER],
  ['Other', 6, '', '~6%', GRAY],
];
// Segment "What is X?" — qualitative (no numbers in desc); numbers live behind the nested
// "The numbers" disclosure (subsegment-style). desc is raw HTML.
var REV_DEFS=[
  { seg:'Hyperscale',
    desc:'The public clouds and largest consumer-internet companies — Microsoft, Amazon, Google, Meta. They buy <b>GB300 NVL72 racks</b> and <b>Grace Blackwell superchips</b> at massive scale to train and serve frontier AI. About half of Data Center, and the fastest-growing slice.',
    econ:[['FY2026 revenue','$105.6B'],['Growth','+96% YoY'],['Share of Data Center','~half']] },
  { seg:'ACIE — AI Clouds, Industrial & Enterprise',
    desc:'Purpose-built "AI factories" outside the mega-clouds — enterprises, industries and <b>sovereign-AI</b> buyers standing up their own accelerated data centers. Same product stack as Hyperscale, different customers.',
    econ:[['FY2026 revenue','$88.1B'],['Growth','+44% YoY'],['Product stack','same Data-Center stack as Hyperscale']] },
  { seg:'Edge Computing',
    desc:'On-device and physical AI: <b>GeForce / RTX</b> gaming, <b>Omniverse</b> & pro-viz workstations, <b>DRIVE</b> automotive and <b>Jetson / Isaac</b> robotics. In FY2027 NVIDIA folded these once-separate platforms into one line.',
    econ:[['FY2026 revenue','$22.2B'],['Growth','+45% YoY'],['Was','Gaming + Pro Viz + Auto, regrouped in FY2027']] },
  { seg:'How the business is cut (FY2027 recast)',
    desc:'NVIDIA re-cut its business by <b>customer type</b> rather than product line: <b>Hyperscale</b> (the big clouds) versus <b>ACIE</b> (everyone else building AI factories), with gaming, pro-viz, auto and robotics folded into a single smaller <b>Edge Computing</b> line. Data Center (Hyperscale + ACIE) is ~90% of the total.',
    econ:[['Data Center (Hyperscale + ACIE)','~90% of revenue'],['Edge Computing','~10% of revenue']],
    econNote:'Reported FY2026 market-platform revenue. Geography (below) is approximate FY2025 by customer billing location — not end-demand — to be refined with exact FY2026 10-K figures.' },
];

// Products — two tiers: family card (photo → pop-up with the detail / roadmap items).
// Photo families carry img (img/products/nvda-*.jpg); the roadmap family uses an emoji ic.
var N_PRODUCTS=[
  { img:'nvda-gb300-nvl72.jpg', fam:'GB300 NVL72', tag:'Rack-scale AI system',
    d:'72 Blackwell GPUs wired to act as one giant GPU — an "AI factory" in a single rack.',
    detail:'NVIDIA&#39;s flagship "AI factory" in one rack. It links 72 Blackwell Ultra GPUs and 36 Grace CPUs over a 5th-generation NVLink fabric so they share memory and bandwidth as if they were a single enormous accelerator. Liquid-cooled and drawing well over 100 kW, one NVL72 delivers the training and inference throughput that used to need a room full of servers. Increasingly this — the whole machine, not the chip — is what NVIDIA actually sells.' },
  { img:'nvda-superchip.jpg', fam:'Grace Blackwell Superchip', tag:'GPU + CPU module',
    d:'The GPU and Grace CPU fused by NVLink into one accelerated-computing module.',
    detail:'Two Blackwell GPUs joined to an NVIDIA Grace CPU over a 900 GB/s NVLink-C2C link, packaged as a single module. Pairing NVIDIA&#39;s own Arm-based CPU with the GPUs removes the traditional CPU–GPU bottleneck and keeps the accelerators fed with data at memory-coherent speed. It is the building block the NVL72 racks are assembled from.' },
  { img:'nvda-networking.jpg', fam:'NVLink · Spectrum-X', tag:'Networking',
    d:'The fabric (NVLink, InfiniBand, Spectrum-X) that links thousands of GPUs into one machine.',
    detail:'The part of NVIDIA most people overlook. NVLink connects GPUs inside a rack; InfiniBand and Spectrum-X Ethernet connect racks into clusters of tens of thousands of GPUs. Most of this stack arrived with the 2020 Mellanox acquisition, and it is what lets a whole data center behave as one computer — now one of NVIDIA&#39;s fastest-growing revenue lines.' },
  { img:'nvda-dies.jpg', fam:'Blackwell silicon', tag:'The chip',
    d:'The GPU die itself — designed by NVIDIA, built by TSMC with HBM memory.',
    detail:'The GPU itself. A Blackwell package places two reticle-sized dies (~104B transistors each) side by side, joined by a 10 TB/s link so they behave as one chip, surrounded by stacks of HBM high-bandwidth memory. NVIDIA designs it, TSMC manufactures it on a custom 4nm process, and the memory comes from SK hynix / Micron — the "fabless" model in a single image.' },
  { ic:'🗺️', fam:'Product roadmap', tag:'Annual cadence',
    d:'Hopper → Blackwell → GB300 → Vera Rubin — a new platform every year.',
    items:[
      ['Hopper (H100) · 2022','The workhorse GPU of the AI build-out — launched into the ChatGPT demand wave.'],
      ['Blackwell (B200 / GB200) · 2024','The current generation; a two-die package that behaves as one chip, executed alongside the 10-for-1 split.'],
      ['GB300 NVL72 · 2025','Rack-scale systems ramp — 72 Blackwell Ultra GPUs acting as one accelerator.'],
      ['Vera Rubin · 2026','The next platform: the Rubin R200 GPU (TSMC 3nm, HBM4) paired with the new Vera CPU, entering production and ramping now; Rubin Ultra follows in 2027.'] ]},
];

// Timeline — corporate lineage, genesis-first (conventions §4.7). Depth in Read Mores (hist:i).
var TIMELINE=[
  { y:'1993', t:'<b>Genesis:</b> Jensen Huang, Chris Malachowsky and Curtis Priem found <b>NVIDIA</b> to accelerate 3D graphics for the PC.',
    d:'<ul class="ov-bullets"><li>1993 — the three co-founders start NVIDIA in Silicon Valley to build graphics chips for gaming and multimedia.</li><li>Jensen Huang has been CEO from day one — the company is still <b>founder-led</b> today.</li><li>Jan 1999 — NVIDIA <b>IPOs on NASDAQ</b>; organically the same company since (no spin-off, SPAC or reverse merger in the lineage).</li></ul>' },
  { y:'1999', t:'Ships the <b>GeForce 256</b>, marketed as the world&#39;s first "GPU" — defining the product category it still leads.' },
  { y:'2006', t:'<b>Business-model inflection: CUDA launches</b> — opening the GPU to general-purpose computing and seeding the software moat.',
    d:'<ul class="ov-bullets"><li>2006 — CUDA lets developers program the GPU directly, far beyond graphics.</li><li>Twenty years later essentially every AI framework, library and model targets NVIDIA <b>first</b> — the deepest, most durable part of the moat; a rival can match a chip on a spec sheet, but not two decades of software.</li></ul>' },
  { y:'2016', t:'<b>The AI pivot: DGX-1</b>, the first "AI supercomputer in a box," is hand-delivered to OpenAI — GPUs move from graphics to AI compute.' },
  { y:'2020', t:'<b>Mellanox acquired (~$7B)</b> — adds the InfiniBand / Ethernet networking stack that links thousands of GPUs into one machine.',
    d:'<ul class="ov-bullets"><li>2020 — NVIDIA buys Mellanox (a listed company) for ~$7B, its largest deal to that point.</li><li>Networking (NVLink, InfiniBand, later Spectrum-X) became the fabric behind rack-scale systems — now one of the fastest-growing revenue lines.</li></ul>' },
  { y:'2022', t:'<b>Hopper (H100)</b> launches straight into the ChatGPT demand wave — the workhorse GPU of the AI build-out.' },
  { y:'Jun 2024', t:'<b>Blackwell</b> (B200 / GB200) launches and NVIDIA executes a <b>10-for-1 stock split</b>; Data Center reaches ~90% of revenue.',
    d:'<ul class="ov-bullets"><li>2024 — the Blackwell platform ramps as AI capex accelerates.</li><li>Jun 2024 — a <b>10-for-1 split</b> makes shares more accessible; all per-share figures since are split-adjusted.</li></ul>' },
  { y:'2024–26', t:'Briefly the <b>world&#39;s most valuable company</b> — crossing into multi-trillion-dollar market cap as AI demand compounds.',
    d:'<ul class="ov-bullets"><li>2024 — NVIDIA first touches the top of the global market-cap ranking on the strength of AI demand.</li><li>2025 — GB200 / GB300 NVL72 rack-scale systems ramp.</li><li>2026 — the Vera Rubin platform enters production and begins its ramp.</li></ul>' },
];

// ═══ Standardized Overview body ═══════════════════════════════════════════════════════════════
function stdKeyFacts(){
  return '<div class="stdkf">'+STD_FACTS.slice(0,10).map(function(p){
    var v;
    if(p[0]==='Market cap'){ v='<span id="nvdaMc">'+esc(p[1])+'</span>'; }
    else v=esc(p[1]);
    return '<div class="stdkf-cell"><div class="stdkf-k">'+esc(p[0])+'</div><div class="stdkf-v">'+v+'</div></div>'; }).join('')+'</div>';
}
function stdFourQuad(){
  return '<div class="q2">'+STD_BIZ.map(function(b){ return '<div class="q2-cell"><div class="q2-k">'+esc(b[0])+'</div><div class="q2-v">'+b[1]+'</div></div>'; }).join('')+'</div>';
}
function gmmBars(arr){
  return '<div class="ov-mbars">'+arr.map(function(r){
    return '<div class="ov-mbar"><div class="ov-mbar-l">'+esc(r[0])+'</div>'+
      '<div class="ov-mbar-track"><div class="ov-mbar-fill" style="width:'+Math.max(r[1],1.2)+'%;background:'+r[4]+';">'+esc(r[2])+'</div></div>'+
      '<div class="ov-mbar-v">'+esc(r[3])+'</div></div>';
  }).join('')+'</div>';
}
function stdMoneyMap(){
  var h='<div class="ov-diagram-cap" style="margin:0 0 8px">FY2026 revenue <b>$215.9B (+65%)</b> — the same total, two ways: by <b>segment</b> (reported market-platform revenue) or by <b>geography</b>. Data Center (Hyperscale + ACIE) is ~90% of sales.</div>';
  h+='<div class="mg-tog-row" style="display:flex;gap:14px;margin:2px 0 8px"><span class="mg-tog" style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--mu)">View: <span class="mg-seg" style="display:inline-flex;background:#F2F5F8;border:1px solid var(--bdr);border-radius:999px;padding:2px"><button type="button" class="mg-pill active" data-gmm="seg" style="border:none;background:var(--navy);color:#fff;font:inherit;font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px;cursor:pointer">Segments</button><button type="button" class="mg-pill" data-gmm="geo" style="border:none;background:transparent;color:var(--mu);font:inherit;font-size:10.5px;font-weight:700;padding:3px 10px;border-radius:999px;cursor:pointer">Geography</button></span></span></div>';
  h+='<div class="gmm-view" data-gmm="seg">'+gmmBars(GMM_SEG)+'</div>';
  h+='<div class="gmm-view" data-gmm="geo" hidden>'+gmmBars(GMM_GEO)+'</div>';
  h+='<div class="mm-defs acc-list" style="margin-top:12px">'+REV_DEFS.map(function(s){
    var econ='<div class="acc" style="margin-top:8px"><button type="button" class="acc-h">The numbers <span class="acc-x">+</span></button><div class="acc-b" hidden>'+s.econ.map(function(r){ return '<div class="ov-row"><div class="ov-row-k">'+esc(r[0])+'</div><div class="ov-row-v">'+esc(r[1])+'</div></div>'; }).join('')+(s.econNote?'<div class="ave-subh-note" style="margin-top:6px">'+esc(s.econNote)+'</div>':'')+'</div></div>';
    return '<div class="acc"><button type="button" class="acc-h">'+esc(s.seg)+'<span class="acc-x">+</span></button><div class="acc-b" hidden><div class="famd">'+s.desc+'</div>'+econ+'</div></div>';
  }).join('')+'</div>';
  h+='<div class="ov-diagram-cap" style="margin-top:10px">FY2026: GAAP operating income <b>$130.4B (+60%)</b> · net income <b>$120.1B</b> · gross margin <b>71.1%</b> (a ~$4.5B Q1 FY2026 H20/China charge pulled the full year down; Q4 recovered to 75.0%). <span class="ave-subh-note">Source: NVIDIA FY2026 Form 10-K & press release. Geography is approximate FY2025 by billing location — directional, not reconciled to the reported total.</span></div>';
  return h;
}
function stdProducts(){
  return '<div class="ov-diagram-cap" style="margin:0 0 8px"><b>Tap any product</b> for the detail — most of what NVIDIA sells now is the whole machine, not the chip.</div>'+
    '<div class="stdp">'+N_PRODUCTS.map(function(f,i){
      var top=f.img?'<div class="stdp-img"><img src="img/products/'+esc(f.img)+'" alt="'+esc(f.fam)+'" loading="lazy" onerror="this.style.display=\'none\'"></div>':'<div class="stdp-ic">'+f.ic+'</div>';
      return '<div class="stdp-card ov-clickable" data-detail="prod:'+i+'">'+top+
        '<div class="stdp-n">'+esc(f.fam)+'</div><div class="stdp-d">'+esc(f.d)+'</div><div class="stdp-more">'+(f.items?'See roadmap ›':'See details ›')+'</div></div>';
    }).join('')+'</div>';
}
function stdTimeline(){
  return '<div class="ov-timeline">'+TIMELINE.map(function(t,i){ var more=t.d?'<div class="ov-tl-more">Read more →</div>':''; var cls=t.d?' ov-clickable':''; var attr=t.d?' data-detail="hist:'+i+'"':''; return '<div class="ov-tl-item'+cls+'"'+attr+'><div class="ov-tl-dot"></div><div class="ov-tl-yr">'+esc(t.y)+'</div><div class="ov-tl-body">'+t.t+more+'</div></div>'; }).join('')+'</div>';
}

var OV_SOURCES='Sources — NVIDIA FY2026 Form 10-K and the Q1 FY2027 press release & CFO commentary (quarter ended Apr 26, 2026) for revenue, segment, margin and per-share figures; NVIDIA IR for qualitative content and history. Market cap is live (Massive); peer multiples & growth are seeded approximations (Aug 2026), directional — never presented as live. Geography is approximate FY2025 by billing location. All figures in US dollars, split-adjusted for the June 2024 10-for-1 split. Forward figures are estimates, not company guidance.';

function stdOverviewBody(c){
  var h='<style>.stdkf{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid var(--bdr);border-top:3px solid '+BRAND+';border-radius:12px;overflow:hidden;background:var(--w);margin:2px 0}'+
    '.stdkf-cell{padding:11px 13px;border-right:1px solid var(--bdr);border-bottom:1px solid var(--bdr)}'+
    '.stdkf-cell:nth-child(5n){border-right:none}.stdkf-cell:nth-child(n+6){border-bottom:none}'+
    '.stdkf-k{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--mu);margin-bottom:3px}'+
    '.stdkf-v{font-size:12px;font-weight:700;color:var(--navy);line-height:1.3}'+
    '@media(max-width:720px){.stdkf{grid-template-columns:repeat(2,1fr)}.stdkf-cell{border-right:none}}'+
    '.ov-lede{margin:16px 0 6px;font-size:13px;line-height:1.6;color:var(--navy)}'+
    '.q2{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--bdr);border-radius:12px;overflow:hidden;background:var(--w);margin:4px 0}'+
    '.q2-cell{padding:13px 15px;border-right:1px solid var(--bdr);border-bottom:1px solid var(--bdr)}'+
    '.q2-cell:nth-child(2n){border-right:none}.q2-cell:nth-child(n+3){border-bottom:none}'+
    '.q2-k{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:'+BRAND2+';margin-bottom:5px}'+
    '.q2-v{font-size:12px;color:var(--navy);line-height:1.5}.q2-v b{font-weight:800}'+
    '@media(max-width:600px){.q2{grid-template-columns:1fr}.q2-cell{border-right:none}.q2-cell:nth-child(n+2){border-bottom:1px solid var(--bdr)}.q2-cell:last-child{border-bottom:none}}'+
    '.acc-list .acc{border:1px solid var(--bdr);border-radius:9px;margin-top:6px;overflow:hidden;background:var(--w)}'+
    '.acc-h{width:100%;text-align:left;border:none;background:#F7F9FB;font:inherit;font-size:12px;font-weight:700;color:var(--navy);padding:9px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px}'+
    '.acc-h:hover{background:#EEF2F6}.acc-x{color:var(--mu);font-weight:800}.acc-b{padding:10px 12px}'+
    '.famd{font-size:12px;color:var(--navy);line-height:1.55}.famd b{font-weight:800}'+
    '.ov-row{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid var(--bdr);font-size:11.5px}.ov-row:last-child{border-bottom:none}.ov-row-k{color:var(--mu);font-weight:600}.ov-row-v{color:var(--navy);font-weight:800}'+
    '.stdp{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}'+
    '.stdp-card{border:1px solid var(--bdr);border-radius:11px;padding:13px 14px;background:var(--w);cursor:pointer;transition:.14s}'+
    '.stdp-card:hover{box-shadow:0 3px 10px rgba(0,0,0,.08);transform:translateY(-2px);border-color:'+BRAND+'}'+
    '.stdp-img{margin:-4px -4px 2px}.stdp-img img{width:100%;height:96px;object-fit:cover;border-radius:8px;display:block}'+
    '.stdp-ic{font-size:26px;line-height:1}.stdp-n{font-size:13px;font-weight:800;color:var(--navy);margin:7px 0 3px}'+
    '.stdp-d{font-size:11px;color:var(--mu);line-height:1.45}.stdp-more{font-size:10px;font-weight:700;color:'+BRAND2+';margin-top:6px}'+
    '.ov-collap{border:1px solid var(--bdr);border-radius:10px;margin:12px 0 0;overflow:hidden}'+
    '.ov-collap-h{width:100%;text-align:left;border:none;background:#F7F9FB;font:inherit;font-size:12.5px;font-weight:800;color:var(--navy);padding:11px 14px;cursor:pointer;display:flex;align-items:center;gap:8px}'+
    '.ov-collap-h:hover{background:#EEF2F6}.ov-collap-ic{font-size:10px;color:var(--mu)}.ov-collap-b{padding:12px 14px 6px}'+
    '.ov-foot{font-size:10px;color:var(--mu);line-height:1.5;margin:16px 0 4px;padding-top:10px;border-top:1px solid var(--bdr)}'+
    '.ave-subh-note{font-size:10px;color:var(--mu);font-weight:600}'+
    '</style>';
  // The hook — always visible: Key Facts, description, 2x2 quadrant.
  h+=stdKeyFacts();
  h+='<p class="ov-lede">'+NVDA_LEDE+'</p>';
  h+=stdFourQuad();
  // Everything below the hook defaults collapsed (progressive disclosure).
  h+=collapsible('How NVIDIA makes money', stdMoneyMap(), false);
  h+=collapsible('Products & platforms', stdProducts(), false);
  h+=collapsible('Competitors — the peer map', nvdaScatterHtml('ov'), false);
  h+=collapsible('Timeline — how it became today\'s NVIDIA', stdTimeline(), false);
  h+='<div class="ov-foot">'+esc(OV_SOURCES)+'</div>';
  return h;
}

// ═══ Modal (products / timeline pop-ups) — ported from amzn.js wireModal + ov-modal-back ═══════
function wireModal(root){
  var back=root.querySelector('#nvdaModalBack'), mT=root.querySelector('#nvdaModalT'), mB=root.querySelector('#nvdaModalB'); if(!back) return;
  function onEsc(e){ if(e.key==='Escape') closeM(); }
  function openM(t,b){ mT.innerHTML=t; mB.innerHTML=b; back.hidden=false; requestAnimationFrame(function(){ back.classList.add('on'); }); document.addEventListener('keydown', onEsc); }
  function closeM(){ back.classList.remove('on'); document.removeEventListener('keydown', onEsc); setTimeout(function(){ back.hidden=true; }, 180); }
  var xb=root.querySelector('#nvdaModalX'); if(xb) xb.onclick=closeM; back.onclick=function(e){ if(e.target===back) closeM(); };
  function resolve(key){
    var p=key.split(':'), kind=p[0], id=p.slice(1).join(':');
    if(kind==='hist'){ var t=TIMELINE[+id]; return t&&t.d?{t:t.y,h:t.d}:null; }
    if(kind==='prod'){ var f=N_PRODUCTS[+id]; if(!f) return null;
      var body='';
      if(f.img) body+='<img src="img/products/'+esc(f.img)+'" alt="'+esc(f.fam)+'" style="width:100%;border-radius:10px;margin:0 0 10px;display:block" onerror="this.style.display=\'none\'">';
      if(f.detail) body+='<div class="famd">'+f.detail+'</div>';
      if(f.items) body+=f.items.map(function(it){ return '<div style="margin:0 0 10px"><div style="font-size:12.5px;font-weight:800;color:var(--navy)">'+esc(it[0])+'</div><div class="famd">'+it[1]+'</div></div>'; }).join('');
      return {t:(f.tag?'<span style="font-weight:600;color:var(--mu)">'+esc(f.tag)+' · </span>':'')+esc(f.fam),h:body}; }
    return null;
  }
  root.querySelectorAll('[data-detail]').forEach(function(el){ el.style.cursor='pointer'; });
  if(!root._nvdaDetailWired){
    root._nvdaDetailWired=true;
    root.addEventListener('click', function(e){ var el=e.target.closest?e.target.closest('[data-detail]'):null; if(!el||!root.contains(el)) return; var d=resolve(el.getAttribute('data-detail')); if(d) openM(d.t,d.h); });
  }
}

// ═══ Public API ════════════════════════════════════════════════════════════════════════════════
function body(c){
  var h='<div class="ov ov-nvda" data-brand="NVDA" style="--brand:'+BRAND+';--brand-2:'+BRAND2+';--brand-soft:rgba(118,185,0,0.10)">';
  h+=stdOverviewBody(c);
  h+='<div class="ov-modal-back" id="nvdaModalBack" hidden><div class="ov-modal" role="dialog" aria-modal="true">'+
    '<button class="ov-modal-x" id="nvdaModalX" aria-label="Close">×</button>'+
    '<div class="ov-modal-t" id="nvdaModalT"></div><div class="ov-modal-b" id="nvdaModalB"></div></div></div>';
  h+='</div>';
  return h;
}

function init(root){
  if(!root || !root.querySelectorAll) root=document.getElementById('co-detailview');
  if(!root) return;
  wireModal(root);
  // Collapsible sections (accordion)
  root.querySelectorAll('.ov-collap-h').forEach(function(btn){ btn.onclick=function(){ var cc=btn.parentElement; var open=cc.classList.toggle('open'); var b=cc.querySelector('.ov-collap-b'); if(b) b.hidden=!open; var ic=btn.querySelector('.ov-collap-ic'); if(ic) ic.textContent=open?'▾':'▸'; }; });
  // Money-map "What is X?" accordions
  root.querySelectorAll('.acc-h').forEach(function(btn){ btn.onclick=function(){ var b=btn.nextElementSibling; if(!b) return; var open=b.hidden; b.hidden=!open; var x=btn.querySelector('.acc-x'); if(x) x.textContent=open?'–':'+'; }; });
  // Money-map view toggle (Segments ⇄ Geography)
  root.querySelectorAll('.mg-pill[data-gmm]').forEach(function(btn){ btn.onclick=function(){
    var v=btn.getAttribute('data-gmm');
    root.querySelectorAll('.mg-pill[data-gmm]').forEach(function(b){ var on=(b===btn); b.style.background=on?'var(--navy)':'transparent'; b.style.color=on?'#fff':'var(--mu)'; });
    root.querySelectorAll('.gmm-view').forEach(function(p){ p.hidden=(p.getAttribute('data-gmm')!==v); });
  }; });
  // Peer scatter (Overview collapsible — pure SVG, builds fine even while collapsed).
  // wireNvdaScatters also fetches live caps, which fills the #nvdaMc Key Facts cell.
  wireNvdaScatters(root);
  // Hoist the modal to #co-detailview so it stays visible from either profile tab.
  var detail=document.getElementById('co-detailview');
  if(detail){
    detail.querySelectorAll(':scope > .ov-modal-back').forEach(function(m){ if(m.id!=='nvdaModalBack') m.remove(); });
    var md=root.querySelector('#nvdaModalBack'); if(md && md.parentNode!==detail) detail.appendChild(md);
  }
}

export var nvdaOverview2 = { body: body, init: init };
