"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getStoredUsers, getStoredOrders, getStoredLessons } from "@/lib/storage"
import { User, Role, OrderType, OrderStatus } from "@/types"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface TeacherMetric extends User {
  trialSuccessRate: string
  trialCount: number
  successCount: number
  regularStudentCount: number
  totalHours: number
}

export default function TeachersPage() {
  const router = useRouter()
  const [teachers, setTeachers] = useState<TeacherMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const loadData = () => {
      const users = getStoredUsers()
      const orders = getStoredOrders()
      const lessons = getStoredLessons()

      const tutorUsers = users.filter(user => user.roles.includes(Role.TUTOR))

      const metrics = tutorUsers.map(tutor => {
        // Trial Success Rate Calculation
        const trialOrders = orders.filter(
          o => o.assignedTeacherId === tutor.id && o.type === OrderType.TRIAL
        )
        const trialCount = trialOrders.length
        
        let successCount = 0
        trialOrders.forEach(trialOrder => {
          // Check if student converted to regular
          // A student is converted if they have at least one REGULAR order
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

        // Regular Students Calculation
        const regularOrders = orders.filter(
            o => o.assignedTeacherId === tutor.id && 
                 o.type === OrderType.REGULAR && 
                 [OrderStatus.IN_PROGRESS, OrderStatus.ASSIGNED].includes(o.status)
        )
        // Count unique students
        const uniqueRegularStudents = new Set(regularOrders.map(o => o.studentId))
        const regularStudentCount = uniqueRegularStudents.size

        // Accumulated Hours Calculation
        const teacherLessons = lessons.filter(l => l.teacherId === tutor.id)
        const totalMinutes = teacherLessons.reduce((acc, curr) => acc + curr.duration, 0)
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10 // Round to 1 decimal

        return {
          ...tutor,
          trialSuccessRate,
          trialCount,
          successCount,
          regularStudentCount,
          totalHours
        }
      })

      setTeachers(metrics)
      setLoading(false)
    }

    loadData()
  }, [])

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone.includes(searchQuery)
  )

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">伴学教练管理</h1>
          <p className="text-muted-foreground mt-2">
            管理教练团队，查看教学数据和表现
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索教练姓名或手机号..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>教练信息</TableHead>
              <TableHead>试课成功率</TableHead>
              <TableHead>正课学员数</TableHead>
              <TableHead>累计课时</TableHead>
              <TableHead>加入时间</TableHead>
              <TableHead>备注</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeachers.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        暂无数据
                    </TableCell>
                </TableRow>
            ) : (
                filteredTeachers.map((teacher) => (
                <TableRow 
                    key={teacher.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/teachers/${teacher.id}`)}
                >
                    <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={teacher.avatar} alt={teacher.name} />
                                <AvatarFallback>{teacher.name.slice(0, 1)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <div className="font-bold">{teacher.name}</div>
                                <div className="text-xs text-muted-foreground">{teacher.phone}</div>
                            </div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col">
                            <span className="font-bold">{teacher.trialSuccessRate}</span>
                            <span className="text-xs text-muted-foreground">
                                {teacher.successCount}/{teacher.trialCount}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell>{teacher.regularStudentCount} 人</TableCell>
                    <TableCell>{teacher.totalHours} 小时</TableCell>
                    <TableCell>{new Date(teacher.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-muted-foreground">-</TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
