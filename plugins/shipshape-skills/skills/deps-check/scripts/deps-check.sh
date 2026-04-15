#!/usr/bin/env bash
# deps-check — 列出誰 import 了指定的 TypeScript/JavaScript 檔案
#
# Usage: deps-check.sh <file-path>
#
# 優先使用 madge（若專案已安裝），否則 fallback 到 grep。

set -euo pipefail

TARGET="${1:-}"

if [[ -z "$TARGET" ]]; then
  echo "Usage: deps-check.sh <file-path>" >&2
  exit 1
fi

if [[ ! -f "$TARGET" ]]; then
  echo "deps-check: file not found: $TARGET" >&2
  exit 0
fi

# 只處理 TS/JS 檔案，其他類型直接略過
case "$TARGET" in
  *.ts|*.tsx|*.js|*.jsx|*.mts|*.cts) ;;
  *)
    echo "deps-check: skipped (not a TS/JS file)"
    exit 0
    ;;
esac

# 找到專案根目錄（有 package.json 的地方）
ROOT="$(pwd)"
while [[ "$ROOT" != "/" && ! -f "$ROOT/package.json" ]]; do
  ROOT="$(dirname "$ROOT")"
done

if [[ ! -f "$ROOT/package.json" ]]; then
  echo "deps-check: no package.json found, skipped"
  exit 0
fi

# 轉成相對路徑（相對於 ROOT）
REL_TARGET="${TARGET#$ROOT/}"
BASENAME="$(basename "$TARGET")"
# 去掉副檔名供 import 比對（TS/JS 的 import 通常不帶副檔名）
STEM="${BASENAME%.*}"

echo "deps-check: analyzing $REL_TARGET"
echo ""

# --- Strategy 1: madge (若已安裝)
if command -v madge >/dev/null 2>&1; then
  echo "→ using madge"
  # madge --reverse 列出誰依賴目標檔案
  if madge --reverse --ts-config "$ROOT/tsconfig.json" "$REL_TARGET" 2>/dev/null | sed '1d' | grep -v '^$' | head -50; then
    exit 0
  fi
  echo "(madge 無輸出，改用 grep fallback)"
fi

# --- Strategy 2: grep fallback
echo "→ using grep fallback"
echo ""

# 搜尋範圍：ROOT 底下的 src/、app/、lib/、test/ 等常見目錄
SEARCH_DIRS=()
for d in src app lib test tests __tests__ packages; do
  [[ -d "$ROOT/$d" ]] && SEARCH_DIRS+=("$ROOT/$d")
done
if [[ ${#SEARCH_DIRS[@]} -eq 0 ]]; then
  SEARCH_DIRS=("$ROOT")
fi

# 搜尋 pattern：from '...stem' 或 import('...stem') 或 require('...stem')
# 為了避免過多誤判，優先比對 /stem 或 '../stem' 這類有路徑分隔的形式
PATTERN="(from|import|require)[[:space:](]+['\"][^'\"]*/${STEM}(['\"]|/)"

RESULTS=$(grep -rEn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.mts' --include='*.cts' "$PATTERN" "${SEARCH_DIRS[@]}" 2>/dev/null | grep -v "^$TARGET:" || true)

if [[ -z "$RESULTS" ]]; then
  echo "✓ no importers found — 安全改動"
  exit 0
fi

COUNT=$(echo "$RESULTS" | wc -l | tr -d ' ')
echo "found $COUNT importer line(s):"
echo ""
echo "$RESULTS" | head -50
if [[ "$COUNT" -gt 50 ]]; then
  echo ""
  echo "(truncated, total $COUNT lines)"
fi

echo ""
echo "→ 建議：修改前先 Read 上述依賴方，確認改動不會破壞它們"
