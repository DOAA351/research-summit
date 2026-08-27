// overviews/nvda-earnings.js — the FULL Earnings sub-pane for NVDA (Deep Dive ▸ Evolution ▸ Earnings).
//
// Self-contained module so it never conflicts with the big js/overviews/nvda.js. It reproduces the
// AMZN Earnings structure (js/overviews/amzn.js, deepDiveHtml Evolution pane) as a drop-in body/init:
//   · a .ce-phtabs phase bar  →  Setup · Post-Results · Notes   (data-cep setup/results/watch)
//   · quarter pills (Q1 FY2026 … Q1 FY2027 from docs/calls/NVDA.md)
//   · Setup   = the consensus-driven Setup chart (results.js dataset 'NVDA_SETUP')
//   · Post-Results = AI Summary · Points for the call · The call classified (toggle) · Also on the call,
//                    authored from docs/calls/NVDA.md (NEVER web-searched)
//   · Notes   = the SHARED Watch List engine (js/watchlist.js, Supabase company_themes) + the theme
//               record rendered from js/themes-data/nvda.js (NVDA_THEMES)
//
// House conventions honoured (docs/EARNINGS_CONVENTIONS.md + team memory):
//   · Post-Results = AI Summary + Points for the call + The call classified + Also on the call
//   · AI Summary is objective: no em-dashes, no "not A but B", no number/growth narration — it leads
//     with the qualitative implication for the analysis
//   · Watch List is the shared mountWatchList engine (same as AMZN), degrades gracefully with no login
//
// Ships CSS globally (an injected <style>, once) because the ce-* classes live in amzn.js's ceStyle()
// and are NOT in css/overview.css. Colours use NVIDIA green as the brand.

import { resultsHtml, initResults } from '../results.js';
import { mountWatchList } from '../watchlist.js';
import { fetchThemeRecord, saveThemeRecord } from '../api.js';   // durable persistence of the NVDA theme record (Notes)
import { NVDA_THEMES } from '../themes-data/nvda.js';

// ── palette (NVIDIA green brand; the rest mirror amzn.js) ──
var BRAND='#76B900', BRAND2='#1F8A70', GRAY='#9AA4B0', RED='#EA4335', BLUE='#2557D6',
    PURPLE='#7A5AF8', AMBER='#B7791F', GREEN='#0a8f4c';

