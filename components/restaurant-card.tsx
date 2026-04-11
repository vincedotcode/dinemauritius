'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { MapPin, Navigation, Star, ChevronLeft, ChevronRight, Globe, Phone, Clock } from 'lucide-react'
import type { Restaurant } from '@/lib/types'

interface RestaurantCardProps {
  restaurant: Restaurant
  priority?: boolean
  variant?: 'deck' | 'saved' | 'grid'
  onClick?: () => void
}

function formatType(type: string) {
  return type
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function getCuisineTags(restaurant: Restaurant) {
  return restaurant.types
    .filter(t => !['point_of_interest', 'establishment', 'food', 'restaurant'].includes(t))
    .slice(0, 3)
    .map(formatType)
}

function buildBlurb(restaurant: Restaurant, cuisines: string[]) {
  if (restaurant.rating >= 4.6) return `One of the highest-rated spots${restaurant.district ? ` in ${restaurant.district}` : ''}.`
  if (cuisines[0]) return `${cuisines[0]} worth lining up for${restaurant.district ? ` in ${restaurant.district}` : ''}.`
  return `A table worth a closer look${restaurant.district ? ` in ${restaurant.district}` : ''}.`
}

// ── Saved (compact horizontal card) ─────────────────────────────────────────
function SavedCard({ restaurant }: { restaurant: Restaurant }) {
  const photoUrl = restaurant.photoUrl || restaurant.photoUrls?.[0]
  const cuisines = getCuisineTags(restaurant)

  return (
    <article className="group flex items-stretch overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all duration-200 hover:ring-[#d1cfc5] hover:shadow-[0px_4px_16px_rgba(0,0,0,0.04)]">
      <div className="relative w-28 shrink-0 bg-secondary sm:w-32">
        {photoUrl ? (
          <Image src={photoUrl} alt={restaurant.name} fill className="object-cover" sizes="128px" />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary">
            <MapPin className="h-5 w-5 text-muted-foreground/40" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div className="space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-1 font-serif text-[1.1rem] text-foreground">{restaurant.name}</h3>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              <Star className="h-3 w-3 fill-primary" />
              {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'New'}
            </span>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Navigation className="h-3 w-3 shrink-0" />
            {restaurant.district || 'Mauritius'}
          </p>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {cuisines.length > 0
            ? cuisines.map(t => (
                <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground">{t}</span>
              ))
            : <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground">Restaurant</span>
          }
        </div>
      </div>
    </article>
  )
}

// ── Grid card (desktop view) ─────────────────────────────────────────────────
function GridCard({ restaurant, onClick }: { restaurant: Restaurant; onClick?: () => void }) {
  const photoUrl = restaurant.photoUrl || restaurant.photoUrls?.[0]
  const cuisines = getCuisineTags(restaurant)

  return (
    <article
      onClick={onClick}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-card ring-1 ring-border
        transition-all duration-300 hover:ring-[#d1cfc5] hover:shadow-[0px_8px_32px_rgba(0,0,0,0.06)]"
    >
      <div className="relative h-52 w-full overflow-hidden bg-secondary">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={restaurant.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1280px) 33vw, 400px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-secondary">
            <MapPin className="h-8 w-8 text-muted-foreground/25" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Top badges */}
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          {restaurant.isOpenNow !== undefined && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm ${
              restaurant.isOpenNow ? 'bg-primary/90 text-primary-foreground' : 'bg-foreground/70 text-background'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {restaurant.isOpenNow ? 'Open' : 'Closed'}
            </span>
          )}
        </div>
        <div className="absolute right-3 top-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
            <Star className="h-3 w-3 fill-white" />
            {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'New'}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-2">
        <div>
          <h3 className="font-serif text-[1.05rem] font-medium leading-snug text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {restaurant.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Navigation className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">{restaurant.address}</span>
          </p>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-border">
          <div className="flex flex-wrap gap-1">
            {cuisines.slice(0, 2).map(t => (
              <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">{t}</span>
            ))}
            {cuisines.length === 0 && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">Restaurant</span>}
          </div>
          {!!restaurant.priceLevel && (
            <span className="text-xs font-medium text-muted-foreground">{'₨'.repeat(restaurant.priceLevel)}</span>
          )}
        </div>
      </div>
    </article>
  )
}

// ── Deck card (mobile Tinder) ────────────────────────────────────────────────
function DeckCard({ restaurant, priority = false }: { restaurant: Restaurant; priority?: boolean }) {
  const allPhotos = [
    restaurant.photoUrl,
    ...(restaurant.photoUrls || []),
  ].filter((url): url is string => typeof url === 'string' && url.length > 0 && !url.includes('undefined'))

  // Deduplicate
  const photos = [...new Set(allPhotos)]
  const hasPhotos = photos.length > 0

  const [photoIndex, setPhotoIndex] = useState(0)
  const [imgError, setImgError] = useState<Set<number>>(new Set())

  const validPhotos = photos.filter((_, i) => !imgError.has(i))
  const currentPhoto = validPhotos[photoIndex] ?? null
  const totalPhotos = validPhotos.length

  const goNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoIndex(i => (i + 1) % Math.max(totalPhotos, 1))
  }, [totalPhotos])

  const goPrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setPhotoIndex(i => (i - 1 + Math.max(totalPhotos, 1)) % Math.max(totalPhotos, 1))
  }, [totalPhotos])

  const cuisines = getCuisineTags(restaurant)
  const blurb = buildBlurb(restaurant, cuisines)

  return (
    <article className="relative isolate flex w-full flex-col justify-end overflow-hidden rounded-[28px] bg-card"
      style={{ aspectRatio: '5/7', minHeight: 480 }}>

      {/* ── Photo ─────────────────────────────────────────────────── */}
      {currentPhoto ? (
        <Image
          src={currentPhoto}
          alt={restaurant.name}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) calc(100vw - 32px), 560px"
          onError={() => setImgError(prev => new Set([...prev, photoIndex]))}
        />
      ) : (
        /* Warm fallback when no photos available */
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          style={{ background: 'linear-gradient(135deg, #e8e6dc 0%, #f5f4ed 50%, #e8e6dc 100%)' }}>
          <MapPin className="h-12 w-12 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground/60 font-medium">No photos yet</p>
        </div>
      )}

      {/* ── Main gradient overlay ──────────────────────────────────── */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#141413]/96 via-[#141413]/40 to-transparent pointer-events-none" />

      {/* ── Story-bar photo indicators ────────────────────────────── */}
      {totalPhotos > 1 && (
        <div className="absolute inset-x-4 top-4 z-20 flex items-center gap-1 pointer-events-none">
          {validPhotos.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-0.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.3)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  background: i === photoIndex ? '#faf9f5' : i < photoIndex ? 'rgba(255,255,255,0.7)' : 'transparent',
                  width: i <= photoIndex ? '100%' : '0%',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ── Photo tap zones (left/right half) ─────────────────────── */}
      {totalPhotos > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous photo"
            className="absolute left-0 top-0 z-10 h-3/4 w-2/5 cursor-pointer"
            style={{ background: 'transparent' }}
          />
          <button
            type="button"
            onClick={goNext}
            aria-label="Next photo"
            className="absolute right-0 top-0 z-10 h-3/4 w-2/5 cursor-pointer"
            style={{ background: 'transparent' }}
          />

          {/* ── Chevron hints (faint, appear on hover) ─────────────── */}
          <div className="absolute left-3 top-1/3 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="h-7 w-7 text-white/60 drop-shadow" />
          </div>
          <div className="absolute right-3 top-1/3 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="h-7 w-7 text-white/60 drop-shadow" />
          </div>
        </>
      )}

      {/* ── Top badges ────────────────────────────────────────────── */}
      <div className="absolute inset-x-0 top-8 z-10 flex items-start justify-between gap-3 px-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-background/88 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur-sm">
            <Navigation className="h-3.5 w-3.5" />
            {restaurant.district || 'Mauritius'}
          </span>
          {restaurant.isOpenNow !== undefined && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-sm ${
              restaurant.isOpenNow ? 'bg-primary/90 text-primary-foreground' : 'bg-[#30302e]/90 text-[#faf9f5]'
            }`}>
              <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
              {restaurant.isOpenNow ? 'Open now' : 'Closed'}
            </span>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#141413]/80 px-3 py-1.5 text-xs font-medium text-[#faf9f5] backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-[#faf9f5]" />
            {restaurant.rating > 0 ? restaurant.rating.toFixed(1) : 'New'}
          </span>
          {!!restaurant.priceLevel && (
            <span className="rounded-full bg-background/88 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm shadow-sm">
              {'₨'.repeat(restaurant.priceLevel)}
            </span>
          )}
        </div>
      </div>

      {/* ── Bottom content ────────────────────────────────────────── */}
      <div className="relative z-10 space-y-3 p-6 text-[#faf9f5]">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#f5f4ed]/60">
          Dine Mauritius
        </p>
        <h2 className="font-serif text-[1.85rem] leading-[1.05] text-[#faf9f5]">
          {restaurant.name}
        </h2>
        <p className="text-sm leading-6 text-[#f5f4ed]/78 line-clamp-2">
          {blurb}
        </p>

        <div className="flex flex-wrap gap-2 pt-1">
          {cuisines.length > 0
            ? cuisines.map(t => (
                <span key={t} className="rounded-full bg-[#faf9f5]/12 px-3 py-1 text-xs font-medium text-[#faf9f5]">{t}</span>
              ))
            : <span className="rounded-full bg-[#faf9f5]/12 px-3 py-1 text-xs font-medium text-[#faf9f5]">Restaurant</span>
          }
        </div>

        <div className="flex items-center gap-4 border-t border-[#faf9f5]/12 pt-3 text-xs text-[#faf9f5]/60">
          <span className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 fill-[#faf9f5]/60" />
            {restaurant.userRatingsTotal?.toLocaleString() || 0} reviews
          </span>
          {totalPhotos > 1 && (
            <span className="flex items-center gap-1.5 ml-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-[#faf9f5]/50" />
              {photoIndex + 1} / {totalPhotos}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

// ── Exports ──────────────────────────────────────────────────────────────────
export function RestaurantCard({ restaurant, priority, variant = 'deck', onClick }: RestaurantCardProps) {
  if (variant === 'saved') return <SavedCard restaurant={restaurant} />
  if (variant === 'grid') return <GridCard restaurant={restaurant} onClick={onClick} />
  return <DeckCard restaurant={restaurant} priority={priority} />
}
