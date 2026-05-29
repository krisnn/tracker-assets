require('dotenv').config();
const express = require('express');
const cors = require('cors');
// Use dynamic import for node-fetch since it's an ES module in newer versions
let fetch;
(async () => {
  fetch = (await import('node-fetch')).default;
})();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public')); // Serve the frontend from 'public' directory

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

let cachedCrumb = null, cachedCookie = null, crumbFetchedAt = 0;
const CRUMB_TTL = 55 * 60 * 1000;
const TICKER_CACHE = new Map(); // Simple in-memory cache for sectors

async function getCrumb() {
  return { crumb: '', cookie: '' };
}

async function fetchChart(symbol, range, interval, events, crumb, cookie) {
  let url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}`;
  if (crumb) url += `&crumb=${encodeURIComponent(crumb)}`;
  if (events) url += `&events=${events}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'application/json' },
  });
  if (!res.ok) throw new Error(`Yahoo ${res.status} for ${symbol}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No result for ${symbol}`);
  return result;
}

const IDX_SECTORS = {
  BBCA:'Financial Services', BBRI:'Financial Services', BMRI:'Financial Services',
  BNGA:'Financial Services', BJBR:'Financial Services', BJTM:'Financial Services',
  BTPS:'Financial Services', BBTN:'Financial Services', NISP:'Financial Services',
  PNBN:'Financial Services', MEGA:'Financial Services', ARTO:'Financial Services',
  BRIS:'Financial Services', BBNI:'Financial Services',
  TLKM:'Communication Services', EXCL:'Communication Services', ISAT:'Communication Services',
  FREN:'Communication Services', MNCN:'Communication Services', SCMA:'Communication Services',
  UNVR:'Consumer Staples', ICBP:'Consumer Staples', INDF:'Consumer Staples',
  HMSP:'Consumer Staples', GGRM:'Consumer Staples', CPIN:'Consumer Staples',
  JPFA:'Consumer Staples', AALI:'Consumer Staples', LSIP:'Consumer Staples',
  SIMP:'Consumer Staples', SIDO:'Consumer Staples', MYOR:'Consumer Staples',
  ASII:'Consumer Discretionary', ACES:'Consumer Discretionary', MAPI:'Consumer Discretionary',
  LPPF:'Consumer Discretionary', ERAA:'Consumer Discretionary',
  ADRO:'Energy', PTBA:'Energy', BYAN:'Energy', ITMG:'Energy',
  PGAS:'Energy', AKRA:'Energy', MEDC:'Energy',
  ANTM:'Basic Materials', INCO:'Basic Materials', TINS:'Basic Materials',
  MDKA:'Basic Materials', SMGR:'Basic Materials', INTP:'Basic Materials',
  AMRT:'Basic Materials',
  JSMR:'Industrials', WSKT:'Industrials', WIKA:'Industrials', ADHI:'Industrials',
  UNTR:'Industrials', SMDR:'Industrials', BIRD:'Industrials',
  KLBF:'Healthcare', KAEF:'Healthcare', MIKA:'Healthcare', PRDA:'Healthcare',
  BSDE:'Real Estate', SMRA:'Real Estate', CTRA:'Real Estate', PWON:'Real Estate',
  DMAS:'Real Estate', LPKR:'Real Estate',
  GOTO:'Technology', BUKA:'Technology', EMTK:'Technology', DMMX:'Technology',
};

