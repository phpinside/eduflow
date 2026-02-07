"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format, startOfDay, endOfDay } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "sonner"
import { Check, X, Eye, Loader2, AlertCircle, CalendarIcon, Search, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { Order, OrderStatus } from "@/types"

const ITEMS_PER_PAGE = 20

export default function RefundAuditPage() {
  const router = useRouter()
  
  // Local state for orders (initialized with mock data)
  const [orders, setOrders] = React.useState<Order[]>(mockOrders)
  const [currentPage, setCurrentPage] = React.useState(1)
  const [filters, setFilters] = React.useState({
    orderId: '',
    dateRange: {
      start: null as Date | null,
      end: null as Date | null
    }
  })

  const getStudentName = (studentId: string) => {
    const student = mockStudents.find(s => s.id === studentId)
    return student ? student.name : "未知学生"
  }

  // Filter for orders with CANCEL_REQUESTED status and apply filters
  const refundOrders = React.useMemo(() => {
    return orders.filter(o => {
      // Must have CANCEL_REQUESTED status
      if (o.status !== OrderStatus.CANCEL_REQUESTED) {
        return false
      }
      
      // Order ID filter
      if (filters.orderId && !o.id.toLowerCase().includes(filters.orderId.toLowerCase())) {
        return false
      }
      
      // Date range filter
      if (filters.dateRange.start && filters.dateRange.end) {
        const orderDate = new Date(o.updatedAt)
        if (orderDate < filters.dateRange.start || orderDate > filters.dateRange.end) {
          return false
        }
      }
      
      return true
    })
  }, [orders, filters])

  // Paginated data
  const paginatedOrders = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return refundOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [refundOrders, currentPage])

  const totalPages = Math.ceil(refundOrders.length / ITEMS_PER_PAGE)

  // View Details Dialog
  const [viewOrder, setViewOrder] = React.useState<Order | null>(null)
  const [isViewOpen, setIsViewOpen] = React.useState(false)

  // Reject Dialog
  const [rejectOrder, setRejectOrder] = React.useState<Order | null>(null)
  const [isRejectOpen, setIsRejectOpen] = React.useState(false)
  const [rejectReason, setRejectReason] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Reset filters
  const handleReset = () => {
    setFilters({
      orderId: '',
      dateRange: {
        start: null,
        end: null
      }
    })
    setCurrentPage(1)
    toast.success("筛选条件已重置")
  }

  // Refresh data
  const handleRefresh = () => {
    setOrders([...mockOrders])
    toast.success("数据已刷新")
  }

  // Search
  const handleSearch = () => {
    setCurrentPage(1)
    toast.success(`找到 ${refundOrders.length} 条待审核记录`)
  }

  const handleApprove = async (order: Order) => {
    if (!confirm("确认同意退款申请吗？此操作不可撤销。")) return
    
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setOrders(prev => prev.map(o => 
      o.id === order.id 
        ? { ...o, status: OrderStatus.CANCELLED } 
        : o
    ))
    
    toast.success("退款审核通过，订单已取消")
    setIsSubmitting(false)
    setIsViewOpen(false) // Close details if open
  }

  const handleReject = async () => {
    if (!rejectOrder) return
    
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setOrders(prev => prev.map(o => 
      o.id === rejectOrder.id 
        ? { ...o, status: OrderStatus.IN_PROGRESS, rejectReason: rejectReason } // Revert to IN_PROGRESS or previous state
        : o
    ))
    
    toast.success("退款申请已驳回")
    setIsSubmitting(false)
    setIsRejectOpen(false)
    setRejectReason("")
    setRejectOrder(null)
    setIsViewOpen(false) // Close details if open
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">退款审核</h2>
          <p className="text-muted-foreground">
            管理所有待处理的退款申请
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      {/* 筛选区 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 items-end">
            {/* 订单号 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">订单号</label>
              <Input
                placeholder="输入订单号"
                value={filters.orderId}
                onChange={(e) => setFilters(prev => ({ ...prev, orderId: e.target.value }))}
              />
            </div>

            {/* 开始日期 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">开始日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange.start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.start ? (
                      format(filters.dateRange.start, "yyyy-MM-dd", { locale: zhCN })
                    ) : (
                      <span>选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.start || undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: startOfDay(date) }
                        }))
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* 结束日期 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">结束日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange.end && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.end ? (
                      format(filters.dateRange.end, "yyyy-MM-dd", { locale: zhCN })
                    ) : (
                      <span>选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.end || undefined}
                    onSelect={(date) => {
                      if (date) {
                        setFilters(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: endOfDay(date) }
                        }))
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSearch}>
              <Search className="mr-2 h-4 w-4" />
              查询
            </Button>
            <Button variant="outline" onClick={handleReset}>
              重置
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 待审核列表 */}
      <Card>
        <CardHeader>
          <CardTitle>待审核列表</CardTitle>
          <CardDescription>
            共有 {refundOrders.length} 条待处理的退款申请
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>学生</TableHead>
                <TableHead>科目/年级</TableHead>
                <TableHead>申请时间</TableHead>
                <TableHead>预计退款</TableHead>
                <TableHead>申请理由</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    暂无待审核退款
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>{getStudentName(order.studentId)}</TableCell>
                    <TableCell>{order.subject} ({order.grade})</TableCell>
                    <TableCell>
                      {format(new Date(order.updatedAt), "yyyy-MM-dd", { locale: zhCN })}
                    </TableCell>
                    <TableCell>
                      {order.refundAmount ? `¥${order.refundAmount.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={order.cancelReason}>
                      {order.cancelReason || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setViewOrder(order)
                            setIsViewOpen(true)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(order)}
                          disabled={isSubmitting}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          通过
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => {
                            setRejectOrder(order)
                            setIsRejectOpen(true)
                          }}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4 mr-1" />
                          驳回
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* 分页控制 */}
          {refundOrders.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                共 {refundOrders.length} 条记录，第 {currentPage} / {totalPages} 页
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>退款申请详情</DialogTitle>
            <DialogDescription>
              订单号: {viewOrder?.id}
            </DialogDescription>
          </DialogHeader>
          
          {viewOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">学生姓名:</span>
                  <div className="font-medium mt-1">{getStudentName(viewOrder.studentId)}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">科目年级:</span>
                  <div className="font-medium mt-1">{viewOrder.subject} ({viewOrder.grade})</div>
                </div>
                <div>
                  <span className="text-muted-foreground">剩余课时:</span>
                  <div className="font-medium mt-1">{viewOrder.remainingHours} / {viewOrder.totalHours}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">订单金额:</span>
                  <div className="font-medium mt-1">¥{viewOrder.price.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-3 rounded-md space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">申请退款金额:</span>
                  <div className="font-bold text-lg text-red-600">
                    {viewOrder.refundAmount ? `¥${viewOrder.refundAmount.toLocaleString()}` : "未计算"}
                  </div>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">申请理由:</span>
                  <div className="mt-1 text-sm bg-background p-2 rounded border">
                    {viewOrder.cancelReason || "未填写"}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>关闭</Button>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <Button 
                variant="destructive" 
                onClick={() => {
                  if (viewOrder) {
                    setRejectOrder(viewOrder)
                    setIsRejectOpen(true)
                    // Don't close view open, just open reject on top or close it manually?
                    // Better UI is to close view or stack. Dialog stacking can be tricky.
                    // Let's close view first or just rely on state.
                    // Radix UI handles stacking usually.
                  }
                }}
              >
                驳回
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => viewOrder && handleApprove(viewOrder)}
              >
                通过
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回退款申请</DialogTitle>
            <DialogDescription>
              请输入驳回理由，该理由将展示给申请人。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rejectReason">驳回理由</Label>
              <Textarea 
                id="rejectReason" 
                placeholder="请输入驳回理由..." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>取消</Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectReason.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认驳回
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
