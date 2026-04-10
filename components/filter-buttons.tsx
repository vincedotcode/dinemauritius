"use client"

import { Button } from "@/components/ui/button"

interface FilterButtonsProps {
  selected: string
  onSelect: (filter: string) => void
}

const filters = [
  { label: "All", value: "restaurants" },
  { label: "Fine Dining", value: "fine dining" },
  { label: "Seafood", value: "seafood" },
  { label: "Indian", value: "indian" },
  { label: "Chinese", value: "chinese" },
  { label: "Creole", value: "creole" },
  { label: "French", value: "french" },
  { label: "Italian", value: "italian" },
  { label: "Cafe", value: "cafe" },
  { label: "Fast Food", value: "fast food" },
]

export function FilterButtons({ selected, onSelect }: FilterButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Button
          key={filter.value}
          variant={selected === filter.value ? "default" : "secondary"}
          size="sm"
          onClick={() => onSelect(filter.value)}
          className={
            selected === filter.value
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}
