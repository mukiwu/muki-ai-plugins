---
name: feature-stage-7-improve-tests
description: Stage 7 of feature workflow — Auto-improve unit tests iteratively until quality score >= 9.2.
---

# 階段 7：自動優化測試（Auto Improve Tests）

使用 **auto-improve-tests** skill 迭代優化單元測試：
- 目標分數：>= 9.2/10
- 最大迭代次數：5 次
- 早停條件：連續兩次進步 < 0.2 則停止
- 每次迭代輸出評分、問題清單、改進措施
- **嚴禁修改正式環境代碼**，僅改測試

完成後報告最終分數與迭代次數，**暫停**等使用者確認。
