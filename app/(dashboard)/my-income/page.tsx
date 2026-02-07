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
  Award,
  BookOpen,
  RefreshCw,
  CalendarIcon,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { toast } from "sonner"
import { IncomeRecord, IncomeType } from "@/types"
import { getStoredIncomeRecords } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 收入类型配置
const INCOME_TYPE_CONFIG = {
  [IncomeType.TRIAL_FEE]: {
    label: '试课费',
    color: 'bg-green-500',
    badgeVariant: 'default' as const
  },
  [IncomeType.DEAL_REWARD]: {
    label: '成交奖励',
    color: 'bg-orange-500',
    badgeVariant: 'secondary' as const
  },
  [IncomeType.LESSON_FEE]: {
    label: '课时费',
    color: 'bg-purple-500',
    badgeVariant: 'outline' as const
  }
}

export default function MyIncomePage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<IncomeRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [jumpToPage, setJumpToPage] = useState('')
  
  // 默认显示所有数据（方便研发人员查看）
  const [filters, setFilters] = useState({
    dateRange: {
      start: new Date('2020-01-01'), // 设置一个很早的日期
      end: new Date('2030-12-31')    // 设置一个很晚的日期
    },
    incomeType: 'all' // 'all' | 'trial' | 'deal' | 'lesson'
  })

  // 加载数据
  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = () => {
    const allRecords = getStoredIncomeRecords()
    console.log('📊 收入数据调试信息:')
    console.log('- 总记录数:', allRecords.length)
    console.log('- 当前用户ID:', user?.id)
    console.log('- 当前用户名:', user?.name)
    
    // 只显示当前用户的收入记录
    const myRecords = allRecords.filter(record => record.teacherId === user?.id)
    console.log('- 我的记录数:', myRecords.length)
    
    if (myRecords.length > 0) {
      console.log('- 第一条记录:', myRecords[0])
    }
    
    setRecords(myRecords)
  }

  // 筛选逻辑（开发模式：默认显示所有数据）
  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      // 收入类型筛选（仍然保留类型筛选功能）
      if (filters.incomeType !== 'all') {
        const typeMap: Record<string, IncomeType> = {
          'trial': IncomeType.TRIAL_FEE,
          'deal': IncomeType.DEAL_REWARD,
          'lesson': IncomeType.LESSON_FEE
        }
        if (record.type !== typeMap[filters.incomeType]) {
          return false
        }
      }
      
      // 日期范围筛选（如果用户手动修改了日期才生效）
      // 默认的2020-2030范围会显示所有数据
      if (filters.dateRange.start && filters.dateRange.end) {
        const recordDate = new Date(record.occurredAt)
        if (recordDate < filters.dateRange.start || recordDate > filters.dateRange.end) {
          return false
        }
      }
      
      return true
    })
  }, [records, filters])

  // 统计数据计算
  const stats = useMemo(() => {
    const trialRecords = filteredRecords.filter(r => r.type === IncomeType.TRIAL_FEE)
    const dealRecords = filteredRecords.filter(r => r.type === IncomeType.DEAL_REWARD)
    const lessonRecords = filteredRecords.filter(r => r.type === IncomeType.LESSON_FEE)
    
    const trialTotal = trialRecords.reduce((sum, r) => sum + r.amount, 0)
    const dealTotal = dealRecords.reduce((sum, r) => sum + r.amount, 0)
    const lessonTotal = lessonRecords.reduce((sum, r) => sum + r.amount, 0)
    const totalHours = lessonRecords.reduce((sum, r) => sum + r.quantity, 0)
    
    return {
      totalIncome: trialTotal + dealTotal + lessonTotal,
      trialFee: {
        amount: trialTotal,
        count: trialRecords.length
      },
      dealReward: {
        amount: dealTotal,
        count: dealRecords.length
      },
      lessonFee: {
        amount: lessonTotal,
        hours: totalHours
      }
    }
  }, [filteredRecords])

  // 分页数据
  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRecords.slice(startIndex, startIndex + pageSize)
  }, [filteredRecords, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRecords.length / pageSize)

  // 生成页码数组（智能显示）
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7 // 最多显示7个页码
    
    if (totalPages <= maxVisible) {
      // 如果总页数少，全部显示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // 总是显示第一页
      pages.push(1)
      
      if (currentPage > 3) {
        pages.push('...')
      }
      
      // 显示当前页附近的页码
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...')
      }
      
      // 总是显示最后一页
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

  // 改变每页显示数量
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1) // 重置到第一页
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
      incomeType: 'all'
    })
    setCurrentPage(1)
    toast.success('已重置为显示所有数据')
  }

  // 刷新数据
  const handleRefresh = () => {
    loadRecords()
    toast.success('数据已刷新')
  }

  // 导出Excel
  const handleExport = () => {
    toast.info('导出功能开发中...')
  }

  // 获取收入类型标签
  const getIncomeTypeLabel = (type: IncomeType) => {
    return INCOME_TYPE_CONFIG[type]?.label || type
  }

  // 获取关联信息
  const getRelatedInfo = (record: IncomeRecord) => {
    switch (record.type) {
      case IncomeType.TRIAL_FEE:
        return (
          <div className="space-y-1">
            <div>{record.studentName || '-'}</div>
            {record.orderId && (
              <div className="text-xs text-muted-foreground">
                订单号: {record.orderId}
              </div>
            )}
          </div>
        )
      case IncomeType.DEAL_REWARD:
        return (
          <div className="space-y-1">
            <div>{record.studentName || '-'}</div>
            {record.orderId && (
              <div className="text-xs text-muted-foreground">
                订单号: {record.orderId}
              </div>
            )}
          </div>
        )
      case IncomeType.LESSON_FEE:
        return (
          <div className="space-y-1">
            <div>{record.studentName || '-'}</div>
            {record.courseName && (
              <div className="text-xs text-muted-foreground">
                {record.courseName}
              </div>
            )}
          </div>
        )
      default:
        return '-'
    }
  }

  // 获取数量单位
  const getQuantityUnit = (type: IncomeType) => {
    switch (type) {
      case IncomeType.TRIAL_FEE:
        return '次'
      case IncomeType.DEAL_REWARD:
        return '单'
      case IncomeType.LESSON_FEE:
        return '课时'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">我的收入</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看和管理您的收入记录（开发模式：默认显示所有数据）
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出对账单
          </Button>
        </div>
      </div>

      {/* 筛选区 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 提示信息 */}
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-sm text-amber-800 dark:text-amber-200">
              <strong>🔧 开发模式</strong>: 当前显示所有时间范围的数据（共 {records.length} 条记录）
              {records.length === 0 && (
                <div className="mt-2">
                  💡 如果看不到数据，请在浏览器控制台执行: 
                  <code className="ml-2 bg-amber-100 dark:bg-amber-900 px-2 py-1 rounded">
                    localStorage.removeItem('eduflow:income-records'); location.reload();
                  </code>
                </div>
              )}
            </div>
            
            {/* 日期筛选 */}
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
                      locale={zhCN}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* 记录类型 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">记录类型</label>
                <Select
                  value={filters.incomeType}
                  onValueChange={(value) => {
                    setFilters(prev => ({ ...prev, incomeType: value }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择类型" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部</SelectItem>
                    <SelectItem value="trial">仅试课费</SelectItem>
                    <SelectItem value="deal">仅成交奖励</SelectItem>
                    <SelectItem value="lesson">仅课时费</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 操作按钮 */}
              <div className="space-y-2">
                <label className="text-sm font-medium invisible">操作</label>
                <div className="flex gap-2">
                  <Button onClick={handleSearch} className="flex-1">
                    查询
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="flex-1">
                    重置
                  </Button>
                </div>
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

      {/* 统计卡片区 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 总收入 */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
              总收入
            </CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
              ¥{stats.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              所有类型收入总和（{filteredRecords.length}条记录）
            </p>
          </CardContent>
        </Card>

        {/* 试课费 */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-900 dark:text-green-100">
              试课费
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900 dark:text-green-100">
              ¥{stats.trialFee.amount.toLocaleString()}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-1">
              {stats.trialFee.count} 笔 · ¥200/次
            </p>
          </CardContent>
        </Card>

        {/* 成交奖励 */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-900 dark:text-orange-100">
              成交奖励
            </CardTitle>
            <Award className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
              ¥{stats.dealReward.amount.toLocaleString()}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              {stats.dealReward.count} 笔 · 按规则奖励
            </p>
          </CardContent>
        </Card>

        {/* 课时费 */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-900 dark:text-purple-100">
              课时费
            </CardTitle>
            <BookOpen className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
              ¥{stats.lessonFee.amount.toLocaleString()}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
              {stats.lessonFee.hours.toFixed(1)} 课时 · 按课时单价
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>收入记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>收入类型</TableHead>
                  <TableHead>关联信息</TableHead>
                  <TableHead>发生时间</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>年级</TableHead>
                  <TableHead className="text-right">单价</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead className="text-right">收入金额</TableHead>
                  <TableHead>备注</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      暂无收入记录
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge variant={INCOME_TYPE_CONFIG[record.type]?.badgeVariant}>
                          {getIncomeTypeLabel(record.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getRelatedInfo(record)}</TableCell>
                      <TableCell>
                        {format(new Date(record.occurredAt), "yyyy-MM-dd", { locale: zhCN })}
                      </TableCell>
                      <TableCell>{record.subject || '-'}</TableCell>
                      <TableCell>{record.grade || '-'}</TableCell>
                      <TableCell className="text-right">
                        ¥{record.unitPrice}/{getQuantityUnit(record.type)}
                      </TableCell>
                      <TableCell className="text-right">
                        {record.quantity} {getQuantityUnit(record.type)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-lg">
                        ¥{record.amount.toLocaleString()}
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

          {/* 增强分页 */}
          {filteredRecords.length > 0 && (
            <div className="space-y-4 mt-4">
              {/* 分页控制 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* 左侧：记录统计和每页数量选择 */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    共 {filteredRecords.length} 条记录
                    {filteredRecords.length > pageSize && (
                      <>，显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredRecords.length)} 条</>
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
                    {/* 首页 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>

                    {/* 上一页 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    {/* 页码 */}
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

                    {/* 下一页 */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="h-8 w-8 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>

                    {/* 末页 */}
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
