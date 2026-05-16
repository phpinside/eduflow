"use client"

import { useState, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { format, subMonths, subYears, isAfter, isBefore, startOfDay, endOfDay } from "date-fns"
import { useAuth } from "@/contexts/AuthContext"
import { getStoredTutorCreditLogs, getStoredUsers } from "@/lib/storage"
import { TutorCreditChangeType, Role } from "@/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  ArrowLeft,
  Shield,
  TrendingDown,
  TrendingUp,
  Clock,
  User,
  CalendarIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

type TimeRange = "all" | "3m" | "6m" | "1y" | "custom"

function getScoreColor(score: number): string {
  if (score >= 10) return "text-emerald-600"
  if (score >= 7) return "text-amber-600"
  if (score >= 4) return "text-orange-600"
  return "text-red-600"
}

function getScoreBg(score: number): string {
  if (score >= 10) return "bg-emerald-50 border-emerald-200"
  if (score >= 7) return "bg-amber-50 border-amber-200"
  if (score >= 4) return "bg-orange-50 border-orange-200"
  return "bg-red-50 border-red-200"
}

function getScoreRingColor(score: number): string {
  if (score >= 10) return "stroke-emerald-500"
  if (score >= 7) return "stroke-amber-500"
  if (score >= 4) return "stroke-orange-500"
  return "stroke-red-500"
}

function getChangeTypeLabel(type: TutorCreditChangeType): string {
  const map: Record<TutorCreditChangeType, string> = {
    [TutorCreditChangeType.INITIAL_REGISTRATION]: "初始注册",
    [TutorCreditChangeType.RESET]: "信用分重置",
    [TutorCreditChangeType.MINOR_VIOLATION]: "轻微违规",
    [TutorCreditChangeType.GENERAL_VIOLATION]: "一般违规",
    [TutorCreditChangeType.SEVERE_VIOLATION]: "严重违规",
    [TutorCreditChangeType.REDLINE_VIOLATION]: "红线行为",
  }
  return map[type] || type
}

function getChangeTypeBadgeVariant(type: TutorCreditChangeType): "default" | "secondary" | "destructive" | "outline" {
  if (type === TutorCreditChangeType.INITIAL_REGISTRATION || type === TutorCreditChangeType.RESET) return "secondary"
  if (type === TutorCreditChangeType.MINOR_VIOLATION) return "outline"
  return "destructive"
}

function formatDate(date: Date): string {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function getTimeRangeBounds(range: TimeRange, customStart?: Date, customEnd?: Date): { start?: Date; end?: Date } {
  const now = new Date()
  switch (range) {
    case "3m":
      return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) }
    case "6m":
      return { start: startOfDay(subMonths(now, 6)), end: endOfDay(now) }
    case "1y":
      return { start: startOfDay(subYears(now, 1)), end: endOfDay(now) }
    case "custom":
      return { start: customStart ? startOfDay(customStart) : undefined, end: customEnd ? endOfDay(customEnd) : undefined }
    default:
      return {}
  }
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(score / 12, 1)
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" className="stroke-muted" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className={getScoreRingColor(score)}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-[10px] text-muted-foreground">/12</span>
      </div>
    </div>
  )
}

const ITEMS_PER_PAGE = 15

const TIME_RANGE_OPTIONS: { value: TimeRange; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "3m", label: "近3个月" },
  { value: "6m", label: "近6个月" },
  { value: "1y", label: "近1年" },
  { value: "custom", label: "自定义" },
]

