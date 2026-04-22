---
name: feature-stage-8-e2e
description: Stage 8 of feature workflow — Generate and run Playwright E2E tests covering key user flows.
---

# 階段 8：E2E 測試

使用 Agent tool 派遣 **e2e-runner** subagent（`subagent_type: "shipshape-skills:e2e-runner"`）。在 prompt 中傳入：功能描述、關鍵使用者流程、目標 URL。

e2e-runner subagent 負責：
- 測試位置：`src/tests/e2e/`
- 撰寫 Playwright E2E 測試覆蓋關鍵使用者流程
- 執行 `bun run test:e2e` 確認通過

產出後**暫停**，等使用者確認 E2E 涵蓋範圍。
