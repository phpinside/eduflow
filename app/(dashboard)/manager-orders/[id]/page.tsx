"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { 
  ArrowLeft, 
  User as UserIcon, 
  Users,
  Phone, 
  School, 
  BookOpen, 
  CheckCircle2,
  Building2,
  CalendarDays,
  FileText
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { mockUsers } from "@/lib/mock-data/users"
import { OrderStatus, OrderType, Role } from "@/types"

const STATUS_MAP: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "待接单",
  [OrderStatus.ASSIGNED]: "已分配",
  [OrderStatus.IN_PROGRESS]: "进行中",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.CANCEL_REQUESTED]: "取消申请中",
}

export default function ManagerOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  // In a real app, we would fetch this data. Here we use state to simulate local updates.
  const [order, setOrder] = React.useState(() => 
    mockOrders.find((o) => o.id === id)
  )

  const student = React.useMemo(() => 
    order ? mockStudents.find((s) => s.id === order.studentId) : null,
    [order]
  )

  const salesPerson = React.useMemo(() => 
    order ? mockUsers.find((u) => u.id === order.salesPersonId) : null,
    [order]
  )

  const manager = React.useMemo(() => 
    order ? mockUsers.find((u) => u.id === order.managerId) : null,
    [order]
  )

  const applicants = React.useMemo(() => {
    if (!order?.applicantIds) return []
    return mockUsers.filter(u => order.applicantIds?.includes(u.id))
  }, [order])

  const assignedTeacher = React.useMemo(() => 
    order?.assignedTeacherId ? mockUsers.find(u => u.id === order.assignedTeacherId) : null,
    [order]
  )

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">未找到订单</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回列表
        </Button>
      </div>
    )
  }

  const handleAssign = (teacherId: string) => {
    // Update global mock data
    const mockOrderIndex = mockOrders.findIndex(o => o.id === id)
    if (mockOrderIndex !== -1) {
        mockOrders[mockOrderIndex] = {
            ...mockOrders[mockOrderIndex],
            status: OrderStatus.ASSIGNED,
            assignedTeacherId: teacherId
        }
    }

    // Optimistic update
    setOrder(prev => {
        if (!prev) return prev
        return {
            ...prev,
            status: OrderStatus.ASSIGNED,
            assignedTeacherId: teacherId
        }
    })
    toast.success("已成功匹配老师！")
  }

  const handleSetPending = () => {
    if (!order) return

    // Update global mock data
    const mockOrderIndex = mockOrders.findIndex(o => o.id === order.id)
    if (mockOrderIndex !== -1) {
        mockOrders[mockOrderIndex] = {
            ...mockOrders[mockOrderIndex],
            status: OrderStatus.PENDING,
            assignedTeacherId: undefined,
            transferredOutFrom: order.assignedTeacherId
        }
    }

    setOrder(prev => {
        if (!prev) return prev
        // Save the current teacher as the one transferred out from
        const currentTeacherId = prev.assignedTeacherId
        
        return {
            ...prev,
            status: OrderStatus.PENDING,
            assignedTeacherId: undefined,
            transferredOutFrom: currentTeacherId
        }
    })
    toast.success("订单已重置为待接单，原老师处已标记转走")
  }

  return (
    <div className="space-y-6 container mx-auto pb-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">
              订单管理详情
            </h1>
            <Badge variant="outline">
              {STATUS_MAP[order.status]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            订单号：{order.id}
          </p>
        </div>
        
        {/* Actions */}
        {(order.status === OrderStatus.IN_PROGRESS || order.status === OrderStatus.ASSIGNED) && (
            <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700" onClick={handleSetPending}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                重新进入接单中心
            </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Column: Order & Student Info */}
        <div className="md:col-span-2 space-y-6">
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
                {order.type === OrderType.REGULAR && (
                   <div className="space-y-1">
                    <span className="text-muted-foreground">课时</span>
                    <div className="font-medium">{order.totalHours}</div>
                   </div>
                )}
              </div>
              {order.remarks && (
                <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-sm">备注：</span>
                    <span className="text-sm">{order.remarks}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Student Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" /> 学生信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {student ? (
                  <div className="text-sm space-y-3">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">姓名</span>
                        <span className="font-medium">{student.name} ({student.gender})</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">学校</span>
                        <span className="font-medium">{student.school || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">家长</span>
                        <span className="font-medium">{student.parentName}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">电话</span>
                        <div className="flex items-center gap-1 font-medium">
                            <Phone className="h-3 w-3" /> {student.parentPhone}
                        </div>
                    </div>
                  </div>
               ) : (
                <div className="text-muted-foreground">未找到学生信息</div>
               )}
            </CardContent>
          </Card>
          
           {/* Applicants / Teacher Selection */}
           <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> 申请接课老师名单
              </CardTitle>
            </CardHeader>
            <CardContent>
                {applicants.length > 0 ? (
                    <div className="space-y-4">
                        {applicants.map(applicant => {
                            const isAssigned = order.assignedTeacherId === applicant.id
                            return (
                                <div key={applicant.id} className={`flex flex-col gap-3 p-3 rounded-lg border ${isAssigned ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-card"}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={applicant.avatar} />
                                                <AvatarFallback>{applicant.name[0]}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-medium flex items-center gap-2">
                                                    {applicant.name}
                                                    {isAssigned && <Badge className="bg-green-600 hover:bg-green-700">已分配</Badge>}
                                                </div>
                                                <div className="text-xs text-muted-foreground">{applicant.phone}</div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">                                   

                                            {!isAssigned && order.status === OrderStatus.PENDING && (
                                                <Button size="sm" onClick={() => handleAssign(applicant.id)}>
                                                    选择匹配
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Teacher Statistics */}
                                    <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground mb-1">试课成功率</div>
                                            <div className="text-sm font-medium">50% (10/20)</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground mb-1">正课学员数</div>
                                            <div className="text-sm font-medium">8</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xs text-muted-foreground mb-1">累计课时</div>
                                            <div className="text-sm font-medium">156</div>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                ) : (
                    <div className="text-center py-6 text-muted-foreground">
                        暂无老师申请
                    </div>
                )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: QR Codes & Staff Info */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">负责人员信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Sales Person */}
                    {salesPerson && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={salesPerson.avatar} />
                                    <AvatarFallback>招</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-medium">{salesPerson.name}</div>
                                    <div className="text-xs text-muted-foreground">招生老师</div>
                                </div>
                            </div>
                            {salesPerson.wechatQrCode ? (
                                <div className="flex flex-col items-center p-2 bg-muted/30 rounded border">
                                    <img src={salesPerson.wechatQrCode} alt="Sales QR" className="w-32 h-32 object-contain bg-white rounded" />
                                    <span className="text-xs text-muted-foreground mt-1">招生老师微信</span>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground text-center p-4 bg-muted/30 rounded">暂无二维码</div>
                            )}
                        </div>
                    )}

                    <Separator />

                    {/* Manager */}
                    {manager && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={manager.avatar} />
                                    <AvatarFallback>管</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-medium">{manager.name}</div>
                                    <div className="text-xs text-muted-foreground">学管师</div>
                                </div>
                            </div>
                            {manager.wechatQrCode ? (
                                <div className="flex flex-col items-center p-2 bg-muted/30 rounded border">
                                    <img src={manager.wechatQrCode} alt="Manager QR" className="w-32 h-32 object-contain bg-white rounded" />
                                    <span className="text-xs text-muted-foreground mt-1">学管师微信</span>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground text-center p-4 bg-muted/30 rounded">暂无二维码</div>
                            )}
                        </div>
                    )}
                    
                    <Separator />

                     {/* Assigned Teacher (if any) */}
                     {assignedTeacher && (
                         <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={assignedTeacher.avatar} />
                                    <AvatarFallback>师</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="text-sm font-medium">{assignedTeacher.name}</div>
                                    <div className="text-xs text-muted-foreground">伴学老师 (已匹配)</div>
                                </div>
                            </div>
                            {assignedTeacher.wechatQrCode ? (
                                <div className="flex flex-col items-center p-2 bg-muted/30 rounded border">
                                    <img src={assignedTeacher.wechatQrCode} alt="Teacher QR" className="w-32 h-32 object-contain bg-white rounded" />
                                    <span className="text-xs text-muted-foreground mt-1">伴学老师微信</span>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground text-center p-4 bg-muted/30 rounded">暂无二维码</div>
                            )}
                        </div>
                     )}

                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}
