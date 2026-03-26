# muki-ai-plugins

一系列給 [Claude Code](https://docs.anthropic.com/en/docs/claude-code) 的 plugin，涵蓋紀律化開發工作流和視覺品質保證。

## Plugins

| Plugin | 說明 |
|--------|------|
| [shipshape-skills](plugins/shipshape-skills/) | 紀律化開發工作流 — TDD、規劃、Code Review、UIUX 審查 |
| [figma-visual-reviewer](plugins/figma-visual-reviewer/) | 視覺回歸測試 — 比對 Figma 設計稿與實際網頁 |

## 安裝

```bash
# 加入 marketplace
/plugin marketplace add mukiwu/muki-ai-plugins

# 安裝個別 plugin
/plugin install shipshape-skills
/plugin install figma-visual-reviewer
```

可以只裝其中一個，也可以兩個都裝。它們各自獨立運作，但整合時更強——shipshape 的 `/feature` 工作流會在階段 6（UIUX 審查）自動使用 figma-visual-reviewer（如果有安裝且有 Figma 設計稿）。

## Plugin 總覽

### shipshape-skills

完整開發生命週期 plugin，含 TDD 強制、規劃 agent、code review 和 UIUX 審查。

- `/init` — 互動式專案設定
- `/feature` — 10 階段開發流程（需求釐清 → code review）
- `/tdd` — 測試驅動開發
- `/plan` — 實作計畫
- `/build-fix` — 建置錯誤診斷
- `/e2e` — Playwright E2E 測試

[詳細說明 →](plugins/shipshape-skills/README.zh-TW.md)

### figma-visual-reviewer

像素級視覺比對，比較 Figma 設計稿與實際網頁的差異。

- `/review` — 互動式視覺審查
- Figma API 導出 → Playwright 截圖 → 像素 diff → AI 判斷
- 產出 HTML 差異報告（三欄並排比對）
- 支援 RWD 多尺寸檢查

[詳細說明 →](plugins/figma-visual-reviewer/README.md)

## 兩個 Plugin 如何搭配

當兩個 plugin 都安裝時，shipshape 的 `/feature` 工作流（階段 6：UIUX 審查）會自動選擇最佳的審查模式：

| 優先順序 | 模式 | 條件 | 審查方式 |
|---------|------|------|---------|
| 1 | Figma 比對 | figma-visual-reviewer 已安裝 + 有 Figma 設計稿 | 像素級 diff + AI 視覺判斷 |
| 2 | 視覺審查 | claude-in-chrome 可用 | AI 五維度視覺審查 |
| 3 | 跳過 | 以上都不可用 | 告知使用者，進入下一階段 |

## 授權

MIT
