"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Save } from "lucide-react"
import { Role, User, UserStatus } from "@/types"
import { getStoredUsers, saveMockData, STORAGE_KEYS } from "@/lib/storage"

export default function UserEditPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [allUsers, setAllUsers] = useState<User[]>([])
  const [editForm, setEditForm] = useState<Partial<User>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Manager search
  const [managers, setManagers] = useState<User[]>([])
  const [managerSearchTerm, setManagerSearchTerm] = useState("")
  const [filteredManagers, setFilteredManagers] = useState<User[]>([])

  useEffect(() => {
    const storedUsers = getStoredUsers()
    const usersWithStatus = storedUsers.map(u => ({
      ...u,
      status: u.status || UserStatus.PENDING
    }))
    setAllUsers(usersWithStatus)

    const found = usersWithStatus.find(u => u.id === userId)
    if (found) {
      setEditForm({ ...found })
    }

    const managerList = usersWithStatus.filter(u =>
      u.roles.includes(Role.MANAGER) && u.status === UserStatus.APPROVED
    )
    setManagers(managerList)
    setFilteredManagers(managerList)

    setIsLoading(false)
  }, [userId])

  const handleManagerSearch = (value: string) => {
    setManagerSearchTerm(value)
    if (!value.trim()) {
      setFilteredManagers(managers)
      return
    }
    setFilteredManagers(
      managers.filter(m =>
        m.id.toLowerCase().includes(value.toLowerCase()) ||
        m.name.toLowerCase().includes(value.toLowerCase())
      )
    )
  }

  const handleSave = () => {
    if (!editForm.name?.trim()) {
      toast.error("姓名不能为空")
      return
    }
    if (!editForm.phone?.trim()) {
      toast.error("手机号不能为空")
      return
    }

    setIsSaving(true)
    const updatedUsers = allUsers.map(u =>
      u.id === userId ? { ...u, ...editForm, updatedAt: new Date() } : u
    )
    saveMockData(STORAGE_KEYS.USERS, updatedUsers)
    toast.success("用户信息已保存")
    setIsSaving(false)
    router.push(`/user-management/${userId}`)
  }

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case Role.SALES: return <Badge variant="secondary">招生老师</Badge>
      case Role.TUTOR: return <Badge variant="outline">伴学教练</Badge>
      case Role.MANAGER: return <Badge>学管</Badge>
      default: return <Badge variant="outline">{role}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground p-6">
        加载中...
      </div>
    )
  }

  if (!editForm.id) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div className="text-center py-16 text-muted-foreground">未找到该用户</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/user-management/${userId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回详情
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">编辑用户</h2>
            <p className="text-sm text-muted-foreground">{editForm.name}</p>
          </div>
        </div>
      </div>

      {/* 基本信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">基本信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>姓名</Label>
              <Input
                value={editForm.name || ""}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>手机号</Label>
              <Input
                value={editForm.phone || ""}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
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
              onValueChange={(value) => setEditForm({ ...editForm, roles: [value as Role] })}
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
              value={editForm.recommendedForTrial ? "true" : "false"}
              onValueChange={(value) => setEditForm({ ...editForm, recommendedForTrial: value === "true" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">是</SelectItem>
                <SelectItem value="false">否</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 归属学管（仅伴学教练） */}
      {editForm.roles?.includes(Role.TUTOR) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">归属学管</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="输入学管 ID 或姓名搜索"
              value={managerSearchTerm}
              onChange={(e) => handleManagerSearch(e.target.value)}
            />

            {editForm.managerId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">当前归属学管</p>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {editForm.managerName}（ID: {editForm.managerId}）
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setEditForm({ ...editForm, managerId: undefined, managerName: undefined })}
                >
                  清除
                </Button>
              </div>
            )}

            {managerSearchTerm && filteredManagers.length > 0 && (
              <div className="border rounded-md max-h-48 overflow-y-auto">
                {filteredManagers.map(manager => (
                  <div
                    key={manager.id}
                    className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                    onClick={() => {
                      setEditForm({ ...editForm, managerId: manager.id, managerName: manager.name })
                      setManagerSearchTerm("")
                      setFilteredManagers(managers)
                    }}
                  >
                    <p className="font-medium text-sm">{manager.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {manager.id} | 手机: {manager.phone}</p>
                  </div>
                ))}
              </div>
            )}

            {managerSearchTerm && filteredManagers.length === 0 && (
              <div className="p-3 text-sm text-muted-foreground text-center border rounded-md">
                未找到匹配的学管
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 校区信息（仅招生老师） */}
      {editForm.roles?.includes(Role.SALES) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">校区信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>校区名称</Label>
                <Input
                  value={editForm.campusName || ""}
                  onChange={(e) => setEditForm({ ...editForm, campusName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>校区账号</Label>
                <Input
                  value={editForm.campusAccount || ""}
                  onChange={(e) => setEditForm({ ...editForm, campusAccount: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>正式支付功能</Label>
                <Select
                  value={editForm.formalPaymentEnabled === false ? "false" : "true"}
                  onValueChange={(value) =>
                    setEditForm({
                      ...editForm,
                      formalPaymentEnabled: value === "true",
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">开启</SelectItem>
                    <SelectItem value="false">关闭</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 底部操作 */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => router.push(`/user-management/${userId}`)}
        >
          取消
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "保存中..." : "保存修改"}
        </Button>
      </div>
    </div>
  )
}
