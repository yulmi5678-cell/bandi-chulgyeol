import * as S from './store.js';
import * as L from './logic.js?v=4';
import { buildXlsx } from './xlsx.js?v=4';
const $root = document.getElementById('root'), TODAY = () => L.today();
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PC = { 정상: ['#eff6ff', '#2563eb', '#16a34a'], 소급: ['#fff8e8', '#d98a1f', '#d98a1f'], 송영: ['#ecfeff', '#0e7490', '#0e7490'], 인정: ['#f5f0ff', '#6d3fc4', '#6d3fc4'] };
const SVG = { cal: '<path d="M7 3v4M17 3v4M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 15l2 2 4-4"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', users: '<circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.5 2.5-6 6-6s6 2.500 6 6M16 5a3.500 3.500 0 0 1 0 6.500M18 14.500c2 .7 3 2.600 3 5.500"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M17 6l3 3M14 9l2 2"/>', file: '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8zM14 3v5h5M9 12l6 6M15 12l-6 6"/>', phone: '<rect x="7" y="2.500" width="10" height="19" rx="2"/><path d="M11 18.500h2"/>', swap: '<path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4"/>', cog: '<circle cx="9" cy="8" r="4"/><path d="M3 20c0-3.500 2.500-6 6-6 1 0 2 .2 2.800.6"/><circle cx="17.500" cy="17.500" r="2.500"/><path d="M17.500 13v2M17.500 20v2M13 17.500h2M20 17.500h2"/>', out: '<path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9"/>' };
const A = { phase: 'loading', authMode: 'login', err: '', msg: '', busy: false, me: null, teachers: [], students: [], rec: new Map(), months: [], unsub: [], recUnsub: null, screen: 'main', cur: TODAY(), mon: L.mondayOf(TODAY()), filter: '전체', open: {}, edit: {}, adding: false, peer: '', ack: {}, online: true, mgr: '', draft: null, from: TODAY(), sErr: '', sMsg: '', hF: '', hS: '전체', hT: '', hD: TODAY(), hErr: '', hMsg: '', tErr: '', tMsg: '', code: null, modal: null, installEvt: null };
const recs = () => [...A.rec.values()];
const toast = m => { const t = document.getElementById('tst'); t.innerHTML = `<div class="toast">${esc(m)}</div>`; setTimeout(() => t.innerHTML = '', 2600); };
const fail = e => { console.error(e); toast(e?.message && /[가-힣]/.test(e.message) ? e.message : '저장하지 못했어요. 인터넷 연결을 확인하고 다시 눌러 주세요.'); };
const authErr = e => e?.message && /[가-힣]/.test(e.message) ? e.message : ({ 'auth/invalid-credential': '이름이나 암호가 맞지 않아요.', 'auth/wrong-password': '암호가 맞지 않아요.', 'auth/weak-password': '암호는 6자 이상으로 입력해 주세요.', 'auth/too-many-requests': '시도가 너무 많아요. 잠시 뒤에 다시 해 주세요.', 'auth/network-request-failed': '인터넷 연결을 확인해 주세요.', 'auth/operation-not-allowed': '앱 설정이 아직 끝나지 않았어요.' }[e?.code] || '처리하지 못했어요. 잠시 뒤 다시 해 주세요.');
const myStudents = () => A.students.filter(s => L.ownerAt(s, '9999-12-31') === A.me.id);
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
const sn = (sid, name) => `<span style="color:${L.colorOf(A.students.find(s => s.id === sid), sid)};font-weight:700">${esc(name)}</span>`;
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

