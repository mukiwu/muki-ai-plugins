#!/bin/bash
# post-stop-bug-learning.sh
# Stop hook
#
# Claude 結束回覆時，檢查這次對話是否有修 bug。
# 如果有修 bug 且沒有執行過 bug-learning 流程，提醒沉澱。
#
# Exit 0 = 正常結束（提醒會注入到 context）

INPUT=$(cat)

TRANSCRIPT_PATH=$(echo "$INPUT" | jq -r '.transcript_path // empty')

if [ -z "$TRANSCRIPT_PATH" ] || [ ! -f "$TRANSCRIPT_PATH" ]; then
  exit 0
fi

# 檢查是否有修 bug 的跡象
BUG_SIGNALS=$(grep -c -i -E "bug|修復|fix|修正|壞了|壞掉|不對|錯了|錯誤|broken|issue|問題.*修|hotfix" "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

if [ "$BUG_SIGNALS" -lt 3 ]; then
  # 沒有足夠的 bug 修復信號，不提醒
  exit 0
fi

# 檢查是否已經執行過 bug-learning
BUG_LEARNING_DONE=$(grep -c -i -E "bug.learning|錯誤學習|沉澱.*cookbook|cookbook.*沉澱|已記錄|bug learning" "$TRANSCRIPT_PATH" 2>/dev/null || echo "0")

if [ "$BUG_LEARNING_DONE" -gt 0 ]; then
  # 已經做過 bug-learning，不重複提醒
  exit 0
fi

# 注入提醒
cat <<EOF
{
  "continue": true,
  "systemMessage": "📝 Bug Learning 提醒：這次對話中似乎有修復 bug。根據 shipshape-skills 規範，修復完成後應執行 bug-learning 流程：\n1. 分析根因（是什麼錯了？為什麼？是否有通用性？）\n2. 判斷沉澱方向（Cookbook / Memory / Workflow / 不沉澱）\n3. 執行沉澱並回報\n\n請詢問使用者是否要進行 bug learning。"
}
EOF

exit 0
