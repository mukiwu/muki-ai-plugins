#!/usr/bin/env node
/**
 * review-tests 報告生成器
 *
 * 用法：node render.cjs <findings.json>
 *   - cwd 必須是專案根（source／test 路徑以此為基準）
 *   - 讀 findings JSON + 從 source 檔抽出每個被測 function 的完整片段
 *   - 輸出單檔 self-contained HTML 到 .review-tests/，印出絕對路徑
 *
 * findings JSON schema：
 * {
 *   "testFile":   "src/.../x.spec.ts",        // 顯示用
 *   "sourceFile": "src/.../x.ts",             // 預設 function 來源檔
 *   "health":     { "level": "良好|及格|待補強", "summary": "一句話總評" },
 *   "sections":   [ { "title": "斷言有效性",
 *                     "findings": [ { "desc": "通順中文，保留專有名詞", "loc": "spec 行 …",
 *                                     "src": { "fn": "fnName", "file": "(選填，預設 sourceFile)", "from": 297, "to": 300 } } ] },
 *                   { "title": "Mock 健康度", "clean": "無問題……" } ],   // clean 與 findings 二選一
 *   "suggestions": [ "應該驗證 …" ]
 * }
 *
 * src.from–src.to 只放與該 finding 相關的關鍵幾行，不要整個 function。
 * 安全性：所有來自 JSON 的文字與 source 片段都先 escape；desc／suggestion 只接受
 * 受限的 `code`／**bold** 標記，由本檔安全轉換，agent 不需（也不應）寫原始 HTML。
 */
const fs = require('fs')
const path = require('path')

const jsonPath = process.argv[2]
if (!jsonPath) {
  console.error('用法：node render.cjs <findings.json>（cwd 須為專案根）')
  process.exit(1)
}

