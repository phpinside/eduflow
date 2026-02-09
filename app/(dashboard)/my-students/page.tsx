"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Search, User, FileText, MessageSquare, FilterX, Plus, Star, Eye, Pencil, Calendar, Clock } from "lucide-react"
import { StudentSelectorDialog } from "@/components/students/StudentSelectorDialog"
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

export default function MyStudentsPage() {
    const { user } = useAuth()
    const router = useRouter()
    const searchParams = useSearchParams()
    
    // Tab state - 从 URL 参数读取默认 Tab
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

    // 分页后的学员列表
    const paginatedOrders = React.useMemo(() => {
        const start = (studentsPage - 1) * pageSize
        const end = start + pageSize
        return myOrders.slice(start, end)
    }, [myOrders, studentsPage, pageSize])

    const studentsTotalPages = Math.ceil(myOrders.length / pageSize)

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

    // 获取我的课后反馈列表
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
        
        // Apply filters
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

    // 分页后的反馈列表
    const paginatedFeedbacks = React.useMemo(() => {
        const start = (feedbacksPage - 1) * pageSize
        const end = start + pageSize
        return myFeedbacks.slice(start, end)
    }, [myFeedbacks, feedbacksPage, pageSize])

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
    
    // 从 URL 参数同步 Tab 状态
    React.useEffect(() => {
        const tabParam = searchParams.get('tab')
        if (tabParam && (tabParam === 'students' || tabParam === 'feedbacks')) {
            setActiveTab(tabParam)
        }
    }, [searchParams])
    
    // 切换Tab时重置页码
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
                            ? `共找到 ${myOrders.length} 条学员记录` 
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
                        {paginatedOrders.length > 0 ? (
                            paginatedOrders.map((order) => (
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
                                                    <Plus className="h-3.5 w-3.5 mr-1" />
                                                    创建课后反馈
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

                        {/* 右侧功能按钮 */}
                        <div className="flex gap-2 ml-auto">
                            <Button onClick={() => setShowFeedbackDialog(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                创建课后反馈
                            </Button>
                        </div>
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
                                            <TableCell>
                                                {feedback.parentFeedback ? (
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        className="h-8 px-2"
                                                        onClick={() => {
                                                            setSelectedParentFeedback(feedback.parentFeedback)
                                                            setIsParentFeedbackDialogOpen(true)
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-1">
                                                            {Array.from({ length: feedback.parentFeedback.rating }).map((_, i) => (
                                                                <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                                            ))}
                                                            <span className="ml-1 text-xs">{feedback.parentFeedback.rating}分</span>
                                                        </div>
                                                    </Button>
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
            
            {/* 家长点评详情对话框 */}
            <Dialog open={isParentFeedbackDialogOpen} onOpenChange={setIsParentFeedbackDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>家长点评详情</DialogTitle>
                        <DialogDescription>
                            {selectedParentFeedback && 
                                `提交时间：${format(new Date(selectedParentFeedback.submittedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}`
                            }
                        </DialogDescription>
                    </DialogHeader>
                    {selectedParentFeedback && (
                        <div className="space-y-4">
                            {/* 评分 */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium">评分</div>
                                <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star 
                                            key={i} 
                                            className={`h-5 w-5 ${i < selectedParentFeedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                                        />
                                    ))}
                                    <span className="ml-2 text-lg font-semibold">{selectedParentFeedback.rating}.0</span>
                                </div>
                            </div>

                            {/* 标签 */}
                            {selectedParentFeedback.tags && selectedParentFeedback.tags.length > 0 && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">标签</div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedParentFeedback.tags.map((tag: string, i: number) => (
                                            <Badge key={i} variant="secondary">{tag}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* 文字评价 */}
                            {selectedParentFeedback.remarks && (
                                <div className="space-y-2">
                                    <div className="text-sm font-medium">文字评价</div>
                                    <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
                                        {selectedParentFeedback.remarks}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
