'use strict';

// ── HTML escape (prevent self-XSS from user-entered names) ───────────────────
function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Totals ────────────────────────────────────────────────────────────────────

function getTotals() {
  const stockVal  = state.stocks.reduce((a, s) =>
    a + (s.price && !s.loading ? s.price * s.lots * (s.market === 'IDX' ? 100 : 1) : 0), 0);
  const bankVal   = (state.banks      || []).reduce((a, b) => a + (b.amount * (b.rateToIDR || 1)), 0);
  const goldVal   = (state.golds      || []).reduce((a, g) => a + (g.grams * (g.pricePerGram || 0)), 0);
  const propVal   = (state.properties || []).reduce((a, p) => a + p.value, 0);
  const legacyVal = (state.manual     || []).reduce((a, m) => a + m.value, 0);
  const manualVal = bankVal + goldVal + propVal + legacyVal;

  const rentIncome = (state.properties || [])
    .filter(p => p.status === 'disewakan')
    .reduce((a, p) => a + (p.rent || 0), 0);

  const annualDiv = state.stocks.reduce((a, s) => {
    const lotSize         = s.market === 'IDX' ? 100 : 1;
    const val             = s.price && !s.loading ? s.price * s.lots * lotSize : 0;
    const expDivOverride  = s.expDivPerShare || null;
    const autoDivPS       = s.divPerShareThis || s.divPerShareLast || 0;
    const divPerShare     = expDivOverride !== null ? expDivOverride : autoDivPS;
    const byPerShare      = divPerShare * s.lots * lotSize;
    const byYield         = val * ((s.divYieldTTM || 0) / 100);
    return a + (divPerShare ? byPerShare : byYield);
  }, 0);

  const liquidVal = stockVal + bankVal + goldVal;
  return { stockVal, manualVal, bankVal, goldVal, propVal, annualDiv, rentIncome, liquidVal, total: stockVal + manualVal };
}

// ── Main render dispatcher ────────────────────────────────────────────────────

function render() {
  renderStocks();
  renderBanks();
  renderGolds();
  renderProperties();
  renderSummary();
  recalcInsights();
}

// ── Stocks ────────────────────────────────────────────────────────────────────

