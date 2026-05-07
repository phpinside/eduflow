"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  User as UserIcon,
  Users,
  Phone,
  BookOpen,
  GraduationCap,
  Building2,
  CalendarDays,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Search,
  UserPlus,
  X,
  Check,
  Clock,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { mockStudents } from "@/lib/mock-data/students"
import { mockUsers } from "@/lib/mock-data/users"
import { getStoredOrders, saveStoredOrders } from "@/lib/storage"
import type { Order } from "@/types"
import { OrderStatus, OrderType, Role } from "@/types"
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP, SCHEDULING_TIMEOUT_HOURS } from "@/lib/order-constants"
import { SchedulingCountdown, VoucherUpload } from "@/components/order/order-review-components"
import { Upload } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { logOrderOperation } from "@/lib/operation-log-helper"
import { OperationAction } from "@/types/operation-log"
import { computePricingBreakdown, resolveTrialRewardFromRules } from "@/lib/order-pricing"
import { getStoredPriceRules } from "@/lib/storage"

function loadOrderFromStorage(orderId: string): Order | undefined {
  return getStoredOrders().find((o) => o.id === orderId)
}

function persistOrder(next: Order) {
  const all = getStoredOrders()
  const i = all.findIndex((o) => o.id === next.id)
  if (i === -1) return
  all[i] = { ...next, updatedAt: new Date() }
  saveStoredOrders(all)
}

function deleteOrderFromStorage(orderId: string) {
  saveStoredOrders(getStoredOrders().filter((o) => o.id !== orderId))
}


const DAY_MAP: Record<string, string> = {
  monday: "周一",
  tuesday: "周二",
  wednesday: "周三",
  thursday: "周四",
  friday: "周五",
  saturday: "周六",
  sunday: "周日",
}

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 11) return phone
  return phone.slice(0, 3) + "****" + phone.slice(-4)
}

const extractCity = (address?: string) => {
  if (!address) return ""
  const match = address.match(/^(.{2,3}[市省])/)
  return match ? match[1].replace(/[市省]$/, "") : ""
}

const generateAnnouncementText = (order: any, student: any, salesPerson: any): string => {
  if (!order || !student) return ""

  const city = extractCity(student.address) || "—"
  const genderEmoji = student.gender === "女" ? "👧" : "👦"

  if (order.type === OrderType.TRIAL) {
    const slotEmojis = ["1️⃣", "2️⃣", "3️⃣"]
    const trialTimesLines =
      order.trialTimeSlots && order.trialTimeSlots.length > 0
        ? order.trialTimeSlots
            .map((t: string, i: number) => `${slotEmojis[i] ?? `${i + 1}.`} ${t.replace(/-\d{1,2}:\d{2}$/, "").trim()}`)
            .join("\n")
        : "待定"

    return `【试听课排课｜${order.subject}】🎯

${genderEmoji} 学生：${student.name}｜${student.gender}｜${order.grade}
📍 地区：${city}｜🏫 学校：${student.school || "待补充"}
📊 成绩：${order.lastExamScore || "—"}${order.examMaxScore ? `/${order.examMaxScore}` : ""}｜📖 ${order.textbookVersion || "待补充"}
📌 进度：${order.schoolProgress || "—"}
📈 其它科均分：${order.otherSubjectsAvgScore || "—"}
🧩 补课：${order.previousTutoringTypes || "—"}

📱 家长：${student.parentPhone || "—"}

校区名称：${order.campusName || "—"}
校区账号：${order.campusAccount || "—"}
学生账号：${order.studentAccount || "—"}

⏰ 试课时间：
${trialTimesLines}

📝 备注：${order.remarks || "—"}`
  } else {
    const scheduleLines =
      order.weeklySchedule && order.weeklySchedule.length > 0
        ? order.weeklySchedule
            .map((s: any) => `${DAY_MAP[s.day] || s.day}｜${s.startTime}-${s.endTime}`)
            .join("\n")
        : "待排课"

    return `【正课排课｜${order.subject}】🎯

${genderEmoji} 学生：${student.name}｜${student.gender}｜${order.grade}
📍 地区：${city}｜🏫 学校：${student.school || "待补充"}
📊 成绩：${order.lastExamScore || "—"}${order.examMaxScore ? `/${order.examMaxScore}` : ""}｜📖 ${order.textbookVersion || "待补充"}
📌 进度：${order.schoolProgress || "—"}
📈 其它科均分：${order.otherSubjectsAvgScore || "—"}
🧩 补课：${order.previousTutoringTypes || "—"}

📱 家长：${student.parentPhone || "—"}

校区名称：${order.campusName || "—"}
校区账号：${order.campusAccount || "—"}

📦 总课时：${order.totalHours ? `${order.totalHours}课时` : "—"}
📅 上课时间：
${scheduleLines}

📍 首次课时间：${order.firstLessonTime || "—"}

📝 备注：${order.remarks || "—"}`
  }
}

// ── 局部复用组件 ────────────────────────────────────────────

function Field({
  label,
  value,
  className,
}: {
  label: string
  value?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-0.5 ${className ?? ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium min-h-[1.25rem]">
        {value != null && value !== "" ? (
          value
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </div>
    </div>
  )
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-3">
      <span className="text-muted-foreground">{icon}</span>
      {title}
    </div>
  )
}

// ── EditForm 类型 ─────────────────────────────────────────────

type WeeklyScheduleRow = { day: string; startTime: string; endTime: string }
type TimeSlot = { date: Date | null; startTime: string; endTime: string }

const EMPTY_TIME_SLOT: TimeSlot = { date: null, startTime: "", endTime: "" }

// Parse "2026年4月2日 19:00-20:30" → TimeSlot
const parseTimeSlotStr = (str?: string): TimeSlot => {
  if (!str) return { ...EMPTY_TIME_SLOT }
  const m = str.match(/(\d{4})年(\d{1,2})月(\d{1,2})日\s*(\d{2}:\d{2})?(?:-(\d{2}:\d{2}))?/)
  if (!m) return { ...EMPTY_TIME_SLOT }
  return {
    date: new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])),
    startTime: m[4] ?? "",
    endTime: m[5] ?? "",
  }
}

// Format TimeSlot → "2026年4月2日 19:00-20:30"
const formatTimeSlot = (slot: TimeSlot): string => {
  if (!slot.date) return ""
  const y = slot.date.getFullYear()
  const mo = slot.date.getMonth() + 1
  const d = slot.date.getDate()
  const timePart = slot.endTime
    ? `${slot.startTime}-${slot.endTime}`
    : slot.startTime
  return `${y}年${mo}月${d}日 ${timePart}`.trim()
}

