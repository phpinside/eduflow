"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Star, Smile, Meh, Frown, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"

export default function ParentFeedbackPage() {
    const params = useParams()
    const feedbackId = params.orderId as string // 实际是 feedbackId

    // Mock Data Fetching (Simulating Public Access)
    // Demo 模式：使用第一个学生和订单作为示例数据
    const student = React.useMemo(() => mockStudents[0], [])
    const order = React.useMemo(() => mockOrders[0], [])

    // Form State
    const [rating, setRating] = React.useState<number>(0)
    const [improvementTags, setImprovementTags] = React.useState<string[]>([])
    const [remarks, setRemarks] = React.useState("")
    const [isSubmitted, setIsSubmitted] = React.useState(false)

    // Constants
    const RATING_LABELS = [
        "",
        "不满意",
        "需改进",
        "一般",
        "比较满意",
        "非常满意"
    ]

    const IMPROVEMENT_OPTIONS = [
        "😵 节奏偏快 / 偏慢",
        "🤔 讲解不够清楚",
        "🙋 互动引导不够",
        "🙋 其他问题",
        "🧘 无明显问题"
    ]

    // Effects
    React.useEffect(() => {
        if (rating >= 4) {
            setImprovementTags(["🧘 无明显问题"])
        } else if (rating > 0 && improvementTags.includes("🧘 无明显问题")) {
            setImprovementTags([])
        }
    }, [rating])

    // Handlers
    const toggleTag = (tag: string) => {
        if (tag === "🧘 无明显问题") {
            setImprovementTags(["🧘 无明显问题"])
            return
        }

        let newTags = [...improvementTags]
        if (newTags.includes("🧘 无明显问题")) {
            newTags = []
        }

        if (newTags.includes(tag)) {
            newTags = newTags.filter(t => t !== tag)
        } else {
            newTags.push(tag)
        }
        setImprovementTags(newTags)
    }

    const handleSubmit = () => {
        if (rating === 0) return
        if (rating <= 3 && improvementTags.length === 0) return

        // Demo 模式：仅在控制台输出
        console.log({
            feedbackId,
            orderId: order.id,
            studentId: student.id,
            rating,
            improvementTags,
            remarks
        })
        
        setIsSubmitted(true)
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center py-12 px-4 animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-center mb-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                    </div>
                    <CardTitle className="text-2xl mb-2">感谢您的反馈</CardTitle>
                    <CardDescription>
                        您的评价对我们非常重要，我们将持续改进教学质量，为{student.name}提供更好的课堂体验。
                    </CardDescription>
                    <Button className="mt-8 w-full" variant="outline" onClick={() => window.close()}>
                        关闭页面
                    </Button>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-md mx-auto space-y-6">
                {/* Header Info */}
                <div className="text-center space-y-1 mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">课后评价</h1>
                    <p className="text-sm text-gray-500">
                        {student.name} | {order.subject} | 授课老师
                    </p>
                </div>

                {/* Rating Section */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            ① 本节课整体体验 <span className="text-red-500">*</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    className="focus:outline-none transition-transform active:scale-90"
                                    onClick={() => setRating(star)}
                                >
                                    <Star 
                                        className={cn(
                                            "h-10 w-10 transition-colors",
                                            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"
                                        )} 
                                    />
                                </button>
                            ))}
                        </div>
                        <div className="text-center font-medium text-primary h-6">
                            {rating > 0 && RATING_LABELS[rating]}
                        </div>
                    </CardContent>
                </Card>

                {/* Improvement Section */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            ② 本节课老师需要改进的地方
                             <span className={cn("text-xs font-normal", rating > 0 && rating <= 3 ? "text-red-500" : "text-muted-foreground")}>
                                {rating > 0 && rating <= 3 ? "(必选)" : "(可选)"}
                             </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3">
                            {IMPROVEMENT_OPTIONS.map((option) => (
                                <button
                                    key={option}
                                    onClick={() => toggleTag(option)}
                                    className={cn(
                                        "p-3 rounded-lg text-sm font-medium border text-left transition-all",
                                        improvementTags.includes(option)
                                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                    )}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Remarks Section */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">备注 / 补充</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">备注 (选填)</Label>
                            <Textarea 
                                placeholder="如有具体问题请在此说明 (50字以内)" 
                                maxLength={50}
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                className="resize-none"
                            />
                            <div className="text-right text-xs text-muted-foreground">{remarks.length}/50</div>
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <Button 
                    className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20" 
                    onClick={handleSubmit}
                    disabled={
                        rating === 0 || 
                        (rating <= 3 && improvementTags.length === 0)
                    }
                >
                    提交评价
                </Button>
                
                <p className="text-center text-xs text-muted-foreground pt-4 pb-8">
                    您的评价将帮助我们持续改进教学质量
                </p>
            </div>
        </div>
    )
}
