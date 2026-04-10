import { RestaurantGrid } from "@/components/restaurant-grid"
import { MapPin } from "lucide-react"

export default function Home() {
  return (
    <main className="min-h-screen bg-background">

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center shadow-[0px_0px_0px_1px_#c96442]">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="leading-none">
              <p className="font-serif font-medium text-base text-foreground">Dine Mauritius</p>
              <p className="text-xs text-muted-foreground mt-0.5 font-sans">Restaurant Guide</p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#" className="text-foreground hover:text-primary transition-colors">Home</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="border-b border-border py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-3xl text-center">

            {/* Overline label */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 mb-7">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="text-sm font-medium text-primary">18 districts · Google Maps data</span>
            </div>

            {/* Headline — Playfair Display, weight 500 */}
            <h1 className="font-serif text-5xl md:text-6xl lg:text-[4rem] font-medium text-foreground leading-[1.08] tracking-tight text-balance">
              Discover the finest{" "}
              <em className="not-italic text-primary">restaurants</em>
              <br className="hidden md:block" />
              {" "}in Mauritius
            </h1>

            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
              Curated from Google Maps — photos, reviews, opening hours, and more
              across every corner of the island.
            </p>

          </div>
        </div>
      </section>

      {/* ── Restaurant Grid ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-6 py-12 pb-24">
        <RestaurantGrid />
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <MapPin className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="font-serif font-medium text-foreground">Dine Mauritius</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Data powered by Google Maps API · Stored in Upstash Redis
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dine Mauritius
          </p>
        </div>
      </footer>

    </main>
  )
}
