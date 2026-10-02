import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

import type { Pet } from '../types'
import { guess, judge, playRps, startGuess } from './games'
import { buyFood, buySkin } from './shop'
import { act, afterTool, detail, dominant, finishTurn, gainXp, hatch, speciesLabel, stage, tick, warnings } from './pet'
import { drawFrame, lineColor } from './sprites'

const HOUR = 60 * 60 * 1000
const START = { cwd: '/', surface: 'terminal', isInteractive: true } as const
const run = ($: Engine, args: string) =>
  $.command.run({
    command: 'pet',
    args,
    origin: { kind: 'composer' },
    presentation: { isFullscreen: false, columns: 100 },
  })
// 扮演引擎底層：開 session、登記指令、顯示 toast
const engine = (on: On) => {
  on('session.start', (_$, e) => ({ cwd: e.cwd }))
  on('command.register', (_$, e) => ({ value: { command: e.name } }))
  on('ui.toast', () => ({ value: undefined }))
}
const grown = (over: Partial<Pet> = {}): Pet => ({ ...gainXp(hatch('啾啾', 0), 20), ...over })

describe('寵物數值', () => {
  test('時間經過會餓、會無聊', () => {
    const later = tick(grown(), 5 * HOUR)
    expect(later.hunger).toBe(40)
    expect(later.joy).toBe(55)
    expect(later.lastTick).toBe(5 * HOUR)
  })

  test('睡飽了自己醒來，並提醒一次', () => {
    const asleep = grown({ isAsleep: true, energy: 90 })
    const after = tick(asleep, HOUR)
    expect(after.isAsleep).toBe(false)
    expect(warnings(asleep, after)).toContain('啾啾 睡飽起床了')
  })

  test('每餵三次大一坨，清掉會變開心', () => {
    let pet = grown({ hunger: 0 })
    for (let i = 0; i < 3; i++) pet = act(pet, 'feed').pet
    expect(pet.poops).toBe(1)
    const cleaned = act(pet, 'clean').pet
    expect(cleaned.poops).toBe(0)
    expect(cleaned.joy).toBeGreaterThan(pet.joy)
  })

  test('蛋不能餵，經驗夠了才孵化', () => {
    const egg = hatch('啾啾', 0)
    expect(act(egg, 'feed').pet).toEqual(egg)
    const hatched = gainXp(egg, 10)
    expect(stage(hatched)).toBe('baby')
    expect(warnings(egg, hatched)).toContain('啾啾 孵出來了！')
  })

  test('睡覺時玩不了', () => {
    const pet = grown({ isAsleep: true })
    expect(act(pet, 'play').pet).toEqual(pet)
  })
})

describe('/pet 指令', () => {
  test('寵物跨 session 存活，時間經過會反映出來', async ($, on) => {
    const clock = mock.clock(on, { now: 10 * HOUR })
    mock.store(on, { pet: grown({ lastTick: 10 * HOUR, hunger: 80 }) })
    engine(on)
    await $.session.start(START)

    await clock.advance(5 * HOUR)
    const out = await run($, '')
    expect(out.text).toContain('飽足')
    expect(out.text).toContain(' 40 ')
  })

  test('feed 讓牠吃飽，name 改名字', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { pet: grown({ hunger: 30 }) })
    engine(on)
    await $.session.start(START)

    expect((await run($, 'feed')).text).toBe('啾啾 吃得很開心')
    expect((await run($, 'name 小咪')).text).toBe('從現在起牠叫 小咪')
    expect((await run($, '餵')).text).toBe('小咪 吃得很開心')
  })
})

