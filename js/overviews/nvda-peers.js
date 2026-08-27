// overviews/nvda-peers.js — NVDA peer-valuation scatter, a structural port of AMZN's stdPeerScatter
// (amzn.js:305-501). Inline SVG bubble map: X = valuation multiple (cheaper←→expensive), Y = revenue
// growth, bubble size = live market cap. Shared by Overview ▸ Competitors (sfx 'ov') and Deep Dive ▸
// Valuation ▸ Peers (sfx 'dd', which adds the comps table). One module-global N_SC state drives every
// instance, exactly like AMZN. CSS is written inline (self-contained); rs-collap is global.
//
// Exports: nvdaScatterHtml(sfx) and wireNvdaScatters(root).

var BRAND = '#76B900';   // NVIDIA green

// peT/peF = trailing/forward P/E · evT/evF = trailing/forward EV/EBITDA · gt/gf = trailing/forward
// revenue growth % · mc = market cap $B (seeded; refreshed live) · hl = the subject (NVDA).
var N_PEERS = [
  { tk:'NVDA', n:'NVIDIA', peT:38, peF:19, evT:30, evF:16, gt:59, gf:96, mc:4100, hl:true,
    why:'The platform at the center of the AI build-out. Rich on trailing numbers, but the forward multiple compresses fast because earnings are still inflecting — the growth is the whole story.' },
  { tk:'AMD', n:'AMD', peT:45, peF:28, evT:33, evF:22, gt:35, gf:60, mc:260,
    why:'The #2 merchant GPU/CPU vendor. Priced for an AI-accelerator ramp it has yet to fully deliver — the most expensive name on forward earnings after the growth it is promising.' },
  { tk:'AVGO', n:'Broadcom', peT:38, peF:30, evT:28, evF:24, gt:25, gf:22, mc:1150,
    why:'Custom AI ASICs + networking + infrastructure software. The nearest large-cap read on the "who else captures AI silicon dollars" question — steadier growth, similar multiple.' },
  { tk:'INTC', n:'Intel', peT:35, peF:22, evT:11, evF:9, gt:10, gf:20, mc:130,
    why:'The turnaround/foundry story. Cheapest on EV/EBITDA by far; the low multiple reflects a slow core and an unproven foundry bet (NVIDIA took a $5B stake in 2025).' },
  { tk:'QCOM', n:'Qualcomm', peT:16, peF:14, evT:12, evF:11, gt:12, gf:10, mc:190,
    why:'Mobile/edge compute — the value name on the map. Low growth, low multiple; a reminder of what semis are priced at without an AI-datacenter engine.' },
];

var N_SC = { metric:'pe', basis:'f', peers:null, _capsFetched:false };
function nvpReset(){ if(!N_SC.peers) N_SC.peers=N_PEERS.map(function(p){ var o={}; for(var k in p) o[k]=p[k]; o.on=true; return o; }); }
function nvpMult(p){ var key=(N_SC.metric==='pe'?'pe':'ev')+(N_SC.basis==='f'?'F':'T'); return p[key]; }
function nvpMax(){ return N_SC.metric==='pe'?60:35; }
function nvpLogoUrl(p){ return p.logo || ('https://assets.parqet.com/logos/symbol/'+p.tk); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }

