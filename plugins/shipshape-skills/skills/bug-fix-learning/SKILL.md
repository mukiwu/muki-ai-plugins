---
name: bug-fix-learning
description: 遇到任何技術問題時觸發 — 包含 bug、測試失敗、build 失敗、非預期行為、效能問題。不限於使用者明確說「有 bug」，也包含：測試跑出紅字、build error、使用者說「為什麼會這樣」「怎麼壞了」「跟預期不同」。處理 GitHub issue 時自動判斷：如果 issue 屬於 bug（錯誤行為、非預期結果、regression），必須走此流程。此 skill 強制走完四個步驟：紀律化修復（含根因調查）→ 沉澱判準 → 寫入或建議替代動作 → 輸出評估摘要。**不可在修完 bug 後直接結束回覆**，即使評估結果是「不需要寫入 cookbook」，也必須明確輸出摘要讓使用者看見此 skill 已執行。
---

# Bug Fix Learning — 紀律化修復與知識沉澱

## 觸發時機

遇到**任何技術問題**時自動觸發，不限於使用者主動回報：

### 使用者描述的問題

- 「發現錯誤」「這裡有錯」「這個壞了」「不對」「做錯」「寫錯」
- 「為什麼沒有 XXX」「XXX 沒出來」「XXX 不能用」
- 「為什麼會這樣」「明明應該 X 卻 Y」「這裡怪怪的」
- 任何指出程式碼行為不符預期的描述

### 情境式觸發（不需要使用者明說）

- **測試失敗** — 跑測試出現紅字、assertion error
- **Build 失敗** — 編譯錯誤、bundler 錯誤
- **非預期行為** — 功能跑起來但結果不對
- **效能問題** — 明顯的效能退化、卡頓
- **整合問題** — 多個元件互動時出錯
- **已經嘗試修了但沒修好** — 修過一次但問題沒消失，或是修了 A 壞了 B

### GitHub issue 判斷

當使用者說「幫我看這個 issue」「處理 issue #123」「這張 ticket」時，先用 `gh issue view` 讀完 issue 內容再分類：

| Issue 類型 | 是否觸發 |
|-----------|----------|
| Bug / defect / regression / 「壞了、錯了、不對」 | ✅ 必須觸發，走完整流程 |
| Feature request / enhancement | ❌ 不觸發，走 `/feature` 流程 |
| Question / 使用問題 | ❌ 不觸發 |
| Documentation | ❌ 不觸發 |
| Refactor / chore | ❌ 不觸發（除非順便修 bug） |

判斷依據：issue label、title 關鍵字（`bug`、`fix`、`broken`、`not working`、`crash`、`error`、`regression`）、內文是否描述「實際行為 vs 預期行為」。模糊時優先看內文，label 可能未被正確標註。

### 不觸發的情況

- 純 typo、拼字錯誤（直接改就好）
- 單純的 import path 錯誤（IDE / tsc 會指出來）
- 設定檔的格式錯誤（直接修正）
- 還在開發中的功能本來就沒完成

## 執行流程

### Step 1：紀律化修復

> **Iron Law：沒有找到根因，不能開始改 code。**
> 猜測性的修復浪費時間，還會製造新 bug。

#### 1a. 根因調查

**在動手改任何程式碼之前**，依序做以下事情：

1. **讀完錯誤訊息** — 不要跳過 error message、stack trace、warning。它們通常直接告訴你答案。記下行號、檔案路徑、error code。
2. **穩定重現** — 能不能每次都觸發？步驟是什麼？如果無法重現，先蒐集更多資料，不要猜。
3. **檢查最近的變更** — `git diff`、最近的 commit、新裝的 dependency、改過的設定。
4. **追蹤資料流** — 錯誤值從哪裡來？是誰傳進來的？一路往上追到源頭。**在源頭修，不在症狀處修。**

**多元件系統的額外步驟**：如果系統有多層（API → Service → DB、CI → Build → Deploy），在每個元件邊界加 log，先確認**哪一層壞了**，再深入那一層調查。

**快速通道**：如果錯誤訊息直接指出根因（例如明確的 null reference、型別錯誤、缺少 import），可在記下根因後直接跳到 1d，略過 1b/1c。

#### 1b. 模式分析

