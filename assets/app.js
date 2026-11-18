// ============================================================
// 共用資料層：Firebase（雲端模式）／localStorage（本機模式）
// 學員：梯次代碼＋姓名/組別，Firebase 匿名登入
// 講師：Google 登入，uid 須列在 Firestore admins 集合
// ============================================================
import { firebaseConfig } from './firebase-config.js';

const FB_VER = '10.12.2';
const FB_BASE = `https://www.gstatic.com/firebasejs/${FB_VER}/`;
export const CLOUD = !!(firebaseConfig && firebaseConfig.apiKey);
export const UNITS = { u1: '練習一', u2: '練習二', u3: '練習三' };

// ---------- localStorage 安全包裝 ----------
export const LS = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* 私密模式等情況忽略 */ } },
  del(k) { try { localStorage.removeItem(k); } catch { } },
  keys() { try { return Object.keys(localStorage); } catch { return []; } }
};

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const clean = (o) => JSON.parse(JSON.stringify(o ?? null)); // 移除 undefined，Firestore 不接受
export const normCode = (s) => String(s || '').trim().toUpperCase().replace(/\s+/g, '');

// ---------- Firebase 延遲載入 ----------
let _fb = null;
export async function fb() {
  if (!CLOUD) return null;
  if (_fb) return _fb;
  const [a, au, fs] = await Promise.all([
    import(FB_BASE + 'firebase-app.js'),
    import(FB_BASE + 'firebase-auth.js'),
    import(FB_BASE + 'firebase-firestore.js')
  ]);
  const app = a.initializeApp(firebaseConfig);
  _fb = { app, auth: au.getAuth(app), db: fs.getFirestore(app), au, fs };
  return _fb;
}

export async function currentUser() {
  const f = await fb();
  if (!f) return null;
  await f.auth.authStateReady();
  return f.auth.currentUser;
}

async function studentUser() {
  const f = await fb();
  let u = await currentUser();
  if (!u) u = (await f.au.signInAnonymously(f.auth)).user;
  return u;
}

// ---------- 梯次 ----------
const LOCAL_SESSIONS = 'aiw:sessions';
export function localSessions() { return LS.get(LOCAL_SESSIONS, {}); }
export function saveLocalSessions(m) { LS.set(LOCAL_SESSIONS, m); window.dispatchEvent(new Event('aiw-local')); }

export async function getSession(code) {
  if (!CLOUD) {
    const m = localSessions();
    if (!m[code]) { m[code] = { name: code, open: true, reveal: { u1: false, u2: false, u3: false }, createdAt: Date.now() }; saveLocalSessions(m); }
    return m[code];
  }
  const f = await fb();
  const s = await f.fs.getDoc(f.fs.doc(f.db, 'sessions', code));
  return s.exists() ? s.data() : null;
}

export function watchSession(code, cb) {
  if (!CLOUD) {
    const emit = () => cb(localSessions()[code] || null);
    emit();
    const on = (e) => { if (!e.key || e.key === LOCAL_SESSIONS) emit(); };
    window.addEventListener('storage', on); window.addEventListener('aiw-local', emit);
    return () => { window.removeEventListener('storage', on); window.removeEventListener('aiw-local', emit); };
  }
  let unsub = () => { };
  fb().then((f) => { unsub = f.fs.onSnapshot(f.fs.doc(f.db, 'sessions', code), (s) => cb(s.exists() ? s.data() : null), () => cb(null)); });
  return () => unsub();
}

// ---------- 身分 ----------
const ID_KEY = 'aiw:identity';
export function getIdentity() { return LS.get(ID_KEY, null); }
function setIdentity(v) { LS.set(ID_KEY, v); }

