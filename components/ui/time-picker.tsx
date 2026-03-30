"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/libs/utils/utils"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export function TimePicker({
  value = "00:00",
  onChange,
  disabled,
  className,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false)

  const [hourStr, minuteStr] = value.split(":")
  const hour = parseInt(hourStr || "0", 10)
  const minute = parseInt(minuteStr || "0", 10)

  const hours = Array.from({ length: 24 }, (_, i) => i)
  const minutes = Array.from({ length: 60 }, (_, i) => i)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? value : <span>Chọn giờ</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex h-[300px] w-[200px] divide-x">
          <ScrollArea className="w-1/2">
            <div className="flex flex-col p-2">
              <span className="mb-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Giờ
              </span>
              {hours.map((h) => {
                const formattedHour = h.toString().padStart(2, "0")
                return (
                  <Button
                    key={h}
                    variant={hour === h ? "default" : "ghost"}
                    className="w-full shrink-0 justify-center mb-1"
                    onClick={() => {
                      if (onChange) {
                        onChange(`${formattedHour}:${minute.toString().padStart(2, "0")}`)
                      }
                    }}
                  >
                    {formattedHour}
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
          <ScrollArea className="w-1/2">
            <div className="flex flex-col p-2">
              <span className="mb-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Phút
              </span>
              {minutes.map((m) => {
                const formattedMinute = m.toString().padStart(2, "0")
                return (
                  <Button
                    key={m}
                    variant={minute === m ? "default" : "ghost"}
                    className="w-full shrink-0 justify-center mb-1"
                    onClick={() => {
                      if (onChange) {
                        onChange(`${hour.toString().padStart(2, "0")}:${formattedMinute}`)
                        setOpen(false) // Close popover after full selection if desired, or keep open
                      }
                    }}
                  >
                    {formattedMinute}
                  </Button>
                )
              })}
            </div>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