- 找到 codebase 中**類似但正常運作**的程式碼
- 比較壞掉的和正常的有什麼差異
- 每個差異都不要假設「這不重要」

#### 1c. 假設與最小驗證

- 明確陳述假設：「我認為根因是 X，因為 Y」
- 做**最小的改動**來驗證假設，一次只改一個變數
- 驗證失敗 → 提出新假設，**不要在舊的修復上面疊加更多修復**

#### 1d. 實作修復

- 修根因，不修症狀
- 一次只做一個修復，不要順便重構
- 修完跑測試確認

**3 次失敗規則**：如果已經嘗試了 3 次修復都沒有解決問題，**停下來質疑架構**：
- 這個 pattern 本身是不是有問題？
- 是不是在用錯誤的方式解決問題？
- 向使用者提出架構層面的討論，不要嘗試第 4 次修復

#### 1e. 根因紀錄

修復完成後，記錄根因分析的結論（供 Step 2 沉澱評估使用）：
- **是什麼錯了？**（具體的錯誤行為）
- **為什麼會錯？**（根本原因）
- **這個錯誤是否有通用性？**（其他開發者或未來的 AI 也可能犯同樣的錯）

### Step 2：評估是否值得沉澱

Cookbook 只收「程式碼、型別、測試、import 關係**看不出來**」的知識。能被機械工具抓到的東西不該寫，因為那些會隨著程式腐爛，而機械工具不會。

**寫入前的三問判準**（任何一題答「是」就不寫）：

1. **tsc / eslint 會抓到嗎？** — 例如「改 signature 要同步更新呼叫端」。會抓 → 不寫，型別就是文件。
2. **grep import 或 deps-check 看得出關係嗎？** — 例如「改 noteService 要同步 NoteList」。看得出 → 不寫，靠依賴檢查。
3. **測試會失敗嗎？** — 例如「listNotes 應該回傳排序後的陣列」。會失敗 → 不寫，測試就是契約。

**值得寫 cookbook 的，只有這幾類：**

- **跨時序 / 跨 runtime 的隱性耦合**：事件順序、debounce、race condition
- **外部 library 的陷阱**：Plate.js 某函式吃特殊字元會崩、Firebase 某 API 在 Electron 行為不同
- **歷史決策的 why**：為什麼這裡不用 X 而用 Y（背景決策不寫進程式會一直被重新質疑）
- **隱性資料契約**：UI 必須同步某個 constant 清單，但沒有型別連結
- **難以自動驗證的設計規則**：Dark mode 色彩配對、Hyday 品牌色用法（這類通常放 CLAUDE.md 更適合）

**範例對照**：

| 內容 | 寫 cookbook 嗎 | 為什麼 |
|---|---|---|
| noteService.listNotes 回傳 Promise | ❌ | 型別已經寫了 |
| 改 noteService 要改 NoteList | ❌ | deps-check 抓得到 |
| render_widget 重試會覆寫 agentStorage，需 debounce | ✅ | 時序耦合，tsc 抓不到 |
| Plate.js markdownToSlateNodes 吃到 `$` 會崩 | ✅ | 外部 lib 陷阱 |
| OFFICIAL_NOTE_TYPES 要同步 UI 選單 | ✅ | 隱性資料契約 |
| 這個 bug 改了 3 行就好 | ❌ | git log 有了 |

**重要：三問判準不是「否決權」，是「路由器」**。答「是」代表這個知識該由機械工具守護，而不是放進 cookbook。Step 4 必須告訴使用者知識的去處（補型別、加 lint rule、補測試、或寫 cookbook），不是簡單說「不寫」就結束。

輸出你的評估結果：

```
沉澱評估：
- Cookbook：✅ 需要寫入（原因：...）/ ❌ 不需要（原因：...）
- Memory：✅ 需要寫入（原因：...）/ ❌ 不需要（原因：...）
- Workflow：✅ 需要寫入（原因：...）/ ❌ 不需要（原因：...）
```

各目標的判斷依據：

| 沉澱目標 | 什麼時候寫入 | 範例 |
|----------|------------|------|
| **Cookbook**（`docs/cookbook/`） | 專案特定的開發模式、API 用法、元件陷阱、「下次可能再犯」的錯 | Dashboard 錯誤處理必須用 ErrorBoundary 包裹 |
| **Memory**（feedback 類型） | 跨專案通用的開發回饋 | 使用者偏好的確認粒度 |
| **Workflow**（`.claude/commands/`） | 流程缺陷導致的錯誤 | 階段 5 沒有強制完成度檢查 |

