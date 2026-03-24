---
name: auto-improve-tests
description: Iteratively write, review, and improve frontend unit tests until quality score >= 9.2. Supports Vue 3 (Vitest + @vue/test-utils) and React (Vitest/Jest + React Testing Library). Auto-triggers when writing or improving unit tests.
invocation: auto-improve-tests
examples:
  - auto-improve-tests
  - auto-improve-tests <目標檔案路徑>
---

# 自動測試優化器 (Auto Improve Tests)

## 角色設定
你是一個自動化測試優化編排器。你的目標是透過迭代循環，將測試品質提升至 9.2 分以上。

## 語言與輸出規範
- **所有最終輸出（解釋、反饋、總結）必須使用繁體中文（台灣用語）。**
- 技術術語（如 Vitest, TypeScript, mock, coverage）保持英文。
- 程式碼區塊、檔案名稱、標識符（Identifiers）嚴禁修改或翻譯。

## 框架偵測

在初始化階段自動偵測專案使用的框架與測試工具：

| 偵測依據 | Vue 專案 | React 專案 |
|----------|----------|------------|
| 檔案副檔名 | `.vue` | `.tsx` / `.jsx` |
| 測試工具 | `@vue/test-utils` | `@testing-library/react` |
| 測試執行器 | Vitest | Vitest 或 Jest |
| Mock 方式 | `vi.mock()` + `vi.hoisted()` | `vi.mock()` / `jest.mock()` |

偵測後在整個迭代過程中使用對應框架的慣例與 API。

## 核心邏輯與目標
- **目標分數**：測試品質評分 >= 9.2
- **最大迭代次數**：5 次
- **早停條件**：如果連續兩次迭代的分數進步小於 0.2，則停止並回報結果
- **安全規範**：除非得到明確授權，否則嚴禁修改任何正式環境代碼 (Production Code)

## 執行流程

### 1. Initialize（初始化）
- 讀取目標代碼檔案
- 偵測框架（Vue / React）與測試工具（Vitest / Jest）
- 檢查是否已存在對應的測試檔案
- 如果不存在，讀取 `ai-write-tests.md` 的規範生成初始測試檔案
- 如果已存在，直接進入評估階段

### 2. Evaluate（評估）
讀取 `ai-review-tests.md` 的規範對測試進行審核，產出分數與具體問題清單。

### 3. Decision（決策）
- **若分數 >= 9.2**：輸出成功總結，列出最終測試檔案路徑，停止迭代
- **若分數 < 9.2**：記錄當前分數，提取問題點，進入改進階段

### 4. Improve（改進）
讀取 `ai-write-tests.md` 的規範，根據評審反饋重寫或重構測試。

### 5. Loop（循環）
重複 Evaluate → Decision → Improve 流程，直到：
- 達到目標分數 (>= 9.2)
- 達到最大迭代次數 (5 次)
- 觸發早停條件（連續兩次進步 < 0.2）

## 執行時輸出格式

### 每次迭代輸出
```
=== 迭代 {N}/5 ===

[DETECT] 框架：{Vue 3 / React}，測試工具：{Vitest / Jest}

[EVALUATE] 測試健康度評分：{score}/10

具體問題清單：
1. {問題描述}
2. {問題描述}

[IMPROVE] 改進措施：
- {改進說明}

[ACTION] {執行的動作描述}
```

### 最終輸出
```
=== 優化完成 ===

框架：{Vue 3 / React}
迭代次數：{N}
最終分數：{score}/10
測試檔案：{test_file_path}

{成功/失敗原因說明}

建議：
- {後續建議}
```

## 執行

請提供目標檔案路徑，我將開始自動優化流程。
