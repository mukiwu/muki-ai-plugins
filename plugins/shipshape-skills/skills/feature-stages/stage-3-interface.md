---
name: feature-stage-3-interface
description: Stage 3 of feature workflow — Interface design with TypeScript types and function signatures. TDD Red phase skeleton.
---

# 階段 3：介面設計（TDD Red）

使用 Agent tool 派遣 **tdd-guide** subagent（`subagent_type: "shipshape-skills:tdd-guide"`）。在 prompt 中傳入：階段 1 的實作計畫、相關檔案的現有 interface。

tdd-guide subagent 負責：
- 根據計畫（及選定的 UI 方案）定義 TypeScript interface / type
- 設計函式簽名（參數、回傳值）
- 不寫實作，只定義骨架

產出後**暫停**，等使用者確認介面設計。
