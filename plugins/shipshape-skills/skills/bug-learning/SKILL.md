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

認真評估這個 bug 的根因是否有通用性。不是每個 bug 都值得記錄——typo、環境問題、一次性的設定錯誤就不需要。但如果這個錯誤「下次可能再犯」或「其他開發者也會踩到」，就應該寫進 cookbook。

用這個問題幫助判斷：**如果三個月後有人（或 AI）在做類似的功能，這個 bug 的經驗能幫到他嗎？** 能的話就寫，不能就不寫。

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

只有以下三種情況可以跳過寫入，其他一律寫入 cookbook：
- 純粹的 typo（改錯字、拼錯變數名）
- 一次性的環境問題（本地 port 衝突、暫時性 API 錯誤）
- cookbook 中已經有完全相同的記錄（此時應反省為什麼沒有被攔截）
