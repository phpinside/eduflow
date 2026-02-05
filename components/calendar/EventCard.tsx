import React from 'react'
import { CalendarEvent } from '@/hooks/useCalendarData'
import { SlotStatus, OrderType } from '@/types'
import { cn } from '@/lib/utils'
import { Lock } from 'lucide-react'
import { format } from 'date-fns'

interface EventCardProps {
  event: CalendarEvent
  onClick?: (event: CalendarEvent) => void
  style?: React.CSSProperties
  className?: string
}

export function EventCard({ event, onClick, style, className }: EventCardProps) {
  const isLocked = event.status === SlotStatus.LOCKED
  const isTrial = event.orderType === OrderType.TRIAL
  const isRegular = event.orderType === OrderType.REGULAR

  // Base classes
  const baseClasses = "absolute rounded-md px-2 py-1 text-xs overflow-hidden border transition-colors cursor-pointer"
  
  // Status colors
  const statusClasses = isLocked 
    ? "bg-slate-100 border-slate-200 text-slate-400 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.05)_25%,rgba(0,0,0,0.05)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.05)_75%,rgba(0,0,0,0.05)_100%)] bg-[length:10px_10px]"
    : isTrial 
      ? "bg-orange-100 border-orange-200 text-orange-700 hover:bg-orange-200"
      : isRegular
        ? "bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200"
        : "bg-gray-100 border-gray-200 text-gray-700"

  return (
    <div 
      className={cn(baseClasses, statusClasses, className)}
      style={style}
      onClick={() => onClick?.(event)}
      title={isLocked ? "缓冲时间" : `${format(event.startTime, 'HH:mm')} - ${format(event.endTime, 'HH:mm')} ${event.title}`}
    >
      {isLocked ? (
        <div className="flex items-center justify-center h-full">
           <Lock className="h-3 w-3" />
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <span className="font-semibold truncate">{event.title}</span>
          <span className="truncate opacity-80">{format(event.startTime, 'HH:mm')} - {format(event.endTime, 'HH:mm')}</span>
          {event.studentName && <span className="truncate opacity-80 mt-auto">{event.studentName}</span>}
        </div>
      )}
    </div>
  )
}
