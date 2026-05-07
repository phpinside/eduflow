"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Search, Edit, ChevronLeft, ChevronRight } from "lucide-react"
import { Role, User, UserStatus } from "@/types"
import { getStoredUsers } from "@/lib/storage"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function UserManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  useEffect(() => {
    const storedUsers = getStoredUsers()
    const usersWithStatus = storedUsers.map(user => ({
      ...user,
      status: user.status || UserStatus.PENDING
    }))
    setUsers(usersWithStatus)
    setIsLoading(false)
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, roleFilter, statusFilter])

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.SALES:
        return <Badge variant="secondary">招生老师</Badge>
      case Role.TUTOR:
        return <Badge variant="outline">伴学教练</Badge>
      case Role.MANAGER:
        return <Badge>学管</Badge>
      case Role.OPERATOR:
        return <Badge variant="destructive">运营人员</Badge>
      case Role.ADMIN:
        return <Badge className="bg-purple-500">管理员</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  const getStatusBadge = (status?: UserStatus) => {
    switch (status) {
      case UserStatus.APPROVED:
        return <Badge className="bg-green-500">已通过</Badge>
      case UserStatus.REJECTED:
        return <Badge variant="destructive">已驳回</Badge>
      case UserStatus.PENDING:
      default:
        return <Badge className="bg-yellow-500 text-white">待审核</Badge>
    }
  }

  const filteredUsers = users.filter(user => {
    const hasAllowedRole = user.roles.some(role =>
      [Role.TUTOR, Role.MANAGER, Role.SALES].includes(role)
    )
    if (!hasAllowedRole) return false

    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.includes(searchTerm)

    const matchesRole =
      roleFilter === "all" || user.roles.includes(roleFilter as Role)

    const effectiveStatus = user.status || UserStatus.PENDING
    const matchesStatus =
      statusFilter === "all" || effectiveStatus === statusFilter

    return matchesSearch && matchesRole && matchesStatus
  })

  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        加载中...
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">用户管理</h2>
        <p className="text-muted-foreground">管理系统用户，审核注册申请</p>
      </div>

      {/* 筛选栏 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名或手机号"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="角色筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部角色</SelectItem>
            <SelectItem value={Role.SALES}>招生老师</SelectItem>
            <SelectItem value={Role.TUTOR}>伴学教练</SelectItem>
            <SelectItem value={Role.MANAGER}>学管</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="状态筛选" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value={UserStatus.PENDING}>待审核</SelectItem>
            <SelectItem value={UserStatus.APPROVED}>已通过</SelectItem>
            <SelectItem value={UserStatus.REJECTED}>已驳回</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground ml-auto">
          共 {filteredUsers.length} 名用户
        </span>
      </div>

      {/* 用户列表 */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>归属学管</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>注册时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  暂无符合条件的用户
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow
                  key={user.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => router.push(`/user-management/${user.id}`)}
                >
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {user.roles.map(r => <span key={r}>{getRoleBadge(r)}</span>)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.roles.includes(Role.TUTOR) ? (
                      user.managerName ? (
                        <span className="text-sm">{user.managerName}</span>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">未分配</Badge>
                      )
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/user-management/${user.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      编辑信息
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {filteredUsers.length > 0 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border rounded-md">
          <div className="text-sm text-muted-foreground">
            共 {filteredUsers.length} 条记录，第 {currentPage} / {totalPages} 页
          </div>
          <div className="flex items-center gap-2">
            <Select value={pageSize.toString()} onValueChange={(v) => {
              setPageSize(Number(v))
              setCurrentPage(1)
            }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 条/页</SelectItem>
                <SelectItem value="10">10 条/页</SelectItem>
                <SelectItem value="20">20 条/页</SelectItem>
                <SelectItem value="50">50 条/页</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8"
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
