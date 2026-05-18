"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Role, User } from "@/types"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Users,
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertCircle,
  GraduationCap,
  MousePointerClick,
  Phone,
  MessageCircle,
} from "lucide-react"
import { TutorCreditScoreCard, ManagerTutorCreditCard } from "@/components/credit-score/CreditScoreCard"
import { getStoredUsers } from "@/lib/storage"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function SalesDashboard() {
  const { user } = useAuth()
  const [scheduler, setScheduler] = useState<User | null>(null)

  useEffect(() => {
    if (!user) return
    const allUsers = getStoredUsers()
    if (user.dedicatedSchedulerId) {
      const found = allUsers.find(u => u.id === user.dedicatedSchedulerId)
      setScheduler(found || null)
    }
  }, [user])

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">招生工作台</h2>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月新增订单</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">+20.1% 较上月</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">正课学员</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground">+30.5% 较上月</p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">试课转化率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">+5% 较上月</p>
            </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Button size="lg" className="h-14 w-full text-base font-bold bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-600/25" asChild>
          <Link href="/trial-lesson/create">
            <MousePointerClick className="mr-2 h-5 w-5" />
            创建试课单
          </Link>
        </Button>
        <Button size="lg" className="h-14 w-full text-base font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/25" asChild>
          <Link href="/regular-course/select-trial">
            <GraduationCap className="mr-2 h-5 w-5" />
            创建正课单
          </Link>
        </Button>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">您的专属排课老师</h3>
        {scheduler ? (
          <Card>
            <CardContent className="p-6">
              <div className="grid gap-6 md:grid-cols-2 items-stretch">
                {/* 左侧：排课老师信息 */}
                <div className="flex flex-col p-5 border rounded-xl bg-gradient-to-br from-primary/5 to-primary/10">
                  {/* 姓名和角色标签 */}
                  <div className="text-center mb-4">
                    <h4 className="text-xl font-bold text-foreground">{scheduler.name}</h4>
                    <span className="inline-block mt-1.5 px-3 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                      专属排课老师
                    </span>
                  </div>

                  {/* 头像和二维码同行 */}
                  <div className="flex items-center justify-center gap-6 py-4">
                    <div className="flex flex-col items-center space-y-2">
                      <Avatar className="h-28 w-28 border-4 border-white shadow-lg">
                        <AvatarImage src={scheduler.avatar} alt={scheduler.name} />
                        <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/70 text-white">{scheduler.name?.slice(0, 1)}</AvatarFallback>
                      </Avatar>
                    </div>
                    {scheduler.wechatQrCode && (
                      <div className="flex flex-col items-center">
                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                          <img
                            src={scheduler.wechatQrCode}
                            alt="微信二维码"
                            className="h-28 w-28 rounded object-contain"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">扫码添加微信</p>
                      </div>
                    )}
                  </div>

                  {/* 手机号 */}
                  {scheduler.phone && (
                    <div className="mt-auto pt-4 border-t border-primary/10">
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">{scheduler.phone}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 右侧：提示内容 */}
                <div className="flex flex-col justify-center space-y-4 p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm leading-relaxed">
                        <span className="font-semibold text-primary">{scheduler.name}</span> 是您的专属排课老师
                      </p>
                    </div>
                    <div className="rounded-lg bg-blue-50 p-4 text-sm leading-relaxed text-blue-900 dark:bg-blue-950/50 dark:text-blue-100">
                      <p className="font-medium mb-2">专属服务范围：</p>
                      <ul className="space-y-1 text-xs">
                        <li>• 试课订单排课与跟进</li>
                        <li>• 正课订单排课与跟进</li>
                        <li>• 试课转正课处理</li>
                        <li>• 退费申请与处理</li>
                        <li>• 教学反馈跟进</li>
                      </ul>
                      <p className="mt-3 text-xs font-medium">
                        一切排课和教学反馈，都由 {scheduler.name} 老师专门负责跟进
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <MessageCircle className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="mt-4 text-lg font-medium">暂未分配专属排课老师</p>
                <p className="text-sm text-muted-foreground mt-2">
                  联系华北交付中心 张老师为您分配排课老师
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function TutorDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">伴学中心</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TutorCreditScoreCard />
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待上课程</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">今日</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待反馈</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">需在24h内提交</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">本月课时</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32.5h</div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function ManagerDashboard() {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">学管工作台</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TutorCreditScoreCard />
          <ManagerTutorCreditCard />
        </div>
      </div>
    )
}

function OperatorDashboard() {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">运营工作台</h2>
        {/* Placeholder Content */}
        <p className="text-muted-foreground">欢迎，来到运营工作台！</p>
      </div>
    )
}

function AdminDashboard() {
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">系统管理后台</h2>
        {/* Placeholder Content */}
        <p className="text-muted-foreground">欢迎，来到系统管理后台！</p>
      </div>
    )
}

export default function DashboardPage() {
  const { currentRole } = useAuth()

  if (!currentRole) return null

  switch (currentRole) {
    case Role.SALES:
      return <SalesDashboard />
    case Role.TUTOR:
      return <TutorDashboard />
    case Role.MANAGER:
      return <ManagerDashboard />
    case Role.OPERATOR:
      return <OperatorDashboard />
    case Role.ADMIN:
      return <AdminDashboard />
    default:
      return <div>Unknown Role</div>
  }
}
