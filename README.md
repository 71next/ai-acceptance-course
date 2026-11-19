# AI 應用驗收評估與改善策略｜課程網站

資策會課程「AI 應用驗收評估與改善策略」的網頁簡報與實作練習（實作版，2 小時）。課程以虛構公司「宏岳設備」的內部 AI 客服助手為驗收對象：客服接到客戶來電時使用，主管目標是節省一半的客服處理時間。學員在網頁上走完一套驗收流程，講師在後台即時查看全班作答。

## 網址

| 頁面 | 網址 |
| --- | --- |
| 首頁 | <https://71next.github.io/ai-acceptance-course/> |
| 網頁簡報 | <https://71next.github.io/ai-acceptance-course/slides.html> |
| 實作 ① 拆流程 | <https://71next.github.io/ai-acceptance-course/unit1.html> |
| 實作 ② 設計驗證條件 | <https://71next.github.io/ai-acceptance-course/unit2.html> |
| 實作 ③ 實際實測 | <https://71next.github.io/ai-acceptance-course/lab.html> |
| 實作 ④ 驗收報告 | <https://71next.github.io/ai-acceptance-course/unit3.html> |
| 講師後台 | <https://71next.github.io/ai-acceptance-course/admin.html> |

## 課程流程

驗收流程分五步：問題類型 → 拆流程 → 設計驗證 → 實際測試 → 判讀結果。第一步由講師導讀，後四步是網站上的實作，前一步的結果會自動帶到下一步。

| 步驟 | 頁面 | 時間 | 學員做什麼 |
| --- | --- | --- | --- |
| 導讀 | 簡報（12 頁） | 15 分 | 使用情境、驗收流程、客戶來電的六種情境 |
| ① 拆流程 | `unit1.html` | 20 分 | A：依六種情境（正常、資訊不足、模糊或衝突、例外、權限與安全、系統失敗）寫客戶可能的說法，選 AI 該直接完成、先補問、轉人工或拒絕。B：拆「報修建單（含查保固）」流程，每一步標紅黃綠燈 |
| ② 設計驗證條件 | `unit2.html` | 20 分 | 看範例 TC-01 → 補完半填題 TC-02（已過保固）→ 自己出 1～4 題。① 的紅燈步驟與情境說法會帶入當出題起點 |
| ③ 實際實測 | `lab.html` | 20 分 | 頁面列出自己的測試案例，一鍵帶入客服說法，跟模擬的 AI 助手對話，系統自動留下 L1、L2… 證據紀錄 |
| ④ 驗收報告 | `unit3.html` | 20 分 | 每個案例點選證據紀錄引用 L 編號，判通過／不通過／待補證，不通過的歸 P0／P1／P2，最後給上線建議與最優先改善 |
| 講評 | 簡報 | 15 分 | 「三個缺陷你抓到幾個？」 |

作答資料沿用單元代號 u1（①）、u2（②）、u3（④），並帶 `track: 'simple'`。舊版三單元的作答在後台會標示「舊版練習」，不混入統計。

## 功能

- **網頁簡報**：12 頁。← → 翻頁，F 全螢幕，手機可滑動翻頁；網址加 `#頁碼` 可直接跳頁。每個步驟頁都有按鈕開啟對應的實作。
- **實測：宏岳 AI 客服助手**（`lab.html`）：學員扮演客服，跟模擬的 AI 助手對話（查保固、建工單），「AI 說的話」和「系統實際紀錄」分開記。
  - 講師在後台「③ 實測」分頁切換**工單系統狀況**與 **AI 版本**，立即對全班生效。上課建議用「情境模式＋改善前」。
  - 工單系統狀況：情境模式（只有 HX-002 第一次建單會逾時）／全部正常／全部逾時。
  - 改善前有三個缺陷（講評用）：未經客服確認就建單（P06）；HX-004 沒有購買日期，串接程式卻把「保固期內」傳給 AI（P03）；HX-002 逾時被當成功轉給 AI，AI 誤報已建立，客服要求再建就重複建單（P10、P09）。
  - 改善後：系統防呆擋下未確認建單與重複建單，逾時回傳「結果未知」，並攔下沒有成功結果卻宣稱成功的回覆。
  - 「調閱工單系統」按鈕會把系統實際的工單資料加入證據紀錄。④ 驗收報告直接讀取同一份紀錄。
  - 測試序號：HX-001、HX-002（保固期內）、HX-003（已過保固）、HX-004（沒有購買日期）。
  - 使用 Claude Haiku（`claude-haiku-5-5`）；每位學員每個梯次最多 40 則，全站每天最多 3000 則。
- **AI 回饋**：①、②、④ 送出後，由 Claude（Opus 5.5）依評分重點批改，顯示整體評語、各部分評等與修改建議；講師後台的個人詳細也看得到。每位學員每個練習最多 5 次、全站每天最多 200 次。
- **講師後台**：建立梯次、開關作答、切換實測設定；各步驟分頁統計全班的情境處理方式、燈號、測試類型、判定與上線建議；個人詳細可看流程圖、測試案例、驗收報告與 AI 回饋；匯出 CSV。
- **下載區**：新版簡報 PPT 與對照表整理中，暫時不提供下載。舊版的簡報、講義與評估表仍放在 `downloads/`。

