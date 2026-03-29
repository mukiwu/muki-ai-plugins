#!/bin/bash
# pre-edit-cookbook-check.sh
# PreToolUse hook (matcher: Edit|Write)
#
# 在寫 code 之前，檢查這次 session 是否已閱讀過 cookbook 和 memory。
# 透過 transcript 掃描來判斷——如果 transcript 中已經出現讀取 cookbook 或 memory 的紀錄就放行。
#
# Exit 0 = 放行（已讀過 or 非程式碼檔案）
# Exit 2 = 阻斷（還沒讀 cookbook/memory，要求先讀）

INPUT=$(cat)

# 取得要編輯的檔案路徑
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')

# 只檢查程式碼檔案，非程式碼檔案直接放行
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx|*.vue|*.py|*.go|*.rs|*.java|*.kt|*.swift|*.rb|*.php|*.css|*.scss)
    # 繼續檢查
    ;;
  *)
    # 非程式碼檔案（markdown、json、config 等），直接放行
    exit 0
    ;;
esac

# 讀取 transcript 檢查是否已閱讀過 cookbook 或 memory
TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  # 沒有 transcript 可查，放行（避免阻斷正常使用）
  exit 0
fi

# 搜尋 transcript 中是否有讀取 cookbook 或 memory 的紀錄
COOKBOOK_READ=$(grep -c -i "cookbook\|docs/cookbook" "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")
MEMORY_READ=$(grep -c -i "memory.*feedback\|feedback_.*\.md\|MEMORY\.md" "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

if [ "$COOKBOOK_READ" -gt 0 ] && [ "$MEMORY_READ" -gt 0 ]; then
  # 已讀過 cookbook 和 memory，放行
  exit 0
fi

# 組合提醒訊息
MISSING=""
if [ "$COOKBOOK_READ" -eq 0 ]; then
  MISSING="docs/cookbook/ 相關文件"
fi
if [ "$MEMORY_READ" -eq 0 ]; then
  if [ -n "$MISSING" ]; then
    MISSING="$MISSING 和 "
  fi
  MISSING="${MISSING}memory 中的 feedback 記錄"
fi

# 用 exit 2 + stderr 阻斷工具執行，強制 Claude 先讀 cookbook/memory
cat >&2 <<EOF
⚠️ 前置知識檢查未通過：你還沒有閱讀 ${MISSING}。

根據 shipshape-skills 的開發規範（stage-5-implement.md），寫程式碼之前必須：
1. 讀取 docs/cookbook/README.md 的快速導覽，找出相關文件
2. 讀取 memory 中的 feedback 記錄，確認過往踩坑經驗
3. 分析要修改的檔案既有模式

請先完成前置檢查再繼續編輯。此次編輯已被阻斷。
EOF

exit 2
