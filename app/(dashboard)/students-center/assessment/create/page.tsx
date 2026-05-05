"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
    ArrowLeft,
    CalendarIcon,
    ImagePlus,
    X,
    TrendingUp,
    TrendingDown,
    Minus,
    ClipboardCheck,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// ── 常量 ─────────────────────────────────────────────────────

const ASSESSMENT_TYPES = [
    { value: "phase", label: "阶段测" },
    { value: "entry", label: "入学测" },
    { value: "mock", label: "模拟考" },
]

const PROBLEM_OPTIONS = [
    { id: "basic", label: "基础不牢" },
    { id: "reading", label: "审题问题" },
    { id: "calculation", label: "计算失误" },
    { id: "method", label: "方法不会用" },
    { id: "careless", label: "粗心" },
]

const CONCLUSION_OPTIONS = [
    { value: "breakthrough", label: "关键突破", color: "emerald" },
    { value: "improved", label: "提升明显", color: "emerald" },
    { value: "no_progress", label: "无明显进步", color: "default" },
    { value: "declined", label: "下降", color: "red" },
    { value: "risk", label: "风险预警", color: "red" },
] as const

// ── 成绩差值 ──────────────────────────────────────────────────

function ScoreDiff({ current, previous }: { current: string; previous: string }) {
    const cur = parseFloat(current)
    const prev = parseFloat(previous)
    if (isNaN(cur) || isNaN(prev) || prev === 0) return null

    const diff = cur - prev
    const pct = ((diff / prev) * 100).toFixed(0)
    const isPositive = diff > 0
    const isZero = diff === 0
    const sign = isPositive ? "+" : ""
    const colorClass = isZero ? "text-muted-foreground" : isPositive ? "text-emerald-600" : "text-destructive"
    const Icon = isZero ? Minus : isPositive ? TrendingUp : TrendingDown

    return (
        <span className={cn("inline-flex items-center gap-1 text-sm font-semibold tabular-nums", colorClass)}>
            <Icon className="h-3.5 w-3.5" />
            {sign}{diff}分（{sign}{pct}%）
        </span>
    )
}

// ── 节标题 ────────────────────────────────────────────────────

function SectionLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-4 flex items-center gap-1">
            {children}
            {required && <span className="text-destructive normal-case tracking-normal text-sm leading-none">*</span>}
        </p>
    )
}

// ── 主页面 ────────────────────────────────────────────────────

