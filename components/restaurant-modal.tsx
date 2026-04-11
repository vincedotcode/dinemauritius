"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import {
  Star, MapPin, Phone, Globe, Clock, DollarSign, ExternalLink, X,
  ChevronLeft, ChevronRight, Utensils, Wine, Coffee, Truck,
  UtensilsCrossed, Music, Accessibility, Leaf, Sun, Calendar,
  Navigation, CheckCircle2, XCircle,
} from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Spinner } from "@/components/ui/spinner"
import { RestaurantDetails } from "@/lib/types"

interface RestaurantModalProps {
  restaurantId: string | null
  onClose: () => void
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

function formatType(type: string) {
  return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

function FeatureItem({ available, label, icon: Icon }: {
  available?: boolean
  label: string
  icon: React.ElementType
}) {
  if (available === undefined) return null
  return (
    <div className={`flex items-center gap-2 rounded-lg p-2.5 text-sm ${
      available
        ? "bg-primary/8 text-primary border border-primary/15"
        : "bg-secondary text-muted-foreground border border-border"
    }`}>
      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
      <span className="flex-1">{label}</span>
      {available
        ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
        : <XCircle className="h-3.5 w-3.5 flex-shrink-0 opacity-40" />
      }
    </div>
  )
}

export function RestaurantModal({ restaurantId, onClose }: RestaurantModalProps) {
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    setPhotoIndex(0)
  }, [restaurantId])

  const { data: restaurant, isLoading } = useSWR<RestaurantDetails>(
    restaurantId ? `/api/restaurants/${restaurantId}` : null,
    fetcher
  )

  const photos = restaurant?.photos || []
  const hasPhotos = photos.length > 0

  const prev = () => setPhotoIndex(i => (i === 0 ? photos.length - 1 : i - 1))
  const next = () => setPhotoIndex(i => (i === photos.length - 1 ? 0 : i + 1))

