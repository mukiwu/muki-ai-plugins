#!/usr/bin/env python3
"""Collect human AI sessions (Claude Code + Codex) for one or more project paths.

Usage:
  python3 collect.py --out DIR [--since YYYY-MM-DD] [PROJECT_PATH ...]
No PROJECT_PATH -> current working directory. Several paths -> merged into one dataset.
Outputs in DIR: summary.json (incl. installed_skills inventory + usage), messages.json, messages.txt
--no-global skips the scan of all projects used to tell whether an unused skill is used elsewhere.
"""
import argparse, collections, glob, json, os, re, statistics, sys

BUILTIN = {'clear','model','compact','login','logout','plugin','plugins','reload-plugins','resume','exit','quit',
  'config','cost','help','init','memory','mcp','permissions','status','doctor','agents','hooks','ide','vim','theme',
  'fast','context','rewind','export','add-dir','bashes','usage','release-notes','upgrade','artifacts','workflows',
  'terminal-setup','statusline','output-style','privacy-settings','feedback','bug','effort','todos','tasks','btw',
  'loop','insights','keybindings','sandbox','security-review-toggle','mobile','install-github-app','pr-comments'}
NOISE = ('Caveat:', 'Base directory for this skill', 'This session is being continued',
         'Another Claude session sent a message', '<local-command', '<system-reminder', '<bash-stdout',
         '<bash-stderr', '<bash-input', '<task-notification', '<command-message', '<user-prompt-submit-hook')

def encode(p):
    return re.sub(r'[^A-Za-z0-9]', '-', p)

def under(cwd, roots):
    return any(cwd == r or cwd.startswith(r + os.sep) for r in roots)

def texts_of(content):
    if isinstance(content, str):
        return [content], 0
    if isinstance(content, list):
        t = [x.get('text', '') for x in content if isinstance(x, dict) and x.get('type') == 'text']
        img = sum(1 for x in content if isinstance(x, dict) and x.get('type') == 'image')
        return t, img
    return [], 0

def claude_sessions(roots, since):
    base = os.path.expanduser('~/.claude/projects')
    cands = set()
    for r in roots:
        enc = encode(r)
        for d in glob.glob(os.path.join(base, glob.escape(enc) + '*')):
            if os.path.isdir(d):
                cands.add(d)
    for d in sorted(cands):
        for f in sorted(glob.glob(os.path.join(d, '*.jsonl'))):
            rows = []
            for line in open(f, encoding='utf-8', errors='ignore'):
                try:
                    rows.append(json.loads(line))
                except Exception:
                    pass
            cwd = next((x.get('cwd') for x in rows if x.get('cwd')), None)
            if not cwd or not under(cwd, roots):
                continue
            ts = [x['timestamp'] for x in rows if x.get('timestamp')]
            if not ts or (since and max(ts)[:10] < since):
                continue
            yield f, cwd, rows

def codex_sessions(roots, since):
    for f in sorted(glob.glob(os.path.expanduser('~/.codex/sessions/**/*.jsonl'), recursive=True)):
        try:
            first = json.loads(open(f, encoding='utf-8', errors='ignore').readline())
        except Exception:
            continue
        cwd = (first.get('payload') or {}).get('cwd')
        if not cwd or not under(cwd, roots):
            continue
        rows = []
        for line in open(f, encoding='utf-8', errors='ignore'):
            try:
                rows.append(json.loads(line))
            except Exception:
                pass
        ts = [x['timestamp'] for x in rows if x.get('timestamp')]
        if not ts or (since and max(ts)[:10] < since):
            continue
        yield f, cwd, rows

def project_of(cwd, roots):
    return max((r for r in roots if under(cwd, [r])), key=len)

def frontmatter(path):
    try:
        txt = open(path, encoding='utf-8', errors='ignore').read()
    except Exception:
        return {}
    m = re.match(r'---\s*\n(.*?)\n---', txt, re.S)
    if not m:
        return {}
    out, key = {}, None
    for line in m.group(1).splitlines():
        km = re.match(r'^([A-Za-z_-]+):\s*(.*)$', line)
        if km:
            key = km.group(1); val = km.group(2).strip()
            out[key] = '' if val in ('>', '|', '>-', '|-') else val.strip('"\'')
        elif key and line.startswith((' ', '\t')):
            out[key] = (out[key] + ' ' + line.strip()).strip()
    return out

