import { NextRequest, NextResponse } from "next/server"
import { redis, REDIS_KEYS } from "@/lib/redis"
import type { Restaurant, District } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const district = searchParams.get("district")
    const search = searchParams.get("search")?.toLowerCase()
    const cuisine = searchParams.get("cuisine")?.toLowerCase()
    const sortBy = searchParams.get("sortBy") || "rating"

    // Get all restaurants from Redis
    let restaurants = await redis.get<Restaurant[]>(REDIS_KEYS.ALL_RESTAURANTS)

    if (!restaurants || restaurants.length === 0) {
      return NextResponse.json({
        restaurants: [],
        districts: [],
        message: "No restaurants found. Please sync data first.",
        needsSync: true,
      })
    }

    // Filter by district
    if (district && district !== "all") {
      restaurants = restaurants.filter(
        (r) => r.district.toLowerCase() === district.toLowerCase()
      )
    }

    // Filter by search term
    if (search) {
      restaurants = restaurants.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.address.toLowerCase().includes(search) ||
          r.types.some((t) => t.toLowerCase().includes(search))
      )
    }

    // Filter by cuisine type
    if (cuisine && cuisine !== "all") {
      restaurants = restaurants.filter((r) =>
        r.types.some((t) => t.toLowerCase().includes(cuisine))
      )
    }

    // Sort restaurants
    switch (sortBy) {
      case "rating":
        restaurants.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case "reviews":
        restaurants.sort((a, b) => (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0))
        break
      case "name":
        restaurants.sort((a, b) => a.name.localeCompare(b.name))
        break
      case "price_low":
        restaurants.sort((a, b) => (a.priceLevel || 0) - (b.priceLevel || 0))
        break
      case "price_high":
        restaurants.sort((a, b) => (b.priceLevel || 0) - (a.priceLevel || 0))
        break
    }

    // Get districts + lastSync in parallel
    const [districts, lastSync] = await Promise.all([
      redis.get<District[]>(REDIS_KEYS.DISTRICTS),
      redis.get<string>(REDIS_KEYS.LAST_SYNC),
    ])

    return NextResponse.json(
      { restaurants, districts: districts || [], totalCount: restaurants.length, lastSync },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } },
    )
  } catch (error) {
    console.error("Error fetching restaurants:", error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch restaurants",
      restaurants: [],
      districts: [],
      needsSync: true,
      totalCount: 0,
      lastSync: null,
    })
  }
}
