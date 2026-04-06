"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  ArrowLeft,
  Edit,
  Check,
  X,
  KeyRound,
  User as UserIcon,
  Phone,
  Shield,
  Calendar,
  RefreshCw,
} from "lucide-react"
import { Role, User, UserStatus } from "@/types"
import { getStoredUsers, saveMockData, STORAGE_KEYS } from "@/lib/storage"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Reject dialog
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState("")

  // Reset password dialog
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false)

  useEffect(() => {
    const storedUsers = getStoredUsers()
    const usersWithStatus = storedUsers.map(u => ({
      ...u,
      status: u.status || UserStatus.PENDING
    }))
    setAllUsers(usersWithStatus)
    const found = usersWithStatus.find(u => u.id === userId)
    setUser(found || null)
    setIsLoading(false)
  }, [userId])

  const saveAndRefresh = (updatedUsers: User[]) => {
    saveMockData(STORAGE_KEYS.USERS, updatedUsers)
    setAllUsers(updatedUsers)
    const updated = updatedUsers.find(u => u.id === userId)
    setUser(updated || null)
  }

  const handleApprove = () => {
    if (!user) return
    const updatedUsers = allUsers.map(u =>
      u.id === userId ? { ...u, status: UserStatus.APPROVED, rejectReason: undefined } : u
    )
    saveAndRefresh(updatedUsers)
    toast.success(`已通过用户 ${user.name} 的审核`)
  }

  const handleReject = () => {
    if (!user || !rejectReason.trim()) {
      toast.error("请输入驳回理由")
      return
    }
    const updatedUsers = allUsers.map(u =>
      u.id === userId ? { ...u, status: UserStatus.REJECTED, rejectReason } : u
    )
    saveAndRefresh(updatedUsers)
    setIsRejectOpen(false)
    setRejectReason("")
    toast.success(`已驳回用户 ${user.name} 的申请`)
  }

  const handleResetPassword = () => {
    if (!user) return
    const updatedUsers = allUsers.map(u =>
      u.id === userId ? { ...u, password: "123456" } : u
    )
    saveAndRefresh(updatedUsers)
    setIsResetPasswordOpen(false)
    toast.success(`用户 ${user.name} 的密码已重置为 123456`)
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

  const getStatusInfo = (status?: UserStatus) => {
    switch (status) {
      case UserStatus.APPROVED:
        return { badge: <Badge className="bg-green-500 text-white">已通过</Badge>, color: "green" }
      case UserStatus.REJECTED:
        return { badge: <Badge variant="destructive">已驳回</Badge>, color: "red" }
      case UserStatus.PENDING:
      default:
        return { badge: <Badge className="bg-yellow-500 text-white">待审核</Badge>, color: "yellow" }
    }
  }

  const needsReview = user?.roles.some(r => [Role.TUTOR, Role.MANAGER].includes(r))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground p-6">
        加载中...
      </div>
    )
  }

  if (!user) {
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

  const { badge: statusBadge } = getStatusInfo(user.status)

  return (
    <div className="space-y-6 p-6 max-w-3xl">
      {/* 顶部导航 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/user-management")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回列表
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{user.name}</h2>
            <p className="text-sm text-muted-foreground">用户详情</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push(`/user-management/${userId}/edit`)}
        >
          <Edit className="h-4 w-4 mr-2" />
          编辑信息
        </Button>
      </div>

      {/* 基本信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <UserIcon className="h-4 w-4" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5" /> 姓名
              </p>
              <p className="font-medium">{user.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" /> 手机号
              </p>
              <p className="font-medium">{user.phone}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Shield className="h-3.5 w-3.5" /> 角色
              </p>
              <div className="flex gap-1 flex-wrap">
                {user.roles.map(r => <span key={r}>{getRoleBadge(r)}</span>)}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">审核状态</p>
              <div>{statusBadge}</div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> 注册时间
              </p>
              <p className="font-medium">
                {format(new Date(user.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
              </p>
            </div>
            {user.roles.includes(Role.TUTOR) && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">归属学管</p>
                <p className="font-medium">
                  {user.managerName || <span className="text-yellow-600 text-sm">未分配</span>}
                </p>
              </div>
            )}
            {user.roles.includes(Role.SALES) && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">正式支付功能</p>
                <p className="font-medium">
                  {user.formalPaymentEnabled === false ? "关闭" : "开启"}
                </p>
              </div>
            )}
            {user.roles.includes(Role.SALES) && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">最小起充课时数</p>
                <p className="font-medium">{user.minRechargeHours ?? 10}</p>
              </div>
            )}
          </div>

          {user.wechatQrCode && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm text-muted-foreground">微信二维码</p>
              <img
                src={user.wechatQrCode}
                alt="微信二维码"
                className="max-h-40 rounded-lg object-contain border"
              />
            </div>
          )}

          {user.roles.includes(Role.SALES) && (user.campusName || user.campusAccount) && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              {user.campusName && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">校区名称</p>
                  <p className="font-medium">{user.campusName}</p>
                </div>
              )}
              {user.campusAccount && (
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">校区账号</p>
                  <p className="font-medium">{user.campusAccount}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 审核操作卡片（仅 TUTOR / MANAGER 显示） */}
      {needsReview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              审核操作
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.status === UserStatus.PENDING && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  该用户正在等待审核，请确认信息后进行操作。
                </p>
                <div className="flex gap-3">
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    通过审核
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => { setRejectReason(""); setIsRejectOpen(true) }}
                  >
                    <X className="h-4 w-4 mr-2" />
                    驳回申请
                  </Button>
                </div>
              </div>
            )}

            {user.status === UserStatus.APPROVED && (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-md">
                <Check className="h-5 w-5 text-green-600 shrink-0" />
                <p className="text-sm text-green-700">该用户已通过审核，可正常使用系统功能。</p>
              </div>
            )}

            {user.status === UserStatus.REJECTED && (
              <div className="space-y-4">
                <div className="p-3 bg-red-50 border border-red-200 rounded-md space-y-2">
                  <div className="flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600 shrink-0" />
                    <span className="text-sm font-medium text-red-700">该用户申请已被驳回</span>
                  </div>
                  {user.rejectReason && (
                    <p className="text-sm text-red-600 ml-6">驳回原因：{user.rejectReason}</p>
                  )}
                </div>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleApprove}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新通过
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 重置密码卡片 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4" />
            密码管理
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">重置登录密码</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                将该用户的密码重置为默认密码 <strong>123456</strong>
              </p>
            </div>
            <Button
              variant="outline"
              className="text-orange-600 border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              onClick={() => setIsResetPasswordOpen(true)}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              重置密码
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 驳回 Dialog */}
      <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>驳回申请</DialogTitle>
            <DialogDescription>
              请输入驳回 <span className="font-semibold text-foreground">{user.name}</span> 申请的原因。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <Label>驳回原因</Label>
            <Textarea
              placeholder="请输入驳回原因..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleReject}>确认驳回</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 重置密码 Dialog */}
      <Dialog open={isResetPasswordOpen} onOpenChange={setIsResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重置密码</DialogTitle>
            <DialogDescription>
              确认将用户 <span className="font-semibold text-foreground">{user.name}</span> 的密码重置为{" "}
              <span className="font-semibold text-orange-600">123456</span> 吗？
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <KeyRound className="h-5 w-5 text-orange-500 shrink-0" />
              <p className="text-sm text-orange-700">
                重置后，该用户需使用新密码 <strong>123456</strong> 登录系统。
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordOpen(false)}>取消</Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700 text-white"
              onClick={handleResetPassword}
            >
              确认重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