describe('動畫與顏色', () => {
  test('平常會彈跳，身體高度不變', () => {
    const pet = grown()
    const frames = [0, 1, 2, 3].map(f => drawFrame(pet, false, f).body)
    expect(frames[0]?.[0]).toBe('')
    expect(frames[2]?.at(-1)).toBe('')
    expect(new Set(frames.map(b => b.length)).size).toBe(1)
  })

  test('Claude 工作時冒星星，睡覺時打呼', () => {
    expect(drawFrame(grown(), true, 0).effect).toContain('✦')
    expect(drawFrame(grown({ isAsleep: true }), false, 1).effect).toContain('Z')
    expect(drawFrame(grown({ hunger: 5 }), false, 0).caption).toBe('肚子好餓…')
  })

  test('彩虹會隨時間往下流', () => {
    expect(lineColor('rainbow', 1, 0)).toBe(lineColor('rainbow', 0, 1))
    expect(lineColor('rainbow', 0, 0)).not.toBe(lineColor('rainbow', 0, 1))
  })

  test('/pet skin 只在買過的顏色裡輪流換', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { pet: grown({ ownedSkins: ['mint'] }) })
    engine(on)
    await $.session.start(START)

    expect((await run($, 'skin')).text).toBe('換成單色了')
    expect((await run($, 'skin')).text).toBe('換成薄荷了')
    expect((await run($, 'skin')).text).toBe('換成粉紅了')
    expect((await run($, 'skin 彩虹')).text).toBe('彩虹還沒買，商店賣 1200 金幣（/pet buy 彩虹）')
    expect((await run($, 'skin 紫色')).text).toContain('沒有 紫色 這個顏色')
  })

  test('舊存檔正在用的顏色不會被收走', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { pet: grown({ skin: 'rainbow' }) })
    engine(on)
    await $.session.start(START)

    expect((await run($, 'skin 彩虹')).text).toBe('換成彩虹了')
  })
})

describe('側邊欄', () => {
  test('/pet close 之後橫條要回來', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { pet: grown() })
    engine(on)
    on('ui.open', () => ({ value: { isPlaced: true } }))
    on('ui.close', () => ({ value: undefined }))
    await $.session.start(START)

    const BAND = {
      plugin: 'hyday-pet',
      surface: 'terminal',
      component: 'AbovePrompt',
      props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
    } as const

    await run($, 'open')
    for (const surface of ['terminal', 'desktop'] as const) {
      const pane = await $.ui.mount({
        plugin: 'hyday-pet',
        surface,
        component: 'Pane',
        requestId: 'pet',
        props: {
          title: '啾啾',
          isFocused: false,
          bodyColumns: 32,
          placement: 'dock',
          scroll: { offset: 0, bodyRows: 30 },
          view: {},
        },
      })
      expect(await pane.find({ type: 'Text', text: '啾啾' })).toBeDefined()
      await pane.unmount()
    }
    await run($, 'close')
    const ui = await $.ui.mount(BAND)
    expect(await ui.find({ type: 'Button', key: 'open' })).toBeDefined()
    await ui.unmount()
  })
})

describe('物種分化', () => {
  const work = (pet: Pet, tool: string, times: number) => {
    let p = pet
    for (let i = 0; i < times; i++) p = afterTool(p, { tool, isError: false })
    return p
  }

  test('幼年期常跑指令，進成長期就變水獺', () => {
    const baby = work(gainXp(hatch('啾啾', 0), 140), 'Bash', 8)
    const child = gainXp(work(baby, 'Edit', 2), 10)
    expect(stage(child)).toBe('child')
    expect(child.species).toBe('run')
    expect(warnings(baby, child)).toContain('啾啾 長成了水獺（水手系）！')
  })

  test('沒有一種工作超過 45% 就是奇美拉', () => {
    expect(dominant({ build: 4, run: 4, explore: 4 })).toBe('mixed')
    expect(dominant({ build: 1, run: 1, explore: 0 })).toBe('mixed')
  })

  test('成熟期再看成長期的工作分化一次', () => {
    const child = { ...gainXp(hatch('啾啾', 0), 150), species: 'build' as const }
    const busy = work(child, 'mcp__jev-search__jev_search', 10)
    const adult = gainXp(busy, 700)
    expect(speciesLabel(adult)).toBe('會飛的鼴鼠')
    const pure = gainXp(work(child, 'Write', 10), 700)
    expect(speciesLabel(pure)).toBe('純種鼴鼠')
  })
})

describe('生病', () => {
  const fail = (pet: Pet, times: number) => {
    let p = pet
    for (let i = 0; i < times; i++) p = afterTool(p, { tool: 'Bash', isError: true, command: 'npm run build' })
    return p
  }

  test('連續報錯會生病，測試變綠會康復', () => {
    const sick = fail(grown(), 6)
    expect(sick.isSick).toBe(true)
    expect(warnings(grown(), sick)[0]).toContain('生病了')
    let p = sick
    for (let i = 0; i < 2; i++) p = afterTool(p, { tool: 'Bash', isError: false, command: 'npx vitest run' })
    expect(p.isSick).toBe(false)
    expect(warnings(sick, p)).toContain('啾啾 病好了！')
  })

  test('跑別的指令成功只會慢慢好', () => {
    const sick = fail(grown(), 6)
    const better = afterTool(sick, { tool: 'Bash', isError: false, command: 'ls' })
    expect(better.isSick).toBe(true)
    expect(better.germs).toBeLessThan(sick.germs ?? 0)
  })

  test('生病時數值掉比較快，也不想玩', () => {
    const sick = fail(grown(), 6)
    expect(tick(sick, 2 * HOUR).hunger).toBeLessThan(tick(grown(), 2 * HOUR).hunger)
    expect(act(sick, 'play').say).toBe('啾啾 生病了，不想玩')
  })

  test('吃藥會減病菌，但心情會變差', () => {
    const sick = fail(grown(), 6)
    const out = act(sick, 'heal')
    expect(out.pet.germs).toBe((sick.germs ?? 0) - 15)
    expect(out.pet.joy).toBe(sick.joy - 10)
  })
})

