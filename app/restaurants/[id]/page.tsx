import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { redis, REDIS_KEYS } from '@/lib/redis'
import type { RestaurantDetails, Photo, Review } from '@/lib/types'
import RestaurantDetailClient from './client'

// Lazy-fetch from Google if not cached
async function fetchPlaceDetails(placeId: string): Promise<RestaurantDetails | null> {
  const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY!
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

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } })
    const data = await res.json()
    if (!data.result) return null
    const place = data.result

    const photos: Photo[] = (place.photos || []).map((p: any) => ({
      photoReference: p.photo_reference,
      height: p.height,
      width: p.width,
      htmlAttributions: p.html_attributions || [],
      url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1200&photo_reference=${p.photo_reference}&key=${GOOGLE_API_KEY}`,
    }))

    const reviews: Review[] = (place.reviews || []).map((r: any) => ({
      authorName: r.author_name,
      authorUrl: r.author_url,
      profilePhotoUrl: r.profile_photo_url,
      rating: r.rating,
      relativeTimeDescription: r.relative_time_description,
      text: r.text,
      time: r.time,
      language: r.language,
    }))

    const details: RestaurantDetails = {
      id: place.place_id,
      name: place.name,
      address: place.formatted_address || place.vicinity || '',
      rating: place.rating || 0,
      userRatingsTotal: place.user_ratings_total || 0,
      priceLevel: place.price_level,
      types: place.types || [],
      photoUrl: photos[0]?.url || null,
      photoUrls: photos.map(p => p.url!).filter(Boolean),
      location: { lat: place.geometry?.location?.lat || 0, lng: place.geometry?.location?.lng || 0 },
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
      plusCode: place.plus_code ? { globalCode: place.plus_code.global_code, compoundCode: place.plus_code.compound_code } : undefined,
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

    // Cache for next time
    await redis.set(REDIS_KEYS.RESTAURANT_DETAILS(placeId), details)
    return details
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const details = await redis.get<RestaurantDetails>(REDIS_KEYS.RESTAURANT_DETAILS(id))
  if (!details) return { title: 'Restaurant — Dine Mauritius' }
  return {
    title: details.name,
    description: details.editorialSummary || `${details.name} — ${details.address}`,
    openGraph: {
      images: details.photoUrl ? [{ url: details.photoUrl }] : [],
    },
  }
}

export default async function RestaurantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Try Redis first, then Google
  let restaurant = await redis.get<RestaurantDetails>(REDIS_KEYS.RESTAURANT_DETAILS(id))

  if (!restaurant) {
    // Backfill district from all-restaurants list
    const allRestaurants = await redis.get<{ id: string; district: string }[]>(REDIS_KEYS.ALL_RESTAURANTS)
    const match = allRestaurants?.find(r => r.id === id)
    restaurant = await fetchPlaceDetails(id)
    if (restaurant && match) restaurant.district = match.district
  }

  if (!restaurant) notFound()

  return <RestaurantDetailClient restaurant={restaurant} />
}
