"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Filter, MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { STUDENTS_MOCK } from "@/lib/mock-data"

// Mock Data for Students used to be here, now imported
const STUDENTS = STUDENTS_MOCK

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  regular: { label: "正课学员", variant: "default" },
  trial: { label: "试课学员", variant: "secondary" },
  graduated: { label: "已结课", variant: "outline" },
}

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = React.useState("")

  const filteredStudents = STUDENTS.filter((student) =>
    student.name.includes(searchTerm) ||
    student.parentPhone.includes(searchTerm) ||
    student.school.includes(searchTerm)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">学生档案</h2>
          <p className="text-muted-foreground">
            管理所有试课和正课学生信息
          </p>
        </div>
        <Button asChild>
          <Link href="/students/create">
            <Plus className="mr-2 h-4 w-4" />
            录入新学生
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索姓名、手机号或学校..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>年级/科目</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>学校/地区</TableHead>
              <TableHead>家长联系方式</TableHead>
              <TableHead>入学时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    <div>{student.name}</div>
                    <div className="text-xs text-muted-foreground">{student.gender}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{student.grade}</div>
                    <div className="text-xs text-muted-foreground">{student.subject}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_MAP[student.status].variant}>
                      {STATUS_MAP[student.status].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px] truncate" title={student.school}>
                        {student.school}
                    </div>
                    <div className="text-xs text-muted-foreground truncate" title={student.region}>
                        {student.region}
                    </div>
                  </TableCell>
                  <TableCell>{student.parentPhone}</TableCell>
                  <TableCell>{student.enrollmentDate}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>操作</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/students/${student.id}`}>查看详情</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/students/${student.id}/edit`}>编辑信息</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/orders?studentId=${student.id}`}>订单记录</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  暂无学生数据
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
