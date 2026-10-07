/**
 * world-news — Claude Mod
 *
 * Each time you send a message, checks whether the cooldown (30 minutes by
 * default) has passed and, if so, reads the Taiwan edition of Google News
 * (one RSS feed per chosen category) in the background. The newest unseen
 * headline is pinned under the prompt with `$.ui.status`; the prompt itself
 * goes on untouched and never waits for the feeds, and nothing is added to
 * what the model reads.
 *
 * /world-news shows the settings and the latest headlines; `/world-news 14ace`
 * picks categories, `cd 15` sets the cooldown, `now` checks at once, `on` /
 * `off` toggle. Settings, seen links and headlines live in `$.store`, so they
 * carry across sessions.
 *
 * The engine requires every function that takes `$` to be declared at the
 * top of this file, which is why the helpers below are not closures.
 *
 * Needs CLAUDE_CODE_ENABLE_FUNCTION_HOOKS=1.
 */
import type { EngineInterface, Register } from 'claude-code'
import {
  CATEGORIES,
  PER_CATEGORY,
  afterCheck,
  claim,
  clock,
  dateTime,
  labelOf,
  byPreference,
  describeLatest,
  describeSettings,
  feedUrl,
  isDue,
  parseFeed,
  parseArgs,
  pickNews,
  readState,
  seenKey,
  statusLine,
} from './policy.ts'
import type { Headline, State } from './policy.ts'

const COMMAND = 'world-news'
const PANE = 'world-news'
const STORE_KEY = 'state'
const REQUEST_TIMEOUT_MS = 15_000
const MAX_REDIRECTS = 3

/** The check in flight, so a second message does not start another. */
let running: Promise<number> | null = null
/** This session's headline, and the check it came from: each session shows its own. */
let shown: Headline | undefined
let shownCheck = -1

async function load($: EngineInterface): Promise<State> {
  return readState(await $.store.get(STORE_KEY))
}

async function save($: EngineInterface, state: State): Promise<void> {
  await $.store.set(STORE_KEY, state)
}

/** Takes this session's next headline from the shared cursor and pins it. */
async function showNext($: EngineInterface, state: State): Promise<void> {
  const claimed = claim(state)
  await save($, claimed.state)
  shown = claimed.headline
  shownCheck = state.lastCheck
  $.ui.status(statusLine(claimed.state, shown))
}

/** One feed's XML, following Google's redirects, or null on error, timeout or a non-2xx. */
async function fetchFeed($: EngineInterface, url: string): Promise<string | null> {
  try {
    let target = url
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const response = await Promise.race([
        $.http.fetch(target, { headers: { Accept: 'application/rss+xml' } }),
        $.clock.sleep(REQUEST_TIMEOUT_MS).then(() => null),
      ])
      if (!response) break
      if (response.ok) return response.text
      const location = response.headers.location
      if (response.status >= 300 && response.status < 400 && location) {
        target = location.startsWith('http') ? location : `https://news.google.com${location}`
        continue
      }
      $.ui.log(`[world-news] Google News responded ${response.status} for ${target}`, { to: 'debug' })
      return null
    }
    $.ui.log(`[world-news] Google News timed out for ${url}`, { to: 'debug' })
  } catch (error) {
    $.ui.log(`[world-news] Google News failed for ${url}: ${String(error)}`, { to: 'debug' })
  }
  return null
}

async function runCheck($: EngineInterface): Promise<number> {
  const state = await load($)
  const seen = new Set(state.seen)
  const fresh: Headline[] = []
  let answered = 0
  for (const [index, id] of state.categories.entries()) {
    const category = CATEGORIES.find((c) => c.id === id)
    if (!category) continue
    if (index > 0) await $.clock.sleep(300)
    const xml = await fetchFeed($, feedUrl(category))
    if (xml === null) continue
    answered++
    const now = await $.clock.now()
    for (const headline of pickNews(parseFeed(xml), id, seen, now).slice(0, PER_CATEGORY)) {
      seen.add(headline.url)
      seen.add(seenKey(headline.title))
      fresh.push(headline)
    }
  }
  // Every search failed: keep lastCheck so the next message tries again.
  if (answered === 0) {
    $.ui.status('🌐 Google 新聞暫時連不上，下則訊息再試')
    return 0
  }
  fresh.sort(byPreference)
  const next = afterCheck(await load($), fresh, await $.clock.now())
  await showNext($, next)
  $.ui.invalidate('ui.render')
  return fresh.length
}

