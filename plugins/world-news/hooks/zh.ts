/**
 * Simplified Chinese to Traditional (Taiwan), from OpenCC's tables: the
 * longest matching phrase wins, then character by character.
 *
 * Only text that reads as Simplified is converted. A character like 干 is
 * both a Simplified character and an ordinary Traditional one (若干), so
 * converting Traditional text would break it.
 */
import { CHAR_PAIRS, PHRASES } from './zh-data.ts'

const chars = new Map<string, string>()
for (let i = 0; i + 1 < CHAR_PAIRS.length; i += 2) chars.set(CHAR_PAIRS[i], CHAR_PAIRS[i + 1])

const phrases = new Map<string, string>()
let longest = 1
for (const entry of PHRASES.split('|')) {
  const at = entry.indexOf('=')
  if (at <= 0) continue
  const key = entry.slice(0, at)
  phrases.set(key, entry.slice(at + 1))
  longest = Math.max(longest, key.length)
}

/** Characters that exist only in Simplified, e.g. 与 势 级 馆. */
const SIMPLIFIED_ONLY = new Set([...chars.keys()].filter((c) => !chars.has(chars.get(c) as string)))

/** Two or more Simplified-only characters: the text is Simplified. */
export const isSimplified = (text: string): boolean => {
  let count = 0
  for (const c of text) if (SIMPLIFIED_ONLY.has(c) && ++count >= 2) return true
  return false
}

export const toTraditional = (text: string): string => {
  let out = ''
  let i = 0
  while (i < text.length) {
    let matched = false
    for (let length = Math.min(longest, text.length - i); length >= 2; length--) {
      const phrase = phrases.get(text.slice(i, i + length))
      if (phrase !== undefined) {
        out += phrase
        i += length
        matched = true
        break
      }
    }
    if (matched) continue
    out += chars.get(text[i]) ?? text[i]
    i++
  }
  return out
}

/** Traditional text as is; Simplified text converted. */
export const asTraditional = (text: string): string => (isSimplified(text) ? toTraditional(text) : text)
