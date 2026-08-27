// overviews/nvda-sensitivity.js — NVIDIA (NVDA) Deep Dive ▸ Valuation ▸ Sensitivity Analysis.
//
// Structural twin of overviews/amzn-sensitivity.js — same export shape ({ body, init }), same
// control layout, the same 5×5 implied-price grid, the same class names, the same live-price
// wiring and the same consensus card. What differs is the model behind it: AMZN's grid is built
// on three operating SEGMENTS; the NVDA data supplied is CONSOLIDATED, so this grid is built on
// company-level drivers instead — revenue growth and gross margin on the two axes, with operating
// expense, D&A and the net-income ratio held at the model.
//
// ── Data (Summit DCF model, instrument NVDA, FY2027-FY2029, $M) ───────────────────
// Every figure is read straight off the supplied model — nothing is invented:
//   revenue          FY2027 390,324 · FY2028 566,719 · FY2029 705,186   (FY2026 base 215,938)
//   EBITDA           FY2027 261,030 · FY2028 379,650 · FY2029 487,060
//   net income       FY2027 213,316 · FY2028 310,280 · FY2029 402,589
//   opex ($M)        FY2027  33,800 · FY2028  43,300 · FY2029  53,500
//   D&A  ($M)        FY2027   6,300 · FY2028   9,800 · FY2029  28,800
//   NI / EBIT ratio  FY2027   0.843 · FY2028   0.841 · FY2029   0.858
//   diluted shares   24,390M (flat)          net cash  $109.2B
// Gross margin is DERIVED as (EBITDA − D&A + opex) / revenue, which is the only value that lets the
// base case reproduce the model's EBITDA exactly while the operating margin flexes on an axis
// (FY2027 works out to 74.1%, ties the supplied gross-margin input). The growth axis default range
// per year comes from the supplied min/max (FY2027 0.30–1.20 · FY2028 0.10–0.80 · FY2029 0.00–0.50),
// which sets the step; the axis then centres on the model's own implied CAGR.
//
// ── Consensus card ───────────────────────────────────────────────────────────────
// No Street consensus figures were supplied, so CONS.v is left EMPTY and CONS.src null. The card
// renders the honest "no consensus figure — held at the model" path rather than inventing numbers;
// the amber placeholder badge stays until the consensus workbook is wired (fill CONS.v + CONS.src).

