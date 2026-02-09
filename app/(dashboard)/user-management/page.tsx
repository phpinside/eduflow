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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { toast } from "sonner"
import { Search, Check, X, Eye, Edit, ChevronLeft, ChevronRight } from "lucide-react"
import { Role, User, UserStatus } from "@/types"
import { getStoredUsers, saveMockData, STORAGE_KEYS } from "@/lib/storage"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function UserManagementPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<"pending" | "reviewed">("pending")

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Reject Dialog State
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [rejectReason, setRejectReason] = useState("")

  // Edit/View Dialog State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editForm, setEditForm] = useState<Partial<User>>({})

  // Manager Selection State
  const [managers, setManagers] = useState<User[]>([])
  const [managerSearchTerm, setManagerSearchTerm] = useState("")
  const [filteredManagers, setFilteredManagers] = useState<User[]>([])

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = () => {
    setIsLoading(true)
    const storedUsers = getStoredUsers()
    // Ensure all users have a status, default to PENDING if missing
    const usersWithStatus = storedUsers.map(user => ({
      ...user,
      status: user.status || UserStatus.PENDING
    }))
    setUsers(usersWithStatus)
    
    // Load manager list (only approved managers)
    const managerList = usersWithStatus.filter(u => 
      u.roles.includes(Role.MANAGER) && 
      u.status === UserStatus.APPROVED
    )
    setManagers(managerList)
    setFilteredManagers(managerList)
    
    setIsLoading(false)
  }

  const handleApprove = (user: User) => {
    const updatedUsers = users.map(u => 
      u.id === user.id ? { ...u, status: UserStatus.APPROVED } : u
    )
    saveMockData(STORAGE_KEYS.USERS, updatedUsers)
    setUsers(updatedUsers)
    toast.success(`已通过用户 ${user.name} 的审核`)
  }

  const openRejectDialog = (user: User) => {
    setSelectedUser(user)
    setRejectReason("")
    setIsRejectOpen(true)
  }

  const handleReject = () => {
    if (!selectedUser || !rejectReason.trim()) {
      toast.error("请输入驳回理由")
      return
    }

    const updatedUsers = users.map(u => 
      u.id === selectedUser.id ? { 
        ...u, 
        status: UserStatus.REJECTED, 
        rejectReason: rejectReason 
      } : u
    )
    saveMockData(STORAGE_KEYS.USERS, updatedUsers)
    setUsers(updatedUsers)
    setIsRejectOpen(false)
    toast.success(`已驳回用户 ${selectedUser.name} 的申请`)
  }

  const openEditDialog = (user: User) => {
    setSelectedUser(user)
    setEditForm({ ...user })
    setManagerSearchTerm("")
    setFilteredManagers(managers)
    setIsEditOpen(true)
  }

  const handleManagerSearch = (searchValue: string) => {
    setManagerSearchTerm(searchValue)
    if (!searchValue.trim()) {
      setFilteredManagers(managers)
      return
    }
    
    const filtered = managers.filter(m => 
      m.id.toLowerCase().includes(searchValue.toLowerCase()) ||
      m.name.toLowerCase().includes(searchValue.toLowerCase())
    )
    setFilteredManagers(filtered)
  }

  const handleUpdateUser = () => {
    if (!selectedUser) return

    const updatedUsers = users.map(u => 
      u.id === selectedUser.id ? { ...u, ...editForm } : u
    )
    saveMockData(STORAGE_KEYS.USERS, updatedUsers)
    setUsers(updatedUsers)
    setIsEditOpen(false)
    setManagerSearchTerm("")
    toast.success("用户信息更新成功")
  }

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

  // Reset to page 1 when tab changes or search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [activeTab, searchTerm])

  const filteredUsers = users.filter(user => {
    // 只显示伴学教练和学管（招生老师无需审核，不在此列表中）
    const hasAllowedRole = user.roles.some(role => 
      [Role.TUTOR, Role.MANAGER].includes(role)
    )
    if (!hasAllowedRole) return false

    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      user.phone.includes(searchTerm)
    
    if (activeTab === "pending") {
      // 待审核：只显示待审核状态的伴学教练
      return matchesSearch && user.status === UserStatus.PENDING
    } else {
      // 已审核：显示已通过、已驳回或老用户
      return matchesSearch && (!user.status || user.status === UserStatus.APPROVED || user.status === UserStatus.REJECTED)
    }
  })

  // Pagination calculation
  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">用户管理</h2>
          <p className="text-muted-foreground">
            管理系统用户，审核注册申请
          </p>
        </div>
      </div>

      <Tabs defaultValue="pending" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">待审核</TabsTrigger>
            <TabsTrigger value="reviewed">已审核</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索姓名或手机号"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <TabsContent value="pending" className="space-y-4">
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>注册时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      暂无待审核用户
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.phone}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {user.roles.map(r => <span key={r}>{getRoleBadge(r)}</span>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleApprove(user)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            通过
                          </Button>
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => openRejectDialog(user)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            驳回
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(user)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            详情
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
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
        </TabsContent>

        <TabsContent value="reviewed" className="space-y-4">
          <div className="rounded-md border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>手机号</TableHead>
                  <TableHead>角色</TableHead>
                  <TableHead>学管</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      暂无已审核用户
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedUsers.map((user) => (
                    <TableRow key={user.id}>
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
                            <Badge variant="outline" className="text-yellow-600">
                              未分配
                            </Badge>
                          )
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                        {user.status === UserStatus.REJECTED && user.rejectReason && (
                          <div className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={user.rejectReason}>
                            原因: {user.rejectReason}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          编辑
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
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
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回申请</DialogTitle>
            <DialogDescription>
              请输入驳回 {selectedUser?.name} 申请的原因，该用户将无法正常使用系统功能。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>驳回原因</Label>
              <Textarea 
                placeholder="请输入驳回原因..." 
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleReject}>确认驳回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit/View Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>用户信息详情</DialogTitle>
            <DialogDescription>
              查看或编辑用户详细信息
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>姓名</Label>
                <Input 
                  value={editForm.name || ""} 
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>手机号</Label>
                <Input 
                  value={editForm.phone || ""} 
                  onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>角色</Label>
              <div className="flex gap-2 mb-2">
                {editForm.roles?.map(r => <span key={r}>{getRoleBadge(r)}</span>)}
              </div>
              <Select 
                value={editForm.roles?.[0]} 
                onValueChange={(value) => setEditForm({...editForm, roles: [value as Role]})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={Role.SALES}>招生老师</SelectItem>
                  <SelectItem value={Role.TUTOR}>伴学教练</SelectItem>
                  <SelectItem value={Role.MANAGER}>学管</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>系统推荐试课</Label>
              <Select 
                value={editForm.recommendedForTrial === true ? "true" : editForm.recommendedForTrial === false ? "false" : "false"} 
                onValueChange={(value) => setEditForm({...editForm, recommendedForTrial: value === "true"})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择是否推荐试课" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">是</SelectItem>
                  <SelectItem value="false">否</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 仅伴学教练显示学管选择 */}
            {editForm.roles?.includes(Role.TUTOR) && (
              <div className="space-y-2">
                <Label>归属学管</Label>
                <div className="space-y-2">
                  <Input 
                    placeholder="输入学管ID或姓名搜索" 
                    value={managerSearchTerm}
                    onChange={(e) => handleManagerSearch(e.target.value)}
                  />
                  
                  {/* 当前选中的学管 */}
                  {editForm.managerId && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="text-sm font-medium">当前学管</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {editForm.managerName} (ID: {editForm.managerId})
                      </div>
                    </div>
                  )}
                  
                  {/* 学管选择列表 */}
                  {managerSearchTerm && filteredManagers.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {filteredManagers.map(manager => (
                        <div
                          key={manager.id}
                          className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setEditForm({
                              ...editForm, 
                              managerId: manager.id,
                              managerName: manager.name
                            })
                            setManagerSearchTerm("")
                            setFilteredManagers(managers)
                          }}
                        >
                          <div className="font-medium text-sm">{manager.name}</div>
                          <div className="text-xs text-muted-foreground">
                            ID: {manager.id} | 手机: {manager.phone}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 搜索无结果提示 */}
                  {managerSearchTerm && filteredManagers.length === 0 && (
                    <div className="p-3 text-sm text-muted-foreground text-center border rounded-md">
                      未找到匹配的学管
                    </div>
                  )}
                </div>
              </div>
            )}

            {(editForm.roles?.includes(Role.SALES)) && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label>校区名称</Label>
                  <Input 
                    value={editForm.campusName || ""} 
                    onChange={(e) => setEditForm({...editForm, campusName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>校区账号</Label>
                  <Input 
                    value={editForm.campusAccount || ""} 
                    onChange={(e) => setEditForm({...editForm, campusAccount: e.target.value})}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>微信二维码</Label>
              <div className="border rounded-lg p-4 bg-muted/20 flex justify-center">
                {editForm.wechatQrCode ? (
                  <img 
                    src={editForm.wechatQrCode} 
                    alt="QR Code" 
                    className="max-h-48 rounded-lg object-contain" 
                  />
                ) : (
                  <div className="text-muted-foreground text-sm py-8">未上传二维码</div>
                )}
              </div>
            </div>

            {editForm.status === UserStatus.REJECTED && (
              <div className="space-y-2">
                <Label className="text-red-500">驳回原因</Label>
                <Textarea 
                  value={editForm.rejectReason || ""} 
                  disabled
                  className="bg-red-50"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>关闭</Button>
            <Button onClick={handleUpdateUser}>保存修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
