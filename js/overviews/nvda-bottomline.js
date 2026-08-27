// overviews/nvda-bottomline.js — NVIDIA (NVDA) Deep Dive ▸ BOTTOM LINE
// ════════════════════════════════════════════════════════════════════════════════
// Self-contained module so it can be dropped into the NVDA Deep Dive without editing
// the main overview file (no edit conflict). FORMAT-IDENTICAL to AMZN's Bottom Line
// (js/overviews/amzn.js): an inner sub-tab bar General · Segments · Supply Chain, the
// chart-heavy General pane (chart-picker → margins / bridge / net / SBC + collapsed
// expense deep-dives), the Segments SAB charts, and the Supply-Chain SPLC map.
//
// The atomic chart engine (amzn.js 2945-3131: _aCharts, aStdScaffold/Render/Wire,
// rsAttachBrush, aTbl, aBuildAutoTbl, aCollap, aZoom + ASTD_* consts + acxRGBA) is
// PORTED VERBATIM here, namespace-prefixed `nb…` so nothing collides with results.js
// or amzn.js. The bare registries (`var nbCharts={}`, `var nbStd={}`) are declared —
// the UBER bug was a missing bare registry.
//
// Data: js/results-data/nvda.js (nvdaResults — actual/Summit/consensus rev, gross,
// opinc, ebitda, fcf, eps, capex; the single source of truth per RESULTS_CONVENTIONS)
// plus fiscal figures cross-checked against the FY2026 10-K and the segment/gross-
// margin/opex commentary VERBATIM from docs/calls/NVDA.md. NVDA FY ends late January
// (FY2026 ended Jan 25 2026; Q1 FY2027 ended Apr 26 2026). $ in millions unless noted.
//
// Export shape:  export var nvdaBottomLine = { body, init }
// ════════════════════════════════════════════════════════════════════════════════

import { nvdaResults } from '../results-data/nvda.js';
import { nvdaBBG } from './nvda-bbg.js';

// ─── local helpers ───────────────────────────────────────────────────────────────
function esc(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
// acxRGBA — ported verbatim (amzn.js ~4434), renamed nbRGBA.
function nbRGBA(hex,a){ var h=hex.replace('#',''); var r=parseInt(h.slice(0,2),16),g=parseInt(h.slice(2,4),16),b=parseInt(h.slice(4,6),16); return 'rgba('+r+','+g+','+b+','+a+')'; }

// Palette (NVIDIA green + steel). Local so nothing depends on amzn.js constants.
var BRAND='#76B900', BRAND2='#2F80ED', GRAY='#9AA4B0', GREEN='#12B5A5', SQUID='#7A5AF8', PURPLE='#7A5AF8', RED='#EB5757', AMBER='#B7791F';
// Standard series colours — ported from ASTD_* (amzn.js 3013).
var NB_ACT='rgba(30,39,51,0.92)', NB_SUMMIT='rgba(37,99,235,0.85)', NB_CONS='rgba(124,134,148,0.85)';
// Diluted shares (M), split-adjusted — used to turn the model's EPS into a net-income $ series.
// BBG latest reported ~24.39B (see nvidia.js VAL_SHARES_B); a touch higher in the closed years.
var NB_SHARES=24500, NB_QSHARES=24700;

var _nbRoot=null;

// ═══════════════════════════════════════════════════════════════════════════════════════════
// PORTED ATOMIC CHART ENGINE (amzn.js 2945-3131) — nb-prefixed, verbatim behaviour.
// ═══════════════════════════════════════════════════════════════════════════════════════════
var nbCharts={};   // ← the bare registry the UBER bug was missing
function nbDestroy(id){ if(nbCharts[id]){ nbCharts[id].destroy(); nbCharts[id]=null; } }
function nbChartReady(id){ var cv=document.getElementById(id); return (cv&&typeof Chart!=='undefined'&&cv.offsetParent)?cv:null; }
// Drag-to-zoom brush (rule 1) — ported verbatim.
function nbAttachBrush(el, chart, onX, onY, onReset){
  var wrap = el.parentElement;
  if (wrap && getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';
  el.style.cursor = 'crosshair';
  el.onmousedown = function(ev){
    if (ev.button !== 0) return;
    var r0 = el.getBoundingClientRect(), w0 = wrap.getBoundingClientRect(), area = chart.chartArea;
    var onAxis = (ev.clientX - r0.left) < area.left || (ev.clientX - r0.left) > area.right;
    var forcedY = onAxis || !onX, vertical = forcedY ? true : null, startX = ev.clientX, startY = ev.clientY, box = null;
    function ensureBox(){ if (box) return; box = document.createElement('div'); box.className = 'rs-brush';
      if (vertical){ box.style.left = (r0.left - w0.left + area.left) + 'px'; box.style.width = (area.right - area.left) + 'px'; }
      else { box.style.top = (r0.top - w0.top) + 'px'; box.style.height = r0.height + 'px'; } wrap.appendChild(box); }
    function decide(cx, cy){ if (vertical != null) return; var dx = Math.abs(cx - startX), dy = Math.abs(cy - startY); if (Math.max(dx, dy) < 8) return; vertical = dy > dx; }
    function place(cx, cy){ if (vertical == null) return; ensureBox();
      if (vertical){ var a = Math.min(startY, cy), b = Math.max(startY, cy); box.style.top = (a - w0.top) + 'px'; box.style.height = (b - a) + 'px'; }
      else { var a2 = Math.min(startX, cx), b2 = Math.max(startX, cx); box.style.left = (a2 - w0.left) + 'px'; box.style.width = (b2 - a2) + 'px'; } }
    place(ev.clientX, ev.clientY);
    function onMove(e2){ decide(e2.clientX, e2.clientY); place(e2.clientX, e2.clientY); }
    function onUp(e2){ document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); decide(e2.clientX, e2.clientY); if (box) box.remove();
      if (vertical == null) return;
      if (vertical){ if (Math.abs(e2.clientY - startY) < 8) return;
        var v1 = chart.scales.y.getValueForPixel(Math.min(startY, e2.clientY) - r0.top), v2 = chart.scales.y.getValueForPixel(Math.max(startY, e2.clientY) - r0.top); onY(Math.min(v1, v2), Math.max(v1, v2)); }
      else { if (Math.abs(e2.clientX - startX) < 8) return;
        function idxAt(cx){ var v = chart.scales.x.getValueForPixel(cx - r0.left); return Math.max(0, Math.min(chart.data.labels.length - 1, Math.round(v))); }
        var a = idxAt(startX), b = idxAt(e2.clientX); if (a !== b) onX(Math.min(a, b), Math.max(a, b)); } }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp); ev.preventDefault(); };
  el.ondblclick = onReset;
}
function nbFnum(v){ if(v==null||v==='') return null; if(Array.isArray(v)) v=v[v.length-1]; if(typeof v!=='number') return String(v);
  var a=Math.abs(v), r=a<10?Math.round(v*100)/100:(a<1000?Math.round(v*10)/10:Math.round(v)); return r.toLocaleString('en-US'); }
// Auto-table from a chart's own data (rule 3), honouring hidden series (rule 2).
function nbBuildAutoTbl(id){
  var cv=document.getElementById(id), ch=nbCharts[id]; if(!cv||!ch) return;
  if(document.getElementById(id+'-tbl')) return;
  var labels=(ch.data&&ch.data.labels)||[], ds=(ch.data&&ch.data.datasets)||[];
  if(!labels.length||!ds.length) return;
  var headers=['Series'].concat(labels.map(function(l){ return Array.isArray(l)?l.join(' '):String(l); }));
  var rows=[]; ds.forEach(function(d,i){ var meta=ch.getDatasetMeta?ch.getDatasetMeta(i):null; if(meta&&meta.hidden) return;
    rows.push([d.label||'series'].concat((d.data||[]).map(nbFnum))); });
  var wrap=cv.parentElement, host=wrap&&wrap.parentNode; if(!host) return;
  var prev=wrap.nextElementSibling, wasOpen=false;
  if(prev&&prev.getAttribute&&prev.getAttribute('data-rstblhost')===id){ var ob=prev.querySelector('.rs-collap-b'); wasOpen=!!(ob&&!ob.hidden); host.removeChild(prev); }
  var div=document.createElement('div'); div.setAttribute('data-rstblhost',id); div.style.marginTop='8px';
  div.innerHTML=nbTbl(id,'Data — what the chart draws',headers,rows);
  if(wasOpen){ var nb=div.querySelector('.rs-collap-b'); if(nb) nb.hidden=false; var ic=div.querySelector('.rs-collap-ic'); if(ic) ic.textContent='▾'; }
  host.insertBefore(div, wrap.nextSibling);
}
// Collapsible SECTION.
function nbCollap(title, inner, open){
  return '<div class="rs-collap" style="margin:16px 0 4px"><button type="button" class="rs-collap-h">'+
    '<span class="rs-collap-ic">'+(open?'▾':'▸')+'</span> '+esc(title)+'</button>'+
    '<div class="rs-collap-b"'+(open?'':' hidden')+' style="padding-top:10px">'+inner+'</div></div>';
}
// ═══ SAB-parity chart scaffold (amzn.js 3015-3131) — ported verbatim, nb-prefixed ═══
var _nbStd={}, _nbStdDerive={};   // ← bare registries
function nbStdScaffold(cfg){
  var id=cfg.id;
  var st=_nbStd[id]||(_nbStd[id]={win:null,hidden:{},sel:null,modes:{}});
  if(cfg.metricSel && st.sel==null){ var on=cfg.metricSel.filter(function(o){return o.on;})[0]||cfg.metricSel[0]; st.sel=on.v; }
  (cfg.modes||[]).forEach(function(g){ if(st.modes[g.cls]==null){ var d=g.opts.filter(function(o){return o.on;})[0]||g.opts[0]; st.modes[g.cls]=d.v; } });
  var sel=cfg.metricSel? '<select class="rs-msel" data-nbstdsel="'+id+'">'+cfg.metricSel.map(function(o){ return '<option value="'+esc(o.v)+'"'+(o.v===st.sel?' selected':'')+'>'+esc(o.label)+'</option>'; }).join('')+'</select>':'';
  var top='<div class="rs-block-top"><div class="rs-block-h">'+esc(cfg.title)+'</div>'+sel+'</div>';
  var modes=(cfg.modes||[]).map(function(g){ return '<div class="astd-modeg" data-nbstdmodeg="'+id+'|'+g.cls+'" style="display:inline-flex;align-items:center;gap:6px;margin:0 10px 6px 0">'+(g.label?'<span class="rs-quick-l">'+esc(g.label)+'</span>':'')+'<div class="rs-views">'+g.opts.map(function(o){ return '<button type="button" class="rs-view'+(o.v===st.modes[g.cls]?' active':'')+'" data-nbstdmode="'+id+'|'+g.cls+'|'+o.v+'">'+esc(o.label)+'</button>'; }).join('')+'</div></div>'; }).join('');
  var presets=cfg.presets||[['all','All'],['rep','Reported'],['fwd','Forward']];
  var quick='<div class="rs-quick"><span class="rs-quick-l">Range</span>'+presets.map(function(p){ return '<button type="button" class="rs-preset" data-nbstdrange="'+id+'|'+p[0]+'">'+esc(p[1])+'</button>'; }).join('')+'</div>';
  var row2='<div class="rs-block-modes"><div class="rs-modes">'+modes+'</div>'+quick+'</div>';
  var leg='<div class="ave-leg" data-nbstdleg="'+id+'"></div>';
  var chart='<div class="ov-chart-card"><div class="ov-chart-wrap ovs-tall" style="min-height:'+(cfg.height||320)+'px"><canvas id="nbstd-'+id+'"></canvas></div></div>';
  var slider='<div class="sg-controls"><div class="sg-slider"><div class="sg-track"><div class="sg-fill" data-nbstdfill="'+id+'"></div></div><div class="rs-ticks" data-nbstdticks="'+id+'"></div>'+
    '<input type="range" class="nbstd-r0" min="0" max="1" value="0" step="1" aria-label="Start period">'+
    '<input type="range" class="nbstd-r1" min="0" max="1" value="1" step="1" aria-label="End period"></div>'+
    '<div class="sg-ends"><span data-nbstdend0="'+id+'"></span><span data-nbstdend1="'+id+'"></span></div></div>';
  var tbl='<div class="rs-collap" style="margin-top:8px"><button type="button" class="rs-collap-h"><span class="rs-collap-ic">▸</span> Data — what the chart draws</button>'+
    '<div class="rs-collap-b" hidden style="padding-top:8px"><div class="rs-tablewrap" data-nbstdtbl="'+id+'"></div></div></div>';
  return '<div class="ov-sec" data-nbstdblock="'+id+'">'+top+row2+leg+chart+slider+tbl+'</div>';
}
function nbStdBlk(id){ return _nbRoot? _nbRoot.querySelector('[data-nbstdblock="'+id+'"]') : document.querySelector('[data-nbstdblock="'+id+'"]'); }
function nbStdRender(id, derive){
  if(derive) _nbStdDerive[id]=derive; derive=_nbStdDerive[id]; if(!derive) return;
  var cv=nbChartReady('nbstd-'+id); if(!cv) return;
  var st=_nbStd[id]||(_nbStd[id]={win:null,hidden:{},sel:null,modes:{}});
  var spec=derive(st); if(!spec) return;
  var n=spec.labels.length; if(!st.win || st.win[1]>n-1 || st.win[0]>st.win[1]) st.win=[0,n-1];
  var lo=st.win[0], hi=st.win[1], la=spec.lastAct==null?n-1:spec.lastAct;
  var labels=spec.labels.slice(lo,hi+1), yFmt=spec.yFmt||function(v){return v;};
  nbDestroy('nbstd-'+id);
  var stk=spec.stacked?'s':undefined, needY2=false;
  var ds=spec.series.filter(function(s){ return !st.hidden[s.k]; }).map(function(s){
    var t=s.type||spec.type||'line'; if(s.yAxisID==='y2') needY2=true;
    if(t==='bar') return { type:'bar', label:s.label, data:s.data.slice(lo,hi+1), backgroundColor:s.data.slice(lo,hi+1).map(function(_,i){ return (lo+i)>la?nbRGBA(s.color,0.5):s.color; }), borderColor:'#fff', borderWidth:1, maxBarThickness:34, stack:stk, yAxisID:s.yAxisID||'y', order:s.order||3 };
    return { type:'line', label:s.label, data:s.data.slice(lo,hi+1), borderColor:s.color, backgroundColor:s.color, borderWidth:2.2, pointRadius:2, tension:0.2, spanGaps:false, yAxisID:s.yAxisID||'y', order:s.order||2,
      borderDash:s.dash?[5,4]:undefined, segment: s.fwdDash?{ borderDash:function(ctx){ return (lo+ctx.p1DataIndex)>la?[5,4]:undefined; } }:undefined }; });
  var anyBar=spec.series.some(function(s){ return (s.type||spec.type)==='bar'; }), y2f=spec.y2Fmt||function(v){return v;};
  var scales={ x:{ stacked:anyBar&&spec.stacked, grid:{ display:false }, ticks:{ font:{ size:11 } } },
    y:{ stacked:anyBar&&spec.stacked, position:'right', max:spec.yMax, grid:{ color:'rgba(0,0,0,0.05)' }, ticks:{ font:{ size:11 }, callback:function(v){ return yFmt(v); } } } };
  if(needY2) scales.y2={ position:'right', weight:1, grid:{ display:false }, ticks:{ font:{ size:11 }, callback:function(v){ return y2f(v); } } };
  nbCharts['nbstd-'+id]=new Chart(cv.getContext('2d'),{ type:anyBar?'bar':'line', data:{ labels:labels, datasets:ds },
    options:{ responsive:true, maintainAspectRatio:false, interaction:{ mode:'index', intersect:false },
      plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:function(c){ var f=c.dataset.yAxisID==='y2'?y2f:yFmt; return c.dataset.label+': '+(c.parsed.y==null?'—':f(c.parsed.y))+((lo+c.dataIndex)>la?' (E)':''); } } } },
      scales:scales } });
  var blk=nbStdBlk(id);
  if(blk){ var hm=spec.hideModes||[];
    blk.querySelectorAll('[data-nbstdmodeg]').forEach(function(g){ var cls=g.getAttribute('data-nbstdmodeg').split('|')[1]; g.style.display=hm.indexOf(cls)>=0?'none':'inline-flex'; }); }
  var leg=blk&&blk.querySelector('[data-nbstdleg="'+id+'"]');
  if(leg){
    if(spec.paired){
      var seen={}, chips=[];
      spec.series.forEach(function(s){ var g=s.grp||s.k; if(seen[g])return; seen[g]=1;
        chips.push('<button type="button" class="rs-leg'+(st.hidden[s.k]?' off':'')+'" data-nbstdleggrp="'+id+'|'+g+'"><span class="ave-leg-act" style="background:'+s.color+'"></span>'+esc(s.src||s.label)+'</button>'); });
      leg.innerHTML=chips.join('')+'<span style="font-size:11px;color:var(--mu,#64748b);font-weight:600;margin-left:2px">Bars = $ amount &nbsp;·&nbsp; lines = margin (right axis)</span>';
    } else {
      leg.innerHTML=spec.series.map(function(s){ return '<button type="button" class="rs-leg'+(st.hidden[s.k]?' off':'')+'" data-nbstdlegk="'+id+'|'+s.k+'"><span class="ave-leg-act" style="background:'+s.color+'"></span>'+esc(s.label)+'</button>'; }).join('');
    }
  }
  var tblc=blk&&blk.querySelector('[data-nbstdtbl="'+id+'"]');
  if(tblc){ var vis=spec.series.filter(function(s){ return !st.hidden[s.k]; });
    var hd='<tr><th style="text-align:left;position:sticky;left:0;background:var(--card,#fff)">Series</th>'+labels.map(function(l){ return '<th style="text-align:right">'+esc(l)+'</th>'; }).join('')+'</tr>';
    var bd=vis.map(function(s){ return '<tr><td style="text-align:left;font-weight:700;position:sticky;left:0;background:var(--card,#fff)">'+esc(s.label)+'</td>'+s.data.slice(lo,hi+1).map(function(v){ return '<td style="text-align:right;font-variant-numeric:tabular-nums">'+(v==null?'—':esc(String(yFmt(v))))+'</td>'; }).join('')+'</tr>'; }).join('');
    tblc.innerHTML='<table style="width:100%;border-collapse:collapse;font-size:11.5px"><thead>'+hd+'</thead><tbody>'+bd+'</tbody></table>'; }
  nbStdSyncSlider(id, spec.labels, la);
  nbStdWire(id);
  var cvv=document.getElementById('nbstd-'+id), chh=nbCharts['nbstd-'+id];
  if(cvv&&chh) nbAttachBrush(cvv, chh, function(i1,i2){ var w=_nbStd[id].win, lo=w[0]; _nbStd[id].win=[lo+i1, lo+i2]; nbStdRender(id); }, null, function(){ _nbStd[id].win=null; nbStdRender(id); });
}
function nbStdSyncSlider(id, labels, la){
  var blk=nbStdBlk(id); if(!blk) return; var n=labels.length, w=_nbStd[id].win;
  var r0=blk.querySelector('.nbstd-r0'), r1=blk.querySelector('.nbstd-r1'), fill=blk.querySelector('[data-nbstdfill]'), ticks=blk.querySelector('[data-nbstdticks]'), e0=blk.querySelector('[data-nbstdend0]'), e1=blk.querySelector('[data-nbstdend1]');
  if(r0){ r0.max=n-1; r0.value=w[0]; } if(r1){ r1.max=n-1; r1.value=w[1]; }
  if(fill){ fill.style.left=(w[0]/(n-1)*100)+'%'; fill.style.width=((w[1]-w[0])/(n-1)*100)+'%'; }
  if(e0) e0.textContent=labels[w[0]]||''; if(e1) e1.textContent=labels[w[1]]||'';
  if(ticks){ var h=''; for(var i=0;i<n;i++){ h+='<span class="rs-tick'+(i>=w[0]&&i<=w[1]?' on':'')+(i>la?' est':'')+'" style="left:'+(i/(n-1)*100)+'%"></span>'; } ticks.innerHTML=h; }
}
function nbStdPresetWin(code, n, la){ switch(code){ case 'rep': return [0,la]; case 'fwd': return [Math.max(0,la),n-1];
  case 'l3': return [Math.max(0,la-2),la]; case 'l5': return [Math.max(0,la-4),la];
  case 'l4': return [Math.max(0,la-3),la]; case 'l8': return [Math.max(0,la-7),la]; default: return [0,n-1]; } }
