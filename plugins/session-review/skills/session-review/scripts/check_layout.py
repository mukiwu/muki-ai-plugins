#!/usr/bin/env python3
"""Render a session-review report in headless Chrome at several widths and list layout bugs.

Usage:
  python3 check_layout.py REPORT.html [--widths 1280,900,600,390] [--shots DIR]
The report must inline assets/layout-guard.js. Exit code 0 = clean, 1 = issues, 2 = could not run.
"""
import argparse, collections, html, json, os, re, shutil, subprocess, sys, tempfile

def find_chrome():
    cands = [os.environ.get('CHROME'),
             '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
             '/Applications/Chromium.app/Contents/MacOS/Chromium',
             '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
             shutil.which('google-chrome'), shutil.which('chromium'), shutil.which('chromium-browser'),
             shutil.which('microsoft-edge'), shutil.which('chrome')]
    return next((c for c in cands if c and os.path.exists(c)), None)

def wrap(src):
    """Artifacts are published without a skeleton; give the local copy a real one so Chrome is not in quirks mode."""
    txt = open(src, encoding='utf-8').read()
    if not txt.lstrip().lower().startswith('<!doctype'):
        txt = ('<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">'
               '<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>' + txt + '</body></html>')
    fd, path = tempfile.mkstemp(suffix='.html'); os.write(fd, txt.encode('utf-8')); os.close(fd)
    return path

def render(chrome, path, width, shot=None):
    base = [chrome, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
            '--no-default-browser-check', f'--window-size={width},4000', '--virtual-time-budget=10000']
    r = subprocess.run(base + ['--dump-dom', 'file://' + path + '#qa'], capture_output=True, text=True, timeout=120)
    if shot:
        subprocess.run(base + [f'--screenshot={shot}', 'file://' + path], capture_output=True, timeout=120)
    ms = re.findall(r'<pre id="qa-result"[^>]*>(\{.*?)</pre>', r.stdout, re.S)
    m = ms[-1] if ms else None
    if not m:
        return {'error': 'qa-result not found (is layout-guard.js inlined at the end of the page?)'}
    return json.loads(html.unescape(m))

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('report')
    ap.add_argument('--widths', default='1280,900,600,390')
    ap.add_argument('--shots')
    a = ap.parse_args()
    chrome = find_chrome()
    if not chrome:
        print('找不到 Chrome／Chromium／Edge，設定環境變數 CHROME 指向瀏覽器執行檔後再跑'); sys.exit(2)
    path = wrap(a.report)
    total = 0
    try:
        for w in [int(x) for x in a.widths.split(',')]:
            shot = os.path.join(a.shots, f'width-{w}.png') if a.shots else None
            if a.shots: os.makedirs(a.shots, exist_ok=True)
            res = render(chrome, path, w, shot)
            if 'error' in res:
                print(f'[{w}px] 無法檢查：{res["error"]}'); sys.exit(2)
            issues = res['issues']; total += len(issues)
            print(f'[{w}px] {len(issues)} 個問題' + (f'，截圖 {shot}' if shot else ''))
            by = collections.defaultdict(list)
            for i in issues: by[i['kind']].append(i)
            for k, items in by.items():
                print(f'  {k} × {len(items)}')
                for i in items[:12]:
                    print(f'    - {i["el"]} {i["extra"]}')
                if len(items) > 12: print(f'    …另外 {len(items) - 12} 個')
    finally:
        os.unlink(path)
    sys.exit(1 if total else 0)

if __name__ == '__main__':
    main()