function renderStocks() {
  const tb = document.getElementById('stock-tbody');
  if (!state.stocks.length) {
    tb.innerHTML = `<tr><td colspan="13" class="empty">${t('empty.stocks')}</td></tr>`;
    document.getElementById('stock-total').textContent = fmtShort(0);
    return;
  }

  let total = 0, totalAnnDiv = 0;

  tb.innerHTML = state.stocks.map((s, i) => {
    const shares   = s.lots * (s.market === 'IDX' ? 100 : 1);
    const val      = s.price && !s.loading ? s.price * shares : 0;
    total += val;

    // Yield display
    const divYield     = s.divYieldTTM || 0;
    const divYieldLast = s.divYieldLast != null ? s.divYieldLast : null;
    const yieldDisplay = divYield
      ? divYield.toFixed(2) + '%' + (divYieldLast != null ? ` <span style="color:var(--muted);font-size:10px">(${divYieldLast.toFixed(2)}%)</span>` : '')
      : (s.loading ? `<span class="price-loading">...</span>` : '—');

    // Div per share display
    const divPerShare = s.divPerShareThis || s.divPerShareLast || 0;
    const divPerShareDisplay = divPerShare
      ? fmtB(divPerShare) + (s.divSource === 'lastYear' ? ` <span style="color:var(--muted);font-size:10px">(ly)</span>` : '')
      : (s.loading ? `<span class="price-loading">...</span>` : '—');

    // Annual div
    const expDivOverride     = s.expDivPerShare || null;
    const effectiveDivPerShare = expDivOverride !== null ? expDivOverride : (s.divPerShareThis || s.divPerShareLast || 0);
    const annDiv             = effectiveDivPerShare ? effectiveDivPerShare * shares : val * (divYield / 100);
    totalAnnDiv += annDiv;

    // Price display (US stocks show USD; value column shows IDR)
    const fmtPrice = (p, cur) => {
      if (!p) return '—';
      if (cur === 'USD') return '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      return 'Rp ' + Math.round(p).toLocaleString('id-ID');
    };
    const displayPrice = s.priceUSD ? s.priceUSD : s.price;
    const displayCur   = s.priceUSD ? 'USD' : s.currency;
    const chgClass     = s.changePercent != null ? (s.changePercent >= 0 ? 'change-pos' : 'change-neg') : '';
    const chgStr       = s.changePercent != null
      ? ` <span class="${chgClass}" style="font-size:11px">${s.changePercent >= 0 ? '+' : ''}${s.changePercent.toFixed(1)}%</span>` : '';
    const priceDisplay = s.loading
      ? `<span class="price-loading">${t('status.loading')}</span>`
      : s.error && !s.price
        ? `<span class="red">${t('status.fetchError')}</span>`
        : fmtPrice(displayPrice, displayCur) + chgStr + (s.error ? ` <span style="color:var(--muted);font-size:10px">${t('status.cached')}</span>` : '');

    // P&L / ROI (buyPrice entered in USD for US stocks, IDR for IDX)
    const bp       = s.buyPrice || null;
    const bpIDR    = bp ? bp * (s.market === 'US' ? (fxData?.rates?.USD?.rateToIDR || 1) : 1) : null;
    const costBasis = bpIDR ? bpIDR * shares : null;
    const pl       = (bpIDR && val) ? val - costBasis : null;
    const roi      = (bpIDR && val) ? ((val - costBasis) / costBasis * 100) : null;
    const plCell   = pl !== null
      ? `<span class="${pl >= 0 ? 'change-pos' : 'change-neg'}">${pl >= 0 ? '+' : ''}${fmtShort(pl)}</span>`
      : '<span style="color:#4b5563">—</span>';
    const roiCell  = roi !== null
      ? `<span class="${roi >= 0 ? 'change-pos' : 'change-neg'}">${roi >= 0 ? '+' : ''}${roi.toFixed(1)}%</span>`
      : '<span style="color:#4b5563">—</span>';

    const sectorBadge = s.sector
      ? `<div style="font-size:9px;color:var(--muted);font-family:var(--mono);margin-top:2px">${s.sector}</div>` : '';
    const mktClass = s.market === 'US' ? 'mkt-us' : 'mkt-idx';

    return `<tr>
      <td class="ticker">${s.ticker.replace('.JK', '')}</td>
      <td><span class="mkt-badge ${mktClass}">${s.market === 'US' ? 'US' : 'IDX'}</span>${sectorBadge}</td>
      <td class="mono"><span onclick="startEditLot(${i},this)" class="editable">${s.market === 'US' ? +s.lots.toFixed(4) : s.lots}</span></td>
      <td class="mono right">${priceDisplay}</td>
      <td class="mono right">${val ? fmtShort(val) : '—'}</td>
      <td class="mono right amber">${yieldDisplay}</td>
      <td class="mono right">${divPerShareDisplay}</td>
      <td class="mono right">${annDiv ? fmtShort(annDiv) : '—'}</td>
      <td class="right"><input class="exp-div-input" type="number" min="0" step="any" value="${bp || ''}" onchange="setBuyPrice(${i},this.value)" title="${t('tip.buyPrice')}"></td>
      <td class="mono right">${plCell}</td>
      <td class="mono right">${roiCell}</td>
      <td class="right"><input class="exp-div-input" type="number" min="0" step="any" value="${s.expDivPerShare || ''}" onchange="setExpDiv(${i},this.value)" title="${t('tip.expDiv')}"></td>
      <td class="right"><button class="btn-sm" onclick="removeStock(${i})">✕</button></td>
    </tr>`;
  }).join('') + (totalAnnDiv ? `
    <tr style="border-top:1px solid var(--border);background:var(--surface2)">
      <td colspan="7" style="font-size:12px;color:var(--muted);font-family:var(--mono);padding:8px 12px">${t('div.est')}</td>
      <td class="mono right" style="color:var(--accent);padding:8px 12px">${fmtShort(totalAnnDiv)}<span style="color:var(--muted);font-size:10px">${t('div.perYear')}</span></td>
      <td class="mono right" style="color:var(--muted);font-size:12px;padding:8px 12px">${fmtShort(totalAnnDiv / 12)}<span style="font-size:10px">${t('div.perMonth')}</span></td>
      <td colspan="4"></td>
    </tr>` : '');

  document.getElementById('stock-total').textContent = fmtShort(total);
}

