'use strict';

// ── Worker fetch wrapper ──────────────────────────────────────────────────────

/** Fetch from Cloudflare Worker. Shows a helpful message when running via file://. */
async function workerFetch(path) {
  try {
    const r = await fetch(WORKER_URL + path);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return await r.json();
  } catch (e) {
    if (location.protocol === 'file:') {
      console.warn('⚠ File:// CORS blocked. Open via VS Code Live Server or a local server.');
    }
    throw e;
  }
}

// ── Stock price fetching ──────────────────────────────────────────────────────

/** Batch-fetch prices + dividends for an array of ticker strings. */
async function fetchAllStockPrices(tickers) {
  if (!tickers.length) return {};
  const symbols = tickers.map(t => t.toUpperCase());
  try {
    return await workerFetch(`/price?symbol=${symbols.join(',')}`);
  } catch (e) {
    console.warn('Worker batch fetch failed:', e.message);
    return {};
  }
}

/** Fetch a single ticker (used when adding a new stock). */
async function fetchStockPrice(ticker) {
  const data = await fetchAllStockPrices([ticker]);
  const key  = Object.keys(data)[0];
  if (!key || !data[key] || !data[key].price) return null;
  const d = data[key];
  return {
    price:            d.price,
    currency:         d.currency,
    changePercent:    d.changePercent,
    divYieldTTM:      d.divYieldTTM,
    divYieldLast:     d.divYieldLast,
    divPerShareThis:  d.divPerShareThis,
    divPerShareLast:  d.divPerShareLast,
    divSource:        d.divSource,
    market:           d.market,
    sector:           d.sector,
    industry:         d.industry,
  };
}



// ── FX application ────────────────────────────────────────────────────────────

/**
 * Apply USD→IDR conversion to a stock object in-place using current fxData.
 * For US stocks the worker returns prices in USD; we store IDR for all calculations.
 */
function applyFXToStock(s, res) {
  const usdRate = fxData?.rates?.USD?.rateToIDR || null;
  const isUSD   = res.currency === 'USD';

  s.market         = res.market;
  s.currency       = res.currency || 'IDR';
  s.changePercent  = res.changePercent;
  s.divYieldTTM    = res.divYieldTTM;
  s.divYieldLast   = res.divYieldLast;
  s.divSource      = res.divSource;
  s.sector         = res.sector   || s.sector;
  s.industry       = res.industry || s.industry;
  s.error          = false;

  if (isUSD && usdRate) {
    s.priceUSD        = res.price;
    s.price           = res.price * usdRate;
    s.divPerShareThis = res.divPerShareThis ? res.divPerShareThis * usdRate : null;
    s.divPerShareLast = res.divPerShareLast ? res.divPerShareLast * usdRate : null;
  } else {
    s.priceUSD        = null;
    s.price           = res.price;
    s.divPerShareThis = res.divPerShareThis;
    s.divPerShareLast = res.divPerShareLast;
  }
  return s;
}

// ── Refresh rate-limit (5 min cooldown) ───────────────────────────────────────

let _lastRefresh    = 0;
let _cooldownTimer  = null;
const REFRESH_COOLDOWN = 5 * 60 * 1000; // 5 minutes

function _startCooldown() {
  const btn   = document.getElementById('refresh-btn');
  const label = document.getElementById('refresh-label');
  if (btn) btn.disabled = true;

  if (_cooldownTimer) clearInterval(_cooldownTimer);
  _cooldownTimer = setInterval(() => {
    const remaining = REFRESH_COOLDOWN - (Date.now() - _lastRefresh);
    if (remaining <= 0) {
      clearInterval(_cooldownTimer);
      _cooldownTimer = null;
      if (btn)   btn.disabled      = false;
      if (label) label.textContent = t('header.refresh');
      return;
    }
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    if (label) label.textContent = `${m}:${String(s).padStart(2, '0')}`;
  }, 1000);
}

// ── Main refresh ──────────────────────────────────────────────────────────────

async function refreshAll() {
  // Enforce 5-minute cooldown (skip silently if too soon)
  const now = Date.now();
  if (_lastRefresh > 0 && (now - _lastRefresh) < REFRESH_COOLDOWN) return;
  _lastRefresh = now;
  _startCooldown();

  const icon = document.getElementById('refresh-icon');
  icon.className = 'spin'; icon.textContent = '↻';

  // 1. Fetch FX first — USD→IDR rate must be ready before stock conversion
  try {
    fxData = await workerFetch('/fx');
    (state.banks || []).forEach((b, i) => {
      if (b.currency !== 'IDR' && fxData.rates?.[b.currency]) {
        state.banks[i].rateToIDR  = fxData.rates[b.currency].rateToIDR;
        state.banks[i].change24h  = fxData.rates[b.currency].change24h;
      }
    });
  } catch (e) {
    console.warn('FX fetch failed:', e.message);
  }

  // 2. Fetch stock prices (FX now available for conversion)
  if (state.stocks.length) {
    state.stocks.forEach((s, i) => { state.stocks[i].loading = true; });
    render();
    const tickers   = state.stocks.map(s => s.ticker);
    const priceData = await fetchAllStockPrices(tickers);
    state.stocks.forEach((s, i) => {
      state.stocks[i].loading = false;
      const res = priceData[s.ticker.toUpperCase()];
      if (res && res.price) {
        applyFXToStock(state.stocks[i], res);
      } else {
        state.stocks[i].error = !state.stocks[i].price;
      }
    });
  }

  // 3. Gold
  await Promise.all([
    workerFetch('/gold').then(d => {
      if (d.pricePerGram) {
        goldData = d;
        (state.golds || []).forEach((g, i) => {
          state.golds[i].pricePerGram = d.pricePerGram;
          state.golds[i].change       = d.change || null;
        });
        const el = document.getElementById('gold-price-display');
        if (el) el.textContent = 'XAU: ' + fmtB(d.pricePerGram) + '/gram';
      }
    }).catch(e => console.warn('Gold fetch failed:', e.message))
  ]);

  const lu = document.getElementById('last-update');
  if (lu) lu.textContent = t('header.updated') + new Date().toLocaleTimeString('id-ID');
  icon.className = ''; icon.textContent = '↻';
  save();
  render();
}
