import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, Timer } from 'claude-code'

import type { Game, Pet, Skin, View } from '../types'
import { cannotPlay, guess, GUESS_TRIES, HANDS, playRps, startGuess } from './games'
import type { Hand } from './games'
import { act, afterTool, ageDays, bar, coinsOf, detail, face, finishTurn, gainXp, germsOf, growth, hatch, mood, stage, summary, tick, titleOf, warnings, workShare } from './pet'
import type { Action } from './pet'
import { buyFood, buySkin, findFood, FOOD_ORDER, FOODS, owns, ownedSkins } from './shop'
import type { FoodId } from './shop'
import { accentColor, drawFrame, inkOn, previewColor, lineColor, SICK_COLOR, SKIN_ORDER, SKINS, skinOf, statColor } from './sprites'

const DEFAULT_NAME = '啾啾'
const TICK_MS = 60 * 1000
const FRAME_MS = 500
const PANE = 'pet'

const petAtom = atom({ plugin: 'hyday-pet', key: 'pet' } as const, null)
const isHidden = atom({ plugin: 'hyday-pet', key: 'isHidden' } as const, false)
const isPaneOpen = atom({ plugin: 'hyday-pet', key: 'isPaneOpen' } as const, false)
const isWorking = atom({ plugin: 'hyday-pet', key: 'isWorking' } as const, false)
const frameAtom = atom({ plugin: 'hyday-pet', key: 'frame' } as const, 0)
const gameAtom = atom({ plugin: 'hyday-pet', key: 'game' } as const, null)
const viewAtom = atom({ plugin: 'hyday-pet', key: 'view' } as const, 'home')

const ACTIONS: Record<string, Action> = {
  feed: 'feed', 餵: 'feed', 餵食: 'feed',
  play: 'play', 玩: 'play',
  sleep: 'sleep', 睡: 'sleep', 睡覺: 'sleep',
  wake: 'wake', 醒: 'wake', 叫醒: 'wake',
  clean: 'clean', 清: 'clean', 清理: 'clean',
  heal: 'heal', 藥: 'heal', 吃藥: 'heal', 餵藥: 'heal',
}

// 先讀 $.store（可能有別的 session 剛寫過），補上經過的時間，再套用變化，最後寫回兩邊
const commit = async ($: EngineInterface, change: (pet: Pet) => Pet = p => p) => {
  const now = await $.clock.now()
  const stored = (await $.store.get('pet')) as Pet | undefined
  // 舊存檔沒有已擁有的顏色清單，第一次讀到就把當時正在用的顏色記成已擁有
  const loaded = stored ?? hatch(DEFAULT_NAME, now)
  const before = loaded.ownedSkins ? loaded : { ...loaded, ownedSkins: ownedSkins(loaded) }
  const after = change(tick(before, now))
  await $.store.set('pet', after)
  await update($, petAtom, () => after)
  for (const line of warnings(before, after)) $.ui.toast(line)
  return after
}

const perform = async ($: EngineInterface, action: Action | ((pet: Pet) => Action)) => {
  let say = ''
  await commit($, pet => {
    const out = act(pet, typeof action === 'function' ? action(pet) : action)
    say = out.say
    return out.pet
  })
  return say
}

const setHidden = async ($: EngineInterface, value: boolean) => {
  await $.store.set('hidden', value)
  await update($, isHidden, () => value)
}

const findSkin = (word: string): Skin | undefined =>
  SKIN_ORDER.find(skin => skin === word || SKINS[skin].label === word)

// 指定顏色：買過就換上，沒買過就說價錢；不指定就在買過的裡面輪流換
const setSkin = async ($: EngineInterface, skin?: Skin) => {
  let say = ''
  await commit($, p => {
    if (skin && !owns(p, skin)) {
      say = `${SKINS[skin].label}還沒買，商店賣 ${SKINS[skin].price} 金幣（/pet buy ${SKINS[skin].label}）`
      return p
    }
    const owned = SKIN_ORDER.filter(s => owns(p, s))
    const next = skin ?? owned[(owned.indexOf(skinOf(p)) + 1) % owned.length] ?? 'pink'
    say = `換成${SKINS[next].label}了`
    return { ...p, skin: next }
  })
  return say
}

