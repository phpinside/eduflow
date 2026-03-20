"use client"

import * as React from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Search,
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  MessageSquareText,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { mockFeedbacks } from "@/lib/mock-data/feedbacks"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { getStoredUsers } from "@/lib/storage"
import { OrderType } from "@/types"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

const RATING_LABELS = ["", "不满意", "需改进", "一般", "比较满意", "非常满意"]

const EVALUATION_SECTIONS = [
  {
    title: "课堂效果",
    dotClass: "bg-amber-400",
    bgClass: "border-amber-100 bg-amber-50/60",
    items: [
      { key: "knowledge_absorption", label: "知识吸收程度" },
      { key: "student_explain", label: "学生讲解题目" },
    ],
  },
  {
    title: "教师表现",
    dotClass: "bg-sky-400",
    bgClass: "border-sky-100 bg-sky-50/60",
    items: [
      { key: "professionalism", label: "专业程度" },
      { key: "responsibility", label: "责任心" },
      { key: "patience", label: "耐心程度" },
      { key: "post_feedback", label: "课后反馈" },
    ],
  },
  {
    title: "上课规范",
    dotClass: "bg-emerald-400",
    bgClass: "border-emerald-100 bg-emerald-50/60",
    items: [
      { key: "punctuality", label: "上课守时" },
      { key: "camera", label: "开摄像头" },
    ],
  },
  {
    title: "上课环境",
    dotClass: "bg-rose-400",
    bgClass: "border-rose-100 bg-rose-50/60",
    items: [
      { key: "network", label: "网络状况" },
      { key: "environment", label: "上课环境" },
    ],
  },
]

interface EnrichedFeedback {
  id: string
  orderId?: string
  date: string
  startTime: string
  endTime: string
  content: string
  deductHours: string
  methods?: string
  mistakes?: string
  performance?: string
  homework?: string
  parentFeedback?: {
    rating: number
    tags: string[]
    evaluation?: Record<string, string>
    remarks?: string
    submittedAt: Date
  }
  createdAt: Date
  // joined fields
  studentName: string
  studentAccount: string
  subject: string
  courseType: OrderType | undefined
  tutorName: string
  tutorPhone: string
  parentPhone: string
  campusAccount: string
}

