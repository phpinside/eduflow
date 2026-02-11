"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Trash2, Phone, Calendar as CalendarIcon, Clock, Users as UsersIcon, Trophy, Search, Star, FilterX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { Pagination } from "@/components/ui/pagination"
import { 
  getStoredUsers, 
  getStoredOrders, 
  getStoredLessons, 
  saveMockData, 
  STORAGE_KEYS 
} from "@/lib/storage"
import { mockFeedbacks } from "@/lib/mock-data/feedbacks"
import { mockStudents } from "@/lib/mock-data/students"
import { User, Role, OrderType, OrderStatus } from "@/types"
import { toast } from "sonner"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

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
  
  // Tab state
  const [activeTab, setActiveTab] = React.useState("info")
  
  // Feedback pagination and filters
  const [feedbacksPage, setFeedbacksPage] = React.useState(1)
  const [feedbackNameFilter, setFeedbackNameFilter] = React.useState("")
  const [feedbackRatingFilter, setFeedbackRatingFilter] = React.useState<string>("all")
  const [selectedParentFeedback, setSelectedParentFeedback] = React.useState<any>(null)
  const [isParentFeedbackDialogOpen, setIsParentFeedbackDialogOpen] = React.useState(false)
  const pageSize = 10

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

  // 获取该教练的课后反馈列表
  const teacherFeedbacks = React.useMemo(() => {
    if (!teacher) return []
    
    let feedbacks = mockFeedbacks
      .filter(fb => fb.teacherId === teacher.id)
      .map(fb => {
        const student = mockStudents.find(s => s.id === fb.studentId)
        return {
          ...fb,
          displayStudentName: fb.studentName || student?.name || "未知学生",
          studentId: fb.studentId
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // Apply filters
    if (feedbackNameFilter.trim()) {
      feedbacks = feedbacks.filter(fb => 
        fb.displayStudentName.includes(feedbackNameFilter.trim())
      )
    }
    
    if (feedbackRatingFilter && feedbackRatingFilter !== "all") {
      if (feedbackRatingFilter === "rated") {
        feedbacks = feedbacks.filter(fb => fb.parentFeedback)
      } else if (feedbackRatingFilter === "unrated") {
        feedbacks = feedbacks.filter(fb => !fb.parentFeedback)
      }
    }
    
    return feedbacks
  }, [teacher, feedbackNameFilter, feedbackRatingFilter])

  // 分页后的反馈列表
  const paginatedFeedbacks = React.useMemo(() => {
    const start = (feedbacksPage - 1) * pageSize
    const end = start + pageSize
    return teacherFeedbacks.slice(start, end)
  }, [teacherFeedbacks, feedbacksPage, pageSize])

  const feedbacksTotalPages = Math.ceil(teacherFeedbacks.length / pageSize)

  const resetFeedbackFilters = () => {
    setFeedbackNameFilter("")
    setFeedbackRatingFilter("all")
    setFeedbacksPage(1)
  }

  // 切换Tab时重置页码
  React.useEffect(() => {
    if (activeTab === "feedbacks") {
      setFeedbacksPage(1)
    }
  }, [activeTab])

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

        {/* Tabs Section */}
        <Tabs defaultValue="info" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="info">教练信息</TabsTrigger>
            <TabsTrigger value="feedbacks">课后反馈</TabsTrigger>
          </TabsList>

          {/* 教练信息 Tab */}
          <TabsContent value="info" className="space-y-4">
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
          </TabsContent>

          {/* 课后反馈 Tab */}
          <TabsContent value="feedbacks" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center bg-muted/20 p-4 rounded-lg border">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索学员姓名..." 
                  value={feedbackNameFilter}
                  onChange={(e) => setFeedbackNameFilter(e.target.value)}
                  className="bg-background"
                />
              </div>
              
              <div className="w-full md:w-[180px]">
                <Select value={feedbackRatingFilter} onValueChange={setFeedbackRatingFilter}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="点评状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="rated">已点评</SelectItem>
                    <SelectItem value="unrated">待点评</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(feedbackNameFilter || feedbackRatingFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={resetFeedbackFilters} className="text-muted-foreground">
                  <FilterX className="mr-2 h-4 w-4" />
                  重置筛选
                </Button>
              )}
            </div>

            {/* Summary */}
            <div className="text-sm text-muted-foreground">
              共找到 {teacherFeedbacks.length} 条反馈记录
            </div>

            {/* Table */}
            <div className="border rounded-md bg-white dark:bg-gray-950">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">学员信息</TableHead>
                    <TableHead className="w-[160px]">上课时间</TableHead>
                    <TableHead>课程内容摘要</TableHead>
                    <TableHead className="w-[100px]">扣除课时</TableHead>
                    <TableHead className="w-[140px]">家长点评</TableHead>
                    <TableHead className="w-[140px]">创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFeedbacks.length > 0 ? (
                    paginatedFeedbacks.map((feedback) => (
                      <TableRow key={feedback.id}>
                        <TableCell>
                          <div className="font-medium">{feedback.displayStudentName}</div>
                          <div className="text-xs text-muted-foreground">ID: {feedback.studentId}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(feedback.date), "MM-dd", { locale: zhCN })}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {feedback.startTime}-{feedback.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px] truncate text-sm">
                            {feedback.content}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{feedback.deductHours}h</Badge>
                        </TableCell>
                        <TableCell>
                          {feedback.parentFeedback ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2"
                              onClick={() => {
                                setSelectedParentFeedback(feedback.parentFeedback)
                                setIsParentFeedbackDialogOpen(true)
                              }}
                            >
                              <div className="flex items-center gap-1">
                                {Array.from({ length: feedback.parentFeedback.rating }).map((_, i) => (
                                  <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                ))}
                                <span className="ml-1 text-xs">{feedback.parentFeedback.rating}分</span>
                              </div>
                            </Button>
                          ) : (
                            <Badge variant="outline" className="text-xs">待点评</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(new Date(feedback.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <p>暂无课后反馈记录</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* 分页 */}
            {feedbacksTotalPages > 1 && (
              <div className="mt-4">
                <Pagination 
                  currentPage={feedbacksPage}
                  totalPages={feedbacksTotalPages}
                  onPageChange={setFeedbacksPage}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* 家长点评详情对话框 */}
      <Dialog open={isParentFeedbackDialogOpen} onOpenChange={setIsParentFeedbackDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>家长点评详情</DialogTitle>
            <DialogDescription>
              {selectedParentFeedback && 
                `提交时间：${format(new Date(selectedParentFeedback.submittedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}`
              }
            </DialogDescription>
          </DialogHeader>
          {selectedParentFeedback && (
            <div className="space-y-4">
              {/* 评分 */}
              <div className="space-y-2">
                <div className="text-sm font-medium">评分</div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`h-5 w-5 ${i < selectedParentFeedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                    />
                  ))}
                  <span className="ml-2 text-lg font-semibold">{selectedParentFeedback.rating}.0</span>
                </div>
              </div>

              {/* 标签 */}
              {selectedParentFeedback.tags && selectedParentFeedback.tags.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">标签</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedParentFeedback.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 文字评价 */}
              {selectedParentFeedback.remarks && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">文字评价</div>
                  <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                    {selectedParentFeedback.remarks}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
