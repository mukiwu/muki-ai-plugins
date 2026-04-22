---
name: feature-stage-4-tests
description: Stage 4 of feature workflow — Write unit tests first (TDD Red). Includes rationalization prevention and mandatory RED verification.
---

# 階段 4：寫單元測試（TDD Red）

**鐵律：NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST。** 先寫了 code 再補測試？刪掉重來。

使用 Agent tool 派遣 **tdd-guide** subagent（`subagent_type: "shipshape-skills:tdd-guide"`）。在 prompt 中傳入：階段 1 的實作計畫、階段 3 的介面設計、專案的測試規範。

tdd-guide subagent 根據介面設計撰寫 Vitest 單元測試：
- 測試位置：`src/tests/unit/`，鏡像 `src/` 結構
- 遵循專案測試規範
- 涵蓋正常路徑、邊界條件、錯誤處理
- 遵循 Mock 三鐵律（不測 mock 行為、不加 test-only method、mock 前先理解依賴）

## 理性化預防

以下藉口**不成立**，不得用來跳過測試：

| 藉口 | 反駁 |
|------|------|
| 「太簡單不需要測試」 | 簡單的 code 也會出錯，而且測試簡單的 code 成本極低 |
| 「已經手動測試過了」 | 手動測試無記錄、無法重跑、無法防止 regression |
| 「測試後補也能達成一樣效果」 | 先寫測試問的是「應該做什麼」，後補問的是「做了什麼」——思維方向不同 |
| 「刪掉已寫的 code 太浪費」 | 沉沒成本謬誤。錯誤的 code 留著才是浪費 |
| 「測試一寫完就通過了」 | 這代表測的是現有行為而非新功能，重新檢視測試的斷言 |

## Verify RED（強制）

寫完測試後**必須**執行 `npx vitest run` 並確認：
1. 測試是 **FAIL**（斷言失敗）而非 **ERROR**（語法錯誤 / import 錯誤 / runtime crash）
2. 失敗訊息符合預期（例如 `expected true, received false`）
3. 失敗原因是「功能尚未實作」，不是測試本身寫壞了

- FAIL = 正確的 Red，可進入下一步
- ERROR = 測試本身有問題，**先修好測試**再繼續

產出後**暫停**，等使用者確認測試案例的意圖正確。
