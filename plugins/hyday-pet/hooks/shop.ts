import type { Pet, Skin } from '../types'
import { addLog, bump, coinsOf, germsOf, stage, withGerms } from './pet'
import { SKIN_ORDER, SKINS, skinOf } from './sprites'

const clamp = (n: number) => Math.max(0, Math.min(100, n))

export type FoodId = 'cake' | 'drink' | 'salad' | 'bento'

// 高級食物買了就直接餵，效果比一般餵食好；只有沙拉不會讓牠想大便
export const FOODS: Record<FoodId, { label: string; price: number; effect: string; feed: (pet: Pet) => Pet }> = {
  cake: {
    label: '草莓蛋糕',
    price: 25,
    effect: '飽足 +40、心情 +15',
    feed: pet => ({ ...pet, hunger: clamp(pet.hunger + 40), joy: clamp(pet.joy + 15) }),
  },
  drink: {
    label: '能量飲料',
    price: 30,
    effect: '精神 +40',
    feed: pet => ({ ...pet, energy: clamp(pet.energy + 40), hunger: clamp(pet.hunger + 5) }),
  },
  salad: {
    label: '有機沙拉',
    price: 35,
    effect: '飽足 +30、病菌 -15、不會大便',
    feed: pet => withGerms({ ...pet, hunger: clamp(pet.hunger + 30) }, germsOf(pet) - 15),
  },
  bento: {
    label: '豪華便當',
    price: 60,
    effect: '飽足全滿、心情和精神 +10',
    feed: pet => ({ ...pet, hunger: 100, joy: clamp(pet.joy + 10), energy: clamp(pet.energy + 10) }),
  },
}

export const FOOD_ORDER: FoodId[] = ['cake', 'drink', 'salad', 'bento']

// 舊存檔沒有買過的紀錄，就當成只有免費的和當時正在用的那個
export const ownedSkins = (pet: Pet): Skin[] => {
  const free = SKIN_ORDER.filter(skin => SKINS[skin].price === 0)
  return [...new Set([...free, ...(pet.ownedSkins ?? []), skinOf(pet)])]
}

export const owns = (pet: Pet, skin: Skin) => ownedSkins(pet).includes(skin)

export type Sale = { pet: Pet; say: string }

const short = (pet: Pet, price: number) => `金幣不夠，還差 ${price - coinsOf(pet)}`

export const buyFood = (pet: Pet, id: FoodId): Sale => {
  const food = FOODS[id]
  if (stage(pet) === 'egg') return { pet, say: `${pet.name} 還是一顆蛋，吃不了東西` }
  if (pet.isAsleep) return { pet, say: `${pet.name} 在睡覺，醒來再吃` }
  if (coinsOf(pet) < food.price) return { pet, say: short(pet, food.price) }
  // 沙拉以外都算一次餵食，每三次會大一坨
  const paid = { ...pet, coins: coinsOf(pet) - food.price }
  const feeds = id === 'salad' ? pet.feeds : pet.feeds + 1
  const poops = id !== 'salad' && feeds % 3 === 0 ? pet.poops + 1 : pet.poops
  const fed = bump(food.feed({ ...paid, feeds, poops }), 'foods')
  return { pet: addLog(fed, `吃了${food.label}`), say: `${pet.name} 吃了${food.label}，好幸福` }
}

export const buySkin = (pet: Pet, skin: Skin): Sale => {
  const { label, price } = SKINS[skin]
  if (owns(pet, skin)) return { pet: { ...pet, skin }, say: `換成${label}了` }
  if (coinsOf(pet) < price) return { pet, say: short(pet, price) }
  const bought = { ...pet, coins: coinsOf(pet) - price, ownedSkins: [...ownedSkins(pet), skin], skin }
  return { pet: addLog(bought, `買了${label}顏色`), say: `買下${label}，馬上換上了` }
}

export const findFood = (word: string): FoodId | undefined =>
  FOOD_ORDER.find(id => id === word || FOODS[id].label === word || FOODS[id].label.endsWith(word))
