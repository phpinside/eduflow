"use client"

import React, { useState, useMemo } from 'react'
import { CalendarHeader } from '@/components/calendar/CalendarHeader'
import { MonthView } from '@/components/calendar/MonthView'
import { WeekView } from '@/components/calendar/WeekView'
import { DayView } from '@/components/calendar/DayView'
import { AddAvailabilityDialog } from '@/components/calendar/AddAvailabilityDialog'
import { useCalendarData, ViewType, CalendarEvent } from '@/hooks/useCalendarData'
import { SlotStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { addMinutes } from 'date-fns'
import { getStoredSubjects } from '@/lib/storage'

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<ViewType>('week')
  const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedSlotTime, setSelectedSlotTime] = useState<Date | undefined>(undefined)

  const { events: systemEvents, checkConflict: checkSystemConflict } = useCalendarData(currentDate, view)

  const allEvents = useMemo(() => {
    return [...systemEvents, ...manualEvents]
  }, [systemEvents, manualEvents])

  const handleTimeSlotClick = (date: Date) => {
    setSelectedSlotTime(date)
    setIsDialogOpen(true)
  }

  const handleAddManualEvent = (start: Date, end: Date, subjectId?: string) => {
    // 获取科目名称
    let subjectName = undefined
    if (subjectId) {
      const subjects = getStoredSubjects()
      const subject = subjects.find(s => s.id === subjectId)
      subjectName = subject?.name
    }

    const newEvent: CalendarEvent = {
      id: `manual-${Date.now()}`,
      teacherId: 'current-user', // Mock
      startTime: start,
      endTime: end,
      status: SlotStatus.AVAILABLE,
      createdAt: new Date(),
      title: subjectName ? `可试课时间 - ${subjectName}` : '可试课时间',
      studentName: '（等待预约）',
      subject: subjectName
    }
    setManualEvents([...manualEvents, newEvent])
  }

  const checkAllConflicts = (start: Date, end: Date) => {
    // Check system events
    const systemConflicts = checkSystemConflict(start, end)
    
    // Check manual events
    // Logic similar to hook's checkConflict
    const manualConflicts = manualEvents.filter(event => {
       const eventStart = event.startTime
       const eventEnd = event.endTime
       return (start < eventEnd && end > eventStart)
    })

    return [...systemConflicts, ...manualConflicts]
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">我的日历</h1>
      
      </div>

      <CalendarHeader 
        currentDate={currentDate} 
        onDateChange={setCurrentDate} 
        view={view} 
        onViewChange={setView} 
      />

      <div className="flex-1 overflow-hidden min-h-[600px]">
        {view === 'month' && (
          <MonthView 
            currentDate={currentDate} 
            events={allEvents} 
            onDateClick={(date) => { setCurrentDate(date); setView('day'); }}
            onEventClick={(event) => console.log('Event clicked', event)}
          />
        )}
        {view === 'week' && (
          <WeekView 
            currentDate={currentDate} 
            events={allEvents} 
            onTimeSlotClick={handleTimeSlotClick}
            onEventClick={(event) => console.log('Event clicked', event)}
          />
        )}
        {view === 'day' && (
          <DayView 
            currentDate={currentDate} 
            events={allEvents} 
            onTimeSlotClick={handleTimeSlotClick}
            onEventClick={(event) => console.log('Event clicked', event)}
          />
        )}
      </div>

      <AddAvailabilityDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        initialDate={selectedSlotTime || currentDate}
        onSave={handleAddManualEvent}
        checkConflict={checkAllConflicts}
      />
    </div>
  )
}