// ── Banks ─────────────────────────────────────────────────────────────────────

function pctChange(cur, ref) {
  if (!cur || !ref) return null;
  return parseFloat(((cur - ref) / ref * 100).toFixed(2));
}
function pctCell(v) {
  if (v === null || v === undefined) return '<span style="color:#9ca3af">—</span>';
  const cls = v >= 0 ? 'change-pos' : 'change-neg';
  return `<span class="${cls}">${v >= 0 ? '+' : ''}${v.toFixed(2)}%</span>`;
}

function renderBanks() {
  const tb = document.getElementById('bank-tbody');
  let total = 0;
  if (!(state.banks || []).length) {
    tb.innerHTML = `<tr><td colspan="7" class="empty">${t('empty.bank')}</td></tr>`;
    document.getElementById('bank-total').textContent = fmtShort(0);
    return;
  }
  tb.innerHTML = state.banks.map((b, i) => {
    const rate       = b.rateToIDR || (b.currency === 'IDR' ? 1 : null);
    const val        = rate ? b.amount * rate : 0;
    total += val;
    const fmtNative  = b.currency === 'IDR'
      ? 'Rp ' + Math.round(b.amount).toLocaleString('id-ID')
      : b.amount.toLocaleString('en-US', { maximumFractionDigits: 2 }) + ' ' + b.currency;
    const bc = state.baseCurrency || 'IDR';
    let rateDisplay;
    if (!rate) {
      rateDisplay = `<span style="color:#9ca3af">${t('status.fetchFX')}</span>`;
    } else if (b.currency === bc) {
      rateDisplay = '—';                                           // same currency, no conversion
    } else if (b.currency === 'IDR') {
      // IDR account: show IDR-per-base (e.g. "Rp 17.491/USD") — more intuitive than $0.000057/IDR
      rateDisplay = 'Rp ' + Math.round(getBaseRate()).toLocaleString('id-ID') + '/' + bc;
    } else {
      // Foreign-currency account: show how much 1 unit is worth in base
      const sym   = CURRENCY_SYMS[bc] || bc;
      const ratio = rate / getBaseRate();
      const dec   = ratio < 0.01 ? 6 : ratio < 1 ? 4 : 2;
      rateDisplay = sym + ratio.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: dec }) + '/' + b.currency;
    }
    return `<tr>
      <td><span onclick="startEditBankName(${i},this)" class="editable">${esc(b.name)}</span></td>
      <td><span class="badge badge-green">${b.currency}</span></td>
      <td class="mono right"><span onclick="startEditBankAmount(${i},this)" class="editable">${fmtNative}</span></td>
      <td class="mono right">${rateDisplay}</td>
      <td class="mono right">${val ? fmtShort(val) : '—'}</td>
      <td class="mono right">${pctCell(b.change24h)}</td>
      <td class="right"><button class="btn-sm" onclick="removeBank(${i})">✕</button></td>
    </tr>`;
  }).join('');
  document.getElementById('bank-total').textContent = fmtShort(total);
}

// ── Gold ──────────────────────────────────────────────────────────────────────

