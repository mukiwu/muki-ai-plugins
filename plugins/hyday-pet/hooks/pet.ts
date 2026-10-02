import type { Lineage, Pet, Stats, Work } from '../types'

const HOUR = 60 * 60 * 1000

// 每小時的變化量
const DECAY = {
  hunger: 8,
  joy: 5,
  energyAwake: 4,
  energyAsleep: 20,
  hungerAsleep: 4,
}

// 生病時數值掉得比較快
const SICK_DECAY = 1.5

// 病菌：報錯加、成功減，跨過門檻就生病或康復
const GERMS = {
  onError: 10,
  onSuccess: 2,
  onSuccessWhileSick: 4,
  onTestPass: 20,
  onMedicine: 15,
  sickAt: 60,
  curedAt: 20,
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

// 金幣：常用的小東西一天內買得到，最貴的顏色要存一兩週
export const COINS = {
  perTurn: 2,
  perTestPass: 5,
  hatch: 10,
  child: 30,
  adult: 80,
}

const NO_STATS: Stats = {
  turns: 0,
  tools: 0,
  errors: 0,
  testPasses: 0,
  games: 0,
  wins: 0,
  sickTimes: 0,
  foods: 0,
  coinsEarned: 0,
}

const LOG_LIMIT = 30

export const coinsOf = (pet: Pet) => pet.coins ?? 0
export const statsOf = (pet: Pet): Stats => ({ ...NO_STATS, ...pet.stats })

export const earn = (pet: Pet, coins: number): Pet => {
  const stats = statsOf(pet)
  return { ...pet, coins: coinsOf(pet) + coins, stats: { ...stats, coinsEarned: stats.coinsEarned + coins } }
}

export const bump = (pet: Pet, key: keyof Stats, by = 1): Pet => {
  const stats = statsOf(pet)
  return { ...pet, stats: { ...stats, [key]: stats[key] + by } }
}

// 大事記用寵物最後一次更新的時間當作發生時間
export const addLog = (pet: Pet, text: string): Pet => ({
  ...pet,
  log: [...(pet.log ?? []), { at: pet.lastTick, text }].slice(-LOG_LIMIT),
})

const NO_WORK: Work = { build: 0, run: 0, explore: 0 }

export const hatch = (name: string, now: number): Pet => ({
  name,
  bornAt: now,
  lastTick: now,
  hunger: 80,
  joy: 80,
  energy: 80,
  xp: 0,
  poops: 0,
  feeds: 0,
  isAsleep: false,
  work: NO_WORK,
  germs: 0,
  isSick: false,
  coins: 0,
  stats: NO_STATS,
  log: [{ at: now, text: `拿到一顆蛋，取名${name}` }],
})

// 依經過時間扣數值；睡飽了自己醒來
export const tick = (pet: Pet, now: number): Pet => {
  const hours = Math.max(0, now - pet.lastTick) / HOUR
  if (hours === 0) return pet

  const sick = pet.isSick ? SICK_DECAY : 1
  const messy = 1 + pet.poops * 0.5
  const energy = pet.isAsleep
    ? pet.energy + DECAY.energyAsleep * hours
    : pet.energy - DECAY.energyAwake * hours
  const next: Pet = {
    ...pet,
    lastTick: now,
    hunger: clamp(pet.hunger - (pet.isAsleep ? DECAY.hungerAsleep : DECAY.hunger) * sick * hours),
    joy: clamp(pet.joy - DECAY.joy * messy * sick * hours),
    energy: clamp(energy),
  }
  return next.isAsleep && next.energy >= 100 ? { ...next, isAsleep: false } : next
}

export type Action = 'feed' | 'play' | 'sleep' | 'wake' | 'clean' | 'heal'

export type Outcome = { pet: Pet; say: string }

export const act = (pet: Pet, action: Action): Outcome => {
  const n = pet.name
  if (stage(pet) === 'egg' && action !== 'clean') {
    return { pet, say: `${n} 還是一顆蛋，讓 Claude 多做點事，牠就會孵出來` }
  }
  if (pet.isAsleep && action !== 'wake') {
    return { pet, say: `${n} 在睡覺，先別吵牠（/pet wake 可以叫醒）` }
  }

  switch (action) {
    case 'feed': {
      if (pet.hunger >= 95) {
        return { pet: { ...pet, joy: clamp(pet.joy - 5) }, say: `${n} 吃不下了，還被你塞得有點不高興` }
      }
      const feeds = pet.feeds + 1
      const poops = feeds % 3 === 0 ? pet.poops + 1 : pet.poops
      const fed = { ...pet, hunger: clamp(pet.hunger + 25), feeds, poops }
      return { pet: fed, say: poops > pet.poops ? `${n} 吃飽了，順便大了一坨 💩` : `${n} 吃得很開心` }
    }
    case 'play': {
      if (pet.isSick) return { pet, say: `${n} 生病了，不想玩` }
      if (pet.energy < 15) return { pet, say: `${n} 太累了，讓牠睡一下吧` }
      return {
        pet: { ...pet, joy: clamp(pet.joy + 20), energy: clamp(pet.energy - 12), hunger: clamp(pet.hunger - 5) },
        say: `${n} 玩得好開心`,
      }
    }
    case 'sleep':
      return { pet: { ...pet, isAsleep: true }, say: `${n} 睡著了 zZ` }
    case 'wake':
      if (!pet.isAsleep) return { pet, say: `${n} 本來就醒著` }
      return { pet: { ...pet, isAsleep: false, joy: clamp(pet.joy - 5) }, say: `${n} 被叫醒，有點起床氣` }
    case 'clean':
      if (pet.poops === 0) return { pet, say: '沒有東西要清' }
      return { pet: { ...pet, poops: 0, joy: clamp(pet.joy + 5) }, say: `清乾淨了，${n} 舒服多了` }
    case 'heal': {
      if (germsOf(pet) === 0) return { pet, say: `${n} 很健康，不用吃藥` }
      const healed = withGerms({ ...pet, joy: clamp(pet.joy - 10) }, germsOf(pet) - GERMS.onMedicine)
      return { pet: healed, say: healed.isSick ? `${n} 吃了藥，苦著臉，還要再休養` : `${n} 吃了藥，好苦，但舒服多了` }
    }
  }
}

// Claude 每做一件事，寵物就吸收一點經驗；跨進成長期、成熟期時決定物種
export const gainXp = (pet: Pet, amount: number): Pet => {
  const next = { ...pet, xp: pet.xp + amount }
  const from = stage(pet)
  const to = stage(next)
  if (from === to) return next
  if (to === 'baby') return addLog(earn(next, COINS.hatch), '孵出來了')
  if (to === 'child') {
    const grown = { ...next, species: dominant(workOf(pet)), work: NO_WORK }
    return addLog(earn(grown, COINS.child), `長成${SPECIES[grown.species].name}（${SPECIES[grown.species].family}）`)
  }
  const adult = { ...next, trait: dominant(workOf(pet)), work: NO_WORK }
  return addLog(earn(adult, COINS.adult), `長大成${speciesLabel(adult) ?? '成熟期'}`)
}

// 一輪對話結束：經驗 +3、金幣 +2
export const finishTurn = (pet: Pet): Pet => bump(earn(gainXp(pet, 3), COINS.perTurn), 'turns')

// 把工具歸到三種工作，不屬於任何一種就回傳 undefined
export const classify = (tool: string): keyof Work | undefined => {
  if (['Edit', 'Write', 'NotebookEdit', 'MultiEdit'].includes(tool)) return 'build'
  if (['Bash', 'PowerShell', 'Monitor'].includes(tool)) return 'run'
  if (['Read', 'Grep', 'Glob', 'WebFetch', 'WebSearch', 'LSP', 'Agent'].includes(tool)) return 'explore'
  if (tool.startsWith('mcp__')) return 'explore'
  return undefined
}

const TEST_COMMAND = /\b(test|tests|vitest|jest|pytest|mocha|rspec|phpunit|ctest)\b|\b(go|cargo|bun|deno|swift|dotnet|mix) test\b|\bnpm t\b/

export const isTestCommand = (command: string) => TEST_COMMAND.test(command)

export type ToolOutcome = { tool: string; isError: boolean; command?: string }

// 一次工具呼叫的結果：記工作量，報錯長病菌，成功消一點，測試綠燈消很多
export const afterTool = (pet: Pet, outcome: ToolOutcome): Pet => {
  const kind = classify(outcome.tool)
  const work = workOf(pet)
  const tallied = bump(pet, 'tools')
  const counted = kind ? { ...tallied, work: { ...work, [kind]: work[kind] + 1 } } : tallied
  if (stage(pet) === 'egg') return counted

  const germs = germsOf(pet)
  if (outcome.isError) return withGerms(bump(counted, 'errors'), germs + GERMS.onError)
  const isTestPass = outcome.tool === 'Bash' && outcome.command !== undefined && isTestCommand(outcome.command)
  if (isTestPass) return withGerms(bump(earn(counted, COINS.perTestPass), 'testPasses'), germs - GERMS.onTestPass)
  return withGerms(counted, germs - (pet.isSick ? GERMS.onSuccessWhileSick : GERMS.onSuccess))
}

export const withGerms = (pet: Pet, germs: number): Pet => {
  const g = clamp(germs)
  const isSick = pet.isSick ? g > GERMS.curedAt : g >= GERMS.sickAt
  const next = { ...pet, germs: g, isSick }
  if (isSick && !pet.isSick) return addLog(bump(next, 'sickTimes'), '生病了')
  if (!isSick && pet.isSick) return addLog(next, '病好了')
  return next
}

export const germsOf = (pet: Pet) => pet.germs ?? 0
export const workOf = (pet: Pet): Work => pet.work ?? NO_WORK

// 佔超過 45% 的那種工作勝出，不然就是什麼都做的雜學系
export const dominant = (work: Work): Lineage => {
  const total = work.build + work.run + work.explore
  if (total < 5) return 'mixed'
  const [top, count] = (Object.entries(work) as [keyof Work, number][]).sort((a, b) => b[1] - a[1])[0] ?? ['build', 0]
  return count / total >= 0.45 ? top : 'mixed'
}

export const SPECIES: Record<Lineage, { name: string; family: string; adultTrait: string }> = {
  build: { name: '鼴鼠', family: '工匠系', adultTrait: '會蓋房子的' },
  run: { name: '水獺', family: '水手系', adultTrait: '會游泳的' },
  explore: { name: '貓頭鷹', family: '探險系', adultTrait: '會飛的' },
  mixed: { name: '奇美拉', family: '雜學系', adultTrait: '什麼都會一點的' },
}

// 物種的完整名字，例如：會游泳的鼴鼠、純種水獺
export const speciesLabel = (pet: Pet): string | undefined => {
  if (!pet.species) return undefined
  const base = SPECIES[pet.species].name
  if (!pet.trait) return base
  return pet.trait === pet.species ? `純種${base}` : `${SPECIES[pet.trait].adultTrait}${base}`
}

export type Stage = 'egg' | 'baby' | 'child' | 'adult'

export const stage = (pet: Pet): Stage =>
  pet.xp < 10 ? 'egg' : pet.xp < 150 ? 'baby' : pet.xp < 800 ? 'child' : 'adult'

// 離下一個階段還差多少，成熟期之後回傳 null
export const growth = (pet: Pet): { percent: number; left: number } | null => {
  const steps = [0, 10, 150, 800]
  const to = steps.find(n => n > pet.xp)
  if (to === undefined) return null
  const from = steps[steps.indexOf(to) - 1] ?? 0
  return { percent: ((pet.xp - from) / (to - from)) * 100, left: to - pet.xp }
}

export const STAGE_LABEL: Record<Stage, string> = {
  egg: '蛋',
  baby: '幼年期',
  child: '成長期',
  adult: '成熟期',
}

// 階段加物種，例如：成長期・水獺
export const titleOf = (pet: Pet) => {
  const label = speciesLabel(pet)
  return label ? `${STAGE_LABEL[stage(pet)]}・${label}` : STAGE_LABEL[stage(pet)]
}

export const mood = (pet: Pet) =>
  Math.round(clamp((pet.hunger + pet.joy + pet.energy) / 3 - pet.poops * 10))

export const face = (pet: Pet, isWorking: boolean): string => {
  const s = stage(pet)
  if (s === 'egg') return isWorking ? '(  ⊙ )' : '(    )'
  if (pet.isAsleep) return '(－ω－) zZ'
  if (pet.isSick) return '(×﹏×)'
  if (pet.hunger < 20) return '(´﹃｀)'
  const m = mood(pet)
  if (m < 30) return '(；ω；)'
  if (isWorking) return s === 'adult' ? '(•̀ω•́)و' : '(・ω・)ﾉ'
  if (m >= 75) return s === 'baby' ? '(^ω^)' : 'ヾ(^ω^)ノ'
  return '(・ω・)'
}

// 數值跨過門檻時要提醒一次
export const warnings = (before: Pet, after: Pet): string[] => {
  const out: string[] = []
  const n = after.name
  const from = stage(before)
  const to = stage(after)
  if (from !== to) {
    if (from === 'egg') out.push(`${n} 孵出來了！`)
    else if (to === 'child' && after.species) {
      const sp = SPECIES[after.species]
      out.push(`${n} 長成了${sp.name}（${sp.family}）！`)
    } else if (to === 'adult') out.push(`${n} 長大了，變成${speciesLabel(after) ?? STAGE_LABEL[to]}`)
    else out.push(`${n} 長大了，進入${STAGE_LABEL[to]}`)
  }
  if (!before.isSick && after.isSick) out.push(`${n} 生病了，讓測試變綠、少出點錯，或用 /pet heal 餵藥`)
  if (before.isSick && !after.isSick) out.push(`${n} 病好了！`)
  if (before.hunger >= 20 && after.hunger < 20) out.push(`${n} 肚子餓了`)
  if (before.joy >= 20 && after.joy < 20) out.push(`${n} 覺得好無聊`)
  if (before.isAsleep && !after.isAsleep) out.push(`${n} 睡飽起床了`)
  return out
}

export const bar = (n: number, width = 5) => {
  const full = Math.round((n / 100) * width)
  return '█'.repeat(full) + '░'.repeat(width - full)
}

export const ageDays = (pet: Pet, now: number) => Math.floor((now - pet.bornAt) / (24 * HOUR))

// 這個階段的工作比例，給摘要和側邊欄顯示
export const workShare = (pet: Pet) => {
  const w = workOf(pet)
  const total = w.build + w.run + w.explore || 1
  return {
    build: Math.round((w.build / total) * 100),
    run: Math.round((w.run / total) * 100),
    explore: Math.round((w.explore / total) * 100),
  }
}

export const summary = (pet: Pet, now: number) => {
  const share = workShare(pet)
  return [
    `${face(pet, false)}  ${pet.name}（${titleOf(pet)}，${ageDays(pet, now)} 天大，經驗 ${pet.xp}）`,
    `飽足 ${bar(pet.hunger)} ${Math.round(pet.hunger)}  心情 ${bar(pet.joy)} ${Math.round(pet.joy)}  精神 ${bar(pet.energy)} ${Math.round(pet.energy)}`,
    `病菌 ${bar(germsOf(pet))} ${Math.round(germsOf(pet))}${pet.isSick ? '（生病中）' : ''}`,
    stage(pet) === 'adult' ? '' : `這階段的工作：改檔 ${share.build}%、跑指令 ${share.run}%、查資料 ${share.explore}%`,
    pet.poops > 0 ? `地上有 ${pet.poops} 坨 💩，用 /pet clean 清掉` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

const pad = (n: number) => String(n).padStart(2, '0')

// 毫秒時間轉成 10/02 14:30，用這台電腦的時區
export const stamp = (at: number) => {
  const d = new Date(at)
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const birthday = (pet: Pet) => {
  const d = new Date(pet.bornAt)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// 細節頁：統計數字和最近的大事記，指令和側邊欄共用
export const detail = (pet: Pet, recent = 8) => {
  const st = statsOf(pet)
  return {
    facts: [
      `生日 ${birthday(pet)}`,
      `金幣 ${coinsOf(pet)}（總共賺過 ${st.coinsEarned}）`,
      `陪 Claude 做完 ${st.turns} 輪對話、用了 ${st.tools} 次工具`,
      `看過 ${st.errors} 次報錯、${st.testPasses} 次測試綠燈`,
      `生過 ${st.sickTimes} 次病`,
      `玩了 ${st.games} 局小遊戲、贏 ${st.wins} 局`,
      `吃過 ${st.foods} 份高級食物`,
    ],
    log: (pet.log ?? []).slice(-recent).reverse().map(entry => `${stamp(entry.at)}  ${entry.text}`),
  }
}
