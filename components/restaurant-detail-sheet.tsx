'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import useSWR from 'swr'
import {
  ChevronDown, ChevronLeft, ChevronRight, Clock, DollarSign, ExternalLink,
  Globe, MapPin, Navigation, Phone, Star, X,
  Utensils, Wine, Coffee, Truck, UtensilsCrossed, Music, Accessibility,
  Leaf, Sun, Calendar, CheckCircle2, XCircle,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import type { RestaurantDetails } from '@/lib/types'

interface Props {
  restaurantId: string | null
  onClose: () => void
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function formatType(t: string) {
  return t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function FeatureItem({ available, label, icon: Icon }: {
  available?: boolean; label: string; icon: React.ElementType
}) {
  if (available === undefined) return null
  return (
    <div className={`flex items-center gap-2 rounded-xl p-2.5 text-xs border ${
      available ? 'bg-primary/8 border-primary/15 text-primary' : 'bg-secondary border-border text-muted-foreground'
    }`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      {available
        ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
        : <XCircle className="h-3.5 w-3.5 shrink-0 opacity-30" />
      }
    </div>
  )
}

export function RestaurantDetailSheet({ restaurantId, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragDelta, setDragDelta] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const { data: restaurant, isLoading } = useSWR<RestaurantDetails>(
    restaurantId ? `/api/restaurants/${restaurantId}` : null,
    fetcher
  )

  // Reset state when restaurant changes
  useEffect(() => {
    setPhotoIndex(0)
    setExpanded(false)
    setDragDelta(0)
  }, [restaurantId])

  // Lock body scroll when expanded
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [expanded])

  const photos = restaurant?.photos || []
  const validPhotos = photos.filter(p => p.url)

  const prevPhoto = () => setPhotoIndex(i => (i === 0 ? validPhotos.length - 1 : i - 1))
  const nextPhoto = () => setPhotoIndex(i => (i === validPhotos.length - 1 ? 0 : i + 1))

  const cuisines = (restaurant?.types || [])
    .filter(t => !['point_of_interest', 'establishment', 'food', 'restaurant'].includes(t))
    .slice(0, 4)
    .map(formatType)

  // Sheet drag handle
  const handleDragStart = (e: React.TouchEvent) => {
    setDragStartY(e.touches[0].clientY)
    setIsDragging(true)
  }
  const handleDragMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    const delta = e.touches[0].clientY - dragStartY
    if (!expanded && delta < 0) setDragDelta(delta) // drag up to expand
    if (expanded && delta > 0) setDragDelta(delta)  // drag down to collapse
  }
  const handleDragEnd = () => {
    setIsDragging(false)
    if (!expanded && dragDelta < -60) setExpanded(true)
    else if (expanded && dragDelta > 80) { setExpanded(false) }
    else if (!expanded && dragDelta > 60) onClose()
    setDragDelta(0)
  }

  if (!restaurantId) return null

  // Sheet heights
  const PEEK = 'calc(100dvh - 560px)'          // card visible, sheet at bottom
  const COLLAPSED = 'calc(100dvh - 260px)'     // after card exits, peek state
  const EXPANDED = '20px'                       // almost full screen

  const sheetTop = expanded ? EXPANDED : COLLAPSED

  return (
    <>
      {/* Backdrop when expanded */}
      {expanded && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        />
      )}

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background rounded-t-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.15)]"
        style={{
          top: sheetTop,
          transition: isDragging ? 'none' : 'top 0.38s cubic-bezier(0.32, 0.72, 0, 1)',
          transform: dragDelta ? `translateY(${Math.max(0, dragDelta * 0.4)}px)` : undefined,
        }}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-2 shrink-0 cursor-grab">
          <div className="h-1 w-10 rounded-full bg-border" />
        </div>

        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-12">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : restaurant ? (
          <div className="flex flex-1 flex-col min-h-0">
            {/* ── Peek row (always visible) ──────────────────────── */}
            <div
              className="flex items-center gap-4 px-5 pb-4 shrink-0 cursor-pointer"
              onClick={() => setExpanded(p => !p)}
            >
              {/* Thumbnail */}
              <div className="relative h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-secondary">
                {validPhotos[0]?.url ? (
                  <Image src={validPhotos[0].url} alt={restaurant.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <MapPin className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="font-serif text-[1.15rem] text-foreground leading-tight line-clamp-1">
                  {restaurant.name}
                </h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                    <Star className="h-3.5 w-3.5 fill-primary" />
                    {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'New'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {(restaurant.userRatingsTotal || 0).toLocaleString()} reviews
                  </span>
                  {restaurant.openingHours?.isOpenNow !== undefined && (
                    <span className={`text-xs font-medium ${restaurant.openingHours.isOpenNow ? 'text-primary' : 'text-muted-foreground'}`}>
                      {restaurant.openingHours.isOpenNow ? '· Open' : '· Closed'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className={`transition-transform duration-300 ${expanded ? 'rotate-0' : 'rotate-180'}`}>
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                </div>
                <button type="button" onClick={(e) => { e.stopPropagation(); onClose() }}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-secondary text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* ── Expanded content ───────────────────────────────── */}
            <div className={`flex-1 overflow-y-auto overscroll-contain transition-opacity duration-300 ${expanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <div className="px-5 pb-[calc(env(safe-area-inset-bottom,0px)+100px)] space-y-6">

                {/* Photo gallery */}
                {validPhotos.length > 0 && (
                  <div className="relative h-56 rounded-2xl overflow-hidden bg-secondary">
                    <Image
                      src={validPhotos[photoIndex]?.url || ''}
                      alt={`${restaurant.name} photo ${photoIndex + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw"
                    />
                    {/* Story dots */}
                    {validPhotos.length > 1 && (
                      <div className="absolute inset-x-4 top-3 flex gap-1 pointer-events-none">
                        {validPhotos.map((_, i) => (
                          <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.3)' }}>
                            <div className="h-full rounded-full transition-all" style={{ background: i <= photoIndex ? '#faf9f5' : 'transparent', width: i <= photoIndex ? '100%' : '0%' }} />
                          </div>
                        ))}
                      </div>
                    )}
                    {validPhotos.length > 1 && (
                      <>
                        <button onClick={prevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button onClick={nextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
                          {photoIndex + 1} / {validPhotos.length}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Editorial summary */}
                {restaurant.editorialSummary && (
                  <blockquote className="border-l-[3px] border-primary pl-4">
                    <p className="font-serif text-base italic text-muted-foreground leading-relaxed">
                      "{restaurant.editorialSummary}"
                    </p>
                  </blockquote>
                )}

                {/* Stat pills */}
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
                    <Star className="h-4 w-4 fill-primary" />
                    {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'New'}
                    <span className="text-xs opacity-70">· {(restaurant.userRatingsTotal || 0).toLocaleString()} reviews</span>
                  </span>
                  {!!restaurant.priceLevel && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground">
                      <DollarSign className="h-3.5 w-3.5" />
                      {'₨'.repeat(restaurant.priceLevel)}
                    </span>
                  )}
                  {restaurant.openingHours?.isOpenNow !== undefined && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                      restaurant.openingHours.isOpenNow ? 'bg-primary/8 border-primary/15 text-primary' : 'bg-secondary border-border text-muted-foreground'
                    }`}>
                      <Clock className="h-3.5 w-3.5" />
                      {restaurant.openingHours.isOpenNow ? 'Open Now' : 'Closed'}
                    </span>
                  )}
                  {restaurant.district && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                      <Navigation className="h-3.5 w-3.5" />
                      {restaurant.district}
                    </span>
                  )}
                </div>

                {/* Cuisine tags */}
                {cuisines.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {cuisines.map(t => (
                      <span key={t} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{t}</span>
                    ))}
                  </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="info">
                  <TabsList className="w-full grid grid-cols-4 bg-secondary rounded-xl h-10">
                    {['info', 'hours', 'features', 'reviews'].map(tab => (
                      <TabsTrigger key={tab} value={tab}
                        className="rounded-lg text-xs capitalize data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">
                        {tab}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {/* Info */}
                  <TabsContent value="info" className="mt-4 space-y-3">
                    <div className="flex items-start gap-3 rounded-xl bg-card border border-border p-3">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm text-muted-foreground leading-relaxed">{restaurant.address}</p>
                    </div>
                    {restaurant.formattedPhoneNumber && (
                      <a href={`tel:${restaurant.formattedPhoneNumber}`}
                        className="flex items-center gap-3 rounded-xl bg-card border border-border p-3 hover:bg-secondary transition-colors">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground">{restaurant.formattedPhoneNumber}</span>
                      </a>
                    )}
                    {restaurant.website && (
                      <a href={restaurant.website} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-xl bg-card border border-border p-3 hover:bg-secondary transition-colors">
                        <Globe className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground truncate flex-1">{restaurant.website}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </a>
                    )}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      {restaurant.url && (
                        <a href={restaurant.url} target="_blank" rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-[0px_0px_0px_1px_#c96442]">
                          <MapPin className="h-4 w-4" />Maps
                        </a>
                      )}
                      {restaurant.formattedPhoneNumber && (
                        <a href={`tel:${restaurant.formattedPhoneNumber}`}
                          className="flex items-center justify-center gap-2 rounded-2xl bg-secondary py-3 text-sm font-semibold text-secondary-foreground shadow-[0px_0px_0px_1px_#d1cfc5]">
                          <Phone className="h-4 w-4" />Call
                        </a>
                      )}
                    </div>
                  </TabsContent>

                  {/* Hours */}
                  <TabsContent value="hours" className="mt-4">
                    {restaurant.openingHours?.weekdayText?.length ? (
                      <div className="space-y-1.5">
                        {restaurant.openingHours.weekdayText.map((hour, i) => {
                          const isToday = ((i + 1) % 7) === new Date().getDay()
                          return (
                            <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-sm ${
                              isToday ? 'bg-primary/8 border border-primary/15' : 'bg-secondary border border-border'
                            }`}>
                              <span className={`font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                                {hour.split(': ')[0]}
                                {isToday && <span className="ml-1.5 text-[10px] opacity-60">(Today)</span>}
                              </span>
                              <span className="text-muted-foreground">{hour.split(': ')[1]}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-8">Hours not available</p>
                    )}
                  </TabsContent>

                  {/* Features */}
                  <TabsContent value="features" className="mt-4">
                    <div className="grid grid-cols-2 gap-2">
                      <FeatureItem available={restaurant.dineIn} label="Dine-in" icon={UtensilsCrossed} />
                      <FeatureItem available={restaurant.takeout} label="Takeout" icon={Utensils} />
                      <FeatureItem available={restaurant.delivery} label="Delivery" icon={Truck} />
                      <FeatureItem available={restaurant.reservable} label="Reservations" icon={Calendar} />
                      <FeatureItem available={restaurant.outdoorSeating} label="Outdoor" icon={Sun} />
                      <FeatureItem available={restaurant.liveMusic} label="Live Music" icon={Music} />
                      <FeatureItem available={restaurant.servesBeer} label="Beer" icon={Wine} />
                      <FeatureItem available={restaurant.servesWine} label="Wine" icon={Wine} />
                      <FeatureItem available={restaurant.servesBreakfast} label="Breakfast" icon={Coffee} />
                      <FeatureItem available={restaurant.servesLunch} label="Lunch" icon={Utensils} />
                      <FeatureItem available={restaurant.servesDinner} label="Dinner" icon={UtensilsCrossed} />
                      <FeatureItem available={restaurant.servesVegetarianFood} label="Vegetarian" icon={Leaf} />
                      <FeatureItem available={restaurant.wheelchairAccessibleEntrance} label="Wheelchair" icon={Accessibility} />
                      <FeatureItem available={restaurant.curbsidePickup} label="Curbside" icon={Truck} />
                    </div>
                  </TabsContent>

                  {/* Reviews */}
                  <TabsContent value="reviews" className="mt-4">
                    {restaurant.reviews?.length ? (
                      <div className="space-y-3">
                        {restaurant.reviews.map((review, i) => (
                          <div key={i} className="rounded-2xl bg-card border border-border p-4 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                {review.profilePhotoUrl && (
                                  <Image src={review.profilePhotoUrl} alt={review.authorName}
                                    width={32} height={32} className="rounded-full ring-1 ring-border" />
                                )}
                                <div>
                                  <p className="font-medium text-sm text-foreground">{review.authorName}</p>
                                  <p className="text-xs text-muted-foreground">{review.relativeTimeDescription}</p>
                                </div>
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary shrink-0">
                                <Star className="h-3 w-3 fill-primary" />
                                {review.rating}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-sm text-muted-foreground py-8">No reviews yet</p>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  )
}
