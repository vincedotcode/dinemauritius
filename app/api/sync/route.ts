import { NextResponse } from 'next/server'
import { redis, REDIS_KEYS } from '@/lib/redis'
import type { Restaurant, District } from '@/lib/types'

// Increase Vercel function timeout (60s max on Hobby, 300s on Pro)
export const maxDuration = 60

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY!

// All districts of Mauritius with their approximate center coordinates
const MAURITIUS_DISTRICTS: District[] = [
  { name: 'Port Louis', coordinates: { lat: -20.1609, lng: 57.5012 }, restaurantCount: 0 },
  { name: 'Pamplemousses', coordinates: { lat: -20.1033, lng: 57.5706 }, restaurantCount: 0 },
  { name: 'Rivière du Rempart', coordinates: { lat: -20.0558, lng: 57.6833 }, restaurantCount: 0 },
  { name: 'Flacq', coordinates: { lat: -20.1894, lng: 57.7147 }, restaurantCount: 0 },
  { name: 'Grand Port', coordinates: { lat: -20.3783, lng: 57.6606 }, restaurantCount: 0 },
  { name: 'Savanne', coordinates: { lat: -20.4739, lng: 57.4833 }, restaurantCount: 0 },
  { name: 'Plaines Wilhems', coordinates: { lat: -20.2347, lng: 57.4833 }, restaurantCount: 0 },
  { name: 'Moka', coordinates: { lat: -20.2167, lng: 57.5000 }, restaurantCount: 0 },
  { name: 'Black River', coordinates: { lat: -20.3500, lng: 57.3667 }, restaurantCount: 0 },
  { name: 'Grand Baie', coordinates: { lat: -20.0167, lng: 57.5833 }, restaurantCount: 0 },
  { name: 'Flic en Flac', coordinates: { lat: -20.2758, lng: 57.3647 }, restaurantCount: 0 },
  { name: 'Curepipe', coordinates: { lat: -20.3167, lng: 57.5167 }, restaurantCount: 0 },
  { name: 'Quatre Bornes', coordinates: { lat: -20.2650, lng: 57.4794 }, restaurantCount: 0 },
  { name: 'Rose Hill', coordinates: { lat: -20.2456, lng: 57.4681 }, restaurantCount: 0 },
  { name: 'Mahebourg', coordinates: { lat: -20.4081, lng: 57.7000 }, restaurantCount: 0 },
  { name: 'Belle Mare', coordinates: { lat: -20.1917, lng: 57.7667 }, restaurantCount: 0 },
  { name: 'Tamarin', coordinates: { lat: -20.3258, lng: 57.3692 }, restaurantCount: 0 },
  { name: 'Trou aux Biches', coordinates: { lat: -20.0333, lng: 57.5500 }, restaurantCount: 0 },
]

type NearbySearchResponse = {
  results: any[]
  nextPageToken?: string
  status: string
  errorMessage?: string
}

async function fetchNearbyRestaurants(
  lat: number,
  lng: number,
  pageToken?: string,
  attempt = 0
): Promise<NearbySearchResponse> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json')
  url.searchParams.set('location', `${lat},${lng}`)
  url.searchParams.set('radius', '10000') // 10km radius
  url.searchParams.set('type', 'restaurant')
  url.searchParams.set('key', GOOGLE_API_KEY)

  if (pageToken) {
    url.searchParams.set('pagetoken', pageToken)
  }

  const response = await fetch(url.toString(), { cache: 'no-store' })
  const data = await response.json()

  // next_page_token can briefly return INVALID_REQUEST before it becomes valid
  if (pageToken && data.status === 'INVALID_REQUEST' && attempt < 4) {
    await new Promise(resolve => setTimeout(resolve, 2000))
    return fetchNearbyRestaurants(lat, lng, pageToken, attempt + 1)
  }

  return {
    results: data.results || [],
    nextPageToken: data.next_page_token,
    status: data.status,
    errorMessage: data.error_message,
  }
}

function transformToRestaurant(place: any, district: string): Restaurant {
  const photoUrls = (place.photos || []).slice(0, 5).map((photo: any) =>
    `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`
  )

  return {
    id: place.place_id,
    name: place.name,
    address: place.formatted_address || place.vicinity || '',
    rating: place.rating || 0,
    userRatingsTotal: place.user_ratings_total || 0,
    priceLevel: place.price_level,
    types: place.types || [],
    photoUrl: photoUrls[0] || null,
    photoUrls,
    location: {
      lat: place.geometry?.location?.lat || 0,
      lng: place.geometry?.location?.lng || 0,
    },
    district,
    isOpenNow: place.opening_hours?.open_now,
  }
}

