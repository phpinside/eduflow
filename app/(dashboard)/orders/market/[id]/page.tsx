"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { addMinutes, differenceInSeconds } from "date-fns"
import {
  ArrowLeft,
  Phone,
  BookOpen,
  GraduationCap,
  Building2,
  CalendarDays,
  FileText,
  MapPin,
  User,
  Clock,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { OrderStatus, OrderType } from "@/types"
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP } from "@/lib/order-constants"

const ORDER_TIMEOUT_MINUTES = 30


function Field({
  label,
  value,
  className,
}: {
  label: string
  value?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-0.5 ${className ?? ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium min-h-[1.25rem]">
        {value != null && value !== "" ? value : <span className="text-muted-foreground/50">—</span>}
      </div>
    </div>
  )
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-3">
      <span className="text-muted-foreground">{icon}</span>
      {title}
    </div>
  )
}

export default function MarketOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const order = React.useMemo(
    () => mockOrders.find((o) => o.id === id),
    [id]
  )

  const student = React.useMemo(
    () => (order ? mockStudents.find((s) => s.id === order.studentId) : null),
    [order]
  )

  const [now, setNow] = React.useState(new Date())
  const [isApplied, setIsApplied] = React.useState(false)

  const deadline = React.useMemo(() => {
    if (!order) return new Date()
    return addMinutes(new Date(order.createdAt), ORDER_TIMEOUT_MINUTES)
  }, [order])

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleApply = () => {
    if (now > deadline) {
      toast.error("接单时间已截止")
      return
    }
    setIsApplied(true)
    toast.success("申请成功！请等待系统派单")
  }

  const handleCancelApply = () => {
    if (now > deadline) {
      toast.error("倒计时已结束，无法取消")
      return
    }
    setIsApplied(false)
    toast.success("已取消申请")
  }

  const Countdown = () => {
    const diff = differenceInSeconds(deadline, now)
    if (diff <= 0)
      return <span className="text-muted-foreground font-medium text-sm">申请已截止</span>

    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return (
      <div className="flex flex-col items-end">
        <span className="text-xs text-muted-foreground">接单倒计时</span>
        <span className="text-orange-600 font-mono font-bold text-lg">
          {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
        </span>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">未找到订单</h2>
        <p className="text-muted-foreground">该订单不存在或已被删除</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回列表
        </Button>
      </div>
    )
  }

  const isTrial = order.type === OrderType.TRIAL

  const dayLabels: Record<string, string> = {
    monday: "周一",
    tuesday: "周二",
    wednesday: "周三",
    thursday: "周四",
    friday: "周五",
    saturday: "周六",
    sunday: "周日",
  }

  const examScore =
    order.lastExamScore && order.examMaxScore
      ? `${order.lastExamScore}/${order.examMaxScore}`
      : order.lastExamScore

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight">
              {isTrial ? "试听课" : "正式课"}订单
            </h1>
            <Badge variant={ORDER_STATUS_COLOR_MAP[order.status]}>
              {ORDER_STATUS_MAP[order.status]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">订单号：{order.id}</p>
        </div>

        <Countdown />

        <div className="flex gap-2 shrink-0">
          {isApplied ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelApply}
              disabled={now > deadline}
            >
              取消申请
            </Button>
          ) : (
            <Button size="sm" onClick={handleApply} disabled={now > deadline}>
              {now > deadline ? "已截止" : "立即申请"}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardContent className="pt-6 space-y-6">

          {/* 基本信息 */}
          <div>
            <SectionTitle icon={<BookOpen className="h-4 w-4" />} title="基本信息" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="科目" value={order.subject} />
              <Field label="年级" value={order.grade} />
              <Field label="学生姓名" value={student?.name} />
              <Field label="性别" value={student?.gender} />
              <Field label="地区" value={student?.address} className="col-span-2" />
              <Field label="学校名称" value={student?.school} className="col-span-2" />
            </div>
          </div>

          <Separator />

          {/* 学习情况 */}
          <div>
            <SectionTitle icon={<GraduationCap className="h-4 w-4" />} title="学习情况" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="最近一次考试成绩" value={examScore} />
              <Field label="教材版本" value={order.textbookVersion} />
              <Field label="校内学习进度" value={order.schoolProgress} className="col-span-2" />
              <Field label="其它科平均成绩" value={order.otherSubjectsAvgScore} />
              <Field label="补过什么类型的课" value={order.previousTutoringTypes} />
            </div>
          </div>

          <Separator />

        

          {/* 校区信息 */}
          <div>
            <SectionTitle icon={<Building2 className="h-4 w-4" />} title="校区信息" />
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="校区名称" value={order.campusName} />
              <Field label="校区账号" value={order.campusAccount} />
              {!isTrial && (
                <Field label="学生账号" value={order.studentAccount} />
              )}
            </div>
          </div>

          <Separator />

          {/* 试课时间 / 课程安排 */}
          {isTrial ? (
            <div>
              <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="试课时间" />
              <div className="space-y-4">
                {[0, 1, 2].map((i) => (
                  <Field
                    key={i}
                    label={`试课时间${i + 1}`}
                    value={order.trialTimeSlots?.[i]?.replace(/-\d{1,2}:\d{2}$/, "").trim()}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div>
              <SectionTitle icon={<CalendarDays className="h-4 w-4" />} title="课程安排" />
              <div className="space-y-4">
                <Field
                  label="总课时"
                  value={order.totalHours ? `${order.totalHours} 课时` : undefined}
                />
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">上课时间</div>
                  {order.weeklySchedule && order.weeklySchedule.length > 0 ? (
                    <div className="space-y-1 pt-0.5">
                      {order.weeklySchedule.map((s, i) => (
                        <div key={i} className="text-sm font-medium">
                          {dayLabels[s.day] || s.day}｜{s.startTime}-{s.endTime}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm font-medium min-h-[1.25rem]">
                      <span className="text-muted-foreground/50">—</span>
                    </div>
                  )}
                </div>
                <Field label="首次课时间" value={order.firstLessonTime} />
              </div>
            </div>
          )}

          <Separator />

          {/* 备注 */}
          <div>
            <SectionTitle icon={<FileText className="h-4 w-4" />} title="备注" />
            <div className="text-sm whitespace-pre-line leading-relaxed">
              {order.remarks ? (
                order.remarks
              ) : (
                <span className="text-muted-foreground/50">—</span>
              )}
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}
