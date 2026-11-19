// 學員送出後的 AI 回饋：呼叫 grader Worker，顯示並保存回饋
import { CLOUD, fb, currentUser, LS, esc } from './app.js';
import { graderUrl } from './grader-config.js';

export const AI_ON = CLOUD && !!graderUrl;

const RATING = {
  good: ['到位', 'ok'],
  partial: ['部分到位', 'warn'],
  missing: ['缺漏', 'warn'],
  off: ['方向有誤', 'bad']
};
const lsKey = (id, unit) => `aiw:ai:${id.session}:${id.name}:${unit}`;

/** 回饋內容的 HTML（學員頁與講師後台共用） */
export function feedbackHtml(f) {
  if (!f || !Array.isArray(f.items)) return '';
  const when = f.createdAt ? new Date(f.createdAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  return `<p class="ai-summary">${esc(f.summary)}</p>
    <div class="ai-items">${f.items.map((it) => {
      const [label, cls] = RATING[it.rating] || ['', 'warn'];
      return `<div class="ai-item"><div class="ai-item-head"><b>${esc(it.part)}</b><span class="ai-badge ${cls}">${label}</span></div>
        <p>${esc(it.comment)}</p>${it.suggestion ? `<p class="ai-sugg">建議：${esc(it.suggestion)}</p>` : ''}</div>`;
    }).join('')}</div>
    ${f.next_step ? `<div class="fb warn"><b>最優先修改：</b>${esc(f.next_step)}</div>` : ''}
    ${when ? `<p class="tiny muted" style="margin-top:8px">批改時間 ${when}</p>` : ''}`;
}

/** 講師後台讀取某位學員的 AI 回饋 */
export async function loadFeedbackFor(session, uid, unit) {
  if (!CLOUD || !uid) return null;
  try {
    const f = await fb();
    const s = await f.fs.getDoc(f.fs.doc(f.db, 'sessions', session, 'feedback', `${uid}_${unit}`));
    return s.exists() ? s.data().feedback : null;
  } catch { return null; }
}

/**
 * 在 before 元素前放一個「AI 回饋」區塊。回傳 { run }：送出成功後呼叫 run() 取得回饋。
 */
export function mountFeedback(id, unit, before) {
  if (!AI_ON) return { run() {} };
  const box = document.createElement('section');
  box.className = 'card ai-panel';
  box.hidden = true;
  before.parentNode.insertBefore(box, before);
  let busy = false;

  const show = (inner) => { box.hidden = false; box.innerHTML = `<div class="ai-head"><span class="pill indigo">AI 助教</span><h2>AI 回饋</h2></div>${inner}`; };
  const render = (f, remaining) => {
    show(`<p class="muted tiny">AI 依講師的參考答案與評分重點給出回饋，僅供修改參考，最後以講師講評為準。</p>${feedbackHtml(f)}
      <p class="tiny muted" style="margin-top:10px">想再拿一次回饋：修改作答後，再按下方「送出作答」，會自動重新批改${remaining != null ? `（這個練習還剩 ${remaining} 次）` : ''}。</p>`);
  };

  // 開頁時載入之前的回饋
  (async () => {
    let f = LS.get(lsKey(id, unit), null);
    if (!f) f = await loadFeedbackFor(id.session, id.uid, unit);
    if (f) render(f);
  })();

  async function run() {
    if (busy) return;
    busy = true;
    show(`<div class="ai-loading"><span class="spinner"></span>AI 正在批改你的作答，大約需要 20～60 秒，請稍候…</div>`);
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
    try {
      const user = await currentUser();
      const token = await user.getIdToken();
      const r = await fetch(`${graderUrl.replace(/\/$/, '')}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session: id.session, unit })
      });
      const out = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(out.error || 'AI 批改暫時失敗，請稍後再試。');
      LS.set(lsKey(id, unit), out.feedback);
      render(out.feedback, out.remaining);
      try {
        const f = await fb();
        await f.fs.setDoc(f.fs.doc(f.db, 'sessions', id.session, 'feedback', `${id.uid}_${unit}`), { uid: id.uid, unit, feedback: out.feedback, updatedAt: f.fs.serverTimestamp() });
      } catch (e) { console.warn('[aiw] AI 回饋未存到雲端', e); }
    } catch (e) {
      show(`<div class="fb bad">${esc(e.message)}</div>`);
    } finally { busy = false; }
  }
  return { run };
}
