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
import { getStoredIncomeRecords, getStoredOrders } from "@/lib/storage"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

const INCOME_TYPE_CONFIG = {
  [IncomeType.TRIAL_FEE]: {
    label: '试课费',
    badgeVariant: 'default' as const
  },
  [IncomeType.DEAL_REWARD]: {
    label: '成交奖励',
    badgeVariant: 'secondary' as const
  },
  [IncomeType.LESSON_FEE]: {
    label: '课时费',
    badgeVariant: 'outline' as const
  }
}

export default function LessonIncomePage() {
  const { user } = useAuth()
  const [records, setRecords] = useState<IncomeRecord[]>([])
  const [orderAccountMap, setOrderAccountMap] = useState<Record<string, string>>({})

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [jumpToPage, setJumpToPage] = useState('')

  const [filters, setFilters] = useState({
    dateRange: {
      start: new Date('2020-01-01'),
      end: new Date('2030-12-31')
    },
    incomeType: 'all'
  })

  useEffect(() => {
    loadRecords()
  }, [])

  const loadRecords = () => {
    const allRecords = getStoredIncomeRecords()
    const myRecords = allRecords.filter(record => record.teacherId === user?.id)
    setRecords(myRecords)

    const orders = getStoredOrders()
    const accountMap: Record<string, string> = {}
    for (const order of orders) {
      if (order.studentAccount) {
        accountMap[order.id] = order.studentAccount
      }
    }
    setOrderAccountMap(accountMap)
  }

  const getStudentGAccount = (record: IncomeRecord): string => {
    if (record.orderId && orderAccountMap[record.orderId]) {
      return orderAccountMap[record.orderId]
    }
    return '-'
  }

  const filteredRecords = useMemo(() => {
    return records.filter(record => {
      if (record.type !== IncomeType.TRIAL_FEE &&
          record.type !== IncomeType.DEAL_REWARD &&
          record.type !== IncomeType.LESSON_FEE) {
        return false
      }

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

      if (filters.dateRange.start && filters.dateRange.end) {
        const recordDate = new Date(record.occurredAt)
        if (recordDate < filters.dateRange.start || recordDate > filters.dateRange.end) {
          return false
        }
      }

      return true
    })
  }, [records, filters])

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
      trialFee: { amount: trialTotal, count: trialRecords.length },
      dealReward: { amount: dealTotal, count: dealRecords.length },
      lessonFee: { amount: lessonTotal, hours: totalHours }
    }
  }, [filteredRecords])

  const paginatedRecords = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize
    return filteredRecords.slice(startIndex, startIndex + pageSize)
  }, [filteredRecords, currentPage, pageSize])

  const totalPages = Math.ceil(filteredRecords.length / pageSize)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push('...')
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }

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

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
    toast.success(`已调整为每页显示 ${newSize} 条`)
  }

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

    setFilters(prev => ({ ...prev, dateRange: { start, end } }))
    setCurrentPage(1)
  }

  const handleSearch = () => {
    setCurrentPage(1)
    toast.success('查询完成')
  }

  const handleReset = () => {
    setFilters({
      dateRange: { start: new Date('2020-01-01'), end: new Date('2030-12-31') },
      incomeType: 'all'
    })
    setCurrentPage(1)
    toast.success('已重置为显示所有数据')
  }

  const handleRefresh = () => {
    loadRecords()
    toast.success('数据已刷新')
  }

  const handleExport = () => {
    toast.info('导出功能开发中...')
  }

  const getIncomeTypeLabel = (type: IncomeType) => {
    return INCOME_TYPE_CONFIG[type as keyof typeof INCOME_TYPE_CONFIG]?.label || type
  }

  const getQuantityUnit = (type: IncomeType) => {
    switch (type) {
      case IncomeType.TRIAL_FEE: return '次'
      case IncomeType.DEAL_REWARD: return '单'
      case IncomeType.LESSON_FEE: return '课时'
      default: return ''
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">课时收入</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看课时相关的收入记录（试课费、成交奖励、课时费）
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
              <Button variant="ghost" size="sm" onClick={handleReset} className="font-semibold">
                显示全部
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleQuickDateSelect('thisMonth')}>
                本月
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleQuickDateSelect('lastMonth')}>
                上月
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleQuickDateSelect('last3Months')}>
                近三月
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
              课时相关收入总和
            </p>
          </CardContent>
        </Card>

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
              {stats.lessonFee.hours.toFixed(1)} 课时
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 收入记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle>课时收入记录</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>收入类型</TableHead>
                  <TableHead>发生时间</TableHead>
                  <TableHead>学员姓名</TableHead>
                  <TableHead>学员G账号</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>年级</TableHead>
                  <TableHead className="text-right">单价</TableHead>
                  <TableHead className="text-right">数量</TableHead>
                  <TableHead className="text-right">收入金额</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      暂无课时收入记录
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Badge variant={INCOME_TYPE_CONFIG[record.type as keyof typeof INCOME_TYPE_CONFIG]?.badgeVariant}>
                          {getIncomeTypeLabel(record.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.occurredAt), "yyyy-MM-dd", { locale: zhCN })}
                      </TableCell>
                      <TableCell>{record.studentName || '-'}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {getStudentGAccount(record)}
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
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {filteredRecords.length > 0 && (
            <div className="space-y-4 mt-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
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
