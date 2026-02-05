"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { 
  Search, 
  Users, 
  Eye,
  Filter
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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

export default function ManagerOrdersPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

  const filteredOrders = React.useMemo(() => {
    return mockOrders.filter(order => {
      // Status Filter
      if (statusFilter !== "ALL" && order.status !== statusFilter) return false
      
      // Search Filter
      if (searchQuery) {
        const student = mockStudents.find(s => s.id === order.studentId)
        const matchId = order.id.toLowerCase().includes(searchQuery.toLowerCase())
        const matchStudent = student?.name.includes(searchQuery)
        const matchSubject = order.subject.includes(searchQuery)
        
        if (!matchId && !matchStudent && !matchSubject) return false
      }
      
      return true
    }).map(order => {
        const student = mockStudents.find(s => s.id === order.studentId)
        return {
            ...order,
            studentName: student?.name || "未知"
        }
    })
  }, [searchQuery, statusFilter])

  return (
    <div className="space-y-6 container mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">运营订单管理</h1>
        <p className="text-muted-foreground">管理所有订单，分配老师，查看申请情况。</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>订单列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索订单号、学生姓名、科目..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部状态</SelectItem>
                {Object.keys(STATUS_MAP).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_MAP[status as OrderStatus]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
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
                      <TableCell className="text-right">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => router.push(`/manager-orders/${order.id}`)}
                        >
                            <Eye className="h-4 w-4 mr-1" /> 查看详情
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      暂无订单数据
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
