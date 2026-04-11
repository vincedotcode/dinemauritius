'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import useSWR from 'swr'
import {
  Bookmark, Clock, Database, Eye, Heart, MapPin, RefreshCw,
  RotateCcw, Search, SlidersHorizontal, Sparkles, Star, X, ChevronDown,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { RestaurantCard } from './restaurant-card'
import { RestaurantDetailSheet } from './restaurant-detail-sheet'
import { SearchBar } from './search-bar'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Spinner } from '@/components/ui/spinner'
import type { District, Restaurant, SyncStatus } from '@/lib/types'

// ── Types ─────────────────────────────────────────────────────────────────────
interface ApiResponse {
  restaurants: Restaurant[]
  districts: District[]
  totalCount: number
  lastSync: string | null
  needsSync?: boolean
  error?: string
}
interface SyncResponse { status: SyncStatus; lastSync: string | null }
type ViewMode = 'discover' | 'saved'
type SwipeDirection = 'left' | 'right'
type SwipeHistoryItem = { id: string; action: 'saved' | 'dismissed' }
interface Particle { id: number; emoji: string; x: number; y: number }

// ── Constants ─────────────────────────────────────────────────────────────────
const SAVED_KEY = 'dine-mauritius:saved'
const DISMISSED_KEY = 'dine-mauritius:dismissed'
const FILTER_KEY = 'dine-mauritius:filters'
const SWIPE_THRESHOLD = 96
const SWIPE_EXIT_MS = 280
const FIRE_EMOJIS = ['🔥', '❤️', '🔥', '💛', '🔥', '✨', '❤️', '🔥']

const CUISINE_OPTIONS = [
  { value: 'all', label: 'All cuisines' },
  { value: 'indian', label: 'Indian' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'italian', label: 'Italian' },
  { value: 'french', label: 'French' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'thai', label: 'Thai' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'pizza', label: 'Pizza' },
  { value: 'cafe', label: 'Cafe' },
  { value: 'bar', label: 'Bar' },
]
const SORT_OPTIONS = [
  { value: 'rating', label: 'Best rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'price_low', label: 'Budget first' },
  { value: 'price_high', label: 'Splurge first' },
  { value: 'name', label: 'Name A–Z' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
const fetcher = (url: string) => fetch(url).then(r => r.json())
function clamp(v: number, min: number, max: number) { return Math.min(Math.max(v, min), max) }
function readList(key: string): string[] {
  if (typeof window === 'undefined') return []
  try { const p = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(p) ? p.filter(x => typeof x === 'string') : [] } catch { return [] }
}
function getHashView(): ViewMode { return typeof window !== 'undefined' && window.location.hash === '#saved' ? 'saved' : 'discover' }
function fmtSync(s: string | null) {
  if (!s) return null
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s))
}
function sortBy(list: Restaurant[], by: string) {
  const n = [...list]
  if (by === 'reviews') n.sort((a, b) => (b.userRatingsTotal || 0) - (a.userRatingsTotal || 0))
  else if (by === 'name') n.sort((a, b) => a.name.localeCompare(b.name))
  else if (by === 'price_low') n.sort((a, b) => (a.priceLevel || 0) - (b.priceLevel || 0))
  else if (by === 'price_high') n.sort((a, b) => (b.priceLevel || 0) - (a.priceLevel || 0))
  else n.sort((a, b) => (b.rating || 0) - (a.rating || 0))
  return n
}

// ── Sub-components ────────────────────────────────────────────────────────────
function WarmSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="relative">
        <select
          aria-label={label}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-12 w-full appearance-none rounded-2xl border border-border bg-card px-4 pr-10 text-sm text-foreground focus:border-[#3898ec] focus:outline-none focus:ring-4 focus:ring-[#3898ec]/12"
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </label>
  )
}