function nbStdWire(id){
  var blk=nbStdBlk(id); if(!blk || blk._nbstdWired) return; blk._nbstdWired=true; var st=_nbStd[id];
  blk.addEventListener('click', function(e){
    var mode=e.target.closest&&e.target.closest('[data-nbstdmode]'); if(mode){ var p=mode.getAttribute('data-nbstdmode').split('|'); st.modes[p[1]]=p[2];
      mode.parentNode.querySelectorAll('.rs-view').forEach(function(x){ x.classList.toggle('active',x===mode); }); nbStdRender(id); return; }
    var lg=e.target.closest&&e.target.closest('[data-nbstdlegk]'); if(lg){ var k=lg.getAttribute('data-nbstdlegk').split('|')[1]; st.hidden[k]=!st.hidden[k]; nbStdRender(id); return; }
    var lgg=e.target.closest&&e.target.closest('[data-nbstdleggrp]'); if(lgg){ var g=lgg.getAttribute('data-nbstdleggrp').split('|')[1], spc=_nbStdDerive[id]&&_nbStdDerive[id](st);
      if(spc){ var mem=spc.series.filter(function(s){ return (s.grp||s.k)===g; }), off=mem.every(function(s){ return st.hidden[s.k]; }); mem.forEach(function(s){ st.hidden[s.k]=!off; }); } nbStdRender(id); return; }
    var rp=e.target.closest&&e.target.closest('[data-nbstdrange]'); if(rp){ var spec=_nbStdDerive[id]&&_nbStdDerive[id](st); var n=spec?spec.labels.length:2, la=spec&&spec.lastAct!=null?spec.lastAct:n-1;
      st.win=nbStdPresetWin(rp.getAttribute('data-nbstdrange').split('|')[1], n, la); nbStdRender(id); return; }
  });
  var sel=blk.querySelector('[data-nbstdsel]'); if(sel) sel.onchange=function(){ st.sel=sel.value; nbStdRender(id); };
  var r0=blk.querySelector('.nbstd-r0'), r1=blk.querySelector('.nbstd-r1');
  function onSlide(){ var a=+r0.value, b=+r1.value; st.win=[Math.min(a,b),Math.max(a,b)]; nbStdRender(id); }
  if(r0) r0.oninput=onSlide; if(r1) r1.oninput=onSlide;
}
function nbZoom(id){ var cv=document.getElementById(id), ch=nbCharts[id]; if(!cv||!ch) return;
  if(ch.options&&ch.options.scales&&ch.options.scales.y){
    nbAttachBrush(cv, ch, null,
      function(v1,v2){ ch.options.scales.y.min=v1; ch.options.scales.y.max=v2; ch.update('none'); },
      function(){ ch.options.scales.y.min=undefined; ch.options.scales.y.max=undefined; ch.update('none'); }); }
  if(ch.options&&ch.options.plugins&&ch.options.plugins.legend){
    var orig=Chart.defaults.plugins.legend.onClick;
    ch.options.plugins.legend.onClick=function(e,item,legend){ orig.call(this,e,item,legend); setTimeout(function(){ nbBuildAutoTbl(id); },0); }; }
  nbBuildAutoTbl(id);
}
function nbTbl(id, title, headers, rows){
  var head='<span class="rs-collap-ic">▸</span> '+esc(title)+' <span class="rs-collap-sub">'+rows.length+' rows</span>';
  var thead='<tr>'+headers.map(function(hh,i){ return '<th'+(i===0?' class="rs-ft-h"':'')+'>'+esc(String(hh))+'</th>'; }).join('')+'</tr>';
  var tb=rows.map(function(r){ return '<tr>'+r.map(function(c,i){ return i===0?('<td class="rs-ft-h">'+esc(String(c))+'</td>'):('<td>'+(c==null||c===''?'<span class="rs-ft-nil">–</span>':esc(String(c)))+'</td>'); }).join('')+'</tr>'; }).join('');
  return '<div class="rs-collap" data-rstbl="'+id+'"><button type="button" class="rs-collap-h" data-rstblb="'+id+'">'+head+'</button>'+
    '<div class="rs-collap-b" id="rsTB-'+id+'" hidden><div class="rs-ft-scroll"><table class="rs-ft"><thead>'+thead+'</thead><tbody>'+tb+'</tbody></table></div></div></div>';
}
// ═══ Waterfall (amzn.js aBrPlugin / aBuildBrWaterfall) — ported verbatim, nb-prefixed ═══
var nbBrPlugin={ id:'nbBrLbl', afterDatasetsDraw:function(chart){
  var steps=chart._steps; if(!steps) return; var ctx=chart.ctx, meta=chart.getDatasetMeta(0), y=chart.scales.y, fmt=chart._fmt||{};
  ctx.save();
  ctx.strokeStyle='rgba(120,130,145,.55)'; ctx.setLineDash([3,3]); ctx.lineWidth=1;
  for(var i=0;i<steps.length-1;i++){ if(steps[i].runAfter==null) continue; var b0=meta.data[i], b1=meta.data[i+1];
    var yy=y.getPixelForValue(steps[i].runAfter); ctx.beginPath(); ctx.moveTo(b0.x+b0.width/2, yy); ctx.lineTo(b1.x-b1.width/2, yy); ctx.stroke(); }
  ctx.setLineDash([]); ctx.textAlign='center';
  for(var j=0;j<steps.length;j++){ var s=steps[j], bar=meta.data[j], topPix=y.getPixelForValue(Math.max(s.range[0], s.range[1])), txt;
    if(s.kind==='base'||s.kind==='total'){ txt=(fmt.base||String)(s.val); ctx.fillStyle='#1E2733'; ctx.font='800 11px Inter, system-ui, sans-serif'; }
    else { txt=(fmt.delta||String)(s.val); ctx.fillStyle=s.dc||(s.val>=0?'#2E8B57':'#C0504D'); ctx.font='700 10.5px Inter, system-ui, sans-serif'; }
    ctx.fillText(txt, bar.x, topPix-6); }
  ctx.restore();
} };
function nbBuildBrWaterfall(id, steps, fmt){
  var cv=nbChartReady(id); if(!cv) return; nbDestroy(id);
  var labels=steps.map(function(s){return s.label;}), data=steps.map(function(s){return s.range;}), colors=steps.map(function(s){return s.color;});
  var ch=new Chart(cv.getContext('2d'), { type:'bar',
    data:{ labels:labels, datasets:[{ data:data, backgroundColor:colors, borderRadius:4, borderSkipped:false, maxBarThickness:56, categoryPercentage:0.74, barPercentage:0.9 }] },
    options:{ responsive:true, maintainAspectRatio:false, animation:false, layout:{padding:{top:24}},
      plugins:{ legend:{display:false}, tooltip:{ displayColors:false, callbacks:{ title:function(it){return it[0].label;}, label:function(ctx){
        var s=ctx.chart._steps[ctx.dataIndex];
        if(s.kind==='base') return (fmt.base||String)(s.val);
        if(s.kind==='total') return (fmt.base||String)(s.val);
        return (fmt.delta||String)(s.val)+(s.runAfter!=null?'   ·   running '+(fmt.base||String)(s.runAfter):''); } } } },
      scales:{ x:{ grid:{display:false}, ticks:{color:'#8A93A0', font:{size:11}, autoSkip:false, maxRotation:45, minRotation:0} },
        y:{ position:'right', beginAtZero:true, grid:{color:'#EEF2F7'}, ticks:{color:'#8A93A0', font:{size:11}, callback:function(v){return (fmt.axis||String)(v);}} } } },
    plugins:[ nbBrPlugin ] });
  ch._steps=steps; ch._fmt=fmt; nbCharts[id]=ch; ch.update('none'); nbZoom(id);
  var tw=document.getElementById(id+'-tbl');
  if(tw){ var f=(fmt&&fmt.base)||String, fd=(fmt&&fmt.delta)||String;
    tw.innerHTML=nbTbl(id, 'The waterfall — every step', ['Step','Value','Running'], steps.map(function(s){
      return [s.label, (s.kind==='base'||s.kind==='total')?f(s.val):fd(s.val), s.runAfter==null?f(s.val):f(s.runAfter)]; })); }
}
var BR_FMT_D={ axis:function(v){return '$'+Math.round(v)+'B';}, base:function(v){return '$'+v.toFixed(1)+'B';}, delta:function(v){return (v>=0?'+$':'−$')+Math.abs(v).toFixed(1)+'B';} };

