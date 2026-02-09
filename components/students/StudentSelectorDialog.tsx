"use client"

import * as React from "react"
import { Search, User, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { mockStudents } from "@/lib/mock-data/students"
import { mockOrders } from "@/lib/mock-data/orders"
import { useAuth } from "@/contexts/AuthContext"

interface StudentSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (studentId: string, studentName: string) => void
  title: string
}

export function StudentSelectorDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
}: StudentSelectorDialogProps) {
  const { user } = useAuth()
  const [manualStudentId, setManualStudentId] = React.useState("")
  const [manualStudentName, setManualStudentName] = React.useState("")
  const [selectedStudent, setSelectedStudent] = React.useState<string>("")
  const [showStudentList, setShowStudentList] = React.useState(false)

  // 获取教师的学员列表
  const myStudents = React.useMemo(() => {
    if (!user) return []
    
    // 获取该教师的所有订单对应的学生
    const studentIds = new Set<string>()
    mockOrders.forEach(order => {
      if (order.assignedTeacherId === user.id || order.transferredOutFrom === user.id) {
        studentIds.add(order.studentId)
      }
    })

    // 从mockStudents中获取学生信息
    return mockStudents.filter(student => studentIds.has(student.id))
  }, [user])

  const handleSelectFromList = (studentId: string) => {
    const student = myStudents.find(s => s.id === studentId)
    if (student) {
      setSelectedStudent(studentId)
      setManualStudentId(student.id)
      setManualStudentName(student.name)
      setShowStudentList(false)
    }
  }

  const handleConfirm = () => {
    if (!manualStudentId && !manualStudentName) {
      alert("请输入学生ID或姓名，或从列表中选择学生")
      return
    }

    onConfirm(manualStudentId, manualStudentName)
    // 重置状态
    setManualStudentId("")
    setManualStudentName("")
    setSelectedStudent("")
    setShowStudentList(false)
  }

  const handleCancel = () => {
    // 重置状态
    setManualStudentId("")
    setManualStudentName("")
    setSelectedStudent("")
    setShowStudentList(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            请手动输入学生信息，或从学员列表中选择
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 手动输入区域 */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">学生ID</Label>
              <Input
                id="studentId"
                placeholder="输入学生ID..."
                value={manualStudentId}
                onChange={(e) => setManualStudentId(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studentName">学生姓名</Label>
              <Input
                id="studentName"
                placeholder="输入学生姓名..."
                value={manualStudentName}
                onChange={(e) => setManualStudentName(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">或</span>
            <Separator className="flex-1" />
          </div>

          {/* 从列表选择 */}
          <div className="space-y-2">
            <Label>从学员列表选择</Label>
            {!showStudentList ? (
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowStudentList(true)}
              >
                <Search className="mr-2 h-4 w-4" />
                点击搜索选择学员...
              </Button>
            ) : (
              <div className="border rounded-md">
                <Command>
                  <CommandInput placeholder="搜索学员姓名、年级或科目..." />
                  <CommandList>
                    <CommandEmpty>未找到学员</CommandEmpty>
                    <CommandGroup>
                      {myStudents.map((student) => (
                        <CommandItem
                          key={student.id}
                          value={`${student.name} ${student.grade} ${student.subject}`}
                          onSelect={() => handleSelectFromList(student.id)}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{student.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {student.grade} · {student.subject}
                              </div>
                            </div>
                            {selectedStudent === student.id && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>

          {/* 显示已选择的学生 */}
          {(manualStudentId || manualStudentName) && (
            <div className="rounded-md bg-muted/50 p-3 text-sm">
              <div className="font-medium mb-1">已填写信息：</div>
              <div className="space-y-1 text-muted-foreground">
                {manualStudentId && <div>学生ID: {manualStudentId}</div>}
                {manualStudentName && <div>学生姓名: {manualStudentName}</div>}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button onClick={handleConfirm}>
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
