"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { toast } from "sonner"
import {
  ArrowLeft,
  Phone,
  Calendar as CalendarIcon,
  Clock,
  Users as UsersIcon,
  Trophy,
  ShieldAlert,
  BookOpen,
  GraduationCap,
  Star,
  PencilLine,
  PlusCircle,
  History,
  Upload,
  X,
  ImageIcon,
  Check,
  UserMinus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  DialogClose,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Pagination } from "@/components/ui/pagination"
import {
  getStoredUsers,
  getStoredOrders,
  getStoredLessons,
  saveMockData,
  STORAGE_KEYS,
  getStoredTutorCreditLogs,
  saveStoredTutorCreditLogs,
  getStoredTutorCreditRules,
} from "@/lib/storage"
import { useAuth } from "@/contexts/AuthContext"
import {
  User,
  Role,
  OrderType,
  OrderStatus,
  TutorCreditLog,
  TutorCreditChangeType,
  TutorCreditRuleCategory,
} from "@/types"
import { cn } from "@/lib/utils"

// ── Constants ─────────────────────────────────────────────────────────────────

const SUBJECT_OPTIONS = ["数学", "物理", "化学"]

const GRADE_OPTIONS = [
  "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
  "七年级", "八年级", "九年级", "高一", "高二", "高三",
]

const LEVEL_OPTIONS: { value: User["tutorLevel"]; label: string }[] = [
  { value: "A", label: "A 级 — 非常可靠" },
  { value: "B", label: "B 级 — 可靠" },
  { value: "C", label: "C 级 — 一般" },
  { value: "D", label: "D 级 — 出现过严重投诉" },
  { value: "E", label: "E 级 — 不采用" },
]

// ── Metadata maps ─────────────────────────────────────────────────────────────

const CHANGE_TYPE_META: Record<
  TutorCreditChangeType,
  { label: string; className: string }