const ROOT = process.cwd()
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
// 受限行內標記：先全 escape，再把 `code` 與 **bold** 轉成標籤
const md = s => esc(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')

const fileCache = {}
function readFileLines(rel) {
  if (!fileCache[rel]) fileCache[rel] = fs.readFileSync(path.join(ROOT, rel), 'utf8').split('\n')
  return fileCache[rel]
}

// 每條 finding 自帶關鍵片段定位 src: { fn, file?, from, to }
// 只擷取與該 finding 相關的關鍵幾行，不展整個 function——重點才不會被淹沒、好找。
function detailsBlock(src) {
  if (!src) return ''
  const file = src.file || data.sourceFile
  const code = readFileLines(file).slice(src.from - 1, src.to).join('\n')
  const loc = `${path.basename(file)}:${src.from}–${src.to}`
  return `<details class="src-toggle">
  <summary>查看 source：<span class="fn">${esc(src.fn)}()</span> <span class="loc">${esc(loc)}</span></summary>
  <pre><code class="lang-ts">${esc(code)}</code></pre>
</details>`
}

function findingHtml(f) {
  return `<div class="finding">
    <div class="finding-body">${md(f.desc)}</div>
    ${f.loc ? `<div class="finding-loc">${esc(f.loc)}</div>` : ''}
    ${f.src ? detailsBlock(f.src) : ''}
  </div>`
}

function sectionHtml(sec) {
  const findings = sec.findings || []
  const body = findings.length
    ? findings.map(findingHtml).join('\n')
    : `<div class="clean">${md(sec.clean || '無問題')}</div>`
  const count = findings.length ? `${findings.length} 項` : '✓'
  return `<section class="card">
    <h2>${esc(sec.title)} <span class="count">${count}</span></h2>
    ${body}
  </section>`
}

const LEVEL_CLASS = { '良好': 'good', '及格': 'pass', '待補強': 'weak' }
const health = data.health || { level: '及格', summary: '' }
const levelCls = LEVEL_CLASS[health.level] || 'pass'

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>測試體檢報告 — ${esc(path.basename(data.testFile || ''))}</title>
<style>
  :root {
    --bg:#fff; --fg:#1f2328; --muted:#656d76; --line:#d0d7de; --soft:#f6f8fa; --accent:#0969da;
    --good:#1a7f37; --good-bg:#dafbe1; --pass:#9a6700; --pass-bg:#fff8c5; --weak:#cf222e; --weak-bg:#ffebe9;
    --bar:#d4a72c; --kw:#cf222e; --str:#0a3069; --cmt:#6e7781; --num:#0550ae;
  }
  * { box-sizing:border-box; }
  body { margin:0; background:var(--bg); color:var(--fg); line-height:1.6; -webkit-font-smoothing:antialiased;
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans TC",sans-serif; }
  .wrap { max-width:960px; margin:0 auto; padding:48px 24px 96px; }
  header { border-bottom:1px solid var(--line); padding-bottom:24px; margin-bottom:28px; }
  h1 { font-size:22px; margin:0 0 6px; letter-spacing:.2px; }
  .meta { font-size:13px; color:var(--muted); }
  .meta code { background:var(--soft); padding:1px 6px; border-radius:5px; font-size:12px; }
  .meta .row { margin-top:4px; }
  .badge { display:inline-flex; align-items:center; gap:8px; margin:20px 0 4px; font-weight:600;
    padding:6px 14px; border-radius:999px; font-size:14px; }
  .badge.good { background:var(--good-bg); color:var(--good); } .badge.good .dot { background:var(--good); }
  .badge.pass { background:var(--pass-bg); color:var(--pass); } .badge.pass .dot { background:var(--pass); }
  .badge.weak { background:var(--weak-bg); color:var(--weak); } .badge.weak .dot { background:var(--weak); }
  .badge .dot { width:8px; height:8px; border-radius:50%; }
  .summary { font-size:14px; color:var(--muted); margin:8px 0 0; }
  .card { border:1px solid var(--line); border-radius:12px; padding:20px 22px; margin:18px 0; }
  h2 { font-size:15px; margin:0 0 14px; display:flex; align-items:center; gap:10px; }
  .count { font-size:12px; font-weight:500; color:var(--muted); background:var(--soft); padding:2px 9px; border-radius:999px; }
  .finding { border-left:3px solid var(--bar); padding:2px 0 2px 14px; margin:14px 0; }
  .finding-body { font-size:14.5px; }
  .finding-body code,.clean code { background:var(--soft); padding:1px 5px; border-radius:4px; font-size:12.5px; }
  .finding-loc { font-size:12px; color:var(--muted); margin:4px 0 8px; font-variant-numeric:tabular-nums; }
  .clean { font-size:14px; color:var(--good); }
  details.src-toggle { margin-top:6px; }
  summary { cursor:pointer; font-size:13px; color:var(--accent); user-select:none; padding:4px 0;
    list-style:none; display:inline-flex; align-items:center; gap:8px; }
  summary::-webkit-details-marker { display:none; }
  summary::before { content:"▸"; font-size:11px; transition:transform .15s; }
  details[open] summary::before { transform:rotate(90deg); }
  summary .fn { font-family:ui-monospace,SFMono-Regular,Menlo,monospace; font-weight:600; }
  summary .loc { color:var(--muted); font-size:11.5px; font-variant-numeric:tabular-nums; }
  pre { background:var(--soft); border:1px solid var(--line); border-radius:8px; padding:14px 16px;
    overflow-x:auto; margin:8px 0 4px; font-size:12.5px; line-height:1.55; }
  code.lang-ts { font-family:ui-monospace,SFMono-Regular,Menlo,"Cascadia Code",monospace; }
  .kw{color:var(--kw);} .str{color:var(--str);} .cmt{color:var(--cmt);font-style:italic;} .num{color:var(--num);}
  .sugg { counter-reset:s; list-style:none; padding:0; margin:0; }
  .sugg li { counter-increment:s; padding:8px 0 8px 34px; position:relative; font-size:14px; border-bottom:1px dashed var(--line); }
  .sugg li:last-child { border-bottom:0; }
  .sugg li::before { content:counter(s); position:absolute; left:0; top:7px; width:22px; height:22px; border-radius:50%;
    background:var(--accent); color:#fff; font-size:12px; display:grid; place-items:center; font-weight:600; }
  .sugg code { background:var(--soft); padding:1px 5px; border-radius:4px; font-size:12.5px; }
  footer { margin-top:32px; font-size:12px; color:var(--muted); text-align:center; }
  footer code { background:var(--soft); padding:1px 6px; border-radius:5px; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>測試體檢報告</h1>
    <div class="meta">
      <div class="row">測試檔：<code>${esc(data.testFile || '')}</code></div>
      <div class="row">對應 source：<code>${esc(data.sourceFile || '')}</code></div>
      <div class="row">產生時間：${esc(stampReadable())}</div>
    </div>
    <div class="badge ${levelCls}"><span class="dot"></span>整體健康度：${esc(health.level)}</div>
    <p class="summary">${md(health.summary || '')}</p>
  </header>

  ${(data.sections || []).map(sectionHtml).join('\n')}

  <section class="card">
    <h2>建議補的行為 <span class="count">走 tdd 一次一個</span></h2>
    <ol class="sugg">
      ${(data.suggestions || []).map(s => `<li>${md(s)}</li>`).join('\n      ')}
    </ol>
  </section>

  <footer>
    由 <code>review-tests</code> skill 產生 · 純診斷，未修改任何 source／測試／設定 · 補測試請走 <code>tdd</code>
  </footer>
</div>

<script>
// 輕量 inline 語法高亮（零外部依賴）。單次掃描、token 不重疊，
// 全程用 DOM API（createTextNode／createElement）建構，不使用 innerHTML。
document.querySelectorAll('code.lang-ts').forEach(function (c) {
  var src = c.textContent;
  var re = /(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|(\`[^\`]*\`|'[^'\\n]*'|"[^"\\n]*")|\\b(const|let|var|function|return|if|else|for|of|in|export|import|type|interface|new|null|true|false|void|number|boolean|string)\\b|\\b(\\d+\\.?\\d*)\\b/g;
  var frag = document.createDocumentFragment();
  var last = 0, m;
  function text(s) { if (s) frag.appendChild(document.createTextNode(s)); }
  function span(cls, s) { var e = document.createElement('span'); e.className = cls; e.textContent = s; frag.appendChild(e); }
  while ((m = re.exec(src))) {
    text(src.slice(last, m.index));
    if (m[1]) span('cmt', m[1]);
    else if (m[2]) span('str', m[2]);
    else if (m[3]) span('kw', m[3]);
    else if (m[4]) span('num', m[4]);
    last = re.lastIndex;
  }
  text(src.slice(last));
  c.textContent = '';
  c.appendChild(frag);
});
</script>
</body>
</html>`

function stampReadable() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
function stampFile() {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
}

const outDir = path.join(ROOT, '.review-tests')
fs.mkdirSync(outDir, { recursive: true })
const base = path.basename(data.testFile || 'report').replace(/\.[^.]+$/, '')
const outFile = path.join(outDir, `${base}-${stampFile()}.html`)
fs.writeFileSync(outFile, html)
console.log(outFile)
