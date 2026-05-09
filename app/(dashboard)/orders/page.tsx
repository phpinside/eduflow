"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Plus,
  MoreHorizontal,
  RefreshCw,
  ArrowRight,
  X,
  RotateCcw,
  Calendar as CalendarIcon,
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
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { getLatestUnitPriceByGrade } from "@/lib/course-pricing"
import { mockStudents } from "@/lib/mock-data/students"
import { mockUsers } from "@/lib/mock-data/users"
import {
  getStoredOrders,
  saveStoredOrders,
  getStoredRefundApplications,
  saveRefundApplications,
  getStoredRefundOperationLogs,
  saveRefundOperationLogs,
} from "@/lib/storage"
import { useAuth } from "@/contexts/AuthContext"
import { RefundApplyDialog } from "@/components/refund/refund-apply-dialog"
import {
  canSalesApplyRefund,
  canSalesWithdraw,
  createRefundLog,
  findActiveRefundApplication,
  getComputedMaxForKind,
  getOrderTotalPaid,
} from "@/lib/refund-domain"
import type { Order, RefundApplication } from "@/types"
import { OrderStatus, OrderType, RefundApplicationStatus } from "@/types"
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP } from "@/lib/order-constants"
import { SalesOrderPipeline } from "@/components/orders/sales-order-pipeline"

const COPY_TRIAL_TO_REGULAR =
  "试课转正课：适用于已经完成试课，想要申请上正课的学员。本流程中，需要支持正课课时费、转正红包等费用。"

const COPY_REGULAR_RENEW =
  "续费：适用于已经在上正课，需要对该正课进行续费，增加上课课时的学员。本流程中将根据您需要增加的课时数，来支付对应的课时费用等。"