describe('小遊戲', () => {
  test('猜拳的輸贏', () => {
    expect(judge(0, 1)).toBe('win')
    expect(judge(0, 2)).toBe('lose')
    expect(judge(2, 2)).toBe('draw')
    const out = playRps(grown(), 0, 1)
    expect(out.game.line).toBe('你出石頭，啾啾 出剪刀，你贏了！金幣 +3')
    expect(out.pet.coins).toBe((grown().coins ?? 0) + 3)
    expect(out.pet.energy).toBe(grown().energy - 6)
  })

  test('猜數字會提示大小，三次沒中就結束', () => {
    const game = startGuess(grown(), 7)
    if (game.kind !== 'guess') throw new Error('不是猜數字')
    const first = guess(grown(), game, 3)
    expect(first.game.line).toContain('再大一點')
    if (first.game.kind !== 'guess') throw new Error('不是猜數字')
    const second = guess(first.pet, first.game, 9)
    if (second.game.kind !== 'guess') throw new Error('不是猜數字')
    const third = guess(second.pet, second.game, 8)
    expect(third.game).toMatchObject({ isOver: true })
    expect(third.game.line).toContain('答案是 7')
  })

  test('猜中會很開心', () => {
    const game = startGuess(grown({ joy: 50 }), 4)
    if (game.kind !== 'guess') throw new Error('不是猜數字')
    const out = guess(grown({ joy: 50 }), game, 4)
    expect(out.pet.joy).toBe(75)
  })

  test('在側邊欄按猜拳就能玩', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { pet: grown() })
    engine(on)
    on('ui.open', () => ({ value: { isPlaced: true } }))
    await $.session.start(START)

    for (const surface of ['terminal', 'desktop'] as const) {
      const pane = await $.ui.mount({
        plugin: 'hyday-pet',
        surface,
        component: 'Pane',
        requestId: 'pet',
        props: { title: '啾啾', isFocused: true, bodyColumns: 32, placement: 'dock', scroll: { offset: 0, bodyRows: 40 }, view: {} },
      })
      await pane.press({ key: 'p-rps' })
      await pane.press({ key: 'rps-0' })
      expect(await pane.find({ type: 'Text', text: /你出石頭/ })).toBeDefined()
      await pane.press({ key: 'game-back' })
      expect(await pane.find({ type: 'Button', key: 'p-feed' })).toBeDefined()
      await pane.unmount()
    }
  })
})

describe('橫條', () => {
  const band = {
    plugin: 'hyday-pet',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
  } as const

  test('生病時出現吃藥按鈕，按了病菌會減少', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { pet: grown({ germs: 70, isSick: true }) })
    engine(on)
    await $.session.start(START)

    const ui = await $.ui.mount(band)
    await ui.press({ key: 'heal' })
    expect((await run($, '')).text).toContain('病菌 ███░░ 55')
    await ui.unmount()
  })

  test('沒生病就沒有吃藥按鈕', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { pet: grown({ germs: 30 }) })
    engine(on)
    await $.session.start(START)

    const ui = await $.ui.mount(band)
    expect(await ui.find({ type: 'Button', key: 'heal' })).toBeUndefined()
    await ui.unmount()
  })
})