function esc(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

var SNAP = '2026-08-04';
var BASE_YEAR = 2026;                     // prior/base year for the growth axis (revenue only)
var YEARS = [2027, 2028, 2029];
var SHARES = 24390;                       // millions, flat across the model horizon

// Consolidated model, $M. gm is derived below so the base case reproduces EBITDA exactly; gstep is
// the growth-axis increment per year, (growthMax − growthMin) / 4 from the supplied ranges.
var M = {
  2026:{ rev:215938 },                                                                              // base year — revenue only
  2027:{ rev:390324, opex:33800, dna:6300,  ebitda:261030, earn:213316, ni:0.843, gstep:0.225 },
  2028:{ rev:566719, opex:43300, dna:9800,  ebitda:379650, earn:310280, ni:0.841, gstep:0.175 },
  2029:{ rev:705186, opex:53500, dna:28800, ebitda:487060, earn:402589, ni:0.858, gstep:0.125 },
};

// Axis drivers. `step` is the default grid increment; the user can override start and step. Only
// three, all of kinds the formatter already handles: growth (g), margin (m), multiple (x). Opex,
// D&A and the NI ratio are held at the model and shown in the assumptions strip.
var DRIVERS = [
  { k:'rev_g', kind:'g', n:'Revenue growth', step:0.05 },
  { k:'gm',    kind:'m', n:'Gross margin',   step:0.01 },
  { k:'mult',  kind:'x', n:'Exit multiple',  step:1    },
];
function drv(k){ for(var i=0;i<DRIVERS.length;i++) if(DRIVERS[i].k===k) return DRIVERS[i]; return DRIVERS[0]; }

var NCELL = 5;

// ── Street consensus — LEFT EMPTY ON PURPOSE ─────────────────────────────────────
// No consensus figures were supplied. CONS.v stays empty and CONS.src null, so the grid holds every
// driver at the model and the card says so rather than showing invented numbers. Wiring it up is:
//   1. fill CONS.v from the sheet (same keys as DRIVERS, same years as YEARS),
//   2. set CONS.src ('Bloomberg consensus', 'Visible Alpha', whatever it is) and CONS.asOf,
//   3. nothing else — the amber placeholder badge disappears on its own once CONS.src is set.
var CONS = {
  src:  null,        // e.g. 'Bloomberg consensus' — null means "still a placeholder"
  asOf: null,        // e.g. '2026-08-04'
  v: {
    rev_g: {},       // no consensus growth supplied
    gm:    {},       // no consensus margin supplied
    mult:  {},       // the exit multiple is the reader's own input, never a consensus figure
  },
};
function consValue(k, year){ var row=CONS.v[k]; var v=row?row[year]:null; return v==null?null:v; }
function consPlaceholder(){ return !CONS.src; }
function consSrcLabel(){ return CONS.src ? (CONS.src + (CONS.asOf?(' · '+CONS.asOf):'')) : 'placeholder'; }
function baseName(b){ return (b||_base)==='cons' ? 'Street consensus' : 'the Summit model'; }
function baseNameCap(b){ return (b||_base)==='cons' ? 'Street consensus' : 'Summit model'; }
function altBase(){ return _base==='summit' ? 'cons' : 'summit'; }

// ── Whose number is this? ────────────────────────────────────────────────────────
// One function decides it for every driver, and everything downstream reads it. Consensus does not
// cover the exit multiple (nobody's but yours), and — until the workbook is wired — covers nothing,
// so a missing figure falls back to the model rather than blanking the grid; consFellBack() makes
// that fallback visible instead of silent.
function baseValue(k, year){
  if(_base==='cons'){ var c=consValue(k,year); if(c!=null) return c; }
  return modelValue(k, year);
}
function consFellBack(k, year){ return _base==='cons' && consValue(k,year)==null; }
// Segment-free base reads. Growth is applied the same way an axis applies it — a flat rate
// compounded off the BASE_YEAR revenue — so a consensus CAGR and an axis CAGR mean the same thing
// and the base case sits exactly on the grid.
function baseRev(year){
  var g = (_base==='cons') ? consValue('rev_g', year) : null;
  if(g==null) return M[year].rev;
  var rev = M[BASE_YEAR].rev;
  for(var y=BASE_YEAR+1; y<=year; y++) rev *= (1+g);
  return rev;
}
function baseMargin(year){
  var m = (_base==='cons') ? consValue('gm', year) : null;
  return m==null ? modelGrossMargin(year) : m;
}

// The OTHER side, for the card beside the grid: consensus while you are reading the model, the
// model while you are reading consensus.
function altValue(k, year){ return _base==='summit' ? consValue(k, year) : modelValue(k, year); }
// The same calc as any grid cell, with the other side substituted for the two drivers on the axes
// and everything else left at the current base — so the number is directly comparable to a cell.
function altCalc(year){
  var over={}, any=false;
  var ax=altValue(_x,year), ay=altValue(_y,year);
  if(drv(_x).kind!=='x' && ax!=null){ over[_x]=ax; any=true; }
  if(drv(_y).kind!=='x' && ay!=null){ over[_y]=ay; any=true; }
  return any ? calc(year, over) : null;
}

// ── State ────────────────────────────────────────────────────────────────────────
var _year  = 2028;
var _base  = 'summit';    // whose assumptions everything OFF the axes is held at: 'summit' | 'cons'
var _x     = 'rev_g';
var _y     = 'gm';
var _basis = 'ev';        // 'ev' = EV/EBITDA · 'pe' = P/E
var _mEv   = 22;          // exit EV/EBITDA (config: min 8 · default 22 · max 45)
var _mPe   = 33;          // exit P/E       (config: min 10 · default 33 · max 60)
var _netDebt = -109200;   // $M, negative = net cash ($109.2B); overwritten by the live quote
var _rx = { start:null, step:null };   // null = auto from the model
var _ry = { start:null, step:null };
var _px = null;           // live share price

function activeMult(){ return _basis==='ev' ? _mEv : _mPe; }
function multLabel(){ return _basis==='ev' ? 'EV/EBITDA' : 'P/E'; }

// ── Model reads ──────────────────────────────────────────────────────────────────
function opexFor(year){ return M[year].opex; }
function dnaFor(year){ return M[year].dna; }
function niFor(year){ return M[year].ni; }
function heldFlags(){ return false; }     // every supplied NVDA year is fully populated
function modelEbit(year){ return M[year].ebitda - M[year].dna; }          // the model's own EBIT
// Gross margin derived so the base case reproduces the model's EBITDA exactly.
function modelGrossMargin(year){ return (M[year].ebitda - M[year].dna + M[year].opex) / M[year].rev; }
function modelCagr(year){
  var n = year - BASE_YEAR;
  return Math.pow(M[year].rev / M[BASE_YEAR].rev, 1/n) - 1;
}
function growStep(year){ return M[year].gstep != null ? M[year].gstep : 0.05; }

// The model's own value for a driver — the axis default centres on this.
function modelValue(k, year){
  var d = drv(k);
  if(d.kind==='x') return activeMult();
  return d.kind==='g' ? modelCagr(year) : modelGrossMargin(year);
}
// Axis geometry: start + step, defaulting to "the BASE's value sits in the middle". The growth
// axis takes its step from the supplied per-year min/max range; everything else uses the driver's
// own step.
function axis(k, st, year){
  var d = drv(k);
  var step  = (st.step!=null)  ? st.step  : (k==='rev_g' ? growStep(year) : d.step);
  var start = (st.start!=null) ? st.start : (baseValue(k, year) - Math.floor(NCELL/2)*step);
  var vals = []; for(var i=0;i<NCELL;i++) vals.push(start + i*step);
  return { start:start, step:step, vals:vals, auto:(st.start==null && st.step==null) };
}

// ── The calculation ──────────────────────────────────────────────────────────────
// revenue → gross profit → operating income (EBIT) → EBITDA → earnings → implied price. D&A is
// held at the model, so moving the gross margin moves operating income and EBITDA together. The
// earnings line reproduces the model exactly at the base case and moves only with the EBIT delta,
// scaled by the year's NI/EBIT ratio.
function calc(year, over){
  over = over || {};
  var g = over['rev_g'];
  var rev = (g!=null)
    ? (function(){ var r=M[BASE_YEAR].rev; for(var y=BASE_YEAR+1; y<=year; y++) r *= (1+g); return r; })()
    : baseRev(year);
  var gm  = over['gm']!=null ? over['gm'] : baseMargin(year);
  var opex= opexFor(year);
  var dna = dnaFor(year);
  var opInc  = rev*gm - opex;               // EBIT
  var ebitda = opInc + dna;
  var ni = niFor(year);
  var earnings = M[year].earn + (opInc - modelEbit(year)) * ni;
  var mult = over.mult!=null ? over.mult : activeMult();
  var ev, equity, px;
  if(_basis==='ev'){ ev = ebitda*mult; equity = ev - _netDebt; px = equity/SHARES; }
  else             { px = (earnings/SHARES)*mult; equity = px*SHARES; ev = equity + _netDebt; }
  return { rev:rev, gm:gm, opex:opex, dna:dna, opInc:opInc, ebitda:ebitda, earnings:earnings,
           mult:mult, ev:ev, equity:equity, px:px, eps:earnings/SHARES };
}

// ── Formatting ───────────────────────────────────────────────────────────────────
function fmtB(v){ var b=v/1000; return (Math.abs(b)>=1000) ? ('$'+(b/1000).toFixed(2)+'T') : ('$'+Math.round(b)+'B'); }
function fmtPx(v){ return '$'+Math.round(v).toLocaleString('en-US'); }
function pctLbl(v){ var s=v*100; return (Math.abs(s-Math.round(s))<0.05 ? Math.round(s) : s.toFixed(1))+'%'; }
function axisLbl(k,v){ return drv(k).kind==='x' ? (v.toFixed(1)+'×') : pctLbl(v); }
function signPct(p){ return (p>=0?'+':'−')+(Math.abs(p)*100).toFixed(1)+'%'; }
function lerp(a,b,t){ return Math.round(a+(b-a)*t); }
function colorFor(up, cap){
  if(cap<=0) return '#ffffff';
  var t = Math.max(-1, Math.min(1, up/cap));
  if(t>=0) return 'rgb('+lerp(255,168,t)+','+lerp(255,205,t)+','+lerp(255,160,t)+')';
  t=-t;    return 'rgb('+lerp(255,240,t)+','+lerp(255,176,t)+','+lerp(255,168,t)+')';
}
// Inputs show percentages as points, multiples as-is.
function toInp(k,v){ return drv(k).kind==='x' ? v : +(v*100).toFixed(3); }
function fromInp(k,v){ return drv(k).kind==='x' ? v : v/100; }

// ── Body ─────────────────────────────────────────────────────────────────────────
function selHtml(id, cur){
  return '<select class="sens-sel" id="'+id+'">'+DRIVERS.map(function(d){
    return '<option value="'+d.k+'"'+(d.k===cur?' selected':'')+'>'+esc(d.n)+'</option>';
  }).join('')+'</select>';
}
function sensBody(){
  var h = '';
  // overview.css carries two competing .sens-ctrl rules: the slider style sets
  // .sens-ctrl-l { min-width:200px } and the matrix style never clears it, so every label reserved
  // 200px and pushed the reset button onto its own line. Neutralise it for THIS pane only.
  h += '<style>'+
    '.ovt-subpane[data-ovst="sensitivity"] .sens-ctrl-l{min-width:0}'+
    '.ovt-subpane[data-ovst="sensitivity"] .sens-ctrl{margin:0;gap:8px}'+
    '.ovt-subpane[data-ovst="sensitivity"] .sens-row-inp{gap:12px 18px}'+
    '.ovt-subpane[data-ovst="sensitivity"] .as-reset{padding:5px 11px;font-size:11px}'+
    // the grid and the consensus card sit side by side; the card drops under the grid when the
    // pane gets narrow rather than squeezing the matrix
    '.as-mxrow{display:flex;gap:14px;align-items:flex-start;flex-wrap:wrap;margin:10px 0 4px}'+
    '.as-mxrow>.sens-matrix-wrap{flex:1 1 520px;min-width:0;margin:0}'+
    '.as-cons{flex:0 0 258px;border:1px solid var(--bdr);border-radius:12px;padding:12px 14px;background:#FCFCFD}'+
    '.as-cons-h{font-size:11px;font-weight:800;color:var(--navy);letter-spacing:.02em;margin-bottom:2px}'+
    '.as-cons-src{font-size:10px;color:var(--mu);margin-bottom:10px}'+
    '.as-cons-r{padding:8px 0;border-top:1px solid var(--bdr)}'+
    '.as-cons-k{font-size:10.5px;font-weight:700;color:var(--mu);margin-bottom:3px}'+
    '.as-cons-v{display:flex;align-items:baseline;gap:8px;font-size:13px;font-weight:800;color:var(--navy)}'+
    '.as-cons-v small{font-size:10px;font-weight:600;color:var(--mu)}'+
    '.as-cons-d{font-size:10.5px;font-weight:700;margin-top:2px}'+
    '.as-cons-nil{font-size:10.5px;color:var(--mu);line-height:1.45}'+
    '.as-cons-px{margin-top:10px;padding-top:10px;border-top:2px solid var(--bdr)}'+
    '.as-cons-px .v{font-size:20px;font-weight:800;color:var(--navy);line-height:1.1}'+
    '.as-cons-px .s{font-size:10.5px;color:var(--mu);margin-top:3px;line-height:1.45}'+
    // the consensus cell, ringed on the grid — purple, the same "not model data" colour the
    // Target Multiple block uses for its stand-ins
    '.sens-cell.as-cons-cell{outline:2px solid #8E44AD;outline-offset:-2px}'+
    '.as-cons-ph{display:inline-block;font-size:9px;font-weight:800;border-radius:20px;padding:1px 7px;'+
      'color:#8E44AD;border:1px solid #8E44AD;margin-left:6px;vertical-align:1px}'+
    '</style>';
  h += '<div class="sens-controls-row sens-row-year">'+
       '<div class="sens-ctrl"><span class="sens-ctrl-l">Valuation year</span><div class="sens-years">'+
         YEARS.map(function(y){ return '<button type="button" class="sens-year'+(y===_year?' active':'')+'" data-asyear="'+y+'">'+y+'</button>'; }).join('')+
       '</div></div>'+
       // Whose assumptions the grid is built on. Everything OFF the two axes is held here, so this
       // is the control that changes what the whole matrix means — hence its place on the top row.
       '<div class="sens-ctrl"><span class="sens-ctrl-l">Assumptions</span><div class="sens-years">'+
         '<button type="button" class="sens-year'+(_base==='summit'?' active':'')+'" data-asbase="summit"'+
           ' title="Every driver off the axes held at the Summit model">Summit model</button>'+
         '<button type="button" class="sens-year'+(_base==='cons'?' active':'')+'" data-asbase="cons"'+
           ' title="Every driver off the axes held at consensus'+(consPlaceholder()?' — placeholder until the workbook is wired':'')+'">'+
           'Street consensus'+(consPlaceholder()?' ⚑':'')+'</button>'+
       '</div></div>'+
       '<div class="sens-ctrl"><span class="sens-ctrl-l">Exit multiple on</span><div class="sens-years">'+
         '<button type="button" class="sens-year'+(_basis==='ev'?' active':'')+'" data-asbasis="ev">EV/EBITDA</button>'+
         '<button type="button" class="sens-year'+(_basis==='pe'?' active':'')+'" data-asbasis="pe">P/E</button>'+
       '</div></div>'+
       '<div class="sens-ctrl"><span class="sens-ctrl-l" id="asMultL">'+multLabel()+'</span><span class="sens-inp-wrap">'+
         '<input class="sens-inp" id="asMult" type="number" step="0.5" value="'+activeMult()+'"><span class="sens-inp-u">×</span></span></div>'+
       '</div>';

  h += '<div class="sens-controls-row sens-row-inp">'+
       '<div class="sens-ctrl"><span class="sens-ctrl-l">X axis →</span>'+selHtml('asX', _x)+'</div>'+
       '<div class="sens-ctrl"><span class="sens-ctrl-l">starts at</span><span class="sens-inp-wrap">'+
         '<input class="sens-inp" id="asXs" type="number" step="0.5"><span class="sens-inp-u" id="asXsU">%</span></span></div>'+
       '<div class="sens-ctrl"><span class="sens-ctrl-l">step</span><span class="sens-inp-wrap">'+
         '<input class="sens-inp" id="asXd" type="number" step="0.25"><span class="sens-inp-u" id="asXdU">pp</span></span></div>'+
       '<button type="button" class="sens-year as-reset" id="asXr" title="Back to the model-centred range">reset</button>'+
       '</div>';
  h += '<div class="sens-controls-row sens-row-inp">'+
       '<div class="sens-ctrl"><span class="sens-ctrl-l">Y axis ↓</span>'+selHtml('asY', _y)+'</div>'+
       '<div class="sens-ctrl"><span class="sens-ctrl-l">starts at</span><span class="sens-inp-wrap">'+
         '<input class="sens-inp" id="asYs" type="number" step="0.5"><span class="sens-inp-u" id="asYsU">%</span></span></div>'+
       '<div class="sens-ctrl"><span class="sens-ctrl-l">step</span><span class="sens-inp-wrap">'+
         '<input class="sens-inp" id="asYd" type="number" step="0.25"><span class="sens-inp-u" id="asYdU">pp</span></span></div>'+
       '<button type="button" class="sens-year as-reset" id="asYr" title="Back to the model-centred range">reset</button>'+
       '</div>';

  h += '<div class="sens-assum" id="asAssum"></div>';
  h += '<div class="as-mxrow">'+
         '<div class="sens-matrix-wrap" id="asMatrix"></div>'+
         '<div class="as-cons" id="asCons"></div>'+
       '</div>';
  h += '<div class="sens-legend"><span>Lower</span><div class="sens-legend-bar"></div><span>Higher</span>'+
       '<span class="sens-legend-n" id="asLegendN"></span></div>';

  h += '<div class="ov-sec" style="margin-top:16px"><div class="ov-sec-h">The same base case across years</div>'+
       '<div id="asYears"></div>'+
       '<div class="ov-fynote">The model untouched, valued at the multiple above. It climbs across years purely because the model compounds — '+
       'nothing here is discounted back, so read the later years as "what the model implies you would be paying for", not as a target price.</div></div>';

  h += '<div class="ov-foot" id="asFoot"></div>';
  return h;
}

// ── Render ───────────────────────────────────────────────────────────────────────
function syncAxisInputs(scope){
  [['x',_x,_rx,'asXs','asXd','asXsU','asXdU'],['y',_y,_ry,'asYs','asYd','asYsU','asYdU']].forEach(function(a){
    var k=a[1], st=a[2], ax=axis(k, st, _year), d=drv(k);
    var si=scope.querySelector('#'+a[3]), di=scope.querySelector('#'+a[4]);
    if(si && document.activeElement!==si) si.value = toInp(k, ax.start);
    if(di && document.activeElement!==di) di.value = toInp(k, ax.step);
    var su=scope.querySelector('#'+a[5]), du=scope.querySelector('#'+a[6]);
    if(su) su.textContent = d.kind==='x' ? '×' : '%';
    if(du) du.textContent = d.kind==='x' ? '×' : 'pp';
  });
}

function renderAssum(scope){
  var year=_year;
  // The two axis-eligible drivers first; each highlighted when it is on an axis, and each flagged
  // if a consensus run fell back to the model because the sheet does not cover it.
  var driverItems = [
    { k:'rev_g', label:'Revenue growth' },
    { k:'gm',    label:'Gross margin' },
  ].map(function(it){
    var live = (_x===it.k) || (_y===it.k);
    var fb = consFellBack(it.k, year);
    return '<span class="sens-assum-i'+(live?' sens-assum-hi':'')+'">'+esc(it.label)+
      ' <b>'+pctLbl(baseValue(it.k,year))+'</b>'+
      (live?' <i>(on an axis)</i>':'')+(fb?' <i>(no consensus figure — held at the model)</i>':'')+'</span>';
  }).join('');
  scope.querySelector('#asAssum').innerHTML =
    '<span class="sens-assum-t">Held at '+esc(baseName())+' ('+year+')'+
      (_base==='cons' && consPlaceholder() ? ' ⚑ placeholder' : '')+'</span>'+driverItems+
    // held at the model under either base
    '<span class="sens-assum-i">Operating expense <b>'+fmtB(opexFor(year))+'</b>'+(_base==='cons'?' <i>(model)</i>':'')+'</span>'+
    '<span class="sens-assum-i">D&amp;A <b>'+fmtB(dnaFor(year))+'</b> <i>(held fixed)</i></span>'+
    '<span class="sens-assum-i">Net income / EBIT <b>'+pctLbl(niFor(year))+'</b>'+(_base==='cons'?' <i>(model)</i>':'')+'</span>'+
    '<span class="sens-assum-i">Exit '+esc(multLabel())+' <b>'+activeMult().toFixed(1)+'×</b> <i>(your input)</i></span>'+
    '<span class="sens-assum-i">Shares <b>'+SHARES.toLocaleString('en-US')+'M</b> <i>(flat in the model)</i></span>'+
    '<span class="sens-assum-i">Net cash / debt <b>'+fmtB(_netDebt)+'</b></span>';
}

// ── The other side, at the right of the grid ─────────────────────────────────────
// Always shows whichever base you are NOT reading: consensus while the grid is on the Summit
// model, the model while the grid is on consensus. One row per axis driver — its figure, the
// current base's figure, and the gap — then the price those two figures imply, computed exactly
// like a cell so it is comparable.
function consRowHtml(role, k, year){
  var d=drv(k), av=altValue(k,year), bv=baseValue(k,year);
  var h='<div class="as-cons-r"><div class="as-cons-k">'+esc(role)+' &nbsp;'+esc(d.n)+'</div>';
  if(d.kind==='x' || av==null){
    // stated, not blank: an empty row here would read as "consensus says nothing" when the truth
    // is that this driver is the reader's own input, or the sheet does not cover it yet
    return h+'<div class="as-cons-nil">'+(d.kind==='x'
      ? 'The exit multiple is your input — consensus does not publish one.'
      : 'No consensus figure for this driver; the grid holds it at the model.')+'</div></div>';
  }
  var gap=av-bv;
  var gapTxt = d.kind==='x' ? ((gap>=0?'+':'−')+Math.abs(gap).toFixed(1)+'×')
                            : ((gap>=0?'+':'−')+Math.abs(gap*100).toFixed(1)+' pp');
  var col = Math.abs(gap) < (d.kind==='x'?0.05:0.0005) ? 'var(--mu)' : (gap>=0?'#2E8B57':'#C0392B');
  return h+
    '<div class="as-cons-v">'+axisLbl(k,av)+'<small>'+esc(baseNameCap())+' '+axisLbl(k,bv)+'</small></div>'+
    '<div class="as-cons-d" style="color:'+col+'">'+gapTxt+' vs '+esc(baseName())+'</div></div>';
}
function renderCons(scope, aX, aY, cell){
  var el=scope.querySelector('#asCons'); if(!el) return;
  var year=_year, r=altCalc(year), live=_px;
  var isCons=(altBase()==='cons');
  var h='<div class="as-cons-h">What '+(isCons?'consensus':'the Summit model')+' assumes'+
        (isCons && consPlaceholder()?'<span class="as-cons-ph">placeholder</span>':'')+'</div>'+
    '<div class="as-cons-src">'+esc(isCons?consSrcLabel():('Summit DCF model · '+SNAP))+' · '+year+
    ' · the two drivers on the axes</div>';
  h += consRowHtml('X →', _x, year);
  h += consRowHtml('Y ↓', _y, year);

  if(r){
    var up = live ? (r.px/live-1) : null;
    var hasX = drv(_x).kind!=='x' && altValue(_x,year)!=null;
    var hasY = drv(_y).kind!=='x' && altValue(_y,year)!=null;
    var lbl  = (hasX&&hasY) ? 'Implied at both' : ('Implied at the '+(hasX?'X':'Y')+' figure alone');
    var where = (hasX&&hasY)
      ? (cell ? 'Ringed on the grid.' : 'Off the current grid — widen a range to see it.')
      : ('The '+(hasX?esc(drv(_y).n):esc(drv(_x).n))+' axis keeps your own input, so this cannot be '+
         'placed on the grid.');
    h += '<div class="as-cons-px"><div class="as-cons-k">'+lbl+'</div>'+
      '<div class="v">'+fmtPx(r.px)+'</div>'+
      '<div class="s">'+(up!=null ? (signPct(up)+' vs the live quote') : 'live quote unavailable')+
      ' · '+(_basis==='ev' ? ('EBITDA '+fmtB(r.ebitda)+' × '+r.mult.toFixed(1)+'×')
                           : ('EPS $'+r.eps.toFixed(2)+' × '+r.mult.toFixed(1)+'×'))+
      '<br>'+where+
      '</div></div>';
  }
  if(consPlaceholder()){
    h += '<div class="rs-noguide" style="margin-top:10px">⚑ No consensus figures were supplied, so the grid holds every driver '+
         'at the model. They land here from the consensus workbook once it is wired — nothing else changes.</div>';
  }
  el.innerHTML=h;
}

function renderMatrix(scope){
  var year=_year, dX=drv(_x), dY=drv(_y);
  var aX=axis(_x,_rx,year), aY=axis(_y,_ry,year);
  var base=calc(year,{}), live=_px, ref=live||base.px, refIsLive=!!live;

  var rowsY = aY.vals.slice().reverse();      // highest at the top

  // Where the OTHER side lands on this grid. Nearest cell, but only when it is genuinely inside
  // the range — half a step past either end and the ring would be claiming a precision the grid
  // does not have. Null means "off the grid", which the card says out loud.
  function nearest(vals, v, step){
    if(v==null) return -1;
    var lo=Math.min.apply(null,vals), hi=Math.max.apply(null,vals);
    if(v < lo-step/2 || v > hi+step/2) return -1;
    var bi=0, bd=Infinity;
    vals.forEach(function(x,i){ var d=Math.abs(x-v); if(d<bd){ bd=d; bi=i; } });
    return bi;
  }
  var cxi = drv(_x).kind==='x' ? -1 : nearest(aX.vals, altValue(_x,year), aX.step);
  var cyi = drv(_y).kind==='x' ? -1 : nearest(rowsY,   altValue(_y,year), aY.step);
  var consCell = (cxi>=0 && cyi>=0) ? { x:cxi, y:cyi } : null;
  var grid = rowsY.map(function(vy){
    return aX.vals.map(function(vx){
      var over={}; over[_x]=vx; over[_y]=vy;
      var r=calc(year, over);
      return { r:r, vx:vx, vy:vy, up:r.px/ref-1 };
    });
  });
  var cap=0.0001;
  grid.forEach(function(row){ row.forEach(function(c){ cap=Math.max(cap, Math.abs(c.up)); }); });

  var h='<table class="sens-mx"><thead>'+
    '<tr><th class="sens-corner" rowspan="2">Implied price<br><small>'+esc(dY.n)+'&nbsp;↓ × '+esc(dX.n)+'&nbsp;→</small></th>'+
      '<th class="sens-colcap" colspan="'+NCELL+'">'+esc(dX.n)+'</th></tr>'+
    '<tr>'+aX.vals.map(function(v){ return '<th>'+axisLbl(_x,v)+'</th>'; }).join('')+'</tr>'+
  '</thead><tbody>';
  grid.forEach(function(row, ri){
    h += '<tr><th class="sens-rowh">'+axisLbl(_y, rowsY[ri])+'</th>';
    row.forEach(function(c, ci){
      var isCons = !!(consCell && consCell.x===ci && consCell.y===ri);
      var ttl = year+' · '+dX.n+' '+axisLbl(_x,c.vx)+' · '+dY.n+' '+axisLbl(_y,c.vy)+' → '+
        (_basis==='ev' ? ('EBITDA '+fmtB(c.r.ebitda)+' × '+c.r.mult.toFixed(1)+'× = EV '+fmtB(c.r.ev)+' → equity '+fmtB(c.r.equity))
                       : ('EPS $'+c.r.eps.toFixed(2)+' × '+c.r.mult.toFixed(1)+'× (earnings '+fmtB(c.r.earnings)+')'))+
        ' → '+fmtPx(c.r.px)+'/sh ('+signPct(c.up)+(refIsLive?' vs live price)':' vs base case)')+
        (isCons ? ('  ·  closest cell to '+baseName(altBase())+
          (altBase()==='cons' && consPlaceholder() ? ' (placeholder)' : '')) : '');
      h += '<td class="sens-cell'+(isCons?' as-cons-cell':'')+'" style="background:'+colorFor(c.up,cap)+'" title="'+esc(ttl)+'">'+
           '<div class="sens-eb">'+fmtPx(c.r.px)+'</div>'+
           '<div class="sens-pct">'+signPct(c.up)+'</div></td>';
    });
    h += '</tr>';
  });
  h += '</tbody></table>';
  scope.querySelector('#asMatrix').innerHTML = h;
  renderCons(scope, aX, aY, consCell);

  var lg = scope.querySelector('#asLegendN');
  if(lg) lg.textContent = refIsLive ? '(implied price vs. the live quote)'
                                    : '(implied price vs. the base case — live quote unavailable)';

  var ys = YEARS.map(function(y){
    var r=calc(y,{}), up = live ? (r.px/live-1) : null;
    return '<div class="sens-card"><div class="sens-card-l">'+y+(heldFlags(y)?' ⚠':'')+'</div>'+
           '<div class="sens-card-v">'+fmtPx(r.px)+'</div>'+
           '<div class="sens-card-s">'+(_basis==='ev' ? ('EBITDA '+fmtB(r.ebitda)) : ('EPS $'+r.eps.toFixed(2)))+
           (up!=null?(' · '+signPct(up)):'')+'</div></div>';
  }).join('');
  scope.querySelector('#asYears').innerHTML = '<div class="sens-regions">'+ys+'</div>';

  scope.querySelector('#asFoot').innerHTML =
    'Every figure is read from the Summit DCF model (instrument NVDA, snapshot '+SNAP+'): revenue, EBITDA, net income, operating expense, D&A and the '+
    'net-income ratio per year, plus 24,390M diluted shares and $109.2B net cash. <b>Gross margin</b> is derived as (EBITDA − D&A + opex) ÷ revenue so '+
    'the base case reproduces the model\'s EBITDA exactly; D&A is <b>held fixed</b>, so moving the gross margin moves operating income and EBITDA '+
    'together. A driver on an axis is applied as a <b>flat rate compounded from the '+BASE_YEAR+' revenue</b> (growth) or as that year\'s gross margin '+
    '(margin), and the growth axis takes its range from the supplied per-year min/max. <b>EV/EBITDA</b> values EV = EBITDA × multiple, less net debt, '+
    'over shares. <b>P/E</b> moves the net-income line off the model by the operating-income delta scaled by the NI/EBIT ratio and applies the multiple '+
    'to EPS, so the base case reproduces the model\'s earnings exactly. The exit multiple is your input (defaults EV/EBITDA 22× · P/E 33×), not a model '+
    'output. Live price and net cash via the live quote. <b>Assumptions</b> switches whose figures every driver OFF the two axes is held at: the Summit '+
    'model, or Street consensus. '+
    (consPlaceholder()
      ? '<b>⚑ No Street consensus was supplied</b>, so the consensus base and the card beside the grid fall back to the model, badged amber until the '+
        'consensus workbook is wired. '
      : '<b>Consensus read from '+esc(consSrcLabel())+'.</b> ')+
    'Data sourced from Summit DCF models.';
}

function render(scope){ syncAxisInputs(scope); renderAssum(scope); renderMatrix(scope); }

// ── Init ─────────────────────────────────────────────────────────────────────────
function initSens(root){
  var scope = root.querySelector('.ovt-subpane[data-ovst="sensitivity"]');
  if(!scope || !scope.querySelector('#asMatrix')) return;

  if(!scope._wired){
    scope._wired = true;

    scope.querySelectorAll('[data-asyear]').forEach(function(b){ b.onclick=function(){
      _year = +b.getAttribute('data-asyear');
      _rx={start:null,step:null}; _ry={start:null,step:null};      // ranges re-centre on the new year
      scope.querySelectorAll('[data-asyear]').forEach(function(x){ x.classList.toggle('active', x===b); });
      render(scope);
    }; });

    // Switching the base moves every default on the grid, so the auto-centred ranges have to
    // re-centre with it.
    scope.querySelectorAll('[data-asbase]').forEach(function(b){ b.onclick=function(){
      _base = b.getAttribute('data-asbase');
      _rx={start:null,step:null}; _ry={start:null,step:null};
      scope.querySelectorAll('[data-asbase]').forEach(function(x){ x.classList.toggle('active', x===b); });
      render(scope);
    }; });

    scope.querySelectorAll('[data-asbasis]').forEach(function(b){ b.onclick=function(){
      _basis = b.getAttribute('data-asbasis');
      scope.querySelectorAll('[data-asbasis]').forEach(function(x){ x.classList.toggle('active', x===b); });
      scope.querySelector('#asMultL').textContent = multLabel();
      scope.querySelector('#asMult').value = activeMult();
      if(drv(_x).kind==='x') _rx={start:null,step:null};           // the multiple axis re-centres
      if(drv(_y).kind==='x') _ry={start:null,step:null};
      render(scope);
    }; });

    var sx=scope.querySelector('#asX'), sy=scope.querySelector('#asY');
    sx.onchange=function(){ _x=sx.value; _rx={start:null,step:null}; render(scope); };
    sy.onchange=function(){ _y=sy.value; _ry={start:null,step:null}; render(scope); };

    var mi=scope.querySelector('#asMult');
    mi.oninput=function(){ var v=parseFloat(mi.value); if(!isFinite(v)||v<=0) return;
      if(_basis==='ev') _mEv=v; else _mPe=v;
      render(scope); };

    function bindRange(inpId, kind, getK, st){
      var el=scope.querySelector('#'+inpId);
      el.oninput=function(){ var v=parseFloat(el.value); if(!isFinite(v)) return;
        st[kind] = fromInp(getK(), v); render(scope); };
    }
    bindRange('asXs','start',function(){ return _x; }, _rx);
    bindRange('asXd','step', function(){ return _x; }, _rx);
    bindRange('asYs','start',function(){ return _y; }, _ry);
    bindRange('asYd','step', function(){ return _y; }, _ry);
    scope.querySelector('#asXr').onclick=function(){ _rx={start:null,step:null}; render(scope); };
    scope.querySelector('#asYr').onclick=function(){ _ry={start:null,step:null}; render(scope); };

    // live price + net cash (via the same api.js liveQuote AMZN uses); the grid still renders if
    // this fails.
    import('../api.js').then(function(m){ return m && m.liveQuote ? m.liveQuote('NVDA') : null; })
      .then(function(res){
        var q = res && res.data ? res.data : res; if(!q) return;
        if(q.price!=null) _px = q.price;
        if(q.netDebt!=null) _netDebt = q.netDebt/1e6;
        render(scope);
      }).catch(function(){});
  }
  render(scope);
}

export var nvdaSens = { body: sensBody, init: initSens };
