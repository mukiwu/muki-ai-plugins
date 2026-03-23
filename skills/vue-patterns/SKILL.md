---
name: vue-patterns
description: Vue 3 前端開發模式，涵蓋 Composition API、Pinia 狀態管理、composables 與效能優化
---

# Vue 3 Frontend Patterns

Modern frontend patterns for Vue 3 with Composition API.

## When to Activate

- Building Vue 3 components (Composition API, props, emits)
- Managing state with Pinia
- Writing composables (equivalent to React custom hooks)
- Implementing data fetching patterns
- Optimizing performance (computed, v-memo, defineAsyncComponent)
- Working with forms and validation
- Using provide/inject for cross-component state

## Component Patterns

### defineProps / defineEmits（強型別）

```typescript
interface Props {
  user: User
  variant?: 'default' | 'outlined'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  select: [id: string]
  close: []
}>()

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})
```

### Composition API 基本結構

```typescript
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'

const count = ref(0)
const doubled = computed(() => count.value * 2)

watch(count, (newVal, oldVal) => {
  console.log(`changed from ${oldVal} to ${newVal}`)
})

onMounted(() => {
  // 初始化邏輯
})
</script>
```

### provide / inject（跨層傳遞）

```typescript
// 父層
const theme = ref<'light' | 'dark'>('light')
provide('theme', theme)

// 子孫層
const theme = inject<Ref<'light' | 'dark'>>('theme')
```

## Composables（等同 React Custom Hooks）

### 資料取得 Composable

```typescript
export function useQuery<T>(fetcher: () => Promise<T>) {
  const data = ref<T | null>(null)
  const loading = ref(false)
  const error = ref<Error | null>(null)

  async function refetch() {
    loading.value = true
    error.value = null
    try {
      data.value = await fetcher()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  }

  refetch()
  return { data, loading, error, refetch }
}
```

### Debounce Composable

```typescript
export function useDebounce<T>(source: Ref<T>, delay: number) {
  const debounced = ref<T>(source.value) as Ref<T>

  watch(source, (val) => {
    const timer = setTimeout(() => { debounced.value = val }, delay)
    return () => clearTimeout(timer)
  })

  return debounced
}
```

## State Management（Pinia）

```typescript
export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const loading = ref(false)

  const activeUsers = computed(() => users.value.filter(u => u.active))

  async function fetchUsers() {
    loading.value = true
    try {
      users.value = await api.getUsers()
    } finally {
      loading.value = false
    }
  }

  return { users, loading, activeUsers, fetchUsers }
})
```

## 效能優化

```typescript
// computed 取代 methods 做計算
const sortedList = computed(() => [...items.value].sort(...))

// v-memo（大型列表）
<div v-for="item in list" :key="item.id" v-memo="[item.id, selected === item.id]">

// defineAsyncComponent（懶載入）
const HeavyChart = defineAsyncComponent(() => import('./HeavyChart.vue'))
```

## 表單處理

```typescript
const form = ref({ email: '', name: '' })
const errors = ref<Record<string, string>>({})

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.value.email.includes('@')) e.email = '請輸入有效的 Email'
  if (!form.value.name.trim()) e.name = '名稱不能為空'
  errors.value = e
  return Object.keys(e).length === 0
}

async function handleSubmit() {
  if (!validate()) return
  await submitForm(form.value)
}
```

> 如果專案有引入 Zod（需要 TypeScript），可改用 `schema.safeParse()` 取代手動 validate。

## 常見反模式（避免）

```typescript
// ❌ 直接修改 props
props.user.name = 'new name'
// ✅ emit 讓父層處理
emit('update:user', { ...props.user, name: 'new name' })

// ❌ v-for 與 v-if 同元素
<div v-for="item in list" v-if="item.active">
// ✅ computed 過濾
const activeList = computed(() => list.value.filter(i => i.active))

// ❌ 忘記 .value
count = 1
// ✅
count.value = 1
```
