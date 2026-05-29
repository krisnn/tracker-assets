'use strict';

// ── Error helper ──────────────────────────────────────────────────────────────

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = '⚠ ' + msg; el.style.display = 'block'; }
}

// ── Stocks ────────────────────────────────────────────────────────────────────

function addStock() {
  const raw    = document.getElementById('s-ticker').value.trim().toUpperCase().replace('.JK', '');
  if (!raw) { showErr('stock-error', 'Masukkan ticker'); return; }
  const mkt    = document.getElementById('s-market').value; // 'IDX' or 'US'
  const ticker = mkt === 'IDX' ? raw + '.JK' : raw;
  const lotsRaw = document.getElementById('s-lots').value;
  const lots   = mkt === 'US' ? (parseFloat(lotsRaw) || 1) : (parseInt(lotsRaw) || 1);
  if (state.stocks.find(s => s.ticker === ticker)) {
    showErr('stock-error', ticker + ' sudah ada'); return;
  }
  state.stocks.push({
    ticker, lots, market: mkt,
    price: null, currency: mkt === 'IDX' ? 'IDR' : 'USD',
    loading: true, error: false,
    divYieldTTM: null, divYieldLast: null,
    divPerShareThis: null, divPerShareLast: null, divSource: null,
    expDivPerShare: null, sector: null, industry: null,
    buyPrice: null, divReceived: null,
  });
  document.getElementById('s-ticker').value = '';
  document.getElementById('stock-error').style.display = 'none';
  save(); render();
  const i = state.stocks.length - 1;
  fetchStockPrice(ticker).then(res => {
    state.stocks[i].loading = false;
    if (res && res.price) {
      applyFXToStock(state.stocks[i], res);
    } else {
      state.stocks[i].error = !state.stocks[i].price;
    }
    save(); render();
  });
}

function removeStock(i)  { state.stocks.splice(i, 1);  save(); render(); }

function updateLotsInput(mkt) {
  const el = document.getElementById('s-lots');
  if (mkt === 'US') { el.step = 'any'; el.min = '0.0001'; }
  else              { el.step = '1';   el.min = '1'; el.value = Math.max(1, parseInt(el.value) || 1); }
}

function startEditLot(i, el) {
  const cur  = state.stocks[i].lots;
  const isUS = state.stocks[i].market === 'US';
  const input = document.createElement('input');
  input.type  = 'number';
  input.min   = isUS ? '0.0001' : '1';
  input.step  = isUS ? 'any'    : '1';
  input.value = cur;
  input.className = 'lot-edit';
  el.replaceWith(input);
  input.focus(); input.select();
  function commit() {
    const v = isUS ? (parseFloat(input.value) || cur) : (parseInt(input.value) || cur);
    state.stocks[i].lots = v;
    save(); render();
  }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter')  commit();
    if (e.key === 'Escape') render();
  });
}

function setExpDiv(i, val)   { state.stocks[i].expDivPerShare = parseFloat(val) || null; save(); render(); }
function setBuyPrice(i, val) { state.stocks[i].buyPrice       = parseFloat(val) || null; save(); render(); }

// ── Generic inline editors ────────────────────────────────────────────────────

function _inlineNum(el, cur, isFloat, onCommit) {
  const input = document.createElement('input');
  input.type = 'number'; input.step = isFloat ? 'any' : '1'; input.min = '0';
  input.value = cur; input.className = 'lot-edit';
  el.replaceWith(input); input.focus(); input.select();
  function commit() {
    const v = isFloat ? (parseFloat(input.value) || cur) : (parseInt(input.value) || cur);
    onCommit(v);
  }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') render(); });
}

function _inlineText(el, cur, onCommit) {
  const input = document.createElement('input');
  input.type = 'text'; input.value = cur; input.className = 'lot-edit'; input.style.minWidth = '80px';
  el.replaceWith(input); input.focus(); input.select();
  function commit() { const v = input.value.trim() || cur; onCommit(v); }
  input.addEventListener('blur', commit);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') render(); });
}



// ── Banks ─────────────────────────────────────────────────────────────────────

function addBank() {
  const name     = document.getElementById('b-name').value.trim();
  const currency = document.getElementById('b-currency').value;
  const amount   = parseFloat(document.getElementById('b-amount').value) || 0;
  if (!name || !amount) return;
  const rate    = fxData?.rates?.[currency]?.rateToIDR ?? (currency === 'IDR' ? 1 : null);
  const change  = fxData?.rates?.[currency]?.change24h ?? null;
  state.banks.push({ name, currency, amount, rateToIDR: rate, change24h: change });
  document.getElementById('b-name').value   = '';
  document.getElementById('b-amount').value = '0';
  save(); render();
}

function removeBank(i) { state.banks.splice(i, 1); save(); render(); }

function startEditBankAmount(i, el) {
  _inlineNum(el, state.banks[i].amount, true, v => { state.banks[i].amount = v; save(); render(); });
}
function startEditBankName(i, el) {
  _inlineText(el, state.banks[i].name, v => { state.banks[i].name = v; save(); render(); });
}

// ── Gold ──────────────────────────────────────────────────────────────────────

function addGold() {
  const name  = document.getElementById('g-name').value.trim();
  const grams = parseFloat(document.getElementById('g-grams').value) || 0;
  if (!name || !grams) return;
  state.golds.push({
    name, grams,
    pricePerGram: goldData ? goldData.pricePerGram : null,
    change:       goldData ? goldData.change       : null,
  });
  document.getElementById('g-name').value  = '';
  document.getElementById('g-grams').value = '0';
  save(); render();
}

