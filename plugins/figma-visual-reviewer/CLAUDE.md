# figma-visual-reviewer 建議工作規則

> 注意：plugin 目錄裡的 CLAUDE.md **不會**被 Claude Code 自動載入。
> 想要下面這些主動行為，把這段規則複製到你專案的 `CLAUDE.md`（或 `AGENTS.md`）裡。

```markdown
## 視覺審查（figma-visual-reviewer）

- 完成前端功能實作、準備 merge 或上線前，主動建議執行 `/figma-visual-reviewer:review` 進行視覺比對。
- 對話中出現 Figma URL（`figma.com/file/` 或 `figma.com/design/`）時，記住它作為設計稿來源，後續審查時使用。
- 修改 CSS、排版、UI 元件相關檔案後，如果專案有設定 Figma 連結，建議跑一次 visual diff 確認沒有 regression。
```