function header() {
  return `<header class="top"><img src="icon-192.png" alt="반디 로고"><div class="tt"><div class="ttl">반디 방과후활동 출결부</div><div class="who">${esc(A.me.name)} 선생님${A.me.boss ? ' · 대표' : ''}</div></div><div class="qb"><button id="qPeer" class="qo">동료 출결부</button><button id="qApp" class="qs">앱 추가</button><span class="qg" style="background:${A.online ? '#10b981' : '#d98a1f'}">${A.online ? '연동중' : '연결 끊김'}</span><button id="qSch" class="qi pco">시간표·학생</button><button id="qXl" class="qx pco">엑셀 다운로드</button><button id="qPw" class="qk pco">내 암호</button><button id="qOut" class="qk pco">로그아웃</button><button id="mb">${A.screen === 'main' ? '메뉴' : '출결부'}</button></div></header>`;
}
function dateCell(d) {
  const cards = L.cardsFor(d, A.me.id, A.students, recs()), live = cards.filter(c => !c.removed), ok = live.length && live.every(c => c.done), isT = d === TODAY(), hol = L.HOLIDAYS[d], w = L.weekday(d);
  const bg = isT ? '#2563eb' : ok ? '#f8fafc' : live.length && !hol ? '#eaf2ff' : '#fff';
  const fg = isT ? '#fff' : hol ? '#c62828' : w === 6 ? '#2563eb' : ok ? '#94a3b8' : live.length ? '#1e3a8a' : '#334155';
  const bd = d === A.cur ? '2.5px solid #1e293b' : isT ? '1px solid #2563eb' : live.length && !ok && !hol ? '1px solid #bfdbfe' : '1px solid #e2e8f0';
  const tag = isT ? (hol ? '오늘·공휴일' : ok ? '오늘 ✓' : '오늘') : ok ? '✓' : '';
  return `<button class="dc" data-d="${d}" style="background:${bg};color:${fg};border:${bd}"><small>${tag}</small><b>${L.md(d)}</b><b>${L.WD[w]}</b></button>`;
}
function mainScreen() {
  const d = A.cur, m = L.monthOf(d), list = L.cardsFor(d, A.me.id, A.students, recs()), t0 = TODAY();
  const todayLeft = L.cardsFor(t0, A.me.id, A.students, recs()).filter(c => L.isPending(c, t0)).length;
  const past = L.pendingDates(t0, A.me.id, A.students, recs(), [L.prevMonth(L.monthOf(t0))]);
  const pastN = past.reduce((a, x) => a + x.n, 0);
  const names = A.students.filter(s => L.ownerAt(s, d) === A.me.id && !(s.endDate && s.endDate < m + '-01'));
  const view = list.filter(c => A.filter === '전체' || c.sid === A.filter).sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0));
  const log = L.monthLog(recs(), m, A.me.id).filter(r => A.filter === '전체' || r.sid === A.filter), tot = L.totals(L.monthLog(recs(), m, A.me.id));
  const wk = Array.from({ length: 6 }, (_, i) => L.add(A.mon, i));
  const banners = `${todayLeft ? `<button class="ban" id="goToday" style="background:#2563eb;color:#fff">오늘 출석 ${todayLeft}건이 남았어요</button>` : `<div class="ban" style="background:var(--sky);color:var(--navy)">오늘 남은 출석이 없어요 ✓</div>`}${pastN ? `<button class="ban" id="goPast" style="background:#fff8e8;color:#a96a12">지난 날짜에 안 누른 출석 ${pastN}건이 있어요 · ${L.md(past[0].date)} 보기</button>` : ''}`;
  const left = `${banners}<div class="h">${L.label(d)}까지 누적</div><div class="cg">${names.length ? names.map(s => { const c = L.cumulative(recs(), s.id, d), lim = s.limit || 66; return `<div class="cc"><div class="cn" style="color:${L.colorOf(s, s.id)}">${esc(s.name)}</div><div class="cv">${L.fmt(c)}</div><div class="cs">남은 ${L.fmt(Math.max(lim - c, 0))} / ${L.fmt(lim)}</div></div>`; }).join('') : '<div class="cc" style="grid-column:1/-1"><div class="meta">아직 학생이 없어요. 메뉴의 시간표와 학생 관리에서 추가해 주세요.</div></div>'}</div>
  <div class="nav"><button id="pv" aria-label="이전 주">‹</button><div>${L.md(wk[0])} ~ ${L.md(wk[5])}</div><button id="nx" aria-label="다음 주">›</button></div><div class="dd">${wk.map(dateCell).join('')}</div>
  ${L.HOLIDAYS[d] ? `<div class="ok" style="background:#fdecea;color:#c62828">${esc(L.HOLIDAYS[d])} 공휴일이에요. 운영한 날이면 출석을 누르면 돼요.</div>` : ''}
  <div class="chips">${['전체', ...names.map(s => s.id)].map(id => `<button class="fl ${id === A.filter ? 'on' : ''}" data-id="${esc(id)}" style="${id !== '전체' && id !== A.filter ? `color:${L.colorOf(names.find(n => n.id === id), id)}` : ''}">${esc(id === '전체' ? '전체' : names.find(n => n.id === id).name)}</button>`).join('')}</div>
  ${view.length ? view.map(card).join('') : `<div class="meta" style="margin:0 2px 10px">이 날은 일정이 없어요.</div>`}
  ${A.adding ? addForm(names) : ''}<button id="addBtn" class="wide lite">+ 일정 추가</button>`;
  const right = `<div class="h">${+m.slice(5)}월 인정결제 (학생별 월 1회)</div>${names.length ? names.map(s => ackCard(s, m)).join('') : ''}
  <div class="h">${+m.slice(5)}월 합계</div><div class="sum">${L.ALL_PAYS.map(p => `<div class="box"><div class="lb">${p}결제</div><div class="v" style="color:${PC[p][2]}">${L.fmt(tot[p])}</div></div>`).join('')}</div>
  <div class="h">${+m.slice(5)}월 기록</div><div class="field"><input id="mp" type="month" aria-label="달 고르기" value="${m}"></div><div class="card">${log.length ? log.map(logRow).join('') : '<div class="meta">아직 출석한 기록이 없어요.</div>'}</div>`;
  return `<div class="cols"><section>${left}</section><section>${right}</section></div>`;
}
function card(c) {
  const k = PC[c.pay] || PC.정상, tot = L.cumulative(recs(), c.sid, A.cur), open = A.open[c.id], cs = c.done ? `color:${k[1]}` : '';
  if (c.removed) return `<div class="card" data-c="${esc(c.id)}"><div class="nm" style="color:#94a3b8">${esc(c.sname)}</div><div class="meta">이 날 일정을 뺐어요.</div><button class="restore more">일정 되돌리기</button></div>`;
  return `<div class="card ${c.done ? 'done' : ''}" data-c="${esc(c.id)}" ${c.done ? `style="border:2px solid ${k[1]}"` : ''}><div class="rw"><div style="min-width:0"><div class="nm" style="color:${L.colorOf(A.students.find(s => s.id === c.sid), c.sid)}">${c.done ? '✓ ' : ''}${esc(c.sname)}</div><div class="meta">${esc(c.s)}~${esc(c.e)} · ${esc(c.staff || A.me.name)} · 당일 ${L.fmt(c.h)}<br>누적 <b>${L.fmt(tot)}</b> · <span style="color:${k[1]}">${c.pay}결제</span></div></div><button class="chk ${c.done ? '' : 'p'}">${c.done ? '취소' : '출석'}</button></div>${c.pay === '소급' && !open && !c.reason ? '<div class="err" style="margin:8px 0 0">소급 사유를 골라 주세요.</div>' : ''}<button class="more tog">${open ? '접기 ▲' : '결제구분 · 수정 ▼'}</button>${open ? editPanel(c) : ''}</div>`;
}
function editPanel(c) {
  const e = A.edit[c.id] || {}, st = A.teachers.filter(t => t.active).map(t => t.name), staff = c.staff || A.me.name;
  if (!st.includes(staff)) st.push(staff);
  return `<div class="pays">${L.PAYS.map(p => { const q = PC[p], on = p === c.pay; return `<button class="py" data-p="${p}" style="${on ? `background:${q[0]};color:${q[1]};border:2px solid ${q[1]}` : ''}">${p}</button>`; }).join('')}</div>
  ${c.pay === '소급' ? `<label class="field">소급 사유<select class="rs"><option value="">사유 선택</option>${L.REASONS.map(r => `<option ${r === c.reason ? 'selected' : ''}>${esc(r)}</option>`).join('')}</select></label>${c.reason === '기타' ? `<label class="field">기타 사유<input class="etc" value="${esc(c.etc)}" placeholder="사유 입력"></label>` : ''}` : ''}
  <label class="field">제공인력<select class="stf">${st.map(n => `<option ${n === staff ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label><div class="tbox">${timeField('s', 'class="ts"', '시작 시간', c.s)}${timeField('e', 'class="te"', '종료 시간', c.e)}${hoursField('h_' + c.id.replace(/\W/g, '_'), c.h, 10)}</div>${e.err ? `<p class="err">${esc(e.err)}</p>` : ''}<button class="wide p sv">그날만 저장</button>${c.custom ? '<button class="wide del">이 일정 지우기</button>' : '<button class="wide skip">이 날 일정 빼기 (결석 등)</button>'}`;
}
function addForm(names) {
  return `<div class="card"><label class="field">학생<select id="nS">${names.map(n => `<option value="${esc(n.id)}">${esc(n.name)}</option>`).join('')}</select></label><div class="tbox">${timeField('s', 'id="nA"', '시작 시간', '16:00')}${timeField('e', 'id="nB"', '종료 시간', '19:00')}${hoursField('nH', 3, 10)}</div>${A.addErr ? `<p class="err">${esc(A.addErr)}</p>` : ''}<button id="nOk" class="wide p" style="margin:0">일정 넣기</button></div>`;
}
function ackCard(s, m) {
  const id = L.ackId(m, s.id), r = A.rec.get(id), f = A.ack[id];
  if (f) return `<div class="card" data-a="${esc(id)}" data-s="${esc(s.id)}"><div class="nm" style="margin-bottom:8px">${esc(s.name)}</div><label class="field">결제 날짜<input class="ad" type="date" min="${m}-01" max="${L.lastDay(m)}" value="${esc(f.date)}"></label>${hoursField('a_' + s.id.replace(/\W/g, '_'), f.h, 16, '인정 시간')}${f.err ? `<p class="err">${esc(f.err)}</p>` : ''}<div class="two"><button class="asv p">저장</button><button class="acn">취소</button></div></div>`;
  if (r) return `<div class="card" data-a="${esc(id)}" data-s="${esc(s.id)}"><div class="nm" style="color:#6d3fc4">✓ ${esc(s.name)}</div><div class="meta" style="margin-bottom:8px">${L.label(r.date)} 인정결제 완료 · ${L.fmt(r.h)}</div><div class="two"><button class="aed">수정</button><button class="adl">지우기</button></div></div>`;
  return `<div class="card" data-a="${esc(id)}" data-s="${esc(s.id)}"><div class="rw"><div class="nm">${esc(s.name)}</div><button class="aadd" style="color:#6d3fc4;background:#f5f0ff;border-color:#6d3fc4;padding:0 4px">입력</button></div></div>`;
}
function logRow(r) {
  const w = Math.floor(r.h), mm = r.h - w > 0, hol = L.HOLIDAYS[r.date], wd = L.weekday(r.date), max = r.pay === '인정' ? 16 : 10;
  return `<div class="log" data-r="${esc(r.id)}"><div class="lh"><span style="color:${hol ? '#c62828' : wd === 6 ? '#2563eb' : 'inherit'}">${L.md(r.date)} (${L.WD[wd]})</span> ${sn(r.sid, r.sname)} · ${esc(r.staff || '')}</div><div class="meta">당일 ${L.fmt(r.h)} · 누적 <b>${L.fmt(L.cumulative(recs(), r.sid, r.date))}</b> · <span style="color:${PC[r.pay][1]};font-weight:600">${r.pay}결제</span>${r.pay === '소급' && r.reason ? ` · ${esc(r.reason === '기타' ? r.etc : r.reason)}` : ''}</div>${r.pay === '인정' ? '' : `<div class="lg"><select class="lp" aria-label="결제구분">${L.PAYS.map(p => `<option value="${p}" ${p === r.pay ? 'selected' : ''}>${p}결제</option>`).join('')}</select><select class="lh2" aria-label="기록 시간">${Array.from({ length: 2 * max }, (_, i) => (i + 1) / 2).map(h => `<option value="${h}" ${h === r.h ? 'selected' : ''}>${L.fmt(h)}</option>`).join('')}</select><button class="lc" aria-label="출석 취소">✕</button></div>`}</div>`;
}
function saveCard(c, patch) {
  const { saved, ...base } = c; const staff = base.staff || A.me.name;
  return S.saveRecord({ ...base, staff, tid: A.me.id, tname: A.me.name, updatedAt: Date.now(), ...patch }).catch(fail);
}
function bindMain(r) {
  const cardsNow = () => L.cardsFor(A.cur, A.me.id, A.students, recs());
  r.querySelector('#pv').onclick = () => { A.mon = L.add(A.mon, -7); A.cur = A.mon; A.adding = false; syncMonths(); render(); };
  r.querySelector('#nx').onclick = () => { A.mon = L.add(A.mon, 7); A.cur = A.mon; A.adding = false; syncMonths(); render(); };
  r.querySelectorAll('.dc').forEach(b => b.onclick = () => { A.cur = b.dataset.d; A.adding = false; syncMonths(); render(); });
  r.querySelectorAll('.fl').forEach(b => b.onclick = () => { A.filter = b.dataset.id; render(); });
  const go = d => { A.cur = d; A.mon = L.mondayOf(d); syncMonths(); render(); };
  const gt = r.querySelector('#goToday'); if (gt) gt.onclick = () => go(TODAY());
  const gp = r.querySelector('#goPast'); if (gp) gp.onclick = () => go(L.pendingDates(TODAY(), A.me.id, A.students, recs(), [L.prevMonth(L.monthOf(TODAY()))])[0].date);
  const mp = r.querySelector('#mp'); mp.onchange = () => { if (mp.value) { mp.blur(); go(mp.value + '-01'); } };
  r.querySelector('#addBtn').onclick = () => { A.adding = !A.adding; A.addErr = ''; render(); };
  bindHours(r); bindTimes(r);
  const ok = r.querySelector('#nOk'); if (ok) ok.onclick = () => {
    const s = r.querySelector('#nA').value, e = r.querySelector('#nB').value, h = readHours(r.querySelector('#nH')), st = A.students.find(x => x.id === r.querySelector('#nS').value);
    if (!st) { A.addErr = '학생을 먼저 추가해 주세요.'; return render(); }
    if (!s || !e || s >= e) { A.addErr = '종료 시간은 시작 시간보다 늦어야 해요.'; return render(); }
    if (h.error) { A.addErr = h.error; return render(); }
    A.adding = false; saveCard({ id: `${A.cur}_${st.id}_x${Date.now()}`, date: A.cur, month: L.monthOf(A.cur), sid: st.id, sname: st.name, s, e, h: h.h, pay: '정상', reason: '', etc: '', done: false, custom: true });
  };
  r.querySelectorAll('[data-c]').forEach(el => {
    const c = cardsNow().find(x => x.id === el.dataset.c); if (!c) return;
    const q = s => el.querySelector(s);
    if (q('.restore')) q('.restore').onclick = () => S.removeRecord(c.id).catch(fail);
    if (c.removed) return;
    q('.chk').onclick = () => { if (!c.done && c.pay === '소급' && (!c.reason || (c.reason === '기타' && !c.etc?.trim()))) { A.open[c.id] = true; A.edit[c.id] = { err: '소급 사유를 입력해 주세요.' }; return render(); } A.edit[c.id] = {}; saveCard(c, { done: !c.done }); };
    q('.tog').onclick = () => { A.open[c.id] = !A.open[c.id]; render(); };
    el.querySelectorAll('.py').forEach(b => b.onclick = () => saveCard(c, { pay: b.dataset.p, ...(b.dataset.p === '소급' ? {} : { reason: '', etc: '' }) }));
    if (q('.rs')) q('.rs').onchange = () => { q('.rs').blur(); saveCard(c, { reason: q('.rs').value }); };
    if (q('.etc')) q('.etc').onchange = () => saveCard(c, { etc: q('.etc').value });
    if (q('.sv')) q('.sv').onclick = () => {
      const s = q('.ts').value, e = q('.te').value, h = readHours(q('.hf'));
      if (!s || !e || s >= e) { A.edit[c.id] = { err: '종료 시간은 시작 시간보다 늦어야 해요.' }; return render(); }
      if (h.error) { A.edit[c.id] = { err: h.error }; return render(); }
      A.edit[c.id] = {}; A.open[c.id] = false; document.activeElement?.blur?.(); saveCard(c, { s, e, h: h.h, staff: q('.stf').value }); render();
    };
    if (q('.skip')) q('.skip').onclick = () => { A.open[c.id] = false; saveCard(c, { removed: true, done: false }); };
    if (q('.del')) q('.del').onclick = () => { A.modal = { text: `${c.sname} 일정을 지울까요?`, yes: '지우기', run: () => S.removeRecord(c.id).catch(fail) }; render(); };
  });
  r.querySelectorAll('[data-a]').forEach(el => {
    const id = el.dataset.a, st = A.students.find(s => s.id === el.dataset.s), rec = A.rec.get(id), q = s => el.querySelector(s), m = L.monthOf(A.cur);
    if (q('.aadd')) q('.aadd').onclick = () => { A.ack[id] = { date: A.cur, h: 1 }; render(); };
    if (q('.aed')) q('.aed').onclick = () => { A.ack[id] = { date: rec.date, h: rec.h }; render(); };
    if (q('.adl')) q('.adl').onclick = () => { A.modal = { text: `${st.name} 인정결제를 지울까요?`, yes: '지우기', run: () => S.removeRecord(id).catch(fail) }; render(); };
    if (q('.acn')) q('.acn').onclick = () => { delete A.ack[id]; render(); };
    if (q('.asv')) q('.asv').onclick = () => {
      const d = q('.ad').value, h = readHours(q('.hf')), f = A.ack[id];
      if (!d || L.monthOf(d) !== m) { f.err = '이 달 안의 날짜를 골라 주세요.'; return render(); }
      if (h.error) { f.err = h.error; return render(); }
      delete A.ack[id]; document.activeElement?.blur?.();
      S.saveRecord({ id, date: d, month: m, sid: st.id, sname: st.name, tid: A.me.id, tname: A.me.name, staff: A.me.name, s: '', e: '', h: h.h, pay: '인정', reason: '', etc: '', done: true, updatedAt: Date.now() }).catch(fail); render();
    };
  });
  r.querySelectorAll('[data-r]').forEach(el => {
    const x = A.rec.get(el.dataset.r), { id: _i, ...d } = x || {}; if (!x || x.pay === '인정') return;
    el.querySelector('.lp').onchange = e => { e.target.blur(); const p = e.target.value; if (p === '소급' && !x.reason) { A.cur = x.date; A.mon = L.mondayOf(x.date); A.open[x.id] = true; A.edit[x.id] = { err: '소급 사유를 골라 주세요.' }; } S.saveRecord({ ...x, pay: p, ...(p === '소급' ? {} : { reason: '', etc: '' }) }).catch(fail); };
    el.querySelector('.lh2').onchange = e => { e.target.blur(); S.saveRecord({ ...x, h: +e.target.value }).catch(fail); };
    el.querySelector('.lc').onclick = () => S.saveRecord({ ...x, done: false }).catch(fail);
  });
}
const it = (id, name, icon, c, b) => `<button class="it" id="${id}" style="color:${c}"><span class="ic" style="background:${b}"><svg viewBox="0 0 24 24" aria-hidden="true">${SVG[icon]}</svg></span><span>${name}</span><span aria-hidden="true" style="color:#94a3b8">›</span></button>`;
function menuScreen() {
  return `${A.msg ? `<div class="ok">${esc(A.msg)}</div>` : ''}<div class="group">내 출결부</div><div class="list">${it('mMain', '출결부로 돌아가기', 'cal', '#2563eb', '#eaf2ff')}${it('mSch', '시간표와 학생 관리', 'clock', '#4f46e5', '#eef2ff')}${it('mPeer', '동료 출결부 보기', 'users', '#d98a1f', '#fff8e8')}${it('mPw', '내 암호 바꾸기', 'key', '#475569', '#f1f5f9')}</div><div class="group">파일과 설치</div><div class="list">${it('mXl', '엑셀 다운로드', 'file', '#16a34a', '#ecfdf5')}${it('mApp', '앱 추가', 'phone', '#0e7490', '#ecfeff')}</div>${A.me.boss ? `<div class="group">대표 메뉴</div><div class="list">${it('mHand', '출결부 인계', 'swap', '#6d3fc4', '#f5f0ff')}${it('mTe', '선생님 관리', 'cog', '#6d3fc4', '#f5f0ff')}</div>` : ''}<div class="group"></div><div class="list">${it('mOut', '로그아웃', 'out', '#64748b', '#f1f5f9')}</div>`;
}
const go = s => { A.screen = s; A.msg = ''; window.scrollTo(0, 0); render(); };
const openTeachers = () => { A.code = null; go('teachers'); S.getJoinCode().then(c => { A.code = c; soft(); }).catch(fail); };
function downloadXlsx(tid, name) {
  const m = L.monthOf(A.cur), blob = buildXlsx(`${m} 출결부`, L.exportRows(recs(), m, tid, name), [12, 6, 12, 12, 10, 10, 13, 13, 11, 34]), a = document.createElement('a');
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
  on('mMain', () => go('main')); on('mSch', () => go('schedule')); on('mPeer', () => go('peers')); on('mPw', () => go('password')); on('mHand', () => go('handover')); on('mTe', openTeachers);
  on('mXl', () => downloadXlsx(A.me.id, A.me.name)); on('mApp', installAction);
  on('mOut', () => { A.modal = { text: '로그아웃할까요? 다음에 이름과 암호를 다시 입력해야 해요.', yes: '로그아웃', run: () => S.logout() }; render(); });
}
const backBtn = t => `<button id="bk" class="wide lite">‹ 메뉴로</button><div class="h">${t}</div>`;
function scheduleScreen() {
  const my = myStudents(); if (!my.find(s => s.id === A.mgr)) { A.mgr = my[0]?.id || ''; A.draft = null; }
  const st = my.find(s => s.id === A.mgr);
  if (st && !A.draft) A.draft = st.versions[st.versions.length - 1].days.map(d => ({ ...d }));
  return `${backBtn('시간표와 학생 관리')}${A.sErr ? `<p class="err">${esc(A.sErr)}</p>` : ''}${A.sMsg ? `<div class="ok">${esc(A.sMsg)}</div>` : ''}<div class="card"><label class="field">새 학생 이름<input id="ns" placeholder="이름 입력" maxlength="20"></label><button id="as" class="wide lite" style="margin:0">학생 추가</button></div>${st ? `<div class="chips">${my.map(s => `<button class="ms ${s.id === A.mgr ? 'on' : ''}" data-id="${esc(s.id)}">${esc(s.name)}</button>`).join('')}</div><div class="card"><label class="field">적용 시작 날짜<input id="fr" type="date" value="${A.from}"></label>${A.draft.map((d, i) => `<div class="row tbox" data-i="${i}"><div class="rh"><b style="font-size:18px;${i === 5 ? 'color:#2563eb' : ''}">${L.SD[i]}요일</b><button class="tg ${d.on ? 'on' : ''}" style="min-width:92px">${d.on ? '일정 있음' : '일정 없음'}</button></div>${d.on ? `<div style="margin-top:8px">${timeField('s', 'class="s"', '시작 시간', d.s)}${timeField('e', 'class="e"', '종료 시간', d.e)}${hoursField('d' + i, d.h, 10)}</div>` : ''}</div>`).join('')}<label class="field" style="margin-top:10px">제공인력<select id="sf">${[...new Set([...A.teachers.filter(t => t.active).map(t => t.name), st.staff || A.me.name])].map(n => `<option ${n === (st.staff || A.me.name) ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label><div class="field"><span>학생 글자색</span><div class="sws">${L.COLORS.map(c => `<button type="button" class="sw" data-c="${c}" aria-label="글자색 선택" style="background:${c};${L.colorOf(st, st.id) === c ? 'outline:3px solid #93c5fd;outline-offset:2px' : ''}"></button>`).join('')}</div></div><label class="field">월 총시간<input id="lim" inputmode="numeric" value="${st.limit || 66}"></label><button id="sv" class="wide p" style="margin:0">시간표 저장</button></div><div class="card"><div class="h" style="margin-top:0">${esc(st.name)} 이용 상태</div><div class="meta" style="margin-bottom:8px">${st.endDate ? `이용 종료 날짜: ${st.endDate}` : '이용 중'}</div>${st.endDate ? '<button id="res" class="wide lite" style="margin:0">이용 재개</button>' : `<label class="field">이용 종료 날짜<input id="ed" type="date" value="${L.lastDay(L.monthOf(TODAY()))}"></label><button id="ef" class="wide" style="margin:0">이용 종료</button>`}</div>` : '<div class="meta">맡은 학생이 없어요. 위에서 학생을 추가해 주세요.</div>'}`;
}
function bindSchedule(r) {
  r.querySelector('#bk').onclick = () => go('menu');
  r.querySelector('#as').onclick = async () => {
    await settle();
    const n = r.querySelector('#ns').value.trim(); A.sErr = ''; A.sMsg = '';
    if (n.length < 2) { A.sErr = '학생 이름을 입력해 주세요.'; return render(); }
    if (myStudents().some(s => s.name === n)) { A.sErr = '이미 있는 이름이에요.'; return render(); }
    const id = S.newStudentId(), t = TODAY();
    A.students = [...A.students.filter(s => s.id !== id), { id, name: n, ownerTid: A.me.id, ownership: [{ from: '2000-01-01', tid: A.me.id, tname: A.me.name }], versions: [{ from: t, days: L.SD.map(() => ({ on: false, s: '16:00', e: '19:00', h: 3 })) }], endDate: '', limit: 66, staff: A.me.name, color: L.COLORS.find(c => !myStudents().some(s => L.colorOf(s, s.id) === c)) || L.COLORS[0] }];
    A.mgr = id; A.draft = null; A.from = t; A.sMsg = `${n} 학생을 추가했어요. 요일을 정하고 저장해 주세요.`;
    S.saveStudent(A.students.find(s => s.id === id)).catch(fail); render();
  };
  r.querySelectorAll('.ms').forEach(b => b.onclick = () => { A.mgr = b.dataset.id; A.draft = null; A.sErr = ''; A.sMsg = ''; render(); });
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
    const v = (st.versions || []).filter(x => x.from < A.from); v.push({ from: A.from, days: A.draft.map(d => ({ on: d.on, s: d.s, e: d.e, h: d.h })) });
    const ns = { ...st, versions: v, limit: lim, staff: r.querySelector('#sf').value }; A.students = A.students.map(s => s.id === st.id ? ns : s);
    A.sMsg = `저장했어요. ${L.label(A.from)}부터 새 시간표가 나오고 지난 기록은 그대로예요.`; document.activeElement?.blur?.(); S.saveStudent(ns).catch(fail); render();
  };
  const res = r.querySelector('#res'); if (res) res.onclick = () => { const st = A.students.find(s => s.id === A.mgr); S.saveStudent({ ...st, endDate: '' }).catch(fail); A.sMsg = `${st.name} 학생 이용을 다시 시작했어요.`; A.sErr = ''; render(); };
  const ef = r.querySelector('#ef'); if (ef) ef.onclick = () => { const st = A.students.find(s => s.id === A.mgr), d = r.querySelector('#ed').value; if (!d) { A.sErr = '이용 종료 날짜를 골라 주세요.'; return render(); } A.modal = { text: `${st.name} 학생을 ${L.label(d)} 까지만 이용하는 것으로 할까요? 지난 기록은 그대로 남아요.`, yes: '이용 종료', run: () => { S.saveStudent({ ...st, endDate: d }).catch(fail); A.sMsg = `${st.name} 학생은 ${d} 다음부터 일정이 나오지 않아요.`; A.sErr = ''; } }; render(); };
}
function peersScreen() {
  const ot = A.teachers.filter(t => t.id !== A.me.id); if (!ot.find(t => t.id === A.peer)) A.peer = ot[0]?.id || '';
  const m = L.monthOf(A.cur), log = A.peer ? L.monthLog(recs(), m, A.peer) : [], tot = L.totals(log);
  return `${backBtn('동료 출결부 보기')}<div class="ok">읽기 전용이에요. 고칠 수 없어요.</div>${ot.length ? `<div class="chips">${ot.map(t => `<button class="pc ${t.id === A.peer ? 'on' : ''}" data-id="${t.id}">${esc(t.name)}</button>`).join('')}</div><div class="h">${esc(ot.find(t => t.id === A.peer).name)} 선생님 출결부</div><div class="meta" style="margin:-4px 2px 10px">${m.slice(0, 4)}년 ${+m.slice(5)}월 · 읽기 전용</div><label class="field">달<input id="pm" type="month" value="${m}"></label><div class="sum">${L.ALL_PAYS.map(p => `<div class="box"><div class="lb">${p}결제</div><div class="v" style="color:${PC[p][2]}">${L.fmt(tot[p])}</div></div>`).join('')}</div><div class="card">${log.length ? log.map(r => `<div class="log"><div class="lh">${L.md(r.date)} (${L.WD[L.weekday(r.date)]}) ${sn(r.sid, r.sname)} · ${esc(r.staff || '')}</div><div class="meta">당일 ${L.fmt(r.h)} · 누적 <b>${L.fmt(L.cumulative(recs(), r.sid, r.date))}</b> · <span style="color:${PC[r.pay][1]}">${r.pay}결제</span></div></div>`).join('') : '<div class="meta">이 달의 기록이 없어요.</div>'}</div><button id="px" class="wide">이 출결부 엑셀 받기</button>` : '<div class="meta">아직 다른 선생님이 없어요.</div>'}`;
}
function bindPeers(r) {
  r.querySelector('#bk').onclick = () => go('menu');
  r.querySelectorAll('.pc').forEach(b => b.onclick = () => { A.peer = b.dataset.id; render(); });
  const pm = r.querySelector('#pm'); if (pm) pm.onchange = () => { if (pm.value) { pm.blur(); A.cur = pm.value + '-01'; A.mon = L.mondayOf(A.cur); syncMonths(); render(); } };
  const px = r.querySelector('#px'); if (px) px.onclick = () => downloadXlsx(A.peer, A.teachers.find(t => t.id === A.peer).name);
}
function passwordScreen() { return `${backBtn('내 암호 바꾸기')}${A.sErr ? `<p class="err">${esc(A.sErr)}</p>` : ''}${A.sMsg ? `<div class="ok">${esc(A.sMsg)}</div>` : ''}<div class="card"><label class="field">지금 암호<input id="p0" type="password" autocomplete="current-password"></label><label class="field">새 암호 (6자 이상)<input id="p1" type="password" autocomplete="new-password"></label><button id="pgo" class="wide p" style="margin:0">암호 바꾸기</button></div>`; }
function bindPassword(r) { r.querySelector('#bk').onclick = () => { A.sErr = ''; A.sMsg = ''; go('menu'); }; r.querySelector('#pgo').onclick = async () => { const a = r.querySelector('#p0').value, b = r.querySelector('#p1').value; A.sErr = ''; A.sMsg = ''; if (b.length < 6) { A.sErr = '새 암호는 6자 이상으로 입력해 주세요.'; return render(); } try { await S.changePassword(a, b); A.sMsg = '암호를 바꿨어요.'; } catch (e) { A.sErr = authErr(e); } render(); }; }
function handoverScreen() {
  const sts = A.students.filter(s => L.ownerAt(s, '9999-12-31') === A.hF), act = A.teachers.filter(t => t.active);
  if (!A.teachers.find(t => t.id === A.hF)) A.hF = A.teachers[0]?.id || '';
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
    A.modal = { text: `${list.map(x => x.name).join(', ')} 학생을 ${L.label(A.hD)}부터 ${to.name} 선생님께 넘길까요?`, yes: '인계하기', run: async () => { await Promise.all(list.map(x => { const o = (x.ownership || []).filter(a => a.from < A.hD); o.push({ from: A.hD, tid: to.id, tname: to.name }); return S.saveStudent({ ...x, ownership: o, ownerTid: to.id, staff: to.name }); })).then(() => { A.hMsg = '인계했어요.'; A.hS = '전체'; }).catch(fail); render(); } }; render();
  };
}
function teachersScreen() {
  const bs = A.teachers.filter(t => t.boss && t.active).length;
  return `${backBtn('선생님 관리')}${A.tErr ? `<p class="err">${esc(A.tErr)}</p>` : ''}${A.tMsg ? `<div class="ok">${esc(A.tMsg)}</div>` : ''}<div class="card"><div class="h" style="margin-top:0">센터 가입 코드</div><div class="meta" style="margin-bottom:8px">새 선생님이 처음 가입할 때 한 번 입력해요. 코드를 바꿔도 이미 가입한 선생님은 그대로 쓸 수 있어요.</div><label class="field">코드 (6자 이상)<input id="jc" value="${esc(A.code ?? '')}" autocomplete="off" placeholder="불러오는 중"></label><button id="jgo" class="wide lite" style="margin:0">코드 저장</button></div><div class="card">${A.teachers.map(t => `<div class="row" data-t="${t.id}"><div style="font-size:18px;font-weight:700;${t.active ? '' : 'color:#94a3b8'}">${esc(t.name)}${t.boss ? ' · 대표' : ''}${t.active ? '' : ' · 사용 중지'}${t.resetAllowed ? ' · 암호 재설정 대기' : ''}</div><div class="two" style="margin-top:8px"><button class="b">${t.boss ? '대표 해제' : '대표 지정'}</button><button class="s">${t.active ? '사용 중지' : '사용 재개'}</button></div><button class="rp more">암호 재설정 허용</button></div>`).join('')}</div><div class="meta">대표 ${bs}명 / 최대 3명. 사용 중지해도 출결 기록은 그대로 남아요.</div>`;
}
function bindTeachers(r) {
  r.querySelector('#bk').onclick = () => { A.tErr = ''; A.tMsg = ''; go('menu'); };
  r.querySelector('#jgo').onclick = async () => { await settle(); const c = r.querySelector('#jc').value.trim(); A.tErr = ''; A.tMsg = ''; if (c.length < 6) { A.tErr = '코드는 6자 이상으로 입력해 주세요.'; return render(); } r.querySelector('#jc').blur(); S.setJoinCode(c).then(() => { A.code = c; A.tMsg = '가입 코드를 저장했어요.'; render(); }).catch(fail); };
  r.querySelectorAll('[data-t]').forEach(el => {
    const t = A.teachers.find(x => x.id === el.dataset.t), bs = A.teachers.filter(x => x.boss && x.active).length;
    el.querySelector('.b').onclick = () => { A.tErr = ''; A.tMsg = ''; if (t.boss) { if (bs <= 1) { A.tErr = '마지막 대표는 해제할 수 없어요. 다른 선생님을 먼저 대표로 지정해 주세요.'; return render(); } S.updateTeacher(t.id, { boss: false }).catch(fail); } else { if (!t.active) { A.tErr = '사용 중지된 선생님은 대표가 될 수 없어요.'; return render(); } if (bs >= 3) { A.tErr = '대표는 3명까지예요.'; return render(); } S.updateTeacher(t.id, { boss: true }).catch(fail); } };
    el.querySelector('.s').onclick = () => { A.tErr = ''; A.tMsg = ''; if (!t.active) return void S.updateTeacher(t.id, { active: true }).catch(fail); if (t.id === A.me.id) { A.tErr = '지금 로그인한 선생님은 중지할 수 없어요.'; return render(); } if (t.boss && bs <= 1) { A.tErr = '마지막 대표는 사용 중지할 수 없어요.'; return render(); } const own = A.students.filter(s => L.ownerAt(s, '9999-12-31') === t.id && !s.endDate); if (own.length) { A.tErr = `${t.name} 선생님이 맡고 있는 학생이 있어요 (${own.map(s => s.name).join(', ')}). 먼저 인계해 주세요.`; return render(); } A.modal = { text: `${t.name} 선생님을 사용 중지할까요? 기록은 그대로 남아요.`, yes: '사용 중지', run: () => S.updateTeacher(t.id, { active: false, boss: false }).catch(fail) }; render(); };
    el.querySelector('.rp').onclick = () => { A.modal = { text: `${t.name} 선생님이 "암호를 잊었어요"에서 새 암호를 만들 수 있게 할까요? 지금 암호는 쓸 수 없게 돼요.`, yes: '허용', run: () => S.allowReset(t).then(() => { A.tMsg = `${t.name} 선생님께 "암호를 잊었어요"를 눌러 달라고 해 주세요. 가입 코드도 필요해요.`; render(); }).catch(fail) }; render(); };
  });
}
function authScreen() {
  const m = A.phase === 'setup' ? 'setup' : A.authMode, T = { setup: ['처음 설정', '설정 시작'], login: ['로그인', '로그인'], join: ['가입하기', '가입하기'], recover: ['새 암호 만들기', '새 암호 저장'] }[m];
  return `<div class="auth"><img src="icon-512.png" alt="반디 로고"><h1>반디 출결부</h1><div class="card"><div class="h" style="margin-top:0">${T[0]}</div>${m === 'setup' ? '<div class="ok">이 앱의 첫 대표 선생님을 등록해요. 가입 코드는 다른 선생님이 가입할 때 쓰는 코드예요.</div>' : ''}${m === 'recover' ? '<div class="ok">대표 선생님이 먼저 "암호 재설정 허용"을 눌러야 해요.</div>' : ''}${A.err ? `<p class="err">${esc(A.err)}</p>` : ''}<label class="field">이름 (아이디)<input id="n" placeholder="이유림" maxlength="8" autocomplete="username"></label><div class="field"><span>암호 (6자 이상)</span><div style="position:relative"><input id="p" type="password" style="padding-right:72px" autocomplete="${m === 'login' ? 'current-password' : 'new-password'}"><button type="button" id="tp" style="position:absolute;right:4px;top:4px;min-height:40px;padding:0 10px;font-size:15px;border:0;background:transparent;color:#2563eb"></button></div></div>${m !== 'login' ? `<label class="field">센터 가입 코드${m === 'setup' ? ' 정하기 (6자 이상)' : ''}<input id="c" autocomplete="off"></label>` : ''}<button id="go" class="wide p" ${A.busy ? 'disabled' : ''}>${A.busy ? '처리 중…' : T[1]}</button>${m === 'login' ? '<button id="toJoin" class="wide">처음이신가요? 가입하기</button><button id="toRec" class="wide" style="background:transparent;border:0;color:#64748b;margin:0">암호를 잊었어요</button>' : m !== 'setup' ? '<button id="toLogin" class="wide" style="margin:0">로그인으로 돌아가기</button>' : ''}</div></div>`;
}
function bindAuth(r) {
  const m = A.phase === 'setup' ? 'setup' : A.authMode, sw = (i, x) => { const e = r.querySelector('#' + i); if (e) e.onclick = () => { A.authMode = x; A.err = ''; render(); }; };
  const tp = r.querySelector('#tp'), ip = r.querySelector('#p'), showPw = () => { ip.type = A.showPw ? 'text' : 'password'; tp.innerHTML = `<svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.600-7 10-7 10 7 10 7-3.600 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>${A.showPw ? '<path d="M3 3l18 18"/>' : ''}</svg>`; tp.setAttribute('aria-label', A.showPw ? '암호 숨기기' : '암호 보기'); };
  showPw(); tp.onclick = () => { A.showPw = !A.showPw; showPw(); ip.focus(); };
  sw('toJoin', 'join'); sw('toRec', 'recover'); sw('toLogin', 'login');
  r.querySelector('#go').onclick = async () => {
    await settle();
    const n = r.querySelector('#n').value.trim(), p = r.querySelector('#p').value, c = r.querySelector('#c')?.value.trim() ?? '';
    A.err = ''; if (n.length < 3) A.err = '이름을 3글자 이상 입력해 주세요.'; else if (p.length < 6) A.err = '암호를 6자 이상 입력해 주세요.'; else if (m !== 'login' && c.length < (m === 'setup' ? 6 : 1)) A.err = m === 'setup' ? '가입 코드를 6자 이상 정해 주세요.' : '센터 가입 코드를 입력해 주세요.';
    if (A.err) return render();
    A.busy = true; render();
    try { await ({ setup: S.bootstrap, login: S.login, join: S.register, recover: S.recover }[m](n, p, c)); await afterAuth(); }
    catch (e) { console.error(e); A.err = authErr(e); }
    A.busy = false; render();
  };
}
function suspendedScreen() { return `<div class="auth"><img src="icon-512.png" alt=""><h1>반디 출결부</h1><div class="card"><div class="ok">사용 중지된 계정이에요. 대표 선생님께 말씀해 주세요.</div><button id="so" class="wide" style="margin:0">로그아웃</button></div></div>`; }
function modalHtml() { return `<div class="back"><div class="card"><div style="font-size:18px;font-weight:600;margin-bottom:12px;line-height:1.5">${esc(A.modal.text)}</div>${A.modal.cancelOnly ? '' : ''}<div class="two"><button id="mn">취소</button><button id="my" class="p">${esc(A.modal.yes)}</button></div></div></div>`; }
function render() {
  const y = window.scrollY;
  if (A.phase === 'loading') { $root.innerHTML = '<div class="auth"><img src="icon-512.png" alt=""><h1>반디 출결부</h1><p style="text-align:center;color:#64748b">불러오는 중…</p></div>'; return; }
  if (A.phase === 'error') { $root.innerHTML = `<div class="auth"><div class="card"><div class="err">${esc(A.err)}</div><button id="rt" class="wide" style="margin:0">다시 시도</button></div></div>`; $root.querySelector('#rt').onclick = () => location.reload(); return; }
  if (A.phase === 'setup' || A.phase === 'auth') { const vals = {}; ['n', 'p', 'c'].forEach(i => { const e = $root.querySelector('#' + i); if (e) vals[i] = e.value; }); $root.innerHTML = authScreen(); Object.entries(vals).forEach(([i, v]) => { const e = $root.querySelector('#' + i); if (e) e.value = v; }); return bindAuth($root); }
  if (A.phase === 'suspended') { $root.innerHTML = suspendedScreen(); $root.querySelector('#so').onclick = () => S.logout(); return; }
  const scr = { main: [mainScreen, bindMain], menu: [menuScreen, bindMenu], schedule: [scheduleScreen, bindSchedule], peers: [peersScreen, bindPeers], password: [passwordScreen, bindPassword], handover: [handoverScreen, bindHandover], teachers: [teachersScreen, bindTeachers] }[A.screen];
  $root.innerHTML = header() + `<main id="m" class="${A.screen === 'main' ? '' : 'narrow'}">${scr[0]()}</main>` + (A.modal ? modalHtml() : '');
  const main = $root.querySelector('#m'); scr[1](main);
  $root.querySelector('#mb').onclick = () => { A.screen = A.screen === 'main' ? 'menu' : 'main'; A.msg = ''; scrollTo(0, 0); render(); };
  $root.querySelector('#qPeer').onclick = () => go('peers');
  $root.querySelector('#qApp').onclick = () => { A.screen = 'menu'; A.msg = ''; scrollTo(0, 0); installAction(); if (A.screen === 'menu') render(); };
  $root.querySelector('#qSch').onclick = () => go('schedule');
  $root.querySelector('#qXl').onclick = () => downloadXlsx(A.me.id, A.me.name);
  $root.querySelector('#qPw').onclick = () => go('password');
  $root.querySelector('#qOut').onclick = () => { A.modal = { text: '로그아웃할까요? 다음에 이름과 암호를 다시 입력해야 해요.', yes: '로그아웃', run: () => S.logout() }; render(); };
  if (A.modal) { $root.querySelector('#mn').onclick = () => { A.modal = null; render(); }; $root.querySelector('#my').onclick = async () => { const f = A.modal.run; A.modal = null; render(); await f?.(); }; }
  window.scrollTo(0, y);
  maybeOfferInstall();
}
function maybeOfferInstall() {
  if (A.offered || A.modal || A.screen !== 'main' || isStandalone()) return; A.offered = true;
  let seen = false; try { seen = localStorage.getItem('bandi_install_asked') === '1'; localStorage.setItem('bandi_install_asked', '1'); } catch { seen = true; }
  if (!seen && !matchMedia('(min-width:900px)').matches) { A.modal = { text: '바탕화면에 앱을 추가할까요?', yes: '추가하기', run: () => { A.screen = 'menu'; installAction(); } }; render(); }
}
function syncMonths() {
  if (!A.me) return; const t = L.monthOf(TODAY()), wk = [L.monthOf(A.mon), L.monthOf(L.add(A.mon, 5)), L.monthOf(A.cur), t, L.prevMonth(t)], ms = [...new Set(wk)].sort();
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