function removeGold(i) { state.golds.splice(i, 1); save(); render(); }

function startEditGoldGrams(i, el) {
  _inlineNum(el, state.golds[i].grams, true, v => { state.golds[i].grams = v; save(); render(); });
}
function startEditGoldName(i, el) {
  _inlineText(el, state.golds[i].name, v => { state.golds[i].name = v; save(); render(); });
}

// ── Properties ────────────────────────────────────────────────────────────────

function addProperty() {
  const name     = document.getElementById('p-name').value.trim();
  const location = document.getElementById('p-location').value.trim();
  const status   = document.getElementById('p-status').value;
  const value    = parseFloat(document.getElementById('p-value').value) || 0;
  const rent     = parseFloat(document.getElementById('p-rent').value)  || 0;
  if (!name || !value) return;
  const now = new Date().toISOString().split('T')[0];
  state.properties.push({ name, location, status, value, rent, snapshots: [{ date: now, value }] });
  document.getElementById('p-name').value     = '';
  document.getElementById('p-location').value = '';
  document.getElementById('p-value').value    = '';
  document.getElementById('p-rent').value     = '';
  save(); render();
}

function removeProperty(i) { state.properties.splice(i, 1); save(); render(); }

function startEditPropValue(i, el) {
  _inlineNum(el, state.properties[i].value, true, v => {
    state.properties[i].value = v;
    const now  = new Date().toISOString().split('T')[0];
    const snaps = state.properties[i].snapshots = state.properties[i].snapshots || [];
    const last  = snaps[snaps.length - 1];
    if (!last || last.value !== v) snaps.push({ date: now, value: v });
    save(); render();
  });
}
function startEditPropName(i, el) {
  _inlineText(el, state.properties[i].name, v => { state.properties[i].name = v; save(); render(); });
}

// legacy stub
function addManual()    {}
function removeManual() {}

// ── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(tab, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-holdings').style.display = tab === 'holdings' ? 'block' : 'none';
  document.getElementById('tab-insights').style.display = tab === 'insights'  ? 'block' : 'none';
  if (tab === 'insights') recalcInsights();
}

// ── Settings panel ────────────────────────────────────────────────────────────

function openSettings() {
  document.getElementById('settings-panel').classList.add('open');
  document.getElementById('settings-overlay').classList.add('open');
  document.getElementById('setting-sheet-url').value = state.sheetUrl || '';
  renderSettingsChips();
}

function closeSettings() {
  document.getElementById('settings-panel').classList.remove('open');
  document.getElementById('settings-overlay').classList.remove('open');
}

function updateSheetUrl(val) {
  state.sheetUrl = val.trim();
  save();
}

async function saveToGoogleSheets() {
  if (!state.sheetUrl) {
    alert(t('settings.sheetUrl') + " is empty! Please set it in Settings.");
    openSettings();
    return;
  }
  
  const btn = document.getElementById('btn-save');
  if (!btn) return;
  const ogText = btn.textContent;
  btn.textContent = '⏳ Saving...';
  btn.disabled = true;

  try {
    const payload = {
      timestamp: new Date().toISOString(),
      netWorth: getTotals().total,
      stocks: state.stocks,
      banks: state.banks,
      golds: state.golds,
      properties: state.properties
    };

    const res = await fetch(state.sheetUrl, {
      method: 'POST',
      mode: 'no-cors', // Apps Script web apps often require no-cors for simple POST from browser
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    btn.textContent = '✅ Saved!';
    setTimeout(() => { btn.textContent = ogText; btn.disabled = false; }, 3000);
  } catch (err) {
    console.error("Save error:", err);
    alert("Save failed: " + err.message);
    btn.textContent = '❌ Failed';
    setTimeout(() => { btn.textContent = ogText; btn.disabled = false; }, 3000);
  }
}

async function loadFromGoogleSheets() {
  if (!state.sheetUrl) {
    alert(t('settings.sheetUrl') + " is empty! Please set it in Settings.");
    openSettings();
    return;
  }
  
  const btn = document.getElementById('btn-load');
  if (!btn) return;
  const ogText = btn.textContent;
  btn.textContent = '⏳ Loading...';
  btn.disabled = true;

  try {
    // Note: Apps Script URL redirects for GET requests, which handles CORS.
    const res = await fetch(state.sheetUrl);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const json = await res.json();
    
    if (json.status === "empty") {
      alert("Spreadsheet is empty. Save data first.");
      btn.textContent = ogText;
      btn.disabled = false;
      return;
    }
    
    if (json.status !== "success" || !json.data) {
      throw new Error(json.message || "Invalid response");
    }
    
    const d = json.data;
    if (d.stocks) state.stocks = d.stocks;
    if (d.banks) state.banks = d.banks;
    if (d.golds) state.golds = d.golds;
    if (d.properties) state.properties = d.properties;
    
    save();
    render();
    
    btn.textContent = '✅ Loaded!';
    setTimeout(() => { btn.textContent = ogText; btn.disabled = false; }, 3000);
  } catch (err) {
    console.error("Load error:", err);
    alert("Load failed: " + err.message);
    btn.textContent = '❌ Failed';
    setTimeout(() => { btn.textContent = ogText; btn.disabled = false; }, 3000);
  }
}

