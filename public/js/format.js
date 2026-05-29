'use strict';

// ── Base-currency formatting helpers ─────────────────────────────────────────

/** Returns the exchange rate to convert 1 IDR → baseCurrency (i.e. divide IDR values by this). */
function getBaseRate() {
  const bc = state?.baseCurrency || 'IDR';
  if (bc === 'IDR') return 1;
  return fxData?.rates?.[bc]?.rateToIDR || 1;
}

/** Convert an IDR value to the current base currency. */
function toBase(v) { return (v || 0) / getBaseRate(); }

/** Format an IDR value in the current base currency. */
function fmtB(idrVal) {
  const bc  = state?.baseCurrency || 'IDR';
  const v   = toBase(idrVal);
  if (bc === 'IDR') return 'Rp ' + Math.round(v).toLocaleString('id-ID');
  if (bc === 'JPY') return '¥'   + Math.round(v).toLocaleString('en-US');
  const sym = CURRENCY_SYMS[bc] || (bc + ' ');
  return sym + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Shorthand — same as fmtB but always accepts 0 gracefully. */
function fmtShort(n) { return fmtB(n || 0); }

/** Returns the currency symbol for the current base currency. */
function currSym() { return CURRENCY_SYMS[state?.baseCurrency || 'IDR'] || 'Rp'; }

/**
 * Switch the display currency. If fxData is not loaded yet and the
 * new currency is not IDR, auto-fetch /fx first so conversions are correct.
 */
async function setCurrency(bc) {
  state.baseCurrency = bc;
  save();
  if (bc !== 'IDR' && !fxData) {
    try { fxData = await workerFetch('/fx'); } catch (e) {}
  }
  applyLang();   // refresh column headers that embed currency name (e.g. "Value (USD)")
  render();
  renderSettingsChips();
}
