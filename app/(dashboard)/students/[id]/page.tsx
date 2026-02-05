"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { STUDENTS_MOCK } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Edit, FileText } from "lucide-react"
import { Separator } from "@/components/ui/separator"

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  regular: { label: "正课学员", variant: "default" },
  trial: { label: "试课学员", variant: "secondary" },
  graduated: { label: "已结课", variant: "outline" },
}

const RELATION_MAP: Record<string, string> = {
  father: "父亲",
  mother: "母亲",
  grandparent: "祖父母/外祖父母",
  other: "其他",
}

export default function StudentDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  
  const student = STUDENTS_MOCK.find(s => s.id === id)

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <h2 className="text-xl font-semibold">未找到学生档案</h2>
        <Button variant="outline" onClick={() => router.back()}>返回列表</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
                <h2 className="text-3xl font-bold tracking-tight">{student.name}</h2>
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                    <span>{student.id}</span>
                    <span>•</span>
                    <Badge variant={STATUS_MAP[student.status]?.variant || "secondary"}>
                        {STATUS_MAP[student.status]?.label || student.status}
                    </Badge>
                </div>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href={`/orders?studentId=${student.id}`}>
                    <FileText className="mr-2 h-4 w-4" />
                    查看订单
                </Link>
            </Button>
            <Button asChild>
                <Link href={`/students/${student.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑档案
                </Link>
            </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 基本信息 */}
        <Card>
            <CardHeader>
                <CardTitle>基本信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">性别：</span>
                        <span>{student.gender}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">年级：</span>
                        <span>{student.grade}</span>
                    </div>
                     <div>
                        <span className="text-muted-foreground">就读学校：</span>
                        <span>{student.school || "-"}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">所在地区：</span>
                        <span>{student.region}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">入学时间：</span>
                        <span>{student.enrollmentDate}</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* 联系方式 */}
        <Card>
            <CardHeader>
                <CardTitle>联系方式</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">家长姓名：</span>
                        <span>{student.parentName || "-"}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">家长电话：</span>
                        <span>{student.parentPhone}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">亲属关系：</span>
                        <span>{RELATION_MAP[student.parentRelation] || student.parentRelation || "-"}</span>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* 学习情况 - Mocking since it's not fully in the simple list but likely in detailed data */}
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>学科信息</CardTitle>
                <CardDescription>当前在读或意向科目</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4">
                    <div className="border rounded-md p-4 min-w-[200px]">
                        <div className="font-semibold text-lg">{student.subject}</div>
                        <div className="text-sm text-muted-foreground mt-1">当前主修</div>
                    </div>
                    {/* Placeholder for more subjects if the data structure supported it */}
                </div>
            </CardContent>
        </Card>

        {/* 系统信息 */}
         <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>系统归属</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="text-muted-foreground">归属校区：</span>
                        <span>{student.campusName || "-"}</span>
                    </div>
                    <div>
                        <span className="text-muted-foreground">校区账号：</span>
                        <span>{student.campusAccount || "-"}</span>
                    </div>
                     <div>
                        <span className="text-muted-foreground">学生账号：</span>
                        <span>{student.studentAccount || "-"}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}
