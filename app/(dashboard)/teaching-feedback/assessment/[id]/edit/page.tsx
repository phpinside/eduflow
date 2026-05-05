"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
    ArrowLeft,
    CalendarIcon,
    ChevronLeft,
    ChevronRight,
    ClipboardCheck,
    ImagePlus,
    Minus,
    TrendingDown,
    TrendingUp,
    X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import type { MockAssessmentRecord } from "@/lib/mock-data/assessments"
import { getStoredAssessments, saveAssessments } from "@/lib/storage"
import { cn } from "@/lib/utils"

const ASSESSMENT_TYPES = [
    { value: "phase", label: "阶段测" },
    { value: "entry", label: "入学测" },
    { value: "mock", label: "模拟考" },
] as const

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

function safeDate(value: Date | string): Date {
    return value instanceof Date ? value : new Date(value)
}

function mergeDatePreserveTime_calendarOnly(newDay: Date, original: Date): Date {
    const basis = safeDate(original)
    const picked = safeDate(newDay)
    picked.setHours(basis.getHours(), basis.getMinutes(), basis.getSeconds(), basis.getMilliseconds())
    return picked
}

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

function SectionLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
    return (
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 mb-4 flex items-center gap-1">
            {children}
            {required && <span className="text-destructive normal-case tracking-normal text-sm leading-none">*</span>}
        </p>
    )
}

