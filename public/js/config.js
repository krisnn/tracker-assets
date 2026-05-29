'use strict';

const WORKER_URL = '/api';

const CURRENCY_SYMS = { IDR:'Rp', USD:'$', SGD:'S$', EUR:'€', JPY:'¥', MYR:'RM', CNY:'CN¥' };

// IDR-only formatter — used for FX rate labels only; use fmtB() everywhere else
const fmt = n => 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