// ═══════════════════════════════════════════════════════════════════════════════════════════
// GENERAL — chart-picker (margins / bridge / net / SBC) + collapsed expense deep-dives
// ═══════════════════════════════════════════════════════════════════════════════════════════
function nbPane(key){ return _nbRoot? _nbRoot.querySelector('.ovt-subpane[data-ovst="'+key+'"]') : document.querySelector('.ovt-subpane[data-ovst="'+key+'"]'); }
function nbGeneralPicker(){
  var opts=[['margins','Profitability & margins'],['bridge','The bridge — revenue → operating income'],['net','Operating income → net income'],['sbc','Stock-based compensation']];
  return '<div class="ov-sec" style="padding-bottom:10px"><div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">'+
    '<span style="font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--mu)">Chart</span>'+
    '<select class="gen-chart" style="font-size:13px;font-weight:700;color:var(--navy);border:1px solid var(--bdr);border-radius:8px;padding:6px 10px;background:#fff">'+
    opts.map(function(o){ return '<option value="'+o[0]+'"'+(o[0]==='margins'?' selected':'')+'>'+o[1]+'</option>'; }).join('')+
    '</select>'+
    '<span style="font-size:11px;color:var(--mu)">Pick one — the rest stay tucked away.</span>'+
    '</div></div>';
}
// ── Margins chart (dual-axis $B bars Actual/Summit/Consensus + margin-% lines on y2) ──
var NB_MET={gross:'grossProfit', operating:'opinc', ebitda:'ebitda', fcf:'fcf'};
var NB_MARG_LAB={gross:'Gross profit', operating:'Op. income', net:'Net income', ebitda:'EBITDA', fcf:'FCF'};
// Reported GAAP net income $M (FY22..FY29) — FY24-FY26 from the FY press releases / 10-K
// (FY2024 $29.76B · FY2025 $72.88B · FY2026 $120.13B). Forward net has no reported actual.
var NB_NET_ACT=[null,null,29760,72880,120130,null,null,null];
function nbLastAct(arr){ var la=0; for(var i=0;i<arr.length;i++) if(arr[i]!=null) la=i; return la; }
function nbMarginsBody(){
  return nbStdScaffold({ id:'nbmargins', title:'Profitability & margins', height:360,
    metricSel:[{v:'gross',label:'Gross profit'},{v:'operating',label:'Operating income',on:true},{v:'net',label:'Net income (GAAP)'},{v:'ebitda',label:'EBITDA'},{v:'fcf',label:'Free cash flow'}],
    modes:[{cls:'gran',label:'Period',opts:[{v:'y',label:'Annual',on:true},{v:'q',label:'Quarterly'}]}],
    presets:[['all','All'],['rep','Reported'],['fwd','Forward'],['l5','Last 5']] });
}
// SAB dual-axis: $ amount bars (Actual / Summit / Consensus) + margin-% lines on the right y2.
function nbMargDual(lab, actNum, conNum, rev, la, sm){
  function amt(v){ return v==null?null:Math.round(v/100)/10; }
  function marg(v,i){ return (v==null||!rev[i])?null:Math.round(v/rev[i]*1000)/10; }
  var series=[
    {k:'act$',grp:'act',src:'Actual',label:lab+' — Actual',color:NB_ACT,type:'bar',data:actNum.map(amt)},
    {k:'con$',grp:'con',src:'Consensus',label:lab+' — Consensus',color:NB_CONS,type:'bar',data:conNum.map(amt)},
    {k:'actM',grp:'act',src:'Actual',label:'Margin — Actual',color:NB_ACT,type:'line',yAxisID:'y2',data:actNum.map(marg)},
    {k:'conM',grp:'con',src:'Consensus',label:'Margin — Consensus',color:NB_CONS,type:'line',yAxisID:'y2',dash:true,data:conNum.map(marg)} ];
  if(sm){ series.splice(1,0,{k:'sum$',grp:'sum',src:'Summit',label:lab+' — Summit',color:NB_SUMMIT,type:'bar',data:sm.num.map(amt)});
    series.push({k:'sumM',grp:'sum',src:'Summit',label:'Margin — Summit',color:NB_SUMMIT,type:'line',yAxisID:'y2',data:sm.num.map(function(v,i){ return (v==null||!sm.den[i])?null:Math.round(v/sm.den[i]*1000)/10; })}); }
  return series;
}
function nbBuildMargins(){
  nbStdRender('nbmargins', function(st){
    var gran=st.modes.gran||'y', metric=st.sel||'operating', lab=NB_MARG_LAB[metric];
    var out={ type:'bar', stacked:false, yFmt:function(x){ return '$'+(x==null?'':x.toFixed(1))+'B'; }, y2Fmt:function(x){ return x+'%'; } };
    if(gran==='q'){
      var Q=nvdaResults.views.q.metrics, rv=Q.rev, labels=Q.rev.periods.slice(), la=nbLastAct(rv.act);
      var actN, conN, revS=labels.map(function(_,i){ return i<=la?rv.act[i]:rv.cons[i]; });
      if(metric==='net'){ var eps=Q.eps;
        actN=labels.map(function(_,i){ return (i<=la&&eps.act[i]!=null)?eps.act[i]*NB_QSHARES:null; });
        conN=labels.map(function(_,i){ return (i>=la&&eps.cons[i]!=null)?eps.cons[i]*NB_QSHARES:null; });
      } else { var m=Q[NB_MET[metric]]; if(!m) return null;   // fcf not carried quarterly → nothing renders (§0.2)
        actN=labels.map(function(_,i){ return i<=la?m.act[i]:null; }); conN=labels.map(function(_,i){ return i>=la?m.cons[i]:null; }); }
      out.labels=labels; out.lastAct=la; out.paired=true; out.series=nbMargDual(lab, actN, conN, revS, la, null); return out;   // no Summit quarterly
    }
    var Y=nvdaResults.views.y.metrics, labels=['FY22','FY23','FY24','FY25','FY26','FY27E','FY28E','FY29E'], la=4, rvb=Y.rev;
    var rev=rvb.act.map(function(v,i){ return v!=null?v:rvb.summit[i]; });
    if(metric==='net'){ var eps=Y.eps;
      var actN=labels.map(function(_,i){ return i<=la?NB_NET_ACT[i]:null; });
      var conN=labels.map(function(_,i){ return (i>=la&&eps.cons[i]!=null)?eps.cons[i]*NB_SHARES:null; });
      var sumN=eps.summit.map(function(v){ return v==null?null:v*NB_SHARES; });
      out.labels=labels; out.lastAct=la; out.paired=true; out.series=nbMargDual(lab, actN, conN, rev, la, {num:sumN,den:rvb.summit}); return out;
    }
    var num=Y[NB_MET[metric]]; if(!num) return null;
    var actN=labels.map(function(_,i){ return i<=la?num.act[i]:null; });
    var conN=labels.map(function(_,i){ return i>=la?num.cons[i]:null; });
    out.labels=labels; out.lastAct=la; out.paired=true; out.series=nbMargDual(lab, actN, conN, rev, la, {num:num.summit.slice(), den:rvb.summit}); return out;
  });
}
// ── The bridge — revenue → cost of revenue → R&D → SG&A → operating income ──
// THREE modes (ported from AMZN aBridgeBody): Build-up ($B, annual or quarterly) · Margin
// change (bps, decomposing the operating-margin move between two years by cost line) · Forward
// (a Bloomberg consensus year with a per-cost-line sensitizer + "Reset to consensus"). Every row
// is built from nvda-bbg.js (BBG as-reported income statement + forward consensus): cost of
// revenue = revenue − gross profit; R&D and SG&A are the reported lines; "Other opex" is the
// residual that reconciles revenue − Σcost to the reported/consensus operating income exactly.
var NB_BR_COST=[
  {k:'costRev',lab:'Cost of revenue',short:'Cost of rev',c:'#6B7683'},
  {k:'rnd',    lab:'R&D',            short:'R&D',        c:BRAND2},
  {k:'sga',    lab:'SG&A',           short:'SG&A',       c:PURPLE},
  {k:'other',  lab:'Other opex',     short:'Other',      c:AMBER}
];
var NB_FX_LINES=[{k:'costRev',lab:'Cost of revenue'},{k:'rnd',lab:'R&D'},{k:'sga',lab:'SG&A'}];
// Pull one income-statement figure from nvda-bbg at a basis ('a'|'q'|'f') and index.
function nbBrGet(key, basis, i){ var s=nvdaBBG.is[key]; return (s&&s[basis]&&s[basis][i]!=null)?s[basis][i]:null; }
// Build a normalized opex row {revenue,costRev,rnd,sga,other,opinc} from nvda-bbg. adj = optional
// {costRev,rnd,sga} percent tweaks vs consensus; "other" is held so OI floats with the adjustment.
function nbBrRow(basis, i, adj){
  var rev=nbBrGet('rev',basis,i), oi=nbBrGet('oi',basis,i); if(rev==null||oi==null) return null;
  var cogs=nbBrGet('cogs',basis,i); if(cogs==null){ var gp=nbBrGet('grossProfit',basis,i); cogs=(gp!=null)?(rev-gp):0; }
  var rnd=nbBrGet('rnd',basis,i)||0, sga=nbBrGet('sga',basis,i)||0;
  var other=rev-cogs-rnd-sga-oi;   // residual → reconciles exactly to reported/consensus OI
  adj=adj||{}; function A(v,k){ return v*(1+((adj[k]||0)/100)); }
  return { revenue:rev, costRev:A(cogs,'costRev'), rnd:A(rnd,'rnd'), sga:A(sga,'sga'), other:other, opinc:oi };
}
// Revenue → −each cost line → = Operating income, in $B, for one period row.
function nbBridgeSteps(r){
  var rev=r.revenue/1000, run=rev;
  var steps=[{label:'Revenue', kind:'base', color:'#1E2733', range:[0,run], runAfter:run, val:rev}];
  NB_BR_COST.forEach(function(it){ var c=(r[it.k]||0)/1000, hi=run; run=hi-c;
    steps.push({label:it.short, kind:c>=0?'down':'up', color:it.c, dc:'#6B7683', range:[Math.min(run,hi),Math.max(run,hi)], runAfter:run, val:-c}); });
  steps.push({label:'Op. income', kind:'total', color:'#2E8B57', range:[0,run], runAfter:null, val:run});
  return steps;
}
// Operating-margin change (ppt→bps) between two years, decomposed by cost line.
function nbBridgeBpsSteps(prev, cur, labA, labB){
  var rev=cur.revenue, prevRev=prev.revenue;
  var m0=prev.opinc/prevRev*100, run=m0;
  var steps=[{label:labA, kind:'base', color:'#1E2733', range:[0,run], runAfter:run, val:m0}];
  NB_BR_COST.forEach(function(it){ var contrib=((prev[it.k]||0)/prevRev - (cur[it.k]||0)/rev)*100, lo=run; run=lo+contrib;
    steps.push({label:it.short, kind:contrib>=0?'up':'down', color:contrib>=0?'#2E8B57':'#C0504D', range:[Math.min(lo,run),Math.max(lo,run)], runAfter:run, val:contrib}); });
  steps.push({label:labB, kind:'total', color:'#1E2733', range:[0,run], runAfter:null, val:run});
  return steps;
}
var BR_FMT_BPS={ axis:function(v){return v.toFixed(0)+'%';}, base:function(v){return v.toFixed(1)+'%';}, delta:function(v){var b=Math.round(v*100); return (b>=0?'+':'−')+Math.abs(b)+' bps';} };
function nbBridgeBody(){
  var yA=nvdaBBG.yearsA, yF=nvdaBBG.yearsF, qs=nvdaBBG.qtrs, laQ=(nvdaBBG.is.rev.qA?nvdaBBG.is.rev.qA.length:5)-1;
  var yBtns=yA.map(function(y,i){ return '<button type="button" data-nbbry="'+i+'"'+(i===yA.length-1?' class="active"':'')+'>FY'+String(y).slice(2)+'</button>'; }).join('');
  var qBtns=qs.map(function(q,i){ return '<button type="button" data-nbbrq="'+i+'"'+(i===laQ?' class="active"':'')+(i>laQ?' style="opacity:.6"':'')+'>'+esc(q)+'</button>'; }).join('');
  var fromBtns=yA.map(function(y,i){ return '<button type="button" data-nbbrf="'+i+'"'+(i===0?' class="active"':'')+'>FY'+String(y).slice(2)+'</button>'; }).join('');
  var toBtns=yA.map(function(y,i){ return '<button type="button" data-nbbrt="'+i+'"'+(i===yA.length-1?' class="active"':'')+'>FY'+String(y).slice(2)+'</button>'; }).join('');
  var fyBtns=yF.map(function(y,i){ return '<button type="button" data-nbbrfy="'+i+'"'+(i===0?' class="active"':'')+'>FY'+String(y).slice(2)+'E</button>'; }).join('');
  return '<div class="ov-sec"><div class="ov-sec-h">The bridge — how revenue becomes operating income</div>'+
    '<div class="mch-ctl"><span style="display:flex;gap:6px;flex-wrap:wrap">'+
      '<span class="acx-tog nbbr-mode"><button type="button" data-nbbrm="buildup" class="active">Build-up ($B)</button><button type="button" data-nbbrm="bps">Margin change (bps)</button><button type="button" data-nbbrm="fexp">Forward (expenses)</button></span>'+
    '</span><span></span></div>'+
    '<div class="nbbr-ctl-bu mch-ctl" style="margin:0 0 8px"><span></span>'+   /* build-up window (right) */
      '<span style="display:flex;gap:8px;flex-wrap:wrap">'+
        '<span class="acx-tog nbbr-gran"><button type="button" data-nbbrg="y" class="active">Annual</button><button type="button" data-nbbrg="q">Quarterly</button></span>'+
        '<span class="acx-tog nbbr-yr nbbr-sel-y">'+yBtns+'</span>'+
        '<span class="acx-tog nbbr-q nbbr-sel-q" style="display:none">'+qBtns+'</span>'+
      '</span></div>'+
    '<style>.nbbr-sl{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;color:var(--navy)}.nbbr-sl input{flex:1;max-width:180px;accent-color:'+BRAND+'}.nbbr-sl-v{width:44px;text-align:right;color:var(--brand-2);font-variant-numeric:tabular-nums}.nbbr-sl-l{width:120px}.nbbr-fx-reset{cursor:pointer;border:1px solid var(--bdr);background:#fff;border-radius:7px;padding:5px 10px;font-size:11px;font-weight:700;color:var(--navy)}</style>'+
    '<div class="nbbr-ctl-bps mch-ctl" style="display:none;margin:0 0 8px"><span></span>'+   /* margin-change from→to */
      '<span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="font-size:11px;color:var(--mu)">From</span><span class="acx-tog nbbr-from">'+fromBtns+'</span>'+
      '<span style="font-size:11px;color:var(--mu)">to</span><span class="acx-tog nbbr-to">'+toBtns+'</span></span></div>'+
    '<div class="nbbr-ctl-fexp mch-ctl" style="display:none;margin:0 0 8px"><span></span>'+   /* forward year (right) */
      '<span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="acx-tog nbbr-fy">'+fyBtns+'</span>'+
        '<button type="button" class="nbbr-fx-reset">Reset to consensus</button></span></div>'+
    '<div class="nbbr-fx-sl" style="display:none;flex-direction:column;gap:6px;margin:0 0 10px">'+
      '<div style="font-size:10.5px;color:var(--mu)">Sensitize each cost line vs consensus (0% = BBG consensus). Operating income floats with your changes:</div>'+
      NB_FX_LINES.map(function(l){ return '<div class="nbbr-sl"><span class="nbbr-sl-l">'+l.lab+'</span><input type="range" data-nbbrx="'+l.k+'" min="-25" max="25" step="1" value="0"><span class="nbbr-sl-v" data-nbbrxv="'+l.k+'">0%</span></div>'; }).join('')+
    '</div>'+
    '<div style="height:340px"><canvas id="nbBrCanvas"></canvas></div>'+
    '<div id="nbBrCanvas-tbl" style="margin-top:8px"></div>'+
    '<div class="ov-fynote" style="margin-top:8px">Revenue, cost of revenue (= revenue − gross profit), R&amp;D, SG&amp;A and operating income are the Bloomberg as-reported income statement (nvda-bbg). “Other opex” is the residual that reconciles revenue − Σcost to the reported/consensus operating income. <b>Margin change</b> decomposes the operating-margin move between two years by cost line (in bps); <b>Forward</b> takes a Bloomberg consensus year and lets you sensitize each cost line — operating income floats with your changes.</div></div>';
}
function nbBridgeSync(pane){
  var mb=pane.querySelector('.nbbr-mode .active'), mode=mb?mb.getAttribute('data-nbbrm'):'buildup';
  var bu=pane.querySelector('.nbbr-ctl-bu'), bp=pane.querySelector('.nbbr-ctl-bps'), fe=pane.querySelector('.nbbr-ctl-fexp'), fx=pane.querySelector('.nbbr-fx-sl');
  if(bu) bu.style.display=mode==='buildup'?'flex':'none';
  if(bp) bp.style.display=mode==='bps'?'flex':'none';
  if(fe) fe.style.display=mode==='fexp'?'flex':'none';
  if(fx) fx.style.display=mode==='fexp'?'flex':'none';
  var g=pane.querySelector('.nbbr-gran .active'), q=!!(g&&g.getAttribute('data-nbbrg')==='q');
  var sy=pane.querySelector('.nbbr-sel-y'); if(sy) sy.style.display=q?'none':'';
  pane.querySelectorAll('.nbbr-sel-q').forEach(function(el){ el.style.display=q?'':'none'; });
}
function nbBuildBridge(){
  var pane=nbPane('margins'); if(!pane) return;
  var mb=pane.querySelector('.nbbr-mode .active'), mode=mb?mb.getAttribute('data-nbbrm'):'buildup', r;
  if(mode==='bps'){   // margin change between two years, decomposed by cost line
    var fb=pane.querySelector('.nbbr-from .active'), tb=pane.querySelector('.nbbr-to .active');
    var ia=fb?+fb.getAttribute('data-nbbrf'):0, ib=tb?+tb.getAttribute('data-nbbrt'):(nvdaBBG.yearsA.length-1);
    var prev=nbBrRow('a',ia), cur=nbBrRow('a',ib);
    if(prev&&cur) nbBuildBrWaterfall('nbBrCanvas', nbBridgeBpsSteps(prev,cur,'FY'+String(nvdaBBG.yearsA[ia]).slice(2),'FY'+String(nvdaBBG.yearsA[ib]).slice(2)), BR_FMT_BPS);
    return;
  }
  if(mode==='fexp'){   // forward consensus year, sensitizable per cost line
    var fyb=pane.querySelector('.nbbr-fy .active'), fi=fyb?+fyb.getAttribute('data-nbbrfy'):0, adj={};
    pane.querySelectorAll('.nbbr-fx-sl input[data-nbbrx]').forEach(function(s){ adj[s.getAttribute('data-nbbrx')]=+s.value;
      var v=pane.querySelector('.nbbr-sl-v[data-nbbrxv="'+s.getAttribute('data-nbbrx')+'"]'); if(v) v.textContent=((+s.value)>0?'+':'')+s.value+'%'; });
    r=nbBrRow('f', fi, adj);
  } else {             // build-up — actual year or quarter
    var g=pane.querySelector('.nbbr-gran .active'), gran=g?g.getAttribute('data-nbbrg'):'y';
    if(gran==='q'){ var qb=pane.querySelector('.nbbr-q .active'); r=nbBrRow('q', qb?+qb.getAttribute('data-nbbrq'):((nvdaBBG.is.rev.qA?nvdaBBG.is.rev.qA.length:5)-1)); }
    else { var yb=pane.querySelector('.nbbr-yr .active'); r=nbBrRow('a', yb?+yb.getAttribute('data-nbbry'):(nvdaBBG.yearsA.length-1)); }
  }
  if(!r) return;
  nbBuildBrWaterfall('nbBrCanvas', nbBridgeSteps(r), BR_FMT_D);
}
function nbBridgeRebuild(){ var pane=nbPane('margins'); if(pane) nbBridgeSync(pane); nbBuildBridge(); }
// ── Operating income → net income walk ($B) ──
// OI and net income are the reported dataset; net interest & other income and income tax are
// the balancing items that reconcile OI to reported net income (no reported one-off gain in the
// closed years — the $15.9B Q1 FY2027 equity gain lands in FY2027, outside this window).
// Operating income → net income, rebuilt entirely from nvdaBBG.is (single source: actuals FY24–26
// + BBG forward FY27–29E) via the same year-indexed accessor AMZN uses, so historical, forward and
// the normalized view all tie out consistently. `plug` closes the component walk to BBG's consensus
// net — for actual years BBG's below-OI lines carry consensus noise (pretax−tax does not exactly
// equal its own net-income field), so the reconciling bar is non-trivial and is labelled as such.
function nbIsVal(k,y){ var s=nvdaBBG.is[k]; if(!s) return null; return y<=2026 ? s.a[y-2024] : s.f[y-2027]; }
function nbNetSteps(y, norm){
  var oi=nbIsVal('oi',y), nInt=nbIsVal('netInterest',y), ono=nbIsVal('otherNonOp',y), tax=nbIsVal('tax',y), pretax=nbIsVal('pretax',y), net=nbIsVal('netIncome',y);
  if(oi==null||net==null||tax==null) return null;
  function B(x){ return x==null?0:x/1000; }
  var I = nInt==null?0:-nInt;                      // net interest income (BBG stores it signed as an expense)
  var G = ono==null?0:-ono;                         // gains (losses) on investments, net — positive = gain
  var effR = (pretax&&pretax>0)?(tax/pretax):0;     // period effective tax rate — used to strip the mark's tax
  var plug = net - (oi + I + G - tax);              // reconciles the walk to BBG's consensus net
  var run=B(oi), steps=[{label:'Op. income', kind:'base', color:'#1E2733', range:[0,run], runAfter:run, val:B(oi)}];
  function step(lab,d,dc){ var lo=run; run=lo+d; steps.push({label:lab, kind:d>=0?'up':'down', color:(dc==='#B7791F'?'#B7791F':'#6B7683'), dc:dc, range:[Math.min(lo,run),Math.max(lo,run)], runAfter:run, val:d}); }
  step('Net interest income', B(I), '#6B7683');
  if(!norm) step('Gains (losses) on investments, net', B(G), '#B7791F');   // the equity-securities mark — the only item normalization removes
  var taxShown = norm ? -(tax - G*effR) : -tax;    // normalized: also remove the tax accrued on the stripped mark
  step(norm?'Income tax (ex-mark)':'Income tax', B(taxShown), '#6B7683');
  if(Math.abs(plug)>=50) step('Other & reconciling', B(plug), '#6B7683');   // consensus noise / minority interest; NVDA has negligible minority interest
  var endNet = norm ? (net - G*(1-effR)) : net;
  run=B(endNet); steps.push({label:(norm?'Net income (norm.)':'Net income'), kind:'total', color:'#2E8B57', range:[0,run], runAfter:null, val:B(endNet)});
  return steps;
}
function nbNetBridgeBody(){
  var years=[2024,2025,2026,2027,2028,2029];
  var yb=years.map(function(y){ return '<button type="button" data-nbnby="'+y+'"'+(y===2026?' class="active"':'')+'>FY'+String(y).slice(2)+(y>2026?'E':'')+'</button>'; }).join('');
  return '<div class="ov-sec"><div class="ov-sec-h">Operating income → net income — and the normalization</div>'+
    '<div class="mch-ctl">'+   /* treatment (left) · window (right) */
      '<span class="acx-tog nbnb-norm"><button type="button" data-nbnbnorm="rep" class="active">Reported</button><button type="button" data-nbnbnorm="norm">Normalized</button></span>'+
      '<span class="acx-tog nbnb-yr" style="flex-wrap:wrap">'+yb+'</span>'+
    '</div>'+
    '<div style="height:330px"><canvas id="nbNetBr"></canvas></div>'+
    '<div id="nbNetBr-tbl" style="margin-top:8px"></div>'+
    '<div class="acx-cap" id="nbNetBrCap" style="font-size:11px;color:var(--mu);margin-top:8px"></div></div>';
}
function nbBuildNetBridge(){
  var pane=nbPane('margins'); if(!pane) return;
  var yb=pane.querySelector('.nbnb-yr .active'), y=yb?+yb.getAttribute('data-nbnby'):2026;
  var nt=pane.querySelector('.nbnb-norm .active'), norm=!!(nt&&nt.getAttribute('data-nbnbnorm')==='norm');
  var steps=nbNetSteps(y, norm); if(!steps) return;
  nbBuildBrWaterfall('nbNetBr', steps, BR_FMT_D);
  var cap=pane.querySelector('#nbNetBrCap');
  if(cap){
    var oi=nbIsVal('oi',y), ono=nbIsVal('otherNonOp',y), tax=nbIsVal('tax',y), pretax=nbIsVal('pretax',y), net=nbIsVal('netIncome',y), rev=nbIsVal('rev',y);
    var G=ono==null?0:-ono, effR=(pretax&&pretax>0)?(tax/pretax):0;
    function B(x){ return x==null?0:x/1000; }
    var yl='FY'+String(y).slice(2)+(y>2026?'E':''), rm=(rev?net/rev*100:null), nmv=net-G*(1-effR), nm=(rev?nmv/rev*100:null);
    cap.innerHTML='<b>'+yl+'</b> — reported net margin <b>'+(rm==null?'—':rm.toFixed(1)+'%')+'</b>'+(rev?' ($'+B(net).toFixed(1)+'B on $'+B(rev).toFixed(0)+'B revenue)':'')+', normalized <b>'+(nm==null?'—':nm.toFixed(1)+'%')+'</b>.<br>'+
      'The <span style="color:#B7791F;font-weight:700">amber bar</span> is GAAP <i>“other income (expense), net”</i> — mostly non-cash gains and losses on NVIDIA’s marketable and non-marketable equity securities: <b>$'+B(G).toFixed(1)+'B pre-tax</b> in '+yl+'. Real under GAAP but non-cash, non-operating and lumpy — NVIDIA’s Q1 FY2027 print alone carried a <b>~$15.9B</b> one-time gain on equity securities, which consensus normalizes out of the forward annuals.<br>'+
      '<b>Normalization</b> removes the mark <b>after tax</b>: normalized net = reported − gain × (1 − effective rate), with the '+yl+' effective rate <b>'+(effR*100).toFixed(0)+'%</b> (= $'+B(G*(1-effR)).toFixed(1)+'B removed). Net interest income and income tax are recurring and stay; the <i>“Other &amp; reconciling”</i> bar closes the walk to BBG’s consensus net (its below-OI lines carry consensus noise, larger in the forward years). Every year ties out exactly to BBG’s reported net. Source: BBG consensus (as of Aug 2026) + NVIDIA filings.';
  }
}
// ── Stock-based compensation & dilution ──
// SBC total by year (FY24 $3.55B · FY25 $4.74B reported; FY26 ~$5.9B est.). By-line split
// (cost of revenue / R&D / SG&A) estimated at NVDA's disclosed shape (R&D the bulk) and sums
// to the total. Diluted shares ~24.5–24.9B, roughly flat (buybacks offsetting dilution).
var NB_SBC_LABS=['FY24','FY25','FY26'];
var NB_SBC_TOT=[3549,4737,5900];
var NB_SBC_LINES=[
  {k:'cor', lab:'Cost of revenue', c:GRAY,   d:[270,360,450]},
  {k:'rnd', lab:'R&D',             c:BRAND2, d:[2400,3150,3950]},
  {k:'sga', lab:'SG&A',            c:PURPLE, d:[879,1227,1500]}
];
var NB_SBC_SHARES=[24940,24804,24555];
function nbSbcBody(){
  return '<div class="ov-sec"><div class="ov-sec-h">Stock-based compensation &amp; dilution</div>'+
    '<div class="mch-ctl">'+
      '<span class="acx-tog nbsbcv-tog"><button type="button" data-nbsbcv="dilution" class="active">Dilution</button><button type="button" data-nbsbcv="line">SBC by line</button></span>'+
      '<span class="acx-tog nbsbcu-tog"><button type="button" data-nbsbcu="usd" class="active">$B</button><button type="button" data-nbsbcu="pct">%</button></span>'+
    '</div>'+
    '<div class="ave-leg" data-nbsbcleg="1" style="margin:2px 0 8px"></div>'+
    '<div style="height:320px"><canvas id="nbSbcMain"></canvas></div>'+
    '<div class="ov-fynote" style="margin-top:8px">SBC total FY2024 $3.55B and FY2025 $4.74B are reported; FY2026 (~$5.9B) and the by-line split are Summit estimates on NVIDIA\'s disclosed shape (R&amp;D the bulk). NVIDIA began including SBC in its non-GAAP results from Q1 FY2027. Diluted shares are roughly flat as buybacks offset grant dilution.</div></div>';
}
function nbBuildSbc(){
  var pane=nbPane('margins'); if(!pane) return;
  var uw=pane.querySelector('.nbsbcu-tog .active'), pct=!!(uw&&uw.getAttribute('data-nbsbcu')==='pct');
  var vw=pane.querySelector('.nbsbcv-tog .active'), view=vw?vw.getAttribute('data-nbsbcv'):'dilution';
  var cv=nbChartReady('nbSbcMain'); if(!cv) return; nbDestroy('nbSbcMain');
  var labels=NB_SBC_LABS.slice(), legEl=pane.querySelector('[data-nbsbcleg]');
  var revA=[60922,130497,215938];   // FY24-FY26 revenue for the % view
  var SBC_BAR='rgba(30,39,51,0.42)';
  if(view==='dilution'){
    var bars=NB_SBC_TOT.map(function(v,i){ return pct?Math.round(v/revA[i]*1000)/10:Math.round(v/100)/10; });
    nbCharts['nbSbcMain']=new Chart(cv.getContext('2d'),{ data:{ labels:labels, datasets:[
      { type:'bar', label:'SBC '+(pct?'(% of rev)':'($B)'), data:bars, backgroundColor:SBC_BAR, borderColor:'#fff', borderWidth:1, maxBarThickness:46, yAxisID:'y', order:3 },
      { type:'line', label:'Diluted shares', data:NB_SBC_SHARES.slice(), borderColor:NB_SUMMIT, backgroundColor:NB_SUMMIT, borderWidth:2.6, pointRadius:2.6, tension:0.15, yAxisID:'y1', order:1 } ]},
      options:{ responsive:true, maintainAspectRatio:false, interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{ display:false }, tooltip:{ callbacks:{ label:function(c){ return c.dataset.yAxisID==='y1'? c.dataset.label+': '+c.parsed.y.toLocaleString()+'M' : c.dataset.label+': '+(pct?c.parsed.y+'%':'$'+c.parsed.y.toFixed(1)+'B'); } } } },
        scales:{ x:{ grid:{ display:false } },
          y:{ position:'left', title:{ display:true, text:pct?'SBC (% of rev)':'SBC ($B)', font:{ size:11 } }, grid:{ color:'rgba(0,0,0,0.05)' }, beginAtZero:true, ticks:{ callback:function(v){ return pct?v+'%':'$'+v+'B'; } } },
          y1:{ position:'right', title:{ display:true, text:'Diluted shares (M)', font:{ size:11 } }, grid:{ display:false }, suggestedMin:24000, suggestedMax:25200, ticks:{ callback:function(v){ return v.toLocaleString(); } } } } } });
    if(legEl) legEl.innerHTML=[['SBC '+(pct?'(% of rev)':'($B)'),SBC_BAR],['Diluted shares',NB_SUMMIT]].map(function(p){ return '<span style="display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:var(--mu);margin-right:14px"><span style="width:13px;height:13px;border-radius:3px;background:'+p[1]+'"></span>'+p[0]+'</span>'; }).join('')+'<span style="font-size:11px;color:var(--mu)">SBC is tiny vs NVIDIA\'s revenue (~2.7% of sales) and shrinking as a share; shares held ~flat by buybacks</span>';
  } else {
    if(legEl) legEl.innerHTML='';
    var tot=NB_SBC_TOT;
    var ds=NB_SBC_LINES.map(function(l){ var vals=labels.map(function(_,i){ return pct?(tot[i]?Math.round(l.d[i]/tot[i]*1000)/10:null):Math.round(l.d[i]/100)/10; });
      return { label:l.lab, data:vals, backgroundColor:l.c, borderColor:'#fff', borderWidth:1, maxBarThickness:44, stack:'s' }; });
    nbCharts['nbSbcMain']=new Chart(cv.getContext('2d'),{ type:'bar', data:{ labels:labels, datasets:ds },
      options:{ responsive:true, maintainAspectRatio:false, interaction:{ mode:'index', intersect:false },
        plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{ size:10 } } }, tooltip:{ callbacks:{ label:function(c){ return c.dataset.label+': '+(c.parsed.y==null?'—':(pct?c.parsed.y+'% of total SBC':'$'+c.parsed.y.toFixed(1)+'B')); }, footer:function(it){ return pct?'':'Total SBC: $'+it.reduce(function(a,x){ return a+(x.parsed.y||0); },0).toFixed(1)+'B'; } } } },
        scales:{ x:{ stacked:true, grid:{ display:false } }, y:{ stacked:true, max:pct?100:undefined, grid:{ color:'rgba(0,0,0,0.05)' }, ticks:{ callback:function(v){ return pct?v+'%':'$'+v+'B'; } } } } } });
  }
  nbZoom('nbSbcMain');
  if(pane && !pane._nbsbcmWired){ pane._nbsbcmWired=true;
    pane.querySelectorAll('.nbsbcv-tog button, .nbsbcu-tog button').forEach(function(b){ b.onclick=function(){ b.parentNode.querySelectorAll('button').forEach(function(x){ x.classList.toggle('active',x===b); }); nbBuildSbc(); }; }); }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// EXPENSE DEEP-DIVES (amzn.js EW_* pattern) — Cost of revenue · R&D · SG&A
