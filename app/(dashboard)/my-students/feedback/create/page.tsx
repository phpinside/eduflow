"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FeedbackForm } from "@/components/feedback/feedback-form"

export default function CreateFeedbackPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    
    const studentId = searchParams.get('studentId') || ''
    const studentName = searchParams.get('studentName') || ''

    if (!studentId) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-xl font-bold">缺少学生信息</h2>
                <Button variant="outline" onClick={() => router.back()}>返回</Button>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">填写课后反馈</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        学员：{studentName || studentId}
                    </p>
                </div>
            </div>

            <FeedbackForm 
                studentId={studentId}
                studentName={studentName}
                mode="create" 
            />
        </div>
    )
}
