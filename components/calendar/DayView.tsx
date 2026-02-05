import React, { useMemo, useEffect, useRef } from 'react'
import { CalendarEvent } from '@/hooks/useCalendarData'
import { EventCard } from './EventCard'
import { format, differenceInMinutes, startOfDay, isSameDay } from 'date-fns'
import { cn } from '@/lib/utils'

interface DayViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onTimeSlotClick?: (date: Date) => void
}

export function DayView({ currentDate, events, onEventClick, onTimeSlotClick }: DayViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (containerRef.current) {
      // 8 AM * 60px/hour = 480px
      containerRef.current.scrollTop = 480
    }
  }, [])

  // Filter events for this day
  const dayEvents = useMemo(() => {
    return events.filter(e => isSameDay(e.startTime, currentDate))
  }, [events, currentDate])

  // Generate hours 0-23
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Constants for layout
  const hourHeight = 60
  
  const getEventStyle = (event: CalendarEvent) => {
    const startOfDayDate = startOfDay(currentDate)
    const startMinutes = differenceInMinutes(event.startTime, startOfDayDate)
    const durationMinutes = differenceInMinutes(event.endTime, event.startTime)

    const top = (startMinutes / 60) * hourHeight
    const height = (durationMinutes / 60) * hourHeight

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: '4px',
      right: '4px'
    }
  }

  const handleSlotClick = (hour: number) => {
      // Create a date object for this slot
      const clickedTime = new Date(currentDate)
      clickedTime.setHours(hour, 0, 0, 0)
      onTimeSlotClick?.(clickedTime)
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-col h-[600px] overflow-y-auto border rounded-md relative bg-white"
    >
      <div className="relative min-h-[1440px]" style={{ height: 24 * hourHeight }}>
        {/* Time Grid Background */}
        {hours.map((hour) => (
          <div 
            key={hour} 
            className="absolute w-full border-b border-gray-100 flex items-start group hover:bg-gray-50/50 transition-colors"
            style={{ top: hour * hourHeight, height: hourHeight }}
            onClick={() => handleSlotClick(hour)}
          >
            <span className="w-12 text-right pr-2 text-xs text-gray-400 -mt-2 bg-white sticky left-0 z-10">
              {hour === 0 ? '' : `${hour}:00`}
            </span>
            <div className="flex-1 h-full border-l border-gray-100 relative">
               {/* Half hour marker (optional) */}
               {/* <div className="absolute top-1/2 w-full border-t border-dashed border-gray-50"></div> */}
            </div>
          </div>
        ))}

        {/* Current Time Indicator (could be added) */}

        {/* Events */}
        <div className="absolute inset-0 left-12 right-0 pointer-events-none">
          {/* We wrap events in a container that passes pointer events but positions them absolutely */}
          {dayEvents.map(event => (
            <div key={event.id} className="pointer-events-auto">
                <EventCard 
                event={event} 
                style={getEventStyle(event)}
                onClick={onEventClick}
                />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
