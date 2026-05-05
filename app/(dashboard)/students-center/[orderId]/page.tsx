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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getStoredOrders, getStoredUsers } from "@/lib/storage"
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

// ── 主页面 ────────────────────────────────────────────────────

export default function StudentCourseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { orderId } = params

    const [order, setOrder] = React.useState<Order | undefined>(undefined)
    const [users, setUsers] = React.useState<User[]>([])
    const [ready, setReady] = React.useState(false)

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
                            <CardTitle className="flex items-center gap-2 text-base">
                                <BookOpen className="h-5 w-5" />
                                {isTrial ? "试听课" : "正式课"}信息
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
                                    {!isTrial && (
                                        <Field label="学员G账号" value={order.studentAccount} />
                                    )}
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
