"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { mockStudents } from "@/lib/mock-data/students"
import { mockOrders } from "@/lib/mock-data/orders"
import { OrderStatus } from "@/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, Phone, MapPin, School, BookOpen, MessageSquare, CalendarDays } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function StudentDetailForTutorPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const id = params.id as string

    // 1. Fetch Student Data
    const student = React.useMemo(() => 
        mockStudents.find(s => s.id === id), 
        [id]
    )

    // 2. Fetch Active Courses for this Student & Tutor
    const activeCourses = React.useMemo(() => {
        if (!user || !student) return []
        return mockOrders.filter(o => 
            o.studentId === student.id && 
            o.assignedTeacherId === user.id &&
            [OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED].includes(o.status)
        )
    }, [user, student])

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                <h2 className="text-xl font-bold">未找到学员信息</h2>
                <Button variant="outline" onClick={() => router.back()}>返回列表</Button>
            </div>
        )
    }

    const dayLabels: Record<string, string> = {
        monday: "周一", tuesday: "周二", wednesday: "周三", thursday: "周四",
        friday: "周五", saturday: "周六", sunday: "周日"
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            {/* Header / Navigation */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">{student.name}</h1>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <Badge variant="outline">{student.grade}</Badge>
                        <Badge variant="outline">{student.gender}</Badge>
                        {student.school && (
                            <span className="flex items-center gap-1">
                                <School className="h-3 w-3" /> {student.school}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column: Student Info */}
                <div className="space-y-6 md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <User className="h-4 w-4" /> 基本信息
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="space-y-1">
                                <span className="text-muted-foreground block text-xs">家长联系方式</span>
                                <div className="font-medium flex items-center gap-2">
                                    <Phone className="h-3.5 w-3.5" />
                                    {student.parentName} {student.parentPhone}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Courses & Progress */}
                <div className="space-y-6 md:col-span-2">
                    <h2 className="text-lg font-semibold tracking-tight">在读课程 ({activeCourses.length})</h2>
                    
                    {activeCourses.length > 0 ? (
                        activeCourses.map(course => (
                            <Card key={course.id}>
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-base font-bold flex items-center gap-2">
                                                {course.subject} 
                                                <Badge variant="secondary" className="font-normal text-xs">
                                                    {course.grade}
                                                </Badge>
                                            </CardTitle>
                                            <CardDescription className="text-xs mt-1">
                                                订单号: {course.id}
                                            </CardDescription>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-primary">
                                                {course.remainingHours} <span className="text-sm font-normal text-muted-foreground">/ {course.totalHours} 课时</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">剩余课时</div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Schedule Info */}
                                    <div className="bg-muted/30 rounded-md p-3 text-sm">
                                        <div className="flex items-center gap-2 mb-2 font-medium">
                                            <CalendarDays className="h-4 w-4" /> 上课时间
                                        </div>
                                        {course.weeklySchedule && course.weeklySchedule.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                {course.weeklySchedule.map((s, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-muted-foreground bg-background px-2 py-1 rounded border">
                                                        <span className="text-foreground font-medium">
                                                            {dayLabels[s.day] || s.day}
                                                        </span>
                                                        <span>{s.startTime}-{s.endTime}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-muted-foreground italic pl-6">未设置固定排课时间</div>
                                        )}
                                    </div>

                                    {/* Academic Info */}
                                    {(course.lastExamScore || course.textbookVersion || course.remarks) && (
                                        <div className="grid grid-cols-2 gap-4 text-sm pt-2">
                                            {course.lastExamScore && (
                                                <div className="space-y-1">
                                                    <span className="text-xs text-muted-foreground">最近成绩</span>
                                                    <div className="font-medium">{course.lastExamScore}</div>
                                                </div>
                                            )}
                                            {course.textbookVersion && (
                                                <div className="space-y-1">
                                                    <span className="text-xs text-muted-foreground">教材版本</span>
                                                    <div className="font-medium">{course.textbookVersion}</div>
                                                </div>
                                            )}
                                            {course.remarks && (
                                                <div className="col-span-2 space-y-1">
                                                    <span className="text-xs text-muted-foreground">备注信息</span>
                                                    <div className="p-2 bg-muted/20 rounded text-muted-foreground text-xs leading-relaxed">
                                                        {course.remarks}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex gap-3 pt-2">
                                        <Button size="sm" variant="outline" className="flex-1" asChild>
                                            <Link href={`/my-students/study-plan/${course.id}`}>
                                                <BookOpen className="mr-2 h-4 w-4" /> 学习规划
                                            </Link>
                                        </Button>
                                        <Button size="sm" variant="outline" className="flex-1" asChild>
                                            <Link href={`/my-students/feedback/${course.id}`}>
                                                <MessageSquare className="mr-2 h-4 w-4" /> 课后反馈
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                            暂无正在进行的课程
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
