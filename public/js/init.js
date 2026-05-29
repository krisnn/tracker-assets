'use strict';

// ── Startup ───────────────────────────────────────────────────────────────────
// Runs after all other scripts are loaded.

// Show CORS warning when opened via file://
if (location.protocol === 'file:') {
  const warn = document.getElementById('file-warning');
  if (warn) {
    warn.innerHTML = t('cors.warning');
    warn.style.display = 'block';
  }
}

// Detect language (uses saved state.baseLang or browser locale)
initLang();

// Translate all data-i18n elements in the static HTML
applyLang();

// Set last-update placeholder (no data-i18n on it — keeps dynamic timestamp safe)
const _lu = document.getElementById('last-update');
if (_lu) _lu.textContent = t('header.notUpdated');

// Initial render from saved state
render();

// Auto-fetch fresh prices on load
refreshAll();

// Select-all on focus for number inputs in add forms — prevents "020" appending on mobile tap
document.querySelectorAll('input[type="number"]').forEach(el => {
  el.addEventListener('focus', () => el.select());
});
