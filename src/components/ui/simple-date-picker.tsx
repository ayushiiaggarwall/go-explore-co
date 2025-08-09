import React from "react"
import { cn } from "../../lib/utils"

interface SimpleDatePickerProps {
  date?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
  required?: boolean
}

export function SimpleDatePicker({
  date,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
  className,
  label,
  required = false
}: SimpleDatePickerProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (value) {
      onSelect?.(new Date(value))
    } else {
      onSelect?.(undefined)
    }
  }

  const formatDateForInput = (date: Date | undefined) => {
    if (!date) return ""
    return date.toISOString().split('T')[0]
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <input
        type="date"
        value={formatDateForInput(date)}
        onChange={handleDateChange}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "w-full h-12 px-3 py-2 text-sm rounded-md border border-input bg-background",
          "text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          !date && "text-muted-foreground"
        )}
      />
    </div>
  )
}

SimpleDatePicker.displayName = "SimpleDatePicker"