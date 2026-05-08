"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
    ArrowLeft,
    User as UserIcon,
    Phone,
    BookOpen,
    GraduationCap,
    Building2,
    CalendarDays,
    FileText,
    UserCog,
    BadgeCheck,
    MessageSquare,
    ClipboardCheck,
    Pencil,
    Plus,
    Trash2,
    Calendar as CalendarIcon,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { getStoredOrders, getStoredUsers, saveStoredOrders } from "@/lib/storage"
import { mockStudents } from "@/lib/mock-data/students"
import { OrderType, type Order, type User } from "@/types"

// ── 局部组件 ────────────────────────────────────────────────

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

// ── EditForm 类型 ─────────────────────────────────────────────

type WeeklyScheduleRow = { day: string; startTime: string; endTime: string }
type TimeSlot = { date: Date | null; startTime: string; endTime: string }

const EMPTY_TIME_SLOT: TimeSlot = { date: null, startTime: "", endTime: "" }

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
}

// ── 主页面 ────────────────────────────────────────────────────

export default function StudentCourseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { orderId } = params

    const [order, setOrder] = React.useState<Order | undefined>(undefined)
    const [users, setUsers] = React.useState<User[]>([])
    const [ready, setReady] = React.useState(false)

    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [editForm, setEditForm] = React.useState<EditForm | null>(null)

    React.useEffect(() => {
        if (!orderId) return
        const orders = getStoredOrders()
        setOrder(orders.find((o) => o.id === orderId))
        setUsers(getStoredUsers())
        setReady(true)
    }, [orderId])

    const student = React.useMemo(
        () => (order ? mockStudents.find((s) => s.id === order.studentId) : null),
        [order]
    )

    const tutor = React.useMemo(
        () => (order?.assignedTeacherId ? users.find((u) => u.id === order.assignedTeacherId) : null),
        [order, users]
    )

    const manager = React.useMemo(
        () => (order?.managerId ? users.find((u) => u.id === order.managerId) : null),
        [order, users]
    )

    const salesPerson = React.useMemo(
        () => (order?.salesPersonId ? users.find((u) => u.id === order.salesPersonId) : null),
        [order, users]
    )

    const handleOpenEditDialog = () => {
        if (!order) return
        setEditForm({
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
        })
        setIsEditDialogOpen(true)
    }

    const handleSaveEdit = () => {
        if (!order || !editForm) return

        const updatedOrder: Order = {
            ...order,
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
            updatedAt: new Date(),
        }

        const allOrders = getStoredOrders()
        const idx = allOrders.findIndex((o) => o.id === order.id)
        if (idx !== -1) {
            allOrders[idx] = updatedOrder
            saveStoredOrders(allOrders)
        }

        if (student) {
            const si = mockStudents.findIndex((s) => s.id === student.id)
            if (si !== -1) {
                mockStudents[si] = {
                    ...mockStudents[si],
                    name: editForm.studentName,
                    gender: editForm.studentGender,
                    address: editForm.studentAddress,
                    school: editForm.studentSchool,
                }
            }
        }

        setOrder(updatedOrder)
        setIsEditDialogOpen(false)
        toast.success("信息已更新")
    }

    if (!ready) {
        return (
            <div className="flex items-center justify-center h-[40vh] text-muted-foreground text-sm">
                加载中…
            </div>
        )
    }

    if (!order) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-xl font-bold">未找到课程信息</h2>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    返回
                </Button>
            </div>
        )
    }

    const isTrial = order.type === OrderType.TRIAL

    const displayStudentName = student?.name ?? "未知学员"
    const planCreateHref = `/my-students/study-plan/create?studentId=${order.studentId}&studentName=${encodeURIComponent(displayStudentName)}`
    const feedbackCreateHref = `/my-students/feedback/create?studentId=${order.studentId}&studentName=${encodeURIComponent(displayStudentName)}`
    const assessmentCreateHref = `/students-center/assessment/create?orderId=${order.id}&studentName=${encodeURIComponent(displayStudentName)}&studentAccount=${encodeURIComponent(order.studentAccount ?? "")}&subject=${encodeURIComponent(order.subject)}&grade=${encodeURIComponent(order.grade)}`

    const examScore =
        order.lastExamScore && order.examMaxScore
            ? `${order.lastExamScore}/${order.examMaxScore}`
            : order.lastExamScore

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl font-bold tracking-tight">
                                {displayStudentName}
                            </h1>
                            <Badge
                                variant="outline"
                                className={
                                    isTrial
                                        ? "border-sky-400 text-sky-600 bg-sky-50"
                                        : "border-emerald-400 text-emerald-700 bg-emerald-50"
                                }
                            >
                                {isTrial ? "试课" : "正式课"}
                            </Badge>
                            <span className="text-muted-foreground text-sm">
                                {order.subject} · {order.grade}
                            </span>
                        </div>
                        {order.studentAccount && (
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">
                                G账号：{order.studentAccount}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-nowrap items-center justify-end gap-2 w-full sm:w-auto sm:shrink-0 sm:pt-0.5">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 border-muted-foreground/25 text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        asChild
                    >
                        <Link href={planCreateHref}>
                            <FileText className="h-3.5 w-3.5 mr-1" />
                            规划书
                        </Link>
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 shadow-md ring-2 ring-primary/25 font-semibold"
                        asChild
                    >
                        <Link href={feedbackCreateHref}>
                            <MessageSquare className="h-3.5 w-3.5 mr-1" />
                            课后反馈
                        </Link>
                    </Button>
                    <Button
                        size="sm"
                        className="h-8 bg-indigo-400 text-white shadow-sm hover:bg-indigo-500/90 dark:bg-indigo-400 dark:hover:bg-indigo-500/90"
                        asChild
                    >
                        <Link href={assessmentCreateHref}>
                            <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                            阶段性测评
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Body */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* 左列：课程信息 */}
                <div className="md:col-span-2 space-y-6">
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
                                <SectionTitle icon={<UserIcon className="h-4 w-4" />} title="基本信息" />
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <Field label="科目" value={order.subject} />
                                    <Field label="年级" value={order.grade} />
                                    <Field label="学员姓名" value={student?.name} />
                                    <Field label="性别" value={student?.gender} />
                                    <Field label="地区" value={student?.address} className="col-span-2" />
                                    <Field label="学校名称" value={student?.school} className="col-span-2" />
                                </div>
                            </div>

                            <Separator />

                            {/* 学习情况 */}
                            <div>
                                <SectionTitle icon={<GraduationCap className="h-4 w-4" />} title="学习情况" />
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <Field label="最近一次考试成绩" value={examScore} />
                                    <Field label="教材版本" value={order.textbookVersion} />
                                    <Field label="校内学习进度" value={order.schoolProgress} className="col-span-2" />
                                    <Field label="其它科平均成绩" value={order.otherSubjectsAvgScore} />
                                    <Field label="补过什么类型的课" value={order.previousTutoringTypes} />
                                </div>
                            </div>

                     

                            <Separator />

                            {/* 校区信息 */}
                            <div>
                                <SectionTitle icon={<Building2 className="h-4 w-4" />} title="校区信息" />
                                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                                    <Field label="校区名称" value={order.campusName} />
                                    <Field label="校区账号" value={order.campusAccount} />
                                    <Field label="学员G账号" value={order.studentAccount} className="col-span-2" />
                                </div>
                            </div>

                            <Separator />

                            {/* 试课时间 / 课程安排 */}
                            {isTrial ? (
                                <div>
                                    <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="试课时间" />
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
                                    <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="课程安排" />
                                    <div className="space-y-4">
                                        <Field
                                            label="总课时"
                                            value={order.totalHours ? `${order.totalHours} 课时` : undefined}
                                        />
                                        <div className="space-y-0.5">
                                            <div className="text-xs text-muted-foreground">上课时间</div>
                                            {order.weeklySchedule && order.weeklySchedule.length > 0 ? (
                                                <div className="space-y-1 pt-0.5">
                                                    {order.weeklySchedule.map((s, i) => (
                                                        <div key={i} className="text-sm font-medium">
                                                            {DAY_MAP[s.day] || s.day}｜{s.startTime}-{s.endTime}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-sm font-medium min-h-[1.25rem]">
                                                    <span className="text-muted-foreground/50">—</span>
                                                </div>
                                            )}
                                        </div>
                                        <Field label="首次课时间" value={order.firstLessonTime} />
                                    </div>
                                </div>
                            )}

                            <Separator />

                            {/* 备注 */}
                            <div>
                                <SectionTitle icon={<FileText className="h-4 w-4" />} title="备注" />
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
                </div>

                {/* 右列：教职信息 + 课时概况 */}
                <div className="space-y-6">
                    {/* 课时概况 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BadgeCheck className="h-5 w-5" />
                                课时概况
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-lg bg-muted/40 p-3 text-center">
                                    <div className="text-2xl font-bold text-primary">{order.totalHours}</div>
                                    <div className="text-xs text-muted-foreground mt-0.5">总计课时</div>
                                </div>
                                <div className="rounded-lg bg-muted/40 p-3 text-center">
                                    <div className={`text-2xl font-bold ${order.remainingHours <= 5 ? "text-destructive" : "text-emerald-600"}`}>
                                        {order.remainingHours}
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-0.5">剩余课时</div>
                                </div>
                            </div>
                            {order.remainingHours <= 5 && (
                                <p className="text-xs text-destructive text-center">剩余课时不足，请提醒续课</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* 伴学教练 */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <UserCog className="h-5 w-5" />
                                伴学教练
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <StaffRow label="伴学教练" user={tutor} />
                            <Separator />
                            <StaffRow label="学管" user={manager} />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* ── 编辑对话框 ── */}
            {editForm && (
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

                                {/* 基本信息（科目/年级只读） */}
                                <div>
                                    <div className="flex items-center gap-1.5 text-sm font-semibold mb-3">
                                        <UserIcon className="h-4 w-4 text-muted-foreground" />
                                        基本信息
                                    </div>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">科目（不可编辑）</Label>
                                            <Input value={order.subject} disabled className="bg-muted/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">年级（不可编辑）</Label>
                                            <Input value={order.grade} disabled className="bg-muted/50" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">学员姓名</Label>
                                            <Input
                                                value={editForm.studentName}
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, studentName: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">性别</Label>
                                            <Select
                                                value={editForm.studentGender}
                                                onValueChange={(v) => setEditForm((f) => f && ({ ...f, studentGender: v }))}
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
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, studentAddress: e.target.value }))}
                                                placeholder="如：上海市浦东新区"
                                            />
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <Label className="text-xs">学校名称</Label>
                                            <Input
                                                value={editForm.studentSchool}
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, studentSchool: e.target.value }))}
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
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, lastExamScore: e.target.value }))}
                                                placeholder="如：85"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">满分</Label>
                                            <Input
                                                value={editForm.examMaxScore}
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, examMaxScore: e.target.value }))}
                                                placeholder="如：150"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">教材版本</Label>
                                            <Input
                                                value={editForm.textbookVersion}
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, textbookVersion: e.target.value }))}
                                                placeholder="如：人教版"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">其它科平均成绩</Label>
                                            <Input
                                                value={editForm.otherSubjectsAvgScore}
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, otherSubjectsAvgScore: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <Label className="text-xs">校内学习进度</Label>
                                            <Input
                                                value={editForm.schoolProgress}
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, schoolProgress: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <Label className="text-xs">补过什么类型的课</Label>
                                            <Input
                                                value={editForm.previousTutoringTypes}
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, previousTutoringTypes: e.target.value }))}
                                            />
                                        </div>
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
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, campusName: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">校区账号</Label>
                                            <Input
                                                value={editForm.campusAccount}
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, campusAccount: e.target.value }))}
                                            />
                                        </div>
                                        <div className="space-y-1 col-span-2">
                                            <Label className="text-xs">学员G账号</Label>
                                            <Input
                                                value={editForm.studentAccount}
                                                onChange={(e) => setEditForm((f) => f && ({ ...f, studentAccount: e.target.value }))}
                                            />
                                        </div>
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
                                                                                if (!f) return f
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
                                                                        if (!f) return f
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
                                                            setEditForm((f) => f && ({
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
                                                                    if (!f) return f
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
                                                                    if (!f) return f
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
                                                                    if (!f) return f
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
                                                                setEditForm((f) => f && ({
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
                                                                    setEditForm((f) => f && ({
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
                                                            setEditForm((f) => f && ({
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
                                                            setEditForm((f) => f && ({
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
                                        onChange={(e) => setEditForm((f) => f && ({ ...f, remarks: e.target.value }))}
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
            )}
        </div>
    )
}

function StaffRow({ label, user }: { label: string; user: User | null | undefined }) {
    return (
        <div className="space-y-1.5">
            <div className="text-xs text-muted-foreground">{label}</div>
            {user ? (
                <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-xs">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.name}</span>
                </div>
            ) : (
                <div className="text-sm font-medium text-muted-foreground/50">—</div>
            )}
        </div>
    )
}
