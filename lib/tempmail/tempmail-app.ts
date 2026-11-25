// @ts-nocheck
export function initTempmail() {
let inboxEmails = [];
let currentEmail = null, timerSec = 600, timerInt = null, generated = false;
let mailboxTag = null;
let mailboxTimestampFrom = null;
let inboxFetchDepth = 0;

function isMobile(){return window.innerWidth<=600}

function csrfToken(){
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
}

function apiEndpoint(){ return '/api/tempmail'; }

function parseApiResponse(r){
  return r.json().then(function(data){
    if(r.status === 429){
      var msg = (data && data.message) || 'Too many requests. Please wait and try again.';
      var err = new Error(msg);
      err.status = 429;
      err.retryAfterSec = data && data.retryAfterSec;
      throw err;
    }
  return data;
  });
}

function escapeHtml(s){
  return String(s ?? '').replace(/[&<>"']/g, (m)=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function fmtTime(ts){
  if(!ts) return '';
  const n = Number(ts);
  if(Number.isNaN(n)) return '';
  const d = new Date(n);
  const diff = Math.max(0, Date.now() - d.getTime());
  const mins = Math.floor(diff / 60000);
  if(mins < 1) return 'just now';
  if(mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if(hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function updateCounts(){
  const c = inboxEmails.length;
  const tabCount = document.getElementById('tabCount');
  const countBadges = document.querySelectorAll('.count-badge');
  if(tabCount) tabCount.textContent = String(c);
  countBadges.forEach(b => b.textContent = String(c));
}

function syncListLoadingUi(){
  const panel = document.getElementById('listPanel');
  const list = document.getElementById('emailList');
  const busy = inboxFetchDepth > 0;
  const empty = inboxEmails.length === 0;
  if(panel) panel.classList.toggle('list-panel--loading', busy && empty);
  if(list) list.setAttribute('aria-busy', busy && empty ? 'true' : 'false');
}

function beginInboxFetch(){
  inboxFetchDepth++;
  syncListLoadingUi();
}

function endInboxFetch(){
  inboxFetchDepth = Math.max(0, inboxFetchDepth - 1);
  syncListLoadingUi();
  // Requests call renderEmails before finally; when last fetch ends, swap skeleton → empty state if still no mail.
  if(inboxFetchDepth === 0 && inboxEmails.length === 0){
    renderEmails();
  }
}

function repTier(v){
  const s = String(v ?? '').toLowerCase();
  if (s === 'pass' || s === 'bestpass') return 'ok';
  if (s === 'fail' || s === 'softfail') return 'bad';
  return 'neutral';
}

function repLabel(tier){
  if (tier === 'ok') return '✓';
  if (tier === 'bad') return '✕';
  return '—';
}

function repMiniHtml(spf, dkim){
  const ts = `SPF: ${spf || '—'} · DKIM: ${dkim || '—'}`;
  const sp = repTier(spf), dk = repTier(dkim);
  return `<span class="rep-mini" title="${escapeHtml(ts)}"><span class="rep-dot rep-${sp}" title="SPF: ${escapeHtml(spf || '—')}">${repLabel(sp)}</span><span class="rep-dot rep-${dk}" title="DKIM: ${escapeHtml(dkim || '—')}">${repLabel(dk)}</span></span>`;
}

function repRowHtml(spf, dkim){
  const sp = repTier(spf), dk = repTier(dkim);
  return `<div class="rep-row rep-row--header" title="Email authentication"><span class="rep-pill rep-${sp}"><span class="tick">${repLabel(sp)}</span> SPF <span style="opacity:.75;font-weight:500">${escapeHtml(spf || '—')}</span></span><span class="rep-pill rep-${dk}"><span class="tick">${repLabel(dk)}</span> DKIM <span style="opacity:.75;font-weight:500">${escapeHtml(dkim || '—')}</span></span></div>`;
}

function fmtFileSize(bytes){
  const n = Number(bytes);
  if (!Number.isFinite(n) || n < 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1048576).toFixed(1)} MB`;
}

function attKind(contentType, filename){
  const c = String(contentType || '').toLowerCase();
  const f = String(filename || '').toLowerCase();
  if (c.includes('pdf') || f.endsWith('.pdf')) return 'pdf';
  if (c.startsWith('image/')) return 'img';
  return 'file';
}

function buildAttachmentsHtml(attachments){
  let html = '';
  const list = Array.isArray(attachments) ? attachments : [];
  if (list.length){
    const cards = list.map(a=>{
      const url = a.downloadUrl || '';
      const name = escapeHtml(a.filename || 'file');
      const sz = fmtFileSize(a.size);
      const kind = attKind(a.contentType, a.filename);
      const icon = kind === 'pdf' ? '📄' : kind === 'img' ? '🖼' : '📎';
      const inner = `<div class="att-icon ${kind}">${icon}</div><div class="att-info"><div class="att-name" title="${name}">${name}</div><div class="att-size">${escapeHtml(sz || a.contentType || '')}</div></div>`;
      if (url) return `<a class="att-card" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${inner}<span class="dl-btn">↓ Open</span></a>`;
      return `<div class="att-card">${inner}</div>`;
    }).join('');
    html += `<div class="attachments"><div class="att-title">Attachments (${list.length})</div><div class="att-list">${cards}</div></div>`;
  }
  return html;
}

function buildEmlFooter(emlUrl){
  if (!emlUrl) return '';
  return `<div class="preview-eml-footer"><a class="btn-eml" href="${escapeHtml(emlUrl)}" target="_blank" rel="noopener noreferrer"><svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Download raw .eml</a><p class="eml-hint">Full RFC822 message for archiving, forwarding, or debugging. Opens in a new tab.</p></div>`;
}

function mapApiEmail(e, idx){
  const raw = e.raw || {};
  let fromAddr = e.from_address;
  let fromNm = e.from_name;
  const fp = raw.from_parsed;
  if (!fromAddr && Array.isArray(fp) && fp[0] && typeof fp[0] === 'object'){
    fromAddr = fp[0].address || null;
    fromNm = (fp[0].name !== undefined && fp[0].name !== '') ? fp[0].name : fromNm;
  }
  return {
    id: e.id ?? `${e.timestamp ?? ''}-${idx}`,
    sender: e.from_name || fromNm || (fromAddr ? String(fromAddr).split('@')[0] : '') || 'Sender',
    from: e.from || fromAddr || '',
    subject: e.subject || '(no subject)',
    preview: (e.text ? String(e.text).slice(0, 90) : '') || '',
    time: fmtTime(e.timestamp),
    unread: true,
    html: e.html || null,
    text: e.text || null,
    spf: e.spf ?? raw.SPF ?? raw.spf ?? null,
    dkim: e.dkim ?? raw.dkim ?? null,
    attachments: Array.isArray(e.attachments) ? e.attachments : [],
    downloadUrl: e.downloadUrl ?? raw.downloadUrl ?? null,
    raw,
  };
}

function generateEmail(){
  if(generated)return;generated=true;
  const btn=document.getElementById('genBtn');
  btn.textContent='Generating...';btn.style.opacity='0.75';btn.style.cursor='default';

  fetch(apiEndpoint() + "?action=generate",{
    method:'POST',
    headers:{'Content-Type':'application/json','Accept':'application/json','X-CSRF-TOKEN':csrfToken()},
    body: JSON.stringify({})
  }).then(parseApiResponse).then(data=>{
    if(!data?.ok) throw new Error(data?.message || 'Failed to generate email');
    mailboxTag = data.tag;
    mailboxTimestampFrom = data.timestamp_from;

    document.getElementById('emailVal').value = data.email;
    document.getElementById('emailDisplay').style.display='block';
    btn.textContent='✓ Email Generated!';
    btn.style.background='linear-gradient(135deg,#059669,#0d9488)';
    startTimer();showMailbox();

    refreshInbox({ manual: false });
  }).catch(err=>{
    generated=false;
    btn.textContent='✦ Generate Email Address';
    btn.style.opacity='1';btn.style.cursor='pointer';
    const failed = String(err?.message || '').toLowerCase().includes('failed to fetch') || err?.name === 'TypeError';
    alert(failed
      ? 'Could not reach the temp mail API. Check your connection and try again.'
      : (err?.message || 'Something went wrong'));
  });
}

function startTimer(){
  timerInt=setInterval(()=>{
    timerSec--;
    const m=Math.floor(timerSec/60),s=timerSec%60;
    document.getElementById('timerTxt').textContent=`Expires in ${m}:${s.toString().padStart(2,'0')}`;
    if(timerSec<=0){clearInterval(timerInt);document.getElementById('timerTxt').textContent='Session expired';}
  },1000);
}

function copyEmail(){
  navigator.clipboard.writeText(document.getElementById('emailVal').value).catch(()=>{});
  const tip=document.getElementById('copyTip');tip.classList.add('show');
  setTimeout(()=>tip.classList.remove('show'),1500);
}

function showMailbox(){
  const mb=document.getElementById('mailbox');mb.style.display='block';
  mb.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function renderSkeletons(){
  const el=document.getElementById('emailList');
  if(!el) return;
  el.innerHTML='';
  for(let i=0;i<3;i++)el.innerHTML+=`<div class="skel-row" aria-hidden="true"><div class="skel" style="height:11px;width:55%;margin-bottom:8px"></div><div class="skel" style="height:10px;width:80%;margin-bottom:6px"></div><div class="skel" style="height:9px;width:48%"></div></div>`;
}

function renderEmails(){
  const el=document.getElementById('emailList');
  if(!el) return;

  // Keep skeleton while a fetch is still in flight and the list is empty.
  if(inboxEmails.length === 0 && inboxFetchDepth > 0){
    renderSkeletons();
    updateCounts();
    syncListLoadingUi();
    return;
  }

  el.innerHTML='';
  inboxEmails.forEach(e=>el.appendChild(makeItem(e)));
  updateCounts();
  if(!inboxEmails.length){
    el.innerHTML = `<div style="padding:18px;color:rgba(255,255,255,0.35);font-size:12px">No emails yet. Click “Refresh inbox” after something sends to this address.</div>`;
  }
  syncListLoadingUi();
}

function makeItem(e){
  const d=document.createElement('div');
  d.className='email-item'+(currentEmail&&currentEmail.id===e.id?' active':'');
  d.onclick=()=>openEmail(e,d);
  const sender = escapeHtml(e.sender || 'Unknown');
  const subject = escapeHtml(e.subject || '(no subject)');
  const preview = escapeHtml(e.preview || '');
  const time = escapeHtml(e.time || '');
  const rep = repMiniHtml(e.spf, e.dkim);
  const attHint = (e.attachments && e.attachments.length) ? `<span style="font-size:10px;color:rgba(212,92,92,0.85);margin-left:4px;flex-shrink:0" title="Has attachments">📎${e.attachments.length}</span>` : '';
  d.innerHTML=`<div class="item-top"><div class="item-top-main">${e.unread?'<div class="unread-dot"></div>':''}<span class="sender">${sender}</span>${attHint}</div><div class="item-top-meta"><span class="item-time">${time}</span>${rep}</div></div><div class="item-subject">${subject}</div><div class="item-preview">${preview}</div>`;
  return d;
}

function openEmail(e,el){
  document.querySelectorAll('.email-item').forEach(i=>i.classList.remove('active'));
  el.classList.add('active');
  e.unread=false;currentEmail=e;
  if(isMobile())switchTab('preview');
  document.getElementById('emptyState').style.display='none';
  const pc=document.getElementById('previewContent');
  pc.style.display='flex';
  const tAddr=document.getElementById('emailVal').value;
  const from = escapeHtml(e.from || '');
  const at = escapeHtml(e.time || '');
  const subject = escapeHtml(e.subject || '(no subject)');

  let innerBody = '';
  if(e.html){
    innerBody = e.html;
  }else if(e.text){
    innerBody = `<pre>${escapeHtml(e.text)}</pre>`;
  }else if(e.raw){
    innerBody = `<pre>${escapeHtml(JSON.stringify(e.raw,null,2))}</pre>`;
  }else{
    innerBody = `<div style="opacity:.6">No body available.</div>`;
  }
  const bodyHtml = `<div class="preview-body-inner">${innerBody}</div>`;

  const repBlock = repRowHtml(e.spf, e.dkim);
  const attBlock = buildAttachmentsHtml(e.attachments);
  const emlBlock = buildEmlFooter(e.downloadUrl);
  pc.innerHTML=`<div class="preview-header"><div class="preview-header-top"><h2 class="preview-subject">${subject}</h2><div class="preview-header-rep" aria-label="SPF and DKIM">${repBlock}</div></div><div class="meta-row"><span class="meta-label">From</span><span class="meta-value">${from}</span></div><div class="meta-row"><span class="meta-label">To</span><span class="meta-value" style="color:#D45C5C">${escapeHtml(tAddr)}</span></div><div class="meta-row"><span class="meta-label">At</span><span class="meta-value">${at}</span></div></div><div class="preview-body">${bodyHtml}</div>${attBlock}${emlBlock}`;
  updateCounts();
}

function switchTab(tab){
  const lp=document.getElementById('listPanel'),pp=document.getElementById('previewPanel');
  const ti=document.getElementById('tabInbox'),tp=document.getElementById('tabPreview');
  const bb=document.getElementById('backBtn');
  if(tab==='inbox'){
    lp.classList.remove('mobile-hide');pp.classList.remove('mobile-show');
    ti.classList.add('active');tp.classList.remove('active');bb.style.display='none';
  }else{
    lp.classList.add('mobile-hide');pp.classList.add('mobile-show');
    tp.classList.add('active');ti.classList.remove('active');
    if(currentEmail)bb.style.display='flex';
  }
}

function refreshInbox(opts){
  const o = opts || {};
  const manual = o.manual === true;
  const icon=document.getElementById('refreshIcon');
  if(!mailboxTag) return;
  if(manual) icon.classList.add('spin');

  beginInboxFetch();
  if(inboxEmails.length === 0) renderSkeletons();

  const qs = new URLSearchParams({
    tag: mailboxTag,
    timestamp_from: mailboxTimestampFrom ? String(mailboxTimestampFrom) : '',
  });

  fetch(`${apiEndpoint()}?action=inbox&${qs.toString()}`,{
    headers:{'Accept':'application/json'}
  }).then(parseApiResponse).then(data=>{
    if(!data?.ok) throw new Error(data?.message || 'Failed to fetch inbox');

    inboxEmails = (data.emails || []).map(mapApiEmail);

    renderEmails();
  }).catch(err=>{
    document.getElementById('emailList').innerHTML = `<div style="padding:18px;color:rgba(255,255,255,0.35);font-size:12px">${escapeHtml(err?.message || 'Failed to refresh inbox')}</div>`;
  }).finally(()=>{
    if(manual) icon.classList.remove('spin');
    endInboxFetch();
  });
}

const w = window as unknown as Record<string, unknown>;
w.generateEmail = generateEmail;
w.copyEmail = copyEmail;
w.refreshInbox = refreshInbox;
w.switchTab = switchTab;

return () => {
  delete w.generateEmail;
  delete w.copyEmail;
  delete w.refreshInbox;
  delete w.switchTab;
};
}
