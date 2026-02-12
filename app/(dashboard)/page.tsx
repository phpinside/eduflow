"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@/types"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, CheckCircle, Clock, TrendingUp, AlertCircle } from "lucide-react"

// Dashboard Sub-components for different roles

function SalesDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">招生工作台</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                    <Link href="/trial-lesson/create">创建试课单</Link>
                </Button>
                <Button className="w-full bg-green-600 hover:bg-green-700" asChild>
                    <Link href="/regular-course/select-trial">创建正课单</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                    <Link href="/students/create">录入学生信息</Link>
                </Button>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">企业微信客服</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-center">客服老师1</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 pt-0">
              <div className="mb-2 mt-4 flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                <span className="text-xs text-muted-foreground">微信二维码</span>
              </div>
              <p className="text-xs text-muted-foreground">扫码联系客服老师1</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-center">客服老师2</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center p-6 pt-0">
              <div className="mb-2 mt-4 flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                <span className="text-xs text-muted-foreground">微信二维码</span>
              </div>
              <p className="text-xs text-muted-foreground">扫码联系客服老师2</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function TutorDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">伴学中心</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        {/* Placeholder Content */}
        <p className="text-muted-foreground">欢迎，来到学管工作台！</p>
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
