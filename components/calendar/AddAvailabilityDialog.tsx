import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format, addMinutes, parse, isValid } from 'date-fns'
import { CalendarEvent } from '@/hooks/useCalendarData'
import { SlotStatus } from '@/types'
import { AlertTriangle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getStoredSubjects } from '@/lib/storage'

interface AddAvailabilityDialogProps {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  onSave: (start: Date, end: Date, subjectId?: string) => void
  checkConflict: (start: Date, end: Date) => CalendarEvent[]
}

export function AddAvailabilityDialog({ 
  isOpen, 
  onClose, 
  initialDate, 
  onSave, 
  checkConflict 
}: AddAvailabilityDialogProps) {
  const [dateStr, setDateStr] = useState('')
  const [startTimeStr, setStartTimeStr] = useState('09:00')
  const [endTimeStr, setEndTimeStr] = useState('10:00')
  const [subjectId, setSubjectId] = useState<string>('')
  const [conflicts, setConflicts] = useState<CalendarEvent[]>([])
  const [subjects, setSubjects] = useState<Array<{ id: string; name: string; enabled: boolean }>>([])

  // 加载科目数据
  useEffect(() => {
    const storedSubjects = getStoredSubjects()
    setSubjects(storedSubjects.filter(s => s.enabled))
  }, [])

  useEffect(() => {
    if (initialDate) {
      setDateStr(format(initialDate, 'yyyy-MM-dd'))
      setStartTimeStr(format(initialDate, 'HH:mm'))
      setEndTimeStr(format(addMinutes(initialDate, 60), 'HH:mm'))
    }
  }, [initialDate, isOpen])

  const validateAndGetTimes = () => {
    const startDateTime = parse(`${dateStr} ${startTimeStr}`, 'yyyy-MM-dd HH:mm', new Date())
    const endDateTime = parse(`${dateStr} ${endTimeStr}`, 'yyyy-MM-dd HH:mm', new Date())

    if (!isValid(startDateTime) || !isValid(endDateTime)) return null
    if (endDateTime <= startDateTime) return null

    return { start: startDateTime, end: endDateTime }
  }

  useEffect(() => {
    const times = validateAndGetTimes()
    if (times) {
      const foundConflicts = checkConflict(times.start, times.end)
      setConflicts(foundConflicts)
    } else {
        setConflicts([])
    }
  }, [dateStr, startTimeStr, endTimeStr])

  const handleSave = () => {
    const times = validateAndGetTimes()
    if (times) {
      onSave(times.start, times.end, subjectId || undefined)
      onClose()
      // 重置表单
      setSubjectId('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>设置可试课时间</DialogTitle>
          <DialogDescription>
             添加您的空闲时间段，系统将自动检测冲突。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="date" className="text-right">日期</Label>
            <Input 
              id="date" 
              type="date" 
              value={dateStr} 
              onChange={(e) => setDateStr(e.target.value)} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start" className="text-right">开始时间</Label>
            <Input 
              id="start" 
              type="time" 
              value={startTimeStr} 
              onChange={(e) => setStartTimeStr(e.target.value)} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end" className="text-right">结束时间</Label>
            <Input 
              id="end" 
              type="time" 
              value={endTimeStr} 
              onChange={(e) => setEndTimeStr(e.target.value)} 
              className="col-span-3" 
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="subject" className="text-right">教学科目</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="请选择教学科目（可选）" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {conflicts.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>冲突警告</AlertTitle>
            <AlertDescription>
              该时间段与以下日程冲突：
              <ul className="list-disc pl-4 mt-1 text-xs">
                {conflicts.slice(0, 3).map(c => (
                  <li key={c.id}>
                    {format(c.startTime, 'HH:mm')}-{format(c.endTime, 'HH:mm')} {c.status === SlotStatus.LOCKED ? '锁定时间' : c.title || '已有课程'}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSave} disabled={conflicts.length > 0}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