const US_SECTORS = {
  AAPL:'Technology', MSFT:'Technology', NVDA:'Technology', AMD:'Technology',
  INTC:'Technology', AVGO:'Technology', QCOM:'Technology', TXN:'Technology',
  MU:'Technology', AMAT:'Technology', LRCX:'Technology', KLAC:'Technology',
  ORCL:'Technology', CRM:'Technology', ADBE:'Technology', NOW:'Technology',
  SNOW:'Technology', PLTR:'Technology', CRWD:'Technology', PANW:'Technology',
  MRVL:'Technology', ASML:'Technology', TSM:'Technology', ARM:'Technology',
  GOOGL:'Communication Services', GOOG:'Communication Services',
  META:'Communication Services', NFLX:'Communication Services',
  DIS:'Communication Services', CMCSA:'Communication Services',
  T:'Communication Services', VZ:'Communication Services',
  SPOT:'Communication Services', SNAP:'Communication Services',
  AMZN:'Consumer Discretionary', TSLA:'Consumer Discretionary',
  NKE:'Consumer Discretionary', MCD:'Consumer Discretionary',
  SBUX:'Consumer Discretionary', HD:'Consumer Discretionary',
  LOW:'Consumer Discretionary', TGT:'Consumer Discretionary',
  BKNG:'Consumer Discretionary', ABNB:'Consumer Discretionary',
  WMT:'Consumer Staples', COST:'Consumer Staples', PG:'Consumer Staples',
  KO:'Consumer Staples', PEP:'Consumer Staples', PM:'Consumer Staples',
  'BRK-B':'Financial Services', JPM:'Financial Services', BAC:'Financial Services',
  GS:'Financial Services', MS:'Financial Services', V:'Financial Services',
  MA:'Financial Services', PYPL:'Financial Services', AXP:'Financial Services',
  JNJ:'Healthcare', PFE:'Healthcare', MRK:'Healthcare', ABBV:'Healthcare',
  LLY:'Healthcare', UNH:'Healthcare', TMO:'Healthcare', ABT:'Healthcare',
  XOM:'Energy', CVX:'Energy', COP:'Energy', SLB:'Energy',
  CAT:'Industrials', BA:'Industrials', GE:'Industrials', HON:'Industrials',
  UPS:'Industrials', FDX:'Industrials', DE:'Industrials',
  AMT:'Real Estate', PLD:'Real Estate', EQIX:'Real Estate',
  RTX:'Industrials', LMT:'Industrials', NOC:'Industrials', GD:'Industrials',
  SPY:'ETF', QQQ:'ETF', VTI:'ETF', IWM:'ETF', VOO:'ETF',
  GLD:'Commodities', SLV:'Commodities', IAU:'Commodities', GDX:'Commodities',
  USO:'Commodities', UNG:'Commodities',
};

async function fetchSector(symbol, crumb, cookie) {
  if (symbol.endsWith('.JK')) {
    const base = symbol.replace('.JK', '');
    if (IDX_SECTORS[base]) return { sector: IDX_SECTORS[base], industry: null };
  } else {
    if (US_SECTORS[symbol]) return { sector: US_SECTORS[symbol], industry: null };
  }
  
  if (TICKER_CACHE.has(`sector:${symbol}`)) {
    return { sector: TICKER_CACHE.get(`sector:${symbol}`), industry: null };
  }
  
  try {
    let url = `https://query2.finance.yahoo.com/v11/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile`;
    if (crumb) url += `&crumb=${encodeURIComponent(crumb)}`;
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } });
    const data = await res.json();
    const profile = data?.quoteSummary?.result?.[0]?.assetProfile;
    const sector = profile?.sector || null;
    const industry = profile?.industry || null;
    if (sector) TICKER_CACHE.set(`sector:${symbol}`, sector);
    return { sector, industry };
  } catch { return { sector: null, industry: null }; }
}

function parseDivsByYear(dividendEvents) {
  const byYear = {};
  for (const d of Object.values(dividendEvents || {})) {
    const yr = new Date(d.date * 1000).getFullYear();
    byYear[yr] = (byYear[yr] || 0) + d.amount;
  }
  return byYear;
}

async function fetchStock(sym) {
  const { crumb, cookie } = await getCrumb();
  const ticker = sym.toUpperCase();
  const market = ticker.endsWith('.JK') ? 'IDX' : 'US';

  const result = await fetchChart(ticker, '2y', '1d', 'dividends', crumb, cookie);
  const meta   = result.meta;
  const price  = meta.regularMarketPrice;
  const currency = meta.currency;

  const closes    = result?.indicators?.quote?.[0]?.close?.filter(v => v != null) || [];
  const prevClose = closes.length >= 2 ? closes[closes.length - 2] : null;
  const changePercent = (price && prevClose)
    ? ((price - prevClose) / prevClose * 100)
    : null;

  const divEvents = result?.events?.dividends || {};
  const byYear    = parseDivsByYear(divEvents);
  const thisYear  = new Date().getFullYear();
  const curYrDiv  = byYear[thisYear]  || 0;
  const lastYrDiv = byYear[thisYear-1] || 0;

  const divPerShareThis = curYrDiv  || null;
  const divPerShareLast = lastYrDiv || null;
  const divSource       = curYrDiv ? 'thisYear' : (lastYrDiv ? 'lastYear' : null);
  const ttmDiv          = curYrDiv || lastYrDiv || 0;
  const divYieldTTM     = price && ttmDiv  ? (ttmDiv  / price) * 100 : null;
  const divYieldLast    = price && lastYrDiv ? (lastYrDiv / price) * 100 : null;

  const { sector, industry } = await fetchSector(ticker, crumb, cookie);

  return { symbol: sym, ticker, market, price, currency, changePercent,
    divYieldTTM, divYieldLast, divPerShareThis, divPerShareLast, divSource,
    sector, industry };
}

