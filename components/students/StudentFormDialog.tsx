"use client"

import * as React from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export interface StudentFormData {
    id?: string
    studentAccount: string
    studentName: string
    grade: string
    subject: string
    totalHours: string
    remainingHours: string
    campusAccount: string
    remarks: string
}

interface StudentFormDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: StudentFormData
    onSubmit: (data: StudentFormData) => void
}

const GRADES = [
    "幼儿园",
    "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
    "初一", "初二", "初三",
    "高一", "高二", "高三",
]

const SUBJECTS = [
    "语文", "数学", "英语",
    "物理", "化学", "生物",
    "历史", "地理", "政治",
    "科学", "音乐", "美术", "体育",
]

const EMPTY_FORM: StudentFormData = {
    studentAccount: "",
    studentName: "",
    grade: "",
    subject: "",
    totalHours: "",
    remainingHours: "",
    campusAccount: "",
    remarks: "",
}

export function StudentFormDialog({
    open,
    onOpenChange,
    initialData,
    onSubmit,
}: StudentFormDialogProps) {
    const isEdit = !!initialData?.id
    const [form, setForm] = React.useState<StudentFormData>(initialData ?? EMPTY_FORM)
    const [errors, setErrors] = React.useState<Partial<Record<keyof StudentFormData, string>>>({})

    // 每次打开 Dialog 时同步初始数据
    React.useEffect(() => {
        if (open) {
            setForm(initialData ?? EMPTY_FORM)
            setErrors({})
        }
    }, [open, initialData])

    const set = (field: keyof StudentFormData) => (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setForm(prev => ({ ...prev, [field]: e.target.value }))
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    const setSelect = (field: keyof StudentFormData) => (value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof StudentFormData, string>> = {}
        if (!form.studentName.trim()) newErrors.studentName = "请输入学员姓名"
        if (!form.grade) newErrors.grade = "请选择年级"
        if (!form.subject) newErrors.subject = "请选择科目"
        if (!form.totalHours.trim()) {
            newErrors.totalHours = "请输入总计课时"
        } else if (isNaN(Number(form.totalHours)) || Number(form.totalHours) <= 0) {
            newErrors.totalHours = "请输入有效的课时数"
        }
        if (form.remainingHours.trim()) {
            if (isNaN(Number(form.remainingHours)) || Number(form.remainingHours) < 0) {
                newErrors.remainingHours = "请输入有效的课时数"
            } else if (Number(form.remainingHours) > Number(form.totalHours)) {
                newErrors.remainingHours = "剩余课时不能超过总计课时"
            }
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!validate()) return
        onSubmit({ ...form, id: initialData?.id })
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? "编辑学员信息" : "新增学员"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-2">
                    {/* 第一行：账号 + 姓名 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="studentAccount">学员账号编码</Label>
                            <Input
                                id="studentAccount"
                                placeholder="如 stu_001"
                                value={form.studentAccount}
                                onChange={set("studentAccount")}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="studentName">
                                学员姓名 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="studentName"
                                placeholder="请输入姓名"
                                value={form.studentName}
                                onChange={set("studentName")}
                                className={errors.studentName ? "border-destructive" : ""}
                            />
                            {errors.studentName && (
                                <p className="text-xs text-destructive">{errors.studentName}</p>
                            )}
                        </div>
                    </div>

                    {/* 第二行：年级 + 科目 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>
                                年级 <span className="text-destructive">*</span>
                            </Label>
                            <Select value={form.grade} onValueChange={setSelect("grade")}>
                                <SelectTrigger className={errors.grade ? "border-destructive" : ""}>
                                    <SelectValue placeholder="请选择年级" />
                                </SelectTrigger>
                                <SelectContent>
                                    {GRADES.map(g => (
                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.grade && (
                                <p className="text-xs text-destructive">{errors.grade}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label>
                                科目 <span className="text-destructive">*</span>
                            </Label>
                            <Select value={form.subject} onValueChange={setSelect("subject")}>
                                <SelectTrigger className={errors.subject ? "border-destructive" : ""}>
                                    <SelectValue placeholder="请选择科目" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SUBJECTS.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.subject && (
                                <p className="text-xs text-destructive">{errors.subject}</p>
                            )}
                        </div>
                    </div>

                    {/* 第三行：总计课时 + 剩余课时 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="totalHours">
                                总计课时 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="totalHours"
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="如 40"
                                value={form.totalHours}
                                onChange={set("totalHours")}
                                className={errors.totalHours ? "border-destructive" : ""}
                            />
                            {errors.totalHours && (
                                <p className="text-xs text-destructive">{errors.totalHours}</p>
                            )}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="remainingHours">剩余课时</Label>
                            <Input
                                id="remainingHours"
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="如 32"
                                value={form.remainingHours}
                                onChange={set("remainingHours")}
                                className={errors.remainingHours ? "border-destructive" : ""}
                            />
                            {errors.remainingHours && (
                                <p className="text-xs text-destructive">{errors.remainingHours}</p>
                            )}
                        </div>
                    </div>

                    {/* 第四行：校区账号 */}
                    <div className="space-y-1.5">
                        <Label htmlFor="campusAccount">校区账号</Label>
                        <Input
                            id="campusAccount"
                            placeholder="如 beijing_01"
                            value={form.campusAccount}
                            onChange={set("campusAccount")}
                        />
                    </div>

                    {/* 备注 */}
                    <div className="space-y-1.5">
                        <Label htmlFor="remarks">备注</Label>
                        <Textarea
                            id="remarks"
                            placeholder="请输入备注信息（选填）"
                            rows={3}
                            value={form.remarks}
                            onChange={set("remarks")}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            取消
                        </Button>
                        <Button type="submit">
                            {isEdit ? "保存修改" : "确认新增"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
