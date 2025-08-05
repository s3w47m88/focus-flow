'use client'

import * as React from 'react'
import { Clock } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

interface TimePickerProps {
  value: string
  onChange: (time: string) => void
  className?: string
  placeholder?: string
}

export function TimePicker({ value, onChange, className, placeholder = 'Select time' }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  // Generate hours (00-23)
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
  
  // Generate minutes in 15-minute intervals
  const minutes = ['00', '15', '30', '45']
  
  // Parse current value
  const [selectedHour, selectedMinute] = value ? value.split(':') : ['', '']
  
  // Format display time
  const formatDisplayTime = (hour: string, minute: string) => {
    if (!hour || !minute) return ''
    const h = parseInt(hour)
    const period = h >= 12 ? 'PM' : 'AM'
    const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${displayHour}:${minute} ${period}`
  }
  
  const displayTime = formatDisplayTime(selectedHour, selectedMinute)
  
  const handleTimeSelect = (hour: string, minute: string) => {
    onChange(`${hour}:${minute}`)
    setIsOpen(false)
  }
  
  // Quick time options
  const quickTimes = [
    { label: 'Morning', times: ['09:00', '09:30', '10:00', '10:30'] },
    { label: 'Afternoon', times: ['14:00', '15:00', '16:00', '17:00'] },
    { label: 'Evening', times: ['18:00', '19:00', '20:00', '21:00'] }
  ]

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            "w-full text-left pl-3 pr-2 py-3 focus:outline-none",
            value ? "text-white" : "text-zinc-400",
            className
          )}
        >
          {displayTime || placeholder}
        </button>
      </Popover.Trigger>
      
      <Popover.Portal>
        <Popover.Content
          className="z-50 w-[320px] rounded-lg bg-zinc-900 border border-zinc-800 shadow-xl"
          sideOffset={5}
        >
          <div className="p-4">
            {/* Quick time selections */}
            <div className="space-y-3 mb-4">
              {quickTimes.map((section) => (
                <div key={section.label}>
                  <h4 className="text-xs font-medium text-zinc-400 mb-2">{section.label}</h4>
                  <div className="grid grid-cols-4 gap-1">
                    {section.times.map((time) => {
                      const [h, m] = time.split(':')
                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => handleTimeSelect(h, m)}
                          className={cn(
                            "px-2 py-1.5 text-sm rounded transition-colors",
                            value === time
                              ? "btn-theme-primary text-white"
                              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                          )}
                        >
                          {formatDisplayTime(h, m)}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="border-t border-zinc-800 pt-4">
              <h4 className="text-xs font-medium text-zinc-400 mb-2">Custom Time</h4>
              <div className="flex gap-2">
                {/* Hour selector */}
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">Hour</label>
                  <div className="h-32 overflow-y-auto bg-zinc-800 rounded border border-zinc-700">
                    {hours.map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => handleTimeSelect(hour, selectedMinute || '00')}
                        className={cn(
                          "w-full px-2 py-1 text-sm text-left hover:bg-zinc-700 transition-colors",
                          selectedHour === hour && "bg-zinc-700 text-white"
                        )}
                      >
                        {hour}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Minute selector */}
                <div className="flex-1">
                  <label className="text-xs text-zinc-500 mb-1 block">Minute</label>
                  <div className="h-32 overflow-y-auto bg-zinc-800 rounded border border-zinc-700">
                    {minutes.map((minute) => (
                      <button
                        key={minute}
                        type="button"
                        onClick={() => handleTimeSelect(selectedHour || '09', minute)}
                        className={cn(
                          "w-full px-2 py-1 text-sm text-left hover:bg-zinc-700 transition-colors",
                          selectedMinute === minute && "bg-zinc-700 text-white"
                        )}
                      >
                        {minute}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}