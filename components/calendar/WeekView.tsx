import React, { useMemo, useEffect, useRef } from 'react'
import { CalendarEvent } from '@/hooks/useCalendarData'
import { EventCard } from './EventCard'
import { format, differenceInMinutes, startOfDay, startOfWeek, addDays, isSameDay } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface WeekViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onEventClick?: (event: CalendarEvent) => void
  onTimeSlotClick?: (date: Date) => void
}

export function WeekView({ currentDate, events, onEventClick, onTimeSlotClick }: WeekViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll to 8 AM on mount
  useEffect(() => {
    if (containerRef.current) {
      // 8 AM * 60px/hour = 480px
      containerRef.current.scrollTop = 480
    }
  }, [])

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday start
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const hourHeight = 60

  const getEventStyle = (event: CalendarEvent, dayStart: Date) => {
    const startMinutes = differenceInMinutes(event.startTime, dayStart)
    const durationMinutes = differenceInMinutes(event.endTime, event.startTime)

    const top = (startMinutes / 60) * hourHeight
    const height = (durationMinutes / 60) * hourHeight

    return {
      top: `${top}px`,
      height: `${height}px`,
      left: '2px',
      right: '2px'
    }
  }

  const handleSlotClick = (day: Date, hour: number) => {
      const clickedTime = new Date(day)
      clickedTime.setHours(hour, 0, 0, 0)
      onTimeSlotClick?.(clickedTime)
  }

  return (
    <div className="flex flex-col h-[600px] border rounded-md bg-white">
      {/* Header */}
      <div className="flex border-b">
        <div className="w-12 border-r bg-gray-50 flex-shrink-0"></div>
        {weekDays.map((day) => {
             const isToday = isSameDay(day, new Date())
             return (
                <div key={day.toISOString()} className={cn("flex-1 py-2 text-center border-r last:border-r-0 bg-gray-50", isToday && "bg-blue-50")}>
                    <div className={cn("text-xs font-medium text-gray-500", isToday && "text-blue-600")}>{format(day, 'EEE', { locale: zhCN })}</div>
                    <div className={cn("text-sm font-bold", isToday && "text-blue-600")}>{format(day, 'd')}</div>
                </div>
             )
        })}
      </div>

      {/* Grid */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto relative"
      >
         <div className="relative min-h-[1440px]" style={{ height: 24 * hourHeight }}>
            {/* Time Labels */}
            <div className="absolute left-0 top-0 bottom-0 w-12 border-r bg-white z-20">
                 {hours.map((hour) => (
                    <div key={hour} className="absolute w-full text-right pr-2 text-xs text-gray-400 -mt-2" style={{ top: hour * hourHeight }}>
                        {hour === 0 ? '' : `${hour}:00`}
                    </div>
                ))}
            </div>

            {/* Days Columns */}
            <div className="absolute left-12 right-0 top-0 bottom-0 flex">
                {weekDays.map((day, dayIndex) => {
                    const dayEvents = events.filter(e => isSameDay(e.startTime, day))
                    const dayStart = startOfDay(day)

                    return (
                        <div key={day.toISOString()} className="flex-1 border-r last:border-r-0 relative border-gray-100">
                             {/* Hour grid lines */}
                             {hours.map((hour) => (
                                <div 
                                    key={hour} 
                                    className="absolute w-full border-b border-gray-100 h-[60px] hover:bg-gray-50/30 transition-colors" 
                                    style={{ top: hour * hourHeight }}
                                    onClick={() => handleSlotClick(day, hour)}
                                />
                             ))}
                            
                             {/* Events */}
                             {dayEvents.map(event => (
                                <EventCard 
                                    key={event.id}
                                    event={event}
                                    style={getEventStyle(event, dayStart)}
                                    onClick={onEventClick}
                                    className="z-10 shadow-sm"
                                />
                             ))}
                        </div>
                    )
                })}
            </div>
         </div>
      </div>
    </div>
  )
}
