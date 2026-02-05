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
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, FileText, CheckCircle, Clock, Calendar as CalendarIcon, Filter } from "lucide-react"
import { getStoredOrders, getStoredUsers, getStoredStudents } from "@/lib/storage"
import { StudyPlanStatus, StudyPlan } from "@/types"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { mockStudyPlans } from "@/lib/mock-data/study-plans" // Fallback

// Extended type for table display
interface StudyPlanRow extends StudyPlan {
  studentName: string
  teacherName: string
  subject: string
  grade: string
}

export default function StudyPlanListPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [plans, setPlans] = useState<StudyPlanRow[]>([])
  const [filteredPlans, setFilteredPlans] = useState<StudyPlanRow[]>([])

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("PENDING_REVIEW")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState<string>("all")

  useEffect(() => {
    const loadData = () => {
      // Get data from storage
      // Note: mockStudyPlans is not exported in storage.ts getters yet, we might need to rely on the imported mock or add it
      // For now, let's try to get from local storage directly or fall back to imported mock
      const storedPlansStr = localStorage.getItem('eduflow:study-plans')
      let rawPlans: StudyPlan[] = []
      
      if (storedPlansStr) {
        try {
           rawPlans = JSON.parse(storedPlansStr, (key, value) => {
             if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                return new Date(value)
             }
             return value
           })
        } catch (e) {
          rawPlans = mockStudyPlans
        }
      } else {
        rawPlans = mockStudyPlans
      }

      const users = getStoredUsers()
      const students = getStoredStudents()
      const orders = getStoredOrders()

      const enrichedPlans = rawPlans.map(plan => {
        const order = orders.find(o => o.id === plan.orderId)
        const student = students.find(s => s.id === plan.studentId)
        const teacher = users.find(u => u.id === plan.teacherId)

        return {
          ...plan,
          studentName: student?.name || "未知学生",
          teacherName: teacher?.name || "未知教练",
          subject: order?.subject || "-",
          grade: order?.grade || "-"
        }
      })

      // Sort by date desc by default
      enrichedPlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setPlans(enrichedPlans)
      setLoading(false)
    }

    loadData()
  }, [])

  // Apply Filters
  useEffect(() => {
    let result = plans

    // Status Filter
    if (statusFilter !== "all") {
      result = result.filter(p => p.status === statusFilter)
    }

    // Search Filter (Teacher Name)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(p => p.teacherName.toLowerCase().includes(query))
    }

    // Date Filter
    const now = new Date()
    if (dateFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      result = result.filter(p => new Date(p.createdAt) >= weekAgo)
    } else if (dateFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      result = result.filter(p => new Date(p.createdAt) >= monthAgo)
    }

    setFilteredPlans(result)
  }, [plans, statusFilter, searchQuery, dateFilter])

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">学习规划书管理</h1>
        <p className="text-muted-foreground">
          审核伴学教练提交的学员学习规划书
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
             <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                {/* Search */}
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="搜索教练姓名..."
                        className="pl-8"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Status Select */}
                <div className="w-full md:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="审核状态" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部状态</SelectItem>
                            <SelectItem value={StudyPlanStatus.PENDING_REVIEW}>待审核</SelectItem>
                            <SelectItem value={StudyPlanStatus.REVIEWED}>已审核</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Date Select */}
                <div className="w-full md:w-48">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger>
                             <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="提交时间" />
                             </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">全部时间</SelectItem>
                            <SelectItem value="week">最近7天</SelectItem>
                            <SelectItem value="month">最近30天</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
             </div>
             
             <div className="text-sm text-muted-foreground">
                共找到 {filteredPlans.length} 份规划书
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div className="rounded-md border bg-white dark:bg-gray-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>学员信息</TableHead>
              <TableHead>教练</TableHead>
              <TableHead>规划书文件</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        暂无符合条件的规划书
                    </TableCell>
                </TableRow>
            ) : (
                filteredPlans.map((plan) => (
                <TableRow 
                    key={plan.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => router.push(`/study-plan/${plan.id}`)}
                >
                    <TableCell>
                        <div className="font-medium">{plan.studentName}</div>
                        <div className="text-xs text-muted-foreground">
                            {plan.grade} | {plan.subject}
                        </div>
                    </TableCell>
                    <TableCell>{plan.teacherName}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                             <FileText className={`h-4 w-4 ${plan.fileType === 'pdf' ? 'text-red-500' : 'text-blue-500'}`} />
                             <span className="truncate max-w-[200px]" title={plan.fileName}>{plan.fileName}</span>
                        </div>
                    </TableCell>
                    <TableCell>
                        {format(new Date(plan.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                    </TableCell>
                    <TableCell>
                        <Badge 
                            variant={plan.status === StudyPlanStatus.REVIEWED ? "default" : "secondary"}
                            className="text-xs"
                        >
                            {plan.status === StudyPlanStatus.REVIEWED ? (
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> 已审核
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> 待审核
                                </span>
                            )}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                            查看详情
                        </Button>
                    </TableCell>
                </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
