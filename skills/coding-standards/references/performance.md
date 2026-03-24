# Performance Best Practices

### Memoization

```typescript
import { useMemo, useCallback } from 'react'

// ✅ GOOD: Memoize expensive computations
const sortedMarkets = useMemo(() => {
  return markets.sort((a, b) => b.volume - a.volume)
}, [markets])

// ✅ GOOD: Memoize callbacks
const handleSearch = useCallback((query: string) => {
  setSearchQuery(query)
}, [])
```

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react'

// ✅ GOOD: Lazy load heavy components
const HeavyChart = lazy(() => import('./HeavyChart'))

export function Dashboard() {
  return (
    <Suspense fallback={<Spinner />}>
      <HeavyChart />
    </Suspense>
  )
}
```

### Database Queries

```typescript
// ✅ GOOD: Select only needed columns
const { data } = await supabase
  .from('markets')
  .select('id, name, status')
  .limit(10)

// ❌ BAD: Select everything
const { data } = await supabase
  .from('markets')
  .select('*')
```
