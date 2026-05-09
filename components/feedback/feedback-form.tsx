"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Copy, Check, Send, Sparkles, Loader2 } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
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
import { LessonFeedbackRecord, Order, OrderType } from "@/types"
import { toast } from "sonner"
import { getStoredOrders, saveStoredOrders } from "@/lib/storage"
import { VoucherUpload } from "@/components/order/order-review-components"

/** 课费标准：一年级～九年级，高一～高三 */
const FEE_STANDARD_GRADES = [
    "一年级",
    "二年级",
    "三年级",
    "四年级",
    "五年级",
    "六年级",
    "七年级",
    "八年级",
    "九年级",
    "高一",
    "高二",
    "高三",
] as const

const DEFAULT_STUDENT_ATTENDANCE = "按时上课"
const DEFAULT_HOMEWORK_COMPLETION = "作业完成优秀"

const STUDENT_ATTENDANCE_OPTIONS = [
    "按时上课",
    "迟到",
    "早退",
    "临时改约",
    "请假未上课",
    "频繁请假",
    "上课中途离开",
    "未请假缺课",
] as const

const HOMEWORK_COMPLETION_OPTIONS = [
    "作业完成优秀",
    "没有布置作业",
    "作业完成较好",
    "作业完成但质量较低",
    "作业部分完成",
    "未按时提交作业",
    "上次作业未完成",
    "作业抄袭/敷衍",
] as const

const LEGACY_GRADE_TO_FEE_STANDARD: Record<string, string> = {
    初一: "七年级",
    初二: "八年级",
    初三: "九年级",
}

function normalizeFeeStandardGrade(grade: string | undefined): string {
    if (!grade) return "一年级"
    if ((FEE_STANDARD_GRADES as readonly string[]).includes(grade)) {
        return grade
    }
    const mapped = LEGACY_GRADE_TO_FEE_STANDARD[grade]
    if (mapped) return mapped
    return "一年级"
}

function resolveOrderById(orderId: string): Order | undefined {
    return getStoredOrders().find((o) => o.id === orderId) ?? mockOrders.find((o) => o.id === orderId)
}

function initialFeeStandardGrade(
    initialData: LessonFeedbackRecord | undefined,
    orderId: string | undefined,
    studentId: string
): string {
    if (initialData?.feeStandardGrade) {
        const v = initialData.feeStandardGrade
        if ((FEE_STANDARD_GRADES as readonly string[]).includes(v)) {
            return v
        }
        const mapped = LEGACY_GRADE_TO_FEE_STANDARD[v]
        if (mapped) return mapped
    }
    const ord = orderId ? resolveOrderById(orderId) : undefined
    const stu = mockStudents.find((s) => s.id === studentId)
    const g = ord?.grade ?? stu?.grade
    return normalizeFeeStandardGrade(g)
}

function buildCourseSummaryLine(order: Order | null): string {
    if (!order) return ""
    const typeLabel = order.type === OrderType.TRIAL ? "试课" : "正式课"
    const hoursPart =
        order.type === OrderType.REGULAR
            ? `剩余 ${order.remainingHours}/${order.totalHours} 课时`
            : `${order.totalHours} 课时（单次试课）`
    return `${typeLabel} · 订单 ${order.id} · ${hoursPart}`
}

interface FeedbackFormProps {
    studentId: string
    studentName: string
    orderId?: string  // 改为可选
    initialData?: LessonFeedbackRecord
    mode?: 'create' | 'edit'
}

