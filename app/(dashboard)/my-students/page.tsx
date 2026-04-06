"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { mockStudents } from "@/lib/mock-data/students"
import { getStoredOrders, getStoredRefundApplications } from "@/lib/storage"
import { OrderStatus, RefundApplicationStatus, type Order, type RefundApplication } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, User, FileText, MessageSquare, FilterX, Plus, Star, Pencil, Calendar, Clock, MessageSquareText } from "lucide-react"
import { StudentSelectorDialog } from "@/components/students/StudentSelectorDialog"
import { StudentFormDialog, StudentFormData } from "@/components/students/StudentFormDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Pagination } from "@/components/ui/pagination"
import { mockFeedbacks } from "@/lib/mock-data/feedbacks"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { cn } from "@/lib/utils"

const RATING_LABELS = ["", "不满意", "需改进", "一般", "比较满意", "非常满意"]

const EVALUATION_SECTIONS = [
    {
        title: "课堂效果",
        dotClass: "bg-amber-400",
        bgClass: "border-amber-100 bg-amber-50/60",
        items: [
            { key: "knowledge_absorption", label: "知识吸收程度" },
            { key: "student_explain", label: "学生讲解题目" },
        ],
    },
    {
        title: "教师表现",
        dotClass: "bg-sky-400",
        bgClass: "border-sky-100 bg-sky-50/60",
        items: [
            { key: "professionalism", label: "专业程度" },
            { key: "responsibility", label: "责任心" },
            { key: "patience", label: "耐心程度" },
            { key: "post_feedback", label: "课后反馈" },
        ],
    },
    {
        title: "上课规范",
        dotClass: "bg-emerald-400",
        bgClass: "border-emerald-100 bg-emerald-50/60",
        items: [
            { key: "punctuality", label: "上课守时" },
            { key: "camera", label: "开摄像头" },
        ],
    },
    {
        title: "上课环境",
        dotClass: "bg-rose-400",
        bgClass: "border-rose-100 bg-rose-50/60",
        items: [
            { key: "network", label: "网络状况" },
            { key: "environment", label: "上课环境" },
        ],
    },
]

// 手动录入的学员记录类型（基于 StudentFormData 扩展，带唯一 id）
interface ManualStudentRecord extends StudentFormData {
    id: string
    isManual: true
}

// 统一展示行结构
interface StudentRow {
    rowId: string
    studentAccount: string
    studentName: string
    grade: string
    subject: string
    totalHours: number | string
    remainingHours: number | string
    campusAccount: string
    remarks: string
    studentId?: string
    isTransferred?: boolean
    isManual?: boolean
    // 原始 order id（用于操作按钮链接）
    orderId?: string
    refundStatusLabel?: string
}

