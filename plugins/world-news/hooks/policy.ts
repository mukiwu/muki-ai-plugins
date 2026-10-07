/**
 * world-news: the pure pieces (categories, settings, argument parsing,
 * Google News RSS parsing, picking and formatting), kept apart from the
 * hooks so they can be tested without the engine.
 */
import { asTraditional } from './zh.ts'

/**
 * A category is one Google News feed of the Taiwan edition: a section
 * (`topic`, ranked by Google) or, where Google has no section, a search
 * limited to the last day.
 */
export type Category = { id: string; label: string } & ({ topic: string } | { search: string })

/** Main sections by digit, international regions by letter, so `/world-news 14ace` mixes both. */
export const CATEGORIES: readonly Category[] = [
  { id: '1', label: '國際', topic: 'WORLD' },
  { id: '2', label: '科技', topic: 'TECHNOLOGY' },
  { id: '3', label: '財經', topic: 'BUSINESS' },
  { id: '4', label: '台灣', topic: 'NATION' },
  { id: '5', label: '軍事', search: '軍事 OR 國防 OR 共軍 OR 戰爭' },
  { id: '6', label: '科學', topic: 'SCIENCE' },
  { id: '7', label: '健康', topic: 'HEALTH' },
  { id: '8', label: '體育', topic: 'SPORTS' },
  { id: 'a', label: '美國', search: '美國 OR 川普 OR 白宮' },
  { id: 'b', label: '中國', search: '中國 OR 北京 OR 習近平' },
  { id: 'c', label: '日韓', search: '日本 OR 南韓 OR 北韓' },
  { id: 'd', label: '歐洲', search: '歐洲 OR 歐盟 OR 英國 OR 法國 OR 德國' },
  { id: 'e', label: '俄烏', search: '俄羅斯 OR 烏克蘭' },
  { id: 'f', label: '中東', search: '中東 OR 以色列 OR 伊朗 OR 加薩' },
  { id: 'g', label: '東南亞', search: '東南亞 OR 越南 OR 菲律賓 OR 印尼 OR 泰國' },
]

const ORDER = new Map(CATEGORIES.map((c, index) => [c.id, index]))

const EDITION = 'hl=zh-TW&gl=TW&ceid=TW:zh-Hant'

/** The RSS feed of a category in the Taiwan edition of Google News. */
export const feedUrl = (category: Category): string =>
  'topic' in category
    ? `https://news.google.com/rss/headlines/section/topic/${category.topic}?${EDITION}`
    : `https://news.google.com/rss/search?q=${encodeURIComponent(`${category.search} when:1d`)}&${EDITION}`

export const DEFAULT_COOLDOWN_MIN = 30
/** Seen links and titles kept so the same story is not announced twice. */
const SEEN_LIMIT = 500
/** Headlines kept for /world-news. */
const LATEST_LIMIT = 15
/** A story older than this is not news any more. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000
/** New headlines taken from each category per check. */
export const PER_CATEGORY = 3

export type Headline = {
  category: string
  title: string
  url: string
  source: string
  /** Position in Google's ranking of its feed, from 0. */
  rank: number
  publishedAt: number
  foundAt: number
}

/** Google's ranking first, then the order the categories are listed in. */
export const byPreference = (a: Headline, b: Headline): number =>
  a.rank - b.rank || (ORDER.get(a.category) ?? 99) - (ORDER.get(b.category) ?? 99)

export type State = {
  enabled: boolean
  categories: string[]
  cooldownMin: number
  lastCheck: number
  seen: string[]
  latest: Headline[]
  /** Which of `latest` the next session to ask gets, so open sessions show different headlines. */
  cursor: number
}

export const initialState = (): State => ({
  enabled: true,
  categories: ['1', '2', '3'],
  cooldownMin: DEFAULT_COOLDOWN_MIN,
  lastCheck: 0,
  seen: [],
  latest: [],
  cursor: 0,
})

const isHeadline = (h: unknown): h is Headline => {
  const x = h as Partial<Headline>
  return !!x && typeof x.title === 'string' && typeof x.url === 'string' && typeof x.source === 'string'
}

