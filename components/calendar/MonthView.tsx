import React from 'react'
import { CalendarEvent } from '@/hooks/useCalendarData'
import { SlotStatus, OrderType } from '@/types'
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  format,
  addDays
} from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface MonthViewProps {
  currentDate: Date
  events: CalendarEvent[]
  onDateClick?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
}

export function MonthView({ currentDate, events, onDateClick, onEventClick }: MonthViewProps) {
  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 })
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate })
  const weekDays = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className="flex flex-col border rounded-md bg-white">
      {/* Header */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div key={day} className="py-2 text-center text-sm font-medium text-gray-500 bg-gray-50">
            周{day}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {calendarDays.map((day) => {
           const isCurrentMonth = isSameMonth(day, currentDate)
           const isToday = isSameDay(day, new Date())
           
           // Filter events for this day
           const dayEvents = events.filter(e => isSameDay(e.startTime, day))
           
           // Sort: Concrete lessons first, then buffers? Or start time?
           // Buffers usually aren't shown prominently in Month view to avoid clutter, 
           // but "Locked" blocks are important.
           // Let's filter out buffers for visual clarity in Month view, or just show them very subtly.
           // Actually, let's keep them but maybe just count them or show compact.
           // For now, simple list.
           const visibleEvents = dayEvents
                .filter(e => e.status !== SlotStatus.LOCKED) // Hide buffers in month view to save space
                .slice(0, 4) // Limit to 4

           return (
            <div 
                key={day.toISOString()} 
                className={cn(
                    "min-h-[100px] p-2 border-b border-r relative hover:bg-gray-50 transition-colors cursor-pointer",
                    !isCurrentMonth && "bg-gray-50/50 text-gray-400"
                )}
                onClick={() => onDateClick?.(day)}
            >
                <div className="flex justify-between items-start">
                    <span className={cn(
                        "text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full",
                        isToday && "bg-blue-600 text-white"
                    )}>
                        {format(day, 'd')}
                    </span>
                    {dayEvents.length > 4 && (
                        <span className="text-xs text-gray-400">+{dayEvents.length - 4}</span>
                    )}
                </div>

                <div className="mt-1 space-y-1">
                    {visibleEvents.map(event => {
                         const isTrial = event.orderType === OrderType.TRIAL
                         return (
                            <div 
                                key={event.id}
                                className={cn(
                                    "text-[10px] px-1 py-0.5 rounded truncate",
                                    isTrial ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                                )}
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onEventClick?.(event)
                                }}
                            >
                                {format(event.startTime, 'HH:mm')} {event.title}
                            </div>
                         )
                    })}
                </div>
            </div>
           )
        })}
      </div>
    </div>
  )
}
