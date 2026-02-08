"use client"

import { useState, useMemo, useEffect } from "react"
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths } from "date-fns"
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
  CalendarIcon,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { toast } from "sonner"
import { TutorIncomeSummary } from "@/types"
import { getStoredTutorIncomeSummary } from "@/lib/storage"
import { cn } from "@/lib/utils"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export default function TutorIncomePage() {
  const [data, setData] = useState<TutorIncomeSummary[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [jumpToPage, setJumpToPage] = useState('')
  
  // 筛选条件（开发模式：默认显示所有数据）
  const [filters, setFilters] = useState({
    dateRange: {
      start: new Date('2020-01-01'),
      end: new Date('2030-12-31')
    },
    tutorName: '' as string,  // 教练姓名输入
    tutorId: '' as string     // 教练ID输入
  })

  // 加载数据
  useEffect(() => {
    const loadData = () => {
      const summaryData = getStoredTutorIncomeSummary()
      console.log('📊 加载伴学教练收入数据:', summaryData.length, '条')
      setData(summaryData)
    }
    loadData()
  }, [])

  // 筛选数据
  const filteredData = useMemo(() => {
    return data.filter(record => {
      // 教练姓名筛选（支持模糊匹配）
      if (filters.tutorName && !record.tutorName.includes(filters.tutorName)) {
        return false
      }
      
      // 日期范围筛选：检查统计周期是否与筛选范围有交集
      if (filters.dateRange.start && filters.dateRange.end) {
        const periodStart = new Date(record.period.start)
        const periodEnd = new Date(record.period.end)
        const filterStart = filters.dateRange.start
        const filterEnd = filters.dateRange.end
        
        // 检查两个时间段是否有交集
        const hasOverlap = periodStart <= filterEnd && periodEnd >= filterStart
        if (!hasOverlap) {
          return false
        }
      }
      
      return true
    })
  }, [data, filters])

  // 分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredData.slice(startIndex, startIndex + pageSize)
  }, [filteredData, currentPage, pageSize])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  // 生成页码数组
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    
    return pages
  }

  // 跳转到指定页
  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setJumpToPage('')
      toast.success(`已跳转到第 ${page} 页`)
    } else {
      toast.error(`请输入 1-${totalPages} 之间的页码`)
    }
  }

  // 修改每页显示数量
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    toast.success(`已调整为每页显示 ${newSize} 条`)
  }

  // 快捷日期选择
  const handleQuickDateSelect = (type: 'thisMonth' | 'lastMonth' | 'last3Months') => {
    const today = new Date()
    let start: Date
    let end: Date = endOfDay(today)

    switch (type) {
      case 'thisMonth':
        start = startOfMonth(today)
        break
      case 'lastMonth':
        start = startOfMonth(subMonths(today, 1))
        end = endOfMonth(subMonths(today, 1))
        break
      case 'last3Months':
        start = startOfMonth(subMonths(today, 2))
        break
    }

    setFilters(prev => ({
      ...prev,
      dateRange: { start, end }
    }))
    setCurrentPage(1)
  }

  // 查询
  const handleSearch = () => {
    setCurrentPage(1)
    toast.success('查询完成')
  }

  // 重置（恢复显示所有数据）
  const handleReset = () => {
    setFilters({
      dateRange: {
        start: new Date('2020-01-01'),
        end: new Date('2030-12-31')
      },
      tutorName: '',
      tutorId: ''
    })
    setCurrentPage(1)
    toast.success('已重置为显示所有数据')
  }

  // 刷新
  const handleRefresh = () => {
    const summaryData = getStoredTutorIncomeSummary()
    setData(summaryData)
    toast.success('数据已刷新')
  }

  // 导出
  const handleExport = () => {
    const dateStr = format(new Date(), 'yyyyMMdd')
    toast.success(`正在导出伴学教练收入_${dateStr}.xlsx...`)
    // TODO: 实际导出逻辑
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">伴学教练收入</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看所有伴学教练的收入汇总数据（开发模式：默认显示所有数据）
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
        </div>
      </div>

      {/* 筛选区 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 提示信息 */}
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
              <strong>🔧 开发模式</strong>: 当前显示所有时间范围的数据（共 {data.length} 条记录）
              {data.length === 0 && (
                <div className="mt-2">
                  💡 如果看不到数据，请在浏览器控制台执行: 
                  <code className="ml-2 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                    localStorage.removeItem('eduflow:tutor-income-summary'); location.reload();
                  </code>
                </div>
              )}
            </div>
            
            {/* 日期筛选和教练筛选 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 开始时间 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">开始时间</label>
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
                        format(filters.dateRange.start, "PPP", { locale: zhCN })
                      ) : (
                        <span>选择日期</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.start}
                      onSelect={(date) => date && setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: startOfDay(date) }
                      }))}
                      locale={zhCN}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 结束时间 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">结束时间</label>
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
                        format(filters.dateRange.end, "PPP", { locale: zhCN })
                      ) : (
                        <span>选择日期</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filters.dateRange.end}
                      onSelect={(date) => date && setFilters(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: endOfDay(date) }
                      }))}
                      locale={zhCN}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 伴学教练姓名输入 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">伴学教练</label>
                <Input
                  placeholder="输入教练姓名搜索"
                  value={filters.tutorName}
                  onChange={(e) => setFilters(prev => ({ ...prev, tutorName: e.target.value }))}
                  className="w-full"
                />
              </div>

              {/* 教练ID输入 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">教练ID</label>
                <Input
                  placeholder="输入教练ID搜索"
                  value={filters.tutorId}
                  onChange={(e) => setFilters(prev => ({ ...prev, tutorId: e.target.value }))}
                  className="w-full"
                />
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex gap-2">
                <Button onClick={handleSearch} className="flex-1">
                  查询
                </Button>
                <Button onClick={handleReset} variant="outline" className="flex-1">
                  重置
                </Button>
              </div>
            </div>

            {/* 快捷选择 */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <span className="text-sm text-muted-foreground">快捷选择:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="font-semibold"
              >
                🔧 显示全部
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickDateSelect('thisMonth')}
              >
                本月
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickDateSelect('lastMonth')}
              >
                上月
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickDateSelect('last3Months')}
              >
                近三月
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 数据列表 */}
      <Card>
        <CardHeader>
          <CardTitle>收入汇总列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>教练ID</TableHead>
                  <TableHead>伴学教练</TableHead>
                  <TableHead>试课费</TableHead>
                  <TableHead>成交奖励</TableHead>
                  <TableHead>课时费</TableHead>
                  <TableHead>管理费</TableHead>
                  <TableHead className="text-right">总收入</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="text-sm text-muted-foreground font-mono">{record.tutorId}</TableCell>
                      <TableCell className="font-medium">{record.tutorName}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-green-600">
                            ¥{record.trialFee.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.trialFee.count} 笔 · ¥200/次
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-orange-600">
                            ¥{record.dealReward.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.dealReward.count} 笔 · 按规则奖励
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-purple-600">
                            ¥{record.lessonFee.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.lessonFee.hours.toFixed(1)} 课时
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-bold text-cyan-600">
                            ¥{record.managementFee.amount.toLocaleString()}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {record.managementFee.hours.toFixed(1)} 课时 · ¥5/课时
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-bold text-lg text-blue-600">
                          ¥{record.totalIncome.toLocaleString()}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          所有类型收入总和
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {filteredData.length > 0 && (
            <div className="space-y-4 mt-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* 左侧：记录统计和每页数量选择 */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    共 {filteredData.length} 条记录
                    {filteredData.length > pageSize && (
                      <>，显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredData.length)} 条</>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">每页</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => handlePageSizeChange(parseInt(value))}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map(size => (
                          <SelectItem key={size} value={size.toString()}>
                            {size}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">条</span>
                  </div>
                </div>

                {/* 右侧：分页按钮 */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {getPageNumbers().map((page, index) => (
                      <Button
                        key={index}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => typeof page === 'number' && setCurrentPage(page)}
                        disabled={typeof page !== 'number'}
                        className="h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* 快速跳转 */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm text-muted-foreground">跳转到</span>
                  <Input
                    type="number"
                    min={1}
                    max={totalPages}
                    value={jumpToPage}
                    onChange={(e) => setJumpToPage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleJumpToPage()}
                    className="w-16 h-8 text-center"
                    placeholder={currentPage.toString()}
                  />
                  <span className="text-sm text-muted-foreground">页</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleJumpToPage}
                    className="h-8"
                  >
                    跳转
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">
                    （共 {totalPages} 页）
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
