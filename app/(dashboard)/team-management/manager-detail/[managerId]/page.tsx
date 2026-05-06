"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  Phone,
  Trophy,
  Users as UsersIcon,
  UserCheck,
  UserCog,
  ArrowRightLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getStoredUsers, getStoredOrders, saveMockData, STORAGE_KEYS } from "@/lib/storage"
import { Role, OrderType, OrderStatus } from "@/types"
import type { User } from "@/types"
import { cn } from "@/lib/utils"

// ─── constants ───────────────────────────────────────────────────────────────

type ManagerRank = '见习学管' | '正式学管' | '总监'

const RANK_BADGE: Record<ManagerRank, string> = {
  '见习学管': 'bg-sky-100 text-sky-800 border-sky-200',
  '正式学管': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  '总监': 'bg-purple-100 text-purple-800 border-purple-200',
}

const LEVEL_OPTIONS: { value: string; label: string; className: string }[] = [
  { value: 'A', label: 'A 非常可靠', className: 'bg-green-100 text-green-800 border-green-200' },
  { value: 'B', label: 'B 可靠', className: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'C', label: 'C 一般', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  { value: 'D', label: 'D 出现过严重投诉', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'E', label: 'E 不采用', className: 'bg-red-100 text-red-800 border-red-200' },
]

// ─── component ────────────────────────────────────────────────────────────────

export default function ManagerDetailPage() {
  const router = useRouter()
  const params = useParams()
  const managerId = params?.managerId as string

  const [manager, setManager] = useState<User | null>(null)
  const [superior, setSuperior] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const [metrics, setMetrics] = useState({
    trialSuccessRate: "—",
    trialCount: 0,
    trialSuccessCount: 0,
    regularStudentCount: 0,
    regularTutorCount: 0,
    totalTutorCount: 0,
  })

  const [levelDist, setLevelDist] = useState<Record<string, number>>({
    A: 0, B: 0, C: 0, D: 0, E: 0,
  })

  // Transfer dialog
  const [transferOpen, setTransferOpen] = useState(false)
  const [targetManagerId, setTargetManagerId] = useState("")
  const [otherManagers, setOtherManagers] = useState<User[]>([])
  const [transferring, setTransferring] = useState(false)

  useEffect(() => {
    if (!managerId) return

    const users = getStoredUsers()
    const orders = getStoredOrders()

    const found = users.find(u => u.id === managerId && u.roles.includes(Role.MANAGER))
    if (!found) {
      setLoading(false)
      return
    }
    setManager(found)

    if (found.superiorId) {
      const sup = users.find(u => u.id === found.superiorId) ?? null
      setSuperior(sup)
    }

    // Other managers for transfer
    const others = users.filter(u => u.roles.includes(Role.MANAGER) && u.id !== managerId)
    setOtherManagers(others)

    // Team tutors
    const teamTutors = users.filter(u => u.roles.includes(Role.TUTOR) && u.managerId === managerId)
    const totalTutorCount = teamTutors.length

    // Level distribution
    const dist: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 }
    teamTutors.forEach(t => {
      if (t.tutorLevel && dist[t.tutorLevel] !== undefined) {
        dist[t.tutorLevel]++
      }
    })
    setLevelDist(dist)

    // Trial success rate
    const trialOrders = orders.filter(
      o => o.managerId === managerId && o.type === OrderType.TRIAL
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

    // Regular orders stats
    const activeRegularOrders = orders.filter(
      o =>
        o.managerId === managerId &&
        o.type === OrderType.REGULAR &&
        [OrderStatus.IN_PROGRESS, OrderStatus.ASSIGNED].includes(o.status)
    )
    const regularStudentCount = new Set(activeRegularOrders.map(o => o.studentId)).size
    const regularTutorCount = new Set(
      activeRegularOrders.filter(o => o.assignedTeacherId).map(o => o.assignedTeacherId!)
    ).size

    setMetrics({
      trialSuccessRate,
      trialCount,
      trialSuccessCount,
      regularStudentCount,
      regularTutorCount,
      totalTutorCount,
    })

    setLoading(false)
  }, [managerId])

  const handleTransfer = () => {
    if (!targetManagerId || !manager) return
    setTransferring(true)

    const users = getStoredUsers()
    const targetManager = users.find(u => u.id === targetManagerId)
    if (!targetManager) {
      toast.error("目标学管不存在")
      setTransferring(false)
      return
    }

    const updatedUsers = users.map(u => {
      if (u.roles.includes(Role.TUTOR) && u.managerId === managerId) {
        return { ...u, managerId: targetManagerId, managerName: targetManager.name, updatedAt: new Date() }
      }
      return u
    })

    saveMockData(STORAGE_KEYS.USERS, updatedUsers)
    toast.success(`已将本团队所有教练转移至 ${targetManager.name}`)
    setTransferring(false)
    setTransferOpen(false)
    router.push("/team-management/manager-search")
  }

  if (loading) return <div className="p-8 text-center text-muted-foreground">加载中…</div>
  if (!manager) return <div className="p-8 text-center text-muted-foreground">未找到该学管信息</div>

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6 gap-2"
        onClick={() => router.push("/team-management/manager-search")}
      >
        <ArrowLeft className="h-4 w-4" />
        返回列表
      </Button>

      <div className="flex flex-col gap-6">

        {/* ── Header Card: Manager + Superior ── */}
        <div className="bg-white dark:bg-gray-950 rounded-lg border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x">
            {/* Manager */}
            <div className="flex items-center gap-4 pb-6 md:pb-0 md:pr-6">
              <Avatar className="h-20 w-20 border-2 border-primary/10 shrink-0">
                <AvatarImage src={manager.avatar} alt={manager.name} />
                <AvatarFallback className="text-xl">{manager.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{manager.name}</h1>
                  {manager.managerRank && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-semibold", RANK_BADGE[manager.managerRank])}
                    >
                      {manager.managerRank}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{manager.phone}</span>
                </div>
                {manager.managerRankEffectiveDate && (
                  <p className="text-xs text-muted-foreground">
                    职级生效：{new Date(manager.managerRankEffectiveDate).toLocaleDateString("zh-CN")}
                  </p>
                )}
              </div>
            </div>

            {/* Superior */}
            <div className="flex items-center gap-4 pt-6 md:pt-0 md:pl-6">
              {superior ? (
                <>
                  <Avatar className="h-14 w-14 border-2 border-muted shrink-0">
                    <AvatarImage src={superior.avatar} alt={superior.name} />
                    <AvatarFallback>{superior.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-semibold">{superior.name}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{superior.phone}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">上级</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Avatar className="h-14 w-14 border-2 border-dashed border-muted shrink-0">
                    <AvatarFallback className="text-muted-foreground/40">?</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{manager.superiorName ?? "无上级"}</p>
                    <p className="text-xs text-muted-foreground">上级</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Team Stats Cards ── */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">团队统计</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">试课成功率</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.trialSuccessRate}</div>
                {metrics.trialCount > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {metrics.trialSuccessCount} 次成功 / 共 {metrics.trialCount} 次
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">正课学员数</CardTitle>
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.regularStudentCount}</div>
                <p className="text-xs text-muted-foreground">当前在读</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">正课教练数</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.regularTutorCount}</div>
                <p className="text-xs text-muted-foreground">正在授课</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">教练总数</CardTitle>
                <UserCog className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalTutorCount}</div>
                <p className="text-xs text-muted-foreground">含所有等级</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Tutor Level Distribution ── */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold">教练等级分布</h2>
          <Card>
            <CardContent className="pt-5">
              <div className="grid gap-3 sm:grid-cols-5">
                {LEVEL_OPTIONS.map(({ value, label, className }) => (
                  <div key={value} className="flex items-center gap-3 rounded-lg border p-3">
                    <Badge variant="outline" className={cn("text-xs font-semibold shrink-0", className)}>
                      {value}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{label.slice(2)}</p>
                      <p className="text-lg font-bold">{levelDist[value]} <span className="text-xs font-normal text-muted-foreground">人</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-3 pt-2">
          <Button
            variant="destructive"
            className="gap-2"
            onClick={() => setTransferOpen(true)}
            disabled={metrics.totalTutorCount === 0}
          >
            <ArrowRightLeft className="h-4 w-4" />
            团队转移
          </Button>
          {metrics.totalTutorCount === 0 && (
            <span className="text-xs text-muted-foreground">该团队暂无教练，无法执行转移</span>
          )}
        </div>
      </div>

      {/* ── Transfer Dialog ── */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>团队转移</DialogTitle>
            <DialogDescription>
              确认后，本团队所有教练（共 {metrics.totalTutorCount} 人）将绑定到所选目标学管下。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <label className="text-sm font-medium">选择目标学管</label>
            <Select value={targetManagerId} onValueChange={setTargetManagerId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="请选择目标学管" />
              </SelectTrigger>
              <SelectContent>
                {otherManagers.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}{m.managerRank ? ` (${m.managerRank})` : ""} — {m.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTransferOpen(false)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={handleTransfer}
              disabled={!targetManagerId || transferring}
            >
              {transferring ? "转移中…" : "确认转移"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
