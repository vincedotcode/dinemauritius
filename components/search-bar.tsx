'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch?: () => void
  label?: string
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  label = 'Search restaurants',
}: SearchBarProps) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSearch?.()
    }
  }

  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
        <input
          aria-label={label}
          type="search"
          placeholder="Search by name, district, or cuisine"
          value={value}
          onChange={event => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#3898ec] focus:outline-none focus:ring-4 focus:ring-[#3898ec]/12"
        />
      </div>
    </label>
  )
}
