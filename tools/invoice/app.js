(function () {
  'use strict';

  var cfg = window.INVOICE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var form = $('#invoiceForm');
  var itemsBody = $('#itemsBody');
  var rowTpl = $('#rowTemplate');
  var PROFILE_KEY = 'runexe-invoice-profile';
  var LAST_NO_KEY = 'runexe-invoice-last-number';
  var PAGE_WIDTH_PX = 794;

  var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  $('.logo-light').style.display = isDark ? 'none' : 'block';
  $('.logo-dark').style.display = isDark ? 'block' : 'none';

  /* Starting defaults by visitor country (from the server's IP lookup). Currencies must exist in CURRENCIES. */
  var COUNTRY_PRESETS = {
    IN: { mode: 'in_gst', currency: 'INR' },
    HK: { mode: 'no_tax', currency: 'HKD' },
    US: { mode: 'no_tax', currency: 'USD', regLabel: 'EIN' },
    AE: { currency: 'AED', tax: 'VAT', rate: 5, label: 'TRN' },
    SA: { tax: 'VAT', rate: 15, label: 'VAT No.' },
    BH: { tax: 'VAT', rate: 10, label: 'VAT No.' },
    OM: { tax: 'VAT', rate: 5, label: 'VAT No.' },
    GB: { currency: 'GBP', tax: 'VAT', rate: 20, label: 'VAT No.' },
    CH: { currency: 'EUR', tax: 'VAT', rate: 8.1, label: 'VAT No.' },
    NO: { currency: 'EUR', tax: 'VAT', rate: 25, label: 'VAT No.' },
    SG: { currency: 'SGD', tax: 'GST', rate: 9, label: 'GST Reg. No.' },
    AU: { currency: 'AUD', tax: 'GST', rate: 10, label: 'ABN' },
    NZ: { tax: 'GST', rate: 15, label: 'GST No.' },
    CA: { currency: 'CAD', tax: 'GST', rate: 5, label: 'GST/HST No.' },
    CN: { currency: 'CNY', tax: 'VAT', rate: 13, label: 'Tax ID' },
    JP: { tax: 'Consumption Tax', rate: 10, label: 'Registration No.' },
    MY: { tax: 'SST', rate: 8, label: 'SST No.' },
    TH: { tax: 'VAT', rate: 7, label: 'Tax ID' },
    PH: { tax: 'VAT', rate: 12, label: 'TIN' },
    ZA: { tax: 'VAT', rate: 15, label: 'VAT No.' }
  };
  var EU_VAT_RATES = {
    AT: 20, BE: 21, BG: 20, CY: 19, CZ: 21, DE: 19, DK: 25, EE: 24, ES: 21, FI: 25.5, FR: 20, GR: 24, HR: 25, HU: 27,
    IE: 23, IT: 22, LT: 21, LU: 17, LV: 21, MT: 18, NL: 21, PL: 23, PT: 23, RO: 21, SE: 25, SI: 22, SK: 23
  };
  var COUNTRY_NAMES = { HK: 'Hong Kong', MO: 'Macau', TW: 'Taiwan' };

  function geoPreset(code) {
    if (!code) return null;
    var p = COUNTRY_PRESETS[code]
      || (EU_VAT_RATES[code] !== undefined ? { currency: 'EUR', tax: 'VAT', rate: EU_VAT_RATES[code], label: 'VAT No.' } : {});
    var name = COUNTRY_NAMES[code];
    if (!name) {
      try { name = new Intl.DisplayNames(['en'], { type: 'region' }).of(code); } catch (e) { name = ''; }
    }
    if (!name || name === code) return null;
    return {
      name: name,
      mode: p.mode || (p.tax ? 'custom_tax' : 'no_tax'),
      currency: p.currency || 'USD',
      tax: p.tax, rate: p.rate, label: p.label, regLabel: p.regLabel
    };
  }

  var GEO = geoPreset(cfg.country);

  var MODE_DEFAULTS = {
    no_tax:     { currency: GEO ? GEO.currency : 'HKD', taxIdLabel: (GEO && GEO.regLabel) || 'Business Registration No.', country: GEO ? GEO.name : 'Hong Kong' },
    in_gst:     { currency: 'INR' },
    in_export:  { currency: 'USD' },
    custom_tax: { currency: GEO ? GEO.currency : 'USD', taxIdLabel: (GEO && GEO.label) || 'VAT No.', country: GEO && GEO.tax ? GEO.name : '' }
  };

  /** Country-specific field values that form.reset() would otherwise put back to the Hong Kong defaults. */
  function applyGeoFields() {
    if (!GEO) return;
    $('#seller_country').value = GEO.name;
    $('#buyer_country').placeholder = 'e.g. ' + GEO.name;
    if (GEO.tax) {
      $('#tax_name').value = GEO.tax;
      $('#default_rate_custom').value = GEO.rate;
      $('#default_rate_custom').dataset.prev = String(GEO.rate);
    }
  }

  function applyGeoDefaults() {
    if (!GEO) return;
    form.querySelector('input[name="mode"][value="' + GEO.mode + '"]').checked = true;
    applyGeoFields();
    var note = $('#geoNote');
    var what = GEO.mode === 'in_gst' ? 'India GST, INR'
      : (GEO.tax ? GEO.tax + ' ' + GEO.rate + '%, ' + GEO.currency : 'no tax, ' + GEO.currency);
    $('span', note).textContent = 'Set up for ' + GEO.name + ' (' + what + ') based on your location. You can change any of it.';
    note.hidden = false;
  }

  var STATES = {};
  $$('#seller_state option').forEach(function (o) { if (o.value) STATES[o.value] = o.textContent.replace(/^\d+ - /, ''); });

  function mode() { return form.querySelector('input[name="mode"]:checked').value; }
  function exportType() { return form.querySelector('input[name="export_type"]:checked').value; }
  function isIndia() { var m = mode(); return m === 'in_gst' || m === 'in_export'; }
  function taxesOn() { var m = mode(); return m !== 'no_tax' && !(m === 'in_export' && exportType() === 'lut'); }
  function defaultRate() {
    var m = mode();
    if (m === 'custom_tax') return $('#default_rate_custom').value;
    if (m === 'in_gst' || (m === 'in_export' && exportType() === 'igst')) return $('#default_rate_gst').value;
    return '';
  }

  /* ---------------- Visibility by mode ---------------- */

  function applyVisibility() {
    var m = mode();
    var et = exportType();
    $$('[data-modes], [data-export], [data-gst-rate]').forEach(function (el) {
      var show = true;
      if (el.dataset.modes) show = el.dataset.modes.split(' ').indexOf(m) !== -1;
      if (show && el.dataset.export) show = el.dataset.export === et;
      if (show && el.hasAttribute('data-gst-rate')) show = !(m === 'in_export' && et === 'lut');
      if (show && el.classList.contains('tax-col-cell')) show = taxesOn();
      el.hidden = !show;
    });
    $$('.tax-col-label, [data-f="tax_rate"]').forEach(function (el) {
      var cell = el.closest('td, th');
      if (cell && !taxesOn()) cell.hidden = true;
    });
    $$('input, select, textarea', form).forEach(function (el) {
      if (el.type === 'hidden' || el.hasAttribute('data-file')) return;
      el.disabled = !!el.closest('[hidden]');
    });
    updateLabels();
  }

  function updateLabels() {
    var m = mode();
    var label = $('#tax_id_label').value.trim() || (m === 'no_tax' ? 'Business Registration No.' : 'VAT No.');
    $('.tax-id-label').textContent = label;
    $('.buyer-tax-id-label').textContent = m === 'in_export' ? 'Client tax ID' : 'Client ' + label;
    var taxName = m === 'custom_tax' ? ($('#tax_name').value.trim() || 'Tax') : 'GST';
    $('.tax-col-label').textContent = taxName + ' %';
  }

  function onModeChange() {
    var d = MODE_DEFAULTS[mode()];
    $('#currency').value = d.currency;
    if (d.taxIdLabel) $('#tax_id_label').value = d.taxIdLabel;
    if (d.country !== undefined && !$('#seller_country').value.trim()) $('#seller_country').value = d.country;
    fillEmptyRates();
    applyVisibility();
    updateSupplyHint();
    refreshLookups();
  }

  /* ---------------- Line items ---------------- */

  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  function formatAmount(n) {
    var cur = $('#currency').value;
    return n.toLocaleString(cur === 'INR' ? 'en-IN' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function autoGrow(el) {
    el.style.height = 'auto';
    el.style.height = Math.max(38, el.scrollHeight + 2) + 'px';
  }

  function renumberRows() {
    $$('.item-row', itemsBody).forEach(function (row, i) {
      $$('[data-f]', row).forEach(function (el) { el.name = 'items[' + i + '][' + el.dataset.f + ']'; });
    });
  }

  function updateRowAmount(row) {
    var qty = parseFloat($('[data-f="qty"]', row).value) || 0;
    var price = parseFloat($('[data-f="price"]', row).value) || 0;
    var disc = Math.min(100, Math.max(0, parseFloat($('[data-f="discount"]', row).value) || 0));
    var gross = round2(qty * price);
    $('.row-amount', row).textContent = formatAmount(round2(gross - round2(gross * disc / 100)));
  }

  function addRow(values, focus) {
    var frag = rowTpl.content.cloneNode(true);
    var row = frag.querySelector('.item-row');
    $$('[data-modes]', row).forEach(function (td) {
      if (td.querySelector('[data-f="tax_rate"]')) td.classList.add('tax-col-cell');
    });
    var rate = $('[data-f="tax_rate"]', row);
    rate.value = defaultRate();
    Object.keys(values || {}).forEach(function (k) {
      var el = $('[data-f="' + k + '"]', row);
      if (el) el.value = values[k];
    });
    itemsBody.appendChild(row);
    renumberRows();
    applyVisibility();
    updateRowAmount(row);
    autoGrow($('[data-f="description"]', row));
    if (focus) $('[data-f="description"]', row).focus();
    return row;
  }

  function setRows(list) {
    itemsBody.innerHTML = '';
    (list && list.length ? list : [{}]).forEach(function (v) { addRow(v); });
  }

  function fillEmptyRates() {
    var rate = defaultRate();
    $$('[data-f="tax_rate"]', itemsBody).forEach(function (el) { if (el.value === '') el.value = rate; });
  }

  itemsBody.addEventListener('input', function (e) {
    var row = e.target.closest('.item-row');
    if (!row) return;
    if (e.target.dataset.f === 'description') autoGrow(e.target);
    updateRowAmount(row);
  });

  itemsBody.addEventListener('click', function (e) {
    if (!e.target.closest('[data-remove-row]')) return;
    var rows = $$('.item-row', itemsBody);
    var row = e.target.closest('.item-row');
    if (rows.length === 1) {
      $$('[data-f]', row).forEach(function (el) { el.value = el.dataset.f === 'qty' ? '1' : (el.dataset.f === 'tax_rate' ? defaultRate() : ''); });
      updateRowAmount(row);
    } else {
      row.remove();
      renumberRows();
    }
    schedulePreview();
  });

  $('#addItemBtn').addEventListener('click', function () { addRow({}, true); schedulePreview(); });

  $$('.default-rate').forEach(function (el) {
    el.dataset.prev = el.value;
    el.addEventListener('change', function () {
      var prev = el.dataset.prev;
      $$('[data-f="tax_rate"]', itemsBody).forEach(function (r) { if (r.value === '' || r.value === prev) r.value = el.value; });
      el.dataset.prev = el.value;
    });
  });

  /* ---------------- GSTIN (offline check + optional lookup) ---------------- */

  var GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function gstinError(g) {
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return 'Format should look like 27AAPFU0939F1ZV';
    if (!STATES[g.slice(0, 2)]) return 'Unknown state code ' + g.slice(0, 2);
    var sum = 0;
    for (var i = 0; i < 14; i++) {
      var p = GSTIN_CHARS.indexOf(g[i]) * ((i % 2) + 1);
      sum += Math.floor(p / 36) + (p % 36);
    }
    if (GSTIN_CHARS[(36 - (sum % 36)) % 36] !== g[14]) return 'Check digit does not match — please re-check for typos';
    return null;
  }

  var posAuto = true;

  function handleGstin(input) {
    var party = input.dataset.party;
    var hint = $('.gstin-hint[data-party="' + party + '"]');
    var g = input.value.toUpperCase().replace(/\s+/g, '');
    if (input.value !== g) input.value = g;
    hint.className = 'hint gstin-hint';
    if (!g) { hint.textContent = (window.INVOICE_CONFIG || {}).gstLookup ? 'Enter a GSTIN to prefill name and address' : ''; return; }
    if (g.length < 15) { hint.textContent = (15 - g.length) + ' more characters'; return; }
    var err = gstinError(g);
    if (err) { hint.textContent = err; hint.classList.add('err'); return; }
    var code = g.slice(0, 2);
    hint.textContent = 'Valid · ' + STATES[code] + ' (' + code + ')';
    hint.classList.add('ok');
    var pan = $('#' + party + '_pan');
    if (pan && (!pan.value || pan.dataset.auto === '1')) { pan.value = g.slice(2, 12); pan.dataset.auto = '1'; }
    var state = $('#' + party + '_state');
    if (state) state.value = code;
    if (party === 'buyer') syncPlaceOfSupply();
    updateSupplyHint();
    handlePin(party);
  }

  function syncPlaceOfSupply() {
    var buyerState = $('#buyer_state').value;
    if (posAuto && buyerState) $('#place_of_supply').value = buyerState;
    updateSupplyHint();
  }

  function updateSupplyHint() {
    var hint = $('#supplyHint');
    var seller = $('#seller_state').value;
    var pos = $('#place_of_supply').value;
    hint.className = 'hint';
    if (mode() !== 'in_gst' || !seller || !pos) {
      hint.textContent = 'Filled from the client\'s GSTIN or state. Decides CGST + SGST vs IGST.';
      return;
    }
    hint.textContent = seller === pos
      ? 'Same state as you, so CGST + SGST will be charged.'
      : 'Different state from yours (' + STATES[seller] + '), so IGST will be charged.';
    hint.classList.add('ok');
  }

  $$('.gstin').forEach(function (el) { el.addEventListener('input', function () { handleGstin(el); }); });
  $('#buyer_state').addEventListener('change', syncPlaceOfSupply);
  $('#seller_state').addEventListener('change', updateSupplyHint);
  $('#place_of_supply').addEventListener('change', function () { posAuto = false; updateSupplyHint(); });
  $$('#seller_pan, #buyer_pan').forEach(function (el) { el.addEventListener('input', function () { el.dataset.auto = '0'; }); });

  /* ---------------- GST prefill ---------------- */

  var gstResults = {};
  var gstAutoTried = {};

  function gstCard(party) { return $('.gst-card[data-party="' + party + '"]'); }

  function renderGstCard(party, d) {
    var card = gstCard(party);
    card.dataset.gstin = d.gstin;
    $('.gst-card-name', card).textContent = d.legal_name;
    var badge = $('.gst-badge', card);
    var active = !d.status || /^active$/i.test(d.status);
    badge.textContent = d.status || 'Unknown';
    badge.className = 'gst-badge ' + (active ? 'ok' : 'err');
    $('.gst-card-meta', card).textContent = [d.type, d.constitution, d.registration_date ? 'Registered ' + d.registration_date : '']
      .filter(Boolean).join(' · ');
    var warn = $('.gst-card-warn', card);
    warn.hidden = active;
    warn.textContent = active ? '' : 'This GST registration is ' + d.status.toLowerCase()
      + (d.cancellation_date ? ' (since ' + d.cancellation_date + ')' : '') + '. Check with the business before issuing a GST invoice.';

    var nameSel = $('.gst-name-choice', card);
    nameSel.innerHTML = '';
    [['legal', 'Legal name: ' + d.legal_name], ['trade', 'Trade name: ' + d.trade_name]].forEach(function (o, i) {
      if (i === 1 && (!d.trade_name || d.trade_name === d.legal_name)) return;
      nameSel.add(new Option(o[1], o[0]));
    });
    nameSel.closest('.gst-choice').hidden = nameSel.options.length < 2;

    var addrSel = $('.gst-address-choice', card);
    addrSel.innerHTML = '';
    (d.addresses || []).forEach(function (a, i) { addrSel.add(new Option(a.label + ' · ' + a.short, String(i))); });
    addrSel.closest('.gst-choice').hidden = addrSel.options.length < 2;
    var current = $('#' + party + '_address').value;
    var match = (d.addresses || []).findIndex(function (a) { return a.address === current; });
    if (match >= 0) addrSel.value = String(match);
    var name = $('#' + party + '_name').value;
    nameSel.value = name && name === d.trade_name && d.trade_name !== d.legal_name ? 'trade' : 'legal';
    card.hidden = false;
  }

  function applyGst(party, d, overwrite) {
    var name = $('#' + party + '_name');
    var address = $('#' + party + '_address');
    if (overwrite || !name.value.trim()) name.value = d.legal_name;
    if (d.address && (overwrite || !address.value.trim())) address.value = d.address;
    if (d.state_code) $('#' + party + '_state').value = d.state_code;
    if (party === 'buyer') syncPlaceOfSupply();
    handlePin(party);
    renderGstCard(party, d);
    var hint = $('.gstin-hint[data-party="' + party + '"]');
    hint.textContent = 'Prefilled from GST records · ' + STATES[d.gstin.slice(0, 2)] + ' (' + d.gstin.slice(0, 2) + ')';
    hint.className = 'hint gstin-hint ok';
    schedulePreview();
  }

  function lookupGst(party, auto) {
    var input = $('#' + party + '_tax_id');
    var hint = $('.gstin-hint[data-party="' + party + '"]');
    var btn = $('.gst-fetch[data-party="' + party + '"]');
    var g = input.value.trim().toUpperCase();
    var err = gstinError(g);
    if (err) { hint.textContent = err; hint.className = 'hint gstin-hint err'; return; }
    if (gstResults[g]) { applyGst(party, gstResults[g], !auto); return; }
    btn.disabled = true;
    btn.textContent = 'Looking up…';
    hint.textContent = 'Looking up GST records…';
    hint.className = 'hint gstin-hint';
    fetch('gst-lookup.php?gstin=' + encodeURIComponent(g), { headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.message || 'Lookup failed');
        if (input.value.trim().toUpperCase() !== g) return;
        gstResults[g] = res.data;
        applyGst(party, res.data, !auto);
      })
      .catch(function (e) { hint.textContent = e.message; hint.className = 'hint gstin-hint err'; })
      .finally(function () { btn.disabled = false; btn.textContent = 'Prefill'; });
  }

  function maybeAutoPrefill(input) {
    if (!(window.INVOICE_CONFIG || {}).gstLookup) return;
    var party = input.dataset.party;
    var g = input.value;
    var card = gstCard(party);
    if (card.dataset.gstin !== g) card.hidden = true;
    if (g.length !== 15 || gstinError(g) || gstAutoTried[party + g]) return;
    if ($('#' + party + '_name').value.trim() && $('#' + party + '_address').value.trim()) return;
    gstAutoTried[party + g] = true;
    lookupGst(party, true);
  }

  $$('.gstin').forEach(function (el) { el.addEventListener('input', function () { maybeAutoPrefill(el); }); });
  $$('.gst-fetch').forEach(function (btn) {
    btn.addEventListener('click', function () { lookupGst(btn.dataset.party, false); });
  });
  $$('.gst-card').forEach(function (card) {
    var party = card.dataset.party;
    $('.gst-name-choice', card).addEventListener('change', function (e) {
      var d = gstResults[card.dataset.gstin];
      if (!d) return;
      $('#' + party + '_name').value = e.target.value === 'trade' ? d.trade_name : d.legal_name;
      schedulePreview();
    });
    $('.gst-address-choice', card).addEventListener('change', function (e) {
      var d = gstResults[card.dataset.gstin];
      if (!d) return;
      $('#' + party + '_address').value = d.addresses[+e.target.value].address;
      handlePin(party);
      schedulePreview();
    });
  });

  /* ---------------- IFSC, PIN code & EU VAT lookups ---------------- */

  var lookupCache = {};

  function lookup(type, q) {
    var key = type + ':' + q;
    if (!lookupCache[key]) {
      lookupCache[key] = fetch('lookup.php?type=' + type + '&q=' + encodeURIComponent(q), { headers: { Accept: 'application/json' } })
        .then(function (r) {
          return r.json().then(function (res) {
            res.notFound = r.status === 404;
            if (!res.ok && !res.notFound) delete lookupCache[key];
            return res;
          });
        })
        .catch(function () {
          delete lookupCache[key];
          return { ok: false, message: 'Lookup is not available right now.' };
        });
    }
    return lookupCache[key];
  }

  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  function isShown(el) { return !el.closest('[hidden]'); }

  var IFSC_HINT = 'Bank name fills in from the IFSC';

  function handleIfsc() {
    var input = $('#bank_ifsc');
    var hint = $('#ifscHint');
    var code = input.value.toUpperCase().replace(/\s+/g, '');
    if (input.value !== code) input.value = code;
    hint.className = 'hint';
    if (!code) { hint.textContent = IFSC_HINT; return; }
    if (code.length < 11) { hint.textContent = (11 - code.length) + (code.length === 10 ? ' more character' : ' more characters'); return; }
    if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(code)) {
      hint.textContent = 'IFSC should look like HDFC0000060';
      hint.classList.add('err');
      return;
    }
    hint.textContent = 'Looking up bank…';
    lookup('ifsc', code).then(function (res) {
      if (input.value !== code) return;
      if (!res.ok) { hint.textContent = res.message; hint.className = 'hint err'; return; }
      var d = res.data;
      var branch = /branch/i.test(d.branch) ? d.branch : d.branch + ' Branch';
      var bankName = $('#bank_name');
      if (!bankName.value.trim() || bankName.dataset.auto === '1') {
        bankName.value = d.bank + ', ' + branch;
        bankName.dataset.auto = '1';
      }
      var swift = $('#bank_swift');
      if (d.swift && !swift.value.trim() && isShown(swift)) swift.value = d.swift;
      hint.textContent = d.bank + ' · ' + branch + (d.city ? ', ' + d.city : '');
      hint.className = 'hint ok';
      schedulePreview();
    });
  }

  var PIN_MODES = { seller: ['in_gst', 'in_export'], buyer: ['in_gst'], ship: ['in_gst'] };

  function findPin(text) {
    var re = /(?<!\d)([1-9]\d{2}) ?(\d{3})(?!\d)/g;
    var m, last = null;
    while ((m = re.exec(text))) last = { pin: m[1] + m[2], index: m.index };
    return last;
  }

  function addPlaceToAddress(party, parts) {
    var address = $('#' + party + '_address');
    var at = findPin(address.value);
    if (!at) return;
    var before = address.value.slice(0, at.index).replace(/[ \t]+$/, '');
    var sep = !before || /\n$/.test(before) ? '' : (/,$/.test(before) ? ' ' : ', ');
    address.value = before + sep + parts.join(', ') + ' ' + address.value.slice(at.index);
    handlePin(party);
    schedulePreview();
  }

  function handlePin(party) {
    var hint = $('.pin-hint[data-party="' + party + '"]');
    var address = $('#' + party + '_address');
    hint.className = 'hint pin-hint';
    hint.textContent = '';
    if (PIN_MODES[party].indexOf(mode()) === -1) return;
    var at = findPin(address.value);
    if (!at) return;
    var pin = at.pin;
    lookup('pincode', pin).then(function (res) {
      var now = findPin(address.value);
      if (!now || now.pin !== pin) return;
      if (!res.ok) {
        if (res.notFound) {
          hint.textContent = 'PIN ' + pin + ' was not found. Please check it.';
          hint.classList.add('err');
        }
        return;
      }
      var d = res.data;
      var place = d.district + ', ' + d.state;
      var stateSel = $('#' + party + '_state');
      if (d.state_code && stateSel) {
        if (!stateSel.value) {
          stateSel.value = d.state_code;
          if (party === 'buyer') syncPlaceOfSupply(); else updateSupplyHint();
          schedulePreview();
        } else if (stateSel.value !== d.state_code) {
          hint.textContent = 'PIN ' + pin + ' is in ' + place + ', but the state selected is ' + STATES[stateSel.value] + '.';
          hint.classList.add('err');
          return;
        }
      }
      hint.textContent = 'PIN ' + pin + ' · ' + place;
      hint.classList.add('ok');
      var text = address.value.toLowerCase();
      if (text.indexOf(d.state.toLowerCase()) === -1) {
        var parts = [d.district, d.state].filter(function (p) { return p && text.indexOf(p.toLowerCase()) === -1; });
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'hint-btn';
        btn.textContent = 'Add “' + parts.join(', ') + '” to address';
        btn.addEventListener('click', function () { addPlaceToAddress(party, parts); });
        hint.appendChild(btn);
      }
    });
  }

  var EU_COUNTRIES = {
    AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', CY: 'Cyprus', CZ: 'Czech Republic', DE: 'Germany', DK: 'Denmark',
    EE: 'Estonia', EL: 'Greece', GR: 'Greece', ES: 'Spain', FI: 'Finland', FR: 'France', HR: 'Croatia', HU: 'Hungary',
    IE: 'Ireland', IT: 'Italy', LT: 'Lithuania', LU: 'Luxembourg', LV: 'Latvia', MT: 'Malta', NL: 'Netherlands',
    PL: 'Poland', PT: 'Portugal', RO: 'Romania', SE: 'Sweden', SI: 'Slovenia', SK: 'Slovakia', XI: 'United Kingdom'
  };

  function handleVat(party) {
    var input = $('#' + party + '_tax_id_intl');
    var hint = $('.vat-hint[data-party="' + party + '"]');
    var q = input.value.toUpperCase().replace(/[\s.\-]/g, '');
    hint.className = 'hint vat-hint';
    hint.textContent = '';
    var cc = q.slice(0, 2);
    if (!EU_COUNTRIES[cc] || !/^[A-Z]{2}[0-9A-Z]{8,13}$/.test(q) || !isShown(input)) return;
    hint.textContent = 'Checking EU VAT number…';
    lookup('vat', q).then(function (res) {
      if (input.value.toUpperCase().replace(/[\s.\-]/g, '') !== q) return;
      if (!res.ok) { hint.textContent = res.message; return; }
      var d = res.data;
      if (!d.valid) {
        hint.textContent = 'Not a valid EU VAT number (checked with EU VIES)';
        hint.classList.add('err');
        return;
      }
      hint.textContent = 'Valid EU VAT number' + (d.name ? ' · ' + d.name : '');
      hint.classList.add('ok');
      var name = $('#' + party + '_name');
      var address = $('#' + party + '_address');
      var country = $('#' + party + '_country');
      if (d.name && !name.value.trim()) name.value = d.name;
      if (d.address && !address.value.trim()) address.value = d.address;
      if (country && !country.value.trim()) country.value = EU_COUNTRIES[cc];
      schedulePreview();
    });
  }

  function refreshLookups() {
    handleIfsc();
    Object.keys(PIN_MODES).forEach(handlePin);
    ['seller', 'buyer'].forEach(handleVat);
  }

  $('#bank_ifsc').addEventListener('input', handleIfsc);
  $('#bank_name').addEventListener('input', function (e) { e.target.dataset.auto = '0'; });
  $$('.pin-input').forEach(function (el) {
    el.addEventListener('input', debounce(function () { handlePin(el.dataset.party); }, 600));
  });
  Object.keys(PIN_MODES).forEach(function (party) {
    $('#' + party + '_state').addEventListener('change', function () { handlePin(party); });
  });
  $$('.vat-input').forEach(function (el) {
    el.addEventListener('input', debounce(function () { handleVat(el.dataset.party); }, 700));
  });

  /* ---------------- Logo & signature images ---------------- */

  function setImage(kind, dataUrl) {
    var zone = $('.drop[data-image="' + kind + '"]');
    $('#' + kind + '_data').value = dataUrl || '';
    var img = $('img', zone);
    img.hidden = !dataUrl;
    img.src = dataUrl || '';
    $('[data-remove]', zone).hidden = !dataUrl;
    $('.drop-text', zone).hidden = !!dataUrl;
  }

  function readImage(kind, file) {
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type)) { alert('Please choose a PNG or JPG image.'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('Please choose an image of 2 MB or less.'); return; }
    var reader = new FileReader();
    reader.onload = function () {
      downscale(reader.result, file.type, function (dataUrl) { setImage(kind, dataUrl); schedulePreview(); });
    };
    reader.readAsDataURL(file);
  }

  function downscale(dataUrl, type, done) {
    var MAX = 1000;
    var img = new Image();
    img.onload = function () {
      var scale = Math.min(1, MAX / Math.max(img.width, img.height));
      if (scale === 1) { done(dataUrl); return; }
      var canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      done(canvas.toDataURL(type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.9));
    };
    img.onerror = function () { alert('That image could not be read.'); };
    img.src = dataUrl;
  }

  $$('.drop').forEach(function (zone) {
    var kind = zone.dataset.image;
    var input = $('[data-file="' + kind + '"]');
    zone.addEventListener('click', function (e) {
      if (e.target.closest('[data-remove]')) { setImage(kind, ''); input.value = ''; schedulePreview(); return; }
      input.click();
    });
    zone.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
    ['dragenter', 'dragover'].forEach(function (t) { zone.addEventListener(t, function (e) { e.preventDefault(); zone.classList.add('dragover'); }); });
    ['dragleave', 'drop'].forEach(function (t) { zone.addEventListener(t, function (e) { e.preventDefault(); zone.classList.remove('dragover'); }); });
    zone.addEventListener('drop', function (e) { readImage(kind, e.dataTransfer.files[0]); });
    input.addEventListener('change', function () { readImage(kind, input.files[0]); });
  });

  /* ---------------- Dates ---------------- */

  function applyPaymentTerms() {
    var days = $('#payment_terms').value;
    var date = $('#invoice_date').value;
    if (days === '' || !date) return;
    var d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + parseInt(days, 10));
    var pad = function (n) { return String(n).padStart(2, '0'); };
    $('#due_date').value = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  $('#payment_terms').addEventListener('change', applyPaymentTerms);
  $('#invoice_date').addEventListener('change', applyPaymentTerms);

  /* ---------------- Design ---------------- */

  function setAccent(color) {
    color = color.toUpperCase();
    $('#accent').value = color;
    $('#accentPicker').value = color;
    $('#tplGrid').style.setProperty('--accent', color);
    $$('.swatch').forEach(function (s) { s.classList.toggle('active', s.dataset.color === color); });
  }
  $$('.swatch').forEach(function (s) { s.addEventListener('click', function () { setAccent(s.dataset.color); schedulePreview(); }); });
  $('#accentPicker').addEventListener('input', function (e) { setAccent(e.target.value); schedulePreview(); });

  /* ---------------- Ship to ---------------- */

  $('#ship_enabled').addEventListener('change', function (e) {
    $('#shipFields').hidden = !e.target.checked;
    applyVisibility();
  });

  /* ---------------- Live preview ---------------- */

  var frame = $('#previewFrame');
  var stage = $('#previewStage');
  var scroller = $('#previewScroll');
  var statusEl = $('#previewStatus');
  var previewTimer = null;
  var previewSeq = 0;
  var lastErrors = [];

  function fitPreview() {
    var doc = frame.contentDocument;
    if (!doc || !doc.documentElement) return;
    var h = doc.documentElement.scrollHeight;
    frame.style.height = h + 'px';
    var scale = Math.min(1, (scroller.clientWidth - 28) / PAGE_WIDTH_PX);
    stage.style.width = PAGE_WIDTH_PX + 'px';
    stage.style.transform = 'scale(' + scale + ')';
    stage.style.marginBottom = -(h * (1 - scale)) + 'px';
    stage.style.marginRight = -(PAGE_WIDTH_PX * (1 - scale)) + 'px';
  }
  frame.addEventListener('load', fitPreview);
  window.addEventListener('resize', fitPreview);

  function showIssues(errors) {
    var box = $('#issues');
    var list = $('#issuesList');
    list.innerHTML = '';
    errors.slice(0, 6).forEach(function (msg) {
      var li = document.createElement('li');
      li.textContent = msg;
      list.appendChild(li);
    });
    if (errors.length > 6) {
      var more = document.createElement('li');
      more.textContent = 'and ' + (errors.length - 6) + ' more';
      list.appendChild(more);
    }
    box.hidden = errors.length === 0;
  }

  function runPreview() {
    var seq = ++previewSeq;
    statusEl.textContent = 'Updating…';
    return fetch('preview.php', { method: 'POST', body: new FormData(form) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (seq !== previewSeq) return;
        if (!res.ok) throw new Error((res.errors || ['Preview failed'])[0]);
        frame.srcdoc = res.html;
        lastErrors = res.errors || [];
        showIssues(lastErrors);
        $('#tSubtotal').textContent = res.totals.subtotal;
        $('#tTax').textContent = res.totals.tax;
        $('#tGrand').textContent = res.totals.grand_total;
        $('#tBalance').textContent = res.totals.balance_due;
        $('#tBalanceRow').hidden = !(parseFloat($('#amount_paid').value) > 0);
        statusEl.textContent = 'Up to date';
        return lastErrors;
      })
      .catch(function (e) {
        if (seq === previewSeq) statusEl.textContent = e.message || 'Preview unavailable';
        return null;
      });
  }

  function schedulePreview() {
    clearTimeout(previewTimer);
    statusEl.textContent = 'Updating…';
    previewTimer = setTimeout(runPreview, 450);
  }

  form.addEventListener('input', schedulePreview);
  form.addEventListener('change', function (e) {
    if (e.target.name === 'mode') onModeChange();
    if (e.target.name === 'export_type') { fillEmptyRates(); applyVisibility(); }
    if (e.target.id === 'tax_id_label' || e.target.id === 'tax_name') updateLabels();
    if (e.target.id === 'currency') $$('.item-row', itemsBody).forEach(updateRowAmount);
    schedulePreview();
  });

  /* ---------------- Profile (this device only) ---------------- */

  var PROFILE_IDS = ['tax_name', 'tax_id_label', 'default_rate_custom', 'default_rate_gst', 'lut_arn', 'currency',
    'payment_terms', 'seller_name', 'seller_tax_id', 'seller_tax_id_intl', 'seller_pan', 'seller_state',
    'seller_country', 'seller_address', 'seller_email', 'seller_phone', 'seller_website', 'bank_account_name',
    'bank_name', 'bank_account_number', 'bank_ifsc', 'bank_upi', 'bank_code', 'bank_branch', 'bank_swift',
    'bank_iban', 'bank_fps', 'terms'];
  var PROFILE_RADIOS = ['mode', 'export_type', 'template'];

  function saveProfile() {
    if (!$('#rememberProfile').checked) return;
    var p = { fields: {}, radios: {}, accent: $('#accent').value };
    PROFILE_IDS.forEach(function (id) { p.fields[id] = $('#' + id).value; });
    PROFILE_RADIOS.forEach(function (n) { p.radios[n] = form.querySelector('input[name="' + n + '"]:checked').value; });
    var logo = $('#logo_data').value;
    var sig = $('#signature_data').value;
    if (logo.length < 1500000) p.logo = logo;
    if (sig.length < 1000000) p.signature = sig;
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }
    catch (e) { delete p.logo; delete p.signature; try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (e2) {} }
  }

  function loadProfile() {
    var p;
    try { p = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch (e) { p = null; }
    if (!p) return false;
    Object.keys(p.radios || {}).forEach(function (n) {
      var r = form.querySelector('input[name="' + n + '"][value="' + p.radios[n] + '"]');
      if (r) r.checked = true;
    });
    Object.keys(p.fields || {}).forEach(function (id) { var el = $('#' + id); if (el) el.value = p.fields[id]; });
    if (p.accent) setAccent(p.accent);
    if (p.logo) setImage('logo', p.logo);
    if (p.signature) setImage('signature', p.signature);
    $$('.default-rate').forEach(function (el) { el.dataset.prev = el.value; });
    return true;
  }

  $('#rememberProfile').addEventListener('change', function (e) {
    if (!e.target.checked) { try { localStorage.removeItem(PROFILE_KEY); } catch (err) {} }
  });

  function nextInvoiceNumber(last) {
    var m = /^(.*?)(\d+)(\D*)$/.exec(last || '');
    if (!m) return '';
    var n = String(parseInt(m[2], 10) + 1);
    return m[1] + n.padStart(m[2].length, '0') + m[3];
  }

  /* ---------------- Download ---------------- */

  $('#downloadBtn').addEventListener('click', function () {
    var btn = this;
    btn.disabled = true;
    btn.textContent = 'Checking…';
    clearTimeout(previewTimer);
    runPreview().then(function (errors) {
      btn.disabled = false;
      btn.textContent = 'Download PDF';
      if (errors === null) { alert('Could not reach the server. Please try again.'); return; }
      if (errors.length) {
        $('#issues').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
      saveProfile();
      try { localStorage.setItem(LAST_NO_KEY, $('#invoice_number').value.trim()); } catch (e) {}
      form.submit();
    });
  });

  /* ---------------- Samples & reset ---------------- */

  var SAMPLES = {
    no_tax: {
      fields: {
        seller_name: 'Harbour Lane Trading Ltd', seller_tax_id_intl: '71234567', seller_country: 'Hong Kong',
        seller_address: 'Unit 1203, 12/F, Wing On Centre\n111 Connaught Road Central, Sheung Wan',
        seller_email: 'accounts@harbourlane.hk', seller_phone: '+852 2123 4567', seller_website: 'www.harbourlane.hk',
        buyer_name: 'Pacific Crest Retail Ltd', buyer_country: 'Hong Kong',
        buyer_address: '18/F, Times Square Tower 2\n1 Matheson Street, Causeway Bay', buyer_email: 'ap@pacificcrest.hk',
        bank_account_name: 'Harbour Lane Trading Ltd', bank_name: 'HSBC Hong Kong', bank_account_number: '123-456789-001',
        bank_code: '004', bank_swift: 'HSBCHKHHHKH', bank_fps: '1234567',
        notes: 'Thank you for your business!', terms: 'Payment due within 15 days by bank transfer or FPS.\nPlease quote the invoice number with your payment.'
      },
      items: [
        { description: 'Brand identity design\nLogo, colour palette and typography guide', qty: 1, unit: 'project', price: 18000 },
        { description: 'Website landing page (responsive)', qty: 1, unit: 'page', price: 12500 },
        { description: 'Content updates', qty: 6, unit: 'hrs', price: 650, discount: 10 }
      ]
    },
    in_gst: {
      fields: {
        seller_name: 'Apex Cyber Dynamics Pvt Ltd', seller_tax_id: '27AAPFU0939F1ZV',
        seller_address: 'Unit 402, Trade Tower, Bandra Kurla Complex\nMumbai, Maharashtra 400051',
        seller_email: 'billing@apexcyber.in', seller_phone: '+91 98200 94821',
        buyer_name: 'Vanguard Solutions LLP', buyer_tax_id: '29AAGCB7383J1Z4',
        buyer_address: '840 Tech Park, Whitefield\nBengaluru, Karnataka 560066', buyer_email: 'accounts@vanguard.in',
        bank_account_name: 'Apex Cyber Dynamics Pvt Ltd', bank_name: 'HDFC Bank', bank_account_number: '50200049281049',
        bank_ifsc: 'HDFC0000060', bank_upi: 'apexcyber@hdfcbank',
        terms: 'Payment due within 15 days.\nInterest @ 18% p.a. on delayed payments.'
      },
      items: [
        { description: 'Cloud architecture consulting', hsn: '998313', qty: 1, unit: 'nos', price: 85000, tax_rate: 18 },
        { description: 'DevSecOps implementation', hsn: '998314', qty: 40, unit: 'hrs', price: 1500, tax_rate: 18 }
      ]
    },
    in_export: {
      fields: {
        seller_name: 'RunExe Technology', seller_tax_id: '27AAPFU0939F1ZV', lut_arn: 'AD270326000123X',
        seller_address: 'Office 12, Hinjewadi Phase 1\nPune, Maharashtra 411057', seller_email: 'info@runexe.tech',
        buyer_name: 'Harbour Lane Trading Ltd', buyer_country: 'Hong Kong', buyer_tax_id_intl: '71234567',
        buyer_address: 'Unit 1203, Wing On Centre\n111 Connaught Road Central, Sheung Wan',
        bank_account_name: 'RunExe Technology', bank_name: 'ICICI Bank', bank_account_number: '000405123456',
        bank_ifsc: 'ICIC0000004', bank_swift: 'ICICINBBCTS',
        terms: 'Payment due within 30 days by SWIFT transfer. Bank charges are borne by the client.'
      },
      items: [
        { description: 'Custom inventory web application — milestone 2', hsn: '998314', qty: 1, unit: 'milestone', price: 4800 },
        { description: 'Cloud hosting & maintenance (monthly)', hsn: '998315', qty: 3, unit: 'months', price: 350 }
      ]
    },
    custom_tax: {
      currency: 'AED',
      fields: {
        seller_name: 'Gulf Bright Supplies LLC', seller_tax_id_intl: '100234567800003', seller_country: 'United Arab Emirates',
        tax_name: 'VAT', tax_id_label: 'TRN', default_rate_custom: '5',
        seller_address: 'Office 804, Al Moosa Tower 2\nSheikh Zayed Road, Dubai', seller_email: 'sales@gulfbright.ae',
        buyer_name: 'Oasis Hospitality FZE', buyer_country: 'United Arab Emirates',
        buyer_address: 'Plot 22, Jebel Ali Free Zone, Dubai',
        bank_account_name: 'Gulf Bright Supplies LLC', bank_name: 'Emirates NBD', bank_iban: 'AE070331234567890123456',
        bank_swift: 'EBILAEAD'
      },
      items: [
        { description: 'Commercial coffee machine', qty: 2, unit: 'pcs', price: 6200, tax_rate: 5 },
        { description: 'Installation & training', qty: 1, unit: 'job', price: 900, tax_rate: 5 }
      ]
    }
  };

  $('#sampleBtn').addEventListener('click', function () {
    var m = mode();
    var s = SAMPLES[m];
    var modeSettings = ['tax_name', 'tax_id_label', 'default_rate_custom', 'seller_country'];
    Object.keys(SAMPLES).forEach(function (k) {
      Object.keys(SAMPLES[k].fields).forEach(function (id) {
        var el = $('#' + id);
        if (el && !(id in s.fields) && modeSettings.indexOf(id) === -1) el.value = '';
      });
    });
    Object.keys(s.fields).forEach(function (id) { var el = $('#' + id); if (el) el.value = s.fields[id]; });
    $('#currency').value = s.currency || (m === 'in_export' ? 'USD' : MODE_DEFAULTS[m].currency);
    if (!$('#invoice_number').value) $('#invoice_number').value = 'INV-' + new Date().getFullYear() + '-001';
    posAuto = true;
    setRows(s.items);
    $$('.gst-card').forEach(function (c) { c.hidden = true; c.dataset.gstin = ''; });
    $('#bank_name').dataset.auto = '0';
    $$('.gstin').forEach(handleGstin);
    applyPaymentTerms();
    applyVisibility();
    updateSupplyHint();
    refreshLookups();
    schedulePreview();
  });

  $('#clearBtn').addEventListener('click', function () {
    if (!confirm('Clear all fields? Your saved business profile stays on this device.')) return;
    var keep = { mode: mode(), template: form.querySelector('input[name="template"]:checked').value, accent: $('#accent').value };
    form.reset();
    form.querySelector('input[name="mode"][value="' + keep.mode + '"]').checked = true;
    form.querySelector('input[name="template"][value="' + keep.template + '"]').checked = true;
    setAccent(keep.accent);
    setImage('logo', '');
    setImage('signature', '');
    applyGeoFields();
    $$('.gst-card').forEach(function (c) { c.hidden = true; c.dataset.gstin = ''; });
    $('#bank_name').dataset.auto = '0';
    $$('.gstin').forEach(handleGstin);
    $('#shipFields').hidden = true;
    posAuto = true;
    onModeChange();
    setRows([]);
    applyPaymentTerms();
    schedulePreview();
  });

  /* ---------------- Init ---------------- */

  var hadProfile = loadProfile();
  setAccent($('#accent').value);
  var lastNo = null;
  try { lastNo = localStorage.getItem(LAST_NO_KEY); } catch (e) {}
  if (lastNo) {
    $('#invoice_number').value = nextInvoiceNumber(lastNo);
  }
  if (!hadProfile) {
    applyGeoDefaults();
    onModeChange();
  }
  setRows([]);
  applyVisibility();
  $$('.gstin').forEach(handleGstin);
  applyPaymentTerms();
  updateSupplyHint();
  refreshLookups();
  runPreview();
})();