const sell = async ($: EngineInterface, item: { food: FoodId } | { skin: Skin }) => {
  let say = ''
  await commit($, p => {
    const sale = 'food' in item ? buyFood(p, item.food) : buySkin(p, item.skin)
    say = sale.say
    return sale.pet
  })
  return say
}

const goTo = ($: EngineInterface, view: View) => update($, viewAtom, () => view)

const randomInt = (max: number) => Math.floor(Math.random() * max)

// 小遊戲：開局前先確認寵物有沒有力氣玩
const startGame = async ($: EngineInterface, kind: Game['kind']) => {
  const pet = await commit($)
  const reason = cannotPlay(pet)
  if (reason) {
    $.ui.toast(reason)
    return
  }
  const game: Game =
    kind === 'rps'
      ? { kind: 'rps', line: `跟 ${pet.name} 猜拳，出什麼？` }
      : startGuess(pet, randomInt(9) + 1)
  await update($, gameAtom, () => game)
}

const playHand = async ($: EngineInterface, mine: Hand) => {
  let game: Game | null = null
  let reason: string | undefined
  await commit($, pet => {
    reason = cannotPlay(pet)
    if (reason) return pet
    const out = playRps(pet, mine, randomInt(3) as Hand)
    game = out.game
    return out.pet
  })
  if (reason) $.ui.toast(reason)
  if (game) await update($, gameAtom, () => game)
}

const playGuess = async ($: EngineInterface, n: number) => {
  const current = await read($, gameAtom)
  if (current?.kind !== 'guess') return
  let game: Game = current
  await commit($, pet => {
    const out = guess(pet, current, n)
    game = out.game
    return out.pet
  })
  await update($, gameAtom, () => game)
}

const leaveGame = ($: EngineInterface) => update($, gameAtom, () => null)

// 側邊欄開著才推動畫格，關掉就停掉計時器
let animation: Timer | undefined

const stopAnimation = () => {
  animation?.cancel()
  animation = undefined
}

// 先開側邊欄再記狀態：沒放出來（例如視窗太窄）就跳通知說原因，橫條也不會躲起來
const openPane = async ($: EngineInterface, isAsked = true) => {
  const pet = await read($, petAtom)
  const opened = await $.ui.open({ id: PANE, title: pet?.name ?? DEFAULT_NAME, columns: 32, ...(isAsked ? { focus: true } : {}) })
  animation ??= $.clock.every(FRAME_MS, () => void update($, frameAtom, n => n + 1))
  await $.store.set('paneOpen', true)
  await update($, isPaneOpen, () => true)
  if (!opened.isPlaced && isAsked) $.ui.toast(`側邊欄放不下：${opened.reason}`)
  return opened
}

// 側邊欄真的畫在畫面上才算數，開了但在等位置的不算
const isPaneShown = async ($: EngineInterface) =>
  (await $.ui.panes()).some(pane => pane.id === PANE && pane.isPlaced && pane.isShown)

const markClosed = async ($: EngineInterface, isRemembered: boolean) => {
  stopAnimation()
  await update($, isPaneOpen, () => false)
  if (isRemembered) await $.store.set('paneOpen', false)
}

