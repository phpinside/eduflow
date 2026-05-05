"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getStoredUsers, getStoredOrders, getStoredLessons } from "@/lib/storage"
import { Role, OrderType, OrderStatus } from "@/types"
import type { User } from "@/types"
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── constants ───────────────────────────────────────────────────────────────

const SUBJECTS = ["数学", "物理", "化学"]

const GRADES = [
  "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
  "七年级", "八年级", "九年级", "高一", "高二", "高三",
]

const LEVELS: { value: 'A' | 'B' | 'C' | 'D' | 'E'; label: string }[] = [
  { value: 'A', label: 'A 非常可靠' },
  { value: 'B', label: 'B 可靠' },
  { value: 'C', label: 'C 一般' },
  { value: 'D', label: 'D 出现过严重投诉' },
  { value: 'E', label: 'E 不采用' },
]

const LEVEL_BADGE_VARIANT: Record<string, string> = {
  A: "bg-green-100 text-green-800 border-green-200",
  B: "bg-blue-100 text-blue-800 border-blue-200",
  C: "bg-yellow-100 text-yellow-800 border-yellow-200",
  D: "bg-orange-100 text-orange-800 border-orange-200",
  E: "bg-red-100 text-red-800 border-red-200",
}

const PAGE_SIZE = 10

/** Select 中「不限」项的值（Radix Select 不宜用空字符串） */
const FILTER_ALL = "__all__" as const

// ─── types ────────────────────────────────────────────────────────────────────

interface TutorMetric extends User {
  trialSuccessRate: string
  trialCount: number
  successCount: number
  regularStudentCount: number
  totalHours: number
  managerPhone?: string
}

interface Filters {
  name: string
  phone: string
  managerName: string
  managerPhone: string
  level: string
  subject: string
  grade: string
  creditScoreMin: string
  creditScoreMax: string
  studentCountMin: string
  studentCountMax: string
  hoursMin: string
  hoursMax: string
  registeredFrom: string
  registeredTo: string
}

