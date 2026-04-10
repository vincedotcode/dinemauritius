import { Redis } from '@upstash/redis'

export const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

// Keys for storing restaurant data
export const REDIS_KEYS = {
  ALL_RESTAURANTS: 'mauritius:restaurants:all',
  RESTAURANT_DETAILS: (id: string) => `mauritius:restaurant:${id}`,
  RESTAURANT_REVIEWS: (id: string) => `mauritius:restaurant:${id}:reviews`,
  RESTAURANT_PHOTOS: (id: string) => `mauritius:restaurant:${id}:photos`,
  DISTRICTS: 'mauritius:districts',
  LAST_SYNC: 'mauritius:last_sync',
  SYNC_STATUS: 'mauritius:sync_status',
}
