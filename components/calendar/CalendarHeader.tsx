import React from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { format, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ViewType } from '@/hooks/useCalendarData'

interface CalendarHeaderProps {
  currentDate: Date
  onDateChange: (date: Date) => void
  view: ViewType
  onViewChange: (view: ViewType) => void
}

export function CalendarHeader({ currentDate, onDateChange, view, onViewChange }: CalendarHeaderProps) {
  
  const handlePrevious = () => {
    switch (view) {
      case 'day':
        onDateChange(subDays(currentDate, 1))
        break
      case 'week':
        onDateChange(subWeeks(currentDate, 1))
        break
      case 'month':
        onDateChange(subMonths(currentDate, 1))
        break
    }
  }

  const handleNext = () => {
    switch (view) {
      case 'day':
        onDateChange(addDays(currentDate, 1))
        break
      case 'week':
        onDateChange(addWeeks(currentDate, 1))
        break
      case 'month':
        onDateChange(addMonths(currentDate, 1))
        break
    }
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  const renderDateTitle = () => {
    switch (view) {
      case 'day':
        return format(currentDate, 'yyyy年 M月 d日 EEEE', { locale: zhCN })
      case 'week':
        // Week range?
        return format(currentDate, 'yyyy年 M月', { locale: zhCN }) // Simplified
      case 'month':
        return format(currentDate, 'yyyy年 M月', { locale: zhCN })
    }
  }

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="icon" onClick={handlePrevious}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" onClick={handleNext}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="outline" onClick={handleToday}>
          今天
        </Button>
        <h2 className="text-xl font-semibold ml-4">{renderDateTitle()}</h2>
      </div>

      <div className="flex items-center space-x-2">
        <Select value={view} onValueChange={(v) => onViewChange(v as ViewType)}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="视图" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">月视图</SelectItem>
            <SelectItem value="week">周视图</SelectItem>
            <SelectItem value="day">日视图</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
