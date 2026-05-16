"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
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
import { Badge } from "@/components/ui/badge"
import {
  RefreshCw,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileCheck,
} from "lucide-react"
import { toast } from "sonner"
import { Role, User } from "@/types"
import {
  getStoredUsers,
  getStoredIncomeRecords,
  getStoredManagementIncomeDetails,
  getStoredBillConfirmations,
} from "@/lib/storage"

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

interface BillRecord {
  userId: string
  name: string
  phone: string
  managerName: string
  year: number
  month: number
  totalAmount: number
  confirmed: boolean
  confirmedAt: Date | null
}

function generateBillRecords(): BillRecord[] {
  const users = getStoredUsers() as User[]
  const incomeRecords = getStoredIncomeRecords()
  const mgmtRecords = getStoredManagementIncomeDetails()
  const billConfirmations = getStoredBillConfirmations()

  const tutorsAndManagers = users.filter(
    u => u.roles.includes(Role.TUTOR) || u.roles.includes(Role.MANAGER)
  )

  const monthSet = new Set<string>()
  incomeRecords.forEach(r => {
    const d = new Date(r.occurredAt)
    monthSet.add(`${d.getFullYear()}-${d.getMonth() + 1}`)
  })
  mgmtRecords.forEach(r => {
    const d = new Date(r.occurredAt)
    monthSet.add(`${d.getFullYear()}-${d.getMonth() + 1}`)
  })

  const records: BillRecord[] = []

  for (const user of tutorsAndManagers) {
    for (const key of monthSet) {
      const [yearStr, monthStr] = key.split("-")
      const year = parseInt(yearStr)
      const month = parseInt(monthStr)

      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)

      const myIncome = incomeRecords.filter(r => {
        if (r.teacherId !== user.id) return false
        const d = new Date(r.occurredAt)
        return d >= startDate && d <= endDate
      })

      const totalIncomeAmount = myIncome.reduce((s, r) => s + r.amount, 0)

      let mgmtAmount = 0
      if (user.roles.includes(Role.MANAGER)) {
        const myMgmt = mgmtRecords.filter(r => {
          if (r.teamLeaderId !== user.id) return false
          const d = new Date(r.occurredAt)
          return d >= startDate && d <= endDate
        })
        mgmtAmount = myMgmt.reduce((s, r) => s + r.amount, 0)
      }

      const totalAmount = totalIncomeAmount + mgmtAmount

      const userBills = billConfirmations[user.id]
      const bill = userBills?.find(b => b.year === year && b.month === month)

      records.push({
        userId: user.id,
        name: user.name,
        phone: user.phone,
        managerName: user.managerName || "-",
        year,
        month,
        totalAmount,
        confirmed: !!bill,
        confirmedAt: bill ? new Date(bill.confirmedAt) : null,
      })
    }
  }

  records.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    if (a.month !== b.month) return b.month - a.month
    return a.name.localeCompare(b.name, "zh-CN")
  })

  return records
}

