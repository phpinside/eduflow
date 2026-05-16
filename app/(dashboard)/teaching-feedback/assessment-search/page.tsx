"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ClipboardCheck, ImageIcon, Minus, Pencil, TrendingDown, TrendingUp } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { cn } from "@/lib/utils"
import { getStoredAssessments, getStoredOrders, getStoredUsers } from "@/lib/storage"
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
  type AssessmentTableRow,
  ASSESSMENT_PROBLEM_LABELS,
  assessmentTypeLabel,
  assessmentConclusionLabel,
  safeDate,
  DetailRow,
  SearchInput,
  SelectBox,
  EmptyRow,
  SimplePagination,
} from "../_shared"

const CONCLUSION_META: Record<string, { label: string; color: "emerald" | "red" | "default" }> = {
  breakthrough: { label: "关键突破", color: "emerald" },
  improved: { label: "提升明显", color: "emerald" },
  no_progress: { label: "无明显进步", color: "default" },
  declined: { label: "下降", color: "red" },
  risk: { label: "风险预警", color: "red" },
}

function ScoreDiff({ current, previous }: { current: string; previous: string }) {
  const cur = parseFloat(current)
  const prev = parseFloat(previous)
  if (isNaN(cur) || isNaN(prev) || prev === 0) return null
  const diff = cur - prev
  const pct = ((diff / prev) * 100).toFixed(0)
  const isPositive = diff > 0
  const isZero = diff === 0
  const sign = isPositive ? "+" : ""
  const colorClass = isZero
    ? "text-muted-foreground"
    : isPositive
      ? "text-emerald-600"
      : "text-destructive"
  const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold tabular-nums", colorClass)}>
      <Icon className="h-3.5 w-3.5" />
      {sign}{diff}分（{sign}{pct}%）
    </span>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-3">
      {children}
    </p>
  )
}