type EditForm = {
  subject: string
  grade: string
  lastExamScore: string
  examMaxScore: string
  textbookVersion: string
  schoolProgress: string
  otherSubjectsAvgScore: string
  previousTutoringTypes: string
  campusName: string
  campusAccount: string
  studentAccount: string
  totalHours: string
  weeklySchedule: WeeklyScheduleRow[]
  trialTimeSlots: [TimeSlot, TimeSlot, TimeSlot]
  firstLessonTime: TimeSlot
  remarks: string
  studentName: string
  studentGender: string
  studentAddress: string
  studentSchool: string
  parentPhone: string
}

const EMPTY_EDIT_FORM: EditForm = {
  subject: "", grade: "", lastExamScore: "", examMaxScore: "",
  textbookVersion: "", schoolProgress: "", otherSubjectsAvgScore: "",
  previousTutoringTypes: "", campusName: "", campusAccount: "",
  studentAccount: "", totalHours: "", weeklySchedule: [],
  trialTimeSlots: [{ ...EMPTY_TIME_SLOT }, { ...EMPTY_TIME_SLOT }, { ...EMPTY_TIME_SLOT }],
  firstLessonTime: { ...EMPTY_TIME_SLOT }, remarks: "",
  studentName: "", studentGender: "", studentAddress: "",
  studentSchool: "", parentPhone: "",
}

// ── 主页面 ────────────────────────────────────────────────────

