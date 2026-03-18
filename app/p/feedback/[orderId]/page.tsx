"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Star, CheckCircle2, BookOpen, MessageSquareText, SendHorizonal, UserRound } from "lucide-react"
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

    // Constants
    const RATING_LABELS = ["", "不满意", "需改进", "一般", "比较满意", "非常满意"]

    const EVALUATION_SECTIONS = [
        {
            title: "课堂效果",
            items: [
                { key: "knowledge_absorption", label: "知识吸收程度", options: ["很好", "较好", "一般"] },
                { key: "student_explain", label: "学生讲解题目", options: ["有", "无"] },
            ]
        },
        {
            title: "教师表现",
            items: [
                { key: "professionalism", label: "专业程度", options: ["专业严谨", "基本专业", "偶尔出错"] },
                { key: "responsibility", label: "责任心", options: ["主动关注", "被动回应", "敷衍了事"] },
                { key: "patience", label: "耐心程度", options: ["非常耐心", "一般耐心", "缺乏耐心"] },
                { key: "post_feedback", label: "课后反馈", options: ["及时详细", "简单概括", "敷衍了事"] },
            ]
        },
        {
            title: "上课规范",
            items: [
                { key: "punctuality", label: "上课守时", options: ["很守时", "基本守时", "不守时"] },
                { key: "camera", label: "开摄像头", options: ["开", "不开"] },
            ]
        },
        {
            title: "上课环境",
            items: [
                { key: "network", label: "网络状况", options: ["网络通畅", "网络较卡"] },
                { key: "environment", label: "上课环境", options: ["安静", "嘈杂"] },
            ]
        },
    ]

    // Form State
    const [rating, setRating] = React.useState<number>(0)
    const [evaluation, setEvaluation] = React.useState<Record<string, string>>(() => {
        const defaults: Record<string, string> = {}
        EVALUATION_SECTIONS.forEach(section => {
            section.items.forEach(item => {
                defaults[item.key] = item.options[0]
            })
        })
        return defaults
    })
    const [remarks, setRemarks] = React.useState("")
    const [isSubmitted, setIsSubmitted] = React.useState(false)

    // Handlers
    const handleSubmit = () => {
        if (rating === 0) return

        // Demo 模式：仅在控制台输出
        console.log({
            feedbackId,
            orderId: order.id,
            studentId: student.id,
            rating,
            evaluation,
            remarks
        })
        
        setIsSubmitted(true)
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] px-4 py-8">
                <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
                    <Card className="w-full overflow-hidden border-0 bg-white/92 text-center shadow-[0_32px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200 backdrop-blur animate-in fade-in zoom-in duration-300">
                        <CardContent className="px-6 py-10">
                            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-[0_16px_32px_rgba(16,185,129,0.28)]">
                                <CheckCircle2 className="h-10 w-10 text-white" />
                            </div>
                            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                                Submitted
                            </div>
                            <CardTitle className="text-2xl font-semibold text-slate-900">感谢您的反馈</CardTitle>
                            <CardDescription className="mt-3 text-sm leading-6 text-slate-600">
                                您的评价已成功提交，我们会持续优化教学服务，为 {student.name} 带来更稳定、更优质的课堂体验。
                            </CardDescription>
                            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-slate-100 px-3 py-1">整体体验 {rating} 星</span>
                                <span className="rounded-full bg-slate-100 px-3 py-1">{order.subject}</span>
                            </div>
                            <Button className="mt-8 h-11 w-full rounded-xl" variant="outline" onClick={() => window.close()}>
                                关闭页面
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,rgba(251,191,36,0.16),transparent_24%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.08),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
            <div className="mx-auto max-w-xl px-4 py-6 pb-28">
                <div className="space-y-4">
                    <Card className="overflow-hidden border-0 bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_55%,#334155_100%)] text-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
                        <CardContent className="relative px-5 py-6">
                            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                            <div className="absolute -bottom-12 left-12 h-28 w-28 rounded-full bg-amber-400/20 blur-3xl" />

                            <div className="relative">
                                <div className="mb-3 inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-[0.24em] text-slate-200">
                                    AFTER CLASS REVIEW
                                </div>
                                <h1 className="text-[28px] font-semibold tracking-tight">课后评价</h1>
                                <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
                                    用 1 分钟完成本节课反馈，帮助我们持续提升教学质量与课堂体验。
                                </p>

                                <div className="mt-5 grid grid-cols-2 gap-2">
                                    <div className="rounded-2xl border border-white/12 bg-white/8 p-3 backdrop-blur-sm">
                                        <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                                            <UserRound className="h-3.5 w-3.5" />
                                            学生
                                        </div>
                                        <p className="text-sm font-medium text-white">{student.name}</p>
                                    </div>
                                    <div className="rounded-2xl border border-white/12 bg-white/8 p-3 backdrop-blur-sm">
                                        <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            科目
                                        </div>
                                        <p className="text-sm font-medium text-white">{order.subject}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 bg-white/92 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 backdrop-blur">
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-semibold text-slate-900">
                                    本节课整体体验
                                    </CardTitle>
                                    <CardDescription className="mt-1 text-sm text-slate-500">
                                        请按整体上课感受进行评分
                                    </CardDescription>
                                </div>
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                    必填
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-4">
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            className="rounded-2xl p-1.5 transition-transform duration-200 active:scale-95"
                                            onClick={() => setRating(star)}
                                        >
                                            <Star
                                                className={cn(
                                                    "h-10 w-10 transition-all duration-200",
                                                    star <= rating
                                                        ? "fill-amber-400 text-amber-400 drop-shadow-[0_6px_16px_rgba(251,191,36,0.38)]"
                                                        : "text-slate-200"
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-3 text-center">
                                    <div className="text-lg font-semibold text-slate-900">
                                        {rating > 0 ? RATING_LABELS[rating] : "请选择星级"}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">
                                        {rating > 0 ? "可根据实际情况调整评分" : "点击星星进行评分"}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 bg-white/92 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 backdrop-blur">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-semibold text-slate-900">课堂详细评价</CardTitle>
                            <CardDescription className="text-sm text-slate-500">
                                每项已默认选中首项，您可根据课堂实际情况快速调整
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3 pt-0">
                            {EVALUATION_SECTIONS.map((section, sectionIndex) => (
                                <div
                                    key={section.title}
                                    className={cn(
                                        "rounded-2xl border p-3.5 shadow-sm",
                                        sectionIndex === 0 && "border-amber-100 bg-gradient-to-br from-amber-50/90 to-white",
                                        sectionIndex === 1 && "border-sky-100 bg-gradient-to-br from-sky-50/90 to-white",
                                        sectionIndex === 2 && "border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white",
                                        sectionIndex === 3 && "border-rose-100 bg-gradient-to-br from-rose-50/80 to-white"
                                    )}
                                >
                                    <div className="mb-3 flex items-center gap-2">
                                        <span
                                            className={cn(
                                                "h-2.5 w-2.5 rounded-full",
                                                sectionIndex === 0 && "bg-amber-400",
                                                sectionIndex === 1 && "bg-sky-400",
                                                sectionIndex === 2 && "bg-emerald-400",
                                                sectionIndex === 3 && "bg-rose-400"
                                            )}
                                        />
                                        <p className="text-sm font-semibold text-slate-900">{section.title}</p>
                                    </div>

                                    <div className="space-y-2.5">
                                        {section.items.map((item) => (
                                            <div
                                                key={item.key}
                                                className="rounded-xl border border-white/90 bg-white/90 p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
                                            >
                                                <div className="mb-2 text-sm font-medium text-slate-700">{item.label}</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {item.options.map((option) => (
                                                        <button
                                                            key={option}
                                                            type="button"
                                                            onClick={() => setEvaluation(prev => ({ ...prev, [item.key]: option }))}
                                                            className={cn(
                                                                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                                                                evaluation[item.key] === option
                                                                    ? "border-slate-900 bg-slate-900 text-white shadow-[0_8px_20px_rgba(15,23,42,0.16)]"
                                                                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"
                                                            )}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="overflow-hidden border-0 bg-white/92 shadow-[0_18px_40px_rgba(15,23,42,0.08)] ring-1 ring-slate-200/70 backdrop-blur">
                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-2">
                                <MessageSquareText className="h-4 w-4 text-slate-500" />
                                <CardTitle className="text-base font-semibold text-slate-900">备注补充（选填）</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="space-y-2">
                                <Textarea
                                    placeholder="如有具体问题，请在此补充说明"
                                    maxLength={50}
                                    value={remarks}
                                    onChange={(e) => setRemarks(e.target.value)}
                                    className="min-h-[96px] resize-none rounded-2xl border-slate-200 bg-slate-50/70 px-4 py-3 text-sm shadow-inner focus-visible:ring-1"
                                />
                                <div className="flex items-center justify-between text-xs text-slate-400">
                                    <span>建议填写关键课堂观察，便于我们后续跟进</span>
                                    <span>{remarks.length}/50</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/70 bg-white/88 px-4 py-3 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="mx-auto flex max-w-xl items-center gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-900">确认提交本节课反馈</p>
                        <p className="truncate text-xs text-slate-500">已默认填充推荐项，提交后将用于优化教学服务</p>
                    </div>
                    <Button
                        className="h-11 rounded-xl px-5 shadow-[0_12px_24px_rgba(15,23,42,0.14)]"
                        onClick={handleSubmit}
                        disabled={rating === 0}
                    >
                        <SendHorizonal className="mr-2 h-4 w-4" />
                        提交评价
                    </Button>
                </div>
            </div>
        </div>
    )
}