export default function AssessmentSearchPage() {
  const { user } = useAuth()
  const users = React.useMemo(() => getStoredUsers(), [])

  const [studentName, setStudentName] = React.useState("")
  const [studentAccount, setStudentAccount] = React.useState("")
  const [subject, setSubject] = React.useState("ALL")
  const [courseType, setCourseType] = React.useState("ALL")
  const [grade, setGrade] = React.useState("ALL")
  const [type, setType] = React.useState("ALL")
  const [conclusion, setConclusion] = React.useState("ALL")
  const [tutorName, setTutorName] = React.useState("")
  const [tutorPhone, setTutorPhone] = React.useState("")
  const [managerPhone, setManagerPhone] = React.useState("")
  const [campusAccount, setCampusAccount] = React.useState("")
  const [startDate, setStartDate] = React.useState("")
  const [endDate, setEndDate] = React.useState("")
  const [page, setPage] = React.useState(1)
  const [selectedRow, setSelectedRow] = React.useState<AssessmentTableRow | null>(null)

  const assessmentRows = React.useMemo<AssessmentTableRow[]>(() => {
    const list = getStoredAssessments()
    const orders = getStoredOrders()
    return list.map((row) => {
      const order = orders.find((o) => o.id === row.orderId)
      const tutorUser = users.find((u) => u.id === row.teacherId)
      const managerUser = row.managerId ? users.find((u) => u.id === row.managerId) : undefined
      return {
        ...row,
        studentAccount: row.studentAccount ?? order?.studentAccount ?? "—",
        courseType: order?.type as OrderType | undefined,
        teacherPhone: tutorUser?.phone ?? "—",
        campusAccount: order?.campusAccount ?? "—",
        managerPhone: managerUser?.phone ?? "—",
      }
    })
  }, [users])

  const subjects = React.useMemo(() => {
    const values = new Set<string>()
    assessmentRows.forEach((row) => values.add(row.subject))
    return Array.from(values).sort()
  }, [assessmentRows])

  const grades = React.useMemo(() => {
    const values = new Set<string>()
    assessmentRows.forEach((row) => { if (row.grade) values.add(row.grade) })
    return Array.from(values).sort()
  }, [assessmentRows])

  const filtered = React.useMemo(() => {
    return assessmentRows.filter((row) => {
      if (studentName && !row.studentName.toLowerCase().includes(studentName.toLowerCase())) return false
      if (studentAccount && !row.studentAccount.toLowerCase().includes(studentAccount.toLowerCase())) return false
      if (courseType !== "ALL" && row.courseType !== courseType) return false
      if (subject !== "ALL" && row.subject !== subject) return false
      if (grade !== "ALL" && row.grade !== grade) return false
      if (type !== "ALL" && row.assessmentType !== type) return false
      if (conclusion !== "ALL" && row.conclusion !== conclusion) return false
      if (tutorName && !row.teacherName.toLowerCase().includes(tutorName.toLowerCase())) return false
      if (tutorPhone.trim() && !row.teacherPhone.includes(tutorPhone.trim())) return false
      if (managerPhone.trim() && !row.managerPhone.includes(managerPhone.trim())) return false
      if (campusAccount && !row.campusAccount.toLowerCase().includes(campusAccount.toLowerCase())) return false
      if (startDate) {
        const rowDate = format(row.assessedAt, "yyyy-MM-dd")
        if (rowDate < startDate) return false
      }
      if (endDate) {
        const rowDate = format(row.assessedAt, "yyyy-MM-dd")
        if (rowDate > endDate) return false
      }
      return true
    })
  }, [assessmentRows, studentName, studentAccount, courseType, subject, grade, type, conclusion, tutorName, tutorPhone, managerPhone, campusAccount, startDate, endDate])

  React.useEffect(() => { setPage(1) }, [studentName, studentAccount, courseType, subject, grade, type, conclusion, tutorName, tutorPhone, managerPhone, campusAccount, startDate, endDate])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  if (!user) {
    return <div className="p-8 text-sm text-muted-foreground">请先登录</div>
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">阶段性测评检索</h1>
        </div>
        <p className="text-muted-foreground">检索全部阶段性测评记录。</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>阶段性测评检索</CardTitle>
            <Button
              variant="outline"
              onClick={() => {
                setStudentName(""); setStudentAccount(""); setCourseType("ALL"); setSubject("ALL"); setGrade("ALL")
                setType("ALL"); setConclusion("ALL"); setTutorName(""); setTutorPhone(""); setManagerPhone(""); setCampusAccount(""); setStartDate(""); setEndDate("")
              }}
            >
              重置筛选
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
            <SearchInput label="学员姓名" value={studentName} onChange={setStudentName} placeholder="输入学员姓名..." />
            <SearchInput label="学员G账号" value={studentAccount} onChange={setStudentAccount} placeholder="输入G账号..." />
            <SearchInput label="伴学教练姓名" value={tutorName} onChange={setTutorName} placeholder="输入教练姓名..." />
            <SearchInput label="伴学教练手机号" value={tutorPhone} onChange={setTutorPhone} placeholder="输入教练手机号..." />
            <SearchInput label="学管手机号" value={managerPhone} onChange={setManagerPhone} placeholder="输入学管手机号..." />
            <SearchInput label="校区账号" value={campusAccount} onChange={setCampusAccount} placeholder="输入校区账号..." />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
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
              label="测评类型" value={type} onValueChange={setType}
              options={[
                { value: "ALL", label: "全部类型" },
                { value: "phase", label: "阶段测" },
                { value: "entry", label: "入学测" },
                { value: "mock", label: "模拟考" },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
            <SelectBox
              label="测评结论" value={conclusion} onValueChange={setConclusion}
              options={[
                { value: "ALL", label: "全部结论" },
                { value: "breakthrough", label: "关键突破" },
                { value: "improved", label: "提升明显" },
                { value: "no_progress", label: "无明显进步" },
                { value: "declined", label: "下降" },
                { value: "risk", label: "风险预警" },
              ]}
            />
            <div>
              <label className="mb-2 block text-sm font-medium">测评时间区间</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:max-w-md">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-background w-full min-w-0 sm:max-w-[150px]" />
                <span className="flex h-9 shrink-0 items-center justify-center px-2 text-sm text-muted-foreground sm:px-0">至</span>
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-background w-full min-w-0 sm:max-w-[150px]" />
              </div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            共找到 <span className="font-medium text-foreground">{filtered.length}</span> 条测评记录
          </div>

          <div className="border rounded-md bg-white dark:bg-gray-950 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学员</TableHead>
                  <TableHead>学员G账号</TableHead>
                  <TableHead>年级/学科</TableHead>
                  <TableHead>课程类型</TableHead>
                  <TableHead>测评类型</TableHead>
                  <TableHead>测评结论</TableHead>
                  <TableHead>伴学教练</TableHead>
                  <TableHead>学管</TableHead>
                  <TableHead>校区账号</TableHead>
                  <TableHead>测评时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 ? (
                  <EmptyRow colSpan={11} text="暂无符合条件的测评记录" />
                ) : (
                  visible.map((row) => (
                    <TableRow key={row.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedRow(row)}>
                      <TableCell className="font-medium">{row.studentName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.studentAccount}</TableCell>
                      <TableCell>{row.grade} / {row.subject}</TableCell>
                      <TableCell>
                        {row.courseType ? (
                          <Badge variant={row.courseType === OrderType.TRIAL ? "secondary" : "default"}>
                            {row.courseType === OrderType.TRIAL ? "试课" : "正课"}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{assessmentTypeLabel(row.assessmentType)}</TableCell>
                      <TableCell>{assessmentConclusionLabel(row.conclusion)}</TableCell>
                      <TableCell>{row.teacherName}</TableCell>
                      <TableCell>{row.managerName}</TableCell>
                      <TableCell className="text-muted-foreground">{row.campusAccount}</TableCell>
                      <TableCell>{format(row.assessedAt, "yyyy-MM-dd HH:mm", { locale: zhCN })}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8" asChild>
                          <Link href={`/teaching-feedback/assessment/${row.id}/edit`} aria-label="编辑测评">
                            <Pencil className="h-3 w-3" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <SimplePagination currentPage={page} totalPages={totalPages} onPageChange={setPage} hideWhenSingle={false} />
        </CardContent>
      </Card>

      {/* Assessment detail dialog */}
      <Dialog open={!!selectedRow} onOpenChange={(open) => { if (!open) setSelectedRow(null) }}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              阶段性测评详情
            </DialogTitle>
          </DialogHeader>
          {selectedRow && (() => {
            const conclusionMeta = CONCLUSION_META[selectedRow.conclusion]
            const isGood = conclusionMeta?.color === "emerald"
            const isBad = conclusionMeta?.color === "red"
            return (
              <div className="divide-y divide-border space-y-0 pt-1">
                {/* 基本信息 */}
                <div className="pb-4">
                  <SectionHeading>基本信息</SectionHeading>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">姓名</p>
                      <p className="font-medium">{selectedRow.studentName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">G账号</p>
                      <p className="font-medium font-mono text-xs">{selectedRow.studentAccount || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">学科</p>
                      <p className="font-medium">{selectedRow.subject}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">年级</p>
                      <p className="font-medium">{selectedRow.grade || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">伴学教练</p>
                      <p className="font-medium">{selectedRow.teacherName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">学管</p>
                      <p className="font-medium">{selectedRow.managerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">课程类型</p>
                      <p className="font-medium">
                        {selectedRow.courseType ? (
                          <Badge variant={selectedRow.courseType === OrderType.TRIAL ? "secondary" : "default"}>
                            {selectedRow.courseType === OrderType.TRIAL ? "试课" : "正课"}
                          </Badge>
                        ) : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">记录创建时间</p>
                      <p className="font-medium">{format(safeDate(selectedRow.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}</p>
                    </div>
                  </div>
                </div>

                {/* 测评时间与类型 */}
                <div className="py-4">
                  <SectionHeading>测评时间 &amp; 类型</SectionHeading>
                  <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">测评时间</p>
                      <p className="font-medium">{format(safeDate(selectedRow.assessedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">测评类型</p>
                      <p className="font-medium">{assessmentTypeLabel(selectedRow.assessmentType)}</p>
                    </div>
                  </div>
                </div>

                {/* 成绩 */}
                <div className="py-4">
                  <SectionHeading>成绩</SectionHeading>
                  {selectedRow.currentScore || selectedRow.previousScore ? (
                    <div className="flex flex-wrap items-end gap-4 text-sm">
                      {selectedRow.currentScore ? (
                        <div className="rounded-lg border bg-card px-4 py-2.5 min-w-[100px]">
                          <p className="text-xs text-muted-foreground mb-0.5">本次成绩</p>
                          <p className="text-xl font-bold tabular-nums">{selectedRow.currentScore}</p>
                        </div>
                      ) : null}
                      {selectedRow.previousScore ? (
                        <div className="rounded-lg border bg-muted/40 px-4 py-2.5 min-w-[100px]">
                          <p className="text-xs text-muted-foreground mb-0.5">上次成绩</p>
                          <p className="text-xl font-bold tabular-nums text-muted-foreground">{selectedRow.previousScore}</p>
                        </div>
                      ) : null}
                      {selectedRow.currentScore && selectedRow.previousScore ? (
                        <div className="rounded-md bg-muted/50 px-3 py-1.5">
                          <p className="text-xs text-muted-foreground mb-0.5">较上次</p>
                          <ScoreDiff current={selectedRow.currentScore} previous={selectedRow.previousScore} />
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无成绩记录</p>
                  )}
                </div>

                {/* 失分归因 */}
                <div className="py-4">
                  <SectionHeading>失分归因</SectionHeading>
                  {selectedRow.problems && selectedRow.problems.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRow.problems.map((pid) => (
                        <Badge key={pid} variant="secondary" className="font-normal">
                          {ASSESSMENT_PROBLEM_LABELS[pid] ?? pid}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">无</p>
                  )}
                </div>

                {/* 测评结论 */}
                <div className="py-4">
                  <SectionHeading>测评结论</SectionHeading>
                  <span className={cn(
                    "inline-flex items-center rounded-lg border px-3.5 py-1.5 text-sm font-medium",
                    isGood && "border-emerald-400 bg-emerald-50 text-emerald-700",
                    isBad && "border-red-400 bg-red-50 text-red-700",
                    !isGood && !isBad && "border-primary/30 bg-primary/5 text-primary",
                  )}>
                    {conclusionMeta?.label ?? assessmentConclusionLabel(selectedRow.conclusion)}
                  </span>
                </div>

                {/* 测评说明 */}
                <div className="py-4">
                  <SectionHeading>测评说明</SectionHeading>
                  {selectedRow.description ? (
                    <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground/80">
                      {selectedRow.description}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">暂无测评说明</p>
                  )}
                </div>

                {/* 测评图片 */}
                <div className="py-4">
                  <SectionHeading>测评图片</SectionHeading>
                  <div className="flex flex-wrap gap-3">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="h-24 w-24 shrink-0 rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 flex flex-col items-center justify-center gap-1 text-muted-foreground/40"
                      >
                        <ImageIcon className="h-6 w-6" />
                        <span className="text-[10px]">图片 {n}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground/60">原型暂不持久化图片，展示占位符</p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setSelectedRow(null)}>关闭</Button>
                  <Button asChild>
                    <Link href={`/teaching-feedback/assessment/${selectedRow.id}/edit`} onClick={() => setSelectedRow(null)}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      编辑
                    </Link>
                  </Button>
                </div>
              </div>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
