export const WD = ['일','월','화','수','목','금','토'], SD = ['월','화','수','목','금','토'];
export const PAYS = ['정상','소급','송영'], ALL_PAYS = ['정상','소급','송영','인정'];
export const REASONS = ['서버 접속 실패 (0104 오류 등)','제공인력 과실 (단말기 조작 미숙 등)','대상자 과실 (카드 미소지 등)','이용자 또는 제공인력 카드 발급 전','카드 분실, 훼손 등','기타'];
export const HOLIDAYS = {
 '2026-01-01':'신정','2026-02-16':'설날 연휴','2026-02-17':'설날','2026-02-18':'설날 연휴','2026-03-01':'삼일절','2026-03-02':'대체공휴일','2026-05-01':'노동절','2026-05-05':'어린이날','2026-05-24':'부처님오신날','2026-05-25':'대체공휴일','2026-06-03':'지방선거','2026-06-06':'현충일','2026-07-17':'제헌절','2026-08-15':'광복절','2026-08-17':'대체공휴일','2026-09-24':'추석 연휴','2026-09-25':'추석','2026-09-26':'추석 연휴','2026-10-03':'개천절','2026-10-05':'대체공휴일','2026-10-09':'한글날','2026-12-25':'성탄절',
 '2027-01-01':'신정','2027-02-06':'설날 연휴','2027-02-07':'설날','2027-02-08':'설날 연휴','2027-02-09':'대체공휴일','2027-03-01':'삼일절','2027-05-01':'노동절','2027-05-03':'대체공휴일','2027-05-05':'어린이날','2027-05-13':'부처님오신날','2027-06-06':'현충일','2027-07-17':'제헌절','2027-07-19':'대체공휴일','2027-08-15':'광복절','2027-08-16':'대체공휴일','2027-09-14':'추석 연휴','2027-09-15':'추석','2027-09-16':'추석 연휴','2027-10-03':'개천절','2027-10-04':'대체공휴일','2027-10-09':'한글날','2027-10-11':'대체공휴일','2027-12-25':'성탄절','2027-12-27':'대체공휴일',
 '2028-01-01':'신정','2028-01-26':'설날 연휴','2028-01-27':'설날','2028-01-28':'설날 연휴','2028-03-01':'삼일절','2028-04-12':'국회의원 선거','2028-05-01':'노동절','2028-05-02':'부처님오신날','2028-05-05':'어린이날','2028-06-06':'현충일','2028-07-17':'제헌절','2028-08-15':'광복절','2028-10-02':'추석 연휴','2028-10-03':'추석·개천절','2028-10-04':'추석 연휴','2028-10-05':'대체공휴일','2028-10-09':'한글날','2028-12-25':'성탄절'};