function renderGolds() {
  const tb = document.getElementById('gold-tbody');
  let total = 0;
  if (!(state.golds || []).length) {
    tb.innerHTML = `<tr><td colspan="9" class="empty">${t('empty.gold')}</td></tr>`;
    document.getElementById('gold-total').textContent = fmtShort(0);
    return;
  }
  tb.innerHTML = state.golds.map((g, i) => {
    const ppg = g.pricePerGram || (goldData ? goldData.pricePerGram : null);
    const val = ppg ? g.grams * ppg : 0;
    total += val;
    const ch = g.change || (goldData ? goldData.change : {});
    return `<tr>
      <td><span onclick="startEditGoldName(${i},this)" class="editable">${esc(g.name)}</span></td>
      <td class="mono right"><span onclick="startEditGoldGrams(${i},this)" class="editable">${g.grams}g</span></td>
      <td class="mono right">${ppg ? fmtShort(ppg) + '/g' : `<span style="color:#9ca3af">${t('status.fetching')}</span>`}</td>
      <td class="mono right">${val ? fmtShort(val) : '—'}</td>
      <td class="mono right">${pctCell(ch && ch.h24)}</td>
      <td class="mono right">${pctCell(ch && ch.m1)}</td>
      <td class="mono right">${pctCell(ch && ch.ytd)}</td>
      <td class="mono right">${pctCell(ch && ch.y1)}</td>
      <td class="right"><button class="btn-sm" onclick="removeGold(${i})">✕</button></td>
    </tr>`;
  }).join('');
  document.getElementById('gold-total').textContent = fmtShort(total);
}

// ── Properties ────────────────────────────────────────────────────────────────

function renderProperties() {
  const tb = document.getElementById('property-tbody');
  let total = 0;
  if (!(state.properties || []).length) {
    tb.innerHTML = `<tr><td colspan="7" class="empty">${t('empty.property')}</td></tr>`;
    document.getElementById('property-total').textContent = fmtShort(0);
    return;
  }
  let totalRent = 0;
  const statusLabel = { dihuni: t('status.occupied'), disewakan: t('status.rented'), kosong: t('status.vacant') };
  const statusBadge = { dihuni: 'badge-cyan', disewakan: 'badge-green', kosong: 'badge-gray' };

  tb.innerHTML = state.properties.map((p, i) => {
    total += p.value;
    if (p.status === 'disewakan') totalRent += (p.rent || 0);
    const snaps    = p.snapshots || [];
    const prevSnap = snaps.length > 1 ? snaps[snaps.length - 2] : null;
    const vsSnap   = prevSnap ? pctChange(p.value, prevSnap.value) : null;
    const vsSnapCell = vsSnap !== null
      ? pctCell(vsSnap) + ` <span style="font-size:10px;color:#9ca3af">vs ${prevSnap.date}</span>`
      : '<span style="color:#9ca3af">—</span>';
    return `<tr>
      <td><span onclick="startEditPropName(${i},this)" class="editable">${esc(p.name)}</span></td>
      <td style="color:#9ca3af;font-size:13px">${esc(p.location) || '—'}</td>
      <td><span class="badge ${statusBadge[p.status] || 'badge-gray'}">${statusLabel[p.status] || p.status}</span></td>
      <td class="mono right"><span onclick="startEditPropValue(${i},this)" class="editable">${fmtShort(p.value)}</span></td>
      <td class="mono right">${p.rent ? fmtShort(p.rent) + '<span style="font-size:10px;color:#9ca3af">/bln</span>' : '—'}</td>
      <td class="mono right">${vsSnapCell}</td>
      <td class="right"><button class="btn-sm" onclick="removeProperty(${i})">✕</button></td>
    </tr>`;
  }).join('') + (totalRent ? `
    <tr style="border-top:1px solid var(--border);background:var(--surface2)">
      <td colspan="4" style="font-size:12px;color:var(--muted);font-family:var(--mono);padding:8px 12px">${t('rent.est')}</td>
      <td class="mono right" style="color:var(--accent);padding:8px 12px">${fmtShort(totalRent)}<span style="color:var(--muted);font-size:10px">${t('div.perMonth')}</span></td>
      <td colspan="2"></td>
    </tr>` : '');
  document.getElementById('property-total').textContent = fmtShort(total);
}

