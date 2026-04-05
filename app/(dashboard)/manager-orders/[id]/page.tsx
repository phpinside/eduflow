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
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { mockUsers } from "@/lib/mock-data/users"
import { OrderStatus, OrderType, Role } from "@/types"

const STATUS_MAP: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "待接单",
  [OrderStatus.ASSIGNED]: "已分配",
  [OrderStatus.IN_PROGRESS]: "进行中",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.CANCEL_REQUESTED]: "取消申请中",
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

  const [order, setOrder] = React.useState(() =>
    mockOrders.find((o) => o.id === id)
  )

  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] =
    React.useState(false)
  const [announcementText, setAnnouncementText] = React.useState("")

  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
  const [editForm, setEditForm] = React.useState<EditForm>(EMPTY_EDIT_FORM)

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = React.useState(false)

  const [isAddApplicantOpen, setIsAddApplicantOpen] = React.useState(false)
  const [teacherSearchQuery, setTeacherSearchQuery] = React.useState("")
  const [selectedTeacherForAdd, setSelectedTeacherForAdd] = React.useState<string | null>(null)

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
    const mockOrderIndex = mockOrders.findIndex((o) => o.id === id)
    if (mockOrderIndex !== -1) {
      mockOrders[mockOrderIndex] = {
        ...mockOrders[mockOrderIndex],
        status: OrderStatus.ASSIGNED,
        assignedTeacherId: teacherId,
      }
    }
    setOrder((prev) => {
      if (!prev) return prev
      return { ...prev, status: OrderStatus.ASSIGNED, assignedTeacherId: teacherId }
    })
    toast.success("已成功匹配老师！")
  }

  const handleSetPending = () => {
    if (!order) return
    const mockOrderIndex = mockOrders.findIndex((o) => o.id === order.id)
    if (mockOrderIndex !== -1) {
      mockOrders[mockOrderIndex] = {
        ...mockOrders[mockOrderIndex],
        status: OrderStatus.PENDING,
        assignedTeacherId: undefined,
        transferredOutFrom: order.assignedTeacherId,
      }
    }
    setOrder((prev) => {
      if (!prev) return prev
      const currentTeacherId = prev.assignedTeacherId
      return {
        ...prev,
        status: OrderStatus.PENDING,
        assignedTeacherId: undefined,
        transferredOutFrom: currentTeacherId,
      }
    })
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

    // Update mock orders
    const mockOrderIndex = mockOrders.findIndex((o) => o.id === order.id)
    if (mockOrderIndex !== -1) {
      mockOrders[mockOrderIndex] = updatedOrder
    }

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
    const mockOrderIndex = mockOrders.findIndex((o) => o.id === id)
    const newApplicantIds = [...(order?.applicantIds ?? []), teacherId]
    if (mockOrderIndex !== -1) {
      mockOrders[mockOrderIndex] = {
        ...mockOrders[mockOrderIndex],
        applicantIds: newApplicantIds,
      }
    }
    setOrder((prev) => {
      if (!prev) return prev
      return { ...prev, applicantIds: newApplicantIds }
    })
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
    const idx = mockOrders.findIndex((o) => o.id === oid)
    if (idx !== -1) {
      mockOrders.splice(idx, 1)
    }
    setIsDeleteConfirmOpen(false)
    toast.success("订单已删除")
    router.push("/manager-orders")
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
            <Badge variant="outline">{STATUS_MAP[order.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">订单号：{order.id}</p>
        </div>

        <div className="flex gap-3 shrink-0">
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
    </div>
  )
}
