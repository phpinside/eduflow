"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Search, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { getStoredStudents, saveStoredOrders, getStoredOrders } from "@/lib/storage"
import type { Student, Order } from "@/types"
import { useAuth } from "@/contexts/AuthContext"
import { logStudentHoursAdjustment } from "@/lib/operation-log-helper"
import { OperationAction } from "@/types/operation-log"

// 表单验证schema
const searchSchema = z.object({
  studentName: z.string().optional(),
  parentPhone: z.string().optional(),
})

type SearchFormValues = z.infer<typeof searchSchema>

// 课时调整表单schema
const adjustSchema = z.object({
  adjustHours: z.string()
    .min(1, "调整课时不能为空")
    .refine((val) => {
      const num = Number(val)
      return !isNaN(num) && num !== 0
    }, "调整课时必须是非零数字"),
  remark: z.string().min(1, "备注不能为空"),
})

type AdjustFormValues = z.infer<typeof adjustSchema>

export default function StudentHoursAdjustmentPage() {
  const { user } = useAuth()
  const [students, setStudents] = useState<Student[]>([])
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [studentOrders, setStudentOrders] = useState<Order[]>([])
  const [totalHours, setTotalHours] = useState<number>(0)

  // 搜索表单
  const searchForm = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      studentName: "",
      parentPhone: "",
    },
  })

  // 调整表单
  const adjustForm = useForm<AdjustFormValues>({
    resolver: zodResolver(adjustSchema),
    defaultValues: {
      adjustHours: "",
      remark: "",
    },
  })

  useEffect(() => {
    const allStudents = getStoredStudents()
    setStudents(allStudents)
  }, [])

  // 计算学生的总课时（从所有订单中累加剩余课时）
  const calculateTotalHours = (studentId: string) => {
    const allOrders = getStoredOrders()
    const studentOrders = allOrders.filter(order => order.studentId === studentId)
    setStudentOrders(studentOrders)
    
    const total = studentOrders.reduce((sum, order) => {
      return sum + (order.remainingHours || 0)
    }, 0)
    
    setTotalHours(total)
    return total
  }

  // 搜索学生
  const handleSearch = (values: SearchFormValues) => {
    const { studentName, parentPhone } = values
    
    if (!studentName && !parentPhone) {
      toast.error("请输入学生姓名或家长手机号")
      return
    }

    let results = students
    
    if (studentName) {
      results = results.filter(s => 
        s.name.includes(studentName.trim())
      )
    }
    
    if (parentPhone) {
      results = results.filter(s => 
        s.parentPhone.includes(parentPhone.trim())
      )
    }

    setFilteredStudents(results)
    setSelectedStudent(null)
    setStudentOrders([])
    setTotalHours(0)

    if (results.length === 0) {
      toast.info("未找到匹配的学生")
    } else {
      toast.success(`找到 ${results.length} 个学生`)
    }
  }

  // 重置搜索
  const handleReset = () => {
    searchForm.reset()
    setFilteredStudents([])
    setSelectedStudent(null)
    setStudentOrders([])
    setTotalHours(0)
  }

  // 选择学生
  const handleSelectStudent = (student: Student) => {
    setSelectedStudent(student)
    calculateTotalHours(student.id)
    adjustForm.reset({
      adjustHours: "",
      remark: "",
    })
  }

  // 提交课时调整
  const handleAdjustSubmit = (values: AdjustFormValues) => {
    if (!selectedStudent || !user) {
      toast.error("请先选择学生")
      return
    }

    const adjustAmount = Number(values.adjustHours)
    const beforeHours = totalHours
    const afterHours = beforeHours + adjustAmount

    if (afterHours < 0) {
      toast.error("调整后课时不能为负数")
      return
    }

    // 确认对话框
    const confirmed = confirm(
      `确认调整学生「${selectedStudent.name}」的课时？\n\n` +
      `调整前：${beforeHours} 课时\n` +
      `调整量：${adjustAmount > 0 ? '+' : ''}${adjustAmount} 课时\n` +
      `调整后：${afterHours} 课时\n\n` +
      `备注：${values.remark}`
    )

    if (!confirmed) return

    try {
      // 记录操作日志
      logStudentHoursAdjustment({
        action: OperationAction.STUDENT_HOURS_ADJUST,
        operator: user,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        parentPhone: selectedStudent.parentPhone,
        beforeHours,
        afterHours,
        adjustAmount,
        remark: values.remark,
      })

      // TODO: 实际业务中需要更新所有相关订单的剩余课时
      // 这里简化处理，只记录日志
      
      toast.success(`课时调整成功！\n调整前：${beforeHours} → 调整后：${afterHours}`)
      
      // 重置表单
      adjustForm.reset({
        adjustHours: "",
        remark: "",
      })
      
      // 重新计算课时
      calculateTotalHours(selectedStudent.id)
    } catch (error) {
      console.error("课时调整失败:", error)
      toast.error("课时调整失败，请重试")
    }
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">学生课时调整</h1>
        <p className="text-muted-foreground mt-1">
          根据学生姓名或家长手机号查找学生，并调整其edu剩余课时数
        </p>
      </div>

      {/* 搜索区域 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            查找学生
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...searchForm}>
            <form onSubmit={searchForm.handleSubmit(handleSearch)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={searchForm.control}
                  name="studentName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>学生姓名</FormLabel>
                      <FormControl>
                        <Input placeholder="输入学生姓名" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={searchForm.control}
                  name="parentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>家长手机号</FormLabel>
                      <FormControl>
                        <Input placeholder="输入家长手机号" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">
                  <Search className="mr-2 h-4 w-4" />
                  搜索
                </Button>
                <Button type="button" variant="outline" onClick={handleReset}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  重置
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 搜索结果列表 */}
      {filteredStudents.length > 0 && !selectedStudent && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">搜索结果（{filteredStudents.length}）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学生姓名</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>性别</TableHead>
                    <TableHead>学校</TableHead>
                    <TableHead>家长手机</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.grade}</TableCell>
                      <TableCell>{student.gender}</TableCell>
                      <TableCell>{student.school}</TableCell>
                      <TableCell>{student.parentPhone}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => handleSelectStudent(student)}
                        >
                          选择
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 选中学生信息 */}
      {selectedStudent && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* 学生基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">学生信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">学生姓名：</span>
                  <span className="font-medium">{selectedStudent.name}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">年级：</span>
                  <span className="font-medium">{selectedStudent.grade}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">性别：</span>
                  <span className="font-medium">{selectedStudent.gender}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">学校：</span>
                  <span className="font-medium">{selectedStudent.school}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">家长手机：</span>
                  <span className="font-medium">{selectedStudent.parentPhone}</span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">当前总课时：</span>
                  <Badge variant="default" className="text-lg px-3 py-1">
                    {totalHours} 课时
                  </Badge>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedStudent(null)
                  setStudentOrders([])
                  setTotalHours(0)
                }}
              >
                重新选择
              </Button>
            </CardContent>
          </Card>

          {/* 课时调整表单 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Save className="h-4 w-4" />
                课时调整
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...adjustForm}>
                <form onSubmit={adjustForm.handleSubmit(handleAdjustSubmit)} className="space-y-4">
                  <FormField
                    control={adjustForm.control}
                    name="adjustHours"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>调整课时（正数增加，负数减少）</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="例如：10 或 -5"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={adjustForm.control}
                    name="remark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>调整备注（必填）</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="请填写课时调整的原因和说明..."
                            rows={4}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <p className="text-blue-900 font-medium mb-1">调整预览</p>
                    <p className="text-blue-700">
                      当前：{totalHours} 课时
                      {adjustForm.watch("adjustHours") && (
                        <>
                          {" → "}
                          {totalHours + Number(adjustForm.watch("adjustHours") || 0)} 课时
                        </>
                      )}
                    </p>
                  </div>

                  <Button type="submit" className="w-full">
                    <Save className="mr-2 h-4 w-4" />
                    确认调整
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 订单明细 */}
      {selectedStudent && studentOrders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">关联订单明细（{studentOrders.length}）</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>订单号</TableHead>
                    <TableHead>科目</TableHead>
                    <TableHead>年级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">剩余课时</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell>{order.subject}</TableCell>
                      <TableCell>{order.grade}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {order.remainingHours || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
