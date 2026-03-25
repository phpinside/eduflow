"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { mockFeedbacks } from "@/lib/mock-data/feedbacks"
import { FeedbackForm } from "@/components/feedback/feedback-form"

export default function EditFeedbackPage() {
    const params = useParams()
    const router = useRouter()
    const feedbackId = params.feedbackId as string
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

    // Data Fetching
    const feedback = React.useMemo(() => mockFeedbacks.find(f => f.id === feedbackId), [feedbackId])
    
    // 获取学生和订单信息（支持弱绑定）
    const student = React.useMemo(() => {
        if (!feedback) return null
        // 优先使用 feedback.studentName
        if (feedback.studentName) {
            return { id: feedback.studentId, name: feedback.studentName }
        }
        return mockStudents.find(s => s.id === feedback.studentId)
    }, [feedback])
    
    const order = React.useMemo(() => {
        if (!feedback || !feedback.orderId) return null
        return mockOrders.find(o => o.id === feedback.orderId)
    }, [feedback])

    const handleDeleteConfirmed = () => {
        const idx = mockFeedbacks.findIndex((f) => f.id === feedbackId)
        if (idx !== -1) {
            mockFeedbacks.splice(idx, 1)
        }
        setDeleteDialogOpen(false)
        toast.success("反馈已删除")
        router.push("/my-students?tab=feedbacks")
    }

    if (!feedback || !student) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-xl font-bold">记录不存在</h2>
                <Button variant="outline" onClick={() => router.back()}>返回列表</Button>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header：标题与删除同一行，删除靠右 */}
            <div className="flex items-start gap-4">
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-2xl font-bold tracking-tight">编辑课后反馈</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            学员：{student.name} (ID: {student.id}) {order && `| 科目：${order.subject}`}
                        </p>
                    </div>
                    <Button
                        type="button"
                        variant="outline"
                        className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除
                    </Button>
                </div>
            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent showCloseButton>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            确定要删除这条课后反馈吗？删除后无法恢复。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            取消
                        </Button>
                        <Button type="button" variant="destructive" onClick={handleDeleteConfirmed}>
                            删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <FeedbackForm 
                studentId={feedback.studentId}
                studentName={student.name}
                orderId={feedback.orderId}
                initialData={feedback} 
                mode="edit" 
            />
        </div>
    )
}