export function nvdaScatterHtml(sfx){
  sfx=sfx||'ov';
  var h='<style>.mg-tog-row{display:flex;flex-wrap:wrap;gap:14px;margin:2px 0 8px}'+
    '.mg-tog{display:inline-flex;align-items:center;gap:6px;font-size:11px;font-weight:700;color:var(--mu)}'+
    '.mg-seg{display:inline-flex;background:#F2F5F8;border:1px solid var(--bdr);border-radius:999px;padding:2px}'+
    '.mg-pill{border:none;background:transparent;font:inherit;font-size:10.5px;font-weight:700;color:var(--mu);padding:3px 10px;border-radius:999px;cursor:pointer}'+
    '.mg-pill.active{background:var(--navy);color:#fff}'+
    '.mg-node{cursor:pointer}.mg-node text{pointer-events:none}'+
    '.asc-chips{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:8px 0 2px}'+
    '.asc-chip{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;border:1px solid var(--bdr);border-radius:999px;padding:3px 9px;background:var(--w);cursor:pointer;color:var(--navy)}'+
    '.asc-chip .x{color:var(--mu);font-weight:800}'+
    '.asc-add{display:inline-flex;gap:5px;align-items:center}'+
    '.asc-add input{width:74px;font:inherit;font-size:11px;border:1px solid var(--bdr);border-radius:7px;padding:3px 7px;text-transform:uppercase}'+
    '.asc-add button{font:inherit;font-size:11px;font-weight:700;border:1px solid var(--bdr);border-radius:7px;padding:3px 9px;background:#F2F5F8;cursor:pointer}'+
    '.mg-tip{position:fixed;z-index:60;max-width:250px;background:#10141A;color:#fff;border-radius:9px;padding:9px 12px;font-size:11.5px;line-height:1.5;box-shadow:0 8px 22px rgba(16,20,26,.28);pointer-events:none;border-top:3px solid '+BRAND+'}'+
    '.mg-tip .mgt-h{display:flex;align-items:center;gap:7px;margin-bottom:4px}.mg-tip .mgt-h img{width:18px;height:18px;border-radius:4px;background:#fff;object-fit:contain}'+
    '.mg-tip .mgt-n{font-weight:800;font-size:12.5px;color:#B6E24D}'+
    '.asc-tblwrap{overflow-x:auto}.asc-tbl{border-collapse:collapse;width:100%;font-size:12px;margin:4px 0}'+
    '.asc-tbl th,.asc-tbl td{padding:7px 10px;text-align:right;border-bottom:1px solid var(--bdr);white-space:nowrap}'+
    '.asc-tbl th:first-child,.asc-tbl td:first-child{text-align:left}'+
    '.asc-tbl thead th{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--mu);border-bottom:2px solid var(--bdr)}'+
    '.asc-tbl td.asc-m{font-weight:800;color:var(--navy)}'+
    '.asc-tbl tbody tr.asc-hl{background:rgba(118,185,0,.08)}'+
    '.asc-tbl tbody tr.asc-nil td{color:var(--mu)}'+
    '.asc-tbl tfoot td{border-top:2px solid var(--bdr);border-bottom:none;font-weight:800;color:var(--navy);background:#F7F9FB}'+
    '.asc-tbl tfoot tr.asc-med td{background:#FAFBFC;font-weight:700;color:var(--mu)}'+
    '.asc-nm{display:inline-flex;align-items:center;gap:7px}.asc-nm img{width:16px;height:16px;border-radius:4px;background:#fff;object-fit:contain}'+
    '.asc-tk{color:var(--mu);font-weight:700;font-size:10.5px}.asc-up{color:#C0392B;font-weight:700}.asc-dn{color:#2E8B57;font-weight:700}.asc-nilv{color:var(--mu)}</style>';
  h+='<div class="amzn-sc" data-sfx="'+sfx+'">';
  h+='<div class="ov-diagram-cap" style="margin:0 0 6px">Peers mapped by <b>valuation multiple</b> (x) and <b>revenue growth</b> (y). <b>Bubble size = live market cap in USD.</b> <span style="opacity:.75">Hover or tap a bubble for the read.</span></div>';
  h+='<div class="mg-tog-row">'+
    '<span class="mg-tog">Multiple: <span class="mg-seg"><button type="button" class="mg-pill active" data-mgmetric="pe">P/E</button><button type="button" class="mg-pill" data-mgmetric="ev">EV/EBITDA</button></span></span>'+
    '<span class="mg-tog">Basis: <span class="mg-seg"><button type="button" class="mg-pill active" data-mgbasis="f">Forward</button><button type="button" class="mg-pill" data-mgbasis="t">Trailing</button></span></span>'+
  '</div>';
  h+='<div class="ov-diagram"><svg viewBox="0 0 640 300" class="amzn-sc-svg" role="img" aria-label="Peer valuation vs growth map">'+
    '<line x1="80" y1="252" x2="612" y2="252" stroke="#C7CED6" stroke-width="1.5"/>'+
    '<line x1="80" y1="252" x2="80" y2="44" stroke="#C7CED6" stroke-width="1.5"/>'+
    '<text x="88" y="270" font-family="Inter,sans-serif" font-size="10" fill="#8A93A0">← cheaper (lower multiple)</text>'+
    '<text x="610" y="270" font-family="Inter,sans-serif" font-size="10" fill="#8A93A0" text-anchor="end">more expensive →</text>'+
    '<text x="346" y="288" font-family="Inter,sans-serif" font-size="10" font-weight="700" fill="#6b7684" text-anchor="middle" class="amzn-sc-xlab">P/E · forward</text>'+
    '<text x="74" y="250" font-family="Inter,sans-serif" font-size="10" fill="#8A93A0" text-anchor="end">slow</text>'+
    '<text x="74" y="52" font-family="Inter,sans-serif" font-size="10" fill="#8A93A0" text-anchor="end">fast growth</text>'+
    '<g class="amzn-sc-nodes"></g>'+
  '</svg></div>';
  h+='<div class="asc-chips amzn-sc-chips"></div>';
  h+='<div class="ov-diagram-cap" style="margin-top:4px">Remove a peer with the <b>×</b> on its chip, or add one by ticker. <span class="ave-subh-note">Multiples &amp; growth are seeded approximations (Aug 2026; forward EV/EBITDA derived, not quoted); market caps are live.</span></div>';
  if(sfx==='dd') h+='<div class="rs-collap amzn-sc-collap">'+
      '<button type="button" class="rs-collap-h amzn-sc-tblh"></button>'+
      '<div class="rs-collap-b amzn-sc-tblb">'+
        '<div class="rs-tablewrap asc-tblwrap"><div class="amzn-sc-tbl"></div></div>'+
      '</div></div>';
  h+='<div class="mg-tip amzn-sc-tip" hidden></div>';
  h+='</div>';
  return h;
}
function nvpRenderOne(wrap){
  var g=wrap.querySelector('.amzn-sc-nodes'); if(!g||!N_SC.peers) return;
  var maxMult=nvpMax(), X0=80, X1=612, Y0=252, Y1=44;
  var lab=wrap.querySelector('.amzn-sc-xlab'); if(lab) lab.textContent=(N_SC.metric==='pe'?'P/E':'EV/EBITDA')+' · '+(N_SC.basis==='f'?'forward':'trailing');
  wrap.querySelectorAll('.mg-pill[data-mgbasis]').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-mgbasis')===N_SC.basis); });
  wrap.querySelectorAll('.mg-pill[data-mgmetric]').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-mgmetric')===N_SC.metric); });
  var frag='';
  N_SC.peers.forEach(function(p){
    if(!p.on) return; var m=nvpMult(p); if(m==null||isNaN(m)) return;
    var growth=N_SC.basis==='f'?p.gf:p.gt; if(growth==null) growth=p.gf!=null?p.gf:p.gt;
    var x=X0+Math.max(0,Math.min(1,m/maxMult))*(X1-X0);
    var y=Y0-Math.max(0,Math.min(1,(growth||0)/100))*(Y0-Y1);
    var r=Math.max(11,Math.min(27,9+Math.sqrt(Math.max(1,p.mc))*0.32));
    var logo=nvpLogoUrl(p);
    frag+='<g class="mg-node" data-name="'+esc(p.n)+'" data-tk="'+esc(p.tk)+'" data-logo="'+esc(logo)+'" data-why="'+esc(p.why||'')+'" transform="translate('+x.toFixed(1)+','+y.toFixed(1)+')">'+
      '<circle r="'+r.toFixed(1)+'" fill="#fff" stroke="'+(p.hl?BRAND:'#C7CED6')+'" stroke-width="'+(p.hl?3:1.5)+'"></circle>'+
      '<image href="'+esc(logo)+'" x="'+(-r*0.72).toFixed(1)+'" y="'+(-r*0.72).toFixed(1)+'" width="'+(r*1.44).toFixed(1)+'" height="'+(r*1.44).toFixed(1)+'" preserveAspectRatio="xMidYMid meet" style="pointer-events:none"></image>'+
      '<text y="'+(r+12).toFixed(1)+'" font-family="Inter,sans-serif" font-size="'+(p.hl?12:11)+'" font-weight="'+(p.hl?800:700)+'" fill="'+(p.hl?'#4E7A00':'#3A4552')+'" text-anchor="middle">'+esc(p.n)+'</text></g>';
  });
  g.innerHTML=frag;
  nvpTableOne(wrap);
}
function nvpChipsOne(wrap){
  var box=wrap.querySelector('.amzn-sc-chips'); if(!box||!N_SC.peers) return;
  var h=N_SC.peers.map(function(p,i){ return '<span class="asc-chip" data-sci="'+i+'" title="Remove '+esc(p.n)+'">'+esc(p.n)+' <span class="x">×</span></span>'; }).join('');
  h+='<span class="asc-add"><input class="amzn-sc-addtk" placeholder="+ TICKER" maxlength="6"><button type="button" class="amzn-sc-addbtn">Add</button></span>';
  box.innerHTML=h;
}
function nvpRenderAll(root){ root.querySelectorAll('.amzn-sc').forEach(nvpRenderOne); }
function nvpGrowth(p){ var g=N_SC.basis==='f'?p.gf:p.gt; if(g==null) g=(p.gf!=null?p.gf:p.gt); return g; }
function nvpNum(v){ return v!=null && !isNaN(v); }
function nvpFmtMult(v){ return nvpNum(v)?v.toFixed(1)+'×':'—'; }
function nvpFmtPct(v){ return nvpNum(v)?v.toFixed(1)+'%':'—'; }
function nvpFmtMc(v){ return nvpNum(v)?('$'+(v>=1000?(v/1000).toFixed(2)+'T':Math.round(v)+'B')):'—'; }
function nvpMean(a){ if(!a.length) return null; return a.reduce(function(s,v){ return s+v; },0)/a.length; }
function nvpMedian(a){ if(!a.length) return null; var s=a.slice().sort(function(x,y){ return x-y; }), h=Math.floor(s.length/2); return s.length%2?s[h]:(s[h-1]+s[h])/2; }
function nvpVsAvg(m, avg){ if(!nvpNum(m)||!nvpNum(avg)||avg===0) return '<span class="asc-nilv">—</span>'; var d=(m/avg-1)*100; return '<span class="'+(d>=0?'asc-up':'asc-dn')+'">'+(d>=0?'+':'')+Math.round(d)+'%</span>'; }
function nvpTableOne(wrap){
  var box=wrap.querySelector('.amzn-sc-tbl'); if(!box||!N_SC.peers) return;
  var mLab=(N_SC.metric==='pe'?'P/E':'EV/EBITDA'), bLab=(N_SC.basis==='f'?'forward':'trailing');
  var rows=N_SC.peers.map(function(p){ return { p:p, m:nvpMult(p), g:nvpGrowth(p) }; });
  rows.sort(function(a,b){ var an=nvpNum(a.m), bn=nvpNum(b.m); if(!an&&!bn) return 0; if(!an) return 1; if(!bn) return -1; return a.m-b.m; });
  var peers=rows.filter(function(r){ return !r.p.hl; });
  var avgM=nvpMean(peers.filter(function(r){ return nvpNum(r.m); }).map(function(r){ return r.m; }));
  var medM=nvpMedian(peers.filter(function(r){ return nvpNum(r.m); }).map(function(r){ return r.m; }));
  var avgG=nvpMean(peers.filter(function(r){ return nvpNum(r.g); }).map(function(r){ return r.g; }));
  var medG=nvpMedian(peers.filter(function(r){ return nvpNum(r.g); }).map(function(r){ return r.g; }));
  var nM=peers.filter(function(r){ return nvpNum(r.m); }).length;
  var body=rows.map(function(r){
    var p=r.p, cls=(p.hl?'asc-hl':'')+(nvpNum(r.m)?'':' asc-nil');
    return '<tr class="'+cls.trim()+'"><td><span class="asc-nm"><img src="'+esc(nvpLogoUrl(p))+'" alt="" onerror="this.style.display=\'none\'"><span>'+esc(p.n)+' <span class="asc-tk">'+esc(p.tk)+'</span></span></span></td>'+
      '<td class="asc-m">'+nvpFmtMult(r.m)+'</td><td>'+nvpFmtPct(r.g)+'</td><td>'+nvpFmtMc(p.mc)+'</td><td>'+nvpVsAvg(r.m, avgM)+'</td></tr>';
  }).join('');
  var foot='<tr class="asc-avg"><td>Peer average <span class="asc-tk">ex-NVDA · '+nM+' names</span></td><td>'+nvpFmtMult(avgM)+'</td><td>'+nvpFmtPct(avgG)+'</td><td><span class="asc-nilv">—</span></td><td><span class="asc-nilv">—</span></td></tr>'+
    '<tr class="asc-med"><td>Peer median <span class="asc-tk">ex-NVDA</span></td><td>'+nvpFmtMult(medM)+'</td><td>'+nvpFmtPct(medG)+'</td><td><span class="asc-nilv">—</span></td><td><span class="asc-nilv">—</span></td></tr>';
  box.innerHTML='<table class="asc-tbl"><thead><tr><th>Peer</th><th>'+esc(mLab)+' · '+esc(bLab)+'</th><th>Rev growth · '+esc(bLab)+'</th><th>Market cap</th><th>vs peer avg</th></tr></thead><tbody>'+body+'</tbody><tfoot>'+foot+'</tfoot></table>';
  var hd=wrap.querySelector('.amzn-sc-tblh'), bd=wrap.querySelector('.amzn-sc-tblb');
  if(hd){ var open=!(bd&&bd.hidden); hd.innerHTML='<span class="rs-collap-ic">'+(open?'▾':'▸')+'</span>The numbers behind the map<span class="rs-collap-sub">'+(open?'hide':'show')+' · '+esc(mLab)+' · '+esc(bLab)+', '+rows.length+' names</span>'; }
}
function nvpChipsAll(root){ root.querySelectorAll('.amzn-sc').forEach(function(w){ nvpChipsOne(w); nvpWireChips(root, w); }); }
export function wireNvdaScatters(root){
  nvpReset();
  root.querySelectorAll('.amzn-sc').forEach(function(wrap){
    if(wrap._scWired) return; wrap._scWired=true;
    var tblH=wrap.querySelector('.amzn-sc-tblh'), tblB=wrap.querySelector('.amzn-sc-tblb');
    if(tblH&&tblB) tblH.onclick=function(){ tblB.hidden=!tblB.hidden; nvpRenderOne(wrap); };
    var g=wrap.querySelector('.amzn-sc-nodes'), tip=wrap.querySelector('.amzn-sc-tip');
    wrap.querySelectorAll('.mg-pill[data-mgbasis]').forEach(function(btn){ btn.onclick=function(){ N_SC.basis=btn.getAttribute('data-mgbasis'); nvpRenderAll(root); }; });
    wrap.querySelectorAll('.mg-pill[data-mgmetric]').forEach(function(btn){ btn.onclick=function(){ N_SC.metric=btn.getAttribute('data-mgmetric'); nvpRenderAll(root); }; });
    if(g&&tip){
      var svg=wrap.querySelector('.amzn-sc-svg');
      function nodeOf(e){ return (e.target&&e.target.closest)?e.target.closest('.mg-node'):null; }
      function show(node){ tip.innerHTML='<div class="mgt-h"><img src="'+node.getAttribute('data-logo')+'" alt="" onerror="this.style.display=\'none\'"><span class="mgt-n">'+node.getAttribute('data-name')+'</span></div>'+node.getAttribute('data-why'); tip.hidden=false; }
      function move(e){ tip.style.left=Math.min(e.clientX+16, window.innerWidth-270)+'px'; tip.style.top=(e.clientY+16)+'px'; }
      function hide(){ tip.hidden=true; }
      g.addEventListener('pointerover', function(e){ var n=nodeOf(e); if(n){ show(n); move(e); } });
      g.addEventListener('pointermove', function(e){ var n=nodeOf(e); if(n){ show(n); move(e); } else hide(); });
      g.addEventListener('pointerout', function(e){ if(!nodeOf(e)) return; var rt=e.relatedTarget; if(rt&&rt.closest&&rt.closest('.mg-node')) return; hide(); });
      if(svg) svg.addEventListener('pointerleave', hide);
      g.addEventListener('click', function(e){ var n=nodeOf(e); if(n){ show(n); move(e); } });
    }
  });
  nvpRenderAll(root); nvpChipsAll(root); nvpFetchCaps(root);
}
function nvpWireChips(root, wrap){
  wrap.querySelectorAll('.amzn-sc-chips .asc-chip[data-sci]').forEach(function(ch){ ch.onclick=function(){ var i=+ch.getAttribute('data-sci'); if(N_SC.peers[i]){ N_SC.peers.splice(i,1); nvpRenderAll(root); nvpChipsAll(root); } }; });
  var addBtn=wrap.querySelector('.amzn-sc-addbtn'), addIn=wrap.querySelector('.amzn-sc-addtk');
  if(addBtn&&addIn){ addBtn.onclick=function(){ var tk=(addIn.value||'').trim().toUpperCase(); if(!tk) return;
    if(!N_SC.peers.some(function(p){ return p.tk===tk; })){
      var seed=N_PEERS.filter(function(p){ return p.tk===tk; })[0];
      if(seed){ var o={}; for(var k in seed) o[k]=seed[k]; o.on=true; N_SC.peers.push(o); }
      else N_SC.peers.push({ tk:tk, n:tk, on:true, mc:100, peT:null,peF:null,evT:null,evF:null,gt:null,gf:null, why:'Added by ticker — live market cap only; no multiple on file, so it plots once one is available.' });
    }
    addIn.value=''; nvpRenderAll(root); nvpChipsAll(root); nvpLiveOne(root, tk); }; }
}
function nvpLiveOne(root, tk){ import('../api.js').then(function(m){ if(!m||!m.liveQuote) return null; return m.liveQuote(tk); }).then(function(res){ var q=res&&res.data?res.data:res; if(!q||q.marketCap==null) return; var mcB=q.marketCap/1e9; N_SC.peers.forEach(function(p){ if(p.tk===tk) p.mc=mcB; }); if(tk==='NVDA'){ var el=root.querySelector('#nvdaMc'); if(el) el.textContent='$'+(mcB>=1000?(mcB/1000).toFixed(2)+'T':Math.round(mcB)+'B')+' · live'; } nvpRenderAll(root); }).catch(function(){}); }
function nvpFetchCaps(root){ if(N_SC._capsFetched||!N_SC.peers) return; N_SC._capsFetched=true; N_SC.peers.forEach(function(p){ if(p.tk) nvpLiveOne(root, p.tk); }); }