> = {
  [TutorCreditChangeType.INITIAL_REGISTRATION]: {
    label: "初始注册",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  [TutorCreditChangeType.RESET]: {
    label: "重置为12分",
    className: "bg-blue-100 text-blue-700 border-blue-200",
  },
  [TutorCreditChangeType.MINOR_VIOLATION]: {
    label: "轻微违规",
    className: "bg-yellow-100 text-yellow-700 border-yellow-200",
  },
  [TutorCreditChangeType.GENERAL_VIOLATION]: {
    label: "一般违规",
    className: "bg-orange-100 text-orange-700 border-orange-200",
  },
  [TutorCreditChangeType.SEVERE_VIOLATION]: {
    label: "严重违规",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  [TutorCreditChangeType.REDLINE_VIOLATION]: {
    label: "红线行为",
    className: "bg-rose-900/10 text-rose-800 border-rose-300",
  },
}

const CATEGORY_META: Record<
  TutorCreditRuleCategory,
  { label: string; changeType: TutorCreditChangeType }
> = {
  [TutorCreditRuleCategory.MINOR]: {
    label: "轻微违规",
    changeType: TutorCreditChangeType.MINOR_VIOLATION,
  },
  [TutorCreditRuleCategory.GENERAL]: {
    label: "一般违规",
    changeType: TutorCreditChangeType.GENERAL_VIOLATION,
  },
  [TutorCreditRuleCategory.SEVERE]: {
    label: "严重违规",
    changeType: TutorCreditChangeType.SEVERE_VIOLATION,
  },
  [TutorCreditRuleCategory.REDLINE]: {
    label: "红线行为",
    changeType: TutorCreditChangeType.REDLINE_VIOLATION,
  },
}

const LEVEL_COLOR: Record<string, string> = {
  A: "bg-amber-100 text-amber-700 border-amber-200",
  B: "bg-sky-100 text-sky-700 border-sky-200",
  C: "bg-violet-100 text-violet-700 border-violet-200",
  D: "bg-slate-100 text-slate-600 border-slate-200",
  E: "bg-gray-100 text-gray-500 border-gray-200",
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function creditScoreColor(score: number) {
  if (score >= 10) return "text-emerald-600"
  if (score >= 7) return "text-amber-600"
  if (score >= 4) return "text-orange-600"
  return "text-red-600"
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta > 0)
    return <span className="font-mono font-semibold text-emerald-600">+{delta}</span>
  if (delta < 0)
    return <span className="font-mono font-semibold text-red-600">{delta}</span>
  return <span className="font-mono text-muted-foreground">0</span>
}

function uniqueValues(values?: string[]) {
  return Array.from(new Set((values ?? []).filter(Boolean)))
}

function toggleItem(arr: string[], item: string) {
  return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item]
}

// ── Page ──────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 10

export default function TutorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tutorId = params?.tutorId as string
  const { user: authUser, currentRole } = useAuth()

  const [tutor, setTutor] = useState<User | null>(null)
  const [manager, setManager] = useState<User | null>(null)
  const [metrics, setMetrics] = useState({
    trialSuccessRate: "0%",
    trialCount: 0,
    successCount: 0,
    regularStudentCount: 0,
    totalHours: 0,
  })
  const [loading, setLoading] = useState(true)

  // Edit tutor info dialog
  const canEdit = currentRole === Role.MANAGER || currentRole === Role.ADMIN
  const [editOpen, setEditOpen] = useState(false)
  const [editLevel, setEditLevel] = useState<User["tutorLevel"] | "">("")
  const [editSubjects, setEditSubjects] = useState<string[]>([])
  const [editGrades, setEditGrades] = useState<string[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false)

  // Credit log state
  const [logs, setLogs] = useState<TutorCreditLog[]>([])
  const [logsPage, setLogsPage] = useState(1)

  // Log detail dialog
  const [selectedLog, setSelectedLog] = useState<TutorCreditLog | null>(null)

  // Deduction dialog
  const [deductOpen, setDeductOpen] = useState(false)
  const [deductCategory, setDeductCategory] = useState<TutorCreditRuleCategory | "">("")
  const [deductRuleId, setDeductRuleId] = useState("")
  const [deductNote, setDeductNote] = useState("")
  const [deductImages, setDeductImages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)

  const allRules = useMemo(() => getStoredTutorCreditRules(), [])

  const filteredRules = useMemo(() => {
    if (!deductCategory) return []
    return allRules.filter((r) => r.category === deductCategory && r.isEnabled)
  }, [allRules, deductCategory])

  const selectedRule = useMemo(
    () => allRules.find((r) => r.id === deductRuleId) ?? null,
    [allRules, deductRuleId]
  )

  // Load tutor + manager + metrics
  useEffect(() => {
    if (!tutorId) return
    const users = getStoredUsers()
    const found = users.find((u) => u.id === tutorId)
    if (!found || !found.roles.includes(Role.TUTOR)) {
      setLoading(false)
      return
    }
    setTutor(found)

    if (found.managerId) {
      const mgr = users.find((u) => u.id === found.managerId) ?? null
      setManager(mgr)
    }

    const orders = getStoredOrders()
    const lessons = getStoredLessons()

    const trialOrders = orders.filter(
      (o) => o.assignedTeacherId === tutorId && o.type === OrderType.TRIAL
    )
    const trialCount = trialOrders.length
    let successCount = 0
    trialOrders.forEach((to) => {
      if (orders.some((o) => o.studentId === to.studentId && o.type === OrderType.REGULAR))
        successCount++
    })

    const regularOrders = orders.filter(
      (o) =>
        o.assignedTeacherId === tutorId &&
        o.type === OrderType.REGULAR &&
        [OrderStatus.IN_PROGRESS, OrderStatus.ASSIGNED].includes(o.status)
    )
    const regularStudentCount = new Set(regularOrders.map((o) => o.studentId)).size

    const tutorLessons = lessons.filter((l) => l.teacherId === tutorId)
    const totalHours =
      Math.round((tutorLessons.reduce((acc, l) => acc + l.duration, 0) / 60) * 10) / 10

    setMetrics({
      trialSuccessRate:
        trialCount > 0 ? `${Math.round((successCount / trialCount) * 100)}%` : "0%",
      trialCount,
      successCount,
      regularStudentCount,
      totalHours,
    })

    const allLogs = getStoredTutorCreditLogs()
    const tutorLogs = allLogs
      .filter((l) => l.tutorId === tutorId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime())
    setLogs(tutorLogs)

    setLoading(false)
  }, [tutorId])

  // Pagination
  const totalLogPages = Math.ceil(logs.length / PAGE_SIZE)
  const pagedLogs = useMemo(() => {
    const start = (logsPage - 1) * PAGE_SIZE
    return logs.slice(start, start + PAGE_SIZE)
  }, [logs, logsPage])

  // ── Edit tutor info handlers ──

  const openEdit = () => {
    if (!tutor) return
    setEditLevel(tutor.tutorLevel ?? "")
    setEditSubjects(uniqueValues(tutor.tutorSubjects))
    setEditGrades(uniqueValues(tutor.tutorGrades))
    setEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!tutor) return
    setSavingEdit(true)

    const newLevel = (editLevel || undefined) as User["tutorLevel"] | undefined
    const newSubjects = editSubjects.length > 0 ? uniqueValues(editSubjects) : undefined
    const newGrades = editGrades.length > 0 ? uniqueValues(editGrades) : undefined

    const users = getStoredUsers()
    const updatedUsers = users.map((u) =>
      u.id === tutor.id
        ? { ...u, tutorLevel: newLevel, tutorSubjects: newSubjects, tutorGrades: newGrades, updatedAt: new Date() }
        : u
    )
    saveMockData(STORAGE_KEYS.USERS, updatedUsers)

    setTutor((prev) =>
      prev
        ? { ...prev, tutorLevel: newLevel, tutorSubjects: newSubjects, tutorGrades: newGrades, updatedAt: new Date() }
        : prev
    )

    toast.success("教练信息已更新")
    setSavingEdit(false)
    setEditOpen(false)
  }

  const handleRemoveFromTeam = () => {
    setConfirmRemoveOpen(true)
  }

  const confirmRemove = () => {
    if (!tutor) return

    const users = getStoredUsers()
    const updatedUsers = users.map((u) =>
      u.id === tutor.id
        ? { ...u, managerId: undefined, managerName: undefined, updatedAt: new Date() }
        : u
    )
    saveMockData(STORAGE_KEYS.USERS, updatedUsers)

    setTutor((prev) =>
      prev ? { ...prev, managerId: undefined, managerName: undefined, updatedAt: new Date() } : prev
    )
    setManager(null)

    toast.success(`已将 ${tutor.name} 移出本团队`)
    setConfirmRemoveOpen(false)
    setEditOpen(false)
  }

  // ── Deduction handlers ──

  const MAX_EVIDENCE_IMAGES = 9

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const remainingSlots = MAX_EVIDENCE_IMAGES - deductImages.length
    if (remainingSlots <= 0) {
      toast.error(`最多上传 ${MAX_EVIDENCE_IMAGES} 张证据截图`)
      e.target.value = ""
      return
    }
    const filesToProcess = Array.from(files).slice(0, remainingSlots)
    if (files.length > remainingSlots)
      toast.warning(`仅添加前 ${remainingSlots} 张图片（最多 ${MAX_EVIDENCE_IMAGES} 张）`)

    const readers = filesToProcess.map(
      (file) =>
        new Promise<string>((resolve, reject) => {
          if (!file.type.startsWith("image/")) {
            reject(new Error(`${file.name} 不是图片文件`))
            return
          }
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        })
    )

    try {
      const results = await Promise.all(readers)
      setDeductImages((prev) => [...prev, ...results])
    } catch (err) {
      toast.error((err as Error).message || "图片读取失败")
    } finally {
      e.target.value = ""
    }
  }

  const removeImage = (index: number) => {
    setDeductImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDeductSubmit = () => {
    if (!selectedRule || !tutor || !authUser) return
    setSubmitting(true)

    const currentScore = tutor.creditScore ?? 12
    const newScore = Math.max(0, currentScore + selectedRule.scoreDelta)
    const changeType = CATEGORY_META[selectedRule.category].changeType

    const newLog: TutorCreditLog = {
      id: `tcl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      tutorId: tutor.id,
      changeType,
      ruleId: selectedRule.id,
      ruleName: selectedRule.title,
      scoreDelta: selectedRule.scoreDelta,
      scoreAfter: newScore,
      changedAt: new Date(),
      submittedById: authUser.id,
      submittedByName: authUser.name,
      note: deductNote.trim() || undefined,
      evidenceImages: deductImages.length > 0 ? [...deductImages] : undefined,
    }

    const allLogs = getStoredTutorCreditLogs()
    saveStoredTutorCreditLogs([newLog, ...allLogs])

    const users = getStoredUsers()
    const updatedUsers = users.map((u) =>
      u.id === tutor.id ? { ...u, creditScore: newScore, updatedAt: new Date() } : u
    )
    saveMockData(STORAGE_KEYS.USERS, updatedUsers)

    setTutor((prev) => (prev ? { ...prev, creditScore: newScore } : prev))
    setLogs((prev) => [newLog, ...prev])
    setLogsPage(1)

    toast.success(`已扣分：${selectedRule.scoreDelta} 分，当前信用分 ${newScore}`)
    resetDeductDialog()
    setDeductOpen(false)
    setSubmitting(false)
  }

  const resetDeductDialog = () => {
    setDeductCategory("")
    setDeductRuleId("")
    setDeductNote("")
    setDeductImages([])
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  // ── Early returns ──

  if (loading) return <div className="p-8 text-center text-muted-foreground">加载中…</div>
  if (!tutor) return <div className="p-8 text-center text-muted-foreground">未找到该教练信息</div>

  const currentScore = tutor.creditScore ?? 12

  const hasTeamAssignment = !!(tutor.managerId || tutor.managerName)
  const canRemoveFromTeamUi =
    canEdit &&
    hasTeamAssignment &&
    (currentRole === Role.ADMIN ||
      (currentRole === Role.MANAGER && !!authUser && tutor.managerId === authUser.id))

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto py-8">
      <Button
        variant="ghost"
        className="mb-6 gap-2"
        onClick={() => router.push("/team-management/tutor-search")}
      >
        <ArrowLeft className="h-4 w-4" />
        返回列表
      </Button>

      <div className="flex flex-col gap-6">

        {/* ── Header Card: 教练 + 学管 ──────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-950 rounded-lg border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x">
            {/* Tutor */}
            <div className="flex items-center gap-4 pb-6 md:pb-0 md:pr-6">
              <Avatar className="h-20 w-20 border-2 border-primary/10 shrink-0">
                <AvatarImage src={tutor.avatar} alt={tutor.name} />
                <AvatarFallback className="text-xl">{tutor.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{tutor.name}</h1>
                  {tutor.tutorLevel && (
                    <Badge
                      variant="outline"
                      className={cn("text-xs font-semibold", LEVEL_COLOR[tutor.tutorLevel])}
                    >
                      {tutor.tutorLevel} 级
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{tutor.phone}</span>
                </div>
                <p className="text-xs text-muted-foreground">伴学教练</p>
              </div>
            </div>

            {/* Manager */}
            <div className="flex items-center gap-4 pt-6 md:pt-0 md:pl-6">
              {manager ? (
                <>
                  <Avatar className="h-14 w-14 border-2 border-muted shrink-0">
                    <AvatarImage src={manager.avatar} alt={manager.name} />
                    <AvatarFallback>{manager.name.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1.5">
                    <h2 className="text-lg font-semibold">{manager.name}</h2>
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{manager.phone}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">归属学管</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Avatar className="h-14 w-14 border-2 border-dashed border-muted shrink-0">
                    <AvatarFallback className="text-muted-foreground/40">?</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{tutor.managerName ?? "未分配学管"}</p>
                    <p className="text-xs text-muted-foreground">归属学管</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── 教练信息 ────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">教练信息</h2>
            {canEdit && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={openEdit}>
                <PencilLine className="h-3.5 w-3.5" />
                编辑信息
              </Button>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* 教练等级 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">教练等级</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {tutor.tutorLevel ? (
                  <div
                    className={cn(
                      "text-2xl font-bold",
                      LEVEL_COLOR[tutor.tutorLevel]
                        .split(" ")
                        .filter((c) => c.startsWith("text-"))
                        .join(" ")
                    )}
                  >
                    {tutor.tutorLevel} 级
                  </div>
                ) : (
                  <div className="text-2xl font-bold text-muted-foreground">—</div>
                )}
              </CardContent>
            </Card>

            {/* 当前信用分 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">当前信用分</CardTitle>
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", creditScoreColor(currentScore))}>
                  {currentScore}
                  <span className="text-sm font-normal text-muted-foreground ml-1">/ 12</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentScore >= 10
                    ? "信用良好"
                    : currentScore >= 7
                    ? "注意维护"
                    : currentScore >= 4
                    ? "信用偏低"
                    : "信用危险"}
                </p>
              </CardContent>
            </Card>

            {/* 试课成功率 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">试课成功率</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.trialSuccessRate}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.successCount} 次成功 / 共 {metrics.trialCount} 次
                </p>
              </CardContent>
            </Card>

            {/* 正课学员数 */}
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

            {/* 累计课时数 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">累计课时数</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalHours}</div>
                <p className="text-xs text-muted-foreground">总授课小时</p>
              </CardContent>
            </Card>

            {/* 注册时间 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">注册时间</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {format(new Date(tutor.createdAt), "yyyy/MM/dd", { locale: zhCN })}
                </div>
                <p className="text-xs text-muted-foreground">加入日期</p>
              </CardContent>
            </Card>

            {/* 可授科目 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">可授科目</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {tutor.tutorSubjects && tutor.tutorSubjects.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tutor.tutorSubjects.map((s) => (
                      <Badge key={s} variant="secondary" className="text-xs">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">未设置</div>
                )}
              </CardContent>
            </Card>

            {/* 可授年级 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">可授年级</CardTitle>
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {tutor.tutorGrades && tutor.tutorGrades.length > 0 ? (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tutor.tutorGrades.map((g) => (
                      <Badge key={g} variant="outline" className="text-xs">
                        {g}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">未设置</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── 信用分变动记录 ───────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">信用分变动记录</h2>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <History className="h-3.5 w-3.5" />
                共 {logs.length} 条
              </span>
            </div>
            {currentRole === Role.MANAGER && (
              <Button
                size="sm"
                onClick={() => {
                  resetDeductDialog()
                  setDeductOpen(true)
                }}
                className="gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                新建扣分
              </Button>
            )}
          </div>

          <div className="rounded-md border bg-white dark:bg-gray-950">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[130px]">变动类型</TableHead>
                  <TableHead>规则名称</TableHead>
                  <TableHead className="w-[90px] text-center">变动分值</TableHead>
                  <TableHead className="w-[110px] text-center">变动后信用分</TableHead>
                  <TableHead className="w-[155px]">变动时间</TableHead>
                  <TableHead className="w-[90px]">提交人</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedLogs.length > 0 ? (
                  pagedLogs.map((log) => {
                    const meta = CHANGE_TYPE_META[log.changeType]
                    return (
                      <TableRow
                        key={log.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn("text-xs font-medium", meta.className)}
                          >
                            {meta.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{log.ruleName ?? "—"}</div>
                          {log.note && (
                            <div className="text-xs text-muted-foreground mt-0.5 max-w-[300px] line-clamp-1">
                              {log.note}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <DeltaBadge delta={log.scoreDelta} />
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={cn("font-semibold", creditScoreColor(log.scoreAfter))}>
                            {log.scoreAfter}
                          </span>
                          <span className="text-xs text-muted-foreground ml-0.5">分</span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(log.changedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                        </TableCell>
                        <TableCell className="text-sm">{log.submittedByName}</TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                      暂无变动记录
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {totalLogPages > 1 && (
            <Pagination
              currentPage={logsPage}
              totalPages={totalLogPages}
              onPageChange={setLogsPage}
            />
          )}
        </div>
      </div>

      {/* ── 编辑教练信息 Dialog ──────────────────────────────────────────────── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PencilLine className="h-4 w-4" />
              编辑教练信息
            </DialogTitle>
            <DialogDescription>
              修改 <strong>{tutor.name}</strong> 的教练等级、可授科目与可授年级；如需可将该教练移出当前归属团队。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* 教练等级 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">教练等级</label>
              <Select
                value={editLevel ?? ""}
                onValueChange={(v) => setEditLevel(v as User["tutorLevel"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择教练等级" />
                </SelectTrigger>
                <SelectContent>
                  {LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value!}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {editLevel && (
                <button
                  type="button"
                  onClick={() => setEditLevel("")}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  清除等级
                </button>
              )}
            </div>

            {/* 可授科目 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">可授科目</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECT_OPTIONS.map((subject) => {
                  const selected = editSubjects.includes(subject)
                  return (
                    <button
                      key={subject}
                      type="button"
                      onClick={() => setEditSubjects((prev) => toggleItem(prev, subject))}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input bg-background hover:bg-muted text-foreground"
                      )}
                    >
                      {selected && <Check className="h-3 w-3" />}
                      {subject}
                    </button>
                  )
                })}
              </div>
              {editSubjects.length === 0 && (
                <p className="text-xs text-muted-foreground">未选择科目</p>
              )}
            </div>

            {/* 可授年级 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">可授年级</label>
              <div className="flex flex-wrap gap-1.5">
                {GRADE_OPTIONS.map((grade) => {
                  const selected = editGrades.includes(grade)
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setEditGrades((prev) => toggleItem(prev, grade))}
                      className={cn(
                        "inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs font-medium transition-colors",
                        selected
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input bg-background hover:bg-muted text-foreground"
                      )}
                    >
                      {grade}
                    </button>
                  )
                })}
              </div>
              {editGrades.length === 0 && (
                <p className="text-xs text-muted-foreground">未选择年级</p>
              )}
            </div>

          </div>

          <DialogFooter className="flex-row items-center">
            {canRemoveFromTeamUi && (
              <Button
                type="button"
                variant="destructive"
                className="mr-auto gap-1.5"
                onClick={handleRemoveFromTeam}
              >
                <UserMinus className="h-3.5 w-3.5" />
                移除本团队
              </Button>
            )}
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button onClick={handleSaveEdit} disabled={savingEdit}>
              {savingEdit ? "保存中…" : "保存修改"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 变动记录详情 Dialog ──────────────────────────────────────────────── */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => { if (!open) setSelectedLog(null) }}>
        <DialogContent className="sm:max-w-[480px]">
          {selectedLog && (() => {
            const meta = CHANGE_TYPE_META[selectedLog.changeType]
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-destructive" />
                    信用分变动详情
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* 变动类型 + 规则 */}
                  <div className="rounded-lg border bg-muted/30 px-4 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">变动类型</span>
                      <Badge variant="outline" className={cn("text-xs font-medium", meta.className)}>
                        {meta.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">违规规则</span>
                      <span className="text-sm font-medium text-right max-w-[240px]">
                        {selectedLog.ruleName ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t pt-3">
                      <span className="text-sm text-muted-foreground">变动分值</span>
                      <DeltaBadge delta={selectedLog.scoreDelta} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">变动后信用分</span>
                      <span className={cn("font-bold text-base", creditScoreColor(selectedLog.scoreAfter))}>
                        {selectedLog.scoreAfter} 分
                      </span>
                    </div>
                  </div>

                  {/* 时间 + 提交人 */}
                  <div className="rounded-lg border px-4 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">变动时间</span>
                      <span className="text-sm font-medium">
                        {format(new Date(selectedLog.changedAt), "yyyy-MM-dd HH:mm:ss", { locale: zhCN })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">提交人</span>
                      <span className="text-sm font-medium">{selectedLog.submittedByName}</span>
                    </div>
                  </div>

                  {/* 事实与说明 */}
                  {selectedLog.note && (
                    <div className="space-y-1.5">
                      <span className="text-sm font-medium">事实与说明</span>
                      <p className="text-sm text-muted-foreground bg-muted/40 rounded-lg px-3 py-2.5 leading-relaxed">
                        {selectedLog.note}
                      </p>
                    </div>
                  )}

                  {/* 证据截图 */}
                  {selectedLog.evidenceImages && selectedLog.evidenceImages.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        <ImageIcon className="h-3.5 w-3.5" />
                        证据截图（{selectedLog.evidenceImages.length} 张）
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {selectedLog.evidenceImages.map((src, i) => (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            key={i}
                            src={src}
                            alt={`证据 ${i + 1}`}
                            className="aspect-square rounded-md border object-cover bg-muted cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => window.open(src, "_blank")}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">关闭</Button>
                  </DialogClose>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* ── 新建扣分 Dialog ──────────────────────────────────────────────────── */}
      <Dialog
        open={deductOpen}
        onOpenChange={(open) => {
          setDeductOpen(open)
          if (!open) resetDeductDialog()
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-destructive" />
              新建扣分记录
            </DialogTitle>
            <DialogDescription>
              为教练 <strong>{tutor?.name}</strong> 记录违规扣分，当前信用分为{" "}
              <strong className={creditScoreColor(currentScore)}>{currentScore}</strong> 分。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* 违规类别 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">违规类别</label>
              <Select
                value={deductCategory}
                onValueChange={(v) => {
                  setDeductCategory(v as TutorCreditRuleCategory)
                  setDeductRuleId("")
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择违规类别" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_META).map(([key, meta]) => (
                    <SelectItem key={key} value={key}>
                      {meta.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 具体规则 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">违规规则</label>
              <Select
                value={deductRuleId}
                onValueChange={setDeductRuleId}
                disabled={!deductCategory || filteredRules.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      !deductCategory
                        ? "请先选择违规类别"
                        : filteredRules.length === 0
                        ? "该类别暂无启用规则"
                        : "选择具体规则"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {filteredRules.map((rule) => (
                    <SelectItem key={rule.id} value={rule.id}>
                      <span className="flex items-center justify-between gap-4 w-full">
                        <span>{rule.title}</span>
                        <span className="text-red-600 font-mono text-xs shrink-0">
                          {rule.scoreDelta}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 预览 */}
            {selectedRule && (
              <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">扣减分值</span>
                  <span className="font-semibold text-red-600">{selectedRule.scoreDelta} 分</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">当前信用分</span>
                  <span className={cn("font-semibold", creditScoreColor(currentScore))}>
                    {currentScore} 分
                  </span>
                </div>
                <div className="flex justify-between border-t pt-1 mt-1">
                  <span className="text-muted-foreground">变动后信用分</span>
                  <span
                    className={cn(
                      "font-bold",
                      creditScoreColor(Math.max(0, currentScore + selectedRule.scoreDelta))
                    )}
                  >
                    {Math.max(0, currentScore + selectedRule.scoreDelta)} 分
                  </span>
                </div>
              </div>
            )}

            {/* 事实与说明 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                事实与说明
                <span className="text-muted-foreground font-normal ml-1">（选填）</span>
              </label>
              <Textarea
                placeholder="请描述具体违规事实与情况说明…"
                className="min-h-[80px] resize-none"
                value={deductNote}
                onChange={(e) => setDeductNote(e.target.value)}
              />
            </div>

            {/* 证据截图 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  证据截图
                  <span className="text-muted-foreground font-normal ml-1">
                    （选填，最多 {MAX_EVIDENCE_IMAGES} 张）
                  </span>
                </label>
                <span className="text-xs text-muted-foreground">
                  {deductImages.length} / {MAX_EVIDENCE_IMAGES}
                </span>
              </div>

              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleImageUpload}
              />

              <div className="grid grid-cols-4 gap-2">
                {deductImages.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-md border bg-muted/30 overflow-hidden group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`证据截图 ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                      aria-label="删除图片"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {deductImages.length < MAX_EVIDENCE_IMAGES && (
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="aspect-square rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-xs">上传图片</span>
                  </button>
                )}
              </div>

              {deductImages.length === 0 && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ImageIcon className="h-3 w-3" />
                  支持上传多张图片，便于查阅证据
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeductSubmit}
              disabled={!deductRuleId || submitting}
            >
              {submitting ? "提交中…" : "确认扣分"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── 确认移除团队 Dialog ──────────────────────────────────────────────── */}
      <Dialog open={confirmRemoveOpen} onOpenChange={setConfirmRemoveOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <UserMinus className="h-4 w-4" />
              确认移除本团队
            </DialogTitle>
            <DialogDescription>
              此操作将清空 <strong>{tutor?.name}</strong> 的归属学管信息，该教练不再计入您的团队。此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">取消</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmRemove}>
              确认移除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
