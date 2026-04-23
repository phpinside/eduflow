"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import { format, startOfDay, endOfDay, subDays } from "date-fns"
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
import { FinancialRecord, Order, BranchCompany } from "@/types"
import { getStoredFinancialRecords, getStoredOrders, getStoredStudents, getStoredBranchCompanies, getStoredUsers } from "@/lib/storage"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 30
const FINANCIAL_FILTERS_SESSION_KEY = "eduflow:financial-records:filters:v1"
const FINANCIAL_RECHARGE_STATUS_KEY = "eduflow:financial-records:g-account-recharge-status:v1"

type FinancialFilters = {
  salesName: string
  salesPhone: string
  excludeSalesNames: string
  dateRange: {
    start: Date | null
    end: Date | null
  }
  recordType: string
  courseType: string
  subject: string
  studentName: string
  campusName: string
  campusAccount: string
  studentAccount: string
  remarksKeyword: string
}

type EnrichedFinancialRecord = FinancialRecord & {
  order?: Order
  orderTypeLabel: string
  subject: string
  feeStandard: string
  totalHours: string
  studentName: string
  parentPhone: string
  campusName: string
  campusAccount: string
  studentAccount: string
  dingbanxueRechargeRequired: "需要代缴" | "-"
  gAccountRechargeStatus: "待充值" | "已充值" | "无需充值"
  branchName: string
  branchCsName: string
}

const buildDefaultFilters = (): FinancialFilters => ({
  salesName: '',
  salesPhone: '',
  excludeSalesNames: '',
  dateRange: {
    start: startOfDay(subDays(new Date(), 2)),
    end: endOfDay(new Date())
  },
  recordType: 'all',
  courseType: 'all',
  subject: '',
  studentName: '',
  campusName: '',
  campusAccount: '',
  studentAccount: '',
  remarksKeyword: '',
})