export async function POST() {
  try {
    // Check if sync is already running
    const currentStatus = await redis.get<{ isRunning: boolean }>(REDIS_KEYS.SYNC_STATUS)
    if (currentStatus?.isRunning) {
      return NextResponse.json({ error: 'Sync already in progress' }, { status: 409 })
    }

    // Mark sync as running
    await redis.set(REDIS_KEYS.SYNC_STATUS, {
      isRunning: true,
      progress: 0,
      currentDistrict: '',
      totalRestaurants: 0,
      lastSync: null,
    })

    // Load any previously synced restaurants so we can append to them
    const existing = await redis.get<Restaurant[]>(REDIS_KEYS.ALL_RESTAURANTS)
    const allRestaurants: Map<string, Restaurant> = new Map(
      (existing || []).map(r => [r.id, r])
    )

    const districtsWithCounts: District[] = []

    for (let i = 0; i < MAURITIUS_DISTRICTS.length; i++) {
      const district = MAURITIUS_DISTRICTS[i]

      // Update progress
      await redis.set(REDIS_KEYS.SYNC_STATUS, {
        isRunning: true,
        progress: Math.round((i / MAURITIUS_DISTRICTS.length) * 100),
        currentDistrict: district.name,
        totalRestaurants: allRestaurants.size,
        lastSync: null,
      })

      let pageToken: string | undefined
      let pages = 0

      do {
        // Google requires a short delay before using next_page_token
        if (pageToken) {
          await new Promise(resolve => setTimeout(resolve, 2000))
        }

        const { results, nextPageToken, status, errorMessage } = await fetchNearbyRestaurants(
          district.coordinates.lat,
          district.coordinates.lng,
          pageToken
        )

        if (status !== 'OK' && status !== 'ZERO_RESULTS') {
          await redis.set(REDIS_KEYS.SYNC_STATUS, {
            isRunning: true,
            progress: Math.round((i / MAURITIUS_DISTRICTS.length) * 100),
            currentDistrict: district.name,
            totalRestaurants: allRestaurants.size,
            lastSync: null,
            error: `Google API error: ${status}${errorMessage ? ` - ${errorMessage}` : ''}`,
          })
          // Stop pagination on error but continue with next district
          break
        }

        for (const place of results) {
          const existingRestaurant = allRestaurants.get(place.place_id)
          const nextRestaurant = transformToRestaurant(
            place,
            existingRestaurant?.district || district.name
          )

          allRestaurants.set(place.place_id, existingRestaurant
            ? {
                ...existingRestaurant,
                ...nextRestaurant,
                district: existingRestaurant.district || district.name,
              }
            : nextRestaurant)
        }

        pageToken = nextPageToken
        pages++
        // Cap at 3 pages per district to keep within timeout budget
        if (pages >= 3) break
      } while (pageToken)

      const districtCount = Array.from(allRestaurants.values()).filter(
        restaurant => restaurant.district === district.name
      ).length

      districtsWithCounts.push({ ...district, restaurantCount: districtCount })

      // Store incrementally after each district so partial results are saved even if we timeout
      const snapshot = Array.from(allRestaurants.values())
      await redis.set(REDIS_KEYS.ALL_RESTAURANTS, snapshot)
      await redis.set(REDIS_KEYS.DISTRICTS, districtsWithCounts)
    }

    const syncTime = new Date().toISOString()
    await redis.set(REDIS_KEYS.LAST_SYNC, syncTime)
    await redis.set(REDIS_KEYS.SYNC_STATUS, {
      isRunning: false,
      progress: 100,
      currentDistrict: 'Complete',
      totalRestaurants: allRestaurants.size,
      lastSync: syncTime,
    })

    return NextResponse.json({
      success: true,
      totalRestaurants: allRestaurants.size,
      districts: districtsWithCounts,
      syncTime,
    })
  } catch (error) {
    console.error('Sync error:', error)

    await redis.set(REDIS_KEYS.SYNC_STATUS, {
      isRunning: false,
      progress: 0,
      currentDistrict: '',
      totalRestaurants: 0,
      lastSync: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return NextResponse.json({ error: 'Failed to sync restaurants' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const status = await redis.get(REDIS_KEYS.SYNC_STATUS)
    const lastSync = await redis.get(REDIS_KEYS.LAST_SYNC)

    return NextResponse.json({
      status: status || { isRunning: false, progress: 0, totalRestaurants: 0 },
      lastSync,
    })
  } catch (error) {
    console.error('Sync status error:', error)
    return NextResponse.json({
      status: { isRunning: false, progress: 0, totalRestaurants: 0 },
      lastSync: null,
      error: error instanceof Error ? error.message : 'Failed to get sync status',
    })
  }
}