/** Whatever the store held, made into a valid State. */
export const readState = (raw: unknown): State => {
  const base = initialState()
  if (!raw || typeof raw !== 'object') return base
  const r = raw as Partial<State>
  return {
    enabled: typeof r.enabled === 'boolean' ? r.enabled : base.enabled,
    // An older version saved numbers.
    categories: Array.isArray(r.categories) ? r.categories.map(String).filter((id) => ORDER.has(id)) : base.categories,
    cooldownMin:
      typeof r.cooldownMin === 'number' && r.cooldownMin >= 1 ? Math.round(r.cooldownMin) : base.cooldownMin,
    lastCheck: typeof r.lastCheck === 'number' ? r.lastCheck : 0,
    seen: Array.isArray(r.seen) ? r.seen.filter((u) => typeof u === 'string') : [],
    // Headlines saved by an older version (no source) are dropped.
    latest: Array.isArray(r.latest)
      ? r.latest.filter(isHeadline).map((h) => ({ ...h, category: String(h.category) }))
      : [],
    cursor: typeof r.cursor === 'number' && r.cursor >= 0 ? Math.floor(r.cursor) : 0,
  }
}

export const isDue = (state: State, now: number): boolean =>
  state.enabled && state.categories.length > 0 && now - state.lastCheck >= state.cooldownMin * 60_000

export type Command =
  | { kind: 'show' }
  | { kind: 'categories'; ids: string[] }
  | { kind: 'cooldown'; minutes: number }
  | { kind: 'refresh' }
  | { kind: 'open' }
  | { kind: 'close' }
  | { kind: 'on' }
  | { kind: 'off' }
  | { kind: 'error'; message: string }

/** `/world-news` arguments: `14ace`, `cd 15`, `now`, `on`, `off`, or nothing. */
export const parseArgs = (args: string): Command => {
  const text = args.trim().toLowerCase()
  if (!text || text === 'list') return { kind: 'show' }
  if (text === 'now' || text === 'refresh') return { kind: 'refresh' }
  if (text === 'open' || text === 'o') return { kind: 'open' }
  if (text === 'close') return { kind: 'close' }
  if (text === 'on') return { kind: 'on' }
  if (text === 'off') return { kind: 'off' }
  const cooldown = /^(?:cd|cooldown)\s+(\d+)$/.exec(text)
  if (cooldown) {
    const minutes = Number(cooldown[1])
    if (minutes < 5) return { kind: 'error', message: '冷卻時間最少 5 分鐘' }
    return { kind: 'cooldown', minutes }
  }
  if (/^[\da-z\s,]+$/.test(text)) {
    const keys = text.replace(/[\s,]/g, '').split('')
    const bad = keys.filter((k) => !ORDER.has(k))
    // A stray letter means a word was typed, not a pick: 'help' is not h, e, l, p.
    if (bad.some((k) => /[a-z]/.test(k))) return { kind: 'error', message: `看不懂「${args.trim()}」` }
    if (bad.length) return { kind: 'error', message: `沒有這個分類：${[...new Set(bad)].join('、')}` }
    const ids = [...new Set(keys)].sort((a, b) => (ORDER.get(a) ?? 0) - (ORDER.get(b) ?? 0))
    return { kind: 'categories', ids }
  }
  return { kind: 'error', message: `看不懂「${args.trim()}」` }
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

export const decodeXml = (text: string): string =>
  text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
      if (name[0] !== '#') return ENTITIES[name.toLowerCase()] ?? whole
      const code = name[1] === 'x' || name[1] === 'X' ? Number.parseInt(name.slice(2), 16) : Number(name.slice(1))
      return Number.isFinite(code) ? String.fromCodePoint(code) : whole
    })

export type FeedItem = { title: string; url: string; source: string; publishedAt: number }

/**
 * Feed text is printed to the terminal, so control characters (an escape
 * decoded from `&#27;` could start a terminal sequence) and bidi overrides
 * are replaced with spaces.
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching them is the point
const UNSAFE = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/g
export const sanitize = (text: string): string => text.replace(UNSAFE, ' ').replace(/\s+/g, ' ').trim()

const tag = (item: string, name: string): string =>
  sanitize(decodeXml(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(item)?.[1] ?? ''))

/** The items of a Google News RSS feed, in Google's order. */
export const parseFeed = (xml: string): FeedItem[] =>
  [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, item]) => {
    const source = tag(item, 'source')
    const raw = tag(item, 'title')
    // Google appends " - <source>" to every title.
    const title = source && raw.endsWith(` - ${source}`) ? raw.slice(0, -(source.length + 3)) : raw
    return { title, url: tag(item, 'link'), source, publishedAt: Date.parse(tag(item, 'pubDate')) }
  })

