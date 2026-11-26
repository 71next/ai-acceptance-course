// 抓錯任務卡：①②③④ 頁首共用。缺陷格只顯示「待找出」，不透露內容（講評時才公布）。
const ROUTE = [
  ['u1', '① 拆流程', '畫出藏寶圖：標出最可能出事的步驟'],
  ['u2', '② 設計驗證', '設計能逼缺陷現身的測試'],
  ['lab', '③ 實測', '真的抓到它，留下證據'],
  ['u3', '④ 驗收報告', '用證據判定能不能上線']
];
const GOAL = {
  u1: '找出「嫌疑步驟」。紅燈標得越準，後面越好抓。',
  u2: '每個紅燈步驟至少設計一個測試，想想缺陷會在什麼情況下露出馬腳。',
  lab: '照著你的測試案例測，抓到 AI 出錯的那一刻。AI 說了不算，證據紀錄才算。',
  u3: '用證據判定每個案例：你抓到了幾個缺陷？這套系統現在能不能上線？'
};

export function missionHtml(k) {
  return `<section class="mission">
    <div class="m-top">
      <span class="m-tag">🎯 你的任務</span>
      <h2>下個月就要上線，這個 AI 客服助手卻藏了 <em>4 個缺陷</em>。<br>上線前，把它們全部抓出來！</h2>
      <p>每個缺陷都可能讓公司賠錢、被客訴，或洩漏客戶資料。你是驗收人員，要用證據說服主管：這套系統現在能不能上線。</p>
    </div>
    <div class="m-bugs" aria-label="待找出的缺陷">${[1, 2, 3, 4].map((n) => `<div class="bug"><span class="lock">🔒</span><b>缺陷 ${n}</b><span>待找出</span></div>`).join('')}</div>
    <ol class="m-route">${ROUTE.map(([key, name, desc]) => `<li class="${key === k ? 'now' : ''}"><b>${name}</b><span>${desc}</span>${key === k ? '<i>你在這裡</i>' : ''}</li>`).join('')}</ol>
    <p class="m-goal"><b>本關目標：</b>${GOAL[k]}</p>
  </section>`;
}

export function mountMission(k, el = document.getElementById('mission')) {
  if (el) el.innerHTML = missionHtml(k);
}
