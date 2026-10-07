"""Builds hooks/zh-data.ts, the Simplified to Traditional (Taiwan) tables.

Downloads OpenCC's STCharacters, STPhrases and TWVariants, applies the
Taiwan variants, keeps 台 as is, and keeps only the phrases whose
conversion differs from converting character by character.

    python3 scripts/build-zh.py
"""

import json
import pathlib
import urllib.request

BASE = 'https://raw.githubusercontent.com/BYVoid/OpenCC/master/data/dictionary/'
OUT = pathlib.Path(__file__).resolve().parent.parent / 'hooks' / 'zh-data.ts'
KEEP = {'台'}


def load(name):
    table = {}
    with urllib.request.urlopen(BASE + name) as response:
        for line in response.read().decode('utf-8').splitlines():
            if line.startswith('#') or '\t' not in line:
                continue
            key, values = line.split('\t')
            table[key] = values.split(' ')[0]
    return table


chars, phrases, variants = load('STCharacters.txt'), load('STPhrases.txt'), load('TWVariants.txt')


def variant(text):
    return ''.join(variants.get(c, c) for c in text)


def one(c):
    return c if c in KEEP else variant(chars.get(c, c))


# CHAR_PAIRS is read two UTF-16 units at a time, so only BMP characters fit.
bmp = lambda c: len(c) == 1 and ord(c) < 0x10000
char_map = {k: one(k) for k in set(chars) | set(variants) if bmp(k) and bmp(one(k)) and one(k) != k}
by_char = lambda text: ''.join(char_map.get(c, c) for c in text)
phrase_map = {k: variant(v) for k, v in phrases.items() if variant(v) != by_char(k)}

pairs = ''.join(f'{k}{v}' for k, v in sorted(char_map.items()))
joined = '|'.join(f'{k}={v}' for k, v in sorted(phrase_map.items()))
OUT.write_text(
    f"""// Generated from OpenCC (https://github.com/BYVoid/OpenCC), Apache-2.0:
// STCharacters + STPhrases with TWVariants applied, 台 kept as is.
// Only phrases whose conversion differs from character-by-character are kept.
// Regenerate with scripts/build-zh.py; do not edit by hand.

/** Simplified and Traditional characters, in pairs. */
export const CHAR_PAIRS = {json.dumps(pairs, ensure_ascii=False)}

/** `simplified=traditional` phrases, joined by `|`. */
export const PHRASES = {json.dumps(joined, ensure_ascii=False)}
""",
    encoding='utf-8',
)
print(f'{len(char_map)} characters, {len(phrase_map)} phrases -> {OUT}')
