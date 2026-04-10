"use client"

import { Search } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: () => void
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSearch()
  }

  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-muted-foreground pointer-events-none" />
      <input
        type="text"
        placeholder="Search restaurants, cuisines, districts…"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-11 pl-11 pr-4 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground text-sm
          focus:outline-none focus:border-[#3898ec] focus:ring-2 focus:ring-[#3898ec]/20
          transition-colors"
      />
    </div>
  )
}
