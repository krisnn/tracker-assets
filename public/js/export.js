'use strict';

// ── FIRE Analysis ─────────────────────────────────────────────────────────────

function renderFireAnalysis() {
  const el = document.getElementById('fire-analysis');
  if (!el) return;
  const { annualDiv, total, rentIncome, propVal, liquidVal } = getTotals();
  const totalMonthly = (annualDiv / 12) + rentIncome;
  const spend = parseFloat(document.getElementById('monthly-spend')?.value) || 15000000;
  const gap   = spend - totalMonthly;

  if (!total) { el.innerHTML = `<div class="empty">${t('empty.addAssets')}</div>`; return; }

  const tips = [];

  // Gap / achievement
  if (gap > 0) {
    tips.push(`<div class="fire-tip">${t('fire.needIncome', fmtB(gap))}</div>`);
  } else {
    tips.push(`<div class="fire-tip tip-green">${t('fire.achieved')}</div>`);
  }

  // Required yield on total NW
  if (total > 0) {
    tips.push(`<div class="fire-tip">${t('fire.reqYield', (spend * 12 / total * 100).toFixed(1))}</div>`);
  }

  // Property concentration warning (> 50%)
  if (total > 0 && propVal / total > 0.5) {
    tips.push(`<div class="fire-tip tip-amber">${t('fire.propConc', (propVal / total * 100).toFixed(0))}</div>`);
  }

  // Effective liquid yield
  if (liquidVal > 0 && totalMonthly > 0) {
    tips.push(`<div class="fire-tip">${t('fire.liqYield', (totalMonthly * 12 / liquidVal * 100).toFixed(1))}</div>`);
  }

  // Extra capital needed at current yield to close gap
  if (gap > 0 && liquidVal > 0 && totalMonthly > 0) {
    const curYield     = totalMonthly * 12 / liquidVal;
    const neededCapital = Math.round(gap * 12 / curYield);
    tips.push(`<div class="fire-tip">${t('fire.addCapital', fmtB(neededCapital), (curYield * 100).toFixed(1))}</div>`);
  }

  // Diversification nudge if only 1 asset type
  const activeTypes = [
    state.stocks.length,
    (state.banks || []).length, (state.golds || []).length, (state.properties || []).length,
  ].filter(v => v > 0).length;
  if (activeTypes <= 1) {
    tips.push(`<div class="fire-tip tip-amber">${t('fire.diversify')}</div>`);
  }

  el.innerHTML = tips.join('');
}

// ── CSV Export ────────────────────────────────────────────────────────────────

function exportCSV() {
  const { total } = getTotals();
  const date = new Date().toISOString().split('T')[0];
  const rows = [[
    t('csv.type'), t('csv.name'), t('csv.market'), t('csv.qty'),
    t('csv.priceIDR'), t('csv.valueIDR'), t('csv.buyPrice'),
    t('csv.pl'), t('csv.roi'), t('csv.divYield'), t('csv.annualDiv'),
  ]];

  state.stocks.forEach(s => {
    const shares  = s.lots * (s.market === 'IDX' ? 100 : 1);
    const val     = s.price ? s.price * shares : 0;
    const bp      = s.buyPrice || '';
    const bpIDR   = bp ? bp * (s.market === 'US' ? (fxData?.rates?.USD?.rateToIDR || 1) : 1) : null;
    const pl      = (bpIDR && val) ? Math.round(val - bpIDR * shares) : '';
    const roi     = (bpIDR && val) ? ((val - bpIDR * shares) / (bpIDR * shares) * 100).toFixed(1) : '';
    const annDiv  = Math.round(((s.divPerShareThis || s.divPerShareLast || 0) * shares) || 0) || '';
    rows.push([
      t('alloc.stocks'), s.ticker.replace('.JK', ''), s.market, s.lots,
      Math.round(s.price || 0), Math.round(val), bp, pl, roi,
      (s.divYieldTTM || 0).toFixed(2), annDiv,
    ]);
  });



  (state.banks || []).forEach(b => {
    const val = b.amount * (b.rateToIDR || 1);
    rows.push([t('alloc.bank'), b.name, b.currency, b.amount, Math.round(b.rateToIDR || 0), Math.round(val), '', '', '', '', '']);
  });

  (state.golds || []).forEach(g => {
    const val = g.grams * (g.pricePerGram || 0);
    rows.push([t('alloc.gold'), g.name, '—', g.grams + 'g', Math.round(g.pricePerGram || 0), Math.round(val), '', '', '', '', '']);
  });

  (state.properties || []).forEach(p => {
    rows.push([t('alloc.property'), p.name, p.location || '—', '—', '—', Math.round(p.value), '', '', '', '', '']);
  });

  rows.push([]);
  rows.push([t('csv.totalNW'), '', '', '', '', Math.round(total), '', '', '', '', '']);
  rows.push([t('csv.exportDate'), '', date, '', '', '', '', '', '', '', '']);

  const csv  = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'networth-' + date + '.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

// ── PDF / Print Export ────────────────────────────────────────────────────────

function exportPDF() {
  const hi       = document.getElementById('tab-insights');
  const wasHidden = hi.style.display === 'none';
  if (wasHidden) hi.style.display = 'block';
  window.print();
  if (wasHidden) setTimeout(() => { hi.style.display = 'none'; }, 300);
}
