"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { format, startOfDay, endOfDay } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  CalendarIcon,
  Search
} from "lucide-react"
import { toast } from "sonner"
import { FinancialRecord } from "@/types"
import { mockFinancialRecords } from "@/lib/mock-data/financial-records"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 30

export default function FinancialRecordsPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({
    salesName: '',
    salesPhone: '',
    dateRange: {
      start: startOfDay(new Date()),
      end: endOfDay(new Date())
    },
    recordType: 'all' // 'all' | 'recharge' | 'refund'
  })

  // 加载数据
  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = () => {
    setRecords(mockFinancialRecords)
  }

  // 筛选逻辑
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // 招生老师姓名筛选
      if (filters.salesName && !record.salesPersonName?.includes(filters.salesName)) {
        return false
      }
      
      // 招生老师手机号筛选
      if (filters.salesPhone && !record.salesPersonPhone?.includes(filters.salesPhone)) {
        return false
      }
      
      // 日期范围筛选
      if (filters.dateRange.start && filters.dateRange.end) {
        const recordDate = new Date(record.createdAt)
        if (recordDate < filters.dateRange.start || recordDate > filters.dateRange.end) {
          return false
        }
      }
      
      // 记录类型筛选
      if (filters.recordType !== 'all') {
        const targetType = filters.recordType === 'recharge' ? 'RECHARGE' : 'REFUND'
        if (record.type !== targetType) {
          return false
        }
      }
      
      return true
    })
  }, [records, filters])

  // 统计数据计算
  const stats = useMemo(() => {
    const recharges = filteredRecords.filter(r => r.type === 'RECHARGE')
    const refunds = filteredRecords.filter(r => r.type === 'REFUND')
    
    const totalRecharge = recharges.reduce((sum, r) => sum + r.amount, 0)
    const totalRefund = Math.abs(refunds.reduce((sum, r) => sum + r.amount, 0))
    
    return {
      totalIncome: totalRecharge - totalRefund,
      totalRecharge,
      totalRefund,
      rechargeCount: recharges.length,
      refundCount: refunds.length
    }
  }, [filteredRecords])

  // 分页数据
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredRecords, currentPage])

  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE)

  // 重置筛选
  const handleReset = () => {
    setFilters({
      salesName: '',
      salesPhone: '',
      dateRange: {
        start: startOfDay(new Date()),
        end: endOfDay(new Date())
      },
      recordType: 'all'
    })
    setCurrentPage(1)
    toast.success("筛选条件已重置")
  }

  // 刷新数据
  const handleRefresh = () => {
    loadRecords()
    toast.success("数据已刷新")
  }

  // 查询按钮
  const handleSearch = () => {
    setCurrentPage(1)
    toast.success(`找到 ${filteredRecords.length} 条记录`)
  }

  return (
    <div className="space-y-6 p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">财务记录</h2>
          <p className="text-muted-foreground">
            查看和管理充值、退款记录
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 items-end">
            {/* 招生老师姓名 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">招生老师姓名</label>
              <Input
                placeholder="输入姓名"
                value={filters.salesName}
                onChange={(e) => setFilters(prev => ({ ...prev, salesName: e.target.value }))}
              />
            </div>

            {/* 招生老师手机号 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">招生老师手机号</label>
              <Input
                placeholder="输入手机号"
                value={filters.salesPhone}
                onChange={(e) => setFilters(prev => ({ ...prev, salesPhone: e.target.value }))}
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
                    selected={filters.dateRange.start}
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
                    selected={filters.dateRange.end}
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

            {/* 记录类型 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">记录类型</label>
              <Select
                value={filters.recordType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, recordType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="recharge">仅充值记录</SelectItem>
                  <SelectItem value="refund">仅退款记录</SelectItem>
                </SelectContent>
              </Select>
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

      {/* 统计数据区 */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总收入</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ¥{stats.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              当前筛选条件统计
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">充值</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ¥{stats.totalRecharge.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              共 {stats.rechargeCount} 笔
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">退款</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ¥{stats.totalRefund.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              共 {stats.refundCount} 笔
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>记录列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>记录类型</TableHead>
                  <TableHead>订单号</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>招生老师</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>交易时间</TableHead>
                  <TableHead>备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无记录
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge
                          className={
                            record.type === 'RECHARGE'
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-red-500 hover:bg-red-600'
                          }
                        >
                          {record.type === 'RECHARGE' ? '充值' : '退款'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/manager-orders/${record.orderId}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {record.orderId}
                        </Link>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-semibold",
                          record.amount > 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {record.amount > 0 ? '+' : ''}
                        {record.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{record.salesPersonName || '-'}</TableCell>
                      <TableCell>{record.salesPersonPhone || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm:ss', {
                          locale: zhCN
                        })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {record.remarks || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页控制 */}
          {filteredRecords.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                共 {filteredRecords.length} 条记录，第 {currentPage} / {totalPages} 页
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
    </div>
  )
}
