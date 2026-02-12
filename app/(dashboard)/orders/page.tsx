"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, RefreshCw, ArrowRight, X, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { Order, OrderStatus, OrderType } from "@/types"

const STATUS_MAP: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "待接单",
  [OrderStatus.ASSIGNED]: "已分配",
  [OrderStatus.IN_PROGRESS]: "进行中",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.CANCEL_REQUESTED]: "取消申请中",
}

const STATUS_COLOR_MAP: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  [OrderStatus.PENDING]: "secondary",
  [OrderStatus.ASSIGNED]: "default",
  [OrderStatus.IN_PROGRESS]: "default",
  [OrderStatus.COMPLETED]: "outline",
  [OrderStatus.CANCELLED]: "destructive",
  [OrderStatus.CANCEL_REQUESTED]: "destructive",
}

export default function OrdersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get("studentId")

  // Initialize local state with mock data
  const [orders, setOrders] = React.useState<Order[]>(mockOrders)

  const getStudentName = (studentId: string) => {
    const student = mockStudents.find(s => s.id === studentId)
    return student ? student.name : "未知学生"
  }

  const studentName = studentId ? getStudentName(studentId) : null;

  // Renew Dialog State
  const [isRenewOpen, setIsRenewOpen] = React.useState(false)
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null)
  const [renewHours, setRenewHours] = React.useState(40)

  // Cancel Dialog State
  const [isCancelOpen, setIsCancelOpen] = React.useState(false)
  const [cancelReason, setCancelReason] = React.useState("")
  const [isSubmittingCancel, setIsSubmittingCancel] = React.useState(false)

  const handleRenewOrder = () => {
    if (!selectedOrder) return
    
    // Simple pricing logic for demo
    const pricePerHour = 200 
    const totalCost = pricePerHour * renewHours
    
    const queryParams = new URLSearchParams({
        type: "renew", // Indicate renewal
        studentName: getStudentName(selectedOrder.studentId),
        subject: selectedOrder.subject,
        grade: selectedOrder.grade,
        totalHours: renewHours.toString(),
        price: totalCost.toString(),
    }).toString()
    
    setIsRenewOpen(false)
    router.push(`/regular-course/payment?${queryParams}`)
  }

  const handleCancelOrder = async () => {
    if (!selectedOrder) return
    setIsSubmittingCancel(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update local state
    setOrders(orders.map(o => 
        o.id === selectedOrder.id 
            ? { 
                ...o, 
                status: OrderStatus.CANCEL_REQUESTED,
                cancelReason: cancelReason,
                // Simple refund calculation logic for demo
                refundAmount: o.price ? Math.floor(o.price * (o.remainingHours / o.totalHours)) : 0
              } 
            : o
    ))
    
    toast.success("取消申请已提交，等待审核")
    setIsSubmittingCancel(false)
    setIsCancelOpen(false)
    setCancelReason("")
    setSelectedOrder(null)
  }

  const OrderList = ({ type }: { type: OrderType }) => {
    let filteredOrders = orders.filter(o => o.type === type)
    
    if (studentId) {
        filteredOrders = filteredOrders.filter(o => o.studentId === studentId)
    }

    if (filteredOrders.length === 0) {
      return (
        <div className="text-center py-10 text-muted-foreground">
          暂无订单
        </div>
      )
    }

    return (
      <div className="grid gap-4">
        {filteredOrders.map((order) => (
          <Card 
            key={order.id} 
            className="cursor-pointer transition-colors hover:bg-muted/50"
            onClick={() => router.push(`/orders/${order.id}`)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-medium">
                  {order.subject} ({order.grade})
                </CardTitle>
                <span className="text-xs text-muted-foreground">#{order.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_COLOR_MAP[order.status]}>
                  {STATUS_MAP[order.status]}
                </Badge>
                
                <div className="flex gap-2 items-center">
                    {/* Convert to Regular (Only for Completed Trial) - Prominent Button */}
                    {order.type === OrderType.TRIAL && order.status === OrderStatus.COMPLETED && (
                         <Button 
                            size="sm" 
                            variant="secondary" 
                            className="h-8 text-green-600 hover:text-green-700"
                            onClick={(e) => {
                                e.stopPropagation()
                                // Pass current order details to the payment page
                                const params = new URLSearchParams({
                                    studentName: getStudentName(order.studentId),
                                    subject: order.subject,
                                    grade: order.grade,
                                    // Add other necessary fields if needed
                                }).toString()
                                router.push(`/trial-lesson/deal-payment?${params}`)
                            }}
                         >
                            <ArrowRight className="mr-1 h-3 w-3" />
                            转正课
                         </Button>
                    )}

                    {/* Renew (Only for Regular) - Prominent Button */}
                    {order.type === OrderType.REGULAR && order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.CANCEL_REQUESTED && (
                        <Button 
                            size="sm"
                            variant="secondary"
                            className="h-8 text-green-600 hover:text-green-700"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedOrder(order)
                                setIsRenewOpen(true)
                            }}
                        >
                            <RefreshCw className="mr-1 h-3 w-3" />
                            续费
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
                    
                    {/* Renew (Only for Regular) - Removed from dropdown as it's now a main button */}
                    
                    {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.CANCEL_REQUESTED && (
                        <DropdownMenuItem 
                            className="text-destructive focus:text-destructive cursor-pointer"
                            onClick={(e) => {
                                e.stopPropagation()
                                setSelectedOrder(order)
                                setIsCancelOpen(true)
                            }}
                        >
                            取消订单
                        </DropdownMenuItem>
                    )}

                    <DropdownMenuItem
                      onClick={() => navigator.clipboard.writeText(order.id)}
                    >
                      复制订单号
                    </DropdownMenuItem>
                    {/* Add more actions here if needed */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mt-2">
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
                {type === OrderType.REGULAR && (
                   <div>
                    <span className="font-medium text-foreground">课时：</span>
                    {order.remainingHours} / {order.totalHours}
                  </div>
                )}
                {type === OrderType.TRIAL && order.scheduledAt && (
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
    )
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

      <Tabs defaultValue="trial" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trial">试课订单</TabsTrigger>
          <TabsTrigger value="regular">正课订单</TabsTrigger>
        </TabsList>
        <TabsContent value="trial" className="space-y-4">
          <OrderList type={OrderType.TRIAL} />
        </TabsContent>
        <TabsContent value="regular" className="space-y-4">
          <OrderList type={OrderType.REGULAR} />
        </TabsContent>
      </Tabs>

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
                <Button variant="outline" onClick={() => setIsRenewOpen(false)}>取消</Button>
                <Button onClick={handleRenewOrder}>
                    确认并支付
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>申请取消订单</DialogTitle>
                <DialogDescription>
                    订单号：{selectedOrder?.id} <br/>
                    提交后需等待后台运营人员审核，审核通过后将进行退款流程。
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="reason">取消理由</Label>
                    <Textarea 
                        id="reason" 
                        placeholder="请详细描述取消原因..." 
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsCancelOpen(false)}>暂不取消</Button>
                <Button 
                    variant="destructive" 
                    onClick={handleCancelOrder} 
                    disabled={!cancelReason.trim() || isSubmittingCancel}
                >
                    {isSubmittingCancel && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    确认提交申请
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
