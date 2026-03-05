"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  ArrowLeft,
  User as UserIcon,
  Phone,
  BookOpen,
  GraduationCap,
  Building2,
  CalendarDays,
  FileText,
  CreditCard,
  Clock,
  ArrowRight,
  RefreshCw,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { OrderStatus, OrderType } from "@/types"

const STATUS_MAP: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "待接单",
  [OrderStatus.ASSIGNED]: "已分配",
  [OrderStatus.IN_PROGRESS]: "进行中",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.CANCEL_REQUESTED]: "取消申请中",
}

const STATUS_COLOR_MAP: Record<
  OrderStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  [OrderStatus.PENDING]: "secondary",
  [OrderStatus.ASSIGNED]: "default",
  [OrderStatus.IN_PROGRESS]: "default",
  [OrderStatus.COMPLETED]: "outline",
  [OrderStatus.CANCELLED]: "destructive",
  [OrderStatus.CANCEL_REQUESTED]: "destructive",
}

const DAY_MAP: Record<string, string> = {
  monday: "周一",
  tuesday: "周二",
  wednesday: "周三",
  thursday: "周四",
  friday: "周五",
  saturday: "周六",
  sunday: "周日",
}

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
        {value != null && value !== "" ? (
          value
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
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

export default function OrderDetailsPage() {
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

  const [isRenewOpen, setIsRenewOpen] = React.useState(false)
  const [renewHours, setRenewHours] = React.useState(40)

  const handleRenewOrder = () => {
    if (!order) return
    const pricePerHour = 200
    const totalCost = pricePerHour * renewHours
    const queryParams = new URLSearchParams({
      type: "renew",
      studentName: student?.name || "未知学生",
      subject: order.subject,
      grade: order.grade,
      totalHours: renewHours.toString(),
      price: totalCost.toString(),
    }).toString()
    setIsRenewOpen(false)
    router.push(`/regular-course/payment?${queryParams}`)
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

  const examScore =
    order.lastExamScore && order.examMaxScore
      ? `${order.lastExamScore}/${order.examMaxScore}`
      : order.lastExamScore

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold tracking-tight">订单详情</h1>
            <Badge variant={STATUS_COLOR_MAP[order.status]}>
              {STATUS_MAP[order.status]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            订单号：{order.id}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {isTrial && order.status === OrderStatus.COMPLETED && (
            <Button
              size="sm"
              onClick={() => {
                const p = new URLSearchParams({
                  studentName: student?.name || "未知学生",
                  subject: order.subject,
                  grade: order.grade,
                }).toString()
                router.push(`/trial-lesson/deal-payment?${p}`)
              }}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              转正课
            </Button>
          )}

          {!isTrial &&
            order.status !== OrderStatus.CANCELLED &&
            order.status !== OrderStatus.CANCEL_REQUESTED && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => setIsRenewOpen(true)}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                续费
              </Button>
            )}
        </div>
      </div>

      {/* 订单全字段信息 */}
      <Card>
        <CardContent className="pt-6 space-y-6">

          {/* 基本信息 */}
          <div>
            <SectionTitle
              icon={<BookOpen className="h-4 w-4" />}
              title="基本信息"
            />
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="科目" value={order.subject} />
              <Field label="年级" value={order.grade} />
              <Field label="学生姓名" value={student?.name} />
              <Field label="性别" value={student?.gender} />
              <Field
                label="地区"
                value={student?.address}
                className="col-span-2"
              />
              <Field
                label="学校名称"
                value={student?.school}
                className="col-span-2"
              />
            </div>
          </div>

          <Separator />

          {/* 学习情况 */}
          <div>
            <SectionTitle
              icon={<GraduationCap className="h-4 w-4" />}
              title="学习情况"
            />
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="最近一次考试成绩" value={examScore} />
              <Field label="教材版本" value={order.textbookVersion} />
              <Field
                label="校内学习进度"
                value={order.schoolProgress}
                className="col-span-2"
              />
              <Field
                label="其它科平均成绩"
                value={order.otherSubjectsAvgScore}
              />
              <Field
                label="补过什么类型的课"
                value={order.previousTutoringTypes}
              />
            </div>
          </div>

          <Separator />

          {/* 家长信息 */}
          <div>
            <SectionTitle
              icon={<Phone className="h-4 w-4" />}
              title="家长信息"
            />
            <Field label="家长手机号" value={student?.parentPhone} />
          </div>

          <Separator />

          {/* 校区信息 */}
          <div>
            <SectionTitle
              icon={<Building2 className="h-4 w-4" />}
              title="校区信息"
            />
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <Field label="校区名称" value={order.campusName} />
              <Field label="校区账号" value={order.campusAccount} />
            </div>
          </div>

          <Separator />

          {/* 试课时间 / 课程安排 */}
          {isTrial ? (
            <div>
              <SectionTitle
                icon={<CalendarDays className="h-4 w-4" />}
                title="试课时间"
              />
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
              <SectionTitle
                icon={<CalendarDays className="h-4 w-4" />}
                title="课程安排"
              />
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <Field
                    label="总课时"
                    value={
                      order.totalHours ? `${order.totalHours} 课时` : undefined
                    }
                  />
                  <Field
                    label="剩余课时"
                    value={
                      order.remainingHours != null
                        ? `${order.remainingHours} 课时`
                        : undefined
                    }
                  />
                </div>
                <div className="space-y-0.5">
                  <div className="text-xs text-muted-foreground">上课时间</div>
                  {order.weeklySchedule && order.weeklySchedule.length > 0 ? (
                    <div className="space-y-1 pt-0.5">
                      {order.weeklySchedule.map((s, i) => (
                        <div key={i} className="text-sm font-medium">
                          {DAY_MAP[s.day] || s.day}｜{s.startTime}-{s.endTime}
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
            <SectionTitle
              icon={<FileText className="h-4 w-4" />}
              title="备注"
            />
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

      {/* 支付记录 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CreditCard className="h-5 w-5" /> 订单及支付信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {order.transactions && order.transactions.length > 0 ? (
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-3">
                  支付记录
                </h4>
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>说明</TableHead>
                        <TableHead>支付金额</TableHead>
                        <TableHead>增加课时</TableHead>
                        <TableHead className="text-right">时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {order.transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell className="font-medium">
                            {tx.type === "INITIAL" ? "首次下单" : "续费"}
                          </TableCell>
                          <TableCell>¥{tx.amount.toLocaleString()}</TableCell>
                          <TableCell>{tx.hours} 课时</TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {format(new Date(tx.createdAt), "yyyy-MM-dd HH:mm", {
                              locale: zhCN,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">订单金额</span>
                  <div className="text-xl font-bold text-primary">
                    ¥{order.price.toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">说明</span>
                  <div className="font-medium">首次下单</div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">下单时间</span>
                  <div className="font-medium flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {format(new Date(order.createdAt), "yyyy-MM-dd HH:mm", {
                      locale: zhCN,
                    })}
                  </div>
                </div>
              </div>
            )}

            {order.transactions && (
              <div className="grid grid-cols-2 gap-6 text-sm pt-4 border-t">
                <div className="space-y-1">
                  <span className="text-muted-foreground">累计总金额</span>
                  <div className="text-xl font-bold text-primary">
                    ¥
                    {order.transactions
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString()}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">累计总课时</span>
                  <div className="font-medium">
                    {order.transactions.reduce((sum, t) => sum + t.hours, 0)}{" "}
                    课时
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 续费对话框 */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>正课续费</DialogTitle>
            <DialogDescription>
              为学生 {student?.name} 的 {order?.subject} 课程续费。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="hours">续费课时数</Label>
              <Input
                id="hours"
                type="number"
                min={1}
                value={renewHours}
                onChange={(e) => setRenewHours(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
              <span className="text-sm text-muted-foreground">预计费用</span>
              <span className="font-bold text-lg">
                ¥{(200 * renewHours).toLocaleString()}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenewOpen(false)}>
              取消
            </Button>
            <Button onClick={handleRenewOrder}>确认并支付</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
