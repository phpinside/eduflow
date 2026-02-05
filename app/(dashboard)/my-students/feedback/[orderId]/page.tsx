"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ArrowLeft, Plus, MessageSquare, Pencil, Eye, Calendar, Clock, Star, MessageCircle } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { mockFeedbacks } from "@/lib/mock-data/feedbacks"
import { LessonFeedbackRecord } from "@/types"

export default function FeedbackListPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const orderId = params.orderId as string

    // Data Fetching
    const order = React.useMemo(() => mockOrders.find(o => o.id === orderId), [orderId])
    const student = React.useMemo(() => order ? mockStudents.find(s => s.id === order.studentId) : null, [order])
    
    // Fetch Feedbacks
    const feedbacks = React.useMemo(() => {
        return mockFeedbacks.filter(f => f.orderId === orderId).sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        )
    }, [orderId])

    // Parent Feedback Dialog
    const [selectedParentFeedback, setSelectedParentFeedback] = React.useState<LessonFeedbackRecord['parentFeedback'] | null>(null)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)

    const handleViewParentFeedback = (feedback: LessonFeedbackRecord) => {
        if (feedback.parentFeedback) {
            setSelectedParentFeedback(feedback.parentFeedback)
            setIsDialogOpen(true)
        }
    }

    if (!order || !student) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-xl font-bold">订单不存在</h2>
                <Button variant="outline" onClick={() => router.back()}>返回列表</Button>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-10">
             {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/my-students')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">课后反馈记录</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            学员：{student.name} | 科目：{order.subject}
                        </p>
                    </div>
                </div>
                <Button asChild>
                    <Link href={`/my-students/feedback/${orderId}/create`}>
                        <Plus className="mr-2 h-4 w-4" />
                        新增反馈
                    </Link>
                </Button>
            </div>

            <div className="border rounded-md bg-white dark:bg-gray-950">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[160px]">上课时间</TableHead>
                            <TableHead className="w-[100px]">扣除课时</TableHead>
                            <TableHead>课程内容摘要</TableHead>
                            <TableHead className="w-[160px]">家长反馈</TableHead>
                            <TableHead className="w-[160px]">提交时间</TableHead>
                            <TableHead className="text-right w-[100px]">操作</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {feedbacks.length > 0 ? (
                            feedbacks.map((fb) => (
                                <TableRow key={fb.id}>
                                    <TableCell>
                                        <div className="flex flex-col text-sm">
                                            <span className="font-medium flex items-center gap-1">
                                                 <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {format(new Date(fb.date), "yyyy-MM-dd")}
                                            </span>
                                            <span className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                                                 <Clock className="h-3 w-3" />
                                                {fb.startTime}-{fb.endTime}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="font-normal">
                                            {fb.deductHours} 课时
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="max-w-[300px] truncate text-sm text-muted-foreground">
                                            {fb.content}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {fb.parentFeedback ? (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-7 text-xs gap-1 border-yellow-200 bg-yellow-50 hover:bg-yellow-100 hover:text-yellow-700 text-yellow-600"
                                                onClick={() => handleViewParentFeedback(fb)}
                                            >
                                                <Star className="h-3 w-3 fill-yellow-600" />
                                                {fb.parentFeedback.rating}分
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground">暂无</span>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {format(new Date(fb.createdAt), "yyyy-MM-dd HH:mm")}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" asChild title="编辑反馈">
                                                <Link href={`/my-students/feedback/${orderId}/edit/${fb.id}`}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                                        <div className="bg-muted/30 p-4 rounded-full mb-3">
                                            <MessageSquare className="h-8 w-8 opacity-20" />
                                        </div>
                                        <p>暂无反馈记录</p>
                                        <Button variant="link" asChild className="mt-2">
                                            <Link href={`/my-students/feedback/${orderId}/create`}>
                                                立即填写第一条反馈
                                            </Link>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Parent Feedback Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageCircle className="h-5 w-5 text-primary" />
                            家长评价详情
                        </DialogTitle>
                        <DialogDescription>
                            提交时间：{selectedParentFeedback && format(new Date(selectedParentFeedback.submittedAt), "yyyy-MM-dd HH:mm")}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedParentFeedback && (
                        <div className="space-y-4 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">整体评分：</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star 
                                            key={star} 
                                            className={`h-5 w-5 ${star <= selectedParentFeedback.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`} 
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <span className="text-sm font-medium">改进建议/评价标签：</span>
                                <div className="flex flex-wrap gap-2">
                                    {selectedParentFeedback.tags.map((tag, i) => (
                                        <Badge key={i} variant="outline" className="font-normal">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {selectedParentFeedback.remarks && (
                                <div className="space-y-1">
                                    <span className="text-sm font-medium">备注留言：</span>
                                    <div className="bg-muted/30 p-3 rounded-md text-sm text-muted-foreground">
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