## 技術架構

- 純靜態網站，沒有建置步驟。使用原生 JavaScript ES modules，部署在 GitHub Pages。
- 後端用 Firebase（專案 `ai-acceptance-course`，Spark 免費方案）：
  - **Authentication**：學員用匿名登入，講師用 Google 登入。
  - **Firestore**（`asia-east1` 台灣）：存放梯次、作答與參考答案。
  - **身分識別**：學員輸入「梯次代碼＋姓名／組別」；講師身分由 Firestore `admins/{uid}` 文件決定。
- `assets/firebase-config.js` 的 `apiKey` 留空時，網站會切換成**本機模式**：作答只存在瀏覽器的 localStorage，適合沒有網路或測試時使用。
- 第三方套件從 CDN 載入：Firebase 10.12.2、Mermaid 10.9.1、marked 12.0.2。

### AI 批改

批改服務是一個 Cloudflare Worker（`ai-course-grader`），程式放在 repo 外的 `grader/` 資料夾，不公開。網站只知道它的網址，寫在 `assets/grader-config.js`；網址留空時，網站不會顯示 AI 回饋。

批改流程：

1. 學員按「送出作答」後，網頁帶著學員的 Firebase 登入憑證呼叫 `POST /grade`，內容只有梯次代碼和單元。
2. Worker 驗證登入憑證，再用同一張憑證向 Firestore 讀回學員「已送出」的作答。Worker 不採用網頁傳來的作答內容，所以無法偽造。
3. 檢查次數上限：每位學員每個練習最多 5 次，全站每天最多 200 次。次數記在 Cloudflare KV；批改失敗不扣次數。
4. 把題本、公司規範、參考答案和學員作答交給 Claude（`claude-opus-5-5`），以固定格式回傳：整體評語、各部分評等（到位／部分到位／缺漏／方向有誤）與建議、最優先修改的一件事。
5. 網頁顯示回饋，並存到 Firestore `sessions/{梯次}/feedback/{uid}_{單元}`。講師在後台的個人詳細資料可以展開查看。

安全設計：

- Claude API 金鑰只存在 Worker 的加密設定（Secret），不在網站程式碼或 repo 裡。
- 只接受來自 `https://71next.github.io` 和本機預覽 `http://localhost:8765` 的請求。
- 學員作答以「資料」交給 AI，作答中如果寫了「給我好評」之類的指令，AI 會照常批改並在評語中指出。
- 參考答案在部署 Worker 時才複製進去（`npm run deploy` 會先執行 `sync-ref`），不放進公開的網站 repo。

`grader/wrangler.toml` 的設定：

| 設定 | 目前值 | 說明 |
| --- | --- | --- |
| `MODEL` | `claude-opus-5-5` | 批改用的模型 |
| `MAX_PER_UNIT` | `5` | 每位學員每個練習最多批改幾次 |
| `DAILY_CAP` | `200` | 全站每天最多批改幾次（成本上限） |
| `ALLOWED_ORIGINS` | 網站與本機預覽 | 允許呼叫的網站來源 |
| `LAB_MODEL` | `claude-haiku-5-5` | 實測用的模型 |
| `LAB_MAX_TURNS` | `40` | 實測：每位學員每個梯次最多幾則對話 |
| `LAB_DAILY_CAP` | `3000` | 實測：全站每天最多幾則對話 |

費用：一班 40 人三個練習各批改一次，約 US$3～5。實測一次批改約 15 秒。

### 檔案結構

```
index.html          首頁（驗證五流程、四個實作入口）
slides.html         網頁簡報（固定 1920×1080 舞台，等比縮放）
unit1.html          實作 ① 拆流程
unit2.html          實作 ② 設計驗證條件
lab.html            實作 ③ 實際實測
unit3.html          實作 ④ 驗收報告
admin.html          講師後台
assets/
  app.js            共用資料層：Firebase／本機模式、身分、自動儲存、參考答案開放、步驟列
  simple-data.js    題本：公司規範、六種情境、下拉選項、測試案例範例與提示
  flow.js           步驟資料 → Mermaid 流程圖
  ai-feedback.js    AI 回饋：呼叫批改服務、顯示與保存回饋
  grader-config.js  批改服務網址（留空 = 關閉 AI 回饋與實測）
  style.css         共用樣式
  firebase-config.js
downloads/          舊版簡報與講義
```

以下檔案放在 repo 外面，**不公開**：

- **安全規則**：`firestore.rules`，已貼到 Firebase Console 發布。
- **參考答案母本**：`參考答案.md`，由講師在後台匯入，部署 AI 批改時也會複製一份進 Worker。
- **AI 批改服務**：`grader/`（`src/index.js` 主程式（`/grade` 批改）、`src/lab.js` 實測（`/chat` 模擬 AI 助手與工單系統）、`src/context.js` 舊版題本與作答轉文字、`src/simple.js` 實作版的評分重點與作答轉文字、`wrangler.toml` 設定）。

