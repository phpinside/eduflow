"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Save } from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import {
  getStoredOrders,
  getStoredStudents,
  getStoredTrialPrepSubmissions,
  saveStoredTrialPrepSubmissions,
} from "@/lib/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import type { TrialPrepSubmission } from "@/types"

export default function TrialPrepPage() {
  const params = useParams<{ orderId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const orderId = params.orderId
  const [orders] = React.useState(() => getStoredOrders())
  const [students] = React.useState(() => getStoredStudents())
  const [submissions, setSubmissions] = React.useState<TrialPrepSubmission[]>(() => getStoredTrialPrepSubmissions())

  const order = orders.find((item) => item.id === orderId)
  const student = students.find((item) => item.id === order?.studentId)
  const existing = submissions.find((item) => item.orderId === orderId && item.tutorId === (order?.assignedTeacherId ?? user?.id))

  const [diagnosisNotes, setDiagnosisNotes] = React.useState(existing?.diagnosisNotes ?? "")
  const [teachingGoals, setTeachingGoals] = React.useState(existing?.teachingGoals ?? "")
  const [lessonPlanText, setLessonPlanText] = React.useState(existing?.lessonPlanText ?? "")
  const [attachmentsText, setAttachmentsText] = React.useState((existing?.attachments ?? []).join("\n"))

  if (!order) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回工作台
          </Link>
        </Button>
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">未找到对应试课订单</CardContent>
        </Card>
      </div>
    )
  }

  const saveSubmission = (status: TrialPrepSubmission["status"]) => {
    if (status === "SUBMITTED") {
      if (!diagnosisNotes.trim() || !teachingGoals.trim()) {
        toast.error("请填写诊断要点和教学目标")
        return
      }
      if (!lessonPlanText.trim() && !attachmentsText.trim()) {
        toast.error("请填写教案正文或上传/填写附件名称")
        return
      }
    }

    const now = new Date()
    const tutorId = order.assignedTeacherId ?? user?.id ?? ""
    const nextSubmission: TrialPrepSubmission = {
      id: existing?.id ?? `trial-prep-${orderId}-${tutorId}`,
      orderId,
      tutorId,
      diagnosisNotes,
      teachingGoals,
      lessonPlanText,
      attachments: attachmentsText.split("\n").map((item) => item.trim()).filter(Boolean),
      status,
      submittedAt: status === "SUBMITTED" ? now : existing?.submittedAt,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    }

    const next = existing
      ? submissions.map((item) => item.id === existing.id ? nextSubmission : item)
      : [nextSubmission, ...submissions]

    setSubmissions(next)
    saveStoredTrialPrepSubmissions(next)
    toast.success(status === "SUBMITTED" ? "备课教案已提交，工作台任务会自动减少" : "备课草稿已保存")
    if (status === "SUBMITTED") {
      router.push("/")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回工作台
            </Link>
          </Button>
          <h2 className="mt-4 text-3xl font-bold tracking-tight">提交试课备课</h2>
          <p className="mt-1 text-muted-foreground">
            系统会以“已提交备课资料”作为试课备课任务的完成依据。
          </p>
        </div>
        <Badge variant={existing?.status === "SUBMITTED" ? "default" : "secondary"}>
          {existing?.status === "SUBMITTED" ? "已提交" : existing ? "草稿" : "未提交"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>试课信息</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-3">
          <div><span className="text-muted-foreground">学生：</span>{student?.name ?? order.studentId}</div>
          <div><span className="text-muted-foreground">科目：</span>{order.subject} / {order.grade}</div>
          <div><span className="text-muted-foreground">试课时间：</span>{order.scheduledAt ? new Date(order.scheduledAt).toLocaleString("zh-CN") : "未排期"}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>备课教案资料</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>诊断要点 <span className="text-red-500">*</span></Label>
            <Textarea value={diagnosisNotes} onChange={(event) => setDiagnosisNotes(event.target.value)} placeholder="记录学生当前基础、薄弱点、试课诊断题安排" />
          </div>
          <div className="space-y-2">
            <Label>教学目标 <span className="text-red-500">*</span></Label>
            <Textarea value={teachingGoals} onChange={(event) => setTeachingGoals(event.target.value)} placeholder="说明本次试课要达成的课堂目标和家长沟通重点" />
          </div>
          <div className="space-y-2">
            <Label>教案正文</Label>
            <Textarea value={lessonPlanText} onChange={(event) => setLessonPlanText(event.target.value)} placeholder="可粘贴教案正文；若填写附件名称，也可留空" />
          </div>
          <div className="space-y-2">
            <Label>附件名称/链接（一行一个）</Label>
            <Input value={attachmentsText} onChange={(event) => setAttachmentsText(event.target.value)} placeholder="试课教案-张同学.docx" />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => saveSubmission("DRAFT")}>
              <Save className="mr-2 h-4 w-4" />
              保存草稿
            </Button>
            <Button onClick={() => saveSubmission("SUBMITTED")}>提交备课资料</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
