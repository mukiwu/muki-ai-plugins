# 沒有 diagram-design 時的畫圖規則

找不到 diagram-design skill 時照這份畫，畫出來的圖會跟有裝時長得差不多，整份報告也用同一套 token

## 先確認有沒有裝

依序檢查，有一個成立就用 `/diagram-design`，都沒有才用這份：

1. 這次 session 可用的 skill 清單裡有 `diagram-design`
2. `~/.claude/skills/diagram-design/SKILL.md` 存在
3. 專案的 `.claude/skills/diagram-design/SKILL.md` 存在

用 fallback 時，報告頁尾要註明流程圖用內建規則繪製

## 色票與字體

報告的 `:root` 直接用這組，深色主題照括號裡的值另外定義

| token | 淺色 | 深色 | 用途 |
|---|---|---|---|
| `--paper` | `#f5f5f5` | `#23262f` | 頁面底色、標籤遮罩 |
| `--paper-2` | `#ececec` | `#2d3142` | 泳道底色、次要容器 |
| `--card` | `#ffffff` | `#2a2e3a` | 一般節點底色 |
| `--ink` | `#2d3142` | `#f0f0f0` | 主要文字與框線 |
| `--muted` | `#4f5d75` | `#bfc0c0` | 次要文字、一般箭頭 |
| `--soft` | `#7a8399` | `#8e98ac` | 副標、箭頭標籤 |
| `--rule` | `rgba(45,49,66,.12)` | `rgba(245,245,245,.12)` | 細分隔線 |
| `--accent` | `#eb6c36` | `#f08a59` | 焦點，一張圖最多兩個 |
| `--accent-tint` | `rgba(235,108,54,.10)` | `rgba(240,138,89,.14)` | 焦點節點底色 |
| `--link` | `#2e5aa8` | `#6a95d8` | 外部系統、第二種強調 |

字體從 Google Fonts 載入：標題 `Instrument Serif` 加 `Noto Serif TC`，內文 `Geist` 加 `Noto Sans TC`，技術字 `Geist Mono`，每個都要有系統字體備援

## 要畫哪兩張

- **功能開發泳道圖**：兩條泳道（使用者、AI），6 到 8 個步驟左右交錯往右走，最後一步是收尾，微調迴圈用 accent 虛線畫回實作那一步
- **除錯流程圖**：由上往下，起點與終點用膠囊形，步驟用方框，判斷用菱形（最多三個出口），退路用虛線框

## SVG 寫法

顏色一律寫在 class 上指向 token，不在 SVG 裡寫死色碼，主題切換才會跟著變

```css
svg .lane{fill:var(--paper-2);stroke:var(--rule)}
svg .nd{fill:var(--card);stroke:var(--ink);stroke-width:1}
svg .nd.fc{fill:var(--accent-tint);stroke:var(--accent)}
svg .nd.st{fill:var(--paper-2);stroke:var(--muted)}
svg .nd.opt{fill:var(--paper);stroke:var(--soft);stroke-dasharray:4 3}
svg .t1{font:600 12px var(--f-body);fill:var(--ink)}
svg .t2{font:400 9px var(--f-mono);fill:var(--soft)}
svg .ar{fill:none;stroke:var(--muted);stroke-width:1.2}
svg .ar.acc{stroke:var(--accent)}
svg .ar.ds{stroke-dasharray:5 4}
svg .al{font:500 8px var(--f-mono);fill:var(--soft);letter-spacing:.06em}
svg .lab-bg{fill:var(--paper)}
svg .mk{fill:var(--muted)} svg .mk.acc{fill:var(--accent)}
```

```svg
<defs>
  <marker id="arw" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon class="mk" points="0 0, 8 3, 0 6"/></marker>
  <marker id="arwA" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto"><polygon class="mk acc" points="0 0, 8 3, 0 6"/></marker>
</defs>
<!-- 先畫箭頭，再畫節點，箭頭才會在節點後面 -->
<path class="ar" marker-end="url(#arw)" d="M172 128 L172 232 Q172 240 180 240 L244 240"/>
<!-- 箭頭標籤：遮罩離線 6 到 10px -->
<rect x="776" y="140" width="48" height="12" rx="2" class="lab-bg"/>
<text x="800" y="149" class="al" text-anchor="middle">還要調</text>
<!-- 節點：主標加副標 -->
<rect x="248" y="212" width="112" height="56" rx="6" class="nd fc"/>
<text x="304" y="236" class="t1" text-anchor="middle">盤點影響</text>
<text x="304" y="252" class="t2" text-anchor="middle">頁面 · API · 原本做法</text>
```

## 必守規則

- 轉彎一律用直角加圓弧（`Q` 半徑 8），不畫斜線
- 箭頭標籤要有底色遮罩，並且跟線保持 6 到 10px 距離，不要壓在線上
- 兩條線不重疊；同一邊有多條線進出時，接點至少相隔 12px
- 線不從非起點或終點的節點後面穿過，繞不開才改用虛線
- 節點文字寬度要小於節點寬度減 16，112px 節點的主標最多 8 個中文字，副標最多 10 個中文字，寫完用 check_layout.py 驗證
- 座標、寬高、間距都用 4 的倍數，節點寬用 112、144、160 這類值
- accent 一張圖最多兩個，其餘用 ink、muted、soft
- 節點最多 9 個，超過就拆成兩張
- 圖例放在底部，用細線隔開，不放在圖裡面
- 不加陰影，圓角最多 6 到 10px
- SVG 外層容器設 `overflow-x:auto`，並給 `min-width` 讓手機可以橫向捲動

## 再退一步

如果流程太複雜、手刻 SVG 很難排整齊，可以改用 artifact 原生支援的 mermaid（`<pre class="mermaid">`），不過桌面那份本機檔不會自動渲染 mermaid，要另外從 cdnjs 載入 mermaid 的 UMD 版本，並把主題設成 `base`，themeVariables 也填上面這組色票
