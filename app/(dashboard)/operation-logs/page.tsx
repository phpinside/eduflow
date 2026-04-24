"use client"

import { useState, useMemo, useEffect } from "react"
import { format } from "date-fns"
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
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { 
  CalendarIcon,
  Search,
  RefreshCw,
  FileText,
  User,
  Target,
  Clock
} from "lucide-react"
import { OperationLog, OperationLogType, OperationAction, OperationLogFilter } from "@/types/operation-log"
import { getStoredOperationLogs, getStoredUsers } from "@/lib/storage"
import { cn } from "@/lib/utils"

const ITEMS_PER_PAGE = 30

// 操作类型映射
const OPERATION_TYPE_MAP: Record<OperationLogType, string> = {
  [OperationLogType.ORDER]: "订单操作",
  [OperationLogType.REFUND]: "退费操作",
  [OperationLogType.USER]: "用户管理",
  [OperationLogType.STUDY_PLAN]: "学习规划书",
  [OperationLogType.FINANCE]: "财务操作",
  [OperationLogType.SYSTEM]: "系统操作",
}

// 操作动作映射
const OPERATION_ACTION_MAP: Record<OperationAction, string> = {
  // 订单相关
  [OperationAction.CREATE]: "创建",
  [OperationAction.UPDATE]: "更新",
  [OperationAction.DELETE]: "删除",
  [OperationAction.STATUS_CHANGE]: "状态变更",
  [OperationAction.ASSIGN]: "分配",
  [OperationAction.REVIEW_APPROVE]: "审核通过",
  [OperationAction.REVIEW_REJECT]: "审核驳回",
  [OperationAction.PAYMENT]: "支付",
  
  // 退费相关
  [OperationAction.REFUND_APPLY]: "退费申请",
  [OperationAction.REFUND_FIRST_APPROVE]: "一审通过",
  [OperationAction.REFUND_FIRST_REJECT]: "一审驳回",
  [OperationAction.REFUND_SECOND_APPROVE]: "二审通过",
  [OperationAction.REFUND_SECOND_REJECT]: "二审驳回",
  [OperationAction.REFUND_WITHDRAW]: "撤回",
  [OperationAction.REFUND_EXECUTE]: "执行退费",
  
  // 用户相关
  [OperationAction.USER_CREATE]: "创建用户",
  [OperationAction.USER_UPDATE]: "更新用户",
  [OperationAction.USER_APPROVE]: "审核通过",
  [OperationAction.USER_REJECT]: "审核驳回",
  [OperationAction.USER_ROLE_CHANGE]: "角色变更",
  
  // 财务相关
  [OperationAction.RECHARGE_STATUS_CHANGE]: "充值状态变更",
  [OperationAction.UPLOAD_VOUCHER]: "上传凭证",
}

// 操作类型颜色映射
const OPERATION_TYPE_COLOR_MAP: Record<OperationLogType, string> = {
  [OperationLogType.ORDER]: "bg-blue-100 text-blue-700 border-blue-200",
  [OperationLogType.REFUND]: "bg-orange-100 text-orange-700 border-orange-200",
  [OperationLogType.USER]: "bg-purple-100 text-purple-700 border-purple-200",
  [OperationLogType.STUDY_PLAN]: "bg-green-100 text-green-700 border-green-200",
  [OperationLogType.FINANCE]: "bg-yellow-100 text-yellow-700 border-yellow-200",
  [OperationLogType.SYSTEM]: "bg-gray-100 text-gray-700 border-gray-200",
}