export function FeedbackForm({ studentId, studentName, orderId, initialData, mode = 'create' }: FeedbackFormProps) {
    const router = useRouter()
    const { user } = useAuth()

    // Data Fetching - 优先使用传入的 studentName，如果没有则从 mockStudents 查找
    const studentRecord = React.useMemo(
        () => mockStudents.find((s) => s.id === studentId),
        [studentId]
    )

    const student = React.useMemo(() => {
        if (studentName) {
            return { id: studentId, name: studentName, grade: studentRecord?.grade }
        }
        return (
            studentRecord || {
                id: studentId,
                name: "未知学生",
                grade: undefined as string | undefined,
            }
        )
    }, [studentId, studentName, studentRecord])

    const order = React.useMemo(() => (orderId ? resolveOrderById(orderId) ?? null : null), [orderId])

    const [campusName, setCampusName] = React.useState(order?.campusName || "")
    const [campusAccount, setCampusAccount] = React.useState(order?.campusAccount || "")
    const [studentAccount, setStudentAccount] = React.useState(order?.studentAccount || "")
    const [gAccountScreenshots, setGAccountScreenshots] = React.useState<string[]>(order?.dingbanxueAccountScreenshots || [])

    React.useEffect(() => {
        const o = orderId ? resolveOrderById(orderId) : undefined
        setCampusName(o?.campusName || "")
        setCampusAccount(o?.campusAccount || "")
        setStudentAccount(o?.studentAccount || "")
        setGAccountScreenshots(o?.dingbanxueAccountScreenshots || [])
    }, [orderId])

    // Form State
    const [date, setDate] = React.useState(initialData?.date || format(new Date(), "yyyy-MM-dd"))
    const [startTime, setStartTime] = React.useState(initialData?.startTime || "20:00")
    const [endTime, setEndTime] = React.useState(initialData?.endTime || "21:00")
    const [deductHours, setDeductHours] = React.useState(initialData?.deductHours || "1")
    const [feeStandardGrade, setFeeStandardGrade] = React.useState(() =>
        initialFeeStandardGrade(initialData, orderId, studentId)
    )

    const [studentAttendance, setStudentAttendance] = React.useState(
        initialData?.studentAttendance || DEFAULT_STUDENT_ATTENDANCE
    )
    const [homeworkCompletion, setHomeworkCompletion] = React.useState(
        initialData?.homeworkCompletion || DEFAULT_HOMEWORK_COMPLETION
    )

    const [content, setContent] = React.useState(initialData?.content || "")
    const [methods, setMethods] = React.useState(initialData?.methods || "")
    const [mistakes, setMistakes] = React.useState(initialData?.mistakes || "")
    const [performance, setPerformance] = React.useState(initialData?.performance || "")
    const [homework, setHomework] = React.useState(initialData?.homework || "")

    // Generation State
    const [generatedText, setGeneratedText] = React.useState("")
    const [isGenerating, setIsGenerating] = React.useState(false)
    const [isCopied, setIsCopied] = React.useState(false)
    
    // FeedbackId - 编辑模式使用已有ID，创建模式生成新ID
    const [feedbackId] = React.useState(() => initialData?.id || `fb-${Date.now()}`)

    const hasResolvedOrder = Boolean(orderId && order)

    // Handlers
    const handleGenerate = () => {
        if (!hasResolvedOrder) {
            toast.error("请通过学员详情或「我的学员」中与具体订单关联的入口进入课后反馈，以自动带出订单信息")
            return
        }

        setIsGenerating(true)
        setIsCopied(false)
        
        // Simulate "AI" generation delay
        setTimeout(() => {
            const subjectLine = order?.subject?.trim() || "课程"
            const text = `家长您好，今天的${subjectLine}课堂反馈来啦！
学员名字：${student?.name || '学员'}
学生G账号：${studentAccount || order?.studentAccount || '未设置'}
上课时间：${format(new Date(date), "MM月dd日")} ${startTime}–${endTime}
${subjectLine}教练：${user?.name || '老师'}

学生出勤：${studentAttendance}
作业完成情况：${homeworkCompletion}

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

如有学习相关问题，欢迎随时沟通，我们将持续跟进孩子的学习状态，稳步提升${subjectLine}能力 💪

📣 家长课堂反馈
为持续优化教学体验，诚邀您对本节课进行简单反馈（约10秒完成）：
👉 点击填写反馈：${window.location.origin}/p/feedback/${feedbackId}`
            
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
        if (!hasResolvedOrder) {
            toast.error("请通过关联订单入口进入课后反馈后再提交（学生信息区由订单自动带出）")
            return
        }

        if (!campusName.trim() || !campusAccount.trim() || !studentAccount.trim()) {
            toast.error("请填写校区名称、校区账号、学生G账号（三项必填）")
            return
        }
        if (gAccountScreenshots.length < 1) {
            toast.error("请至少上传1张校区与学员G账号校验结果截图（最多5张）")
            return
        }

        // Mock submission logic
        if (mode === 'create') {
            const newFeedback: LessonFeedbackRecord = {
                id: feedbackId,  // 使用生成时创建的ID
                orderId: orderId,  // 可选，可能为 undefined
                studentId: studentId,
                studentName: student?.name || studentName,  // 保存学生姓名
                teacherId: user?.id || '',
                date,
                startTime,
                endTime,
                deductHours,
                feeStandardGrade,
                studentAttendance,
                homeworkCompletion,
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
            toast.success("反馈已创建")
        } else {
             // Mock update
             toast.success("反馈已更新")
        }

        // Persist campus / G-account / screenshots onto the order（试课、正课均回写）
        if (orderId && order) {
            const all = getStoredOrders()
            const next = all.map((o) =>
                o.id === orderId
                    ? {
                          ...o,
                          campusName: campusName.trim(),
                          campusAccount: campusAccount.trim(),
                          studentAccount: studentAccount.trim(),
                          dingbanxueAccountScreenshots: gAccountScreenshots,
                          updatedAt: new Date(),
                      }
                    : o
            )
            saveStoredOrders(next)
        }
        
        // 返回到我的学员页面的课后反馈列表Tab
        router.push('/my-students?tab=feedbacks')
    }

    if (!student) {
        return <div>学生信息不存在</div>
    }

    const displayGrade = order?.grade?.trim() || studentRecord?.grade || "—"
    const displaySubject = order?.subject?.trim() || "—"
    const displayCourseInfo = order ? buildCourseSummaryLine(order) : "—"

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-6">
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>学生信息</CardTitle>
                        <CardDescription>
                            学生姓名、年级、科目与课程摘要均由当前课后反馈对应的订单自动带出（只读，无需填写）；请在下方补齐校区信息、学员 G 账号与校验截图后再生成与提交反馈。
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {!hasResolvedOrder ? (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                                当前未关联到有效订单（或订单已不存在）。
                                <span className="block mt-1 text-xs text-amber-900/90">
                                    请从「我的学员」学员详情中与具体课时订单关联的「课后反馈」入口进入；下方订单字段将展示为占位符直至入口正确。
                                </span>
                            </div>
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="space-y-1 rounded-md border bg-muted/20 px-3 py-2">
                                <span className="text-xs text-muted-foreground">学生姓名</span>
                                <p className="text-sm font-medium">{student.name}</p>
                            </div>
                            <div className="space-y-1 rounded-md border bg-muted/20 px-3 py-2">
                                <span className="text-xs text-muted-foreground">年级</span>
                                <p className="text-sm font-medium">{displayGrade}</p>
                            </div>
                            <div className="space-y-1 sm:col-span-2 rounded-md border bg-muted/20 px-3 py-2">
                                <span className="text-xs text-muted-foreground">科目</span>
                                <p className="text-sm font-medium">{displaySubject}</p>
                                {hasResolvedOrder && displaySubject === "—" ? (
                                    <p className="text-[11px] text-muted-foreground pt-1">该订单在档案中暂未维护科目，展示为占位符。</p>
                                ) : null}
                            </div>
                            <div className="space-y-1 sm:col-span-2 rounded-md border bg-muted/20 px-3 py-2">
                                <span className="text-xs text-muted-foreground">课程信息</span>
                                <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap min-h-[72px]">
                                    {displayCourseInfo}
                                </p>
                                {hasResolvedOrder ? (
                                    <p className="text-[11px] text-muted-foreground pt-1">
                                        以上为订单类型与课时摘要（只读）。
                                    </p>
                                ) : (
                                    <p className="text-[11px] text-muted-foreground pt-1">关联订单后此处将展示试课 / 正式课与课时概要。</p>
                                )}
                            </div>
                        </div>

                        <Separator className="my-1" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>校区名称<span className="text-destructive"> *</span></Label>
                                <Input
                                    value={campusName}
                                    onChange={(e) => setCampusName(e.target.value)}
                                    placeholder="例如：上海浦东校区"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>校区账号<span className="text-destructive"> *</span></Label>
                                <Input
                                    value={campusAccount}
                                    onChange={(e) => setCampusAccount(e.target.value)}
                                    placeholder="例如：pd002"
                                />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                                <Label>学生G账号<span className="text-destructive"> *</span></Label>
                                <Input
                                    value={studentAccount}
                                    onChange={(e) => setStudentAccount(e.target.value)}
                                    placeholder="例如：G2026xxxx"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>校区与学员G账号校验结果截图（1–5张）<span className="text-destructive"> *</span></Label>
                            <VoucherUpload
                                vouchers={gAccountScreenshots}
                                onUpload={(base64) => setGAccountScreenshots((prev) => [...prev, base64])}
                                onRemove={(index) => setGAccountScreenshots((prev) => prev.filter((_, i) => i !== index))}
                            />
                        </div>
                    </CardContent>
                </Card>

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

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="deduct">扣除课时</Label>
                            <Select value={deductHours} onValueChange={setDeductHours}>
                                <SelectTrigger id="deduct">
                                    <SelectValue placeholder="选择课时" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">0 课时</SelectItem>
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
                            <Label htmlFor="fee-standard">课费标准</Label>
                            <Select value={feeStandardGrade} onValueChange={setFeeStandardGrade}>
                                <SelectTrigger id="fee-standard">
                                    <SelectValue placeholder="选择课费标准" />
                                </SelectTrigger>
                                <SelectContent>
                                    {FEE_STANDARD_GRADES.map((g) => (
                                        <SelectItem key={g} value={g}>
                                            {g}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="student-attendance">学生出勤</Label>
                        <Select value={studentAttendance} onValueChange={setStudentAttendance}>
                            <SelectTrigger id="student-attendance">
                                <SelectValue placeholder="选择出勤情况" />
                            </SelectTrigger>
                            <SelectContent>
                                {STUDENT_ATTENDANCE_OPTIONS.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="homework-completion">上次作业情况</Label>
                        <Select value={homeworkCompletion} onValueChange={setHomeworkCompletion}>
                            <SelectTrigger id="homework-completion">
                                <SelectValue placeholder="选择作业完成情况" />
                            </SelectTrigger>
                            <SelectContent>
                                {HOMEWORK_COMPLETION_OPTIONS.map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
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
                                生成并保存
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
            </div>

            {/* Right Column: Preview & Action */}
            <div className="space-y-6">
                <Card className="h-full flex flex-col">
                    <CardHeader>
                            <CardTitle>反馈预览</CardTitle>
                            <CardDescription>生成后可编辑内容，编辑完成后可复制发送到微信群。</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[400px]">
                        {generatedText ? (
                            <Textarea
                                value={generatedText}
                                onChange={(e) => setGeneratedText(e.target.value)}
                                className="h-full min-h-[400px] resize-none text-sm leading-relaxed font-mono"
                                placeholder="编辑反馈内容..."
                            />
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
                            <Send className="mr-2 h-4 w-4" /> {mode === 'create' ? '返回' : '返回'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