可以同時寫入多個目標。**關鍵：一旦你在評估中標記了 ✅，Step 3 就必須完成對應的寫入動作。評估是為了決定「要不要寫」，不是寫完評估就結束。**

### Step 3：寫入檔案

這是動作步驟。你在這一步的工作是呼叫 Edit 或 Write 工具，把 Step 1e 的根因分析寫進檔案。如果你做完 Step 3 但沒有呼叫過任何寫入工具，那就是漏掉了。

#### 3a. 寫入 Cookbook

1. 用 Glob 搜尋 `docs/cookbook/**/*.md`，找到最相關的 cookbook 文件
2. 用 Read 讀取該文件，找到「常見問題」或「注意事項」區塊
3. 用 Edit 在該區塊新增一條記錄。如果沒有相關文件，用 Write 建立新檔案

**寫入內容的格式範例：**

```markdown
### 錯誤處理必須包裹 ErrorBoundary

**問題**：Dashboard 模組直接在 template 中呼叫 API，未處理錯誤時整個頁面白屏。

**原因**：模組各自獨立載入資料，但沒有各自的錯誤邊界，一個模組的 API 錯誤會導致整個 Dashboard unmount。

✅ 正確做法：
```vue
<ErrorBoundary>
  <SensorModule :config="config" />
</ErrorBoundary>
```

❌ 錯誤做法：
```vue
<SensorModule :config="config" />
```
```

#### 3b. 寫入 Memory（若 Step 2 標記為 ✅）

1. 在 memory 目錄建立 `feedback_*.md` 檔案
2. 包含 **Why**（為什麼會犯錯）和 **How to apply**（未來怎麼避免）
3. 更新 `MEMORY.md` 索引

#### 3c. 更新 Workflow（若 Step 2 標記為 ✅）

1. 在對應的 command（如 `feature.md`）加入檢查項目
2. 說明在哪個階段應該攔截此類錯誤

### Step 4：無條件輸出評估摘要

**這是強制步驟，不可跳過**。不論 Step 2 決定寫或不寫，都必須輸出以下格式，讓使用者看到 skill 已經執行完整流程。靜默結束 = 使用者以為 skill 沒觸發，正是此 skill 要避免的失敗模式。

**情境 A：有寫入**（列出實際修改的檔案）

```
📝 錯誤學習已記錄：
- Cookbook: docs/cookbook/xxx.md（新增 ErrorBoundary 注意事項）
- Memory: 無需更新
- Workflow: 無需更新
```

**情境 B：不需要寫入**（說明為什麼，並建議替代動作）

```
📝 錯誤學習評估：
- Cookbook: ❌ 不寫（原因：屬於型別契約，tsc 已能守護）
- Memory: ❌ 不寫（原因：專案特定，不適合跨專案 feedback）
- Workflow: ❌ 不寫
- 建議替代動作：在 `listNotes()` 補上 return type annotation，tsc 會直接擋下呼叫端型別不匹配
```

「建議替代動作」是 Step 4 的核心——如果 cookbook 不寫，一定要告訴使用者「那該做什麼」。選項包括：

- 補型別 / type guard（tsc 能抓）
- 加 eslint rule（lint 能抓）
- 補單元測試 / E2E 測試（測試能抓）
- 提醒跑 deps-check 確認相依方都看過
- 完全不需要動作（例如純 typo、一次性環境錯誤）

只有當「以上皆不適用」且「下次可能再犯」時，才寫入 cookbook。

## 不沉澱的情況

**預設不寫**。只有通過 Step 2 三問判準的「機械工具抓不到的隱性知識」才寫入 cookbook。常見不寫的情況：

- 純 typo、環境問題、一次性設定錯
- 型別 / eslint / 測試 / deps-check 能抓到的錯（改程式或補測試就夠）
- cookbook 已有相同記錄（此時應反省為什麼沒被攔截，是規則寫不清楚還是沒人讀）
- 純實作細節（例如「這個迴圈改成 for...of 比較快」——改程式就好，不用寫文件）

寫入過多會讓 cookbook 腐爛、沒人讀。寧缺勿濫。