describe('金幣和商店', () => {
  test('做完一輪對話賺 2 金幣，測試綠燈賺 5', () => {
    const pet = grown({ coins: 0 })
    expect(finishTurn(pet).coins).toBe(2)
    expect(afterTool(pet, { tool: 'Bash', isError: false, command: 'bun test' }).coins).toBe(5)
    expect(afterTool(pet, { tool: 'Bash', isError: false, command: 'ls' }).coins).toBe(0)
  })

  test('孵化和進化有獎金', () => {
    expect(gainXp(hatch('啾啾', 0), 10).coins).toBe(10)
    expect(gainXp(grown({ xp: 149, coins: 0 }), 1).coins).toBe(30)
  })

  test('買高級食物直接餵，錢不夠會說還差多少', () => {
    const rich = grown({ coins: 100, hunger: 20, joy: 50 })
    const cake = buyFood(rich, 'cake')
    expect(cake.pet).toMatchObject({ coins: 75, hunger: 60, joy: 65 })
    expect(buyFood(grown({ coins: 10 }), 'bento').say).toBe('金幣不夠，還差 50')
  })

  test('沙拉不會讓牠大便，還能減病菌', () => {
    let pet = grown({ coins: 200, hunger: 0, feeds: 2, germs: 40 })
    pet = buyFood(pet, 'salad').pet
    expect(pet.poops).toBe(0)
    expect(pet.germs).toBe(25)
    expect(buyFood(pet, 'cake').pet.poops).toBe(1)
  })

  test('買顏色會扣錢並換上，買過再按只是換上', () => {
    const bought = buySkin(grown({ coins: 500 }), 'gold')
    expect(bought.pet).toMatchObject({ coins: 100, skin: 'gold' })
    expect(buySkin({ ...bought.pet, skin: 'pink' }, 'gold').pet).toMatchObject({ coins: 100, skin: 'gold' })
    expect(buySkin(grown({ coins: 10 }), 'galaxy').say).toBe('金幣不夠，還差 1490')
  })
})

describe('細節頁', () => {
  test('記下孵化、進化、生病和購物，最新的在最上面', () => {
    let pet = gainXp(hatch('啾啾', 0), 10)
    for (let i = 0; i < 6; i++) pet = afterTool(pet, { tool: 'Bash', isError: true })
    pet = buyFood({ ...pet, coins: 100 }, 'cake').pet
    const d = detail(pet)
    expect(d.log.map(line => line.slice(13))).toEqual(['吃了草莓蛋糕', '生病了', '孵出來了', '拿到一顆蛋，取名啾啾'])
    expect(d.facts).toContain('看過 6 次報錯、0 次測試綠燈')
    expect(d.facts).toContain('生過 1 次病')
  })

  test('側邊欄可以進商店買東西，也能看細節頁', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { pet: grown({ coins: 100, hunger: 30 }) })
    engine(on)
    on('ui.open', () => ({ value: { isPlaced: true } }))
    await $.session.start(START)

    for (const surface of ['terminal', 'desktop'] as const) {
      const pane = await $.ui.mount({
        plugin: 'hyday-pet',
        surface,
        component: 'Pane',
        requestId: 'pet',
        props: { title: '啾啾', isFocused: true, bodyColumns: 32, placement: 'dock', scroll: { offset: 0, bodyRows: 60 }, view: {} },
      })
      await pane.press({ key: 'p-shop' })
      expect(await pane.find({ type: 'Button', key: 'buy-cake' })).toBeDefined()
      await pane.press({ key: 'view-back' })
      await pane.press({ key: 'p-detail' })
      expect(await pane.find({ type: 'Text', text: /大事記/ })).toBeDefined()
      await pane.press({ key: 'view-back' })
      await pane.unmount()
    }
    expect((await run($, 'buy 蛋糕')).text).toBe('啾啾 吃了草莓蛋糕，好幸福')
    expect((await run($, 'shop')).text).toContain('你有 75 金幣')
  })
})

describe('舊存檔', () => {
  test('當時正在用的付費顏色，換掉之後還是自己的', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { pet: grown({ skin: 'gold' }) })
    engine(on)
    await $.session.start(START)

    expect((await run($, 'skin')).text).toBe('換成粉紅了')
    expect((await run($, 'skin 金色')).text).toBe('換成金色了')
  })
})

describe('展開側邊欄', () => {
  const band = {
    plugin: 'hyday-pet',
    surface: 'terminal',
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 100, scroll: { offset: 0, bodyRows: 10 }, view: {} },
  } as const

  test('側邊欄放不下時，橫條不會跟著躲起來', async ($, on) => {
    mock.clock(on, { now: 0 })
    mock.store(on, { pet: grown() })
    engine(on)
    on('ui.open', () => ({ value: { isPlaced: false, reason: '視窗太窄' } }))
    on('ui.panes', () => ({ value: [{ id: 'pet', title: '啾啾', isShown: false, isFocused: false, isPlaced: false }] }))
    await $.session.start(START)

    const ui = await $.ui.mount(band)
    await ui.press({ key: 'open' })
    expect(await ui.find({ type: 'Button', key: 'open' })).toBeDefined()
    await ui.unmount()
  })
})
