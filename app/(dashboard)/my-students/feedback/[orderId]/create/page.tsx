"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { FeedbackForm } from "@/components/feedback/feedback-form"

export default function CreateFeedbackPage() {
    const params = useParams()
    const router = useRouter()
    const orderId = params.orderId as string

    // Data Fetching
    const order = React.useMemo(() => mockOrders.find(o => o.id === orderId), [orderId])
    const student = React.useMemo(() => order ? mockStudents.find(s => s.id === order.studentId) : null, [order])

    if (!order || !student) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-xl font-bold">订单不存在</h2>
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
                <h1 className="text-2xl font-bold tracking-tight">填写课后反馈</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    学员：{student.name} | 科目：{order.subject}
                </p>
                </div>
            </div>

            <FeedbackForm orderId={orderId} mode="create" />
        </div>
    )
}
