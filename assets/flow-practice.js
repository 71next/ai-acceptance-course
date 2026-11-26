// ① 頁尾的「加練：自己拆一個流程」：步驟＋分支＋即時流程圖
// 跟抓錯任務無關：不送出、不批改、不帶到 ②，只存在這台瀏覽器（localStorage）
import { LS, esc, uid8, toast } from './app.js';
import { renderFlow, END, ROLE_LEGEND } from './flow.js';

const KEY = 'aiw:flow-practice';
const ROLES = ['客戶', '客服', 'AI 助手', '系統', '主管'];
const NO = (i) => `S${i + 1}`;
const blankStep = () => ({ id: uid8(), action: '', role: '', next: [] });
const blank = () => { const steps = [blankStep(), blankStep(), blankStep()]; return { title: '', steps, start: steps[0].id }; };

/** 範例：宏岳報修建單（含逾時分支），給學員看「分支」怎麼畫 */
function example() {
  const s = ['客服輸入序號和問題|客服', 'AI 查保固|系統', 'AI 回覆保固結果，列出工單內容請客服確認|AI 助手', '送出建單|系統', 'AI 回報工單編號|AI 助手', 'AI 回報「結果未確認」，查詢工單狀態|AI 助手', '客服修改工單內容|客服']
    .map((t) => { const [action, role] = t.split('|'); return { id: uid8(), action, role, next: [] }; });
  s[2].next = [{ to: s[3].id, cond: '客服確認' }, { to: s[6].id, cond: '客服要修改' }];
  s[6].next = [{ to: s[2].id, cond: '' }];
  s[3].next = [{ to: s[4].id, cond: '成功，有工單編號' }, { to: s[5].id, cond: '逾時，沒有編號' }];
  s[4].next = [{ to: END, cond: '' }];
  s[5].next = [{ to: END, cond: '' }];
  return { title: '宏岳報修建單（範例）', steps: s, start: s[0].id };
}

