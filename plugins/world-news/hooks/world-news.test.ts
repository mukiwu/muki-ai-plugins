import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import {
  CATEGORIES,
  afterCheck,
  byPreference,
  claim,
  feedUrl,
  initialState,
  isDue,
  parseArgs,
  parseFeed,
  pickNews,
  statusLine,
} from './policy'

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const NOW = Date.parse('2026-10-07T01:00:00Z')
const START = { cwd: '/', surface: 'terminal', isInteractive: true } as const
const run = ($: Engine, args: string) =>
  $.command.run({
    command: 'world-news',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 100 },
  })
// 扮演引擎底層：開 session、登記指令、狀態列
const engine = (on: On) => {
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('ui.status', () => ({ value: undefined }))
}

const item = (title: string, source: string, link: string, hoursAgo = 1) => `<item>
  <title>${title} - ${source}</title>
  <link>${link}</link>
  <pubDate>${new Date(NOW - hoursAgo * HOUR).toUTCString()}</pubDate>
  <source url="https://example.com">${source}</source>
</item>`
const feed = (...items: string[]) => `<?xml version="1.0"?><rss><channel>${items.join('')}</channel></rss>`

describe('指令參數', () => {
  test('一串數字選分類，重複的只算一次', () => {
    expect(parseArgs('4211')).toEqual({ kind: 'categories', ids: ['1', '2', '4'] })
  })

  test('數字和地區字母可以混著選，照選單順序排', () => {
    expect(parseArgs('ca41')).toEqual({ kind: 'categories', ids: ['1', '4', 'a', 'c'] })
    expect(parseArgs('1 A, c')).toEqual({ kind: 'categories', ids: ['1', 'a', 'c'] })
  })

  test('open 打開側邊欄，close 收起', () => {
    expect(parseArgs('open')).toEqual({ kind: 'open' })
    expect(parseArgs('o')).toEqual({ kind: 'open' })
    expect(parseArgs('close')).toEqual({ kind: 'close' })
  })

  test('沒有的分類會被擋下', () => {
    expect(parseArgs('19').kind).toBe('error')
    expect(parseArgs('1z')).toEqual({ kind: 'error', message: '看不懂「1z」' })
  })

  test('cd 改冷卻時間，太短不准', () => {
    expect(parseArgs('cd 15')).toEqual({ kind: 'cooldown', minutes: 15 })
    expect(parseArgs('cd 2').kind).toBe('error')
  })
})

describe('Google 新聞', () => {
  test('每個分類都抓台灣版的正體中文 feed，沒有版面的用一天內的搜尋', () => {
    for (const category of CATEGORIES) expect(feedUrl(category)).toContain('hl=zh-TW&gl=TW&ceid=TW:zh-Hant')
    expect(feedUrl(CATEGORIES[0])).toContain('/topic/WORLD?')
    const military = CATEGORIES.find((c) => c.label === '軍事')
    expect(decodeURIComponent(feedUrl(military ?? CATEGORIES[0]))).toContain('when:1d')
  })

  test('拿掉標題尾巴的媒體名稱，解開 XML 跳脫字元', () => {
    const [parsed] = parseFeed(feed(item('台積電 &amp; 輝達合作 &#33;', 'UDN', 'https://news.google.com/a')))
    expect(parsed.title).toBe('台積電 & 輝達合作 !')
    expect(parsed.source).toBe('UDN')
    expect(parsed.url).toBe('https://news.google.com/a')
  })

  test('標題裡的控制字元和方向覆寫字元不會印到終端機', () => {
    const [parsed] = parseFeed(feed(item('紅&#27;[2J字&#x9b;31m&#8238;反', 'UDN&#7;', 'https://g/esc')))
    expect(parsed.title).toBe('紅 [2J字 31m 反')
    expect(parsed.source).toBe('UDN')
  })

  test('照 Google 的順序，只留一天內、連結和標題都沒看過的', () => {
    const items = parseFeed(
      feed(
        item('頭條', 'UDN', 'https://g/1'),
        item('舊聞', 'UDN', 'https://g/2', 30),
        item('看過的連結', 'UDN', 'https://g/seen'),
        item('看過的 標題', '三立', 'https://g/new-link'),
        item('第二則', '鉅亨網', 'https://g/3'),
      ),
    )
    const picked = pickNews(items, '1', new Set(['https://g/seen', '看過的標題']), NOW)
    expect(picked.map((h) => h.title)).toEqual(['頭條', '第二則'])
    expect(picked.map((h) => h.rank)).toEqual([0, 4])
  })

  test('萬一來源是簡體，標題轉成正體', () => {
    const [h] = pickNews(parseFeed(feed(item('沙特与胡塞局势升级', '某站', 'https://g/cn'))), '1', new Set(), NOW)
    expect(h.title).toBe('沙特與胡塞局勢升級')
  })

  test('搜尋混進來的社群貼文不算新聞', () => {
    const items = parseFeed(feed(item('川普造勢狂言', 'Facebook', 'https://g/fb'), item('川普造勢', '中央社', 'https://g/cna')))
    expect(pickNews(items, 'a', new Set(), NOW).map((h) => h.source)).toEqual(['中央社'])
  })

  test('地區分類用一天內的搜尋', () => {
    const japan = CATEGORIES.find((c) => c.id === 'c')
    expect(japan?.label).toBe('日韓')
    expect(decodeURIComponent(feedUrl(japan ?? CATEGORIES[0]))).toContain('北韓 when:1d')
  })

  test('跨分類先看 Google 的排名，同名次照分類順序', () => {
    const base = { title: '', url: '', source: '', publishedAt: 0, foundAt: 0 }
    const list = [
      { ...base, category: 'a', rank: 0 },
      { ...base, category: '1', rank: 1 },
      { ...base, category: '1', rank: 0 },
    ].sort(byPreference)
    expect(list.map((h) => [h.category, h.rank])).toEqual([
      ['1', 0],
      ['a', 0],
      ['1', 1],
    ])
  })
})

