"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { RestaurantCard } from "./restaurant-card"
import { RestaurantModal } from "./restaurant-modal"
import { SearchBar } from "./search-bar"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, RefreshCw, Database, MapPin, Clock, ChevronDown } from "lucide-react"
import { Restaurant, District, SyncStatus } from "@/lib/types"

interface ApiResponse {
  restaurants: Restaurant[]
  districts: District[]
  totalCount: number
  lastSync: string | null
  needsSync?: boolean
  error?: string
}

interface SyncResponse {
  status: SyncStatus
  lastSync: string | null
}

const fetcher = (url: string) => fetch(url).then(r => r.json())

const CUISINE_OPTIONS = [
  { value: "all", label: "All Cuisines" },
  { value: "indian", label: "Indian" },
  { value: "chinese", label: "Chinese" },
  { value: "italian", label: "Italian" },
  { value: "french", label: "French" },
  { value: "japanese", label: "Japanese" },
  { value: "thai", label: "Thai" },
  { value: "seafood", label: "Seafood" },
  { value: "pizza", label: "Pizza" },
  { value: "cafe", label: "Café" },
  { value: "bar", label: "Bar" },
]

const SORT_OPTIONS = [
  { value: "rating", label: "Highest Rated" },
  { value: "reviews", label: "Most Reviews" },
  { value: "name", label: "Name A–Z" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "price_high", label: "Price: High → Low" },
]

function WarmSelect({
  value,
  onChange,
  options,
  icon,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  icon?: React.ReactNode
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`h-11 appearance-none rounded-xl border border-border bg-card text-sm text-foreground
          focus:outline-none focus:border-[#3898ec] focus:ring-2 focus:ring-[#3898ec]/20
          transition-colors pr-9 ${icon ? "pl-9" : "pl-4"}`}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
    </div>
  )
}

export function RestaurantGrid() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("all")
  const [selectedCuisine, setSelectedCuisine] = useState("all")
  const [sortBy, setSortBy] = useState("rating")
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const buildUrl = useCallback(() => {
    const params = new URLSearchParams()
    if (selectedDistrict !== "all") params.set("district", selectedDistrict)
    if (searchQuery) params.set("search", searchQuery)
    if (selectedCuisine !== "all") params.set("cuisine", selectedCuisine)
    params.set("sortBy", sortBy)
    return `/api/restaurants?${params.toString()}`
  }, [selectedDistrict, searchQuery, selectedCuisine, sortBy])

  const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
    buildUrl(), fetcher, { revalidateOnFocus: false }
  )

  const { data: syncData, mutate: mutateSyncStatus } = useSWR<SyncResponse>(
    "/api/sync", fetcher, { refreshInterval: isSyncing ? 3000 : 0 }
  )

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch("/api/sync", { method: "POST" })
      const result = await res.json()
      if (result.success) { mutate(); mutateSyncStatus() }
    } catch (err) {
      console.error("Sync error:", err)
    } finally {
      setIsSyncing(false)
    }
  }

  const restaurants = data?.restaurants || []
  const districts = data?.districts || []
  const needsSync = data?.needsSync || restaurants.length === 0
  const syncStatus = syncData?.status

  const districtOptions = [
    { value: "all", label: "All Districts" },
    ...districts.map(d => ({ value: d.name, label: `${d.name} (${d.restaurantCount})` })),
  ]

  const activeFilters = [
    searchQuery && { label: `"${searchQuery}"`, clear: () => setSearchQuery("") },
    selectedDistrict !== "all" && { label: selectedDistrict, clear: () => setSelectedDistrict("all") },
    selectedCuisine !== "all" && { label: selectedCuisine, clear: () => setSelectedCuisine("all") },
  ].filter(Boolean) as { label: string; clear: () => void }[]

  return (
    <div className="space-y-8">

      {/* ── Sync Banner ──────────────────────────────────────────────────── */}
      {(needsSync || isSyncing || syncStatus?.isRunning) && (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Database className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="font-serif font-medium text-foreground">
                  {syncStatus?.isRunning || isSyncing ? "Syncing restaurant data…" : "Database is empty"}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {syncStatus?.isRunning || isSyncing
                    ? `Fetching ${syncStatus?.currentDistrict || "districts"} — ${syncStatus?.progress || 0}% complete · ${syncStatus?.totalRestaurants || 0} found`
                    : "Sync all restaurants from Google Maps to get started."}
                </p>
                {syncStatus?.error && (
                  <p className="text-sm text-destructive mt-1">{syncStatus.error}</p>
                )}
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing || syncStatus?.isRunning}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground
                shadow-[0px_0px_0px_1px_#c96442]
                hover:bg-[#b8573a] transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed flex-shrink-0"
            >
              {isSyncing || syncStatus?.isRunning ? (
                <><Spinner className="h-4 w-4" />Syncing…</>
              ) : (
                <><RefreshCw className="h-4 w-4" />Sync All Districts</>
              )}
            </button>
          </div>

          {/* Progress bar */}
          {(isSyncing || syncStatus?.isRunning) && (
            <div className="mt-4 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${syncStatus?.progress || 0}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Last Sync ────────────────────────────────────────────────────── */}
      {data?.lastSync && !needsSync && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last synced {new Date(data.lastSync).toLocaleString()}</span>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="ml-1 p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isSyncing ? "animate-spin" : ""}`} />
          </button>
        </div>
      )}

      {/* ── Search & Filters ─────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Search row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} onSearch={() => mutate()} />
          </div>
          <button
            onClick={() => mutate()}
            className="h-11 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-medium
              shadow-[0px_0px_0px_1px_#c96442]
              hover:bg-[#b8573a] transition-colors"
          >
            Search
          </button>
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap gap-3">
          <WarmSelect
            value={selectedDistrict}
            onChange={setSelectedDistrict}
            options={districtOptions}
            icon={<MapPin className="h-4 w-4" />}
          />
          <WarmSelect
            value={selectedCuisine}
            onChange={setSelectedCuisine}
            options={CUISINE_OPTIONS}
          />
          <WarmSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
          />
        </div>

        {/* Active filter pills */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {activeFilters.map(f => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-foreground"
              >
                {f.label}
                <button
                  onClick={f.clear}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              onClick={() => { setSearchQuery(""); setSelectedDistrict("all"); setSelectedCuisine("all") }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      {error ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4 opacity-60" />
          <p className="font-serif text-xl text-foreground mb-2">Unable to load restaurants</p>
          <p className="text-sm text-muted-foreground mb-5">There was an error loading data.</p>
          <button
            onClick={() => mutate()}
            className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-sm font-medium text-secondary-foreground hover:bg-border transition-colors"
          >
            <RefreshCw className="h-4 w-4" />Try Again
          </button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Spinner className="h-10 w-10 text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">Loading restaurants…</p>
        </div>
      ) : restaurants.length > 0 ? (
        <>
          <div className="flex items-center justify-between border-b border-border pb-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{restaurants.length}</span> restaurants
              {selectedDistrict !== "all" && <span> in {selectedDistrict}</span>}
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {restaurants.map(r => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                onClick={() => setSelectedRestaurant(r.id)}
              />
            ))}
          </div>
        </>
      ) : !needsSync ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center mb-4">
            <MapPin className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="font-serif text-xl text-foreground mb-1">No restaurants found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters or search query.</p>
        </div>
      ) : null}

      {/* Modal */}
      <RestaurantModal
        restaurantId={selectedRestaurant}
        onClose={() => setSelectedRestaurant(null)}
      />
    </div>
  )
}