/** One check across the chosen categories; resolves to how many headlines were new. */
function check($: EngineInterface): Promise<number> {
  if (!running) running = runCheck($).finally(() => (running = null))
  return running
}

/** Opens the pane and says where it ended up, from the engine's own record of it. */
async function openPane($: EngineInterface): Promise<string> {
  await $.ui.open({ id: PANE, title: '新聞大事', columns: 48, focus: true })
  const pane = (await $.ui.panes()).find((p) => p.id === PANE)
  if (!pane) return '這個介面打不開側邊欄'
  if (!pane.isPlaced) return '側邊欄已開，但終端機太窄放不下，把視窗拉寬一點就會出現'
  return '已打開新聞側邊欄，點標題就會開啟那篇新聞'
}

/** A link target the engine accepts, or null: https and printable ASCII only. */
function safeHref(url: string): string | null {
  try {
    const href = new URL(url).href
    return href.startsWith('https://') && /^[\x21-\x7e]+$/.test(href) && href.length <= 2048 ? href : null
  } catch {
    return null
  }
}

async function onStart($: EngineInterface): Promise<void> {
  await $.command.register({
    name: COMMAND,
    description: '全球新聞大事：選分類、改冷卻時間、看最新標題',
    argumentHint: '[分類如 14ace | cd 分鐘 | now | on | off]',
    immediate: true,
  })
  await showNext($, await load($))
}

async function onSubmit($: EngineInterface): Promise<void> {
  const state = await load($)
  // Another session found news since this one last looked: take a new headline too.
  if (state.lastCheck !== shownCheck) await showNext($, state)
  // Started, not awaited: the prompt goes on while the feeds load.
  if (isDue(state, await $.clock.now())) $.clock.after(0, () => void check($))
}

async function onCommand($: EngineInterface, args: string): Promise<{ text: string }> {
  const command = parseArgs(args)
  let state = await load($)
  switch (command.kind) {
    case 'error':
      return { text: `${command.message}\n\n${describeSettings(state)}` }
    case 'show':
      return { text: `${describeSettings(state)}\n\n最新標題：\n${describeLatest(state)}` }
    case 'open':
      return { text: await openPane($) }
    case 'close':
      await $.ui.close({ id: PANE })
      return { text: '已收起新聞側邊欄' }
    case 'refresh': {
      if (state.categories.length === 0) return { text: `還沒選分類\n\n${describeSettings(state)}` }
      const count = await check($)
      state = await load($)
      return { text: `${count ? `${count} 則新的` : '沒有新的大事'}\n\n${describeLatest(state)}` }
    }
    case 'categories':
      state = { ...state, categories: command.ids, enabled: true, lastCheck: 0 }
      break
    case 'cooldown':
      state = { ...state, cooldownMin: command.minutes }
      break
    case 'on':
      state = { ...state, enabled: true }
      break
    case 'off':
      state = { ...state, enabled: false }
      break
  }
  await save($, state)
  $.ui.status(statusLine(state, shown))
  const note = command.kind === 'categories' ? '\n下一則訊息送出時會用新分類查一次' : ''
  return { text: `已更新${note}\n\n${describeSettings(state)}` }
}

export const register: Register = (on) => {
  on('session.start', async ($, e, next) => {
    await onStart($)
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    // A failure here must never hold up the prompt.
    if (!e.origin || e.origin.kind === 'composer') await onSubmit($).catch(() => undefined)
    return next(e)
  })

  on('command.run', { command: COMMAND }, ($, e) => onCommand($, e.args))

  // The JSX factory is `h`, so no variable in a render may be called h.
  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Link, Text } = $.ui.resolve(e)
    const state = await load($)
    if (state.latest.length === 0) return <Text dimColor>還沒有新聞，送出一則訊息或執行 /world-news now</Text>
    return (
      <Box flexDirection="column" rowGap={1}>
        {state.latest.map((item) => {
          const href = safeHref(item.url)
          return (
            <Box key={item.url} flexDirection="column">
              <Text>
                <Text dimColor>[{labelOf(item.category)}] </Text>
                {href ? <Link href={href}>{item.title}</Link> : item.title}
              </Text>
              <Text dimColor>
                {item.source}・{clock(item.publishedAt)}
              </Text>
            </Box>
          )
        })}
        <Text dimColor>{state.lastCheck ? `上次更新時間 ${dateTime(state.lastCheck)}` : ''}</Text>
      </Box>
    )
  })
}