const D = s => new Date(s + 'T00:00:00Z');
export const add = (s, n) => { const d = D(s); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
export const weekday = s => D(s).getUTCDay();
export const mondayOf = s => { const w = weekday(s); return add(s, w === 0 ? -6 : 1 - w); };
export const monthOf = s => s.slice(0, 7);
export const prevMonth = m => add(m + '-01', -1).slice(0, 7);
export const lastDay = m => { const [y, mo] = m.split('-').map(Number); return new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10); };
export const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const md = s => `${+s.slice(5, 7)}/${+s.slice(8)}`;
export const label = s => `${+s.slice(5, 7)}월 ${+s.slice(8)}일`;
export const fmt = h => { const w = Math.floor(h), m = Math.round((h - w) * 60); if (!w && !m) return '0시간'; if (!w) return `${m}분`; return m ? `${w}시간 ${m}분` : `${w}시간`; };
// "4:30", "4시간 30분", "4시간", "30분", "4.5" → 시간. 잘못되면 {error}
export function parseHours(text, max) {
  const t = String(text).trim(); let h = null, m;
  if ((m = t.match(/^(\d{1,2}):(\d{1,2})$/))) h = +m[1] + +m[2] / 60;
  else if ((m = t.match(/^(?:(\d{1,2})\s*시간)?\s*(?:(\d{1,2})\s*분)?$/)) && (m[1] || m[2])) h = (+m[1] || 0) + (+m[2] || 0) / 60;
  else if (/^\d{1,2}(\.\d+)?$/.test(t)) h = +t;
  if (h === null) return { error: '4:30이나 4시간 30분처럼 입력해 주세요.' };
  if (Math.abs(h * 2 - Math.round(h * 2)) > 1e-9) return { error: '30분 단위로 입력해 주세요.' };
  if (h < 0.5) return { error: '30분 이상으로 입력해 주세요.' };
  if (h > max) return { error: `${max}시간까지 입력할 수 있어요.` };
  return { h };
}
export function ownerAt(st, date) { const o = st.ownership || []; let c = o[0]; for (const x of o) if (x.from <= date) c = x; return c ? c.tid : st.ownerTid; }
export function staffAt(st, date) { let n = st.staff || ''; for (const x of st.staffs || []) if (x.from <= date) n = x.name; return n; }
export function planFor(st, date) {
  if (st.endDate && date > st.endDate) return null;
  const w = weekday(date); if (!w) return null;
  let v = null; for (const x of st.versions || []) if (x.from <= date) v = x;
  if (!v) return null; const d = v.days[w - 1];
  return d && d.on ? { s: d.s, e: d.e, h: d.h } : null;
}
export const COLORS = ['#2f67e0', '#7c3aed', '#0e7490', '#db2777', '#15803d', '#92400e', '#b91c1c', '#4338ca'];
export function colorOf(st, id = '') { if (st?.color) return st.color; let n = 0; for (const c of String(id)) n = (n * 31 + c.charCodeAt(0)) % 997; return COLORS[n % COLORS.length]; }
// 남는 분: 0~15분 내림, 16~30분은 30분, 31~59분은 다음 1시간
export function calcHours(s, e) {
  if (!s || !e || s >= e) return null;
  const t = v => { const [a, b] = v.split(':').map(Number); return a * 60 + b; }, d = t(e) - t(s), w = Math.floor(d / 60), r = d % 60;
  return Math.max(0.5, r <= 15 ? w : r <= 30 ? w + 0.5 : w + 1);
}
export const baseId = (date, sid) => `${date}_${sid}`;
export const ackId = (month, sid) => `ack_${month}_${sid}`;
const counted = r => r.done && !r.removed;
export function cumulative(records, sid, date) { const m = monthOf(date); return records.filter(r => r.sid === sid && counted(r) && r.month === m && r.date <= date).reduce((a, r) => a + r.h, 0); }
export function cardsFor(date, tid, students, records) {
  const byId = new Map(records.map(r => [r.id, r])), out = [];
  for (const st of students) {
    if (ownerAt(st, date) !== tid) continue;
    const p = planFor(st, date); if (!p) continue;
    const id = baseId(date, st.id), r = byId.get(id);
    out.push(r ? { ...r, saved: true } : { id, date, month: monthOf(date), sid: st.id, sname: st.name, tid, staff: staffAt(st, date), s: p.s, e: p.e, h: p.h, pay: '정상', reason: '', etc: '', done: false, saved: false });
  }
  for (const r of records) if (r.date === date && r.custom && r.tid === tid && !r.id.startsWith('ack_')) out.push({ ...r, saved: true });
  return out;
}
export const isPending = (c, date) => !c.done && !c.removed && !HOLIDAYS[date];
export function pendingDates(todayStr, tid, students, records, months) {
  const out = []; const m = months.slice().sort()[0]; let d = m + '-01';
  while (d < todayStr) { const n = cardsFor(d, tid, students, records).filter(c => isPending(c, d)).length; if (n) out.push({ date: d, n }); d = add(d, 1); }
  return out;
}
export function totals(list) { const t = { 정상: 0, 소급: 0, 송영: 0, 인정: 0 }; for (const r of list) if (counted(r)) t[r.pay] = (t[r.pay] || 0) + r.h; return t; }
export function monthLog(records, month, tid) { return records.filter(r => r.month === month && r.tid === tid && counted(r)).sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.sname < b.sname ? -1 : 1); }
export function exportRows(records, month, tid, name = '') {
  const l = monthLog(records, month, tid), rows = [[`${name} 선생님 출결부`, `${month.slice(0, 4)}년 ${+month.slice(5)}월`], ['일자', '요일', '학생명', '제공인력', '시작 시간', '종료 시간', '당일시간', '당월누적', '결제구분', '소급 사유']];
  for (const r of l) rows.push([r.date, WD[weekday(r.date)], r.sname, r.staff || '', r.s || '', r.e || '', fmt(r.h), fmt(cumulative(records, r.sid, r.date)), r.pay + '결제', r.pay === '소급' ? (r.reason === '기타' ? r.etc : r.reason) || '' : '']);
  rows.push([]); rows.push(['학생별 합계']);
  for (const [sid, sname] of new Map(l.map(r => [r.sid, r.sname]))) { const t = totals(records.filter(r => r.sid === sid && r.month === month)); rows.push([sname, '합계', '', '', '', '', fmt(Object.values(t).reduce((a, b) => a + b, 0))]); for (const p of ALL_PAYS) rows.push(['', p + '결제', '', '', '', '', fmt(t[p])]); }
  return rows;
}