// ═══════════════════════════════════════════════════════════════════════════════════════════
var NB_EW_CSS='<style>'+
  '.ew-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin:2px 0 16px}'+
  '.ew-tile{border:1px solid var(--bdr);border-top:3px solid var(--brand-2);border-radius:10px;padding:10px 12px;background:var(--card,#fff)}'+
  '.ew-tv{font-size:19px;font-weight:800;color:var(--navy);font-variant-numeric:tabular-nums;letter-spacing:-.02em}.ew-tl{font-size:10px;color:var(--mu);font-weight:600;margin-top:3px;line-height:1.35}'+
  '.ew-h{font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--brand-2);margin:18px 0 9px;display:flex;align-items:center;gap:8px}.ew-h::after{content:"";flex:1;height:1px;background:var(--bdr)}'+
  '.ew-two{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media(max-width:560px){.ew-two{grid-template-columns:1fr}}'+
  '.ew-box{border:1px solid var(--bdr);border-radius:10px;padding:12px 14px;background:var(--card,#fff)}'+
  '.ew-box-h{font-size:13px;font-weight:800;color:var(--navy);display:flex;align-items:center;gap:8px;margin-bottom:5px}.ew-box-i{font-size:18px}'+
  '.ew-box-t{font-size:11.5px;color:var(--navy);line-height:1.5}'+
  '.ew-note{font-size:12px;color:var(--navy);background:rgba(20,110,180,.06);border-radius:8px;padding:9px 12px;margin-top:9px;line-height:1.5}'+
  '.ew-spark{display:flex;align-items:flex-end;gap:5px;height:96px;margin:4px 0}'+
  '.ew-sb{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:3px}'+
  '.ew-sb-v{font-size:9.5px;font-weight:800;color:var(--navy)}.ew-sb-bar{width:100%;border-radius:4px 4px 0 0;background:#B7CBE0}.ew-sb.on .ew-sb-bar{background:var(--brand-2)}.ew-sb-l{font-size:8.5px;color:var(--mu)}'+
  '.ew-flow{display:flex;align-items:stretch;flex-wrap:wrap;margin:2px 0}'+
  '.ew-fn{flex:1;min-width:110px;border:1px solid var(--bdr);border-radius:9px;padding:9px 11px;background:var(--card,#fff);text-align:center}'+
  '.ew-fn-v{font-size:14px;font-weight:800;color:var(--navy)}.ew-fn-l{font-size:9.5px;color:var(--mu);font-weight:600;margin-top:2px}'+
  '.ew-far{display:flex;align-items:center;justify-content:center;color:var(--brand-2);font-size:18px;font-weight:800;padding:0 6px}'+
  '.ew-q{border-left:3px solid var(--brand);background:rgba(0,0,0,.025);border-radius:0 8px 8px 0;padding:9px 13px;margin:8px 0;font-size:12px;line-height:1.55;color:var(--navy)}'+
  '.ew-q .ew-att{display:block;margin-top:4px;font-size:10.5px;font-weight:700;color:var(--mu)}'+
  '.ew-foot{font-size:10.5px;color:var(--mu);line-height:1.5;margin-top:10px;border-top:1px solid var(--bdr);padding-top:8px}'+
  '.ew-tls{position:relative;margin:8px 0 2px;padding-left:20px}'+'.ew-tls::before{content:"";position:absolute;left:5px;top:5px;bottom:5px;width:2px;background:var(--bdr)}'+'.ew-tli{position:relative;margin-bottom:13px}.ew-tli:last-child{margin-bottom:2px}'+'.ew-tli::before{content:"";position:absolute;left:-18px;top:3px;width:9px;height:9px;border-radius:50%;background:var(--brand-2);border:2px solid var(--card,#fff);box-shadow:0 0 0 1px var(--bdr)}'+'.ew-tlq{font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--brand-2)}'+'.ew-tlt{font-size:12px;color:var(--navy);line-height:1.5;margin-top:2px}'+'.ew-tlw{font-size:10px;font-weight:700;color:var(--mu);margin-top:3px}'+
  '.ew-calls{margin-top:14px}.ew-callsum{font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--brand-2);cursor:pointer;list-style:none;display:flex;align-items:center;gap:8px;padding:5px 0}'+
  '.ew-callsum::-webkit-details-marker{display:none}.ew-callsum::before{content:"▸";font-size:11px;transition:transform .15s}.ew-calls[open] .ew-callsum::before{content:"▾"}.ew-callsum::after{content:"";flex:1;height:1px;background:var(--bdr)}'+