export default function ManagerOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params
  const { user } = useAuth()

  const [order, setOrder] = React.useState<Order | undefined>(undefined)
  const [storageReady, setStorageReady] = React.useState(false)

  React.useEffect(() => {
    if (!id) return
    setOrder(loadOrderFromStorage(id as string))
    setStorageReady(true)
  }, [id])

  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] =
    React.useState(false)
  const [announcementText, setAnnouncementText] = React.useState("")

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editForm, setEditForm] = React.useState<EditForm>(EMPTY_EDIT_FORM)

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false)

  const [isAddApplicantOpen, setIsAddApplicantOpen] = React.useState(false)
  const [teacherSearchQuery, setTeacherSearchQuery] = React.useState("")
  const [selectedTeacherForAdd, setSelectedTeacherForAdd] = React.useState<string | null>(null)

  // === 新增：审核相关状态 ===
  const [isCsReviewOpen, setIsCsReviewOpen] = React.useState(false)
  const [isFinanceReviewOpen, setIsFinanceReviewOpen] = React.useState(false)
  const [reviewNote, setReviewNote] = React.useState("")
  const [vouchers, setVouchers] = React.useState<string[]>([])
  const [csCampusName, setCsCampusName] = React.useState("")
  const [csCampusAccount, setCsCampusAccount] = React.useState("")
  const [csStudentAccount, setCsStudentAccount] = React.useState("")
  
  // 财务审核课时调整相关状态
  const [adjustedHours, setAdjustedHours] = React.useState<number | string>("")
  const [financeVouchers, setFinanceVouchers] = React.useState<string[]>([])
  const [financeRemark, setFinanceRemark] = React.useState("")

  // 相关订单分页状态
  const [relatedOrdersPage, setRelatedOrdersPage] = React.useState(1)
  const RELATED_ORDERS_PER_PAGE = 5

  const student = React.useMemo(
    () => (order ? mockStudents.find((s) => s.id === order.studentId) : null),
    [order]
  )

  const salesPerson = React.useMemo(
    () => (order ? mockUsers.find((u) => u.id === order.salesPersonId) : null),
    [order]
  )

  const manager = React.useMemo(
    () => (order ? mockUsers.find((u) => u.id === order.managerId) : null),
    [order]
  )

  const applicants = React.useMemo(() => {
    if (!order?.applicantIds) return []
    return mockUsers.filter((u) => order.applicantIds?.includes(u.id))
  }, [order])

  const filteredTutors = React.useMemo(() => {
    const q = teacherSearchQuery.trim().toLowerCase()
    if (!q) return []
    return mockUsers.filter((u) => {
      if (!u.roles?.includes(Role.TUTOR)) return false
      if (order?.applicantIds?.includes(u.id)) return false
      return u.name.toLowerCase().includes(q) || (u.phone ?? "").includes(q)
    })
  }, [teacherSearchQuery, order])

  const assignedTeacher = React.useMemo(
    () =>
      order?.assignedTeacherId
        ? mockUsers.find((u) => u.id === order.assignedTeacherId)
        : null,
    [order]
  )

  if (!storageReady) {
    return (
      <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground text-sm">
        加载中…
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">未找到订单</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回列表
        </Button>
      </div>
    )
  }

  const isTrial = order.type === OrderType.TRIAL

  const examScore =
    order.lastExamScore && order.examMaxScore
      ? `${order.lastExamScore}/${order.examMaxScore}`
      : order.lastExamScore

  const handleAssign = (teacherId: string) => {
    if (!order) return
    const next = { ...order, status: OrderStatus.ASSIGNED, assignedTeacherId: teacherId }
    persistOrder(next)
    setOrder(next)
    toast.success("已成功匹配老师！")
  }

  const handleSetPending = () => {
    if (!order) return
    const next = {
      ...order,
      status: OrderStatus.PENDING,
      assignedTeacherId: undefined,
      transferredOutFrom: order.assignedTeacherId,
    }
    persistOrder(next)
    setOrder(next)
    toast.success("订单已重置为待接单，原老师处已标记转走")
  }

  const handleOpenAnnouncementDialog = () => {
    if (order && student) {
      const text = generateAnnouncementText(order, student, salesPerson)
      setAnnouncementText(text)
      setIsAnnouncementDialogOpen(true)
    }
  }

  const handleCopyAnnouncement = async () => {
    try {
      await navigator.clipboard.writeText(announcementText)
      toast.success("已复制到剪贴板")
    } catch {
      toast.error("复制失败，请手动复制")
    }
  }

  const handleOpenEditDialog = () => {
    if (!order) return
    setEditForm({
      subject: order.subject ?? "",
      grade: order.grade ?? "",
      lastExamScore: order.lastExamScore ?? "",
      examMaxScore: order.examMaxScore ?? "",
      textbookVersion: order.textbookVersion ?? "",
      schoolProgress: order.schoolProgress ?? "",
      otherSubjectsAvgScore: order.otherSubjectsAvgScore ?? "",
      previousTutoringTypes: order.previousTutoringTypes ?? "",
      campusName: order.campusName ?? "",
      campusAccount: order.campusAccount ?? "",
      studentAccount: order.studentAccount ?? "",
      totalHours: order.totalHours != null ? String(order.totalHours) : "",
      weeklySchedule: order.weeklySchedule
        ? order.weeklySchedule.map((s) => ({ ...s }))
        : [],
      trialTimeSlots: [
        parseTimeSlotStr(order.trialTimeSlots?.[0]),
        parseTimeSlotStr(order.trialTimeSlots?.[1]),
        parseTimeSlotStr(order.trialTimeSlots?.[2]),
      ],
      firstLessonTime: parseTimeSlotStr(order.firstLessonTime),
      remarks: order.remarks ?? "",
      studentName: student?.name ?? "",
      studentGender: student?.gender ?? "",
      studentAddress: student?.address ?? "",
      studentSchool: student?.school ?? "",
      parentPhone: student?.parentPhone ?? "",
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!order) return

    const updatedOrder = {
      ...order,
      subject: editForm.subject,
      grade: editForm.grade,
      lastExamScore: editForm.lastExamScore || undefined,
      examMaxScore: editForm.examMaxScore || undefined,
      textbookVersion: editForm.textbookVersion || undefined,
      schoolProgress: editForm.schoolProgress || undefined,
      otherSubjectsAvgScore: editForm.otherSubjectsAvgScore || undefined,
      previousTutoringTypes: editForm.previousTutoringTypes || undefined,
      campusName: editForm.campusName || undefined,
      campusAccount: editForm.campusAccount || undefined,
      studentAccount: editForm.studentAccount || undefined,
      totalHours: editForm.totalHours ? Number(editForm.totalHours) : order.totalHours,
      weeklySchedule: editForm.weeklySchedule,
      trialTimeSlots: editForm.trialTimeSlots.map(formatTimeSlot).filter(Boolean),
      firstLessonTime: formatTimeSlot(editForm.firstLessonTime) || undefined,
      remarks: editForm.remarks || undefined,
    }

    persistOrder(updatedOrder)

    // Update mock student
    if (student) {
      const mockStudentIndex = mockStudents.findIndex((s) => s.id === student.id)
      if (mockStudentIndex !== -1) {
        mockStudents[mockStudentIndex] = {
          ...mockStudents[mockStudentIndex],
          name: editForm.studentName,
          gender: editForm.studentGender,
          address: editForm.studentAddress,
          school: editForm.studentSchool,
          parentPhone: editForm.parentPhone,
        }
      }
    }

    setOrder(updatedOrder)
    setIsEditDialogOpen(false)
    toast.success("订单信息已更新")
  }

  const handleAddApplicant = (teacherId: string) => {
    if (!order) return
    const newApplicantIds = [...(order.applicantIds ?? []), teacherId]
    const next = { ...order, applicantIds: newApplicantIds }
    persistOrder(next)
    setOrder(next)
    const teacher = mockUsers.find((u) => u.id === teacherId)
    toast.success(`已将 ${teacher?.name ?? "老师"} 添加到申请名单`)
  }

  const handleOpenAddApplicant = () => {
    setTeacherSearchQuery("")
    setSelectedTeacherForAdd(null)
    setIsAddApplicantOpen(true)
  }

  const handleConfirmAddApplicant = () => {
    if (!selectedTeacherForAdd) return
    handleAddApplicant(selectedTeacherForAdd)
    setSelectedTeacherForAdd(null)
    setTeacherSearchQuery("")
    setIsAddApplicantOpen(false)
  }

  const handleConfirmDeleteOrder = () => {
    if (!order) return
    const oid = order.id
    deleteOrderFromStorage(oid)
    setIsDeleteConfirmOpen(false)
    toast.success("订单已删除")
    router.push("/manager-orders")
  }

  // === 新增：客服审核处理函数 ===
  const handleCsApprove = () => {
    if (!order) return
    if (!csCampusName.trim() || !csCampusAccount.trim() || !csStudentAccount.trim()) {
      toast.error("请先填写校区名称、校区账号、学生G账号（三项必填）")
      return
    }
    const updated = {
      ...order,
      status: OrderStatus.PENDING_FINANCE_REVIEW,
      csReviewNote: reviewNote || "客服审核通过",
      paymentVouchers: vouchers.length > 0 ? vouchers : order.paymentVouchers,
      campusName: csCampusName.trim(),
      campusAccount: csCampusAccount.trim(),
      studentAccount: csStudentAccount.trim(),
      updatedAt: new Date()
    }
    persistOrder(updated)
    setOrder(updated)
    setIsCsReviewOpen(false)
    setReviewNote("")
    setVouchers([])
    setCsCampusName("")
    setCsCampusAccount("")
    setCsStudentAccount("")
    toast.success('客服审核通过，已转入财务审核')
  }

  const handleCsReject = () => {
    if (!reviewNote.trim()) {
      toast.error('请填写驳回原因')
      return
    }
    if (!order) return
    const updated = {
      ...order,
      status: OrderStatus.PENDING_PAYMENT,
      financeReviewNote: reviewNote,
      updatedAt: new Date()
    }
    persistOrder(updated)
    setOrder(updated)
    setIsCsReviewOpen(false)
    setReviewNote("")
    setVouchers([])
    setCsCampusName("")
    setCsCampusAccount("")
    setCsStudentAccount("")
    toast.success('已驳回，返回待支付状态')
  }

  // === 新增：财务审核处理函数 ===
  const handleFinanceApprove = () => {
    if (!order) return
    
    // 验证课时数调整（如果填写了）
    let newTotalHours = order.totalHours
    if (adjustedHours !== "" && adjustedHours !== null) {
      const hours = Number(adjustedHours)
      if (isNaN(hours) || hours < 0 || hours > 999) {
        toast.error("课时数必须在0-999之间")
        return
      }
      newTotalHours = hours
    }
    
    const oldHours = order.totalHours
    const hasHoursChanged = newTotalHours !== oldHours
    
    const updated = {
      ...order,
      status: OrderStatus.SCHEDULING,
      totalHours: newTotalHours,
      financeReviewNote: reviewNote || "财务审核通过",
      schedulingStartTime: new Date(),
      updatedAt: new Date()
    }
    
    persistOrder(updated)
    setOrder(updated)
    
    // 记录操作日志
    if (user) {
      const logData: any = {
        action: OperationAction.FINANCE_REVIEW_APPROVE,
        operator: user,
        orderId: order.id,
        beforeState: { 
          status: order.status,
          totalHours: oldHours,
        },
        afterState: { 
          status: OrderStatus.SCHEDULING,
          totalHours: newTotalHours,
        },
        remark: financeRemark.trim() || reviewNote.trim() || "财务审核通过",
      }
      
      // 如果有课时调整，添加详细信息
      if (hasHoursChanged) {
        logData.beforeState.adjustedHours = oldHours
        logData.afterState.adjustedHours = newTotalHours
        logData.remark = `课时数从 ${oldHours} 调整为 ${newTotalHours}${financeRemark ? '；' + financeRemark : ''}`
      }
      
      // 保存上传的凭证到订单
      if (financeVouchers.length > 0) {
        const orders = getStoredOrders()
        const updatedOrders = orders.map(o => {
          if (o.id === order.id) {
            return {
              ...o,
              financeVouchers: [...(o.financeVouchers || []), ...financeVouchers],
            }
          }
          return o
        })
        saveStoredOrders(updatedOrders)
        logData.afterState.financeVouchers = financeVouchers.length
      }
      
      logOrderOperation(logData)
    }
    
    setIsFinanceReviewOpen(false)
    setReviewNote("")
    setAdjustedHours("")
    setFinanceVouchers([])
    setFinanceRemark("")
    toast.success(hasHoursChanged ? `财务审核通过，课时数已调整为${newTotalHours}` : '财务审核通过，已进入排单流程')
  }

  const handleFinanceReject = () => {
    if (!reviewNote.trim()) {
      toast.error('请填写驳回原因')
      return
    }
    if (!order) return
    const updated = {
      ...order,
      status: OrderStatus.PENDING_CS_REVIEW,
      financeReviewNote: reviewNote,
      updatedAt: new Date()
    }
    persistOrder(updated)
    setOrder(updated)
    
    // 记录操作日志
    if (user) {
      logOrderOperation({
        action: OperationAction.FINANCE_REVIEW_REJECT,
        operator: user,
        orderId: order.id,
        beforeState: { 
          status: order.status,
          totalHours: order.totalHours,
        },
        afterState: { 
          status: OrderStatus.PENDING_CS_REVIEW,
          totalHours: order.totalHours,
        },
        remark: reviewNote.trim(),
      })
    }
    
    setIsFinanceReviewOpen(false)
    setReviewNote("")
    toast.success('已驳回到客服审核')
  }

  return (
    <div className="space-y-6 container mx-auto pb-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">订单管理详情</h1>
            <Badge variant="outline">{ORDER_STATUS_MAP[order.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">订单号：{order.id}</p>
        </div>

        <div className="flex gap-3 shrink-0">
          {/* 客服审核按钮 */}
          {order.status === OrderStatus.PENDING_CS_REVIEW && (
            <Button
              size="lg"
              onClick={() => {
                setReviewNote(order.csReviewNote || "")
                setVouchers(order.paymentVouchers || [])
                setCsCampusName(order.campusName || "")
                setCsCampusAccount(order.campusAccount || "")
                setCsStudentAccount(order.studentAccount || "")
                setIsCsReviewOpen(true)
              }}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Check className="mr-2 h-5 w-5" />
              客服审核审核
            </Button>
          )}

          {/* 财务审核按钮 */}
          {order.status === OrderStatus.PENDING_FINANCE_REVIEW && (
            <Button
              size="lg"
              onClick={() => {
                setReviewNote(order.financeReviewNote || "")
                setIsFinanceReviewOpen(true)
              }}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Check className="mr-2 h-5 w-5" />
              财务专员审核
            </Button>
          )}

          {/* 排单倒计时 */}
          {order.status === OrderStatus.SCHEDULING && order.schedulingStartTime && (
            <div className="flex items-center">
              <SchedulingCountdown startTime={order.schedulingStartTime} />
            </div>
          )}

          <Button
            size="lg"
            onClick={handleOpenAnnouncementDialog}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="mr-2 h-5 w-5" />
            生成群公告
          </Button>

          {(order.status === OrderStatus.IN_PROGRESS ||
            order.status === OrderStatus.ASSIGNED) && (
            <Button
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              onClick={handleSetPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              重新进入接单中心
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ── 左列：订单全字段 + 申请名单 ── */}
        <div className="md:col-span-2 space-y-6">

          {/* 订单信息（全字段） */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {isTrial ? "试听课" : "正式课"}信息
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEditDialog}
                  className="gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  编辑
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* 基本信息 */}
              <div>
                <SectionTitle
                  icon={<UserIcon className="h-4 w-4" />}
                  title="基本信息"
                />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="科目" value={order.subject} />
                  <Field label="年级" value={order.grade} />
                  <Field label="学生姓名" value={student?.name} />
                  <Field label="性别" value={student?.gender} />
                  <Field
                    label="地区"
                    value={student?.address}
                    className="col-span-2"
                  />
                  <Field
                    label="学校名称"
                    value={student?.school}
                    className="col-span-2"
                  />
                </div>
              </div>

              <Separator />

              {/* 学习情况 */}
              <div>
                <SectionTitle
                  icon={<GraduationCap className="h-4 w-4" />}
                  title="学习情况"
                />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="最近一次考试成绩" value={examScore} />
                  <Field label="教材版本" value={order.textbookVersion} />
                  <Field
                    label="校内学习进度"
                    value={order.schoolProgress}
                    className="col-span-2"
                  />
                  <Field
                    label="其它科平均成绩"
                    value={order.otherSubjectsAvgScore}
                  />
                  <Field
                    label="补过什么类型的课"
                    value={order.previousTutoringTypes}
                  />
                </div>
              </div>

              <Separator />

              {/* 家长信息 */}
              <div>
                <SectionTitle
                  icon={<Phone className="h-4 w-4" />}
                  title="家长信息"
                />
                <Field label="家长手机号" value={student?.parentPhone} />
              </div>

              <Separator />

              {/* 校区信息 */}
              <div>
                <SectionTitle
                  icon={<Building2 className="h-4 w-4" />}
                  title="校区信息"
                />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="校区名称" value={order.campusName} />
                  <Field label="校区账号" value={order.campusAccount} />
                  {!isTrial && (
                    <Field label="学生账号" value={order.studentAccount} />
                  )}
                </div>
              </div>

              <Separator />

              {/* 试课时间 / 课程安排 */}
              {isTrial ? (
                <div>
                  <SectionTitle
                    icon={<CalendarDays className="h-4 w-4" />}
                    title="试课时间"
                  />
                  <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                      <Field
                        key={i}
                        label={`试课时间${i + 1}`}
                        value={order.trialTimeSlots?.[i]?.replace(/-\d{1,2}:\d{2}$/, "").trim()}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <SectionTitle
                    icon={<CalendarDays className="h-4 w-4" />}
                    title="课程安排"
                  />
                  <div className="space-y-4">
                    <Field
                      label="总课时"
                      value={
                        order.totalHours
                          ? `${order.totalHours} 课时`
                          : undefined
                      }
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs text-muted-foreground">
                        上课时间
                      </div>
                      {order.weeklySchedule &&
                      order.weeklySchedule.length > 0 ? (
                        <div className="space-y-1 pt-0.5">
                          {order.weeklySchedule.map((s, i) => (
                            <div key={i} className="text-sm font-medium">
                              {DAY_MAP[s.day] || s.day}｜{s.startTime}-
                              {s.endTime}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm font-medium min-h-[1.25rem]">
                          <span className="text-muted-foreground/50">—</span>
                        </div>
                      )}
                    </div>
                    <Field
                      label="首次课时间"
                      value={order.firstLessonTime}
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* 备注 */}
              <div>
                <SectionTitle
                  icon={<FileText className="h-4 w-4" />}
                  title="备注"
                />
                <div className="text-sm whitespace-pre-line leading-relaxed">
                  {order.remarks ? (
                    order.remarks
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* 申请接课老师名单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 shrink-0" /> 申请接课老师名单
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5 shrink-0"
                  onClick={handleOpenAddApplicant}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  手动添加老师
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicants.length > 0 ? (
                <div className="space-y-4">
                  {applicants.map((applicant) => {
                    const isAssigned =
                      order.assignedTeacherId === applicant.id
                    return (
                      <div
                        key={applicant.id}
                        className={`flex flex-col gap-3 p-3 rounded-lg border ${
                          isAssigned
                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                            : "bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={applicant.avatar} />
                              <AvatarFallback>
                                {applicant.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {applicant.name}
                                {isAssigned && (
                                  <Badge className="bg-green-600 hover:bg-green-700">
                                    已分配
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {applicant.phone}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {!isAssigned &&
                              order.status === OrderStatus.PENDING && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAssign(applicant.id)}
                                >
                                  选择匹配
                                </Button>
                              )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              试课成功率
                            </div>
                            <div className="text-sm font-medium">
                              50% (10/20)
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              正课学员数
                            </div>
                            <div className="text-sm font-medium">8</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              累计课时
                            </div>
                            <div className="text-sm font-medium">156</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  暂无老师申请
                </div>
              )}
            </CardContent>
          </Card>

          {/* 订单及支付信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-5 w-5" /> 订单及支付信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.transactions && order.transactions.length > 0 ? (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3">
                      支付记录
                    </h4>
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>说明</TableHead>
                            <TableHead>支付金额</TableHead>
                            <TableHead>增加课时</TableHead>
                            <TableHead className="text-right">时间</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {order.transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="font-medium">
                                {tx.type === "INITIAL"
                                  ? "首次下单"
                                  : tx.type === "RENEWAL"
                                    ? "续费"
                                    : tx.type === "REWARD"
                                      ? "转正红包"
                                      : tx.type === "REFUND"
                                        ? "退款"
                                        : tx.type}
                              </TableCell>
                              <TableCell>¥{tx.amount.toLocaleString()}</TableCell>
                              <TableCell>{tx.hours} 课时</TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {format(new Date(tx.createdAt), "yyyy-MM-dd HH:mm", {
                                  locale: zhCN,
                                })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">订单金额</span>
                      <div className="text-xl font-bold text-primary">
                        ¥{order.price.toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">说明</span>
                      <div className="font-medium">首次下单</div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">下单时间</span>
                      <div className="font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(order.createdAt), "yyyy-MM-dd HH:mm", {
                          locale: zhCN,
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {order.transactions && (
                  <div className="grid grid-cols-2 gap-6 text-sm pt-4 border-t">
                    <div className="space-y-1">
                      <span className="text-muted-foreground">累计总金额</span>
                      <div className="text-xl font-bold text-primary">
                        ¥
                        {order.transactions
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toLocaleString()}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground">累计总课时</span>
                      <div className="font-medium">
                        {order.transactions.reduce((sum, t) => sum + t.hours, 0)}{" "}
                        课时
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 相关订单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" /> 相关订单
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                // 获取当前学生的所有订单
                const allOrders = getStoredOrders()
                const studentOrders = allOrders
                  .filter(o => {
                    const orderStudent = mockStudents.find(s => s.id === o.studentId)
                    return orderStudent?.name === student?.name && o.id !== order.id
                  })
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

                if (studentOrders.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      该学生暂无其他订单
                    </div>
                  )
                }

                // 计算分页
                const totalPages = Math.ceil(studentOrders.length / RELATED_ORDERS_PER_PAGE)
                const startIndex = (relatedOrdersPage - 1) * RELATED_ORDERS_PER_PAGE
                const endIndex = startIndex + RELATED_ORDERS_PER_PAGE
                const pageOrders = studentOrders.slice(startIndex, endIndex)

                return (
                  <div className="space-y-4">
                    {/* 订单列表 */}
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>订单号</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>科目</TableHead>
                            <TableHead>年级</TableHead>
                            <TableHead>金额</TableHead>
                            <TableHead>状态</TableHead>
                            <TableHead>创建时间</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pageOrders.map((relatedOrder) => {
                            const relatedSalesPerson = mockUsers.find(u => u.id === relatedOrder.salesPersonId)
                            return (
                              <TableRow key={relatedOrder.id}>
                                <TableCell className="font-mono text-xs">
                                  {relatedOrder.id}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-xs">
                                    {relatedOrder.type === OrderType.TRIAL ? '试课' : '正课'}
                                  </Badge>
                                </TableCell>
                                <TableCell>{relatedOrder.subject}</TableCell>
                                <TableCell>{relatedOrder.grade}</TableCell>
                                <TableCell className="font-medium">
                                  ¥{relatedOrder.price.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Badge variant={ORDER_STATUS_COLOR_MAP[relatedOrder.status]} className="text-xs">
                                    {ORDER_STATUS_MAP[relatedOrder.status]}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {format(new Date(relatedOrder.createdAt), "yyyy-MM-dd", { locale: zhCN })}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => router.push(`/manager-orders/${relatedOrder.id}`)}
                                  >
                                    查看
                                  </Button>
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>

                    {/* 分页控件 */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-muted-foreground">
                          共 {studentOrders.length} 条记录，第 {relatedOrdersPage}/{totalPages} 页
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={relatedOrdersPage === 1}
                            onClick={() => setRelatedOrdersPage(p => p - 1)}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            上一页
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                size="sm"
                                variant={relatedOrdersPage === page ? "default" : "outline"}
                                className="h-8 w-8 p-0"
                                onClick={() => setRelatedOrdersPage(page)}
                              >
                                {page}
                              </Button>
                            ))}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={relatedOrdersPage === totalPages}
                            onClick={() => setRelatedOrdersPage(p => p + 1)}
                          >
                            下一页
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          <div className="pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setIsDeleteConfirmOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除订单
            </Button>
          </div>
        </div>

        {/* ── 右列：负责人员信息 ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">招生老师信息</CardTitle>
            </CardHeader>
            <CardContent>
              {salesPerson ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={salesPerson.avatar} />
                      <AvatarFallback>招</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {salesPerson.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        招生老师
                      </div>
                    </div>
                  </div>
                  {salesPerson.wechatQrCode ? (
                    <div className="flex flex-col items-center p-2 bg-muted/30 rounded border">
                      <img
                        src={salesPerson.wechatQrCode}
                        alt="Sales QR"
                        className="w-32 h-32 object-contain bg-white rounded"
                      />
                      <span className="text-xs text-muted-foreground mt-1">
                        招生老师微信
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center p-4 bg-muted/30 rounded">
                      暂无二维码
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  暂无招生老师信息
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 删除订单确认 */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>确认删除订单？</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            此操作将从列表中移除该订单且无法恢复。订单号：{order.id}
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              取消
            </Button>
            <Button type="button" variant="destructive" onClick={handleConfirmDeleteOrder}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 订单信息编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[90vw] max-w-4xl sm:max-w-4xl p-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-4 w-4" />
              编辑{isTrial ? "试听课" : "正式课"}信息
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="px-6 py-5 space-y-6">

              {/* 基本信息 */}
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold mb-3">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  基本信息
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">科目</Label>
                    <Input
                      value={editForm.subject}
                      onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
                      placeholder="如：数学"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">年级</Label>
                    <Input
                      value={editForm.grade}
                      onChange={(e) => setEditForm((f) => ({ ...f, grade: e.target.value }))}
                      placeholder="如：初三"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">学生姓名</Label>
                    <Input
                      value={editForm.studentName}
                      onChange={(e) => setEditForm((f) => ({ ...f, studentName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">性别</Label>
                    <Select
                      value={editForm.studentGender}
                      onValueChange={(v) => setEditForm((f) => ({ ...f, studentGender: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择性别" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="男">男</SelectItem>
                        <SelectItem value="女">女</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">地区</Label>
                    <Input
                      value={editForm.studentAddress}
                      onChange={(e) => setEditForm((f) => ({ ...f, studentAddress: e.target.value }))}
                      placeholder="如：上海市浦东新区"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">学校名称</Label>
                    <Input
                      value={editForm.studentSchool}
                      onChange={(e) => setEditForm((f) => ({ ...f, studentSchool: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 学习情况 */}
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold mb-3">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  学习情况
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">最近考试成绩</Label>
                    <Input
                      value={editForm.lastExamScore}
                      onChange={(e) => setEditForm((f) => ({ ...f, lastExamScore: e.target.value }))}
                      placeholder="如：85"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">满分</Label>
                    <Input
                      value={editForm.examMaxScore}
                      onChange={(e) => setEditForm((f) => ({ ...f, examMaxScore: e.target.value }))}
                      placeholder="如：150"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">教材版本</Label>
                    <Input
                      value={editForm.textbookVersion}
                      onChange={(e) => setEditForm((f) => ({ ...f, textbookVersion: e.target.value }))}
                      placeholder="如：人教版"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">其它科平均成绩</Label>
                    <Input
                      value={editForm.otherSubjectsAvgScore}
                      onChange={(e) => setEditForm((f) => ({ ...f, otherSubjectsAvgScore: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">校内学习进度</Label>
                    <Input
                      value={editForm.schoolProgress}
                      onChange={(e) => setEditForm((f) => ({ ...f, schoolProgress: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label className="text-xs">补过什么类型的课</Label>
                    <Input
                      value={editForm.previousTutoringTypes}
                      onChange={(e) => setEditForm((f) => ({ ...f, previousTutoringTypes: e.target.value }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* 家长信息 */}
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold mb-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  家长信息
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">家长手机号</Label>
                  <Input
                    value={editForm.parentPhone}
                    onChange={(e) => setEditForm((f) => ({ ...f, parentPhone: e.target.value }))}
                    placeholder="11位手机号"
                  />
                </div>
              </div>

              <Separator />

              {/* 校区信息 */}
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold mb-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  校区信息
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs">校区名称</Label>
                    <Input
                      value={editForm.campusName}
                      onChange={(e) => setEditForm((f) => ({ ...f, campusName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">校区账号</Label>
                    <Input
                      value={editForm.campusAccount}
                      onChange={(e) => setEditForm((f) => ({ ...f, campusAccount: e.target.value }))}
                    />
                  </div>
                  {!isTrial && (
                    <div className="space-y-1 col-span-2">
                      <Label className="text-xs">学生账号</Label>
                      <Input
                        value={editForm.studentAccount}
                        onChange={(e) => setEditForm((f) => ({ ...f, studentAccount: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* 试课时间 / 课程安排 */}
              {isTrial ? (
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold mb-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    试课时间
                  </div>
                  <div className="space-y-4">
                    {([0, 1, 2] as const).map((i) => {
                      const slot = editForm.trialTimeSlots[i]
                      return (
                        <div key={i} className="space-y-1.5">
                          <Label className="text-xs">试课时间{i + 1}</Label>
                          <div className="flex flex-wrap gap-2 items-center">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-36 justify-start text-left font-normal text-sm",
                                    !slot.date && "text-muted-foreground"
                                  )}
                                >
                                  <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                                  {slot.date
                                    ? format(slot.date, "yyyy年M月d日", { locale: zhCN })
                                    : "选择日期"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={slot.date ?? undefined}
                                  onSelect={(date) =>
                                    setEditForm((f) => {
                                      const slots: [TimeSlot, TimeSlot, TimeSlot] = [
                                        { ...f.trialTimeSlots[0] },
                                        { ...f.trialTimeSlots[1] },
                                        { ...f.trialTimeSlots[2] },
                                      ]
                                      slots[i] = { ...slots[i], date: date ?? null }
                                      return { ...f, trialTimeSlots: slots }
                                    })
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <input
                              type="time"
                              value={slot.startTime}
                              onChange={(e) =>
                                setEditForm((f) => {
                                  const slots: [TimeSlot, TimeSlot, TimeSlot] = [
                                    { ...f.trialTimeSlots[0] },
                                    { ...f.trialTimeSlots[1] },
                                    { ...f.trialTimeSlots[2] },
                                  ]
                                  slots[i] = { ...slots[i], startTime: e.target.value }
                                  return { ...f, trialTimeSlots: slots }
                                })
                              }
                              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold mb-3">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    课程安排
                  </div>
                  <div className="space-y-3">
                   
                

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">上课时间</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-xs"
                          onClick={() =>
                            setEditForm((f) => ({
                              ...f,
                              weeklySchedule: [
                                ...f.weeklySchedule,
                                { day: "monday", startTime: "", endTime: "" },
                              ],
                            }))
                          }
                        >
                          <Plus className="h-3 w-3" />
                          添加时段
                        </Button>
                      </div>
                      {editForm.weeklySchedule.length === 0 && (
                        <p className="text-xs text-muted-foreground">暂无上课时间，点击「添加时段」</p>
                      )}
                      {editForm.weeklySchedule.map((row, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Select
                            value={row.day}
                            onValueChange={(v) =>
                              setEditForm((f) => {
                                const ws = f.weeklySchedule.map((r, idx) =>
                                  idx === i ? { ...r, day: v } : r
                                )
                                return { ...f, weeklySchedule: ws }
                              })
                            }
                          >
                            <SelectTrigger className="w-24 shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(DAY_MAP).map(([val, label]) => (
                                <SelectItem key={val} value={val}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <input
                            type="time"
                            value={row.startTime}
                            onChange={(e) =>
                              setEditForm((f) => {
                                const ws = f.weeklySchedule.map((r, idx) =>
                                  idx === i ? { ...r, startTime: e.target.value } : r
                                )
                                return { ...f, weeklySchedule: ws }
                              })
                            }
                            className="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm"
                          />
                          <span className="text-muted-foreground text-sm">-</span>
                          <input
                            type="time"
                            value={row.endTime}
                            onChange={(e) =>
                              setEditForm((f) => {
                                const ws = f.weeklySchedule.map((r, idx) =>
                                  idx === i ? { ...r, endTime: e.target.value } : r
                                )
                                return { ...f, weeklySchedule: ws }
                              })
                            }
                            className="h-9 w-28 rounded-md border border-input bg-background px-3 text-sm"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                            onClick={() =>
                              setEditForm((f) => ({
                                ...f,
                                weeklySchedule: f.weeklySchedule.filter((_, idx) => idx !== i),
                              }))
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">首次课时间</Label>
                      <div className="flex flex-wrap gap-2 items-center">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-36 justify-start text-left font-normal text-sm",
                                !editForm.firstLessonTime.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-3.5 w-3.5 shrink-0" />
                              {editForm.firstLessonTime.date
                                ? format(editForm.firstLessonTime.date, "yyyy年M月d日", { locale: zhCN })
                                : "选择日期"}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={editForm.firstLessonTime.date ?? undefined}
                              onSelect={(date) =>
                                setEditForm((f) => ({
                                  ...f,
                                  firstLessonTime: { ...f.firstLessonTime, date: date ?? null },
                                }))
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <input
                          type="time"
                          value={editForm.firstLessonTime.startTime}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              firstLessonTime: { ...f.firstLessonTime, startTime: e.target.value },
                            }))
                          }
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                        <span className="text-muted-foreground text-sm">—</span>
                        <input
                          type="time"
                          value={editForm.firstLessonTime.endTime}
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              firstLessonTime: { ...f.firstLessonTime, endTime: e.target.value },
                            }))
                          }
                          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <Separator />

              {/* 备注 */}
              <div>
                <div className="flex items-center gap-1.5 text-sm font-semibold mb-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  备注
                </div>
                <Textarea
                  value={editForm.remarks}
                  onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))}
                  className="min-h-[80px] resize-none"
                  placeholder="填写备注信息..."
                />
              </div>

            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 手动添加申请老师 */}
      <Dialog
        open={isAddApplicantOpen}
        onOpenChange={(open) => {
          setIsAddApplicantOpen(open)
          if (!open) {
            setTeacherSearchQuery("")
            setSelectedTeacherForAdd(null)
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              添加老师到申请名单
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="teacher-search" className="text-xs">
                按姓名或手机号搜索伴学教练
              </Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="teacher-search"
                  value={teacherSearchQuery}
                  onChange={(e) => {
                    setTeacherSearchQuery(e.target.value)
                    setSelectedTeacherForAdd(null)
                  }}
                  placeholder="输入老师姓名或手机号"
                  className="pl-9 pr-9"
                />
                {teacherSearchQuery ? (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                    aria-label="清空"
                    onClick={() => {
                      setTeacherSearchQuery("")
                      setSelectedTeacherForAdd(null)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>
            <div className="max-h-[min(320px,50vh)] overflow-y-auto rounded-md border">
              {!teacherSearchQuery.trim() ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  请输入姓名或手机号搜索可添加的老师
                </p>
              ) : filteredTutors.length === 0 ? (
                <p className="p-4 text-center text-sm text-muted-foreground">
                  未找到匹配的老师，或已在申请名单中
                </p>
              ) : (
                <ul className="divide-y">
                  {filteredTutors.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedTeacherForAdd(t.id)}
                        className={cn(
                          "flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-muted/50",
                          selectedTeacherForAdd === t.id &&
                            "bg-muted/70 ring-2 ring-inset ring-primary/30"
                        )}
                      >
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarImage src={t.avatar} />
                          <AvatarFallback>{t.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{t.name}</div>
                          <div className="text-xs text-muted-foreground truncate">
                            {t.phone}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddApplicantOpen(false)}
            >
              取消
            </Button>
            <Button
              type="button"
              disabled={!selectedTeacherForAdd}
              onClick={handleConfirmAddApplicant}
            >
              确认添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 群公告对话框 */}
      <Dialog
        open={isAnnouncementDialogOpen}
        onOpenChange={setIsAnnouncementDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>生成群公告</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <Textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="min-h-[400px] font-mono text-sm resize-none"
              placeholder="群公告内容将在这里生成..."
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={handleCopyAnnouncement}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              复制到剪贴板
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === 新增：客服审核对话框 === */}
      <Dialog open={isCsReviewOpen} onOpenChange={setIsCsReviewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>客服专员审核</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <div className="font-medium">强提示</div>
              <div className="mt-1 text-xs leading-relaxed text-amber-800">
                请先在鼎伴学网站校验「校区账号」与「学生G账号」的正确性后再提交；若信息不匹配将被驳回。
              </div>
            </div>

            {/* 订单信息摘要 */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">订单信息</p>
              <p className="text-xs text-muted-foreground mt-1">
                订单号：{order?.id} | {order?.subject} | {order?.grade} | ¥{order?.price.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">
                学生：{student?.name} | 家长：{student?.parentPhone}
              </p>
            </div>

            {/* 费用明细 */}
            {(() => {
              const rules = getStoredPriceRules()
              const reward = resolveTrialRewardFromRules(rules, order?.subject, order?.grade)
              const includeReward = (order?.conversionRewardPaidMode ?? "OFFLINE") === "BUNDLED"
              const dingApplicable = order?.needsDingbanxueRecharge !== false
              const includeDing = dingApplicable && (order?.includeDingbanxueFeeInPayment ?? true)
              const b = computePricingBreakdown({
                subject: order?.subject,
                grade: order?.grade,
                totalHours: Number(order?.totalHours ?? 0),
                courseFee: Number(order?.price ?? 0),
                fromTrialConversion: reward > 0,
                conversionRewardFee: reward,
                includeConversionRewardInPayment: includeReward,
                dingbanxueFeeApplicable: dingApplicable,
                includeDingbanxueFeeInPayment: includeDing,
              })
              return (
                <div className="bg-muted/40 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">订单费用计算明细</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>课时费用</span>
                      <span className="font-medium text-foreground">¥{b.courseFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>转正红包费用（{includeReward ? "合并支付" : "线下支付"}）</span>
                      <span className="font-medium text-foreground">¥{includeReward ? b.conversionRewardFee : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>代收鼎伴学费用（{includeDing ? "合并支付" : "不合并"}）</span>
                      <span className="font-medium text-foreground">¥{includeDing ? b.dingbanxueFee : 0}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-foreground font-medium">本次应付总计</span>
                      <span className="font-semibold text-foreground">¥{b.totalPayable}</span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 必填：鼎伴学信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  校区名称<span className="text-destructive"> *</span>
                </Label>
                <Input
                  value={csCampusName}
                  onChange={(e) => setCsCampusName(e.target.value)}
                  placeholder="例如：上海浦东校区"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  校区账号<span className="text-destructive"> *</span>
                </Label>
                <Input
                  value={csCampusAccount}
                  onChange={(e) => setCsCampusAccount(e.target.value)}
                  placeholder="例如：pd002"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs">
                  学生G账号<span className="text-destructive"> *</span>
                </Label>
                <Input
                  value={csStudentAccount}
                  onChange={(e) => setCsStudentAccount(e.target.value)}
                  placeholder="例如：G2026xxxx"
                />
              </div>
            </div>

            {/* 支付凭证上传 */}
            <div>
              <h4 className="text-sm font-medium mb-2">支付凭证</h4>
              <VoucherUpload
                vouchers={vouchers}
                onUpload={(base64) => setVouchers(prev => [...prev, base64])}
                onRemove={(index) => setVouchers(prev => prev.filter((_, i) => i !== index))}
              />
            </div>

            {/* 审核批注 */}
            <div>
              <h4 className="text-sm font-medium mb-2">审核批注（选填）</h4>
              <Textarea
                placeholder="请输入审核意见，如：支付凭证已核实，金额无误..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsCsReviewOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleCsReject}>
              <X className="mr-2 h-4 w-4" />
              驳回
            </Button>
            <Button onClick={handleCsApprove}>
              <Check className="mr-2 h-4 w-4" />
              通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* === 新增：财务审核对话框 === */}
      <Dialog open={isFinanceReviewOpen} onOpenChange={(open) => {
        setIsFinanceReviewOpen(open)
        if (!open) {
          // 关闭时重置状态
          setAdjustedHours("")
          setFinanceVouchers([])
          setFinanceRemark("")
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>财务审核</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">请核实支付信息，并可调整课时数</p>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* 订单信息摘要 */}
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-2">订单信息</p>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>订单号：<span className="font-mono">{order?.id}</span></div>
                <div>{order?.subject} | {order?.grade}</div>
                <div>金额：¥{order?.price.toLocaleString()}</div>
                <div>当前课时：<span className="font-semibold text-primary">{order?.totalHours}</span></div>
              </div>
            </div>

            {/* 费用明细 */}
            {(() => {
              const rules = getStoredPriceRules()
              const reward = resolveTrialRewardFromRules(rules, order?.subject, order?.grade)
              const includeReward = (order?.conversionRewardPaidMode ?? "OFFLINE") === "BUNDLED"
              const dingApplicable = order?.needsDingbanxueRecharge !== false
              const includeDing = dingApplicable && (order?.includeDingbanxueFeeInPayment ?? true)
              const b = computePricingBreakdown({
                subject: order?.subject,
                grade: order?.grade,
                totalHours: Number(order?.totalHours ?? 0),
                courseFee: Number(order?.price ?? 0),
                fromTrialConversion: reward > 0,
                conversionRewardFee: reward,
                includeConversionRewardInPayment: includeReward,
                dingbanxueFeeApplicable: dingApplicable,
                includeDingbanxueFeeInPayment: includeDing,
              })
              return (
                <div className="bg-muted/40 p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">订单费用计算明细</p>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>课时费用</span>
                      <span className="font-medium text-foreground">¥{b.courseFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>转正红包费用（{includeReward ? "合并支付" : "线下支付"}）</span>
                      <span className="font-medium text-foreground">¥{includeReward ? b.conversionRewardFee : 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>代收鼎伴学费用（{includeDing ? "合并支付" : "不合并"}）</span>
                      <span className="font-medium text-foreground">¥{includeDing ? b.dingbanxueFee : 0}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="text-foreground font-medium">本次应付总计</span>
                      <span className="font-semibold text-foreground">¥{b.totalPayable}</span>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* 课时数调整 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Pencil className="h-4 w-4" />
                课时数调整（可选）
              </h4>
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <Label htmlFor="adjustedHours" className="text-xs text-blue-700 mb-1.5 block">
                    调整后课时数（0-999）
                  </Label>
                  <Input
                    id="adjustedHours"
                    type="number"
                    min={0}
                    max={999}
                    placeholder={`当前：${order?.totalHours || '未设置'}`}
                    value={adjustedHours}
                    onChange={(e) => setAdjustedHours(e.target.value)}
                    className="bg-white"
                  />
                  <p className="text-xs text-blue-600 mt-1.5">
                    💡 留空则保持原课时数 {order?.totalHours}
                  </p>
                </div>
                {adjustedHours !== "" && adjustedHours !== null && Number(adjustedHours) !== order?.totalHours && (
                  <div className="shrink-0 bg-amber-100 border border-amber-300 rounded px-3 py-2 text-xs">
                    <div className="text-amber-800 font-medium mb-1">调整预览</div>
                    <div className="text-amber-700">
                      <span className="line-through">{order?.totalHours}</span>
                      <span className="mx-1">→</span>
                      <span className="font-bold text-amber-900">{adjustedHours}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 支付凭证展示 */}
            {order?.paymentVouchers && order.paymentVouchers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">支付凭证</h4>
                <div className="flex flex-wrap gap-2">
                  {order.paymentVouchers.map((voucher, index) => (
                    <img
                      key={index}
                      src={voucher}
                      alt={`凭证${index + 1}`}
                      className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => window.open(voucher, '_blank')}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 客服审核意见 */}
            {order?.csReviewNote && (
              <div>
                <h4 className="text-sm font-medium mb-1">客服审核意见</h4>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {order.csReviewNote}
                </p>
              </div>
            )}

            {/* 上传财务审核凭证 */}
            <div>
              <h4 className="text-sm font-medium mb-2">上传审核凭证（可选）</h4>
              <VoucherUpload
                vouchers={financeVouchers}
                onUpload={(base64) => setFinanceVouchers(prev => [...prev, base64])}
                onRemove={(index) => setFinanceVouchers(prev => prev.filter((_, i) => i !== index))}
              />
            </div>

            {/* 财务审核意见 */}
            <div>
              <h4 className="text-sm font-medium mb-2">财务审核意见（必填）</h4>
              <Textarea
                placeholder={reviewNote ? "修改审核意见..." : "请输入审核意见，如：金额已核实，可以排课..."}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
              />
            </div>
            
            {/* 调整备注 */}
            <div>
              <h4 className="text-sm font-medium mb-2">调整备注（可选）</h4>
              <Textarea
                placeholder="如有课时调整或其他特殊情况，请在此说明..."
                value={financeRemark}
                onChange={(e) => setFinanceRemark(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsFinanceReviewOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleFinanceReject}>
              <X className="mr-2 h-4 w-4" />
              驳回
            </Button>
            <Button onClick={handleFinanceApprove} className="bg-indigo-600 hover:bg-indigo-700">
              <Check className="mr-2 h-4 w-4" />
              通过
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