const DEFAULT_FILTERS: Filters = {
  name: "",
  phone: "",
  managerName: "",
  managerPhone: "",
  level: FILTER_ALL,
  subject: FILTER_ALL,
  grade: FILTER_ALL,
  creditScoreMin: "",
  creditScoreMax: "",
  studentCountMin: "",
  studentCountMax: "",
  hoursMin: "",
  hoursMax: "",
  registeredFrom: "",
  registeredTo: "",
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function maskPhone(phone: string) {
  if (phone.length < 8) return phone
  return phone.slice(0, 3) + "****" + phone.slice(7)
}

// ─── component ────────────────────────────────────────────────────────────────

export default function TutorSearchPage() {
  const router = useRouter()
  const [tutors, setTutors] = useState<TutorMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  // Load and compute metrics
  useEffect(() => {
    const users = getStoredUsers()
    const orders = getStoredOrders()
    const lessons = getStoredLessons()

    const tutorUsers = users.filter(u => u.roles.includes(Role.TUTOR))
    const managerById = new Map(
      users.filter(u => u.roles.includes(Role.MANAGER)).map(m => [m.id, m])
    )

    const metrics: TutorMetric[] = tutorUsers.map(tutor => {
      const trialOrders = orders.filter(
        o => o.assignedTeacherId === tutor.id && o.type === OrderType.TRIAL
      )
      const trialCount = trialOrders.length
      let successCount = 0
      trialOrders.forEach(to => {
        const converted = orders.some(
          o => o.studentId === to.studentId && o.type === OrderType.REGULAR
        )
        if (converted) successCount++
      })
      const trialSuccessRate =
        trialCount > 0 ? `${Math.round((successCount / trialCount) * 100)}%` : "0%"

      const regularOrders = orders.filter(
        o =>
          o.assignedTeacherId === tutor.id &&
          o.type === OrderType.REGULAR &&
          [OrderStatus.IN_PROGRESS, OrderStatus.ASSIGNED].includes(o.status)
      )
      const regularStudentCount = new Set(regularOrders.map(o => o.studentId)).size

      const teacherLessons = lessons.filter(l => l.teacherId === tutor.id)
      const totalHours =
        Math.round((teacherLessons.reduce((a, c) => a + c.duration, 0) / 60) * 10) / 10

      const manager = tutor.managerId ? managerById.get(tutor.managerId) : undefined

      return {
        ...tutor,
        trialSuccessRate,
        trialCount,
        successCount,
        regularStudentCount,
        totalHours,
        managerPhone: manager?.phone,
      }
    })

    setTutors(metrics)
    setLoading(false)
  }, [])

  // Apply filters
  const filtered = useMemo(() => {
    return tutors.filter(t => {
      if (filters.name && !t.name.includes(filters.name)) return false
      if (filters.phone && !t.phone.includes(filters.phone)) return false
      if (filters.managerName && !(t.managerName ?? "").includes(filters.managerName)) return false
      if (filters.managerPhone && !(t.managerPhone ?? "").includes(filters.managerPhone)) return false
      if (
        filters.level !== FILTER_ALL &&
        (!t.tutorLevel || t.tutorLevel !== filters.level)
      )
        return false
      if (
        filters.subject !== FILTER_ALL &&
        !t.tutorSubjects?.includes(filters.subject)
      )
        return false
      if (
        filters.grade !== FILTER_ALL &&
        !t.tutorGrades?.includes(filters.grade)
      )
        return false

      const creditMin = filters.creditScoreMin !== "" ? Number(filters.creditScoreMin) : null
      const creditMax = filters.creditScoreMax !== "" ? Number(filters.creditScoreMax) : null
      if (creditMin !== null && (t.creditScore ?? 0) < creditMin) return false
      if (creditMax !== null && (t.creditScore ?? 0) > creditMax) return false

      const scMin = filters.studentCountMin !== "" ? Number(filters.studentCountMin) : null
      const scMax = filters.studentCountMax !== "" ? Number(filters.studentCountMax) : null
      if (scMin !== null && t.regularStudentCount < scMin) return false
      if (scMax !== null && t.regularStudentCount > scMax) return false

      const hMin = filters.hoursMin !== "" ? Number(filters.hoursMin) : null
      const hMax = filters.hoursMax !== "" ? Number(filters.hoursMax) : null
      if (hMin !== null && t.totalHours < hMin) return false
      if (hMax !== null && t.totalHours > hMax) return false

      if (filters.registeredFrom) {
        const from = new Date(filters.registeredFrom)
        if (new Date(t.createdAt) < from) return false
      }
      if (filters.registeredTo) {
        const to = new Date(filters.registeredTo)
        to.setHours(23, 59, 59, 999)
        if (new Date(t.createdAt) > to) return false
      }

      return true
    })
  }, [tutors, filters])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function resetFilters() {
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">加载中...</div>

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">伴学教练检索</h1>
        <p className="text-muted-foreground mt-1 text-sm">多条件筛选，查找符合要求的伴学教练</p>
      </div>

      {/* Filter Card */}
      <Card>
        <CardContent className="pt-5 pb-4">
          {/* Card header row */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-muted-foreground">筛选条件</span>
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 gap-1 text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
              重置筛选
            </Button>
          </div>

          <div className="space-y-4">
            {/* Row 1: name + phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">教练姓名</Label>
                <Input
                  placeholder="搜索姓名"
                  value={filters.name}
                  onChange={e => setFilter("name", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">教练手机号</Label>
                <Input
                  placeholder="搜索手机号"
                  value={filters.phone}
                  onChange={e => setFilter("phone", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Row 1b: manager name + phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">学管姓名</Label>
                <Input
                  placeholder="搜索学管姓名"
                  value={filters.managerName}
                  onChange={e => setFilter("managerName", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">学管手机号</Label>
                <Input
                  placeholder="搜索学管手机号"
                  value={filters.managerPhone}
                  onChange={e => setFilter("managerPhone", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Row 2: level / subject / grade (select) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">教练等级</Label>
                <Select
                  value={filters.level}
                  onValueChange={v => setFilter("level", v)}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>全部</SelectItem>
                    {LEVELS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">可授科目</Label>
                <Select
                  value={filters.subject}
                  onValueChange={v => setFilter("subject", v)}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>全部</SelectItem>
                    {SUBJECTS.map(s => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">可授年级</Label>
                <Select
                  value={filters.grade}
                  onValueChange={v => setFilter("grade", v)}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>全部</SelectItem>
                    {GRADES.map(g => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row 3: numeric ranges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">信用分区间（1–12）</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={1} max={12} placeholder="最低"
                    value={filters.creditScoreMin}
                    onChange={e => setFilter("creditScoreMin", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground text-xs shrink-0">—</span>
                  <Input
                    type="number" min={1} max={12} placeholder="最高"
                    value={filters.creditScoreMax}
                    onChange={e => setFilter("creditScoreMax", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">正课学员数区间</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={0} placeholder="最少"
                    value={filters.studentCountMin}
                    onChange={e => setFilter("studentCountMin", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground text-xs shrink-0">—</span>
                  <Input
                    type="number" min={0} placeholder="最多"
                    value={filters.studentCountMax}
                    onChange={e => setFilter("studentCountMax", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">累计课时区间（小时）</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min={0} placeholder="最少"
                    value={filters.hoursMin}
                    onChange={e => setFilter("hoursMin", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground text-xs shrink-0">—</span>
                  <Input
                    type="number" min={0} placeholder="最多"
                    value={filters.hoursMax}
                    onChange={e => setFilter("hoursMax", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Row 4: date range */}
            <div className="space-y-1.5">
              <Label className="text-xs">注册时间区间</Label>
              <div className="flex items-center gap-2 max-w-sm">
                <Input
                  type="date"
                  value={filters.registeredFrom}
                  onChange={e => setFilter("registeredFrom", e.target.value)}
                  className="h-8 text-sm"
                />
                <span className="text-muted-foreground text-xs shrink-0">—</span>
                <Input
                  type="date"
                  value={filters.registeredTo}
                  onChange={e => setFilter("registeredTo", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            共 <span className="font-medium text-foreground">{filtered.length}</span> 位教练
          </span>
        </div>

        <div className="rounded-md border bg-white dark:bg-gray-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>教练姓名</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>等级</TableHead>
                <TableHead>信用分</TableHead>
                <TableHead>试课成功率</TableHead>
                <TableHead>正课学员数</TableHead>
                <TableHead>累计课时</TableHead>
                <TableHead>加入时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    暂无符合条件的教练
                  </TableCell>
                </TableRow>
              ) : (
                paged.map(tutor => (
                  <TableRow key={tutor.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => router.push(`/team-management/${tutor.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={tutor.avatar} alt={tutor.name} />
                          <AvatarFallback>{tutor.name.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{tutor.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{maskPhone(tutor.phone)}</TableCell>
                    <TableCell>
                      {tutor.tutorLevel ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                            LEVEL_BADGE_VARIANT[tutor.tutorLevel]
                          )}
                        >
                          {tutor.tutorLevel}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tutor.creditScore != null ? (
                        <span className={cn(
                          "text-sm font-medium",
                          tutor.creditScore >= 10 ? "text-green-600" :
                          tutor.creditScore >= 7 ? "text-yellow-600" : "text-red-600"
                        )}>
                          {tutor.creditScore}
                          <span className="text-muted-foreground font-normal text-xs">/12</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{tutor.trialSuccessRate}</span>
                        <span className="text-xs text-muted-foreground">
                          {tutor.successCount}/{tutor.trialCount}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{tutor.regularStudentCount} 人</TableCell>
                    <TableCell className="text-sm">{tutor.totalHours} 小时</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(tutor.createdAt).toLocaleDateString("zh-CN")}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-xs text-muted-foreground">
              第 {currentPage} / {totalPages} 页，每页 {PAGE_SIZE} 条
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <Button
                  key={p}
                  variant={p === currentPage ? "default" : "outline"}
                  size="sm"
                  className="h-7 min-w-[28px] px-2 text-xs"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline" size="icon" className="h-7 w-7"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
