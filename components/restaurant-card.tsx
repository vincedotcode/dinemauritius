"use client"

import Image from "next/image"
import { Star, MapPin, Navigation } from "lucide-react"
import { Restaurant } from "@/lib/types"

interface RestaurantCardProps {
  restaurant: Restaurant
  onClick: () => void
}

function formatType(type: string) {
  return type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
}

export function RestaurantCard({ restaurant, onClick }: RestaurantCardProps) {
  const photoUrl = restaurant.photoUrl || restaurant.photoUrls?.[0]

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer rounded-xl border border-border bg-card overflow-hidden
        transition-all duration-300
        hover:shadow-[0px_0px_0px_1px_var(--ring-warm),0px_4px_24px_rgba(0,0,0,0.05)]
        hover:border-transparent"
      style={{ '--ring-warm': '#d1cfc5' } as React.CSSProperties}
    >
      {/* Photo */}
      <div className="relative h-48 w-full overflow-hidden bg-secondary">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={restaurant.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <span className="text-sm text-muted-foreground">No image</span>
          </div>
        )}

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

        {/* Open / Closed — terracotta or warm dark, no green/red */}
        {restaurant.isOpenNow !== undefined && (
          <div className="absolute top-3 right-3">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm ${
              restaurant.isOpenNow
                ? "bg-primary/90 text-primary-foreground"
                : "bg-foreground/75 text-background"
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {restaurant.isOpenNow ? "Open" : "Closed"}
            </span>
          </div>
        )}

        {/* District */}
        {restaurant.district && (
          <div className="absolute bottom-3 left-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
              <Navigation className="h-3 w-3" />
              {restaurant.district}
            </span>
          </div>
        )}

        {/* Photo count */}
        {restaurant.photoUrls && restaurant.photoUrls.length > 1 && (
          <div className="absolute bottom-3 right-3 rounded-full bg-background/90 px-2.5 py-1 text-xs text-muted-foreground backdrop-blur-sm">
            +{restaurant.photoUrls.length - 1}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <div>
          <h3 className="font-serif font-medium text-[1.05rem] leading-snug text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {restaurant.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="line-clamp-1">{restaurant.address}</span>
          </p>
        </div>

        {/* Rating row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-medium text-primary">
              <Star className="h-3.5 w-3.5 fill-primary" />
              {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : "N/A"}
            </span>
            <span className="text-xs text-muted-foreground">
              ({(restaurant.userRatingsTotal || 0).toLocaleString()})
            </span>
          </div>
          {!!restaurant.priceLevel && (
            <span className="text-sm font-medium text-muted-foreground">
              {"₨".repeat(restaurant.priceLevel)}
            </span>
          )}
        </div>

        {/* Cuisine tags */}
        {restaurant.types && restaurant.types.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
            {restaurant.types
              .filter(t => !["point_of_interest", "establishment", "food"].includes(t))
              .slice(0, 3)
              .map(type => (
                <span
                  key={type}
                  className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                >
                  {formatType(type)}
                </span>
              ))}
          </div>
        )}
      </div>
    </article>
  )
}
