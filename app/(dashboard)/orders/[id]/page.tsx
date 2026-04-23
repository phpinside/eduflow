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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { mockStudents } from "@/lib/mock-data/students"
import { getStoredOrders, saveStoredOrders, getStoredRefundApplications, saveRefundApplications, getStoredRefundOperationLogs, saveRefundOperationLogs } from "@/lib/storage"
import { useAuth } from "@/contexts/AuthContext"
import { RefundApplyDialog } from "@/components/refund/refund-apply-dialog"
import {
  canSalesApplyRefund,
  canSalesWithdraw,
  createRefundLog,
  findActiveRefundApplication,
} from "@/lib/refund-domain"
import { getLatestUnitPriceByGrade } from "@/lib/course-pricing"
import type { Order, RefundApplication } from "@/types"
import { OrderStatus, OrderType, RefundApplicationStatus } from "@/types"
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP } from "@/lib/order-constants"



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
  const { user } = useAuth()

  const [order, setOrder] = React.useState<Order | undefined>(undefined)
  const [orders, setOrders] = React.useState<Order[]>([])
  const [refundApplications, setRefundApplications] = React.useState<RefundApplication[]>([])
  const [refundDialogOpen, setRefundDialogOpen] = React.useState(false)

  React.useEffect(() => {
    const all = getStoredOrders()
    setOrders(all)
    setOrder(all.find((o) => o.id === id))
    setRefundApplications(getStoredRefundApplications())
  }, [id])

  const student = React.useMemo(
    () => (order ? mockStudents.find((s) => s.id === order.studentId) : null),
    [order]
  )

  const [isRenewOpen, setIsRenewOpen] = React.useState(false)
  const [renewHours, setRenewHours] = React.useState(40)
  const [renewGrade, setRenewGrade] = React.useState("初一")

  const handleRenewOrder = () => {
    if (!order) return
    const pricePerHour = getLatestUnitPriceByGrade(renewGrade)
    const totalCost = pricePerHour * renewHours
    const queryParams = new URLSearchParams({
      type: "renew",
      studentName: student?.name || "未知学生",
      subject: order.subject,
      grade: renewGrade,
      totalHours: renewHours.toString(),
      price: totalCost.toString(),
    }).toString()
    setIsRenewOpen(false)
    router.push(`/regular-course/payment?${queryParams}`)
  }

  const activeRefund = findActiveRefundApplication(refundApplications, String(id))
  const latestRejected = [...refundApplications]
    .filter((a) => a.orderId === id && a.status === RefundApplicationStatus.FIRST_REJECTED)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]

  const handleWithdrawRefund = () => {
    if (!order || !user) return
    const app = findActiveRefundApplication(refundApplications, order.id)
    if (!canSalesWithdraw(app)) return
    const now = new Date()
    const nextApps = refundApplications.map((a) =>
      a.id === app!.id
        ? { ...a, status: RefundApplicationStatus.WITHDRAWN, updatedAt: now }
        : a
    )
    const nextOrders = orders.map((o) =>
      o.id === order.id ? { ...o, refundFreezeActive: false, updatedAt: now } : o
    )
    const logs = [
      ...getStoredRefundOperationLogs(),
      createRefundLog({
        refundApplicationId: app!.id,
        orderId: order.id,
        actorRole: "SALES",
        actorUserId: user.id,
        actorName: user.name,
        action: "撤销退费申请",
        detail: "一审处理前招生老师主动撤销",
      }),
    ]
    saveRefundApplications(nextApps)
    saveStoredOrders(nextOrders)
    saveRefundOperationLogs(logs)
    setRefundApplications(nextApps)
    setOrders(nextOrders)
    setOrder(nextOrders.find((o) => o.id === id))
    toast.success("已撤销申请，课时已解冻")
  }

  // === 新增：模拟支付功能 ===
  const handleSimulatePayment = () => {
    if (!order) return
    
    const confirmed = confirm(`模拟支付：确认完成订单 ${order.id} 的支付？\n金额：¥${order.price.toLocaleString()}`)
    if (!confirmed) return
    
    const now = new Date()
    const updatedOrder = {
      ...order,
      isPaid: true,
      status: OrderStatus.PENDING_CS_REVIEW,
      updatedAt: now
    }
    
    const nextOrders = orders.map(o => o.id === order.id ? updatedOrder : o)
    saveStoredOrders(nextOrders)
    setOrders(nextOrders)
    setOrder(updatedOrder)
    
    toast.success('支付成功！订单已进入客服审核流程')
  }

  // === 新增：提交草稿订单 ===
  const handleSubmitDraft = () => {
    if (!order) return
    
    const confirmed = confirm('确认提交此草稿订单？提交后将进入待支付状态。')
    if (!confirmed) return
    
    const now = new Date()
    const updatedOrder = {
      ...order,
      status: OrderStatus.PENDING_PAYMENT,
      isPaid: false,
      updatedAt: now
    }
    
    const nextOrders = orders.map(o => o.id === order.id ? updatedOrder : o)
    saveStoredOrders(nextOrders)
    setOrders(nextOrders)
    setOrder(updatedOrder)
    
    toast.success('订单已提交，等待支付')
  }

  // === 新增：删除草稿订单 ===
  const handleDeleteDraft = () => {
    if (!order) return
    
    const confirmed = confirm('确认删除此草稿订单？此操作不可恢复。')
    if (!confirmed) return
    
    const nextOrders = orders.filter(o => o.id !== order.id)
    saveStoredOrders(nextOrders)
    
    toast.success('草稿订单已删除')
    router.push('/orders')
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
            <Badge variant={ORDER_STATUS_COLOR_MAP[order.status]}>
              {ORDER_STATUS_MAP[order.status]}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            订单号：{order.id}
          </p>
        </div>

        <div className="flex gap-2 shrink-0">
          {/* 草稿状态：显示保存、提交、删除按钮 */}
          {order.status === OrderStatus.DRAFT && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => toast.info('草稿自动保存功能待实现')}
              >
                保存草稿
              </Button>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={handleSubmitDraft}
              >
                提交订单
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeleteDraft}
              >
                删除
              </Button>
            </>
          )}
          
          {/* 待支付状态：显示去支付按钮 */}
          {order.status === OrderStatus.PENDING_PAYMENT && (
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSimulatePayment}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              去支付
            </Button>
          )}
          
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
            order.status !== OrderStatus.CANCEL_REQUESTED &&
            order.status !== OrderStatus.REFUNDED &&
            !order.refundFreezeActive && (
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => {
                  setRenewGrade(order.grade)
                  setIsRenewOpen(true)
                }}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                续费
              </Button>
            )}

          {user &&
            order.salesPersonId === user.id &&
            canSalesApplyRefund(order, refundApplications) && (
              <Button size="sm" variant="outline" onClick={() => setRefundDialogOpen(true)}>
                申请退费
              </Button>
            )}

          {user &&
            order.salesPersonId === user.id &&
            canSalesWithdraw(activeRefund) && (
              <Button size="sm" variant="secondary" onClick={handleWithdrawRefund}>
                撤销退费申请
              </Button>
            )}
        </div>
      </div>

      {(order.refundFreezeActive || activeRefund) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {order.refundFreezeActive && (
            <p>本单课时已因退费申请冻结，在审核结束（通过并完成退款、驳回或您主动撤销）前不可排课消耗。</p>
          )}
          {activeRefund?.status === RefundApplicationStatus.PENDING_FIRST_REVIEW && (
            <p className="mt-1">当前状态：一审待审。审核约 2–3 个工作日；通过后原路退回约 3–5 个工作日。</p>
          )}
          {activeRefund?.status === RefundApplicationStatus.PENDING_SECOND_REVIEW && (
            <p className="mt-1">当前状态：二审待审。</p>
          )}
        </div>
      )}

      {latestRejected?.firstRejectApplicantNote && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <p className="font-medium text-destructive">最近一次一审驳回说明</p>
          <p className="mt-1 text-muted-foreground">{latestRejected.firstRejectApplicantNote}</p>
        </div>
      )}

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
              {!isTrial && (
                <Field label="学生账号" value={order.studentAccount} />
              )}
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
                            {tx.type === "INITIAL"
                              ? "首次下单"
                              : tx.type === "RENEWAL"
                                ? "续费"
                                : tx.type === "REWARD"
                                  ? "转正红包"
                                  : tx.type === "REFUND"
                                    ? "退款"
                                    : tx.type}
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
      <RefundApplyDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        order={order}
        user={user}
        orders={orders}
        onCommitted={(nextOrders, nextApps) => {
          setOrders(nextOrders)
          setRefundApplications(nextApps)
          setOrder(nextOrders.find((o) => o.id === id))
        }}
      />

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
              <Label htmlFor="renew-grade">续费年级（按最新单价）</Label>
              <Select value={renewGrade} onValueChange={setRenewGrade}>
                <SelectTrigger id="renew-grade">
                  <SelectValue placeholder="选择年级" />
                </SelectTrigger>
                <SelectContent>
                  {["四年级","五年级","六年级","初一","初二","初三","高一","高二","高三"].map((g) => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                ¥{(getLatestUnitPriceByGrade(renewGrade) * renewHours).toLocaleString()}
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
