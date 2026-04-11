'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Star, MapPin, Phone, Globe, Clock, DollarSign, ExternalLink,
  ChevronLeft, ChevronRight, Navigation, CheckCircle2, XCircle,
  Utensils, Wine, Coffee, Truck, UtensilsCrossed, Music, Accessibility,
  Leaf, Sun, Calendar, ArrowLeft,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { RestaurantDetails } from '@/lib/types'

function formatType(t: string) {
  return t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

function FeatureItem({ available, label, icon: Icon }: {
  available?: boolean; label: string; icon: React.ElementType
}) {
  if (available === undefined) return null
  return (
    <div className={`flex items-center gap-2.5 rounded-xl p-3 text-sm border ${
      available ? 'bg-primary/6 border-primary/15 text-primary' : 'bg-secondary border-border text-muted-foreground'
    }`}>
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 font-medium">{label}</span>
      {available
        ? <CheckCircle2 className="h-4 w-4 shrink-0 opacity-60" />
        : <XCircle className="h-4 w-4 shrink-0 opacity-30" />
      }
    </div>
  )
}

export default function RestaurantDetailClient({ restaurant }: { restaurant: RestaurantDetails }) {
  const photos = restaurant.photos || []
  const [photoIndex, setPhotoIndex] = useState(0)

  const prev = () => setPhotoIndex(i => (i === 0 ? photos.length - 1 : i - 1))
  const next = () => setPhotoIndex(i => (i === photos.length - 1 ? 0 : i + 1))

  const cuisines = restaurant.types
    .filter(t => !['point_of_interest', 'establishment', 'food', 'restaurant'].includes(t))
    .slice(0, 5)
    .map(formatType)

  return (
    <div className="min-h-screen bg-background">

      {/* ── Back nav ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-border transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dine Mauritius
          </Link>
        </div>
      </div>

      {/* ── Hero photo gallery ────────────────────────────────────────────── */}
      {photos.length > 0 && (
        <div className="relative bg-foreground" style={{ height: 'min(55vh, 520px)' }}>
          <Image
            src={photos[photoIndex]?.url || ''}
            alt={`${restaurant.name} — photo ${photoIndex + 1}`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent pointer-events-none" />

          {/* Story bar */}
          {photos.length > 1 && (
            <div className="absolute inset-x-6 top-5 flex gap-1.5 pointer-events-none">
              {photos.map((_, i) => (
                <div key={i} className="flex-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.3)' }}>
                  <div className="h-full rounded-full transition-all duration-300"
                    style={{ background: i <= photoIndex ? '#faf9f5' : 'transparent', width: i <= photoIndex ? '100%' : '0%' }} />
                </div>
              ))}
            </div>
          )}

          {photos.length > 1 && (
            <>
              <button onClick={prev} aria-label="Previous photo"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-background transition-colors">
                <ChevronLeft className="h-5 w-5 text-foreground" />
              </button>
              <button onClick={next} aria-label="Next photo"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-lg hover:bg-background transition-colors">
                <ChevronRight className="h-5 w-5 text-foreground" />
              </button>

              {/* Thumbnail strip */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 p-2 rounded-2xl bg-background/80 backdrop-blur-sm max-w-[90%] overflow-x-auto">
                {photos.slice(0, 10).map((photo, idx) => (
                  <button key={idx} onClick={() => setPhotoIndex(idx)} aria-label={`Photo ${idx + 1}`}
                    className={`relative h-12 w-12 shrink-0 rounded-xl overflow-hidden ring-2 transition-all ${
                      idx === photoIndex ? 'ring-primary opacity-100' : 'ring-transparent opacity-50 hover:opacity-80'
                    }`}>
                    <Image src={photo.url || ''} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>

              <div className="absolute bottom-5 right-5 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground">
                {photoIndex + 1} / {photos.length}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-12 lg:grid-cols-[1fr_340px]">

          {/* ── Left column ─────────────────────────────────────────────── */}
          <div className="space-y-8">

            {/* Title & status */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {restaurant.district && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    <Navigation className="h-3.5 w-3.5" />
                    {restaurant.district}, Mauritius
                  </span>
                )}
                {restaurant.businessStatus && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${
                    restaurant.businessStatus === 'OPERATIONAL'
                      ? 'bg-primary/8 border-primary/20 text-primary'
                      : 'bg-destructive/8 border-destructive/20 text-destructive'
                  }`}>
                    {restaurant.businessStatus === 'OPERATIONAL' ? 'Operational' : restaurant.businessStatus}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-[2.5rem] md:text-[3rem] text-foreground leading-tight">
                {restaurant.name}
              </h1>

              {restaurant.editorialSummary && (
                <blockquote className="border-l-4 border-primary pl-5 py-1">
                  <p className="font-serif text-lg italic text-muted-foreground leading-relaxed">
                    "{restaurant.editorialSummary}"
                  </p>
                </blockquote>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-4 p-5 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-base font-semibold text-primary">
                  <Star className="h-4.5 w-4.5 fill-primary" />
                  {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'New'}
                </span>
                <span className="text-sm text-muted-foreground">
                  {(restaurant.userRatingsTotal || 0).toLocaleString()} reviews
                </span>
              </div>

              {!!restaurant.priceLevel && (
                <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3.5 py-1.5 text-sm font-medium text-secondary-foreground">
                  <DollarSign className="h-4 w-4" />
                  {'₨'.repeat(restaurant.priceLevel)}
                </div>
              )}

              {restaurant.openingHours?.isOpenNow !== undefined && (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium ${
                  restaurant.openingHours.isOpenNow
                    ? 'bg-primary/8 border-primary/20 text-primary'
                    : 'bg-secondary border-border text-muted-foreground'
                }`}>
                  <Clock className="h-4 w-4" />
                  {restaurant.openingHours.isOpenNow ? 'Open Now' : 'Closed'}
                </span>
              )}
            </div>

            {/* Cuisine tags */}
            {cuisines.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {cuisines.map(t => (
                  <span key={t} className="rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="info" className="w-full">
              <TabsList className="w-full grid grid-cols-4 bg-secondary rounded-2xl h-12">
                {['info', 'hours', 'features', 'reviews'].map(tab => (
                  <TabsTrigger key={tab} value={tab}
                    className="rounded-xl capitalize data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-sm">
                    {tab === 'reviews' ? `Reviews${restaurant.reviews?.length ? ` (${restaurant.reviews.length})` : ''}` : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Info tab */}
              <TabsContent value="info" className="mt-6 space-y-3">
                <InfoRow icon={<MapPin className="h-5 w-5 text-primary" />} label="Address">
                  <div>
                    <p className="text-foreground">{restaurant.address}</p>
                    {restaurant.plusCode && (
                      <p className="text-xs text-muted-foreground mt-0.5">Plus Code: {restaurant.plusCode.compoundCode}</p>
                    )}
                  </div>
                </InfoRow>

                {restaurant.formattedPhoneNumber && (
                  <a href={`tel:${restaurant.internationalPhoneNumber || restaurant.formattedPhoneNumber}`}>
                    <InfoRow icon={<Phone className="h-5 w-5 text-primary" />} label="Phone" hoverable>
                      <p className="text-foreground">{restaurant.formattedPhoneNumber}</p>
                    </InfoRow>
                  </a>
                )}

                {restaurant.website && (
                  <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                    <InfoRow icon={<Globe className="h-5 w-5 text-primary" />} label="Website" hoverable>
                      <p className="text-foreground truncate">{restaurant.website}</p>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 ml-auto" />
                    </InfoRow>
                  </a>
                )}

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  {restaurant.url && (
                    <a href={restaurant.url} target="_blank" rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0px_0px_0px_1px_#c96442] hover:bg-[#b8573a] transition-colors">
                      <MapPin className="h-4 w-4" />
                      Open in Google Maps
                    </a>
                  )}
                  {restaurant.formattedPhoneNumber && (
                    <a href={`tel:${restaurant.internationalPhoneNumber || restaurant.formattedPhoneNumber}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-secondary px-6 py-3.5 text-sm font-semibold text-secondary-foreground shadow-[0px_0px_0px_1px_#d1cfc5] hover:bg-border transition-colors">
                      <Phone className="h-4 w-4" />
                      Call Restaurant
                    </a>
                  )}
                </div>
              </TabsContent>

              {/* Hours tab */}
              <TabsContent value="hours" className="mt-6">
                {restaurant.openingHours?.weekdayText?.length ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">Opening Hours</span>
                      {restaurant.openingHours.isOpenNow !== undefined && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          restaurant.openingHours.isOpenNow ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground'
                        }`}>
                          {restaurant.openingHours.isOpenNow ? 'Open now' : 'Closed'}
                        </span>
                      )}
                    </div>
                    {restaurant.openingHours.weekdayText.map((hour, i) => {
                      const isToday = ((i + 1) % 7) === new Date().getDay()
                      return (
                        <div key={i} className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm ${
                          isToday ? 'bg-primary/8 border border-primary/15' : 'bg-secondary border border-border'
                        }`}>
                          <span className={`font-medium ${isToday ? 'text-primary' : 'text-foreground'}`}>
                            {hour.split(': ')[0]}
                            {isToday && <span className="ml-2 text-xs font-normal opacity-60">(Today)</span>}
                          </span>
                          <span className="text-muted-foreground">{hour.split(': ')[1]}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <EmptyTab icon={<Clock className="h-12 w-12" />} text="Hours not available" />
                )}
              </TabsContent>

              {/* Features tab */}
              <TabsContent value="features" className="mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <FeatureItem available={restaurant.dineIn} label="Dine-in" icon={UtensilsCrossed} />
                  <FeatureItem available={restaurant.takeout} label="Takeout" icon={Utensils} />
                  <FeatureItem available={restaurant.delivery} label="Delivery" icon={Truck} />
                  <FeatureItem available={restaurant.reservable} label="Reservations" icon={Calendar} />
                  <FeatureItem available={restaurant.outdoorSeating} label="Outdoor Seating" icon={Sun} />
                  <FeatureItem available={restaurant.liveMusic} label="Live Music" icon={Music} />
                  <FeatureItem available={restaurant.servesBeer} label="Beer" icon={Wine} />
                  <FeatureItem available={restaurant.servesWine} label="Wine" icon={Wine} />
                  <FeatureItem available={restaurant.servesBreakfast} label="Breakfast" icon={Coffee} />
                  <FeatureItem available={restaurant.servesBrunch} label="Brunch" icon={Coffee} />
                  <FeatureItem available={restaurant.servesLunch} label="Lunch" icon={Utensils} />
                  <FeatureItem available={restaurant.servesDinner} label="Dinner" icon={UtensilsCrossed} />
                  <FeatureItem available={restaurant.servesVegetarianFood} label="Vegetarian" icon={Leaf} />
                  <FeatureItem available={restaurant.wheelchairAccessibleEntrance} label="Wheelchair" icon={Accessibility} />
                  <FeatureItem available={restaurant.curbsidePickup} label="Curbside Pickup" icon={Truck} />
                </div>
              </TabsContent>

              {/* Reviews tab */}
              <TabsContent value="reviews" className="mt-6">
                {restaurant.reviews?.length ? (
                  <div className="space-y-4">
                    {restaurant.reviews.map((review, i) => (
                      <div key={i} className="rounded-2xl bg-card border border-border p-5 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {review.profilePhotoUrl && (
                              <Image src={review.profilePhotoUrl} alt={review.authorName}
                                width={40} height={40} className="rounded-full ring-1 ring-border" />
                            )}
                            <div>
                              <a href={review.authorUrl} target="_blank" rel="noopener noreferrer"
                                className="font-medium text-foreground hover:text-primary transition-colors text-sm">
                                {review.authorName}
                              </a>
                              <p className="text-xs text-muted-foreground">{review.relativeTimeDescription}</p>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary shrink-0">
                            <Star className="h-3.5 w-3.5 fill-primary" />
                            {review.rating}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyTab icon={<Star className="h-12 w-12" />} text="No reviews yet" />
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* ── Right sidebar ─────────────────────────────────────── */}
          <aside className="space-y-4">
            {/* Quick info card */}
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4 sticky top-24">
              <p className="font-serif text-[1.1rem] text-foreground">Quick info</p>

              {restaurant.address && (
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <p className="text-muted-foreground leading-relaxed">{restaurant.address}</p>
                </div>
              )}

              {restaurant.formattedPhoneNumber && (
                <a href={`tel:${restaurant.internationalPhoneNumber || restaurant.formattedPhoneNumber}`}
                  className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  {restaurant.formattedPhoneNumber}
                </a>
              )}

              {restaurant.website && (
                <a href={restaurant.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-foreground hover:text-primary transition-colors">
                  <Globe className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{new URL(restaurant.website).hostname}</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
                </a>
              )}

              {restaurant.openingHours?.isOpenNow !== undefined && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span className={restaurant.openingHours.isOpenNow ? 'text-primary font-medium' : 'text-muted-foreground'}>
                    {restaurant.openingHours.isOpenNow ? 'Open now' : 'Currently closed'}
                  </span>
                </div>
              )}

              {/* CTA */}
              {restaurant.url && (
                <a href={restaurant.url} target="_blank" rel="noopener noreferrer"
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-[0px_0px_0px_1px_#c96442] hover:bg-[#b8573a] transition-colors">
                  <MapPin className="h-4 w-4" />
                  View on Google Maps
                </a>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, children, hoverable }: {
  icon: React.ReactNode; label: string; children: React.ReactNode; hoverable?: boolean
}) {
  return (
    <div className={`flex items-start gap-4 rounded-2xl border border-border bg-card p-4 ${hoverable ? 'hover:bg-secondary/50 transition-colors cursor-pointer' : ''}`}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">{label}</p>
        <div className="flex items-center gap-2 text-sm">{children}</div>
      </div>
    </div>
  )
}

function EmptyTab({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
      <div className="opacity-25 mb-3">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  )
}