async function fetchFXRates() {
  const { crumb, cookie } = await getCrumb();
  const pairs = ['USD','SGD','JPY','CNY','EUR','MYR'];
  const results = {};
  await Promise.all(pairs.map(async base => {
    try {
      const result = await fetchChart(`${base}IDR=X`, '5d', '1d', null, crumb, cookie);
      const meta = result.meta;
      const closes = result?.indicators?.quote?.[0]?.close?.filter(Boolean) || [];
      const prev   = closes.length >= 2 ? closes[closes.length-2] : null;
      const cur    = meta.regularMarketPrice;
      const change24h = (prev && cur) ? ((cur - prev) / prev * 100) : null;
      results[base] = { rateToIDR: cur, change24h };
    } catch { results[base] = { rateToIDR: null, change24h: null }; }
  }));
  return { rates: results };
}

async function fetchGoldPrice() {
  const { crumb, cookie } = await getCrumb();
  try {
    const [goldResult, fxResult] = await Promise.all([
      fetchChart('GC=F', '1mo', '1d', null, crumb, cookie),
      fetchChart('USDIDR=X', '1mo', '1d', null, crumb, cookie),
    ]);
    const goldUSD = goldResult.meta.regularMarketPrice; // per troy oz
    const usdIdr  = fxResult.meta.regularMarketPrice;
    const pricePerGram = (goldUSD / 31.1035) * usdIdr;

    const closes = goldResult?.indicators?.quote?.[0]?.close?.filter(Boolean) || [];
    const timestamps = goldResult?.timestamp || [];
    const now = Date.now() / 1000;
    const dayAgo = now - 86400, monthAgo = now - 2592000, yearAgo = now - 31536000;

    const getClose = (targetTs) => {
      let best = null, bestDiff = Infinity;
      closes.forEach((c, i) => {
        const diff = Math.abs((timestamps[i] || 0) - targetTs);
        if (diff < bestDiff) { bestDiff = diff; best = c; }
      });
      return best;
    };

    const pct = (from, to) => (from && to) ? ((to - from) / from * 100) : null;
    const p24h = pct(getClose(dayAgo),   goldUSD);
    const p1M  = pct(getClose(monthAgo), goldUSD);
    const p1Y  = pct(getClose(yearAgo),  goldUSD);

    return { pricePerGram: Math.round(pricePerGram), currency: 'IDR',
      goldUSD, usdIdr, change24h: p24h, change1M: p1M, change1Y: p1Y };
  } catch(e) {
    return { error: e.message };
  }
}

// Routes
app.get('/api', (req, res) => {
  res.json({ status: 'ok', version: '1.4.0', service: 'NW Tracker Local Proxy' });
});

app.get('/api/crumb-test', async (req, res) => {
  try {
    if (!fetch) await new Promise(r => setTimeout(r, 100)); // wait for dynamic import if needed
    const { crumb } = await getCrumb();
    res.json({ crumb: crumb.slice(0,8)+'...', ok: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/price', async (req, res) => {
  try {
    if (!fetch) await new Promise(r => setTimeout(r, 100));
    const raw = req.query.symbol;
    if (!raw) return res.status(400).json({ error: 'symbol param required' });
    const symbols = raw.split(',').map(s => s.trim().toUpperCase()).slice(0, 10);

    const results = {};
    await Promise.all(symbols.map(async sym => {
      try { results[sym] = await fetchStock(sym); }
      catch(e) { results[sym] = { symbol: sym, error: e.message, price: null }; }
    }));
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/fx', async (req, res) => {
  try { 
    if (!fetch) await new Promise(r => setTimeout(r, 100));
    res.json(await fetchFXRates()); 
  }
  catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/gold', async (req, res) => {
  try { 
    if (!fetch) await new Promise(r => setTimeout(r, 100));
    res.json(await fetchGoldPrice()); 
  }
  catch(e) { res.status(500).json({ error: e.message }); }
});

// Catch-all removed for Express 5 compatibility. express.static already serves index.html for /

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