def mtime(p):
    import datetime
    try:
        return datetime.date.fromtimestamp(os.stat(os.path.realpath(p)).st_mtime).isoformat()
    except Exception:
        return None

def load_json(p):
    try:
        return json.load(open(os.path.expanduser(p)))
    except Exception:
        return {}

def installed_skills(roots):
    """Skills the user can currently invoke: user scope, project scope, and plugin skills."""
    items = []
    def add(sk_md, scope, source, prefix='', enabled=True, installed=None):
        fm = frontmatter(sk_md)
        folder = os.path.basename(os.path.dirname(sk_md))
        name = fm.get('name') or folder
        items.append({'name': name, 'invoke': (prefix + ':' + name) if prefix else name, 'scope': scope,
                      'source': source, 'path': os.path.dirname(sk_md),
                      'symlink_to': os.path.realpath(os.path.dirname(sk_md)) if os.path.islink(os.path.dirname(sk_md)) else None,
                      'enabled': enabled, 'installed_at': installed or mtime(sk_md), 'internal': str(fm.get('user-invocable', '')).lower() == 'false',
                      'description': (fm.get('description') or '')[:400]})
    for f in sorted(glob.glob(os.path.expanduser('~/.claude/skills/*/SKILL.md'))):
        add(f, 'user', '~/.claude/skills')
    for r in roots:
        for f in sorted(glob.glob(os.path.join(r, '.claude/skills/*/SKILL.md'))):
            add(f, 'project', r)
    enabled = {}
    for sp in ['~/.claude/settings.json'] + [os.path.join(r, '.claude', n) for r in roots for n in ('settings.json', 'settings.local.json')]:
        enabled.update(load_json(sp).get('enabledPlugins') or {})
    reg = load_json('~/.claude/plugins/installed_plugins.json').get('plugins') or {}
    for pid, installs in reg.items():
        if not installs:
            continue
        inst = installs[-1]; path = inst.get('installPath') or ''
        pname = pid.split('@')[0]
        for f in sorted(glob.glob(os.path.join(path, 'skills/*/SKILL.md'))):
            add(f, 'plugin', pid, prefix=pname, enabled=bool(enabled.get(pid, False)), installed=(inst.get('installedAt') or '')[:10] or None)
        for f in sorted(glob.glob(os.path.join(path, 'commands/*.md'))):
            fm = frontmatter(f); n = os.path.splitext(os.path.basename(f))[0]
            items.append({'name': n, 'invoke': pname + ':' + n, 'scope': 'plugin', 'source': pid, 'path': f,
                          'symlink_to': None, 'enabled': bool(enabled.get(pid, False)), 'kind': 'command',
                          'installed_at': (inst.get('installedAt') or '')[:10] or mtime(f),
                          'description': (fm.get('description') or '')[:400]})
    return items