export default function ParentFeedbackPage() {
  // Filter state
  const [campusAccountSearch, setCampusAccountSearch] = React.useState("")
  const [studentNameSearch, setStudentNameSearch] = React.useState("")
  const [studentGAccountSearch, setStudentGAccountSearch] = React.useState("")
  const [parentPhoneSearch, setParentPhoneSearch] = React.useState("")
  const [courseTypeFilter, setCourseTypeFilter] = React.useState("ALL")
  const [subjectFilter, setSubjectFilter] = React.useState("ALL")
  const [reviewStatusFilter, setReviewStatusFilter] = React.useState("ALL")
  const [tutorNameSearch, setTutorNameSearch] = React.useState("")
  const [tutorPhoneSearch, setTutorPhoneSearch] = React.useState("")
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({ from: undefined, to: undefined })

  const [currentPage, setCurrentPage] = React.useState(1)
  const [selectedRow, setSelectedRow] = React.useState<EnrichedFeedback | null>(null)

  // Enrich feedbacks by joining orders, students, users
  const enrichedFeedbacks = React.useMemo<EnrichedFeedback[]>(() => {
    const users = getStoredUsers()
    return mockFeedbacks.map((fb) => {
      const order = fb.orderId ? mockOrders.find((o) => o.id === fb.orderId) : undefined
      const student = mockStudents.find((s) => s.id === fb.studentId)
      const tutor = users.find((u) => u.id === fb.teacherId)
      return {
        ...fb,
        studentName: student?.name ?? "—",
        studentAccount: order?.studentAccount ?? "—",
        subject: order?.subject ?? "—",
        courseType: order?.type,
        tutorName: tutor?.name ?? "—",
        tutorPhone: tutor?.phone ?? "—",
        parentPhone: student?.parentPhone ?? "—",
        campusAccount: order?.campusAccount ?? "—",
      }
    })
  }, [])

  const availableSubjects = React.useMemo(() => {
    const set = new Set<string>()
    enrichedFeedbacks.forEach((row) => { if (row.subject && row.subject !== "—") set.add(row.subject) })
    return Array.from(set).sort()
  }, [enrichedFeedbacks])

  const filteredFeedbacks = React.useMemo(() => {
    return enrichedFeedbacks.filter((row) => {
      if (
        campusAccountSearch &&
        !row.campusAccount.toLowerCase().includes(campusAccountSearch.toLowerCase())
      ) return false

      if (
        studentNameSearch &&
        !row.studentName.toLowerCase().includes(studentNameSearch.toLowerCase())
      ) return false

      if (
        studentGAccountSearch &&
        !row.studentAccount.toLowerCase().includes(studentGAccountSearch.toLowerCase())
      ) return false

      if (
        parentPhoneSearch &&
        !row.parentPhone.includes(parentPhoneSearch)
      ) return false

      if (courseTypeFilter !== "ALL") {
        if (!row.courseType || row.courseType !== courseTypeFilter) return false
      }

      if (subjectFilter !== "ALL" && row.subject !== subjectFilter) return false

      if (reviewStatusFilter === "rated" && !row.parentFeedback) return false
      if (reviewStatusFilter === "unrated" && !!row.parentFeedback) return false

      if (
        tutorNameSearch &&
        !row.tutorName.toLowerCase().includes(tutorNameSearch.toLowerCase())
      ) return false

      if (
        tutorPhoneSearch &&
        !row.tutorPhone.includes(tutorPhoneSearch)
      ) return false

      // Date range filter on feedback.date (string "YYYY-MM-DD")
      if (dateRange.from) {
        const lessonDate = new Date(row.date)
        const startOfDay = new Date(dateRange.from)
        startOfDay.setHours(0, 0, 0, 0)
        if (lessonDate < startOfDay) return false
      }
      if (dateRange.to) {
        const lessonDate = new Date(row.date)
        const endOfDay = new Date(dateRange.to)
        endOfDay.setHours(23, 59, 59, 999)
        if (lessonDate > endOfDay) return false
      }

      return true
    })
  }, [
    enrichedFeedbacks,
    campusAccountSearch,
    studentNameSearch,
    studentGAccountSearch,
    parentPhoneSearch,
    courseTypeFilter,
    subjectFilter,
    reviewStatusFilter,
    tutorNameSearch,
    tutorPhoneSearch,
    dateRange,
  ])

  const paginatedFeedbacks = React.useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    return filteredFeedbacks.slice(startIndex, startIndex + PAGE_SIZE)
  }, [filteredFeedbacks, currentPage])

  const totalPages = Math.ceil(filteredFeedbacks.length / PAGE_SIZE)

  const resetFilters = () => {
    setCampusAccountSearch("")
    setStudentNameSearch("")
    setStudentGAccountSearch("")
    setParentPhoneSearch("")
    setCourseTypeFilter("ALL")
    setSubjectFilter("ALL")
    setReviewStatusFilter("ALL")
    setTutorNameSearch("")
    setTutorPhoneSearch("")
    setDateRange({ from: undefined, to: undefined })
    setCurrentPage(1)
  }

  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value)
    setCurrentPage(1)
  }

  return (
    <>
    <div className="space-y-6 container mx-auto pb-10">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">家长课后反馈</h1>
          </div>
          <p className="text-muted-foreground">查看所有课后反馈记录及家长点评情况。</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>反馈列表</CardTitle>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <X className="h-4 w-4 mr-1" />
                重置筛选
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Filter area */}
            <div className="space-y-4 mb-6">
              {/* Row 1: campus account, student name, student G account, parent phone */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">9800校区手机号</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="输入校区手机号..."
                      className="pl-9"
                      value={campusAccountSearch}
                      onChange={(e) => handleFilterChange(setCampusAccountSearch)(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">学员姓名</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="输入学员姓名..."
                      className="pl-9"
                      value={studentNameSearch}
                      onChange={(e) => handleFilterChange(setStudentNameSearch)(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">学员G账号</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="输入G账号..."
                      className="pl-9"
                      value={studentGAccountSearch}
                      onChange={(e) => handleFilterChange(setStudentGAccountSearch)(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">家长手机号</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="输入家长手机号..."
                      className="pl-9"
                      value={parentPhoneSearch}
                      onChange={(e) => handleFilterChange(setParentPhoneSearch)(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: course type, subject, review status, tutor name, tutor phone, date range */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">课程类型</label>
                  <Select
                    value={courseTypeFilter}
                    onValueChange={(value) => {
                      setCourseTypeFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择课程类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">全部类型</SelectItem>
                      <SelectItem value={OrderType.TRIAL}>试课</SelectItem>
                      <SelectItem value={OrderType.REGULAR}>正课</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">学科</label>
                  <Select
                    value={subjectFilter}
                    onValueChange={(value) => {
                      setSubjectFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择学科" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">全部学科</SelectItem>
                      {availableSubjects.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">点评状态</label>
                  <Select
                    value={reviewStatusFilter}
                    onValueChange={(value) => {
                      setReviewStatusFilter(value)
                      setCurrentPage(1)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择点评状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">全部</SelectItem>
                      <SelectItem value="rated">已点评</SelectItem>
                      <SelectItem value="unrated">未评价</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Row 3: tutor name, tutor phone, date range */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">伴学教练姓名</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="输入教练姓名..."
                      className="pl-9"
                      value={tutorNameSearch}
                      onChange={(e) => handleFilterChange(setTutorNameSearch)(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">伴学教练手机号</label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="输入教练手机号..."
                      className="pl-9"
                      value={tutorPhoneSearch}
                      onChange={(e) => handleFilterChange(setTutorPhoneSearch)(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">上课时间</label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !dateRange.from && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1 h-4 w-4 shrink-0" />
                          {dateRange.from
                            ? format(dateRange.from, "MM-dd", { locale: zhCN })
                            : "开始"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.from}
                          onSelect={(date) => {
                            setDateRange((prev) => ({ ...prev, from: date }))
                            setCurrentPage(1)
                          }}
                          locale={zhCN}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal",
                            !dateRange.to && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-1 h-4 w-4 shrink-0" />
                          {dateRange.to
                            ? format(dateRange.to, "MM-dd", { locale: zhCN })
                            : "结束"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={dateRange.to}
                          onSelect={(date) => {
                            setDateRange((prev) => ({ ...prev, to: date }))
                            setCurrentPage(1)
                          }}
                          locale={zhCN}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Result count */}
              <div className="text-sm text-muted-foreground">
                共找到{" "}
                <span className="font-medium text-foreground">{filteredFeedbacks.length}</span>{" "}
                条反馈记录
              </div>
            </div>

            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">学员姓名</TableHead>
                    <TableHead className="whitespace-nowrap">学员G账号</TableHead>
                    <TableHead className="whitespace-nowrap">学科</TableHead>
                    <TableHead className="whitespace-nowrap">课程类型</TableHead>
                    <TableHead className="whitespace-nowrap">伴学教练姓名</TableHead>
                    <TableHead className="whitespace-nowrap">上课时间</TableHead>
                    <TableHead className="whitespace-nowrap">课程内容摘要</TableHead>
                    <TableHead className="whitespace-nowrap">扣除课时</TableHead>
                    <TableHead className="whitespace-nowrap">家长点评情况</TableHead>
                    <TableHead className="whitespace-nowrap">创建时间</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFeedbacks.length > 0 ? (
                    paginatedFeedbacks.map((row) => (
                      <TableRow
                        key={row.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedRow(row)}
                      >
                        <TableCell className="font-medium whitespace-nowrap">
                          {row.studentName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {row.studentAccount}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {row.subject !== "—" ? row.subject : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          {row.courseType ? (
                            <Badge
                              variant={row.courseType === OrderType.TRIAL ? "secondary" : "default"}
                            >
                              {row.courseType === OrderType.TRIAL ? "试课" : "正课"}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{row.tutorName}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          <div>{row.date}</div>
                          <div className="text-muted-foreground">
                            {row.startTime}–{row.endTime}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px]">
                          <span
                            className="text-sm line-clamp-2 cursor-default"
                            title={row.content}
                          >
                            {row.content}
                          </span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {row.deductHours} 课时
                        </TableCell>
                        <TableCell>
                          {row.parentFeedback ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={cn(
                                      "h-3.5 w-3.5",
                                      i < row.parentFeedback!.rating
                                        ? "fill-amber-400 text-amber-400"
                                        : "fill-muted text-muted"
                                    )}
                                  />
                                ))}
                                <span className="text-xs text-muted-foreground ml-1">
                                  {RATING_LABELS[row.parentFeedback.rating]}
                                </span>
                              </div>
                              {row.parentFeedback.remarks ? (
                                <p className="text-xs text-muted-foreground truncate max-w-[160px]">
                                  {row.parentFeedback.remarks}
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">点击查看详情</p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              未反馈
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {format(new Date(row.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                        暂无符合条件的反馈记录
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {filteredFeedbacks.length > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  显示第 {(currentPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentPage * PAGE_SIZE, filteredFeedbacks.length)} 条，共{" "}
                  {filteredFeedbacks.length} 条记录
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      上一页
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="min-w-[40px]"
                            >
                              {page}
                            </Button>
                          )
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <span key={page} className="px-2 flex items-center text-muted-foreground">
                              ...
                            </span>
                          )
                        }
                        return null
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      下一页
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedRow} onOpenChange={(open) => { if (!open) setSelectedRow(null) }}>
        <DialogContent className="sm:max-w-5xl w-[90vw] p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareText className="h-5 w-5 text-primary" />
              课堂反馈 · 家长点评详情
            </DialogTitle>
          </DialogHeader>

          {selectedRow && (
            <div className="grid grid-cols-2 divide-x" style={{ maxHeight: "75vh" }}>
              {/* ── Left: lesson feedback record ── */}
              <div className="overflow-y-auto p-6 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">课堂反馈详情</p>

                {/* Meta */}
                <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">学员</span>
                    <span className="font-medium">{selectedRow.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">伴学教练</span>
                    <span className="font-medium">{selectedRow.tutorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">上课日期</span>
                    <span className="font-medium">{selectedRow.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">时间段</span>
                    <span className="font-medium">{selectedRow.startTime}–{selectedRow.endTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">课程类型</span>
                    <span className="font-medium">
                      {selectedRow.courseType === "TRIAL" ? "试课" : selectedRow.courseType === "REGULAR" ? "正课" : "—"}
                    </span>
                  </div>
                  {selectedRow.subject && selectedRow.subject !== "—" && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">学科</span>
                      <span className="font-medium">{selectedRow.subject}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">扣除课时</span>
                    <span className="font-medium">{selectedRow.deductHours} 课时</span>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">📌 课程内容</p>
                  <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedRow.content || "—"}
                  </div>
                </div>

                {selectedRow.methods && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">🔑 核心方法</p>
                    <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRow.methods}
                    </div>
                  </div>
                )}

                {selectedRow.mistakes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">ℹ️ 易错提醒</p>
                    <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRow.mistakes}
                    </div>
                  </div>
                )}

                {selectedRow.performance && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">🌟 课堂表现</p>
                    <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRow.performance}
                    </div>
                  </div>
                )}

                {selectedRow.homework && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">📝 课后巩固建议</p>
                    <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {selectedRow.homework}
                    </div>
                  </div>
                )}
              </div>

              {/* ── Right: parent evaluation ── */}
              <div className="overflow-y-auto p-6 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">家长点评</p>

                {selectedRow.parentFeedback ? (
                  <>
                    {/* Overall rating */}
                    <div className="rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">整体评分</p>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-6 w-6",
                                i < selectedRow.parentFeedback!.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "fill-muted text-muted"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-base font-semibold text-slate-800">
                          {RATING_LABELS[selectedRow.parentFeedback.rating]}
                        </span>
                        <span className="ml-auto text-sm text-muted-foreground">
                          {selectedRow.parentFeedback.rating} / 5 分
                        </span>
                      </div>
                    </div>

                    {/* Detailed evaluation — 10 items across 4 sections */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">详细评价</p>
                      <div className="space-y-2">
                        {EVALUATION_SECTIONS.map((section) => (
                          <div key={section.title} className={cn("rounded-lg border p-3", section.bgClass)}>
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className={cn("h-2 w-2 rounded-full shrink-0", section.dotClass)} />
                              <span className="text-xs font-semibold text-slate-700">{section.title}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              {section.items.map((item) => {
                                const value = selectedRow.parentFeedback?.evaluation?.[item.key]
                                return (
                                  <div
                                    key={item.key}
                                    className="flex items-center justify-between rounded-md bg-white/80 px-2.5 py-1.5 text-xs"
                                  >
                                    <span className="text-muted-foreground">{item.label}</span>
                                    <span className="font-medium text-slate-800 ml-2 shrink-0">
                                      {value ?? "—"}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Remarks */}
                    {selectedRow.parentFeedback.remarks && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">补充说明</p>
                        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                          {selectedRow.parentFeedback.remarks}
                        </div>
                      </div>
                    )}

                    {/* Submit time */}
                    <p className="text-xs text-muted-foreground text-right">
                      提交时间：{format(new Date(selectedRow.parentFeedback.submittedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                    </p>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm gap-2">
                    <MessageSquareText className="h-10 w-10 opacity-20" />
                    <p>家长尚未提交点评</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