function DeckButton({ onClick, label, variant, disabled, children, btnRef }: {
  onClick: () => void; label: string; variant: 'skip' | 'detail' | 'save'; disabled?: boolean; children: React.ReactNode
  btnRef?: RefObject<HTMLButtonElement | null>
}) {
  const cls = {
    skip: 'h-14 w-14 rounded-full bg-secondary text-secondary-foreground shadow-[0px_0px_0px_1px_#d1cfc5]',
    detail: 'h-12 rounded-full bg-card px-5 text-foreground shadow-[0px_0px_0px_1px_#d1cfc5] text-sm font-medium',
    save: 'h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-[0px_0px_0px_1px_#c96442,0px_4px_20px_rgba(201,100,66,0.35)]',
  }
  return (
    <button ref={btnRef} type="button" aria-label={label} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center transition-all duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-45 ${cls[variant]}`}>
      {children}
    </button>
  )
}

// Fire particle burst
function Particles({ particles }: { particles: Particle[] }) {
  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {particles.map((p, i) => {
        const dur = 0.9 + (i % 4) * 0.15
        return (
          <div
            key={p.id}
            className="absolute text-5xl select-none"
            style={{
              left: p.x,
              top: p.y,
              animation: `fireFloat${i % 3} ${dur}s ease-out forwards`,
              animationDelay: `${i * 0.04}s`,
              filter: 'drop-shadow(0 0 10px rgba(201,100,66,0.7))',
            }}
          >
            {p.emoji}
          </div>
        )
      })}
    </div>
  )
}

// ── Desktop layout ────────────────────────────────────────────────────────────
function DesktopView({
  restaurants, districts, allRestaurants, savedCount, savedIds,
  selectedDistrict, setSelectedDistrict, selectedCuisine, setSelectedCuisine,
  sort, setSort, searchQuery, setSearchQuery, openNowOnly, setOpenNowOnly,
  onOpenRestaurant, onSync, syncActive, syncStatus, lastSyncLabel, needsSync,
  savedRestaurants, onClearSaved, view, setView, error, isLoading,
}: {
  restaurants: Restaurant[]
  districts: District[]
  allRestaurants: Restaurant[]
  savedCount: number
  savedIds: string[]
  selectedDistrict: string; setSelectedDistrict: (v: string) => void
  selectedCuisine: string; setSelectedCuisine: (v: string) => void
  sort: string; setSort: (v: string) => void
  searchQuery: string; setSearchQuery: (v: string) => void
  openNowOnly: boolean; setOpenNowOnly: (v: boolean) => void
  onOpenRestaurant: (id: string) => void
  onSync: () => void; syncActive: boolean; syncStatus?: SyncStatus | null
  lastSyncLabel: string | null; needsSync: boolean
  savedRestaurants: Restaurant[]; onClearSaved: () => void
  view: ViewMode; setView: (v: ViewMode) => void
  error: boolean; isLoading: boolean
}) {
  const districtOptions = [
    { value: 'all', label: 'All districts' },
    ...districts.map(d => ({ value: d.name, label: `${d.name} (${d.restaurantCount})` })),
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* ── Desktop Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-8 py-4">
          {/* Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-[0px_0px_0px_1px_#c96442]">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <p className="font-serif font-medium text-[1.05rem] text-foreground leading-none">Dine Mauritius</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">Restaurant guide</p>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 max-w-md">
            <SearchBar value={searchQuery} onChange={setSearchQuery} label="Search restaurants" />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* View toggle */}
            <div className="flex rounded-xl border border-border bg-card overflow-hidden">
              {(['discover', 'saved'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {v === 'discover' ? <Sparkles className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                  {v === 'discover' ? 'Browse' : `Saved${savedCount > 0 ? ` (${savedCount})` : ''}`}
                </button>
              ))}
            </div>

            {/* Sync */}
            <button type="button" onClick={onSync} disabled={syncActive}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
              {syncActive ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
              {syncActive ? 'Syncing…' : 'Sync'}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-8 py-8">
        {view === 'discover' ? (
          <div className="flex gap-8">
            {/* ── Sidebar ──────────────────────────────────────────── */}
            <aside className="w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-4">
                {/* Stats card */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                  <p className="font-serif text-[1.15rem] text-foreground">Your shortlist</p>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Restaurants', value: allRestaurants.length },
                      { label: 'Saved', value: savedCount },
                    ].map(stat => (
                      <div key={stat.label} className="rounded-xl bg-secondary p-3 text-center">
                        <p className="font-serif text-2xl text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  {lastSyncLabel && (
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {lastSyncLabel}
                    </p>
                  )}
                </div>

                {/* Sync banner */}
                {(needsSync || syncActive) && (
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                        <Database className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-foreground">
                          {syncActive ? 'Syncing…' : 'Needs first sync'}
                        </p>
                        {syncActive && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {syncStatus?.currentDistrict} · {syncStatus?.progress || 0}%
                          </p>
                        )}
                      </div>
                    </div>
                    {syncActive && (
                      <div className="h-1 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${syncStatus?.progress || 0}%` }} />
                      </div>
                    )}
                    {!syncActive && (
                      <button type="button" onClick={onSync}
                        className="w-full h-10 rounded-xl bg-primary text-sm font-medium text-primary-foreground hover:bg-[#b8573a] transition-colors">
                        Sync all districts
                      </button>
                    )}
                  </div>
                )}

                {/* Filters */}
                <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                  <p className="font-serif text-[1.1rem] text-foreground">Filter</p>

                  {/* District */}
                  <label className="grid gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">District</span>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <select
                        value={selectedDistrict}
                        onChange={e => setSelectedDistrict(e.target.value)}
                        className="h-10 w-full appearance-none rounded-xl border border-border bg-background pl-9 pr-8 text-sm text-foreground focus:border-[#3898ec] focus:outline-none"
                      >
                        {districtOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </label>

                  {/* Cuisine */}
                  <label className="grid gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cuisine</span>
                    <div className="relative">
                      <select
                        value={selectedCuisine}
                        onChange={e => setSelectedCuisine(e.target.value)}
                        className="h-10 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-8 text-sm text-foreground focus:border-[#3898ec] focus:outline-none"
                      >
                        {CUISINE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </label>

                  {/* Sort */}
                  <label className="grid gap-2">
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sort</span>
                    <div className="relative">
                      <select
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                        className="h-10 w-full appearance-none rounded-xl border border-border bg-background px-3 pr-8 text-sm text-foreground focus:border-[#3898ec] focus:outline-none"
                      >
                        {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </label>

                  {/* Open now toggle */}
                  <button
                    type="button"
                    onClick={() => setOpenNowOnly(!openNowOnly)}
                    className={`flex h-10 w-full items-center justify-between rounded-xl border px-3 text-sm font-medium transition-colors ${
                      openNowOnly ? 'border-primary bg-primary/8 text-primary' : 'border-border bg-background text-foreground'
                    }`}
                  >
                    <span>Open now only</span>
                    <span className={`h-5 w-9 rounded-full transition-colors relative ${openNowOnly ? 'bg-primary' : 'bg-secondary'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${openNowOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </span>
                  </button>

                  {(selectedDistrict !== 'all' || selectedCuisine !== 'all' || openNowOnly || searchQuery) && (
                    <button
                      type="button"
                      onClick={() => { setSelectedDistrict('all'); setSelectedCuisine('all'); setOpenNowOnly(false); setSearchQuery('') }}
                      className="w-full h-9 rounded-xl bg-secondary text-sm text-secondary-foreground hover:bg-border transition-colors"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </aside>

            {/* ── Main grid ─────────────────────────────────────────── */}
            <main className="flex-1 min-w-0">
              {/* Hero header */}
              <div className="mb-8">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-2">
                  {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
                  {selectedDistrict !== 'all' && ` in ${selectedDistrict}`}
                </p>
                <h1 className="font-serif text-[2.25rem] text-foreground leading-tight">
                  Discover restaurants<br />across Mauritius.
                </h1>
              </div>

              {error ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <p className="font-serif text-2xl text-foreground mb-2">Unable to load</p>
                  <p className="text-sm text-muted-foreground">Please try refreshing.</p>
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Spinner className="h-10 w-10 text-primary" />
                </div>
              ) : restaurants.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className="font-serif text-xl text-foreground mb-1">No restaurants found</p>
                  <p className="text-sm text-muted-foreground">Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {restaurants.map(r => (
                    <RestaurantCard key={r.id} restaurant={r} variant="grid" onClick={() => onOpenRestaurant(r.id)} />
                  ))}
                </div>
              )}
            </main>
          </div>
        ) : (
          /* ── Saved view (desktop) ────────────────────────────────── */
          <div>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-2">Saved shortlist</p>
                <h2 className="font-serif text-[2.25rem] text-foreground">Your table picks.</h2>
              </div>
              {savedRestaurants.length > 0 && (
                <button type="button" onClick={onClearSaved}
                  className="h-10 rounded-xl border border-border bg-card px-4 text-sm text-foreground hover:bg-secondary transition-colors">
                  Clear all
                </button>
              )}
            </div>

            {savedRestaurants.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {savedRestaurants.map(r => (
                  <div key={r.id} onClick={() => onOpenRestaurant(r.id)} className="cursor-pointer">
                    <RestaurantCard restaurant={r} variant="grid" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card py-24 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="font-serif text-xl text-foreground mb-1">Nothing saved yet</p>
                <p className="text-sm text-muted-foreground mb-5">Use the swipe view on mobile, or switch to Browse to explore.</p>
                <button type="button" onClick={() => setView('discover')}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  Browse restaurants
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function RestaurantGrid({ initialData }: { initialData?: ApiResponse }) {
  const router = useRouter()
  const [view, setView] = useState<ViewMode>('discover')
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null)
  const [selectedRestaurantHint, setSelectedRestaurantHint] = useState<Restaurant | null>(null)

  const openSheet = useCallback((restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant.id)
    setSelectedRestaurantHint(restaurant)
  }, [])
  const [isSyncing, setIsSyncing] = useState(false)
  const [pollSync, setPollSync] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [savedIds, setSavedIds] = useState<string[]>([])
  const [dismissedIds, setDismissedIds] = useState<string[]>([])
  const [history, setHistory] = useState<SwipeHistoryItem[]>([])
  const [announcement, setAnnouncement] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [particles, setParticles] = useState<Particle[]>([])
  const particleId = useRef(0)
  const saveButtonRef = useRef<HTMLButtonElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('all')
  const [selectedCuisine, setSelectedCuisine] = useState('all')
  const [sort, setSort] = useState('rating')
  const [openNowOnly, setOpenNowOnly] = useState(false)

  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exitDir, setExitDir] = useState<SwipeDirection | null>(null)
  const startX = useRef(0)
  const startY = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>('/api/restaurants', fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: !initialData,  // skip re-fetch when SSR already gave us data
    fallbackData: initialData,
  })
  const { data: syncData, mutate: mutateSyncStatus } = useSWR<SyncResponse>('/api/sync', fetcher, {
    refreshInterval: pollSync ? 3000 : 0,
  })

  const responseData = data || initialData

  // Hash navigation
  useEffect(() => {
    setView(getHashView())
    const h = () => setView(getHashView())
    window.addEventListener('hashchange', h)
    return () => window.removeEventListener('hashchange', h)
  }, [])
  useEffect(() => {
    const next = view === 'saved' ? '#saved' : '#discover'
    if (window.location.hash !== next) window.history.replaceState(null, '', next)
  }, [view])

  // Reduced motion
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(m.matches)
    const h = () => setReducedMotion(m.matches)
    m.addEventListener('change', h)
    return () => m.removeEventListener('change', h)
  }, [])

  // Hydrate storage
  useEffect(() => {
    setSavedIds(readList(SAVED_KEY))
    setDismissedIds(readList(DISMISSED_KEY))
    try {
      const f = JSON.parse(localStorage.getItem(FILTER_KEY) || 'null')
      if (f && typeof f === 'object') {
        if (typeof f.searchQuery === 'string') setSearchQuery(f.searchQuery)
        if (typeof f.selectedDistrict === 'string') setSelectedDistrict(f.selectedDistrict)
        if (typeof f.selectedCuisine === 'string') setSelectedCuisine(f.selectedCuisine)
        if (typeof f.sort === 'string') setSort(f.sort)
        if (typeof f.openNowOnly === 'boolean') setOpenNowOnly(f.openNowOnly)
      }
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  useEffect(() => { if (hydrated) localStorage.setItem(SAVED_KEY, JSON.stringify(savedIds)) }, [hydrated, savedIds])
  useEffect(() => { if (hydrated) localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissedIds)) }, [hydrated, dismissedIds])
  useEffect(() => {
    if (hydrated) localStorage.setItem(FILTER_KEY, JSON.stringify({ searchQuery, selectedDistrict, selectedCuisine, sort, openNowOnly }))
  }, [hydrated, searchQuery, selectedDistrict, selectedCuisine, sort, openNowOnly])

  useEffect(() => {
    if (syncData?.status?.isRunning) { setPollSync(true); return }
    if (!isSyncing) setPollSync(false)
  }, [isSyncing, syncData?.status?.isRunning])

  const allRestaurants = responseData?.restaurants || []

  const filteredRestaurants = useMemo(() => {
    let next = [...allRestaurants]
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase()
      next = next.filter(r =>
        r.name.toLowerCase().includes(q) || r.address.toLowerCase().includes(q) ||
        r.district.toLowerCase().includes(q) || r.types.some(t => t.toLowerCase().includes(q))
      )
    }
    if (selectedDistrict !== 'all') next = next.filter(r => r.district === selectedDistrict)
    if (selectedCuisine !== 'all') next = next.filter(r => r.types.some(t => t.toLowerCase().includes(selectedCuisine)))
    if (openNowOnly) next = next.filter(r => r.isOpenNow)
    return sortBy(next, sort)
  }, [allRestaurants, searchQuery, selectedDistrict, selectedCuisine, openNowOnly, sort])

  const restaurantsById = useMemo(() => new Map(allRestaurants.map(r => [r.id, r])), [allRestaurants])
  const savedSet = useMemo(() => new Set(savedIds), [savedIds])
  const dismissedSet = useMemo(() => new Set(dismissedIds), [dismissedIds])
  const decidedSet = useMemo(() => new Set([...savedSet, ...dismissedSet]), [savedSet, dismissedSet])

  // For deck: prefer restaurants with photos
  const deckPool = useMemo(() => {
    const undecided = filteredRestaurants.filter(r => !decidedSet.has(r.id))
    const withPhotos = undecided.filter(r => r.photoUrl || r.photoUrls?.length)
    return withPhotos.length > 0 ? withPhotos : undecided
  }, [filteredRestaurants, decidedSet])

  const savedRestaurants = useMemo(
    () => savedIds.map(id => restaurantsById.get(id)).filter((r): r is Restaurant => Boolean(r)),
    [restaurantsById, savedIds]
  )

  const currentRestaurant = deckPool[0]
  const nextRestaurant = deckPool[1]
  const nextNextRestaurant = deckPool[2]
  const syncStatus = syncData?.status
  const syncActive = isSyncing || Boolean(syncStatus?.isRunning)
  const needsSync = responseData?.needsSync || allRestaurants.length === 0
  const lastSyncLabel = fmtSync(responseData?.lastSync || syncData?.lastSync || null)
  const progress = filteredRestaurants.length > 0
    ? ((filteredRestaurants.length - deckPool.length) / filteredRestaurants.length) * 100 : 0
  const hasFilters = [searchQuery.trim(), selectedDistrict !== 'all', selectedCuisine !== 'all', openNowOnly].some(Boolean)

  // Fire particles
  const spawnParticles = useCallback(() => {
    if (reducedMotion) return
    const btn = saveButtonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    // Spawn 3 waves for a fuller burst
    const allEmojis = [...FIRE_EMOJIS, ...FIRE_EMOJIS.slice(0, 4)]
    const newParticles: Particle[] = allEmojis.map((emoji) => ({
      id: particleId.current++,
      emoji,
      x: cx + (Math.random() - 0.5) * 100,
      y: cy + (Math.random() - 0.5) * 60,
    }))
    setParticles(prev => [...prev, ...newParticles])
    setTimeout(() => setParticles(prev => prev.filter(p => !newParticles.find(n => n.id === p.id))), 1800)
  }, [reducedMotion])

  const triggerSwipe = useCallback((direction: SwipeDirection) => {
    if (!currentRestaurant || exitDir) return
    setExitDir(direction)
    if (direction === 'right') spawnParticles()
    window.setTimeout(() => {
      if (direction === 'right') {
        setSavedIds(prev => [currentRestaurant.id, ...prev.filter(id => id !== currentRestaurant.id)])
        setDismissedIds(prev => prev.filter(id => id !== currentRestaurant.id))
        setHistory(prev => [...prev, { id: currentRestaurant.id, action: 'saved' }])
        setAnnouncement(`Saved ${currentRestaurant.name}.`)
      } else {
        setDismissedIds(prev => [currentRestaurant.id, ...prev.filter(id => id !== currentRestaurant.id)])
        setHistory(prev => [...prev, { id: currentRestaurant.id, action: 'dismissed' }])
        setAnnouncement(`Skipped ${currentRestaurant.name}.`)
      }
      setDragX(0); setDragY(0); setIsDragging(false); setExitDir(null)
    }, reducedMotion ? 0 : SWIPE_EXIT_MS)
  }, [currentRestaurant, exitDir, reducedMotion, spawnParticles])

  const undoLast = () => {
    const last = history[history.length - 1]
    if (!last) return
    setHistory(prev => prev.slice(0, -1))
    if (last.action === 'saved') { setSavedIds(prev => prev.filter(id => id !== last.id)); setAnnouncement('Removed last saved.') }
    else { setDismissedIds(prev => prev.filter(id => id !== last.id)); setAnnouncement('Restored last skipped.') }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!currentRestaurant || exitDir) return
    setIsDragging(true)
    startX.current = e.clientX; startY.current = e.clientY
    cardRef.current?.setPointerCapture(e.pointerId)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || reducedMotion) return
    setDragX(e.clientX - startX.current)
    setDragY((e.clientY - startY.current) * 0.12)
  }
  const handlePointerUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (Math.abs(dragX) >= SWIPE_THRESHOLD) { triggerSwipe(dragX > 0 ? 'right' : 'left'); return }
    // Tap detection: minimal movement = open detail sheet
    if (Math.abs(dragX) < 8 && currentRestaurant) openSheet(currentRestaurant)
    setDragX(0); setDragY(0)
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (view !== 'discover' || !currentRestaurant) return
      if (e.key === 'ArrowRight') triggerSwipe('right')
      if (e.key === 'ArrowLeft') triggerSwipe('left')
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [currentRestaurant, triggerSwipe, view])

  const handleSync = async () => {
    setIsSyncing(true); setPollSync(true)
    try {
      const res = await fetch('/api/sync', { method: 'POST' })
      const result = await res.json()
      if (res.ok && result.success) { await Promise.all([mutate(), mutateSyncStatus()]); setAnnouncement(`Sync complete. ${result.totalRestaurants} restaurants ready.`) }
    } catch (e) { console.error('Sync error:', e) }
    finally { setIsSyncing(false) }
  }

  const rotation = reducedMotion ? 0 : clamp(dragX * 0.06, -16, 16)
  const likeOpacity = clamp(dragX / SWIPE_THRESHOLD, 0, 1)
  const skipOpacity = clamp(-dragX / SWIPE_THRESHOLD, 0, 1)

  let cardStyle: React.CSSProperties = {
    transform: `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`,
    transition: isDragging || reducedMotion ? 'none' : 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
    zIndex: 10, cursor: isDragging ? 'grabbing' : 'grab', touchAction: 'none',
  }
  if (exitDir === 'left') cardStyle = { transform: 'translateX(-120vw) rotate(-18deg)', transition: 'transform 0.28s ease-in', zIndex: 10 }
  if (exitDir === 'right') cardStyle = { transform: 'translateX(120vw) rotate(18deg)', transition: 'transform 0.28s ease-in', zIndex: 10 }

  // Desktop breakpoint
  const [isDesktop, setIsDesktop] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const h = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])

  // ── Desktop ──────────────────────────────────────────────────────────────
  if (isDesktop) {
    return (
      <>
        <DesktopView
          restaurants={filteredRestaurants}
          districts={responseData?.districts || []}
          allRestaurants={allRestaurants}
          savedCount={savedIds.length}
          savedIds={savedIds}
          selectedDistrict={selectedDistrict} setSelectedDistrict={setSelectedDistrict}
          selectedCuisine={selectedCuisine} setSelectedCuisine={setSelectedCuisine}
          sort={sort} setSort={setSort}
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          openNowOnly={openNowOnly} setOpenNowOnly={setOpenNowOnly}
          onOpenRestaurant={(id) => router.push(`/restaurants/${id}`)}
          onSync={handleSync} syncActive={syncActive} syncStatus={syncStatus}
          lastSyncLabel={lastSyncLabel} needsSync={needsSync}
          savedRestaurants={savedRestaurants}
          onClearSaved={() => { setSavedIds([]); setAnnouncement('Saved shortlist cleared.') }}
          view={view} setView={setView}
          error={!!error} isLoading={isLoading && !responseData}
        />
      </>
    )
  }

  // ── Mobile (Tinder deck) ─────────────────────────────────────────────────
  const districtOptions = [
    { value: 'all', label: 'All districts' },
    ...(responseData?.districts || []).map(d => ({ value: d.name, label: `${d.name} (${d.restaurantCount})` })),
  ]

  // Skeleton deck shown while loading
  const showSkeleton = isLoading && !responseData

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div aria-live="polite" className="sr-only">{announcement}</div>
      <Particles particles={particles} />

      {/* ── Mobile Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md">
        <div className="flex items-end justify-between gap-3 px-5 pb-3 pt-5">
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.25em] text-muted-foreground/70 mb-1">Dine Mauritius</p>
            <h1 className="font-serif text-[1.75rem] leading-[1.1] text-foreground">
              {view === 'saved' ? 'Your table picks.' : 'Find your table.'}
            </h1>
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <button type="button" onClick={handleSync} disabled={syncActive}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-card shadow-[0px_0px_0px_1px_#e8e6dc] disabled:opacity-40 transition-opacity">
              {syncActive ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <DrawerTrigger asChild>
                <button type="button" className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-all ${hasFilters ? 'bg-primary text-primary-foreground shadow-[0px_0px_0px_1px_#c96442]' : 'bg-card shadow-[0px_0px_0px_1px_#e8e6dc] text-foreground'}`}>
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  {hasFilters ? 'Filtered' : 'Filter'}
                </button>
              </DrawerTrigger>
              <DrawerContent className="rounded-t-[24px] border-border bg-background">
                <DrawerHeader className="px-5 pb-2 pt-5 text-left">
                  <DrawerTitle className="font-serif text-[1.6rem] font-medium">Tune the deck</DrawerTitle>
                  <DrawerDescription className="text-sm text-muted-foreground">Narrow by district, cuisine, or open now.</DrawerDescription>
                </DrawerHeader>
                <div className="grid gap-4 px-5 pb-4">
                  <SearchBar value={searchQuery} onChange={setSearchQuery} label="Search restaurants" />
                  <WarmSelect label="District" value={selectedDistrict} onChange={setSelectedDistrict} options={districtOptions} />
                  <WarmSelect label="Cuisine" value={selectedCuisine} onChange={setSelectedCuisine} options={CUISINE_OPTIONS} />
                  <WarmSelect label="Sort" value={sort} onChange={setSort} options={SORT_OPTIONS} />
                  <button type="button" onClick={() => setOpenNowOnly(p => !p)}
                    className={`flex h-12 items-center justify-between rounded-2xl border px-4 text-sm font-medium transition-colors ${openNowOnly ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-foreground'}`}>
                    <span>Open now only</span>
                    <span className="text-xs">{openNowOnly ? 'On' : 'Off'}</span>
                  </button>
                </div>
                <DrawerFooter className="border-t border-border px-5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-4">
                  <button type="button" onClick={() => { setSearchQuery(''); setSelectedDistrict('all'); setSelectedCuisine('all'); setSort('rating'); setOpenNowOnly(false); setDrawerOpen(false) }}
                    className="h-12 rounded-full bg-card text-sm font-medium text-foreground shadow-[0px_0px_0px_1px_#d1cfc5]">
                    Reset
                  </button>
                  <DrawerClose asChild>
                    <button type="button" className="h-12 rounded-full bg-primary text-sm font-medium text-primary-foreground">Apply</button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
        {/* Thin separator line */}
        <div className="mx-5 h-px bg-border" />
      </header>

      <main className="flex flex-1 flex-col px-4 pb-[calc(env(safe-area-inset-bottom,0px)+96px)] pt-4">
        {/* Sync banner */}
        {(needsSync || syncActive) && !showSkeleton && (
          <div className="mb-4 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                <Database className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-serif text-[1.1rem] text-foreground">
                  {syncActive ? 'Loading restaurants…' : 'Sync needed'}
                </p>
                {syncActive
                  ? <p className="text-xs text-muted-foreground">{syncStatus?.currentDistrict} · {syncStatus?.progress || 0}% · {syncStatus?.totalRestaurants || 0} found</p>
                  : <button type="button" onClick={handleSync} className="mt-2 h-9 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">Sync now</button>
                }
              </div>
            </div>
            {syncActive && (
              <div className="mt-3 h-1 rounded-full bg-secondary overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${syncStatus?.progress || 0}%` }} />
              </div>
            )}
          </div>
        )}

        {error ? (
          <div className="flex flex-1 items-center justify-center text-center">
            <div>
              <p className="font-serif text-xl text-foreground">Something went wrong.</p>
              <button type="button" onClick={() => mutate()} className="mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">Try again</button>
            </div>
          </div>
        ) : showSkeleton ? (
          /* ── Skeleton deck ── beautiful placeholder while loading */
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="skeleton-shimmer h-4 w-28 rounded-full" />
            </div>
            <div className="skeleton-shimmer h-1 w-full rounded-full" />
            <div className="relative flex flex-1 items-center justify-center py-2">
              {/* 3rd card skeleton */}
              <div className="absolute w-full pointer-events-none" style={{ transform: 'scale(0.91) translateY(22px)', opacity: 0.45 }}>
                <div className="skeleton-shimmer w-full rounded-[28px]" style={{ aspectRatio: '5/7', minHeight: 480 }} />
              </div>
              {/* 2nd card skeleton */}
              <div className="absolute w-full pointer-events-none" style={{ transform: 'scale(0.96) translateY(10px)', opacity: 0.7 }}>
                <div className="skeleton-shimmer w-full rounded-[28px]" style={{ aspectRatio: '5/7', minHeight: 480 }} />
              </div>
              {/* Front card skeleton */}
              <div className="relative w-full rounded-[28px] overflow-hidden" style={{ aspectRatio: '5/7', minHeight: 480 }}>
                <div className="skeleton-shimmer absolute inset-0" />
                {/* Fake content overlay */}
                <div className="absolute inset-x-0 bottom-0 p-6 space-y-3">
                  <div className="skeleton-shimmer h-3 w-16 rounded-full opacity-60" />
                  <div className="skeleton-shimmer h-8 w-3/4 rounded-xl opacity-60" />
                  <div className="skeleton-shimmer h-4 w-full rounded-full opacity-40" />
                  <div className="skeleton-shimmer h-4 w-4/5 rounded-full opacity-40" />
                  <div className="flex gap-2 pt-1">
                    <div className="skeleton-shimmer h-7 w-20 rounded-full opacity-50" />
                    <div className="skeleton-shimmer h-7 w-16 rounded-full opacity-50" />
                  </div>
                </div>
              </div>
            </div>
            {/* Skeleton action buttons */}
            <div className="flex items-center justify-center gap-4 pb-1">
              <div className="skeleton-shimmer h-14 w-14 rounded-full" />
              <div className="skeleton-shimmer h-12 w-28 rounded-full" />
              <div className="skeleton-shimmer h-14 w-14 rounded-full" />
            </div>
          </div>
        ) : view === 'discover' ? (
          <section className="flex flex-1 flex-col gap-4">
            {/* Stats row */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{deckPool.length} left · {savedIds.length} saved</span>
              {hasFilters && (
                <button type="button" onClick={() => { setSearchQuery(''); setSelectedDistrict('all'); setSelectedCuisine('all'); setOpenNowOnly(false) }}
                  className="text-xs text-primary underline underline-offset-2">Clear filters</button>
              )}
            </div>

            {/* Progress bar */}
            <div className="h-1 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* Card stack */}
            <div className="relative flex flex-1 items-center justify-center py-2">
              {nextNextRestaurant && (
                <div className="pointer-events-none absolute w-full" style={{ transform: 'scale(0.91) translateY(22px)', opacity: 0.55 }}>
                  <RestaurantCard restaurant={nextNextRestaurant} />
                </div>
              )}
              {nextRestaurant && (
                <div className="pointer-events-none absolute w-full" style={{ transform: 'scale(0.96) translateY(10px)', opacity: 0.8 }}>
                  <RestaurantCard restaurant={nextRestaurant} />
                </div>
              )}

              {currentRestaurant ? (
                <div ref={cardRef} className="relative w-full group" style={cardStyle}
                  onPointerDown={handlePointerDown} onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
                  {/* SAVE stamp */}
                  {likeOpacity > 0.06 && (
                    <div className="pointer-events-none absolute left-5 top-12 z-20 rounded-xl border-[3px] border-[#faf9f5] px-3 py-1.5"
                      style={{ opacity: likeOpacity, transform: 'rotate(-10deg)' }}>
                      <span className="font-serif text-[1.4rem] uppercase tracking-[0.12em] text-[#faf9f5]">Save 🔥</span>
                    </div>
                  )}
                  {/* SKIP stamp */}
                  {skipOpacity > 0.06 && (
                    <div className="pointer-events-none absolute right-5 top-12 z-20 rounded-xl border-[3px] border-[#faf9f5]/60 px-3 py-1.5"
                      style={{ opacity: skipOpacity, transform: 'rotate(10deg)' }}>
                      <span className="font-serif text-[1.4rem] uppercase tracking-[0.12em] text-[#faf9f5]/80">Nope</span>
                    </div>
                  )}
                  <RestaurantCard restaurant={currentRestaurant} priority />
                </div>
              ) : (
                <div className="w-full rounded-[28px] border border-border bg-card px-8 py-16 text-center">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                    <Bookmark className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-serif text-[1.75rem] text-foreground">All done.</p>
                  <p className="mt-2 text-sm text-muted-foreground">{savedIds.length} saved · check your shortlist.</p>
                  <div className="mt-5 flex flex-col gap-2">
                    {history.length > 0 && (
                      <button type="button" onClick={undoLast} className="rounded-full bg-secondary py-2.5 text-sm font-medium text-secondary-foreground">
                        Undo last
                      </button>
                    )}
                    {hasFilters && (
                      <button type="button" onClick={() => { setSearchQuery(''); setSelectedDistrict('all'); setSelectedCuisine('all') }}
                        className="rounded-full bg-card py-2.5 text-sm font-medium text-foreground shadow-[0px_0px_0px_1px_#d1cfc5]">
                        Reset filters
                      </button>
                    )}
                    <button type="button" onClick={() => { setSavedIds([]); setDismissedIds([]); setHistory([]) }}
                      className="rounded-full bg-primary py-2.5 text-sm font-medium text-primary-foreground">
                      Start over
                    </button>
                  </div>
                </div>
              )}
            </div>

            {currentRestaurant && (
              <>
                <p className="text-center text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  ← Skip &nbsp;·&nbsp; Save →
                </p>
                <div className="flex items-center justify-center gap-4 pb-1">
                  <DeckButton label="Skip" variant="skip" disabled={!currentRestaurant || !!exitDir} onClick={() => triggerSwipe('left')}>
                    <X className="h-5 w-5" />
                  </DeckButton>
                  <DeckButton label="View details" variant="detail" disabled={!currentRestaurant} onClick={() => currentRestaurant && openSheet(currentRestaurant)}>
                    <span className="inline-flex items-center gap-2"><Eye className="h-4 w-4" />Details</span>
                  </DeckButton>
                  <DeckButton label="Save restaurant" variant="save" disabled={!currentRestaurant || !!exitDir} onClick={() => triggerSwipe('right')} btnRef={saveButtonRef}>
                    <Heart className="h-5 w-5 fill-current" />
                  </DeckButton>
                </div>
                {history.length > 0 && (
                  <div className="flex justify-center">
                    <button type="button" onClick={undoLast}
                      className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm text-foreground shadow-[0px_0px_0px_1px_#d1cfc5]">
                      <RotateCcw className="h-3.5 w-3.5" />Undo
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        ) : (
          /* ── Saved (mobile) ──────────────────────────────────────── */
          <section className="flex flex-1 flex-col gap-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Saved</p>
                <h2 className="font-serif text-[1.75rem] text-foreground">Your picks.</h2>
              </div>
              {savedRestaurants.length > 0 && (
                <button type="button" onClick={() => setSavedIds([])}
                  className="h-9 rounded-full bg-card px-4 text-sm text-foreground shadow-[0px_0px_0px_1px_#d1cfc5]">
                  Clear
                </button>
              )}
            </div>
            {savedRestaurants.length > 0 ? (
              <div className="grid gap-3">
                {savedRestaurants.map(r => (
                  <button key={r.id} type="button" onClick={() => openSheet(r)} className="text-left">
                    <RestaurantCard restaurant={r} variant="saved" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center rounded-[28px] border border-border bg-card py-16 text-center">
                <Bookmark className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="font-serif text-xl text-foreground">Nothing saved yet.</p>
                <button type="button" onClick={() => setView('discover')} className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
                  Back to discovery
                </button>
              </div>
            )}
          </section>
        )}
      </main>

      {/* ── Bottom nav — floating pill island ──────────────────────── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(env(safe-area-inset-bottom,0px)+16px)] pt-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1 rounded-[22px] bg-card/96 p-1.5 shadow-[0px_4px_32px_rgba(0,0,0,0.12),0px_0px_0px_1px_#e8e6dc] backdrop-blur-xl">
          {[
            { key: 'discover' as const, label: 'Discover', icon: <Sparkles className="h-4 w-4" /> },
            { key: 'saved' as const, label: savedIds.length > 0 ? `Saved · ${savedIds.length}` : 'Saved', icon: <Heart className={`h-4 w-4 ${savedIds.length > 0 ? 'fill-primary text-primary' : ''}`} /> },
          ].map(tab => (
            <button key={tab.key} type="button" onClick={() => setView(tab.key)}
              className={`flex items-center gap-2 rounded-[16px] px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                view === tab.key
                  ? 'bg-foreground text-background shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}>
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <RestaurantDetailSheet
        restaurantId={selectedRestaurant}
        hint={selectedRestaurantHint}
        onClose={() => { setSelectedRestaurant(null); setSelectedRestaurantHint(null) }}
      />
    </div>
  )
}
