"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, Plus } from "lucide-react"
import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { OrderType, OrderStatus } from "@/types"

export default function SelectTrialPage() {
  const router = useRouter()

  // 获取学生姓名
  const getStudentName = (studentId: string) => {
    const student = mockStudents.find(s => s.id === studentId)
    return student ? student.name : "未知学生"
  }

  // 筛选已完成的试课订单，按创建时间倒序
  const completedTrialOrders = mockOrders
    .filter(o => o.type === OrderType.TRIAL && o.status === OrderStatus.COMPLETED)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  // 处理转正课按钮点击
  const handleConvertToRegular = (order: any) => {
    const params = new URLSearchParams({
      studentName: getStudentName(order.studentId),
      subject: order.subject,
      grade: order.grade,
      gender: mockStudents.find(s => s.id === order.studentId)?.gender || "",
      region: mockStudents.find(s => s.id === order.studentId)?.address || "",
      school: mockStudents.find(s => s.id === order.studentId)?.school || "",
      parentPhone: mockStudents.find(s => s.id === order.studentId)?.parentPhone || "",
      campusName: order.campusName || "",
      campusAccount: order.campusAccount || "",
      studentAccount: order.studentAccount || "",
    }).toString()
    
    router.push(`/regular-course/deal-payment?${params}`)
  }

  // 直接创建新正课单
  const handleCreateNew = () => {
    router.push("/regular-course/create")
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">是否从试课单创建正课单？</h2>
        <p className="text-muted-foreground">
          您可以选择从已完成的试课订单转正课，或直接创建新的正课单
        </p>
      </div>

      {completedTrialOrders.length > 0 ? (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">最近完成的试课订单</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedTrialOrders.map((order) => (
                <Card 
                  key={order.id} 
                  className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {getStudentName(order.studentId)}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          订单号: {order.id}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        已完成
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">科目</span>
                        <span className="font-medium">{order.subject}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">年级</span>
                        <span className="font-medium">{order.grade}</span>
                      </div>
                      {order.scheduledAt && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">完成时间</span>
                          <span className="font-medium text-xs">
                            {format(new Date(order.scheduledAt), "yyyy-MM-dd", { locale: zhCN })}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button 
                      className="w-full"
                      onClick={() => handleConvertToRegular(order)}
                    >
                      <ArrowRight className="mr-2 h-4 w-4" />
                      转正课
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 py-6">
            <div className="flex-1 border-t" />
            <span className="text-sm text-muted-foreground">或者</span>
            <div className="flex-1 border-t" />
          </div>
        </>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <p className="text-muted-foreground mb-4">暂无已完成的试课订单</p>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center pb-10">
        <Button 
          size="lg" 
          variant="outline"
          onClick={handleCreateNew}
        >
          <Plus className="mr-2 h-5 w-5" />
          直接创建新正课单
        </Button>
      </div>
    </div>
  )
}
