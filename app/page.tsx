import { RestaurantGrid } from '@/components/restaurant-grid'
import { redis, REDIS_KEYS } from '@/lib/redis'
import type { District, Restaurant } from '@/lib/types'

async function getInitialData() {
  try {
    const [restaurants, districts, lastSync] = await Promise.all([
      redis.get<Restaurant[]>(REDIS_KEYS.ALL_RESTAURANTS),
      redis.get<District[]>(REDIS_KEYS.DISTRICTS),
      redis.get<string>(REDIS_KEYS.LAST_SYNC),
    ])

    const safeRestaurants = restaurants || []

    return {
      restaurants: safeRestaurants,
      districts: districts || [],
      totalCount: safeRestaurants.length,
      lastSync: lastSync || null,
      needsSync: safeRestaurants.length === 0,
    }
  } catch (error) {
    return {
      restaurants: [],
      districts: [],
      totalCount: 0,
      lastSync: null,
      needsSync: true,
      error: error instanceof Error ? error.message : 'Failed to load restaurants',
    }
  }
}

export default async function Home() {
  const initialData = await getInitialData()

  return (
    <main className="min-h-screen bg-background">
      <RestaurantGrid initialData={initialData} />
    </main>
  )
}