// ── Summary cards ─────────────────────────────────────────────────────────────

function renderSummary() {
  const { stockVal, manualVal, bankVal, goldVal, propVal, annualDiv, rentIncome, total } = getTotals();
  const totalPassive = (annualDiv / 12) + rentIncome;
  const yieldPct     = total && annualDiv ? ((annualDiv / total) * 100).toFixed(2) : 0;

  document.getElementById('total-nw').textContent     = total ? fmtShort(total) : currSym() + ' —';
  document.getElementById('nw-breakdown').textContent  = total
    ? `${t('alloc.stocks')} ${fmtShort(stockVal)} · ${t('alloc.bank')} ${fmtShort(bankVal)} · ${t('alloc.gold')} ${fmtShort(goldVal)} · ${t('alloc.property')} ${fmtShort(propVal)}`
    : t('summary.addAssets');
  document.getElementById('monthly-div').textContent   = totalPassive ? fmtShort(totalPassive) : currSym() + ' —';
  document.getElementById('yield-pct').textContent     = yieldPct ? yieldPct + '%' : '— %';
}

// ── Insights ──────────────────────────────────────────────────────────────────

function recalcInsights() {
  const { annualDiv, total, rentIncome, liquidVal } = getTotals();
  const totalMonthly = (annualDiv / 12) + rentIncome;
  const annualPassive = annualDiv + (rentIncome * 12);
  const spend = parseFloat(document.getElementById('monthly-spend')?.value) || 15000000;

  document.getElementById('i-monthly').textContent = totalMonthly ? fmtShort(totalMonthly) : currSym() + ' —';
  document.getElementById('i-annual').textContent  = annualPassive ? fmtShort(annualPassive) : currSym() + ' —';

  const spendEl = document.getElementById('spend-display');
  if (spendEl) spendEl.textContent = fmtB(spend);

  document.getElementById('i-fire').textContent = fmtShort(spend * 12 * 25);
  document.getElementById('i-swr').textContent  = liquidVal ? fmtShort(liquidVal * 0.04 / 12) : currSym() + ' —';

  // FIRE progress bar
  const pct = spend ? Math.min((totalMonthly / spend) * 100, 100) : 0;
  document.getElementById('fire-bar').style.width            = pct.toFixed(1) + '%';
  document.getElementById('fire-progress-label').textContent = t('progress.passive') + fmtShort(totalMonthly) + t('div.perMonth');
  document.getElementById('fire-target-label').textContent   = t('progress.target') + fmtShort(spend) + t('div.perMonth');
  document.getElementById('fire-pct-label').textContent      = pct.toFixed(1) + '% ' + t('insight.pctFire');

  // Passive income breakdown
  const brkEl = document.getElementById('i-passive-breakdown');
  if (brkEl) {
    const divMo = Math.round(annualDiv / 12);
    const parts = [];
    if (divMo > 0)      parts.push(`<span style="color:var(--accent)">📊 ${t('div.est')} &nbsp;${fmtB(divMo)}${t('div.perMonth')}</span>`);
    if (rentIncome > 0) parts.push(`<span style="color:var(--accent3)">🏠 ${t('rent.est')} &nbsp;${fmtB(rentIncome)}${t('div.perMonth')}</span>`);
    brkEl.innerHTML = parts.join('<br>');
  }

  renderAllocation();
  renderSectorBreakdown();
  renderDonut();
  renderCurrencyDonut();
  renderSectorDonut();
  renderFireAnalysis();
}

// ── Allocation bars ───────────────────────────────────────────────────────────

