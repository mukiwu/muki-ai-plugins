import type { Lineage, Pet, Skin } from '../types'
import { mood, stage } from './pet'

// 把一段 ASCII 圖拆成行，去掉頭尾空行，每行補到一樣寬，整塊靠左對齊才不會歪
const art = (raw: string): string[] => {
  const lines = raw.split('\n')
  while (lines[0]?.trim() === '') lines.shift()
  while (lines.at(-1)?.trim() === '') lines.pop()
  const width = Math.max(...lines.map(line => line.length))
  return lines.map(line => line.padEnd(width))
}

// 畫面裡的 L、R 是左右眼，M 是嘴巴，畫的時候換成表情；圖裡其他地方不要用這三個大寫字母
const BABY = art(String.raw`
   .-"""-.
  /       \
 |  L   R  |
 |    M    |
  \       /
   '-...-'
`)

// 成長期依物種長出不同的樣子
const CHILD: Record<Lineage, string[]> = {
  // 鼴鼠：小眼睛、大鼻子、挖土的爪子
  build: art(String.raw`
     _.----._
    /  L  R  \
   |   (M)    |
  /|  '----'  |\
 (_/\________/\_)
    ^^      ^^
`),
  // 水獺：鬍鬚、圓肚子、一條尾巴泡在水裡
  run: art(String.raw`
     .-"""-.
   _/ L   R \_
 =-    .M.    -=
    \ '---' /
    /       \__
   (_/'---'\_~~~~
`),
  // 貓頭鷹：尖耳朵、大圓眼、收起來的翅膀
  explore: art(String.raw`
    /\_______/\
   (  (L) (R)  )
    \    M    /
    /'"""""""'\
   ( \       / )
    '"^^---^^"'
`),
  // 奇美拉：貓臉、背上一片小翅膀
  mixed: art(String.raw`
    /\_/\     _
   ( L R )   / )
   =( M )= _/ /
    )   (_/  /
   (__)-(__)'
`),
}

// 成熟期在頭上多一個標誌：安全帽、水泡、羽冠、星星
const CROWN: Record<Lineage, string[]> = {
  build: art(String.raw`
      _____
    _|_____|_
`),
  run: art(String.raw`
     o  .  O
`),
  explore: art(String.raw`
      \ | /
`),
  mixed: art(String.raw`
     *  .  *
`),
}

const EGG = [
  art(String.raw`
    .--.
   /    \
  |      |
  |      |
   \____/
`),
  art(String.raw`
    .--.
   / /\ \
  | /  \/|
  |      |
   \____/
`),
] as const

export type Mode = 'idle' | 'working' | 'sleep' | 'sick' | 'hungry' | 'sad'

export const modeOf = (pet: Pet, isWorking: boolean): Mode => {
  if (pet.isAsleep) return 'sleep'
  if (pet.isSick) return 'sick'
  if (pet.hunger < 20) return 'hungry'
  if (mood(pet) < 30) return 'sad'
  return isWorking ? 'working' : 'idle'
}

const EXPRESSION: Record<Mode, { eye: string; mouth: string }> = {
  idle: { eye: 'o', mouth: 'w' },
  working: { eye: '^', mouth: 'v' },
  sleep: { eye: '-', mouth: '.' },
  sick: { eye: 'x', mouth: '~' },
  hungry: { eye: 'o', mouth: 'O' },
  sad: { eye: 'T', mouth: 'n' },
}

const SPARKLES = ['  ✦     ✧  ', ' ✧    ✦    ', '    ✦    ✧ ', ' ✦   ✧     ']
const FEVER = ['   +   +   ', '  +   +    ', '   +    +  ', '    +   +  ']
const SNORE = ['        z  ', '         Z ', '       z   ', '          Z']

const bodyOf = (pet: Pet): string[] => {
  const s = stage(pet)
  if (s === 'baby' || s === 'egg') return BABY
  const species = pet.species ?? 'mixed'
  if (s === 'child') return CHILD[species]
  // 頭飾和身體寬度不同，一起再補一次寬
  return art([...CROWN[species], ...CHILD[species]].join('\n'))
}

export type Frame = { effect: string; body: string[]; caption: string }

