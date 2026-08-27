// overviews/nvda-management.js — NVDA Deep Dive ▸ MANAGEMENT, format-identical to AMZN.
// Self-contained module (no edits to nvidia.js): exports { body, init }.
//
// Four sub-tabs — Executives & Board · Ownership · Governance & SBC · Track Record —
// built on the SAME shared engines/mold AMZN uses:
//   • Executives & Board  → the shared makeManagement() mold (js/overviews/management.js)
//   • Ownership           → nvdaOwnBody(): KPI tiles + ewBoxes + capital-return note +
//                            the OLD Bloomberg 17-row insider table (live-price valued) +
//                            #dd-mgmt-slot (Fiscal.ai live table, auto-filled by companies.js)
//   • Governance & SBC    → nvdaGovBody(): tiles + 4 ewBoxes + SBC note → Bottom Line ▸ General
//   • Track Record        → nvdaTrackBody(): rating-colored .ov-clickable cards → ov-modal-back
//
// All CSS is global (css/overview.css) except the ported .ew-kpis/.ew-tile/.ew-box grid,
// injected once here. Brand vars are set on a wrapper so ov-*/ew-* resolve --brand/--brand-2.
// Ported from amzn.js (AMZN_MGMT 4901 · amznOwnBody 4965 · amznGovBody 4980 · amznTrackBody 4995
// · ewBoxes 3623 · ov-modal-back 5066 · wireModal 5264) and nvidia.js (LEADERS/OWNERSHIP/ownTable).

import { makeManagement } from './management.js';

var BRAND = '#76B900';   // NVIDIA green
var BRAND2 = '#1F8A70';  // deep teal-green complement (accents / "Full track record ›")