function renderAllocation() {
  const { stockVal, bankVal, goldVal, propVal, total } = getTotals();
  const el = document.getElementById('alloc-bars');
  if (!total) { el.innerHTML = `<div class="empty">${t('empty.allocation')}</div>`; return; }
  const rows = [
    { label: t('alloc.stocks'),   val: stockVal,  color: 'var(--accent2)' },
    { label: t('alloc.bank'),     val: bankVal,   color: 'var(--accent)'  },
    { label: t('alloc.gold'),     val: goldVal,   color: '#f59e0b'        },
    { label: t('alloc.property'), val: propVal,   color: '#a78bfa'        },
  ].filter(r => r.val > 0);
  el.innerHTML = rows.map(r => {
    const pct = ((r.val / total) * 100).toFixed(1);
    return `<div class="alloc-row">
      <div class="alloc-label" style="color:${r.color}">${r.label}</div>
      <div class="alloc-bar-bg"><div class="alloc-bar" style="width:${pct}%;background:${r.color}"></div></div>
      <div class="alloc-pct">${pct}%</div>
      <div class="alloc-val">${fmtShort(r.val)}</div>
    </div>`;
  }).join('');
}

// ── Sector breakdown bars ─────────────────────────────────────────────────────

function renderSectorBreakdown() {
  const el = document.getElementById('sector-bars');
  if (!el) return;
  const stocks = state.stocks.filter(s => s.price && !s.loading && s.sector);
  if (!stocks.length) { el.innerHTML = `<div class="empty">${t('empty.sector')}</div>`; return; }
  const sectors = {};
  let total = 0;
  stocks.forEach(s => {
    const val = s.price * s.lots * (s.market === 'IDX' ? 100 : 1);
    const sec = s.sector || 'Unknown';
    sectors[sec] = (sectors[sec] || 0) + val;
    total += val;
  });
  const colors = ['var(--accent)', 'var(--accent2)', 'var(--accent3)', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#60a5fa', '#e879f9', '#facc15'];
  const rows   = Object.entries(sectors).sort((a, b) => b[1] - a[1]);
  el.innerHTML = rows.map(([sec, val], i) => {
    const pct   = ((val / total) * 100).toFixed(1);
    const color = colors[i % colors.length];
    return `<div class="alloc-row">
      <div class="alloc-label" style="color:${color};width:120px">${sec}</div>
      <div class="alloc-bar-bg"><div class="alloc-bar" style="width:${pct}%;background:${color}"></div></div>
      <div class="alloc-pct">${pct}%</div>
      <div class="alloc-val">${fmtShort(val)}</div>
    </div>`;
  }).join('');
}

// ── Donut charts ──────────────────────────────────────────────────────────────

function drawDonut(canvasId, legendId, segments, centerLabel) {
  const canvas = document.getElementById(canvasId);
  const legend = document.getElementById(legendId);
  if (!canvas) return;
  const total = segments.reduce((a, s) => a + s.val, 0);
  const SIZE = 160, cx = 80, cy = 80, R = 68, r = 42;
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);
  if (!total) {
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.fillStyle = '#1c2030'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 2 * Math.PI);
    ctx.strokeStyle = '#ffffff10'; ctx.lineWidth = R - r; ctx.stroke();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#4b5563'; ctx.font = '9px DM Mono,monospace';
    ctx.fillText(t('donut.noData'), cx, cy);
    if (legend) legend.innerHTML = '<div style="color:var(--muted);font-size:11px;text-align:center">—</div>';
    return;
  }
  let angle = -Math.PI / 2;
  const GAP = 0.022;
  segments.forEach(seg => {
    const slice = (seg.val / total) * 2 * Math.PI - GAP;
    ctx.beginPath(); ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, R, angle, angle + slice);
    ctx.closePath(); ctx.fillStyle = seg.color; ctx.fill();
    angle += slice + GAP;
  });
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, 2 * Math.PI);
  ctx.fillStyle = '#1c2030'; ctx.fill();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#6b7280'; ctx.font = '8px DM Mono,monospace';
  ctx.fillText(centerLabel, cx, cy - 8);
  const top = segments.reduce((a, b) => b.val > a.val ? b : a);
  ctx.fillStyle = top.color; ctx.font = 'bold 13px DM Mono,monospace';
  ctx.fillText((top.val / total * 100).toFixed(0) + '%', cx, cy + 8);
  if (legend) legend.innerHTML = segments.map(s => {
    const pct = (s.val / total * 100).toFixed(1);
    return `<div class="donut-legend-row">
      <div class="donut-dot" style="background:${s.color}"></div>
      <div style="flex:1;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${s.label}</div>
      <div style="color:var(--accent2);flex-shrink:0;margin-left:4px">${pct}%</div>
    </div>`;
  }).join('');
}

