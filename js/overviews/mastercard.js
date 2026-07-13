// overviews/mastercard.js — Mastercard Inc. (NYSE: MA), NEW FORMAT.
// Two SIBLING profile tabs (OVERVIEW_CONVENTIONS §1): a standardized Overview (the 7-block
// hook) + a Deep Dive (the uber/lyft/cart 5-tab spine). Golden Rule #1: the entire prior
// bespoke Overview was NOT deleted — every piece was MOVED into the most relevant Deep Dive
// pane (four-party model → Bottom Line ▸ Suppliers; fee lines/rebates → Bottom Line ▸ Unit
// Economics; VAS + M&A → Top Line/Evolution; litigation/tailwinds → Valuation; financials →
// Valuation ▸ Balance Sheet). Convention: esc() leaves & LITERAL (never HTML-encode & in source).
//
// Live data (companies.js fills these; MA is a Fiscal.ai-covered ticker):
//   · Market cap / peer bubbles → api.liveQuote (Massive), per ticker, no hardcoding.
//   · Analyst Ratings → #dd-val-slot ; Ownership & insiders → #dd-mgmt-slot.
// Financials seeded from the Summit DCF (snapshot 2026-06-25); forward years labeled estimate.

import { makeManagement } from './management.js';

function esc(s){ if(s==null) return ''; return String(s).replace(/&/g,'&').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ─── Chart palette / formatters ──────────────────────────────────────────────
var C_AXIS='#8A93A0', C_GRID='#EEF2F7';
var MA_RED='#CF0A2C', MA_ORANGE='#FF9F00', MA_STEEL='#7A8699', MA_GREEN='#16A34A';
var fT  = function(v){ return '$'+(Math.round(v*100)/100)+'T'; };
var fBn = function(v){ return (Math.round(v*10)/10)+'B'; };
function _hexRgba(hex, a){ var h=hex.replace('#',''); return 'rgba('+parseInt(h.substr(0,2),16)+','+parseInt(h.substr(2,2),16)+','+parseInt(h.substr(4,2),16)+','+a+')'; }

// ─── Render helpers (shared across Overview + Deep Dive) ─────────────────────
function sec(title, inner){ return '<section class="ov-sec"><div class="ov-sec-h">'+esc(title)+'</div>'+inner+'</section>'; }
function bullets(arr){ return '<ul class="ov-bullets">'+arr.map(function(b){return '<li>'+b+'</li>';}).join('')+'</ul>'; }
function collapsible(title, inner, open){
  return '<div class="ov-collap'+(open?' open':'')+'">'+
    '<button type="button" class="ov-collap-h"><span class="ov-collap-ic">'+(open?'▾':'▸')+'</span>'+esc(title)+'</button>'+
    '<div class="ov-collap-b"'+(open?'':' hidden')+'>'+inner+'</div></div>';
}
function mbars(arr){ return '<div class="ov-mbars">'+arr.map(function(r){
  return '<div class="ov-mbar"><div class="ov-mbar-l">'+esc(r[0])+'</div>'+
    '<div class="ov-mbar-track"><div class="ov-mbar-fill" style="width:'+r[1]+'%;background:'+r[3]+';">'+esc(r[2])+'</div></div>'+
    '<div class="ov-mbar-v">'+r[1]+'%</div></div>';
}).join('')+'</div>'; }
function placeholder(title, note){
  return '<div style="border:1px dashed var(--bdr);border-radius:12px;padding:16px 18px;margin:10px 0;background:linear-gradient(180deg,rgba(232,160,12,0.045),transparent)">'+
    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#B7791F;background:rgba(232,160,12,0.14);border-radius:10px;padding:2px 9px">To build</span><span style="font-size:13.5px;font-weight:800;color:var(--navy)">'+esc(title)+'</span></div>'+
    '<div style="font-size:12px;color:var(--mu);line-height:1.55">'+note+'</div></div>';
}

// ═══════════════════════════════════════════════════════════════════════════
//  STANDARDIZED OVERVIEW DATA (the 7 blocks — OVERVIEW_CONVENTIONS §4)
// ═══════════════════════════════════════════════════════════════════════════

// ── Block 1 — Key Facts (exactly 10, 5×2). Market cap cell is live (#maMc). ──
var MA_FACTS=[
  ['Listing','NYSE: MA'],
  ['HQ','Purchase, NY, USA'],
  ['Incorporation','Delaware'],
  ['SEC filer','Domestic (10-K/10-Q/8-K)'],
  ['Founded','1966 — Interbank'],
  ['IPO','May 2006 · $39.00'],
  ['CEO','Michael Miebach · since Jan 2021'],
  ['Employees','~35,000 · 2025'],
  ['Dividend','Payer (+ buybacks)'],
  ['Market cap','~$500B · Jul 2026'],
];
function stdKeyFacts(){
  return '<div class="stdkf">'+MA_FACTS.slice(0,10).map(function(p){
    var v=p[0]==='Market cap' ? '<span id="maMc">'+esc(p[1])+'</span>' : esc(p[1]);
    return '<div class="stdkf-cell"><div class="stdkf-k">'+esc(p[0])+'</div><div class="stdkf-v">'+v+'</div></div>'; }).join('')+'</div>';
}

// ── Block 2 — Description (high-level only; NON-redundant with the blocks below). ──
var MA_LEDE="Mastercard is a global payments-technology company. It operates one of the world's two large open-loop card networks — the rails that authorize, clear and settle electronic payments between banks across 210+ countries — and, layered on top, a fast-growing set of value-added services (security, identity, data, consulting, open banking and real-time payments). It does not issue cards, lend, or set interchange, and takes no credit risk; it earns a thin fee on the volume and transactions that flow over its network, plus the services sold alongside.";

// ── Block 3 — the 4-quadrant (each cell ≤ ~30 words). ──
var MA_BIZ=[
  ['What it sells','Access to a global card-payment network (authorization, clearing, settlement) plus value-added services — fraud/security, identity, data & analytics, consulting, open banking and real-time-payment infrastructure.'],
  ['Who buys it','~14,000 financial-institution customers (issuing & acquiring banks), plus merchants, fintechs, governments and processors that connect to the rails and buy the services.'],
  ['How it earns','A thin fee on network volume & transactions (net of incentives) + services fees. FY2025 net revenue $32.8B — ~58% Payment Network, ~42% Value-Added Services.'],
  ['The edge','A global two-sided network with deep acceptance and scale economics, a services layer that is often network-agnostic, and a business that carries no credit risk.'],
];
function stdFourQuad(){
  return '<div class="q2">'+MA_BIZ.map(function(b){ return '<div class="q2-cell"><div class="q2-k">'+esc(b[0])+'</div><div class="q2-v">'+b[1]+'</div></div>'; }).join('')+'</div>';
}

// ── Block 4 — How it makes money. Segments (2 reporting pillars) ⇄ Geography (US vs
// International) — both are the SAME FY2025 net revenue seen two ways (revenue cross-check). ──
var MA_REV_SEG=[['Payment Network',58,'$19.0B',MA_STEEL],['Value-Added Services & Solutions',42,'$13.8B',MA_ORANGE]];
// Geography: Mastercard reports US vs the rest of the world; ~2/3 of net revenue is international.
var MA_REV_GEO=[['International (ex-US)',67,'~$22.0B',MA_RED],['United States',33,'~$10.8B',MA_STEEL]];
var MA_MM_STATS=[['Net revenue','$32,791M'],['Gross Dollar Volume','~$10.6T'],['Switched txns','~$160B/yr'],['Credentials','~3.5B'],['VAS % of net rev','~42%'],['Cross-border','high-yield']];
var MA_SEG_DEF=[
  { seg:'Payment Network',
    desc:'The core switching business — the rails that authorize, clear and settle a card payment between the issuing bank and the acquiring bank. It earns three ways: domestic assessments (a few basis points of domestic purchase volume), cross-border fees (where the card country differs from the merchant country — the highest-yield line), and transaction processing (a near-fixed fee per switched transaction). Rebates & incentives paid to customers net against these.',
    econ:[['Net revenue','~$19.0B (~58% of total)'],['GDV','~$10.6T'],['Cross-border growth','+13% lc (Q1 2026)'],['Switched-txn growth','~+9% (Q1 2026)']] },
  { seg:'Value-Added Services & Solutions',
    desc:'Everything sold on top of the rails: fraud & cyber security, digital identity, data & analytics, consulting, loyalty/personalization, open banking and real-time / account-to-account payment infrastructure. Much of it is network-agnostic — it earns on non-Mastercard volume too — and it is more recurring and higher-margin than network fees, which is why it is the main growth driver.',
    econ:[['Net revenue','~$13.8B (~42% of total)'],['Growth','+22% YoY (Q1 2026)'],['Mix','vs ~27% services at the larger peer'],['Character','recurring, network-agnostic']] },
];
var MA_GEO_DEF=[
  { seg:'International (ex-US)',
    desc:'Volume and services on credentials issued outside the United States — the larger share of net revenue and the structurally faster-growing side, because cash is still a big share of spend in many markets (a long cash-to-digital runway) and because cross-border travel and e-commerce concentrate here.',
    econ:[['Net revenue','~$22.0B (~2/3 of total)'],['Driver','cash-to-digital + cross-border'],['Note','"International" = issuance geography, distinct from cross-border']] },
  { seg:'United States',
    desc:'Volume and services on US-issued credentials — a more mature, more debit-heavy market than the international book. Still large and growing, but with a shorter cash-conversion runway than the international side.',
    econ:[['Net revenue','~$10.8B (~1/3 of total)'],['Character','mature, more debit-weighted']] },
];
function stdMoneyMap(){
  var seg=mbars(MA_REV_SEG);
  var geo=mbars(MA_REV_GEO);
  var defBlock=function(defs, econLabel){ return '<div class="mm-defs acc-list" style="margin-top:12px">'+defs.map(function(s){
    var econ='<div class="acc" style="margin-top:8px"><button type="button" class="acc-h">'+esc(econLabel)+' <span class="acc-x">+</span></button><div class="acc-b" hidden>'+s.econ.map(function(r){ return '<div class="ov-row"><div class="ov-row-k">'+esc(r[0])+'</div><div class="ov-row-v">'+esc(r[1])+'</div></div>'; }).join('')+'</div></div>';
    return '<div class="acc"><button type="button" class="acc-h">What is "'+esc(s.seg)+'"?<span class="acc-x">+</span></button><div class="acc-b" hidden><div class="famd">'+esc(s.desc)+'</div>'+econ+'</div></div>';
  }).join('')+'</div>'; };
  var h='<div class="mm-tog"><button type="button" class="mm-pill active" data-mm="seg">Segments</button><button type="button" class="mm-pill" data-mm="geo">Geography</button></div>';
  h+='<div class="mm-view" data-mm="seg">'+seg+defBlock(MA_SEG_DEF,'Segment economics (as-of Q1 2026 / FY2025)')+'</div>';
  h+='<div class="mm-view" data-mm="geo" hidden>'+geo+defBlock(MA_GEO_DEF,'Detail')+'</div>';
  h+='<div class="mm-stats">'+MA_MM_STATS.map(function(s){ return '<div class="mm-stat"><div class="mm-stat-v">'+esc(s[1])+'</div><div class="mm-stat-l">'+esc(s[0])+'</div></div>'; }).join('')+'</div>';
  h+='<div class="ov-diagram-cap" style="margin-top:10px">Cross-check: Payment Network ~$19.0B + Value-Added Services ~$13.8B = <b>~$32.8B</b> net revenue ✓ (ties to FY2025 reported); the Geography view (International ~$22.0B + US ~$10.8B) is the <b>same total seen two ways</b>. <span class="ave-subh-note">Net revenue = gross revenue minus rebates & incentives paid to customers. Segment/geography splits from Mastercard filings; "lc" = local-currency. Source: Mastercard FY2025 10-K & Q1 2026 results.</span></div>';
  return h;
}

// ── Block 5 — Products (two-tier): family card → pop-up → specific items. ──
var MA_PROD_GROUPS=[
  { seg:'Payment Network', families:[
    { ic:'💳', fam:'Consumer credit & debit', d:'The core branded card products.', items:[
      ['Standard / World / World Elite','A premium ladder of consumer credit products; higher tiers skew to affluent, higher-spend and cross-border cardholders.'],
      ['World Legend','The ultra-high-net-worth top of the ladder.'],
      ['Debit & Maestro','Debit and the international Maestro brand — the everyday, volume-heavy rails.'],
    ]},
    { ic:'🌐', fam:'Cross-border & processing', d:'The highest-yield and per-transaction rails.', items:[
      ['Cross-border','Fees where card country ≠ merchant country (travel + cross-border e-commerce) — a premium rate plus FX, the highest-yield line.'],
      ['Transaction switching','Authorize / clear / settle — a near-fixed fee per switched transaction, resilient to ticket size.'],
    ]},
    { ic:'🏢', fam:'Commercial & new flows', d:'Beyond consumer cards.', items:[
      ['Commercial / B2B','Corporate cards, virtual cards and B2B payment flows.'],
      ['Disbursements & remittances','Mastercard Send and push-payment rails for payouts and person-to-person transfers.'],
    ]},
  ]},
  { seg:'Value-Added Services & Solutions', families:[
    { ic:'🛡️', fam:'Security & identity', d:'Fraud, cyber and identity — the largest VAS family.', items:[
      ['Decision Intelligence','Real-time AI fraud scoring on transactions.'],
      ['Ekata','Digital identity verification ($850M, 2021).'],
      ['RiskRecon','Third-party cyber-risk ratings (2020).'],
      ['Recorded Future','Threat intelligence — the largest deal ($2.65B, 2024); a step into enterprise cyber.'],
      ['Tokenization','Replaces card numbers with tokens; ~40% of transactions tokenized.'],
    ]},
    { ic:'📊', fam:'Data & Services / Consulting', d:'Analytics, advisory, loyalty.', items:[
      ['Mastercard Advisors','Consulting + analytics across the client base.'],
      ['Test & Learn (APT)','Business-experimentation analytics (~$600M, 2015).'],
      ['Dynamic Yield','AI personalization (from McDonald\'s, 2022).'],
      ['Loyalty & marketing','Rewards programs and campaign tools.'],
    ]},
    { ic:'🏦', fam:'Open banking & real-time', d:'Account data + non-card rails.', items:[
      ['Finicity','US open-banking / financial-data APIs ($825M, 2020).'],
      ['Aiia','European open-banking platform (2021).'],
      ['Vocalink','Runs the UK\'s Faster Payments & BACS (~£700M+, 2017).'],
      ['Nets A2A','European account-to-account / clearing assets (~€2.85B, 2021).'],
    ]},
    { ic:'📲', fam:'Digital enablement', d:'Tokens & smoother checkout.', items:[
      ['Mastercard Token Service','Network tokens for cards-on-file and wallets.'],
      ['Click to Pay','Streamlined, standardized online checkout.'],
    ]},
  ]},
];
function stdProducts(){
  return MA_PROD_GROUPS.map(function(g,gi){
    return '<div class="stdp-group"><div class="stdp-seg">'+esc(g.seg)+'</div><div class="stdp">'+
      g.families.map(function(f,fi){
        return '<div class="stdp-card ov-clickable" data-detail="fam:'+gi+'-'+fi+'"><div class="stdp-ic">'+f.ic+'</div>'+
          '<div class="stdp-n">'+esc(f.fam)+'</div><div class="stdp-d">'+esc(f.d)+'</div><div class="stdp-more">See products ›</div></div>';
      }).join('')+'</div></div>';
  }).join('');
}

// ── Block 6 — Competitor scatter (DYNAMIC). X = valuation multiple, Y = revenue growth,
// bubble = LIVE market cap (api.liveQuote). Multiple EV/EBITDA ⇄ P/E; basis Trailing ⇄
// Forward (default Forward). Peers add/removable by ticker; chip × deletes immediately.
// ⚠ Multiples & growth are web-sourced approximations (mid-2026); market caps are live. ──
var MA_PEERS=[
  { tk:'MA', n:'Mastercard', evT:33, evF:28, peT:38, peF:31, gt:14, gf:13, mc:500, hl:true, why:'The #2 global open-loop network — richly valued on a thin-fee, no-credit-risk model, a larger (~42%) value-added-services mix than Visa, and a more international / cross-border tilt. Bears interchange litigation directly (no escrow shield).' },
  { tk:'V',  n:'Visa',      evT:28, evF:24, peT:33, peF:27, gt:11, gf:11, mc:640, why:'The larger open-loop network — bigger by volume and acceptance, slightly cheaper on multiples, a smaller services mix (~27%), and a Class-B litigation-escrow shield Mastercard lacks.' },
  { tk:'AXP', n:'Amex',     evT:null, evF:null, peT:20, peF:17, gt:9, gf:9, mc:210, why:'Closed-loop — it issues and lends, so revenue includes net interest income and EV/EBITDA is not comparable (it carries credit risk). Shown on P/E only; a premium, affluent, spend-centric model.' },
  { tk:'PYPL', n:'PayPal',  evT:12, evF:11, peT:16, peF:14, gt:8, gf:9, mc:70, why:'A digital-wallet / account-to-account player — a different rail that partly competes with cards; much cheaper on multiples, reflecting slower growth and a more contested moat.' },
];
var MA_SC={ type:'ev', basis:'f', peers:null };
function maScReset(){ MA_SC.peers=MA_PEERS.map(function(p){ var o={}; for(var k in p) o[k]=p[k]; o.on=true; return o; }); }
function maScMult(p){ if(MA_SC.type==='ev') return MA_SC.basis==='f'?p.evF:p.evT; return MA_SC.basis==='f'?p.peF:p.peT; }
function stdPeerScatter(){
  var h='<style>.mg-tog-row{display:flex;flex-wrap:wrap;gap:14px;margin:2px 0 8px}'+
    '.mg-tog{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--mu)}'+
    '.mg-seg{display:inline-flex;background:#F2F5F8;border:1px solid var(--bdr);border-radius:999px;padding:2px}'+
    '.mg-pill{border:none;background:transparent;font:inherit;font-size:10.5px;font-weight:700;color:var(--mu);padding:3px 10px;border-radius:999px;cursor:pointer}'+
    '.mg-pill.active{background:var(--navy);color:#fff}'+
    '.mg-dot{transition:.15s}.mg-node text{pointer-events:none}'+
    '.masc-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 2px}'+
    '.masc-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;border:1px solid var(--bdr);border-radius:999px;padding:3px 9px;background:var(--w);cursor:pointer;color:var(--navy)}'+
    '.masc-chip .x{color:var(--mu);font-weight:800}'+
    '.masc-add{display:inline-flex;gap:5px;align-items:center}'+
    '.masc-add input{width:74px;font:inherit;font-size:11px;border:1px solid var(--bdr);border-radius:7px;padding:3px 7px;text-transform:uppercase}'+
    '.masc-add button{font:inherit;font-size:11px;font-weight:700;border:1px solid var(--bdr);border-radius:7px;padding:3px 9px;background:#F2F5F8;cursor:pointer}'+
    '.mg-tip{position:fixed;z-index:60;max-width:250px;background:var(--navy);color:#fff;border-radius:9px;padding:9px 12px;font-size:11.5px;line-height:1.5;box-shadow:0 8px 22px rgba(16,20,26,.28);pointer-events:none;border-top:3px solid '+MA_RED+'}'+
    '.mg-tip .mgt-n{display:block;font-weight:800;font-size:12.5px;color:'+MA_RED+';margin-bottom:3px}</style>';
  h+='<div class="ov-diagram-cap" style="margin:0 0 6px">Listed peers mapped by <b>valuation multiple</b> (x) and <b>revenue growth</b> (y). <b>Bubble size = live market cap in USD</b>. <span style="opacity:.75">Hover or tap a bubble for the read.</span></div>';
  h+='<div class="mg-tog-row"><span class="mg-tog">Multiple: <span class="mg-seg"><button type="button" class="mg-pill active" data-mgtype="ev">EV/EBITDA</button><button type="button" class="mg-pill" data-mgtype="pe">P/E</button></span></span>'+
     '<span class="mg-tog">Basis: <span class="mg-seg"><button type="button" class="mg-pill active" data-mgbasis="f">Forward</button><button type="button" class="mg-pill" data-mgbasis="t">Trailing</button></span></span></div>';
  h+='<div class="ov-diagram"><svg viewBox="0 0 640 300" id="maScSvg" role="img" aria-label="Peer valuation vs growth map">'+
    '<line x1="80" y1="252" x2="612" y2="252" stroke="#C7CED6" stroke-width="1.5"/>'+
    '<line x1="80" y1="252" x2="80" y2="44" stroke="#C7CED6" stroke-width="1.5"/>'+
    '<text x="88" y="270" font-family="Inter,sans-serif" font-size="10" fill="#8A93A0">← cheaper</text>'+
    '<text x="610" y="270" font-family="Inter,sans-serif" font-size="10" fill="#8A93A0" text-anchor="end">more expensive →</text>'+
    '<text x="346" y="288" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#6b7684" text-anchor="middle" id="maScXlab">EV/EBITDA · forward</text>'+
    '<text x="74" y="250" font-family="Inter,sans-serif" font-size="10" fill="#8A93A0" text-anchor="end">slow</text>'+
    '<text x="74" y="52" font-family="Inter,sans-serif" font-size="10" fill="#8A93A0" text-anchor="end">fast growth</text>'+
    '<g id="maScNodes"></g>'+
  '</svg></div>';
  h+='<div class="masc-chips" id="maScChips"></div>';
  h+='<div class="ov-diagram-cap" style="margin-top:4px">Remove a peer with the <b>×</b> on its chip, or add one by ticker. Only <b>listed</b> peers with a public multiple plot here; a name drops out of the EV/EBITDA view when it has no meaningful one — <b>Amex</b> is closed-loop (it lends), so it shows on <b>P/E only</b>. Private / government rails (UPI, Pix, FedNow) and unlisted processors have no market multiple and sit on the qualitative competitive map in <b>Deep Dive ▸ Top Line ▸ Industry Analysis</b>, not this scatter. <span class="ave-subh-note">Multiples & growth are approximate, web-sourced (mid-2026); market caps are live. Directional, not exact.</span></div>';
  h+='<div id="maScTip" class="mg-tip" hidden></div>';
  return h;
}
function maScRender(root){
  var g=root.querySelector('#maScNodes'); if(!g||!MA_SC.peers) return;
  var maxMult=MA_SC.type==='ev'?40:44, X0=80, X1=612, Y0=252, Y1=44;
  var lab=root.querySelector('#maScXlab'); if(lab) lab.textContent=(MA_SC.type==='ev'?'EV/EBITDA':'P/E')+' · '+(MA_SC.basis==='f'?'forward':'trailing');
  var frag='';
  MA_SC.peers.forEach(function(p){
    if(!p.on) return; var m=maScMult(p); if(m==null||isNaN(m)) return;
    var growth=MA_SC.basis==='f'?p.gf:p.gt; if(growth==null) growth=p.gf!=null?p.gf:p.gt;
    var x=X0+Math.max(0,Math.min(1,m/maxMult))*(X1-X0);
    var y=Y0-Math.max(0,Math.min(1,(growth||0)/20))*(Y0-Y1);
    var r=Math.max(6,Math.min(24,5+Math.sqrt(Math.max(1,p.mc))*0.7));
    frag+='<g class="mg-node" data-name="'+esc(p.n)+'" data-why="'+esc(p.why||'')+'" transform="translate('+x.toFixed(1)+','+y.toFixed(1)+')">'+
      '<circle class="mg-dot" r="'+r.toFixed(1)+'" fill="'+(p.hl?MA_RED:'#3A7BD5')+'"'+(p.hl?' stroke="#fff" stroke-width="2"':' opacity="0.82"')+' style="cursor:pointer"></circle>'+
      '<text y="'+(r+11).toFixed(1)+'" font-family="Inter,sans-serif" font-size="'+(p.hl?12:11)+'" font-weight="'+(p.hl?800:700)+'" fill="'+(p.hl?MA_RED:'#3A4552')+'" text-anchor="middle">'+esc(p.n)+'</text></g>';
  });
  g.innerHTML=frag;
}
function maScChips(root){
  var box=root.querySelector('#maScChips'); if(!box||!MA_SC.peers) return;
  var h=MA_SC.peers.map(function(p,i){ return '<span class="masc-chip" data-sci="'+i+'" title="Remove '+esc(p.n)+'">'+esc(p.n)+' <span class="x">×</span></span>'; }).join('');
  h+='<span class="masc-add"><input id="maScAddTk" placeholder="+ TICKER" maxlength="6"><button type="button" id="maScAddBtn">Add</button></span>';
  box.innerHTML=h;
}

// ═══════════════════════════════════════════════════════════════════════════
//  DEEP DIVE DATA (migrated from the old bespoke Overview — Golden Rule #1)
// ═══════════════════════════════════════════════════════════════════════════

// ── Four-party (open-loop) model → Bottom Line ▸ Suppliers ("who powers the rails"). ──
var FOURPARTY_SVG =
'<svg viewBox="0 0 680 360" role="img" aria-label="Mastercard four-party model — click a box for its role">' +
  '<defs><marker id="maar" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto" markerUnits="userSpaceOnUse"><path d="M0,0 L7,3 L0,6 Z" fill="#9aa3b2"/></marker></defs>' +
  '<line x1="200" y1="56" x2="470" y2="56" stroke="#c2c8d2" stroke-width="1.5" marker-end="url(#maar)"/>' +
  '<text x="335" y="44" text-anchor="middle" font-size="10" fill="#8A93A0">buys goods / services</text>' +
  '<line x1="115" y1="86" x2="115" y2="274" stroke="#c2c8d2" stroke-width="1.5"/>' +
  '<line x1="565" y1="86" x2="565" y2="274" stroke="#c2c8d2" stroke-width="1.5"/>' +
  '<line x1="196" y1="280" x2="262" y2="206" stroke="#c2c8d2" stroke-width="1.5"/>' +
  '<line x1="484" y1="280" x2="418" y2="206" stroke="#c2c8d2" stroke-width="1.5"/>' +
  '<g class="ov-fpm-node ov-clickable" data-detail="role:cardholder"><rect x="30" y="28" width="170" height="56" rx="10" fill="var(--surface)" stroke="var(--bdr)"/><text x="115" y="54" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--navy)">Cardholder</text><text x="115" y="71" text-anchor="middle" font-size="9.5" fill="#8A93A0">tap to read role ›</text></g>' +
  '<g class="ov-fpm-node ov-clickable" data-detail="role:merchant"><rect x="480" y="28" width="170" height="56" rx="10" fill="var(--surface)" stroke="var(--bdr)"/><text x="565" y="54" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--navy)">Merchant</text><text x="565" y="71" text-anchor="middle" font-size="9.5" fill="#8A93A0">tap to read role ›</text></g>' +
  '<g class="ov-fpm-node ov-clickable" data-detail="role:issuer"><rect x="30" y="276" width="170" height="62" rx="10" fill="var(--surface)" stroke="var(--bdr)"/><text x="115" y="302" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--navy)">Issuer</text><text x="115" y="320" text-anchor="middle" font-size="9.5" fill="#8A93A0">cardholder’s bank ›</text></g>' +
  '<g class="ov-fpm-node ov-clickable" data-detail="role:acquirer"><rect x="480" y="276" width="170" height="62" rx="10" fill="var(--surface)" stroke="var(--bdr)"/><text x="565" y="302" text-anchor="middle" font-size="12.5" font-weight="600" fill="var(--navy)">Acquirer</text><text x="565" y="320" text-anchor="middle" font-size="9.5" fill="#8A93A0">merchant’s bank ›</text></g>' +
  '<g class="ov-fpm-node ov-clickable" data-detail="role:network"><rect x="250" y="150" width="180" height="64" rx="11" fill="'+MA_RED+'" stroke="#9a0020" stroke-width="2.5"/><text x="340" y="180" text-anchor="middle" font-size="14" font-weight="700" fill="#ffffff">MASTERCARD</text><text x="340" y="198" text-anchor="middle" font-size="9.5" fill="#ffe1e1">network · clearing & settlement ›</text></g>' +
'</svg>';
var ROLE_DETAIL = {
  cardholder: { t:'Cardholder', h:'The consumer who pays with a Mastercard credential. They are the <b>issuer\'s</b> customer — Mastercard has no direct relationship with them and charges them nothing; the merchant pays.' },
  issuer:     { t:'Issuer — the cardholder\'s bank', h:'Issues the card, extends the credit, <b>sets and earns the interchange</b>, takes the credit & fraud risk, and bills the cardholder. A Mastercard <b>customer</b> that pays network fees — and the party Mastercard pays <b>incentives</b> to, to keep its volume.' },
  merchant:   { t:'Merchant', h:'The business accepting the card — the <b>acquirer\'s</b> customer. Pays a merchant discount = <b>interchange</b> (to the issuer) + <b>network fees</b> (to Mastercard) + <b>acquirer markup</b>.' },
  acquirer:   { t:'Acquirer — the merchant\'s bank/processor', h:'Onboards merchants, routes their transactions into the network, and settles funds to them. A Mastercard <b>customer</b> that pays network fees.' },
  network:    { t:'Mastercard — the network', h:'<b>Authorizes, clears and settles</b> between issuer and acquirer. Earns <b>domestic assessments</b> (on volume), <b>transaction-processing</b> fees (per transaction) and <b>cross-border</b> fees — net of incentives — plus value-added services. <b>Does not</b> issue, lend, or earn interchange, and takes no credit risk.' },
};
var FLOW_NODES = [
  { k:'card', ic:'💳', l:'Cardholder' }, { k:'merch', ic:'🏪', l:'Merchant' }, { k:'acq', ic:'🏛️', l:'Acquirer' }, { k:'net', ic:'🔴', l:'Mastercard' }, { k:'iss', ic:'🏦', l:'Issuer' },
];
var FLOW_STEPS = [
  { t:'Setup', on:[], cap:'A $100 purchase on a Mastercard card. Press <b>Play</b> to follow the money — and see where each party earns (or doesn\'t).', earn:'', earnType:'none' },
  { t:'1 · Authorization', on:['card','merch','acq','net','iss'], cap:'Tap. The request hops <b>merchant → acquirer → Mastercard → issuer</b>, which checks the balance and runs fraud in ~1–2 seconds, then approves.', earn:'No fee booked yet — authorization is part of the service, not a charge.', earnType:'none' },
  { t:'2 · Approval returns', on:['iss','net','acq','merch','card'], cap:'The "approved" travels back the same path. The cardholder walks out with the goods — but <b>no real money has moved</b>, only a promise to pay.', earn:'Still nothing settled; a stolen-card loss would land on the issuer, not Mastercard.', earnType:'none' },
  { t:'3 · Clearing', on:['acq','net','iss'], cap:'Later, in a batch, the acquirer submits the transaction. <b>Mastercard</b> computes the amounts and the interchange owed.', earn:'Mastercard books its <b>transaction-processing fee</b> — a near-fixed fee for switching this transaction.', earnType:'net' },
  { t:'4 · Settlement', on:['iss','net','acq','merch'], cap:'The issuer pays <b>$100 minus interchange</b>; Mastercard moves funds to the acquirer, which pays the merchant the net.', earn:'Fees split: <b>~$1.50–2.50 interchange → ISSUER</b> · <b>Mastercard assessment + processing fees (a few ¢) → MASTERCARD</b> · acquirer markup → ACQUIRER.', earnType:'split' },
  { t:'5 · Who got what', on:['card','merch','acq','net','iss'], cap:'The merchant nets ~<b>$97.50</b>. Mastercard never touched the $100 and never lent it.', earn:'<b>Interchange — the biggest slice — went to the ISSUER, not Mastercard.</b> Mastercard earned a few cents (processing) + a few basis points of the $100 (assessment). That thinness × billions of transactions = the model.', earnType:'split' },
];
var FLOW_NOTE = 'Mastercard earns on a transaction <b>only when it runs over a Mastercard rail</b> (or when a Mastercard value-added service is attached). A Visa- or Amex-branded swipe runs over <b>their</b> network — Mastercard earns nothing on it. That is exactly why its value-added services are deliberately <b>network-agnostic</b>, so they earn on volume regardless of the card brand.';
var HOW_MONEY = [
  '<b>Not a bank:</b> Mastercard does not issue cards, lend, or earn interchange — those belong to the issuing banks. It never touches the purchase amount and takes <b>no credit risk</b>.',
  '<b>Network fees (the core):</b> <b>domestic assessments</b> (a few basis points of domestic purchase volume), <b>cross-border volume fees</b> (the highest-yield line, where card country ≠ merchant country), and <b>transaction processing/switching</b> (a fee per transaction). <b>Rebates & incentives</b> net against these to reach net revenue.',
  '<b>Value-added services (the differentiator & growth engine):</b> security, identity, data & analytics, consulting, loyalty, open banking and real-time-payment infrastructure — sold on top of the rails, often <b>network-agnostic</b> (earning on non-Mastercard volume too).',
];

// ── Fee lines + Rebates → Bottom Line ▸ Unit Economics. ──
var PN_INTRO = 'The payment network is the core switching business — ~58% of net revenue. It earns on the dollar <b>volume</b> and the <b>number of transactions</b> that flow over Mastercard rails: <b>domestic assessments</b> (basis points of volume), <b>cross-border</b> fees (the highest-yield line) and <b>transaction processing</b> (per transaction).';
var XBORDER_NOTE = '<b>Cross-border is a different cut from geography.</b> "International" net revenue means volume on cards <i>issued outside the U.S.</i>; <b>cross-border</b> means the <i>card country ≠ merchant country</i> (travel + cross-border e-commerce). Cross-border earns a premium rate + FX — the <b>highest-yield</b> line and a key growth driver (+13% lc in Q1 2026) — and is tracked separately from the issuance-geography split.';
var FEE_LINES = [
  { k:'domestic', n:'Domestic assessments', rev:'on domestic GDV',
    what:'A fee charged to customers as a few <b>basis points of the domestic purchase volume</b> on Mastercard credentials.',
    monetizes:'Scales with domestic Gross Dollar Volume; the steadiest, most volume-linked line.',
    products:[{n:'What drives it', d:'Cards in force × spend per card × the assessment rate; benefits from cash-to-digital conversion.'},{n:'Where it\'s strongest', d:'Growing digital-payment markets, especially internationally.'}],
    competition:'Visa (the larger network), domestic card schemes, account-to-account rails.' },
  { k:'crossborder', n:'Cross-border volume fees', rev:'highest yield',
    what:'Fees where the <b>card country differs from the merchant country</b> — travel and cross-border e-commerce.',
    monetizes:'A premium rate plus FX; a single overseas transaction can earn multiples of a domestic one. The <b>highest-yield</b> line and a key growth driver (+13% lc in Q1 2026).',
    products:[{n:'Travel', d:'Tourism & business travel; recovers/grows with global mobility — and softens first in a downturn.'},{n:'Cross-border e-commerce', d:'Buying from foreign merchants online; structurally growing.'}],
    competition:'Visa; money-movement specialists (Wise, etc.) on certain flows.' },
  { k:'processing', n:'Transaction processing', rev:'per transaction',
    what:'A near-fixed fee for each transaction Mastercard <b>switches</b> (authorize / clear / settle).',
    monetizes:'Grows with the <i>count</i> of switched transactions (~+9% in Q1 2026), not ticket size — resilient even in a downturn.',
    products:[{n:'Switching', d:'Routing the transaction message between issuer and acquirer.'},{n:'Connectivity / other', d:'Network access, licensing and related fees.'}],
    competition:'Visa; domestic switches; U.S. debit-routing networks.' },
];
var REBATES_INTRO = 'Mastercard reports <b>net revenue</b> — gross revenue minus the rebates & incentives it pays customers. That contra-revenue is large (well over a third of gross) and rising, so the gross-to-net bridge is one of the most important things to model. The same concept exists at the other big network.';
var REBATES_BRIDGE = [
  { v:'Gross revenue', l:'all network + services fees' },
  { v:'(−) Rebates & incentives', l:'paid to issuers, acquirers & merchants' },
  { v:'= Net revenue', l:'$32.8B · FY2025' },
];
var REBATES = [
  '<b>What they are:</b> payments and incentives to <b>issuers, acquirers and merchants</b> to grow and retain volume and to win new portfolios. Because they are consideration paid to customers, they are booked as a <b>reduction of gross revenue (contra-revenue)</b>, not an operating expense.',
  '<b>Two flavors:</b> <b>volume / performance-based</b> incentives (accrued as the customer delivers volume) and <b>upfront / fixed</b> deal payments (capitalized and amortized over the contract life). So a big signing depresses net revenue for years, smoothing the hit.',
  '<b>Why they exist:</b> issuers can route to <b>either</b> network, so incentives are how Mastercard wins and keeps issuer and co-brand deals. As the #2 network this is the core competitive battleground — the same dollars Visa is also spending for the same portfolios.',
  '<b>Why it matters for the model:</b> the <b>rebate ratio (rebates & incentives ÷ gross revenue)</b> is a key swing factor. A rising ratio can signal intensifying competition; a heavy <b>renewal year</b> steps it up and can optically slow net-revenue growth even when gross volume is perfectly healthy. Watch the ratio, not just net revenue.',
];

// ── VAS growth-engine → Top Line ▸ Segments (VAS depth). ──
var VAS_DEEP = [
  '<b>Scale & growth:</b> VAS net revenue was <b>$3.5B in Q1 2026 (+22% YoY)</b>, ~<b>42% of net revenue</b> — growing well faster than the payment network and increasingly the swing factor in the whole company\'s growth rate.',
  '<b>Network-agnostic:</b> much of it is sold on <b>non-Mastercard</b> volume too (fraud scoring, identity, cyber, open banking). That partially <b>decouples growth from card-share battles</b> — Mastercard can earn even where it doesn\'t win the rail.',
  '<b>Higher-quality revenue:</b> subscriptions, per-transaction scoring and managed services are more <b>recurring</b> and less tied to the consumer-spend cycle than network fees — a diversifier against macro/travel softness.',
  '<b>Deepens the moat:</b> selling security, data and consulting into the same issuers and merchants raises switching costs <i>and</i> pulls through more network volume — services and the network reinforce each other.',
  '<b>A widening ambition:</b> the strategy has moved from payment fraud toward <b>enterprise cybersecurity</b> (the $2.65B Recorded Future deal), identity, open banking and real-time payments — extending the addressable market well beyond card swipes.',
];
var USERMIX_INTRO = 'All the global networks serve broad consumer bases, but the <i>mix</i> tilts differently — and the tilt matters for yield and cyclicality. Mastercard\'s relative leanings (these are tilts at the margin, not absolutes):';

// ── Timeline (corporate lineage) → Evolution ▸ Timeline. ──
var TIMELINE = [
  { y:'1966', t:'<b>Born as a bank alliance to challenge BankAmericard</b> — the Interbank Card Association (ICA).', d:'A group of U.S. banks forms the <b>Interbank Card Association (ICA)</b> to compete with Bank of America\'s BankAmericard (the future Visa). From the start Mastercard is the <b>#2 challenger</b> in an industry the incumbent defined — a position that shapes a more aggressive, partnership-driven culture.' },
  { y:'1968–69', t:'<b>"Master Charge" + the Eurocard alliance</b> — international early.', d:'The network is branded <b>"Master Charge: The Interbank Card" (1969)</b>, and a 1968 alliance with Europe\'s <b>Eurocard</b> gives it early international reach — a lasting structural advantage over a more U.S.-centric rival.' },
  { y:'1979', t:'<b>Renamed Mastercard.</b>', d:'"Master Charge" becomes <b>MasterCard</b>, with the interlocking-circles mark. Through the 1980s–90s it operates as a bank-owned association, building global acceptance and the Maestro debit brand.' },
  { y:'2002', t:'<b>Merges with Europay International</b> — one global franchise ahead of the IPO.', d:'MasterCard International merges with <b>Europay International</b> (which included Eurocard) to form <b>MasterCard Incorporated</b>, consolidating the franchise globally.' },
  { y:'May 2006', t:'<b>IPO at $39.00</b> — two years before Visa, and a cleaner (single-class) structure.', d:'<b>Genesis of the public company.</b> Mastercard IPO\'d on May 25, 2006 (95.5M shares at $39 — the largest U.S. IPO since 2004), <b>two years before Visa</b>. It went public via a conventional IPO (not a spin-off/SPAC). The IPO reduced the member banks\' control (an independent board) — partly to address antitrust exposure — and created the independent <b>Mastercard Foundation</b>, endowed with ~10% of the company. Unlike Visa\'s later IPO, there is <b>no multi-class / litigation-escrow share structure</b> — a fact that matters for how it bears litigation.' },
  { y:'2010–20', t:'<b>The Ajay Banga decade</b> — the business-model pivot to services.', d:'<b>A model inflection, not just growth.</b> Under CEO <b>Ajay Banga</b>, revenue roughly <b>triples</b> and market value rises ~10×. The defining choice: build a large <b>value-added services</b> business (cybersecurity, identity, data & analytics) on top of the rails — changing what Mastercard earns on, not just how much. This services tilt, plus a strong international and cross-border mix, is the main reason a structural #2 kept gaining share and economics.' },
  { y:'2017–24', t:'<b>A services-and-rails buying spree</b> (see M&A).', d:'Mastercard acquires real-time-payment and open-banking infrastructure (<b>Vocalink, Nets A2A, Finicity, Aiia</b>) and a deep security/identity/cyber stack (<b>RiskRecon, Ekata, CipherTrace, Recorded Future</b>) — building optionality beyond card swipes into account-to-account, identity and enterprise cyber.' },
  { y:'Jan 2021', t:'<b>Michael Miebach becomes CEO</b> (current CEO).', d:'Miebach (previously Chief Product Officer) takes over as Banga moves on (later to lead the World Bank). The strategy continues: grow the network, scale services, and extend into new flows (B2B, disbursements, real-time).' },
  { y:'2024', t:'<b>Recorded Future ($2.65B) — largest acquisition to date</b>, a step into enterprise cyber.', d:'The threat-intelligence deal is Mastercard\'s biggest ever and marks the services ambition widening from payment fraud into <b>enterprise cybersecurity</b> — extending the addressable market well beyond card swipes.' },
];
var TL_NOTE = 'Corporate lineage per Mastercard filings, IR and company history; the 2006 IPO and Mastercard Foundation per the prospectus and press. Genesis: a conventional IPO of a bank-association-turned-independent company (not a spin-off/SPAC).';

// ── M&A → Evolution ▸ Timeline (M&A block). ──
var MNA = [
  { n:'Europay International', y:'2002', deal:'merger', terms:'association merger', own:'Member co-op', cat:'Franchise',
    detail:'<b>Terms:</b> an association merger that formed MasterCard Incorporated.<br><br><b>What it added:</b> Europe\'s Eurocard/Europay franchise — consolidating Mastercard into a single global company ahead of the 2006 IPO.' },
  { n:'Applied Predictive Technologies (Test & Learn)', y:'2015', deal:'~$600M', terms:'all cash', own:'Private', cat:'Data & analytics',
    detail:'<b>Terms:</b> ~$600M, all cash.<br><br><b>What it added:</b> the <b>Test & Learn</b> business-experimentation analytics platform.<br><br><b>How it shows up today:</b> a flagship of the <b>Data & Services</b> consulting business.' },
  { n:'VocaLink', y:'2017', deal:'~£700M + £169M earn-out', terms:'all cash', own:'Bank-owned', cat:'Real-time payments',
    detail:'<b>Terms:</b> ~£700M + up to £169M earn-out, all cash (UK bank-owned RTP operator).<br><br><b>What it added:</b> <b>real-time payments & ACH infrastructure</b> — it runs the UK\'s Faster Payments and BACS.<br><br><b>How it shows up today:</b> the backbone of Mastercard\'s account-to-account / RTP push — a hedge against card rails.' },
  { n:'RiskRecon', y:'2020', deal:'undisclosed', terms:'all cash', own:'Private', cat:'Cyber security',
    detail:'<b>Terms:</b> undisclosed, all cash.<br><br><b>What it added:</b> third-party <b>cyber-risk ratings</b>.<br><br><b>How it shows up today:</b> part of the Security Solutions stack.' },
  { n:'Finicity', y:'2020', deal:'$825M + earn-out', terms:'all cash', own:'Private', cat:'Open banking',
    detail:'<b>Terms:</b> $825M + up to $160M earn-out, all cash.<br><br><b>What it added:</b> U.S. <b>open-banking</b> / financial-data APIs (account data, pay-by-bank).<br><br><b>How it shows up today:</b> Mastercard\'s open-banking business in North America.' },
  { n:'Nets (A2A / clearing assets)', y:'2021', deal:'~€2.85B', terms:'cash', own:'Private (PE-owned)', cat:'Real-time payments', big:true,
    detail:'<b>Terms:</b> ~€2.85B (~$3.2B).<br><br><b>What it added:</b> the European <b>account-to-account</b> and clearing technology of Nets.<br><br><b>How it shows up today:</b> scales the real-time / A2A capability across Europe — its second big bet (with Vocalink) beyond cards.' },
  { n:'Ekata', y:'2021', deal:'$850M', terms:'all cash', own:'Private', cat:'Identity',
    detail:'<b>Terms:</b> $850M, all cash.<br><br><b>What it added:</b> global <b>digital identity verification</b> for onboarding and fraud prevention.<br><br><b>How it shows up today:</b> a core part of Security Solutions / identity.' },
  { n:'CipherTrace', y:'2021', deal:'~$250M (est.)', terms:'cash', own:'Private', cat:'Crypto / blockchain',
    detail:'<b>Terms:</b> undisclosed (estimated ~$250M).<br><br><b>What it added:</b> <b>blockchain / crypto-transaction analytics</b> and compliance.<br><br><b>How it shows up today:</b> crypto-risk tooling within the security business.' },
  { n:'Dynamic Yield', y:'2022', deal:'~$325M (est.)', terms:'cash', own:'Corporate (McDonald\'s)', cat:'Personalization',
    detail:'<b>Terms:</b> acquired from McDonald\'s (reported ~$325M).<br><br><b>What it added:</b> AI-driven <b>personalization</b> and recommendation technology.<br><br><b>How it shows up today:</b> loyalty/marketing personalization inside Data & Services.' },
  { n:'Recorded Future', y:'2024', deal:'$2.65B', terms:'all cash', own:'Private (PE-owned)', cat:'Threat intelligence', big:true,
    detail:'<b>Terms:</b> $2.65B, all cash — <b>Mastercard\'s largest acquisition to date</b>.<br><br><b>What it added:</b> a leading <b>threat-intelligence</b> platform — a major step up in cybersecurity.<br><br><b>How it shows up today:</b> anchors a broader security ambition extending beyond payment fraud into enterprise cyber.' },
];

// ── Litigation → Valuation ▸ Risk & Litigation. ──
var LIT_INTRO = 'Like the other card networks, Mastercard set default interchange as a bank association, which has drawn decades of antitrust litigation. The point worth understanding for Mastercard specifically is <b>how it bears that risk</b>.';
var LIT = [
  '<b>United States — MDL 1720.</b> Mastercard is a <b>co-defendant with Visa</b> in the long-running U.S. merchant interchange antitrust case. The <b>damages</b> class settled (a multi-billion settlement shared with Visa, approved 2019 and upheld 2023); the <b>rules / injunctive</b> class is still live (a 2024 proposed settlement was <b>rejected by the court</b>), and large merchants keep opting out to sue separately.',
  '<b>United Kingdom — Merricks.</b> A landmark <b>opt-out consumer class action</b> (filed 2016) over EEA cross-border interchange the EU Commission ruled unlawful in 2007. Originally valued at ~<b>£14B</b>, it <b>settled for £200M</b> (Dec 2024; approved by the Competition Appeal Tribunal in Feb 2025) — a reminder that these mega-claims often resolve for a small fraction of the headline.',
  '<b>EU & elsewhere:</b> ongoing interchange cases and behavioral commitments across jurisdictions; interchange caps (e.g. in the EU) also structurally lower yields.',
  '<b>The key structural difference:</b> unlike <b>Visa</b> — which quarantines its U.S. "covered litigation" onto former member banks through a special <b>Class B share / litigation-escrow</b> mechanism — <b>Mastercard has no such shield</b>. With a single class of common stock, interchange and other litigation is borne <b>directly by Mastercard and its shareholders</b>, recognized as <b>litigation provisions / charges on the income statement</b> when probable. The amounts have so far been manageable, but the exposure is a more <b>direct P&L / shareholder risk</b> than at Visa.',
];

// ── Peers → Top Line ▸ Industry Analysis (qualitative; consistent with the scatter). ──
var PEER_COLS = ['Mastercard', 'Visa', 'Amex', 'Discover', 'UnionPay'];
var PEER_ROWS = [
  ['Model', 'Open-loop four-party', 'Open-loop four-party', '<b>Closed-loop</b> (lends)', 'Closed-loop* (lends)', 'Domestic near-monopoly'],
  ['FY net revenue', '$32.8B', '$40.0B', '~$72B† (incl. lending)', '~$16B† (incl. lending)', '~$2–3B fees‡ (est.)'],
  ['Payments volume', '~$10.6T GDV', '~$14T', '~$1.7T', '~$0.5T', '~$25T+ (mostly China)'],
  ['Credentials', '~3.5B', '~4.9B', '~145M (affluent)', '~70M', '~9B+ (most in world)'],
  ['Services mix', '<b>~42% of revenue</b>', '~27% of revenue', 'no standalone VAS', 'limited', 'limited'],
  ['Litigation shield', 'None (direct to P&L)', 'Class B escrow', 'n/a (closed-loop)', 'n/a', 'state-linked'],
  ['Credit risk', 'None', 'None', '<b>Yes</b> — owns loan book', '<b>Yes</b>', 'Borne by member banks'],
];
var PEER_NOTE = 'Mastercard and Visa are the two global open-loop "toll roads" — a thin fee per transaction, no credit risk. Mastercard is the <b>smaller of the two by volume</b> but is <b>more international</b>, carries a <b>larger value-added-services mix</b> (~42% vs ~27%), and — unlike Visa — bears interchange litigation <b>directly</b> (no escrow shield). <b>Amex & Discover</b> are closed-loop (they issue and lend, so revenue includes net interest income and isn\'t comparable line-for-line; Discover is being acquired by Capital One). <b>UnionPay</b> is the largest network by cards (China; state-linked) but overwhelmingly domestic. Not shown: digital/A2A players (PayPal) and government real-time rails (UPI, Pix, FedNow). † incl. lending; ‡ limited disclosure / estimate; figures approximate, FY ends differ.';

// ── Tailwinds / Headwinds → Valuation ▸ Risk & Litigation. ──
var TAILWINDS = [
  '<b>International cash-to-digital tilt.</b> A larger share of revenue is outside the U.S., where cash is still a big share of spend — <i>mechanism:</i> every dollar converted to digital adds network volume at near-zero incremental cost, and the international runway is longer than in mature markets.',
  '<b>Cross-border & affluent/travel skew.</b> Cross-border (+13% lc) carries the highest yield, and the premium product ladder concentrates travel/discretionary spenders — <i>mechanism:</i> a richer blended yield as cross-border grows faster than overall volume.',
  '<b>Value-added services compounding.</b> Security, identity, data and open banking (~42% of revenue, +22%) grow faster than the network and are often <b>network-agnostic</b> — <i>mechanism:</i> diversifies revenue, earns on non-Mastercard volume, and adds recurring, less-cyclical revenue.',
];
var HEADWINDS = [
  '<b>Interchange / regulatory pressure & litigation borne directly.</b> Interchange caps and antitrust cases (MDL 1720, UK/EU) — <i>mechanism:</i> compress the fee pool and, unlike Visa\'s escrow-shielded structure, hit Mastercard\'s own P&L and shareholders via provisions.',
  '<b>Account-to-account & real-time rails.</b> Government-built instant systems (UPI, Pix, FedNow) move money with no card and near-zero fee — <i>mechanism:</i> they convert the un-digitized spend Mastercard wants, bypassing card rails (its answer: own RTP/A2A via Vocalink & Nets, but at lower economics).',
  '<b>Being the #2 network.</b> Smaller scale and acceptance than the leader — <i>mechanism:</i> Mastercard must compete hard (rebates & incentives) for issuer/co-brand portfolios, and a large issuer\'s network choice can move volume materially.',
  '<b>Travel / discretionary cyclicality.</b> The cross-border and affluent tilt that lifts yield also raises sensitivity to travel and discretionary spend — <i>mechanism:</i> a slowdown hits the high-yield cross-border line first (partly cushioned by the larger services mix).',
];

// ── Financials → Valuation ▸ Balance Sheet. Summit DCF (snapshot 2026-06-25); 2021–2025
// actuals, 2026–2029 = model projection. FCF 2025 = 15,121 (model) — corrected from an
// older seed. REV/OP_INCOME/EBITDA verified against the model. ──
var FIN_YEARS = [2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029];
var FIN_EST   = [false, false, false, false, false, true, true, true, true];
var FIN_FMT   = function(v){ return v==null ? '—' : '$'+(v/1000).toFixed(1)+'B'; };
var FIN_SERIES = {
  finRev:    { label:'Revenue',          type:'bar',  color:MA_RED,   data:[18884, 22237, 25098, 28167, 32791, 38162, 41902, 46640, 52166] },
  finOpInc:  { label:'Operating Income', type:'bar',  color:MA_STEEL, data:[10079, 12127, 13824, 15278, 18554, 22085, 23928, 26614, 29859] },
  finEbitda: { label:'EBITDA',           type:'bar',  color:MA_ORANGE,data:[11461, 12816, 14829, 16493, 20100, 23505, 26302, 29249, 32770] },
  finFcf:    { label:'Free Cash Flow',   type:'line', color:MA_GREEN, data:[9056, 10753, 11705, 14306, 15121, 18024, 19455, 21654, 24318] },
};
var FIN_INTRO = 'Mastercard\'s financials, pulled from the <b>Summit DCF model</b> — <b>actuals through FY2025</b> and the model\'s <b>projection to FY2029</b> (faded / dashed). Drag the timeline handles to mold the window; each chart\'s CAGR updates to your selection.';
var FIN_NOTE  = 'Annual, USD billions. <b>2021–2025 actuals · 2026–2029 = DCF projection</b> (faded/dashed). Source: Summit DCF model for Mastercard (snapshot 2026-06-25). FCF FY2025 = $15.1B per the model (a prior seed of $17.2B was corrected). Forward figures are model estimates, not company guidance.';
var _finStart=2021, _finEnd=2029, _finCharts={};

// ── Management (Executives & Board) → Management tab. High-confidence heads seeded;
// the wider roster/track-record is a labeled draft to complete from the 2026 DEF 14A. ──
var MA_MGMT = makeManagement({
  brand:MA_RED,
  lede:"Mastercard is led by CEO <b>Michael Miebach</b> (CEO since Jan 2021; previously Chief Product Officer), continuing the services-and-network strategy set under his predecessor Ajay Banga. Long-tenured CFO <b>Sachin Mehra</b> runs finance. The full executive roster, bios and board are being completed from Mastercard's 2026 proxy (DEF 14A); live ownership & insider activity populate the Ownership subtab (Fiscal.ai).",
  execs:[
    { id:'miebach', lead:true, name:'Michael Miebach', title:'Chief Executive Officer', since:'CEO since Jan 2021', line:'Ex-Chief Product Officer; long-time payments executive.',
      bio:'Chief Executive Officer and director since January 2021; joined Mastercard in 2016 and served as Chief Product Officer before becoming CEO. Earlier: senior roles at Barclays and Standard Bank across Africa, the Middle East and Europe. Continues the network-plus-services strategy.' },
    { id:'mehra', name:'Sachin Mehra', title:'Chief Financial Officer', since:'CFO since 2019', line:'Long-tenured finance leader; joined 2010.',
      bio:'Chief Financial Officer since 2019; at Mastercard since 2010 across treasury, corporate finance and the CFO role for global operations. Earlier finance roles at GE and Hess. Oversees capital allocation — a steady dividend plus large buybacks.' },
  ],
  board:[
    { name:'Merit Janow', chair:true, independent:true, role:'Independent Chair of the Board.' },
    { name:'Michael Miebach', dual:true, independent:false, role:'Chief Executive Officer.' },
  ],
  boardNote:'Roster is a labeled draft — complete the full board and committees from the 2026 DEF 14A before publish.',
  gov:[
    { k:'Share & voting', v:'Single class · 1 vote/share', d:'No dual-class / no litigation-escrow (unlike Visa).' },
    { k:'Foundation', v:'Mastercard Foundation', d:'Independent; a large long-term holder since the 2006 IPO.' },
    { k:'Capital return', v:'Dividend + buybacks', d:'Payer; consistent large repurchases.' },
  ],
  foot:'Executive heads per Mastercard IR leadership page; CEO/CFO high-confidence. Full roster, bios, board and committees to be completed from the 2026 proxy (DEF 14A). Ownership & insider trades are live in the Ownership subtab.',
});

var OV_SOURCES = 'Sources — Mastercard FY2025 10-K & Q1 2026 results/earnings release (Apr 30, 2026); Mastercard IR & investor materials; Summit DCF model (snapshot 2026-06-25) for the financial series; EDGAR for filer status. Market cap and peer bubbles are live via Massive; peer multiples & growth are web-sourced approximations (mid-2026), labeled directional. Forward figures are model estimates, not company guidance.';
var DD_SOURCES = 'Sources — Mastercard Q1 2026 results & earnings release (Apr 30, 2026), FY2025 10-K and prior filings; IR & company history; acquisition press releases & SEC filings for M&A terms; UK Competition Appeal Tribunal & reporting on the Merricks settlement; public reporting on MDL 1720 and the 2006 IPO / Mastercard Foundation. Some M&A values are estimates where terms were undisclosed; "lc"/"cn" = local-currency/currency-neutral.';

// ═══════════════════════════════════════════════════════════════════════════
//  STANDARDIZED OVERVIEW — the 7 blocks (hook always visible, rest collapsed)
// ═══════════════════════════════════════════════════════════════════════════
function stdTimeline(){
  return '<div class="ov-timeline">'+TIMELINE.map(function(t,i){ var more=t.d?'<div class="ov-tl-more">Read more →</div>':''; var cls=t.d?' ov-clickable':''; var attr=t.d?' data-detail="hist:'+i+'"':''; return '<div class="ov-tl-item'+cls+'"'+attr+'><div class="ov-tl-dot"></div><div class="ov-tl-yr">'+esc(t.y)+'</div><div class="ov-tl-body">'+t.t+more+'</div></div>'; }).join('')+'</div>';
}
function stdOverviewBody(c){
  var h='<style>.stdkf{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid var(--bdr);border-top:3px solid var(--brand-2, var(--brand));border-radius:12px;overflow:hidden;background:var(--w);margin:2px 0}'+
    '.stdkf-cell{padding:11px 13px;border-right:1px solid var(--bdr);border-bottom:1px solid var(--bdr)}'+
    '.stdkf-cell:nth-child(5n){border-right:none}.stdkf-cell:nth-child(n+6){border-bottom:none}'+
    '.stdkf-k{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--mu);margin-bottom:3px}'+
    '.stdkf-v{font-size:12px;font-weight:700;color:var(--navy);line-height:1.3}'+
    '@media(max-width:720px){.stdkf{grid-template-columns:repeat(2,1fr)}.stdkf-cell{border-right:none}}'+
    '.ov-lede{margin:16px 0 6px;font-size:13px;line-height:1.6;color:var(--navy)}'+
    '.q2{display:grid;grid-template-columns:1fr 1fr;border:1px solid var(--bdr);border-radius:12px;overflow:hidden;background:var(--w);margin:4px 0}'+
    '.q2-cell{padding:13px 15px;border-right:1px solid var(--bdr);border-bottom:1px solid var(--bdr)}'+
    '.q2-cell:nth-child(2n){border-right:none}.q2-cell:nth-child(n+3){border-bottom:none}'+
    '.q2-k{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:'+MA_RED+';margin-bottom:5px}'+
    '.q2-v{font-size:12px;color:var(--navy);line-height:1.5}.q2-v b{font-weight:800}'+
    '@media(max-width:600px){.q2{grid-template-columns:1fr}.q2-cell{border-right:none}.q2-cell:nth-child(n+2){border-bottom:1px solid var(--bdr)}.q2-cell:last-child{border-bottom:none}}'+
    '.mm-tog{display:inline-flex;background:#F2F5F8;border:1px solid var(--bdr);border-radius:999px;padding:2px;margin:2px 0 4px}'+
    '.mm-pill{border:none;background:transparent;font:inherit;font-size:10.5px;font-weight:700;color:var(--mu);padding:4px 12px;border-radius:999px;cursor:pointer}.mm-pill.active{background:var(--navy);color:#fff}'+
    '.mm-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:8px;margin:14px 0 2px}@media(max-width:640px){.mm-stats{grid-template-columns:repeat(3,1fr)}}'+
    '.mm-stat{border:1px solid var(--bdr);border-radius:9px;padding:8px 10px;text-align:center;background:var(--w)}'+
    '.mm-stat-v{font-size:13px;font-weight:800;color:var(--navy)}.mm-stat-l{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.03em;color:var(--mu);margin-top:2px}'+
    '.acc-list .acc{border:1px solid var(--bdr);border-radius:9px;margin-top:6px;overflow:hidden;background:var(--w)}'+
    '.acc-h{width:100%;text-align:left;border:none;background:#F7F9FB;font:inherit;font-size:12px;font-weight:700;color:var(--navy);padding:9px 12px;cursor:pointer;display:flex;justify-content:space-between;align-items:center;gap:8px}'+
    '.acc-h:hover{background:#EEF2F6}.acc-x{color:var(--mu);font-weight:800}.acc-b{padding:10px 12px}'+
    '.famd{font-size:12px;color:var(--navy);line-height:1.55}.famd b{font-weight:800}'+
    '.ov-row{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid var(--bdr);font-size:11.5px}.ov-row:last-child{border-bottom:none}.ov-row-k{color:var(--mu);font-weight:600}.ov-row-v{color:var(--navy);font-weight:800}'+
    '.stdp-seg{font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--mu);margin:12px 0 7px}.stdp-group:first-child .stdp-seg{margin-top:2px}'+
    '.stdp{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}'+
    '.stdp-card{border:1px solid var(--bdr);border-radius:11px;padding:13px 14px;background:var(--w);cursor:pointer;transition:.14s}'+
    '.stdp-card:hover{box-shadow:0 3px 10px rgba(0,0,0,.08);transform:translateY(-2px);border-color:'+MA_RED+'}'+
    '.stdp-ic{font-size:26px;line-height:1}.stdp-n{font-size:13px;font-weight:800;color:var(--navy);margin:7px 0 3px}'+
    '.stdp-d{font-size:11px;color:var(--mu);line-height:1.45}.stdp-more{font-size:10px;font-weight:700;color:'+MA_RED+';margin-top:6px}'+
    '.ov-collap{border:1px solid var(--bdr);border-radius:10px;margin:12px 0 0;overflow:hidden}'+
    '.ov-collap-h{width:100%;text-align:left;border:none;background:#F7F9FB;font:inherit;font-size:12.5px;font-weight:800;color:var(--navy);padding:11px 14px;cursor:pointer;display:flex;align-items:center;gap:8px}'+
    '.ov-collap-h:hover{background:#EEF2F6}.ov-collap-ic{font-size:10px;color:var(--mu)}.ov-collap-b{padding:12px 14px 6px}</style>';
  // ── Hook (always visible): Key Facts, Description, 2×2 quadrant ──
  h+=stdKeyFacts();
  h+='<p class="ov-lede">'+esc(MA_LEDE)+'</p>';
  h+=stdFourQuad();
  // ── Progressive disclosure: everything below defaults collapsed ──
  h+=collapsible('How it makes money', stdMoneyMap());
  h+=collapsible('What it makes — the products', stdProducts());
  h+=collapsible('Competitors — valuation vs growth', stdPeerScatter());
  h+=collapsible('Timeline', stdTimeline());
  h+='<div class="ov-foot">'+esc(OV_SOURCES)+'</div>';
  return h;
}
function html(c){
  var h='<div class="ov ov-mastercard" data-brand="MA">';
  h+=stdOverviewBody(c);
  h+='<div class="ov-modal-back" id="ovModalBack" hidden><div class="ov-modal" role="dialog" aria-modal="true">'+
    '<button class="ov-modal-x" id="ovModalX" aria-label="Close">×</button>'+
    '<div class="ov-modal-t" id="ovModalT"></div><div class="ov-modal-b" id="ovModalB"></div></div></div>';
  h+='</div>';
  return h;
}

// ═══════════════════════════════════════════════════════════════════════════
//  DEEP DIVE — the 5-tab spine (Top Line · Bottom Line · Evolution · Valuation ·
//  Management), like UBER/LYFT/CART. Root class .ov-mastercard-dd scopes it.
// ═══════════════════════════════════════════════════════════════════════════
function pillarCards(list){
  return '<div class="ov-cards">'+list.map(function(s){
    return '<div class="ov-card ov-clickable" data-detail="fee:'+esc(s.k)+'">'+
      '<div class="ov-card-h"><span class="ov-card-n">'+esc(s.n)+'</span><span class="ov-chip">'+esc(s.rev)+'</span></div>'+
      '<div class="ov-card-s">'+s.what+'</div>'+
      '<div class="ov-more">How it monetizes ›</div></div>';
  }).join('')+'</div>';
}
function feeDetailHtml(s){
  return '<div class="ov-sub-line"><b>What it is.</b> '+s.what+'</div>'+
    '<div class="ov-sub-mon"><b>How it monetizes:</b> '+s.monetizes+'</div>'+
    (s.products && s.products.length ? '<div class="ov-subh" style="margin-top:14px">Inside it</div><div class="ov-prod">'+s.products.map(function(p){ return '<div class="ov-prod-tile"><div class="ov-prod-n">'+esc(p.n)+'</div><div class="ov-prod-d">'+p.d+'</div></div>'; }).join('')+'</div>' : '')+
    (s.competition ? '<div class="ov-sub-comp"><b>Competition:</b> '+s.competition+'</div>' : '');
}
function flowHtml(){
  return '<div class="ov-flow" id="ovFlow">'+
    '<div class="ov-flow-nodes">'+
      FLOW_NODES.map(function(n){ return '<div class="ov-flow-node" data-node="'+n.k+'"><div class="ov-flow-ic">'+n.ic+'</div><div class="ov-flow-l">'+esc(n.l)+'</div></div>'; }).join('<span class="ov-flow-link">→</span>')+
    '</div>'+
    '<div class="ov-flow-stage"><span class="ov-flow-step" id="ovFlowStep">Setup</span><div class="ov-flow-cap" id="ovFlowCap">'+FLOW_STEPS[0].cap+'</div>'+
      '<div class="ov-flow-earn" id="ovFlowEarn" hidden></div></div>'+
    '<div class="ov-flow-ctrl">'+
      '<button class="ov-flow-btn" id="ovFlowPlay">▶ Play</button>'+
      '<button class="ov-flow-btn ov-flow-sec" id="ovFlowPrev">‹ Prev</button>'+
      '<button class="ov-flow-btn ov-flow-sec" id="ovFlowNext">Next ›</button>'+
      '<div class="ov-flow-dots" id="ovFlowDots">'+FLOW_STEPS.map(function(s,i){ return '<span class="ov-flow-dot'+(i===0?' on':'')+'" data-i="'+i+'"></span>'; }).join('')+'</div>'+
    '</div>'+
    '<div class="ov-flow-note">'+FLOW_NOTE+'</div>'+
  '</div>';
}
// ── Top Line ▸ Segments (Payment Network fee lines + VAS growth engine) ──
function ddSegmentsBody(c){
  var h='<p class="ov-lede">'+PN_INTRO+'</p>';
  h+='<div class="ov-callout" style="margin-bottom:18px">'+XBORDER_NOTE+'</div>';
  h+=sec('Payment Network — the three fee lines',
    '<div class="ov-diagram-cap" style="margin:0 0 12px">How the rails monetize. <b>Tap any line</b> for what it is, how it\'s billed, and what drives it.</div>'+pillarCards(FEE_LINES));
  h+=sec('Value-Added Services — the growth engine',
    '<div class="ov-mbars" style="margin-bottom:14px">'+
      '<div class="ov-mbar"><div class="ov-mbar-l">Payment Network</div><div class="ov-mbar-track"><div class="ov-mbar-fill" style="width:58%;background:'+MA_STEEL+';">the core rails</div></div><div class="ov-mbar-v">~58%</div></div>'+
      '<div class="ov-mbar"><div class="ov-mbar-l">Value-Added Services</div><div class="ov-mbar-track"><div class="ov-mbar-fill" style="width:42%;background:'+MA_ORANGE+';">+22% YoY ▲</div></div><div class="ov-mbar-v">~42%</div></div>'+
    '</div>'+
    '<div class="ov-diagram-cap" style="margin:-4px 0 14px">VAS is ~42% of net revenue and compounding <b>faster than the network</b> (+22% YoY) — each year it takes a bigger slice and pulls up the whole company\'s growth rate.</div>'+
    '<div class="ov-callout">'+bullets(VAS_DEEP)+'</div>');
  return h;
}
// ── Top Line ▸ Customers (demand mix) ──
function ddCustomersBody(c){
  var h='<p class="ov-lede">'+USERMIX_INTRO+'</p>';
  h+='<div class="ov-subh">A bigger recurring-services base than the leader</div>'+
    '<div class="ov-mbars" style="margin-bottom:16px">'+
      '<div class="ov-mbar"><div class="ov-mbar-l">Services mix — Mastercard</div><div class="ov-mbar-track"><div class="ov-mbar-fill" style="width:42%;background:'+MA_ORANGE+';">recurring services</div></div><div class="ov-mbar-v">~42%</div></div>'+
      '<div class="ov-mbar"><div class="ov-mbar-l">Services mix — the leader</div><div class="ov-mbar-track"><div class="ov-mbar-fill" style="width:27%;background:#C9CFD8;">recurring services</div></div><div class="ov-mbar-v">~27%</div></div>'+
    '</div>'+
    '<div class="ov-subh">A premium / travel-skewed product ladder</div>'+
    '<div class="ov-chain" style="margin-bottom:8px">'+
      '<div class="ov-chain-step"><div class="ov-chain-n">1</div><div class="ov-chain-t">Standard</div><div class="ov-chain-d">mass market</div></div>'+
      '<div class="ov-chain-step"><div class="ov-chain-n">2</div><div class="ov-chain-t">World</div><div class="ov-chain-d">affluent</div></div>'+
      '<div class="ov-chain-step"><div class="ov-chain-n">3</div><div class="ov-chain-t">World Elite</div><div class="ov-chain-d">high-spend · travel</div></div>'+
      '<div class="ov-chain-step is-payoff"><div class="ov-chain-n">4</div><div class="ov-chain-t">World Legend</div><div class="ov-chain-d">ultra-high-net-worth</div></div>'+
    '</div>'+
    '<div class="ov-diagram-cap">Up the ladder, cardholders spend more, travel more and skew to <b>cross-border</b>. Mastercard\'s mix also leans <b>more international</b> and less U.S.-debit-heavy, with <b>higher cross-border intensity</b> — cross-border grew ~<b>15%</b> in 2025 vs ~<b>12%</b> at the leader. <b>Net read:</b> a richer, higher-yield mix tilted to <b>discretionary, cross-border and affluent</b> spend (more travel-cyclical) plus <b>recurring services</b> — versus a peer heavier in U.S. debit.</div>';
  return h;
}
// ── Top Line ▸ TAM ──
function ddTamBody(c){
  return placeholder('TAM — the digitization runway',
    'Frame the addressable opportunity from Mastercard filings/IR: <b>global personal-consumption expenditure</b> still on cash & check (the cash-to-digital runway), <b>cross-border</b> travel + e-commerce, <b>commercial / B2B & new flows</b> (disbursements, A2A), and the <b>value-added-services</b> TAM (security, data, open banking). Size each from the 10-K / Investor Day and label reported vs estimate — no fabricated totals.');
}
// ── Top Line ▸ Industry Analysis (peers table + qualitative map) ──
function ddIndustryBody(c){
  var h=sec('Peers & Competitive Landscape',
    '<table class="ov-table ov-cmp"><thead><tr><th>Dimension</th><th>'+PEER_COLS.map(esc).join('</th><th>')+'</th></tr></thead><tbody>'+
    PEER_ROWS.map(function(r){ return '<tr><td class="ov-td-name">'+esc(r[0])+'</td>'+r.slice(1).map(function(cell){ return '<td>'+cell+'</td>'; }).join('')+'</tr>'; }).join('')+
    '</tbody></table><div class="ov-diagram-cap" style="margin-top:10px">'+PEER_NOTE+'</div>');
  h+='<div class="ov-diagram-cap" style="margin:6px 0 0;font-size:11px;color:var(--mu)"><b>Why a different peer set than the Overview scatter?</b> This map is qualitative and by <b>business model</b>, so it includes <b>closed-loop</b> (Amex, Discover) and <b>state-linked / private</b> (UnionPay, government A2A rails) players that have no clean public valuation multiple. The Overview\'s valuation×growth scatter is limited to <b>listed</b> names with a real multiple (MA, V, AXP on P/E only, PYPL) — so the two intentionally show different names but tell the same story.</div>';
  return h;
}
// ── Bottom Line ▸ Unit Economics (rebates gross-to-net bridge + fee economics) ──
function ddUnitEconBody(c){
  var h=sec('Rebates & Incentives — the gross-to-net bridge',
    '<p class="ov-lede" style="margin-bottom:14px">'+REBATES_INTRO+'</p>'+
    '<div class="ov-corr-stats">'+REBATES_BRIDGE.map(function(b){ return '<div class="ov-corr-stat"><div class="ov-corr-v">'+esc(b.v)+'</div><div class="ov-corr-l">'+esc(b.l)+'</div></div>'; }).join('')+'</div>'+
    '<div class="ov-callout" style="margin-top:14px">'+bullets(REBATES)+'</div>');
  return h;
}
// ── Bottom Line ▸ Suppliers (the four-party model — "who powers the rails") ──
function ddSuppliersBody(c){
  return '<p class="ov-lede">Mastercard is an <b>asset-light network</b>: it does not issue, lend or take credit risk. Its "supply chain" is the <b>four-party open-loop model</b> — the issuing banks, acquiring banks, merchants and cardholders whose volume flows over the rails. Tap any box for its role, then press <b>Play</b> to follow a single $100 purchase and see who earns at each step.</p>'+
    sec('The four-party (open-loop) model',
      '<div class="ov-diagram" style="margin-top:6px">'+FOURPARTY_SVG+'</div>'+flowHtml())+
    sec('How Mastercard makes money', '<div class="ov-callout">'+bullets(HOW_MONEY)+'</div>');
}
// ── Bottom Line ▸ Margins (live via Massive) ──
function ddMarginsBody(c){
  return placeholder('Margins — live via Massive',
    'Wire the profitability & cash margins (gross / operating / net / EBITDA / CFO / FCF as % of revenue) from the live Massive feed (income & cash-flow statements), with a sourced fallback from the FY2021–2025 filings + the Summit model FY2026E — same pattern as UBER/LYFT/CART. Mastercard\'s operating margin runs in the high-50s% — one of the highest of any large company.');
}
// ── Evolution ▸ Strategy ──
function ddStrategyBody(c){
  return sec('Strategy — network + services',
    '<div class="ov-diagram-cap" style="margin:0 0 12px">The through-line since the 2010s: use the cash-generative network to fund a <b>value-added-services</b> business that is faster-growing, more recurring, and often <b>network-agnostic</b> — while buying into the <b>non-card rails</b> (real-time / A2A) that could otherwise disintermediate cards.</div>'+
    '<div class="ov-callout">'+bullets([
      '<b>Grow the core network</b> — cash-to-digital conversion, cross-border, and new flows (B2B, disbursements).',
      '<b>Compound services</b> — security, identity, data, open banking; sell across networks, not just Mastercard\'s.',
      '<b>Own the hedge</b> — real-time / account-to-account rails (Vocalink, Nets) so Mastercard participates even where cards are bypassed.',
      '<b>Extend into enterprise cyber</b> — the Recorded Future step widens the addressable market beyond payments.',
    ])+'</div>');
}
// ── Valuation ▸ Balance Sheet (the DCF financials) ──
function ddFinancialsBody(c){
  var h='<p class="ov-lede">'+FIN_INTRO+'</p>';
  h+='<div class="ov-rangebar">'+
    '<div class="ov-range-head"><span class="ov-range-title">Timeline</span><span class="ov-range-val" id="ovFinVal">2021 – 2029E</span></div>'+
    '<div class="ov-range-slider"><div class="ov-range-track"></div><div class="ov-range-fill" id="ovFinFill"></div>'+
      '<input type="range" id="ovFinMin" min="2021" max="2029" step="1" value="2021">'+
      '<input type="range" id="ovFinMax" min="2021" max="2029" step="1" value="2029">'+
      '<div class="ov-range-ticks" id="ovFinTicks"></div></div>'+
  '</div>';
  h+='<div class="ov-charts ov-charts-2">'+
    finCard('finRev','Revenue','FY21 – FY29E')+
    finCard('finOpInc','Operating Income','FY21 – FY29E')+
    finCard('finEbitda','EBITDA','FY21 – FY29E')+
    finCard('finFcf','Free Cash Flow','FY21 – FY29E')+
  '</div>';
  h+='<div class="ov-diagram-cap" style="margin-top:10px">'+FIN_NOTE+'</div>';
  return h;
}
function finCard(id, title, sub){
  return '<div class="ov-chart-card"><div class="ov-chart-t">'+esc(title)+' <span>'+esc(sub)+'</span></div>'+
    '<div class="ov-chart-wrap"><canvas id="'+id+'"></canvas></div>'+
    '<div class="ov-statline" id="stat-'+id+'"></div></div>';
}
// ── Valuation ▸ Risk & Litigation ──
function ddRiskBody(c){
  var h=sec('Litigation & Legal — borne directly', '<p class="ov-lede" style="margin-bottom:12px">'+LIT_INTRO+'</p><div class="ov-callout">'+bullets(LIT)+'</div>');
  h+=sec('Tailwinds & Headwinds',
    '<div class="ov-grid2">'+
      '<div class="ov-wind ov-wind-up"><div class="ov-wind-h">Tailwinds</div>'+bullets(TAILWINDS)+'</div>'+
      '<div class="ov-wind ov-wind-down"><div class="ov-wind-h">Headwinds</div>'+bullets(HEADWINDS)+'</div>'+
    '</div>');
  return h;
}
// ── Evolution ▸ Timeline (history + M&A) ──
function ddTimelineBody(c){
  var h=sec('History — from #2 challenger to network + services',
    '<div class="ov-diagram-cap" style="margin:0 0 12px">How a bank alliance built to challenge the leader became a global network-plus-services company — <b>tap any milestone</b> with "Read more".</div>'+
    stdTimeline()+'<div class="ov-fynote" style="margin-top:6px">'+esc(TL_NOTE)+'</div>');
  h+=sec('M&A — terms & what each deal added',
    '<div class="ov-diagram-cap" style="margin:0 0 12px">The acquisitions that built the services and real-time-payment pillars — <b>tap any deal</b>.</div>'+
    '<div class="ov-cards ov-cards-mna">'+MNA.map(function(m){
      return '<div class="ov-card ov-clickable'+(m.big?' ov-card-big':'')+'" data-detail="mna:'+esc(m.n)+'">'+
        '<div class="ov-card-h"><span class="ov-card-n">'+esc(m.n)+'</span><span class="ov-chip">'+esc(m.cat)+'</span></div>'+
        '<div class="ov-card-kpis"><span>'+esc(m.y)+'</span><span>'+esc(m.deal)+'</span><span>'+esc(m.terms)+'</span><span>'+esc(m.own)+'</span></div>'+
        '<div class="ov-more">What it added ›</div></div>';
    }).join('')+'</div>');
  return h;
}

function deepDiveHtml(c){
  var h='<div class="ov ov-mastercard ov-mastercard-dd" data-brand="MA">';
  h+='<style>.dd-tabs{display:flex;flex-wrap:wrap;gap:4px;margin:0 0 14px;border-bottom:1px solid var(--bdr)}'+
    '.dd-tab{border:none;background:transparent;font:inherit;font-size:12.5px;font-weight:700;color:var(--mu);padding:8px 14px;cursor:pointer;border-bottom:2px solid transparent;margin-bottom:-1px}'+
    '.dd-tab:hover{color:var(--navy)}.dd-tab.active{color:var(--navy);border-bottom-color:var(--navy)}</style>';
  h+='<div class="dd-tabs">'+
    '<button type="button" class="dd-tab active" data-dd="topline">Top Line</button>'+
    '<button type="button" class="dd-tab" data-dd="bottomline">Bottom Line</button>'+
    '<button type="button" class="dd-tab" data-dd="evolution">Evolution</button>'+
    '<button type="button" class="dd-tab" data-dd="valuation">Valuation</button>'+
    '<button type="button" class="dd-tab" data-dd="mgmt">Management</button>'+
  '</div>';
  // Top Line
  h+='<div class="dd-pane" data-dd="topline">'+
    '<div class="ovt-subtabs">'+
      '<button type="button" class="ovt-subtab active" data-ovst="segments">Segments</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="customers">Customers</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="tam">TAM</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="industry">Industry Analysis</button>'+
    '</div>'+
    '<div class="ovt-subpane" data-ovst="segments">'+ddSegmentsBody(c)+'</div>'+
    '<div class="ovt-subpane" data-ovst="customers" hidden>'+ddCustomersBody(c)+'</div>'+
    '<div class="ovt-subpane" data-ovst="tam" hidden>'+ddTamBody(c)+'</div>'+
    '<div class="ovt-subpane" data-ovst="industry" hidden>'+ddIndustryBody(c)+'</div>'+
  '</div>';
  // Bottom Line
  h+='<div class="dd-pane" data-dd="bottomline" hidden>'+
    '<div class="ovt-subtabs">'+
      '<button type="button" class="ovt-subtab active" data-ovst="unit">Unit Economics</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="suppliers">Suppliers</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="margins">Margins</button>'+
    '</div>'+
    '<div class="ovt-subpane" data-ovst="unit">'+ddUnitEconBody(c)+'</div>'+
    '<div class="ovt-subpane" data-ovst="suppliers" hidden>'+ddSuppliersBody(c)+'</div>'+
    '<div class="ovt-subpane" data-ovst="margins" hidden>'+ddMarginsBody(c)+'</div>'+
  '</div>';
  // Evolution
  h+='<div class="dd-pane" data-dd="evolution" hidden>'+
    '<div class="ovt-subtabs">'+
      '<button type="button" class="ovt-subtab active" data-ovst="earnings">Earnings History</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="guidance">Guidance</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="strategy">Strategy</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="timeline">Timeline</button>'+
    '</div>'+
    '<div class="ovt-subpane" data-ovst="earnings">'+placeholder('Earnings History','Quarter-by-quarter earnings-call highlights (Quartr transcripts) — net revenue, cross-border, VAS growth, rebate-ratio commentary and guidance changes, written contemporaneously per call.')+'</div>'+
    '<div class="ovt-subpane" data-ovst="guidance" hidden>'+placeholder('Guidance vs Reality','Guided net-revenue / operating-metric ranges issued each quarter vs reported actuals (Summit dataset), same chart pattern as CART/UBER — Mastercard guides net-revenue growth (currency-neutral, ex-acquisitions).')+'</div>'+
    '<div class="ovt-subpane" data-ovst="strategy" hidden>'+ddStrategyBody(c)+'</div>'+
    '<div class="ovt-subpane" data-ovst="timeline" hidden>'+ddTimelineBody(c)+'</div>'+
  '</div>';
  // Valuation
  h+='<div class="dd-pane" data-dd="valuation" hidden>'+
    '<div class="ovt-subtabs">'+
      '<button type="button" class="ovt-subtab active" data-ovst="ratings">Analyst Ratings</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="balance">Financials</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="risk">Risk & Litigation</button>'+
    '</div>'+
    '<div class="ovt-subpane" data-ovst="ratings"><div id="dd-val-slot"></div></div>'+
    '<div class="ovt-subpane" data-ovst="balance" hidden>'+ddFinancialsBody(c)+'</div>'+
    '<div class="ovt-subpane" data-ovst="risk" hidden>'+ddRiskBody(c)+'</div>'+
  '</div>';
  // Management
  h+='<div class="dd-pane" data-dd="mgmt" hidden>'+
    '<div class="ovt-subtabs">'+
      '<button type="button" class="ovt-subtab active" data-ovst="team">Executives & Board</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="ownership">Ownership</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="track">Track Record</button>'+
    '</div>'+
    '<div class="ovt-subpane" data-ovst="team">'+MA_MGMT.body()+'</div>'+
    '<div class="ovt-subpane" data-ovst="ownership" hidden><div id="dd-mgmt-slot"></div></div>'+
    '<div class="ovt-subpane" data-ovst="track" hidden>'+placeholder('Track Record','Rate each executive on value creation (green/amber/red) with a Mastercard record and a prior/external one, once the full roster is sourced from the 2026 DEF 14A — same pattern as UBER/LYFT/CART.')+'</div>'+
  '</div>';
  h+='<div class="ov-foot">'+esc(DD_SOURCES)+'</div>';
  h+='</div>';
  return h;
}

// ─── Financials charts (DCF actuals + projection, timeline-moldable) ─────────
function finSlice(s){
  var o={years:[],labels:[],data:[],est:[]};
  for(var i=0;i<FIN_YEARS.length;i++){ var y=FIN_YEARS[i];
    if(y>=_finStart && y<=_finEnd){ o.years.push(y); o.data.push(s.data[i]); o.est.push(FIN_EST[i]); o.labels.push(String(y)+(FIN_EST[i]?'E':'')); } }
  return o;
}
function makeFin(id){
  var s=FIN_SERIES[id]; var cv=document.getElementById(id); if(!cv) return;
  var sl=finSlice(s); var ds;
  if(s.type==='bar'){
    ds={ data:sl.data, backgroundColor:sl.est.map(function(e){ return e?_hexRgba(s.color,0.4):s.color; }), borderRadius:5, maxBarThickness:46 };
  } else {
    ds={ data:sl.data, borderColor:s.color, backgroundColor:_hexRgba(s.color,0.08), fill:true, tension:0.3, borderWidth:2.5, pointRadius:3, pointHoverRadius:5, spanGaps:true,
      pointBackgroundColor: sl.est.map(function(e){ return e?_hexRgba(s.color,0.4):s.color; }),
      segment:{ borderDash:function(ctx){ return sl.est[ctx.p1DataIndex]?[6,4]:undefined; } } };
  }
  _finCharts[id]=new Chart(cv.getContext('2d'), { type:s.type, data:{labels:sl.labels, datasets:[ds]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{display:false}, tooltip:{ callbacks:{ label:function(ctx){ return ' '+FIN_FMT(ctx.parsed.y); } } } },
      scales:{ x:{ grid:{display:false}, ticks:{color:C_AXIS,font:{size:10}} },
               y:{ grid:{color:C_GRID}, ticks:{color:C_AXIS,font:{size:10},callback:FIN_FMT} } } }
  });
  var el=document.getElementById('stat-'+id); if(!el) return;
  var idxs=[]; for(var j=0;j<sl.data.length;j++) if(sl.data[j]!=null) idxs.push(j);
  if(idxs.length>=2){ var fi=idxs[0], li=idxs[idxs.length-1], a=sl.data[fi], z=sl.data[li], yrs=sl.years[li]-sl.years[fi];
    var cagr=(Math.pow(z/a, 1/(yrs||1))-1)*100;
    el.innerHTML='<b>'+sl.labels[fi]+'</b> '+FIN_FMT(a)+' → <b>'+sl.labels[li]+'</b> '+FIN_FMT(z)+' · CAGR <span class="'+(cagr>=0?'pos':'neg')+'">'+(cagr>=0?'+':'')+cagr.toFixed(1)+'%</span>';
  } else { el.innerHTML='<span class="ov-stat-mut">Pick a wider range</span>'; }
}
function renderFin(){
  if (typeof Chart === 'undefined') return;
  Object.keys(_finCharts).forEach(function(id){ try{ _finCharts[id].destroy(); }catch(e){} }); _finCharts={};
  Object.keys(FIN_SERIES).forEach(makeFin);
}

