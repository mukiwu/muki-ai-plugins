import type { Game, Pet } from '../types'
import { addLog, bump, earn, gainXp, stage } from './pet'

const clamp = (n: number) => Math.max(0, Math.min(100, n))

// 玩不了的時候回傳原因
export const cannotPlay = (pet: Pet): string | undefined => {
  if (stage(pet) === 'egg') return `${pet.name} 還是一顆蛋`
  if (pet.isAsleep) return `${pet.name} 在睡覺`
  if (pet.isSick) return `${pet.name} 生病了，不想玩`
  if (pet.energy < 10) return `${pet.name} 太累了，讓牠睡一下吧`
  return undefined
}

// 每玩一局都會耗體力、肚子會餓，心情、經驗和金幣看輸贏
const reward = (pet: Pet, joy: number, xp: number, coins: number, isWin: boolean): Pet => {
  const played = bump(earn(pet, coins), 'games')
  const tired = {
    ...(isWin ? bump(played, 'wins') : played),
    joy: clamp(pet.joy + joy),
    energy: clamp(pet.energy - 6),
    hunger: clamp(pet.hunger - 3),
  }
  // 經驗走 gainXp，玩遊戲剛好跨過門檻也會進化
  return gainXp(tired, xp)
}

export const HANDS = ['石頭', '剪刀', '布'] as const
export type Hand = 0 | 1 | 2

// 0 石頭贏 1 剪刀，1 剪刀贏 2 布，2 布贏 0 石頭
export const judge = (mine: Hand, theirs: Hand): 'win' | 'lose' | 'draw' =>
  mine === theirs ? 'draw' : (mine + 1) % 3 === theirs ? 'win' : 'lose'

export const playRps = (pet: Pet, mine: Hand, theirs: Hand): { pet: Pet; game: Game } => {
  const result = judge(mine, theirs)
  const verdict = { win: '你贏了！金幣 +3', lose: `${pet.name} 贏了，得意洋洋`, draw: '平手，再一次' }[result]
  const line = `你出${HANDS[mine]}，${pet.name} 出${HANDS[theirs]}，${verdict}`
  // 寵物贏了也開心，只是你贏的時候牠學到比較多
  const next =
    result === 'win' ? reward(pet, 15, 2, 3, true) : result === 'lose' ? reward(pet, 10, 1, 1, false) : reward(pet, 8, 1, 1, false)
  return { pet: next, game: { kind: 'rps', line } }
}

export const GUESS_TRIES = 3

export const startGuess = (pet: Pet, secret: number): Game => ({
  kind: 'guess',
  secret,
  triesLeft: GUESS_TRIES,
  line: `${pet.name} 心裡想了一個 1 到 9 的數字，你有 ${GUESS_TRIES} 次機會`,
  isOver: false,
})

export const guess = (pet: Pet, game: Extract<Game, { kind: 'guess' }>, n: number): { pet: Pet; game: Game } => {
  if (game.isOver) return { pet, game }
  if (n === game.secret) {
    return {
      pet: addLog(reward(pet, 25, 3, 8, true), '猜數字猜中了'),
      game: { ...game, isOver: true, line: `猜中了！就是 ${n}，${pet.name} 開心得轉圈圈，金幣 +8` },
    }
  }
  const triesLeft = game.triesLeft - 1
  if (triesLeft === 0) {
    return {
      pet: reward(pet, 8, 1, 1, false),
      game: { ...game, triesLeft, isOver: true, line: `沒猜到，答案是 ${game.secret}，${pet.name} 偷笑` },
    }
  }
  const hint = n < game.secret ? '再大一點' : '再小一點'
  return { pet, game: { ...game, triesLeft, line: `不是 ${n}，${hint}（還剩 ${triesLeft} 次）` } }
}
