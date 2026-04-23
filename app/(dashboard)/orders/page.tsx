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
import { FormField } from "@/components/ui/form"
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP } from "@/lib/order-constants"



export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get("studentId")
  const { user } = useAuth()

  const [orders, setOrders] = React.useState<Order[]>([])
  const [refundApplications, setRefundApplications] = React.useState<RefundApplication[]>([])

  React.useEffect(() => {
    setOrders(getStoredOrders())
    setRefundApplications(getStoredRefundApplications())
  }, [])

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
    
    const queryParams = new URLSearchParams({
        type: "renew", // Indicate renewal
        studentName: getStudentName(selectedOrder.studentId),
        subject: selectedOrder.subject,
        grade: renewGrade,
        totalHours: renewHours.toString(),
        price: totalCost.toString(),
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
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => router.push(`/orders/${order.id}`)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base font-medium">
                    {order.subject} ({order.grade})
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">#{order.id}</span>
                  <Badge variant={order.type === OrderType.TRIAL ? "secondary" : "default"}>
                    {order.type === OrderType.TRIAL ? "试课订单" : "正课订单"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant={ORDER_STATUS_COLOR_MAP[order.status]}>{ORDER_STATUS_MAP[order.status]}</Badge>
                  {order.refundFreezeActive && (
                    <Badge variant="secondary">课时冻结</Badge>
                  )}
                  {refundStatusLabel(order.id) && (
                    <Badge variant="outline" className="text-amber-800 border-amber-300">
                      {refundStatusLabel(order.id)}
                    </Badge>
                  )}

                  <div className="flex gap-2 items-center">
                    {order.type === OrderType.TRIAL &&
                      order.status === OrderStatus.COMPLETED && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-green-600 hover:text-green-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            const params = new URLSearchParams({
                              studentName: getStudentName(order.studentId),
                              subject: order.subject,
                              grade: order.grade,
                            }).toString()
                            router.push(`/trial-lesson/deal-payment?${params}`)
                          }}
                        >
                          <ArrowRight className="mr-1 h-3 w-3" />
                          转正课
                        </Button>
                      )}

                    {order.type === OrderType.REGULAR &&
                      order.status !== OrderStatus.CANCELLED &&
                      order.status !== OrderStatus.CANCEL_REQUESTED &&
                      order.status !== OrderStatus.REFUNDED &&
                      !order.refundFreezeActive && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-8 text-green-600 hover:text-green-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedOrder(order)
                            setRenewGrade(order.grade)
                            setIsRenewOpen(true)
                          }}
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          续费
                        </Button>
                      )}

                    {user &&
                      order.salesPersonId === user.id &&
                      canSalesWithdraw(findActiveRefundApplication(refundApplications, order.id)) && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleWithdrawRefund(order)
                          }}
                        >
                          撤销退费申请
                        </Button>
                      )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/orders/${order.id}`} className="cursor-pointer">
                            查看详情
                          </Link>
                        </DropdownMenuItem>

                        {user &&
                          order.salesPersonId === user.id &&
                          canSalesApplyRefund(order, refundApplications) && (
                            <DropdownMenuItem
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedOrder(order)
                                setRefundDialogOpen(true)
                              }}
                            >
                              申请退费
                            </DropdownMenuItem>
                          )}

                        <DropdownMenuItem onClick={() => navigator.clipboard.writeText(order.id)}>
                          复制订单号
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mt-2 md:grid-cols-4">
                  <div>
                    <span className="font-medium text-foreground">学生：</span>
                    {getStudentName(order.studentId)}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">金额：</span>
                    ¥{order.price.toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">下单时间：</span>
                    {format(new Date(order.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                  </div>
                  {order.type === OrderType.REGULAR && (
                    <div>
                      <span className="font-medium text-foreground">课时：</span>
                      {order.remainingHours} / {order.totalHours}
                    </div>
                  )}
                  {order.type === OrderType.TRIAL && order.scheduledAt && (
                    <div>
                      <span className="font-medium text-foreground">预约时间：</span>
                      {format(new Date(order.scheduledAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Renew Dialog */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>正课续费</DialogTitle>
                <DialogDescription>
                    为学生 {selectedOrder ? getStudentName(selectedOrder.studentId) : ''} 的 {selectedOrder?.subject} 课程续费。
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <label>
                <input type="checkbox" checked />
                课程默认单价已包含代充鼎伴学费用：20元/课时（代收费用，一经支付，此费用即支付给鼎伴学，交付中心不负责退款，如需退款，请自行联系鼎伴学）。
                如您已有鼎伴学G账号，则您可取消本选项，直接使用该G账号课时上课（注意：请确保该G账号课时充足/需自行充值，否则将无法上课）。
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
                        ¥{(getLatestUnitPriceByGrade(renewGrade) * renewHours).toLocaleString()}
                    </span>
                    <label>招生老师已缴鼎伴学费用: 0  </label>
                    <label>实际应支付费用：¥{(getLatestUnitPriceByGrade(renewGrade) * renewHours).toLocaleString()}</label>
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
