"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { mockFeedbacks } from "@/lib/mock-data/feedbacks"
import { FeedbackForm } from "@/components/feedback/feedback-form"

export default function EditFeedbackPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.orderId as string
    const feedbackId = params.feedbackId as string

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
             {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                <h1 className="text-2xl font-bold tracking-tight">编辑课后反馈</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    学员：{student.name} (ID: {student.id}) {order && `| 科目：${order.subject}`}
                </p>
                </div>
            </div>

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
