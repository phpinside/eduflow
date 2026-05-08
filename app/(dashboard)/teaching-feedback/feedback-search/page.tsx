"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  MessageSquareText,
  Pencil,
  Search as SearchIcon,
  Star,
} from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { mockFeedbacks } from "@/lib/mock-data/feedbacks"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { cn } from "@/lib/utils"
import { getStoredUsers } from "@/lib/storage"
import { OrderType } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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

import {
  PAGE_SIZE,
  RATING_LABELS,
  EVALUATION_SECTIONS,
  type FeedbackRow,
  SearchInput,
  SelectBox,
  EmptyRow,
  SimplePagination,
} from "../_shared"

export default function FeedbackSearchPage() {
  const { user } = useAuth()
  const users = React.useMemo(() => getStoredUsers(), [])

  const [studentName, setStudentName] = React.useState("")
  const [studentAccount, setStudentAccount] = React.useState("")
  const [courseType, setCourseType] = React.useState("ALL")
  const [subject, setSubject] = React.useState("ALL")
  const [grade, setGrade] = React.useState("ALL")
  const [reviewStatus, setReviewStatus] = React.useState("ALL")
  const [rating, setRating] = React.useState("ALL")
  const [tutorName, setTutorName] = React.useState("")
  const [tutorPhone, setTutorPhone] = React.useState("")
  const [managerName, setManagerName] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [studentAttendance, setStudentAttendance] = React.useState("ALL")
  const [homeworkCompletion, setHomeworkCompletion] = React.useState("ALL")
  const [page, setPage] = React.useState(1)
  const [selectedRow, setSelectedRow] = React.useState<FeedbackRow | null>(null)

  const feedbackRows = React.useMemo<FeedbackRow[]>(() => {
    return mockFeedbacks.map((feedback) => {
      const order = feedback.orderId ? mockOrders.find((row) => row.id === feedback.orderId) : undefined
      const student = mockStudents.find((row) => row.id === feedback.studentId)
      const tutor = users.find((row) => row.id === feedback.teacherId)
      const manager = users.find((row) => row.id === order?.managerId)

      return {
        id: feedback.id,
        date: feedback.date,
        startTime: feedback.startTime,
        endTime: feedback.endTime,
        content: feedback.content,
        deductHours: feedback.deductHours,
        parentFeedback: feedback.parentFeedback,
        createdAt: feedback.createdAt,
        methods: feedback.methods,
        mistakes: feedback.mistakes,
        performance: feedback.performance,
        homework: feedback.homework,
        studentName: student?.name ?? feedback.studentName ?? "—",
        studentAccount: order?.studentAccount ?? "—",
        subject: order?.subject ?? "—",
        grade: order?.grade ?? "—",
        courseType: order?.type,
        tutorName: tutor?.name ?? "—",
        tutorPhone: tutor?.phone ?? "—",
        managerName: manager?.name ?? tutor?.managerName ?? "—",
        studentAttendance: feedback.studentAttendance ?? "—",
        homeworkCompletion: feedback.homeworkCompletion ?? "—",
        orderId: feedback.orderId,
      }
    })
  }, [users])

  const subjects = React.useMemo(() => {
    const values = new Set<string>()
    feedbackRows.forEach((row) => { if (row.subject !== "—") values.add(row.subject) })
    return Array.from(values).sort()
  }, [feedbackRows])

  const grades = React.useMemo(() => {
    const values = new Set<string>()
    feedbackRows.forEach((row) => { if (row.grade !== "—") values.add(row.grade) })
    return Array.from(values).sort()
  }, [feedbackRows])

  const attendanceOptions = React.useMemo(() => {
    const values = new Set<string>()
    feedbackRows.forEach((row) => { if (row.studentAttendance !== "—") values.add(row.studentAttendance) })
    return Array.from(values).sort()
  }, [feedbackRows])

  const homeworkOptions = React.useMemo(() => {
    const values = new Set<string>()
    feedbackRows.forEach((row) => { if (row.homeworkCompletion !== "—") values.add(row.homeworkCompletion) })
    return Array.from(values).sort()
  }, [feedbackRows])

  const filtered = React.useMemo(() => {
    return feedbackRows.filter((row) => {
      if (studentName && !row.studentName.toLowerCase().includes(studentName.toLowerCase())) return false
      if (studentAccount && !row.studentAccount.toLowerCase().includes(studentAccount.toLowerCase())) return false
      if (courseType !== "ALL" && row.courseType !== courseType) return false
      if (subject !== "ALL" && row.subject !== subject) return false
      if (grade !== "ALL" && row.grade !== grade) return false
      if (reviewStatus === "rated" && !row.parentFeedback) return false
      if (reviewStatus === "unrated" && row.parentFeedback) return false
      if (rating !== "ALL" && String(row.parentFeedback?.rating ?? "") !== rating) return false
      if (studentAttendance !== "ALL" && row.studentAttendance !== studentAttendance) return false
      if (homeworkCompletion !== "ALL" && row.homeworkCompletion !== homeworkCompletion) return false
      if (tutorName && !row.tutorName.toLowerCase().includes(tutorName.toLowerCase())) return false
      if (tutorPhone.trim() && !row.tutorPhone.includes(tutorPhone.trim())) return false
      if (managerName && !row.managerName.toLowerCase().includes(managerName.toLowerCase())) return false
      if (startDate && row.date < startDate) return false
      if (endDate && row.date > endDate) return false
      return true
    })
  }, [feedbackRows, studentName, studentAccount, courseType, subject, grade, reviewStatus, rating, studentAttendance, homeworkCompletion, tutorName, tutorPhone, managerName, startDate, endDate])

  React.useEffect(() => { setPage(1) }, [studentName, studentAccount, courseType, subject, grade, reviewStatus, rating, studentAttendance, homeworkCompletion, tutorName, tutorPhone, managerName, startDate, endDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (!user) {
    return <div className="p-8 text-sm text-muted-foreground">请先登录</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SearchIcon className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">课后反馈检索</h1>
        </div>
        <p className="text-muted-foreground">检索全部课后反馈记录与家长点评。</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>课后反馈检索</CardTitle>
            <Button
              variant="outline"
              onClick={() => {
                setStudentName(""); setStudentAccount(""); setCourseType("ALL"); setSubject("ALL"); setGrade("ALL")
                setReviewStatus("ALL"); setRating("ALL"); setStudentAttendance("ALL"); setHomeworkCompletion("ALL")
                setTutorName(""); setTutorPhone(""); setManagerName(""); setStartDate(""); setEndDate("")
              }}
            >
              重置筛选
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <SearchInput label="学员姓名" value={studentName} onChange={setStudentName} placeholder="输入学员姓名..." />
            <SearchInput label="学员G账号" value={studentAccount} onChange={setStudentAccount} placeholder="输入G账号..." />
            <SearchInput label="伴学教练姓名" value={tutorName} onChange={setTutorName} placeholder="输入教练姓名..." />
            <SearchInput label="伴学教练手机号" value={tutorPhone} onChange={setTutorPhone} placeholder="输入教练手机号..." />
            <SearchInput label="学管姓名" value={managerName} onChange={setManagerName} placeholder="输入学管姓名..." />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
            <SelectBox
              label="课程类型" value={courseType} onValueChange={setCourseType}
              options={[
                { value: "ALL", label: "全部类型" },
                { value: OrderType.TRIAL, label: "试课" },
                { value: OrderType.REGULAR, label: "正课" },
              ]}
            />
            <SelectBox
              label="学科" value={subject} onValueChange={setSubject}
              options={[{ value: "ALL", label: "全部学科" }, ...subjects.map((r) => ({ value: r, label: r }))]}
            />
            <SelectBox
              label="年级" value={grade} onValueChange={setGrade}
              options={[{ value: "ALL", label: "全部年级" }, ...grades.map((r) => ({ value: r, label: r }))]}
            />
            <SelectBox
              label="点评状态" value={reviewStatus} onValueChange={setReviewStatus}
              options={[
                { value: "ALL", label: "全部" },
                { value: "rated", label: "已点评" },
                { value: "unrated", label: "未评价" },
              ]}
            />
            <SelectBox
              label="总体评价" value={rating} onValueChange={setRating}
              options={[
                { value: "ALL", label: "全部" },
                { value: "1", label: "不满意" },
                { value: "2", label: "需改进" },
                { value: "3", label: "一般" },
                { value: "4", label: "比较满意" },
                { value: "5", label: "非常满意" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
            <SelectBox
              label="学生出勤" value={studentAttendance} onValueChange={setStudentAttendance}
              options={[{ value: "ALL", label: "全部" }, ...attendanceOptions.map((r) => ({ value: r, label: r }))]}
            />
            <SelectBox
              label="上次作业情况" value={homeworkCompletion} onValueChange={setHomeworkCompletion}
              options={[{ value: "ALL", label: "全部" }, ...homeworkOptions.map((r) => ({ value: r, label: r }))]}
            />
            <div>
              <label className="mb-2 block text-sm font-medium">上课时间区间</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:max-w-md">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-background w-full min-w-0 sm:max-w-[150px]" />
                <span className="flex h-9 shrink-0 items-center justify-center px-2 text-sm text-muted-foreground sm:px-0">至</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-background w-full min-w-0 sm:max-w-[150px]" />
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            共找到 <span className="font-medium text-foreground">{filtered.length}</span> 条反馈记录
          </div>

          <div className="border rounded-md bg-white dark:bg-gray-950 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学员姓名</TableHead>
                  <TableHead>学员G账号</TableHead>
                  <TableHead>学科</TableHead>
                  <TableHead>课程类型</TableHead>
                  <TableHead>伴学教练</TableHead>
                  <TableHead>学管</TableHead>
                  <TableHead>上课时间</TableHead>
                  <TableHead>家长点评</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <EmptyRow colSpan={9} text="暂无符合条件的反馈记录" />
                ) : (
                  visible.map((row) => (
                    <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRow(row)}>
                      <TableCell className="font-medium">{row.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.studentAccount}</TableCell>
                      <TableCell>{row.subject}</TableCell>
                      <TableCell>
                        {row.courseType ? (
                          <Badge variant={row.courseType === OrderType.TRIAL ? "secondary" : "default"}>
                            {row.courseType === OrderType.TRIAL ? "试课" : "正课"}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{row.tutorName}</TableCell>
                      <TableCell>{row.managerName}</TableCell>
                      <TableCell className="text-sm">
                        <div>{row.date}</div>
                        <div className="text-muted-foreground">{row.startTime}-{row.endTime}</div>
                      </TableCell>
                      <TableCell>
                        {row.parentFeedback ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={`${row.id}-${i}`} className={cn("h-3.5 w-3.5", i < row.parentFeedback!.rating ? "fill-amber-400 text-amber-400" : "text-muted")} />
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground">{RATING_LABELS[row.parentFeedback.rating]}</p>
                          </div>
                        ) : (
                          <Badge variant="outline">未反馈</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        {row.orderId ? (
                          <Button variant="ghost" size="sm" className="h-8" asChild>
                            <Link href={`/my-students/feedback/${row.orderId}/edit/${row.id}`}>
                              <Pencil className="h-3 w-3" />
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <SimplePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
        </CardContent>
      </Card>

      {/* Feedback detail dialog */}
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
              <div className="overflow-y-auto p-6 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">课堂反馈详情</p>
                <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm space-y-1.5">
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">学员</span><span className="font-medium text-right">{selectedRow.studentName}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">伴学教练</span><span className="font-medium text-right">{selectedRow.tutorName}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">上课日期</span><span className="font-medium text-right">{selectedRow.date}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">时间段</span><span className="font-medium text-right">{selectedRow.startTime}–{selectedRow.endTime}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">课程类型</span><span className="font-medium text-right">{selectedRow.courseType === OrderType.TRIAL ? "试课" : selectedRow.courseType === OrderType.REGULAR ? "正课" : "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">学科</span><span className="font-medium text-right">{selectedRow.subject !== "—" ? selectedRow.subject : "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">年级</span><span className="font-medium text-right">{selectedRow.grade !== "—" ? selectedRow.grade : "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">扣除课时</span><span className="font-medium text-right">{selectedRow.deductHours} 课时</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">学生出勤</span><span className="font-medium text-right">{selectedRow.studentAttendance !== "—" ? selectedRow.studentAttendance : "—"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">上次作业情况</span><span className="font-medium text-right">{selectedRow.homeworkCompletion !== "—" ? selectedRow.homeworkCompletion : "—"}</span></div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-1.5">📌 课程内容</p>
                  <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedRow.content || "—"}</div>
                </div>
                {selectedRow.methods && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">🔑 核心方法</p>
                    <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedRow.methods}</div>
                  </div>
                )}
                {selectedRow.mistakes && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">ℹ️ 易错提醒</p>
                    <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedRow.mistakes}</div>
                  </div>
                )}
                {selectedRow.performance && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">🌟 课堂表现</p>
                    <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedRow.performance}</div>
                  </div>
                )}
                {selectedRow.homework && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">📝 课后巩固建议</p>
                    <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedRow.homework}</div>
                  </div>
                )}
              </div>

              <div className="overflow-y-auto p-6 space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">家长点评</p>
                {selectedRow.parentFeedback ? (
                  <>
                    <div className="rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">整体评分</p>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("h-6 w-6", i < selectedRow.parentFeedback!.rating ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")} />
                          ))}
                        </div>
                        <span className="text-base font-semibold text-slate-800">{RATING_LABELS[selectedRow.parentFeedback.rating]}</span>
                        <span className="ml-auto text-sm text-muted-foreground">{selectedRow.parentFeedback.rating} / 5 分</span>
                      </div>
                    </div>

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
                                  <div key={item.key} className="flex items-center justify-between rounded-md bg-white/80 px-2.5 py-1.5 text-xs">
                                    <span className="text-muted-foreground">{item.label}</span>
                                    <span className="font-medium text-slate-800 ml-2 shrink-0">{value ?? "—"}</span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedRow.parentFeedback.remarks && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">补充说明</p>
                        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-slate-700 leading-relaxed">{selectedRow.parentFeedback.remarks}</div>
                      </div>
                    )}

                    {selectedRow.parentFeedback.submittedAt && (
                      <p className="text-xs text-muted-foreground text-right">
                        提交时间：{format(new Date(selectedRow.parentFeedback.submittedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                      </p>
                    )}
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
    </div>
  )
}
