// 練習一：步驟表 → Mermaid 流程圖（學員頁與講師後台共用）
let _mermaid = null;
let _seq = 0;

export async function getMermaid() {
  if (_mermaid) return _mermaid;
  const m = (await import('https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.esm.min.mjs')).default;
  m.initialize({
    startOnLoad: false, securityLevel: 'strict', theme: 'base',
    flowchart: { htmlLabels: true, curve: 'basis', padding: 12, nodeSpacing: 36, rankSpacing: 44 },
    themeVariables: {
      fontFamily: "'Noto Sans TC', -apple-system, sans-serif", fontSize: '14px',
      primaryColor: '#FFFFFF', primaryBorderColor: '#D2D2D7', primaryTextColor: '#1D1D1F',
      lineColor: '#8E8E93', edgeLabelBackground: '#FFFFFF'
    }
  });
  _mermaid = m;
  return m;
}

export const stepNo = (caseKey, i) => (caseKey === 'S' ? `S${i + 1}` : `U1-${caseKey}${i + 1}`); // 'S'：簡單版的單一流程
export const END = '__END__';

/** 步驟的實際連線：未設定時依序接下一步，最後一步接結束 */
export function edgesOf(c, i) {
  const s = c.steps[i];
  const list = (s.next || []).filter((n) => n.to);
  if (list.length) return list;
  if (i < c.steps.length - 1) return [{ to: c.steps[i + 1].id, cond: '', implicit: true }];
  return [{ to: END, cond: '', implicit: true }];
}

const txt = (s) => String(s || '').replace(/[<>&"#|]/g, (ch) => ({ '<': '＜', '>': '＞', '&': '＆', '"': '＂', '#': '＃', '|': '｜' }[ch])).replace(/[\r\n]+/g, ' ');
const short = (s, n = 34) => { s = txt(s).trim(); return s.length > n ? s.slice(0, n) + '…' : s; };

function roleClass(role) {
  const r = String(role || '');
  if (/AI|助手/i.test(r)) return 'ai';
  if (/系統/.test(r)) return 'sys';
  if (/客戶/.test(r)) return 'cust';
  if (/主管|產品/.test(r)) return 'mgr';
  if (/客服/.test(r)) return 'cs';
  return 'none';
}

export function buildMermaid(caseKey, c) {
  const L = ['flowchart TD'];
  if (!c || !c.steps || !c.steps.length) return null;
  const idx = Object.fromEntries(c.steps.map((s, i) => [s.id, i]));
  const startId = c.start && idx[c.start] !== undefined ? c.start : c.steps[0].id;
  L.push('  START(["開始"]):::term');
  c.steps.forEach((s, i) => {
    const action = short(s.action) || '（尚未填寫動作）';
    const role = short(s.role, 14);
    L.push(`  n${i}["<b>${stepNo(caseKey, i)}</b><br/>${action}${role ? `<br/><i>${role}</i>` : ''}"]:::${roleClass(s.role)}`);
  });
  L.push(`  START --> n${idx[startId]}`);
  let usesEnd = false;
  c.steps.forEach((s, i) => {
    edgesOf(c, i).forEach((e) => {
      let target;
      if (e.to === END) { target = 'END'; usesEnd = true; }
      else if (idx[e.to] !== undefined) target = `n${idx[e.to]}`;
      else return;
      const cond = short(e.cond, 20);
      L.push(`  n${i} ${e.implicit ? '-.->' : '-->'}${cond ? `|"${cond}"|` : ''} ${target}`);
    });
  });
  if (usesEnd) L.push('  END(["結束"]):::term');
  L.push('  classDef term fill:#1D1D1F,stroke:#1D1D1F,color:#fff;');
  L.push('  classDef ai fill:#E8F1FC,stroke:#0071E3,color:#0B3A6F;');
  L.push('  classDef cs fill:#E3F4F2,stroke:#0D9488,color:#0B4A44;');
  L.push('  classDef sys fill:#EEEEFB,stroke:#5856D6,color:#2E2C7A;');
  L.push('  classDef cust fill:#FFF5DB,stroke:#C27C00,color:#5A3D00;');
  L.push('  classDef mgr fill:#FDECEB,stroke:#E5352B,color:#7A1A14;');
  L.push('  classDef none fill:#FFFFFF,stroke:#B0B0B8,color:#1D1D1F;');
  return L.join('\n');
}

export async function renderFlow(el, caseKey, c) {
  const code = buildMermaid(caseKey, c);
  if (!code) { el.innerHTML = '<p class="muted" style="padding:24px;text-align:center">新增步驟後，這裡會即時畫出流程圖。</p>'; return; }
  try {
    const m = await getMermaid();
    const { svg } = await m.render(`flow${Date.now()}_${_seq++}`, code);
    el.innerHTML = svg;
  } catch (e) {
    console.warn('[flow]', e, code);
    el.innerHTML = '<p class="muted" style="padding:24px">流程圖暫時無法繪製，請檢查步驟內容。</p>';
  }
}

export const ROLE_LEGEND = `
  <span class="lg"><i style="background:#E3F4F2;border-color:#0D9488"></i>客服</span>
  <span class="lg"><i style="background:#E8F1FC;border-color:#0071E3"></i>AI 助手</span>
  <span class="lg"><i style="background:#EEEEFB;border-color:#5856D6"></i>系統</span>
  <span class="lg"><i style="background:#FFF5DB;border-color:#C27C00"></i>客戶</span>
  <span class="lg"><i style="background:#FDECEB;border-color:#E5352B"></i>主管</span>
  <span class="lg">虛線＝依序自動連接</span>`;