function renderDonut() {
  const { stockVal, bankVal, goldVal, propVal } = getTotals();
  const segs = [
    { label: t('alloc.stocks'),   val: stockVal,  color: '#22d3ee' },
    { label: t('alloc.bank'),     val: bankVal,   color: '#4ade80' },
    { label: t('alloc.gold'),     val: goldVal,   color: '#fbbf24' },
    { label: t('alloc.property'), val: propVal,   color: '#a78bfa' },
  ].filter(s => s.val > 0);
  drawDonut('donut-canvas', 'donut-legend', segs, t('donut.mix'));
}

function renderCurrencyDonut() {
  let idrVal = 0, usdVal = 0, otherVal = 0;
  state.stocks.filter(s => s.price && !s.loading).forEach(s => {
    const val = s.price * s.lots * (s.market === 'IDX' ? 100 : 1);
    if (s.market === 'IDX') idrVal += val; else usdVal += val;
  });
  (state.banks || []).forEach(b => {
    const val = b.amount * (b.rateToIDR || 1);
    if      (b.currency === 'IDR') idrVal  += val;
    else if (b.currency === 'USD') usdVal  += val;
    else                           otherVal += val;
  });
  (state.golds      || []).forEach(g => idrVal += g.grams * (g.pricePerGram || 0));
  (state.properties || []).forEach(p => idrVal += p.value);
  const segs = [
    { label: 'IDR',          val: idrVal,   color: '#4ade80' },
    { label: 'USD',          val: usdVal,   color: '#f59e0b' },
    { label: t('curr.other'),val: otherVal, color: '#a78bfa' },
  ].filter(s => s.val > 0);
  drawDonut('currency-canvas', 'currency-legend', segs, t('donut.currency'));
}

function renderSectorDonut() {
  const stocks = state.stocks.filter(s => s.price && !s.loading);
  const colors = ['#22d3ee', '#f59e0b', '#4ade80', '#a78bfa', '#f472b6', '#34d399', '#fb923c', '#60a5fa'];
  const sectors = {};
  stocks.forEach(s => {
    const val = s.price * s.lots * (s.market === 'IDX' ? 100 : 1);
    const sec = s.sector || 'Unknown';
    sectors[sec] = (sectors[sec] || 0) + val;
  });
  const segs = Object.entries(sectors)
    .sort((a, b) => b[1] - a[1])
    .map(([label, val], i) => ({ label, val, color: colors[i % colors.length] }));
  drawDonut('sector-canvas', 'sector-donut-legend', segs, t('donut.sector'));
}

// ── Settings chips (called from actions.js and setCurrency/setLang) ───────────

function renderSettingsChips() {
  // Currency chips
  const cc  = document.getElementById('currency-chips');
  if (cc) {
    const cur = state.baseCurrency || 'IDR';
    cc.innerHTML = Object.keys(CURRENCY_SYMS).map(c =>
      `<button class="setting-chip${c === cur ? ' active-chip' : ''}" onclick="setCurrency('${c}')">${c}</button>`
    ).join('');
  }
  // Language buttons
  ['en', 'id'].forEach(l => {
    const btn = document.getElementById(`lang-btn-${l}`);
    if (btn) btn.classList.toggle('active-chip', currentLang === l);
  });
}
