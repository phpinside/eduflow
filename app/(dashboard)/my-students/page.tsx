"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { OrderStatus } from "@/types"
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
import { Search, User, FileText, MessageSquare, FilterX } from "lucide-react"
import { StudentSelectorDialog } from "@/components/students/StudentSelectorDialog"

export default function MyStudentsPage() {
    const { user } = useAuth()
    const router = useRouter()
    
    // Filters
    const [nameFilter, setNameFilter] = React.useState("")
    const [gradeFilter, setGradeFilter] = React.useState<string>("all")
    
    // Dialog states
    const [showStudyPlanDialog, setShowStudyPlanDialog] = React.useState(false)
    const [showFeedbackDialog, setShowFeedbackDialog] = React.useState(false)

    const dayLabels: Record<string, string> = {
        monday: "周一", tuesday: "周二", wednesday: "周三", thursday: "周四",
        friday: "周五", saturday: "周六", sunday: "周日"
    }

    const myOrders = React.useMemo(() => {
        if (!user) return []

        // 1. Get base list of relevant orders
        let orders = mockOrders.filter(order => {
            const isAssigned = order.assignedTeacherId === user.id &&
                [OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED].includes(order.status)
            
            // Show transferred orders regardless of status
            const isTransferred = order.transferredOutFrom === user.id
            
            return isAssigned || isTransferred
        }).map(order => {
            const student = mockStudents.find(s => s.id === order.studentId)
            return {
                ...order,
                studentName: student?.name || "未知学生",
                studentGender: student?.gender,
                studentGrade: student?.grade,
                studentSchool: student?.school,
                studentId: student?.id,
                isTransferred: order.transferredOutFrom === user.id
            }
        })

        // 2. Apply Filters
        if (nameFilter.trim()) {
            orders = orders.filter(o => 
                o.studentName.includes(nameFilter.trim())
            )
        }

        if (gradeFilter && gradeFilter !== "all") {
             orders = orders.filter(o => 
                o.studentGrade === gradeFilter || o.grade === gradeFilter
            )
        }

        return orders
    }, [user, nameFilter, gradeFilter])

    // Extract unique grades for filter dropdown
    const availableGrades = React.useMemo(() => {
        if (!user) return []
        const grades = new Set<string>()
        mockOrders.forEach(o => {
            if (o.assignedTeacherId === user.id) {
                if (o.grade) grades.add(o.grade)
            }
        })
        return Array.from(grades).sort()
    }, [user])

    const resetFilters = () => {
        setNameFilter("")
        setGradeFilter("all")
    }

    const handleCreateStudyPlan = (studentId: string, studentName: string) => {
        router.push(`/my-students/study-plan/create?studentId=${studentId}&studentName=${encodeURIComponent(studentName)}`)
        setShowStudyPlanDialog(false)
    }

    const handleCreateFeedback = (studentId: string, studentName: string) => {
        router.push(`/my-students/feedback/create?studentId=${studentId}&studentName=${encodeURIComponent(studentName)}`)
        setShowFeedbackDialog(false)
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
                        共找到 {myOrders.length} 条相关记录
                    </p>
                </div>
            </div>

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

                {/* 右侧功能按钮 */}
                <div className="flex gap-2 ml-auto">
                    <Button variant="outline" onClick={() => setShowStudyPlanDialog(true)}>
                        <FileText className="mr-2 h-4 w-4" />
                        学习规划书
                    </Button>
                    <Button onClick={() => setShowFeedbackDialog(true)}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        课后反馈
                    </Button>
                </div>
            </div>

            {/* Table */}
            <div className="border rounded-md bg-white dark:bg-gray-950">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">学员姓名</TableHead>
                            <TableHead className="w-[100px]">年级</TableHead>
                            <TableHead className="w-[100px]">科目</TableHead>
                            <TableHead>上课时间</TableHead>
                            <TableHead className="w-[150px]">课时情况</TableHead>
                            <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {myOrders.length > 0 ? (
                            myOrders.map((order) => (
                                <TableRow 
                                    key={order.id} 
                                    className={`cursor-pointer hover:bg-muted/50 ${order.isTransferred ? "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/30" : ""}`}
                                    onClick={() => {
                                        if (order.studentId) {
                                            router.push(`/my-students/${order.studentId}`)
                                        }
                                    }}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                 <User className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-primary hover:underline">
                                                    {order.studentName}
                                                </div>
                                                {order.isTransferred && (
                                                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-yellow-500 text-yellow-600 bg-yellow-50 mt-1">
                                                        已转走
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{order.grade}</TableCell>
                                    <TableCell>{order.subject}</TableCell>
                                    <TableCell>
                                        {order.weeklySchedule && order.weeklySchedule.length > 0 ? (
                                            <div className="space-y-1">
                                                {order.weeklySchedule.map((schedule, idx) => (
                                                    <div key={idx} className="text-xs text-muted-foreground">
                                                        <span className="font-medium text-foreground mr-1">
                                                            {dayLabels[schedule.day] || schedule.day}
                                                        </span>
                                                        {schedule.startTime}-{schedule.endTime}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">无固定排课</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1 text-sm">
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">剩余:</span>
                                                <span className="font-medium">{order.remainingHours}</span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">总共:</span>
                                                <span>{order.totalHours}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button variant="outline" size="sm" className="h-8" asChild>
                                                <Link href={`/my-students/study-plan/create?studentId=${order.studentId}&studentName=${encodeURIComponent(order.studentName)}`}>
                                                    <FileText className="h-3.5 w-3.5 mr-1" />
                                                    学习规划书
                                                </Link>
                                            </Button>
                                            <Button size="sm" className="h-8" asChild>
                                                <Link href={`/my-students/feedback/create?studentId=${order.studentId}&studentName=${encodeURIComponent(order.studentName)}`}>
                                                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                                    课后反馈
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <p>没有找到符合条件的学员</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

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
        </div>
    )
}