function esc(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function stripHtml(h){ return String(h==null?'':h).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }
function qkey(q){ return String(q||'').replace(/\s/g,''); }
function qnum(q){ var m=String(q||'').match(/Q(\d)\s+(\d{4})/); return m?((+m[2])*4+(+m[1])):null; }

// ── quarters, newest first. `q` is the canonical key (parseable by the Watch List + theme record,
//    matching NVDA_THEMES' "Q1 2027" convention); `disp` is the fiscal label shown to the reader. ──
var QUARTERS=[
  { q:'Q2 2027', disp:'Q2 FY2027', status:'upcoming', date:'reports ~late August 2026 (guided $91B ±2%)' },
  { q:'Q1 2027', disp:'Q1 FY2027', status:'reported', date:'May 20, 2026' },
  { q:'Q4 2026', disp:'Q4 FY2026', status:'reported', date:'February 25, 2026' },
  { q:'Q3 2026', disp:'Q3 FY2026', status:'reported', date:'November 19, 2025' },
  { q:'Q2 2026', disp:'Q2 FY2026', status:'reported', date:'August 27, 2025' },
  { q:'Q1 2026', disp:'Q1 FY2026', status:'reported', date:'May 28, 2025' }
];
function dispOf(q){ for(var i=0;i<QUARTERS.length;i++){ if(QUARTERS[i].q===q) return QUARTERS[i].disp; } return q; }

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// CE_CONS — the NVDA consensus record, mirroring amzn.js CE_CONS. BUILT (not invented) from the REAL
// data already in the repo:
//   · actuals (qa) + forward consensus (the 1q-out cell qr[..][3] of forward quarters) come from
//     js/overviews/nvda-bbg.js (nvdaBBG.is rev/grossProfit/oi/ebitda/dilEps + seg73804 Data Center
//     and seg1743921375 Networking), $M → $B.
//   · the PRE-PRINT Street consensus for each REPORTED quarter (qr[..][3]) is the vintage of
//     js/results-data/nvda.js estMatrix.cons.q dated immediately BEFORE that quarter reported —
//     the real number the Street carried going in, so the surprise is reconstructed from data:
//       Q1 FY2026 ← 2025-03-03 · Q2 FY2026 ← 2025-06-02 · Q3 FY2026 ← 2025-09-01
//       Q4 FY2026 ← 2025-11-24 · Q1 FY2027 ← 2026-03-02
//     Data Center / Networking have no estMatrix vintage, so their reported-quarter consensus is
//     null (a print with nothing to score) — only the forward quarters carry a Street cell.
// Quarter axis is FISCAL (matches QUARTERS' "Q1 2027" convention). Values $B, EPS $. nHead headline
// rows, then NVDA KPI rows. Growth bases: qy = the actual four quarters earlier, qq = the prior
// quarter's actual.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
var CE_CONS = {
  src:'Bloomberg (BBG_CONSENSUS.txt) via nvda-bbg.js · pre-print vintages via nvda.js estMatrix.cons',
  asOf:'2026-08-31',
  q:['Q1 2026','Q2 2026','Q3 2026','Q4 2026','Q1 2027','Q2 2027','Q3 2027','Q4 2027','Q1 2028'],
  hz:['4q out','3q out','2q out','1q out'],
  nHead:5,
  m:[
    { k:'Revenue', u:'$B', t:'ok',
      qr:[[null,null,null,43.4],[null,null,null,45.8],[null,null,null,54.4],[null,null,null,65.4],[null,null,null,78.0],[null,null,null,92.3],[null,null,null,105.2],[null,null,null,118.8],[null,null,null,128.7]],
      qa:[44.1,46.7,57.0,68.1,81.6,null,null,null,null],
      qy:[null,null,null,null,44.1,46.7,57.0,68.1,81.6],
      qq:[null,44.1,46.7,57.0,68.1,81.6,null,null,null] },
    { k:'Gross profit', u:'$B', t:'ok',
      qr:[[null,null,null,30.8],[null,null,null,33.0],[null,null,null,40.0],[null,null,null,49.1],[null,null,null,59.1],[null,null,null,69.1],[null,null,null,77.8],[null,null,null,87.5],[null,null,null,95.1]],
      qa:[26.9,34.0,42.0,51.2,61.2,null,null,null,null],
      qy:[null,null,null,null,26.9,34.0,42.0,51.2,61.2],
      qq:[null,26.9,34.0,42.0,51.2,61.2,null,null,null] },
    { k:'Operating income', u:'$B', t:'ok',
      qr:[[null,null,null,27.2],[null,null,null,29.1],[null,null,null,35.8],[null,null,null,44.1],[null,null,null,51.4],[null,null,null,61.2],[null,null,null,69.3],[null,null,null,78.6],[null,null,null,85.6]],
      qa:[23.3,30.2,37.8,46.1,53.8,null,null,null,null],
      qy:[null,null,null,null,23.3,30.2,37.8,46.1,53.8],
      qq:[null,23.3,30.2,37.8,46.1,53.8,null,null,null] },
    { k:'EBITDA', u:'$B', t:'ok',
      qr:[[null,null,null,27.8],[null,null,null,29.3],[null,null,null,36.4],[null,null,null,44.8],[null,null,null,52.5],[null,null,null,62.4],[null,null,null,71.1],[null,null,null,80.1],[null,null,null,86.9]],
      qa:[28.4,30.8,38.5,46.9,54.8,null,null,null,null],
      qy:[null,null,null,null,28.4,30.8,38.5,46.9,54.8],
      qq:[null,28.4,30.8,38.5,46.9,54.8,null,null,null] },
    { k:'Diluted EPS', u:'$', t:'ok',
      qr:[[null,null,null,0.90],[null,null,null,0.96],[null,null,null,1.18],[null,null,null,1.47],[null,null,null,1.75],[null,null,null,2.15],[null,null,null,2.41],[null,null,null,2.73],[null,null,null,3.00]],
      qa:[0.76,1.08,1.30,1.76,2.39,null,null,null,null],
      qy:[null,null,null,null,0.76,1.08,1.30,1.76,2.39],
      qq:[null,0.76,1.08,1.30,1.76,2.39,null,null,null] },
    { k:'Data Center revenue', u:'$B', t:'ok',
      qr:[[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,85.9],[null,null,null,97.4],[null,null,null,110.1],[null,null,null,120.6]],
      qa:[39.1,41.1,51.2,62.3,75.2,null,null,null,null],
      qy:[null,null,null,null,39.1,41.1,51.2,62.3,75.2],
      qq:[null,39.1,41.1,51.2,62.3,75.2,null,null,null] },
    { k:'Networking revenue', u:'$B', t:'ok',
      qr:[[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,null],[null,null,null,17.0],[null,null,null,19.3],[null,null,null,21.7],[null,null,null,24.3]],
      qa:[5.0,7.3,8.2,11.0,14.8,null,null,null,null],
      qy:[null,null,null,null,5.0,7.3,8.2,11.0,14.8],
      qq:[null,5.0,7.3,8.2,11.0,14.8,null,null,null] }
  ]
};

// ── CE helpers (ported from amzn.js, module-scoped so they never collide) ──────────────────────
function ceMetricByKey(k){ for(var i=0;i<CE_CONS.m.length;i++){ if(CE_CONS.m[i].k===k) return CE_CONS.m[i]; } return null; }
var CE_MARGIN_DEN={ 'Gross profit':'Revenue','Operating income':'Revenue','EBITDA':'Revenue' };
function ceMarginPct(v, rev){ return (v==null||rev==null||!rev)?null:Math.round((v/rev*100)*10)/10; }
function ceFmtV(u,v){ if(v==null) return null; if(u==='$') return '$'+(+v).toFixed(2); if(u==='$B') return '$'+(+v)+'B'; if(u==='B') return (+v)+'B'; return String(v); }
function ceTkFmt(u,v){ if(v==null) return ''; if(u==='$') return '$'+(+v).toFixed(2); if(u==='$B') return '$'+(+v).toFixed(1)+'B'; if(u==='B') return (+v).toFixed(2)+'B'; return String(v); }
function ceGrowth(m,qi,base,cur){ if(m.t==='basis') return null; if(m.u==='%') return null; var c=(cur!==undefined&&cur!==null)?cur:(m.qr[qi]?m.qr[qi][3]:null); var b=(base==='qoq')?m.qq[qi]:m.qy[qi]; if(c==null||b==null||!b) return null; return Math.round((c/b-1)*100); }
function ceChip(g){ if(g==null) return ''; var up=g>=0; return '<span class="ce-gchip" style="color:'+(up?'#0a8f4c':'#C5221F')+'">'+(up?'+':'−')+Math.abs(g)+'%</span>'; }
var CE_STMT_ORDER=['Revenue','Data Center revenue','Networking revenue','Gross profit','Operating income','EBITDA','Diluted EPS'];
function ceStmtIdx(k){ var i=CE_STMT_ORDER.indexOf(k); return i<0?CE_STMT_ORDER.length:i; }
var CE_TOPLINE={'Revenue':1,'Data Center revenue':1,'Networking revenue':1};
function ceCat(k){ return CE_TOPLINE[k]?'top':'bottom'; }
var CE_RES={ beat:{c:'#0a8f4c',l:'Beat'}, miss:{c:RED,l:'Miss'}, inline:{c:'#6b7684',l:'In line'} };
function ceVerdict(m, c, a, surp){
  if(a==null) return {l:'—', c:'#9AA4B0', k:'none'};
  if(c==null) return {l:'no est.', c:'#7A5AF8', k:'noest'};
  if(surp==null) return {l:'—', c:'#9AA4B0', k:'none'};
  if(Math.abs(surp)<2) return {l:CE_RES.inline.l, c:CE_RES.inline.c, k:'inline'};
  return surp>0 ? {l:CE_RES.beat.l, c:CE_RES.beat.c, k:'beat'} : {l:CE_RES.miss.l, c:CE_RES.miss.c, k:'miss'};
}

// ── A · the estimate grid (ceGrid) — headline + KPI cells, Street/Summit/Both + growth lens + margin.
// NVDA carries no reliable per-quarter Summit model number (annual-only), so the Summit column is
// empty and reads "—"; the toggle still functions. Notes/"?" pop-ups are intentionally omitted (the
// module has no pop-up host) so the grid never renders a dead control.
function ceGrid(qLabel, which){
  var qi=CE_CONS.q.indexOf(qLabel); if(qi<0) return '';
  var us={};
  function denRow(dk){ var dm=ceMetricByKey(dk); if(!dm) return null; var dc=(dm.qr[qi])?dm.qr[qi][3]:null; return { c:dc, s:dc, qy:dm.qy[qi], qq:dm.qq[qi] }; }
  var list=CE_CONS.m.map(function(m,i){ return {m:m,i:i}; }).filter(function(x){ return (which==='head')?(x.i<CE_CONS.nHead):(x.i>=CE_CONS.nHead); });
  return '<div class="ce-mgrid">'+list.map(function(x){
    var m=x.m, c=m.qr[qi]?m.qr[qi][3]:null;
    var uv=us[m.k];
    var denK=CE_MARGIN_DEN[m.k], mgn=!!denK, den=mgn?denRow(denK):null;
    var street=(c==null)
      ? '<span class="ce-empty">—</span>'+(m.t==='nocons'?'<span class="ce-nocons">no est.</span>':'')
      : ceFmtV(m.u,c)+'<span class="ce-gy">'+ceChip(ceGrowth(m,qi,'yoy'))+'</span><span class="ce-gq">'+ceChip(ceGrowth(m,qi,'qoq'))+'</span>';
    var summitCell=uv
      ? ceFmtV(m.u,uv.v)+'<span class="ce-gy">'+ceChip(ceGrowth(m,qi,'yoy',uv.v))+'</span><span class="ce-gq">'+ceChip(ceGrowth(m,qi,'qoq',uv.v))+'</span>'
      : '<span class="ce-empty">—</span>';
    var mExpC=(mgn&&den)?ceMarginPct(c,den.c):null, mExpU=(mgn&&den)?ceMarginPct(uv?uv.v:null,den.s):null;
    var mPrevY=(mgn&&den)?ceMarginPct(m.qy[qi],den.qy):null, mPrevQ=(mgn&&den)?ceMarginPct(m.qq[qi],den.qq):null;
    return '<div class="ce-mcell'+(which==='cust'?' cust':'')+(m.t==='basis'?' flagged':'')+'">'+
      '<div class="ce-mcell-k">'+esc(m.k)+'</div>'+
      '<div class="ce-mtbl">'+
        '<span class="ce-mrl"></span><span class="ce-mh ce-mcol-cons">Street</span><span class="ce-mh ce-mcol-us">Summit</span>'+
        '<span class="ce-mrl">est</span><span class="ce-mv ce-mcol-cons">'+street+'</span><span class="ce-mv ce-mcol-us">'+summitCell+'</span>'+
        ((mgn&&den)?('<span class="ce-mrl ce-mmc">margin</span>'+
          '<span class="ce-mv ce-mgn-v ce-mmc ce-mcol-cons">'+(mExpC!=null?mExpC+'%':'—')+'</span>'+
          '<span class="ce-mv ce-mgn-v ce-mmc ce-mcol-us">'+(mExpU!=null?mExpU+'%':'—')+'</span>'+
          ((mPrevY!=null||mPrevQ!=null)?'<span class="ce-mprev ce-mmc">'+(mPrevY!=null?'<span class="ce-mm-b yoy"><span class="ce-mprev-l">a year ago</span>'+mPrevY+'%</span>':'')+(mPrevQ!=null?'<span class="ce-mm-b qoq"><span class="ce-mprev-l">prior quarter</span>'+mPrevQ+'%</span>':'')+'</span>':'')):'')+
      '</div></div>';
  }).join('')+'</div>';
}

// ── D · the print scorecard (cePrintBlock + cePrintChart) — every metric ranked by SURPRISE, cards
// or a diverging %-surprise chart, vs-Street ⇄ vs-Summit ⇄ Both. Ported from amzn.js (the "?" info
// button is dropped — no pop-up host in this module).
function cePrintChartRows(qi, us){
  us=us||{};
  return CE_CONS.m.map(function(m){
    var c=m.qr[qi]?m.qr[qi][3]:null, a=m.qa[qi];
    var uexp=(us[m.k]&&us[m.k].v!=null)?us[m.k].v:null;
    if(c==null&&a==null&&uexp==null) return null;
    var cS=(c!=null&&a!=null&&c)?((a/c-1)*100):null;
    var uS=(uexp!=null&&a!=null&&uexp)?((a/uexp-1)*100):null;
    return { k:m.k, cS:cS, uS:uS, c:c, uexp:uexp, a:a, u:m.u };
  }).filter(Boolean);
}
function cePrintChart(qi, us){
  var rows=cePrintChartRows(qi, us);
  var withSurp=rows.filter(function(r){ return r.cS!=null||r.uS!=null; });
  if(withSurp.length<2) return '';
  var mags=[];
  withSurp.forEach(function(r){ [r.cS,r.uS].forEach(function(v){ if(v!=null && Math.abs(v)<=50) mags.push(Math.abs(v)); }); });
  var axisMax=Math.max(8, Math.ceil(mags.length?Math.max.apply(null,mags):8));
  rows.forEach(function(r){ r.stmt=ceStmtIdx(r.k); r.sa=(r.cS==null?-1:Math.abs(r.cS)); });
  rows.slice().sort(function(a,z){ return z.sa-a.sa; }).forEach(function(r,i){ r.od=i; });
  rows=rows.slice().sort(function(a,z){ return (a.stmt-z.stmt) || (a.od-z.od); });
  function bar(v, cls){
    if(v==null) return '<span class="ce-dv-dot '+cls+'"></span>';
    var k=(Math.abs(v)<2)?'inline':(v>0?'beat':'miss');
    var w=Math.min(Math.abs(v),axisMax)/axisMax*50;
    return '<span class="ce-dv-bar '+cls+' '+(v>=0?'pos':'neg')+' '+k+'" style="width:'+w.toFixed(1)+'%"></span>';
  }
  function val(v, cls){
    if(v==null) return '<span class="ce-dv-v '+cls+' none">—</span>';
    var over=Math.abs(v)>axisMax, k=(Math.abs(v)<2)?'inline':(v>0?'beat':'miss');
    return '<span class="ce-dv-v '+cls+' '+k+'">'+(v>=0?'+':'−')+(Math.round(Math.abs(v)*10)/10)+'%'+(over?'▸':'')+'</span>';
  }
  function tipRow(basis, cls, exp, a, v, u){
    if(v==null && exp==null) return '';
    var col=(v==null)?'#9AA4B0':(Math.abs(v)<2?'#9AA4B0':(v>0?'#0a8f4c':RED));
    var pct=(v==null)?'no est.':((v>=0?'+':'−')+(Math.round(Math.abs(v)*10)/10)+'%');
    return '<div class="ce-dv-tip-l"><span class="ce-dv-tip-b '+cls+'">'+basis+'</span>'+
      '<span class="ce-dv-tip-x">exp <b>'+(ceFmtV(u,exp)||'—')+'</b> · act <b>'+(ceFmtV(u,a)||'—')+'</b></span>'+
      '<span class="ce-dv-tip-p" style="color:'+col+'">'+pct+'</span></div>';
  }
  function vk(surp, exp, a){ if(a==null) return 'none'; if(exp==null) return 'noest'; if(surp==null) return 'none'; return (Math.abs(surp)<2)?'inline':(surp>0?'beat':'miss'); }
  var rowsHtml=rows.map(function(r){
    var tip='<div class="ce-dv-tip"><div class="ce-dv-tip-h">'+esc(r.k)+'</div>'+
      tipRow('Street','ce-exp-cons',r.c,r.a,r.cS,r.u)+tipRow('Summit','ce-exp-us',r.uexp,r.a,r.uS,r.u)+'</div>';
    return '<div class="ce-dv-row" data-vdc="'+vk(r.cS,r.c,r.a)+'" data-vdu="'+vk(r.uS,r.uexp,r.a)+'" style="--od:'+r.od+'">'+
      '<span class="ce-dv-k" title="'+esc(r.k)+'">'+esc(r.k)+'</span>'+
      '<span class="ce-dv-track"><span class="ce-dv-zero"></span>'+bar(r.cS,'ce-exp-cons')+bar(r.uS,'ce-exp-us')+'</span>'+
      '<span class="ce-dv-vwrap">'+val(r.cS,'ce-exp-cons')+val(r.uS,'ce-exp-us')+'</span>'+
      tip+
    '</div>';
  }).join('');
  return '<div class="ce-dv">'+
    '<div class="ce-dv-cap">Every metric on one surprise axis, so different scales line up. '+
      'Reading <b class="ce-exp-cons">vs Street</b><b class="ce-exp-us">vs Summit</b>: green beats grow right, red misses grow left. A ▸ means the surprise runs past the axis.</div>'+
    '<div class="ce-dv-rows">'+rowsHtml+'</div>'+
    '<div class="ce-dv-axis"><span>−'+axisMax+'%</span><span>in line</span><span>+'+axisMax+'%</span></div>'+
  '</div>';
}
function cePrintBlock(qLabel, r, us){
  var qi=CE_CONS.q.indexOf(qLabel); if(qi<0) return '';
  r=r||{}; us=us||{};
  var revM=CE_CONS.m.filter(function(x){ return x.k==='Revenue'; })[0];
  var GRN='#0a8f4c';
  function denVals(dk){
    var dm=ceMetricByKey(dk); if(!dm) return null;
    var dc=(dm.qr[qi])?dm.qr[qi][3]:null;
    return { a:dm.qa[qi], c:dc, s:(us[dk]&&us[dk].v!=null)?us[dk].v:dc, qy:dm.qy[qi], qq:dm.qq[qi] };
  }
  function ceGwSpan(val, prior){
    if(val==null||prior==null||!prior) return '<span class="ce-tv-e">—</span>';
    var gv=Math.round((val/prior-1)*100);
    return '<span style="color:'+(gv>=0?GRN:RED)+'">'+(gv>=0?'+':'−')+Math.abs(gv)+'%</span>';
  }
  function ceMgExpSpan(real, prior){
    if(real==null) return '<span class="ce-tv-e">—</span>';
    var col=(prior==null)?'var(--navy)':(real>=prior?GRN:RED);
    return '<span style="color:'+col+';font-weight:800">'+real+'%</span>';
  }
  var rows=CE_CONS.m.map(function(m){
    var c=m.qr[qi]?m.qr[qi][3]:null, a=m.qa[qi];
    var uexp=(us[m.k]&&us[m.k].v!=null)?us[m.k].v:null;
    if(c==null&&a==null&&uexp==null) return null;
    var cSurp=(c!=null&&a!=null&&c)?((a/c-1)*100):null;
    var uSurp=(uexp!=null&&a!=null&&uexp)?((a/uexp-1)*100):null;
    return { m:m, c:c, a:a, uexp:uexp, cSurp:cSurp, uSurp:uSurp,
      cV:ceVerdict(m,c,a,cSurp), uV:ceVerdict(m,uexp,a,uSurp),
      py:m.qy[qi], pq:m.qq[qi], stmt:ceStmtIdx(m.k),
      surpAbs:(cSurp==null?-1:Math.abs(cSurp)) };
  }).filter(Boolean);
  if(!rows.length) return '';
  rows.slice().sort(function(x,z){ return z.surpAbs-x.surpAbs; }).forEach(function(r,i){ r.od=i; });
  rows.sort(function(x,z){ return (x.stmt-z.stmt) || (x.od-z.od); });
  var tiles=rows.map(function(r){
    var m=r.m, c=r.c, a=r.a, uexp=r.uexp, cV=r.cV, uV=r.uV;
    var sp=function(s){ return (s==null)?'':' <span class="ce-fz-sp">'+(s>=0?'+':'−')+(Math.round(Math.abs(s)*10)/10)+'%</span>'; };
    var surpFmt=function(s){ return (s==null)?'—':((s>=0?'+':'−')+(Math.round(Math.abs(s)*10)/10)+'%'); };
    var actStr=(a==null?'—':ceTkFmt(m.u,a));
    var denK=CE_MARGIN_DEN[m.k], mgnOn=!!denK, den=mgnOn?denVals(denK):null;
    var mReal=(mgnOn&&den)?ceMarginPct(a,den.a):null;
    var mExpC=(mgnOn&&den)?ceMarginPct(c,den.c):null, mExpU=(mgnOn&&den)?ceMarginPct(uexp,den.s):null;
    var mPY=(mgnOn&&den&&r.py!=null)?ceMarginPct(r.py,den.qy):null;
    var mPQ=(mgnOn&&den&&r.pq!=null)?ceMarginPct(r.pq,den.qq):null;
    var hasMgn=(mgnOn&&mReal!=null);
    var cK=cV.k, uK=uV.k, cHas=(cK==='beat'||cK==='miss'||cK==='inline'), uHas=(uK==='beat'||uK==='miss'||uK==='inline');
    var mixed=(cHas&&uHas&&cK!==uK);
    var bothV=(cHas&&uHas)?((cK===uK)?{l:cV.l+' ×2',c:cV.c}:{l:'MIXED',c:AMBER}):(cHas?{l:cV.l,c:cV.c}:(uHas?{l:uV.l,c:uV.c}:{l:'—',c:'#6b7684'}));
    var hdr='<div class="ce-fz-k"><span class="ce-fz-kn">'+esc(m.k)+'</span>'+
      '<span class="ce-fz-vd ce-vd-cons" style="color:'+cV.c+'">'+cV.l+sp(r.cSurp)+'</span>'+
      '<span class="ce-fz-vd ce-vd-us" style="color:'+uV.c+'">'+uV.l+sp(r.uSurp)+'</span>'+
      '<span class="ce-fz-vd ce-vd-both" style="color:'+bothV.c+'">'+bothV.l+'</span></div>';
    function gcell(v){ return '<span class="ce-gy">'+ceGwSpan(v,r.py)+'</span><span class="ce-gq">'+ceGwSpan(v,r.pq)+'</span>'; }
    var tbl='<div class="ce-fz-tbl">'+
      '<span class="ce-fz-rl"></span>'+
      '<span class="ce-fz-ch ce-col-cons">Street</span>'+
      '<span class="ce-fz-ch ce-col-us">Summit</span>'+
      '<span class="ce-fz-ch ce-col-act">Actual</span>'+
      '<span class="ce-fz-rl"></span>'+
      '<span class="ce-fz-cv ce-fz-exp ce-col-cons">'+(c==null?'—':ceTkFmt(m.u,c))+'</span>'+
      '<span class="ce-fz-cv ce-fz-exp ce-col-us">'+(uexp==null?'—':ceTkFmt(m.u,uexp))+'</span>'+
      '<span class="ce-fz-cv ce-fz-act ce-col-act">'+actStr+'</span>'+
      '<span class="ce-fz-rl ce-fz-gc">Growth</span>'+
      '<span class="ce-fz-cv ce-fz-gc ce-col-cons">'+gcell(c)+'</span>'+
      '<span class="ce-fz-cv ce-fz-gc ce-col-us">'+gcell(uexp)+'</span>'+
      '<span class="ce-fz-cv ce-fz-gc ce-col-act">'+gcell(a)+'</span>'+
      (hasMgn?('<span class="ce-fz-rl ce-fz-mc">Margin</span>'+
        '<span class="ce-fz-cv ce-fz-mc ce-col-cons">'+(mExpC!=null?mExpC+'%':'—')+'</span>'+
        '<span class="ce-fz-cv ce-fz-mc ce-col-us">'+(mExpU!=null?mExpU+'%':'—')+'</span>'+
        '<span class="ce-fz-cv ce-fz-mc ce-col-act"><span class="ce-gy">'+ceMgExpSpan(mReal,mPY)+'</span><span class="ce-gq">'+ceMgExpSpan(mReal,mPQ)+'</span></span>'):'')+
      '<span class="ce-fz-rl ce-fz-surp">Surprise</span>'+
      '<span class="ce-fz-cv ce-fz-surp ce-col-cons" style="color:'+cV.c+';font-weight:800">'+surpFmt(r.cSurp)+' '+cV.l+'</span>'+
      '<span class="ce-fz-cv ce-fz-surp ce-col-us" style="color:'+uV.c+';font-weight:800">'+surpFmt(r.uSurp)+' '+uV.l+'</span>'+
      '<span class="ce-fz-cv ce-fz-surp ce-col-act"></span>'+
    '</div>';
    return '<div class="ce-fz-t" data-vdc="'+cV.k+'" data-vdu="'+uV.k+'" data-cat="'+ceCat(m.k)+'" data-mixed="'+(mixed?1:0)+'" style="--od:'+r.od+'">'+hdr+tbl+'</div>';
  });
  return '<div class="ce-fz" data-g="yoy" data-ev="cons" data-mm="on" data-view="cards" data-ord="stmt" data-fzcat="all"><div class="ce-fz-h">The print — down the income statement, ranked by surprise</div>'+
    '<span class="ce-gseg"><button type="button" class="active" data-fzview="cards">Cards</button>'+
      '<button type="button" data-fzview="chart">Chart</button></span>'+
    '<span class="ce-gseg"><button type="button" class="active" data-fzev="cons">vs Street</button>'+
      '<button type="button" data-fzev="us">vs Summit</button>'+
      '<button type="button" data-fzev="both">Both</button></span>'+
    '<span class="ce-vdf"><button type="button" class="active" data-vdf="all">All</button>'+
      '<button type="button" data-vdf="beat">Beats</button>'+
      '<button type="button" data-vdf="miss">Misses</button>'+
      '<button type="button" data-vdf="inline">In line</button></span>'+
    '<span class="ce-gseg"><button type="button" class="active" data-fzord="stmt">Statement order</button>'+
      '<button type="button" data-fzord="surp">By surprise</button></span>'+
    '<span class="ce-gseg ce-gseg-cardsonly"><button type="button" class="active" data-fzcat="all">All</button>'+
      '<button type="button" data-fzcat="top">Top line</button>'+
      '<button type="button" data-fzcat="bottom">Bottom line</button></span>'+
    '<span class="ce-gseg ce-gseg-cardsonly"><button type="button" class="active" data-fzmm="on">Margin</button>'+
      '<button type="button" data-fzmm="off">Hide mgn</button></span>'+
    '<span class="ce-gseg ce-gseg-cardsonly"><button type="button" class="active" data-ceg="yoy">YoY</button>'+
      '<button type="button" data-ceg="qoq">QoQ</button>'+
      '<button type="button" data-ceg="off">Off</button></span>'+
    '</div>'+cePrintChart(qi, us)+'<div class="ce-fz-g" data-vdf-host>'+tiles.join('')+'</div></div>';
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// POST-RESULTS CONTENT — authored from docs/calls/NVDA.md (the 10 provided transcripts). Newest
// quarter is fully built (AI Summary · Points · The call classified · Also on the call); the older
// reported quarters carry AI Summary · Points · Also on the call. Verbatim quotes are transcript
// direct speech (Jensen Huang / Colette Kress), attributed, with the load-bearing part bolded.
// ═══════════════════════════════════════════════════════════════════════════════════════════════
var RESULTS={
  'Q1 2027':{
    ai:'The reporting recut is the analytical event of the quarter. Splitting Data Center into Hyperscale and ACIE reframes the growth debate around whether the fragmented ACIE base can keep outpacing the concentrated hyperscale base, which is the variable that governs how durable the trajectory is. Management’s stated expectation that the company grows faster than hyperscale capex shifts the bull case toward the breadth of buyers rather than the spend of the largest five, and the sovereign and AI-cloud commentary supports that read. Networking reaching a largest-in-the-world claim turns the sell-the-whole-rack thesis into a reported line the model can track. Vera Rubin entering production in the second half sets the next ramp against a demanding Blackwell comparison, and the standalone Vera CPU introduces a category the model has never carried, which is where the largest forecast uncertainty now sits. Gross margin holding in the mid-70s while memory prices rise keeps the pricing-power question live, since management ties the margin to delivering generational performance gains. The capital-return step-up reads as confidence in a rising free-cash-flow base while leaving reinvestment as the first priority. China stays outside the outlook, so any H200 clearance would be upside the numbers do not assume.',
    points:[
      { tag:'Segment framework', h:'The Hyperscale / ACIE recut changes what the DC number means.', d:'Data Center is now split into <b>Hyperscale</b> (public cloud + the largest consumer-internet buyers) and <b>ACIE</b> (AI clouds, industrial, enterprise, sovereign). Hyperscale ~$38B (~50% of DC); ACIE ~$37B with AI-cloud revenue more than 3x YoY. Ask whether ACIE keeps leading, since that is the higher-growth, more fragmented cut Jensen expects to win long term.' },
      { tag:'Grow faster than capex', h:'Management anchors the bull case to breadth of buyers.', d:'Jensen: “we should be growing faster than hyperscale CapEx.” He frames hyperscale capex near $1T this year heading toward $3-4T, with the second category (AI-native clouds, ~250,000 enterprises, sovereign) expected to grow faster. The claim to test is whether ACIE can sustain that lead.' },
      { tag:'Networking', h:'Networking is now presented as the largest such business in the world.', d:'DC networking ~$15B, nearly tripled YoY; Spectrum-X described as larger than all ethernet peers combined; InfiniBand more than 4x YoY. This is the reported evidence behind the rack-level rather than chip-level thesis.' },
      { tag:'Vera Rubin', h:'Vera Rubin production starts H2 against a hard Blackwell comp.', d:'Production shipments begin in Q3, ramping into Q4, inside a $1T Blackwell+Rubin revenue view spanning 2025 through calendar 2027. Colette flagged that Q1 of next year is going to be very big. Watch the ramp slope versus Blackwell’s.' },
      { tag:'Vera CPU', h:'The standalone Vera CPU opens a category the model does not carry.', d:'Jensen: “the $20 billion is for a standalone CPU,” and Vera “opens a brand-new $200 billion TAM.” ~$20B of total CPU revenue visibility this year across four Vera use cases. This is where forecast uncertainty is highest.' },
      { tag:'China / export controls', h:'China stays out of the outlook.', d:'H200 licenses for China were approved but generated zero revenue, and imports remain uncertain. Consistent with prior quarters, the guide assumes no China DC compute, so any clearance is upside the numbers exclude.' },
      { tag:'Gross margin', h:'Mid-70s gross margin held despite rising memory costs.', d:'GAAP GM 74.9% / non-GAAP 75%, roughly flat sequentially, full year guided mid-70s. Management ties the margin to delivering generational performance-per-watt gains, so the Blackwell to Rubin transition and memory pricing are the levers to watch.' },
      { tag:'Capital return', h:'Capital return stepped up materially.', d:'Dividend raised to $0.25 (Jensen corrected the $0.20 print live), an $80B buyback authorization on top of $39B remaining, and a plan to return ~50% of free cash flow this year against record $49B FCF.' }
    ],
    prepared:[
      { topic:'New reporting framework: Hyperscale, ACIE, Edge', theme:'Segment framework', body:'Two market platforms (Data Center and Edge Computing). Within Data Center, two sub-markets: <b>Hyperscale</b> (public cloud + the largest consumer-internet companies) and <b>ACIE</b> (AI clouds, industrial, enterprise, sovereign). Nine quarters of recast history posted to the website. Hyperscale $38B (~50% of DC, +12% QoQ); ACIE $37B (+31% QoQ, AI-cloud revenue >3x YoY).' },
      { topic:'Data Center and the Blackwell ramp', theme:'Data Center', body:'Data Center revenue $75B (+92% YoY, +21% QoQ) driven by Blackwell, with GB300 and NVL72 demand called particularly strong. DC compute $60B (+77% YoY); DC networking $15B (nearly tripled YoY). Partner data centers exceeding 10 MW nearly doubled in a year to over 80 sites; sovereign revenue +80% YoY.' },
      { topic:'Vera Rubin and the annual cadence', theme:'Vera Rubin', body:'Vera Rubin production shipments in H2 starting Q3; 7 chips across 5 racks; up to 35x higher inference throughput and up to 10x greater AI-factory revenue versus Blackwell. A $1T Blackwell+Rubin revenue view spans 2025 through calendar 2027.' },
      { topic:'Edge Computing and Physical AI', theme:'Physical AI', body:'Edge Computing $6.4B (+10% QoQ, +29% YoY); robust Blackwell workstation demand, with consumer demand modestly lower on higher memory and system prices. Physical AI more than $9B over the trailing twelve months. Uber partnership to power a Robotaxi fleet across nearly 30 cities and four continents by 2028.' },
      { topic:'China and the H200 licenses', theme:'China / export controls', body:'The US government approved H200 licenses for China customers, but no revenue was generated and it is uncertain whether imports will be allowed. Consistent with last quarter, the outlook assumes no China data center compute revenue.' },
      { topic:'Margins, cash and capital allocation', theme:'Gross margin', body:'GAAP GM 74.9% / non-GAAP 75%, largely flat sequentially on Blackwell mix. Record free cash flow $49B (up from $35B in Q4). Dividend raised from $0.01 to $0.25; $80B buyback authorization added to $39B remaining; plan to return ~50% of FCF this year.' },
      { topic:'Q2 FY2027 guidance', theme:'Guidance', body:'Total revenue $91B ±2%, growth led by Data Center. Gross margins 74.9% / 75% ±50bps (full year mid-70s). Opex ~$8.5B GAAP / $8.3B non-GAAP; full-year opex growth in the upper-40s%. Tax rate 16-18%. No China DC compute assumed.' }
    ],
    qanda:[
      { q:'Why re-segment the business now?', analyst:'Joe Moore · Morgan Stanley', theme:'Segment framework', a:'Jensen: “We wanted you to understand our business better. AI is very diverse and computing is diverse… the way we broke it out into three large segments… It would be the hyperscale clouds… The second segment is AI natives, enterprise on-prems, industrial on-prems, and sovereign AI. <b>That segment is growing incredibly fast</b>… Of course, the robotic edge.” He added: “The easiest go-to-market… is the hyperscaler, because there are only five or six of them. The rest of the industry represents a couple of 250,000 companies around the world.”' },
      { q:'Can NVIDIA grow faster than hyperscaler capex?', analyst:'Ben Reitzes · Melius', theme:'Grow faster than capex', a:'Jensen: “<b>First of all, we should be growing faster than hyperscale CapEx.</b>” He split DC into hyperscale (capex ~$1T this year, growing toward $3-4T) and “all of the AI native clouds… enterprise, 250,000 enterprise companies… and sovereign AI clouds,” expecting the second category to grow faster long term.' },
      { q:'What is the $20B standalone CPU?', analyst:'Vivek Arya · BofA', theme:'Vera CPU', a:'Jensen: “<b>The $20 billion is for a standalone CPU.</b>” Vera is used four ways: paired with Rubin, as a standalone CPU, in a Vera+CX9 storage stack, and in a Vera+CX9 security / confidential-compute stack. “The harness runs on CPU… All of the thinking happens on GPUs. All of the orchestration essentially runs on CPUs.”' },
      { q:'Are you gaining inference share?', analyst:'CJ Muse · Cantor', theme:'Data Center', a:'Jensen: “we are growing share and inference, and we’re growing share and inference very quickly… <b>Vera Rubin’s going to be even more successful than Grace Blackwell.</b>”' },
      { q:'What is the Vera Rubin ramp cadence?', analyst:'Josh Buchalter · TD Cowen', theme:'Vera Rubin', a:'Colette: “we will be launching Vera Rubin in the second half. We will start in Q3… Once we get to Q4, we’re probably going to start to see our ramping continue… <b>Q1 of next year certainly is going to be very big as well.</b>”' }
    ],
    also:[
      { tag:'physical AI', hd:'Physical AI passed $9B of trailing-12-month revenue, with the Uber robotaxi partnership targeting ~30 cities by 2028.', body:'Framed as the next leg after agentic AI. Small relative to Data Center, but worth citing as the leading edge of the Edge Computing story.' },
      { tag:'supply', hd:'Total supply (inventory + purchase commitments + prepaids) reached $145B.', body:'A capacity-commitment signal management uses to argue demand visibility. Worth reading against the $1T Blackwell+Rubin view.' },
      { tag:'demand', hd:'H100 rental prices rose ~20% year to date and A100 cloud pricing ~15%.', body:'Cited as evidence that prior-generation capacity is still fully utilized, supporting the ROI argument for continued buildout.' },
      { tag:'tax', hd:'Non-GAAP tax rate 16%, with the FY guide lowered to 16-18% on geographic mix.', body:'A modest tailwind to reported profitability relative to the prior 17-19% framing.' }
    ]
  },
  'Q4 2026':{
    ai:'The quarter set up the framework change that lands next quarter and confirmed networking as the second reported growth engine. Management reframed gross margin around delivering generational customer value, which keeps the mid-70s commitment tied to product cadence rather than to cost control alone. The Rubin unveiling and the first Vera Rubin samples move the next platform from roadmap to shipping schedule. Including stock-based compensation in non-GAAP changes how the profitability line should be read going forward, so comparisons across the transition need care. Sovereign demand crossing a meaningful annual figure broadens the buyer base ahead of the ACIE disclosure.',
    points:[
      { tag:'Networking', h:'Networking became a standout and roughly two-thirds of DC.', d:'Networking $11B (more than 3.5x YoY), with Grace Blackwell systems about two-thirds of DC revenue. Full-year networking exceeded $31B, more than 10x versus FY2021, the year Mellanox was acquired.' },
      { tag:'Gross margin', h:'Management named the single most important margin lever.', d:'Jensen: “The single most important lever of our gross margins is actually delivering generational leaps to our customers.” GAAP GM 75% / non-GAAP 75.2%, improving sequentially as Blackwell ramped.' },
      { tag:'Vera Rubin', h:'Rubin moved from roadmap to samples.', d:'Rubin unveiled at CES (6 chips); first Vera Rubin samples shipped; production in H2. The first Blackwell wafer on US soil came off TSMC Arizona.' },
      { tag:'Non-GAAP change', h:'SBC now sits inside non-GAAP results.', d:'Starting this quarter stock-based compensation is included in non-GAAP; the Q1 FY2027 opex guide carries about $1.9B of SBC, so the profitability optics shift with it.' },
      { tag:'Data Center', h:'Ecosystem investments widened.', d:'Anthropic partnership plus a $10B investment; Groq licensing for low-latency inference. Jensen frames the investments as expanding ecosystem reach rather than financial bets.' },
      { tag:'Physical AI', h:'Physical AI and sovereign both scaled.', d:'Physical AI exceeded $6B in FY2026; sovereign AI exceeded $30B, more than 3x YoY.' }
    ],
    prepared:[
      { topic:'Data Center and networking', theme:'Networking', body:'Q4 Data Center $62B (+75% YoY, +22% QoQ) on the Blackwell and Blackwell Ultra ramp; 9 GW of Blackwell infrastructure deployed. Networking $11B (>3.5x YoY); full-year networking >$31B (>10x vs FY2021).' },
      { topic:'Rubin platform', theme:'Vera Rubin', body:'Rubin platform unveiled at CES (Vera CPU, Rubin GPU, NVLink 6 Switch, ConnectX-9 SuperNIC, BlueField-4 DPU, Spectrum-6). First Vera Rubin samples shipped; production H2.' },
      { topic:'Margins, cash and SBC', theme:'Gross margin', body:'GAAP GM 75% / non-GAAP 75.2%. Free cash flow $35B in Q4 and $97B for FY2026; returned $41B (43% of FCF) for the year. Stock-based compensation now included in non-GAAP starting this quarter.' }
    ],
    qanda:[
      { q:'How should we read the ecosystem investments?', analyst:'Prepared / Q&A', theme:'Data Center', a:'Jensen: “at the core of everything NVIDIA is our ecosystem… Our investments are focused very squarely, strategically on expanding and deepening our ecosystem reach.”' },
      { q:'What sustains gross margins through the transition?', analyst:'Prepared / Q&A', theme:'Gross margin', a:'Jensen: “The single most important lever of our gross margins is actually delivering generational leaps to our customers… If we can deliver performance per dollar dramatically more than… the price of our systems, then we can continue to sustain our gross margins.”' },
      { q:'What is the plan with Groq?', analyst:'Prepared / Q&A', theme:'Data Center', a:'Jensen: “What we’ll do with Groq is… we’ll extend our architecture with Groq as an accelerator, in very much the way that we extended NVIDIA’s architecture with Mellanox.”' }
    ],
    also:[
      { tag:'segments', hd:'ProViz crossed $1B for the first time ($1.3B, +159% YoY); Gaming $3.7B (+47% YoY).', body:'ProViz reaching the billion mark is worth citing; gaming supply was flagged as a Q1 headwind despite healthy channel inventory.' },
      { tag:'cash', hd:'Returned $41B for FY2026, 43% of free cash flow.', body:'The base that the ~50%-of-FCF Q1 FY2027 commitment steps up from.' }
    ]
  },
  'Q3 2026':{
    ai:'The print reinforced the visibility argument that underpins the multiyear thesis and answered the demand-durability question directly. Management pushed back on the bubble framing by grounding the buildout in overlapping platform shifts rather than a single cycle, which is the qualitative case a reader should carry into the model. Networking claiming the largest-in-the-world position for the first time set up the recut disclosure that follows. The rising visibility figure matters less as a number and more as evidence that forward capacity is being reserved, which is what the durability debate turns on.',
    points:[
      { tag:'Vera Rubin', h:'Forward visibility stepped up to a half-trillion figure.', d:'$500B of Blackwell and Rubin revenue visibility from the start of the year through end of CY2026, with GB300 crossing over GB200 at about two-thirds of Blackwell. Colette said the number will grow.' },
      { tag:'Networking', h:'Networking called the largest in the world.', d:'Networking $8.2B (+162% YoY) across NVLink, InfiniBand and Spectrum-X. This is the first quarter management applied the largest-in-the-world label that recurs afterward.' },
      { tag:'Data Center', h:'Bubble pushback was framed as three platform shifts.', d:'Jensen argued the buildout reflects CPU-to-GPU accelerated computing, generative AI replacing classical machine learning, and agentic plus physical AI happening at once, rather than a single overheating cycle.' },
      { tag:'China / export controls', h:'H20 orders never materialized.', d:'Hopper contributed ~$2B in its 13th quarter; H20 was only ~$50M as sizable orders failed to appear on geopolitics and China competition, keeping China DC compute effectively out of the base.' }
    ],
    prepared:[
      { topic:'Data Center and visibility', theme:'Vera Rubin', body:'Record Q3 Data Center $51B (+66% YoY); compute +56% YoY, networking more than doubled. $500B Blackwell and Rubin visibility from start of year through end of CY2026. OpenAI partnership to build at least 10 GW; Anthropic adopting NVIDIA for the first time.' },
      { topic:'Networking', theme:'Networking', body:'Networking, purpose-built for AI and now the largest in the world, generated $8.2B (+162% YoY), with NVLink, InfiniBand and Spectrum-X all contributing.' }
    ],
    qanda:[
      { q:'Is this an AI bubble?', analyst:'Prepared / Q&A', theme:'Data Center', a:'Jensen: “From our vantage point, we see something very different… The world is undergoing three massive platform shifts at once… CPU to GPU accelerated computing… Generative AI replacing Classical Machine Learning… Agentic and Physical AI.”' },
      { q:'Can the $500B visibility grow?', analyst:'Prepared / Q&A', theme:'Vera Rubin', a:'Colette: “we are on track for that… The number will grow… Anthropic is also not new. There is definitely an opportunity for us to have more on top of the $500 billion.”' }
    ],
    also:[
      { tag:'per-GW', hd:'Management sized content per gigawatt: Hopper $20-25B, Grace Blackwell around $30B, Rubin higher.', body:'A useful framing for translating announced gigawatts of AI factories into NVIDIA revenue.' },
      { tag:'segments', hd:'Gaming $4.3B (+30% YoY); ProViz $760M record; Auto $592M (+32% YoY).', body:'Non-DC lines remained healthy but are now a small share of the mix.' }
    ]
  },
  'Q2 2026':{
    ai:'The quarter tested whether Data Center could grow through the China disruption, and it did, which is the durability signal that matters for the model. Management separated the China question from the underlying trajectory by quantifying the H20 impact and the shippable-if-resolved range, so the reader can hold China as optional upside rather than embedded demand. Networking setting a record and the sovereign figure scaling both broaden the base away from the largest US clouds.',
    points:[
      { tag:'China / export controls', h:'Data Center grew despite a large H20 decline.', d:'DC grew sequentially even with a roughly $4B decline in H20 revenue; $650M of H20 was sold to an unrestricted customer outside China, with $2-5B shippable in Q3 if geopolitics resolve, which is excluded from the outlook.' },
      { tag:'Networking', h:'Networking set a record and Spectrum-X scaled.', d:'Networking $7.3B (+46% QoQ, +98% YoY); Spectrum-X annualizing above $10B. The rack-level attach story kept compounding.' },
      { tag:'Vera Rubin', h:'GB300 production began and Blackwell Ultra scaled.', d:'GB300 production shipments began, with Blackwell Ultra described as generating tens of billions and roughly 1,000 GB300 racks per week at run rate.' },
      { tag:'Capital return', h:'A fresh buyback authorization was added.', d:'Returned $10B in the quarter and the board approved a $60B repurchase authorization on top of $14.7B remaining.' }
    ],
    prepared:[],
    qanda:[],
    also:[
      { tag:'segments', hd:'Gaming record $4.3B (+49% YoY); ProViz $601M; Auto $586M (+69% YoY).', body:'Gaming and Auto continued to grow, though both are minor relative to Data Center.' },
      { tag:'geography', hd:'Singapore was 22% of billed revenue, with more than 99% tied to US-based customers.', body:'A recurring disclosure that pre-empts the billing-location question on China exposure.' }
    ]
  },
  'Q1 2026':{
    ai:'The quarter was defined by the export-control shock, and the useful read is how cleanly management isolated it from the underlying demand. Quantifying the charge, the unshippable amount and the closed China TAM lets the reader treat China as removed from the base rather than as a swing factor, which simplifies the forward model. Blackwell reaching the bulk of DC compute confirmed the platform transition was essentially complete, so the growth engine is the new architecture rather than a Hopper tail.',
    points:[
      { tag:'China / export controls', h:'The April export ban forced a large charge.', d:'A $4.5B H20 charge on inventory and purchase obligations after the April 9 controls, with $2.5B unshippable in the quarter and the China accelerator TAM, estimated near $50B, described as effectively closed to US industry.' },
      { tag:'Data Center', h:'Blackwell reached the bulk of DC compute.', d:'Blackwell was nearly 70% of data center compute revenue with the Hopper transition nearly complete; hyperscalers deploying about 1,000 NVL72 racks per week and GB300 sampling.' },
      { tag:'Networking', h:'Networking growth resumed.', d:'Networking $5B (+64% QoQ), with NVLink shipments above $1B and Spectrum-X annualizing above $8B after adding Google Cloud and Meta.' },
      { tag:'Gross margin', h:'The reported margin was distorted by the charge.', d:'GAAP GM 60.5% / non-GAAP 61%, but excluding the $4.5B charge non-GAAP would have been 71.3%, slightly above the outlook, with the mid-70s target reaffirmed for later in the year.' }
    ],
    prepared:[],
    qanda:[],
    also:[
      { tag:'segments', hd:'Gaming record $3.8B (+42% YoY, Blackwell the fastest ramp ever); Auto $567M (+72% YoY).', body:'The consumer and automotive lines were strong but immaterial next to the China charge in the quarter.' },
      { tag:'inference', hd:'Reasoning inference framed as roughly 1000x the token load of a one-shot chatbot.', body:'The demand argument for why inference, not just training, drives the compute buildout.' }
    ]
  }
};

// ═══ RENDER — body ═══════════════════════════════════════════════════════════════════════════════
function styleTag(){
  return '<style>'+
    '.nve-wrap{--nve-brand:'+BRAND+'}'+
    /* phase tabs */
    '.nve-wrap .ce-phtabs{display:inline-flex;gap:3px;background:rgba(118,185,0,0.10);border:1px solid var(--bdr);border-radius:9px;padding:4px;margin:0 0 18px}'+
    '.nve-wrap .ce-phtab{background:none;border:none;color:var(--mu);font-family:\'Inter\',sans-serif;font-size:12px;letter-spacing:.5px;text-transform:uppercase;font-weight:600;padding:7px 16px;border-radius:6px;cursor:pointer;transition:all .15s;white-space:nowrap}'+
    '.nve-wrap .ce-phtab:hover{color:var(--navy)}.nve-wrap .ce-phtab.active{background:'+BRAND+';color:#10241a}'+
    '.nve-wrap .ce-phpane[hidden]{display:none}'+
    /* quarter pills */
    '.nve-wrap .ce-qpills{display:flex;gap:6px;flex-wrap:wrap;margin:0 0 16px}'+
    '.nve-wrap .ce-qpills[hidden]{display:none}'+
    '.nve-wrap .ce-qpill{border:1px solid var(--bdr);background:var(--w);font:inherit;font-size:11px;font-weight:800;color:var(--mu);padding:5px 13px;border-radius:999px;cursor:pointer;transition:.12s}'+
    '.nve-wrap .ce-qpill:hover{color:var(--navy)}.nve-wrap .ce-qpill.active{background:var(--navy);color:#fff;border-color:var(--navy)}'+
    '.nve-wrap .ce-qpill .ce-qtag{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;margin-left:6px;opacity:.75}'+
    '.nve-wrap .ce-qpill[hidden]{display:none}'+
    '.nve-wrap .ce-qblock[hidden]{display:none}'+
    '.nve-wrap .ce-phase{display:inline-block;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.5px;color:#10241a;background:'+BRAND+';border-radius:20px;padding:3px 10px;margin-bottom:10px}'+
    '.nve-wrap .ce-frozen{display:inline-block;font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#fff;background:'+GRAY+';border-radius:20px;padding:2px 8px;margin-left:7px;vertical-align:middle}'+
    '.nve-wrap .ce-uptag{display:inline-block;font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#fff;background:'+AMBER+';border-radius:20px;padding:2px 8px;margin-left:7px;vertical-align:middle}'+
    '.nve-wrap .ce-note{font-size:11px;color:var(--mu);line-height:1.5;background:#F7F9FB;border:1px solid var(--bdr);border-radius:9px;padding:9px 12px;margin:0 0 12px}'+
    '.nve-wrap .ce-empty{color:var(--mu);font-style:italic;opacity:.7}'+
    '.nve-wrap .ov-sec-h{font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--navy);margin:0 0 8px}'+
    /* AI summary */
    '.nve-ai{border:1px solid var(--bdr);border-left:4px solid '+BRAND2+';border-radius:12px;padding:14px 16px;margin:6px 0 16px;background:linear-gradient(180deg,rgba(31,138,112,0.05),transparent)}'+
    '.nve-ai-k{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:'+BRAND2+';margin-bottom:7px}'+
    '.nve-ai-k::before{content:\"\";width:7px;height:7px;border-radius:50%;background:'+BRAND2+'}'+
    '.nve-ai-t{font-size:12.5px;line-height:1.65;color:var(--navy)}'+
    /* points for the call */
    '.nve-cap{font-size:11px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:var(--navy);margin:16px 0 8px}'+
    '.nve-cap span{color:var(--mu);font-weight:600;text-transform:none;letter-spacing:0;font-size:10.5px;margin-left:6px}'+
    '.nve-pts{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:9px}'+
    '.nve-pt{border:1px solid var(--bdr);border-top:3px solid '+BRAND+';border-radius:10px;background:#fff;overflow:hidden}'+
    '.nve-pt>summary{list-style:none;cursor:pointer;padding:10px 12px;display:flex;flex-direction:column;gap:6px}'+
    '.nve-pt>summary::-webkit-details-marker{display:none}'+
    '.nve-pt-tag{align-self:flex-start;font-size:8px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:'+BRAND2+';background:rgba(31,138,112,0.10);border:1px solid rgba(31,138,112,0.28);border-radius:999px;padding:2px 8px}'+
    '.nve-pt-h{font-size:12px;font-weight:700;color:var(--navy);line-height:1.45}'+
    '.nve-pt-more{font-size:9px;font-weight:800;color:'+BLUE+';text-transform:uppercase;letter-spacing:.04em}'+
    '.nve-pt[open] .nve-pt-more{color:var(--mu)}'+
    '.nve-pt-d{font-size:11px;color:var(--navy);line-height:1.6;padding:0 12px 12px;background:#FBFCFE}'+
    '.nve-pt-d b{color:var(--navy);font-weight:800}'+
    /* the call classified */
    '.ce-cc-wrap{margin-top:16px;border:1px solid var(--bdr);border-radius:12px;background:#fff;overflow:hidden}'+
    '.ce-cc-sum{list-style:none;cursor:pointer;display:flex;align-items:center;gap:9px;padding:12px 14px;user-select:none;background:linear-gradient(180deg,#EAF3EC,#F1F7F2);border-bottom:1px solid var(--bdr)}'+
    '.ce-cc-wrap:not([open])>.ce-cc-sum{border-bottom:0}'+
    '.ce-cc-sum::-webkit-details-marker{display:none}'+
    '.ce-cc-sum-t{font-size:12.5px;font-weight:800;color:var(--navy)}'+
    '.ce-cc-sum-s{font-size:10px;font-weight:600;color:var(--mu);flex:1}'+
    '.ce-cc-ar2{font-size:10px;color:var(--mu);transition:transform .18s;flex:none}'+
    '.ce-cc-wrap[open]>.ce-cc-sum .ce-cc-ar2{transform:rotate(180deg)}'+
    '.ce-cc{border-top:1px solid var(--bdr)}'+
    '.ce-cc-h{display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:10px 13px;background:#F6F8FA;border-bottom:1px solid var(--bdr)}'+
    '.ce-cc-seg{margin-left:auto;display:inline-flex;gap:3px;background:rgba(118,185,0,.10);border:1px solid var(--bdr);border-radius:9px;padding:3px}'+
    '.ce-cc-seg button{background:none;border:0;font-family:inherit;font-size:10px;font-weight:800;letter-spacing:.03em;color:var(--mu);padding:5px 11px;border-radius:6px;cursor:pointer;transition:.14s}'+
    '.ce-cc-seg button:hover{color:var(--navy)}.ce-cc-seg button.active{background:'+BRAND+';color:#10241a}'+
    '.ce-cc-pane{display:flex;flex-direction:column}.ce-cc-pane[hidden]{display:none}'+
    '.ce-cc-row{border-bottom:1px solid var(--bdr)}.ce-cc-row:last-child{border-bottom:0}'+
    '.ce-cc-row-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 13px;cursor:pointer;list-style:none}'+
    '.ce-cc-row-h::-webkit-details-marker{display:none}.ce-cc-row-h:hover{background:#FAFBFD}'+
    '.ce-cc-ar{margin-left:auto;color:var(--mu);font-size:10px;transition:transform .15s;flex:none}'+
    '.ce-cc-row[open]>.ce-cc-row-h .ce-cc-ar{transform:rotate(180deg)}'+
    '.ce-cc-topic{font-size:11.5px;font-weight:700;color:var(--navy);line-height:1.45}'+
    '.ce-cc-tag{font-size:8.5px;font-weight:800;letter-spacing:.03em;color:'+BLUE+';background:rgba(37,87,214,.10);border-radius:999px;padding:2px 8px;white-space:nowrap}'+
    '.ce-cc-row-b{font-size:10.5px;color:var(--navy);line-height:1.6;padding:0 13px 11px;font-weight:500;background:#FBFCFE}'+
    '.ce-cc-empty{padding:16px 14px;font-size:10.5px;color:var(--mu);font-weight:600;line-height:1.5;text-align:center;background:#FBFCFE}'+
    '.ce-cc-qa-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:2px 0 6px}'+
    '.ce-cc-bank{font-size:11px;font-weight:900;color:var(--navy)}'+
    '.ce-cc-analyst{font-size:10px;font-weight:600;color:var(--mu)}'+
    '.ce-cc-q,.ce-cc-a{display:grid;grid-template-columns:16px 1fr;gap:8px;font-size:11px;line-height:1.6;margin-top:4px;color:var(--navy)}'+
    '.ce-cc-q{font-weight:600}.ce-cc-a{font-weight:500}'+
    '.ce-cc-ql,.ce-cc-al{font-size:8px;font-weight:900;color:#fff;border-radius:4px;width:15px;height:15px;display:flex;align-items:center;justify-content:center;margin-top:2px}'+
    '.ce-cc-ql{background:'+BLUE+'}.ce-cc-al{background:'+GREEN+'}'+
    /* also on the call */
    '.ce-alsobox{margin-top:18px;border:1px solid var(--bdr);border-radius:12px;background:#fff;overflow:hidden}'+
    '.ce-alsobox>summary.ce-alsobox-h{list-style:none;cursor:pointer;display:flex;align-items:center;gap:10px;padding:11px 13px;background:#F6F8FA}'+
    '.ce-alsobox>summary::-webkit-details-marker{display:none}'+
    '.ce-alsobox[open]>summary.ce-alsobox-h{border-bottom:1px solid var(--bdr)}'+
    '.ce-alsobox-ic{font-size:11px;color:var(--mu);transition:transform .15s;flex:none}'+
    '.ce-alsobox[open] .ce-alsobox-ic{transform:rotate(90deg)}'+
    '.ce-alsobox-htext{display:flex;flex-direction:column;gap:2px;min-width:0}'+
    '.ce-alsobox-htext>b{font-size:12px;color:var(--navy);font-weight:800}'+
    '.ce-alsobox-sub{font-size:9.5px;color:var(--mu);font-weight:600;line-height:1.4}'+
    '.ce-alsobox-n{margin-left:auto;font-size:9px;font-weight:900;color:var(--mu);background:#fff;border:1px solid var(--bdr);border-radius:999px;padding:2px 9px;flex:none}'+
    '.ce-alsolist{display:flex;flex-direction:column}'+
    '.ce-also-i{border-bottom:1px solid var(--bdr)}.ce-also-i:last-child{border-bottom:0}'+
    '.ce-also-s{display:flex;align-items:center;gap:8px;padding:9px 13px;cursor:pointer;list-style:none;font-size:11.5px;font-weight:600;color:var(--navy);line-height:1.45}'+
    '.ce-also-s::-webkit-details-marker{display:none}.ce-also-s:hover{background:#FAFBFD}'+
    '.ce-also-tag{font-size:8px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:#6b7684;border:1px solid currentColor;border-radius:999px;padding:1px 7px;flex:none;opacity:.85}'+
    '.ce-also-hd{flex:1;min-width:0}'+
    '.ce-also-ar{margin-left:auto;color:var(--mu);font-size:10px;transition:transform .15s;flex:none}'+
    '.ce-also-i[open] .ce-also-ar{transform:rotate(180deg)}'+
    '.ce-also-body{padding:0 13px 12px 13px;font-size:10.5px;font-weight:500;color:var(--navy);line-height:1.6;background:#FBFCFE}'+
    /* the theme record */
    '.nve-band{margin:4px 0 14px;display:flex;align-items:center;gap:9px}'+
    '.nve-band-i{font-size:13px;font-weight:800;color:'+BRAND2+';line-height:1}'+
    '.nve-band-t{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:'+BRAND2+'}'+
    '.nve-band-s{font-size:10.5px;color:var(--mu);font-weight:600;font-style:italic}'+
    '.nve-band-l{flex:1;height:1px;background:var(--bdr)}'+
    '@media(max-width:560px){.nve-band-s{display:none}}'+
    '.calls-tog{display:inline-flex;gap:4px;background:#F2F5F8;border:1px solid var(--bdr);border-radius:999px;padding:3px;margin-bottom:14px}'+
    '.calls-pill{border:none;background:transparent;font:inherit;font-size:12px;font-weight:700;color:var(--mu);padding:5px 15px;border-radius:999px;cursor:pointer;transition:.12s}'+
    '.calls-pill:hover{color:var(--navy)}.calls-pill.active{background:'+BRAND2+';color:#fff}'+
    '.calls-seg-group{border:1px solid var(--bdr);border-radius:10px;overflow:hidden;background:var(--w)}'+
    '.calls-seg-group.open{border-color:'+BRAND2+'}'+
    '.calls-seg{width:100%;display:flex;align-items:center;justify-content:space-between;gap:10px;background:none;border:none;cursor:pointer;padding:14px 16px;font-family:\'Inter\',sans-serif;font-size:13.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--navy);text-align:left}'+
    '.calls-seg:hover{color:'+BRAND2+'}.calls-seg-group.open>.calls-seg{color:'+BRAND2+'}'+
    '.calls-seg-l{display:inline-flex;align-items:baseline;gap:9px}'+
    '.calls-seg-n{font-size:9.5px;font-weight:700;letter-spacing:0;text-transform:none;color:var(--mu)}'+
    '.calls-seg-ic{flex:none;width:22px;height:22px;border-radius:50%;background:rgba(31,138,112,0.12);color:'+BRAND2+';font-weight:800;font-size:16px;line-height:1;display:flex;align-items:center;justify-content:center}'+
    '.calls-seg-body{display:none;padding:2px 14px 14px;flex-direction:column;gap:10px}'+
    '.calls-seg-group.open>.calls-seg-body{display:flex}'+
    '.calls-empty{font-size:11.5px;color:var(--mu);font-style:italic;border:1px dashed var(--bdr);border-radius:8px;padding:9px 12px;background:#FAFBFD}'+
    '.calls-st{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;border-radius:20px;padding:2px 8px;white-space:nowrap;border:1px solid;flex:none}'+
    '.calls-st-age{font-size:8.5px;font-weight:700;opacity:.8;margin-left:4px}'+
    '.calls-qseg{display:flex;align-items:center;gap:7px;font-size:9.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:'+BRAND2+';margin:16px 0 8px;padding-bottom:5px;border-bottom:1px solid var(--bdr)}'+
    '.calls-qseg:first-child{margin-top:2px}'+
    '.calls-qseg-n{font-size:9px;font-weight:800;color:var(--mu);background:#F2F5F8;border:1px solid var(--bdr);border-radius:20px;padding:1px 7px}'+
    '.calls-qrow{border-left:2px solid var(--bdr);padding:1px 0 1px 11px;margin:0 0 11px}'+
    '.calls-qrow:hover{border-left-color:'+BRAND2+'}'+
    '.calls-tl{font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--navy);margin:0 0 4px}'+
    '</style>';
}

// ── CSS for the ported estimate grid + print scorecard. Only the ce-mgrid / ce-fz / ce-dv families
// are defined here (the ce-phtabs / ce-cc / ce-alsobox families already live in styleTag()), so no
// rule is duplicated. Colours resolve to the NVIDIA-green module palette.
function ceExtraStyle(){
  return '<style>'+
    /* estimate grid */
    '.nve-wrap .ce-row-cap{font-size:9px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--mu);margin:0 0 6px}'+
    '.nve-wrap .mg-seg{display:inline-flex}'+
    '.nve-wrap .ce-ev-pill{font-size:10px;font-weight:800;padding:4px 12px;border:0;border-radius:999px;background:transparent;color:var(--mu);cursor:pointer;transition:.14s}'+
    '.nve-wrap .ce-ev-pill.active{background:'+BRAND+';color:#10241a}'+
    '.ce-mgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(215px,1fr));gap:8px;margin:4px 0}'+
    '.ce-mcell{border:1px solid var(--bdr);border-left:3px solid '+BRAND+';border-radius:9px;padding:8px 10px;background:#fff}'+
    '.ce-mcell.cust{border-left-color:'+BRAND2+'}'+
    '.ce-mcell.flagged{border-left-color:'+GRAY+';opacity:.72}'+
    '.ce-mcell-k{font-size:10px;font-weight:700;color:var(--mu);display:flex;align-items:center;gap:4px;line-height:1.3;min-height:26px}'+
    '.ce-mtbl{display:grid;grid-template-columns:auto 1fr;gap:2px 8px;align-items:baseline;margin-top:4px;font-variant-numeric:tabular-nums}'+
    '.ce-evwrap[data-ev="both"] .ce-mtbl{grid-template-columns:auto 1fr 1fr}'+
    '.ce-evwrap[data-ev="cons"] .ce-mtbl .ce-mcol-us{display:none}'+
    '.ce-evwrap[data-ev="us"] .ce-mtbl .ce-mcol-cons{display:none}'+
    '.ce-mrl{font-size:8px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--mu);white-space:nowrap;align-self:center}'+
    '.ce-mh{font-size:8px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--mu)}'+
    '.ce-mv{font-size:13px;font-weight:900;color:var(--navy);display:flex;align-items:baseline;gap:4px;flex-wrap:wrap}'+
    '.ce-mgn-v{font-size:11px;color:'+PURPLE+'}'+
    '.ce-mprev{grid-column:1/-1;margin-top:3px;padding-top:3px;border-top:1px dotted var(--bdr);line-height:1.2}'+
    '.ce-mprev-l{font-size:7.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mu);margin-right:5px}'+
    '.ce-mmc{display:none}'+
    '.ce-evwrap[data-mm="on"] .ce-mmc{display:flex}'+
    '.ce-evwrap[data-g="off"] .ce-mprev{display:none}'+
    '.ce-gchip{font-size:10px;font-weight:800;margin-left:2px}'+
    '.ce-mm-b{display:none;font-size:9.5px;font-weight:800;color:var(--navy);white-space:nowrap;align-items:baseline}'+
    '.ce-evwrap[data-mm="on"][data-g="yoy"] .ce-mm-b.yoy{display:inline-flex}.ce-evwrap[data-mm="on"][data-g="qoq"] .ce-mm-b.qoq{display:inline-flex}'+
    '.ce-nocons{font-size:8.5px;font-weight:800;color:var(--mu);border:1px solid var(--bdr);border-radius:999px;padding:1px 6px;margin-left:6px}'+
    '.ce-evwrap[data-g="yoy"] .ce-gq,.ce-evwrap[data-g="qoq"] .ce-gy,.ce-evwrap[data-g="off"] .ce-gy,.ce-evwrap[data-g="off"] .ce-gq{display:none}'+
    /* shared control pills */
    '.nve-wrap .ce-gseg{display:inline-flex;background:#F2F5F8;border:1px solid var(--bdr);border-radius:999px;padding:2px}'+
    '.nve-wrap .ce-gseg button{font-size:10px;font-weight:800;padding:3px 11px;border:0;border-radius:999px;background:transparent;color:var(--mu);cursor:pointer;transition:.14s}'+
    '.nve-wrap .ce-gseg button.active{background:var(--navy);color:#fff}'+
    '.nve-wrap .ce-vdf{display:inline-flex;background:#F2F5F8;border:1px solid var(--bdr);border-radius:999px;padding:2px}'+
    '.nve-wrap .ce-vdf button{font-size:10px;font-weight:800;padding:3px 11px;border:0;border-radius:999px;background:transparent;color:var(--mu);cursor:pointer;transition:.14s}'+
    '.nve-wrap .ce-vdf button.active{background:var(--navy);color:#fff}'+
    /* verdict filter — drives BOTH cards and chart rows via data-f (estimate-view aware) */
    '.ce-fz[data-ev="cons"][data-f="beat"] .ce-fz-t:not([data-vdc="beat"]),.ce-fz[data-ev="cons"][data-f="miss"] .ce-fz-t:not([data-vdc="miss"]),.ce-fz[data-ev="cons"][data-f="inline"] .ce-fz-t:not([data-vdc="inline"]),.ce-fz[data-ev="us"][data-f="beat"] .ce-fz-t:not([data-vdu="beat"]),.ce-fz[data-ev="us"][data-f="miss"] .ce-fz-t:not([data-vdu="miss"]),.ce-fz[data-ev="us"][data-f="inline"] .ce-fz-t:not([data-vdu="inline"]),.ce-fz[data-ev="cons"][data-f="beat"] .ce-dv-row:not([data-vdc="beat"]),.ce-fz[data-ev="cons"][data-f="miss"] .ce-dv-row:not([data-vdc="miss"]),.ce-fz[data-ev="cons"][data-f="inline"] .ce-dv-row:not([data-vdc="inline"]),.ce-fz[data-ev="us"][data-f="beat"] .ce-dv-row:not([data-vdu="beat"]),.ce-fz[data-ev="us"][data-f="miss"] .ce-dv-row:not([data-vdu="miss"]),.ce-fz[data-ev="us"][data-f="inline"] .ce-dv-row:not([data-vdu="inline"]){display:none}'+
    /* print scorecard cards */
    '.ce-fz{border:1px solid var(--bdr);border-radius:12px;padding:12px 14px;margin-bottom:14px;background:#FBFCFE}'+
    '.ce-fz-h{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;color:var(--mu);margin-bottom:9px;display:flex;align-items:center;gap:6px;flex-wrap:wrap}'+
    '.ce-fz-g{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}'+
    '@media(max-width:900px){.ce-fz-g{grid-template-columns:repeat(2,1fr)}}'+
    '@media(max-width:520px){.ce-fz-g{grid-template-columns:1fr}}'+
    '.ce-fz-t{border:1px solid var(--bdr);border-radius:9px;padding:7px 9px;background:#fff;position:relative;transition:.14s}'+
    '.ce-fz-t:hover{box-shadow:0 4px 14px rgba(16,24,40,.10)}'+
    '.ce-fz-k{display:flex;align-items:flex-start;gap:5px;flex-wrap:wrap;font-size:10px;font-weight:800;color:var(--navy);line-height:1.25}'+
    '.ce-fz-kn{flex:1 1 auto;min-width:0}'+
    '.ce-fz-vd{margin-left:auto;font-size:10.5px;font-weight:900;letter-spacing:.04em;text-transform:uppercase}'+
    '.ce-fz-tbl{display:grid;grid-template-columns:auto 1fr 1fr;gap:3px 8px;margin-top:6px;align-items:baseline;font-variant-numeric:tabular-nums}'+
    '.ce-fz-rl{font-size:8px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--mu);white-space:nowrap;align-self:center}'+
    '.ce-fz-ch{font-size:8px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mu);text-align:right}'+
    '.ce-fz-cv{font-size:11px;font-weight:700;color:var(--navy);text-align:right}'+
    '.ce-fz-exp{color:var(--mu)}'+
    '.ce-fz-act{font-size:13px;font-weight:900;color:var(--navy)}'+
    '.ce-tv-e{color:var(--mu);font-weight:600}'+
    '.ce-fz-sp{font-weight:900;margin-left:3px;font-size:11.5px}'+
    '.ce-fz[data-ord="surp"] .ce-fz-t{order:var(--od)}'+
    '.ce-fz[data-ord="surp"] .ce-dv-row{order:var(--od)}'+
    '.ce-fz[data-view="chart"] .ce-gseg-cardsonly{visibility:hidden}'+
    '.ce-fz .ce-gq{display:none}.ce-fz[data-g="qoq"] .ce-gy{display:none}.ce-fz[data-g="qoq"] .ce-gq{display:inline}.ce-fz[data-g="off"] .ce-fz-gc{display:none}'+
    /* estimate-view swap */
    '.ce-vd-us,.ce-exp-us{display:none}'+
    '.ce-fz[data-ev="us"] .ce-vd-cons,.ce-fz[data-ev="us"] .ce-exp-cons{display:none}'+
    '.ce-fz[data-ev="us"] .ce-vd-us,.ce-fz[data-ev="us"] .ce-exp-us{display:inline}'+
    '.ce-fz-mc{display:none}'+
    '.ce-fz[data-mm="on"] .ce-fz-mc{display:block}'+
    '.ce-vd-both{display:none}'+
    '.ce-fz[data-ev="both"] .ce-vd-cons,.ce-fz[data-ev="both"] .ce-vd-us{display:none}'+
    '.ce-fz[data-ev="both"] .ce-vd-both{display:inline}'+
    '.ce-fz[data-ev="cons"] .ce-fz-tbl .ce-col-us{display:none}'+
    '.ce-fz[data-ev="us"] .ce-fz-tbl .ce-col-cons{display:none}'+
    '.ce-fz[data-ev="both"] .ce-fz-tbl{grid-template-columns:auto 1fr 1fr 1fr}'+
    '.ce-fz-surp{display:none}'+
    '.ce-fz[data-ev="both"] .ce-fz-surp{display:block}'+
    '.ce-fz[data-ev="both"] .ce-fz-t[data-mixed="1"]{outline:1.5px solid '+AMBER+';outline-offset:-1px}'+
    '.ce-fz[data-ev="both"] .ce-vdf{visibility:hidden}'+
    '.ce-fz[data-fzcat="top"] .ce-fz-t:not([data-cat="top"]){display:none}'+
    '.ce-fz[data-fzcat="bottom"] .ce-fz-t:not([data-cat="bottom"]){display:none}'+
    /* diverging surprise chart */
    '.ce-dv{margin:2px 0 4px}'+
    '.ce-dv-cap{font-size:9.5px;color:var(--mu);font-weight:600;margin-bottom:11px;line-height:1.45}'+
    '.ce-dv-cap .ce-exp-us{display:none}.ce-fz[data-ev="us"] .ce-dv-cap .ce-exp-cons{display:none}.ce-fz[data-ev="us"] .ce-dv-cap .ce-exp-us{display:inline}'+
    '.ce-dv-rows{display:flex;flex-direction:column;gap:8px}'+
    '.ce-dv-row{position:relative;display:grid;grid-template-columns:148px 1fr 52px;gap:10px;align-items:center}'+
    '.ce-dv-row:hover{background:rgba(148,163,184,.07);border-radius:6px}'+
    '.ce-dv-tip{display:none;position:absolute;left:50%;bottom:calc(100% + 7px);transform:translateX(-50%);z-index:30;background:#fff;border:1px solid var(--bdr);border-radius:10px;box-shadow:0 10px 26px rgba(15,23,42,.22);padding:9px 11px;min-width:236px;max-width:340px;pointer-events:none}'+
    '.ce-dv-row:hover .ce-dv-tip{display:block}'+
    '.ce-dv-tip::after{content:"";position:absolute;left:50%;top:100%;transform:translateX(-50%);border:6px solid transparent;border-top-color:#fff}'+
    '.ce-dv-tip-h{font-size:10.5px;font-weight:800;color:var(--navy);margin-bottom:6px}'+
    '.ce-dv-tip-l{display:flex;align-items:center;gap:8px;font-size:10px;font-weight:600;color:var(--navy);margin-top:4px;white-space:nowrap}'+
    '.ce-dv-tip-b{font-size:8px;font-weight:900;letter-spacing:.04em;padding:2px 7px;border-radius:999px;flex:none}'+
    '.ce-dv-tip-b.ce-exp-cons{color:'+BLUE+';background:rgba(37,87,214,.11)}'+
    '.ce-dv-tip-b.ce-exp-us{color:'+PURPLE+';background:rgba(122,90,248,.12);display:inline}'+
    '.ce-dv-tip-x{flex:1;color:var(--mu);font-weight:600}.ce-dv-tip-x b{color:var(--navy);font-weight:800}'+
    '.ce-dv-tip-p{font-weight:900;font-variant-numeric:tabular-nums;flex:none}'+
    '@media(max-width:560px){.ce-dv-row{grid-template-columns:104px 1fr 46px}}'+
    '.ce-dv-k{font-size:9.5px;font-weight:700;color:var(--navy);text-align:right;line-height:1.2}'+
    '.ce-dv-track{position:relative;height:15px}'+
    '.ce-dv-zero{position:absolute;left:50%;top:-1px;bottom:-1px;width:1px;background:var(--bdr)}'+
    '.ce-dv-bar{position:absolute;top:50%;transform:translateY(-50%);height:11px;border-radius:3px;min-width:2px;max-width:50%}'+
    '.ce-dv-bar.pos{left:50%}.ce-dv-bar.neg{right:50%}'+
    '.ce-dv-bar.beat{background:#0a8f4c}.ce-dv-bar.miss{background:'+RED+'}.ce-dv-bar.inline{background:#9AA4B0}'+
    '.ce-dv-bar.ce-exp-us{display:none}.ce-fz[data-ev="us"] .ce-dv-bar.ce-exp-cons{display:none}.ce-fz[data-ev="us"] .ce-dv-bar.ce-exp-us{display:block}'+
    '.ce-dv-dot{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:7px;height:7px;border-radius:50%;border:1.5px solid #9AA4B0;background:#fff}'+
    '.ce-dv-dot.ce-exp-us{display:none}.ce-fz[data-ev="us"] .ce-dv-dot.ce-exp-cons{display:none}.ce-fz[data-ev="us"] .ce-dv-dot.ce-exp-us{display:block}'+
    '.ce-dv-vwrap{font-variant-numeric:tabular-nums}'+
    '.ce-dv-v{font-size:9.5px;font-weight:800}'+
    '.ce-dv-v.ce-exp-us{display:none}.ce-fz[data-ev="us"] .ce-dv-v.ce-exp-cons{display:none}.ce-fz[data-ev="us"] .ce-dv-v.ce-exp-us{display:inline}'+
    '.ce-dv-v.beat{color:#0a8f4c}.ce-dv-v.miss{color:'+RED+'}.ce-dv-v.inline,.ce-dv-v.none{color:var(--mu)}'+
    '.ce-dv-axis{display:flex;justify-content:space-between;margin-top:10px;padding:0 62px 0 158px;font-size:8.5px;font-weight:700;color:var(--mu)}'+
    '@media(max-width:560px){.ce-dv-axis{padding:0 56px 0 114px}}'+
    '.ce-fz[data-view="cards"] .ce-dv{display:none}'+
    '.ce-fz[data-view="chart"] .ce-fz-g{display:none}'+
  '</style>';
}

// A · Setup — the consensus-driven chart (the "hacer historia" the user wants). The Setup dataset is
// registered as 'NVDA_SETUP' in results.js (js/results-data/nvda-setup.js). consensus-evolution is not
// wired for NVDA, so we degrade gracefully and omit it (§6a-viii-bis).
// The per-metric estimate grid for the quarter going into the print (the upcoming quarter). Headline
// rows + NVDA KPI rows, each cell Street est / Summit est / YoY-QoQ chips, with the Street⇄Summit⇄Both
// toggle, the growth lens, and the margin toggle. Built from CE_CONS (real BBG data), never invented.
// nveQPhases — the phases each quarter is valid for (drives data-ceqhas on each pill, mirrors amzn.js
// ceQPhases). setup = the quarter carries a CE_CONS estimate grid; results = the quarter has reported.
// A quarter can be valid for both (a reported quarter with archive data).
function nveQPhases(u){
  var ph=[];
  if(CE_CONS.q.indexOf(u.q)>=0) ph.push('setup');
  if(u.status!=='upcoming') ph.push('results');
  return ph;
}
// The default active Setup quarter — the first `upcoming` quarter that carries a grid (going in);
// falls back to the newest quarter with a grid if none is upcoming.
function defaultSetupQ(){
  for(var i=0;i<QUARTERS.length;i++){ if(QUARTERS[i].status==='upcoming' && CE_CONS.q.indexOf(QUARTERS[i].q)>=0) return QUARTERS[i].q; }
  for(var j=0;j<QUARTERS.length;j++){ if(CE_CONS.q.indexOf(QUARTERS[j].q)>=0) return QUARTERS[j].q; }
  return null;
}
// Per-quarter Setup blocks — one .ce-qblock per quarter that carries CE_CONS grid data, toggled by the
// quarter pills exactly like the Post-Results blocks (AMZN parity, ceSetupBody). Each block: a per-quarter
// "① Setup" header (frozen badge when reported, upcoming badge when going in), the estimate-grid control
// row (Consensus/Summit/Both · YoY/QoQ/Off · Margin/Hide), and the .ce-evwrap with Headline + NVDA KPIs.
// First (defaultSetupQ) active, the rest hidden. Built from CE_CONS (real BBG data), never invented.
function setupQBlocks(){
  var activeQ=defaultSetupQ();
  return QUARTERS.filter(function(u){ return CE_CONS.q.indexOf(u.q)>=0; }).map(function(u){
    var qk=qkey(u.q), frozen=(u.status!=='upcoming');
    var b='<div class="ce-qblock" data-ceq="'+esc(qk)+'"'+(u.q===activeQ?'':' hidden')+'>';
    b+='<div class="ce-phase">① Setup — going into the print'+(frozen?'<span class="ce-frozen">frozen</span>':'<span class="ce-uptag">upcoming</span>')+'</div>';
    b+='<div class="ov-diagram-cap" style="margin:6px 0 8px;display:flex;flex-wrap:wrap;align-items:center;gap:12px">'+
        '<b>Estimates — '+esc(dispOf(u.q))+(frozen?'':' (going in)')+'</b>'+
        '<span class="mg-seg ce-gseg">'+
          '<button type="button" class="ce-ev-pill active" data-ceev="cons">Consensus</button>'+
          '<button type="button" class="ce-ev-pill" data-ceev="us">Summit</button>'+
          '<button type="button" class="ce-ev-pill" data-ceev="both">Both</button>'+
        '</span>'+
        '<span class="ce-gseg"><button type="button" class="active" data-ceg="yoy">YoY</button>'+
          '<button type="button" data-ceg="qoq">QoQ</button>'+
          '<button type="button" data-ceg="off">Off</button></span>'+
        '<span class="ce-gseg"><button type="button" data-cemm="on">Margin</button>'+
          '<button type="button" class="active" data-cemm="off">Hide mgn</button></span>'+
      '</div>'+
      '<div class="ce-evwrap" data-ev="cons" data-g="yoy" data-mm="off">'+
        '<div class="ce-row-cap">Headline — reported vs Street</div>'+ceGrid(u.q,'head')+
        '<div class="ce-row-cap" style="margin-top:12px">NVIDIA KPIs — Data Center &amp; Networking</div>'+ceGrid(u.q,'cust')+
      '</div>';
    b+='</div>';
    return b;
  }).join('');
}
function setupPane(){
  return '<div class="ce-phpane" data-cep="setup">'+
    '<div class="ce-note">The Street’s history for every tracked line, reported versus consensus, with Summit where a forecast exists. Pick a quarter above; each grid freezes what the Street carried into that print. Window the period with the lever, toggle margins. Quarterly is seasonal (same fiscal quarter across years plus the one next quarter); annual shows the forward years.</div>'+
    '<div class="ov-sec-h">The estimate grid — what the Street carries into the quarter</div>'+
    setupQBlocks()+
    '<div class="ov-sec-h" style="margin-top:20px">The Setup picture — reported vs Street</div>'+
    resultsHtml('NVDA_SETUP')+
  '</div>';
}

// B · Post-Results — per-quarter blocks (quarter pills toggle them).
function pointsBlock(pts){
  if(!pts||!pts.length) return '';
  return '<div class="nve-cap">Points for the call <span>go in with these</span></div>'+
    '<div class="nve-pts">'+pts.map(function(p){
      return '<details class="nve-pt">'+
        '<summary><span class="nve-pt-tag">'+esc(p.tag)+'</span>'+
          '<span class="nve-pt-h">'+esc(p.h)+'</span>'+
          '<span class="nve-pt-more">why ＋</span></summary>'+
        '<div class="nve-pt-d">'+p.d+'</div>'+
      '</details>';
    }).join('')+'</div>';
}
function callClassified(r){
  var pr=(r&&r.prepared)||[], qa=(r&&r.qanda)||[];
  var prBody = pr.length ? pr.map(function(p){
    return '<details class="ce-cc-row"><summary class="ce-cc-row-h">'+
      '<span class="ce-cc-topic">'+esc(p.topic)+'</span>'+
      (p.theme?'<span class="ce-cc-tag">#'+esc(p.theme)+'</span>':'')+
      '<span class="ce-cc-ar">▾</span></summary>'+
      '<div class="ce-cc-row-b">'+p.body+'</div></details>';
  }).join('') : '<div class="ce-cc-empty">Prepared-remarks topics for this quarter land here once the call is processed.</div>';
  var qaBody = qa.length ? qa.map(function(x){
    var parts=String(x.analyst||'').split('·');
    var name=(parts[0]||'').trim(), bank=(parts[1]||'').trim();
    return '<details class="ce-cc-row"><summary class="ce-cc-row-h">'+
      '<span class="ce-cc-topic">'+esc(x.q||x.theme||'')+'</span>'+
      (x.theme?'<span class="ce-cc-tag">#'+esc(x.theme)+'</span>':'')+
      '<span class="ce-cc-ar">▾</span></summary>'+
      '<div class="ce-cc-row-b">'+
        '<div class="ce-cc-qa-h">'+(bank?'<span class="ce-cc-bank">'+esc(bank)+'</span>':'')+(name?'<span class="ce-cc-analyst">'+esc(name)+'</span>':'')+'</div>'+
        (x.q?'<div class="ce-cc-q"><span class="ce-cc-ql">Q</span><span>'+esc(x.q)+'</span></div>':'')+
        (x.a?'<div class="ce-cc-a"><span class="ce-cc-al">A</span><span>'+x.a+'</span></div>':'')+
      '</div></details>';
  }).join('') : '<div class="ce-cc-empty">Every analyst question, tagged to its theme, with the answer inside — lands here once the call is processed.</div>';
  return '<details class="ce-cc-wrap"><summary class="ce-cc-sum">'+
      '<span class="ce-cc-sum-t">The call, classified</span>'+
      '<span class="ce-cc-sum-s">prepared remarks &amp; analyst Q&amp;A</span><span class="ce-cc-ar2">▾</span></summary>'+
    '<div class="ce-cc">'+
      '<div class="ce-cc-h"><span class="ce-cc-seg">'+
        '<button type="button" class="active" data-ccv="pr">By Prepared Remarks</button>'+
        '<button type="button" data-ccv="qa">By Analyst Question</button></span></div>'+
      '<div class="ce-cc-pane" data-ccp="pr">'+prBody+'</div>'+
      '<div class="ce-cc-pane" data-ccp="qa" hidden>'+qaBody+'</div>'+
    '</div></details>';
}
function alsoBlock(list){
  if(!list||!list.length) return '';
  return '<details class="ce-alsobox"><summary class="ce-alsobox-h">'+
      '<span class="ce-alsobox-ic">▶</span>'+
      '<span class="ce-alsobox-htext"><b>Also on the call</b><span class="ce-alsobox-sub">supplemental colour — worth mentioning, not the tracking layer</span></span>'+
      '<span class="ce-alsobox-n">'+list.length+'</span></summary>'+
    '<div class="ce-alsolist">'+list.map(function(a){
      return '<details class="ce-also-i"><summary class="ce-also-s">'+
        '<span class="ce-also-tag">'+esc(a.tag)+'</span>'+
        '<span class="ce-also-hd">'+esc(a.hd)+'</span>'+
        '<span class="ce-also-ar">▾</span></summary>'+
        '<div class="ce-also-body">'+(a.body||'')+'</div></details>';
    }).join('')+'</div></details>';
}
function resultsQBlock(u, active){
  var qk=qkey(u.q), frozen=(u.status!=='upcoming'), r=RESULTS[u.q];
  var b='<div class="ce-qblock" data-ceq="'+esc(qk)+'"'+(active?'':' hidden')+'>';
  b+='<div class="ce-phase">② Post-Results'+(frozen?'<span class="ce-frozen">reported '+esc(u.date)+'</span>':'')+'</div>';
  if(!r){
    b+='<div class="ce-note"><b>'+esc(u.disp)+'</b> — the print lands here once the quarter reports. Guidance going in: '+esc(u.date)+'.</div></div>';
    return b;
  }
  // ⓪ The print scorecard — every metric ranked by SURPRISE (actual vs frozen Street consensus),
  // beat/miss/inline verdicts + a diverging %-surprise chart. Built from CE_CONS (qa vs qr), so it
  // renders only for quarters the archive carries an actual for; leads the phase, before the AI Summary.
  b+=cePrintBlock(u.q, {}, {});
  // ① AI Summary — objective, no em-dashes, no "not A but B", no number narration.
  b+='<div class="nve-ai"><div class="nve-ai-k">AI Summary</div><div class="nve-ai-t">'+esc(r.ai)+'</div></div>';
  // ② Points for the call
  b+=pointsBlock(r.points);
  // ③ The call, classified (toggle)
  b+=callClassified(r);
  // ③b Propose Notes — draft this quarter's Points for the call as candidate NOTES, filed under
  // Theme (segment) ▸ Sub-theme, then publish them into the theme record (Notes tab). Source = the
  // authored r.points (never invented). Its own collapsed dropdown, sibling to The call classified.
  b+=nveThemeProposals(u.q, qk);
  // Also on the call (bottom)
  b+=alsoBlock(r.also);
  b+='</div>';
  return b;
}
function resultsPane(){
  var dq=newestReported();   // open Post-Results on the newest REPORTED quarter (Q1 FY2027), not the upcoming one
  return '<div class="ce-phpane" data-cep="results" hidden>'+
    QUARTERS.map(function(u){ return resultsQBlock(u, u.q===dq); }).join('')+
  '</div>';
}

// C · Notes — Watch List mount + the theme record (from NVDA_THEMES).
var TH_ST={ trend:{c:GREEN,l:'Confirmed trend'}, promise:{c:'#2E6BE6',l:'Promise — reconcile'}, watch:{c:AMBER,l:'Watch'} };
function newestReported(){ for(var i=0;i<QUARTERS.length;i++){ if(QUARTERS[i].status!=='upcoming') return QUARTERS[i].q; } return null; }
function stAge(st){
  if(!st||!st.since) return '';
  var a=qnum(st.since), b=qnum(newestReported());
  if(a==null||b==null) return '';
  var n=Math.max(1,b-a+1), k=(st.k||'');
  var lbl=(k==='promise')?('unreconciled '+n+' quarter'+(n>1?'s':'')):(k==='trend'?('since '+st.since):('watch · '+n+' quarter'+(n>1?'s':'')));
  return '<span class="calls-st-age">'+esc(lbl)+'</span>';
}
// NVE_SEG_ORDER — the canonical Theme (segment) order shared by the record ("By theme") AND the ✎
// editor. Seeded to NVDA_THEMES' three segments; the editor pushes any "＋ New theme" here so it shows
// even before it carries a sub-theme. themeSegments() merges this order with whatever the data holds.
var NVE_SEG_ORDER=['Data Center','Edge Computing','Company'];
function themeSegments(){ var seen={}, out=[];
  NVE_SEG_ORDER.forEach(function(s){ if(!seen[s]){ seen[s]=1; out.push(s); } });
  NVDA_THEMES.forEach(function(t){ if(!seen[t.seg]){ seen[t.seg]=1; out.push(t.seg); } });
  return out; }
function themeRecord(){
  var h='<div class="calls-tog" role="tablist">'+
    '<button type="button" class="calls-pill active" data-callsv="theme">By theme</button>'+
    '<button type="button" class="calls-pill" data-callsv="quarter">By quarter</button></div>';
  // By theme — segment accordions
  h+='<div class="lpb-acc" data-callsview="theme">';
  themeSegments().forEach(function(seg){
    var group=NVDA_THEMES.filter(function(t){ return t.seg===seg; });
    h+='<div class="calls-seg-group" data-seg="'+esc(seg)+'">'+
      '<button type="button" class="calls-seg" data-segtog><span class="calls-seg-l">'+esc(seg)+' <span class="calls-seg-n">'+group.length+' theme'+(group.length===1?'':'s')+'</span></span><span class="calls-seg-ic">+</span></button>'+
      '<div class="calls-seg-body">';
    if(!group.length) h+='<div class="calls-empty">— no sub-themes yet. Use ✎ Edit notes &amp; tracking below to add one.</div>';
    group.forEach(function(ct){
      var sk=(ct.st&&ct.st.k)?ct.st.k:'watch', st=TH_ST[sk]||TH_ST.watch;
      h+='<div class="lpb-acc-item" data-theme="'+esc(ct.theme)+'">'+
        '<button type="button" class="lpb-acc-h"><span style="display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap">'+esc(ct.theme)+' <span class="calls-st" style="color:'+st.c+';border-color:'+st.c+'">'+st.l+stAge(ct.st)+'</span></span><span class="lpb-acc-ic">+</span></button>'+
        '<div class="lpb-acc-body"><p style="font-size:12px;color:var(--mu);margin:0 0 10px;font-style:italic">'+esc(ct.why)+'</p>';
      (ct.updates||[]).forEach(function(up){
        h+='<div style="margin-bottom:10px"><span class="ov-chip" style="margin-right:6px">'+esc(up.q)+'</span><ul class="ov-bullets" style="margin-top:4px">'+
          (up.items||[]).map(function(it){ return '<li>'+esc(it)+'</li>'; }).join('')+'</ul></div>';
      });
      if(!(ct.updates||[]).length) h+='<div class="calls-empty">— no notes tracked yet for this theme.</div>';
      h+='</div></div>';
    });
    h+='</div></div>';
  });
  h+='</div>';
  // By quarter
  var byQ={}, order=[];
  NVDA_THEMES.forEach(function(t){ (t.updates||[]).forEach(function(up){ if(!byQ[up.q]){ byQ[up.q]=[]; order.push(up.q); } byQ[up.q].push({ seg:t.seg, theme:t.theme, items:up.items||[] }); }); });
  order.sort(function(a,z){ return (qnum(z)||0)-(qnum(a)||0); });
  h+='<div class="lpb-acc" data-callsview="quarter" style="display:none">';
  order.forEach(function(q){
    h+='<div class="lpb-acc-item"><button type="button" class="lpb-acc-h"><span>'+esc(q)+'</span><span class="lpb-acc-ic">+</span></button><div class="lpb-acc-body">';
    themeSegments().forEach(function(seg){
      var rows=byQ[q].filter(function(r){ return r.seg===seg; });
      if(!rows.length) return;
      h+='<div class="calls-qseg">'+esc(seg)+' <span class="calls-qseg-n">'+rows.length+'</span></div>';
      rows.forEach(function(row){
        h+='<div class="calls-qrow"><div class="calls-tl">'+esc(row.theme)+'</div><ul class="ov-bullets" style="margin-top:2px">'+
          row.items.map(function(it){ return '<li>'+esc(it)+'</li>'; }).join('')+'</ul></div>';
      });
    });
    h+='</div></div>';
  });
  h+='</div>';
  return h;
}
function watchPane(){
  return '<div class="ce-phpane" data-cep="watch" hidden>'+
    '<div class="ce-phase">③ Notes — the hunt list &amp; theme record</div>'+
    // the SHARED Watch List engine mounts here (Supabase company_themes); degrades to its own empty state
    '<div data-wlmount></div>'+
    // the multi-year theme record (from NVDA_THEMES)
    '<div class="nve-band"><span class="nve-band-i">▤</span><span class="nve-band-t">The theme record — every thread, across all calls</span><span class="nve-band-s">the multi-year backbone behind the hunt above (built from docs/calls/NVDA.md)</span><span class="nve-band-l"></span></div>'+
    '<div data-nvdarec>'+themeRecord()+'</div>'+
    // ✎ Edit notes & tracking — the Theme → Sub-theme editor (add/update a theme or sub-theme). Hidden
    // by default so the record reads clean; opens only on click. Edits mutate NVDA_THEMES and persist
    // to Supabase when signed in (RLS-gated) — degrades to display-only otherwise. Mirrors amzn.js.
    '<div class="nve-edit" data-nveedit data-open="0">'+
      '<button type="button" class="nve-edit-tog" data-nveeditog aria-expanded="false"><span class="nve-edit-ic">✎</span> Edit notes &amp; tracking <span class="nve-edit-s">— opens only to add/update a theme or sub-theme</span></button>'+
      '<div class="nve-edit-body" hidden><div data-nveeditor></div></div>'+
    '</div>'+
  '</div>';
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════
// NOTES EDITOR ENGINE — durable persistence + ✎ editor + Propose Notes. Ported from amzn.js (the
// Evolution ▸ Earnings ▸ Notes engine), nve-/nvda- prefixed so it never collides with amzn/aStd
// identifiers. Three parts: (1) fetchThemeRecord/saveThemeRecord durable persistence seeded from
// NVDA_THEMES; (2) a Theme → Sub-theme editor (add/update, gated to a signed-in session via RLS,
// degrading to display-only); (3) Propose Notes in Post-Results (publish an authored point into the
// theme record). Everything keys to ticker 'NVDA' and mutates NVDA_THEMES in place.
// ─────────────────────────────────────────────────────────────────────────────────────────────────
// Page-styled inline prompt/confirm — a small floating card anchored to the trigger (replaces
// window.prompt/window.confirm). onOk(value) fires on commit (value='' for a pure confirm). Cancel /
// Esc / click-outside dismiss it. {multiline:true} = textarea, {confirm:true} = yes/no, {danger:true}
// reddens OK. Mirrors amzn.js ceInlinePop.
function nvePositionPop(pop, anchor){
  var r=(anchor&&anchor.getBoundingClientRect)?anchor.getBoundingClientRect():{left:80,right:80,top:80,bottom:80};
  pop.style.position='fixed';
  var pw=pop.offsetWidth, ph=pop.offsetHeight, vw=window.innerWidth, vh=window.innerHeight;
  var left=(r.left>vw/2)?(r.right-pw):r.left;
  left=Math.max(8, Math.min(left, vw-pw-12));
  var top=r.bottom+6;
  if(top+ph>vh-12) top=Math.max(8, r.top-ph-6);
  pop.style.left=left+'px'; pop.style.top=top+'px';
}
function nveInlinePop(anchor, opts, onOk){
  Array.prototype.forEach.call(document.querySelectorAll('.ce-ip'), function(p){ p.remove(); });
  opts=opts||{}; var isConfirm=!!opts.confirm, ml=!!opts.multiline;
  var pop=document.createElement('div'); pop.className='ce-ip';
  pop.innerHTML='<div class="ce-ip-t">'+esc(opts.title||'')+'</div>'+
    (isConfirm?'':(ml?'<textarea class="ce-ip-in" rows="3"></textarea>':'<input class="ce-ip-in" type="text">'))+
    '<div class="ce-ip-btns"><button type="button" class="ce-ip-cancel">Cancel</button>'+
      '<button type="button" class="ce-ip-ok'+(opts.danger?' danger':'')+'">'+esc(opts.ok||(isConfirm?'Confirm':'Save'))+'</button></div>';
  document.body.appendChild(pop);
  var inp=pop.querySelector('.ce-ip-in'); if(inp && opts.value!=null) inp.value=opts.value;
  nvePositionPop(pop, anchor);
  function close(){ pop.remove(); document.removeEventListener('mousedown', outside, true); document.removeEventListener('keydown', onKey, true); }
  function outside(e){ if(!pop.contains(e.target)) close(); }
  function ok(){ var v=inp?(inp.value||'').trim():''; if(inp && !v) return; close(); onOk(v); }
  function onKey(e){ if(e.key==='Escape') close(); else if(e.key==='Enter' && (!ml || isConfirm)){ e.preventDefault(); ok(); } }
  pop.querySelector('.ce-ip-cancel').onclick=close;
  pop.querySelector('.ce-ip-ok').onclick=ok;
  setTimeout(function(){ document.addEventListener('mousedown', outside, true); document.addEventListener('keydown', onKey, true); }, 0);
  if(inp){ inp.focus(); if(inp.select) inp.select(); }
}

// ── the note engine (a note = an item under a sub-theme's quarter) ────────────────────────────────
function nveSubsOf(seg){ return NVDA_THEMES.filter(function(ct){ return ct.seg===seg; }); }
function nveFindTheme(key){ var p=String(key||'').split('|'); return NVDA_THEMES.filter(function(x){ return x.seg===p[0] && x.theme===p.slice(1).join('|'); })[0]; }
function nveHookOpen(ct){ return !!(ct.st&&ct.st.since) && !ct.trackUntil; }
function nveHookClosed(ct){ return !!ct.trackUntil; }
// Duplicate guard: two notes collide when they normalise to the same plain text under the same
// sub-theme + quarter (strip HTML, collapse whitespace, case-fold).
function nveNoteNorm(t){ return stripHtml(t).toLowerCase(); }
function nveNoteDup(items, text){ var n=nveNoteNorm(text); return (items||[]).some(function(it){ return nveNoteNorm(it)===n; }); }
// File a note into the record: find (or create) the seg ▸ sub-theme, append text under quarter q.
// Returns {added:true} or {added:false, dup:true}. Mirrors amzn.js cePublishNoteToRecord.
function nvePublishNote(seg, sub, text, q){
  if(!seg || !sub || !text) return {added:false};
  var ct=nveFindTheme(seg+'|'+sub);
  if(!ct){ ct={ seg:seg, theme:sub, why:'', updates:[], st:{ k:'watch' } }; NVDA_THEMES.push(ct); if(NVE_SEG_ORDER.indexOf(seg)<0) NVE_SEG_ORDER.push(seg); }
  ct.updates=ct.updates||[];
  var u=ct.updates.filter(function(x){ return x.q===q; })[0];
  if(!u){ u={ q:q, items:[] }; ct.updates.push(u); ct.updates.sort(function(a,z){ return (qnum(a.q)||0)-(qnum(z.q)||0); }); }
  if(nveNoteDup(u.items, text)) return {added:false, dup:true};
  u.items.push(text);
  return {added:true};
}

// ── taxonomy selects (used by Propose Notes) ─────────────────────────────────────────────────────
function nveSegsList(){ return themeSegments().slice(); }
function nveSubsOfSeg(seg){ return nveSubsOf(seg).map(function(s){ return s.theme; }); }
function nveSegSelectHtml(sel){
  return '<select class="ce-tp-seg" title="Theme (segment) — where the note is filed">'+nveSegsList().map(function(s){
    return '<option value="'+esc(s).replace(/"/g,'&quot;')+'"'+(s===sel?' selected':'')+'>'+esc(s)+'</option>';
  }).join('')+'<option value="__newseg__">＋ New theme…</option></select>';
}
function nveSubSelectHtml(seg, sel){
  var subs=nveSubsOfSeg(seg);
  var opts=subs.map(function(th){ return '<option value="'+esc(th).replace(/"/g,'&quot;')+'"'+(th===sel?' selected':'')+'>'+esc(th)+'</option>'; }).join('');
  opts+='<option value="__new__"'+(sel&&subs.indexOf(sel)<0?' selected':'')+'>＋ New sub-theme…</option>';
  return '<select class="ce-tp-sub" title="Sub-theme — the tracked line the note attaches to">'+opts+'</select>';
}
// Best-guess filing for a Post-Results point → a real NVDA theme, by the point's tag/text keywords.
// Returns {seg, theme}; if the theme does not yet exist it simply renders as NEW.
function nveGuessTarget(tag, text){
  var t=((tag||'')+' '+(text||'')).toLowerCase();
  function has(){ for(var i=0;i<arguments.length;i++){ if(t.indexOf(arguments[i])>=0) return true; } return false; }
  if(has('networking','spectrum','infiniband','nvlink')) return { seg:'Data Center', theme:'Networking as the fastest-growing line' };
  if(has('china','export','h20','h200')) return { seg:'Data Center', theme:'China / export controls (H20 → H200)' };
  if(has('vera cpu','standalone cpu','$200 billion','$200b')) return { seg:'Data Center', theme:'Vera CPU — a new $200B TAM' };
  if(has('rubin')) return { seg:'Data Center', theme:'Vera Rubin ramp & the annual cadence' };
  if(has('framework','hyperscale','acie','capex','segment')) return { seg:'Data Center', theme:'The new segment framework (Hyperscale / ACIE)' };
  if(has('physical ai','robot','automotive','edge','uber','robotaxi')) return { seg:'Edge Computing', theme:'Physical AI (robotics, automotive)' };
  if(has('margin','gross')) return { seg:'Company', theme:'Gross-margin sustainability (mid-70s)' };
  if(has('capital','dividend','buyback','free cash flow','fcf')) return { seg:'Company', theme:'Capital return (dividend + buyback)' };
  if(has('data center','blackwell')) return { seg:'Data Center', theme:'The new segment framework (Hyperscale / ACIE)' };
  return { seg:'Company', theme:'Gross-margin sustainability (mid-70s)' };
}
// ③b Propose Notes card — draft this quarter's authored Points as candidate notes, each filed under
// Theme (segment) ▸ Sub-theme with an existing/NEW badge; Accept stages, Publish files into the record.
function nveThemeProposals(qLabel, qk){
  var r=RESULTS[qLabel], pts=(r&&r.points)||[];
  if(!pts.length) return '';
  var cards=pts.map(function(p,i){
    var txt=stripHtml(p.d)||p.h||'';
    var tg=nveGuessTarget(p.tag, (p.h||'')+' '+txt);
    return '<div class="ce-tp-card" data-tp="'+esc(qk)+'-'+i+'">'+
      '<div class="ce-tp-row1">'+
        '<span class="ce-tp-fld"><label class="ce-tp-lb">Theme</label>'+nveSegSelectHtml(tg.seg)+'</span>'+
        '<span class="ce-tp-fld"><label class="ce-tp-lb">Sub-theme</label>'+nveSubSelectHtml(tg.seg, tg.theme)+'</span>'+
        '<span class="ce-tp-acts">'+
          '<button type="button" class="ce-tp-ok" data-tpact="accept" title="Stage this note">✓ Accept</button>'+
          '<button type="button" class="ce-tp-no" data-tpact="reject" title="Drop this note">✕</button>'+
        '</span></div>'+
      '<input class="ce-tp-newseg" type="text" placeholder="New theme name" hidden>'+
      '<input class="ce-tp-newsub" type="text" placeholder="New sub-theme name" hidden>'+
      '<div class="ce-tp-target" data-tptarget></div>'+
      '<textarea class="ce-tp-in" rows="2">'+esc(txt)+'</textarea>'+
    '</div>';
  }).join('');
  return '<details class="ce-tp-wrap">'+
    '<summary class="ce-tp-sum"><span class="ce-tp-ic">📝</span><span class="ce-tp-sum-t">Propose Notes</span>'+
      '<span class="ce-tp-sum-s">draft the call&#39;s takeaways → publish to the Notes tab</span><span class="ce-cc-ar2">▾</span></summary>'+
    '<div class="ce-tp" data-tpq="'+esc(qLabel)+'">'+
      '<div class="ce-tp-h"><button type="button" class="ce-tp-refresh" data-tprefresh title="Bring back the notes you rejected">↻ Rejected <span data-tprej>0</span></button></div>'+
      '<div class="ce-tp-list" data-tplist>'+cards+'</div>'+
      '<div class="ce-tp-staged-h">Staged notes <span class="ce-tp-count" data-tpcount>0</span>'+
        '<button type="button" class="ce-tp-pub" data-tppublish title="File the staged notes into the theme record on the Notes tab" hidden>Publish to Notes →</button>'+
        '<span class="ce-tp-status" data-tpstatus></span></div>'+
      '<div class="ce-tp-staged" data-tpstaged><div class="ce-tp-empty">Nothing staged yet — accept a note above.</div></div>'+
    '</div>'+
  '</details>';
}
// Wire every Propose Notes card in the results pane. Mirrors amzn.js wiring: accept stages a chip,
// reject parks it, ↻ restores rejects, Publish files staged chips into NVDA_THEMES then re-renders
// the record (which persists). `root` locates the record host for the re-render.
function nveWireProposals(root){
  root.querySelectorAll('.ce-tp').forEach(function(tp){
    var list=tp.querySelector('[data-tplist]'), staged=tp.querySelector('[data-tpstaged]'),
        countEl=tp.querySelector('[data-tpcount]'), rejEl=tp.querySelector('[data-tprej]'),
        refreshBtn=tp.querySelector('[data-tprefresh]'),
        publishBtn=tp.querySelector('[data-tppublish]'), statusEl=tp.querySelector('[data-tpstatus]'),
        qLabel=tp.getAttribute('data-tpq')||'', rejected=[];
    function refresh(){
      var chips=staged.querySelectorAll('.ce-tp-chip');
      if(countEl) countEl.textContent=chips.length;
      var empty=staged.querySelector('.ce-tp-empty'); if(empty) empty.hidden=chips.length>0;
      if(rejEl) rejEl.textContent=rejected.length;
      if(publishBtn) publishBtn.hidden=(chips.length===0);
    }
    function setStatus(m){ if(statusEl) statusEl.textContent=m||''; }
    function readTarget(card){
      var segSel=card.querySelector('.ce-tp-seg'), segRaw=(segSel||{}).value||'';
      var isNewSeg=(segRaw==='__newseg__'), newSegInp=card.querySelector('.ce-tp-newseg');
      var seg=isNewSeg?((newSegInp&&newSegInp.value||'').trim()):segRaw;
      var subSel=card.querySelector('.ce-tp-sub');
      var isNew=isNewSeg || !!(subSel && subSel.value==='__new__');
      var newInp=card.querySelector('.ce-tp-newsub');
      var sub=isNew?((newInp&&newInp.value||'').trim()):(subSel?subSel.value:'');
      return { seg:seg, sub:sub, isNew:isNew, isNewSeg:isNewSeg };
    }
    function paintTarget(card){
      var t=readTarget(card), tgt=card.querySelector('[data-tptarget]'); if(!tgt) return;
      var segLabel=t.seg||(t.isNewSeg?'(name the new theme)':'—');
      var subLabel=t.sub||(t.isNew?'(name the new sub-theme)':'—');
      var badge=t.isNewSeg?'<span class="ce-tp-badge new">NEW theme</span>'
        :(t.isNew?'<span class="ce-tp-badge new">NEW sub-theme</span>':'<span class="ce-tp-badge">existing sub-theme</span>');
      tgt.innerHTML='<span class="ce-tp-arrow">files under →</span> <b></b> <span class="ce-tp-sep">▸</span> <b></b> '+badge;
      var bs=tgt.querySelectorAll('b'); if(bs[0]) bs[0].textContent=segLabel; if(bs[1]) bs[1].textContent=subLabel;
    }
    function rebuildSub(card){
      var seg=(card.querySelector('.ce-tp-seg')||{}).value||'', subSel=card.querySelector('.ce-tp-sub'); if(!subSel) return;
      var subs=(seg==='__newseg__')?[]:nveSubsOfSeg(seg);
      subSel.innerHTML=subs.map(function(th){ return '<option value="'+esc(th).replace(/"/g,'&quot;')+'">'+esc(th)+'</option>'; }).join('')+'<option value="__new__">＋ New sub-theme…</option>';
    }
    function syncNew(card){
      var segSel=card.querySelector('.ce-tp-seg'), subSel=card.querySelector('.ce-tp-sub'),
          newInp=card.querySelector('.ce-tp-newsub'), newSegInp=card.querySelector('.ce-tp-newseg');
      var isNewSeg=!!(segSel && segSel.value==='__newseg__');
      if(newSegInp) newSegInp.hidden = !isNewSeg;
      if(newInp) newInp.hidden = !(isNewSeg || (subSel && subSel.value==='__new__'));
    }
    function wireCard(card){
      var segSel=card.querySelector('.ce-tp-seg'), subSel=card.querySelector('.ce-tp-sub'),
          newInp=card.querySelector('.ce-tp-newsub'), newSegInp=card.querySelector('.ce-tp-newseg');
      if(segSel) segSel.onchange=function(){ rebuildSub(card); syncNew(card); paintTarget(card); };
      if(subSel) subSel.onchange=function(){ syncNew(card); paintTarget(card); };
      if(newInp) newInp.oninput=function(){ paintTarget(card); };
      if(newSegInp) newSegInp.oninput=function(){ paintTarget(card); };
      syncNew(card); paintTarget(card);
      card.querySelectorAll('[data-tpact]').forEach(function(btn){ btn.onclick=function(){
        if(btn.getAttribute('data-tpact')==='accept'){
          var ta=card.querySelector('.ce-tp-in'), v=(ta&&ta.value||'').trim(); if(!v) return;
          var t=readTarget(card);
          if(t.isNewSeg && !t.seg){ if(newSegInp) newSegInp.focus(); return; }
          if(t.isNew && !t.sub){ if(newInp) newInp.focus(); return; }
          var chip=document.createElement('div'); chip.className='ce-tp-chip';
          chip.dataset.seg=t.seg; chip.dataset.sub=t.sub; chip.dataset.text=v; chip.dataset.isNew=t.isNew?'1':'';
          var tag=document.createElement('span'); tag.className='ce-tp-chip-tag'; tag.textContent=t.seg+' ▸ '+t.sub;
          chip.appendChild(tag);
          if(t.isNew){ var nb=document.createElement('span'); nb.className='ce-tp-chip-new'; nb.textContent='NEW'; chip.appendChild(nb); }
          var txt=document.createElement('span'); txt.className='ce-tp-chip-t'; txt.textContent=v; chip.appendChild(txt);
          var x=document.createElement('button'); x.type='button'; x.className='ce-tp-unstage'; x.title='Unstage (return to proposals)'; x.textContent='✕';
          x.onclick=function(){ chip.remove(); card.hidden=false; refresh(); }; chip.appendChild(x);
          staged.appendChild(chip); card.hidden=true;
        } else { rejected.push(card); card.remove(); }
        refresh();
      }; });
    }
    tp.querySelectorAll('.ce-tp-card').forEach(wireCard);
    if(refreshBtn) refreshBtn.onclick=function(){ rejected.forEach(function(c){ list.appendChild(c); }); rejected=[]; refresh(); };
    if(publishBtn) publishBtn.onclick=function(){
      var chips=[].slice.call(staged.querySelectorAll('.ce-tp-chip')).filter(function(c){ return !c.classList.contains('published'); });
      if(!chips.length){ setStatus('Nothing new to publish.'); return; }
      var filed=0, dup=0;
      chips.forEach(function(chip){
        var res=nvePublishNote(chip.dataset.seg||'', chip.dataset.sub||chip.dataset.seg||'', chip.dataset.text||'', qLabel);
        if(res && res.dup){ dup++; chip.classList.add('dup'); }
        else { filed++; chip.classList.add('published'); }
      });
      if(filed) nveRerenderRecord(root);
      setStatus(filed+' filed into the theme record (Notes tab)'+(dup?' · '+dup+' skipped (already filed)':'')+(filed?' — saved when signed in':''));
    };
    refresh();
  });
}

// ── quarter <option>s for the editor: QUARTERS' keys plus any already used by the sub-theme, newest
//    first. value = the canonical "Q1 2027" key (matches the record); label = the fiscal disp. ──
function nveQuarterOpts(sel, blank, extra){
  var seen={}, list=[];
  QUARTERS.forEach(function(q){ if(!seen[q.q]){ seen[q.q]=1; list.push(q.q); } });
  (extra||[]).forEach(function(q){ if(q && !seen[q]){ seen[q]=1; list.push(q); } });
  list.sort(function(a,b){ return (qnum(b)||0)-(qnum(a)||0); });
  var out='<option value="">'+esc(blank||'—')+'</option>';
  list.forEach(function(q){ out+='<option value="'+esc(q)+'"'+(sel===q?' selected':'')+'>'+esc(dispOf(q))+'</option>'; });
  return out;
}
// ═══ Theme → Sub-theme editor (in the hidden ✎ panel) ══════════════════════════════════════════
// "Theme" = the segment (NVE_SEG_ORDER); "Sub-theme" = a theme within it (NVDA_THEMES[].theme).
// Picking a Theme filters the Sub-theme list; adding/deleting either mutates NVDA_THEMES and re-renders
// the record. Mirrors amzn.js amznEditorBody / amznRenderEditor.
var _edSeg=null, _edSub=null;
function nveEditorBody(){
  if(!_edSeg || NVE_SEG_ORDER.indexOf(_edSeg)<0) _edSeg=NVE_SEG_ORDER[0]||null;
  var subs=nveSubsOf(_edSeg);
  if(_edSub && !subs.some(function(s){ return s.theme===_edSub; })) _edSub=null;
  var h='<div class="aed-hint">Add or update a <b>Theme</b> (a segment) or a <b>Sub-theme</b> (a tracked thread) and its per-quarter notes. Edits save to the shared record when you are signed in; signed out, the record stays display-only.</div>';
  h+='<div class="aed-row"><span class="aed-lb">Theme</span><div class="aed-pills">';
  NVE_SEG_ORDER.forEach(function(seg){ h+='<button type="button" class="aed-pill'+(seg===_edSeg?' on':'')+'" data-aedseg="'+esc(seg)+'">'+esc(seg)+'</button>'; });
  h+='<button type="button" class="aed-add" data-aedaddseg>+ New theme</button>';
  if(_edSeg) h+='<button type="button" class="aed-delseg" data-aeddelseg title="Delete the selected Theme and all its sub-themes">✕ delete ‘'+esc(_edSeg)+'’</button>';
  h+='</div></div>';
  h+='<div class="aed-row"><span class="aed-lb">Sub-theme</span><div class="aed-pills">';
  if(subs.length) subs.forEach(function(s){ h+='<button type="button" class="aed-pill sub'+(s.theme===_edSub?' on':'')+'" data-aedsub="'+esc(s.theme)+'">'+esc(s.theme)+(nveHookClosed(s)?' <span style="opacity:.6">·closed</span>':'')+'</button>'; });
  else h+='<span class="aed-empty">no sub-themes yet</span>';
  h+='<button type="button" class="aed-add" data-aedaddsub>+ New sub-theme</button></div></div>';
  var cur=subs.filter(function(s){ return s.theme===_edSub; })[0];
  if(cur){
    var extraQ=(cur.updates||[]).map(function(u){ return u.q; });
    h+='<div class="aed-detail">';
    h+='<div class="aed-detail-h">'+esc(cur.theme)+'<span class="aed-detail-seg">in '+esc(cur.seg)+'</span>'+
       '<button type="button" class="aed-delsub" data-aeddelsub>✕ delete sub-theme</button></div>';
    h+='<label class="aed-flb">Tracking window</label>'+
       '<div class="aed-track"><span>Tracking since <select class="aed-sel" data-aedts>'+nveQuarterOpts((cur.st&&cur.st.since)||'', '— none —', extraQ)+'</select></span>'+
       '<span>Tracking until <select class="aed-sel" data-aedtu>'+nveQuarterOpts(cur.trackUntil||'', '— still open —', extraQ)+'</select></span>'+
       '<span class="aed-hookst '+(nveHookClosed(cur)?'closed':(nveHookOpen(cur)?'open':''))+'">'+(nveHookClosed(cur)?'closed':(nveHookOpen(cur)?'open hook':'not tracked'))+'</span></div>';
    h+='<label class="aed-flb">Add a note</label>'+
       '<div class="aed-addnote"><select class="aed-sel" data-aednoteq>'+nveQuarterOpts('', '— quarter —', extraQ)+'</select>'+
       '<input type="text" data-aednotetext placeholder="new note for that quarter (bold ok: &lt;b&gt;…&lt;/b&gt;)">'+
       '<button type="button" class="aed-mini" data-aedaddnote>+ Add note</button></div>';
    h+='<label class="aed-flb">Notes by quarter</label>';
    if(cur.updates&&cur.updates.length){
      h+='<div class="aed-notes">'+cur.updates.map(function(u){
        return '<div class="aed-qgroup"><span class="aed-note-q">'+esc(u.q)+'</span>'+
          u.items.map(function(it,ii){ return '<div class="aed-note-row"><span>'+it+'</span>'+
            '<button type="button" class="aed-ed" data-aedednote data-q="'+esc(u.q)+'" data-i="'+ii+'" title="Edit this note">✎</button>'+
            '<button type="button" class="aed-del" data-aeddelnote data-q="'+esc(u.q)+'" data-i="'+ii+'" title="Delete this note">✕</button></div>'; }).join('')+
        '</div>';
      }).join('')+'</div>';
    } else h+='<div class="aed-empty">no notes yet — add one above</div>';
    h+='</div>';
  }
  return h;
}
function nveRenderEditor(root){
  var host=root&&root.querySelector('[data-nveeditor]'); if(!host) return;
  host.innerHTML=nveEditorBody();
  host.querySelectorAll('[data-aedseg]').forEach(function(b){ b.onclick=function(){ _edSeg=b.getAttribute('data-aedseg'); _edSub=null; nveRenderEditor(root); }; });
  host.querySelectorAll('[data-aedsub]').forEach(function(b){ b.onclick=function(){ _edSub=b.getAttribute('data-aedsub'); nveRenderEditor(root); }; });
  var addSeg=host.querySelector('[data-aedaddseg]');
  if(addSeg) addSeg.onclick=function(){ nveInlinePop(addSeg, { title:'New Theme (segment) name' }, function(n){ if(NVE_SEG_ORDER.indexOf(n)<0) NVE_SEG_ORDER.push(n); _edSeg=n; _edSub=null; nveRenderEditor(root); nveRerenderRecord(root); }); };
  var addSub=host.querySelector('[data-aedaddsub]');
  if(addSub) addSub.onclick=function(){ if(!_edSeg){ nveInlinePop(addSub, { title:'Pick a Theme first.', confirm:true, ok:'OK' }, function(){}); return; } nveInlinePop(addSub, { title:'New Sub-theme under “'+_edSeg+'”' }, function(n){ if(!nveSubsOf(_edSeg).some(function(s){ return s.theme===n; })) NVDA_THEMES.push({ seg:_edSeg, theme:n, why:'', updates:[], st:{ k:'watch' } }); _edSub=n; nveRenderEditor(root); nveRerenderRecord(root); }); };
  var delSeg=host.querySelector('[data-aeddelseg]');
  if(delSeg) delSeg.onclick=function(){ if(!_edSeg) return; var nsub=nveSubsOf(_edSeg).length;
    nveInlinePop(delSeg, { title:'Delete Theme “'+_edSeg+'”'+(nsub?(' and its '+nsub+' sub-theme'+(nsub>1?'s':'')+' (and their notes)'):'')+'?', confirm:true, ok:'Delete', danger:true }, function(){
      for(var k=NVDA_THEMES.length-1;k>=0;k--){ if(NVDA_THEMES[k].seg===_edSeg) NVDA_THEMES.splice(k,1); }
      var si=NVE_SEG_ORDER.indexOf(_edSeg); if(si>=0) NVE_SEG_ORDER.splice(si,1);
      _edSeg=null; _edSub=null; nveRenderEditor(root); nveRerenderRecord(root);
    });
  };
  var cur=nveSubsOf(_edSeg).filter(function(s){ return s.theme===_edSub; })[0];
  if(cur){
    var delsub=host.querySelector('[data-aeddelsub]');
    if(delsub) delsub.onclick=function(){ nveInlinePop(delsub, { title:'Delete sub-theme “'+cur.theme+'” and its notes?', confirm:true, ok:'Delete', danger:true }, function(){ var i=NVDA_THEMES.indexOf(cur); if(i>=0) NVDA_THEMES.splice(i,1); _edSub=null; nveRenderEditor(root); nveRerenderRecord(root); }); };
    var ts=host.querySelector('[data-aedts]');
    if(ts) ts.onchange=function(){ cur.st=cur.st||{ k:'watch' }; if(ts.value) cur.st.since=ts.value; else delete cur.st.since; nveRenderEditor(root); nveRerenderRecord(root); };
    var tu=host.querySelector('[data-aedtu]');
    if(tu) tu.onchange=function(){ cur.trackUntil=tu.value||null; nveRenderEditor(root); nveRerenderRecord(root); };
    host.querySelectorAll('[data-aeddelnote]').forEach(function(b){ b.onclick=function(){
      var q=b.getAttribute('data-q'), ix=+b.getAttribute('data-i');
      var u=(cur.updates||[]).filter(function(x){ return x.q===q; })[0]; if(!u) return;
      u.items.splice(ix,1);
      if(!u.items.length) cur.updates=cur.updates.filter(function(x){ return x!==u; });
      nveRenderEditor(root); nveRerenderRecord(root);
    }; });
    host.querySelectorAll('[data-aedednote]').forEach(function(b){ b.onclick=function(){
      var q=b.getAttribute('data-q'), ix=+b.getAttribute('data-i');
      var u=(cur.updates||[]).filter(function(x){ return x.q===q; })[0]; if(!u||u.items[ix]==null) return;
      nveInlinePop(b, { title:'Edit note · '+q+'  (HTML ok, e.g. <b>…</b>)', value:u.items[ix], multiline:true }, function(nv){
        u.items[ix]=nv; nveRenderEditor(root); nveRerenderRecord(root);
      });
    }; });
    var addNote=host.querySelector('[data-aedaddnote]');
    if(addNote) addNote.onclick=function(){
      var q=host.querySelector('[data-aednoteq]').value, tx=(host.querySelector('[data-aednotetext]').value||'').trim();
      if(!q){ nveInlinePop(addNote, { title:'Pick a quarter for the note first.', confirm:true, ok:'OK' }, function(){}); return; }
      if(!tx) return;
      cur.updates=cur.updates||[];
      var u=cur.updates.filter(function(x){ return x.q===q; })[0];
      if(u && nveNoteDup(u.items, tx)){ nveInlinePop(addNote, { title:'This note is already filed under '+q+' — not added again.', confirm:true, ok:'OK' }, function(){}); return; }
      if(!u){ u={ q:q, items:[] }; cur.updates.push(u); cur.updates.sort(function(a,z){ return (qnum(a.q)||0)-(qnum(z.q)||0); }); }
      u.items.push(tx);
      nveRenderEditor(root); nveRerenderRecord(root);
    };
  }
}

// ── re-render the theme record host after an edit/publish, preserving expanded state, then persist ──
function nveCaptureRecState(host){
  var segs={}, subs={};
  host.querySelectorAll('.calls-seg-group[data-seg]').forEach(function(g){ segs[g.getAttribute('data-seg')]=g.classList.contains('open'); });
  host.querySelectorAll('.lpb-acc-item[data-theme]').forEach(function(it){ if(it.classList.contains('open')) subs[it.getAttribute('data-theme')]=1; });
  var qp=host.querySelector('.calls-pill[data-callsv="quarter"]');
  return { segs:segs, subs:subs, view:(qp&&qp.classList.contains('active'))?'quarter':'theme' };
}
function nveRestoreRecState(host, st){
  host.querySelectorAll('.calls-seg-group[data-seg]').forEach(function(g){ if(st.segs[g.getAttribute('data-seg')]){ g.classList.add('open'); var ic=g.querySelector('.calls-seg-ic'); if(ic) ic.textContent='–'; } });
  host.querySelectorAll('.lpb-acc-item[data-theme]').forEach(function(it){ if(st.subs[it.getAttribute('data-theme')]){ it.classList.add('open'); var ic=it.querySelector('.lpb-acc-ic'); if(ic) ic.textContent='–'; } });
  if(st.view==='quarter'){
    host.querySelectorAll('.calls-pill[data-callsv]').forEach(function(x){ x.classList.toggle('active', x.getAttribute('data-callsv')==='quarter'); });
    var th=host.querySelector('[data-callsview="theme"]'), qu=host.querySelector('[data-callsview="quarter"]'); if(th) th.style.display='none'; if(qu) qu.style.display='';
  }
}
function nveWireRecord(rec){
  if(!rec) return;
  rec.querySelectorAll('.calls-pill[data-callsv]').forEach(function(b){ b.onclick=function(){
    var v=b.getAttribute('data-callsv');
    rec.querySelectorAll('.calls-pill[data-callsv]').forEach(function(x){ x.classList.toggle('active', x===b); });
    var th=rec.querySelector('[data-callsview="theme"]'), qu=rec.querySelector('[data-callsview="quarter"]');
    if(th) th.style.display=(v==='theme'?'':'none'); if(qu) qu.style.display=(v==='quarter'?'':'none');
  }; });
  rec.querySelectorAll('.calls-seg[data-segtog]').forEach(function(b){ b.onclick=function(){
    var g=b.closest('.calls-seg-group'); if(!g) return; var open=g.classList.toggle('open');
    var ic=b.querySelector('.calls-seg-ic'); if(ic) ic.textContent=open?'–':'+';
  }; });
  rec.querySelectorAll('.lpb-acc-h').forEach(function(b){ b.onclick=function(){
    var it=b.parentElement; var open=it.classList.toggle('open');
    var ic=b.querySelector('.lpb-acc-ic'); if(ic) ic.textContent=open?'–':'+';
  }; });
}
function nveRerenderRecord(root){
  var host=root&&root.querySelector('[data-nvdarec]'); if(!host) return;
  var st=nveCaptureRecState(host);
  host.innerHTML=themeRecord();
  nveRestoreRecState(host, st);
  nveWireRecord(host);
  nvePersistThemes();
}

// ── durable persistence to Supabase (company_theme_record), keyed to ticker 'NVDA'. Hydrate on mount
//    (replace the NVDA_THEMES seed with the saved record if one exists), then save the whole record
//    after every mutation. The _nveReady gate prevents the pre-hydration render from overwriting the
//    DB; requires a signed-in session (RLS) — degrades silently otherwise. Mirrors amzn.js. ──
var _nveReady=false, _nveSaveT=null, _nveCo=null;
function nvePersistThemes(){
  if(!_nveReady || !_nveCo || !_nveCo.id) return;
  if(_nveSaveT) clearTimeout(_nveSaveT);
  _nveSaveT=setTimeout(function(){ Promise.resolve(saveThemeRecord(_nveCo.id, 'NVDA', NVDA_THEMES)).catch(function(){}); }, 400);
}
function nveHydrateThemes(root){
  if(_nveReady) return;
  if(!_nveCo || !_nveCo.id){ _nveReady=true; return; }
  Promise.resolve(fetchThemeRecord(_nveCo.id)).then(function(res){
    if(res && res.success && res.data && res.data.length){
      NVDA_THEMES.length=0; Array.prototype.push.apply(NVDA_THEMES, res.data);
      // fold any segments the saved record carries into the editor order (keep the seeded order first)
      NVDA_THEMES.forEach(function(t){ if(t && t.seg && NVE_SEG_ORDER.indexOf(t.seg)<0) NVE_SEG_ORDER.push(t.seg); });
      _nveReady=true; nveRerenderRecord(root); nveRenderEditor(root);
    } else { _nveReady=true; }   // no saved record yet — keep the seed; the first edit persists it
  }).catch(function(){ _nveReady=true; });
}

// ── CSS for the Notes editor engine: the inline pop (.ce-ip), the ✎ editor (.nve-edit / .aed-*), and
//    Propose Notes (.ce-tp). Ported from amzn.js ceStyle()/callsBody()/ceThemeProposals CSS, colours
//    resolved to the NVDA palette. The .ce-cc / .calls-* families already live in styleTag(). ──
function nveNotesStyle(){
  return '<style>'+
    /* inline prompt/confirm popover */
    '.ce-ip{position:fixed;z-index:9999;background:#fff;border:1px solid var(--bdr);border-radius:12px;box-shadow:0 16px 44px rgba(15,23,42,.30);padding:13px 14px;min-width:264px;max-width:380px}'+
    '.ce-ip-t{font-size:11px;font-weight:800;color:var(--navy);margin-bottom:9px;line-height:1.4}'+
    '.ce-ip-in{width:100%;box-sizing:border-box;font:inherit;font-size:12px;line-height:1.5;border:1px solid var(--bdr);border-radius:9px;padding:9px 11px;color:var(--navy);resize:vertical}'+
    '.ce-ip-in:focus{outline:none;border-color:'+BRAND2+'}'+
    '.ce-ip-btns{display:flex;justify-content:flex-end;gap:8px;margin-top:11px}'+
    '.ce-ip-btns button{font:inherit;font-size:11px;font-weight:800;border-radius:8px;padding:6px 15px;cursor:pointer;border:1px solid var(--bdr);background:#fff;color:var(--mu);transition:.14s}'+
    '.ce-ip-btns .ce-ip-cancel:hover{background:#F2F5F8;color:var(--navy);border-color:var(--mu)}'+
    '.ce-ip-btns .ce-ip-ok{background:'+BRAND2+';color:#fff;border-color:'+BRAND2+'}'+
    '.ce-ip-btns .ce-ip-ok:hover{filter:brightness(1.08)}'+
    '.ce-ip-btns .ce-ip-ok.danger{background:'+RED+';border-color:'+RED+'}'+
    /* ✎ Edit notes & tracking */
    '.nve-edit{margin-top:22px}'+
    '.nve-edit-tog{display:inline-flex;align-items:center;gap:8px;flex-wrap:wrap;font:inherit;font-size:11px;font-weight:800;color:var(--mu);background:var(--w);border:1px dashed var(--bdr);border-radius:999px;padding:7px 15px;cursor:pointer;transition:.14s}'+
    '.nve-edit-tog:hover{color:'+BRAND2+';border-color:'+BRAND2+'}'+
    '.nve-edit[data-open="1"] .nve-edit-tog{color:'+BRAND2+';border-style:solid;border-color:'+BRAND2+'}'+
    '.nve-edit-ic{font-size:12px}'+
    '.nve-edit-s{font-weight:600;font-style:italic;color:var(--mu);font-size:10px}'+
    '.nve-edit-body{margin-top:16px;border-top:2px solid var(--bdr);padding-top:16px}'+
    '.nve-edit-body[hidden]{display:none}'+
    '.aed-hint{font-size:11px;color:var(--navy);background:rgba(31,138,112,0.06);border:1px solid rgba(31,138,112,0.25);border-radius:9px;padding:8px 12px;margin:0 0 12px;line-height:1.5}'+
    '.aed-row{display:flex;align-items:flex-start;gap:10px;margin:0 0 12px}'+
    '.aed-lb{flex:none;width:78px;font-size:9.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--mu);padding-top:6px}'+
    '.aed-pills{display:flex;gap:6px;flex-wrap:wrap;flex:1}'+
    '.aed-pill{font:inherit;font-size:11px;font-weight:800;border:1px solid var(--bdr);background:var(--w);color:var(--navy);padding:5px 13px;border-radius:999px;cursor:pointer;transition:.12s}'+
    '.aed-pill:hover{border-color:'+BRAND2+';color:'+BRAND2+'}.aed-pill.on{background:'+BRAND2+';color:#fff;border-color:'+BRAND2+'}'+
    '.aed-pill.sub.on{background:'+BRAND+';border-color:'+BRAND+';color:#10241a}'+
    '.aed-add{font:inherit;font-size:10.5px;font-weight:800;border:1px dashed '+BRAND2+';background:var(--w);color:'+BRAND2+';padding:5px 12px;border-radius:999px;cursor:pointer}'+
    '.aed-add:hover{background:rgba(31,138,112,0.06)}'+
    '.aed-hookst{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--mu);align-self:center}'+
    '.aed-hookst.open{color:'+BRAND2+'}.aed-hookst.closed{color:'+RED+'}'+
    '.aed-delseg{font:inherit;font-size:10px;font-weight:800;border:1px solid var(--bdr);background:var(--w);color:var(--mu);padding:4px 11px;border-radius:999px;cursor:pointer}'+
    '.aed-delseg:hover{border-color:'+RED+';color:'+RED+'}'+
    '.aed-empty{font-size:10.5px;color:var(--mu);font-style:italic;padding:6px 0}'+
    '.aed-detail{border:1px solid var(--bdr);border-left:3px solid '+BRAND+';border-radius:10px;padding:12px 14px;background:#FAFBFD;margin-top:4px}'+
    '.aed-detail-h{font-size:13px;font-weight:800;color:var(--navy)}.aed-detail-seg{font-size:9.5px;font-weight:700;color:var(--mu);margin-left:8px}'+
    '.aed-delsub{margin-left:auto;font:inherit;font-size:9.5px;font-weight:800;border:1px solid var(--bdr);background:var(--w);color:var(--mu);padding:3px 10px;border-radius:999px;cursor:pointer}'+
    '.aed-delsub:hover{border-color:'+RED+';color:'+RED+'}'+
    '.aed-notes{display:flex;flex-direction:column;gap:10px}.aed-note-q{display:inline-flex;align-items:center;gap:6px;font-size:9px;font-weight:800;color:'+BRAND2+';background:rgba(31,138,112,0.10);border-radius:20px;padding:2px 8px;margin-bottom:2px}'+
    '.aed-qgroup{border-top:1px dashed var(--bdr);padding-top:6px}'+
    '.aed-note-row{display:flex;align-items:flex-start;gap:8px;padding:4px 0;font-size:12px;line-height:1.5}.aed-note-row>span{flex:1}'+
    '.aed-del{flex:none;font:inherit;font-size:11px;font-weight:800;border:1px solid var(--bdr);background:var(--w);color:var(--mu);width:20px;height:20px;border-radius:6px;cursor:pointer;line-height:1}'+
    '.aed-del:hover{border-color:'+RED+';color:'+RED+'}'+
    '.aed-ed{flex:none;font:inherit;font-size:10px;font-weight:800;border:1px solid var(--bdr);background:var(--w);color:var(--mu);width:20px;height:20px;border-radius:6px;cursor:pointer;line-height:1}'+
    '.aed-ed:hover{border-color:'+BRAND2+';color:'+BRAND2+'}'+
    '.aed-flb{display:block;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--mu);margin:12px 0 4px}'+
    '.aed-sel{font:inherit;font-size:11px;border:1px solid var(--bdr);border-radius:8px;padding:5px 8px;background:var(--w);color:var(--navy)}'+
    '.aed-sel:focus,.aed-addnote input:focus{outline:none;border-color:'+BRAND2+'}'+
    '.aed-track{display:flex;gap:16px;flex-wrap:wrap;align-items:center;font-size:10px;font-weight:700;color:var(--mu)}'+
    '.aed-addnote{display:flex;gap:7px;flex-wrap:wrap;align-items:center;margin-top:8px}'+
    '.aed-addnote input{flex:1;min-width:180px;box-sizing:border-box;font:inherit;font-size:12px;border:1px solid var(--bdr);border-radius:8px;padding:6px 9px;background:var(--w);color:var(--navy)}'+
    '.aed-mini{font:inherit;font-size:10.5px;font-weight:800;border:1px solid '+BRAND2+';background:'+BRAND2+';color:#fff;padding:6px 12px;border-radius:8px;cursor:pointer;transition:filter .14s}.aed-mini:hover{filter:brightness(1.08)}'+
    '.aed-note ul{margin:2px 0 0;padding-left:18px;font-size:12px;line-height:1.55}'+
    /* Propose Notes */
    '.ce-tp-wrap{margin-top:14px;border:1px solid var(--bdr);border-radius:12px;background:#fff;overflow:hidden}'+
    '.ce-tp-wrap:not([open])>.ce-tp-sum{border-bottom:0}'+
    '.ce-tp-sum{list-style:none;cursor:pointer;display:flex;align-items:center;gap:9px;padding:12px 14px;user-select:none;background:linear-gradient(180deg,#EAF3EC,#F1F7F2);border-bottom:1px solid var(--bdr)}'+
    '.ce-tp-sum::-webkit-details-marker{display:none}'+
    '.ce-tp-ic{font-size:13px}'+
    '.ce-tp-sum-t{font-size:12.5px;font-weight:800;color:var(--navy)}'+
    '.ce-tp-sum-s{font-size:10px;font-weight:600;color:var(--mu);flex:1}'+
    '.ce-tp-wrap[open]>.ce-tp-sum .ce-cc-ar2{transform:rotate(180deg)}'+
    '.ce-tp{border-top:1px solid var(--bdr);background:#FCFCFF;padding:12px 13px}'+
    '.ce-tp-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:10px}'+
    '.ce-tp-refresh{font-family:inherit;font-size:9px;font-weight:800;color:'+BLUE+';border:1px solid var(--bdr);border-radius:999px;padding:3px 9px;cursor:pointer;background:#fff;transition:.12s}'+
    '.ce-tp-refresh:hover{border-color:'+BLUE+';background:rgba(37,87,214,.06)}'+
    '.ce-tp-list{display:flex;flex-direction:column;gap:7px}'+
    '.ce-tp-card{border:1px solid var(--bdr);border-left:3px solid '+PURPLE+';border-radius:9px;padding:8px 9px;background:#fff}'+
    '.ce-tp-row1{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px}'+
    '.ce-tp-fld{display:flex;align-items:center;gap:5px;min-width:0}'+
    '.ce-tp-lb{font-size:8.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--mu);flex:none}'+
    '.ce-tp-seg,.ce-tp-sub{min-width:0;max-width:230px;font-family:inherit;font-size:10px;font-weight:700;color:'+BLUE+';border:1px solid var(--bdr);border-radius:6px;padding:4px 6px;background:#F7F9FC;cursor:pointer}'+
    '.ce-tp-seg:focus,.ce-tp-sub:focus{outline:none;border-color:'+BLUE+'}'+
    '.ce-tp-newsub,.ce-tp-newseg{display:block;width:100%;box-sizing:border-box;font-family:inherit;font-size:10.5px;font-weight:600;color:var(--navy);border:1px solid '+AMBER+';border-radius:6px;padding:5px 8px;margin-bottom:6px}'+
    '.ce-tp-newsub[hidden],.ce-tp-newseg[hidden]{display:none}'+
    '.ce-tp-target{font-size:9.5px;font-weight:700;color:var(--navy);margin-bottom:6px;display:flex;align-items:center;gap:5px;flex-wrap:wrap}'+
    '.ce-tp-arrow{font-size:8.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:var(--mu)}'+
    '.ce-tp-sep{color:var(--mu)}'+
    '.ce-tp-badge{font-size:8px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;color:#0a6b3a;background:rgba(10,143,76,.12);border-radius:999px;padding:2px 7px}'+
    '.ce-tp-badge.new{color:#7A5B02;background:rgba(251,188,5,.22)}'+
    '.ce-tp-chip-new{font-size:7.5px;font-weight:900;letter-spacing:.04em;color:#7A5B02;background:rgba(251,188,5,.22);border-radius:999px;padding:1px 6px;flex:none;margin-top:1px}'+
    '.ce-tp-acts{display:flex;gap:5px;flex:none}'+
    '.ce-tp-ok,.ce-tp-no{font-family:inherit;font-size:9.5px;font-weight:800;border:1px solid var(--bdr);border-radius:999px;padding:4px 9px;cursor:pointer;background:#fff;transition:.12s}'+
    '.ce-tp-ok{color:#0a8f4c}.ce-tp-ok:hover{border-color:#0a8f4c;background:rgba(10,143,76,.06)}'+
    '.ce-tp-no{color:'+RED+'}.ce-tp-no:hover{border-color:'+RED+';background:rgba(234,67,53,.06)}'+
    '.ce-tp-in{display:block;width:100%;box-sizing:border-box;resize:vertical;font-family:inherit;font-size:11px;font-weight:500;line-height:1.5;color:var(--navy);border:1px solid var(--bdr);border-radius:6px;padding:6px 8px;background:#FAFBFD}'+
    '.ce-tp-in:focus{outline:none;border-color:'+BLUE+';background:#fff}'+
    '.ce-tp-staged-h{font-size:9px;font-weight:900;letter-spacing:.05em;text-transform:uppercase;color:var(--mu);margin:14px 0 7px;display:flex;align-items:center;gap:7px}'+
    '.ce-tp-count{font-size:9px;font-weight:900;color:'+BLUE+';background:rgba(37,87,214,.10);border-radius:999px;padding:1px 8px}'+
    '.ce-tp-pub{font-family:inherit;font-size:9px;font-weight:900;letter-spacing:.03em;text-transform:uppercase;color:#fff;background:'+BLUE+';border:0;border-radius:999px;padding:3px 10px;cursor:pointer;transition:.14s}'+
    '.ce-tp-pub:hover{filter:brightness(1.08)}.ce-tp-pub:disabled{opacity:.5;cursor:default}'+
    '.ce-tp-status{font-size:9px;font-weight:700;letter-spacing:0;text-transform:none;color:var(--mu)}'+
    '.ce-tp-staged{display:flex;flex-direction:column;gap:6px}'+
    '.ce-tp-empty{font-size:10px;color:var(--mu);font-weight:600;font-style:italic}'+
    '.ce-tp-chip{display:flex;align-items:flex-start;gap:8px;font-size:10.5px;font-weight:500;color:var(--navy);line-height:1.5;background:#fff;border:1px solid var(--bdr);border-left:3px solid #0a8f4c;border-radius:9px;padding:7px 9px}'+
    '.ce-tp-chip.published{border-left-color:'+BLUE+';opacity:.72}'+
    '.ce-tp-chip.published .ce-tp-chip-tag::after{content:" · in Notes";color:'+BLUE+';font-weight:800}'+
    '.ce-tp-chip.dup{border-left-color:'+RED+';opacity:.72}'+
    '.ce-tp-chip.dup .ce-tp-chip-tag::after{content:" · already filed";color:'+RED+';font-weight:800}'+
    '.ce-tp-chip-tag{font-size:8.5px;font-weight:800;color:'+BLUE+';background:rgba(37,87,214,.10);border-radius:999px;padding:2px 8px;flex:none;margin-top:1px;line-height:1.35}'+
    '.ce-tp-chip-t{flex:1;min-width:0}'+
    '.ce-tp-unstage{font-family:inherit;font-size:9px;font-weight:900;color:var(--mu);border:0;background:none;cursor:pointer;line-height:1;padding:2px 3px;border-radius:50%;flex:none}'+
    '.ce-tp-unstage:hover{color:'+RED+';background:rgba(234,67,53,.10)}'+
  '</style>';
}

function body(c){
  return '<div class="nve-wrap">'+styleTag()+ceExtraStyle()+nveNotesStyle()+
    '<div class="ce-phtabs">'+
      '<button type="button" class="ce-phtab active" data-cep="setup">Setup</button>'+
      '<button type="button" class="ce-phtab" data-cep="results">Post-Results</button>'+
      '<button type="button" class="ce-phtab" data-cep="watch">Notes</button>'+
    '</div>'+
    // quarter pills — shown in BOTH Setup and Post-Results (per-phase validity via data-ceqhas), hidden
    // only in Notes. Default active = the Setup quarter (initial phase). data-ceqhas lists the phases each
    // pill is valid for; nveSyncPills filters them by the active phase and re-activates a valid quarter.
    '<div class="ce-qpills">'+(function(){ var dq=defaultSetupQ(); return QUARTERS.map(function(u){
      var has=nveQPhases(u);
      return '<button type="button" class="ce-qpill'+(u.q===dq?' active':'')+'"'+(has.indexOf('setup')<0?' hidden':'')+' data-ceqsel="'+esc(qkey(u.q))+'" data-ceqhas="'+has.join(' ')+'">'+esc(u.disp)+(u.status==='upcoming'?'<span class="ce-qtag">upcoming</span>':'')+'</button>';
    }).join(''); })()+'</div>'+
    setupPane()+
    resultsPane()+
    watchPane()+
  '</div>';
}

// ═══ WIRING — init(paneRoot, c) ══════════════════════════════════════════════════════════════════
// paneRoot is the .ovt-subpane[data-ovst="earnings"] element. c is the company object (id + ticker)
// for the Watch List DB wiring. Idempotent — safe to call every time the Earnings sub-tab is revealed.
// Sets the active pill and toggles .ce-qblock visibility across BOTH phase panes (Setup + Post-Results),
// mirroring amzn.js ceSelectQuarter — both panes use data-ceq blocks keyed the same way, so one call
// keeps them in sync (the hidden pane is simply off-screen).
function selectQuarter(root, qk){
  root.querySelectorAll('.ce-qpill').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-ceqsel')===qk); });
  root.querySelectorAll('.ce-qblock').forEach(function(bl){ bl.hidden=(bl.getAttribute('data-ceq')!==qk); });
}
// Show only the pills valid for `phase` (data-ceqhas); if the active pill just became invalid for the
// phase, activate the most-recent valid one and drive the same block-visibility a pill click would.
// The pill bar itself is hidden only in the Notes ('watch') phase. Mirrors amzn.js ceApplyPhaseQuarters.
function nveSyncPills(root, phase){
  var pillbar=root.querySelector('.ce-qpills'); if(pillbar) pillbar.hidden=(phase==='watch');
  var pills=Array.prototype.slice.call(root.querySelectorAll('.ce-qpill')), activeVisible=false;
  pills.forEach(function(b){
    var ok=(b.getAttribute('data-ceqhas')||'').split(' ').indexOf(phase)>=0;
    b.hidden=!ok;
    if(ok && b.classList.contains('active')) activeVisible=true;
  });
  if(phase==='watch') return;
  // pills render newest-first, so the FIRST visible is the most recent valid quarter.
  var firstVisible=pills.filter(function(b){ return !b.hidden; })[0];
  if(!activeVisible && firstVisible) selectQuarter(root, firstVisible.getAttribute('data-ceqsel'));
}
function buildSetup(root){
  var w=root.querySelector('.ce-phpane[data-cep="setup"] .rs-wrap');
  if(w){ try{ initResults(w,'NVDA_SETUP'); }catch(e){} }
}
function mountWatch(root, c){
  var host=root.querySelector('.ce-phpane[data-cep="watch"] [data-wlmount]');
  if(!host || host._nveMounted) return;
  host._nveMounted=true;
  try{
    mountWatchList(host, { companyId:(c&&c.id)||null, ticker:'NVDA', quarters:QUARTERS.map(function(u){ return { q:u.q, status:u.status }; }),
      colors:{ brand:BRAND, brand2:BRAND2, purple:PURPLE, gray:GRAY, red:RED } });
  }catch(e){ /* Supabase / login absent — the engine renders its own empty state; never throw */ }
}
// Wires the estimate-grid controls (Consensus/Summit/Both · growth lens · margin) and the print
// scorecard controls (Cards/Chart · vs Street/Summit/Both · verdict filter · order · category · margin
// · lens). The growth lens (data-ceg) is shared: it drives both the grid's .ce-evwrap and each print
// block's .ce-fz. Every other toggle is scoped to its own container. Mirrors amzn.js wireCeTrack.
function nveWireControls(root){
  function setLens(v){
    root.querySelectorAll('.ce-gseg button[data-ceg]').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-ceg')===v); });
    root.querySelectorAll('.ce-evwrap').forEach(function(w){ w.setAttribute('data-g', v); });
    root.querySelectorAll('.ce-fz').forEach(function(f){ f.setAttribute('data-g', v); });
  }
  // ── estimate grid: Consensus ⇄ Summit ⇄ Both ── the toggles drive ALL .ce-evwrap globally, so the
  // .active highlight must sync across EVERY grid control row (each per-quarter block has its own row) —
  // otherwise a freshly-revealed quarter shows a stale highlight. Follows the data-ceg (setLens) pattern.
  root.querySelectorAll('.ce-ev-pill[data-ceev]').forEach(function(btn){ btn.onclick=function(){
    var v=btn.getAttribute('data-ceev');
    root.querySelectorAll('.ce-ev-pill[data-ceev]').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-ceev')===v); });
    root.querySelectorAll('.ce-evwrap').forEach(function(w){ w.setAttribute('data-ev', v); });
  }; });
  // growth lens (shared by grid + print blocks)
  root.querySelectorAll('.ce-gseg button[data-ceg]').forEach(function(btn){ btn.onclick=function(){ setLens(btn.getAttribute('data-ceg')); }; });
  // grid margin toggle — also synced across every grid control row (all .ce-evwrap move together).
  root.querySelectorAll('.ce-gseg button[data-cemm]').forEach(function(btn){ btn.onclick=function(){
    var v=btn.getAttribute('data-cemm');
    root.querySelectorAll('.ce-gseg button[data-cemm]').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-cemm')===v); });
    root.querySelectorAll('.ce-evwrap').forEach(function(w){ w.setAttribute('data-mm', v); });
  }; });
  // ── print scorecard toggles (scoped to the closest .ce-fz) ──
  root.querySelectorAll('.ce-gseg button[data-fzview]').forEach(function(btn){ btn.onclick=function(){
    var v=btn.getAttribute('data-fzview'), fz=btn.closest('.ce-fz');
    btn.parentNode.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b===btn); });
    if(fz) fz.setAttribute('data-view', v);
  }; });
  root.querySelectorAll('.ce-gseg button[data-fzev]').forEach(function(btn){ btn.onclick=function(){
    var v=btn.getAttribute('data-fzev'), fz=btn.closest('.ce-fz');
    btn.parentNode.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b===btn); });
    if(!fz) return;
    fz.setAttribute('data-ev', v);
    if(v==='both'){ fz.removeAttribute('data-f'); var vdf=fz.querySelector('.ce-vdf');
      if(vdf) vdf.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-vdf')==='all'); }); }
  }; });
  root.querySelectorAll('.ce-vdf button[data-vdf]').forEach(function(btn){ btn.onclick=function(){
    var v=btn.getAttribute('data-vdf'), fz=btn.closest('.ce-fz');
    btn.parentNode.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b===btn); });
    if(!fz) return;
    if(v==='all') fz.removeAttribute('data-f'); else fz.setAttribute('data-f', v);
  }; });
  root.querySelectorAll('.ce-gseg button[data-fzord]').forEach(function(btn){ btn.onclick=function(){
    var v=btn.getAttribute('data-fzord'), fz=btn.closest('.ce-fz');
    btn.parentNode.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b===btn); });
    if(fz) fz.setAttribute('data-ord', v);
  }; });
  root.querySelectorAll('.ce-gseg button[data-fzcat]').forEach(function(btn){ btn.onclick=function(){
    var v=btn.getAttribute('data-fzcat'), fz=btn.closest('.ce-fz');
    btn.parentNode.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b===btn); });
    if(fz) fz.setAttribute('data-fzcat', v);
  }; });
  root.querySelectorAll('.ce-gseg button[data-fzmm]').forEach(function(btn){ btn.onclick=function(){
    var v=btn.getAttribute('data-fzmm'), fz=btn.closest('.ce-fz');
    btn.parentNode.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b===btn); });
    if(fz) fz.setAttribute('data-mm', v);
  }; });
}
function init(paneRoot, c){
  var root=paneRoot && paneRoot.querySelector ? paneRoot : document.querySelector('.ovt-subpane[data-ovst="earnings"]');
  if(!root) return;
  _nveCo=(c&&c.id)?c:_nveCo;   // capture the open company (id) for durable theme-record persistence
  // Phase bar — pane-scoped; toggles the .ce-phpane and hides the quarter pills off Post-Results.
  if(!root._nvePhaseWired){
    root._nvePhaseWired=true;
    root.querySelectorAll('.ce-phtab').forEach(function(btn){
      btn.onclick=function(){
        var key=btn.getAttribute('data-cep');
        root.querySelectorAll('.ce-phtab').forEach(function(b){ b.classList.toggle('active', b===btn); });
        root.querySelectorAll('.ce-phpane').forEach(function(p){ p.hidden=(p.getAttribute('data-cep')!==key); });
        // Show the quarter pills valid for this phase (Setup & Post-Results both use them; Notes hides
        // them) and re-activate a valid quarter, toggling the active pane's per-quarter blocks.
        nveSyncPills(root, key);
        if(key==='setup') requestAnimationFrame(function(){ buildSetup(root); });
        if(key==='watch') requestAnimationFrame(function(){ mountWatch(root, c); });
      };
    });
    // quarter pills → Post-Results blocks
    root.querySelectorAll('.ce-qpill').forEach(function(btn){ btn.onclick=function(){ selectQuarter(root, btn.getAttribute('data-ceqsel')); }; });
    // The call, classified — Prepared Remarks ⇄ Q&A toggle (per quarter block)
    root.querySelectorAll('.ce-cc-seg button').forEach(function(btn){
      btn.onclick=function(){
        var seg=btn.parentNode, cc=btn.closest('.ce-cc'); if(!cc) return;
        seg.querySelectorAll('button').forEach(function(b){ b.classList.toggle('active', b===btn); });
        var v=btn.getAttribute('data-ccv');
        cc.querySelectorAll('.ce-cc-pane').forEach(function(p){ p.hidden=(p.getAttribute('data-ccp')!==v); });
      };
    });
    // Theme record — By theme ⇄ By quarter toggle + segment accordions + sub-theme accordions.
    nveWireRecord(root.querySelector('[data-nvdarec]'));
    // ✎ Edit notes & tracking — show/hide the Theme → Sub-theme editor (hidden by default).
    root.querySelectorAll('.nve-edit-tog[data-nveeditog]').forEach(function(btn){ btn.onclick=function(){
      var wrap=btn.closest('.nve-edit'); if(!wrap) return;
      var edb=wrap.querySelector('.nve-edit-body'); if(!edb) return;
      var open=edb.hidden; edb.hidden=!open;
      wrap.setAttribute('data-open', open?'1':'0');
      btn.setAttribute('aria-expanded', open?'true':'false');
    }; });
    // Build the Theme → Sub-theme editor inside the (hidden) panel.
    nveRenderEditor(root);
    // Propose Notes (Post-Results) — draft authored points → publish into the theme record.
    nveWireProposals(root);
    // Load the saved theme record from Supabase (if any) and, from here on, persist every edit.
    nveHydrateThemes(root);
    // Setup estimate grid + Post-Results print scorecard toggles (ported from amzn.js).
    nveWireControls(root);
    // Sync the quarter pills to the initial phase (Setup) — filters to setup-valid pills and selects
    // the default Setup quarter, toggling its block. Mirrors amzn.js ceApplyPhaseQuarters(pane,'setup').
    var initPhase=(function(){ var t=root.querySelector('.ce-phtab.active'); return t?t.getAttribute('data-cep'):'setup'; })();
    nveSyncPills(root, initPhase);
  }
  // Build the Setup chart now if Setup is the visible phase (initial state), else on reveal.
  var setupVisible=(function(){ var p=root.querySelector('.ce-phpane[data-cep="setup"]'); return p && !p.hidden; })();
  if(setupVisible) requestAnimationFrame(function(){ buildSetup(root); });
  var watchVisible=(function(){ var p=root.querySelector('.ce-phpane[data-cep="watch"]'); return p && !p.hidden; })();
  if(watchVisible) requestAnimationFrame(function(){ mountWatch(root, c); });
}

export var nvdaEarnings = { body: body, init: init };
