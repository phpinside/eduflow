"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Trash2, Phone, Calendar as CalendarIcon, Clock, Users as UsersIcon, Trophy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { 
  getStoredUsers, 
  getStoredOrders, 
  getStoredLessons, 
  saveMockData, 
  STORAGE_KEYS 
} from "@/lib/storage"
import { User, Role, OrderType, OrderStatus } from "@/types"
import { toast } from "sonner"

interface TeacherMetric extends User {
  trialSuccessRate: string
  trialCount: number
  successCount: number
  regularStudentCount: number
  totalHours: number
}

export default function TeacherDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  
  const [teacher, setTeacher] = useState<TeacherMetric | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRemoving, setIsRemoving] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    if (!id) return

    const loadData = () => {
      const users = getStoredUsers()
      const user = users.find(u => u.id === id)
      
      if (!user || !user.roles.includes(Role.TUTOR)) {
        setLoading(false)
        return
      }

      const orders = getStoredOrders()
      const lessons = getStoredLessons()

      // Metrics calculation
      const trialOrders = orders.filter(
        o => o.assignedTeacherId === user.id && o.type === OrderType.TRIAL
      )
      const trialCount = trialOrders.length
      
      let successCount = 0
      trialOrders.forEach(trialOrder => {
        const studentRegularOrders = orders.filter(
          o => o.studentId === trialOrder.studentId && o.type === OrderType.REGULAR
        )
        if (studentRegularOrders.length > 0) {
          successCount++
        }
      })

      const trialSuccessRate = trialCount > 0 
        ? `${Math.round((successCount / trialCount) * 100)}%`
        : "0%"

      const regularOrders = orders.filter(
          o => o.assignedTeacherId === user.id && 
               o.type === OrderType.REGULAR && 
               [OrderStatus.IN_PROGRESS, OrderStatus.ASSIGNED].includes(o.status)
      )
      const uniqueRegularStudents = new Set(regularOrders.map(o => o.studentId))
      const regularStudentCount = uniqueRegularStudents.size

      const teacherLessons = lessons.filter(l => l.teacherId === user.id)
      const totalMinutes = teacherLessons.reduce((acc, curr) => acc + curr.duration, 0)
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10

      setTeacher({
        ...user,
        trialSuccessRate,
        trialCount,
        successCount,
        regularStudentCount,
        totalHours
      })
      setLoading(false)
    }

    loadData()
  }, [id])

  const handleRemoveTeacher = () => {
    setIsRemoving(true)
    try {
      const users = getStoredUsers()
      const updatedUsers = users.map(u => {
        if (u.id === id) {
          // Remove TUTOR role
          const newRoles = u.roles.filter(r => r !== Role.TUTOR)
          return {
            ...u,
            roles: newRoles
          }
        }
        return u
      })

      saveMockData(STORAGE_KEYS.USERS, updatedUsers)
      
      toast.success("教练已移除")
      setDialogOpen(false)
      router.push("/teachers")
    } catch (error) {
      console.error(error)
      toast.error("操作失败")
      setIsRemoving(false)
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!teacher) return <div className="p-8 text-center">未找到该教练信息</div>

  return (
    <div className="container mx-auto py-8">
      <Button 
        variant="ghost" 
        className="mb-6 gap-2" 
        onClick={() => router.push("/teachers")}
      >
        <ArrowLeft className="h-4 w-4" />
        返回列表
      </Button>

      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white dark:bg-gray-950 p-6 rounded-lg border">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/10">
              <AvatarImage src={teacher.avatar} alt={teacher.name} />
              <AvatarFallback className="text-xl">{teacher.name.slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{teacher.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{teacher.phone}</span>
              </div>
              <div className="flex gap-2 mt-3">
                {teacher.roles.map(role => (
                  <Badge key={role} variant={role === Role.TUTOR ? "default" : "secondary"}>
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
             <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  移除出本团队
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认移除教练？</DialogTitle>
                  <DialogDescription>
                    您确定要将 <strong>{teacher.name}</strong> 移出伴学教练团队吗？
                    <br /><br />
                    此操作将移除该用户的"伴学教练"身份，立即生效。
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">取消</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleRemoveTeacher} disabled={isRemoving}>
                    {isRemoving ? "处理中..." : "确认移除"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">试课成功率</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacher.trialSuccessRate}</div>
              <p className="text-xs text-muted-foreground">
                {teacher.successCount} 次成功 / 共 {teacher.trialCount} 次
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">正课学员</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacher.regularStudentCount}</div>
              <p className="text-xs text-muted-foreground">
                当前在读学员
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">累计课时</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacher.totalHours}</div>
              <p className="text-xs text-muted-foreground">
                总授课小时数
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">加入时间</CardTitle>
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Date(teacher.createdAt).toLocaleDateString()}
              </div>
              <p className="text-xs text-muted-foreground">
                注册日期
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