export default function TutorBillRecordsPage() {
  const [data, setData] = useState<BillRecord[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [jumpToPage, setJumpToPage] = useState("")

  const [filterYear, setFilterYear] = useState<string>("all")
  const [filterMonth, setFilterMonth] = useState<string>("all")
  const [searchKeyword, setSearchKeyword] = useState("")

  const loadData = useCallback(() => {
    const records = generateBillRecords()
    setData(records)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const yearOptions = useMemo(() => {
    const years = new Set<number>()
    data.forEach(r => years.add(r.year))
    return Array.from(years).sort((a, b) => b - a)
  }, [data])

  const filteredData = useMemo(() => {
    return data.filter(record => {
      if (filterYear !== "all" && record.year !== parseInt(filterYear)) return false
      if (filterMonth !== "all" && record.month !== parseInt(filterMonth)) return false
      if (searchKeyword) {
        const kw = searchKeyword.trim().toLowerCase()
        const matchName = record.name.toLowerCase().includes(kw)
        const matchPhone = record.phone.includes(kw)
        if (!matchName && !matchPhone) return false
      }
      return true
    })
  }, [data, filterYear, filterMonth, searchKeyword])

  const totalPages = Math.ceil(filteredData.length / pageSize)

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredData.slice(start, start + pageSize)
  }, [filteredData, currentPage, pageSize])

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }

  const handleJumpToPage = () => {
    const page = parseInt(jumpToPage)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setJumpToPage("")
    } else {
      toast.error(`请输入 1-${totalPages} 之间的页码`)
    }
  }

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize)
    setCurrentPage(1)
  }

  const handleReset = () => {
    setFilterYear("all")
    setFilterMonth("all")
    setSearchKeyword("")
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    loadData()
    toast.success("数据已刷新")
  }

  const handleExport = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "")
    toast.success(`正在导出伴学账单记录_${dateStr}.xlsx...`)
  }

  const summaryStats = useMemo(() => {
    const total = filteredData.length
    const confirmed = filteredData.filter(r => r.confirmed).length
    const pending = total - confirmed
    const totalAmount = filteredData.reduce((s, r) => s + r.totalAmount, 0)
    return { total, confirmed, pending, totalAmount }
  }, [filteredData])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">伴学账单记录</h1>
          <p className="text-sm text-muted-foreground mt-1">
            查看伴学教练和学管的月度账单确认状态
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总记录数</p>
                <p className="text-2xl font-bold">{summaryStats.total}</p>
              </div>
              <FileCheck className="h-8 w-8 text-muted-foreground/40" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已确认 / 待确认</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-green-600">{summaryStats.confirmed}</span>
                  <span className="text-lg text-muted-foreground">/</span>
                  <span className="text-2xl font-bold text-amber-600">{summaryStats.pending}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">账单总金额</p>
                <p className="text-2xl font-bold">
                  ¥{summaryStats.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">年份</label>
                <Select value={filterYear} onValueChange={v => { setFilterYear(v); setCurrentPage(1) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部年份" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部年份</SelectItem>
                    {yearOptions.map(y => (
                      <SelectItem key={y} value={y.toString()}>{y}年</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">月份</label>
                <Select value={filterMonth} onValueChange={v => { setFilterMonth(v); setCurrentPage(1) }}>
                  <SelectTrigger>
                    <SelectValue placeholder="全部月份" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部月份</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                      <SelectItem key={m} value={m.toString()}>{m}月</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">姓名 / 手机号</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索姓名或手机号"
                    value={searchKeyword}
                    onChange={e => { setSearchKeyword(e.target.value); setCurrentPage(1) }}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button variant="outline" onClick={handleReset} className="w-full">
                  重置筛选
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>账单记录列表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>学管姓名</TableHead>
                  <TableHead>账单月份</TableHead>
                  <TableHead className="text-right">账单金额</TableHead>
                  <TableHead>确认状态</TableHead>
                  <TableHead>确认时间</TableHead>
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
                    <TableRow key={`${record.userId}-${record.year}-${record.month}`}>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">
                        {record.phone}
                      </TableCell>
                      <TableCell>{record.managerName}</TableCell>
                      <TableCell>
                        {record.year}年{record.month}月
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{record.totalAmount.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {record.confirmed ? (
                          <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                            已确认
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">
                            待确认
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {record.confirmedAt
                          ? new Date(record.confirmedAt).toLocaleString("zh-CN", {
                              year: "numeric",
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {filteredData.length > 0 && (
            <div className="space-y-4 mt-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    共 {filteredData.length} 条记录
                    {filteredData.length > pageSize && (
                      <>
                        ，显示第 {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredData.length)} 条
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">每页</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={v => handlePageSizeChange(parseInt(v))}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAGE_SIZE_OPTIONS.map(size => (
                          <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">条</span>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="h-8 w-8 p-0">
                      <ChevronsLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="h-8 w-8 p-0">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    {getPageNumbers().map((page, index) => (
                      <Button
                        key={index}
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => typeof page === "number" && setCurrentPage(page)}
                        disabled={typeof page !== "number"}
                        className="h-8 w-8 p-0"
                      >
                        {page}
                      </Button>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="h-8 w-8 p-0">
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
                    onChange={e => setJumpToPage(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleJumpToPage()}
                    className="w-16 h-8 text-center"
                    placeholder={currentPage.toString()}
                  />
                  <span className="text-sm text-muted-foreground">页</span>
                  <Button variant="outline" size="sm" onClick={handleJumpToPage} className="h-8">
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