export default function FinancialRecordsPage() {
  const [records, setRecords] = useState<FinancialRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [rechargeStatusMap, setRechargeStatusMap] = useState<Record<string, "待充值" | "已充值">>({})
  const [filters, setFilters] = useState<FinancialFilters>(buildDefaultFilters())

  // 加载数据 + 恢复会话筛选
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(FINANCIAL_FILTERS_SESSION_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setFilters((prev) => ({
          ...prev,
          ...parsed,
          dateRange: {
            start: parsed?.dateRange?.start ? new Date(parsed.dateRange.start) : prev.dateRange.start,
            end: parsed?.dateRange?.end ? new Date(parsed.dateRange.end) : prev.dateRange.end,
          },
        }))
      }
    } catch {
      // ignore malformed session data
    }
    loadRecords()
    try {
      const rawStatus = localStorage.getItem(FINANCIAL_RECHARGE_STATUS_KEY)
      if (rawStatus) {
        setRechargeStatusMap(JSON.parse(rawStatus))
      }
    } catch {
      // ignore malformed local data
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(FINANCIAL_RECHARGE_STATUS_KEY, JSON.stringify(rechargeStatusMap))
  }, [rechargeStatusMap])

  useEffect(() => {
    sessionStorage.setItem(
      FINANCIAL_FILTERS_SESSION_KEY,
      JSON.stringify({
        ...filters,
        dateRange: {
          start: filters.dateRange.start?.toISOString() ?? null,
          end: filters.dateRange.end?.toISOString() ?? null,
        },
      })
    )
  }, [filters])

  function loadRecords() {
    setRecords(getStoredFinancialRecords())
  }

  const enrichedRecords = useMemo<EnrichedFinancialRecord[]>(() => {
    const orders = getStoredOrders()
    const students = getStoredStudents()
    const branchCompanies = getStoredBranchCompanies()
    const users = getStoredUsers()
    return records.map((record) => {
      const order = orders.find((o) => o.id === record.orderId)
      const student = order ? students.find((s) => s.id === order.studentId) : undefined
      const salesPerson = users.find((u) => u.id === record.salesPersonId)
      const branchCompany = branchCompanies.find(b => b.id === salesPerson?.branchCompanyId)
      const rechargeRequired = order?.needsDingbanxueRecharge !== false
      const isRegularRechargeScenario = order?.type === "REGULAR" && record.type === "RECHARGE"
      const isRegularRecharge = isRegularRechargeScenario && rechargeRequired
      return {
        ...record,
        order,
        orderTypeLabel: order ? (order.type === "TRIAL" ? "试课" : "正课") : "-",
        subject: order?.subject ?? "-",
        feeStandard: order?.grade ?? "-",
        totalHours: order ? `${order.totalHours}` : "-",
        studentName: student?.name ?? "-",
        parentPhone: student?.parentPhone ?? "-",
        campusName: order?.campusName ?? "-",
        campusAccount: order?.campusAccount ?? "-",
        studentAccount: order?.studentAccount ?? "-",
        dingbanxueRechargeRequired: isRegularRecharge ? "需要代缴" : "-",
        gAccountRechargeStatus:
          isRegularRecharge ? (rechargeStatusMap[record.id] ?? "待充值") : "无需充值",
        branchName: branchCompany?.name || "—",
        branchCsName: branchCompany?.csName || "—",
      }
    })
  }, [records, rechargeStatusMap])

  const toggleRechargeStatus = (recordId: string, current: "待充值" | "已充值" | "无需充值") => {
    if (current === "无需充值") return
    const next = current === "待充值" ? "已充值" : "待充值"
    setRechargeStatusMap((prev) => ({ ...prev, [recordId]: next }))
    toast.success(`G账号充值状态已更新为：${next}`)
  }

  // 筛选逻辑
  const filteredRecords = useMemo(() => {
    const excludedSalesNames = filters.excludeSalesNames
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)

    return enrichedRecords.filter(record => {
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

      // 课程类型筛选
      if (filters.courseType !== 'all') {
        const target = filters.courseType === "trial" ? "TRIAL" : "REGULAR"
        if (record.order?.type !== target) return false
      }

      if (filters.subject && !record.subject.includes(filters.subject)) return false
      if (filters.studentName && !record.studentName.includes(filters.studentName)) return false
      if (filters.campusName && !record.campusName.includes(filters.campusName)) return false
      if (filters.campusAccount && !record.campusAccount.includes(filters.campusAccount)) return false
      if (filters.studentAccount && !record.studentAccount.includes(filters.studentAccount)) return false
      if (filters.remarksKeyword && !String(record.remarks || "").includes(filters.remarksKeyword)) return false

      // 排除招生老师（多个，逗号分隔）
      if (
        excludedSalesNames.length > 0 &&
        excludedSalesNames.some((name) => record.salesPersonName?.includes(name))
      ) {
        return false
      }
      
      return true
    })
  }, [enrichedRecords, filters])

  // 统计数据计算
  const stats = useMemo(() => {
    const recharges = filteredRecords.filter(r => r.type === 'RECHARGE')
    const refunds = filteredRecords.filter(r => r.type === 'REFUND')
    const chargedRecords = filteredRecords.filter(r => r.gAccountRechargeStatus === "已充值")
    
    const totalRecharge = recharges.reduce((sum, r) => sum + r.amount, 0)
    const totalRefund = Math.abs(refunds.reduce((sum, r) => sum + r.amount, 0))
    const totalRechargeHours = chargedRecords.reduce((sum, r) => {
      const h = Number(r.totalHours)
      return sum + (Number.isFinite(h) ? h : 0)
    }, 0)
    const dingbanxueRechargeExpense = totalRechargeHours * 20
    
    return {
      totalIncome: totalRecharge - totalRefund,
      totalRecharge,
      totalRefund,
      rechargeCount: recharges.length,
      refundCount: refunds.length,
      dingbanxueRechargeExpense,
      totalRechargeHours,
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
    setFilters(buildDefaultFilters())
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
                    selected={filters.dateRange.start ?? undefined}
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
                    selected={filters.dateRange.end ?? undefined}
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

            <div className="space-y-2">
              <label className="text-sm font-medium">课程类型</label>
              <Select
                value={filters.courseType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, courseType: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="trial">试课</SelectItem>
                  <SelectItem value="regular">正课</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">科目</label>
              <Input
                placeholder="输入科目"
                value={filters.subject}
                onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">学生姓名</label>
              <Input
                placeholder="输入学生姓名"
                value={filters.studentName}
                onChange={(e) => setFilters(prev => ({ ...prev, studentName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">校区名称</label>
              <Input
                placeholder="输入校区名称"
                value={filters.campusName}
                onChange={(e) => setFilters(prev => ({ ...prev, campusName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">校区账号</label>
              <Input
                placeholder="输入校区账号"
                value={filters.campusAccount}
                onChange={(e) => setFilters(prev => ({ ...prev, campusAccount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">学生账号（G）</label>
              <Input
                placeholder="输入学生账号"
                value={filters.studentAccount}
                onChange={(e) => setFilters(prev => ({ ...prev, studentAccount: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">备注关键词</label>
              <Input
                placeholder="备注模糊匹配"
                value={filters.remarksKeyword}
                onChange={(e) => setFilters(prev => ({ ...prev, remarksKeyword: e.target.value }))}
              />
            </div>

            <div className="space-y-2 lg:col-span-2">
              <label className="text-sm font-medium">排除招生老师（逗号分隔）</label>
              <Input
                placeholder="例：张招生,李销售"
                value={filters.excludeSalesNames}
                onChange={(e) => setFilters(prev => ({ ...prev, excludeSalesNames: e.target.value }))}
              />
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
      <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">鼎伴学账号充值支出</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ¥{stats.dingbanxueRechargeExpense.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              已充值课时 {stats.totalRechargeHours.toLocaleString()} × 20 元/课时
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
                  <TableHead>课程类型</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>课费标准</TableHead>
                  <TableHead>总课时</TableHead>
                  <TableHead>学生姓名</TableHead>
                  <TableHead>家长电话</TableHead>
                  <TableHead>校区名称</TableHead>
                  <TableHead>校区账号</TableHead>
                  <TableHead>学生账号</TableHead>
                  <TableHead>分公司</TableHead>
                  <TableHead>专属客服</TableHead>
                  <TableHead>是否代缴鼎伴学</TableHead>
                  <TableHead>G账号充值状态</TableHead>
                  <TableHead>金额</TableHead>
                  <TableHead>招生老师</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>交易时间</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={21} className="text-center py-8 text-muted-foreground">
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
                      <TableCell>{record.orderTypeLabel}</TableCell>
                      <TableCell>{record.subject}</TableCell>
                      <TableCell>{record.feeStandard}</TableCell>
                      <TableCell>{record.totalHours}</TableCell>
                      <TableCell>{record.studentName}</TableCell>
                      <TableCell>{record.parentPhone}</TableCell>
                      <TableCell>{record.campusName}</TableCell>
                      <TableCell>{record.campusAccount}</TableCell>
                      <TableCell>{record.studentAccount}</TableCell>
                      <TableCell>{record.branchName}</TableCell>
                      <TableCell>{record.branchCsName}</TableCell>
                      <TableCell>{record.dingbanxueRechargeRequired}</TableCell>
                      <TableCell>
                        <Badge
                          variant={record.gAccountRechargeStatus === "已充值" ? "default" : "outline"}
                          className={
                            record.gAccountRechargeStatus === "待充值"
                              ? "border-amber-400 text-amber-700"
                              : record.gAccountRechargeStatus === "无需充值"
                                ? "border-muted-foreground/30 text-muted-foreground"
                                : ""
                          }
                        >
                          {record.gAccountRechargeStatus}
                        </Badge>
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
                      <TableCell className="text-right">
                        {(record.gAccountRechargeStatus === "待充值" ||
                          record.gAccountRechargeStatus === "已充值") && (
                          <Button
                            variant={record.gAccountRechargeStatus === "待充值" ? "default" : "outline"}
                            size="sm"
                            onClick={() => toggleRechargeStatus(record.id, record.gAccountRechargeStatus)}
                          >
                            {record.gAccountRechargeStatus === "待充值" ? "已充值" : "取消充值"}
                          </Button>
                        )}
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
