import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, onSnapshot, writeBatch } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { firebaseConfig } from "./config.js";

const app = initializeApp(firebaseConfig), auth = getAuth(app), db = getFirestore(app);
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join("");
const enc = s => new TextEncoder().encode(s);
export const nameKey = name => hex(enc(name.normalize("NFC").trim()));
export async function hashCode(code) { return hex(await crypto.subtle.digest("SHA-256", enc(code.normalize("NFC").trim()))); }
const emailFor = (key, gen) => `u${key}.${gen}@bandi.example.com`;
const newId = c => doc(collection(db, c)).id;
class AppError extends Error {}
const say = m => { throw new AppError(m); };

export async function isInitialized() { return (await getDoc(doc(db, "meta", "init"))).exists(); }
export function onAuth(cb) { return onAuthStateChanged(auth, cb); }
export async function myProfile(uid) {
  const m = await getDoc(doc(db, "members", uid)); if (!m.exists()) return null;
  const t = await getDoc(doc(db, "teachers", m.data().tid)).catch(() => null);
  if (!t || !t.exists() || t.data().uid !== uid) return { suspended: true };
  return { id: t.id, ...t.data() };
}
export async function bootstrap(name, pw, code) {
  const key = nameKey(name), cred = await createUserWithEmailAndPassword(auth, emailFor(key, 0), pw);
  try {
    const hash = await hashCode(code), tid = newId("teachers"), b = writeBatch(db);
    b.set(doc(db, "meta", "init"), { at: Date.now() });
    b.set(doc(db, "joinCodes", hash), { at: Date.now() });
    b.set(doc(db, "settings", "join"), { code: code.trim(), hash });
    b.set(doc(db, "teachers", tid), { name: name.trim(), uid: cred.user.uid, boss: true, active: true, resetAllowed: false });
    b.set(doc(db, "members", cred.user.uid), { tid, joinHash: hash });
    b.set(doc(db, "logins", key), { tid, gen: 0 });
    await b.commit();
  } catch (e) { await cred.user.delete().catch(() => {}); throw e; }
}
export async function login(name, pw) {
  const l = await getDoc(doc(db, "logins", nameKey(name)));
  if (!l.exists()) say("가입된 이름이 아니에요. 처음이시면 가입하기를 눌러 주세요.");
  await signInWithEmailAndPassword(auth, emailFor(nameKey(name), l.data().gen), pw);
}
export async function register(name, pw, code) {
  const key = nameKey(name);
  if ((await getDoc(doc(db, "logins", key))).exists()) say("이미 가입한 이름이에요. 로그인해 주세요. 같은 이름의 다른 선생님이면 이름 뒤에 숫자를 붙여 주세요.");
  const cred = await createUserWithEmailAndPassword(auth, emailFor(key, 0), pw);
  try {
    const hash = await hashCode(code), tid = newId("teachers"), b = writeBatch(db);
    b.set(doc(db, "teachers", tid), { name: name.trim(), uid: cred.user.uid, boss: false, active: true, resetAllowed: false });
    b.set(doc(db, "members", cred.user.uid), { tid, joinHash: hash });
    b.set(doc(db, "logins", key), { tid, gen: 0 });
    await b.commit();
  } catch (e) { await cred.user.delete().catch(() => {}); say("가입 코드가 맞지 않아요. 대표 선생님께 확인해 주세요."); }
}
export async function recover(name, pw, code) {
  const key = nameKey(name), l = await getDoc(doc(db, "logins", key));
  if (!l.exists()) say("가입된 이름이 아니에요.");
  const cred = await createUserWithEmailAndPassword(auth, emailFor(key, l.data().gen), pw).catch(e => {
    if (e.code === "auth/email-already-in-use") say("대표 선생님이 아직 암호 재설정을 누르지 않았어요. 대표 선생님께 말씀해 주세요.");
    throw e; });
  try {
    const hash = await hashCode(code), b = writeBatch(db);
    b.set(doc(db, "members", cred.user.uid), { tid: l.data().tid, joinHash: hash });
    b.update(doc(db, "teachers", l.data().tid), { uid: cred.user.uid, resetAllowed: false });
    await b.commit();
  } catch (e) { await cred.user.delete().catch(() => {}); say("가입 코드가 맞지 않거나 재설정이 허용되지 않았어요."); }
}
export function logout() { return signOut(auth); }
export async function changePassword(cur, next) {
  const u = auth.currentUser;
  await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email, cur));
  await updatePassword(u, next);
}
const listen = (q, cb, err) => onSnapshot(q, s => cb(s.docs.map(d => ({ id: d.id, ...d.data() }))), err);
export const subTeachers = (cb, err) => listen(collection(db, "teachers"), cb, err);
export const subStudents = (cb, err) => listen(collection(db, "students"), cb, err);
export const subRecords = (months, cb, err) => listen(query(collection(db, "records"), where("month", "in", months)), cb, err);
export const newStudentId = () => newId("students");
export const saveStudent = s => { const { id, ...d } = s; return setDoc(doc(db, "students", id), d); };
export const saveRecord = r => { const { id, ...d } = r; return setDoc(doc(db, "records", id), d); };
export const removeRecord = id => deleteDoc(doc(db, "records", id));
export const updateTeacher = (id, patch) => updateDoc(doc(db, "teachers", id), patch);
export async function allowReset(t) {
  const key = nameKey(t.name), l = await getDoc(doc(db, "logins", key)), b = writeBatch(db);
  b.update(doc(db, "logins", key), { gen: (l.data().gen || 0) + 1 });
  b.update(doc(db, "teachers", t.id), { resetAllowed: true });
  await b.commit();
}
export async function getJoinCode() { const s = await getDoc(doc(db, "settings", "join")); return s.exists() ? s.data().code : ""; }
export async function setJoinCode(code) {
  const old = await getDoc(doc(db, "settings", "join")), hash = await hashCode(code), b = writeBatch(db);
  if (old.exists() && old.data().hash !== hash) b.delete(doc(db, "joinCodes", old.data().hash));
  b.set(doc(db, "joinCodes", hash), { at: Date.now() });
  b.set(doc(db, "settings", "join"), { code: code.trim(), hash });
  await b.commit();
}