// 自己呼叫 $.ui.close 時，自己的 ui.close hook 不一定收得到，所以先把狀態清掉
const closePane = async ($: EngineInterface) => {
  await markClosed($, true)
  await $.ui.close({ id: PANE })
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'pet',
      description: '照顧你的電子雞：餵食、玩耍、睡覺、清理，或打開側邊欄',
      argumentHint: 'open | shop | buy <東西> | detail | feed | play | sleep | wake | clean | heal | skin <顏色> | name <名字> | hide | show',
    })
    const hidden = (await $.store.get('hidden')) === true
    await update($, isHidden, () => hidden)
    await commit($)
    $.clock.every(TICK_MS, () => void commit($))
    if ((await $.store.get('paneOpen')) === true) void openPane($, false)

    return next(e)
  })

  on('command.run', { command: 'pet' }, async ($, e) => {
    const [word = '', ...rest] = e.args.trim().split(/\s+/)
    const now = await $.clock.now()

    if (word === '' || word === 'status') {
      const pet = await commit($)
      return { text: summary(pet, now) }
    }
    if (word === 'open' || word === '開') {
      const opened = await openPane($)
      return {
        text: opened.isPlaced
          ? '側邊欄打開了（全螢幕模式下會停在對話旁邊）'
          : '側邊欄已經開了，但這個視窗太窄放不下，拉寬一點就會出現',
      }
    }
    if (word === 'close' || word === '關') {
      await closePane($)
      return { text: '側邊欄收起來了，/pet open 可以再打開' }
    }
    if (word === 'hide' || word === 'show') {
      await setHidden($, word === 'hide')
      return { text: word === 'hide' ? '收起來了，/pet show 可以叫回來' : '牠回來了' }
    }
    if (word === 'skin' || word === '顏色') {
      const wanted = rest[0]
      const skin = wanted ? findSkin(wanted) : undefined
      if (wanted && !skin) {
        return { text: `沒有 ${wanted} 這個顏色，可以選：${SKIN_ORDER.map(s => `${s}（${SKINS[s].label}）`).join('、')}` }
      }
      return { text: await setSkin($, skin) }
    }
    if (word === 'shop' || word === '商店') {
      const pet = await commit($)
      const foods = FOOD_ORDER.map(id => `  ${FOODS[id].label}  ${FOODS[id].price} 金幣  ${FOODS[id].effect}`)
      const skins = SKIN_ORDER.filter(s => SKINS[s].price > 0).map(
        s => `  ${SKINS[s].label}  ${owns(pet, s) ? '已擁有' : `${SKINS[s].price} 金幣`}`,
      )
      return {
        text: [`你有 ${coinsOf(pet)} 金幣`, '高級食物（買了直接餵）', ...foods, '顏色樣式', ...skins, '用 /pet buy 蛋糕 這樣買'].join('\n'),
      }
    }
    if (word === 'buy' || word === '買') {
      const wanted = rest.join('')
      const food = findFood(wanted)
      const skin = findSkin(wanted)
      if (food) return { text: await sell($, { food }) }
      if (skin) return { text: await sell($, { skin }) }
      return { text: wanted ? `商店沒有賣 ${wanted}，打 /pet shop 看看有什麼` : '要買什麼？打 /pet shop 看看有什麼' }
    }
    if (word === 'detail' || word === '細節') {
      const pet = await commit($)
      const d = detail(pet, 15)
      return { text: [...d.facts, '', '大事記', ...d.log.map(line => `  ${line}`)].join('\n') }
    }
    if (word === 'name') {
      const name = rest.join(' ').trim().slice(0, 12)
      if (!name) return { text: '要取什麼名字？例如 /pet name 小咪' }
      await commit($, pet => ({ ...pet, name }))
      if (await read($, isPaneOpen)) await $.ui.open({ id: PANE, title: name })
      return { text: `從現在起牠叫 ${name}` }
    }
    if (word === 'reset') {
      if (rest[0] !== 'confirm') return { text: '這會丟掉現在這隻，重新拿一顆蛋。確定的話打 /pet reset confirm' }
      await $.store.delete('pet')
      await commit($, () => hatch(DEFAULT_NAME, now))
      return { text: '拿到一顆新的蛋 🥚' }
    }

    const action = ACTIONS[word]
    if (!action) return { text: `看不懂 ${word}，可以用 open、close、shop、buy、detail、feed、play、sleep、wake、clean、heal、skin、name、hide、show` }
    return { text: await perform($, action) }
  })

  on('ui.close', async ($, e, next) => {
    const closed = await next(e)
    if (e.id === PANE) await markClosed($, e.origin.kind !== 'unload')
    return closed
  })

  on('prompt.submit', async ($, e, next) => {
    await update($, isWorking, () => true)
    return next(e)
  })

  // Claude 做事，寵物就長經驗：每次工具呼叫 +1，每輪結束 +3
  // 也記下做的是哪種工作（決定物種），報錯會長病菌
  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (ran.deny !== undefined) return ran
    const outcome = {
      tool: String(e.tool),
      isError: ran.isError === true,
      command: e.tool === 'Bash' ? e.command : undefined,
    }
    void commit($, pet => gainXp(afterTool(pet, outcome), 1))
    return ran
  })

  on('turn.complete', async ($, e, next) => {
    await update($, isWorking, () => false)
    void commit($, finishTurn)
    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Button, Text } = $.ui.resolve(e)
    const pet = await read($, petAtom)
    if (!pet) return <Text dimColor>寵物還在路上…</Text>

    const frame = await read($, frameAtom)
    const working = await read($, isWorking)
    const game = await read($, gameAtom)
    const view = await read($, viewAtom)
    const now = await $.clock.now()
    const skin = skinOf(pet)
    const art = drawFrame(pet, working, frame)
    const s = stage(pet)
    const g = growth(pet)
    const germs = germsOf(pet)
    const share = workShare(pet)
    const say = (p: Promise<string>) => void p.then(text => $.ui.toast(text))
    const isBrowsing = game === null && view !== 'home'

    const meter = (label: string, n: number, color: string | undefined, tail: string) => (
      <Text wrap="truncate">
        <Text dimColor>{label} </Text>
        <Text color={color}>{bar(n, 10)}</Text>
        <Text dimColor> {tail}</Text>
      </Text>
    )
    const stat = (label: string, n: number) => meter(label, n, statColor(n), String(Math.round(n)).padStart(3))

    const home = (
      <Box flexDirection="column" alignItems="center">
        {s !== 'egg' && (
          <Box flexWrap="wrap" justifyContent="center" columnGap={1}>
            <Button key="p-feed" hotkey="1" label="餵食" variant="primary" onPress={() => say(perform($, 'feed'))} />
            <Button key="p-play" hotkey="2" label="玩耍" onPress={() => say(perform($, 'play'))} />
            <Button
              key="p-sleep"
              hotkey="3"
              label={pet.isAsleep ? '叫醒' : '睡覺'}
              onPress={() => say(perform($, p => (p.isAsleep ? 'wake' : 'sleep')))}
            />
            {pet.poops > 0 && <Button key="p-clean" hotkey="4" label="清理" onPress={() => say(perform($, 'clean'))} />}
            {germs > 0 && <Button key="p-heal" hotkey="m" label="吃藥" onPress={() => say(perform($, 'heal'))} />}
          </Box>
        )}
        <Box columnGap={1}>
          <Button key="p-shop" hotkey="s" label="商店" onPress={() => void goTo($, 'shop')} />
          <Button key="p-detail" hotkey="i" label="細節" onPress={() => void goTo($, 'detail')} />
        </Box>
        {s !== 'egg' && (
          <Box columnGap={1}>
            <Button key="p-rps" hotkey="g" label="猜拳" onPress={() => void startGame($, 'rps')} />
            <Button key="p-guess" hotkey="n" label="猜數字" onPress={() => void startGame($, 'guess')} />
          </Box>
        )}
        <Box columnGap={1}>
          <Button key="p-skin" hotkey="c" label={`換色：${SKINS[skin].label}`} dimColor onPress={() => say(setSkin($))} />
          <Button key="p-close" role="dismiss" label="收起" dimColor onPress={() => void closePane($)} />
        </Box>
      </Box>
    )

    const rps = (
      <Box flexDirection="column" alignItems="center">
        <Text wrap="wrap">{game?.line ?? ''}</Text>
        <Box columnGap={1}>
          {HANDS.map((hand, i) => (
            <Button key={`rps-${i}`} hotkey={String(i + 1)} label={hand} onPress={() => void playHand($, i as Hand)} />
          ))}
        </Box>
        <Button key="game-back" hotkey="b" label="不玩了" dimColor onPress={() => void leaveGame($)} />
      </Box>
    )

    const back = <Button key="view-back" hotkey="b" label="返回" dimColor onPress={() => void goTo($, 'home')} />

    // 每個字用那個顏色當背景，會變化的顏色逐字換色
    const preview = (text: string, sk: Skin) => (
      <Text wrap="truncate">
        {[...text].map((ch, i) => {
          const bg = previewColor(sk, i, frame) ?? '#888888'
          return (
            <Text backgroundColor={bg} color={inkOn(bg)}>
              {ch}
            </Text>
          )
        })}
      </Text>
    )

    const shopView = (
      <Box flexDirection="column" alignItems="flex-start">
        <Text bold>商店 · 你有 {coinsOf(pet)} 金幣</Text>
        <Text> </Text>
        <Text dimColor>高級食物，買了直接餵</Text>
        {FOOD_ORDER.map((id, i) => (
          <Box columnGap={1}>
            <Button
              key={`buy-${id}`}
              hotkey={String(i + 1)}
              label={`${FOODS[id].label} ${String(FOODS[id].price).padStart(2)}`}
              dimColor={coinsOf(pet) < FOODS[id].price}
              onPress={() => say(sell($, { food: id }))}
            />
            <Text dimColor wrap="truncate">{FOODS[id].effect}</Text>
          </Box>
        ))}
        <Text> </Text>
        <Text dimColor>顏色樣式</Text>
        {SKIN_ORDER.filter(sk => SKINS[sk].price > 0).map((sk, i) => {
          const isOwned = owns(pet, sk)
          return (
            <Box columnGap={1}>
              <Button
                key={`skin-${sk}`}
                hotkey={String((i + 5) % 10)}
                label={sk === skin ? '使用中' : isOwned ? ' 換上 ' : ' 購買 '}
                variant={sk === skin ? 'primary' : undefined}
                dimColor={!isOwned && coinsOf(pet) < SKINS[sk].price}
                onPress={() => say(sell($, { skin: sk }))}
              />
              {preview(` ${SKINS[sk].label} `, sk)}
              {!isOwned && <Text dimColor>{SKINS[sk].price} 金幣</Text>}
            </Box>
          )
        })}
        <Text> </Text>
        {back}
      </Box>
    )

    const info = detail(pet)
    const detailView = (
      <Box flexDirection="column" alignItems="flex-start">
        {info.facts.map(line => (
          <Text wrap="truncate">{line}</Text>
        ))}
        <Text> </Text>
        <Text bold>大事記</Text>
        {info.log.length === 0 && <Text dimColor>還沒有發生什麼事</Text>}
        {info.log.map(line => (
          <Text dimColor wrap="truncate">
            {line}
          </Text>
        ))}
        <Text> </Text>
        {back}
      </Box>
    )

    const guessing = game?.kind === 'guess' ? game : undefined
    const guessView = guessing && (
      <Box flexDirection="column" alignItems="center">
        <Text wrap="wrap">{guessing.line}</Text>
        {!guessing.isOver && <Text dimColor>{'●'.repeat(guessing.triesLeft)}{'○'.repeat(GUESS_TRIES - guessing.triesLeft)}</Text>}
        {!guessing.isOver && (
          <Box flexWrap="wrap" justifyContent="center" columnGap={1}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
              <Button key={`guess-${n}`} hotkey={String(n)} label={String(n)} onPress={() => void playGuess($, n)} />
            ))}
          </Box>
        )}
        <Box columnGap={1}>
          {guessing.isOver && (
            <Button key="guess-again" hotkey="r" label="再玩一次" variant="primary" onPress={() => void startGame($, 'guess')} />
          )}
          <Button key="game-back" hotkey="b" label="不玩了" dimColor onPress={() => void leaveGame($)} />
        </Box>
      </Box>
    )

    return (
      <Box flexDirection="column" alignItems="center" paddingX={1}>
        <Text wrap="truncate">
          <Text bold color={accentColor(skin, frame)}>{pet.name}</Text>
          <Text color="#ffd866">  ● {coinsOf(pet)}</Text>
        </Text>
        <Text dimColor wrap="truncate">
          {titleOf(pet)} · {ageDays(pet, now)} 天大
        </Text>
        <Text color={pet.isSick ? SICK_COLOR : accentColor(skin, frame)}>{art.effect || ' '}</Text>
        <Box flexDirection="column" alignItems="flex-start">
          {art.body.map((line, row) => (
            <Text bold color={pet.isSick ? SICK_COLOR : lineColor(skin, row, frame)}>
              {line || ' '}
            </Text>
          ))}
        </Box>
        <Text>{pet.poops > 0 ? '💩'.repeat(Math.min(pet.poops, 5)) : ' '}</Text>
        <Text italic dimColor>
          {art.caption}
        </Text>
        <Text> </Text>
        {isBrowsing ? null : <Box flexDirection="column" alignItems="center">
        {s !== 'egg' && stat('飽足', pet.hunger)}
        {s !== 'egg' && stat('心情', pet.joy)}
        {s !== 'egg' && stat('精神', pet.energy)}
        {s !== 'egg' && meter('病菌', germs, germs >= 60 ? '#ff6188' : germs >= 30 ? '#ffd866' : '#78dce8', pet.isSick ? '生病' : String(Math.round(germs)).padStart(3))}
        {g ? meter('成長', g.percent, accentColor(skin, frame) ?? 'cyan', `差 ${g.left}`) : <Text dimColor>已經完全長大了</Text>}
        {s !== 'adult' && (
          <Text dimColor wrap="truncate">
            改檔 {share.build}% · 指令 {share.run}% · 查找 {share.explore}%
          </Text>
        )}
        </Box>}
        <Text> </Text>
        {game !== null ? (game.kind === 'rps' ? rps : guessView) : view === 'shop' ? shopView : view === 'detail' ? detailView : home}
      </Box>
    )
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const pet = await read($, petAtom)
    const isQuiet =
      e.props.hasSurvey || pet === null || (await read($, isHidden)) || ((await read($, isPaneOpen)) && (await isPaneShown($)))
    if (isQuiet || pet === null) {
      return next(e)
    }

    const { Box, Button, Text } = $.ui.resolve(e)
    const isWide = e.props.bodyColumns >= 72
    const s = stage(pet)
    const skin = skinOf(pet)
    const tone = mood(pet) < 30 || pet.hunger < 20 ? '#ff6188' : lineColor(skin, 0, 0)
    const say = (p: Promise<string>) => void p.then(text => $.ui.toast(text))

    return (
      <Box flexDirection="column">
        <Text wrap="truncate">
          <Text color={tone} bold>
            {face(pet, e.props.isWorking)}
          </Text>
          <Text color={accentColor(skin, 0)}> {pet.name}</Text>
          <Text dimColor> · {titleOf(pet)}</Text>
          {pet.isSick && <Text color="#ff6188"> 生病中</Text>}
          {s !== 'egg' && <Text color="#ffd866">  ● {coinsOf(pet)}</Text>}
          {s !== 'egg' && <Text dimColor>  飽 </Text>}
          {s !== 'egg' && <Text color={statColor(pet.hunger)}>{bar(pet.hunger)}</Text>}
          {s !== 'egg' && <Text dimColor>  樂 </Text>}
          {s !== 'egg' && <Text color={statColor(pet.joy)}>{bar(pet.joy)}</Text>}
          {s !== 'egg' && <Text dimColor>  精 </Text>}
          {s !== 'egg' && <Text color={statColor(pet.energy)}>{bar(pet.energy)}</Text>}
          {s === 'egg' && <Text dimColor>  孵化中 {pet.xp}/10</Text>}
          {pet.poops > 0 && <Text>  {'💩'.repeat(Math.min(pet.poops, 5))}</Text>}
        </Text>
        <Box columnGap={1}>
          {s !== 'egg' && <Button key="feed" hotkey="1" label="餵食" onPress={() => say(perform($, 'feed'))} />}
          {s !== 'egg' && <Button key="play" hotkey="2" label="玩耍" onPress={() => say(perform($, 'play'))} />}
          {s !== 'egg' && (
            <Button
              key="sleep"
              hotkey="3"
              label={pet.isAsleep ? '叫醒' : '睡覺'}
              onPress={() => say(perform($, p => (p.isAsleep ? 'wake' : 'sleep')))}
            />
          )}
          {s !== 'egg' && pet.poops > 0 && (
            <Button key="clean" hotkey="4" label="清理" onPress={() => say(perform($, 'clean'))} />
          )}
          {s !== 'egg' && pet.isSick && (
            <Button key="heal" hotkey="m" label="吃藥" variant="primary" onPress={() => say(perform($, 'heal'))} />
          )}
          <Button key="open" hotkey="o" label="展開側邊欄" dimColor onPress={() => void openPane($)} />
          {isWide && <Button key="hide" label="收起" dimColor onPress={() => void setHidden($, true)} />}
        </Box>
      </Box>
    )
  })
}