describe('冷卻與狀態列', () => {
  test('冷卻時間過了才查，關掉就不查', () => {
    const state = { ...initialState(), lastCheck: 0, cooldownMin: 30 }
    expect(isDue(state, 29 * MINUTE)).toBe(false)
    expect(isDue(state, 30 * MINUTE)).toBe(true)
    expect(isDue({ ...state, enabled: false }, 60 * MINUTE)).toBe(false)
  })

  test('顯示這個 session 的那則，之後沒查到新的也繼續顯示，看過的不會再出現', () => {
    const items = parseFeed(feed(item('央行升息半碼', '中央社', 'https://g/1')))
    const state = afterCheck(initialState(), pickNews(items, '3', new Set(), NOW), NOW)
    const { headline } = claim(state)
    expect(statusLine(state, headline)).toBe('[財經] 央行升息半碼（中央社）')
    expect(pickNews(items, '3', new Set(state.seen), NOW)).toEqual([])
    expect(statusLine(afterCheck(state, [], NOW + MINUTE), headline)).toBe('[財經] 央行升息半碼（中央社）')
  })

  test('還沒查過、查過但沒有任何新聞，各自有提示', () => {
    expect(statusLine(initialState(), undefined)).toContain('等你送出第一則訊息')
    expect(statusLine(afterCheck(initialState(), [], NOW), undefined)).toContain('還沒有新聞')
  })
})

describe('每個 session 不同則', () => {
  const three = parseFeed(feed(item('甲', 'A', 'https://g/a'), item('乙', 'B', 'https://g/b'), item('丙', 'C', 'https://g/c')))

  test('依序開的 session 各拿到不同的一則，用完再從頭輪', () => {
    let state = afterCheck(initialState(), pickNews(three, '1', new Set(), NOW), NOW)
    const titles: string[] = []
    for (let i = 0; i < 4; i++) {
      const claimed = claim(state)
      state = claimed.state
      titles.push(claimed.headline?.title ?? '')
    }
    expect(titles).toEqual(['甲', '乙', '丙', '甲'])
  })

  test('查到新的就從最新那則重新發', () => {
    let state = afterCheck(initialState(), pickNews(three, '1', new Set(), NOW), NOW)
    state = claim(claim(state).state).state
    const fresh = pickNews(parseFeed(feed(item('丁', 'D', 'https://g/d'))), '1', new Set(state.seen), NOW)
    expect(claim(afterCheck(state, fresh, NOW + MINUTE)).headline?.title).toBe('丁')
  })

  test('沒有新聞時誰都拿不到', () => {
    expect(claim(initialState()).headline).toBeUndefined()
  })
})

describe('/world-news 指令', () => {
  test('舊版存的數字分類照樣認得', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { state: { categories: [1, 4] } })
    engine(on)
    await $.session.start(START)

    const out = await run($, '')
    expect(out.text).toContain('● 1 國際')
    expect(out.text).toContain('● 4 台灣')
  })

  test('選的分類和冷卻時間跨 session 保留', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, {})
    engine(on)
    await $.session.start(START)

    await run($, '48a')
    await run($, 'cd 15')
    const out = await run($, '')
    expect(out.text).toContain('● 4 台灣')
    expect(out.text).toContain('● 8 體育')
    expect(out.text).toContain('○ 1 國際')
    expect(out.text).toContain('● a 美國')
    expect(out.text).toContain('○ g 東南亞')
    expect(out.text).toContain('冷卻 15 分鐘')
  })

  test('看不懂的參數會附上用法', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, {})
    engine(on)
    await $.session.start(START)

    const out = await run($, 'hello')
    expect(out.text).toContain('看不懂')
    expect(out.text).toContain('用法')
  })
})
