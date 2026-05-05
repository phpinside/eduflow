"use client"

import * as React from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Download, FileSearch, FileText, Upload, X } from "lucide-react"

import { useRouter } from "next/navigation"

import { useAuth } from "@/contexts/AuthContext"
import { mockStudyPlans } from "@/lib/mock-data/study-plans"
import { getStoredUsers, getStoredOrders, getStoredStudents } from "@/lib/storage"
import { Role, OrderType, StudyPlanStatus, type StudyPlan } from "@/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import {
  PAGE_SIZE,
  safeDate,
  SearchInput,
  SelectBox,
  EmptyRow,
  SimplePagination,
} from "../_shared"

interface StudyPlanRow extends StudyPlan {
  studentName: string
  teacherName: string
  managerName: string
  studentAccount: string
  subject: string
  grade: string
  courseType: OrderType | undefined
}

export default function PlanSearchPage() {
  const { user, currentRole } = useAuth()
  const router = useRouter()
  const users = React.useMemo(() => getStoredUsers(), [])

  const [studentName, setStudentName] = React.useState("")
  const [studentAccount, setStudentAccount] = React.useState("")
  const [tutorName, setTutorName] = React.useState("")
  const [managerName, setManagerName] = React.useState("")
  const [courseType, setCourseType] = React.useState("ALL")
  const [subject, setSubject] = React.useState("ALL")
  const [grade, setGrade] = React.useState("ALL")
  const [reviewStatus, setReviewStatus] = React.useState("ALL")
  const [submittedFrom, setSubmittedFrom] = React.useState("")
  const [submittedTo, setSubmittedTo] = React.useState("")
  const [page, setPage] = React.useState(1)

  const [uploadTarget, setUploadTarget] = React.useState<StudyPlanRow | null>(null)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const planRows = React.useMemo<StudyPlanRow[]>(() => {
    let rawPlans: StudyPlan[] = mockStudyPlans
    if (typeof window !== "undefined") {
      const savedPlans = localStorage.getItem("eduflow:study-plans")
      if (savedPlans) {
        try {
          rawPlans = JSON.parse(savedPlans, (_key, value) => {
            if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
              return new Date(value)
            }
            return value
          })
        } catch {
          rawPlans = mockStudyPlans
        }
      }
    }

    const orders = getStoredOrders()
    const students = getStoredStudents()

    return rawPlans
      .map((plan) => {
        const order = plan.orderId ? orders.find((row) => row.id === plan.orderId) : undefined
        const student = students.find((row) => row.id === plan.studentId)
        const teacher = users.find((row) => row.id === plan.teacherId)
        const manager = order?.managerId ? users.find((row) => row.id === order.managerId) : undefined

        return {
          ...plan,
          studentName: plan.studentName ?? student?.name ?? "未知学员",
          teacherName: teacher?.name ?? "未知教练",
          managerName: manager?.name ?? teacher?.managerName ?? "—",
          studentAccount: order?.studentAccount ?? "—",
          subject: order?.subject ?? "-",
          grade: order?.grade ?? "-",
          courseType: order?.type,
        }
      })
      .sort((a, b) => safeDate(b.createdAt).getTime() - safeDate(a.createdAt).getTime())
  }, [users])

  const subjects = React.useMemo(() => {
    const values = new Set<string>()
    planRows.forEach((row) => { if (row.subject !== "-") values.add(row.subject) })
    return Array.from(values).sort()
  }, [planRows])

  const grades = React.useMemo(() => {
    const values = new Set<string>()
    planRows.forEach((row) => { if (row.grade !== "-") values.add(row.grade) })
    return Array.from(values).sort()
  }, [planRows])

  const roleFilteredPlans = React.useMemo(() => {
    if (!user) return []
    if (currentRole === Role.TUTOR) {
      return planRows.filter((row) => row.teacherId === user.id)
    }
    return planRows
  }, [currentRole, planRows, user])

  const filtered = React.useMemo(() => {
    return roleFilteredPlans.filter((row) => {
      if (studentName && !row.studentName.toLowerCase().includes(studentName.trim().toLowerCase())) return false
      if (studentAccount && !row.studentAccount.toLowerCase().includes(studentAccount.trim().toLowerCase())) return false
      if (tutorName && !row.teacherName.toLowerCase().includes(tutorName.trim().toLowerCase())) return false
      if (managerName && !row.managerName.toLowerCase().includes(managerName.trim().toLowerCase())) return false
      if (courseType !== "ALL" && row.courseType !== courseType) return false
      if (subject !== "ALL" && row.subject !== subject) return false
      if (grade !== "ALL" && row.grade !== grade) return false
      if (reviewStatus !== "ALL" && row.status !== reviewStatus) return false

      const submittedAt = safeDate(row.createdAt)
      if (submittedFrom) {
        const fromDate = new Date(`${submittedFrom}T00:00:00`)
        if (submittedAt < fromDate) return false
      }
      if (submittedTo) {
        const toDate = new Date(`${submittedTo}T23:59:59.999`)
        if (submittedAt > toDate) return false
      }
      return true
    })
  }, [roleFilteredPlans, studentName, studentAccount, tutorName, managerName, courseType, subject, grade, reviewStatus, submittedFrom, submittedTo])

  React.useEffect(() => { setPage(1) }, [studentName, studentAccount, tutorName, managerName, courseType, subject, grade, reviewStatus, submittedFrom, submittedTo])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleResetFilters = () => {
    setStudentName("")
    setStudentAccount("")
    setTutorName("")
    setManagerName("")
    setCourseType("ALL")
    setSubject("ALL")
    setGrade("ALL")
    setReviewStatus("ALL")
    setSubmittedFrom("")
    setSubmittedTo("")
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0])
    }
  }

  const handleReupload = () => {
    if (!uploadFile || !uploadTarget || !user) return

    setIsUploading(true)

    setTimeout(() => {
      const updatedPlan: StudyPlan = {
        ...uploadTarget,
        fileUrl: URL.createObjectURL(uploadFile),
        fileName: uploadFile.name,
        fileType: uploadFile.name.endsWith(".pdf") ? "pdf" : "word",
        status: StudyPlanStatus.PENDING_REVIEW,
        updatedAt: new Date(),
      }

      if (typeof window !== "undefined") {
        const savedPlans = localStorage.getItem("eduflow:study-plans")
        let plans: StudyPlan[] = mockStudyPlans
        if (savedPlans) {
          try {
            plans = JSON.parse(savedPlans, (_key, value) => {
              if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                return new Date(value)
              }
              return value
            })
          } catch { /* fallback */ }
        }
        const idx = plans.findIndex((p) => p.id === updatedPlan.id)
        if (idx >= 0) {
          plans[idx] = updatedPlan
        }
        localStorage.setItem("eduflow:study-plans", JSON.stringify(plans))
      }

      setIsUploading(false)
      setUploadFile(null)
      setUploadTarget(null)
      alert("学习规划书已更新成功！")
      window.location.reload()
    }, 1200)
  }

  if (!user) {
    return <div className="p-8 text-sm text-muted-foreground">请先登录</div>
  }

  return (
    <div className="container mx-auto space-y-6 pb-10">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileSearch className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">学习规划书检索</h1>
        </div>
        <p className="text-muted-foreground">检索全部学习规划书记录。</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>学习规划书检索</CardTitle>
            <Button variant="outline" onClick={handleResetFilters}>
              重置筛选
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Row 1: text search inputs */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <SearchInput label="学员姓名" value={studentName} onChange={setStudentName} placeholder="输入学员姓名..." />
            <SearchInput label="学员G账号" value={studentAccount} onChange={setStudentAccount} placeholder="输入G账号..." />
            <SearchInput label="伴学教练姓名" value={tutorName} onChange={setTutorName} placeholder="输入教练姓名..." />
            <SearchInput label="学管姓名" value={managerName} onChange={setManagerName} placeholder="输入学管姓名..." />
          </div>

          {/* Row 2: select filters */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
          </div>

          {/* Row 3: status and submit date range */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <SelectBox
              label="审核状态"
              value={reviewStatus}
              onValueChange={setReviewStatus}
              options={[
                { value: "ALL", label: "全部状态" },
                { value: StudyPlanStatus.PENDING_REVIEW, label: "待审核" },
                { value: StudyPlanStatus.REVIEWED, label: "已审核" },
              ]}
            />
            <div className="space-y-2">
              <Label htmlFor="submitted-from">提交时间（起）</Label>
              <Input
                id="submitted-from"
                type="date"
                value={submittedFrom}
                onChange={(e) => setSubmittedFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="submitted-to">提交时间（止）</Label>
              <Input
                id="submitted-to"
                type="date"
                value={submittedTo}
                onChange={(e) => setSubmittedTo(e.target.value)}
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            共找到 <span className="font-medium text-foreground">{filtered.length}</span> 份规划书
            {currentRole === Role.TUTOR && <span>（当前为教练视角，仅显示本人）</span>}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学员</TableHead>
                  <TableHead>学员G账号</TableHead>
                  <TableHead>伴学教练</TableHead>
                  <TableHead>学管</TableHead>
                  <TableHead>课程类型</TableHead>
                  <TableHead>年级/学科</TableHead>
                  <TableHead>文件名</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>提交时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <EmptyRow colSpan={9} text="暂无符合条件的规划书" />
                ) : (
                  visible.map((row) => (
                    <TableRow
                      key={row.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/study-plan/${row.id}`)}
                    >
                      <TableCell className="font-medium">{row.studentName}</TableCell>
                      <TableCell>{row.studentAccount}</TableCell>
                      <TableCell>{row.teacherName}</TableCell>
                      <TableCell>{row.managerName}</TableCell>
                      <TableCell>
                        {row.courseType ? (
                          <Badge variant={row.courseType === OrderType.TRIAL ? "secondary" : "default"}>
                            {row.courseType === OrderType.TRIAL ? "试课" : "正课"}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{row.grade} / {row.subject}</TableCell>
                      <TableCell className="max-w-[220px]" title={row.fileName}>
                        <a
                          href={row.fileUrl}
                          download={row.fileName}
                          className="inline-flex items-center gap-2 text-primary hover:underline"
                        >
                          <Download className="h-4 w-4 shrink-0" />
                          <span className="truncate">{row.fileName}</span>
                        </a>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.status === StudyPlanStatus.REVIEWED ? "default" : "secondary"}>
                          {row.status === StudyPlanStatus.REVIEWED ? "已审核" : "待审核"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{format(safeDate(row.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <SimplePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} hideWhenSingle={false} />
        </CardContent>
      </Card>

      {/* Re-upload Dialog */}
      <Dialog open={!!uploadTarget} onOpenChange={(open) => { if (!open) { setUploadTarget(null); setUploadFile(null) } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>更新学习规划书</DialogTitle>
            <DialogDescription>
              重新上传 <span className="font-medium">{uploadTarget?.studentName}</span> 的学习规划书文件，提交后将进入待审核状态。
            </DialogDescription>
          </DialogHeader>

          {uploadTarget && (
            <div className="space-y-4 py-2">
              {/* Current file info */}
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="mb-1 text-xs font-medium text-muted-foreground">当前文件</p>
                <div className="flex items-center gap-2">
                  <FileText className={`h-5 w-5 shrink-0 ${uploadTarget.fileType === "pdf" ? "text-red-500" : "text-blue-500"}`} />
                  <span className="truncate text-sm font-medium">{uploadTarget.fileName}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  上传于 {format(safeDate(uploadTarget.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                </p>
              </div>

              {/* File input */}
              <div className="space-y-1.5">
                <Label htmlFor="reupload-file">选择新文件</Label>
                <Input id="reupload-file" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                <p className="text-xs text-muted-foreground">支持 .pdf, .doc, .docx 格式，大小不超过 10MB</p>
              </div>

              {uploadFile && (
                <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-sm">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <span className="flex-1 truncate font-medium">{uploadFile.name}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setUploadFile(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadTarget(null); setUploadFile(null) }}>
              取消
            </Button>
            <Button onClick={handleReupload} disabled={!uploadFile || isUploading}>
              {isUploading ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-bounce" />
                  上传中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  确认上传
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
