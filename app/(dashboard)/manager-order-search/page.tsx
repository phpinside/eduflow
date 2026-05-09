"use client"

import * as React from "react"
import Link from "next/link"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Search as SearchIcon, UserRound, BookOpen, IdCard } from "lucide-react"

import { getStoredOrders, getStoredUsers } from "@/lib/storage"
import { mockStudents } from "@/lib/mock-data/students"
import type { Order, User } from "@/types"
import { OrderType } from "@/types"
import { ORDER_STATUS_MAP } from "@/lib/order-constants"
import { SalesOrderPipeline } from "@/components/orders/sales-order-pipeline"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function resolveRechargeHours(order: Order): number {
  const tx = (order.transactions ?? [])
    .filter((t) => t.type === "INITIAL" || t.type === "RENEWAL")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
  const fromTx = Number(tx?.hours ?? 0) || 0
  if (fromTx > 0) return fromTx
  return Math.max(0, Number(order.totalHours ?? 0) || 0)
}

function needsDingbanxueLabel(order: Order): string {
  return order.needsDingbanxueRecharge === false ? "否" : "是"
}

function userNameById(users: User[], id: string | undefined): string {
  if (!id) return "—"
  return users.find((u) => u.id === id)?.name ?? "—"
}

export default function ManagerOrderSearchPage() {
  const [orders, setOrders] = React.useState<Order[]>([])
  const [users, setUsers] = React.useState<User[]>([])

  const [subject, setSubject] = React.useState("ALL")
  const [type, setType] = React.useState<"ALL" | OrderType>("ALL")
  const [studentName, setStudentName] = React.useState("")
  const [gAccount, setGAccount] = React.useState("")

  React.useEffect(() => {
    setOrders(getStoredOrders())
    setUsers(getStoredUsers())
  }, [])

  const subjectOptions = React.useMemo(() => {
    const set = new Set<string>()
    orders.forEach((o) => {
      if (o.subject?.trim()) set.add(o.subject.trim())
    })
    return Array.from(set).sort()
  }, [orders])

  const rows = React.useMemo(() => {
    const nameQ = studentName.trim()
    const gQ = gAccount.trim().toLowerCase()
    return orders
      .map((o) => {
        const stu = mockStudents.find((s) => s.id === o.studentId)
        return {
          order: o,
          studentName: stu?.name ?? "—",
        }
      })
      .filter(({ order, studentName: sname }) => {
        if (subject !== "ALL" && order.subject !== subject) return false
        if (type !== "ALL" && order.type !== type) return false
        if (nameQ && !sname.includes(nameQ)) return false
        if (gQ && !(order.studentAccount ?? "").toLowerCase().includes(gQ)) return false
        return true
      })
      .sort((a, b) => new Date(b.order.createdAt).getTime() - new Date(a.order.createdAt).getTime())
  }, [orders, subject, type, studentName, gAccount])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">订单搜索</h1>
        <p className="text-sm text-muted-foreground">
          面向学管的只读检索视图：支持按科目、订单类型、学员姓名、G账号查询；不展示任何金额信息。
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
            筛选条件
          </CardTitle>
          <CardDescription>输入后结果会实时过滤。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label>科目</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger>
                <SelectValue placeholder="全部科目" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                {subjectOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>订单类型</Label>
            <Select value={type} onValueChange={(v) => setType(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                <SelectItem value={OrderType.TRIAL}>试课</SelectItem>
                <SelectItem value={OrderType.REGULAR}>正课</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>学员姓名</Label>
            <Input value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="支持模糊匹配" />
          </div>

          <div className="space-y-2">
            <Label>G账号</Label>
            <Input value={gAccount} onChange={(e) => setGAccount(e.target.value)} placeholder="订单上的学生G账号" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          共 <span className="font-semibold text-foreground">{rows.length}</span> 条结果
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-lg border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
          暂无符合条件的订单
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map(({ order, studentName }) => {
            const creator = userNameById(users, order.salesPersonId)
            const csName = order.csReviewerName?.trim() || userNameById(users, order.csReviewerId)
            const tutorName = userNameById(users, order.assignedTeacherId)

            return (
              <Card key={order.id} className="overflow-hidden border-border/80">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-lg font-semibold text-foreground">{studentName}</span>
                        <Badge variant="outline" className="h-5 px-1.5 text-[11px] font-normal">
                          {order.grade}
                        </Badge>
                        <Badge variant="outline" className="h-5 px-1.5 text-[11px] font-normal">
                          {order.subject}
                        </Badge>
                        <Badge variant={order.type === OrderType.TRIAL ? "secondary" : "default"}>
                          {order.type === OrderType.TRIAL ? "试课" : "正课"}
                        </Badge>
                        <Badge variant="outline" className="text-muted-foreground">
                          {ORDER_STATUS_MAP[order.status]}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-mono text-[11px]">{order.id}</span>
                        <span>{format(new Date(order.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}</span>
                        {order.studentAccount?.trim() ? (
                          <span className="font-mono text-[11px]">G {order.studentAccount}</span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/orders/${order.id}`}>查看订单详情</Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="rounded-lg border bg-muted/20 px-4 py-3">
                    <SalesOrderPipeline order={order} />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg border bg-background px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <IdCard className="h-3.5 w-3.5" aria-hidden />
                        订单要点
                      </div>
                      <Separator className="my-2" />
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">本次充值课时</span>
                          <span className="font-semibold text-foreground tabular-nums">
                            {resolveRechargeHours(order)}
                          </span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">代充鼎伴学费用</span>
                          <span className="font-semibold text-foreground">{needsDingbanxueLabel(order)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-background px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <UserRound className="h-3.5 w-3.5" aria-hidden />
                        角色与负责人
                      </div>
                      <Separator className="my-2" />
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">订单创建者</span>
                          <span className="font-semibold text-foreground">{creator}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">负责客服</span>
                          <span className="font-semibold text-foreground">{csName || "—"}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground">排课老师</span>
                          <span className="font-semibold text-foreground">{tutorName}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-lg border bg-background px-4 py-3">
                      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <BookOpen className="h-3.5 w-3.5" aria-hidden />
                        只读说明
                      </div>
                      <Separator className="my-2" />
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        本页面仅用于检索与核对订单基础信息、流程节点与负责人，不展示金额与支付明细。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