'</style>';
var EW_LABS=["’19","’20","’21","’22","’23","’24","’25","’26"];   // NVDA fiscal-year ends (FY19..FY26)
function ewSpark(vals,onIdx){ var mx=Math.max.apply(null,vals.map(Math.abs));
  return '<div class="ew-spark">'+vals.map(function(v,i){ return '<div class="ew-sb'+(i===onIdx?' on':'')+'"><div class="ew-sb-v">'+v+'%</div><div class="ew-sb-bar" style="height:'+Math.max(2,Math.round(Math.abs(v)/mx*72))+'px"></div><div class="ew-sb-l">'+EW_LABS[i]+'</div></div>'; }).join('')+'</div>';
}
function ewBoxes(arr){ return '<div class="ew-two"'+(arr.length<2?' style="grid-template-columns:1fr"':'')+'>'+arr.map(function(b){ return '<div class="ew-box"><div class="ew-box-h"><span class="ew-box-i">'+b[0]+'</span>'+b[1]+'</div><div class="ew-box-t">'+b[2]+'</div></div>'; }).join('')+'</div>'; }
function ewCallsBlock(calls){ if(!calls||!calls.length) return '';
  return '<details class="ew-calls" open><summary class="ew-callsum">What management has said</summary>'+ewCallTimeline(calls)+'</details>';
}
function ewQord(q){ var m=/Q(\d)\s*FY?\s*(\d{4})/.exec(q||''); if(m) return (+m[2])*10+(+m[1]); var y=/(\d{4})/.exec(q||''); return y?(+y[1])*10:0; }
function ewCallTimeline(calls){ if(!calls||!calls.length) return '';
  var sorted=calls.slice().sort(function(a,b){ return ewQord(a.q)-ewQord(b.q); });
  return '<div class="ew-tls">'+sorted.map(function(c){ return '<div class="ew-tli"><div class="ew-tlq">'+esc(c.q)+'</div><div class="ew-tlt">'+c.txt+'</div>'+(c.who&&c.who!=='—'?'<div class="ew-tlw">— '+esc(c.who)+'</div>':'')+'</div>'; }).join('')+'</div>';
}
// Verbatim management commentary per expense line — quotes taken ONLY from docs/calls/NVDA.md.
var EW_CALLS={
  costOfRev:[
    {q:'Q1 FY2026', who:'Colette Kress, CFO', txt:'“GAAP gross margins and non-GAAP gross margins were 60.5% and 61%, respectively. Excluding the $4.5 billion charge, Q1 non-GAAP gross margins would have been 71.3%, slightly above our outlook.”'},
    {q:'Q2 FY2026', who:'Colette Kress, CFO', txt:'“GAAP gross margin was 72.4% and non-GAAP gross margin was 72.7%. These figures include a $180 million or 40 basis point benefit from releasing previously reserved H20 inventory.”'},
    {q:'Q3 FY2026', who:'Colette Kress, CFO', txt:'“GAAP gross margins were 73.4%, and non-GAAP gross margins were 73.6%… Gross margins increased sequentially due to our Data Center mix, improved cycle time, and cost structure.”'},
    {q:'Q4 FY2026', who:'Jensen Huang, CEO', txt:'“The single most important lever of our gross margins is actually delivering generational leaps to our customers… If we can deliver performance per dollar dramatically more than the price of our systems, then we can continue to sustain our gross margins.”'},
    {q:'Q1 FY2027', who:'Colette Kress, CFO', txt:'“GAAP gross margin 74.9%, non-GAAP 75% (largely flat sequentially, Blackwell mix).”'}
  ],
  rnd:[
    {q:'Q1 FY2026', who:'Colette Kress, CFO', txt:'“Sequentially, GAAP operating expenses were up 7%, and non-GAAP operating expenses were up 6%, reflecting higher compensation and employee growth.”'},
    {q:'Q3 FY2026', who:'Colette Kress, CFO', txt:'“GAAP Operating Expenses were up 8% sequentially and up 11% on a non-GAAP basis.”'},
    {q:'Q4 FY2026', who:'Colette Kress, CFO', txt:'“GAAP operating expenses were up 16% sequentially and up 21% on a non-GAAP basis, related to new product introductions and compute and infrastructure costs.”'},
    {q:'Q1 FY2027', who:'Colette Kress, CFO', txt:'“GAAP and non-GAAP opex +12% sequentially (compensation + compute/infrastructure).” Full-year opex growth guided to the upper-40s% YoY.'},
    {q:'Q1 FY2027', who:'Jensen Huang, CEO', txt:'On the new Vera CPU: “$200 billion TAM… a market we have never addressed before” — the annual Hopper → Blackwell → Vera Rubin cadence is what the R&D spend funds.'}
  ],
  sga:[
    {q:'Q4 FY2026', who:'Colette Kress, CFO', txt:'“Starting this quarter, we will be including stock-based compensation expense in our non-GAAP results.”'},
    {q:'Q1 FY2026', who:'Colette Kress, CFO', txt:'Operating-expense growth reflected “higher compensation and employee growth” — the compensation line that dominates SG&A alongside R&D.'},
    {q:'Q4 FY2026', who:'Colette Kress, CFO', txt:'“Non-GAAP effective tax rate for the fourth quarter was 15.4%… primarily due to the impact of a one-time tax benefit.”'}
  ]
};
// Line-item descriptions. NOTE: the exact FY2026 10-K text is not in the repo and web search is
// disallowed for this build, so these describe NVIDIA's disclosed composition of each line and are
// attributed to the 10-K — they are a LABELED PLACEHOLDER to be swapped for the verbatim quote.
var EW_SRC='— NVIDIA FY2026 Form 10-K · Notes &amp; MD&amp;A (description; swap for verbatim 10-K text)';
var EW_DEF={
  costOfRev:'Cost of revenue primarily consists of the cost of manufacturing NVIDIA\'s products — wafer costs paid to its foundry (TSMC), advanced CoWoS packaging, high-bandwidth memory, and assembly, testing and packaging by outsourced partners — together with inventory provisions, warranty, and amortization of acquired intangibles related to products sold.',
  rnd:'Research and development expenses consist primarily of salaries, benefits and stock-based compensation for engineering and research personnel; the cost of development systems, software licenses and design/verification tools; prototyping, tape-out and mask costs for new chips; and the compute and infrastructure used to design and validate NVIDIA\'s GPUs, CPUs, networking and platform software.',
  sga:'Sales, general and administrative expenses consist primarily of salaries, benefits and stock-based compensation for sales, marketing, and corporate personnel; marketing and promotional activities; and professional fees, facilities and other corporate costs.'
};
var EW_LINES=[
  {k:'costOfRev', name:'Cost of revenue',
    kpis:[['$61.9B','of revenue: 28.7%'],['71.3%','gross margin (FY2026)'],['~$0.5B','stock-based comp inside'],['+H20 charge','~$4.5B one-off, Q1 FY2026']],
    comp:[['🏭','Foundry &amp; packaging','Wafers from <b>TSMC</b>, <b>CoWoS</b> advanced packaging, and outsourced assembly / test — the physical build of a fabless product.'],['🧠','HBM memory','<b>High-bandwidth memory</b> (SK hynix / Micron / Samsung) — the scarcest, and one of the most expensive, inputs in a Blackwell system.']],
    compNote:'NVIDIA is fabless, so this line is almost entirely bought-in silicon, memory and packaging — which is why gross margin swings with product mix and supply, not with factory utilisation.',
    traj:[38.8,38.0,37.7,35.1,43.1,27.3,25.0,28.9],
    why:'<b>The gross-margin line.</b> Data-Center mix pushed gross margin to the mid-70s; the FY2023 crypto-hangover (43% cost ratio) and the ~$4.5B Q1 FY2026 H20/China inventory charge (which cut that quarter\'s margin to ~61%) are the two visible shocks.',
    drivers:[['🔀','Data-Center mix','Data Center at ~90% of revenue carries a richer margin than gaming/OEM — the single biggest reason the cost ratio fell.'],['⚙️','Cycle-time &amp; cost structure','Management cites “improved cycle time and cost structure” as Blackwell ramped past its early, lower-margin phase.'],['🇨🇳','China / H20 charges','Export controls forced a ~$4.5B inventory + purchase-obligation write-down in Q1 FY2026 — a one-off, since partly reversed ($180M released in Q2).'],['🚀','Generational leaps','Jensen: sustaining margin depends on delivering far more performance-per-dollar than the price step-up each generation.']]},
  {k:'rnd', name:'Research &amp; development',
    kpis:[['~$13.4B','of revenue: ~6.2%*'],['annual cadence','Hopper → Blackwell → Vera Rubin'],['~$3.9B','stock-based comp inside*'],['upper-40s%','FY2027 opex growth (guide)']],
    comp:[['🧑‍💻','Engineering payroll','The largest chip-design workforce in the industry — GPU, Grace/Vera CPU, networking (NVLink/Spectrum) and the CUDA software stack.'],['🖥️','Compute &amp; NPI','Development systems, EDA tools, prototyping/tape-out and mask costs, plus the compute and infrastructure to design and validate each new platform.']],
    compNote:'R&amp;D is the bulk of operating expense (~80%). It funds the <b>annual product cadence</b> that keeps NVIDIA a generation ahead — the moat the gross margin rests on.',
    traj:[20.3,25.9,23.5,19.6,27.2,14.2,9.9,6.2],
    why:'It falls fast as a share of revenue only because revenue is compounding faster — the absolute R&amp;D dollars keep rising (opex guided up in the upper-40s% for FY2027).',
    drivers:[['🚀','Annual cadence','A new platform every year (Hopper → Blackwell → Blackwell Ultra → Vera Rubin) plus a standalone Vera CPU opening a “$200B TAM” — the spend is front-loaded ahead of the revenue.'],['🌐','Full-stack expansion','CPUs, DPUs, NVLink/Spectrum networking and the software stack widen what R&amp;D must cover beyond the GPU.'],['🧑‍💻','Compensation &amp; headcount','Management repeatedly attributes opex growth to “higher compensation and employee growth” and “new product introductions.”']]},
  {k:'sga', name:'Sales, general &amp; administrative',
    kpis:[['~$3.3B','of revenue: ~1.5%*'],['most-leveraged','line on the P&amp;L'],['~$1.5B','stock-based comp inside*'],['~15%','FY2026 effective tax rate (context)']],
    comp:[['🧑‍💼','Sales &amp; marketing','Field sales, developer relations and marketing for the platform — small relative to a business that largely sells to a handful of hyperscalers.'],['🏢','Corporate functions','Finance, legal, HR, facilities and professional fees.']],
    compNote:'The smallest functional line, and the most operating-leveraged — corporate cost grows far slower than a business compounding at 60%+.',
    traj:[6.0,8.4,6.9,6.5,9.1,4.4,2.7,1.5],
    why:'Pure operating leverage: NVIDIA reaches ~90% of its revenue through a small number of large customers, so SG&amp;A shrinks toward ~1.5% of revenue as sales scale.',
    drivers:[['📉','Fixed-cost leverage','A largely fixed corporate base against revenue that more than tripled in two years — the ratio collapses.'],['🤝','Concentrated go-to-market','Jensen: “the easiest go-to-market is the hyperscaler, because there are only five or six of them” — little acquisition spend needed for the bulk of revenue.'],['📊','SBC into non-GAAP','From Q1 FY2027 NVIDIA includes stock-based comp (a chunk of which sits in SG&amp;A) in its non-GAAP results.']]}
];
// Unit economics per functional line — real, disclosed NVDA figures only (nvdaResults / nvda-bbg
// + docs/calls/NVDA.md). Attached to EW_LINES like the management-call timelines. NVIDIA is fabless,
// so there is no per-unit factory cost — the "unit economics" are the gross-margin and operating-
// leverage ratios that actually drive the bottom line.
var NB_EW_UNIT={
  costOfRev:
    '<div class="ew-flow">'+
      '<div class="ew-fn"><div class="ew-fn-v">$215.9B</div><div class="ew-fn-l">revenue (FY26)</div></div><div class="ew-far">−</div>'+
      '<div class="ew-fn"><div class="ew-fn-v">$61.9B</div><div class="ew-fn-l">cost of revenue</div></div><div class="ew-far">=</div>'+
      '<div class="ew-fn" style="border-color:var(--brand-2)"><div class="ew-fn-v" style="color:var(--brand-2)">$154.0B</div><div class="ew-fn-l">gross profit · 71.3% GM</div></div>'+
    '</div>'+
    '<div class="ew-note">NVIDIA is fabless, so there is no factory unit cost — the economics <b>are</b> the gross margin. Revenue less bought-in silicon, HBM and packaging leaves a <b>~71% FY2026 gross margin</b>, and the most recent quarters run higher still (<b>~75%</b> in Q1 FY2027 as the Blackwell ramp matured). Sustaining that margin as system prices rise depends on delivering far more performance-per-dollar each generation — the lever Jensen calls out.</div>',
  rnd:
    '<div class="ew-flow">'+
      '<div class="ew-fn"><div class="ew-fn-v">$13.6B</div><div class="ew-fn-l">R&amp;D (FY26)</div></div><div class="ew-far">→</div>'+
      '<div class="ew-fn" style="border-color:var(--brand-2)"><div class="ew-fn-v" style="color:var(--brand-2)">~6.3%</div><div class="ew-fn-l">of revenue</div></div><div class="ew-far">→</div>'+
      '<div class="ew-fn"><div class="ew-fn-v">upper-40s%</div><div class="ew-fn-l">FY27 opex growth (guide)</div></div><div class="ew-far">→</div>'+
      '<div class="ew-fn"><div class="ew-fn-v">≈ $20B</div><div class="ew-fn-l">approaching annual R&amp;D</div></div>'+
    '</div>'+
    '<div class="ew-note">R&amp;D is ~80% of operating expense and funds the <b>annual product cadence</b> (Hopper → Blackwell → Vera Rubin). It has fallen toward ~6% of revenue only because revenue compounds faster — the absolute budget keeps climbing, with FY2027 operating expense guided up in the <b>upper-40s% YoY</b>, pushing the annual R&amp;D run-rate toward <b>~$20B</b>.</div>',
  sga:
    '<div class="ew-flow">'+
      '<div class="ew-fn"><div class="ew-fn-v">2.8%</div><div class="ew-fn-l">SG&amp;A % of rev (FY24)</div></div><div class="ew-far">→</div>'+
      '<div class="ew-fn"><div class="ew-fn-v">1.8%</div><div class="ew-fn-l">FY25</div></div><div class="ew-far">→</div>'+
      '<div class="ew-fn" style="border-color:var(--brand-2)"><div class="ew-fn-v" style="color:var(--brand-2)">1.4%</div><div class="ew-fn-l">FY26</div></div>'+
    '</div>'+
    '<div class="ew-note">Pure operating leverage. SG&amp;A dollars roughly doubled ($1.7B → $3.1B, FY24→FY26) while revenue more than tripled, so the line fell from <b>2.8% to ~1.4% of revenue</b>. NVIDIA reaches ~90% of its revenue through a handful of large customers — “the easiest go-to-market is the hyperscaler” — so corporate cost grows far slower than the top line.</div>'
};
EW_LINES.forEach(function(l){ if(EW_CALLS[l.k]) l.calls=EW_CALLS[l.k]; if(NB_EW_UNIT[l.k]) l.unit=NB_EW_UNIT[l.k]; if(EW_DEF[l.k]) l.def=EW_DEF[l.k]; });
function ewBase(c){
  var h='<div class="ew-kpis">'+c.kpis.map(function(k){ return '<div class="ew-tile"><div class="ew-tv">'+k[0]+'</div><div class="ew-tl">'+k[1]+'</div></div>'; }).join('')+'</div>';
  if(c.def){ h+='<div class="ew-h">How the 10-K describes it</div><div class="ew-q ew-def">“'+c.def+'”<span class="ew-att">'+EW_SRC+'</span></div>'; }
  h+='<div class="ew-h">What sits inside this line</div>'+ewBoxes(c.comp);
  if(c.compNote) h+='<div class="ew-note">'+c.compNote+'</div>';
  h+='<div class="ew-h">Share of revenue over time <span style="font-weight:600;text-transform:none;letter-spacing:0;color:var(--mu)">· FY19–FY26</span></div>'+ewSpark(c.traj,7);
  if(c.unit){ h+='<div class="ew-h">Unit economics</div>'+c.unit; }
  h+='<div class="ew-h">Why it matters to the bottom line</div><div class="ew-note">'+c.why+'</div>';
  if(c.drivers){ h+='<div class="ew-h">Why it has moved — the drivers</div>'+ewBoxes(c.drivers); }
  if(c.calls){ h+=ewCallsBlock(c.calls); }
  h+='<div class="ew-foot">FY2026 figures (year ended Jan 25 2026) unless noted. *R&amp;D / SG&amp;A dollar splits and their SBC are Summit estimates on the disclosed opex total (= gross profit − operating income); the total reconciles to the Results-tab dataset. Commentary is verbatim from NVIDIA earnings calls (docs/calls/NVDA.md).</div>';
  return h;
}
function expenseTabsBody(){
  var defs=[
    {k:'costOfRev',c:GRAY,  n:'Cost of revenue',tag:'$61.9B · 28.7%'},
    {k:'rnd',      c:BRAND2,n:'Research &amp; development',tag:'~$13.4B · ~6.2%'},
    {k:'sga',      c:PURPLE,n:'Sales, general &amp; administrative',tag:'~$3.3B · ~1.5%'}
  ];
  var byk={}; EW_LINES.forEach(function(l){ byk[l.k]=l; });
  var h='<style>'+
    '.exp-explorer{border:1.5px solid var(--brand);border-radius:14px;padding:14px 16px 16px;background:linear-gradient(180deg,var(--brand-soft),transparent);margin:6px 0 6px}'+
    '.exp-explorer-h{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--brand-2);margin:0 0 11px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
    '.exp-explorer-h .exp-hint{font-size:9px;font-weight:700;text-transform:none;letter-spacing:0;color:var(--mu);background:#fff;border:1px solid var(--bdr);border-radius:20px;padding:2px 9px}'+
    '.exp-tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}'+
    '.exp-tab{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--bdr);background:#fff;border-radius:20px;padding:7px 12px;cursor:pointer;font-size:12px;font-weight:800;color:var(--navy);transition:.13s}'+
    '.exp-tab:hover{border-color:var(--brand)}'+
    '.exp-tab.active{background:var(--navy);border-color:var(--navy);color:#fff}'+
    '.exp-tab.active .exp-tag{color:rgba(255,255,255,.8)}'+
    '.exp-tab .exp-dot{width:10px;height:10px;border-radius:3px;flex:none}'+
    '.exp-tab .exp-tag{font-size:10px;font-weight:800;color:var(--mu)}'+
    '.exp-panel-card{background:var(--card,#fff);border:1px solid var(--bdr);border-radius:12px;padding:15px 17px}'+
  '</style>';
  h+='<div class="exp-explorer"><div class="exp-explorer-h">Expense explorer — the three functional lines <span class="exp-hint">tap a line to switch</span></div>';
  h+='<div class="exp-tabs">'+defs.map(function(d,i){ return '<button type="button" class="exp-tab'+(i===0?' active':'')+'" data-nbexptab="'+d.k+'"><span class="exp-dot" style="background:'+d.c+'"></span>'+d.n+' <span class="exp-tag">'+d.tag+'</span></button>'; }).join('')+'</div>';
  h+=NB_EW_CSS;
  h+='<div class="exp-panels">'+defs.map(function(d,i){ return '<div class="exp-panel exp-panel-card" data-nbexppanel="'+d.k+'"'+(i>0?' hidden':'')+'>'+(byk[d.k]?ewBase(byk[d.k]):'')+'</div>'; }).join('')+'</div>';
  h+='</div>';
  return h;
}
// Wire the General pane — chart-picker + bridge/net/sbc year pills + expense tabs.
var NB_GEN_BUILD={ margins:nbBuildMargins, bridge:nbBridgeRebuild, net:nbBuildNetBridge, sbc:nbBuildSbc };
function nbBuildExpenses(){
  var pane=nbPane('margins'); if(!pane) return;
  // Rebuild whichever General chart is actually on screen (rule: never leave a revealed chart un-built).
  var gs=pane.querySelector('.gen-chart'), which=gs?gs.value:'margins';
  if(NB_GEN_BUILD[which]) NB_GEN_BUILD[which]();
  if(pane._nbExpWired) return; pane._nbExpWired=true;
  var GEN_BUILD=NB_GEN_BUILD;
  var gsel=pane.querySelector('.gen-chart');
  if(gsel){ gsel.onchange=function(){ var v=gsel.value;
    pane.querySelectorAll('.gen-sec').forEach(function(s){ s.hidden=(s.getAttribute('data-gsec')!==v); });
    if(GEN_BUILD[v]) requestAnimationFrame(GEN_BUILD[v]); }; }
  function tog(sel, after){ pane.querySelectorAll(sel+' button').forEach(function(b){ b.onclick=function(){ b.parentNode.querySelectorAll('button').forEach(function(x){ x.classList.toggle('active',x===b); }); after(); }; }); }
  // Bridge (three modes): mode + granularity re-sync the visible control rows before rebuilding.
  tog('.nbbr-mode', nbBridgeRebuild);
  tog('.nbbr-gran', nbBridgeRebuild);
  tog('.nbbr-yr', nbBuildBridge);
  tog('.nbbr-q', nbBuildBridge);
  tog('.nbbr-from', nbBuildBridge);
  tog('.nbbr-to', nbBuildBridge);
  tog('.nbbr-fy', nbBuildBridge);
  pane.querySelectorAll('.nbbr-fx-sl input[type=range]').forEach(function(s){ s.addEventListener('input', nbBuildBridge); });
  var brReset=pane.querySelector('.nbbr-fx-reset'); if(brReset) brReset.onclick=function(){ pane.querySelectorAll('.nbbr-fx-sl input[data-nbbrx]').forEach(function(s){ s.value=0; }); nbBuildBridge(); };
  nbBridgeSync(pane);
  tog('.nbnb-yr', nbBuildNetBridge);
  tog('.nbnb-norm', nbBuildNetBridge);
  var etabs=pane.querySelectorAll('.exp-tab');
  etabs.forEach(function(b){ b.onclick=function(){ var k=b.getAttribute('data-nbexptab');
    etabs.forEach(function(x){ x.classList.toggle('active',x===b); });
    pane.querySelectorAll('.exp-panel').forEach(function(p){ p.hidden=(p.getAttribute('data-nbexppanel')!==k); }); }; });
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// SEGMENTS — segment revenue mix (SAB dual-axis) + gross-margin narrative (no segment OI)
// ═══════════════════════════════════════════════════════════════════════════════════════════
// Old operating segments, reported revenue $B by fiscal year (from docs/calls/NVDA.md + 10-K):
//   Data Center · Gaming · Pro Viz · Automotive · OEM & Other. NVIDIA does NOT report segment
//   operating income — the profit story is company-wide gross margin (Data-Center-driven).
var NB_SEG=[
  {k:'dc',   lab:'Data Center',   c:BRAND,  d:[47.5,115.2,193.7]},
  {k:'gm',   lab:'Gaming',        c:BRAND2, d:[10.4,11.3,16.1]},
  {k:'pv',   lab:'Pro Viz',       c:SQUID,  d:[1.55,1.88,3.17]},
  {k:'au',   lab:'Automotive',    c:GREEN,  d:[1.09,1.69,2.35]},
  {k:'oem',  lab:'OEM & Other',   c:GRAY,   d:[0.31,0.39,0.58]}
];
var NB_SEG_LABS=['FY24','FY25','FY26'];
// New market-platform sub-markets, sourced live from nvdaResults (recast history FY25+, forward
// consensus, and quarterly). Hyperscale + ACIE + Edge Computing sum to total revenue.
var NB_SEG_NEWSET=[
  {k:'hyper',lab:'Hyperscale',     c:BRAND,  key:'hyper_rev'},
  {k:'acie', lab:'ACIE',           c:GREEN,  key:'acie_rev'},
  {k:'edge', lab:'Edge Computing', c:BRAND2, key:'edge_rev'}
];
// New reporting framework (introduced Q1 FY2027) — FY2026 market-platform split (Summit est.).
var NB_SEG_NEW=[
  {name:'Hyperscale', dot:BRAND, rev:'$105.6B', d:'The public clouds and largest consumer-internet firms (Microsoft, Amazon, Google, Meta) buying GB300 NVL72 racks and Grace Blackwell superchips at scale. About half of Data Center.'},
  {name:'ACIE — AI Clouds, Industrial & Enterprise', dot:GREEN, rev:'$88.1B', d:'AI factories outside the mega-clouds — enterprises, industries and sovereign-AI buyers. Same Data-Center stack, different customers.'},
  {name:'Edge Computing', dot:BRAND2, rev:'$22.2B', d:'On-device and physical AI: GeForce/RTX gaming, Omniverse/pro-viz, DRIVE automotive and Jetson/Isaac robotics — the old Gaming/ProViz/Auto/OEM lines folded into one.'}
];
function nbSegBody(){
  // segoi-style common-size mix chart (ported from AMZN aSegOiBody). NVDA has NO segment operating
  // income (kept omitted); this is a revenue-mix picker: Segments {Market platform / Reported} ·
  // Show {$B / Share / Growth} · Layout {Stacked / Side-by-side} · Period {Annual / Quarterly}.
  var h=nbStdScaffold({ id:'nbseg', title:'Revenue mix by segment — common size', height:360,
    modes:[
      {cls:'set',   label:'Segments',opts:[{v:'new',label:'Market platform',on:true},{v:'old',label:'Reported'}]},
      {cls:'show',  label:'Show',    opts:[{v:'amt',label:'$B',on:true},{v:'share',label:'Share'},{v:'growth',label:'Growth'}]},
      {cls:'layout',label:'Layout',  opts:[{v:'stack',label:'Stacked',on:true},{v:'side',label:'Side by side'}]},
      {cls:'gran',  label:'Period',  opts:[{v:'y',label:'Annual',on:true},{v:'q',label:'Quarterly'}]}
    ],
    presets:[['all','All'],['rep','Reported'],['fwd','Forward']] });
  h+='<div class="ov-callout" style="margin-top:6px"><b>NVIDIA does not report operating income by segment</b>, so this is a <b>revenue-mix</b> chart — no segment-OI series is fabricated. The profitability story is <b>company-wide gross margin</b> (~71–75%), driven by the Data-Center mix — see the General ▸ Profitability &amp; margins chart. <b>Market platform</b> is the new cut (Hyperscale · ACIE · Edge Computing), with recast history from FY2025 plus Bloomberg consensus forward and a quarterly view; <b>Reported</b> is the audited operating-segment cut (annual FY24–FY26).</div>';
  h+='<div class="ov-sec" style="margin-top:14px"><div class="ov-sec-h">The new framework (from Q1 FY2027) — FY2026 by market platform</div>'+
    '<div class="ovlr-mseg">'+NB_SEG_NEW.map(function(s){
      return '<div class="ovlr-mseg-card"><div class="ovlr-mseg-h"><span class="ovlr-mseg-dot" style="background:'+s.dot+'"></span><span class="ovlr-mseg-nm">'+esc(s.name)+'</span><span class="ovlr-mseg-rev">'+esc(s.rev)+'</span></div><div class="ovlr-mseg-d">'+s.d+'</div></div>';
    }).join('')+'</div>'+
    '<div class="ov-fynote">In Q1 FY2027 NVIDIA re-cut the business into two market platforms — <b>Data Center</b> (sub-markets Hyperscale and ACIE) and <b>Edge Computing</b> — and posted nine quarters of recast history. FY2026 market-platform figures are Summit estimates; the reported operating segments are the audited cut. Source: docs/calls/NVDA.md, FY2026 10-K.</div></div>';
  return h;
}
function nbBuildSegments(){
  nbStdRender('nbseg', function(st){
    var set=st.modes.set||'new', show=st.modes.show||'amt', layout=st.modes.layout||'stack', gran=st.modes.gran||'y';
    if(set==='old') gran='y';   // reported operating segments are annual-only (NB_SEG)
    var labels, la, raw;
    if(set==='old'){
      labels=NB_SEG_LABS.slice(); la=labels.length-1;   // FY24..FY26 all actual
      raw=NB_SEG.map(function(s){ return { s:s, v:s.d.slice() }; });   // already $B
    } else if(gran==='q'){
      var Q=nvdaResults.views.q.metrics; labels=Q.hyper_rev.periods.slice();
      la=(Q.hyper_rev.act.filter(function(x){ return x!=null; }).length)-1;   // last reported quarter
      raw=NB_SEG_NEWSET.map(function(s){ var m=Q[s.key];
        return { s:s, v:labels.map(function(_,i){ var val=(m.act[i]!=null)?m.act[i]:m.cons[i]; return val==null?null:val/1000; }) }; });
    } else {
      var Y=nvdaResults.views.y.metrics, allP=Y.hyper_rev.periods, idx=[3,4,5,6,7];   // FY25,FY26,FY27E..FY29E (Hyper/ACIE recast begins FY25)
      labels=idx.map(function(i){ return 'FY'+String(allP[i]).slice(2)+(i>=5?'E':''); });
      la=1;   // FY26 last actual
      raw=NB_SEG_NEWSET.map(function(s){ var m=Y[s.key];
        return { s:s, v:idx.map(function(i){ var val=(m.act[i]!=null)?m.act[i]:m.cons[i]; return val==null?null:val/1000; }) }; });
    }
    var totals=labels.map(function(_,i){ return raw.reduce(function(a,r){ return a+((r.v[i]!=null)?r.v[i]:0); },0); });
    var series=raw.map(function(r){ return { k:r.s.k, label:r.s.lab, color:r.s.c, type:'bar',
      data:labels.map(function(_,i){ var v=r.v[i]; if(v==null) return null;
        if(show==='share') return totals[i]?Math.round(v/totals[i]*1000)/10:null;
        if(show==='growth'){ var pv=r.v[i-1]; if(pv==null||!pv) return null; return Math.round((v-pv)/Math.abs(pv)*1000)/10; }
        return Math.round(v*10)/10; }) }; });
    var stacked=show==='share'||(show==='amt'&&layout==='stack');
    var yFmt=show==='amt'?function(x){ return '$'+(x==null?'':x.toFixed(1))+'B'; }:function(x){ return x+'%'; };
    var hide=[]; if(show!=='amt') hide.push('layout'); if(set==='old') hide.push('gran');
    return { labels:labels, lastAct:la, yFmt:yFmt, type:'bar', stacked:stacked, paired:false,
      yMax:show==='share'?100:undefined, series:series, hideModes:hide };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// SUPPLY CHAIN — SPLC map (amzn.js A_SPLC_* pattern), NVDA-real suppliers & customers
// ═══════════════════════════════════════════════════════════════════════════════════════════
function ddStat(items){
  return '<div class="gdd-kpis">'+items.map(function(s){ return '<div class="gdd-kpi"><div class="gdd-kpi-v">'+s[0]+'</div><div class="gdd-kpi-k">'+esc(s[1])+'</div></div>'; }).join('')+'</div>';
}
// Upstream — who NVIDIA depends ON. rel = relative criticality (bar). Fabless: the deepest
// dependencies are TSMC (foundry) and its CoWoS advanced packaging — the true bottleneck.
var NB_SPLC_INFRA=[
  { n:'TSMC — foundry + CoWoS', rel:'The bottleneck', dep:'Sole leading-edge manufacturer', bar:100, col:BRAND,
    d:'<p>Every NVIDIA GPU is fabricated by <b>TSMC</b> on a custom leading-edge node, then packaged with <b>CoWoS</b> (chip-on-wafer-on-substrate) — the advanced packaging that fuses the GPU dies to their HBM stacks. CoWoS capacity, not the wafers themselves, has been the single tightest constraint on how many Blackwell/Rubin systems NVIDIA can ship. There is no qualified second source at the leading edge, which makes this the deepest dependency on the map.</p>' },
  { n:'SK hynix — HBM', rel:'Scarcest input', dep:'Lead HBM3E supplier', bar:82, col:PURPLE,
    d:'<p><b>High-bandwidth memory</b> is the scarcest and one of the costliest inputs in an AI accelerator. SK hynix is the lead HBM3E supplier to NVIDIA, with Micron and Samsung qualifying in as second and third sources. HBM supply is sold out well ahead, and its cost is a major swing factor in gross margin (management flagged “skyrocketing” memory costs).</p>' },
  { n:'Foxconn · Wistron · Quanta — system assembly', rel:'Rack integration', dep:'GB200/GB300 NVL72 builders', bar:64, col:GRAY,
    d:'<p>The GB200/GB300 <b>NVL72</b> racks are integrated by Taiwanese ODMs — <b>Hon Hai (Foxconn)</b>, <b>Wistron</b> and <b>Quanta</b> — from ~1.5M components each. This is where NVIDIA increasingly sells the whole machine, not the chip, so assembly capacity gates rack-scale shipments.</p>' },
  { n:'Micron · Samsung — HBM #2 / #3', rel:'Second sources', dep:'HBM diversification', bar:48, col:BRAND2,
    d:'<p><b>Micron</b> and <b>Samsung</b> are the qualifying second and third HBM sources. Adding them is NVIDIA\'s hedge against a single-supplier memory chokepoint — critical as each generation needs more HBM per GPU.</p>' },
  { n:'Amkor — OSAT / packaging', rel:'Test & packaging', dep:'US onshoring (Arizona)', bar:34, col:AMBER,
    d:'<p><b>Amkor</b> and other OSAT partners handle outsourced assembly, test and packaging — including the Arizona facility that pairs with TSMC\'s US fab as the first Blackwell wafers are produced on US soil. Part of the supply-chain onshoring that reduces (but does not remove) Taiwan concentration.</p>' }
];
// Downstream — customer concentration. NVIDIA sells ~90% Data Center into a handful of buyers.
// Direct customers are often ODMs/OEMs; the end-demand concentration sits with the hyperscalers.
// Shares are Summit estimates of end-customer revenue exposure (directional; NVDA discloses only
// that a small number of direct customers each exceed 10% of revenue).
var NB_SPLC_CUST=[
  ['Microsoft','~16%','Azure + OpenAI','Hyperscaler'],
  ['Meta','~13%','AI training / inference','Hyperscaler'],
  ['Amazon (AWS)','~11%','Cloud GPU capacity','Hyperscaler'],
  ['Alphabet (Google)','~7%','Cloud + DeepMind','Hyperscaler'],
  ['Oracle · CoreWeave','~9%','Neoclouds / AI clouds','AI cloud'],
  ['xAI · Tesla','~5%','Frontier training','AI native'],
  ['Sovereign & enterprise','~15%','AI factories, ~40 countries','ACIE']
];
// Who depends ON NVIDIA (their revenue exposure to NVIDIA / its ecosystem). Directional.
var NB_SPLC_DEP=[
  ['CoreWeave', 60, 'neocloud — NVIDIA GPU fleet'],
  ['SK hynix', 35, 'HBM into NVIDIA accelerators'],
  ['Vertiv', 25, 'power & cooling for AI racks'],
  ['TSMC', 20, 'NVIDIA share of foundry revenue'],
  ['Wistron', 20, 'NVL72 rack integration'],
  ['Amkor', 15, 'OSAT for NVIDIA packaging']
];
// Geography — supply-chain criticality by country (% share). Taiwan dominates (fab + packaging
// + rack assembly); South Korea (HBM) and the US (onshoring, some packaging) follow.
var NB_SPLC_GEO={ labels:['Taiwan','South Korea','United States','Japan','China','Malaysia','Vietnam'],
  sup:[46,18,16,8,6,4,2] };
function nbSplcBody(){
  var h='';
  h+=ddStat([['~90%','revenue into Data Center'],['Taiwan','fab · packaging · assembly hub'],['CoWoS','the true capacity bottleneck'],['~55%','est. from top-4 hyperscalers'],['$145B','Q1 FY2027 supply + purchase commitments']]);
  h+='<div class="ov-diagram-cap" style="margin:16px 0 6px"><b>Upstream · what NVIDIA depends on</b> (fabless — the chain it does not own; bar = relative criticality; tap a card for the read)</div>';
  h+='<div class="ce-watch">'+NB_SPLC_INFRA.map(function(s,i){
    return '<div class="ce-w nb-splc-card" data-nbsplc="'+i+'" style="border-left:4px solid '+s.col+';cursor:pointer">'+
      '<div class="ce-w-top"><div class="ce-w-metric">'+esc(s.n)+'</div><span class="ce-w-chip tag">'+esc(s.rel)+'</span><span class="ce-w-chip" style="margin-left:auto;color:'+BRAND+'">the read ›</span></div>'+
      '<div class="ov-mbar" style="margin:4px 0 6px"><div class="ov-mbar-track"><div class="ov-mbar-fill" style="width:'+Math.max(s.bar,2)+'%;background:'+s.col+'"></div></div></div>'+
      '<div class="ce-w-chips"><span class="ce-w-chip red"><b>Role:</b> '+esc(s.dep)+'</span></div>'+
      '<div class="nb-splc-read" hidden style="font-size:11.5px;color:var(--navy);line-height:1.5;margin-top:6px">'+s.d+'</div>'+
    '</div>';
  }).join('')+'</div>';
  h+='<div class="ov-diagram-cap" style="margin:18px 0 6px"><b>Downstream · customer concentration</b> — NVIDIA sells ~90% Data Center into a handful of buyers (end-demand exposure, Summit est.)</div>';
  h+='<div style="overflow-x:auto"><table class="ce-tbl"><thead><tr><th>Customer</th><th>Est. % of NVDA revenue</th><th>What they buy</th><th>Class</th></tr></thead><tbody>'+
    NB_SPLC_CUST.map(function(r){ return '<tr><td style="font-weight:700">'+esc(r[0])+'</td><td>'+esc(r[1])+'</td><td>'+esc(r[2])+'</td><td style="color:var(--mu)">'+esc(r[3])+'</td></tr>'; }).join('')+
  '</tbody></table></div>';
  h+='<div class="ov-fynote">NVIDIA discloses only that a small number of direct customers each exceed 10% of revenue (direct customers are often ODMs/OEMs). The table maps estimated <b>end-demand</b> exposure — the hyperscaler concentration that is the key customer risk. Directional, not audited.</div>';
  h+='<div class="ov-diagram-cap" style="margin:18px 0 6px"><b>Who needs whom — revenue dependency ON NVIDIA</b> (est. % of the counterpart\'s revenue tied to NVIDIA / its ecosystem)</div>';
  h+='<div class="ov-mbars">'+NB_SPLC_DEP.map(function(r){
    return '<div class="ov-mbar"><div class="ov-mbar-l">'+esc(r[0])+' <span style="color:var(--mu);font-weight:600">'+esc(r[2])+'</span></div><div class="ov-mbar-track"><div class="ov-mbar-fill" style="width:'+r[1]+'%;background:'+BRAND+'">'+r[1]+'%</div></div><div class="ov-mbar-v">'+r[1]+'%</div></div>';
  }).join('')+'</div>';
  h+='<div class="ov-sec" style="margin-top:16px"><div class="ov-sec-h">Geography — supply-chain criticality by country (est. % share)</div>'+
    '<div style="height:320px"><canvas id="nbSplcGeo"></canvas></div>'+
    '<div class="ov-fynote">The supply chain is <b>Taiwan-heavy</b>: TSMC fabs the silicon, packages it (CoWoS), and Taiwanese ODMs integrate the racks. South Korea supplies HBM; the US is onshoring some fab and packaging. China is the tariff / export-control surface. Shares are Summit estimates of criticality, not facility counts.</div></div>';
  h+='<div class="ov-foot">Sources: NVIDIA FY2026 10-K (customer-concentration &amp; supplier disclosures), docs/calls/NVDA.md (supply/CoWoS/HBM commentary), and public supply-chain reporting. Dollar-level supplier spend is not disclosed (NVIDIA is fabless); relationship sizes and shares are Summit estimates — directional, not audited.</div>';
  return h;
}
function nbBuildSplc(){
  var cv=nbChartReady('nbSplcGeo');
  if(cv){ nbDestroy('nbSplcGeo');
    nbCharts['nbSplcGeo']=new Chart(cv.getContext('2d'),{ type:'bar',
      data:{ labels:NB_SPLC_GEO.labels, datasets:[{ label:'Supply-chain criticality', data:NB_SPLC_GEO.sup, backgroundColor:BRAND2, maxBarThickness:16 }] },
      options:{ indexAxis:'y', responsive:true, maintainAspectRatio:false,
        plugins:{ legend:{ position:'bottom', labels:{ boxWidth:10, font:{ size:10 } } }, tooltip:{ callbacks:{ label:function(ctx){ return ctx.dataset.label+': '+ctx.parsed.x+'%'; } } } },
        scales:{ x:{ grid:{ color:'rgba(0,0,0,0.05)' }, ticks:{ callback:function(v){ return v+'%'; } } }, y:{ grid:{ display:false }, ticks:{ font:{ size:11 } } } } } }); nbZoom('nbSplcGeo'); }
  // Upstream card expanders (pane-scoped, idempotent).
  var pane=nbPane('supplychain'); if(pane && !pane._nbSplcWired){ pane._nbSplcWired=true;
    pane.querySelectorAll('.nb-splc-card').forEach(function(card){ card.onclick=function(){ var r=card.querySelector('.nb-splc-read'); if(r) r.hidden=!r.hidden; }; }); }
}

// ═══════════════════════════════════════════════════════════════════════════════════════════
// BODY + INIT
// ═══════════════════════════════════════════════════════════════════════════════════════════
function body(){
  var h='<div class="nb-bl ov ov-nvda-dd" data-brand="NVDA" style="--brand:'+BRAND+';--brand-2:'+BRAND2+';--brand-soft:rgba(118,185,0,0.10)">';
  h+='<div class="ovt-subtabs">'+
      '<button type="button" class="ovt-subtab active" data-ovst="margins">General</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="segments">Segments</button>'+
      '<button type="button" class="ovt-subtab" data-ovst="supplychain">Supply Chain</button>'+
    '</div>';
  h+='<div class="ovt-subpane" data-ovst="margins">'+nbGeneralPicker()+
      '<div class="gen-sec" data-gsec="margins">'+nbMarginsBody()+'</div>'+
      '<div class="gen-sec" data-gsec="bridge" hidden>'+nbBridgeBody()+'</div>'+
      '<div class="gen-sec" data-gsec="net" hidden>'+nbNetBridgeBody()+'</div>'+
      '<div class="gen-sec" data-gsec="sbc" hidden>'+nbSbcBody()+'</div>'+
      nbCollap('Expense lines — the functional deep dives (10-K definition, composition, unit trend, drivers, calls)', expenseTabsBody(), false)+'</div>';
  h+='<div class="ovt-subpane" data-ovst="segments" hidden>'+nbSegBody()+'</div>';
  h+='<div class="ovt-subpane" data-ovst="supplychain" hidden>'+nbSplcBody()+'</div>';
  h+='</div>';
  return h;
}
function nbBuildSub(key){
  if(key==='supplychain') requestAnimationFrame(nbBuildSplc);
  else if(key==='segments') requestAnimationFrame(nbBuildSegments);
  else requestAnimationFrame(function(){ nbBuildMargins(); nbBuildExpenses(); });
}
function init(paneRoot){
  var host = paneRoot || document.getElementById('co-detailview') || document;
  var wrap = (host.querySelector && host.querySelector('.nb-bl')) || (host.classList&&host.classList.contains('nb-bl')?host:host);
  _nbRoot = wrap;
  var bar = wrap.querySelector? wrap.querySelector('.ovt-subtabs') : null;
  if(bar && !bar._nbWired){ bar._nbWired=true;
    bar.querySelectorAll('.ovt-subtab').forEach(function(btn){ btn.onclick=function(){
      var key=btn.getAttribute('data-ovst');
      bar.querySelectorAll('.ovt-subtab').forEach(function(b){ b.classList.toggle('active', b===btn); });
      wrap.querySelectorAll('.ovt-subpane').forEach(function(p){ p.hidden=(p.getAttribute('data-ovst')!==key); });
      nbBuildSub(key);
    }; });
  }
  // rule 3 — the collapsible table dropdown under each chart (delegated, pane-scoped).
  if(wrap && !wrap._nbCollapWired){ wrap._nbCollapWired=true;
    wrap.addEventListener('click', function(e){ var hh=e.target.closest?e.target.closest('.rs-collap-h'):null; if(!hh||!wrap.contains(hh)) return;
      var b=hh.nextElementSibling; if(!b||!b.classList.contains('rs-collap-b')) return; var open=b.hidden; b.hidden=!open;
      var ic=hh.querySelector('.rs-collap-ic'); if(ic) ic.textContent=open?'▾':'▸'; }); }
  requestAnimationFrame(function(){
    var active=bar?bar.querySelector('.ovt-subtab.active'):null;
    nbBuildSub(active?active.getAttribute('data-ovst'):'margins');
  });
}

export var nvdaBottomLine = { body: body, init: init };