// ─── Deep Dive tab machinery (top-level .dd-tab + nested .ovt-subtab) ─────────
function activeDD(root){ var b=root.querySelector('.dd-tab.active'); return b?b.getAttribute('data-dd'):'topline'; }
function activeSubKey(root, group){ var pane=root.querySelector('.dd-pane[data-dd="'+group+'"]'); if(!pane) return null; var b=pane.querySelector('.ovt-subtab.active'); return b?b.getAttribute('data-ovst'):null; }
function buildSub(root, group, key){
  if(group==='valuation' && key==='balance') renderFin();
  if(group==='mgmt' && key==='team') MA_MGMT.init(root);
}
function buildDD(root, key){ var s=activeSubKey(root,key); if(s) buildSub(root,key,s); }
function showSub(root, pane, group, key){
  pane.querySelectorAll('.ovt-subtab').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-ovst')===key); });
  pane.querySelectorAll('.ovt-subpane').forEach(function(p){ p.hidden=(p.getAttribute('data-ovst')!==key); });
  requestAnimationFrame(function(){ buildSub(root, group, key); });
}
function wireSubtabs(root, group){ var pane=root.querySelector('.dd-pane[data-dd="'+group+'"]'); if(!pane) return;
  pane.querySelectorAll('.ovt-subtab').forEach(function(btn){ btn.onclick=function(){ showSub(root, pane, group, btn.getAttribute('data-ovst')); }; }); }
