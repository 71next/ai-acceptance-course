# AI 應用驗收評估與改善策略｜課程網站

資策會課程「AI 應用驗收評估與改善策略」的網頁版簡報與線上練習。課程以虛構公司「宏岳設備」的 AI 客服為共用案例，學員在網頁上完成三個單元的練習，講師在後台即時查看全班作答。

## 網址

| 頁面 | 網址 |
| --- | --- |
| 首頁 | <https://71next.github.io/ai-acceptance-course/> |
| 網頁簡報 | <https://71next.github.io/ai-acceptance-course/slides.html> |
| 練習一：流程拆解與風險評估 | <https://71next.github.io/ai-acceptance-course/unit1.html> |
| 練習二：情境測試與證據判讀 | <https://71next.github.io/ai-acceptance-course/unit2.html> |
| 練習三：改善與再驗證計畫 | <https://71next.github.io/ai-acceptance-course/unit3.html> |
| 講師後台 | <https://71next.github.io/ai-acceptance-course/admin.html> |

## 功能

- **網頁簡報**：用原 PPT 的內容和配色重新排版，共 35 頁。
  - ← → 翻頁，F 全螢幕，手機可滑動翻頁。網址加 `#頁碼` 可以直接跳到該頁。
  - 隨堂思考頁有 30 秒計時器；隨堂思考 01～03 改成「解答」按鈕，按下後跳到解答頁。
  - 實戰演練頁有按鈕直接開啟對應的練習。
- **練習一**：學員用步驟卡寫任務拆解表，右側即時畫出流程圖（Mermaid），可以設定分支條件。
  - 每個案例的欄位都有下拉選項，選項中刻意混入錯誤做法；也可以選「其他」自行輸入。
  - 每個案例都有紅、黃、綠燈風險評估，最後在「銜接第二單元」選出要帶到下一單元的步驟。
- **練習二**：證據紀錄與題目並排，點題目時會標出該案例的對應紀錄。學員作答會帶入練習一標出的步驟。
- **練習三**：側欄帶入學員自己在練習一、練習二的答案，送出後顯示收件確認。
- **講師後台**：
  - 建立梯次、開關作答。
  - 即時查看全班判定分布、每個人的理由和流程圖。
  - 講評時逐單元開放參考答案，可切換投影放大，也可以匯出 CSV（Excel 可直接開啟）。
- **下載區**：學員精華講義與三份評估表（docx），放在 `downloads/`。

## 技術架構

- 純靜態網站，沒有建置步驟。使用原生 JavaScript ES modules，部署在 GitHub Pages。
- 後端用 Firebase（專案 `ai-acceptance-course`，Spark 免費方案）：
  - **Authentication**：學員用匿名登入，講師用 Google 登入。
  - **Firestore**（`asia-east1` 台灣）：存放梯次、作答與參考答案。
  - **身分識別**：學員輸入「梯次代碼＋姓名／組別」；講師身分由 Firestore `admins/{uid}` 文件決定。
- `assets/firebase-config.js` 的 `apiKey` 留空時，網站會切換成**本機模式**：作答只存在瀏覽器的 localStorage，適合沒有網路或測試時使用。
- 第三方套件從 CDN 載入：Firebase 10.12.2、Mermaid 10.9.1、marked 12.0.2。

### 檔案結構

```
index.html          首頁（簡報入口、三個練習、講義下載）
slides.html         網頁簡報（固定 1920×1080 舞台，等比縮放）
unit1~3.html        三個單元的線上練習
admin.html          講師後台
assets/
  app.js            共用資料層：Firebase／本機模式、身分、自動儲存、參考答案開放
  flow.js           步驟資料 → Mermaid 流程圖
  unit1-data.js     練習一題本：公司規範、案例、下拉選項（OPTIONS）
  carry.js          跨單元帶入（練習一 → 二 → 三）
  style.css         共用樣式
  firebase-config.js
downloads/          講義與評估表
```

以下兩個檔案放在 repo 外面，**不公開**：

- **安全規則**：`firestore.rules`，已貼到 Firebase Console 發布。
- **參考答案母本**：`參考答案.md`，由講師在後台匯入。

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
   - 隨堂思考 01～03 新增解答頁（03 的答案由 Claude 擬稿），並調整 02 的提問文字。
   - 練習一所有欄位改成依案例的下拉選單，保留自行輸入。
6. **部署**：
   - 先部署在個人帳號，之後搬到 71next 帳號，並刪除舊 repo。
   - 建立 Firebase 專案：開啟匿名與 Google 登入、建立 Firestore、發布安全規則、加入授權網域 `71next.github.io`、設定第一位講師。

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

- **免費額度**：Firestore 每天 5 萬次讀取、2 萬次寫入。一班 40 人上一堂課，估計約數千到一萬次寫入。