export default function MyStudentsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()

    // Tab state
    const defaultTab = searchParams.get('tab') || "students"
    const [activeTab, setActiveTab] = React.useState(defaultTab)

    // Pagination
    const [studentsPage, setStudentsPage] = React.useState(1)
    const [feedbacksPage, setFeedbacksPage] = React.useState(1)
    const pageSize = 10

    // Filters - Students Tab
    const [nameFilter, setNameFilter] = React.useState("")
    const [gradeFilter, setGradeFilter] = React.useState<string>("all")

    // Filters - Feedbacks Tab
    const [feedbackNameFilter, setFeedbackNameFilter] = React.useState("")
    const [feedbackRatingFilter, setFeedbackRatingFilter] = React.useState<string>("all")

    // Dialog states
    const [showStudyPlanDialog, setShowStudyPlanDialog] = React.useState(false)
    const [showFeedbackDialog, setShowFeedbackDialog] = React.useState(false)
    const [selectedParentFeedback, setSelectedParentFeedback] = React.useState<any>(null)
    const [isParentFeedbackDialogOpen, setIsParentFeedbackDialogOpen] = React.useState(false)

    // 手动录入相关状态
    const [manualStudents, setManualStudents] = React.useState<ManualStudentRecord[]>([])
    const [storedOrders, setStoredOrders] = React.useState<Order[]>([])
    const [refundApps, setRefundApps] = React.useState<RefundApplication[]>([])
    const [showStudentFormDialog, setShowStudentFormDialog] = React.useState(false)
    const [editingStudent, setEditingStudent] = React.useState<StudentFormData | undefined>(undefined)

    const dayLabels: Record<string, string> = {
        monday: "周一", tuesday: "周二", wednesday: "周三", thursday: "周四",
        friday: "周五", saturday: "周六", sunday: "周日"
    }

    React.useEffect(() => {
        setStoredOrders(getStoredOrders())
        setRefundApps(getStoredRefundApplications())
    }, [])

    const getRefundStatusLabel = React.useCallback((orderId: string) => {
        const active = refundApps.find(
            (a) =>
                a.orderId === orderId &&
                (a.status === RefundApplicationStatus.PENDING_FIRST_REVIEW ||
                    a.status === RefundApplicationStatus.PENDING_SECOND_REVIEW)
        )
        if (active?.status === RefundApplicationStatus.PENDING_FIRST_REVIEW) return "退费一审中"
        if (active?.status === RefundApplicationStatus.PENDING_SECOND_REVIEW) return "退费二审中"
        const done = refundApps.find((a) => a.orderId === orderId)
        return done ? "退费相关" : ""
    }, [refundApps])

    // 从订单构建学员行
    const orderRows = React.useMemo((): StudentRow[] => {
        if (!user) return []

        return storedOrders
            .filter(order => {
                const isAssigned = order.assignedTeacherId === user.id &&
                    [OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED].includes(order.status)
                const isTransferred = order.transferredOutFrom === user.id
                return isAssigned || isTransferred
            })
            .map(order => {
                const student = mockStudents.find(s => s.id === order.studentId)
                return {
                    rowId: order.id,
                    studentAccount: order.studentAccount ?? "",
                    studentName: student?.name ?? "未知学生",
                    grade: order.grade,
                    subject: order.subject,
                    totalHours: order.totalHours,
                    remainingHours: order.remainingHours,
                    campusAccount: order.campusAccount ?? "",
                    remarks: order.remarks ?? "",
                    studentId: student?.id,
                    isTransferred: order.transferredOutFrom === user.id,
                    orderId: order.id,
                    refundStatusLabel: getRefundStatusLabel(order.id),
                }
            })
    }, [user, storedOrders, getRefundStatusLabel])

    // 手动录入行
    const manualRows = React.useMemo((): StudentRow[] => {
        return manualStudents.map(s => ({
            rowId: s.id,
            studentAccount: s.studentAccount,
            studentName: s.studentName,
            grade: s.grade,
            subject: s.subject,
            totalHours: s.totalHours,
            remainingHours: s.remainingHours,
            campusAccount: s.campusAccount,
            remarks: s.remarks,
            isManual: true,
        }))
    }, [manualStudents])

    // 合并并筛选
    const allRows = React.useMemo((): StudentRow[] => {
        let rows = [...orderRows, ...manualRows]

        if (nameFilter.trim()) {
            rows = rows.filter(r => r.studentName.includes(nameFilter.trim()))
        }
        if (gradeFilter && gradeFilter !== "all") {
            rows = rows.filter(r => r.grade === gradeFilter)
        }

        return rows
    }, [orderRows, manualRows, nameFilter, gradeFilter])

    const paginatedRows = React.useMemo(() => {
        const start = (studentsPage - 1) * pageSize
        return allRows.slice(start, start + pageSize)
    }, [allRows, studentsPage])

    const studentsTotalPages = Math.ceil(allRows.length / pageSize)

    // 可用年级（来自订单 + 手动录入）
    const availableGrades = React.useMemo(() => {
        const grades = new Set<string>()
        orderRows.forEach(r => { if (r.grade) grades.add(r.grade) })
        manualRows.forEach(r => { if (r.grade) grades.add(r.grade) })
        return Array.from(grades).sort()
    }, [orderRows, manualRows])

    // 课后反馈列表
    const myFeedbacks = React.useMemo(() => {
        if (!user) return []

        let feedbacks = mockFeedbacks
            .filter(fb => fb.teacherId === user.id)
            .map(fb => {
                const student = mockStudents.find(s => s.id === fb.studentId)
                return {
                    ...fb,
                    displayStudentName: fb.studentName || student?.name || "未知学生",
                    studentId: fb.studentId
                }
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        if (feedbackNameFilter.trim()) {
            feedbacks = feedbacks.filter(fb =>
                fb.displayStudentName.includes(feedbackNameFilter.trim())
            )
        }

        if (feedbackRatingFilter && feedbackRatingFilter !== "all") {
            if (feedbackRatingFilter === "rated") {
                feedbacks = feedbacks.filter(fb => fb.parentFeedback)
            } else if (feedbackRatingFilter === "unrated") {
                feedbacks = feedbacks.filter(fb => !fb.parentFeedback)
            }
        }

        return feedbacks
    }, [user, feedbackNameFilter, feedbackRatingFilter])

    const paginatedFeedbacks = React.useMemo(() => {
        const start = (feedbacksPage - 1) * pageSize
        return myFeedbacks.slice(start, start + pageSize)
    }, [myFeedbacks, feedbacksPage])

    const feedbacksTotalPages = Math.ceil(myFeedbacks.length / pageSize)

    const resetFilters = () => {
        setNameFilter("")
        setGradeFilter("all")
        setStudentsPage(1)
    }

    const resetFeedbackFilters = () => {
        setFeedbackNameFilter("")
        setFeedbackRatingFilter("all")
        setFeedbacksPage(1)
    }

    React.useEffect(() => {
        const tabParam = searchParams.get('tab')
        if (tabParam && (tabParam === 'students' || tabParam === 'feedbacks')) {
            setActiveTab(tabParam)
        }
    }, [searchParams])

    React.useEffect(() => {
        if (activeTab === "students") {
            setStudentsPage(1)
        } else {
            setFeedbacksPage(1)
        }
    }, [activeTab])

    const handleCreateStudyPlan = (studentId: string, studentName: string) => {
        router.push(`/my-students/study-plan/create?studentId=${studentId}&studentName=${encodeURIComponent(studentName)}`)
        setShowStudyPlanDialog(false)
    }

    const handleCreateFeedback = (studentId: string, studentName: string) => {
        router.push(`/my-students/feedback/create?studentId=${studentId}&studentName=${encodeURIComponent(studentName)}`)
        setShowFeedbackDialog(false)
    }

    // 打开新增表单
    const handleOpenAddStudent = () => {
        setEditingStudent(undefined)
        setShowStudentFormDialog(true)
    }

    // 打开编辑表单（仅手动录入的记录）
    const handleOpenEditStudent = (row: StudentRow) => {
        const record = manualStudents.find(s => s.id === row.rowId)
        if (!record) return
        setEditingStudent(record)
        setShowStudentFormDialog(true)
    }

    // 提交新增/编辑
    const handleStudentFormSubmit = (data: StudentFormData) => {
        if (data.id) {
            // 编辑
            setManualStudents(prev =>
                prev.map(s => s.id === data.id ? { ...s, ...data, isManual: true } : s)
            )
        } else {
            // 新增
            const newRecord: ManualStudentRecord = {
                ...data,
                id: `manual-${Date.now()}`,
                isManual: true,
            }
            setManualStudents(prev => [...prev, newRecord])
        }
    }

    if (!user) {
        return <div>请先登录</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">我的学员</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        {activeTab === "students"
                            ? `共找到 ${allRows.length} 条学员记录`
                            : `共找到 ${myFeedbacks.length} 条反馈记录`}
                    </p>
                </div>
            </div>

            <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="students">学员列表</TabsTrigger>
                    <TabsTrigger value="feedbacks">课后反馈列表</TabsTrigger>
                </TabsList>

                {/* 学员列表 Tab */}
                <TabsContent value="students" className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 items-center bg-muted/20 p-4 rounded-lg border">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索学员姓名..."
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="bg-background"
                            />
                        </div>

                        <div className="w-full md:w-[180px]">
                            <Select value={gradeFilter} onValueChange={setGradeFilter}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="年级筛选" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">所有年级</SelectItem>
                                    {availableGrades.map(grade => (
                                        <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {(nameFilter || gradeFilter !== "all") && (
                            <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground">
                                <FilterX className="mr-2 h-4 w-4" />
                                重置筛选
                            </Button>
                        )}

                       
                    </div>

                    {/* Table */}
                    <div className="border rounded-md bg-white dark:bg-gray-950 overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">学员账号编码</TableHead>
                                    <TableHead className="w-[130px]">学员姓名</TableHead>
                                    <TableHead className="w-[90px]">年级</TableHead>
                                    <TableHead className="w-[80px]">科目</TableHead>
                                    <TableHead className="w-[90px] text-center">总计课时</TableHead>
                                    <TableHead className="w-[90px] text-center">剩余课时</TableHead>
                                    <TableHead className="text-right w-[160px]">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedRows.length > 0 ? (
                                    paginatedRows.map((row) => (
                                        <TableRow
                                            key={row.rowId}
                                            className={
                                                row.isTransferred
                                                    ? "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30"
                                                    : "hover:bg-muted/50"
                                            }
                                        >
                                            <TableCell>
                                                <span className="text-xs font-mono text-muted-foreground">
                                                    {row.studentAccount || "—"}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                        <User className="h-3.5 w-3.5 text-primary" />
                                                    </div>
                                                    <div>
                                                        {row.studentId ? (
                                                            <button
                                                                className="font-medium text-primary hover:underline text-left"
                                                                onClick={() => router.push(`/my-students/${row.studentId}`)}
                                                            >
                                                                {row.studentName}
                                                            </button>
                                                        ) : (
                                                            <span className="font-medium">{row.studentName}</span>
                                                        )}
                                                        <div className="flex gap-1 mt-0.5">
                                                            {row.isTransferred && (
                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-yellow-500 text-yellow-600 bg-yellow-50">
                                                                    已转走
                                                                </Badge>
                                                            )}
                                                            {row.isManual && (
                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-400 text-blue-500 bg-blue-50">
                                                                    手动录入
                                                                </Badge>
                                                            )}
                                                            {row.refundStatusLabel && (
                                                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-amber-400 text-amber-700 bg-amber-50">
                                                                    {row.refundStatusLabel}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>{row.grade}</TableCell>
                                            <TableCell>{row.subject}</TableCell>
                                            <TableCell className="text-center font-medium">
                                                {row.totalHours}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={
                                                    Number(row.remainingHours) <= 5
                                                        ? "text-destructive font-semibold"
                                                        : "font-medium text-primary"
                                                }>
                                                    {row.remainingHours !== "" ? row.remainingHours : "—"}
                                                </span>
                                            </TableCell>
                                         
            
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1.5">
                                                    {row.isManual ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="h-8"
                                                            onClick={() => handleOpenEditStudent(row)}
                                                        >
                                                            <Pencil className="h-3.5 w-3.5 mr-1" />
                                                            编辑
                                                        </Button>
                                                    ) : (
                                                        <>
                                                            <Button variant="outline" size="sm" className="h-8" asChild>
                                                                <Link href={`/my-students/study-plan/create?studentId=${row.studentId}&studentName=${encodeURIComponent(row.studentName)}`}>
                                                                    <FileText className="h-3.5 w-3.5 mr-1" />
                                                                    规划书
                                                                </Link>
                                                            </Button>
                                                            <Button size="sm" className="h-8" asChild>
                                                                <Link href={`/my-students/feedback/create?studentId=${row.studentId}&studentName=${encodeURIComponent(row.studentName)}`}>
                                                                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                                                    课后反馈
                                                                </Link>
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="h-24 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground gap-2">
                                                <p>没有找到符合条件的学员</p>
                                                <Button variant="outline" size="sm" onClick={handleOpenAddStudent}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    手动新增学员
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* 分页 */}
                    {studentsTotalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={studentsPage}
                                totalPages={studentsTotalPages}
                                onPageChange={setStudentsPage}
                            />
                        </div>
                    )}
                </TabsContent>

                {/* 课后反馈列表 Tab */}
                <TabsContent value="feedbacks" className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4 items-center bg-muted/20 p-4 rounded-lg border">
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="搜索学员姓名..."
                                value={feedbackNameFilter}
                                onChange={(e) => setFeedbackNameFilter(e.target.value)}
                                className="bg-background"
                            />
                        </div>

                        <div className="w-full md:w-[180px]">
                            <Select value={feedbackRatingFilter} onValueChange={setFeedbackRatingFilter}>
                                <SelectTrigger className="bg-background">
                                    <SelectValue placeholder="点评状态" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">全部</SelectItem>
                                    <SelectItem value="rated">已点评</SelectItem>
                                    <SelectItem value="unrated">待点评</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(feedbackNameFilter || feedbackRatingFilter !== "all") && (
                            <Button variant="ghost" size="sm" onClick={resetFeedbackFilters} className="text-muted-foreground">
                                <FilterX className="mr-2 h-4 w-4" />
                                重置筛选
                            </Button>
                        )}

                      
                    </div>

                    {/* Table */}
                    <div className="border rounded-md bg-white dark:bg-gray-950">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[160px]">学员信息</TableHead>
                                    <TableHead className="w-[160px]">上课时间</TableHead>
                                    <TableHead>课程内容摘要</TableHead>
                                    <TableHead className="w-[100px]">扣除课时</TableHead>
                                    <TableHead className="w-[140px]">家长点评</TableHead>
                                    <TableHead className="w-[140px]">创建时间</TableHead>
                                    <TableHead className="text-right w-[120px]">操作</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedFeedbacks.length > 0 ? (
                                    paginatedFeedbacks.map((feedback) => (
                                        <TableRow key={feedback.id}>
                                            <TableCell>
                                                <div className="font-medium">{feedback.displayStudentName}</div>
                                                <div className="text-xs text-muted-foreground">ID: {feedback.studentId}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Calendar className="h-3 w-3 text-muted-foreground" />
                                                    {format(new Date(feedback.date), "MM-dd", { locale: zhCN })}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {feedback.startTime}-{feedback.endTime}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[300px] truncate text-sm">
                                                    {feedback.content}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">{feedback.deductHours}h</Badge>
                                            </TableCell>
                                            <TableCell
                                                className={feedback.parentFeedback ? "cursor-pointer" : ""}
                                                onClick={() => {
                                                    if (feedback.parentFeedback) {
                                                        setSelectedParentFeedback(feedback)
                                                        setIsParentFeedbackDialogOpen(true)
                                                    }
                                                }}
                                            >
                                                {feedback.parentFeedback ? (
                                                    <div className="space-y-0.5">
                                                        <div className="flex items-center gap-0.5">
                                                            {Array.from({ length: 5 }).map((_, i) => (
                                                                <Star
                                                                    key={i}
                                                                    className={cn(
                                                                        "h-3.5 w-3.5",
                                                                        i < feedback.parentFeedback!.rating
                                                                            ? "fill-amber-400 text-amber-400"
                                                                            : "fill-muted text-muted"
                                                                    )}
                                                                />
                                                            ))}
                                                            <span className="text-xs text-muted-foreground ml-1">
                                                                {RATING_LABELS[feedback.parentFeedback.rating]}
                                                            </span>
                                                        </div>
                                                        {feedback.parentFeedback.remarks ? (
                                                            <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                                                                {feedback.parentFeedback.remarks}
                                                            </p>
                                                        ) : (
                                                            <p className="text-xs text-muted-foreground">点击查看详情</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline" className="text-xs">待点评</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {format(new Date(feedback.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="sm" className="h-8" asChild>
                                                        <Link href={`/my-students/feedback/${feedback.orderId}/edit/${feedback.id}`}>
                                                            <Pencil className="h-3 w-3" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="h-24 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <p>暂无课后反馈记录</p>
                                                <Button
                                                    variant="link"
                                                    className="mt-2"
                                                    onClick={() => setShowFeedbackDialog(true)}
                                                >
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    创建第一条反馈
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* 分页 */}
                    {feedbacksTotalPages > 1 && (
                        <div className="mt-4">
                            <Pagination
                                currentPage={feedbacksPage}
                                totalPages={feedbacksTotalPages}
                                onPageChange={setFeedbacksPage}
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Dialogs */}
            <StudentSelectorDialog
                open={showStudyPlanDialog}
                onOpenChange={setShowStudyPlanDialog}
                onConfirm={handleCreateStudyPlan}
                title="创建学习规划书"
            />
            <StudentSelectorDialog
                open={showFeedbackDialog}
                onOpenChange={setShowFeedbackDialog}
                onConfirm={handleCreateFeedback}
                title="创建课后反馈"
            />

            {/* 新增/编辑学员 Dialog */}
            <StudentFormDialog
                open={showStudentFormDialog}
                onOpenChange={setShowStudentFormDialog}
                initialData={editingStudent}
                onSubmit={handleStudentFormSubmit}
            />

            {/* 家长点评详情对话框 */}
            <Dialog open={isParentFeedbackDialogOpen} onOpenChange={setIsParentFeedbackDialogOpen}>
                <DialogContent className="sm:max-w-5xl w-[90vw] p-0 overflow-hidden">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquareText className="h-5 w-5 text-primary" />
                            课堂反馈 · 家长点评详情
                        </DialogTitle>
                    </DialogHeader>
                    {selectedParentFeedback && (
                        <div className="grid grid-cols-2 divide-x" style={{ maxHeight: "75vh" }}>
                            {/* ── Left: lesson feedback record ── */}
                            <div className="overflow-y-auto p-6 space-y-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">课堂反馈详情</p>
                                <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">学员</span>
                                        <span className="font-medium">{selectedParentFeedback.displayStudentName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">上课日期</span>
                                        <span className="font-medium">{selectedParentFeedback.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">时间段</span>
                                        <span className="font-medium">{selectedParentFeedback.startTime}–{selectedParentFeedback.endTime}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">扣除课时</span>
                                        <span className="font-medium">{selectedParentFeedback.deductHours} 课时</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-1.5">📌 课程内容</p>
                                    <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                        {selectedParentFeedback.content || "—"}
                                    </div>
                                </div>
                                {selectedParentFeedback.methods && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">🔑 核心方法</p>
                                        <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedParentFeedback.methods}
                                        </div>
                                    </div>
                                )}
                                {selectedParentFeedback.mistakes && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">ℹ️ 易错提醒</p>
                                        <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedParentFeedback.mistakes}
                                        </div>
                                    </div>
                                )}
                                {selectedParentFeedback.performance && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">🌟 课堂表现</p>
                                        <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedParentFeedback.performance}
                                        </div>
                                    </div>
                                )}
                                {selectedParentFeedback.homework && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground mb-1.5">📝 课后巩固建议</p>
                                        <div className="rounded-lg bg-muted/30 border px-4 py-3 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                            {selectedParentFeedback.homework}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Right: parent evaluation ── */}
                            <div className="overflow-y-auto p-6 space-y-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">家长点评</p>
                                {/* 整体评分 */}
                                <div className="rounded-lg border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-4">
                                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3">整体评分</p>
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={cn(
                                                        "h-6 w-6",
                                                        i < selectedParentFeedback.parentFeedback.rating
                                                            ? "fill-amber-400 text-amber-400"
                                                            : "fill-muted text-muted"
                                                    )}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-base font-semibold text-slate-800">
                                            {RATING_LABELS[selectedParentFeedback.parentFeedback.rating]}
                                        </span>
                                        <span className="ml-auto text-sm text-muted-foreground">
                                            {selectedParentFeedback.parentFeedback.rating} / 5 分
                                        </span>
                                    </div>
                                </div>

                                {/* 详细评价 10 项 */}
                                <div>
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">详细评价</p>
                                    <div className="space-y-2">
                                        {EVALUATION_SECTIONS.map((section) => (
                                            <div key={section.title} className={cn("rounded-lg border p-3", section.bgClass)}>
                                                <div className="flex items-center gap-1.5 mb-2">
                                                    <span className={cn("h-2 w-2 rounded-full shrink-0", section.dotClass)} />
                                                    <span className="text-xs font-semibold text-slate-700">{section.title}</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-1.5">
                                                    {section.items.map((item) => {
                                                        const value = selectedParentFeedback.parentFeedback?.evaluation?.[item.key]
                                                        return (
                                                            <div
                                                                key={item.key}
                                                                className="flex items-center justify-between rounded-md bg-white/80 px-2.5 py-1.5 text-xs"
                                                            >
                                                                <span className="text-muted-foreground">{item.label}</span>
                                                                <span className="font-medium text-slate-800 ml-2 shrink-0">
                                                                    {value ?? "—"}
                                                                </span>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* 补充说明 */}
                                {selectedParentFeedback.parentFeedback.remarks && (
                                    <div>
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">补充说明</p>
                                        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-slate-700 leading-relaxed">
                                            {selectedParentFeedback.parentFeedback.remarks}
                                        </div>
                                    </div>
                                )}

                                {/* 提交时间 */}
                                <p className="text-xs text-muted-foreground text-right">
                                    提交时间：{format(new Date(selectedParentFeedback.parentFeedback.submittedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