export default function AssessmentEditPage() {
    const router = useRouter()
    const params = useParams()
    const id = typeof params?.id === "string" ? params.id : ""

    const { record, recordIndex, prevId, nextId, totalRecords } = React.useMemo(() => {
        const list = getStoredAssessments()
        const idx = list.findIndex((r) => r.id === id)
        return {
            record: idx >= 0 ? list[idx] : undefined,
            recordIndex: idx,
            prevId: idx > 0 ? (list[idx - 1]?.id ?? null) : null,
            nextId: idx >= 0 && idx < list.length - 1 ? (list[idx + 1]?.id ?? null) : null,
            totalRecords: list.length,
        }
    }, [id])

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

    React.useEffect(() => {
        if (!id) return
        const r = getStoredAssessments().find((x) => x.id === id)
        if (!r) return
        setAssessmentType(r.assessmentType)
        setAssessmentDate(safeDate(r.assessedAt))
        setCurrentScore(r.currentScore ?? "")
        setPreviousScore(r.previousScore ?? "")
        setSelectedProblems(new Set(r.problems ?? []))
        setConclusion(r.conclusion)
        setDescription(r.description ?? "")
        setImages((prev) => {
            prev.forEach((img) => URL.revokeObjectURL(img.previewUrl))
            return []
        })
    }, [id])

    const toggleProblem = (problemId: string) => {
        setSelectedProblems((prev) => {
            const next = new Set(prev)
            if (next.has(problemId)) next.delete(problemId)
            else next.add(problemId)
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

    const handleSave = () => {
        const listFresh = getStoredAssessments()
        const base = listFresh.find((r) => r.id === id)
        if (!base) return
        if (!currentScore.trim()) {
            toast.error("请填写本次成绩")
            return
        }
        if (!conclusion) {
            toast.error("请选择测评结论")
            return
        }

        const mergedAssessedAt = mergeDatePreserveTime_calendarOnly(assessmentDate, safeDate(base.assessedAt))
        const nextRecord: MockAssessmentRecord = {
            ...base,
            assessmentType: assessmentType as MockAssessmentRecord["assessmentType"],
            conclusion: conclusion as MockAssessmentRecord["conclusion"],
            assessedAt: mergedAssessedAt,
            currentScore: currentScore.trim(),
            previousScore: previousScore.trim() || undefined,
            problems: selectedProblems.size > 0 ? Array.from(selectedProblems) : undefined,
            description: description.trim() || undefined,
        }

        const nextList = listFresh.map((r) => (r.id === base.id ? nextRecord : r))
        saveAssessments(nextList)
        setSubmitting(true)
        setTimeout(() => {
            setSubmitting(false)
            toast.success("测评已保存")
            router.back()
        }, 400)
    }

    const goAdjacent = (targetId: string | null) => {
        if (!targetId) return
        router.push(`/teaching-feedback/assessment/${targetId}/edit`)
    }

    if (!record) {
        return (
            <div className="mx-auto max-w-2xl space-y-4 py-10">
                <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    返回
                </Button>
                <p className="text-sm text-muted-foreground">未找到该测评记录，可能已被删除。</p>
            </div>
        )
    }

    const studentDisplayName = record.studentName
    const studentDisplayAccount = record.studentAccount ?? "—"

    return (
        <div className="mx-auto max-w-2xl space-y-6 pb-24">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="-ml-2 shrink-0">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        <h1 className="text-xl font-bold tracking-tight">编辑阶段性测评</h1>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                        {studentDisplayName}
                        <span className="ml-2 font-mono text-xs opacity-70">{studentDisplayAccount}</span>
                    </p>
                </div>
            </div>

            <div className="divide-y divide-border rounded-2xl border bg-card shadow-sm">
                <div className="px-6 py-5">
                    <div className="grid grid-cols-4 gap-x-6 gap-y-1">
                        {[
                            { label: "姓名", value: record.studentName },
                            { label: "G账号", value: studentDisplayAccount, mono: true },
                            { label: "科目", value: record.subject },
                            { label: "年级", value: record.grade },
                        ].map(({ label, value, mono }) => (
                            <div key={label}>
                                <p className="mb-0.5 text-xs text-muted-foreground">{label}</p>
                                <p className={cn("truncate text-sm font-medium", mono && "font-mono")}>
                                    {value || <span className="opacity-30">—</span>}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

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
                                        onSelect={(d) => {
                                            if (d) {
                                                setAssessmentDate(d)
                                                setCalendarOpen(false)
                                            }
                                        }}
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
                                        <RadioGroupItem value={t.value} id={`edit-type-${t.value}`} />
                                        <Label htmlFor={`edit-type-${t.value}`} className="cursor-pointer text-sm font-normal">
                                            {t.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <SectionLabel required>成绩</SectionLabel>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="w-40 space-y-1.5">
                            <Label htmlFor="edit-cur" className="text-xs font-normal text-muted-foreground">
                                本次成绩
                            </Label>
                            <Input
                                id="edit-cur"
                                type="number"
                                placeholder="请输入"
                                value={currentScore}
                                onChange={(e) => setCurrentScore(e.target.value)}
                                min={0}
                                className="h-9"
                            />
                        </div>
                        <div className="w-40 space-y-1.5">
                            <Label htmlFor="edit-prev" className="text-xs font-normal text-muted-foreground">
                                上次成绩 <span className="opacity-50">（可选）</span>
                            </Label>
                            <Input
                                id="edit-prev"
                                type="number"
                                placeholder="可手动输入"
                                value={previousScore}
                                onChange={(e) => setPreviousScore(e.target.value)}
                                min={0}
                                className="h-9"
                            />
                        </div>
                        {currentScore && previousScore ? (
                            <div className="mb-0.5 flex items-center gap-1.5 rounded-md bg-muted/50 px-3 py-1.5 text-sm">
                                <span className="text-xs text-muted-foreground">较上次</span>
                                <ScoreDiff current={currentScore} previous={previousScore} />
                            </div>
                        ) : null}
                    </div>
                </div>

                <div className="px-6 py-5">
                    <SectionLabel>失分归因（可多选）</SectionLabel>
                    <div className="flex flex-wrap gap-4">
                        {PROBLEM_OPTIONS.map((opt) => (
                            <div key={opt.id} className="flex items-center gap-2">
                                <Checkbox
                                    id={`prob-${opt.id}`}
                                    checked={selectedProblems.has(opt.id)}
                                    onCheckedChange={() => toggleProblem(opt.id)}
                                />
                                <Label htmlFor={`prob-${opt.id}`} className="cursor-pointer text-sm font-normal">
                                    {opt.label}
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>

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
                                    htmlFor={`edit-con-${opt.value}`}
                                    className={cn(
                                        "flex cursor-pointer select-none items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors",
                                        isSelected && isGood && "border-emerald-400 bg-emerald-50 font-medium text-emerald-700",
                                        isSelected && isBad && "border-red-400 bg-red-50 font-medium text-red-700",
                                        isSelected && !isGood && !isBad && "border-primary bg-primary/5 font-medium text-primary",
                                        !isSelected && "text-muted-foreground hover:border-muted-foreground/40",
                                    )}
                                >
                                    <RadioGroupItem value={opt.value} id={`edit-con-${opt.value}`} className="sr-only" />
                                    {opt.label}
                                </label>
                            )
                        })}
                    </RadioGroup>
                </div>

                <div className="px-6 py-5">
                    <SectionLabel>测评说明</SectionLabel>
                    <Textarea
                        placeholder="例：本次成绩提升明显，但审题能力仍需加强…"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="min-h-[100px] resize-none text-sm"
                        maxLength={1000}
                    />
                    <p className="mt-1 text-right text-xs text-muted-foreground">{description.length} / 1000</p>
                </div>

                <div className="px-6 py-5">
                    <SectionLabel>测评图片</SectionLabel>
                    <p className="-mt-2 mb-4 text-xs text-muted-foreground">可补充上传截图；原型中暂不展示历史图片。</p>
                    <div className="flex flex-wrap gap-3">
                        {images.map((img, index) => (
                            <div key={img.previewUrl} className="group relative shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={img.previewUrl}
                                    alt={`测评图片 ${index + 1}`}
                                    className="h-24 w-24 rounded-xl border object-cover"
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(index)}
                                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
                                    aria-label="删除图片"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
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

            <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-card/95 px-5 py-3 shadow-sm backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" disabled={prevId === null || submitting} onClick={() => goAdjacent(prevId)}>
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        上一条
                    </Button>
                    <Button variant="outline" size="sm" disabled={nextId === null || submitting} onClick={() => goAdjacent(nextId)}>
                        下一条
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                    {recordIndex >= 0 ? (
                        <span className="text-sm text-muted-foreground">
                            第 {recordIndex + 1} / {totalRecords} 条
                        </span>
                    ) : null}
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => router.back()} disabled={submitting}>
                        取消
                    </Button>
                    <Button onClick={handleSave} disabled={submitting} className="min-w-[96px]">
                        {submitting ? "保存中…" : "保存修改"}
                    </Button>
                </div>
            </div>
        </div>
    )
}
