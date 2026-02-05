"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { Copy, Check, Send, Sparkles, Loader2 } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { mockFeedbacks } from "@/lib/mock-data/feedbacks"
import { LessonFeedbackRecord } from "@/types"

interface FeedbackFormProps {
    orderId: string
    initialData?: LessonFeedbackRecord
    mode?: 'create' | 'edit'
}

export function FeedbackForm({ orderId, initialData, mode = 'create' }: FeedbackFormProps) {
    const router = useRouter()
    const { user } = useAuth()

    // Data Fetching
    const order = React.useMemo(() => mockOrders.find(o => o.id === orderId), [orderId])
    const student = React.useMemo(() => order ? mockStudents.find(s => s.id === order.studentId) : null, [order])

    // Form State
    const [date, setDate] = React.useState(initialData?.date || format(new Date(), "yyyy-MM-dd"))
    const [startTime, setStartTime] = React.useState(initialData?.startTime || "20:00")
    const [endTime, setEndTime] = React.useState(initialData?.endTime || "21:00")
    const [deductHours, setDeductHours] = React.useState(initialData?.deductHours || "1")
    
    const [content, setContent] = React.useState(initialData?.content || "")
    const [methods, setMethods] = React.useState(initialData?.methods || "")
    const [mistakes, setMistakes] = React.useState(initialData?.mistakes || "")
    const [performance, setPerformance] = React.useState(initialData?.performance || "")
    const [homework, setHomework] = React.useState(initialData?.homework || "")

    // Generation State
    const [generatedText, setGeneratedText] = React.useState("")
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [isCopied, setIsCopied] = React.useState(false)

    // Handlers
    const handleGenerate = () => {
        setIsGenerating(true)
        setIsCopied(false)
        
        // Simulate "AI" generation delay
        setTimeout(() => {
            const text = `家长您好，今天的${order?.subject || '课程'}课堂反馈来啦！
学员名字：${student?.name || '学员'}
学生账号：${order?.studentAccount || '未设置'}
上课时间：${format(new Date(date), "MM月dd日")} ${startTime}–${endTime}
${order?.subject || '科目'}教练：${user?.name || '老师'}

📌 课程内容
${content || '本次课程主要进行了知识点的复习与巩固。'}

${methods ? `🔑 核心方法：
${methods}
` : ''}
${mistakes ? `ℹ️ 易错提醒：
${mistakes}
` : ''}
🌟 课堂表现
${performance || '孩子今天上课表现很棒，能够积极配合老师的教学节奏。'}

📝 课后巩固建议
${homework || '- 请按时完成课后作业\n- 及时复习今日所学内容'}

如有学习相关问题，欢迎随时沟通，我们将持续跟进孩子的学习状态，稳步提升${order?.subject || '学习'}能力 💪

📣 家长课堂反馈
为持续优化教学体验，诚邀您对本节课进行简单反馈（约10秒完成）：
👉 点击填写反馈：${window.location.origin}/p/feedback/${orderId}`
            
            setGeneratedText(text)
            setIsGenerating(false)
        }, 800)
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText)
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
    }

    const handleSubmit = () => {
        // Mock submission logic
        if (mode === 'create') {
            const newFeedback: LessonFeedbackRecord = {
                id: `fb-new-${Date.now()}`,
                orderId,
                studentId: student?.id || '',
                teacherId: user?.id || '',
                date,
                startTime,
                endTime,
                deductHours,
                content,
                methods,
                mistakes,
                performance,
                homework,
                createdAt: new Date(),
                updatedAt: new Date()
            }
            // In a real app, we would push this to the backend
            // For mock, we can push to array but it resets on reload without context
            mockFeedbacks.push(newFeedback)
            alert("反馈已创建")
        } else {
             // Mock update
             alert("反馈已更新")
        }
        
        router.push(`/my-students/feedback/${orderId}`)
    }

    if (!order || !student) {
        return <div>订单不存在</div>
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Left Column: Form */}
            <Card className="h-fit">
                <CardHeader>
                    <CardTitle>{mode === 'create' ? '课程信息录入' : '编辑反馈记录'}</CardTitle>
                    <CardDescription>{mode === 'create' ? '填写本节课的详细情况，用于生成反馈报告。' : '修改已保存的反馈内容。'}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="date">上课日期</Label>
                            <Input 
                                id="date" 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>时间段</Label>
                            <div className="flex items-center gap-2">
                                <Input 
                                    type="time" 
                                    value={startTime} 
                                    onChange={(e) => setStartTime(e.target.value)} 
                                />
                                <span>-</span>
                                <Input 
                                    type="time" 
                                    value={endTime} 
                                    onChange={(e) => setEndTime(e.target.value)} 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="deduct">扣除课时</Label>
                        <Select value={deductHours} onValueChange={setDeductHours}>
                            <SelectTrigger>
                                <SelectValue placeholder="选择课时" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0.5">0.5 课时</SelectItem>
                                <SelectItem value="1">1.0 课时</SelectItem>
                                <SelectItem value="1.5">1.5 课时</SelectItem>
                                <SelectItem value="2">2.0 课时</SelectItem>
                                <SelectItem value="2.5">2.5 课时</SelectItem>
                                <SelectItem value="3">3.0 课时</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">📌 课程内容</Label>
                        <Textarea 
                            id="content" 
                            placeholder="本节课主要复习了..." 
                            className="min-h-[80px]"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="methods">🔑 核心方法 (可选)</Label>
                        <Textarea 
                            id="methods" 
                            placeholder="例如：四步法..." 
                            className="min-h-[60px]"
                            value={methods}
                            onChange={(e) => setMethods(e.target.value)}
                        />
                    </div>

                        <div className="space-y-2">
                        <Label htmlFor="mistakes">ℹ️ 易错提醒 (可选)</Label>
                        <Textarea 
                            id="mistakes" 
                            placeholder="例如：注意符号变换..." 
                            className="min-h-[60px]"
                            value={mistakes}
                            onChange={(e) => setMistakes(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="performance">🌟 课堂表现</Label>
                        <Textarea 
                            id="performance" 
                            placeholder="孩子今天表现..." 
                            className="min-h-[80px]"
                            value={performance}
                            onChange={(e) => setPerformance(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="homework">📝 课后巩固建议</Label>
                        <Textarea 
                            id="homework" 
                            placeholder="- 作业要求...&#10;- 提交时间..." 
                            className="min-h-[80px]"
                            value={homework}
                            onChange={(e) => setHomework(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                生成中...
                            </>
                        ) : (
                            <>
                                <Sparkles className="mr-2 h-4 w-4" />
                                生成反馈文案
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>

            {/* Right Column: Preview & Action */}
            <div className="space-y-6">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                            <CardTitle>反馈预览</CardTitle>
                            <CardDescription>生成后可直接复制发送到微信群。</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[400px]">
                        {generatedText ? (
                            <div className="bg-muted/30 p-4 rounded-lg border h-full whitespace-pre-wrap text-sm leading-relaxed font-mono">
                                {generatedText}
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10 p-8">
                                <Sparkles className="h-12 w-12 mb-4 opacity-20" />
                                <p className="text-center">左侧填写内容后<br/>点击生成反馈预览</p>
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="flex gap-3 pt-6 border-t">
                            <Button 
                            variant="outline" 
                            className="flex-1" 
                            onClick={handleCopy}
                            disabled={!generatedText}
                        >
                            {isCopied ? (
                                <>
                                    <Check className="mr-2 h-4 w-4" /> 已复制
                                </>
                            ) : (
                                <>
                                    <Copy className="mr-2 h-4 w-4" /> 复制文案
                                </>
                            )}
                        </Button>
                            <Button 
                            className="flex-1" 
                            onClick={handleSubmit}
                            disabled={!generatedText}
                        >
                            <Send className="mr-2 h-4 w-4" /> {mode === 'create' ? '确认并创建' : '确认并更新'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
