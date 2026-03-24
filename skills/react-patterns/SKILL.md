---
name: react-patterns
description: React 前端開發模式，涵蓋 Hooks、狀態管理、Custom Hooks、效能優化與常見反模式。當建構 React 元件、撰寫自定義 Hook、管理狀態或優化效能時觸發。即使使用者沒有明確提到 React patterns，只要涉及 React 開發就應該使用此 skill。
---

# React Frontend Patterns

Modern frontend patterns for React with Hooks and TypeScript.

## When to Activate

- Building React components (composition, props, rendering)
- Managing state (useState, useReducer, Zustand, Context)
- Writing custom hooks (equivalent to Vue composables)
- Implementing data fetching patterns
- Optimizing performance (useMemo, useCallback, React.memo, lazy)
- Working with forms and validation
- Handling error boundaries

## Component Patterns

### Props 型別定義

```typescript
interface UserCardProps {
  user: User
  variant?: 'default' | 'outlined'
  onSelect: (id: string) => void
}

function UserCard({ user, variant = 'default', onSelect }: UserCardProps) {
  return (
    <div className={`card card-${variant}`}>
      <span>{user.name}</span>
      <button onClick={() => onSelect(user.id)}>Select</button>
    </div>
  )
}
```

### Composition 組合模式

```typescript
function Card({ children, variant = 'default' }: CardProps) {
  return <div className={`card card-${variant}`}>{children}</div>
}

function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="card-header">{children}</div>
}

function CardBody({ children }: { children: React.ReactNode }) {
  return <div className="card-body">{children}</div>
}

// Usage
<Card>
  <CardHeader>Title</CardHeader>
  <CardBody>Content</CardBody>
</Card>
```

### Compound Components（複合元件）

```typescript
const TabsContext = createContext<{
  activeTab: string
  setActiveTab: (tab: string) => void
} | undefined>(undefined)

function Tabs({ children, defaultTab }: { children: React.ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  )
}

function Tab({ id, children }: { id: string; children: React.ReactNode }) {
  const context = useContext(TabsContext)
  if (!context) throw new Error('Tab must be used within Tabs')
  return (
    <button
      className={context.activeTab === id ? 'active' : ''}
      onClick={() => context.setActiveTab(id)}
    >
      {children}
    </button>
  )
}
```

## Custom Hooks（等同 Vue Composables）

### 資料取得 Hook

```typescript
export function useQuery<T>(key: string, fetcher: () => Promise<T>, options?: {
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
  enabled?: boolean
}) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetcher()
      setData(result)
      options?.onSuccess?.(result)
    } catch (err) {
      const error = err as Error
      setError(error)
      options?.onError?.(error)
    } finally {
      setLoading(false)
    }
  }, [fetcher, options])

  useEffect(() => {
    if (options?.enabled !== false) refetch()
  }, [key])

  return { data, error, loading, refetch }
}
```

### Debounce Hook

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Usage
const [query, setQuery] = useState('')
const debouncedQuery = useDebounce(query, 500)
```

### Toggle Hook

```typescript
export function useToggle(initialValue = false): [boolean, () => void] {
  const [value, setValue] = useState(initialValue)
  const toggle = useCallback(() => setValue(v => !v), [])
  return [value, toggle]
}
```

## State Management

### Context + Reducer

```typescript
interface State {
  items: Item[]
  selected: Item | null
  loading: boolean
}

type Action =
  | { type: 'SET_ITEMS'; payload: Item[] }
  | { type: 'SELECT'; payload: Item }
  | { type: 'SET_LOADING'; payload: boolean }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload }
    case 'SELECT':
      return { ...state, selected: action.payload }
    case 'SET_LOADING':
      return { ...state, loading: action.payload }
  }
}

const ItemContext = createContext<{
  state: State
  dispatch: Dispatch<Action>
} | undefined>(undefined)

export function ItemProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    items: [],
    selected: null,
    loading: false
  })
  return (
    <ItemContext.Provider value={{ state, dispatch }}>
      {children}
    </ItemContext.Provider>
  )
}

export function useItems() {
  const context = useContext(ItemContext)
  if (!context) throw new Error('useItems must be used within ItemProvider')
  return context
}
```

### Zustand（輕量替代 Redux）

```typescript
import { create } from 'zustand'

interface UserStore {
  users: User[]
  loading: boolean
  fetchUsers: () => Promise<void>
}

export const useUserStore = create<UserStore>((set) => ({
  users: [],
  loading: false,
  fetchUsers: async () => {
    set({ loading: true })
    try {
      const users = await api.getUsers()
      set({ users })
    } finally {
      set({ loading: false })
    }
  }
}))
```

## 效能優化

```typescript
// useMemo — 昂貴計算快取
const sortedList = useMemo(() => [...items].sort((a, b) => b.score - a.score), [items])

// useCallback — 傳給子元件的函式穩定參考
const handleClick = useCallback((id: string) => setSelected(id), [])

// React.memo — 純元件避免不必要 re-render
const ItemCard = React.memo<ItemCardProps>(({ item }) => (
  <div>{item.name}</div>
))

// lazy + Suspense — 懶載入
const HeavyChart = lazy(() => import('./HeavyChart'))

<Suspense fallback={<Skeleton />}>
  <HeavyChart data={data} />
</Suspense>

// Virtualization — 大型列表
import { useVirtualizer } from '@tanstack/react-virtual'
```

## Error Boundary

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong</div>
    }
    return this.props.children
  }
}

// Usage
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

## 表單處理

```typescript
const [form, setForm] = useState({ email: '', name: '' })
const [errors, setErrors] = useState<Record<string, string>>({})

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.email.includes('@')) e.email = 'Invalid email'
  if (!form.name.trim()) e.name = 'Name is required'
  setErrors(e)
  return Object.keys(e).length === 0
}

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  if (!validate()) return
  await submitForm(form)
}
```

> 如果專案有引入 Zod，可改用 `schema.safeParse()` 取代手動 validate。

## 常見反模式（避免）

```typescript
// ❌ 在 render 中建立物件/陣列（每次 re-render 都是新參考）
<Child style={{ color: 'red' }} items={[1, 2, 3]} />
// ✅ 提到外層或 useMemo
const style = useMemo(() => ({ color: 'red' }), [])

// ❌ useEffect 依賴陣列遺漏
useEffect(() => { fetchData(userId) }, []) // userId 變了不會重新 fetch
// ✅ 加入依賴
useEffect(() => { fetchData(userId) }, [userId])

// ❌ 直接修改 state
state.items.push(newItem)
// ✅ 不可變更新
setItems(prev => [...prev, newItem])

// ❌ 把所有東西塞進一個 useEffect
useEffect(() => { fetchA(); fetchB(); subscribe() }, [])
// ✅ 拆成獨立 effect
useEffect(() => { fetchA() }, [depA])
useEffect(() => { fetchB() }, [depB])
useEffect(() => { const unsub = subscribe(); return unsub }, [])

// ❌ 不必要的 state（可從現有 state 推導的值）
const [items, setItems] = useState([])
const [count, setCount] = useState(0) // 多餘
// ✅ 直接計算
const count = items.length
```
