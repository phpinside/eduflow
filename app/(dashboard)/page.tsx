"use client"

import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@/types"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  ArrowRightLeft,
} from "lucide-react"

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
      
      <Card className="overflow-hidden border-border/80 shadow-sm">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle>快捷操作</CardTitle>
          <CardDescription>
            按真实业务场景选择入口；试课转正课需在「订单管理」中基于已有试课单操作，不会新建空白试课单。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5 pt-0">
          <div className="space-y-2 rounded-xl border border-sky-200/80 bg-sky-50/50 p-4 dark:border-sky-900/50 dark:bg-sky-950/25">
            <div className="flex items-center gap-2 text-sm font-semibold text-sky-950 dark:text-sky-100">
              <MousePointerClick className="h-4 w-4 shrink-0" aria-hidden />
              我要试课
            </div>
            <p className="text-xs leading-relaxed text-sky-900/90 dark:text-sky-200/90">
              <span className="font-semibold text-foreground">适用场景：</span>
              学员尚未安排试课，需要先创建试课订单、约定试听时间并完成试听费支付（线上/线下）时使用。
              将进入「创建试课单」流程，与原有逻辑一致。
            </p>
            <Button className="w-full bg-sky-600 text-white hover:bg-sky-700" asChild>
              <Link href="/trial-lesson/create">进入 · 创建试课单</Link>
            </Button>
          </div>

          <div className="space-y-2 rounded-xl border border-amber-200/90 bg-amber-50/70 p-4 dark:border-amber-900/50 dark:bg-amber-950/30">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-950 dark:text-amber-100">
              <ArrowRightLeft className="h-4 w-4 shrink-0" aria-hidden />
              我要试课转正课
            </div>
            <p className="text-xs leading-relaxed text-amber-950/95 dark:text-amber-200/90">
              <span className="font-semibold text-foreground">适用场景：</span>
              试课已经完成，需要在该学员名下的
              <span className="font-semibold text-foreground">原试课订单</span>
              上发起「转正课」、配置正课课时费与转正红包等时使用。请先到「订单管理」页，在筛选区按
              <span className="font-semibold text-foreground">孩子姓名</span>
              查找对应试课单，再在订单卡片上操作（勿在此新建空白单）。
            </p>
            <Button
              className="w-full border-amber-300 bg-amber-600 text-white hover:bg-amber-700 dark:border-amber-700"
              asChild
            >
              <Link href="/orders?guide=trial-convert">前往 · 订单管理中操作</Link>
            </Button>
          </div>

          <div className="space-y-2 rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/25">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-950 dark:text-emerald-100">
              <GraduationCap className="h-4 w-4 shrink-0" aria-hidden />
              我要直接上正课
            </div>
            <p className="text-xs leading-relaxed text-emerald-900/90 dark:text-emerald-200/90">
              <span className="font-semibold text-foreground">适用场景：</span>
              不经过试课、直接为新学员购买正课包（或从列表选择已有试课转化）时使用。将进入「创建正课单」入口，与原有「新增正课单」按钮一致。
            </p>
            <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700" asChild>
              <Link href="/regular-course/select-trial">进入 · 创建正课单</Link>
            </Button>
          </div>

          <div className="border-t pt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/students/create">录入学员档案</Link>
            </Button>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              新建客户档案时可与上方入口配合使用；不作为正课/试课下单的必经步骤。
            </p>
          </div>
        </CardContent>
      </Card>

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
