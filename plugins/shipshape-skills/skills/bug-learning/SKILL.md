---
name: bug-learning
description: 當使用者描述程式行為與預期不符時觸發 — 不論是明確說「有 bug」，還是隱含的「為什麼會這樣」「明明應該 X 卻 Y」「這裡怪怪的」。修復後判斷根因是否值得沉澱到 cookbook、memory 或 workflow，防止同類錯誤再次發生。只要使用者的描述暗示了「現狀 ≠ 預期」，就應該考慮觸發此 skill。
---

# Bug Learning — 錯誤學習與知識沉澱

## 觸發時機

當使用者在開發過程中回報以下情境時**自動觸發**：
- 「發現錯誤」「這裡有錯」「這個壞了」「不對」「做錯」「寫錯」
- 「為什麼沒有 XXX」「XXX 沒出來」「XXX 不能用」
- 任何指出程式碼行為不符預期的描述

## 執行流程

### Step 1：修復錯誤

先專注修復問題，確保功能正常。

### Step 2：根因分析

修復完成後，分析錯誤的根本原因：
- **是什麼錯了？**（具體的錯誤行為）
- **為什麼會錯？**（根本原因，例如：沒有參考既有模式、誤解 API 用法、遺漏初始化步驟）
- **這個錯誤是否有通用性？**（其他開發者或未來的 AI 也可能犯同樣的錯）

### Step 3：評估是否值得沉澱

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

輸出你的評估結果：

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

可以同時寫入多個目標。**關鍵：一旦你在評估中標記了 ✅，Step 4 就必須完成對應的寫入動作。評估是為了決定「要不要寫」，不是寫完評估就結束。**

### Step 4：寫入檔案

這是動作步驟。你在這一步的工作是呼叫 Edit 或 Write 工具，把 Step 2 的分析結果寫進檔案。如果你做完 Step 4 但沒有呼叫過任何寫入工具，那就是漏掉了。

#### 4a. 寫入 Cookbook

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

#### 4b. 寫入 Memory（若 Step 3 標記為 ✅）

1. 在 memory 目錄建立 `feedback_*.md` 檔案
2. 包含 **Why**（為什麼會犯錯）和 **How to apply**（未來怎麼避免）
3. 更新 `MEMORY.md` 索引

#### 4c. 更新 Workflow（若 Step 3 標記為 ✅）

1. 在對應的 command（如 `feature.md`）加入檢查項目
2. 說明在哪個階段應該攔截此類錯誤

### Step 5：回報

列出實際修改的檔案路徑，格式：

```
📝 錯誤學習已記錄：
- Cookbook: docs/cookbook/features/home-dashboard/module-development-guide.md（新增 ErrorBoundary 注意事項）
- Memory: 無需更新
- Workflow: 無需更新
```

## 不沉澱的情況

**預設不寫**。只有通過 Step 3 三問判準的「機械工具抓不到的隱性知識」才寫入 cookbook。常見不寫的情況：

- 純 typo、環境問題、一次性設定錯
- 型別 / eslint / 測試 / deps-check 能抓到的錯（改程式或補測試就夠）
- cookbook 已有相同記錄（此時應反省為什麼沒被攔截，是規則寫不清楚還是沒人讀）
- 純實作細節（例如「這個迴圈改成 for...of 比較快」——改程式就好，不用寫文件）

寫入過多會讓 cookbook 腐爛、沒人讀。寧缺勿濫。