/** 確保學員已輸入梯次代碼與姓名；回傳 { session, name, uid } */
export function ensureIdentity({ force = false } = {}) {
  const cur = getIdentity();
  if (cur && cur.session && cur.name && !force) {
    if (!CLOUD) return Promise.resolve({ ...cur, uid: 'local' });
    return studentUser().then((u) => ({ ...cur, uid: u.uid }));
  }
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `
      <form class="modal" autocomplete="off">
        <h2>開始作答</h2>
        <p class="muted">請輸入講師提供的梯次代碼，以及你的姓名或組別。作答會自動儲存。</p>
        <label class="field"><span>梯次代碼</span><input name="session" required placeholder="例如 III-1119" value="${esc(cur?.session || '')}"></label>
        <label class="field"><span>姓名或組別</span><input name="name" required maxlength="40" placeholder="例如 王小明／第 3 組" value="${esc(cur?.name || '')}"></label>
        <p class="form-error" hidden></p>
        <div class="row-end">
          ${cur ? '<button type="button" class="btn ghost" data-cancel>取消</button>' : ''}
          <button class="btn primary" type="submit">進入練習</button>
        </div>
        ${CLOUD ? '' : '<p class="tiny muted">目前為本機模式（尚未設定 Firebase），作答只存在這台電腦的瀏覽器。</p>'}
      </form>`;
    document.body.appendChild(wrap);
    const form = wrap.querySelector('form');
    const err = wrap.querySelector('.form-error');
    form.session.focus();
    wrap.querySelector('[data-cancel]')?.addEventListener('click', () => { wrap.remove(); ensureIdentity().then(resolve); });
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const session = normCode(form.session.value);
      const name = form.name.value.trim();
      if (!session || !name) return;
      const btn = form.querySelector('[type=submit]');
      btn.disabled = true; err.hidden = true;
      try {
        let uid = 'local';
        if (CLOUD) uid = (await studentUser()).uid;
        const s = await getSession(session);
        if (!s) throw new Error('找不到這個梯次代碼，請向講師確認。');
        if (s.open === false) throw new Error('這個梯次已關閉作答。');
        setIdentity({ session, name });
        wrap.remove();
        resolve({ session, name, uid });
      } catch (ex) {
        err.textContent = ex.message || '連線失敗，請稍後再試。'; err.hidden = false; btn.disabled = false;
      }
    });
  });
}

// ---------- 作答 ----------
const draftKey = (id, unit) => `aiw:resp:${id.session}:${id.name}:${unit}`;

/** 讀取作答：取本機草稿與雲端資料中較新的一份 */
export async function loadResponse(id, unit) {
  const local = LS.get(draftKey(id, unit), null);
  if (!CLOUD) return local;
  try {
    const f = await fb();
    const s = await f.fs.getDoc(f.fs.doc(f.db, 'sessions', id.session, 'responses', `${id.uid}_${unit}`));
    if (s.exists()) {
      const c = s.data();
      if (!local || (c.clientUpdatedAt || 0) >= (local.clientUpdatedAt || 0)) return { data: c.data, status: c.status, clientUpdatedAt: c.clientUpdatedAt, submittedAt: c.submittedAtClient };
    }
  } catch (e) { console.warn('[aiw] 讀取雲端作答失敗', e); }
  return local;
}

/** 儲存作答。status: 'draft' | 'submitted' */
export async function saveResponse(id, unit, data, status) {
  const prev = LS.get(draftKey(id, unit), null);
  const finalStatus = status === 'submitted' || prev?.status === 'submitted' ? 'submitted' : 'draft';
  const rec = {
    data: clean(data), status: finalStatus, clientUpdatedAt: Date.now(),
    submittedAt: status === 'submitted' ? Date.now() : (prev?.submittedAt || null),
    session: id.session, name: id.name, unit
  };
  LS.set(draftKey(id, unit), rec);
  if (!CLOUD) { window.dispatchEvent(new Event('aiw-local')); return { cloud: false, rec }; }
  const f = await fb();
  await f.fs.setDoc(f.fs.doc(f.db, 'sessions', id.session, 'responses', `${id.uid}_${unit}`), {
    uid: id.uid, name: id.name, unit, session: id.session,
    data: rec.data, status: finalStatus, clientUpdatedAt: rec.clientUpdatedAt,
    submittedAtClient: rec.submittedAt,
    updatedAt: f.fs.serverTimestamp()
  });
  return { cloud: true, rec };
}

