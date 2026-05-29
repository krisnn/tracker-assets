'use strict';

// ── Translation strings ───────────────────────────────────────────────────────
const LANGS = {
  en: {
    // Header
    'header.tagline':      "your bag won't track itself 💀",
    'header.meta':         'IDX · Gold · Property — Indonesia',
    'header.notUpdated':   'Not updated yet',
    'header.updated':      'Updated: ',
    'header.settings':     'Settings',
    'header.refresh':      'Refresh Prices',
    'header.cooldown':     'Next refresh in ',
    'header.rateLimitTip': 'Prices refresh at most once every 5 minutes. This tracker runs on a free-tier API — we hit our daily limit overnight from unexpected traffic. Rate limiting keeps it free and online for everyone 🙏',

    // Tabs
    'tab.holdings':  'Holdings',
    'tab.insights':  'Insights',

    // Summary cards
    'summary.totalNW':        'Total Net Worth',
    'summary.passiveIncome':  'Passive Income/Month',
    'summary.yield':          'Portfolio Yield',
    'summary.divRent':        'Dividends + property rent',
    'summary.divNW':          'Dividends / Total NW',
    'summary.addAssets':      'Add assets to get started',

    // Section titles
    'section.stocks':   'Stocks',

    'section.bank':     'Savings & Cash',
    'section.gold':     'Gold · XAU · auto price',
    'section.property': 'Property · Manual snapshot',

    // Table column headers
    'col.ticker':      'Ticker',
    'col.market':      'Mkt',
    'col.lots':        'Lots',
    'col.price':       'Price',
    'col.value':       'Value',
    'col.yieldLast':   'Yield (last yr)',
    'col.divPerShare': 'Div/share',
    'col.annualDiv':   'Est. Div/yr',
    'col.buyPrice':    'Buy Price',
    'col.pl':          'P&L',
    'col.roi':         'ROI',
    'col.expDiv':      'Exp. Div',
    'col.name':        'Name',
    'col.currency':    'Currency',
    'col.amount':      'Amount',
    'col.rateIDR':     () => `Rate to ${state?.baseCurrency || 'IDR'}`,
    'col.valueIDR':    () => `Value (${state?.baseCurrency || 'IDR'})`,
    'col.fx24h':       '24h FX',
    'col.grams':       'Grams',
    'col.pricePerGram':'Price/gram',
    'col.24h':         '24h',
    'col.1m':          '1 Month',
    'col.ytd':         'YTD',
    'col.1y':          '1 Year',
    'col.location':    'Location',
    'col.status':      'Status',
    'col.rent':        'Rent/mo',
    'col.vsSnapshot':  'vs Snapshot',
    'col.coin':        'Coin',

    // Buttons
    'btn.add':  '+ Add',
    'btn.csv':  '↓ CSV',
    'btn.pdf':  '↓ PDF',
    'btn.load': '☁️ Load',
    'btn.save': '☁️ Save',

    // Form hints & placeholders
    'form.autoHint':    'div + sector: auto ✓',
    'form.bankName':    'Name (BCA USD)',
    'form.goldName':    'Name (Antam, Jewelry)',
    'form.propValue':   'Value (Rp)',
    'form.propRent':    'Rent/mo (optional)',

    // Property status labels
    'status.occupied':  'Owner-occupied',
    'status.rented':    'Rented',
    'status.vacant':    'Vacant',

    // Empty states
    'empty.stocks':     'No stocks yet — add below',

    'empty.bank':       'No savings yet',
    'empty.gold':       'No gold yet',
    'empty.property':   'No properties yet',
    'empty.sector':     'Sector data loaded after price fetch',
    'empty.addAssets':  'Add assets to see analysis',
    'empty.allocation': 'Add holdings to see allocation',

    // Insights panel
    'insight.passiveIncome': 'Passive Income',
    'insight.perMonth':      'per month',
    'insight.perYear':       'per year',
    'insight.fireNumber':    'FIRE Number (25×)',
    'insight.fireNote':      'Target wealth for financial independence = monthly expenses × 12 × 25.',
    'insight.swr':           'Safe Withdrawal / Month',
    'insight.swrNote':       '4% rule: liquid assets (stocks + cash + gold) × 4% ÷ 12. Property excluded.',
    'insight.monthlySpend':  'Monthly Expense Estimate',
    'insight.fireProgress':  'Progress to FIRE',
    'insight.fireAnalysis':  'FIRE Analysis',
    'insight.allocation':    'Asset Allocation',
    'insight.sectorBreakdown': 'Stock Sectors',
    'insight.spendHint':     '→ used for FIRE calculation',
    'insight.pctFire':       '% passive income vs monthly expenses',

    // Progress bar labels
    'progress.passive':  'Passive: ',
    'progress.target':   'Target: ',

    // Donut chart center labels
    'donut.mix':      'MIX',
    'donut.currency': 'CURRENCY',
    'donut.sector':   'SECTOR',
    'donut.noData':   'no data',

    // Allocation bar labels
    'alloc.stocks':   'Stocks',

    'alloc.bank':     'Bank/Cash',
    'alloc.gold':     'Gold',
    'alloc.property': 'Property',

    // Currency donut currency labels
    'curr.other':     'Other',

    // Dividend / rent footer rows
    'div.est':      'Est. Dividend',
    'div.perYear':  '/yr',
    'div.perMonth': '/mo',
    'rent.est':     'Est. Rent',

    // Settings panel
    'settings.title':    'Settings',
    'settings.currency': 'Display Currency',
    'settings.language': 'Language',
    'settings.sheetUrl': 'Google Sheets Web App URL',

    // Status text (in render)
    'status.loading':    'loading...',
    'status.fetchError': 'fetch failed',
    'status.cached':     '(cached)',
    'status.fetching':   'fetching...',
    'status.fetchFX':    'fetching...',

    // Tooltip for buy price column
    'tip.buyPrice':     'Buy Price',
    'tip.buyPriceDesc': 'Average buy price per share.',
    'tip.buyPriceIDX':  'IDX: in Rupiah (Rp)',
    'tip.buyPriceUS':   'US: in USD ($)',
    'tip.buyPriceNote': 'Enables <strong>P&L</strong> and <strong>ROI%</strong> columns automatically.',
    'tip.expDiv':       'Expected Dividend',
    'tip.expDivDesc':   'Override estimated dividend per share per year.',
    'tip.expDivIDX':    'IDX: in Rupiah — e.g.: <strong>520</strong>',
    'tip.expDivUS':     'US: in USD — e.g.: <strong>0.96</strong>',
    'tip.expDivNote':   'Leave empty to use auto data from Yahoo Finance.',

    // FIRE analysis (parameterised — pass values as args to t())
    'fire.needIncome': (v)         => `💰 You need an additional <strong style="color:var(--accent2)">${v}/month</strong> in passive income to fully cover your expenses.`,
    'fire.achieved':   ()          => `🎉 Your passive income already covers monthly expenses — in terms of cash flow, you're already <strong>FIRE</strong>!`,
    'fire.reqYield':   (v)         => `📈 To FIRE from your current NW, you need an average yield of <strong style="color:var(--accent3)">${v}%/year</strong> across all assets.`,
    'fire.propConc':   (v)         => `🏠 Property dominates <strong>${v}%</strong> of your NW — illiquid and doesn't generate direct passive income. Your real SWR is much lower than it appears.`,
    'fire.liqYield':   (v)         => `💧 Effective yield from your liquid assets: <strong style="color:var(--accent2)">${v}%/year</strong>. Increase it with high-dividend stocks or fixed income instruments.`,
    'fire.addCapital': (cap, yld)  => `🎯 Or, add <strong style="color:var(--accent)">${cap}</strong> to assets at your current effective yield (${yld}%) to close the gap.`,
    'fire.diversify':  ()          => `⚠️ You only have 1 type of asset. Diversifying across asset classes can reduce risk and increase passive income.`,

    // CSV export headers
    'csv.type':      'Type',
    'csv.name':      'Name',
    'csv.market':    'Market',
    'csv.qty':       'Qty',
    'csv.priceIDR':  'Price IDR',
    'csv.valueIDR':  'Value IDR',
    'csv.buyPrice':  'Buy Price',
    'csv.pl':        'P&L',
    'csv.roi':       'ROI%',
    'csv.divYield':  'Div Yield%',
    'csv.annualDiv': 'Est Div/yr',
    'csv.totalNW':   'TOTAL NET WORTH',
    'csv.exportDate':'Export date',

    // CORS file:// warning
    'cors.warning': '⚠ Opened via file:// — prices cannot be fetched due to CORS. Solution: right-click → Open with VS Code, then click Go Live. Or ignore this if doing manual input only.',
  },

  id: {
    // Header
    'header.tagline':      "your bag won't track itself 💀",
    'header.meta':         'IDX · Emas · Properti — Indonesia',
    'header.notUpdated':   'Belum diperbarui',
    'header.updated':      'Update: ',
    'header.settings':     'Pengaturan',
    'header.refresh':      'Perbarui harga',
    'header.cooldown':     'Refresh berikutnya dalam ',
    'header.rateLimitTip': 'Harga di-refresh max 1x per 5 menit. Tracker ini jalan di free-tier API — semalam kita kena cap gara-gara traffic yang tiba-tiba rame. Rate limit ini biar gratis dan tetap online buat semua orang 🙏',

    // Tabs
    'tab.holdings':  'Holdings',
    'tab.insights':  'Insights',

    // Summary cards
    'summary.totalNW':        'Total Net Worth',
    'summary.passiveIncome':  'Passive Income/Bulan',
    'summary.yield':          'Yield Portofolio',
    'summary.divRent':        'Dividen + sewa properti',
    'summary.divNW':          'Dividen / Total NW',
    'summary.addAssets':      'Tambah aset untuk mulai',

    // Section titles
    'section.stocks':   'Saham',

    'section.bank':     'Tabungan & Cash',
    'section.gold':     'Emas · XAU · harga otomatis',
    'section.property': 'Properti · Snapshot manual',

    // Table column headers
    'col.ticker':      'Ticker',
    'col.market':      'Mkt',
    'col.lots':        'Lot',
    'col.price':       'Harga',
    'col.value':       'Nilai',
    'col.yieldLast':   'Yield (last yr)',
    'col.divPerShare': 'Div/lembar',
    'col.annualDiv':   'Est. Div/thn',
    'col.buyPrice':    'Harga Beli',
    'col.pl':          'P&L',
    'col.roi':         'ROI',
    'col.expDiv':      'Exp. Div',
    'col.name':        'Nama',
    'col.currency':    'Mata Uang',
    'col.amount':      'Jumlah',
    'col.rateIDR':     () => `Rate ke ${state?.baseCurrency || 'IDR'}`,
    'col.valueIDR':    () => `Nilai (${state?.baseCurrency || 'IDR'})`,
    'col.fx24h':       '24h FX',
    'col.grams':       'Gram',
    'col.pricePerGram':'Harga/gram',
    'col.24h':         '24h',
    'col.1m':          '1 Bulan',
    'col.ytd':         'YTD',
    'col.1y':          '1 Tahun',
    'col.location':    'Lokasi',
    'col.status':      'Status',
    'col.rent':        'Sewa/bln',
    'col.vsSnapshot':  'vs Snapshot',
    'col.coin':        'Koin',

    // Buttons
    'btn.add':  '+ Tambah',
    'btn.csv':  '↓ CSV',
    'btn.pdf':  '↓ PDF',
    'btn.load': '☁️ Load',
    'btn.save': '☁️ Save',

    // Form hints & placeholders
    'form.autoHint':    'div + sektor: auto ✓',
    'form.bankName':    'Nama (BCA USD)',
    'form.goldName':    'Nama (Antam, Perhiasan)',
    'form.propValue':   'Nilai (Rp)',
    'form.propRent':    'Sewa/bln (opsional)',

    // Property status labels
    'status.occupied':  'Dihuni',
    'status.rented':    'Disewakan',
    'status.vacant':    'Kosong',

    // Empty states
    'empty.stocks':     'Belum ada saham — tambah di bawah',

    'empty.bank':       'Belum ada tabungan',
    'empty.gold':       'Belum ada emas',
    'empty.property':   'Belum ada properti',
    'empty.sector':     'Sektor otomatis diambil setelah fetch harga',
    'empty.addAssets':  'Tambah aset untuk melihat analisis',
    'empty.allocation': 'Tambah holdings untuk melihat alokasi',

    // Insights panel
    'insight.passiveIncome': 'Passive Income',
    'insight.perMonth':      'per bulan',
    'insight.perYear':       'per tahun',
    'insight.fireNumber':    'FIRE Number (25×)',
    'insight.fireNote':      'Target kekayaan untuk financial independence = pengeluaran bulanan × 12 × 25.',
    'insight.swr':           'Safe Withdrawal / Bulan',
    'insight.swrNote':       '4% rule: aset likuid (saham + cash + emas) × 4% ÷ 12. Properti tidak dihitung.',
    'insight.monthlySpend':  'Estimasi Pengeluaran Bulanan',
    'insight.fireProgress':  'Progress ke FIRE',
    'insight.fireAnalysis':  'Analisis FIRE',
    'insight.allocation':    'Alokasi Aset',
    'insight.sectorBreakdown': 'Sektor Saham',
    'insight.spendHint':     '→ dipakai untuk kalkulasi FIRE',
    'insight.pctFire':       '% passive income dari pengeluaran bulanan',

    // Progress bar labels
    'progress.passive':  'Passive: ',
    'progress.target':   'Target: ',

    // Donut chart center labels
    'donut.mix':      'MIX',
    'donut.currency': 'CURRENCY',
    'donut.sector':   'SEKTOR',
    'donut.noData':   'no data',

    // Allocation bar labels
    'alloc.stocks':   'Saham',

    'alloc.bank':     'Bank/Cash',
    'alloc.gold':     'Emas',
    'alloc.property': 'Properti',

    // Currency donut
    'curr.other':     'Lainnya',

    // Dividend / rent footer rows
    'div.est':      'Est. Dividen',
    'div.perYear':  '/thn',
    'div.perMonth': '/bln',
    'rent.est':     'Est. Sewa',

    // Settings panel
    'settings.title':    'Pengaturan',
    'settings.currency': 'Mata Uang Tampilan',
    'settings.language': 'Bahasa',
    'settings.sheetUrl': 'URL Google Sheets Web App',

    // Status text
    'status.loading':    'memuat...',
    'status.fetchError': 'gagal fetch',
    'status.cached':     '(cached)',
    'status.fetching':   'fetching...',
    'status.fetchFX':    'fetching...',

    // Tooltip for buy price column
    'tip.buyPrice':     'Harga Beli',
    'tip.buyPriceDesc': 'Harga beli rata-rata per lembar.',
    'tip.buyPriceIDX':  'IDX: dalam Rupiah (Rp)',
    'tip.buyPriceUS':   'US: dalam USD ($)',
    'tip.buyPriceNote': 'Mengaktifkan kolom <strong>P&L</strong> dan <strong>ROI%</strong> otomatis.',
    'tip.expDiv':       'Expected Dividend',
    'tip.expDivDesc':   'Override estimasi dividen per lembar per tahun.',
    'tip.expDivIDX':    'IDX: dalam Rupiah — contoh: <strong>520</strong>',
    'tip.expDivUS':     'US: dalam USD — contoh: <strong>0.96</strong>',
    'tip.expDivNote':   'Kosongkan untuk pakai data auto dari Yahoo Finance.',

    // FIRE analysis (parameterised)
    'fire.needIncome': (v)         => `💰 Butuh tambahan <strong style="color:var(--accent2)">${v}/bulan</strong> passive income untuk fully cover pengeluaran kamu.`,
    'fire.achieved':   ()          => `🎉 Passive income kamu sudah menutup pengeluaran bulanan — secara cashflow, kamu sudah <strong>FIRE</strong>!`,
    'fire.reqYield':   (v)         => `📈 Untuk FIRE dari NW sekarang, butuh yield rata-rata <strong style="color:var(--accent3)">${v}%/tahun</strong> dari seluruh aset.`,
    'fire.propConc':   (v)         => `🏠 Properti mendominasi <strong>${v}%</strong> dari NW kamu — illikuid dan tidak menghasilkan passive income langsung. SWR riil kamu jauh lebih kecil dari angka yang terlihat.`,
    'fire.liqYield':   (v)         => `💧 Yield efektif dari aset likuid kamu: <strong style="color:var(--accent2)">${v}%/tahun</strong>. Tingkatkan dengan saham dividend yield tinggi atau instrumen fixed income.`,
    'fire.addCapital': (cap, yld)  => `🎯 Atau, tambah <strong style="color:var(--accent)">${cap}</strong> ke aset dengan yield efektif saat ini (${yld}%) untuk nutup gap.`,
    'fire.diversify':  ()          => `⚠️ Kamu hanya punya 1 jenis aset. Diversifikasi ke beberapa kelas aset bisa mengurangi risiko dan meningkatkan passive income.`,

    // CSV export headers
    'csv.type':      'Tipe',
    'csv.name':      'Nama',
    'csv.market':    'Pasar',
    'csv.qty':       'Qty',
    'csv.priceIDR':  'Harga IDR',
    'csv.valueIDR':  'Nilai IDR',
    'csv.buyPrice':  'Harga Beli',
    'csv.pl':        'P&L',
    'csv.roi':       'ROI%',
    'csv.divYield':  'Div Yield%',
    'csv.annualDiv': 'Est Div/thn',
    'csv.totalNW':   'TOTAL NET WORTH',
    'csv.exportDate':'Tanggal ekspor',

    // CORS file:// warning
    'cors.warning': '⚠ Buka via file:// — harga tidak bisa di-fetch karena CORS. Solusi: klik kanan file → Open with → VS Code, lalu klik Go Live. Atau abaikan jika hanya mau input manual.',
  },
};

// ── i18n helpers ─────────────────────────────────────────────────────────────
let currentLang = 'en';

/**
 * Translate a key. For parameterised keys (function values), pass args after the key.
 * e.g. t('fire.needIncome', fmtB(gap))
 */
function t(key, ...args) {
  const val = LANGS[currentLang]?.[key] ?? LANGS['en']?.[key] ?? key;
  return typeof val === 'function' ? val(...args) : val;
}

/** Auto-detect language from saved state or browser locale. Call after state is loaded. */
function initLang() {
  if (state?.baseLang) {
    currentLang = state.baseLang;
  } else {
    const browser = (navigator.language || '').toLowerCase();
    currentLang = browser.startsWith('id') ? 'id' : 'en';
  }
}

/** Apply translations to all data-i18n elements in the DOM. */
function applyLang() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.innerHTML = t(el.getAttribute('data-i18n'));
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.getAttribute('data-i18n-placeholder'));
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  // Sync html lang attr
  document.documentElement.lang = currentLang;
}

/** Switch language, persist, re-render everything. */
function setLang(lang) {
  currentLang = lang;
  state.baseLang = lang;
  save();
  applyLang();
  render();
  renderSettingsChips();
}