/** A headline's key in `seen`: the same story often comes back under a new link. */
export const seenKey = (title: string): string => title.replace(/\s+/g, '')

/**
 * The news in a category's feed: published within a day, not seen before (by
 * link or title), in Google's order, titles in Traditional Chinese.
 */
/** Posts that Google's search sometimes mixes in; not news reporting. */
const NOT_NEWS = new Set(['Facebook', 'Instagram', 'Threads', 'X', 'YouTube', 'TikTok'])

export const pickNews = (
  items: FeedItem[],
  category: string,
  seen: ReadonlySet<string>,
  now: number,
): Headline[] =>
  items
    .map((item, rank) => ({ item, rank }))
    .filter(({ item }) => item.title && item.url && Number.isFinite(item.publishedAt))
    .filter(({ item }) => !NOT_NEWS.has(item.source))
    .filter(({ item }) => now - item.publishedAt <= MAX_AGE_MS)
    .filter(({ item }) => !seen.has(item.url) && !seen.has(seenKey(item.title)))
    .map(({ item, rank }) => ({
      category,
      title: asTraditional(item.title).slice(0, 80),
      url: item.url,
      source: item.source,
      rank,
      publishedAt: item.publishedAt,
      foundAt: now,
    }))

/** State after a check: new headlines first, their links and titles remembered, both capped. */
export const afterCheck = (state: State, fresh: Headline[], now: number): State => ({
  ...state,
  lastCheck: now,
  seen: [...fresh.flatMap((h) => [h.url, seenKey(h.title)]), ...state.seen].slice(0, SEEN_LIMIT),
  latest: [...fresh, ...state.latest].slice(0, LATEST_LIMIT),
  // New headlines come first, so hand them out from the top again.
  cursor: fresh.length ? 0 : state.cursor,
})

/**
 * Takes the next headline for one session and moves the shared cursor on,
 * so each session that asks gets a different one until they run out.
 */
export const claim = (state: State): { state: State; headline: Headline | undefined } => {
  if (state.latest.length === 0) return { state, headline: undefined }
  const index = state.cursor % state.latest.length
  return { state: { ...state, cursor: index + 1 }, headline: state.latest[index] }
}

export const labelOf = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? '?'

/** `YYYY-MM-DD HH:mm` in local time. */
export const dateTime = (ms: number): string => {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const clock = (ms: number): string => {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/**
 * The pinned line under the prompt: this session's headline (from `claim`),
 * so a reload or a quiet check never hides news that is already in.
 */
export const statusLine = (state: State, shown: Headline | undefined): string | undefined => {
  if (!state.enabled || state.categories.length === 0) return undefined
  if (!shown) return state.lastCheck ? `還沒有新聞 · ${clock(state.lastCheck)} 查過` : '等你送出第一則訊息後開始追新聞'
  return `[${labelOf(shown.category)}] ${shown.title}（${shown.source}）`
}

export const describeSettings = (state: State): string => {
  const picked = new Set(state.categories)
  const menu = (from: string, to: string) =>
    CATEGORIES.filter((c) => c.id >= from && c.id <= to)
      .map((c) => `${picked.has(c.id) ? '●' : '○'} ${c.id} ${c.label}`)
      .join('  ')
  return [
    `狀態：${state.enabled ? '開啟' : '關閉'} · 冷卻 ${state.cooldownMin} 分鐘 · 上次查 ${state.lastCheck ? clock(state.lastCheck) : '還沒查過'}`,
    `分類：${menu('1', '9')}`,
    `國際地區：${menu('a', 'z')}`,
    '用法：/world-news open 打開可點的新聞列表 · 14ace 選分類 · cd 15 改冷卻 · now 立刻查 · off 關閉',
  ].join('\n')
}

export const describeLatest = (state: State): string => {
  if (state.latest.length === 0) return '目前沒有收到新聞'
  return state.latest
    .map((h, i) => `${i + 1}. [${labelOf(h.category)}] ${h.title}（${h.source}・${clock(h.publishedAt)}）\n   ${h.url}`)
    .join('\n')
}