function showDD(root, key){
  root.querySelectorAll('.dd-tab').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-dd')===key); });
  root.querySelectorAll('.dd-pane').forEach(function(p){ p.hidden=(p.getAttribute('data-dd')!==key); });
  requestAnimationFrame(function(){ buildDD(root, key); });
}
function wireDD(root){ root.querySelectorAll('.dd-tab').forEach(function(btn){ btn.onclick=function(){ showDD(root, btn.getAttribute('data-dd')); }; }); }

// ═══════════════════════════════════════════════════════════════════════════
//  init — wires BOTH profile panes (root #co-detailview spans Overview + Deep Dive)
// ═══════════════════════════════════════════════════════════════════════════
function init(c){
  var root = document.getElementById('co-detailview'); if(!root) return;

  // Collapsibles (Overview progressive disclosure)
  root.querySelectorAll('.ov-collap-h').forEach(function(btn){ btn.onclick=function(){ var cc=btn.parentElement; var open=cc.classList.toggle('open'); var b=cc.querySelector('.ov-collap-b'); if(b) b.hidden=!open; var ic=btn.querySelector('.ov-collap-ic'); if(ic) ic.textContent=open?'▾':'▸'; }; });
  // Segment "What is X?" accordions
  root.querySelectorAll('.acc-h').forEach(function(btn){ btn.onclick=function(){ var b=btn.nextElementSibling; if(!b) return; var open=b.hidden; b.hidden=!open; var x=btn.querySelector('.acc-x'); if(x) x.textContent=open?'–':'+'; }; });
  // How-it-makes-money Segments ⇄ Geography toggle
  root.querySelectorAll('.mm-pill').forEach(function(btn){ btn.onclick=function(){
    var v=btn.getAttribute('data-mm');
    root.querySelectorAll('.mm-pill').forEach(function(b){ b.classList.toggle('active', b===btn); });
    root.querySelectorAll('.mm-view').forEach(function(p){ p.hidden=(p.getAttribute('data-mm')!==v); });
  }; });

  // Dynamic peer scatter (Overview)
  maScReset(); maScRender(root); maScChips(root);
  var sctip=root.querySelector('#maScTip');
  function wireScNodes(){ if(!sctip) return; root.querySelectorAll('#maScNodes .mg-node').forEach(function(g){
    function show(){ sctip.innerHTML='<span class="mgt-n">'+g.getAttribute('data-name')+'</span>'+g.getAttribute('data-why'); sctip.hidden=false; }
    function move(e){ sctip.style.left=Math.min(e.clientX+16, window.innerWidth-270)+'px'; sctip.style.top=(e.clientY+16)+'px'; }
    g.addEventListener('mouseenter', show); g.addEventListener('mousemove', move);
    g.addEventListener('mouseleave', function(){ sctip.hidden=true; });
    g.addEventListener('click', function(e){ show(); move(e); });
  }); }
  function scRefresh(){ maScRender(root); wireScNodes(); }
  wireScNodes();
  root.querySelectorAll('.mg-pill').forEach(function(btn){ btn.onclick=function(){
    if(btn.hasAttribute('data-mgtype')){ MA_SC.type=btn.getAttribute('data-mgtype'); root.querySelectorAll('.mg-pill[data-mgtype]').forEach(function(b){ b.classList.toggle('active', b===btn); }); }
    else { MA_SC.basis=btn.getAttribute('data-mgbasis'); root.querySelectorAll('.mg-pill[data-mgbasis]').forEach(function(b){ b.classList.toggle('active', b===btn); }); }
    scRefresh();
  }; });
  function wireChips(){
    root.querySelectorAll('#maScChips .masc-chip[data-sci]').forEach(function(ch){ ch.onclick=function(){ var i=+ch.getAttribute('data-sci'); if(MA_SC.peers[i]){ MA_SC.peers.splice(i,1); maScChips(root); wireChips(); scRefresh(); } }; });
    var addBtn=root.querySelector('#maScAddBtn'), addIn=root.querySelector('#maScAddTk');
    if(addBtn&&addIn){ addBtn.onclick=function(){ var tk=(addIn.value||'').trim().toUpperCase(); if(!tk) return;
      if(!MA_SC.peers.some(function(p){ return p.tk===tk; })){
        var seed=MA_PEERS.filter(function(p){ return p.tk===tk; })[0];
        if(seed){ var o={}; for(var k in seed) o[k]=seed[k]; o.on=true; MA_SC.peers.push(o); }
        else MA_SC.peers.push({ tk:tk, n:tk, on:true, mc:10, evT:null,evF:null,peT:null,peF:null,gt:null,gf:null, why:'Added by ticker — live market cap only; no multiple on file, so it plots once one is available.' });
      }
      addIn.value=''; maScChips(root); wireChips(); scRefresh(); maLiveOne(tk); }; }
  }
  wireChips();
  // Live market cap (Key Facts cell + peer bubbles) — Massive via api.liveQuote
  function maLiveOne(tk){ import('../api.js').then(function(m){ if(!m||!m.liveQuote) return null; return m.liveQuote(tk); }).then(function(q){ if(!q||q.marketCap==null) return; var mcB=q.marketCap/1e9; MA_SC.peers.forEach(function(p){ if(p.tk===tk) p.mc=mcB; }); if(tk==='MA'){ var el=root.querySelector('#maMc'); if(el) el.textContent='$'+(mcB>=1000?(mcB/1000).toFixed(2)+'T':Math.round(mcB)+'B')+' · live'; } scRefresh(); }).catch(function(){}); }
  MA_SC.peers.forEach(function(p){ if(p.tk) maLiveOne(p.tk); });

  // Deep Dive tab wiring (root spans both panes)
  wireDD(root);
  wireSubtabs(root,'topline'); wireSubtabs(root,'bottomline'); wireSubtabs(root,'evolution'); wireSubtabs(root,'valuation'); wireSubtabs(root,'mgmt');

  // Financials timeline slider (Deep Dive ▸ Valuation ▸ Financials)
  var fmn = root.querySelector('#ovFinMin'), fmx = root.querySelector('#ovFinMax');
  var ffill = root.querySelector('#ovFinFill'), fval = root.querySelector('#ovFinVal'), ftk = root.querySelector('#ovFinTicks');
  if (fmn){
    var FY0=2021, FY1=2029, th='';
    for (var y=FY0; y<=FY1; y++) th += '<span>' + "'" + String(y).slice(2) + (y>=2026?'E':'') + '</span>';
    ftk.innerHTML = th;
    var paintFin = function(){
      var lo=Math.min(+fmn.value,+fmx.value), hi=Math.max(+fmn.value,+fmx.value);
      _finStart=lo; _finEnd=hi;
      var pa=(lo-FY0)/(FY1-FY0)*100, pb=(hi-FY0)/(FY1-FY0)*100;
      ffill.style.left=pa+'%'; ffill.style.width=(pb-pa)+'%';
      fval.textContent = lo + ' – ' + hi + (hi>=2026?'E':'');
    };
    fmn.oninput = function(){ paintFin(); renderFin(); };
    fmx.oninput = function(){ paintFin(); renderFin(); };
    paintFin();
  }

  // Modal (shared; hoisted to #co-detailview so Deep Dive triggers reach it)
  root.querySelectorAll(':scope > .ov-modal-back').forEach(function(m){ if(m.id!=='ovModalBack') m.remove(); });
  var back = root.querySelector('#ovModalBack'), mT = root.querySelector('#ovModalT'), mB = root.querySelector('#ovModalB');
  if(back && back.parentNode!==root) root.appendChild(back);
  function openModal(title, bodyHtml){ mT.innerHTML=title; mB.innerHTML=bodyHtml; back.hidden=false; requestAnimationFrame(function(){ back.classList.add('on'); }); document.addEventListener('keydown', onEsc); }
  function closeModal(){ back.classList.remove('on'); document.removeEventListener('keydown', onEsc); setTimeout(function(){ back.hidden=true; }, 180); }
  function onEsc(e){ if (e.key==='Escape') closeModal(); }
  if(back){ root.querySelector('#ovModalX').onclick = closeModal; back.onclick = function(e){ if (e.target===back) closeModal(); }; }
  function resolve(key){
    var parts=key.split(':'), kind=parts[0], id=parts.slice(1).join(':');
    if (kind==='role'){ var r=ROLE_DETAIL[id]; return r && { t:r.t, h:r.h }; }
    if (kind==='fee'){ var s=FEE_LINES.filter(function(x){return x.k===id;})[0]; return s && { t:s.n+' <span class="ov-modal-sub">'+esc(s.rev)+'</span>', h:feeDetailHtml(s) }; }
    if (kind==='mna'){ var m=MNA.filter(function(x){return x.n===id;})[0]; return m && { t:m.n+' <span class="ov-modal-sub">'+esc(m.y)+' · '+esc(m.deal)+'</span>', h:m.detail }; }
    if (kind==='hist'){ var t=TIMELINE[parseInt(id,10)]; return t && t.d ? { t:t.y, h:t.d } : null; }
    if (kind==='fam'){ var gp=id.split('-'), gg=MA_PROD_GROUPS[+gp[0]]; var f=gg&&gg.families[+gp[1]]; if(!f) return null;
      var body='<div class="famd" style="margin-bottom:10px;color:var(--mu)">'+esc(f.d)+'</div>'+f.items.map(function(it){ return '<div style="margin:0 0 10px"><div style="font-size:12.5px;font-weight:800;color:var(--navy)">'+esc(it[0])+'</div><div class="famd">'+esc(it[1])+'</div></div>'; }).join('');
      return { t:f.ic+' '+esc(f.fam), h:body }; }
    return null;
  }
  root.querySelectorAll('[data-detail]').forEach(function(el){
    el.style.cursor='pointer';
    el.addEventListener('click', function(){ var d=resolve(el.getAttribute('data-detail')); if (d) openModal(d.t, d.h); });
  });

  // Four-party flow animation (Deep Dive ▸ Bottom Line ▸ Suppliers)
  var flow = root.querySelector('#ovFlow');
  if (flow){
    var idx=0, timer=null;
    var nodes=flow.querySelectorAll('.ov-flow-node');
    var stepEl=flow.querySelector('#ovFlowStep'), capEl=flow.querySelector('#ovFlowCap'), earnEl=flow.querySelector('#ovFlowEarn');
    var dots=flow.querySelectorAll('.ov-flow-dot'), playBtn=flow.querySelector('#ovFlowPlay');
    function apply(i){
      idx=i; var s=FLOW_STEPS[i];
      nodes.forEach(function(n){ n.classList.toggle('on', s.on.indexOf(n.getAttribute('data-node'))!==-1); });
      stepEl.textContent=s.t; capEl.innerHTML=s.cap;
      if (s.earn){ earnEl.hidden=false; earnEl.className='ov-flow-earn earn-'+s.earnType; earnEl.innerHTML=s.earn; } else { earnEl.hidden=true; }
      dots.forEach(function(d, di){ d.classList.toggle('on', di===i); });
    }
    function stop(){ if (timer){ clearInterval(timer); timer=null; } playBtn.textContent='▶ Play'; }
    function play(){ if (timer){ stop(); return; } if (idx>=FLOW_STEPS.length-1) apply(0); playBtn.textContent='❚❚ Pause'; timer=setInterval(function(){ if (idx>=FLOW_STEPS.length-1){ stop(); return; } apply(idx+1); }, 2600); }
    playBtn.onclick=play;
    flow.querySelector('#ovFlowPrev').onclick=function(){ stop(); apply(Math.max(0, idx-1)); };
    flow.querySelector('#ovFlowNext').onclick=function(){ stop(); apply(Math.min(FLOW_STEPS.length-1, idx+1)); };
    dots.forEach(function(d){ d.onclick=function(){ stop(); apply(parseInt(d.getAttribute('data-i'),10)); }; });
    apply(0);
  }
}

// Deep Dive charts build lazily: init() already wired the tabs (root spans both panes),
// so here we only paint the active dd-pane's charts now that the Deep Dive tab is visible.
function deepDiveInit(c){
  var root = document.getElementById('co-detailview'); if(!root) return;
  var d=activeDD(root); requestAnimationFrame(function(){ buildDD(root, d); });
}

export var mastercardOverview = { html: html, init: init, absorbsPillars: true, deepDive: { html: deepDiveHtml, init: deepDiveInit } };