export default function OperationLogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState<OperationLogFilter>({
    type: 'all',
    action: 'all',
    operatorName: '',
    targetId: '',
    dateRange: {
      start: null,
      end: null,
    },
    keyword: '',
  })

  // 加载数据
  useEffect(() => {
    loadLogs()
  }, [])

  function loadLogs() {
    setLogs(getStoredOperationLogs())
  }

  // 筛选逻辑
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 类型筛选
      if (filters.type && filters.type !== 'all' && log.type !== filters.type) {
        return false
      }
      
      // 动作筛选
      if (filters.action && filters.action !== 'all' && log.action !== filters.action) {
        return false
      }
      
      // 操作人姓名筛选
      if (filters.operatorName && !log.operatorName.includes(filters.operatorName)) {
        return false
      }
      
      // 目标ID筛选
      if (filters.targetId && !log.targetId.includes(filters.targetId)) {
        return false
      }
      
      // 日期范围筛选
      if (filters.dateRange?.start) {
        const logDate = new Date(log.createdAt)
        const startDate = new Date(filters.dateRange.start)
        startDate.setHours(0, 0, 0, 0)
        if (logDate < startDate) return false
      }
      
      if (filters.dateRange?.end) {
        const logDate = new Date(log.createdAt)
        const endDate = new Date(filters.dateRange.end)
        endDate.setHours(23, 59, 59, 999)
        if (logDate > endDate) return false
      }
      
      // 关键词搜索
      if (filters.keyword) {
        const keyword = filters.keyword.toLowerCase()
        const searchFields = [
          log.operatorName,
          log.targetId,
          log.remark,
          log.targetType,
        ]
        if (!searchFields.some(field => field?.toLowerCase().includes(keyword))) {
          return false
        }
      }
      
      return true
    })
  }, [logs, filters])

  // 分页
  const totalPages = Math.ceil(filteredLogs.length / ITEMS_PER_PAGE)
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // 重置筛选
  const resetFilters = () => {
    setFilters({
      type: 'all',
      action: 'all',
      operatorName: '',
      targetId: '',
      dateRange: { start: null, end: null },
      keyword: '',
    })
    setCurrentPage(1)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">操作日志</h1>
        <p className="text-muted-foreground mt-1">
          查看系统敏感操作记录，包括订单、退费、用户管理等操作的详细日志
        </p>
      </div>

      {/* 筛选区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 第一行：操作类型、操作动作 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">操作类型</label>
              <Select
                value={filters.type || 'all'}
                onValueChange={(value: OperationLogType | 'all') => {
                  setFilters(prev => ({ ...prev, type: value }))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部类型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部类型</SelectItem>
                  {Object.entries(OPERATION_TYPE_MAP).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">操作动作</label>
              <Select
                value={filters.action || 'all'}
                onValueChange={(value: OperationAction | 'all') => {
                  setFilters(prev => ({ ...prev, action: value }))
                  setCurrentPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="全部动作" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部动作</SelectItem>
                  {Object.entries(OPERATION_ACTION_MAP).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 第二行：操作人、目标ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">操作人姓名</label>
              <Input
                placeholder="输入操作人姓名"
                value={filters.operatorName || ''}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, operatorName: e.target.value }))
                  setCurrentPage(1)
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">目标ID（订单号/用户ID等）</label>
              <Input
                placeholder="输入目标ID"
                value={filters.targetId || ''}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, targetId: e.target.value }))
                  setCurrentPage(1)
                }}
              />
            </div>
          </div>

          {/* 第三行：日期范围 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">开始日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.start ? (
                      format(filters.dateRange.start, "yyyy-MM-dd", { locale: zhCN })
                    ) : (
                      <span>选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.start || undefined}
                    onSelect={(date) => {
                      setFilters(prev => ({
                        ...prev,
                        dateRange: { 
                          start: date || null,
                          end: prev.dateRange?.end || null
                        }
                      }))
                      setCurrentPage(1)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">结束日期</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange?.end ? (
                      format(filters.dateRange.end, "yyyy-MM-dd", { locale: zhCN })
                    ) : (
                      <span>选择日期</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange?.end || undefined}
                    onSelect={(date) => {
                      setFilters(prev => ({
                        ...prev,
                        dateRange: { 
                          start: prev.dateRange?.start || null,
                          end: date || null
                        }
                      }))
                      setCurrentPage(1)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 第四行：关键词搜索 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">关键词搜索</label>
            <Input
              placeholder="搜索操作人、目标ID、备注等信息"
              value={filters.keyword || ''}
              onChange={(e) => {
                setFilters(prev => ({ ...prev, keyword: e.target.value }))
                setCurrentPage(1)
              }}
            />
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-2 pt-2">
            <Button onClick={resetFilters} variant="outline">
              重置筛选
            </Button>
            <Button onClick={loadLogs} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              刷新数据
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          共 <span className="font-semibold text-foreground">{filteredLogs.length}</span> 条记录
          {filteredLogs.length !== logs.length && (
            <span>（总计 {logs.length} 条）</span>
          )}
        </div>
      </div>

      {/* 日志列表 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">操作类型</TableHead>
                  <TableHead className="w-[120px]">操作动作</TableHead>
                  <TableHead className="w-[120px]">操作人</TableHead>
                  <TableHead className="w-[180px]">操作对象</TableHead>
                  <TableHead className="min-w-[200px]">状态变更</TableHead>
                  <TableHead className="min-w-[150px]">备注</TableHead>
                  <TableHead className="w-[160px]">操作时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 mb-2 opacity-20" />
                      <p>暂无操作日志</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                      {/* 操作类型 */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", OPERATION_TYPE_COLOR_MAP[log.type])}
                        >
                          {OPERATION_TYPE_MAP[log.type]}
                        </Badge>
                      </TableCell>

                      {/* 操作动作 */}
                      <TableCell>
                        <span className="text-sm font-medium">
                          {OPERATION_ACTION_MAP[log.action]}
                        </span>
                      </TableCell>

                      {/* 操作人 */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="font-medium">{log.operatorName}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.operatorRole}
                          </div>
                        </div>
                      </TableCell>

                      {/* 操作对象 */}
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Target className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-xs">{log.targetId}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {log.targetType}
                          </div>
                        </div>
                      </TableCell>

                      {/* 状态变更 */}
                      <TableCell>
                        <div className="space-y-1 text-xs">
                          {log.beforeState && Object.keys(log.beforeState).length > 0 && (
                            <div className="flex items-start gap-1">
                              <span className="text-muted-foreground shrink-0">变更前:</span>
                              <span className="text-red-600 break-all">
                                {JSON.stringify(log.beforeState)}
                              </span>
                            </div>
                          )}
                          {log.afterState && Object.keys(log.afterState).length > 0 && (
                            <div className="flex items-start gap-1">
                              <span className="text-muted-foreground shrink-0">变更后:</span>
                              <span className="text-green-600 break-all">
                                {JSON.stringify(log.afterState)}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 备注 */}
                      <TableCell>
                        <div className="text-sm max-w-[200px] truncate" title={log.remark}>
                          {log.remark || '-'}
                        </div>
                      </TableCell>

                      {/* 操作时间 */}
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.createdAt), 'yyyy-MM-dd HH:mm:ss', {
                            locale: zhCN
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页控制 */}
          {filteredLogs.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-muted-foreground">
                第 {currentPage} / {totalPages} 页
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