// frame 每半秒加 1，所有動畫都從它算出來
export const drawFrame = (pet: Pet, isWorking: boolean, frame: number): Frame => {
  const s = stage(pet)
  const mode = modeOf(pet, isWorking)
  const bounce = mode === 'working' ? frame % 2 === 1 : Math.floor(frame / 2) % 2 === 1

  if (s === 'egg') {
    const wobble = isWorking && frame % 2 === 1
    const body = [...EGG[pet.xp >= 5 ? 1 : 0]].map(line => (wobble ? ` ${line.slice(0, -1)}` : line))
    return { effect: '', body, caption: pet.xp >= 5 ? '蛋殼裂開了…' : '在蛋裡睡覺' }
  }

  const blink = mode === 'idle' && frame % 9 === 0
  const { eye, mouth } = blink ? { eye: '-', mouth: EXPRESSION.idle.mouth } : EXPRESSION[mode]
  const lines = bodyOf(pet).map(line => line.replace('L', eye).replace('R', eye).replace('M', mouth))
  // 彈跳：身體上移一行，把空行補到下面
  const body = mode === 'sleep' || mode === 'sad' || mode === 'sick' || !bounce ? ['', ...lines] : [...lines, '']

  const effect =
    mode === 'working' ? (SPARKLES[frame % SPARKLES.length] ?? '')
    : mode === 'sleep' ? (SNORE[frame % SNORE.length] ?? '')
    : mode === 'sick' ? (FEVER[frame % FEVER.length] ?? '')
    : ''

  const caption = {
    idle: '悠哉中',
    working: '正在幫 Claude 加油！',
    sleep: '呼…呼…',
    sick: '生病了…測試變綠牠就會好',
    hungry: '肚子好餓…',
    sad: '有點寂寞…',
  }[mode]

  return { effect, body, caption }
}

// price 是商店售價，0 是一開始就有的
export const SKINS: Record<Skin, { label: string; price: number; body?: string; accent?: string }> = {
  pink: { label: '粉紅', price: 0, body: '#ff9ecf', accent: '#ffd1e8' },
  mono: { label: '單色', price: 0 },
  mint: { label: '薄荷', price: 150, body: '#7be0c3', accent: '#c7f5e8' },
  sky: { label: '天空', price: 150, body: '#79b8ff', accent: '#c8e1ff' },
  gold: { label: '金色', price: 400, body: '#ffcc66', accent: '#fff0c2' },
  neon: { label: '霓虹', price: 800 },
  rainbow: { label: '彩虹', price: 1200 },
  galaxy: { label: '星河', price: 1500 },
}

export const SKIN_ORDER: Skin[] = ['pink', 'mono', 'mint', 'sky', 'gold', 'neon', 'rainbow', 'galaxy']

const RAINBOW = ['#ff6188', '#fc9867', '#ffd866', '#a9dc76', '#78dce8', '#ab9df2']
const NEON = ['#ff2ec4', '#00f0ff']
const GALAXY = ['#3b1e7a', '#5b3fbf', '#7597de', '#b9a6ff', '#e6dcff', '#b9a6ff', '#7597de', '#5b3fbf']

export const skinOf = (pet: Pet): Skin => pet.skin ?? 'pink'

// 第 row 行在第 frame 格要用的顏色
// 彩虹每行不同色、往下流；霓虹整隻在兩色之間閃；星河是深紫到淡紫的漸層慢慢流動
export const lineColor = (skin: Skin, row: number, frame: number) => {
  if (skin === 'rainbow') return RAINBOW[(row + frame) % RAINBOW.length]
  if (skin === 'neon') return NEON[Math.floor(frame / 2) % NEON.length]
  if (skin === 'galaxy') return GALAXY[(row + Math.floor(frame / 2)) % GALAXY.length]
  return SKINS[skin].body
}

export const accentColor = (skin: Skin, frame: number) => {
  if (skin === 'rainbow') return RAINBOW[frame % RAINBOW.length]
  if (skin === 'neon') return NEON[(Math.floor(frame / 2) + 1) % NEON.length]
  if (skin === 'galaxy') return GALAXY[(Math.floor(frame / 2) + 4) % GALAXY.length]
  return SKINS[skin].accent
}

// 商店預覽：第 i 個字的背景色，會變化的顏色也跟著動畫流動
export const previewColor = (skin: Skin, i: number, frame: number): string | undefined => {
  if (skin === 'rainbow') return RAINBOW[(i + frame) % RAINBOW.length]
  if (skin === 'neon') return NEON[(i + Math.floor(frame / 2)) % NEON.length]
  if (skin === 'galaxy') return GALAXY[(i + Math.floor(frame / 2)) % GALAXY.length]
  return SKINS[skin].body
}

// 背景亮就用深色字，背景暗就用淺色字
export const inkOn = (background: string) => {
  const n = Number.parseInt(background.slice(1), 16)
  const luminance = 0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)
  return luminance > 140 ? '#1b1b1b' : '#f5f5f5'
}

export const SICK_COLOR = '#a9dc76'

export const statColor = (n: number) => (n >= 60 ? '#a9dc76' : n >= 30 ? '#ffd866' : '#ff6188')