function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
}: {
  from?: Date
  to?: Date
  onFromChange: (d?: Date) => void
  onToChange: (d?: Date) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("w-[140px] justify-start text-left font-normal", !from && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {from ? format(from, "yyyy-MM-dd") : "开始日期"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={from} onSelect={onFromChange} initialFocus />
        </PopoverContent>
      </Popover>
      <span className="text-sm text-muted-foreground">至</span>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("w-[140px] justify-start text-left font-normal", !to && "text-muted-foreground")}
          >
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            {to ? format(to, "yyyy-MM-dd") : "结束日期"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={to} onSelect={onToChange} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  )
}

function TutorCreditHistory({ tutorId }: { tutorId: string }) {
  const [filterType, setFilterType] = useState<string>("all")
  const [timeRange, setTimeRange] = useState<TimeRange>("all")
  const [customStart, setCustomStart] = useState<Date | undefined>()
  const [customEnd, setCustomEnd] = useState<Date | undefined>()
  const [currentPage, setCurrentPage] = useState(1)

  const allUsers = getStoredUsers()
  const tutor = allUsers.find((u) => u.id === tutorId)
  const creditScore = tutor?.creditScore ?? 12

  const logs = useMemo(() => {
    return getStoredTutorCreditLogs()
      .filter((log) => log.tutorId === tutorId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
  }, [tutorId])

  const filteredLogs = useMemo(() => {
    let result = logs
    if (filterType !== "all") {
      result = result.filter((log) => log.changeType === filterType)
    }
    if (timeRange !== "all") {
      const bounds = getTimeRangeBounds(timeRange, customStart, customEnd)
      if (bounds.start) {
        result = result.filter((log) => isAfter(new Date(log.changedAt), bounds.start!) || new Date(log.changedAt).getTime() === bounds.start!.getTime())
      }
      if (bounds.end) {
        result = result.filter((log) => isBefore(new Date(log.changedAt), bounds.end!) || new Date(log.changedAt).getTime() === bounds.end!.getTime())
      }
    }
    return result
  }, [logs, filterType, timeRange, customStart, customEnd])

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / ITEMS_PER_PAGE))
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range)
    if (range !== "custom") {
      setCustomStart(undefined)
      setCustomEnd(undefined)
    }
    setCurrentPage(1)
  }

  const bonusCount = logs.filter((l) => l.scoreDelta > 0).length
  const penaltyCount = logs.filter((l) => l.scoreDelta < 0).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">信用分变动记录</h1>
          <p className="text-muted-foreground mt-1">
            {tutor ? `${tutor.name} 的信用分变动历史` : "信用分变动历史"}
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回概览
          </Link>
        </Button>
      </div>

      <Card className={`border ${getScoreBg(creditScore)}`}>
        <CardContent className="p-6">
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="flex flex-col items-center shrink-0">
              <ScoreRing score={creditScore} />
              <div className="mt-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <Shield className={`h-4 w-4 ${getScoreColor(creditScore)}`} />
                  <span className="text-sm font-medium">当前信用分</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {creditScore >= 10 ? "信用良好" : creditScore >= 7 ? "信用一般" : creditScore >= 4 ? "信用较差" : "信用极低"}
                </p>
              </div>
            </div>

            <div className="h-20 w-px bg-border/50 hidden sm:block" />

            <div className="flex flex-1 items-center justify-around gap-6 w-full">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-2xl font-bold text-emerald-600">{bonusCount}</span>
                </div>
                <span className="text-xs text-muted-foreground">加分次数</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4 text-red-500" />
                  <span className="text-2xl font-bold text-red-600">{penaltyCount}</span>
                </div>
                <span className="text-xs text-muted-foreground">扣分次数</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-2xl font-bold">{logs.length}</span>
                </div>
                <span className="text-xs text-muted-foreground">总变动次数</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">时间</span>
          {TIME_RANGE_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={timeRange === opt.value ? "default" : "outline"}
              size="sm"
              className="h-8"
              onClick={() => handleTimeRangeChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        {timeRange === "custom" && (
          <DateRangePicker
            from={customStart}
            to={customEnd}
            onFromChange={(d) => { setCustomStart(d); setCurrentPage(1) }}
            onToChange={(d) => { setCustomEnd(d); setCurrentPage(1) }}
          />
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={filterType}
            onValueChange={(v) => { setFilterType(v); setCurrentPage(1) }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="全部类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value={TutorCreditChangeType.INITIAL_REGISTRATION}>初始注册</SelectItem>
              <SelectItem value={TutorCreditChangeType.RESET}>信用分重置</SelectItem>
              <SelectItem value={TutorCreditChangeType.MINOR_VIOLATION}>轻微违规</SelectItem>
              <SelectItem value={TutorCreditChangeType.GENERAL_VIOLATION}>一般违规</SelectItem>
              <SelectItem value={TutorCreditChangeType.SEVERE_VIOLATION}>严重违规</SelectItem>
              <SelectItem value={TutorCreditChangeType.REDLINE_VIOLATION}>红线行为</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            共 <span className="font-semibold text-foreground">{filteredLogs.length}</span> 条记录
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">变动类型</TableHead>
                <TableHead className="w-[100px]">分值变化</TableHead>
                <TableHead>违规规则</TableHead>
                <TableHead className="w-[80px]">变更后</TableHead>
                <TableHead className="w-[120px]">操作人</TableHead>
                <TableHead className="w-[160px]">变动时间</TableHead>
                <TableHead className="min-w-[150px]">备注</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <Clock className="mx-auto h-12 w-12 mb-2 opacity-20" />
                    <p>暂无变动记录</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <Badge variant={getChangeTypeBadgeVariant(log.changeType)} className="text-xs">
                        {getChangeTypeLabel(log.changeType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {log.scoreDelta > 0 ? (
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className={`text-sm font-semibold ${log.scoreDelta > 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {log.scoreDelta > 0 ? "+" : ""}{log.scoreDelta}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{log.ruleName || "-"}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm font-medium ${getScoreColor(log.scoreAfter)}`}>
                        {log.scoreAfter} 分
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <User className="h-3 w-3 text-muted-foreground" />
                        {log.submittedByName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDate(log.changedAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-[200px] truncate" title={log.note}>
                        {log.note || "-"}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {filteredLogs.length > ITEMS_PER_PAGE && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ManagerCreditHistory() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const selectedTutorId = searchParams.get("tutorId")
  const [selectedId, setSelectedId] = useState<string | null>(selectedTutorId)

  const tutors = useMemo(() => {
    if (!user) return []
    const allUsers = getStoredUsers()
    return allUsers
      .filter((u) => u.roles.includes(Role.TUTOR) && u.managerId === user.id)
      .sort((a, b) => (a.creditScore ?? 12) - (b.creditScore ?? 12))
  }, [user])

  if (selectedId) {
    return (
      <div>
        <div className="mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedId(null)}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            返回教练列表
          </Button>
        </div>
        <TutorCreditHistory tutorId={selectedId} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">教练信用分管理</h1>
          <p className="text-muted-foreground mt-1">
            查看和管理团队教练的信用分变动记录
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回概览
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(() => {
          const scores = tutors.map((t) => t.creditScore ?? 12)
          const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
          const low = tutors.filter((t) => (t.creditScore ?? 12) < 7).length
          return (
            <>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{tutors.length}</div>
                    <div className="text-xs text-muted-foreground">团队教练</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${avg >= 7 ? "bg-emerald-100" : "bg-amber-100"}`}>
                    <Shield className={`h-5 w-5 ${avg >= 7 ? "text-emerald-600" : "text-amber-600"}`} />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${getScoreColor(avg)}`}>{avg}</div>
                    <div className="text-xs text-muted-foreground">平均信用分</div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{low}</div>
                    <div className="text-xs text-muted-foreground">低信用教练</div>
                  </div>
                </CardContent>
              </Card>
            </>
          )
        })()}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">信用分</TableHead>
                <TableHead>教练姓名</TableHead>
                <TableHead>可授科目</TableHead>
                <TableHead className="w-[80px]">状态</TableHead>
                <TableHead className="w-[100px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tutors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                    <User className="mx-auto h-12 w-12 mb-2 opacity-20" />
                    <p>暂无教练</p>
                  </TableCell>
                </TableRow>
              ) : (
                tutors.map((tutor) => {
                  const score = tutor.creditScore ?? 12
                  return (
                    <TableRow key={tutor.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setSelectedId(tutor.id)}>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <div className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                            score >= 10 ? "bg-emerald-100 text-emerald-700" :
                            score >= 7 ? "bg-amber-100 text-amber-700" :
                            score >= 4 ? "bg-orange-100 text-orange-700" :
                            "bg-red-100 text-red-700"
                          }`}>
                            {score}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{tutor.name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {tutor.tutorSubjects?.length ? tutor.tutorSubjects.join("、") : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={score >= 10 ? "secondary" : score >= 7 ? "outline" : "destructive"}
                          className="text-xs"
                        >
                          {score >= 10 ? "良好" : score >= 7 ? "一般" : score >= 4 ? "较差" : "极低"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 text-primary">
                          查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CreditHistoryPage() {
  const { user, currentRole } = useAuth()
  const searchParams = useSearchParams()
  const tutorId = searchParams.get("tutorId")
  const tab = searchParams.get("tab")

  if (!user || !currentRole) return null

  if (currentRole === Role.TUTOR) {
    return <TutorCreditHistory tutorId={user.id} />
  }

  if (currentRole === Role.MANAGER) {
    if (tab === "my") {
      return <TutorCreditHistory tutorId={user.id} />
    }
    return <ManagerCreditHistory />
  }

  if (tutorId) {
    return <TutorCreditHistory tutorId={tutorId} />
  }

  return null
}
