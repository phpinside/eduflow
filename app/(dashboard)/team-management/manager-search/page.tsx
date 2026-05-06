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
import { getStoredUsers, getStoredOrders } from "@/lib/storage"
import { Role, OrderType, OrderStatus } from "@/types"
import type { User } from "@/types"
import { RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// ─── constants ───────────────────────────────────────────────────────────────

const PAGE_SIZE = 10
const FILTER_ALL = "__all__" as const

type ManagerRank = '见习学管' | '正式学管' | '总监'

const RANK_OPTIONS: { value: ManagerRank; label: string }[] = [
  { value: '见习学管', label: '见习学管' },
  { value: '正式学管', label: '正式学管' },
  { value: '总监', label: '总监' },
]

const RANK_BADGE: Record<ManagerRank, string> = {
  '见习学管': 'bg-sky-100 text-sky-800 border-sky-200',
  '正式学管': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  '总监': 'bg-purple-100 text-purple-800 border-purple-200',
}

// ─── types ────────────────────────────────────────────────────────────────────

interface ManagerMetric extends User {
  superiorPhone?: string
  trialSuccessRate: string
  trialCount: number
  trialSuccessCount: number
  regularStudentCount: number
  regularTutorCount: number
  totalTutorCount: number
}

interface Filters {
  name: string
  phone: string
  superiorName: string
  superiorPhone: string
  rank: string
  rankFrom: string
  rankTo: string
}

const DEFAULT_FILTERS: Filters = {
  name: "",
  phone: "",
  superiorName: "",
  superiorPhone: "",
  rank: FILTER_ALL,
  rankFrom: "",
  rankTo: "",
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function maskPhone(phone: string) {
  if (phone.length < 8) return phone
  return phone.slice(0, 3) + "****" + phone.slice(7)
}

// ─── component ────────────────────────────────────────────────────────────────

export default function ManagerSearchPage() {
  const router = useRouter()
  const [managers, setManagers] = useState<ManagerMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const users = getStoredUsers()
    const orders = getStoredOrders()

    const managerUsers = users.filter(u => u.roles.includes(Role.MANAGER))
    const tutorUsers = users.filter(u => u.roles.includes(Role.TUTOR))

    // Build superior phone lookup
    const userById = new Map(users.map(u => [u.id, u]))

    const metrics: ManagerMetric[] = managerUsers.map(manager => {
      // Trial success rate within this manager's orders
      const trialOrders = orders.filter(
        o => o.managerId === manager.id && o.type === OrderType.TRIAL
      )
      const trialCount = trialOrders.length
      let trialSuccessCount = 0
      trialOrders.forEach(to => {
        const converted = orders.some(
          o => o.studentId === to.studentId && o.type === OrderType.REGULAR
        )
        if (converted) trialSuccessCount++
      })
      const trialSuccessRate =
        trialCount > 0 ? `${Math.round((trialSuccessCount / trialCount) * 100)}%` : "—"

      // Regular student count (unique students in active regular orders under this manager)
      const activeRegularOrders = orders.filter(
        o =>
          o.managerId === manager.id &&
          o.type === OrderType.REGULAR &&
          [OrderStatus.IN_PROGRESS, OrderStatus.ASSIGNED].includes(o.status)
      )
      const regularStudentCount = new Set(activeRegularOrders.map(o => o.studentId)).size

      // Regular tutor count (unique tutors in those orders)
      const regularTutorCount = new Set(
        activeRegularOrders
          .filter(o => o.assignedTeacherId)
          .map(o => o.assignedTeacherId!)
      ).size

      // Total tutors under this manager
      const totalTutorCount = tutorUsers.filter(t => t.managerId === manager.id).length

      const superior = manager.superiorId ? userById.get(manager.superiorId) : undefined

      return {
        ...manager,
        superiorPhone: superior?.phone,
        trialSuccessRate,
        trialCount,
        trialSuccessCount,
        regularStudentCount,
        regularTutorCount,
        totalTutorCount,
      }
    })

    setManagers(metrics)
    setLoading(false)
  }, [])

  // Apply filters
  const filtered = useMemo(() => {
    return managers.filter(m => {
      if (filters.name && !m.name.includes(filters.name)) return false
      if (filters.phone && !m.phone.includes(filters.phone)) return false
      if (filters.superiorName && !(m.superiorName ?? "").includes(filters.superiorName)) return false
      if (filters.superiorPhone && !(m.superiorPhone ?? "").includes(filters.superiorPhone)) return false
      if (filters.rank !== FILTER_ALL && m.managerRank !== filters.rank) return false

      if (filters.rankFrom && m.managerRankEffectiveDate) {
        if (new Date(m.managerRankEffectiveDate) < new Date(filters.rankFrom)) return false
      }
      if (filters.rankTo && m.managerRankEffectiveDate) {
        const to = new Date(filters.rankTo)
        to.setHours(23, 59, 59, 999)
        if (new Date(m.managerRankEffectiveDate) > to) return false
      }

      return true
    })
  }, [managers, filters])

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
        <h1 className="text-2xl font-bold tracking-tight">伴学团队检索</h1>
        <p className="text-muted-foreground mt-1 text-sm">多条件筛选，查找符合要求的学管人员</p>
      </div>

      {/* Filter Card */}
      <Card>
        <CardContent className="pt-5 pb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-muted-foreground">筛选条件</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 gap-1 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重置筛选
            </Button>
          </div>

          <div className="space-y-4">
            {/* Row 1: name + phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">姓名</Label>
                <Input
                  placeholder="搜索姓名"
                  value={filters.name}
                  onChange={e => setFilter("name", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">手机号</Label>
                <Input
                  placeholder="搜索手机号"
                  value={filters.phone}
                  onChange={e => setFilter("phone", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Row 2: superior name + phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">上级姓名</Label>
                <Input
                  placeholder="搜索上级姓名"
                  value={filters.superiorName}
                  onChange={e => setFilter("superiorName", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">上级手机号</Label>
                <Input
                  placeholder="搜索上级手机号"
                  value={filters.superiorPhone}
                  onChange={e => setFilter("superiorPhone", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {/* Row 3: rank + effective date range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">职级</Label>
                <Select
                  value={filters.rank}
                  onValueChange={v => setFilter("rank", v)}
                >
                  <SelectTrigger className="h-8 w-full text-sm">
                    <SelectValue placeholder="全部" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={FILTER_ALL}>全部</SelectItem>
                    {RANK_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">职级生效时间区间</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={filters.rankFrom}
                    onChange={e => setFilter("rankFrom", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <span className="text-muted-foreground text-xs shrink-0">—</span>
                  <Input
                    type="date"
                    value={filters.rankTo}
                    onChange={e => setFilter("rankTo", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            共 <span className="font-medium text-foreground">{filtered.length}</span> 位学管
          </span>
        </div>

        <div className="rounded-md border bg-white dark:bg-gray-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>职级</TableHead>
                <TableHead>职级生效时间</TableHead>
                <TableHead>上级姓名</TableHead>
                <TableHead>团队试课成功率</TableHead>
                <TableHead>团队正课学员数</TableHead>
                <TableHead>团队正课教练数</TableHead>
                <TableHead>团队教练总数</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                    暂无符合条件的学管
                  </TableCell>
                </TableRow>
              ) : (
                paged.map(manager => (
                  <TableRow key={manager.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => router.push(`/team-management/manager-detail/${manager.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={manager.avatar} alt={manager.name} />
                          <AvatarFallback>{manager.name.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-sm">{manager.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-mono">{maskPhone(manager.phone)}</TableCell>
                    <TableCell>
                      {manager.managerRank ? (
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold",
                            RANK_BADGE[manager.managerRank]
                          )}
                        >
                          {manager.managerRank}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {manager.managerRankEffectiveDate
                        ? new Date(manager.managerRankEffectiveDate).toLocaleDateString("zh-CN")
                        : <span className="text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-sm">
                      {manager.superiorName ?? <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm">{manager.trialSuccessRate}</span>
                        {manager.trialCount > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {manager.trialSuccessCount}/{manager.trialCount}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{manager.regularStudentCount} 人</TableCell>
                    <TableCell className="text-sm">{manager.regularTutorCount} 人</TableCell>
                    <TableCell className="text-sm">{manager.totalTutorCount} 人</TableCell>
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
