"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ArrowLeft, User, Phone, School, Calendar, Clock, CreditCard, BookOpen, GraduationCap, Building2, CalendarDays, FileText, ArrowRight, RefreshCw } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { OrderStatus, OrderType } from "@/types"

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

export default function OrderDetailsPage() {
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

  // Renew Dialog State
  const [isRenewOpen, setIsRenewOpen] = React.useState(false)
  const [renewHours, setRenewHours] = React.useState(40)

  const handleRenewOrder = () => {
    if (!order) return
    
    // Simple pricing logic for demo
    const pricePerHour = 200 
    const totalCost = pricePerHour * renewHours
    
    const queryParams = new URLSearchParams({
        type: "renew", // Indicate renewal
        studentName: student?.name || "未知学生",
        subject: order.subject,
        grade: order.grade,
        totalHours: renewHours.toString(),
        price: totalCost.toString(),
    }).toString()
    
    setIsRenewOpen(false)
    router.push(`/regular-course/payment?${queryParams}`)
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
              订单详情
            </h1>
            <Badge variant={STATUS_COLOR_MAP[order.status]}>
              {STATUS_MAP[order.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            订单号：{order.id}
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2">
            {order.type === OrderType.TRIAL && order.status === OrderStatus.COMPLETED && (
                <Button 
                    onClick={() => {
                        const params = new URLSearchParams({
                            studentName: student?.name || "未知学生",
                            subject: order.subject,
                            grade: order.grade,
                        }).toString()
                        router.push(`/trial-lesson/deal-payment?${params}`)
                    }}
                >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    转正课
                </Button>
            )}

             {order.type === OrderType.REGULAR && order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.CANCEL_REQUESTED && (
                <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setIsRenewOpen(true)}
                >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    续费
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

        {/* Payment & System Info */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" /> 订单及支付信息
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-6">
                 {/* Transaction History Table */}
                {order.transactions && order.transactions.length > 0 ? (
                    <div>
                         <h4 className="text-sm font-medium text-muted-foreground mb-3">支付记录</h4>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>说明</TableHead>
                                        <TableHead>支付金额</TableHead>
                                        <TableHead>增加课时</TableHead>
                                        <TableHead className="text-right">时间</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.transactions.map((tx) => (
                                        <TableRow key={tx.id}>
                                            <TableCell className="font-medium">
                                                {tx.type === 'INITIAL' ? '首次下单' : '续费'}
                                            </TableCell>
                                            <TableCell>¥{tx.amount.toLocaleString()}</TableCell>
                                            <TableCell>{tx.hours} 课时</TableCell>
                                            <TableCell className="text-right text-muted-foreground">
                                                {format(new Date(tx.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    /* Fallback for old data without transactions array */
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                        <div className="space-y-1">
                            <span className="text-muted-foreground">订单金额</span>
                            <div className="text-xl font-bold text-primary">
                            ¥{order.price.toLocaleString()}
                            </div>
                        </div>
                         <div className="space-y-1">
                            <span className="text-muted-foreground">说明</span>
                            <div className="font-medium">
                                首次下单
                            </div>
                        </div>
                         <div className="space-y-1">
                            <span className="text-muted-foreground">下单时间</span>
                            <div className="font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(new Date(order.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                            </div>
                        </div>
                    </div>
                )}
                
                {order.transactions && (
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm pt-4 border-t">
                        <div className="space-y-1">
                            <span className="text-muted-foreground">累计总金额</span>
                            <div className="text-xl font-bold text-primary">
                            ¥{order.transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground">累计总课时</span>
                            <div className="font-medium">
                            {order.transactions.reduce((sum, t) => sum + t.hours, 0)} 课时
                            </div>
                        </div>
                     </div>
                )}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Renew Dialog */}
      <Dialog open={isRenewOpen} onOpenChange={setIsRenewOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>正课续费</DialogTitle>
                <DialogDescription>
                    为学生 {student?.name} 的 {order?.subject} 课程续费。
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="hours">续费课时数</Label>
                    <Input 
                        id="hours" 
                        type="number" 
                        min={1} 
                        value={renewHours}
                        onChange={(e) => setRenewHours(parseInt(e.target.value) || 0)}
                    />
                </div>
                <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
                    <span className="text-sm text-muted-foreground">预计费用</span>
                    <span className="font-bold text-lg">
                        ¥{(200 * renewHours).toLocaleString()}
                    </span>
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsRenewOpen(false)}>取消</Button>
                <Button onClick={handleRenewOrder}>
                    确认并支付
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
