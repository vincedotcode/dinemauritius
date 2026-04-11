import { NextRequest, NextResponse } from "next/server"
import { redis, REDIS_KEYS } from "@/lib/redis"
import type { RestaurantDetails, Photo, Review } from "@/lib/types"

const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY!

async function fetchPlaceDetails(placeId: string): Promise<RestaurantDetails | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json')
  url.searchParams.set('place_id', placeId)
  url.searchParams.set('fields', [
    'place_id', 'name', 'formatted_address', 'formatted_phone_number',
    'international_phone_number', 'website', 'url', 'rating', 'user_ratings_total',
    'price_level', 'opening_hours', 'photos', 'reviews', 'types', 'geometry',
    'business_status', 'editorial_summary', 'vicinity', 'plus_code',
    'wheelchair_accessible_entrance', 'delivery', 'dine_in', 'takeout',
    'reservable', 'serves_breakfast', 'serves_lunch', 'serves_dinner',
    'serves_beer', 'serves_wine', 'serves_brunch', 'serves_vegetarian_food',
    'outdoor_seating', 'live_music', 'curbside_pickup',
  ].join(','))
  url.searchParams.set('key', GOOGLE_API_KEY)

  const response = await fetch(url.toString(), { cache: 'no-store' })
  const data = await response.json()

  if (!data.result) return null

  const place = data.result

  const photos: Photo[] = (place.photos || []).map((photo: any) => ({
    photoReference: photo.photo_reference,
    height: photo.height,
    width: photo.width,
    htmlAttributions: photo.html_attributions || [],
    url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`,
  }))

  const reviews: Review[] = (place.reviews || []).map((review: any) => ({
    authorName: review.author_name,
    authorUrl: review.author_url,
    profilePhotoUrl: review.profile_photo_url,
    rating: review.rating,
    relativeTimeDescription: review.relative_time_description,
    text: review.text,
    time: review.time,
    language: review.language,
  }))

  return {
    id: place.place_id,
    name: place.name,
    address: place.formatted_address || place.vicinity || '',
    rating: place.rating || 0,
    userRatingsTotal: place.user_ratings_total || 0,
    priceLevel: place.price_level,
    types: place.types || [],
    photoUrl: photos[0]?.url || undefined,
    photoUrls: photos.map(p => p.url!).filter(Boolean),
    location: {
      lat: place.geometry?.location?.lat || 0,
      lng: place.geometry?.location?.lng || 0,
    },
    district: '',
    isOpenNow: place.opening_hours?.open_now,
    formattedPhoneNumber: place.formatted_phone_number,
    internationalPhoneNumber: place.international_phone_number,
    website: place.website,
    url: place.url,
    openingHours: place.opening_hours ? {
      weekdayText: place.opening_hours.weekday_text || [],
      isOpenNow: place.opening_hours.open_now || false,
      periods: place.opening_hours.periods,
    } : undefined,
    reviews,
    photos,
    editorialSummary: place.editorial_summary?.overview,
    businessStatus: place.business_status,
    vicinity: place.vicinity,
    plusCode: place.plus_code ? {
      globalCode: place.plus_code.global_code,
      compoundCode: place.plus_code.compound_code,
    } : undefined,
    wheelchairAccessibleEntrance: place.wheelchair_accessible_entrance,
    delivery: place.delivery,
    dineIn: place.dine_in,
    takeout: place.takeout,
    reservable: place.reservable,
    servesBreakfast: place.serves_breakfast,
    servesLunch: place.serves_lunch,
    servesDinner: place.serves_dinner,
    servesBeer: place.serves_beer,
    servesWine: place.serves_wine,
    servesBrunch: place.serves_brunch,
    servesVegetarianFood: place.serves_vegetarian_food,
    outdoorSeating: place.outdoor_seating,
    liveMusic: place.live_music,
    curbsidePickup: place.curbside_pickup,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }

  try {
    // Try Redis cache first
    let details = await redis.get<RestaurantDetails>(REDIS_KEYS.RESTAURANT_DETAILS(id))

    if (!details) {
      // Fetch Google + allRestaurants in parallel on cache miss
      const [fetched, allRestaurants] = await Promise.all([
        fetchPlaceDetails(id),
        redis.get<{ id: string; district: string }[]>(REDIS_KEYS.ALL_RESTAURANTS),
      ])

      if (!fetched) {
        return NextResponse.json({ error: "Restaurant not found" }, { status: 404 })
      }

      details = fetched
      const match = allRestaurants?.find(r => r.id === id)
      if (match) details.district = match.district

      // Cache async — don't block the response
      redis.set(REDIS_KEYS.RESTAURANT_DETAILS(id), details).catch(() => {})
    }

    return NextResponse.json(details, { headers: CACHE_HEADERS })
  } catch (error) {
    console.error("Error fetching restaurant details:", error)
    return NextResponse.json({ error: "Failed to fetch restaurant details" }, { status: 500 })
  }
}
