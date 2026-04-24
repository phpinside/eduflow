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
  ChevronRight,
  Check
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { mockStudents } from "@/lib/mock-data/students"
import { mockUsers } from "@/lib/mock-data/users"
import { getStoredOrders, getStoredBranchCompanies } from "@/lib/storage"
import type { Order, BranchCompany } from "@/types"
import { OrderStatus, OrderType } from "@/types"
import { cn } from "@/lib/utils"
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP } from "@/lib/order-constants"



// 每页显示数量
const PAGE_SIZE = 10

export default function ManagerOrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [branchCompanies, setBranchCompanies] = React.useState<BranchCompany[]>([])

  React.useEffect(() => {
    setOrders(getStoredOrders())
    setBranchCompanies(getStoredBranchCompanies())
  }, [])

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
  
  const [campusAccountSearch, setCampusAccountSearch] = React.useState("")
  const [studentNameSearch, setStudentNameSearch] = React.useState("")
  const [studentAccountSearch, setStudentAccountSearch] = React.useState("")
  const [parentPhoneSearch, setParentPhoneSearch] = React.useState("")
  const [tutorNameSearch, setTutorNameSearch] = React.useState("")
  const [tutorPhoneSearch, setTutorPhoneSearch] = React.useState("")
  
  // 新增：分公司、负责人、专属客服、待审核客服多选筛选
  const [selectedBranches, setSelectedBranches] = React.useState<string[]>([])
  const [selectedManagers, setSelectedManagers] = React.useState<string[]>([])
  const [selectedCsNames, setSelectedCsNames] = React.useState<string[]>([])
  const [selectedPendingReviewers, setSelectedPendingReviewers] = React.useState<string[]>([])

  // 多选下拉框状态
  const [isBranchOpen, setIsBranchOpen] = React.useState(false)
  const [isManagerOpen, setIsManagerOpen] = React.useState(false)
  const [isCsOpen, setIsCsOpen] = React.useState(false)

  // 分页状态
  const [currentPage, setCurrentPage] = React.useState(1)

  // 获取所有唯一的学科和年级
  const { subjects, grades } = React.useMemo(() => {
    const subjectsSet = new Set<string>()
    const gradesSet = new Set<string>()
    orders.forEach((order) => {
      subjectsSet.add(order.subject)
      gradesSet.add(order.grade)
    })
    return {
      subjects: Array.from(subjectsSet).sort(),
      grades: Array.from(gradesSet).sort()
    }
  }, [orders])
  
  // 获取所有唯一的分公司、负责人、专属客服、待审核客服（用于多选筛选）
  const filterOptions = React.useMemo(() => {
    const branchesSet = new Set<string>()
    const managersSet = new Set<string>()
    const csNamesSet = new Set<string>()
    const pendingReviewersSet = new Set<string>()
    
    orders.forEach((order) => {
      const salesPerson = mockUsers.find(u => u.id === order.salesPersonId)
      const branchCompany = branchCompanies.find(b => b.id === salesPerson?.branchCompanyId)
      
      if (branchCompany?.name && branchCompany.name !== "—") {
        branchesSet.add(branchCompany.name)
      }
      if (branchCompany?.managerName && branchCompany.managerName !== "—") {
        managersSet.add(branchCompany.managerName)
      }
      if (branchCompany?.csName && branchCompany.csName !== "—") {
        csNamesSet.add(branchCompany.csName)
      }
      
      // 待审核客服：筛选状态为 PENDING_CS_REVIEW 的订单
      if (order.status === OrderStatus.PENDING_CS_REVIEW) {
        // 这里可以根据实际业务逻辑确定"待审核客服"的值
        // 暂时使用分公司名称作为标识
        if (branchCompany?.name && branchCompany.name !== "—") {
          pendingReviewersSet.add(branchCompany.name)
        }
      }
    })
    
    return {
      branches: Array.from(branchesSet).sort(),
      managers: Array.from(managersSet).sort(),
      csNames: Array.from(csNamesSet).sort(),
      pendingReviewers: Array.from(pendingReviewersSet).sort()
    }
  }, [orders, branchCompanies])

  // 切换状态选择
  const toggleStatus = (status: OrderStatus) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    )
    setCurrentPage(1) // 重置到第一页
  }
  
  // 切换分公司选择
  const toggleBranch = (branch: string) => {
    setSelectedBranches(prev =>
      prev.includes(branch)
        ? prev.filter(b => b !== branch)
        : [...prev, branch]
    )
    setCurrentPage(1)
  }
  
  // 切换负责人选择
  const toggleManager = (manager: string) => {
    setSelectedManagers(prev =>
      prev.includes(manager)
        ? prev.filter(m => m !== manager)
        : [...prev, manager]
    )
    setCurrentPage(1)
  }
  
  // 切换专属客服选择
  const toggleCsName = (csName: string) => {
    setSelectedCsNames(prev =>
      prev.includes(csName)
        ? prev.filter(c => c !== csName)
        : [...prev, csName]
    )
    setCurrentPage(1)
  }
  
  // 切换待审核客服选择
  const togglePendingReviewer = (reviewer: string) => {
    setSelectedPendingReviewers(prev =>
      prev.includes(reviewer)
        ? prev.filter(r => r !== reviewer)
        : [...prev, reviewer]
    )
    setCurrentPage(1)
  }

  // 筛选后的订单
  const filteredOrders = React.useMemo(() => {
    const now = new Date()
    return orders.map((order) => {
      const student = mockStudents.find(s => s.id === order.studentId)
      const tutor = mockUsers.find(u => u.id === order.assignedTeacherId)
      const salesPerson = mockUsers.find(u => u.id === order.salesPersonId)
      const branchCompany = branchCompanies.find(b => b.id === salesPerson?.branchCompanyId)
      
      // 计算最近的预约时间
      let nearestScheduledTime: Date | null = null
      if (order.scheduledAt) {
        nearestScheduledTime = new Date(order.scheduledAt)
      } else if (order.firstLessonTime) {
        // 尝试解析 firstLessonTime（自由文本格式）
        const parsed = new Date(order.firstLessonTime)
        if (!isNaN(parsed.getTime())) {
          nearestScheduledTime = parsed
        }
      }
      
      return {
        ...order,
        studentName: student?.name || "未知",
        _parentPhone: student?.parentPhone || "",
        _tutorName: tutor?.name || "",
        _tutorPhone: tutor?.phone || "",
        _branchName: branchCompany?.name || "—",
        _branchManager: branchCompany?.managerName || "—",
        _branchCs: branchCompany?.csName || "—",
        _nearestScheduledTime: nearestScheduledTime,
      }
    }).filter(order => {
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

      // 9800校区手机号筛选
      if (campusAccountSearch && !(order.campusAccount || "").toLowerCase().includes(campusAccountSearch.toLowerCase())) {
        return false
      }

      // 学员姓名筛选
      if (studentNameSearch && !order.studentName.toLowerCase().includes(studentNameSearch.toLowerCase())) {
        return false
      }

      // 学员G账号筛选
      if (studentAccountSearch && !(order.studentAccount || "").toLowerCase().includes(studentAccountSearch.toLowerCase())) {
        return false
      }

      // 家长手机号筛选
      if (parentPhoneSearch && !order._parentPhone.toLowerCase().includes(parentPhoneSearch.toLowerCase())) {
        return false
      }

      // 教练姓名筛选
      if (tutorNameSearch && !order._tutorName.toLowerCase().includes(tutorNameSearch.toLowerCase())) {
        return false
      }

      // 教练手机号筛选
      if (tutorPhoneSearch && !order._tutorPhone.toLowerCase().includes(tutorPhoneSearch.toLowerCase())) {
        return false
      }
      
      // 分公司筛选（多选）
      if (selectedBranches.length > 0 && !selectedBranches.includes(order._branchName)) {
        return false
      }
      
      // 负责人筛选（多选）
      if (selectedManagers.length > 0 && !selectedManagers.includes(order._branchManager)) {
        return false
      }
      
      // 专属客服筛选（多选）
      if (selectedCsNames.length > 0 && !selectedCsNames.includes(order._branchCs)) {
        return false
      }
      
      // 待审核客服筛选（多选）- 筛选状态为 PENDING_CS_REVIEW 且属于选定分公司的订单
      if (selectedPendingReviewers.length > 0) {
        if (order.status !== OrderStatus.PENDING_CS_REVIEW) {
          return false
        }
        if (!selectedPendingReviewers.includes(order._branchName)) {
          return false
        }
      }

      return true
    }).sort((a, b) => {
      // 按距离当前时间最近的预约时间排序（由近及远）
      const timeA = a._nearestScheduledTime?.getTime() || Number.MAX_SAFE_INTEGER
      const timeB = b._nearestScheduledTime?.getTime() || Number.MAX_SAFE_INTEGER
      return timeA - timeB
    })
  }, [
    orders,
    orderIdSearch,
    dateRange,
    orderTypeFilter,
    subjectFilter,
    gradeFilter,
    selectedStatuses,
    campusAccountSearch,
    studentNameSearch,
    studentAccountSearch,
    parentPhoneSearch,
    tutorNameSearch,
    tutorPhoneSearch,
    selectedBranches,
    selectedManagers,
    selectedCsNames,
    selectedPendingReviewers,
  ])

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
    setCampusAccountSearch("")
    setStudentNameSearch("")
    setStudentAccountSearch("")
    setParentPhoneSearch("")
    setTutorNameSearch("")
    setTutorPhoneSearch("")
    setSelectedBranches([])
    setSelectedManagers([])
    setSelectedCsNames([])
    setSelectedPendingReviewers([])
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

            {/* 第三行：9800校区手机号、学员姓名、学员G账号 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">9800校区手机号</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="输入校区手机号搜索..."
                    className="pl-9"
                    value={campusAccountSearch}
                    onChange={(e) => {
                      setCampusAccountSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">学员姓名</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="输入学员姓名搜索..."
                    className="pl-9"
                    value={studentNameSearch}
                    onChange={(e) => {
                      setStudentNameSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">学员G账号</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="输入学员G账号搜索..."
                    className="pl-9"
                    value={studentAccountSearch}
                    onChange={(e) => {
                      setStudentAccountSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 第四行：家长手机号、教练姓名、教练手机号 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">家长手机号</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="输入家长手机号搜索..."
                    className="pl-9"
                    value={parentPhoneSearch}
                    onChange={(e) => {
                      setParentPhoneSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">教练姓名</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="输入教练姓名搜索..."
                    className="pl-9"
                    value={tutorNameSearch}
                    onChange={(e) => {
                      setTutorNameSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">教练手机号</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="输入教练手机号搜索..."
                    className="pl-9"
                    value={tutorPhoneSearch}
                    onChange={(e) => {
                      setTutorPhoneSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 第五行：订单状态（多选标签） */}
            <div>
              <label className="text-sm font-medium mb-2 block">订单状态（可多选）</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ORDER_STATUS_MAP).map(([status, label]) => {
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
            
            {/* 第六行：分公司、负责人、专属客服（紧凑布局） */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 分公司多选下拉框 */}
              {filterOptions.branches.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">分公司</label>
                  <Popover open={isBranchOpen} onOpenChange={setIsBranchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isBranchOpen}
                        className="w-full justify-between"
                      >
                        {selectedBranches.length > 0
                          ? `已选择 ${selectedBranches.length} 项`
                          : "选择分公司..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="搜索分公司..." />
                        <CommandList>
                          <CommandEmpty>未找到分公司</CommandEmpty>
                          <CommandGroup>
                            {filterOptions.branches.map((branch) => (
                              <CommandItem
                                key={branch}
                                onSelect={() => {
                                  toggleBranch(branch)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedBranches.includes(branch) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {branch}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              
              {/* 负责人多选下拉框 */}
              {filterOptions.managers.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">负责人</label>
                  <Popover open={isManagerOpen} onOpenChange={setIsManagerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isManagerOpen}
                        className="w-full justify-between"
                      >
                        {selectedManagers.length > 0
                          ? `已选择 ${selectedManagers.length} 项`
                          : "选择负责人..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="搜索负责人..." />
                        <CommandList>
                          <CommandEmpty>未找到负责人</CommandEmpty>
                          <CommandGroup>
                            {filterOptions.managers.map((manager) => (
                              <CommandItem
                                key={manager}
                                onSelect={() => {
                                  toggleManager(manager)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedManagers.includes(manager) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {manager}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              
              {/* 专属客服多选下拉框 */}
              {filterOptions.csNames.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-2 block">专属客服</label>
                  <Popover open={isCsOpen} onOpenChange={setIsCsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCsOpen}
                        className="w-full justify-between"
                      >
                        {selectedCsNames.length > 0
                          ? `已选择 ${selectedCsNames.length} 项`
                          : "选择专属客服..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="搜索专属客服..." />
                        <CommandList>
                          <CommandEmpty>未找到专属客服</CommandEmpty>
                          <CommandGroup>
                            {filterOptions.csNames.map((csName) => (
                              <CommandItem
                                key={csName}
                                onSelect={() => {
                                  toggleCsName(csName)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCsNames.includes(csName) ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {csName}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}
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
                  <TableHead className="w-[140px]">订单号</TableHead>
                  <TableHead className="w-[80px]">类型</TableHead>
                  <TableHead className="w-[100px]">学生</TableHead>
                  <TableHead className="w-[120px]">年级/科目</TableHead>
                  <TableHead className="w-[180px]">分公司信息</TableHead>
                  <TableHead className="w-[150px]">预约/首课时间</TableHead>
                  <TableHead className="w-[80px]">课时数</TableHead>
                  <TableHead className="w-[100px]">状态</TableHead>
                  <TableHead className="w-[80px]">申请</TableHead>
                  <TableHead className="min-w-[150px]">备注</TableHead>
                  <TableHead className="w-[140px]">创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length > 0 ? (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        <button
                          onClick={() => router.push(`/manager-orders/${order.id}`)}
                          className="text-primary hover:underline cursor-pointer text-sm"
                        >
                          {order.id}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {order.type === OrderType.TRIAL ? "试课" : "正课"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">{order.studentName}</TableCell>
                      <TableCell className="text-sm">{order.grade} {order.subject}</TableCell>
                      
                      {/* 分公司信息整合列 */}
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground shrink-0">分公司:</span>
                            <span className="font-medium text-blue-700">{order._branchName}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground shrink-0">负责人:</span>
                            <span>{order._branchManager}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground shrink-0">客服:</span>
                            <span>{order._branchCs}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      {/* 预约/首课时间 */}
                      <TableCell>
                        {order._nearestScheduledTime ? (
                          <div className="text-sm">
                            {format(order._nearestScheduledTime, "MM-dd HH:mm", { locale: zhCN })}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">未设置</span>
                        )}
                      </TableCell>
                      
                      {/* 课时数 */}
                      <TableCell>
                        <div className="text-sm font-semibold text-primary">
                          {order.totalHours}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={ORDER_STATUS_COLOR_MAP[order.status]} className="text-xs">
                          {ORDER_STATUS_MAP[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-sm">{order.applicantIds?.length || 0}</span>
                        </div>
                      </TableCell>
                      
                      {/* 备注信息 */}
                      <TableCell>
                        <div className="text-xs max-w-[200px] truncate" title={order.remarks}>
                          {order.remarks || '-'}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="h-24 text-center">
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
