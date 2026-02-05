import { useState, useMemo } from 'react'
import { 
  addMinutes, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  setHours, 
  setMinutes, 
  getDay,
  parseISO,
  isBefore,
  isAfter,
  addDays
} from 'date-fns'
import { 
  Lesson, 
  Order, 
  OrderType, 
  OrderStatus, 
  SlotStatus, 
  TeacherCalendarSlot 
} from '@/types'
import { mockLessons } from '@/lib/mock-data/lessons'
import { mockOrders } from '@/lib/mock-data/orders'

export type ViewType = 'month' | 'week' | 'day'

export interface CalendarEvent extends TeacherCalendarSlot {
  title?: string
  studentName?: string
  orderType?: OrderType
  subject?: string
  grade?: string
}

// Helper to parse "HH:mm" to { hours, minutes }
const parseTime = (timeStr: string) => {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return { hours, minutes }
}

// Helper to map day name to day index (0 = Sunday, 1 = Monday, etc.)
const dayMap: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
}

export function useCalendarData(currentDate: Date, view: ViewType) {
  // In a real app, we would fetch data based on the date range
  // For now, we process all mock data
  
  const events = useMemo(() => {
    const allSlots: CalendarEvent[] = []

    // 1. Process existing concrete lessons
    mockLessons.forEach(lesson => {
      // The lesson itself
      allSlots.push({
        id: `lesson-${lesson.id}`,
        teacherId: lesson.teacherId,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        status: SlotStatus.BOOKED,
        orderId: lesson.orderId,
        createdAt: lesson.createdAt,
        // Additional UI info (we'd need to look up student/order details in a real app)
        title: '课程', 
        studentName: '学生', // simplified for now
        orderType: OrderType.REGULAR // simplified
      })
    })

    // 2. Process Trial Orders (One-time)
    mockOrders
      .filter(o => o.type === OrderType.TRIAL && o.scheduledAt && o.status !== OrderStatus.CANCELLED)
      .forEach(order => {
        if (!order.scheduledAt) return
        
        const startTime = new Date(order.scheduledAt)
        const endTime = addMinutes(startTime, order.totalHours * 60 || 60) // Default 1h if not specified? Assuming totalHours is hours.
        
        // Check if this overlaps with an existing lesson (simple check, assume mock data might overlap)
        // For this logic, we just add it as a BOOKED slot
        
        allSlots.push({
          id: `order-trial-${order.id}`,
          teacherId: order.assignedTeacherId || 'unassigned',
          startTime: startTime,
          endTime: endTime,
          status: SlotStatus.BOOKED,
          orderId: order.id,
          createdAt: order.createdAt,
          title: `${order.subject}试课`,
          studentName: '试课学生', // simplified
          orderType: OrderType.TRIAL,
          subject: order.subject,
          grade: order.grade
        })
      })

    // 3. Process Regular Orders (Weekly Schedule)
    // We need to generate these for the current view range (+/- some buffer)
    // Let's generate for the current month +/- 1 month to be safe
    const generationStart = startOfMonth(addDays(currentDate, -30))
    const generationEnd = endOfMonth(addDays(currentDate, 30))
    
    mockOrders
      .filter(o => o.type === OrderType.REGULAR && o.status === OrderStatus.IN_PROGRESS && o.weeklySchedule)
      .forEach(order => {
        if (!order.weeklySchedule) return

        const daysInInterval = eachDayOfInterval({ start: generationStart, end: generationEnd })

        daysInInterval.forEach(day => {
          const dayOfWeek = getDay(day) // 0-6
          
          order.weeklySchedule?.forEach(schedule => {
            const scheduleDayIndex = dayMap[schedule.day.toLowerCase()]
            if (scheduleDayIndex === dayOfWeek) {
               const { hours: startH, minutes: startM } = parseTime(schedule.startTime)
               const { hours: endH, minutes: endM } = parseTime(schedule.endTime)

               const startTime = setMinutes(setHours(day, startH), startM)
               const endTime = setMinutes(setHours(day, endH), endM)

               // Avoid duplicates if concrete lessons already exist for this time
               // In a real app, we'd check if a specific lesson record exists.
               // For this mock, let's just add them. The UI handles overlap visually.
               
               allSlots.push({
                 id: `order-regular-${order.id}-${day.toISOString()}`,
                 teacherId: order.assignedTeacherId || 'unassigned',
                 startTime,
                 endTime,
                 status: SlotStatus.BOOKED,
                 orderId: order.id,
                 createdAt: order.createdAt,
                 title: `${order.subject}课`,
                 studentName: '正课学生',
                 orderType: OrderType.REGULAR,
                 subject: order.subject,
                 grade: order.grade
               })
            }
          })
        })
      })

      // Sort by start time
      return allSlots.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }, [currentDate])

  const checkConflict = (start: Date, end: Date) => {
    // Check standard overlap
    const conflicts = events.filter(event => {
       const eventStart = event.startTime
       const eventEnd = event.endTime
       
       return (start < eventEnd && end > eventStart)
    })

    return conflicts
  }

  return { events, checkConflict }
}
