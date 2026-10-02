export type Skin = 'pink' | 'mint' | 'sky' | 'gold' | 'mono' | 'rainbow' | 'neon' | 'galaxy'

// build 是改檔案（陸），run 是跑指令（水），explore 是查資料（空），mixed 是什麼都做
export type Lineage = 'build' | 'run' | 'explore' | 'mixed'

export type Work = { build: number; run: number; explore: number }

export type Pet = {
  name: string
  bornAt: number
  lastTick: number
  // 0 到 100，越高越好
  hunger: number
  joy: number
  energy: number
  xp: number
  poops: number
  feeds: number
  isAsleep: boolean
  // 以下欄位舊存檔沒有，讀的時候補預設值
  skin?: Skin
  // 目前這個階段累積的工作量，進入成長期、成熟期時拿來決定物種
  work?: Work
  // 進入成長期時決定的物種
  species?: Lineage
  // 進入成熟期時，依成長期的工作再分化一次
  trait?: Lineage
  // 0 到 100，工具報錯會增加，累積太多就生病
  germs?: number
  isSick?: boolean
  coins?: number
  // 買過的顏色樣式；舊存檔只有免費的和當時正在用的
  ownedSkins?: Skin[]
  stats?: Stats
  log?: LogEntry[]
}

export type Stats = {
  turns: number
  tools: number
  errors: number
  testPasses: number
  games: number
  wins: number
  sickTimes: number
  foods: number
  coinsEarned: number
}

// 細節頁的大事記，at 是毫秒時間
export type LogEntry = { at: number; text: string }

export type View = 'home' | 'shop' | 'detail'

export type Game =
  | { kind: 'rps'; line: string }
  | { kind: 'guess'; secret: number; triesLeft: number; line: string; isOver: boolean }

declare module 'claude-code' {
  interface PluginState {
    'hyday-pet': {
      pet: Pet | null
      isHidden: boolean
      isPaneOpen: boolean
      isWorking: boolean
      frame: number
      // null 是寵物首頁，其他是正在玩的小遊戲
      game: Game | null
      view: View
    }
  }
}