def global_usage(names):
    """Count invocations of each skill across ALL Claude Code projects (raw text scan, no JSON parse)."""
    pat = re.compile(r'"skill":\s*"([^"]+)"|<command-name>/?([^<]+)</command-name>')
    tsp = re.compile(r'"timestamp":"([^"]+)"')
    cnt = collections.Counter(); last = {}; projs = collections.defaultdict(set)
    base = os.path.expanduser('~/.claude/projects')
    for f in glob.glob(os.path.join(base, '*', '*.jsonl')):
        proj = os.path.basename(os.path.dirname(f))
        try:
            fh = open(f, encoding='utf-8', errors='ignore')
        except Exception:
            continue
        seen = set()
        for line in fh:
            if '"skill"' not in line and '<command-name>' not in line:
                continue
            um = re.search(r'"uuid":"([^"]+)"', line)
            if um and um.group(1) in seen:
                continue
            if um:
                seen.add(um.group(1))
            for a, b in pat.findall(line):
                n = (a or b).strip()
                if n in names:
                    cnt[n] += 1; projs[n].add(proj)
                    t = tsp.search(line)
                    if t and t.group(1) > last.get(n, ''):
                        last[n] = t.group(1)
    return cnt, last, projs

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('paths', nargs='*')
    ap.add_argument('--out', required=True)
    ap.add_argument('--since')
    ap.add_argument('--no-global', action='store_true', help='skip scanning all projects for skill usage')
    a = ap.parse_args()
    roots = [os.path.abspath(os.path.expanduser(p)).rstrip('/') for p in (a.paths or [os.getcwd()])]
    os.makedirs(a.out, exist_ok=True)

    skill = collections.Counter(); skill_via = collections.defaultdict(collections.Counter)
    skill_sess = collections.defaultdict(set); skill_proj = collections.defaultdict(set)
    agents = collections.Counter(); tools = collections.Counter(); days = collections.Counter()
    sessions = []; msgs = []; automated = collections.Counter(); seen_u = set(); seen_t = set()

    for f, cwd, rows in claude_sessions(roots, a.since):
        proj = project_of(cwd, roots)
        entry = next((x.get('entrypoint') for x in rows if x.get('entrypoint')), '')
        if entry.startswith('sdk'):
            automated[proj] += 1
            continue
        sid = os.path.basename(f)[:8]
        ts = [x['timestamp'] for x in rows if x.get('timestamp')]
        s = {'id': sid, 'source': 'claude', 'project': proj, 'cwd': cwd, 'start': min(ts), 'end': max(ts),
             'title': next((x.get('aiTitle') for x in rows if x.get('aiTitle')), None),
             'n': 0, 'images': 0, 'interrupts': 0, 'commits': 0, 'skills': [], 'agents': []}
        for d in rows:
            if d.get('isSidechain'):
                continue
            if d.get('type') == 'user' and not d.get('isMeta'):
                if d.get('uuid') in seen_u:
                    continue
                seen_u.add(d.get('uuid'))
                texts, img = texts_of((d.get('message') or {}).get('content'))
                for tx in texts:
                    t = tx.strip()
                    m = re.search(r'<command-name>/?([^<]+)</command-name>', t)
                    if m:
                        name = m.group(1).strip()
                        args = re.search(r'<command-args>(.*?)</command-args>', t, re.S)
                        if name not in BUILTIN:
                            skill[name] += 1; skill_via[name]['user'] += 1
                            skill_sess[name].add(sid); skill_proj[name].add(proj); s['skills'].append(name)
                        msgs.append({'sid': sid, 'project': proj, 'ts': d.get('timestamp'), 'kind': 'command',
                                     'text': '/' + name + (' ' + args.group(1).strip() if args and args.group(1).strip() else '')})
                        continue
                    if t.startswith('[Request interrupted'):
                        s['interrupts'] += 1; continue
                    if not t or t.startswith(NOISE):
                        continue
                    s['n'] += 1; s['images'] += 1 if (img or '[Image #' in t) else 0
                    days[(d.get('timestamp') or '')[:10]] += 1
                    msgs.append({'sid': sid, 'project': proj, 'ts': d.get('timestamp'), 'kind': 'text', 'text': t,
                                 'image': bool(img or '[Image #' in t)})
            if d.get('type') == 'assistant':
                content = (d.get('message') or {}).get('content')
                if not isinstance(content, list):
                    continue
                for x in content:
                    if x.get('type') != 'tool_use' or x.get('id') in seen_t:
                        continue
                    seen_t.add(x.get('id')); name = x.get('name'); inp = x.get('input') or {}
                    tools[name] += 1
                    if name == 'Skill':
                        n = inp.get('skill', '?')
                        skill[n] += 1; skill_via[n]['model'] += 1
                        skill_sess[n].add(sid); skill_proj[n].add(proj); s['skills'].append(n)
                    elif name in ('Agent', 'Task'):
                        t = inp.get('subagent_type') or 'general-purpose'; agents[t] += 1; s['agents'].append(t)
                    elif name == 'Bash' and re.search(r'\bgit\s+commit\b', inp.get('command', '')):
                        s['commits'] += 1
        sessions.append(s)

    for f, cwd, rows in codex_sessions(roots, a.since):
        proj = project_of(cwd, roots)
        ts = [x['timestamp'] for x in rows if x.get('timestamp')]
        sid = 'codex-' + os.path.basename(f)[-13:-6]
        s = {'id': sid, 'source': 'codex', 'project': proj, 'cwd': cwd, 'start': min(ts), 'end': max(ts), 'title': None,
             'n': 0, 'images': 0, 'interrupts': 0, 'commits': 0, 'skills': [], 'agents': []}
        for d in rows:
            p = d.get('payload') or {}
            if d.get('type') == 'event_msg' and p.get('type') == 'user_message':
                t = (p.get('message') or '').strip()
                if not t:
                    continue
                s['n'] += 1; days[(d.get('timestamp') or '')[:10]] += 1
                msgs.append({'sid': sid, 'project': proj, 'ts': d.get('timestamp'), 'kind': 'text', 'text': t,
                             'image': bool(p.get('images'))})
            if d.get('type') == 'response_item' and p.get('type') in ('function_call', 'custom_tool_call'):
                args = p.get('arguments') or p.get('input') or ''
                if 'git commit' in str(args):
                    s['commits'] += 1
        sessions.append(s)

    sessions.sort(key=lambda x: x['start'])
    texts = [m['text'] for m in msgs if m['kind'] == 'text']
    lens = [len(t) for t in texts]
    summary = {
        'roots': roots, 'since': a.since,
        'counts': {'human_sessions': sum(1 for s in sessions if s['source'] == 'claude'),
                   'codex_sessions': sum(1 for s in sessions if s['source'] == 'codex'),
                   'automated_sessions': dict(automated), 'messages': len(texts),
                   'median_len': statistics.median(lens) if lens else 0,
                   'short_le_30': sum(1 for l in lens if l <= 30),
                   'with_image': sum(1 for m in msgs if m.get('image')),
                   'interrupts': sum(s['interrupts'] for s in sessions),
                   'commits': sum(s['commits'] for s in sessions)},
        'skills': [{'name': k, 'total': v, 'user': skill_via[k]['user'], 'model': skill_via[k]['model'],
                    'sessions': len(skill_sess[k]), 'projects': sorted(skill_proj[k])} for k, v in skill.most_common()],
        'agents': agents.most_common(), 'tools': tools.most_common(30), 'days': sorted(days.items()),
        'sessions': [{k: v for k, v in s.items() if k not in ('skills', 'agents')} |
                     {'skills': collections.Counter(s['skills']).most_common(),
                      'agents': collections.Counter(s['agents']).most_common()} for s in sessions],
    }

    inv = installed_skills(roots)
    local = {k: v for k, v in skill.items()}
    names = {i['invoke'] for i in inv} | {i['name'] for i in inv}
    g_cnt, g_last, g_proj = ({}, {}, {}) if a.no_global else global_usage(names)
    for i in inv:
        keys = {i['invoke'], i['name']}
        i['uses_here'] = sum(local.get(k, 0) for k in keys)
        if not a.no_global:
            i['uses_global'] = sum(g_cnt.get(k, 0) for k in keys)
            i['last_used_global'] = max((g_last.get(k, '') for k in keys), default='') or None
            i['projects_global'] = len(set().union(*(g_proj.get(k, set()) for k in keys)))
    inv.sort(key=lambda x: (x['uses_here'], x.get('uses_global', 0), x['invoke']))
    summary['installed_skills'] = inv
    summary['unused_here'] = [i['invoke'] for i in inv if i['uses_here'] == 0 and i['enabled'] and not i.get('internal')]
    json.dump(summary, open(os.path.join(a.out, 'summary.json'), 'w'), ensure_ascii=False, indent=1)
    json.dump(msgs, open(os.path.join(a.out, 'messages.json'), 'w'), ensure_ascii=False)
    with open(os.path.join(a.out, 'messages.txt'), 'w') as w:
        by = collections.defaultdict(list)
        for m in msgs:
            by[m['sid']].append(m)
        for s in sessions:
            w.write(f"\n===== {s['id']} [{s['source']}] {os.path.basename(s['project'])} {s['start'][:16]} → {s['end'][:10]} | {s['title']} | msgs {s['n']} commits {s['commits']}\n")
            for i, m in enumerate(by[s['id']]):
                t = m['text'].replace('\n', ' ⏎ ')
                w.write(f"[{i}] {t[:400] + ' …(' + str(len(t)) + ')' if len(t) > 400 else t}\n")
    c = summary['counts']
    print(f"roots={roots}\nhuman={c['human_sessions']} codex={c['codex_sessions']} automated={c['automated_sessions']} messages={c['messages']}")
    print('top skills:', [(s['name'], s['total']) for s in summary['skills'][:10]])
    print(f"installed skills={len(summary['installed_skills'])} unused here={len(summary['unused_here'])}")
    print('out:', a.out)

if __name__ == '__main__':
    main()
