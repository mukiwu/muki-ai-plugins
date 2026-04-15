---
name: deps-check
description: 動到 `src/lib/`、`src/services/`、`src/utils/`、`src/hooks/`、共用元件等高扇入檔案前，**必定**要先跑 deps-check 列出依賴方——不跑就動刀是「改 A 壞 B」回歸最常見的來源。當使用者要求重構、改名、刪除、修改 public API、改 function signature、搬移檔案，或 Claude 自己判斷要改到共用檔案時，都必須先觸發此 skill。觸發關鍵字：重構、refactor、改名、rename、刪掉、remove、修改簽名、改 API、搬檔案、move、抽出去、extract。只有純新增檔、private symbol、樣式文案、測試檔自己可以跳過。
---

# deps-check — 編輯前的依賴查詢

## 為什麼需要

「改 A 壞 B」最常見的成因是編輯者不知道還有誰依賴 A。型別檢查和測試能抓大部分回歸，但前提是：

1. 你知道要去跑測試
2. 測試覆蓋到了那個依賴路徑

在真正動刀之前先花 5 秒確認「誰 import 我」，能把事後除錯省成事前決策。

## 觸發時機

自動觸發以下情境：

- 要修改 `src/lib/`、`src/services/`、`src/utils/`、`src/hooks/`、共用元件等**被多處引用**的檔案
- 要改名、刪除、搬移某個檔案或 exported symbol
- 要修改 exported function 的 signature 或 return type
- 使用者說「重構」、「refactor」、「改 API」、「把這個抽出去」

**不需要觸發**的情境：

- 純新增檔案（還沒人依賴）
- 只改 private/local symbol，沒動 export
- 單純的樣式調整、文案改動
- 測試檔案自己

## 執行流程

### Step 1：跑腳本

呼叫 `${CLAUDE_PLUGIN_ROOT}/skills/deps-check/scripts/deps-check.sh <file-path>`。

目前只支援 TypeScript / JavaScript 專案（`.ts` `.tsx` `.js` `.jsx` `.mts` `.cts`）。非 TS/JS 檔案會直接略過，不會中斷流程。

腳本會：

1. 往上找到最近的 `package.json` 當專案根
2. 若專案已安裝 `madge`，優先用 `madge --reverse` 列出依賴方
3. 否則 fallback 到 `grep`，搜尋 `src/`、`app/`、`lib/`、`test/` 等常見目錄下的 import / require 語句
4. 輸出依賴方檔案路徑與實際引用的 symbol（grep 模式會直接顯示那一行）

### Step 2：判讀輸出

根據依賴方數量決定策略：

| 依賴數 | 策略 |
|--------|------|
| 0 | 安全改動，直接進行 |
| 1-3 | Read 每個依賴方，確認改動不會破壞它們 |
| 4+ | 回報使用者影響範圍，確認是否要拆成多步驟，或加 deprecation shim |

### Step 3：回報

在動手前先用一兩句話告知使用者影響範圍，例如：

> `noteService.ts` 有 12 個檔案 import，其中 `App.tsx`、`NoteList.tsx`、`useNotes.ts` 用到 `listNotes()`。我要改的是 `listNotes` 的回傳型別，這三個檔案都需要同步更新。要繼續嗎？

### Step 4：動手改

確認後才開始編輯。編輯過程中若發現新的依賴關係（例如動態 import、re-export），再補跑一次腳本。

### Step 5：收尾驗證

改完後跑一次型別檢查，確認沒造成新的跨檔錯誤：

```bash
# 整個專案
npx tsc --noEmit

# 或只驗 incremental（大型專案較快）
npx tsc --noEmit --incremental
```

有錯誤就回頭修，確定乾淨才視為改動完成。deps-check 告訴你**要看哪些檔**，tsc 驗證你**有沒有改對**——兩步都走完才算閉環。

## 和其他機制的關係

- **型別檢查（tsc）**：改完跑 `tsc --noEmit` 驗證。deps-check 是**事前**告訴你要看哪些檔案，tsc 是**事後**驗證你有沒有改對。兩者互補。
- **bug-learning**：如果 deps-check 沒抓到某個隱性耦合（例如透過事件、全域狀態），事後觸發 bug-learning 時應該把這個隱性耦合寫進 memory 或 cookbook，下次就能提前提醒。
- **code-reviewer**：review 階段會再次檢查跨檔案影響，但此時改動已經做完，deps-check 是為了讓 review 能聚焦在品質而非回歸。

## Hook 模式（可選）

使用者也可以把腳本掛在 PreToolUse hook 上，在 Edit 或 Write 前自動執行。範例 `.claude/settings.json`：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "bash ${CLAUDE_PLUGIN_ROOT}/skills/deps-check/scripts/deps-check.sh \"$CLAUDE_TOOL_INPUT_file_path\"",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Hook 模式適合「強制每次都跑」的團隊；skill 模式適合「AI 自行判斷時機」的個人開發者。兩種都用同一支腳本。

## 未來擴充

目前僅支援 TS/JS。如果需要其他語言（Python `pydeps`、Go `go list` 等），可在 `scripts/deps-check.sh` 增加對應分支。
