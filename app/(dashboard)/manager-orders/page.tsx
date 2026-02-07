"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { 
  Search, 
  Users,
  Calendar as CalendarIcon,
  X,
  ChevronLeft,
  ChevronRight
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
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

import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { OrderStatus, OrderType } from "@/types"
import { cn } from "@/lib/utils"

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

// 每页显示数量
const PAGE_SIZE = 10

export default function ManagerOrdersPage() {
  const router = useRouter()
  
  // 筛选条件状态
  const [orderIdSearch, setOrderIdSearch] = React.useState("")
  const [dateRange, setDateRange] = React.useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  })
  const [orderTypeFilter, setOrderTypeFilter] = React.useState<string>("ALL")
  const [subjectFilter, setSubjectFilter] = React.useState<string>("ALL")
  const [gradeFilter, setGradeFilter] = React.useState<string>("ALL")
  const [selectedStatuses, setSelectedStatuses] = React.useState<OrderStatus[]>([OrderStatus.PENDING])
  
  // 分页状态
  const [currentPage, setCurrentPage] = React.useState(1)

  // 获取所有唯一的学科和年级
  const { subjects, grades } = React.useMemo(() => {
    const subjectsSet = new Set<string>()
    const gradesSet = new Set<string>()
    mockOrders.forEach(order => {
      subjectsSet.add(order.subject)
      gradesSet.add(order.grade)
    })
    return {
      subjects: Array.from(subjectsSet).sort(),
      grades: Array.from(gradesSet).sort()
    }
  }, [])

  // 切换状态选择
  const toggleStatus = (status: OrderStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
    setCurrentPage(1) // 重置到第一页
  }

  // 筛选后的订单
  const filteredOrders = React.useMemo(() => {
    return mockOrders.filter(order => {
      // 订单号筛选
      if (orderIdSearch && !order.id.toLowerCase().includes(orderIdSearch.toLowerCase())) {
        return false
      }
      
      // 日期区间筛选
      const orderDate = new Date(order.createdAt)
      if (dateRange.from) {
        const startOfDay = new Date(dateRange.from)
        startOfDay.setHours(0, 0, 0, 0)
        if (orderDate < startOfDay) return false
      }
      if (dateRange.to) {
        const endOfDay = new Date(dateRange.to)
        endOfDay.setHours(23, 59, 59, 999)
        if (orderDate > endOfDay) return false
      }
      
      // 订单类型筛选
      if (orderTypeFilter !== "ALL" && order.type !== orderTypeFilter) {
        return false
      }
      
      // 学科筛选
      if (subjectFilter !== "ALL" && order.subject !== subjectFilter) {
        return false
      }
      
      // 年级筛选
      if (gradeFilter !== "ALL" && order.grade !== gradeFilter) {
        return false
      }
      
      // 状态筛选（多选）
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(order.status)) {
        return false
      }
      
      return true
    }).map(order => {
        const student = mockStudents.find(s => s.id === order.studentId)
        return {
            ...order,
            studentName: student?.name || "未知"
        }
    })
  }, [orderIdSearch, dateRange, orderTypeFilter, subjectFilter, gradeFilter, selectedStatuses])

  // 分页后的订单
  const paginatedOrders = React.useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE
    const endIndex = startIndex + PAGE_SIZE
    return filteredOrders.slice(startIndex, endIndex)
  }, [filteredOrders, currentPage])

  // 总页数
  const totalPages = Math.ceil(filteredOrders.length / PAGE_SIZE)

  // 重置所有筛选条件
  const resetFilters = () => {
    setOrderIdSearch("")
    setDateRange({ from: undefined, to: undefined })
    setOrderTypeFilter("ALL")
    setSubjectFilter("ALL")
    setGradeFilter("ALL")
    setSelectedStatuses([OrderStatus.PENDING])
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6 container mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">订单管理</h1>
        <p className="text-muted-foreground">管理所有订单，分配老师，查看申请情况。</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>订单列表</CardTitle>
            <Button variant="outline" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" />
              重置筛选
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* 筛选条件区域 */}
          <div className="space-y-4 mb-6">
            {/* 第一行：订单号、开始日期、结束日期 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">订单号</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="输入订单号搜索..."
                    className="pl-9"
                    value={orderIdSearch}
                    onChange={(e) => {
                      setOrderIdSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">开始日期</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        format(dateRange.from, "yyyy-MM-dd", { locale: zhCN })
                      ) : (
                        <span>选择开始日期</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => {
                        setDateRange(prev => ({ ...prev, from: date }))
                        setCurrentPage(1)
                      }}
                      locale={zhCN}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">结束日期</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? (
                        format(dateRange.to, "yyyy-MM-dd", { locale: zhCN })
                      ) : (
                        <span>选择结束日期</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => {
                        setDateRange(prev => ({ ...prev, to: date }))
                        setCurrentPage(1)
                      }}
                      locale={zhCN}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* 第二行：订单类型、学科、年级 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">订单类型</label>
                <Select value={orderTypeFilter} onValueChange={(value) => {
                  setOrderTypeFilter(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择订单类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部类型</SelectItem>
                    <SelectItem value={OrderType.TRIAL}>试课</SelectItem>
                    <SelectItem value={OrderType.REGULAR}>正课</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">学科</label>
                <Select value={subjectFilter} onValueChange={(value) => {
                  setSubjectFilter(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择学科" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部学科</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">年级</label>
                <Select value={gradeFilter} onValueChange={(value) => {
                  setGradeFilter(value)
                  setCurrentPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择年级" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部年级</SelectItem>
                    {grades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 第三行：订单状态（多选标签） */}
            <div>
              <label className="text-sm font-medium mb-2 block">订单状态（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_MAP).map(([status, label]) => {
                  const isSelected = selectedStatuses.includes(status as OrderStatus)
                  return (
                    <div
                      key={status}
                      onClick={() => toggleStatus(status as OrderStatus)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer transition-colors",
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary" 
                          : "bg-background hover:bg-accent"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleStatus(status as OrderStatus)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm">{label}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 筛选结果统计 */}
            <div className="text-sm text-muted-foreground">
              共找到 <span className="font-medium text-foreground">{filteredOrders.length}</span> 条订单
            </div>
          </div>

          {/* 订单表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>订单号</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>学生</TableHead>
                  <TableHead>年级/科目</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>申请人数</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => router.push(`/manager-orders/${order.id}`)}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          {order.id}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {order.type === OrderType.TRIAL ? "试课" : "正课"}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.studentName}</TableCell>
                      <TableCell>{order.grade} {order.subject}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLOR_MAP[order.status]}>
                          {STATUS_MAP[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{order.applicantIds?.length || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      暂无符合条件的订单
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页组件 */}
          {filteredOrders.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                显示第 {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredOrders.length)} 条，共 {filteredOrders.length} 条订单
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    上一页
                  </Button>
                  
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // 只显示当前页附近的页码
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="min-w-[40px]"
                          >
                            {page}
                          </Button>
                        )
                      } else if (page === currentPage - 2 || page === currentPage + 2) {
                        return <span key={page} className="px-2">...</span>
                      }
                      return null
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    下一页
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