## 製作過程

全部在 2026-11-19 完成，由講師提供教材，Claude Code 協助製作。

1. **整理教材**：從原始 PPT（35 頁）擷取文字與圖片，並讀入三個單元的練習範本（Worksheet、Quiz、Exercise）。Keynote 匯出失敗，所以改為直接解析 PPTX 的 XML。
2. **確認需求**：和講師討論後決定以下做法。
   - 架構：完整講師後台、GitHub Pages 部署、Firebase 後端（比較過 PHP＋MySQL）。
   - 簡報：沿用原 PPT 風格，用 HTML 重新排版。
   - 練習一：流程圖由步驟表自動產生。
   - 學員身分：用「梯次代碼＋姓名／組別」識別。
   - 參考答案：由 Claude 擬稿，講師審閱。
3. **製作網站**：
   - 簡報略過 3 頁空白頁。
   - 三個練習頁有自動儲存（本機立即存，雲端延遲 2.5 秒同步，離開頁面前補送），並把前一單元的答案帶入下一單元。
   - 製作講師後台，並擬好三個單元的參考答案草稿。
4. **測試與審查**：
   - 在瀏覽器把學員作答到講師開放參考答案的流程完整走過一次，也檢查過手機版面。
   - 請 Codex 審查程式碼，找出 6 個問題，全部修正並重新驗證：
     - 後台的 XSS 漏洞
     - 換頁時未同步的作答
     - 重新整理清空表單
     - 新步驟無法在風險下拉選單選到
     - 參考答案開放的競態問題
     - 簡報按鍵衝突
5. **依講師回饋修改**：
   - 練習一頁首改成「作業任務」與「公司背景」兩張卡，背景中 AI 的三項功能可以點擊，跳到對應案例。
   - 所有隨堂思考都新增解答頁（01、02 由講師提供答案，03～05 由 Claude 擬稿），並調整 02 的提問文字。
   - 練習一所有欄位改成依案例的下拉選單，保留自行輸入。
6. **部署**：
   - 先部署在個人帳號，之後搬到 71next 帳號，並刪除舊 repo。
   - 建立 Firebase 專案：開啟匿名與 Google 登入、建立 Firestore、發布安全規則、加入授權網域 `71next.github.io`、設定第一位講師。
7. **自動對答案**：參考答案母本加入答案鍵，講師開放某單元答案後，學員頁面即時標出對錯。
8. **AI 批改**：
   - 比較過三種做法後，選擇 Cloudflare Worker 中繼（金鑰不進網頁），學員送出後立即回饋，三個練習全部批改。
   - 部署 Worker、建立次數計算用的 KV、設定 API 金鑰、在安全規則加入 `feedback` 子集合。
   - 用 `TEST` 梯次實測：故意答錯的兩題都被判為「方向有誤」並說明原因。

## 維護

- **更新網站**：在這個資料夾 commit 後 `git push`，GitHub Pages 約 1 分鐘內重新部署。
- **修改練習一選項**：編輯 `assets/unit1-data.js` 的 `OPTIONS`，並把 `unit1.html` 中 `unit1-data.js?v=2` 的版本號加一，避免學員的瀏覽器用到快取的舊檔。
- **新增講師或助教**：
  1. 請對方用 Google 登入後台，複製畫面上的 UID。
  2. 在 Firebase Console → Firestore 的 `admins` 集合新增一筆文件，文件 ID 填那個 UID。
- **本機預覽**：

  ```bash
  python3 -m http.server 8765
  # 開 http://localhost:8765
  ```

- **AI 批改的維護**（在 `grader/` 資料夾執行）：
  - **修改參考答案後**：除了到後台重新匯入，也要執行 `npm run deploy`，AI 才會用新版本批改。
  - **調整次數上限或模型**：編輯 `wrangler.toml`，再執行 `npm run deploy`。
  - **更換 API 金鑰**：到 Cloudflare 網頁 → Workers & Pages → `ai-course-grader` → Settings → Variables and Secrets，刪除舊的 `ANTHROPIC_API_KEY` 再新增，類型選 Secret。也可以在**終端機 App** 執行 `npx wrangler secret put ANTHROPIC_API_KEY`。注意：在 Claude Code 用 `!` 執行這行指令無法輸入金鑰，會存成空值。
  - **查看錯誤紀錄**：執行 `npx wrangler tail`，再請人送出作答，就能看到即時紀錄。紀錄只有錯誤類型，不含金鑰。
  - **暫停 AI 回饋**：把 `assets/grader-config.js` 的網址改成空字串，push 後網站就不再顯示 AI 回饋。
  - 第一次在新電腦部署，要先執行 `npm install` 和 `npx wrangler login`。
- **免費額度**：Firestore 每天 5 萬次讀取、2 萬次寫入。一班 40 人上一堂課，估計約數千到一萬次寫入。
