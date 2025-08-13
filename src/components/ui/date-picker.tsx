
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "../../lib/utils"
import Button from "./Button"
import { Calendar } from "./calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./popover"

interface DatePickerProps {
  date?: Date
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean | ((date: Date) => boolean)
  className?: string
  label?: string
  required?: boolean
}

export function DatePicker({
  date,
  selected,
  onSelect,
  placeholder = "Pick a date",
  disabled = false,
  className,
  label,
  required = false
}: DatePickerProps) {
  const selectedDate = selected || date;
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-foreground mb-2">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-12 px-3",
              !selectedDate && "text-muted-foreground"
            )}
            disabled={typeof disabled === 'boolean' ? disabled : false}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? format(selectedDate, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onSelect}
            disabled={typeof disabled === 'function' ? disabled : undefined}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

DatePicker.displayName = "DatePicker"