function isOrderOnlinePaid(order: Order): boolean {
  // 规则口径（业务约束）：
  // - 正课/续课：视为实际支付过费用 → 申请退费
  // - 试课：仅 ONLINE 视为支付过费用；OFFLINE 视为未支付 → 取消订单
  if (order.type === OrderType.REGULAR) return true
  const method = (order as any).trialPaymentMethod
  return method === "ONLINE"
}

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get("studentId")
  const guideTrialConvert = searchParams.get("guide") === "trial-convert"
  const { user } = useAuth()

  const [orders, setOrders] = React.useState<Order[]>([])
  const [refundApplications, setRefundApplications] = React.useState<RefundApplication[]>([])

  React.useEffect(() => {
    setOrders(getStoredOrders())
    setRefundApplications(getStoredRefundApplications())
  }, [])

  React.useEffect(() => {
    if (!guideTrialConvert) return
    setOrderTypeFilter(OrderType.TRIAL)
    const id = window.requestAnimationFrame(() => {
      document.getElementById("orders-trial-convert-guide")?.scrollIntoView({ behavior: "smooth", block: "start" })
      const el = document.getElementById("filter-student-name") as HTMLInputElement | null
      el?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(id)
  }, [guideTrialConvert])

  const getStudentName = (studentId: string) => {
    const student = mockStudents.find(s => s.id === studentId)
    return student ? student.name : "未知学生"
  }

  const studentName = studentId ? getStudentName(studentId) : null;

  // Renew Dialog State
  const [isRenewOpen, setIsRenewOpen] = React.useState(false)
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [renewHours, setRenewHours] = React.useState(40)
  const [renewGrade, setRenewGrade] = React.useState("初一")
  const [renewNeedsDingbanxueRecharge, setRenewNeedsDingbanxueRecharge] = React.useState(true)

  const [refundDialogOpen, setRefundDialogOpen] = React.useState(false)

  const [orderTypeFilter, setOrderTypeFilter] = React.useState<string>("ALL")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")
  const [filterStudentName, setFilterStudentName] = React.useState("")
  const [filterStudentGAccount, setFilterStudentGAccount] = React.useState("")
  const [filterParentPhone, setFilterParentPhone] = React.useState("")
  const [filterTutorName, setFilterTutorName] = React.useState("")
  const [filterTutorPhone, setFilterTutorPhone] = React.useState("")
  const [subjectFilter, setSubjectFilter] = React.useState("ALL")
  const [gradeFilter, setGradeFilter] = React.useState("ALL")
  const [orderDateRange, setOrderDateRange] = React.useState<{
    from: Date | undefined
    to: Date | undefined
  }>({ from: undefined, to: undefined })

  const { subjectOptions, gradeOptions } = React.useMemo(() => {
    const subjects = new Set<string>()
    const grades = new Set<string>()
    for (const order of orders) {
      subjects.add(order.subject)
      const student = mockStudents.find((s) => s.id === order.studentId)
      grades.add(student?.grade ?? order.grade)
    }
    return {
      subjectOptions: Array.from(subjects).sort(),
      gradeOptions: Array.from(grades).sort(),
    }
  }, [orders])

  const filteredOrders = React.useMemo(() => {
    return orders
      .map((order) => {
        const student = mockStudents.find((s) => s.id === order.studentId)
        const tutor = order.assignedTeacherId
          ? mockUsers.find((u) => u.id === order.assignedTeacherId)
          : undefined
        return {
          order,
          studentName: student?.name ?? "未知学生",
          studentGrade: student?.grade ?? order.grade,
          parentPhone: student?.parentPhone ?? "",
          tutorName: tutor?.name ?? "",
          tutorPhone: tutor?.phone ?? "",
        }
      })
      .filter(
        ({
          order,
          studentName,
          studentGrade,
          parentPhone,
          tutorName,
          tutorPhone,
        }) => {
        if (studentId && order.studentId !== studentId) return false
        if (orderTypeFilter !== "ALL" && order.type !== orderTypeFilter) return false
        if (statusFilter !== "ALL" && order.status !== statusFilter) return false
        if (subjectFilter !== "ALL" && order.subject !== subjectFilter) {
          return false
        }
        if (gradeFilter !== "ALL" && studentGrade !== gradeFilter) {
          return false
        }
        const created = new Date(order.createdAt)
        if (orderDateRange.from) {
          const start = new Date(orderDateRange.from)
          start.setHours(0, 0, 0, 0)
          if (created < start) return false
        }
        if (orderDateRange.to) {
          const end = new Date(orderDateRange.to)
          end.setHours(23, 59, 59, 999)
          if (created > end) return false
        }
        if (
          filterStudentName &&
          !studentName.toLowerCase().includes(filterStudentName.trim().toLowerCase())
        ) {
          return false
        }
        if (
          filterStudentGAccount &&
          !(order.studentAccount ?? "")
            .toLowerCase()
            .includes(filterStudentGAccount.trim().toLowerCase())
        ) {
          return false
        }
        if (
          filterParentPhone &&
          !parentPhone.toLowerCase().includes(filterParentPhone.trim().toLowerCase())
        ) {
          return false
        }
        if (
          filterTutorName &&
          !tutorName.toLowerCase().includes(filterTutorName.trim().toLowerCase())
        ) {
          return false
        }
        if (
          filterTutorPhone &&
          !tutorPhone.toLowerCase().includes(filterTutorPhone.trim().toLowerCase())
        ) {
          return false
        }
        return true
      })
      .map(({ order }) => order)
  }, [
    orders,
    studentId,
    orderTypeFilter,
    statusFilter,
    subjectFilter,
    gradeFilter,
    orderDateRange,
    filterStudentName,
    filterStudentGAccount,
    filterParentPhone,
    filterTutorName,
    filterTutorPhone,
  ])

  const resetFilters = () => {
    setOrderTypeFilter("ALL")
    setStatusFilter("ALL")
    setSubjectFilter("ALL")
    setGradeFilter("ALL")
    setOrderDateRange({ from: undefined, to: undefined })
    setFilterStudentName("")
    setFilterStudentGAccount("")
    setFilterParentPhone("")
    setFilterTutorName("")
    setFilterTutorPhone("")
  }

  const handleRenewOrder = () => {
    if (!selectedOrder) return

    const pricePerHour = getLatestUnitPriceByGrade(renewGrade)
    const totalCost = pricePerHour * renewHours
    const payable = Math.max(0, totalCost - (renewNeedsDingbanxueRecharge ? 0 : 20 * renewHours))
    
    const queryParams = new URLSearchParams({
        type: "renew", // Indicate renewal
        studentName: getStudentName(selectedOrder.studentId),
        subject: selectedOrder.subject,
        grade: renewGrade,
        totalHours: renewHours.toString(),
        price: payable.toString(),
        needsDingbanxueRecharge: String(renewNeedsDingbanxueRecharge),
    }).toString()
    
    setIsRenewOpen(false)
    router.push(`/regular-course/payment?${queryParams}`)
  }

  const handleWithdrawRefund = (order: Order) => {
    if (!user) return
    const app = findActiveRefundApplication(refundApplications, order.id)
    if (!canSalesWithdraw(app)) return
    const now = new Date()
    const nextApps = refundApplications.map((a) =>
      a.id === app!.id
        ? { ...a, status: RefundApplicationStatus.WITHDRAWN, updatedAt: now }
        : a
    )
    const nextOrders = orders.map((o) =>
      o.id === order.id
        ? { ...o, refundFreezeActive: false, updatedAt: now }
        : o
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
        detail: "一审处理前招生老师主动撤销，课时已解冻",
      }),
    ]
    saveRefundApplications(nextApps)
    saveStoredOrders(nextOrders)
    saveRefundOperationLogs(logs)
    setRefundApplications(nextApps)
    setOrders(nextOrders)
    toast.success("已撤销申请，本单课时恢复可用")
  }

  const handleCancelOrderDirect = (order: Order) => {
    if (!user) return
    if (order.status === OrderStatus.CANCELLED) return
    if (order.status === OrderStatus.CANCEL_REQUESTED) return
    if (order.status === OrderStatus.REFUNDED) return
    const ok = window.confirm(
      "确认取消订单？\n\n该订单未发生在线实收，将直接取消，不进入退款审核流程。"
    )
    if (!ok) return
    const now = new Date()
    const nextOrders = orders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            status: OrderStatus.CANCELLED,
            cancelReason: "未发生在线实收，招生侧直接取消订单",
            updatedAt: now,
          }
        : o
    )
    saveStoredOrders(nextOrders)
    setOrders(nextOrders)
    toast.success("订单已取消")
  }

  const refundStatusLabel = (orderId: string) => {
    const a = findActiveRefundApplication(refundApplications, orderId)
    if (!a) return null
    if (a.status === RefundApplicationStatus.PENDING_FIRST_REVIEW) return "退费：一审待审"
    if (a.status === RefundApplicationStatus.PENDING_SECOND_REVIEW) return "退费：二审待审"
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-bold tracking-tight">订单管理</h2>
            {studentName && (
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-sm font-normal">
                        筛选学生: {studentName}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 ml-1 hover:bg-transparent"
                            onClick={() => router.push('/orders')}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </Badge>
                </div>
            )}
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href="/trial-lesson/create">
                    <Plus className="mr-2 h-4 w-4" />
                    新建试课单
                </Link>
            </Button>
            <Button asChild>
                <Link href="/regular-course/select-trial">
                    <Plus className="mr-2 h-4 w-4" />
                    新建正课单
                </Link>
            </Button>
        </div>
      </div>

      {guideTrialConvert && (
        <div
          id="orders-trial-convert-guide"
          className="rounded-xl border border-amber-200 bg-amber-50/90 p-4 shadow-sm dark:border-amber-900/60 dark:bg-amber-950/40"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-2">
              <p className="text-sm font-semibold text-amber-950 dark:text-amber-50">试课转正课 · 操作引导</p>
              <p className="text-xs leading-relaxed text-amber-950/95 dark:text-amber-100/95">
                已为您筛出「试课订单」。请在下方筛选区「学员姓名」中输入孩子姓名，定位到对应试课单；确认该单状态为「已完成」后，在订单卡片上使用「试课转正课」按钮进入正课创建与支付（含正课课时费、转正红包等）。本入口不会在空白单上发起转正。
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 border-amber-300 bg-background text-amber-950 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-50 dark:hover:bg-amber-900/50"
              onClick={() => router.replace("/orders")}
            >
              关闭引导
            </Button>
          </div>
        </div>
      )}

      {studentId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">
              学员「{studentName}」名下订单消费一览
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              同一学员多笔充值需分别发起退费；以下为该学员在当前系统中的全部订单维度数据。
            </p>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">订单号</th>
                  <th className="py-2 pr-4 font-medium">类型</th>
                  <th className="py-2 pr-4 font-medium">科目</th>
                  <th className="py-2 pr-4 font-medium">总课时</th>
                  <th className="py-2 pr-4 font-medium">已上</th>
                  <th className="py-2 pr-4 font-medium">剩余</th>
                  <th className="py-2 pr-4 font-medium">缴纳合计</th>
                  <th className="py-2 pr-4 font-medium">备注</th>
                </tr>
              </thead>
              <tbody>
                {orders
                  .filter((o) => o.studentId === studentId)
                  .map((o) => {
                    const regularKind = o.transactions?.some((t) => t.type === "RENEWAL")
                      ? "RENEWAL"
                      : "REGULAR"
                    const regularCalc =
                      o.type === OrderType.REGULAR
                        ? getComputedMaxForKind(o, regularKind, refundApplications).breakdown
                        : undefined
                    const consumed =
                      o.type === OrderType.REGULAR
                        ? (regularCalc?.consumedHours ?? Math.max(0, o.totalHours - (o.remainingHours ?? 0)))
                        : "—"
                    const paid = getOrderTotalPaid(o)
                    const maxRef =
                      o.type === OrderType.REGULAR
                        ? (regularCalc?.maxRefundable ?? 0)
                        : o.price
                    return (
                      <tr key={o.id} className="border-b border-border/60">
                        <td className="py-2 pr-4 font-mono text-xs">{o.id}</td>
                        <td className="py-2 pr-4">
                          {o.type === OrderType.TRIAL ? "试课" : "正课"}
                        </td>
                        <td className="py-2 pr-4">{o.subject}</td>
                        <td className="py-2 pr-4">
                          {o.type === OrderType.REGULAR ? o.totalHours : "—"}
                        </td>
                        <td className="py-2 pr-4">{consumed}</td>
                        <td className="py-2 pr-4">
                          {o.type === OrderType.REGULAR ? o.remainingHours : "—"}
                        </td>
                        <td className="py-2 pr-4">¥{paid.toLocaleString()}</td>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">
                          {o.refundFreezeActive && <span className="text-amber-700">冻结中 </span>}
                          {o.type === OrderType.REGULAR && (
                            <span>最大可退约 ¥{maxRef.toLocaleString()}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base font-medium">筛选条件</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw className="mr-2 h-4 w-4" />
            重置筛选
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="filter-order-type">订单类型</Label>
                <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                  <SelectTrigger id="filter-order-type" className="w-full">
                    <SelectValue placeholder="订单类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部</SelectItem>
                    <SelectItem value={OrderType.TRIAL}>试课订单</SelectItem>
                    <SelectItem value={OrderType.REGULAR}>正课订单</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-status">订单状态</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger id="filter-status" className="w-full">
                    <SelectValue placeholder="全部状态" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部</SelectItem>
                    {Object.entries(ORDER_STATUS_MAP).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-subject">科目</Label>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger id="filter-subject" className="w-full">
                    <SelectValue placeholder="全部科目" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部</SelectItem>
                    {subjectOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>下单开始日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !orderDateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {orderDateRange.from
                        ? format(orderDateRange.from, "yyyy-MM-dd", { locale: zhCN })
                        : "选择日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={orderDateRange.from}
                      onSelect={(date) =>
                        setOrderDateRange((prev) => ({ ...prev, from: date }))
                      }
                      locale={zhCN}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>下单结束日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !orderDateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {orderDateRange.to
                        ? format(orderDateRange.to, "yyyy-MM-dd", { locale: zhCN })
                        : "选择日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={orderDateRange.to}
                      onSelect={(date) =>
                        setOrderDateRange((prev) => ({ ...prev, to: date }))
                      }
                      locale={zhCN}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="filter-student-name">学员姓名</Label>
                <Input
                  id="filter-student-name"
                  placeholder="支持模糊匹配"
                  value={filterStudentName}
                  onChange={(e) => setFilterStudentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-grade">学员年级</Label>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger id="filter-grade" className="w-full">
                    <SelectValue placeholder="全部年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部</SelectItem>
                    {gradeOptions.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-student-g">学员G账号</Label>
                <Input
                  id="filter-student-g"
                  placeholder="订单上的学员账号"
                  value={filterStudentGAccount}
                  onChange={(e) => setFilterStudentGAccount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-parent-phone">家长手机号</Label>
                <Input
                  id="filter-parent-phone"
                  placeholder="支持模糊匹配"
                  value={filterParentPhone}
                  onChange={(e) => setFilterParentPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="filter-tutor-name">教练姓名</Label>
                <Input
                  id="filter-tutor-name"
                  placeholder="已分配教练"
                  value={filterTutorName}
                  onChange={(e) => setFilterTutorName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="filter-tutor-phone">教练手机号</Label>
                <Input
                  id="filter-tutor-phone"
                  placeholder="支持模糊匹配"
                  value={filterTutorPhone}
                  onChange={(e) => setFilterTutorPhone(e.target.value)}
                />
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            共 {filteredOrders.length} 条订单
          </p>
        </CardContent>
      </Card>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">暂无符合条件的订单</div>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => {
            const studentLabel = getStudentName(order.studentId)
            const showTrialConvert =
              order.type === OrderType.TRIAL && order.status === OrderStatus.COMPLETED
            const showRenew =
              order.type === OrderType.REGULAR &&
              order.status !== OrderStatus.CANCELLED &&
              order.status !== OrderStatus.CANCEL_REQUESTED &&
              order.status !== OrderStatus.REFUNDED &&
              !order.refundFreezeActive
            const hasPrimaryAction = showTrialConvert || showRenew
            const canApplyRefundHere =
              user &&
              order.salesPersonId === user.id &&
              canSalesApplyRefund(order, refundApplications) &&
              isOrderOnlinePaid(order)
            const canCancelDirectHere =
              user &&
              order.salesPersonId === user.id &&
              canSalesApplyRefund(order, refundApplications) &&
              !isOrderOnlinePaid(order) &&
              order.status !== OrderStatus.CANCELLED &&
              order.status !== OrderStatus.CANCEL_REQUESTED &&
              order.status !== OrderStatus.REFUNDED

            return (
              <Card
                key={order.id}
                className="overflow-hidden border-border/80 transition-colors hover:bg-muted/25"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/orders/${order.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    router.push(`/orders/${order.id}`)
                  }
                }}
              >
                <CardContent className="p-0">
                  {/* 核心信息：紧凑聚合 */}
                  <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="truncate text-lg font-semibold tracking-tight text-foreground">
                          {studentLabel}
                        </span>
                        <span className="text-muted-foreground">·</span>
                        <span className="font-medium text-foreground">{order.subject}</span>
                        <Badge variant="outline" className="h-5 px-1.5 text-[11px] font-normal">
                          {order.grade}
                        </Badge>
                        <Badge
                          className={
                            order.type === OrderType.TRIAL
                              ? "border-sky-300/80 bg-sky-50 text-sky-800 hover:bg-sky-50 dark:bg-sky-950/50 dark:text-sky-100"
                              : "border-emerald-300/80 bg-emerald-50 text-emerald-900 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-50"
                          }
                          variant="outline"
                        >
                          {order.type === OrderType.TRIAL ? "试课订单" : "正课订单"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono text-[11px]">{order.id}</span>
                        <span>下单 {format(new Date(order.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}</span>
                        {order.studentAccount?.trim() ? (
                          <span className="font-mono text-[11px]">G {order.studentAccount}</span>
                        ) : null}
                      </div>
                    </div>
                    <div
                      className="flex shrink-0 flex-wrap items-center justify-end gap-2"
                      data-no-nav
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Badge variant={ORDER_STATUS_COLOR_MAP[order.status]}>
                        {ORDER_STATUS_MAP[order.status]}
                      </Badge>
                      {order.refundFreezeActive && <Badge variant="secondary">课时冻结</Badge>}
                      {refundStatusLabel(order.id) && (
                        <Badge variant="outline" className="border-amber-300 text-amber-800">
                          {refundStatusLabel(order.id)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="border-t bg-muted/20 px-4 py-3">
                    <SalesOrderPipeline order={order} />
                  </div>

                  <div className="flex flex-wrap gap-x-8 gap-y-3 border-t px-4 py-3 text-sm">
                    <div className="min-w-[140px]">
                      <p className="text-[11px] font-medium text-muted-foreground">订单金额</p>
                      <p className="font-semibold tabular-nums text-foreground">¥{order.price.toLocaleString()}</p>
                    </div>
                    {order.type === OrderType.REGULAR ? (
                      <div className="min-w-[140px]">
                        <p className="text-[11px] font-medium text-muted-foreground">课时（剩余/总计）</p>
                        <p className="font-semibold tabular-nums text-foreground">
                          {order.remainingHours} / {order.totalHours}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="min-w-[120px]">
                          <p className="text-[11px] font-medium text-muted-foreground">试课课时</p>
                          <p className="font-semibold text-foreground">{order.totalHours ?? 1} 课时</p>
                        </div>
                        <div className="min-w-[160px]">
                          <p className="text-[11px] font-medium text-muted-foreground">预约上课时间</p>
                          <p className="text-foreground">
                            {order.scheduledAt
                              ? format(new Date(order.scheduledAt), "yyyy-MM-dd HH:mm", { locale: zhCN })
                              : "—"}
                          </p>
                        </div>
                      </>
                    )}
                  </div>

                  <div
                    className="space-y-3 border-t bg-card px-4 pb-4 pt-3"
                    data-no-nav
                    onClick={(e) => e.stopPropagation()}
                  >
                    {showTrialConvert ? (
                      <div className="rounded-xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 to-background p-4 shadow-sm dark:border-emerald-900/50 dark:from-emerald-950/30">
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                          <div className="min-w-0">
                            <Button
                              size="default"
                              className="shrink-0 gap-2 bg-emerald-600 font-semibold text-white shadow-md hover:bg-emerald-700"
                              onClick={() => {
                                const params = new URLSearchParams({
                                  studentName: getStudentName(order.studentId),
                                  subject: order.subject,
                                  grade: order.grade,
                                  fromTrialConversion: "true",
                                  campusName: order.campusName || "",
                                  campusAccount: order.campusAccount || "",
                                  studentAccount: order.studentAccount || "",
                                }).toString()
                                router.push(`/regular-course/create?${params}`)
                              }}
                            >
                              <ArrowRight className="h-4 w-4" />
                              试课转正课
                            </Button>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              {COPY_TRIAL_TO_REGULAR}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2 lg:pl-6">
                            {canApplyRefundHere && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9"
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setRefundDialogOpen(true)
                                  }}
                                >
                                  申请退费
                                </Button>
                            )}
                            {canCancelDirectHere && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-9"
                                onClick={() => handleCancelOrderDirect(order)}
                              >
                                取消订单
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9"
                              onClick={() => navigator.clipboard.writeText(order.id)}
                            >
                              复制订单号
                            </Button>

                            <Button size="sm" variant="outline" className="h-9" asChild>
                              <Link href={`/orders/${order.id}`}>查看详情</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {showRenew ? (
                      <div className="rounded-xl border border-blue-200/90 bg-gradient-to-br from-blue-50/90 to-background p-4 shadow-sm dark:border-blue-900/50 dark:from-blue-950/30">
                        <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-start">
                          <div className="min-w-0">
                            <Button
                              size="default"
                              variant="default"
                              className="shrink-0 gap-2 bg-blue-600 font-semibold text-white shadow-md hover:bg-blue-700"
                              onClick={() => {
                                setSelectedOrder(order)
                                setRenewGrade(order.grade)
                                setIsRenewOpen(true)
                              }}
                            >
                              <RefreshCw className="h-4 w-4" />
                              续费
                            </Button>
                            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                              {COPY_REGULAR_RENEW}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center justify-end gap-2 lg:pl-6">
                            {canApplyRefundHere && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-9"
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setRefundDialogOpen(true)
                                  }}
                                >
                                  申请退费
                                </Button>
                            )}
                            {canCancelDirectHere && (
                              <Button
                                size="sm"
                                variant="destructive"
                                className="h-9"
                                onClick={() => handleCancelOrderDirect(order)}
                              >
                                取消订单
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9"
                              onClick={() => navigator.clipboard.writeText(order.id)}
                            >
                              复制订单号
                            </Button>

                            <Button size="sm" variant="outline" className="h-9" asChild>
                              <Link href={`/orders/${order.id}`}>查看详情</Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex flex-wrap items-center justify-end gap-2">
                      {user &&
                        order.salesPersonId === user.id &&
                        canSalesWithdraw(findActiveRefundApplication(refundApplications, order.id)) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9"
                            onClick={() => handleWithdrawRefund(order)}
                          >
                            撤销退费申请
                          </Button>
                        )}

                      {/* 有主操作时：大屏展开按钮，小屏保留更多；无主操作时：大屏也保留更多 */}
                      <div className={hasPrimaryAction ? "lg:hidden" : ""}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-1">
                              <MoreHorizontal className="h-4 w-4" />
                              更多
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>操作</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/orders/${order.id}`} className="cursor-pointer">
                                查看详情
                              </Link>
                            </DropdownMenuItem>

                            {canApplyRefundHere && (
                                <DropdownMenuItem
                                  className="cursor-pointer"
                                  onClick={() => {
                                    setSelectedOrder(order)
                                    setRefundDialogOpen(true)
                                  }}
                                >
                                  申请退费
                                </DropdownMenuItem>
                            )}
                            {canCancelDirectHere && (
                              <DropdownMenuItem
                                className="cursor-pointer text-destructive focus:text-destructive"
                                onClick={() => handleCancelOrderDirect(order)}
                              >
                                取消订单
                              </DropdownMenuItem>
                            )}

                            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order.id)}>
                              复制订单号
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Renew Dialog */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>正课续费</DialogTitle>
                <DialogDescription asChild>
                    <div className="space-y-2 text-sm text-muted-foreground">
                        <p>为学生 {selectedOrder ? getStudentName(selectedOrder.studentId) : ""} 的 {selectedOrder?.subject} 课程续费。</p>
                        <p className="leading-relaxed">{COPY_REGULAR_RENEW}</p>
                    </div>
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <label className="flex items-start gap-2 rounded-md border bg-muted/30 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={renewNeedsDingbanxueRecharge}
                  onChange={(e) => setRenewNeedsDingbanxueRecharge(e.target.checked)}
                  className="mt-1"
                />
                <span className="leading-relaxed">
                  课程默认单价已包含代收鼎伴学费用：20元/课时（代收费用，一经支付，此费用即支付给鼎伴学，交付中心不负责退款，如需退款，请自行联系鼎伴学）。
                  如您已有鼎伴学G账号，则您可取消本选项，直接使用该G账号课时上课（注意：请确保该G账号课时充足/需自行充值，否则将无法上课）。
                </span>
              </label>
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
                        ¥{Math.max(
                          0,
                          getLatestUnitPriceByGrade(renewGrade) * renewHours -
                            (renewNeedsDingbanxueRecharge ? 0 : 20 * renewHours)
                        ).toLocaleString()}
                    </span>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRenewOpen(false)}>取消</Button>
                <Button onClick={handleRenewOrder}>
                    确认并支付
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      <RefundApplyDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        order={selectedOrder}
        user={user}
        orders={orders}
        onCommitted={(nextOrders, nextApps) => {
          setOrders(nextOrders)
          setRefundApplications(nextApps)
        }}
      />
    </div>
  )
}
