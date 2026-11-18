// 跨單元帶入：練習一 → 練習二／三，練習二 → 練習三
import { loadResponse, esc } from './app.js';
import { stepNo } from './flow.js';

export const U2_QUESTIONS = [
  { k: 'A1', case: 'A', no: 'A-1', q: '保固與免費維修的說明是否符合 P01、P04？', rules: ['P01', 'P04'] },
  { k: 'A2', case: 'A', no: 'A-2', q: '系統是否等客服確認本次工單內容後才建單？', rules: ['P06'] },
  { k: 'A3', case: 'A', no: 'A-3', q: 'AI 是否取得系統成功結果後才回報成功？', rules: ['P10'] },
  { k: 'B1', case: 'B', no: 'B-1', q: 'AI 宣稱第一次建單成功時，是否已有成功結果？', rules: ['P10'] },
  { k: 'B2', case: 'B', no: 'B-2', q: '實際建單結果是否符合避免重複建單的規範？', rules: ['P09'] }
];
export const VERDICTS = { pass: '通過', fail: '不通過', pending: '待補證' };

/** 練習一標出的「回報建單結果」步驟 */
export async function u1Shared(id) {
  const r = await loadResponse(id, 'u1');
  const d = r?.data;
  if (!d?.cases?.C || !d.handoff?.shared?.step) return null;
  const i = d.cases.C.steps.findIndex((s) => s.id === d.handoff.shared.step);
  if (i < 0) return null;
  const s = d.cases.C.steps[i];
  return { no: stepNo('C', i), action: s.action, role: s.role, reason: d.handoff.shared.reason };
}

export async function u2Answers(id) {
  const r = await loadResponse(id, 'u2');
  return r?.data?.q || null;
}

export function u1SharedHtml(s) {
  if (!s) return `<div class="note gray"><strong>練習一的「回報建單結果」步驟：</strong>尚未在練習一標出。請到 <a href="unit1.html">練習一</a> 的「銜接第二單元」→「全班共用案例」選擇案例三的步驟（或對照你紙本的流程圖）。</div>`;
  return `<div class="note"><span class="pill blue" style="margin-right:6px">來自你的練習一</span><strong>${esc(s.no)}　${esc(s.action || '（未填動作）')}</strong>${s.role ? `　<span class="muted">· ${esc(s.role)}</span>` : ''}${s.reason ? `<div class="tiny" style="margin-top:6px">你寫的逾時風險：${esc(s.reason)}</div>` : ''}</div>`;
}