function esc(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function sec(title, inner){ return '<section class="ov-sec"><div class="ov-sec-h">'+esc(title)+'</div>'+inner+'</section>'; }

// ── ported .ew-kpis / .ew-tile / .ew-two / .ew-box CSS (amzn.js EW_CSS subset) — injected once ──
var EW_CSS='<style>'+
  '.nvda-mgmt .ew-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:2px 0 16px}'+
  '.nvda-mgmt .ew-tile{border:1px solid var(--bdr);border-top:3px solid var(--brand-2);border-radius:10px;padding:10px 12px;background:var(--card,#fff)}'+
  '.nvda-mgmt .ew-tv{font-size:19px;font-weight:800;color:var(--navy);font-variant-numeric:tabular-nums;letter-spacing:-.02em}'+
  '.nvda-mgmt .ew-tl{font-size:10px;color:var(--mu);font-weight:600;margin-top:3px;line-height:1.35}'+
  '.nvda-mgmt .ew-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:560px){.nvda-mgmt .ew-two{grid-template-columns:1fr}}'+
  '.nvda-mgmt .ew-box{border:1px solid var(--bdr);border-radius:10px;padding:12px 14px;background:var(--card,#fff)}'+
  '.nvda-mgmt .ew-box-h{font-size:13px;font-weight:800;color:var(--navy);display:flex;align-items:center;gap:8px;margin-bottom:5px}.nvda-mgmt .ew-box-i{font-size:18px}'+
  '.nvda-mgmt .ew-box-t{font-size:11.5px;color:var(--navy);line-height:1.5}'+
'</style>';
function ewTiles(arr){ return '<div class="ew-kpis">'+arr.map(function(k){ return '<div class="ew-tile"><div class="ew-tv">'+k[0]+'</div><div class="ew-tl">'+k[1]+'</div></div>'; }).join('')+'</div>'; }
function ewBoxes(arr){ return '<div class="ew-two"'+(arr.length<2?' style="grid-template-columns:1fr"':'')+'>'+arr.map(function(b){ return '<div class="ew-box"><div class="ew-box-h"><span class="ew-box-i">'+b[0]+'</span>'+b[1]+'</div><div class="ew-box-t">'+b[2]+'</div></div>'; }).join('')+'</div>'; }

// ═══ 1) Executives & Board — the shared makeManagement mold, populated with NVDA data ═══════════
var NVDA_MGMT = makeManagement({
  brand: BRAND,
  lede: "NVIDIA is <b>founder-led and deliberately flat</b>. Jensen Huang has run the company since co-founding it in 1993, with an unusually wide span of <b>~50–60 direct reports and no divisional general managers</b> — teams are organized by function (engineering, architecture, AI software, research), not by division. The named leaders below are the executive officers; tap any card for the fuller bio.",
  execs: [
    { id:'huang', lead:true, name:'Jensen Huang', title:'Founder, President & CEO', since:'CEO since 1993 · co-founder',
      line:'Co-founded NVIDIA in 1993 and has led it ever since — architect of the accelerated-computing and CUDA bet.',
      bio:"Co-founded NVIDIA in 1993 (with Chris Malachowsky and Curtis Priem) and has been President & CEO ever since — one of the longest-tenured founder-CEOs in tech. Architect of the company's bet on accelerated computing and the CUDA software platform, and its strategic and public face. Largest individual holder (~3.36%, ~812M shares) and insider chair of the board." },
    { id:'kress', name:'Colette Kress', title:'EVP & Chief Financial Officer', since:'CFO since 2013',
      line:'CFO since 2013 — owns finance, capital allocation and investor relations through the scale-up.',
      bio:"EVP & CFO since 2013. Leads finance, capital allocation and investor relations across NVIDIA's scale-up from a ~$4B to a $200B+ revenue company. The consistent voice of the guide through the data-center super-cycle; earlier CFO roles at Cisco and Microsoft's business divisions." },
    { id:'puri', name:'Jay Puri', title:'EVP, Worldwide Field Operations', since:'joined 2005',
      line:'Runs global sales and go-to-market field operations; with NVIDIA since 2005.',
      bio:"EVP, Worldwide Field Operations — runs global sales, business development and go-to-market across all regions and end markets. With NVIDIA since 2005; earlier senior roles at Sun Microsoft and Hewlett-Packard. Owns the customer relationships behind the data-center demand." },
    { id:'shoquist', name:'Debora Shoquist', title:'EVP, Operations', since:'joined 2007',
      line:'Leads global supply chain and manufacturing — central to navigating the AI supply crunch.',
      bio:"EVP, Operations — leads global supply chain, manufacturing operations and facilities. Central to navigating the AI supply crunch: securing TSMC CoWoS advanced-packaging capacity and HBM allocation, and orchestrating the Foxconn/Wistron/Quanta system build. Earlier operations leadership at JDS Uniphase, Coherent and HP." },
    { id:'teter', name:'Tim Teter', title:'EVP, General Counsel & Secretary', since:'joined 2017',
      line:"NVIDIA's chief legal officer — legal, intellectual property and compliance.",
      bio:"EVP, General Counsel & Secretary — oversees legal, intellectual property, compliance and government affairs, including the export-control regime around advanced-AI chips. Joined NVIDIA in 2017; previously a partner at Cooley LLP where he represented NVIDIA in major IP litigation." },
    { id:'malachowsky', name:'Chris Malachowsky', title:'Co-founder & NVIDIA Fellow', since:'co-founder 1993',
      line:'One of three co-founders and a long-time technical leader; NVIDIA Fellow.',
      bio:"One of NVIDIA's three co-founders (with Jensen Huang and Curtis Priem) and a long-time technical leader and NVIDIA Fellow. Helped define the early GPU architecture and engineering culture. Not a Section 16 insider filer today, but a foundational figure in the company's technical DNA." }
  ],
  board: [
    { name:'Jensen Huang', chair:true, dual:true, independent:false, role:'Founder, President & CEO — insider chair.' },
    { name:'Stephen Neal', independent:true, role:'Lead Independent Director · Chairman Emeritus, Cooley LLP.' },
    { name:'Mark A. Stevens', independent:true, role:'Managing Partner, S-Cubed Capital · long-time venture investor.' },
    { name:'Tench Coxe', independent:true, role:'Former Managing Director, Sutter Hill Ventures.' },
    { name:'Harvey C. Jones', independent:true, role:'Managing Partner, Square Wave Ventures · co-founder of Synopsys.' },
    { name:'A. Brooke Seawell', independent:true, role:'Venture Partner, New Enterprise Associates.' },
    { name:'Dawn Hudson', independent:true, role:'Former CMO, National Football League; former CEO, Pepsi-Cola NA.' },
    { name:'Persis Drell', independent:true, role:'Professor & former Provost, Stanford University (physics/engineering).' },
    { name:'Aarti Shah', independent:true, role:'Former SVP & Chief Information & Digital Officer, Eli Lilly.' },
    { name:'Melissa Lora', independent:true, role:'Former President, Taco Bell International.' },
    { name:'John Dabiri', independent:true, role:'Professor of Aeronautics & Mechanical Engineering, Caltech.' },
    { name:'Ellen Ochoa', independent:true, role:'Former Director, NASA Johnson Space Center; former astronaut.' },
    { name:'Robert Burgess', independent:true, role:'Former Chairman & CEO, Macromedia.' }
  ],
  boardNote:'13 directors — 12 independent, Jensen Huang the sole insider (chair) · Stephen Neal is Lead Independent Director. Full roster + live ownership sync in Pillars ▸ Management.',
  gov: [
    { k:'Share & voting', v:'1 vote / share', d:'Single common-stock class — no founder super-voting stock.' },
    { k:'Board', v:'13 dirs · 12 independent', d:'Jensen Huang the sole insider chair · Lead Independent Director (Stephen Neal).' },
    { k:'Founder stake', v:'Jensen Huang ~3.36%', d:'~812M shares — the largest individual holder; sells via 10b5-1 plans.' },
    { k:'Stock split', v:'10-for-1 (Jun 2024)', d:'Ten-for-one forward split effective June 2024; all figures post-split.' }
  ],
  foot:"Executive roster and titles per NVIDIA's official leadership page (nvidianews.com, 2026); board, committees and the single-class structure per NVIDIA's 2026 proxy (DEF 14A). Ownership and insider trades sync live in Pillars ▸ Management. Executive headshots © NVIDIA newsroom."
});

// ═══ 2) Ownership ═══════════════════════════════════════════════════════════════════════════════
// OLD Bloomberg 17-row insider/board ownership table (ported from nvidia.js OWNERSHIP + ownTable),
// live-price valued via mgValSpan. [name, role, shares, % out, latest Form 4 net change, date].
var NVDA_OWN = [
  ['Jensen Huang','Founder, President & CEO', 812004746, '3.36%', -45723, 'Jun 17, 2026'],
  ['Mark A. Stevens','Director', 31769633, '0.13%', 1211, 'Jun 25, 2026'],
  ['Tench Coxe','Director', 30581218, '0.13%', 1211, 'Jun 25, 2026'],
  ['Harvey C. Jones','Director', 7004898, '0.03%', 1211, 'Jun 25, 2026'],
  ['Colette Kress','EVP & CFO', 4851271, '0.02%', -40746, 'Jun 17, 2026'],
  ['Jay (Ajay) Puri','EVP, Worldwide Field Operations', 3665228, '0.02%', -36927, 'Jun 17, 2026'],
  ['Tim Teter','EVP, General Counsel', 3052096, '0.01%', -35742, 'Jun 17, 2026'],
  ['A. Brooke Seawell','Director', 2507818, '0.01%', 1211, 'Jun 25, 2026'],
  ['Debora Shoquist','EVP, Operations', 1946358, '0.01%', -35012, 'Jun 17, 2026'],
  ['Dawn Hudson','Director', 370098, '<0.01%', 1211, 'Jun 25, 2026'],
  ['Robert Burgess','Director', 202843, '<0.01%', 1799, 'Jun 26, 2025'],
  ['Stephen Neal','Lead Director', 170578, '<0.01%', 1211, 'Jun 25, 2026'],
  ['Persis Drell','Director', 142627, '<0.01%', -40000, 'Sep 19, 2025'],
  ['Aarti Shah','Director', 37218, '<0.01%', 1211, 'Jun 25, 2026'],
  ['Melissa Lora','Director', 16868, '<0.01%', 1211, 'Jun 25, 2026'],
  ['John Dabiri','Director', 15374, '<0.01%', 1211, 'Jun 25, 2026'],
  ['Ellen Ochoa','Director', 4968, '<0.01%', 1799, 'Jun 26, 2025'],
];
// Live-price valuation (ported from nvidia.js mgUsd/mgValSpan/mgFillValues).
var _mgPrice = null;
function mgUsd(v){
  if(v>=1e9) return '$'+(v/1e9).toFixed(2)+'B';
  if(v>=1e6) return '$'+(v/1e6).toFixed(1)+'M';
  return '$'+Math.round(v).toLocaleString('en-US');
}
function mgValSpan(shares){
  return '<span class="mg-val" data-sh="'+shares+'">'+(_mgPrice!=null?mgUsd(shares*_mgPrice):'…')+'</span>';
}
function ownTable(){
  function sh(n){ return (n/1e6).toFixed(2)+'M'; }
  function chg(n){ return '<span class="'+(n>=0?'own-up':'own-dn')+'">'+(n>=0?'+':'−')+Math.abs(n).toLocaleString('en-US')+'</span>'; }
  var total=NVDA_OWN.reduce(function(a,o){ return a+o[2]; },0);
  var body=NVDA_OWN.map(function(o){
    return '<tr><td class="ov-td-name">'+esc(o[0])+'</td><td>'+esc(o[1])+'</td>'+
      '<td style="text-align:right">'+sh(o[2])+'</td><td style="text-align:right">'+esc(o[3])+'</td>'+
      '<td style="text-align:right">'+mgValSpan(o[2])+'</td>'+
      '<td>'+chg(o[4])+' · '+esc(o[5])+'</td></tr>';
  }).join('');
  var tot='<tr class="own-total"><td class="ov-td-name">Total · insiders &amp; directors</td><td></td>'+
    '<td style="text-align:right">'+sh(total)+'</td><td style="text-align:right">~3.5%</td>'+
    '<td style="text-align:right">'+mgValSpan(total)+'</td><td></td></tr>';
  return '<div style="overflow-x:auto"><table class="ov-table"><thead><tr><th>Name</th><th>Role</th>'+
    '<th style="text-align:right">Shares</th><th style="text-align:right">% out</th>'+
    '<th style="text-align:right">Value (live)</th><th>Latest Form 4</th></tr></thead>'+
    '<tbody>'+body+tot+'</tbody></table></div>';
}
function nvdaOwnBody(){
  var h='<p class="ov-lede"><b>One share, one vote.</b> NVIDIA has a <b>single common-stock class</b> — no founder super-voting stock. Founder-CEO <b>Jensen Huang is the largest individual holder (~3.36%, ~812M shares)</b>, but his influence flows from the stake and the chair, not from a special class. The float is otherwise overwhelmingly institutional.</p>';
  h+=ewTiles([['~3.36%','Jensen Huang — largest individual holder'],['1 class','one share, one vote'],['SBC','main source of dilution'],['+$80B','buyback authorized (2025)']]);
  h+='<div class="ov-sec-h">Who owns NVIDIA</div>';
  h+=ewBoxes([
    ['👤','Founder','Jensen Huang holds ~3.36% (~812M shares) as insider chair — the largest single holder. He sells regularly under pre-set <b>10b5-1</b> plans, so the stake trends down over time even as it stays the largest; the small board positions grow via routine grants / RSU vesting.'],
    ['🏦','Institutions','The float is overwhelmingly institutional; the largest holders are the index-fund complexes — <b>Vanguard, BlackRock and State Street</b> — whose stakes track passive flows, not an active view on NVIDIA.']
  ]);
  h+='<div class="ov-sec-h" style="margin-top:16px">Capital returned to shareholders</div>';
  h+='<div class="ov-fynote">NVIDIA returns cash <b>mainly through buybacks, not dividends</b>. the quarterly dividend was raised 25× in Q1 FY2027 to <b>$0.25/share</b> (from $0.01, Jensen correcting the $0.20 print live on the call) — still small next to FCF; the board approved an additional <b>$80B</b> repurchase authorization (on top of $39B remaining), and the company has been returning roughly <b>~50% of free cash flow</b> to shareholders (Q1 FY2027 call). Buybacks largely offset SBC dilution — the opposite of the AMZN case.</div>';
  h+='<div class="ov-sec-h" style="margin-top:18px">Insider &amp; board ownership</div>';
  h+=ownTable();
  h+='<div class="ov-sec-h" style="margin-top:18px">Executives &amp; insider activity — live from Fiscal.ai</div>';
  h+='<div id="dd-mgmt-slot"></div>';   // filled by companies.js (same live table as Pillars ▸ Management)
  h+='<div class="ov-foot">The insider &amp; board table is a Bloomberg holdings export (NVDA insiders &amp; directors), positions as of the latest Form 4 filings (mostly June 2026); "Value (live)" = shares × the live NVDA price (Massive), requires a logged-in session. Large holders\' sales are typically pre-arranged 10b5-1 plans; small positive changes are routine grants / RSU vesting. The Fiscal.ai table above syncs live (also in Pillars ▸ Management).</div>';
  return h;
}

// ═══ 3) Governance & SBC ════════════════════════════════════════════════════════════════════════
function nvdaGovBody(){
  var h='<p class="ov-lede"><b>Clean, conventional governance.</b> Single-class stock, a 13-director board with 12 independents and a Lead Independent Director, standing committees and an annual say-on-pay vote — governance risk is low by construction. The founder\'s influence comes from tenure and the ~3.36% stake, not super-voting shares.</p>';
  h+=ewTiles([['1 vote / sh','single share class'],['13 dirs','12 independent'],['SBC','offset by buybacks'],['10-for-1','stock split · Jun 2024']]);
  h+=ewBoxes([
    ['🗳️','Single share class','One share, one vote — no founder super-voting stock. The opposite of META/GOOGL dual-class.'],
    ['⚖️','Independent-majority board','13 directors, 12 independent; Jensen Huang the sole insider chair, with a Lead Independent Director (Stephen Neal).'],
    ['🏛️','Standing committees','Audit, Compensation, and Nominating & Corporate Governance — each fully independent under the 2026 proxy.'],
    ['📈','SBC, offset by buybacks','Stock-based comp is the main source of share-count growth, but — unlike AMZN — NVIDIA\'s large buyback program broadly offsets the dilution.']
  ]);
  h+='<div class="ov-fynote">The full <b>by-line, actuals-vs-consensus SBC chart lives in Bottom Line ▸ General</b> (where the expenses are) — this tab intentionally carries <b>no canvas</b>. In short: SBC runs at a modest share of revenue and dilutes low-single-digits per year, largely neutralized by the repurchase program.</div>';
  h+='<div class="ov-foot">Governance per NVIDIA\'s 2026 proxy (DEF 14A); SBC per the FY2026 10-K / BBG. See Bottom Line ▸ General for the SBC chart.</div>';
  return h;
}

// ═══ 4) Track Record — per-leader scorecard, color-rated with a tap-for-detail modal ════════════
var NVDA_TRK_RATE={ green:{c:'#06965A',bg:'rgba(6,150,90,0.09)',bd:'rgba(6,150,90,0.34)',l:'Value creator'},
  amber:{c:'#B7791F',bg:'rgba(183,121,31,0.10)',bd:'rgba(183,121,31,0.34)',l:'Mixed / unproven'} };
var NVDA_TRACK=[
  { id:'huang', n:'Jensen Huang', role:'Founder, President & CEO', since:'1993', rate:'green',
    nvda:'Built NVIDIA from a 1993 startup into the accelerated-computing standard — the CUDA software moat, the data-center pivot, and the Hopper→Blackwell→Rubin cadence that took revenue from ~$27B (FY23) to a $200B+ run-rate at record margins.',
    prior:'33 years as founder-CEO; no outside executive record — his track record <i>is</i> the NVIDIA record.',
    detail:'<p><b>At NVIDIA (CEO since founding, 1993).</b> Made the multi-decade bet on programmable GPUs and the CUDA platform, then on accelerated computing for AI — turning NVIDIA into the compute layer of the AI build-out. Drove the data-center transition (now the vast majority of revenue), the annual product cadence, and the systems/networking (NVLink, InfiniBand/Spectrum, full-rack) expansion.</p>'+
      '<p><b>Net read — value creator (green).</b> One of the great founder-CEO records in technology. Open questions are macro, not managerial: customer concentration in a handful of hyperscalers, the durability of the AI capex cycle, and export-control exposure.</p>' },
  { id:'kress', n:'Colette Kress', role:'EVP & CFO', since:'2013', rate:'green',
    nvda:'CFO through the entire scale-up — steered capital allocation, the 10-for-1 split, the $80B+ buyback program and the guide across the super-cycle, keeping gross margin in the low-70s while revenue multiplied.',
    prior:'Prior CFO roles at Cisco (services) and Microsoft\'s business divisions — a seasoned large-cap operator before NVIDIA.',
    detail:'<p><b>At NVIDIA (CFO since 2013).</b> Owns finance, capital allocation and IR across the move from ~$4B to a $200B+ revenue company. Managed the supply-driven guide, the shift to a capital-return posture (dividend, $80B+ buybacks, ~50% of FCF), and the 2024 ten-for-one split.</p>'+
      '<p><b>Net read — value creator (green).</b> Credibility and continuity through an unprecedented ramp; the standing task she owns is defending margin and the demand guide if the AI capex cycle cools.</p>' },
  { id:'puri', n:'Jay Puri', role:'EVP, Worldwide Field Operations', since:'2005', rate:'green',
    nvda:'Runs global sales and go-to-market — owns the hyperscaler, sovereign-AI and enterprise relationships that convert the supply-constrained backlog into booked demand across every region.',
    prior:'20 years inside NVIDIA; earlier senior roles at Sun Microsystems and Hewlett-Packard.',
    detail:'<p><b>At NVIDIA (since 2005).</b> Built and leads the worldwide field organization — sales, business development and go-to-market across cloud, enterprise, sovereign and vertical markets. The commercial engine behind the demand that outstrips supply.</p>'+
      '<p><b>Net read — value creator (green).</b> A long, credible commercial record; the open item is the growing revenue concentration in a small set of very large customers.</p>' },
  { id:'shoquist', n:'Debora Shoquist', role:'EVP, Operations', since:'2007', rate:'green',
    nvda:'Leads supply chain and manufacturing — the operator navigating the AI supply crunch: securing TSMC CoWoS advanced-packaging capacity, HBM allocation, and the Foxconn/Wistron/Quanta system build to lift shipments each quarter.',
    prior:'Operations leadership at JDS Uniphase, Coherent and Hewlett-Packard before NVIDIA.',
    detail:'<p><b>At NVIDIA (since 2007).</b> Owns global supply chain, manufacturing operations and facilities. Central to the ramp: the CoWoS packaging and HBM supply that gate output, and the contract-manufacturing network (Foxconn, Wistron, Quanta) that assembles the systems.</p>'+
      '<p><b>Net read — value creator (green).</b> Delivered sequential supply increases through the tightest capacity market in the industry; the standing risk (concentration on TSMC/Taiwan) is structural, not a management failing.</p>' },
  { id:'teter', n:'Tim Teter', role:'EVP, General Counsel & Secretary', since:'2017', rate:'green',
    nvda:'Chief legal officer through NVIDIA\'s highest-scrutiny era — export controls on advanced-AI chips, the terminated Arm acquisition, antitrust attention and the IP portfolio.',
    prior:'Partner at Cooley LLP, where he led major IP litigation for NVIDIA before joining.',
    detail:'<p><b>At NVIDIA (GC since 2017).</b> Leads legal, IP, compliance and government affairs — steering the U.S./China export-control regime around advanced-AI GPUs, the abandoned $40B Arm deal (2022), and rising regulatory attention as NVIDIA became a strategic asset.</p>'+
      '<p><b>Net read — value creator (green).</b> Seasoned through the hardest regulatory period in the company\'s history; the export-control docket he manages is the standing risk, not his handling of it.</p>' }
];
function nvdaTrackBody(){
  var legend=Object.keys(NVDA_TRK_RATE).map(function(k){ var r=NVDA_TRK_RATE[k]; return '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:var(--navy)"><span style="width:10px;height:10px;border-radius:50%;background:'+r.c+'"></span>'+r.l+'</span>'; }).join('');
  var cards=NVDA_TRACK.map(function(m){ var r=NVDA_TRK_RATE[m.rate];
    return '<div class="ov-clickable" data-detail="exec:'+m.id+'" style="border:1px solid '+r.bd+';border-left:4px solid '+r.c+';background:'+r.bg+';border-radius:11px;padding:13px 15px;cursor:pointer">'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><div style="font-size:13.5px;font-weight:800;color:var(--navy)">'+esc(m.n)+'</div><div style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:'+r.c+'">'+r.l+'</div></div>'+
      '<div style="font-size:11px;color:var(--mu);font-weight:600;margin:1px 0 8px">'+esc(m.role)+' · at NVIDIA since '+esc(m.since)+'</div>'+
      '<div style="font-size:11.5px;color:var(--navy);line-height:1.5;margin-bottom:6px"><b style="color:'+r.c+'">At NVIDIA:</b> '+m.nvda+'</div>'+
      '<div style="font-size:11.5px;color:var(--navy);line-height:1.5"><b style="color:var(--mu)">Context:</b> '+m.prior+'</div>'+
      '<div class="ov-more" style="margin-top:7px;font-size:10.5px;font-weight:800;color:'+BRAND2+'">Full track record ›</div></div>';
  }).join('');
  var h='<p class="ov-lede">The people running NVIDIA today, rated on <b>what they have actually built</b>. Color = the net read; <b>tap a card</b> for the full history. (Management only — board and ownership are separate tabs.)</p>';
  h+='<div style="display:flex;gap:14px;flex-wrap:wrap;margin:0 0 12px">'+legend+'</div>';
  h+='<div style="display:grid;grid-template-columns:1fr 1fr;gap:11px">'+cards+'</div>';
  h+='<div class="ov-callout" style="margin-top:14px"><b>The bench, in one line:</b> a founder-led team that turned a graphics company into the compute layer of AI — its open bet is not execution but durability: the AI capex cycle, hyperscaler concentration and export controls.</div>';
  h+='<div class="ov-foot">Roster and roles per NVIDIA IR (mid-2026); records from earnings calls and disclosures. Ratings are an editorial read, not a Summit output.</div>';
  return h;
}

// ═══ body() — the 4 sub-tab shell ═══════════════════════════════════════════════════════════════
function body(){
  var h=EW_CSS+'<div class="nvda-mgmt" style="--brand:'+BRAND+';--brand-2:'+BRAND2+'">';
  h+='<div class="ovt-subtabs">'+
      '<button type="button" class="ovt-subtab active" data-ovst="team">Executives &amp; Board</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="ownership">Ownership</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="governance">Governance &amp; SBC</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="track">Track Record</button>'+
    '</div>';
  h+='<div class="ovt-subpane" data-ovst="team">'+NVDA_MGMT.body()+'</div>'+
     '<div class="ovt-subpane" data-ovst="ownership" hidden>'+nvdaOwnBody()+'</div>'+
     '<div class="ovt-subpane" data-ovst="governance" hidden>'+nvdaGovBody()+'</div>'+
     '<div class="ovt-subpane" data-ovst="track" hidden>'+nvdaTrackBody()+'</div>';
  // ov-modal-back skeleton for the Track Record cards (scoped to this module).
  h+='<div class="ov-modal-back" id="nvdaMgmtModalBack" hidden><div class="ov-modal" role="dialog" aria-modal="true">'+
    '<button class="ov-modal-x" id="nvdaMgmtModalX" aria-label="Close">×</button>'+
    '<div class="ov-modal-t" id="nvdaMgmtModalT"></div><div class="ov-modal-b" id="nvdaMgmtModalB"></div></div></div>';
  h+='</div>';
  return h;
}

// ═══ Wiring ═════════════════════════════════════════════════════════════════════════════════════
// Track-record modal — resolves data-detail="exec:<id>" from NVDA_TRACK.
function wireModal(root){
  var back=root.querySelector('#nvdaMgmtModalBack'), mT=root.querySelector('#nvdaMgmtModalT'), mB=root.querySelector('#nvdaMgmtModalB'); if(!back) return;
  function onEsc(e){ if(e.key==='Escape') closeM(); }
  function openM(t,b){ mT.innerHTML=t; mB.innerHTML=b; back.hidden=false; requestAnimationFrame(function(){ back.classList.add('on'); }); document.addEventListener('keydown', onEsc); }
  function closeM(){ back.classList.remove('on'); document.removeEventListener('keydown', onEsc); setTimeout(function(){ back.hidden=true; }, 180); }
  root.querySelector('#nvdaMgmtModalX').onclick=closeM; back.onclick=function(e){ if(e.target===back) closeM(); };
  function resolve(key){
    var p=key.split(':'), kind=p[0], id=p.slice(1).join(':');
    if(kind==='exec'){ var ex=NVDA_TRACK.filter(function(x){ return x.id===id; })[0]; return ex?{t:esc(ex.n)+' <span style="font-weight:600;color:var(--mu)">'+esc(ex.role)+'</span>',h:ex.detail}:null; }
    return null;
  }
  root.querySelectorAll('[data-detail]').forEach(function(el){ el.style.cursor='pointer'; });
  if(!root._nvdaMgmtDetailWired){
    root._nvdaMgmtDetailWired=true;
    root.addEventListener('click', function(e){ var el=e.target.closest?e.target.closest('[data-detail]'):null; if(!el||!root.contains(el)) return; var d=resolve(el.getAttribute('data-detail')); if(d) openM(d.t,d.h); });
  }
}
// Live NVDA price → fill every .mg-val cell in the ownership table (scoped to paneRoot).
function mgFillValues(root){
  if(_mgPrice==null) return;
  root.querySelectorAll('.mg-val').forEach(function(s){ var sh=parseFloat(s.getAttribute('data-sh')); if(isFinite(sh)) s.textContent=mgUsd(sh*_mgPrice); });
}
function mgClearValues(root){ root.querySelectorAll('.mg-val').forEach(function(s){ if(s.textContent==='…') s.textContent='—'; }); }
function fillLivePrice(root){
  if(_mgPrice!=null){ mgFillValues(root); return; }
  import('../api.js').then(function(api){ return api.liveQuote('NVDA'); }).then(function(res){
    var q=res&&res.data; if(!q||q.price==null){ mgClearValues(root); return; }
    _mgPrice=q.price; mgFillValues(root);
  }).catch(function(){ mgClearValues(root); });
}

function init(paneRoot){
  if(!paneRoot) return;
  // 1) Executives & Board CV modal (the shared makeManagement mold).
  NVDA_MGMT.init(paneRoot);
  // 2) Pane-scoped sub-tab switching (idempotent).
  if(!paneRoot._nvdaMgmtSubsWired){
    paneRoot._nvdaMgmtSubsWired=true;
    var subs=paneRoot.querySelectorAll(':scope > .nvda-mgmt > .ovt-subtabs > .ovt-subtab, .nvda-mgmt > .ovt-subtabs > .ovt-subtab');
    subs.forEach(function(btn){ btn.onclick=function(){
      var wrap=btn.closest('.nvda-mgmt'); if(!wrap) return;
      var key=btn.getAttribute('data-ovst');
      wrap.querySelectorAll(':scope > .ovt-subtabs > .ovt-subtab').forEach(function(b){ b.classList.toggle('active', b===btn); });
      wrap.querySelectorAll(':scope > .ovt-subpane').forEach(function(p){ p.hidden=(p.getAttribute('data-ovst')!==key); });
    }; });
  }
  // 3) Track-record modal + live-price ownership fill.
  wireModal(paneRoot);
  fillLivePrice(paneRoot);
}

export var nvdaManagement = { body: body, init: init };