/** 自動儲存控制器：本機即時、雲端延遲 2.5 秒 */
export function autosaver(id, unit, getData, statusEl) {
  let timer = null; let status = 'draft';
  const show = (t, cls = '') => { if (statusEl) { statusEl.textContent = t; statusEl.className = 'save-status ' + cls; } };
  const time = () => new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  async function flush(st) {
    clearTimeout(timer); timer = null;
    if (st) status = st;
    show('儲存中…');
    try {
      const r = await saveResponse(id, unit, getData(), st || status);
      if (r.rec.status === 'submitted') status = 'submitted';
      show(`${r.cloud ? '已同步雲端' : '已存在本機'} ${time()}`, 'ok');
      return r;
    } catch (e) {
      console.error(e); show('雲端儲存失敗，已保留在本機，稍後會再試', 'err');
      timer = setTimeout(() => flush(), 8000);
      throw e;
    }
  }
  // 上次離開前尚未同步雲端的草稿：啟動後補傳
  if (CLOUD && LS.get(draftKey(id, unit), null)?.pending) timer = setTimeout(() => flush().catch(() => { }), 800);
  // 換頁或切到背景時，立即同步尚未送出的修改
  const flushNow = () => { if (timer) flush().catch(() => { }); };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushNow(); });
  addEventListener('pagehide', flushNow);
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a || !timer || a.target === '_blank' || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    flush().catch(() => { }).finally(() => { location.href = a.href; });
  }, true);
  return {
    setStatus(s) { status = s; },
    touch() {
      LS.set(draftKey(id, unit), { ...(LS.get(draftKey(id, unit), {}) || {}), data: clean(getData()), clientUpdatedAt: Date.now(), status, session: id.session, name: id.name, unit, pending: CLOUD });
      show('編輯中…');
      clearTimeout(timer); timer = setTimeout(() => flush().catch(() => { }), CLOUD ? 2500 : 400);
    },
    flush,
    get status() { return status; }
  };
}

// ---------- 參考答案（講師開放後才看得到） ----------
/** 從參考答案 Markdown 取出自動對答案用的答案鍵：<!-- key {...} --> */
export function parseKey(md) {
  const m = /<!--\s*key\s*([\s\S]*?)-->/.exec(md || '');
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch (e) { console.warn('答案鍵格式錯誤', e); return null; }
}

/**
 * 講師開放參考答案時顯示在 el；onKey(key) 在開放時收到答案鍵、關閉時收到 null，
 * 讓頁面標出學員各題的對錯。
 */
export function watchReveal(id, unit, el, onKey = () => {}) {
  let shown = false; let ver = 0;
  return watchSession(id.session, async (s) => {
    const open = !!(s && s.reveal && s.reveal[unit]);
    const my = ++ver;
    if (!open) { const was = shown; el.hidden = true; el.innerHTML = ''; shown = false; if (was) onKey(null); return; }
    if (shown) return;
    let md = '';
    try {
      if (!CLOUD) md = (LS.get('aiw:refs', {})[unit]) || '';
      else {
        const f = await fb();
        const d = await f.fs.getDoc(f.fs.doc(f.db, 'sessions', id.session, 'refs', unit));
        md = d.exists() ? d.data().md : '';
      }
    } catch (e) { console.warn(e); }
    if (!md || my !== ver) return;
    const { marked } = await import('https://cdn.jsdelivr.net/npm/marked@12.0.2/lib/marked.esm.js');
    if (my !== ver) return; // 讀取期間講師已關閉
    el.innerHTML = `<div class="ref-head"><span class="pill blue">講師已開放</span><h2>講評參考答案</h2><p class="muted">參考答案不是唯一正解，重點在判斷依據與證據是否充分。</p></div><div class="md">${marked.parse(md.replace(/<!--\s*key[\s\S]*?-->/, ''))}</div>`;
    el.hidden = false; shown = true;
    onKey(parseKey(md));
  });
}

// ---------- 版頭 ----------
export function renderHeader(active) {
  const links = [
    ['index.html', '首頁', 'home'], ['slides.html', '簡報', 'slides'],
    ['unit1.html', '練習一', 'u1'], ['unit2.html', '練習二', 'u2'], ['unit3.html', '練習三', 'u3'],
    ['index.html#downloads', '下載', 'dl']
  ];
  const h = document.createElement('header');
  h.className = 'site-header';
  h.innerHTML = `
    <a class="brand" href="index.html"><span class="brand-mark"></span><span>AI 應用驗收評估</span></a>
    <nav>${links.map(([href, t, k]) => `<a href="${href}" class="${k === active ? 'on' : ''}">${t}</a>`).join('')}</nav>
    <div class="who" hidden></div>`;
  document.body.prepend(h);
  return h;
}

export function showIdentity(id, onSwitch) {
  const w = document.querySelector('.site-header .who');
  if (!w) return;
  w.hidden = false;
  w.innerHTML = `<span class="chip">${esc(id.session)}</span><span class="who-name">${esc(id.name)}</span><button class="link" type="button">切換</button>`;
  w.querySelector('button').onclick = onSwitch;
}

export function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = 'toast ' + kind; t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 300); }, 2600);
}

export const uid8 = () => Math.random().toString(36).slice(2, 10);