  return (
    <Dialog open={!!restaurantId} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-3xl max-h-[94vh] overflow-y-auto bg-card border-border p-0 rounded-2xl">

        {isLoading ? (
          <div className="flex items-center justify-center h-80">
            <Spinner className="h-8 w-8 text-primary" />
          </div>
        ) : restaurant ? (
          <>
            {!hasPhotos && (
              <button
                onClick={onClose}
                aria-label="Close restaurant details"
                className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-background shadow-md transition-colors hover:bg-secondary"
              >
                <X className="h-4 w-4 text-foreground" />
              </button>
            )}

            {/* ── Photo Gallery ──────────────────────────────────────────── */}
            {hasPhotos && (
              <div className="relative h-64 md:h-80 w-full overflow-hidden rounded-t-2xl bg-secondary">
                <Image
                  src={photos[photoIndex]?.url || ""}
                  alt={`${restaurant.name} — photo ${photoIndex + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 768px"
                />

                {/* Close */}
                <button
                  onClick={onClose}
                  aria-label="Close restaurant details"
                  className="absolute top-4 right-4 h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background transition-colors"
                >
                  <X className="h-4 w-4 text-foreground" />
                </button>

                {/* Navigation arrows */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      aria-label="Previous restaurant photo"
                      className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4 text-foreground" />
                    </button>
                    <button
                      onClick={next}
                      aria-label="Next restaurant photo"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-background transition-colors"
                    >
                      <ChevronRight className="h-4 w-4 text-foreground" />
                    </button>

                    {/* Counter */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/90 backdrop-blur-sm px-3 py-1 text-xs font-medium text-foreground shadow">
                      {photoIndex + 1} / {photos.length}
                    </div>

                    {/* Thumbnail strip */}
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 rounded-xl bg-background/80 backdrop-blur-sm max-w-[80%] overflow-x-auto">
                      {photos.slice(0, 8).map((photo, idx) => (
                        <button
                          key={idx}
                          onClick={() => setPhotoIndex(idx)}
                          aria-label={`View photo ${idx + 1}`}
                          className={`relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 ring-2 transition-all ${
                            idx === photoIndex ? "ring-primary" : "ring-transparent opacity-60 hover:opacity-100"
                          }`}
                        >
                          <Image src={photo.url || ""} alt="" fill className="object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Main Content ───────────────────────────────────────────── */}
            <div className="p-6 space-y-5">

              {/* Title block */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-serif text-2xl md:text-3xl font-medium text-foreground leading-tight">
                    {restaurant.name}
                  </h2>
                  {restaurant.district && (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Navigation className="h-3.5 w-3.5" />
                      {restaurant.district}, Mauritius
                    </p>
                  )}
                </div>
                {restaurant.businessStatus && (
                  <span className={`flex-shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                    restaurant.businessStatus === "OPERATIONAL"
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-destructive/10 text-destructive border border-destructive/20"
                  }`}>
                    {restaurant.businessStatus === "OPERATIONAL" ? "Operational" : restaurant.businessStatus}
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-background border border-border">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                    <Star className="h-4 w-4 fill-primary" />
                    {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "N/A"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ({(restaurant.userRatingsTotal || 0).toLocaleString()} reviews)
                  </span>
                </div>
                {!!restaurant.priceLevel && (
                  <div className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
                    <DollarSign className="h-3.5 w-3.5" />
                    {"₨".repeat(restaurant.priceLevel)}
                  </div>
                )}
                {restaurant.openingHours?.isOpenNow !== undefined && (
                  <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                    restaurant.openingHours.isOpenNow
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary text-muted-foreground border-border"
                  }`}>
                    <Clock className="h-3.5 w-3.5" />
                    {restaurant.openingHours.isOpenNow ? "Open Now" : "Closed"}
                  </span>
                )}
              </div>

              {/* Editorial summary */}
              {restaurant.editorialSummary && (
                <blockquote className="rounded-xl bg-background border-l-4 border-primary px-4 py-3">
                  <p className="font-serif text-base italic text-foreground leading-relaxed">
                    "{restaurant.editorialSummary}"
                  </p>
                </blockquote>
              )}

              {/* Cuisine tags */}
              {restaurant.types && restaurant.types.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {restaurant.types
                    .filter(t => !["point_of_interest", "establishment", "food"].includes(t))
                    .map(type => (
                      <span
                        key={type}
                        className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
                      >
                        {formatType(type)}
                      </span>
                    ))}
                </div>
              )}

              {/* ── Tabs ─────────────────────────────────────────────────── */}
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full grid grid-cols-4 bg-secondary rounded-xl h-10">
                  <TabsTrigger value="info" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">Info</TabsTrigger>
                  <TabsTrigger value="hours" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">Hours</TabsTrigger>
                  <TabsTrigger value="features" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">Features</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-xs rounded-lg data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm">Reviews</TabsTrigger>
                </TabsList>

                {/* Info */}
                <TabsContent value="info" className="mt-4 space-y-3">
                  <InfoRow icon={<MapPin className="h-4 w-4 text-primary" />} label="Address">
                    <span className="text-muted-foreground">{restaurant.address}</span>
                    {restaurant.plusCode && (
                      <span className="block text-xs text-muted-foreground/70 mt-0.5">
                        Plus Code: {restaurant.plusCode.compoundCode}
                      </span>
                    )}
                  </InfoRow>

                  {restaurant.formattedPhoneNumber && (
                    <a href={`tel:${restaurant.internationalPhoneNumber || restaurant.formattedPhoneNumber}`}>
                      <InfoRow icon={<Phone className="h-4 w-4 text-primary" />} label="Phone" hoverable>
                        <span className="text-muted-foreground">{restaurant.formattedPhoneNumber}</span>
                      </InfoRow>
                    </a>
                  )}

                  {restaurant.website && (
                    <a href={restaurant.website} target="_blank" rel="noopener noreferrer">
                      <InfoRow icon={<Globe className="h-4 w-4 text-primary" />} label="Website" hoverable>
                        <span className="text-muted-foreground truncate">{restaurant.website}</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0 ml-auto" />
                      </InfoRow>
                    </a>
                  )}

                  {restaurant.menuUrl && (
                    <a href={restaurant.menuUrl} target="_blank" rel="noopener noreferrer">
                      <InfoRow icon={<Utensils className="h-4 w-4 text-primary" />} label="Menu" hoverable>
                        <span className="text-muted-foreground">View full menu</span>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0 ml-auto" />
                      </InfoRow>
                    </a>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {restaurant.url && (
                      <a
                        href={restaurant.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground
                          shadow-[0px_0px_0px_1px_#c96442] hover:bg-[#b8573a] transition-colors"
                      >
                        <MapPin className="h-4 w-4" />View on Google Maps
                      </a>
                    )}
                    {restaurant.formattedPhoneNumber && (
                      <a
                        href={`tel:${restaurant.internationalPhoneNumber || restaurant.formattedPhoneNumber}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground
                          shadow-[0px_0px_0px_1px_var(--border-warm)] hover:bg-border transition-colors"
                      >
                        <Phone className="h-4 w-4" />Call Restaurant
                      </a>
                    )}
                  </div>
                </TabsContent>

                {/* Hours */}
                <TabsContent value="hours" className="mt-4">
                  {restaurant.openingHours?.weekdayText?.length ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground text-sm">Opening Hours</span>
                        {restaurant.openingHours.isOpenNow !== undefined && (
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            restaurant.openingHours.isOpenNow
                              ? "bg-primary/10 text-primary"
                              : "bg-secondary text-muted-foreground"
                          }`}>
                            {restaurant.openingHours.isOpenNow ? "Open" : "Closed"}
                          </span>
                        )}
                      </div>
                      {restaurant.openingHours.weekdayText.map((hour, i) => {
                        const isToday = ((i + 1) % 7) === new Date().getDay()
                        return (
                          <div
                            key={i}
                            className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm ${
                              isToday
                                ? "bg-primary/8 border border-primary/15"
                                : "bg-background border border-border"
                            }`}
                          >
                            <span className={`font-medium ${isToday ? "text-primary" : "text-foreground"}`}>
                              {hour.split(": ")[0]}
                              {isToday && <span className="ml-2 text-xs font-normal opacity-70">(Today)</span>}
                            </span>
                            <span className="text-muted-foreground">{hour.split(": ")[1]}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <EmptyState icon={<Clock className="h-10 w-10" />} message="Opening hours not available" />
                  )}
                </TabsContent>

                {/* Features */}
                <TabsContent value="features" className="mt-4">
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
                  {restaurant.dineIn === undefined && restaurant.takeout === undefined && restaurant.delivery === undefined && (
                    <EmptyState icon={<Utensils className="h-10 w-10" />} message="Feature information not available" />
                  )}
                </TabsContent>

                {/* Reviews */}
                <TabsContent value="reviews" className="mt-4">
                  {restaurant.reviews?.length ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">
                          {restaurant.reviews.length} reviews
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                          <Star className="h-3.5 w-3.5 fill-primary" />
                          {restaurant.rating?.toFixed(1)}
                        </span>
                      </div>
                      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                        {restaurant.reviews.map((review, i) => (
                          <div key={i} className="rounded-xl bg-background border border-border p-4 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {review.profilePhotoUrl && (
                                  <Image
                                    src={review.profilePhotoUrl}
                                    alt={review.authorName}
                                    width={36}
                                    height={36}
                                    className="rounded-full ring-1 ring-border"
                                  />
                                )}
                                <div>
                                  <a
                                    href={review.authorUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                                  >
                                    {review.authorName}
                                  </a>
                                  <p className="text-xs text-muted-foreground">{review.relativeTimeDescription}</p>
                                </div>
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary flex-shrink-0">
                                <Star className="h-3 w-3 fill-primary" />
                                {review.rating}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">{review.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState icon={<Star className="h-10 w-10" />} message="No reviews available yet" />
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-80 text-muted-foreground">
            <p>Restaurant not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function InfoRow({ icon, label, children, hoverable }: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
  hoverable?: boolean
}) {
  return (
    <div className={`flex items-start gap-3 rounded-xl border border-border bg-background p-3 ${hoverable ? "hover:bg-secondary/50 transition-colors" : ""}`}>
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-foreground mb-0.5">{label}</p>
        <div className="flex items-center gap-2 text-sm">{children}</div>
      </div>
    </div>
  )
}

function EmptyState({ icon, message }: { icon: React.ReactNode; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
      <div className="opacity-30 mb-3">{icon}</div>
      <p className="text-sm">{message}</p>
    </div>
  )
}
