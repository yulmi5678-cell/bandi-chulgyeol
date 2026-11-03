import * as S from './store.js';
import * as L from './logic.js?v=10';
import { buildXlsx } from './xlsx.js?v=4';
const $root = document.getElementById('root'), TODAY = () => L.today();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PC = { 정상: ['#eff6ff', '#2563eb', '#16a34a'], 소급: ['#fff8e8', '#d98a1f', '#d98a1f'], 송영: ['#ecfeff', '#0e7490', '#0e7490'], 인정: ['#f5f0ff', '#6d3fc4', '#6d3fc4'] };
const SVG = { cal: '<path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 15l2 2 4-4"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.5-6 6-6s6 2.500 6 6M16 5a3.500 3.500 0 0 1 0 6.500M18 14.500c2 .7 3 2.600 3 5.500"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>', file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 12l6 6M15 12l-6 6"/>', phone: '<rect x="7" y="2.500" width="10" height="19" rx="2"/><path d="M11 18.500h2"/>', swap: '<path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/>', cog: '<circle cx="9" cy="8" r="4"/><path d="M3 20c0-3.500 2.500-6 6-6 1 0 2 .2 2.800.6"/><circle cx="17.500" cy="17.500" r="2.500"/><path d="M17.500 13v2M17.500 20v2M13 17.500h2M20 17.500h2"/>', out: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>' };
const A = { phase: 'loading', authMode: 'login', err: '', msg: '', busy: false, me: null, teachers: [], students: [], rec: new Map(), months: [], unsub: [], recUnsub: null, screen: 'main', cur: TODAY(), mon: L.mondayOf(TODAY()), filter: '전체', open: {}, edit: {}, adding: false, ed: null, delPop: null, book: '', bdFold: false, more: '', blPop: null, blocks: new Map(), notices: [], ntOff: new Set(), peer: '', ack: {}, online: true, mgr: '', draft: null, from: TODAY(), sErr: '', sMsg: '', hF: '', hS: '전체', hT: '', hD: TODAY(), hErr: '', hMsg: '', tErr: '', tMsg: '', code: null, modal: null, installEvt: null };
const recs = () => [...A.rec.values()];
const toast = m => { const t = document.getElementById('tst'); t.innerHTML = `<div class="toast">${esc(m)}</div>`; setTimeout(() => t.innerHTML = '', 2600); };
const fail = e => { console.error(e); toast(e?.message && /[가-힣]/.test(e.message) ? e.message : '저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'); };
const authErr = e => e?.message && /[가-힣]/.test(e.message) ? e.message : ({ 'auth/invalid-credential': '이름이나 암호가 맞지 않아요.', 'auth/wrong-password': '암호가 맞지 않아요.', 'auth/weak-password': '암호는 6자 이상으로 입력해 주세요.', 'auth/too-many-requests': '시도가 너무 많아요. 잠시 뒤에 다시 해 주세요.', 'auth/network-request-failed': '인터넷 연결을 확인해 주세요.', 'auth/operation-not-allowed': '앱 설정이 아직 끝나지 않았어요.' }[e?.code] || '처리하지 못했어요. 잠시 뒤 다시 해 주세요.');
const books = () => [A.me, ...(A.me?.manages || []).filter(i => i !== A.me?.id).map(i => A.teachers.find(x => x.id === i)).filter(Boolean)];
const bkId = () => A.book && books().some(x => x.id === A.book) ? A.book : A.me.id;
const bkName = () => books().find(x => x.id === bkId())?.name || A.me.name;
const blk = (d, sid) => { const b = A.blocks.get(`${d}_${sid}`); return b && b.active ? b : null; };
L.setBlockedFn(blk);
const myStudents = () => A.students.filter(s => L.ownerAt(s, '9999-12-31') === bkId());
const hasFocusInput = () => ['INPUT', 'SELECT'].includes(document.activeElement?.tagName);
let later = false;
function soft() { if (hasFocusInput()) { later = true; return; } render(); }
document.addEventListener('focusout', () => setTimeout(() => { if (later && !hasFocusInput()) { later = false; render(); } }, 80));

const settle = () => new Promise(r => { document.activeElement?.blur?.(); setTimeout(r, 120); });
function timeField(k, cls, label, v) {
  const [H, M] = (v || '16:00').split(':').map(Number), pm = H >= 12, h = H % 12 || 12, mm = String(M).padStart(2, '0'), std = mm === '00' || mm === '30';
  return `<div class="field tf" data-k="${k}"><span>${label}</span><input type="hidden" ${cls} value="${esc(v)}"><div class="t3"><select class="ap" aria-label="${label} 오전 오후" style="color:${pm ? '#d98a1f' : '#2563eb'}"><option value="0" style="color:#2563eb" ${pm ? '' : 'selected'}>오전</option><option value="12" style="color:#d98a1f" ${pm ? 'selected' : ''}>오후</option></select><select class="th" aria-label="${label} 시">${Array.from({ length: 12 }, (_, i) => `<option value="${i + 1}" ${i + 1 === h ? 'selected' : ''}>${i + 1}시</option>`).join('')}</select><select class="tm" aria-label="${label} 분"><option value="00" ${mm === '00' ? 'selected' : ''}>00분</option><option value="30" ${mm === '30' ? 'selected' : ''}>30분</option>${std ? '' : `<option value="${mm}" selected>${mm}분</option>`}<option value="c">직접 입력</option></select></div><input class="tc" inputmode="numeric" maxlength="2" aria-label="분 직접 입력" placeholder="분 직접 입력 (예: 40)" style="display:none;margin-top:6px"></div>`;
}
function setHours(f, h) {
  const max = +f.dataset.max, v = Math.min(h, max), w = Math.floor(v), hh = f.querySelector('.hh'), mm = f.querySelector('.mm');
  hh.value = w; mm.options[1].disabled = w === max; mm.value = v - w > 0 ? '30' : '0'; f.querySelector('.ht').value = `${w}:${mm.value === '30' ? '30' : '00'}`;
}
function bindTimes(root) {
  root.querySelectorAll('.tf').forEach(f => {
    const hid = f.querySelector('input[type=hidden]'), ap = f.querySelector('.ap'), th = f.querySelector('.th'), tm = f.querySelector('.tm'), tc = f.querySelector('.tc');
    const up = () => {
      ap.style.color = ap.value === '12' ? '#d98a1f' : '#2563eb';
      const m = tm.value === 'c' ? tc.value.trim() : tm.value, bad = !/^\d{1,2}$/.test(m) || +m > 59;
      hid.value = bad ? '' : `${String(+th.value % 12 + +ap.value).padStart(2, '0')}:${m.padStart(2, '0')}`;
      const box = f.closest('.tbox'); if (!box) return;
      const h = L.calcHours(box.querySelector('[data-k=s] input[type=hidden]').value, box.querySelector('[data-k=e] input[type=hidden]').value), hf = box.querySelector('.hf');
      if (h != null && hf) setHours(hf, h);
    };
    ap.onchange = up; th.onchange = up; tc.onchange = up;
    tm.onchange = () => { tc.style.display = tm.value === 'c' ? 'block' : 'none'; if (tm.value === 'c') tc.focus(); up(); };
  });
}
const sn = (sid, name) => `<span class="sc" style="background:${L.colorOf(A.students.find(s => s.id === sid), sid)}">${esc(name)}</span>`;
const CK = '<span class="ck">✓</span>';
const stuTot = (list, m) => list.length ? list.map(s => { const t = L.totals(recs().filter(r => r.sid === s.id && r.month === m)), a = Object.values(t).reduce((x, y) => x + y, 0); return `<div class="box st"><div class="rh">${sn(s.id, s.name)}<b class="v2">합계 ${L.fmt(a)}</b></div><div class="meta">${L.ALL_PAYS.map(p => `<span style="color:${PC[p][2]};font-weight:600">${p} ${L.fmt(t[p])}</span>`).join(' · ')}</div></div>`; }).join('') : '<div class="meta">아직 학생이 없어요.</div>';
function hoursField(id, h, max, label = '기록 시간') {
  const w = Math.floor(h), m = h - w > 0 ? 30 : 0;
  return `<div class="field hf" data-max="${max}" id="${id}"><span>${esc(label)}</span><div class="two"><select class="hh" aria-label="시간">${Array.from({ length: max + 1 }, (_, i) => `<option value="${i}" ${i === w ? 'selected' : ''}>${i}시간</option>`).join('')}</select><select class="mm" aria-label="분"><option value="0" ${!m ? 'selected' : ''}>00분</option><option value="30" ${m ? 'selected' : ''} ${w === max ? 'disabled' : ''}>30분</option></select></div><input class="ht" inputmode="text" aria-label="직접 입력" placeholder="직접 입력 (예: 2:30)" value="${w}:${m ? '30' : '00'}"></div>`;
}
function bindHours(root, onChange) {
  root.querySelectorAll('.hf').forEach(f => {
    const hh = f.querySelector('.hh'), mm = f.querySelector('.mm'), ht = f.querySelector('.ht'), max = +f.dataset.max;
    const fromSel = () => { const atMax = +hh.value === max; mm.options[1].disabled = atMax; if (atMax) mm.value = '0'; ht.value = `${hh.value}:${mm.value === '30' ? '30' : '00'}`; onChange?.(f, +hh.value + +mm.value / 60); };
    hh.onchange = fromSel; mm.onchange = fromSel;
    ht.onchange = () => { const r = L.parseHours(ht.value, max); if (r.h != null) { const w = Math.floor(r.h); hh.value = w; mm.options[1].disabled = w === max; mm.value = r.h - w > 0 ? '30' : '0'; ht.value = `${w}:${mm.value === '30' ? '30' : '00'}`; onChange?.(f, r.h); } };
  });
}
function readHours(f) { const ht = f.querySelector('.ht'), max = +f.dataset.max; return L.parseHours(ht.value, max); }

const qic = n => `<svg class="qic" viewBox="0 0 24 24" aria-hidden="true">${SVG[n]}</svg>`;
function bookBar() {
  const bs = books(); if (bs.length < 2) return '';
  const left = b => L.cardsFor(TODAY(), b.id, A.students, recs()).filter(c => L.isPending(c, TODAY())).length, cur = bkId();
  return `<label class="bookw ${cur === A.me.id ? '' : 'other'}">출결부<select id="bkS">${bs.map(b => `<option value="${b.id}" ${b.id === cur ? 'selected' : ''}>${esc(b.name)}${b.id === A.me.id ? ' (내 출결부)' : ''}${left(b) ? ` · 오늘 ${left(b)}건 남음` : ''}</option>`).join('')}</select></label>`;
}
function setBook(id) { A.book = id; A.filter = '전체'; A.mgr = ''; A.draft = null; A.sfS = ''; A.sfMsg = ''; A.ack = {}; A.ed = null; A.delPop = null; A.bdPop = null; A.blPop = null; A.more = ''; }
function header() {
  return `<header class="top"><div class="brand"><img src="icon-192.png" alt="반디 로고"><div class="tt"><div class="ttl">반디 방과후활동 출결부</div><div class="who">${esc(A.me.name)} 선생님${A.me.boss ? ' · 관리자' : ''}</div></div><span class="qm" style="background:${A.online ? '#10b981' : '#d98a1f'}">${A.online ? '연동중' : '연결 끊김'}</span></div><div class="qb"><button id="mb">${A.screen === 'main' ? '메뉴' : '출결부'}</button><span class="qg" style="background:${A.online ? '#10b981' : '#d98a1f'}">${A.online ? '연동중' : '연결 끊김'}</span><button id="qSch" class="qi">${qic('clock')}시간표·학생 관리</button><button id="qStf" class="qi">${qic('swap')}제공인력 변경</button><button id="qPeer" class="qo">${qic('users')}동료 출결부</button><button id="qXl" class="qx">${qic('file')}엑셀 다운로드</button><button id="qOut" class="qk">${qic('out')}로그아웃</button></div>${bookBar()}</header>`;
}
function dateCell(d) {
  const cards = L.cardsFor(d, bkId(), A.students, recs()), live = cards.filter(c => !c.removed && (A.filter === '전체' || c.sid === A.filter)), ok = live.length && live.every(c => c.done), isT = d === TODAY(), hol = L.HOLIDAYS[d], w = L.weekday(d);
  const bg = isT ? '#2563eb' : ok ? '#f8fafc' : live.length && !hol ? '#eaf2ff' : '#fff';
  const fg = isT ? '#fff' : hol ? '#c62828' : w === 6 ? '#2563eb' : ok ? '#94a3b8' : live.length ? '#1e3a8a' : '#334155';
  const bd = d === A.cur ? '2.5px solid #1e293b' : isT ? '1px solid #2563eb' : live.length && !ok && !hol ? '1px solid #bfdbfe' : '1px solid #e2e8f0';
  const tag = isT ? (hol ? '오늘·공휴일' : ok ? '오늘 ' + CK : '오늘') : ok ? CK : '';
  return `<button class="dc" data-d="${d}" style="background:${bg};color:${fg};border:${bd}"><small>${tag}</small><b>${L.md(d)}</b><b>${L.WD[w]}</b></button>`;
}
const bulkBtns = () => '<div class="two bulk"><button class="bulkGo p">이 달 일괄 출석</button><button class="bulkUn">일괄 취소</button></div>';
function bulkTargets(m) {
  const out = [], t = TODAY(), end = L.lastDay(m) < t ? L.lastDay(m) : t;
  for (let d = m + '-01'; d <= end; d = L.add(d, 1)) {
    if (L.HOLIDAYS[d] || L.weekday(d) === 0) continue;
    L.cardsFor(d, bkId(), A.students, recs()).forEach(c => { if (!c.saved && !blk(d, c.sid)) out.push(c); });
  }
  return out;
}
function monthCal(m) {
  const first = L.weekday(m + '-01'), last = L.lastDay(m), cells = [];
  for (let i = 0; i < first; i++) cells.push('<span></span>');
  for (let d = m + '-01'; d <= last; d = L.add(d, 1)) {
    const live = L.cardsFor(d, bkId(), A.students, recs()).filter(c => !c.removed && (A.filter === '전체' || c.sid === A.filter)), ok = live.length && live.every(c => c.done), hol = L.HOLIDAYS[d], w = L.weekday(d), isT = d === TODAY();
    const bg = isT ? '#2563eb' : ok ? '#f8fafc' : live.length && !hol ? '#eaf2ff' : '#fff', fg = isT ? '#fff' : hol ? '#c62828' : w === 6 ? '#2563eb' : ok ? '#94a3b8' : w === 0 ? '#94a3b8' : '#1e3a8a';
    cells.push(`<button class="cd2" data-d="${d}" title="${esc(hol || '')}" style="background:${bg};color:${fg};${d === A.cur ? 'outline:2px solid #1e293b' : ''}">${+d.slice(8)}${ok ? '<em>✓</em>' : ''}</button>`);
  }
  return `<div class="cal">${['일', '월', '화', '수', '목', '금', '토'].map(x => `<b>${x}</b>`).join('')}${cells.join('')}</div>`;
}
function bdPopHtml() {
  const p = A.bdPop, c = L.cardsFor(p.date, p.own, A.students, recs()).find(x => x.id === p.id && x.done && !x.removed); if (!c) { A.bdPop = null; return ''; }
  return `<div class="back"><div class="card ed"><button id="bpX" class="edx" aria-label="창 닫기">✕</button>${p.ask ? `<div class="edt">삭제하시겠습니까?</div><div class="meta" style="margin:6px 0 12px">이 날 일정과 기록이 지워져요. 다음 주 시간표는 그대로예요.</div><button id="bpD" class="wide" style="margin:0;color:#c62828;border-color:#fecaca">삭제</button>` : `<div class="edt">${esc(c.sname)} · ${dl(p.date)}</div><div class="meta" style="margin:6px 0 12px">${L.fmt(c.h)} · ${esc(c.pay)}결제 출석했어요.</div><div class="two" style="margin:0"><button id="bpU">출석 취소하기</button><button id="bpA" style="color:#c62828;border-color:#fecaca">삭제하기</button></div>`}</div></div>`;
}
function bindBdPop() {
  const $ = i => $root.querySelector(i), p = A.bdPop, card = () => L.cardsFor(p.date, p.own, A.students, recs()).find(x => x.id === p.id);
  $('#bpX').onclick = () => { A.bdPop = null; render(); };
  if ($('#bpA')) $('#bpA').onclick = () => { p.ask = true; render(); };
  if ($('#bpU')) $('#bpU').onclick = () => { const c = card(); A.bdPop = null; if (c) { saveCard(c, { done: false }, p.own); toast('출석을 취소했어요'); } render(); };
  if ($('#bpD')) $('#bpD').onclick = () => { const c = card(); A.bdPop = null; if (c) dropRec(c).then(() => toast('삭제했어요')).catch(fail); render(); };
}
async function doBlock(date, sid, sname, tid, reason) {
  const b = { id: `${date}_${sid}`, date, sid, sname, tid, tname: A.teachers.find(x => x.id === tid)?.name || '', reason, by: A.me.name, at: Date.now(), active: true };
  A.blocks.set(b.id, b); render();
  try { await S.saveBlock(b); const list = (await S.recordsOf(sid)).filter(r => r.date === date && r.done && !r.removed && !r.id.startsWith('ack_')); await Promise.all(list.map(r => S.saveRecord({ ...r, done: false, by: A.me.name, updatedAt: Date.now() }))); toast('출석을 막았어요'); } catch (e) { A.blocks.delete(b.id); fail(e); render(); }
}
function freeBlock(date, sid) {
  const b = blk(date, sid); if (!b) return; const n = { ...b, active: false, freedBy: A.me.name, freedAt: Date.now() };
  A.blocks.set(b.id, n); render(); S.saveBlock(n).then(() => toast('출석을 풀었어요')).catch(e => { A.blocks.set(b.id, b); fail(e); render(); });
}
function blPopHtml() {
  const p = A.blPop;
  if (p.ask) return `<div class="back"><div class="card ed"><button id="bxX" class="edx" aria-label="창 닫기">✕</button><div class="edt">${dl(p.date)} ${esc(p.sname)} 출석 막기</div>${p.err ? `<p class="err">${esc(p.err)}</p>` : ''}<label class="field" style="margin-top:8px">메모 (안 써도 돼요)<input id="bxR" placeholder="메모 입력"></label><button id="bxG" class="wide" style="margin:0;color:#c62828;border-color:#fecaca">막기</button></div></div>`;
  const b = blk(p.date, p.sid); if (!b) { A.blPop = null; return ''; }
  return `<div class="back"><div class="card ed"><button id="bxX" class="edx" aria-label="창 닫기">✕</button><div class="edt">${dl(p.date)} ${esc(b.sname)}</div><div class="meta" style="margin:6px 0">출석 불가예요.</div>${b.reason ? `<div style="font-size:15px;line-height:1.5;white-space:pre-wrap">메모: ${esc(b.reason)}</div>` : ''}<div class="meta" style="margin-top:4px">막은 사람: ${esc(b.by)} · 더보기나 메뉴의 출석 막기·풀기에서 풀 수 있어요.</div></div></div>`;
}
function bindBlPop() {
  const $ = i => $root.querySelector(i), p = A.blPop; $('#bxX').onclick = () => { A.blPop = null; render(); };
  if ($('#bxG')) $('#bxG').onclick = () => { const v = $('#bxR').value.trim(); A.blPop = null; doBlock(p.date, p.sid, p.sname, p.tid, v); };
}
const seenN = () => { try { return JSON.parse(localStorage.getItem('bandi-seen-notices') || '[]'); } catch { return []; } };
const liveN = () => { const t = TODAY(); return A.notices.filter(n => !n.off && n.from <= t && t <= n.to).sort((a, b) => b.at - a.at); };
const popN = () => { if (A.ed || A.modal || A.delPop || A.bdPop || A.blPop) return null; const s = seenN(); return liveN().find(n => !s.includes(n.id) && !A.ntOff.has(n.id)) || null; };
function ntPopHtml(n) { return `<div class="back"><div class="card ed"><button id="nxX" class="edx" aria-label="창 닫기">✕</button><div class="edt">공지사항</div><div style="font-size:15px;line-height:1.5;margin:8px 0;white-space:pre-wrap">${esc(n.text)}</div><div class="meta" style="margin-bottom:10px">${L.label(n.to)}까지 메뉴의 공지사항에서 다시 볼 수 있어요.</div><button id="nxO" class="wide p" style="margin:0">확인했어요</button></div></div>`; }
function bindNtPop(n) { const $ = i => $root.querySelector(i); $('#nxX').onclick = () => { A.ntOff.add(n.id); render(); }; $('#nxO').onclick = () => { try { localStorage.setItem('bandi-seen-notices', JSON.stringify([...seenN(), n.id].slice(-100))); } catch { A.ntOff.add(n.id); } render(); }; }
function noticesScreen() { const l = liveN(); return `${backBtn('공지사항')}<div class="card">${l.length ? l.map(n => `<div class="lr" style="padding:8px 0"><div style="font-weight:600;white-space:pre-wrap">${esc(n.text)}</div><div class="meta">${L.label(n.to)}까지</div></div>`).join('') : '<div class="meta">지금 공지가 없어요.</div>'}</div>`; }
function bindNotices(r) { r.querySelector('#bk').onclick = () => go('menu'); }
function ntWriteScreen() {
  const t = TODAY(), l = A.notices.slice().sort((a, b) => b.at - a.at).slice(0, 20);
  return `${backBtn('공지 쓰기')}${A.nErr ? `<p class="err">${esc(A.nErr)}</p>` : ''}<div class="card"><label class="field">내용<textarea id="nT" rows="3" style="width:100%;font:inherit;border:1px solid #cbd5e1;border-radius:12px;padding:10px" placeholder="예: 11/7 (토) 학생 이름 결재 없음"></textarea></label><div class="two"><label class="field">시작일<input id="nF" type="date" value="${t}"></label><label class="field">끝나는 날<input id="nE" type="date" value="${L.lastDay(L.monthOf(t))}"></label></div><button id="nG" class="wide p" style="margin:0">공지 올리기</button></div><div class="h">올린 공지</div><div class="card">${l.length ? l.map(n => { const on = !n.off && n.from <= t && t <= n.to; return `<div data-n="${esc(n.id)}" style="padding:8px 0;border-top:1px solid #edf1f6"><div style="font-weight:600;white-space:pre-wrap">${esc(n.text)}</div><div class="meta">${on ? '보이는 중' : n.off ? '내린 공지' : n.to < t ? '기간 끝남' : '시작 전'} · ${esc(n.by || '')}</div>${n.off ? '' : `<div class="two" style="margin-top:6px"><label class="field" style="margin:0">끝나는 날<input class="nEd" type="date" value="${esc(n.to)}"></label><button class="nOff" style="align-self:end;color:#c62828;border-color:#fecaca">공지 내리기</button></div>`}</div>`; }).join('') : '<div class="meta">올린 공지가 없어요.</div>'}</div>`;
}
function bindNtWrite(r) {
  r.querySelector('#bk').onclick = () => { A.nErr = ''; go('menu'); };
  r.querySelector('#nG').onclick = () => { const text = r.querySelector('#nT').value.trim(), from = r.querySelector('#nF').value, to = r.querySelector('#nE').value; A.nErr = ''; if (!text) A.nErr = '내용을 입력해 주세요.'; else if (!from || !to || from > to) A.nErr = '끝나는 날은 시작일보다 늦어야 해요.'; if (A.nErr) return render(); const id = S.newNoticeId(); try { localStorage.setItem('bandi-seen-notices', JSON.stringify([...seenN(), id].slice(-100))); } catch { A.ntOff.add(id); } document.activeElement?.blur?.(); S.saveNotice({ id, text, from, to, by: A.me.name, at: Date.now(), off: false }).then(() => toast('공지를 올렸어요')).catch(fail); };
  r.querySelectorAll('[data-n]').forEach(el => { const n = A.notices.find(x => x.id === el.dataset.n), e = el.querySelector('.nEd'), o = el.querySelector('.nOff'); if (e) e.onchange = () => { if (e.value && e.value >= n.from) { e.blur(); S.saveNotice({ ...n, to: e.value }).then(() => toast('저장되었어요 ✓')).catch(fail); } }; if (o) o.onclick = () => { A.modal = { text: '이 공지를 내릴까요?', yes: '공지 내리기', run: () => S.saveNotice({ ...n, off: true }).catch(fail) }; render(); }; });
}
function blocksScreen() {
  const all = A.students.filter(s => !s.endDate || s.endDate >= TODAY()), who = s => A.teachers.find(x => x.id === L.ownerAt(s, '9999-12-31'))?.name || '';
  if (!all.some(s => s.id === A.blS)) A.blS = all[0]?.id || '';
  const on = [...A.blocks.values()].filter(b => b.active).sort((a, b) => a.date < b.date ? -1 : 1), off = [...A.blocks.values()].filter(b => !b.active).sort((a, b) => b.freedAt - a.freedAt).slice(0, 5);
  return `${backBtn('출석 막기·풀기')}${A.blE ? `<p class="err">${esc(A.blE)}</p>` : ''}<div class="card"><div class="meta" style="margin-bottom:8px">모든 선생님이 쓸 수 있어요. 막으면 그날 출석은 자동으로 취소돼요.</div><div class="two"><label class="field">날짜<input id="bD" type="date" value="${esc(A.blD || TODAY())}"></label><label class="field">학생<select id="bS">${all.map(s => `<option value="${esc(s.id)}" ${s.id === A.blS ? 'selected' : ''}>${esc(s.name)} · ${esc(who(s))}</option>`).join('')}</select></label></div><label class="field">메모 (안 써도 돼요)<input id="bR" placeholder="메모 입력" value="${esc(A.blR || '')}"></label><button id="bG" class="wide" style="margin:0;color:#c62828;border-color:#fecaca">출석 막기</button></div><div class="h">지금 막혀 있는 날</div><div class="card">${on.length ? on.map(b => `<div class="lr" style="padding:8px 0;display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="min-width:0"><div style="font-weight:600">${dl(b.date)} · ${esc(b.sname)}</div><div class="meta">${b.reason ? `메모: ${esc(b.reason)} · ` : ''}막은 사람: ${esc(b.by)}</div></div><button class="bFr" data-d="${esc(b.date)}" data-s="${esc(b.sid)}" style="flex:none;padding:0 10px">출석 풀기</button></div>`).join('') : '<div class="meta">막혀 있는 날이 없어요.</div>'}</div><div class="h">최근에 풀린 날</div><div class="card">${off.length ? off.map(b => `<div style="padding:6px 0"><div style="font-weight:600">${dl(b.date)} · ${esc(b.sname)}</div><div class="meta">푼 사람: ${esc(b.freedBy || '')}</div></div>`).join('') : '<div class="meta">아직 풀린 날이 없어요.</div>'}</div>`;
}
function bindBlocks(r) {
  r.querySelector('#bk').onclick = () => { A.blE = ''; go('menu'); };
  const pull = () => { A.blD = r.querySelector('#bD').value; A.blS = r.querySelector('#bS').value; A.blR = r.querySelector('#bR').value; };
  r.querySelector('#bD').onchange = pull; r.querySelector('#bS').onchange = pull; r.querySelector('#bR').oninput = pull;
  r.querySelector('#bG').onclick = () => { pull(); const st = A.students.find(s => s.id === A.blS), v = (A.blR || '').trim(); A.blE = ''; if (!A.blD) A.blE = '날짜를 골라 주세요.'; else if (!st) A.blE = '학생이 없어요.'; else if (blk(A.blD, st.id)) A.blE = '이미 막혀 있는 날이에요.'; if (A.blE) return render(); A.blR = ''; document.activeElement?.blur?.(); doBlock(A.blD, st.id, st.name, L.ownerAt(st, A.blD), v); };
  r.querySelectorAll('.bFr').forEach(b => b.onclick = () => freeBlock(b.dataset.d, b.dataset.s));
}
function boardHtml(d, m) {
  const ids = books().map(b => b.id), rows = [];
  ids.forEach(id => A.students.filter(s => L.ownerAt(s, d) === id && !(s.endDate && s.endDate < m + '-01')).forEach(s => {
    const cs = L.cardsFor(d, id, A.students, recs()).filter(c => c.sid === s.id && !c.removed), staff = cs[0]?.staff || L.staffAt(s, d) || books().find(b => b.id === id)?.name || '', lim = s.limit || 66, rem = Math.max(lim - L.cumulative(recs(), s.id, d), 0), un = cs.find(c => !c.done);
    rows.push(`<tr data-fs="${esc(s.id)}" data-bk="${id}" class="${id === bkId() && A.filter === s.id ? 'on' : ''}"><td>${esc(staff)}</td><td>${sn(s.id, s.name)}</td><td class="cv">${L.fmt(rem)}</td><td>${blk(d, s.id) ? `<button class="blkW bgb" data-d="${esc(d)}" data-s="${esc(s.id)}">불가</button>` : !cs.length ? '<span class="no">일정 없음</span>' : un ? `<button class="bdo" data-bo="${esc(un.id)}" data-own="${id}">출석</button>` : `<button class="bok" data-ok="${esc(cs[cs.length - 1].id)}" data-own="${id}" aria-label="${esc(s.name)} 출석 취소 또는 삭제">✓</button>`}</td></tr>`);
  }));
  return `<div class="card cg bdw"><div class="bdh"><b>학생 현황 · ${dl(d)}</b><button id="bdF" type="button">${A.bdFold ? '펼치기' : '접기'}</button></div>${rows.length ? `<div class="bdb ${A.bdFold ? 'fold' : ''}"><table class="bd"><thead><tr><th>제공인력</th><th>학생</th><th>잔여</th><th>오늘</th></tr></thead><tbody>${rows.join('')}</tbody></table></div>` : '<div class="meta">아직 학생이 없어요. 메뉴의 시간표와 학생 관리에서 추가해 주세요.</div>'}</div>`;
}
function mainScreen() {
  const d = A.cur, m = L.monthOf(d), list = L.cardsFor(d, bkId(), A.students, recs()), t0 = TODAY();
  const todayLeft = L.cardsFor(t0, bkId(), A.students, recs()).filter(c => L.isPending(c, t0)).length;
  const past = L.pendingDates(t0, bkId(), A.students, recs(), [L.monthOf(t0)]);
  const pastN = past.reduce((a, x) => a + x.n, 0);
  const names = A.students.filter(s => L.ownerAt(s, d) === bkId() && !(s.endDate && s.endDate < m + '-01'));
  if (A.filter !== '전체' && !names.some(s => s.id === A.filter)) A.filter = '전체';
  const shown = A.filter === '전체' ? names : names.filter(s => s.id === A.filter);
  const live = list.filter(c => !c.removed), slots = [...shown.map(s => { const cs = live.filter(c => c.sid === s.id); return cs.length ? cs.map(card).join('') : pinCard(s, A.filter === '전체'); }), ...live.filter(c => !names.some(s => s.id === c.sid) && A.filter === '전체').map(card)];
  const log = L.monthLog(recs(), m, bkId()).filter(r => A.filter === '전체' || r.sid === A.filter), tot = L.totals(L.monthLog(recs(), m, bkId()));
  const wk = Array.from({ length: 6 }, (_, i) => L.add(A.mon, i));
  const banners = `${todayLeft ? `<button class="ban" id="goToday" style="background:#ffedd5;color:#c2410c">오늘 출석 ${todayLeft}건이 남았어요</button>` : `<div class="ban" style="background:var(--sky);color:var(--navy)">오늘 남은 출석이 없어요 ✓</div>`}${pastN ? `<button class="ban" id="goPast" style="background:#fff8e8;color:#a96a12">지난 날짜에 안 누른 출석 ${pastN}건이 있어요<span class="pc2"> · ${L.md(past[0].date)} 보기</span><span class="mo2">${L.md(past[0].date)} 보기 ›</span></button>` : ''}`;
  const left = `${banners}${boardHtml(d, m)}
  <div class="nav"><button id="pv" aria-label="이전 주">‹</button><div>${L.md(wk[0])} ~ ${L.md(wk[5])}</div><button id="nx" aria-label="다음 주">›</button></div><div class="dd">${wk.map(dateCell).join('')}</div><div class="calw"><div class="calnav"><button id="cp" aria-label="이전 달">‹</button><b>${m.slice(0, 4)}년 ${+m.slice(5)}월</b><button id="cn" aria-label="다음 달">›</button></div>${monthCal(m)}${bulkBtns()}</div>
  </section><section class="col ca">${L.HOLIDAYS[d] ? `<div class="ok" style="background:#fdecea;color:#c62828">${esc(L.HOLIDAYS[d])} 공휴일이에요. 운영한 날이면 출석을 누르면 돼요.</div>` : ''}
  <div class="day">${dl(d)} 출석${A.filter === '전체' ? '' : ` · ${esc(names.find(s => s.id === A.filter).name)}만 보기`}${books().length > 1 ? `<span class="dbk ${bkId() === A.me.id ? 'me' : ''}">${esc(bkName())} 출결부</span>` : ''}</div>
  ${slots.length ? `<div class="slots">${slots.join('')}</div>` : '<div class="meta" style="margin:0 2px 10px">아직 학생이 없어요.</div>'}${A.filter === '전체' && slots.length && !live.length ? '<div class="meta mo" style="margin:0 2px 10px">이 날은 일정이 없어요. 위의 학생 칸을 누르면 입력할 수 있어요.</div>' : ''}<button id="addBtn" class="wide" style="margin:0 0 10px">+ 학생 직접 입력</button>
  <div class="h">${+m.slice(5)}월 인정결제 (학생별 월 1회)</div>${names.map(s => ackCard(s, m)).join('')}<div class="pcs"><div class="h">${+m.slice(5)}월 학생별 합계</div>${stuTot(shown, m)}</div>`;
  const osum = L.otherSummary(recs(), m, bkId(), A.students).filter(x => A.filter === '전체' || x.sid === A.filter);
  const fchips = `<div class="chips">${['전체', ...names.map(s => s.id)].map(id => `<button class="fl ${id === A.filter ? 'on' : ''}" data-id="${esc(id)}" style="${id !== '전체' && id === A.filter ? `background:${L.colorOf(names.find(n => n.id === id), id)};color:#fff;border-color:transparent` : ''}">${esc(id === '전체' ? '전체' : names.find(n => n.id === id).name)}</button>`).join('')}</div>`;
  const right = `<div class="mo"><div class="h">${+m.slice(5)}월 학생별 합계</div>${stuTot(shown, m)}</div>
  <div class="h">${+m.slice(5)}월 기록</div><div class="field"><input id="mp" type="month" aria-label="달 고르기" value="${m}"></div>${fchips}<div class="mo">${bulkBtns()}</div><div class="card">${log.length || osum.length ? osum.filter(x => x.phase === '이전').map(sumRow).join('') + log.map(logRow).join('') + osum.filter(x => x.phase === '이후').map(sumRow).join('') : '<div class="meta">아직 출석한 기록이 없어요.</div>'}</div>`;
  return `<div class="cols t-${A.tab || 'a'}"><section class="col ca">${left}</section><section class="col cb">${right}</section></div>`;
}
const pinCard = (s, pcOnly) => `<div class="card ${pcOnly ? 'pcpin' : ''}"><div class="rw"><div style="min-width:0"><div class="nm"><span class="ckb"></span>${sn(s.id, s.name)}</div><div class="meta">${blk(A.cur, s.id) ? '출석 불가예요.' : '이 날은 시간표가 없어요.'}</div></div><div class="ac">${blk(A.cur, s.id) ? `<button class="blkW bgr wd" data-d="${esc(A.cur)}" data-s="${esc(s.id)}">불가</button>` : `<button class="pinEd wd" data-pin="${esc(s.id)}">시간·결제 바꾸기</button>`}</div></div></div>`;
function card(c) {
  const k = PC[c.pay] || PC.정상, tot = L.cumulative(recs(), c.sid, A.cur), bl = blk(c.date, c.sid), pt = bl ? '<span style="color:#475569">출석 불가예요</span>' : `<span style="color:${k[1]}">${c.pay}결제</span>`;
  
  return `<div class="card ${c.done ? 'done' : ''}" data-c="${esc(c.id)}"><div class="rw"><div style="min-width:0"><div class="nm"><span class="ckb">${c.done ? CK : ''}</span>${sn(c.sid, c.sname)}</div><div class="meta pc2">${esc(c.s)}~${esc(c.e)} · ${esc(c.staff || bkName())} · ${pt}<br>당일 ${L.fmt(c.h)} · 누적 <b>${L.fmt(tot)}</b></div><div class="meta mo2">${esc(c.s)}~${esc(c.e)} · ${esc(c.staff || bkName())} · ${pt}<br>당일 ${L.fmt(c.h)} · 누적 <b>${L.fmt(tot)}</b></div></div><div class="ac">${bl ? `<button class="blkW bgr" data-d="${esc(c.date)}" data-s="${esc(c.sid)}">불가</button>` : `<button class="chk ${c.done ? '' : 'p'}">${c.done ? '취소' : '출석'}</button>`}<button class="cx" aria-label="이 날 일정 삭제"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button><div class="ddw"><button class="more wd" aria-expanded="${A.more === c.id}">더보기 ▾</button>${A.more === c.id ? `<div class="ddm"><button class="tog" ${bl ? 'disabled' : ''}>시간·결제 바꾸기</button><button class="mbl" ${bl ? 'disabled' : ''}>출석 막기</button><button class="mfr" ${bl ? '' : 'disabled'}>출석 풀기</button></div>` : ''}</div></div></div>${c.pay === '소급' && !c.reason ? '<div class="err" style="margin:8px 0 0">소급 사유를 골라 주세요.</div>' : ''}</div>`;
}
const dl = d => `${L.label(d)} (${L.WD[L.weekday(d)]})`;
function openEd(c, pay) {
  A.ed = { mode: 'edit', orig: c, origDate: c.date, date: c.date, sid: c.sid, sname: c.sname, pay: pay || c.pay, reason: c.reason || '', etc: c.etc || '', s: c.s || '', e: c.e || '', h: c.h, staff: c.staff || bkName(), err: '' };
  render();
}
function editorHtml() {
  const x = A.ed, add = x.mode === 'add', ack = x.pay === '인정', max = ack ? 16 : 10, st = staffNames(), mine = myStudents();
  if (x.staff && !st.includes(x.staff)) st.push(x.staff);
  const q = x.reason === '기타' ? `<label class="field">기타 사유<input id="edE" value="${esc(x.etc)}" placeholder="사유 입력"></label>` : '';
  return `<div class="back"><div class="card ed" role="dialog" aria-modal="true"><button id="edX" class="edx" aria-label="창 닫기">✕</button><div class="edt">${x.pin ? `${esc(x.sname)} · ${dl(x.origDate)} 입력` : add ? '학생 직접 입력' : `${esc(x.sname)} · ${dl(x.origDate)} 수정`}</div><div class="meta">${x.pin ? '저장하면 출석으로 기록돼요.' : add ? '이름을 적고 저장하면 출석으로 기록돼요. 처음 적는 이름은 시간표 없는 학생으로 자동 등록돼요.' : x.orig.done ? '출석한 기록이에요.' : '아직 출석 전이에요. 저장해도 출석은 [출석] 버튼으로 해요.'}</div>
  <label class="field">날짜<input id="edD" type="date" value="${esc(x.date)}"></label>${add && !x.pin ? `<label class="field">학생 이름<input id="edN" list="edNL" value="${esc(x.sT || '')}" placeholder="이름 입력" autocomplete="off"><datalist id="edNL">${mine.map(s => `<option value="${esc(s.name)}"></option>`).join('')}</datalist></label>` : ''}
  <div class="field"><span>결제구분</span><div class="pays4">${L.ALL_PAYS.map(p => { const k = PC[p]; return `<button type="button" class="edp" data-p="${p}" style="${p === x.pay ? `background:${k[0]};color:${k[1]};border:2px solid ${k[1]}` : ''}">${p}</button>`; }).join('')}</div></div>
  ${x.pay === '소급' ? `<label class="field">소급 사유<select id="edR"><option value="">사유를 골라 주세요</option>${L.REASONS.map(r => `<option ${r === x.reason ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>${q}` : ''}
  <label class="field">제공인력<select id="edF">${st.map(n => `<option ${!x.custom && n === x.staff ? 'selected' : ''}>${esc(n)}</option>`).join('')}<option value="__c" ${x.custom ? 'selected' : ''}>직접 입력</option></select></label>${x.custom ? `<label class="field">이름 입력<input id="edI" maxlength="20" placeholder="이름을 입력해 주세요" value="${esc(x.staffT || '')}"></label>` : ''}
  <div class="tbox">${ack ? '' : timeField('s', 'class="ts"', '시작 시간', x.s || '16:00') + timeField('e', 'class="te"', '종료 시간', x.e || '19:00')}${hoursField('edH', Math.min(x.h, max), max, ack ? '인정 시간 (학생별 월 1회)' : '기록 시간')}</div>
  ${x.err ? `<p class="err">${esc(x.err)}</p>` : ''}<div class="two" style="margin-top:12px"><button id="edOk" class="p">저장하기</button><button id="edNo">취소하기</button></div></div></div>`;
}
function pullEd() {
  const x = A.ed, $ = i => $root.querySelector(i); if (!x || !$('#edOk')) return;
  x.date = $('#edD').value; if ($('#edN')) x.sT = $('#edN').value;
  if ($('#edR')) x.reason = $('#edR').value; if ($('#edE')) x.etc = $('#edE').value; x.custom = $('#edF').value === '__c'; if (x.custom) { if ($('#edI')) x.staffT = $('#edI').value; } else x.staff = $('#edF').value;
  if ($('.ed .ts')) { x.s = $('.ed .ts').value; x.e = $('.ed .te').value; }
  const h = readHours($('.ed .hf')); if (h.h) x.h = h.h;
}
const dayRecs = (d, sid) => recs().filter(x => x.date === d && x.sid === sid && x.tid === bkId() && x.done && !x.removed);
const askDel = d => { if (A.filter !== '전체' && dayRecs(d, A.filter).length) A.delPop = { date: d, sid: A.filter }; };
const TR = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-3px;margin-right:4px"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';
function delHtml() {
  const p = A.delPop, list = dayRecs(p.date, p.sid); if (!list.length) { A.delPop = null; return ''; }
  return `<div class="back"><div class="card ed"><div class="edt" style="padding-right:0">${esc(list[0].sname)} · ${dl(p.date)}</div><div class="meta" style="margin:6px 0 10px">이 기록을 삭제할까요?</div>${list.map(x => `<div class="delr"><span>${x.pay}결제 · ${L.fmt(x.h)}</span><button class="dpY" data-r="${esc(x.id)}" style="color:#c62828;border-color:#fecaca">${TR}삭제</button></div>`).join('')}<button id="dpN" class="wide" style="margin:8px 0 0">취소</button></div></div>`;
}
const dropRec = o => (o.custom || o.id.startsWith('ack_')) ? S.removeRecord(o.id) : (() => { const { saved, ...b } = o; return S.saveRecord({ ...b, staff: b.staff || bkName(), tid: b.tid || bkId(), tname: b.tname || bkName(), updatedAt: Date.now(), bulk: false, done: false, removed: true }); })();
function saveEd() {
  pullEd(); const x = A.ed, fail2 = m => { x.err = m; render(); }, ack = x.pay === '인정', h = readHours($root.querySelector('.ed .hf')), o = x.orig;
  if (!x.date) return fail2('날짜를 골라 주세요.');
  let newSt = null;
  if (x.mode === 'add' && !x.pin) {
    const n = (x.sT || '').trim(); if (n.length < 2) return fail2('학생 이름을 두 글자 이상 입력해 주세요.');
    const mine = myStudents().find(s => s.name === n), oth = !mine && A.students.find(s => s.name === n);
    if (oth) return fail2(`${n} 학생은 ${A.teachers.find(a => a.id === L.ownerAt(oth, '9999-12-31'))?.name || '다른'} 선생님 출결부에 있어요. 그 출결부에서 입력해 주세요.`);
    if (mine) { x.sid = mine.id; x.sname = mine.name; } else {
      x.sid = S.newStudentId(); x.sname = n;
      newSt = { id: x.sid, name: n, ownerTid: bkId(), ownership: [{ from: '2000-01-01', tid: bkId(), tname: bkName() }], versions: [{ from: TODAY(), days: L.SD.map(() => ({ on: false, s: '16:00', e: '19:00', h: 3 })) }], endDate: '', limit: 66, staff: x.custom ? (x.staffT || '').trim() : x.staff, color: L.COLORS.find(c => !myStudents().some(s => L.colorOf(s, s.id) === c)) || L.COLORS[0] };
    }
  }
  if (!x.sid) return fail2('학생을 먼저 추가해 주세요.');
  if (blk(x.date, x.sid)) return fail2(`${x.sname} 학생은 ${dl(x.date)} 출석 불가예요. 먼저 출석을 풀어 주세요.`);
  if (x.pay === '소급' && !x.reason) return fail2('소급 사유를 골라 주세요.');
  if (x.pay === '소급' && x.reason === '기타' && !x.etc.trim()) return fail2('기타 사유를 입력해 주세요.');
  if (!ack && (!x.s || !x.e || x.s >= x.e)) return fail2('종료 시간은 시작 시간보다 늦어야 해요.');
  if (h.error) return fail2(h.error);
  if (x.custom) { if (!(x.staffT || '').trim()) return fail2('제공인력 이름을 입력해 주세요.'); x.staff = x.staffT.trim(); }
  const m = L.monthOf(x.date), base = { date: x.date, month: m, sid: x.sid, sname: x.sname, tid: bkId(), tname: bkName(), by: A.me.name, staff: x.staff, h: h.h, pay: x.pay, reason: x.pay === '소급' ? x.reason : '', etc: x.pay === '소급' && x.reason === '기타' ? x.etc : '', updatedAt: Date.now(), bulk: false, removed: false }, jobs = [];
  if (ack) {
    const id = L.ackId(m, x.sid), ex = A.rec.get(id);
    if (ex && ex.id !== o?.id) return fail2(`${x.sname} 학생은 ${dl(ex.date)}에 이번 달 인정결제가 이미 있어요. 인정결제는 한 달에 한 번이에요.`);
    jobs.push(S.saveRecord({ ...base, id, s: '', e: '', done: true })); if (o && o.id !== id) jobs.push(dropRec(o));
  } else {
    const same = o && !o.id.startsWith('ack_') && o.date === x.date;
    if (same) { const { saved, ...b } = o; jobs.push(S.saveRecord({ ...b, ...base, s: x.s, e: x.e })); }
    else {
      const t = L.cardsFor(x.date, bkId(), A.students, recs()).find(c => c.sid === x.sid);
      if (t && !t.removed && (!o || t.done)) return fail2(`${x.sname} 학생은 ${dl(x.date)}에 이미 ${t.done ? '기록이' : '일정이'} 있어요. 그 날짜에서 확인해 주세요.`);
      const { saved, ...tb } = t || {}, done = o ? (o.id.startsWith('ack_') ? true : !!o.done) : !!x.pin || x.mode === 'add';
      jobs.push(S.saveRecord({ ...tb, ...base, id: t ? t.id : `${x.date}_${x.sid}_x${Date.now()}`, custom: t ? !!t.custom : true, s: x.s, e: x.e, done }));
      if (o) jobs.push(dropRec(o));
    }
  }
  if (newSt) { A.students = [...A.students, newSt]; jobs.push(S.saveStudent(newSt)); }
  Promise.all(jobs).catch(fail); A.ed = null; A.cur = x.date; A.mon = L.mondayOf(x.date); syncMonths(); document.activeElement?.blur?.(); toast('저장되었어요 ✓'); render();
}
function bindEd() {
  const $ = i => $root.querySelector(i), close = () => { A.ed = null; syncMonths(); render(); }, ed = $('.ed');
  bindHours(ed); bindTimes(ed); $('#edX').onclick = close; $('#edNo').onclick = close; $('#edOk').onclick = saveEd;
  $('#edD').onchange = () => { pullEd(); A.ed.err = ''; syncMonths(); };
  if ($('#edN')) $('#edN').onchange = () => { pullEd(); const x = A.ed, st = myStudents().find(s => s.name === (x.sT || '').trim()); x.err = ''; if (st && !x.custom) { const n = L.staffAt(st, x.date) || bkName(), f = $('#edF'); if (![...f.options].some(o => o.value === n)) f.add(new Option(n, n), 0); f.value = n; x.staff = n; } };
  ed.querySelectorAll('.edp').forEach(b => b.onclick = () => { pullEd(); const x = A.ed; x.pay = b.dataset.p; x.err = ''; if (x.pay !== '소급') { x.reason = ''; x.etc = ''; } if (x.pay !== '인정' && x.h > 10) x.h = 10; render(); });
  if ($('#edR')) $('#edR').onchange = () => { pullEd(); A.ed.err = ''; render(); };
  $('#edF').onchange = () => { pullEd(); A.ed.err = ''; render(); if (A.ed.custom) $root.querySelector('#edI')?.focus(); };
}
function ackCard(s, m) {
  const id = L.ackId(m, s.id), r = A.rec.get(id), f = A.ack[id];
  if (f) return `<div class="card" style="position:relative" data-a="${esc(id)}" data-s="${esc(s.id)}"><button class="acn edx" aria-label="창 닫기">✕</button><div class="nm" style="margin-bottom:8px">${esc(s.name)}</div><label class="field">결제 날짜<input class="ad" type="date" min="${m}-01" max="${L.lastDay(m)}" value="${esc(f.date)}"></label>${hoursField('a_' + s.id.replace(/\W/g, '_'), f.h, 16, '인정 시간')}${f.err ? `<p class="err">${esc(f.err)}</p>` : ''}<button class="asv p wide" style="margin:0">저장</button></div>`;
  if (r) return `<div class="card" data-a="${esc(id)}" data-s="${esc(s.id)}"><div class="nm" style="color:#6d3fc4">✓ ${esc(s.name)}</div><div class="meta" style="margin-bottom:8px">${L.label(r.date)} 인정결제 완료 · ${L.fmt(r.h)}</div><div class="two"><button class="aed">수정</button><button class="adl">지우기</button></div></div>`;
  return `<div class="card" data-a="${esc(id)}" data-s="${esc(s.id)}"><div class="rw"><div class="nm">${sn(s.id, s.name)}</div><button class="aadd" style="color:#6d3fc4;background:#f5f0ff;border-color:#6d3fc4;padding:0 4px">입력</button></div></div>`;
}
const sumRow = x => `<div class="log logs"><div class="lh"><span>${L.md(x.from)}~${L.md(x.to)} ${x.phase} 기록</span> ${sn(x.sid, x.sname)} · ${esc(x.tname)}</div><div class="meta">합계 <b>${L.fmt(x.h)}</b> · ${esc(L.summaryPays(x))}</div></div>`;
function logRow(r) {
  const w = Math.floor(r.h), mm = r.h - w > 0, hol = L.HOLIDAYS[r.date], wd = L.weekday(r.date), max = r.pay === '인정' ? 16 : 10, ack = r.pay === '인정';
  return `<div class="log" data-r="${esc(r.id)}"><div class="lh"><span style="color:${hol ? '#c62828' : wd === 6 ? '#2563eb' : 'inherit'}">${L.md(r.date)} (${L.WD[wd]})</span> ${sn(r.sid, r.sname)} · ${esc(r.staff || '')}</div><div class="meta">당일 ${L.fmt(r.h)} · 누적 <b>${L.fmt(L.cumulative(recs(), r.sid, r.date))}</b> · <span style="color:${PC[r.pay][1]};font-weight:600;${r.pay === '인정' ? `background:${PC[r.pay][0]};border:1px solid ${PC[r.pay][1]}66;border-radius:7px;padding:1px 7px` : ''}">${r.pay}결제</span></div>${r.pay === '소급' ? `<button class="lre" aria-label="소급 사유 바꾸기">${esc((r.reason === '기타' ? r.etc : r.reason) || '사유를 골라 주세요')}</button>` : ''}${r.by && r.by !== r.staff ? `<div class="by">입력 ${esc(r.by)}</div>` : ''}${`<div class="lg"><select class="lp" aria-label="결제구분" style="background-color:${PC[r.pay][0]};color:${PC[r.pay][1]};border-color:${PC[r.pay][1]}66;font-weight:700">${L.ALL_PAYS.map(p => `<option value="${p}" ${p === r.pay ? 'selected' : ''}>${p}결제</option>`).join('')}</select><select class="lhh" aria-label="시간">${Array.from({ length: max + 1 }, (_, i) => `<option value="${i}" ${i === w ? 'selected' : ''}>${i}시간</option>`).join('')}</select><select class="lmm" aria-label="분"><option value="0" ${mm ? '' : 'selected'}>0분</option><option value="30" ${mm ? 'selected' : ''} ${w === max ? 'disabled' : ''}>30분</option></select><button class="lc cx" aria-label="기록 삭제"><svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg></button></div>`}</div>`;
}
function saveCard(c, patch, own) {
  if (patch.done && blk(c.date, c.sid)) { toast('출석 불가인 날이에요.'); return Promise.resolve(); }
  const { saved, ...base } = c, tid = own || bkId(), tname = A.teachers.find(x => x.id === tid)?.name || bkName(), staff = base.staff || tname;
  return S.saveRecord({ ...base, staff, tid, tname, by: A.me.name, updatedAt: Date.now(), bulk: false, ...patch }).catch(fail);
}
function bindMain(r) {
  const cardsNow = () => L.cardsFor(A.cur, bkId(), A.students, recs());
  r.querySelector('#pv').onclick = () => { A.mon = L.add(A.mon, -7); A.cur = A.mon; A.adding = false; syncMonths(); render(); };
  r.querySelector('#nx').onclick = () => { A.mon = L.add(A.mon, 7); A.cur = A.mon; A.adding = false; syncMonths(); render(); };
  r.querySelectorAll('.dc').forEach(b => b.onclick = () => { A.cur = b.dataset.d; A.adding = false; askDel(b.dataset.d); syncMonths(); render(); });
  const toMonth = mo => { let d = mo === L.monthOf(TODAY()) ? TODAY() : mo + '-01'; if (L.weekday(d) === 0) d = L.add(d, 1); A.cur = d; A.mon = L.mondayOf(d); A.adding = false; syncMonths(); render(); };
  r.querySelector('#cp').onclick = () => toMonth(L.prevMonth(L.monthOf(A.cur)));
  r.querySelector('#cn').onclick = () => toMonth(L.add(L.lastDay(L.monthOf(A.cur)), 1).slice(0, 7));
  r.querySelectorAll('.bulkGo').forEach(b => b.onclick = () => { const m = L.monthOf(A.cur), list = bulkTargets(m); if (!list.length) return toast('일괄 출석할 일정이 없어요.'); A.modal = { text: `${books().length > 1 ? bkName() + ' 출결부의 ' : ''}${+m.slice(5)}월 일정 ${list.length}건을 출석 처리할까요? 공휴일과 일요일, 오늘 이후 날짜, 이미 입력하거나 지운 날은 빠져요.`, yes: '출석 처리', run: () => Promise.all(list.map(c => { const { saved, ...base } = c; return S.saveRecord({ ...base, staff: base.staff || bkName(), tid: bkId(), tname: bkName(), by: A.me.name, updatedAt: Date.now(), done: true, bulk: true }); })).then(() => toast(`${list.length}건을 출석 처리했어요.`)).catch(fail) }; render(); });
  r.querySelectorAll('.bulkUn').forEach(b => b.onclick = () => { const m = L.monthOf(A.cur), list = recs().filter(x => x.month === m && x.tid === bkId() && x.bulk === true); if (!list.length) return toast('취소할 일괄 출석이 없어요.'); A.modal = { text: `${books().length > 1 ? bkName() + ' 출결부의 ' : ''}${+m.slice(5)}월 일괄 출석 ${list.length}건을 취소할까요? 고친 기록은 그대로 남아요.`, yes: '일괄 취소', run: () => Promise.all(list.map(x => S.removeRecord(x.id))).then(() => toast(`${list.length}건을 취소했어요.`)).catch(fail) }; render(); });
  r.querySelectorAll('.cd2').forEach(b => b.onclick = () => { A.cur = b.dataset.d; A.mon = L.mondayOf(A.cur); A.adding = false; askDel(b.dataset.d); syncMonths(); render(); });
  r.querySelectorAll('.fl').forEach(b => b.onclick = () => { A.filter = b.dataset.id; render(); });
  const go = d => { A.cur = d; A.mon = L.mondayOf(d); syncMonths(); render(); };
  const gt = r.querySelector('#goToday'); if (gt) gt.onclick = () => go(TODAY());
  const gp = r.querySelector('#goPast'); if (gp) gp.onclick = () => go(L.pendingDates(TODAY(), bkId(), A.students, recs(), [L.monthOf(TODAY())])[0].date);
  const mp = r.querySelector('#mp'); mp.onchange = () => { if (mp.value) { mp.blur(); go(mp.value + '-01'); } };
  r.querySelectorAll('[data-fs]').forEach(b => b.onclick = () => { const own = b.dataset.bk; if (own !== bkId()) { setBook(own); A.filter = b.dataset.fs; } else A.filter = A.filter === b.dataset.fs ? '전체' : b.dataset.fs; syncMonths(); render(); });
  r.querySelectorAll('.blkW').forEach(b => b.onclick = e => { e.stopPropagation(); A.blPop = { why: true, date: b.dataset.d, sid: b.dataset.s }; render(); });
  r.addEventListener('click', e => { if (A.more && !e.target.closest('.ddw')) { A.more = ''; render(); } });
  r.querySelectorAll('.bok').forEach(b => b.onclick = e => { e.stopPropagation(); A.bdPop = { date: A.cur, id: b.dataset.ok, own: b.dataset.own, ask: false }; render(); });
  r.querySelectorAll('.bdo').forEach(b => b.onclick = e => { e.stopPropagation(); const own = b.dataset.own, c = L.cardsFor(A.cur, own, A.students, recs()).find(x => x.id === b.dataset.bo); if (!c) return; if (c.pay === '소급' && (!c.reason || (c.reason === '기타' && !c.etc?.trim()))) { setBook(own); openEd(c); A.ed.err = '소급 사유를 입력해 주세요.'; return render(); } saveCard(c, { done: true }, own); toast(`${c.sname} 출석했어요`); });
  const bdF = r.querySelector('#bdF'); if (bdF) bdF.onclick = () => { A.bdFold = !A.bdFold; render(); };
  r.querySelectorAll('.pinEd').forEach(pe => pe.onclick = () => { const st = A.students.find(s => s.id === pe.dataset.pin); if (!st) return; A.ed = { mode: 'add', pin: true, orig: null, origDate: A.cur, date: A.cur, sid: st.id, sname: st.name, pay: '정상', reason: '', etc: '', s: '16:00', e: '19:00', h: 3, staff: L.staffAt(st, A.cur) || bkName(), err: '' }; render(); });
  const ab = r.querySelector('#addBtn'); if (ab) ab.onclick = () => { A.ed = { mode: 'add', orig: null, origDate: A.cur, date: A.cur, sid: '', sname: '', sT: '', pay: '정상', reason: '', etc: '', s: '16:00', e: '19:00', h: 3, staff: bkName(), err: '' }; render(); };
  bindHours(r); bindTimes(r);
  r.querySelectorAll('[data-c]').forEach(el => {
    const c = cardsNow().find(x => x.id === el.dataset.c); if (!c) return;
    const q = s => el.querySelector(s);
    if (c.removed) return;
    if (q('.chk')) q('.chk').onclick = () => { if (!c.done && c.pay === '소급' && (!c.reason || (c.reason === '기타' && !c.etc?.trim()))) { openEd(c); A.ed.err = '소급 사유를 입력해 주세요.'; return render(); } saveCard(c, { done: !c.done }); };
    q('.more').onclick = () => { A.more = A.more === c.id ? '' : c.id; render(); };
    if (q('.tog')) { q('.tog').onclick = () => { A.more = ''; openEd(c); }; q('.mbl').onclick = () => { A.more = ''; A.blPop = { ask: true, date: c.date, sid: c.sid, sname: c.sname, tid: c.tid || bkId(), err: '' }; render(); }; q('.mfr').onclick = () => { A.more = ''; freeBlock(c.date, c.sid); }; }
    q('.cx').onclick = () => { A.modal = { text: `${c.sname} ${L.label(c.date)} 삭제하시겠습니까? 다음 주 시간표는 그대로 나와요.`, yes: '삭제', run: () => c.custom ? S.removeRecord(c.id).catch(fail) : saveCard(c, { removed: true, done: false }) }; render(); };
  });
  r.querySelectorAll('[data-a]').forEach(el => {
    const id = el.dataset.a, st = A.students.find(s => s.id === el.dataset.s), rec = A.rec.get(id), q = s => el.querySelector(s), m = L.monthOf(A.cur);
    if (q('.aadd')) q('.aadd').onclick = () => { A.ack[id] = { date: L.lastDay(m), h: 1 }; render(); };
    if (q('.aed')) q('.aed').onclick = () => { A.ack[id] = { date: rec.date, h: rec.h }; render(); };
    if (q('.adl')) q('.adl').onclick = () => { A.modal = { text: `${st.name} 인정결제를 지울까요?`, yes: '지우기', run: () => S.removeRecord(id).catch(fail) }; render(); };
    if (q('.acn')) q('.acn').onclick = () => { delete A.ack[id]; render(); };
    if (q('.asv')) q('.asv').onclick = () => {
      const d = q('.ad').value, h = readHours(q('.hf')), f = A.ack[id];
      if (!d || L.monthOf(d) !== m) { f.err = '이 달 안의 날짜를 골라 주세요.'; return render(); }
      if (h.error) { f.err = h.error; return render(); }
      if (blk(d, st.id)) { f.err = `${dl(d)}은 출석 불가예요. 먼저 출석을 풀어 주세요.`; return render(); }
      delete A.ack[id]; document.activeElement?.blur?.();
      S.saveRecord({ id, date: d, month: m, sid: st.id, sname: st.name, tid: bkId(), tname: bkName(), by: A.me.name, staff: L.staffAt(st, d) || bkName(), s: '', e: '', h: h.h, pay: '인정', reason: '', etc: '', done: true, updatedAt: Date.now() }).catch(fail); render();
    };
  });
  r.querySelectorAll('[data-r]').forEach(el => {
    const x = A.rec.get(el.dataset.r), { id: _i, ...d } = x || {}; if (!x) return;
    el.querySelector('.lp').onchange = e => { e.target.blur(); const p = e.target.value; if (p === '소급' || p === '인정' || x.pay === '인정') return openEd(x, p); S.saveRecord({ ...x, bulk: false, pay: p, reason: '', etc: '' }).catch(fail); toast('저장되었어요 ✓'); };
    if (el.querySelector('.lre')) el.querySelector('.lre').onclick = () => openEd(x);
    const saveH = e => { e.target.blur(); const hh = +el.querySelector('.lhh').value, mi = hh === (x.pay === '인정' ? 16 : 10) ? 0 : +el.querySelector('.lmm').value, h = hh + mi / 60; if (h <= 0) { toast('30분 이상으로 골라 주세요.'); return render(); } S.saveRecord({ ...x, h, bulk: false }).catch(fail); toast('저장되었어요 ✓'); };
    el.querySelector('.lhh').onchange = saveH; el.querySelector('.lmm').onchange = saveH;
    el.querySelector('.lc').onclick = () => { A.modal = { text: `${x.sname} ${L.label(x.date)} 기록을 삭제할까요?`, yes: '삭제', run: () => dropRec(x).catch(fail) }; render(); };
  });
}
const it = (id, name, icon, c, b) => `<button class="it" id="${id}" style="color:${c}"><span class="ic" style="background:${b}"><svg viewBox="0 0 24 24" aria-hidden="true">${SVG[icon]}</svg></span><span>${name}</span><span aria-hidden="true" style="color:#94a3b8">›</span></button>`;
function menuScreen() {
  return `${A.msg ? `<div class="ok">${esc(A.msg)}</div>` : ''}<div class="group">내 출결부</div><div class="list">${it('mMain', '출결부로 돌아가기', 'cal', '#2563eb', '#eaf2ff')}${it('mNt', `공지사항${liveN().length ? ` (${liveN().length})` : ''}`, 'file', '#2563eb', '#eaf2ff')}${it('mBl', '출석 막기·풀기', 'cal', '#c62828', '#fdecea')}${it('mSch', '시간표와 학생 관리', 'clock', '#4f46e5', '#eef2ff')}${it('mStf', '제공인력 변경', 'swap', '#4f46e5', '#eef2ff')}${it('mPeer', '동료 출결부 보기', 'users', '#d98a1f', '#fff8e8')}${canAll() ? it('mAll', '전체 현황', 'file', '#2563eb', '#eaf2ff') : ''}${it('mPw', '내 암호 바꾸기', 'key', '#475569', '#f1f5f9')}</div><div class="group">파일과 설치</div><div class="list">${it('mXl', '엑셀 다운로드', 'file', '#16a34a', '#ecfdf5')}${it('mApp', '앱 추가', 'phone', '#0e7490', '#ecfeff')}</div>${A.me.boss ? `<div class="group">관리자 메뉴</div><div class="list">${it('mNw', '공지 쓰기', 'file', '#2563eb', '#eaf2ff')}${it('mHand', '출결부 인계', 'swap', '#6d3fc4', '#f5f0ff')}${it('mTe', '선생님 관리', 'cog', '#6d3fc4', '#f5f0ff')}</div>` : ''}<div class="group"></div><div class="list">${it('mOut', '로그아웃', 'out', '#64748b', '#f1f5f9')}</div>`;
}
const go = s => { A.screen = s; A.msg = ''; window.scrollTo(0, 0); render(); };
const openTeachers = () => { A.code = null; go('teachers'); S.getJoinCode().then(c => { A.code = c; soft(); }).catch(fail); };
function downloadXlsx(tid, name) {
  const m = L.monthOf(A.cur), blob = buildXlsx(`${m} 출결부`, L.exportRows(recs(), m, tid, name, A.students), [12, 6, 12, 12, 10, 10, 13, 13, 11, 34]), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = `반디출결부_${name}_${m}.xlsx`; a.rel = "noopener"; document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(a.href); }, 30000);
}
const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const inApp = () => /KAKAOTALK|Instagram|FBAN|FBAV|NAVER|Line\//i.test(navigator.userAgent);
const isIOS = () => /iPhone|iPad|iPod/i.test(navigator.userAgent);
function installAction() {
  if (isStandalone()) { A.msg = '이미 앱으로 쓰고 있어요.'; return render(); }
  if (inApp()) { A.modal = { text: '카카오톡 안에서는 설치가 안 될 수 있어요. 주소를 복사해서 크롬이나 삼성 인터넷에서 열어 주세요. 아이폰은 사파리에서 열어 주세요.', yes: '주소 복사', run: () => navigator.clipboard?.writeText(location.href).then(() => toast('주소를 복사했어요.')) }; return render(); }
  if (A.installEvt) { A.installEvt.prompt(); A.installEvt.userChoice.finally(() => { A.installEvt = null; }); return; }
  A.msg = isIOS() ? '사파리 아래쪽의 공유 버튼을 누른 뒤 "홈 화면에 추가"를 눌러 주세요.' : '브라우저 오른쪽 위 메뉴(⋮)에서 "앱 설치" 또는 "홈 화면에 추가"를 눌러 주세요.';
  render();
}
function bindMenu(r) {
  const on = (i, f) => { const e = r.querySelector('#' + i); if (e) e.onclick = f; };
  on('mMain', () => go('main')); on('mSch', () => go('schedule')); on('mStf', openStaff); on('mPeer', () => go('peers')); on('mNt', () => go('notices')); on('mBl', () => { A.blE = ''; go('blocks'); }); on('mNw', () => { A.nErr = ''; go('ntwrite'); }); on('mAll', () => { A.allM = L.monthOf(TODAY()); A.allF = ''; A.screen = 'overview'; syncMonths(); go('overview'); }); on('mPw', () => go('password')); on('mHand', () => go('handover')); on('mTe', openTeachers);
  on('mXl', () => downloadXlsx(bkId(), bkName())); on('mApp', installAction);
  on('mOut', () => { A.modal = { text: '로그아웃할까요? 다음에 이름과 암호를 다시 입력해야 해요.', yes: '로그아웃', run: () => S.logout() }; render(); });
}
const staffNames = () => [...new Set([...A.teachers.filter(t => t.active).map(t => t.name), ...A.students.flatMap(s => [s.staff, ...(s.staffs || []).map(x => x.name)]), ...recs().map(r => r.staff)].filter(Boolean))];
const openStaff = () => { A.sfC = false; A.sfT = ''; A.sfMsg = ''; A.sfD = TODAY(); go('staff'); syncMonths(); };
const sfRecs = (sid, d, name) => recs().filter(x => x.sid === sid && x.tid === bkId() && x.done && !x.removed && x.date >= d && x.staff !== name);
function staffScreen() {
  const my = myStudents(); if (!my.some(s => s.id === A.sfS)) A.sfS = my[0]?.id || '';
  const st = my.find(s => s.id === A.sfS);
  if (!st) return `${backBtn('제공인력 변경')}<div class="meta">아직 학생이 없어요. 시간표와 학생 관리에서 먼저 추가해 주세요.</div>`;
  const names = staffNames(), cur = L.staffAt(st, TODAY()) || bkName(); if (!names.includes(A.sfN)) A.sfN = names.find(n => n !== cur) || names[0] || '';
  const n = A.sfD ? sfRecs(st.id, A.sfD, A.sfC ? A.sfT.trim() : A.sfN).length : 0;
  return `${backBtn('제공인력 변경')}<div class="card"><label class="field">학생<select id="sfS">${my.map(s => `<option value="${esc(s.id)}" ${s.id === st.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label><div class="field"><span>지금 제공인력</span><div class="sfc">${esc(cur)}</div></div><label class="field">새 제공인력<select id="sfN">${names.map(x => `<option ${!A.sfC && x === A.sfN ? 'selected' : ''}>${esc(x)}</option>`).join('')}<option value="__c" ${A.sfC ? 'selected' : ''}>직접 입력</option></select></label>${A.sfC ? `<label class="field">이름 입력<input id="sfI" maxlength="20" placeholder="이름을 입력해 주세요" value="${esc(A.sfT)}"></label>` : ''}<label class="field">시작 날짜<input id="sfD" type="date" value="${esc(A.sfD)}"></label><div class="meta" style="margin:-2px 0 10px">${n ? `${L.label(A.sfD)} 이후에 이미 입력한 기록 ${n}건도 함께 바뀌어요.` : '이미 입력한 기록은 바뀌지 않아요. 시작 날짜부터 새 이름이 들어가요.'} 하루만 바뀌면 그날의 [시간·결제 바꾸기]에서 골라 주세요.</div>${A.sfErr ? `<p class="err">${esc(A.sfErr)}</p>` : ''}<button id="sfOk" class="wide p" style="margin:0">저장하기</button>${A.sfMsg ? `<div class="ok" style="margin:10px 0 0">${esc(A.sfMsg)}</div>` : ''}</div>`;
}
function bindStaff(r) {
  r.querySelector('#bk').onclick = () => go('menu');
  const ok = r.querySelector('#sfOk'); if (!ok) return;
  r.querySelector('#sfS').onchange = e => { A.sfS = e.target.value; A.sfMsg = ''; A.sfErr = ''; e.target.blur(); render(); };
  const sfI = r.querySelector('#sfI'); if (sfI) { sfI.oninput = () => { A.sfT = sfI.value; A.sfMsg = ''; }; sfI.onchange = () => { A.sfT = sfI.value; soft(); }; }
  r.querySelector('#sfN').onchange = e => { A.sfC = e.target.value === '__c'; if (!A.sfC) A.sfN = e.target.value; A.sfMsg = ''; A.sfErr = ''; e.target.blur(); render(); };
  r.querySelector('#sfD').onchange = e => { A.sfD = e.target.value; A.sfMsg = ''; A.sfErr = ''; e.target.blur(); syncMonths(); render(); };
  ok.onclick = () => {
    const st = myStudents().find(s => s.id === A.sfS), name = A.sfC ? A.sfT.trim() : A.sfN, d = A.sfD; A.sfErr = ''; A.sfMsg = '';
    if (!st || !name) { A.sfErr = A.sfC ? '이름을 입력해 주세요.' : '학생과 제공인력을 골라 주세요.'; return render(); }
    if (!d) { A.sfErr = '시작 날짜를 골라 주세요.'; return render(); }
    const list = sfRecs(st.id, d, name), later = (st.staffs || []).filter(x => x.from > d), run = () => {
      const base = (st.staffs || []).length ? st.staffs.filter(x => x.from < d) : [{ from: '2000-01-01', name: st.staff || bkName() }], ns = { ...st, staffs: [...base, { from: d, name }], staff: name };
      A.students = A.students.map(s => s.id === st.id ? ns : s);
      A.sfMsg = `저장되었어요 ✓ ${L.label(d)}부터 ${name} 선생님으로 기록돼요.${list.length ? ` 기록 ${list.length}건도 바꿨어요.` : ''}`;
      Promise.all([S.saveStudent(ns), ...list.map(x => S.saveRecord({ ...x, staff: name, updatedAt: Date.now() }))]).catch(fail); toast('저장되었어요 ✓'); render();
    };
    if (list.length || later.length) { A.modal = { text: `${st.name} 학생의 ${L.label(d)} 이후 ${list.length ? `기록 ${list.length}건을 ${name} 선생님으로 바꿀까요?` : `제공인력을 ${name} 선생님으로 바꿀까요?`}${later.length ? ` ${later.map(x => L.label(x.from)).join(', ')} 변경은 없어져요.` : ''}`, yes: '저장하기', run }; return render(); }
    run();
  };
}
const backBtn = t => `<button id="bk" class="wide lite">‹ 메뉴로</button><div class="h">${t}</div>`;
function scheduleScreen() {
  const my = myStudents(); if (!my.find(s => s.id === A.mgr)) { A.mgr = my[0]?.id || ''; A.draft = null; }
  const st = my.find(s => s.id === A.mgr);
  if (st && !A.draft) A.draft = st.versions[st.versions.length - 1].days.map(d => ({ ...d }));
  return `${backBtn('시간표와 학생 관리')}${A.sErr ? `<p class="err">${esc(A.sErr)}</p>` : ''}${A.sMsg ? `<div class="ok">${esc(A.sMsg)}</div>` : ''}<div class="card"><label class="field">새 학생 이름<input id="ns" placeholder="이름 입력" maxlength="20"></label><button id="as" class="wide lite" style="margin:0">학생 추가</button></div>${st ? `<div class="chips">${my.map(s => `<button class="ms ${s.id === A.mgr ? 'on' : ''}" data-id="${esc(s.id)}">${esc(s.name)}</button>`).join('')}</div><div class="card"><label class="field">이 시간표를 언제부터 쓸까요?<input id="fr" type="date" value="${A.from}"></label><div class="meta" style="margin:-4px 0 8px">지금 저장된 시간표: ${L.label(st.versions[st.versions.length - 1].from)}부터. 한 번 저장하면 바꾸기 전까지 매달 그대로 나와요.</div>${A.draft.map((d, i) => `<div class="row tbox" data-i="${i}"><div class="rh"><b style="font-size:18px;${i === 5 ? 'color:#2563eb' : ''}">${L.SD[i]}요일</b><button class="tg ${d.on ? 'on' : ''}" style="min-width:92px">${d.on ? '일정 있음' : '일정 없음'}</button></div>${d.on ? `<div style="margin-top:8px">${timeField('s', 'class="s"', '시작 시간', d.s)}${timeField('e', 'class="e"', '종료 시간', d.e)}${hoursField('d' + i, d.h, 10)}</div>` : ''}</div>`).join('')}<div class="field" style="margin-top:10px"><span>제공인력</span><div class="sfc">${esc(L.staffAt(st, TODAY()) || bkName())} <small>바꾸려면 제공인력 변경을 눌러 주세요</small></div></div><div class="field"><span>학생 글자색</span><div class="sws">${L.COLORS.map(c => `<button type="button" class="sw" data-c="${c}" aria-label="글자색 선택" style="background:${c};${L.colorOf(st, st.id) === c ? 'outline:3px solid #93c5fd;outline-offset:2px' : ''}"></button>`).join('')}</div></div><label class="field">월 총시간<input id="lim" inputmode="numeric" value="${st.limit || 66}"></label><button id="sv" class="wide p" style="margin:0">시간표 저장</button></div><div class="card"><div class="h" style="margin-top:0">${esc(st.name)} 이용 상태</div><div class="meta" style="margin-bottom:8px">${st.endDate ? `이용 종료 날짜: ${st.endDate}` : '이용 중'}</div>${st.endDate ? '<button id="res" class="wide lite" style="margin:0">이용 재개</button>' : A.endOpen ? `<div style="position:relative"><button id="efx" class="edx" style="top:-34px;right:-4px" aria-label="창 닫기">✕</button><label class="field">이용 종료 날짜<input id="ed" type="date" value="${L.lastDay(L.monthOf(TODAY()))}"></label><button id="ef" class="wide p" style="margin:0">저장</button></div>` : '<button id="efo" class="wide" style="margin:0">이 학생 이용 종료하기</button>'}<button id="sDel" class="wide" style="margin:8px 0 0;color:#c62828;border-color:#fecaca">이 학생 삭제</button></div>` : '<div class="meta">맡은 학생이 없어요. 위에서 학생을 추가해 주세요.</div>'}`;
}
function bindSchedule(r) {
  r.querySelector('#bk').onclick = () => go('menu');
  r.querySelector('#as').onclick = async () => {
    await settle();
    const n = r.querySelector('#ns').value.trim(); A.sErr = ''; A.sMsg = '';
    if (n.length < 2) { A.sErr = '학생 이름을 입력해 주세요.'; return render(); }
    if (myStudents().some(s => s.name === n)) { A.sErr = '이미 있는 이름이에요.'; return render(); }
    const id = S.newStudentId(), t = TODAY();
    A.students = [...A.students.filter(s => s.id !== id), { id, name: n, ownerTid: bkId(), ownership: [{ from: '2000-01-01', tid: bkId(), tname: bkName() }], versions: [{ from: t, days: L.SD.map(() => ({ on: false, s: '16:00', e: '19:00', h: 3 })) }], endDate: '', limit: 66, staff: bkName(), color: L.COLORS.find(c => !myStudents().some(s => L.colorOf(s, s.id) === c)) || L.COLORS[0] }];
    A.mgr = id; A.draft = null; A.from = t; A.sMsg = `${n} 학생을 추가했어요. 요일을 정하고 저장해 주세요.`;
    S.saveStudent(A.students.find(s => s.id === id)).catch(fail); render();
  };
  r.querySelectorAll('.ms').forEach(b => b.onclick = () => { A.mgr = b.dataset.id; A.draft = null; A.endOpen = false; A.sErr = ''; A.sMsg = ''; render(); });
  const fr = r.querySelector('#fr'); if (!fr) return; fr.onchange = () => A.from = fr.value;
  const collect = () => r.querySelectorAll('.row').forEach(el => { const d = A.draft[+el.dataset.i]; if (d.on) { d.s = el.querySelector('.s').value; d.e = el.querySelector('.e').value; const h = readHours(el.querySelector('.hf')); if (h.h) d.h = h.h; else d._bad = h.error; } });
  bindHours(r); bindTimes(r);
  r.querySelectorAll('.sw').forEach(b => b.onclick = () => { collect(); const st = A.students.find(s => s.id === A.mgr), ns = { ...st, color: b.dataset.c }; A.students = A.students.map(s => s.id === st.id ? ns : s); S.saveStudent(ns).catch(fail); render(); });
  r.querySelectorAll('.tg').forEach(b => b.onclick = () => { collect(); const d = A.draft[+b.closest('.row').dataset.i]; d.on = !d.on; delete d._bad; A.sMsg = ''; render(); });
  r.querySelector('#sv').onclick = () => {
    A.draft.forEach(d => delete d._bad); collect(); A.sErr = ''; A.sMsg = '';
    const st = A.students.find(s => s.id === A.mgr), lim = parseInt(r.querySelector('#lim').value, 10), bad = A.draft.find(d => d._bad);
    if (!A.from) A.sErr = '적용 시작 날짜를 골라 주세요.'; else if (bad) A.sErr = bad._bad; else if (A.draft.some(d => d.on && (!d.s || !d.e || d.s >= d.e))) A.sErr = '종료 시간은 시작 시간보다 늦어야 해요.'; else if (!(lim > 0 && lim < 1000)) A.sErr = '월 총시간을 숫자로 입력해 주세요.';
    if (A.sErr) return render();
    const after = (st.versions || []).filter(x => x.from >= A.from && x.from !== A.from && x.days.some(d => d.on)), doSave = () => {
    const v = (st.versions || []).filter(x => x.from < A.from); v.push({ from: A.from, days: A.draft.map(d => ({ on: d.on, s: d.s, e: d.e, h: d.h })) });
    const ns = { ...st, versions: v, limit: lim, staff: st.staff }; A.students = A.students.map(s => s.id === st.id ? ns : s);
    A.sMsg = `저장되었어요 ✓ ${L.label(A.from)}부터 시간표를 바꾸기 전까지 계속 적용돼요. 매달 저장하지 않아도 돼요.`; document.activeElement?.blur?.(); S.saveStudent(ns).catch(fail); toast('저장되었어요 ✓'); render();
    };
    if (after.length) { A.modal = { text: `${after.map(x => L.label(x.from)).join(', ')}부터 쓰는 시간표가 이미 있어요. 저장하면 그 시간표는 지워져요. 저장할까요?`, yes: '저장하기', run: doSave }; return render(); }
    doSave();
  };
  const res = r.querySelector('#res'); if (res) res.onclick = () => { const st = A.students.find(s => s.id === A.mgr); S.saveStudent({ ...st, endDate: '' }).catch(fail); A.sMsg = `${st.name} 학생 이용을 다시 시작했어요.`; A.sErr = ''; render(); };
  const sDel = r.querySelector('#sDel'); if (sDel) sDel.onclick = async () => {
    collect(); const st = A.students.find(s => s.id === A.mgr); A.sErr = ''; A.sMsg = '';
    let list; try { list = await S.recordsOf(st.id); } catch (e) { return fail(e); }
    if (list.some(x => x.done && !x.removed)) { A.sErr = `${st.name} 학생은 출석 기록이 있어서 삭제할 수 없어요. 기록을 먼저 지우거나 이용 종료를 해 주세요.`; return render(); }
    A.modal = { text: `${st.name} 학생을 삭제하시겠습니까?`, yes: '삭제', run: async () => { try { await Promise.all(list.map(x => S.removeRecord(x.id))); await S.deleteStudent(st.id); A.students = A.students.filter(s => s.id !== st.id); A.mgr = ''; A.draft = null; A.filter = '전체'; toast('삭제했어요'); render(); } catch (e) { fail(e); } } }; render();
  };
  const efo = r.querySelector('#efo'); if (efo) efo.onclick = () => { collect(); A.endOpen = true; render(); };
  const efx = r.querySelector('#efx'); if (efx) efx.onclick = () => { collect(); A.endOpen = false; render(); };
  const ef = r.querySelector('#ef'); if (ef) ef.onclick = () => { const st = A.students.find(s => s.id === A.mgr), d = r.querySelector('#ed').value; if (!d) { A.sErr = '이용 종료 날짜를 골라 주세요.'; return render(); } A.modal = { text: `${st.name} 학생을 ${L.label(d)} 까지만 이용하는 것으로 할까요? 지난 기록은 그대로 남아요.`, yes: '이용 종료', run: () => { A.endOpen = false; S.saveStudent({ ...st, endDate: d }).catch(fail); A.sMsg = `${st.name} 학생은 ${d} 다음부터 일정이 나오지 않아요.`; A.sErr = ''; } }; render(); };
}
function peersScreen() {
  const ot = A.teachers.filter(t => t.id !== A.me.id); if (!ot.find(t => t.id === A.peer)) A.peer = ot[0]?.id || '';
  const m = L.monthOf(A.cur), log = A.peer ? L.monthLog(recs(), m, A.peer) : [], tot = L.totals(log);
  return `${backBtn('동료 출결부 보기')}<div class="ok">읽기 전용이에요. 고칠 수 없어요.</div>${ot.length ? `<div class="chips">${ot.map(t => `<button class="pc ${t.id === A.peer ? 'on' : ''}" data-id="${t.id}">${esc(t.name)}</button>`).join('')}</div><div class="h">${esc(ot.find(t => t.id === A.peer).name)} 선생님 출결부</div><div class="meta" style="margin:-4px 2px 10px">${m.slice(0, 4)}년 ${+m.slice(5)}월 · 읽기 전용</div><label class="field">달<input id="pm" type="month" value="${m}"></label>${stuTot([...new Map(log.map(r => [r.sid, { id: r.sid, name: r.sname }])).values()], m)}<div class="card">${log.length ? log.map(r => `<div class="log"><div class="lh">${L.md(r.date)} (${L.WD[L.weekday(r.date)]}) ${sn(r.sid, r.sname)} · ${esc(r.staff || '')}</div><div class="meta">당일 ${L.fmt(r.h)} · 누적 <b>${L.fmt(L.cumulative(recs(), r.sid, r.date))}</b> · <span style="color:${PC[r.pay][1]}">${r.pay}결제</span></div></div>`).join('') : '<div class="meta">이 달의 기록이 없어요.</div>'}</div><button id="px" class="wide">이 출결부 엑셀 받기</button>` : '<div class="meta">아직 다른 선생님이 없어요.</div>'}`;
}
function bindPeers(r) {
  r.querySelector('#bk').onclick = () => go('menu');
  r.querySelectorAll('.pc').forEach(b => b.onclick = () => { A.peer = b.dataset.id; render(); });
  const pm = r.querySelector('#pm'); if (pm) pm.onchange = () => { if (pm.value) { pm.blur(); A.cur = pm.value + '-01'; A.mon = L.mondayOf(A.cur); syncMonths(); render(); } };
  const px = r.querySelector('#px'); if (px) px.onclick = () => downloadXlsx(A.peer, A.teachers.find(t => t.id === A.peer).name);
}
const canAll = () => A.me?.boss || A.me?.viewAll;
function overviewScreen() {
  const m = A.allM || L.monthOf(TODAY()), end = L.lastDay(m), name = s => L.staffAt(s, end) || A.teachers.find(x => x.id === L.ownerAt(s, end))?.name || '';
  const all = A.students.filter(s => !(s.endDate && s.endDate < m + '-01')).map(s => ({ s, staff: name(s), cum: L.cumulative(recs(), s.id, end) })).sort((a, b) => a.staff === b.staff ? (a.s.name < b.s.name ? -1 : 1) : a.staff < b.staff ? -1 : 1), staffs = [...new Set(all.map(x => x.staff))];
  if (A.allF && !staffs.includes(A.allF)) A.allF = '';
  const list = all.filter(x => !A.allF || x.staff === A.allF);
  return `${backBtn('전체 현황')}<div class="card bdw"><div class="meta" style="margin-bottom:8px">보기만 할 수 있어요. 잔여는 학생별 한도 기준이에요.</div><div class="field"><input id="alM" type="month" aria-label="달 고르기" value="${m}"></div><div class="chips">${['', ...staffs].map(n => `<button class="fl alF ${n === (A.allF || '') ? 'on' : ''}" data-n="${esc(n)}">${esc(n || '전체')}</button>`).join('')}</div>${list.length ? `<table class="bd all"><thead><tr><th>제공인력</th><th>학생</th><th>누적</th><th>잔여</th></tr></thead><tbody>${list.map(x => `<tr><td>${esc(x.staff)}</td><td>${sn(x.s.id, x.s.name)}</td><td><b>${L.fmt(x.cum)}</b></td><td class="cv">${L.fmt(Math.max((x.s.limit || 66) - x.cum, 0))}</td></tr>`).join('')}<tr class="alT"><td colspan="2">합계 ${list.length}명</td><td>${L.fmt(list.reduce((a, x) => a + x.cum, 0))}</td><td></td></tr></tbody></table>` : '<div class="meta">아직 학생이 없어요.</div>'}</div>`;
}
function bindOverview(r) {
  r.querySelector('#bk').onclick = () => go('menu');
  const mi = r.querySelector('#alM'); mi.onchange = () => { if (mi.value) { mi.blur(); A.allM = mi.value; A.allF = ''; syncMonths(); render(); } };
  r.querySelectorAll('.alF').forEach(b => b.onclick = () => { A.allF = b.dataset.n; render(); });
}
function passwordScreen() { return `${backBtn('내 암호 바꾸기')}${A.sErr ? `<p class="err">${esc(A.sErr)}</p>` : ''}${A.sMsg ? `<div class="ok">${esc(A.sMsg)}</div>` : ''}<div class="card"><label class="field">지금 암호<input id="p0" type="text" class="pwm" autocapitalize="off" spellcheck="false" autocomplete="off"></label><label class="field">새 암호 (3자리 이상, 한글·영문·숫자)<input id="p1" type="text" class="pwm" autocapitalize="off" spellcheck="false" autocomplete="off"></label><button id="pgo" class="wide p" style="margin:0">암호 바꾸기</button></div>`; }
function bindPassword(r) { r.querySelector('#bk').onclick = () => { A.sErr = ''; A.sMsg = ''; go('menu'); }; r.querySelector('#pgo').onclick = async () => { const a = r.querySelector('#p0').value, b = r.querySelector('#p1').value; A.sErr = ''; A.sMsg = ''; if ([...b].length < 3) { A.sErr = '새 암호는 3자리 이상으로 입력해 주세요.'; return render(); } try { await S.changePassword(a, b); A.sMsg = '암호를 바꿨어요.'; } catch (e) { A.sErr = authErr(e); } render(); }; }
function handoverScreen() {
  if (!A.teachers.find(t => t.id === A.hF)) A.hF = A.teachers[0]?.id || '';
  const sts = A.students.filter(s => L.ownerAt(s, '9999-12-31') === A.hF), act = A.teachers.filter(t => t.active);
  return `${backBtn('출결부 인계')}${A.hErr ? `<p class="err">${esc(A.hErr)}</p>` : ''}${A.hMsg ? `<div class="ok">${esc(A.hMsg)}</div>` : ''}<div class="card"><label class="field">넘기는 선생님<select id="f">${A.teachers.map(t => `<option value="${t.id}" ${t.id === A.hF ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label><label class="field">넘길 학생<select id="st">${sts.length ? `<option value="전체">맡은 학생 전체 (${sts.length}명)</option>` : '<option value="">맡은 학생 없음</option>'}${sts.map(s => `<option value="${esc(s.id)}" ${s.id === A.hS ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label><label class="field">받는 선생님<select id="t">${act.map(t => `<option value="${t.id}" ${t.id === A.hT ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></label><label class="field">인계 날짜<input id="d" type="date" value="${A.hD}"></label><button id="hgo" class="wide p" style="margin:0">인계하기</button></div><div class="meta">지난 기록은 이전 선생님 이름으로 남고, 인계 날짜부터 받는 선생님 출결부에 나와요. 월 누적은 학생 기준으로 이어져요.</div>`;
}
function bindHandover(r) {
  r.querySelector('#bk').onclick = () => go('menu');
  const f = r.querySelector('#f'), s = r.querySelector('#st'), t = r.querySelector('#t'), d = r.querySelector('#d');
  f.onchange = () => { A.hF = f.value; A.hS = '전체'; A.hErr = ''; A.hMsg = ''; f.blur(); render(); }; s.onchange = () => A.hS = s.value; A.hT = t.value; t.onchange = () => A.hT = t.value; d.onchange = () => A.hD = d.value;
  r.querySelector('#hgo').onclick = () => {
    const list = (A.hS === '전체' ? A.students.filter(x => L.ownerAt(x, '9999-12-31') === A.hF) : A.students.filter(x => x.id === A.hS)), to = A.teachers.find(x => x.id === A.hT); A.hErr = ''; A.hMsg = '';
    if (!list.length) A.hErr = '넘길 학생이 없어요.'; else if (A.hF === A.hT) A.hErr = '받는 선생님을 다르게 골라 주세요.'; else if (!A.hD) A.hErr = '인계 날짜를 골라 주세요.';
    if (A.hErr) return render();
    A.modal = { text: `${list.map(x => x.name).join(', ')} 학생을 ${L.label(A.hD)}부터 ${to.name} 선생님께 넘길까요?`, yes: '인계하기', run: async () => { await Promise.all(list.map(x => { const o = (x.ownership || []).filter(a => a.from < A.hD); o.push({ from: A.hD, tid: to.id, tname: to.name }); const sf = (x.staffs || []).length ? x.staffs.filter(a => a.from < A.hD) : [{ from: '2000-01-01', name: x.staff || '' }]; return S.saveStudent({ ...x, ownership: o, ownerTid: to.id, staffs: [...sf, { from: A.hD, name: to.name }], staff: to.name }); })).then(() => { A.hMsg = '인계했어요.'; A.hS = '전체'; }).catch(fail); render(); } }; render();
  };
}
function teachersScreen() {
  const bs = A.teachers.filter(t => t.boss && t.active).length;
  return `${backBtn('선생님 관리')}${A.tErr ? `<p class="err">${esc(A.tErr)}</p>` : ''}${A.tMsg ? `<div class="ok">${esc(A.tMsg)}</div>` : ''}<div class="card"><div class="h" style="margin-top:0">센터 가입 코드</div><div class="meta" style="margin-bottom:8px">새 선생님이 처음 가입할 때 한 번 입력해요. 코드를 바꿔도 이미 가입한 선생님은 그대로 쓸 수 있어요.</div><label class="field">코드 (6자 이상)<input id="jc" value="${esc(A.code ?? '')}" autocomplete="off" placeholder="불러오는 중"></label><button id="jgo" class="wide lite" style="margin:0">코드 저장</button></div><div class="card">${A.teachers.map(t => `<div class="row" data-t="${t.id}"><div style="font-size:18px;font-weight:700;${t.active ? '' : 'color:#94a3b8'}">${esc(t.name)}${t.boss ? ' · 관리자' : ''}${t.active ? '' : ' · 사용 중지'}${t.resetAllowed ? ' · 암호 재설정 대기' : ''}</div><div class="two" style="margin-top:8px"><button class="b">${t.boss ? '관리자 해제' : '관리자 지정'}</button><button class="s">${t.active ? '사용 중지' : '사용 재개'}</button></div><button class="rp more">암호 재설정 허용</button>${t.active && !t.boss ? `<label class="mgv"><input type="checkbox" class="vac" ${t.viewAll ? 'checked' : ''}>전체 현황 보기</label>` : ''}${t.active && A.teachers.length > 1 ? `<div class="mg"><span>함께 관리할 출결부</span>${A.teachers.filter(o => o.id !== t.id).map(o => `<label><input type="checkbox" class="mgc" data-id="${o.id}" ${(t.manages || []).includes(o.id) ? 'checked' : ''}>${esc(o.name)}</label>`).join('')}</div>` : ''}</div>`).join('')}</div><div class="meta">관리자 ${bs}명 / 최대 3명. 사용 중지해도 출결 기록은 그대로 남아요.</div>`;
}
function bindTeachers(r) {
  r.querySelector('#bk').onclick = () => { A.tErr = ''; A.tMsg = ''; go('menu'); };
  r.querySelector('#jgo').onclick = async () => { await settle(); const c = r.querySelector('#jc').value.trim(); A.tErr = ''; A.tMsg = ''; if (c.length < 6) { A.tErr = '코드는 6자 이상으로 입력해 주세요.'; return render(); } r.querySelector('#jc').blur(); S.setJoinCode(c).then(() => { A.code = c; A.tMsg = '가입 코드를 저장했어요.'; render(); }).catch(fail); };
  r.querySelectorAll('[data-t]').forEach(el => {
    const t = A.teachers.find(x => x.id === el.dataset.t), bs = A.teachers.filter(x => x.boss && x.active).length;
    const vac = el.querySelector('.vac'); if (vac) vac.onchange = () => { A.tErr = ''; A.tMsg = ''; S.updateTeacher(t.id, { viewAll: vac.checked }).catch(fail); };
    el.querySelectorAll('.mgc').forEach(c => c.onchange = () => { A.tErr = ''; A.tMsg = ''; const cur = new Set(t.manages || []); c.checked ? cur.add(c.dataset.id) : cur.delete(c.dataset.id); S.updateTeacher(t.id, { manages: [...cur] }).catch(fail); });
    el.querySelector('.b').onclick = () => { A.tErr = ''; A.tMsg = ''; if (t.boss) { if (bs <= 1) { A.tErr = '마지막 관리자는 해제할 수 없어요. 다른 선생님을 먼저 관리자로 지정해 주세요.'; return render(); } S.updateTeacher(t.id, { boss: false }).catch(fail); } else { if (!t.active) { A.tErr = '사용 중지된 선생님은 관리자가 될 수 없어요.'; return render(); } if (bs >= 3) { A.tErr = '관리자는 3명까지예요.'; return render(); } S.updateTeacher(t.id, { boss: true }).catch(fail); } };
    el.querySelector('.s').onclick = () => { A.tErr = ''; A.tMsg = ''; if (!t.active) return void S.updateTeacher(t.id, { active: true }).catch(fail); if (t.id === A.me.id) { A.tErr = '지금 로그인한 선생님은 중지할 수 없어요.'; return render(); } if (t.boss && bs <= 1) { A.tErr = '마지막 관리자는 사용 중지할 수 없어요.'; return render(); } const own = A.students.filter(s => L.ownerAt(s, '9999-12-31') === t.id && !s.endDate); if (own.length) { A.tErr = `${t.name} 선생님이 맡고 있는 학생이 있어요 (${own.map(s => s.name).join(', ')}). 먼저 인계해 주세요.`; return render(); } A.modal = { text: `${t.name} 선생님을 사용 중지할까요? 기록은 그대로 남아요.`, yes: '사용 중지', run: () => S.updateTeacher(t.id, { active: false, boss: false }).catch(fail) }; render(); };
    el.querySelector('.rp').onclick = () => { A.modal = { text: `${t.name} 선생님이 "암호를 잊었어요"에서 새 암호를 만들 수 있게 할까요? 지금 암호는 쓸 수 없게 돼요.`, yes: '허용', run: () => S.allowReset(t).then(() => { A.tMsg = `${t.name} 선생님께 "암호를 잊었어요"를 눌러 달라고 해 주세요. 가입 코드도 필요해요.`; render(); }).catch(fail) }; render(); };
  });
}
function authScreen() {
  const m = A.phase === 'setup' ? 'setup' : A.authMode, T = { setup: ['처음 설정', '설정 시작'], login: ['로그인', '로그인'], join: ['가입하기', '가입하기'], recover: ['새 암호 만들기', '새 암호 저장'] }[m];
  return `<div class="auth"><img src="icon-512.png" alt="반디 로고"><h1>반디 출결부</h1><div class="card"><div class="h" style="margin-top:0">${T[0]}</div>${m === 'setup' ? '<div class="ok">이 앱의 첫 관리자 선생님을 등록해요. 가입 코드는 다른 선생님이 가입할 때 쓰는 코드예요.</div>' : ''}${m === 'recover' ? '<div class="ok">관리자 선생님이 먼저 "암호 재설정 허용"을 눌러야 해요.</div>' : ''}${A.err ? `<p class="err">${esc(A.err)}</p>` : ''}<label class="field">이름 (아이디)<input id="n" placeholder="이유림" maxlength="8" autocomplete="username"></label><div class="field"><span>암호 (3자리 이상, 한글·영문·숫자)</span><div style="position:relative"><input id="p" type="text" class="pwm" autocapitalize="off" spellcheck="false" style="padding-right:72px" autocomplete="off"><button type="button" id="tp" style="position:absolute;right:4px;top:4px;min-height:40px;padding:0 10px;font-size:15px;border:0;background:transparent;color:#2563eb"></button></div></div>${m !== 'login' ? `<label class="field">센터 가입 코드${m === 'setup' ? ' 정하기 (6자 이상)' : ''}<input id="c" autocomplete="off"></label>` : ''}<button id="go" class="wide p" ${A.busy ? 'disabled' : ''}>${A.busy ? '처리 중…' : T[1]}</button>${m === 'login' ? '<button id="toJoin" class="wide">처음이신가요? 가입하기</button><button id="toRec" class="wide" style="background:transparent;border:0;color:#64748b;margin:0">암호를 잊었어요</button>' : m !== 'setup' ? '<button id="toLogin" class="wide" style="margin:0">로그인으로 돌아가기</button>' : ''}</div></div>`;
}
function bindAuth(r) {
  const m = A.phase === 'setup' ? 'setup' : A.authMode, sw = (i, x) => { const e = r.querySelector('#' + i); if (e) e.onclick = () => { A.authMode = x; A.err = ''; render(); }; };
  const tp = r.querySelector('#tp'), ip = r.querySelector('#p'), showPw = () => { ip.classList.toggle('pwm', !A.showPw); tp.innerHTML = `<svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>${A.showPw ? '<path d="M3 3l18 18"/>' : ''}</svg>`; tp.setAttribute('aria-label', A.showPw ? '암호 숨기기' : '암호 보기'); };
  showPw(); tp.onclick = () => { A.showPw = !A.showPw; showPw(); ip.focus(); };
  sw('toJoin', 'join'); sw('toRec', 'recover'); sw('toLogin', 'login');
  r.querySelector('#go').onclick = async () => {
    await settle();
    const n = r.querySelector('#n').value.trim(), p = r.querySelector('#p').value, c = r.querySelector('#c')?.value.trim() ?? '';
    A.err = ''; if (n.length < 3) A.err = '이름을 3글자 이상 입력해 주세요.'; else if ([...p].length < 3) A.err = '암호를 3자리 이상 입력해 주세요.'; else if (m !== 'login' && c.length < (m === 'setup' ? 6 : 1)) A.err = m === 'setup' ? '가입 코드를 6자 이상 정해 주세요.' : '센터 가입 코드를 입력해 주세요.';
    if (A.err) return render();
    A.busy = true; render();
    try { await ({ setup: S.bootstrap, login: S.login, join: S.register, recover: S.recover }[m](n, p, c)); await afterAuth(); }
    catch (e) { console.error(e); A.err = authErr(e); }
    A.busy = false; render();
  };
}
function suspendedScreen() { return `<div class="auth"><img src="icon-512.png" alt=""><h1>반디 출결부</h1><div class="card"><div class="ok">사용 중지된 계정이에요. 관리자 선생님께 말씀해 주세요.</div><button id="so" class="wide" style="margin:0">로그아웃</button></div></div>`; }
function modalHtml() { return `<div class="back"><div class="card"><div style="font-size:18px;font-weight:600;margin-bottom:12px;line-height:1.5">${esc(A.modal.text)}</div>${A.modal.cancelOnly ? '' : ''}<div class="two"><button id="mn">취소</button><button id="my" class="p">${esc(A.modal.yes)}</button></div></div></div>`; }
function render() {
  const y = window.scrollY; pullEd();
  if (A.phase === 'loading') { $root.innerHTML = '<div class="auth"><img src="icon-512.png" alt=""><h1>반디 출결부</h1><p style="text-align:center;color:#64748b">불러오는 중…</p></div>'; return; }
  if (A.phase === 'error') { $root.innerHTML = `<div class="auth"><div class="card"><div class="err">${esc(A.err)}</div><button id="rt" class="wide" style="margin:0">다시 시도</button></div></div>`; $root.querySelector('#rt').onclick = () => location.reload(); return; }
  if (A.phase === 'setup' || A.phase === 'auth') { const vals = {}; ['n', 'p', 'c'].forEach(i => { const e = $root.querySelector('#' + i); if (e) vals[i] = e.value; }); $root.innerHTML = authScreen(); Object.entries(vals).forEach(([i, v]) => { const e = $root.querySelector('#' + i); if (e) e.value = v; }); return bindAuth($root); }
  if (A.phase === 'suspended') { $root.innerHTML = suspendedScreen(); $root.querySelector('#so').onclick = () => S.logout(); return; }
  const scr = { main: [mainScreen, bindMain], menu: [menuScreen, bindMenu], schedule: [scheduleScreen, bindSchedule], staff: [staffScreen, bindStaff], peers: [peersScreen, bindPeers], password: [passwordScreen, bindPassword], handover: [handoverScreen, bindHandover], teachers: [teachersScreen, bindTeachers], overview: [overviewScreen, bindOverview], notices: [noticesScreen, bindNotices], blocks: [blocksScreen, bindBlocks], ntwrite: [ntWriteScreen, bindNtWrite] }[(A.screen === 'overview' && !canAll()) || (A.screen === 'ntwrite' && !A.me.boss) ? 'main' : A.screen];
  $root.innerHTML = header() + `<main id="m" class="${A.screen === 'main' ? '' : 'narrow'}">${scr[0]()}</main><nav class="mtabs">${[['a', '출석'], ['b', '기록'], ['menu', '메뉴']].map(([k, t]) => `<button data-tab="${k}" id="${k === 'menu' ? 'tMenu' : 'tab' + k}" class="${(k === 'menu' ? A.screen !== 'main' : A.screen === 'main' && (A.tab || 'a') === k) ? 'on' : ''}">${t}</button>`).join('')}</nav>` + (A.ed ? editorHtml() : '') + (A.delPop ? delHtml() : '') + (A.bdPop ? bdPopHtml() : '') + (A.blPop ? blPopHtml() : '') + (popN() ? ntPopHtml(popN()) : '') + (A.modal ? modalHtml() : '');
  const main = $root.querySelector('#m'); scr[1](main);
  $root.querySelector('#mb').onclick = () => { A.screen = A.screen === 'main' ? 'menu' : 'main'; A.msg = ''; scrollTo(0, 0); render(); };
  $root.querySelector('#qPeer').onclick = () => go('peers');
  $root.querySelector('#qSch').onclick = () => go('schedule');
  $root.querySelector('#qStf').onclick = openStaff;
  const bkS = $root.querySelector('#bkS'); if (bkS) bkS.onchange = () => { bkS.blur(); setBook(bkS.value); render(); };
  $root.querySelector('#qXl').onclick = () => downloadXlsx(bkId(), bkName());
  $root.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { const k = b.dataset.tab; A.msg = ''; if (k === 'menu') A.screen = 'menu'; else { A.screen = 'main'; A.tab = k; } scrollTo(0, 0); render(); });
  $root.querySelector('#qOut').onclick = () => { A.modal = { text: '로그아웃할까요? 다음에 이름과 암호를 다시 입력해야 해요.', yes: '로그아웃', run: () => S.logout() }; render(); };
  if (A.ed) bindEd();
  if (A.bdPop) bindBdPop();
  if (A.blPop) bindBlPop();
  const nP = popN(); if (nP && $root.querySelector('#nxO')) bindNtPop(nP);
  if (A.delPop) { $root.querySelector('#dpN').onclick = () => { A.delPop = null; render(); }; $root.querySelectorAll('.dpY').forEach(b => b.onclick = () => { const x = A.rec.get(b.dataset.r); A.delPop = null; if (x) dropRec(x).then(() => toast('삭제했어요')).catch(fail); render(); }); }
  if (A.modal) { $root.querySelector('#mn').onclick = () => { A.modal = null; render(); }; $root.querySelector('#my').onclick = async () => { const f = A.modal.run; A.modal = null; render(); await f?.(); }; }
  window.scrollTo(0, y);
  maybeOfferInstall();
}
function maybeOfferInstall() {
  if (A.offered || A.modal || A.screen !== 'main' || isStandalone()) return; A.offered = true;
  let seen = false; try { seen = localStorage.getItem('bandi_install_asked') === '1'; localStorage.setItem('bandi_install_asked', '1'); } catch { seen = true; }
  if (!seen && !matchMedia('(min-width:900px)').matches) { A.modal = { text: '바탕화면에 앱을 추가할까요?', yes: '추가하기', run: () => { A.screen = 'menu'; installAction(); } }; render(); }
}
const sfMonths = d => { const out = [], end = L.monthOf(TODAY()); let m = L.monthOf(d), n = 0; while (m <= end && n++ < 24) { out.push(m); m = L.add(L.lastDay(m), 1).slice(0, 7); } return out.length ? out : [L.monthOf(d)]; };
function syncMonths() {
  if (!A.me) return; const t = L.monthOf(TODAY()), wk = [L.monthOf(A.mon), L.monthOf(L.add(A.mon, 5)), L.monthOf(A.cur), t, L.prevMonth(t), ...(A.ed?.date ? [L.monthOf(A.ed.date)] : []), ...(A.screen === 'staff' && A.sfD ? sfMonths(A.sfD) : []), ...(A.screen === 'overview' && A.allM ? [A.allM] : [])], ms = [...new Set(wk)].sort();
  if (ms.join() === A.months.join()) return; A.months = ms; A.recUnsub?.();
  A.recUnsub = S.subRecords(ms, list => { A.online = true; A.rec = new Map(list.map(r => [r.id, r])); soft(); }, connErr);
}
const connErr = e => { console.error(e); A.online = false; soft(); };
function stopSubs() { A.unsub.forEach(u => u()); A.unsub = []; A.recUnsub?.(); A.recUnsub = null; A.months = []; A.rec = new Map(); }
async function afterAuth() {
  stopSubs();
  const me = await S.myProfile(A.uid); if (!me) return;
  if (me.suspended || me.active === false) { A.phase = 'suspended'; return render(); }
  A.me = me; A.phase = 'app'; A.screen = 'main'; A.cur = TODAY(); A.mon = L.mondayOf(A.cur);
  A.unsub.push(S.subTeachers(l => { A.teachers = l.sort((a, b) => a.name < b.name ? -1 : 1); const m = l.find(t => t.id === A.me?.id); if (m) { if (!m.active || m.uid !== A.uid) { A.phase = 'suspended'; stopSubs(); return render(); } A.me = m; } soft(); }, connErr));
  A.unsub.push(S.subBlocks(l => { A.blocks = new Map(l.map(b => [b.id, b])); soft(); }, connErr));
  A.unsub.push(S.subNotices(l => { A.notices = l; soft(); }, connErr));
  A.unsub.push(S.subStudents(l => { A.students = l.sort((a, b) => a.name < b.name ? -1 : 1); soft(); }, connErr));
  syncMonths(); render();
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); A.installEvt = e; });
window.addEventListener('offline', () => { A.online = false; soft(); }); window.addEventListener('online', () => { A.online = true; soft(); });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
render();
S.onAuth(async u => {
  try {
    A.uid = u?.uid;
    if (!u) { stopSubs(); A.me = null; const init = await S.isInitialized(); A.phase = init ? 'auth' : 'setup'; A.authMode = 'login'; A.offered = false; return render(); }
    if (A.busy) return; await afterAuth();
  } catch (e) { console.error(e); A.err = '앱에 연결하지 못했어요. 인터넷 연결을 확인해 주세요.'; A.phase = 'error'; render(); }
});