export function mountFlowPractice(root) {
  let st = LS.get(KEY) || blank();
  root.innerHTML = `
  <div class="fp-head">
    <span class="pill">加練｜不計分</span>
    <h2>自己拆一個流程：步驟、分支、流程圖</h2>
    <p class="muted">跟上面的抓錯任務無關，是給你練習拆其他流程用的，例如你公司裡想導入 AI 的工作。寫下每一步「誰做、做什麼」，遇到判斷就加分支，右邊會即時畫出流程圖。內容只存在這台電腦的瀏覽器，不會送出。</p>
    <div class="fp-tools">
      <label class="field" style="margin:0;flex:1;min-width:220px"><span class="label">流程名稱</span><input data-title placeholder="例如：請假申請、退貨處理、報價單產生" value="${esc(st.title)}"></label>
      <button class="btn ghost" data-ex>載入範例</button>
      <button class="btn ghost" data-clear>清空重來</button>
    </div>
  </div>
  <div class="case-layout fp-layout">
    <div class="card">
      <div class="row-end" style="justify-content:space-between;align-items:center;margin-bottom:14px">
        <h3 style="margin:0">流程步驟</h3>
        <label style="display:flex;gap:8px;align-items:center;font-size:14px">起點 <select data-start style="width:auto;min-width:130px"></select></label>
      </div>
      <div data-steps></div>
      <button class="btn ghost" data-add style="width:100%">＋ 新增步驟</button>
    </div>
    <div class="card flow-card">
      <h3>流程圖預覽</h3>
      <div class="flow-box" data-flow></div>
      <div class="legend">${ROLE_LEGEND}</div>
    </div>
  </div>
  <datalist id="fpRoles">${ROLES.map((r) => `<option value="${r}">`).join('')}</datalist>`;

  const $ = (s) => root.querySelector(s);
  const box = $('[data-steps]');
  let t = null;
  const save = () => LS.set(KEY, st);
  const draw = () => { clearTimeout(t); t = setTimeout(() => renderFlow($('[data-flow]'), 'S', st), 250); };
  const changed = () => { save(); draw(); };
  const opts = (sel, { end = false, empty = '選擇步驟', self = '' } = {}) =>
    `<option value="">${empty}</option>` +
    st.steps.map((s, i) => `<option value="${s.id}" ${s.id === sel ? 'selected' : ''} ${s.id === self ? 'disabled' : ''}>${NO(i)}　${esc((s.action || '').slice(0, 18))}</option>`).join('') +
    (end ? `<option value="${END}" ${sel === END ? 'selected' : ''}>（結束）</option>` : '');

  function render() {
    $('[data-start]').innerHTML = opts(st.start, { empty: '第一步' });
    box.innerHTML = st.steps.map((s, i) => `
      <div class="step" data-sid="${s.id}">
        <div class="step-top">
          <span class="step-no">${NO(i)}</span><span class="grow"></span>
          <button class="icon-btn" data-up aria-label="上移" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="icon-btn" data-down aria-label="下移" ${i === st.steps.length - 1 ? 'disabled' : ''}>↓</button>
          <button class="icon-btn" data-del aria-label="刪除步驟">✕</button>
        </div>
        <div class="fgrid">
          <label class="field full"><span class="label">做什麼</span><input data-f="action" value="${esc(s.action)}" placeholder="例如：AI 查保固"></label>
          <label class="field"><span class="label">誰做</span><input data-f="role" list="fpRoles" value="${esc(s.role)}" placeholder="客戶／客服／AI 助手／系統"></label>
        </div>
        <div class="conns">
          <div class="label">下一步（遇到判斷就加分支）</div>
          ${(s.next || []).map((n, j) => `
            <div class="conn" data-ci="${j}">
              <span class="arrow">→</span>
              <select data-cto>${opts(n.to, { end: true, empty: '選擇下一步', self: s.id })}</select>
              <input class="cond" data-ccond value="${esc(n.cond)}" placeholder="條件，例如：逾時（可不填）">
              <button class="icon-btn" data-cdel aria-label="移除分支">✕</button>
            </div>`).join('')}
          ${(s.next || []).length ? '' : `<p class="conn-hint">沒設定時，自動接到${i < st.steps.length - 1 ? '下一個步驟' : '「結束」'}。</p>`}
          <button class="link tiny" data-cadd>＋ 新增分支</button>
        </div>
      </div>`).join('');
    draw();
  }
  const relabel = () => root.querySelectorAll('select[data-cto], select[data-start]').forEach((sel) =>
    [...sel.options].forEach((o) => { const i = st.steps.findIndex((s) => s.id === o.value); if (i >= 0) o.textContent = `${NO(i)}　${(st.steps[i].action || '').slice(0, 18)}`; }));

  $('[data-title]').oninput = (e) => { st.title = e.target.value; save(); };
  $('[data-start]').onchange = (e) => { st.start = e.target.value || st.steps[0]?.id; changed(); };
  $('[data-add]').onclick = () => { st.steps.push(blankStep()); render(); save(); };
  // 已有內容時，要按第二次才會覆蓋（不用瀏覽器確認視窗）
  const twice = (btn, label, fn) => {
    btn.onclick = () => {
      if (st.steps.some((s) => s.action) && btn.dataset.armed !== '1') {
        btn.dataset.armed = '1'; btn.textContent = '再按一次會覆蓋目前內容';
        setTimeout(() => { btn.dataset.armed = ''; btn.textContent = label; }, 3000); return;
      }
      btn.dataset.armed = ''; btn.textContent = label; fn();
    };
  };
  twice($('[data-ex]'), '載入範例', () => { st = example(); $('[data-title]').value = st.title; render(); save(); toast('已載入範例，可以直接修改'); });
  twice($('[data-clear]'), '清空重來', () => { st = blank(); $('[data-title]').value = ''; render(); save(); toast('已清空'); });
  box.addEventListener('input', (e) => {
    const s = st.steps.find((x) => x.id === e.target.closest('[data-sid]')?.dataset.sid); if (!s) return;
    if (e.target.dataset.f) { s[e.target.dataset.f] = e.target.value; if (e.target.dataset.f === 'action') relabel(); }
    else if (e.target.hasAttribute('data-ccond')) s.next[+e.target.closest('[data-ci]').dataset.ci].cond = e.target.value;
    else return;
    changed();
  });
  box.addEventListener('change', (e) => {
    if (!e.target.hasAttribute('data-cto')) return;
    const s = st.steps.find((x) => x.id === e.target.closest('[data-sid]').dataset.sid);
    s.next[+e.target.closest('[data-ci]').dataset.ci].to = e.target.value; changed();
  });
  box.addEventListener('click', (e) => {
    const card = e.target.closest('[data-sid]'); if (!card) return;
    const i = st.steps.findIndex((x) => x.id === card.dataset.sid); const s = st.steps[i];
    if (e.target.closest('[data-up]') && i > 0) [st.steps[i - 1], st.steps[i]] = [st.steps[i], st.steps[i - 1]];
    else if (e.target.closest('[data-down]') && i < st.steps.length - 1) [st.steps[i + 1], st.steps[i]] = [st.steps[i], st.steps[i + 1]];
    else if (e.target.closest('[data-del]')) {
      if (st.steps.length <= 1) return toast('至少保留一個步驟');
      st.steps.splice(i, 1);
      st.steps.forEach((x) => { x.next = (x.next || []).filter((n) => n.to !== s.id); });
      if (st.start === s.id) st.start = st.steps[0].id;
    } else if (e.target.closest('[data-cadd]')) { const nx = st.steps[i + 1]; (s.next ||= []).push({ to: nx ? nx.id : END, cond: '' }); }
    else if (e.target.closest('[data-cdel]')) s.next.splice(+e.target.closest('[data-ci]').dataset.ci, 1);
    else return;
    render(); save();
  });
  render();
}
