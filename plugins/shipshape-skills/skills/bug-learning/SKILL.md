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

### Step 3：判斷沉澱方向

根據根因分析，決定知識應該沉澱到哪裡：

| 條件 | 沉澱目標 | 範例 |
|------|----------|------|
| 專案特定的開發模式/注意事項 | **Cookbook**（`docs/cookbook/`） | SensorSelector 的 localSensorSelectList 必須從 composable 取得 |
| 跨專案通用的開發回饋 | **Memory**（feedback 類型） | 使用者偏好的確認粒度、溝通方式 |
| 流程缺陷導致的錯誤 | **Workflow**（`.claude/commands/`） | 階段 5 沒有強制完成度檢查 |
| 一次性的環境/設定問題 | **不沉澱** | 本地 port 衝突、暫時性 API 錯誤 |

可以同時沉澱到多個目標。

### Step 4：執行沉澱

#### 更新 Cookbook（若適用）
1. 找到相關的 cookbook 文件（若不確定，列出候選讓使用者選）
2. 在「常見問題」或「注意事項」區塊新增錯誤描述與正確做法
3. 包含 ✅ 正確範例和 ❌ 錯誤範例

#### 更新 Memory（若適用）
1. 在 memory 目錄建立 `feedback_*.md` 檔案
2. 包含 **Why**（為什麼會犯錯）和 **How to apply**（未來怎麼避免）
3. 更新 `MEMORY.md` 索引

#### 更新 Workflow（若適用）
1. 在對應的 command（如 `feature.md`）加入檢查項目
2. 說明在哪個階段應該攔截此類錯誤

### Step 5：回報使用者

告知使用者知識已沉澱到哪裡，格式：

```
📝 錯誤學習已記錄：
- Cookbook: docs/cookbook/features/home-dashboard/module-development-guide.md（新增 SensorSelector 注意事項）
- Memory: feedback_sensor_selector.md（開發回饋）
- Workflow: 無需更新
```

## 不沉澱的情況

以下情況修完 bug 後**不需要沉澱**，直接告知使用者：
- 純粹的 typo 或拼寫錯誤
- 一次性的環境/設定問題
- 已經在 cookbook 或 memory 中記錄過的相同問題（此時應反省為什麼沒有被攔截）