export default function AssessmentCreatePage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const studentName = searchParams.get("studentName") ?? ""
    const studentAccount = searchParams.get("studentAccount") ?? ""
    const subject = searchParams.get("subject") ?? ""
    const grade = searchParams.get("grade") ?? ""

    const [assessmentType, setAssessmentType] = React.useState("phase")
    const [assessmentDate, setAssessmentDate] = React.useState<Date>(new Date())
    const [calendarOpen, setCalendarOpen] = React.useState(false)
    const [currentScore, setCurrentScore] = React.useState("")
    const [previousScore, setPreviousScore] = React.useState("")
    const [selectedProblems, setSelectedProblems] = React.useState<Set<string>>(new Set())
    const [conclusion, setConclusion] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [images, setImages] = React.useState<{ file: File; previewUrl: string }[]>([])
    const fileInputRef = React.useRef<HTMLInputElement>(null)
    const [submitting, setSubmitting] = React.useState(false)

    const toggleProblem = (id: string) => {
        setSelectedProblems((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id); else next.add(id)
            return next
        })
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? [])
        setImages((prev) => [...prev, ...files.map((f) => ({ file: f, previewUrl: URL.createObjectURL(f) }))])
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    const removeImage = (index: number) => {
        setImages((prev) => {
            URL.revokeObjectURL(prev[index].previewUrl)
            return prev.filter((_, i) => i !== index)
        })
    }

    const handleSubmit = () => {
        if (!currentScore.trim()) { toast.error("请填写本次成绩"); return }
        if (!conclusion) { toast.error("请选择测评结论"); return }
        if (images.length === 0) { toast.error("请上传至少一张测评图片"); return }
        setSubmitting(true)
        setTimeout(() => { setSubmitting(false); toast.success("测评已提交"); router.back() }, 600)
    }

    return (
        <div className="max-w-2xl mx-auto pb-20 space-y-6">

            {/* ── 页头 ── */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0 -ml-2">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        <h1 className="text-xl font-bold tracking-tight">阶段性测评</h1>
                    </div>
                    {studentName && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                            {studentName}
                            {studentAccount && (
                                <span className="ml-2 font-mono text-xs opacity-70">{studentAccount}</span>
                            )}
                        </p>
                    )}
                </div>
            </div>

            {/* ── 表单主体（单面板） ── */}
            <div className="rounded-2xl border bg-card shadow-sm divide-y divide-border">

                {/* § 学员信息 */}
                <div className="px-6 py-5">
                    <div className="grid grid-cols-4 gap-x-6 gap-y-1">
                        {[
                            { label: "姓名", value: studentName },
                            { label: "G账号", value: studentAccount, mono: true },
                            { label: "科目", value: subject },
                            { label: "年级", value: grade },
                        ].map(({ label, value, mono }) => (
                            <div key={label}>
                                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                                <p className={cn("text-sm font-medium truncate", mono && "font-mono")}>
                                    {value || <span className="opacity-30">—</span>}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* § 测评类型 + 时间 */}
                <div className="px-6 py-5">
                    <div className="flex flex-wrap gap-x-10 gap-y-4">
                     
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">测评时间</p>
                            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 w-[148px] justify-start font-normal"
                                    >
                                        <CalendarIcon className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                                        {format(assessmentDate, "yyyy-MM-dd", { locale: zhCN })}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={assessmentDate}
                                        onSelect={(d) => { if (d) { setAssessmentDate(d); setCalendarOpen(false) } }}
                                        initialFocus
                                        locale={zhCN}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">测评类型</p>
                            <RadioGroup
                                value={assessmentType}
                                onValueChange={setAssessmentType}
                                className="flex gap-5"
                            >
                                {ASSESSMENT_TYPES.map((t) => (
                                    <div key={t.value} className="flex items-center gap-1.5">
                                        <RadioGroupItem value={t.value} id={`type-${t.value}`} />
                                        <Label htmlFor={`type-${t.value}`} className="cursor-pointer text-sm font-normal">
                                            {t.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        
                    </div>
                </div>

                {/* § 成绩 */}
                <div className="px-6 py-5">
                    <SectionLabel required>成绩</SectionLabel>
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-1.5 w-40">
                            <Label htmlFor="cur" className="text-xs text-muted-foreground font-normal" >本次成绩</Label>
                            <Input
                                id="cur"
                                type="number"
                                placeholder="请输入"
                                value={currentScore}
                                onChange={(e) => setCurrentScore(e.target.value)}
                                min={0}
                                className="h-9"
                            />
                        </div>
                        <div className="space-y-1.5 w-40">
                            <Label htmlFor="prev" className="text-xs text-muted-foreground font-normal">
                                上次成绩 <span className="opacity-50">（可选）</span>
                            </Label>
                            <Input
                                id="prev"
                                type="number"
                                placeholder="可手动输入"
                                value={previousScore}
                                onChange={(e) => setPreviousScore(e.target.value)}
                                min={0}
                                className="h-9"
                            />
                        </div>
                        {currentScore && previousScore && (
                            <div className="mb-0.5 flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-1.5 text-sm">
                                <span className="text-xs text-muted-foreground">较上次</span>
                                <ScoreDiff current={currentScore} previous={previousScore} />
                            </div>
                        )}
                    </div>
                </div>


                {/* § 测评结论 */}
                <div className="px-6 py-5">
                    <SectionLabel required>测评结论</SectionLabel>
                    <RadioGroup
                        value={conclusion}
                        onValueChange={setConclusion}
                        className="flex flex-wrap gap-2.5"
                    >
                        {CONCLUSION_OPTIONS.map((opt) => {
                            const isSelected = conclusion === opt.value
                            const isGood = opt.color === "emerald"
                            const isBad = opt.color === "red"
                            return (
                                <label
                                    key={opt.value}
                                    htmlFor={`con-${opt.value}`}
                                    className={cn(
                                        "flex items-center gap-2 cursor-pointer rounded-lg border px-3.5 py-2 text-sm transition-colors select-none",
                                        isSelected && isGood && "border-emerald-400 bg-emerald-50 text-emerald-700 font-medium",
                                        isSelected && isBad && "border-red-400 bg-red-50 text-red-700 font-medium",
                                        isSelected && !isGood && !isBad && "border-primary bg-primary/5 text-primary font-medium",
                                        !isSelected && "text-muted-foreground hover:border-muted-foreground/40"
                                    )}
                                >
                                    <RadioGroupItem value={opt.value} id={`con-${opt.value}`} className="sr-only" />
                                    {opt.label}
                                </label>
                            )
                        })}
                    </RadioGroup>
                </div>

                {/* § 详细说明 */}
                <div className="px-6 py-5">
                    <SectionLabel>测评说明</SectionLabel>
                    <Textarea
                        placeholder="例：本次成绩提升明显，但审题能力仍需加强。建议下阶段重点练习阅读理解类题型，同时注意计算步骤的规范性…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px] resize-none text-sm"
                        maxLength={1000}
                    />
                    <p className="text-xs text-muted-foreground text-right mt-1">{description.length} / 1000</p>
                </div>

                {/* § 测评图片 */}
                <div className="px-6 py-5">
                    <SectionLabel required>测评图片</SectionLabel>
                    <p className="text-xs text-muted-foreground mb-4 -mt-2">
                        请上传试卷或成绩截图，支持多张，提交后可更新。
                    </p>
                    <div className="flex flex-wrap gap-3">
                        {images.map((img, index) => (
                            <div key={index} className="relative group shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={img.previewUrl}
                                    alt={`测评图片 ${index + 1}`}
                                    className="h-24 w-24 rounded-xl object-cover border"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                    aria-label="删除图片"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-muted-foreground/25 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
                        >
                            <ImagePlus className="h-5 w-5" />
                            <span className="text-xs">添加</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
                            className="hidden"
                            onChange={handleImageChange}
                        />
                    </div>
                </div>
            </div>

            {/* ── 底部操作 ── */}
            <div className="sticky bottom-0 z-10 flex justify-end gap-3 rounded-2xl border bg-card/95 backdrop-blur-sm px-5 py-3 shadow-sm">
                <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
                    取消
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} className="min-w-[96px]">
                    {submitting ? "提交中…" : "提交测评"}
                </Button>
            </div>
        </div>
    )
}

// ── 辅助组件 ─────────────────────────────────────────────────

function InfoPill({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
    if (!value) return null
    return (
        <span className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={cn("text-sm font-medium", mono && "font-mono")}>{value}</span>
        </span>
    )
}
