export interface Restaurant {
  id: string
  name: string
  address: string
  rating: number
  userRatingsTotal: number
  priceLevel?: number
  types: string[]
  photoUrl?: string
  photoUrls: string[]
  location: {
    lat: number
    lng: number
  }
  district: string
  isOpenNow?: boolean
}

export interface RestaurantDetails extends Restaurant {
  formattedPhoneNumber?: string
  internationalPhoneNumber?: string
  website?: string
  url?: string
  openingHours?: {
    weekdayText: string[]
    isOpenNow: boolean
    periods?: {
      open: { day: number; time: string }
      close?: { day: number; time: string }
    }[]
  }
  reviews: Review[]
  photos: Photo[]
  editorialSummary?: string
  businessStatus?: string
  utcOffset?: number
  vicinity?: string
  plusCode?: {
    globalCode: string
    compoundCode: string
  }
  wheelchairAccessibleEntrance?: boolean
  delivery?: boolean
  dineIn?: boolean
  takeout?: boolean
  reservable?: boolean
  servesBreakfast?: boolean
  servesLunch?: boolean
  servesDinner?: boolean
  servesBeer?: boolean
  servesWine?: boolean
  servesBrunch?: boolean
  servesVegetarianFood?: boolean
  outdoorSeating?: boolean
  liveMusic?: boolean
  menuUrl?: string
  orderUrl?: string
  curbsidePickup?: boolean
  priceRange?: string
}

export interface Review {
  authorName: string
  authorUrl?: string
  profilePhotoUrl?: string
  rating: number
  relativeTimeDescription: string
  text: string
  time: number
  language?: string
}

export interface Photo {
  photoReference: string
  height: number
  width: number
  htmlAttributions: string[]
  url?: string
}

export interface District {
  name: string
  coordinates: {
    lat: number
    lng: number
  }
  restaurantCount: number
}

export interface SyncStatus {
  isRunning: boolean
  progress: number
  currentDistrict: string
  totalRestaurants: number
  lastSync: string | null
  error?: string
}
