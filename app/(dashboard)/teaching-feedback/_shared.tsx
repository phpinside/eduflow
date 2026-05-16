"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MockAssessmentRecord } from "@/lib/mock-data/assessments"
import { OrderType } from "@/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  TableCell,
  TableRow,
} from "@/components/ui/table"

export const PAGE_SIZE = 10

export const RATING_LABELS = ["", "不满意", "需改进", "一般", "比较满意", "非常满意"]

export const EVALUATION_SECTIONS = [
  {
    title: "课堂效果",
    dotClass: "bg-amber-400",
    bgClass: "border-amber-100 bg-amber-50/60",
    items: [
      { key: "knowledge_absorption", label: "知识吸收程度" },
      { key: "student_explain", label: "学生讲解题目" },
    ],
  },
  {
    title: "教师表现",
    dotClass: "bg-sky-400",
    bgClass: "border-sky-100 bg-sky-50/60",
    items: [
      { key: "professionalism", label: "专业程度" },
      { key: "responsibility", label: "责任心" },
      { key: "patience", label: "耐心程度" },
      { key: "post_feedback", label: "课后反馈" },
    ],
  },
  {
    title: "上课规范",
    dotClass: "bg-emerald-400",
    bgClass: "border-emerald-100 bg-emerald-50/60",
    items: [
      { key: "punctuality", label: "上课守时" },
      { key: "camera", label: "开摄像头" },
    ],
  },
  {
    title: "上课环境",
    dotClass: "bg-rose-400",
    bgClass: "border-rose-100 bg-rose-50/60",
    items: [
      { key: "network", label: "网络状况" },
      { key: "environment", label: "上课环境" },
    ],
  },
]

export interface FeedbackRow {
  id: string
  date: string
  startTime: string
  endTime: string
  content: string
  deductHours: string
  parentFeedback?: {
    rating: number
    tags?: string[]
    evaluation?: Record<string, string>
    remarks?: string
    submittedAt?: Date
  }
  createdAt: Date
  studentName: string
  studentAccount: string
  subject: string
  grade: string
  courseType: OrderType | undefined
  tutorName: string
  tutorPhone: string
  managerName: string
  managerPhone: string
  methods?: string
  mistakes?: string
  performance?: string
  homework?: string
  studentAttendance: string
  homeworkCompletion: string
  orderId?: string
  campusAccount: string
}

export interface AssessmentTableRow extends MockAssessmentRecord {
  studentAccount: string
  courseType?: OrderType
  teacherPhone: string
  campusAccount: string
  managerPhone: string
}

export const ASSESSMENT_PROBLEM_LABELS: Record<string, string> = {
  basic: "基础不牢",
  reading: "审题问题",
  calculation: "计算失误",
  method: "方法不会用",
  careless: "粗心",
}

export function assessmentTypeLabel(t: MockAssessmentRecord["assessmentType"]) {
  if (t === "phase") return "阶段测"
  if (t === "entry") return "入学测"
  return "模拟考"
}

export function assessmentConclusionLabel(c: MockAssessmentRecord["conclusion"]) {
  const map = {
    breakthrough: "关键突破",
    improved: "提升明显",
    no_progress: "无明显进步",
    declined: "下降",
    risk: "风险预警",
  }
  return map[c]
}

export function safeDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

export function DetailRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={cn("font-medium text-right", mono && "font-mono text-xs")}>{value || "—"}</span>
    </div>
  )
}

export function SearchInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
      </div>
    </div>
  )
}

export function SelectBox({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((row) => (
            <SelectItem key={row.value} value={row.value}>
              {row.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

export function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="h-24 text-center text-muted-foreground">
        {text}
      </TableCell>
    </TableRow>
  )
}

export function SimplePagination({
  currentPage,
  totalPages,
  onPageChange,
  hideWhenSingle = true,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  hideWhenSingle?: boolean
}) {
  const effectivePages = Math.max(1, totalPages)
  if (hideWhenSingle && effectivePages <= 1) return null

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage <= 1}
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        上一页
      </Button>
      <span className="text-sm text-muted-foreground">
        第 {currentPage} / {effectivePages} 页
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage >= effectivePages}
        onClick={() => onPageChange(Math.min(effectivePages, currentPage + 1))}
      >
        下一页
        <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  )
}
