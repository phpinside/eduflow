"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { format, addMinutes, differenceInSeconds } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ArrowLeft, User, Phone, School, Calendar, Clock, BookOpen, GraduationCap, Building2, CalendarDays, FileText } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { OrderStatus, OrderType } from "@/types"

const ORDER_TIMEOUT_MINUTES = 30
const CURRENT_COACH_ID = "current_coach_001"

const STATUS_MAP: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "待接单",
  [OrderStatus.ASSIGNED]: "已分配",
  [OrderStatus.IN_PROGRESS]: "进行中",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.CANCEL_REQUESTED]: "取消申请中",
}

const STATUS_COLOR_MAP: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  [OrderStatus.PENDING]: "secondary",
  [OrderStatus.ASSIGNED]: "default",
  [OrderStatus.IN_PROGRESS]: "default",
  [OrderStatus.COMPLETED]: "outline",
  [OrderStatus.CANCELLED]: "destructive",
  [OrderStatus.CANCEL_REQUESTED]: "destructive",
}

export default function MarketOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const order = React.useMemo(() => 
    mockOrders.find((o) => o.id === id), 
    [id]
  )

  const student = React.useMemo(() => 
    order ? mockStudents.find((s) => s.id === order.studentId) : null,
    [order]
  )

  // Market View Logic
  const [now, setNow] = React.useState(new Date())
  const [isApplied, setIsApplied] = React.useState(false)

  // Mock deadline calc (should match market logic)
  const deadline = React.useMemo(() => {
    if (!order) return new Date()
    // For pending orders, we assume the same deadline logic as market page for consistency in this prototype
    // In real app, deadline should be a field on the order object
    return addMinutes(new Date(order.createdAt), ORDER_TIMEOUT_MINUTES)
  }, [order])

  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleApply = () => {
    if (now > deadline) {
      toast.error("接单时间已截止")
      return
    }
    setIsApplied(true)
    toast.success("申请成功！请等待系统派单")
  }

  const handleCancelApply = () => {
    if (now > deadline) {
        toast.error("倒计时已结束，无法取消")
        return
    }
    setIsApplied(false)
    toast.success("已取消申请")
  }

  const Countdown = () => {
    const diff = differenceInSeconds(deadline, now)
    if (diff <= 0) return <span className="text-muted-foreground font-medium text-sm">申请已截止</span>
    
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return (
      <div className="flex flex-col items-end">
         <span className="text-xs text-muted-foreground">接单倒计时</span>
         <span className="text-orange-600 font-mono font-bold text-lg">
            {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
         </span>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">未找到订单</h2>
        <p className="text-muted-foreground">该订单不存在或已被删除</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              订单详情 (申请)
            </h1>
            <Badge variant={STATUS_COLOR_MAP[order.status]}>
              {STATUS_MAP[order.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            订单号：{order.id}
          </p>
        </div>
        
        {/* Market View Extra Header Info */}
        <Countdown />

        {/* Actions */}
        <div className="flex gap-2">
            {/* Market Apply Actions */}
            {isApplied ? (
                <Button variant="destructive" onClick={handleCancelApply} disabled={now > deadline}>
                    取消申请
                </Button>
            ) : (
                <Button onClick={handleApply} disabled={now > deadline}>
                    {now > deadline ? "已截止" : "立即申请"}
                </Button>
            )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Order Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" /> 课程信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-muted-foreground">类型</span>
                <div className="font-medium">
                  {order.type === OrderType.TRIAL ? "试课" : "正课"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">科目</span>
                <div className="font-medium">{order.subject}</div>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground">年级</span>
                <div className="font-medium">{order.grade}</div>
              </div>
              
              {order.type === OrderType.TRIAL && order.scheduledAt && (
                <div className="space-y-1">
                  <span className="text-muted-foreground">预约时间</span>
                  <div className="font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(order.scheduledAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                  </div>
                </div>
              )}

              {order.type === OrderType.REGULAR && (
                <>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">总课时</span>
                    <div className="font-medium">{order.totalHours} 课时</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">剩余课时</span>
                    <div className="font-medium">{order.remainingHours} 课时</div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Student Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> 学生信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {student ? (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-muted-foreground">姓名</span>
                    <div className="font-medium">{student.name}</div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground">性别</span>
                    <div className="font-medium flex items-center gap-1">
                        {student.gender}
                    </div>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                    <span className="text-muted-foreground">家长姓名</span>
                    <div className="font-medium">{student.parentName}</div>
                  </div>
                   <div className="space-y-1">
                    <span className="text-muted-foreground">家长电话</span>
                    <div className="font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {student.parentPhone}
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">就读学校</span>
                  <div className="font-medium flex items-center gap-1">
                    <School className="h-3 w-3" /> {student.school || "-"}
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">家庭住址</span>
                  <div className="font-medium">{student.address || "-"}</div>
                </div>
                {/* Academic Info */}
                {(order.lastExamScore || order.examMaxScore || order.textbookVersion) && (
                    <>
                        <Separator />
                        <div className="space-y-1 pt-2">
                             <div className="flex items-center gap-2 mb-2">
                                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">学习情况</span>
                             </div>
                             <div className="grid grid-cols-3 gap-2">
                                {order.lastExamScore && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">最近成绩</span>
                                        <span className="text-sm">{order.lastExamScore}</span>
                                    </div>
                                )}
                                {order.examMaxScore && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">卷面满分</span>
                                        <span className="text-sm">{order.examMaxScore}</span>
                                    </div>
                                )}
                                {order.textbookVersion && (
                                    <div>
                                        <span className="text-xs text-muted-foreground block">教材版本</span>
                                        <span className="text-sm">{order.textbookVersion}</span>
                                    </div>
                                )}
                             </div>
                        </div>
                    </>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">
                未找到相关学生信息
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campus Info - Only if available */}
        {(order.campusName || order.campusAccount || order.studentAccount) && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> 校区信息
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        {order.campusName && (
                            <div className="space-y-1">
                                <span className="text-muted-foreground">校区名称</span>
                                <div className="font-medium">{order.campusName}</div>
                            </div>
                        )}
                        {order.campusAccount && (
                            <div className="space-y-1">
                                <span className="text-muted-foreground">校区账号</span>
                                <div className="font-medium">{order.campusAccount}</div>
                            </div>
                        )}
                        {order.studentAccount && (
                             <div className="space-y-1">
                                <span className="text-muted-foreground">学生账号</span>
                                <div className="font-medium">{order.studentAccount}</div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Scheduling Info - Only if available */}
        {order.weeklySchedule && order.weeklySchedule.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" /> 排课信息
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div className="space-y-2">
                         <span className="text-muted-foreground">每周上课时间</span>
                         <div className="grid gap-2">
                            {order.weeklySchedule.map((schedule, index) => {
                                const dayLabels: Record<string, string> = {
                                    monday: "周一", tuesday: "周二", wednesday: "周三", thursday: "周四",
                                    friday: "周五", saturday: "周六", sunday: "周日"
                                };
                                return (
                                    <div key={index} className="flex justify-between items-center bg-muted/30 p-2 rounded">
                                        <span className="font-medium">{dayLabels[schedule.day] || schedule.day}</span>
                                        <span>{schedule.startTime} - {schedule.endTime}</span>
                                    </div>
                                )
                            })}
                         </div>
                    </div>
                </CardContent>
            </Card>
        )}

        {/* Remarks - Only if available */}
        {order.remarks && (
             <Card className="md:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> 备注信息
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    {order.remarks}
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  )
}
