"use client"

import * as React from "react"
import { format, startOfDay, endOfDay } from "date-fns"
import { zhCN } from "date-fns/locale"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
  Check,
  X,
  Eye,
  Loader2,
  CalendarIcon,
  Search,
  RefreshCw,
  Undo2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { mockStudents } from "@/lib/mock-data/students"
import { mockUsers } from "@/lib/mock-data/users"
import type { Order, RefundApplication, RefundOperationLog } from "@/types"
import { RefundApplicationStatus, OrderStatus } from "@/types"
import {
  getStoredOrders,
  saveStoredOrders,
  getStoredRefundApplications,
  saveRefundApplications,
  getStoredRefundOperationLogs,
  saveRefundOperationLogs,
  getStoredFinancialRecords,
  saveStoredFinancialRecords,
} from "@/lib/storage"
import {
  createRefundLog,
  getRefundableCeilingForApplication,
  NON_REFUNDABLE_PER_HOUR,
  getOrderTotalPaid,
  sumHistoricalRefundedAmount,
  sumPendingFrozenAmount,
} from "@/lib/refund-domain"

const ITEMS_PER_PAGE = 20

function getStudentName(studentId: string) {
  const student = mockStudents.find((s) => s.id === studentId)
  return student ? student.name : "未知学生"
}

/** 一审维度已产生结论或已流转（不含待一审队列） */
function isFirstStageProcessed(a: RefundApplication): boolean {
  return (
    a.status === RefundApplicationStatus.FIRST_REJECTED ||
    a.status === RefundApplicationStatus.PENDING_SECOND_REVIEW ||
    a.status === RefundApplicationStatus.REFUND_SUCCESS ||
    a.status === RefundApplicationStatus.REFUND_FAILED ||
    a.status === RefundApplicationStatus.WITHDRAWN
  )
}

/** 二审已操作过（通过 / 驳回均记 secondReviewedAt） */
function isSecondStageProcessed(a: RefundApplication): boolean {
  return a.secondReviewedAt != null
}

function sortLogsNewestFirst(logs: RefundOperationLog[]): RefundOperationLog[] {
  return [...logs].sort(
    (x, y) => new Date(y.createdAt).getTime() - new Date(x.createdAt).getTime()
  )
}

function firstProcessedStatusLabel(a: RefundApplication): string {
  switch (a.status) {
    case RefundApplicationStatus.FIRST_REJECTED:
      return "一审驳回"
    case RefundApplicationStatus.PENDING_SECOND_REVIEW:
      return "一审通过·待二审"
    case RefundApplicationStatus.REFUND_SUCCESS:
      return "一审已通过·退款完成"
    case RefundApplicationStatus.REFUND_FAILED:
      return "一审已通过·退款失败"
    case RefundApplicationStatus.WITHDRAWN:
      return "招生撤销"
    default:
      return a.status
  }
}

function secondProcessedStatusLabel(a: RefundApplication): string {
  if (a.status === RefundApplicationStatus.PENDING_FIRST_REVIEW && a.secondReviewedAt) {
    return "二审驳回·退回一审"
  }
  if (a.status === RefundApplicationStatus.REFUND_SUCCESS) return "二审通过·退款完成"
  if (a.status === RefundApplicationStatus.REFUND_FAILED) return "二审通过·退款失败"
  return "二审已处理"
}

export default function ManagerRefundPage() {
  const { user } = useAuth()
  const [orders, setOrders] = React.useState<Order[]>([])
  const [applications, setApplications] = React.useState<RefundApplication[]>([])
  const [logs, setLogs] = React.useState<RefundOperationLog[]>([])
  const [tab, setTab] = React.useState("first")
  const [firstView, setFirstView] = React.useState<"pending" | "processed">("pending")
  const [secondView, setSecondView] = React.useState<"pending" | "processed">("pending")

  const [currentPage, setCurrentPage] = React.useState(1)
  const [filters, setFilters] = React.useState({
    orderId: "",
    dateRange: { start: null as Date | null, end: null as Date | null },
  })

  const [viewApp, setViewApp] = React.useState<RefundApplication | null>(null)
  const [isViewOpen, setIsViewOpen] = React.useState(false)

  const [noteDraft, setNoteDraft] = React.useState("")
  const [rejectNote, setRejectNote] = React.useState("")
  const [finalAmountDraft, setFinalAmountDraft] = React.useState("")
  const [firstPassAmountDraft, setFirstPassAmountDraft] = React.useState("")
  const [finalHoursDraft, setFinalHoursDraft] = React.useState("")
  const [firstPassHoursDraft, setFirstPassHoursDraft] = React.useState("")
  const [actionApp, setActionApp] = React.useState<RefundApplication | null>(null)
  const [actionType, setActionType] = React.useState<
    "first_ok" | "first_reject" | "second_ok" | "second_reject" | "withdraw_first" | null
  >(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [logQueryId, setLogQueryId] = React.useState("")

  const reload = React.useCallback(() => {
    setOrders(getStoredOrders())
    setApplications(getStoredRefundApplications())
    setLogs(sortLogsNewestFirst(getStoredRefundOperationLogs()))
  }, [])

  React.useEffect(() => {
    reload()
  }, [reload])

  const firstQueue = React.useMemo(
    () => applications.filter((a) => a.status === RefundApplicationStatus.PENDING_FIRST_REVIEW),
    [applications]
  )

  const secondQueue = React.useMemo(
    () => applications.filter((a) => a.status === RefundApplicationStatus.PENDING_SECOND_REVIEW),
    [applications]
  )

  const firstProcessedQueue = React.useMemo(
    () => applications.filter((a) => isFirstStageProcessed(a)),
    [applications]
  )

  const secondProcessedQueue = React.useMemo(
    () => applications.filter((a) => isSecondStageProcessed(a)),
    [applications]
  )

  const activeList = React.useMemo(() => {
    const base =
      tab === "first"
        ? firstView === "pending"
          ? firstQueue
          : firstProcessedQueue
        : secondView === "pending"
          ? secondQueue
          : secondProcessedQueue
    return base.filter((a) => {
      if (filters.orderId && !a.orderId.toLowerCase().includes(filters.orderId.toLowerCase())) {
        return false
      }
      if (filters.dateRange.start && filters.dateRange.end) {
        const d = new Date(a.createdAt)
        if (d < filters.dateRange.start || d > filters.dateRange.end) return false
      }
      return true
    })
  }, [
    tab,
    firstView,
    secondView,
    filters.orderId,
    filters.dateRange.start,
    filters.dateRange.end,
    firstQueue,
    firstProcessedQueue,
    secondQueue,
    secondProcessedQueue,
  ])

  const paginated = React.useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return activeList.slice(start, start + ITEMS_PER_PAGE)
  }, [activeList, currentPage])
  const totalPages = Math.max(1, Math.ceil(activeList.length / ITEMS_PER_PAGE))

  const pushLogs = (entries: RefundOperationLog[]) => {
    const next = sortLogsNewestFirst([...entries, ...getStoredRefundOperationLogs()])
    saveRefundOperationLogs(next)
    setLogs(next)
  }

  const openAction = (
    app: RefundApplication,
    type: typeof actionType,
    presetNote = "",
    presetAmount = ""
  ) => {
    setActionApp(app)
    setActionType(type)
    setNoteDraft(presetNote)
    setRejectNote("")
    setFinalAmountDraft(presetAmount || String(app.requestedAmount))
    setFirstPassAmountDraft(String(app.requestedAmount))
    setFinalHoursDraft(String(app.requestedHours ?? ""))
    setFirstPassHoursDraft(String(app.requestedHours ?? ""))
  }

  const runSecondExecute = (
    app: RefundApplication,
    order: Order,
    amount: number
  ): { success: boolean } => {
    const fail = Math.random() < 0.08
    if (fail) {
      pushLogs([
        createRefundLog({
          refundApplicationId: app.id,
          orderId: order.id,
          actorRole: "SYSTEM",
          action: "退款执行失败",
          detail: `原路退回 ¥${amount} 失败，已通知一审/二审人员（原型模拟）`,
        }),
      ])
      toast.error("退款执行失败（模拟），已记录日志并通知审核人")
      return { success: false }
    }

    const sales = mockUsers.find((u) => u.id === order.salesPersonId)
    const fin = getStoredFinancialRecords()
    fin.unshift({
      id: `fin-rfd-${Date.now()}`,
      type: "REFUND",
      orderId: order.id,
      amount: -Math.abs(amount),
      salesPersonId: order.salesPersonId,
      salesPersonName: sales?.name,
      salesPersonPhone: sales?.phone,
      remarks: `退费二审通过，原路退回（申请单 ${app.id}）`,
      createdAt: new Date(),
    })
    saveStoredFinancialRecords(fin)

    pushLogs([
      createRefundLog({
        refundApplicationId: app.id,
        orderId: order.id,
        actorRole: "SYSTEM",
        action: "退款执行成功",
        detail: `原路退回 ¥${amount} 成功`,
      }),
    ])
    toast.success("退款已原路退回（模拟成功）")
    return { success: true }
  }

  const handleConfirmAction = async () => {
    if (!actionApp || !actionType || !user) return
    const order = orders.find((o) => o.id === actionApp.orderId)
    if (!order) {
      toast.error("订单不存在")
      return
    }

    setIsSubmitting(true)
    await new Promise((r) => setTimeout(r, 500))
    const now = new Date()
    const opName = user.name
    const opId = user.id
    const nextApps = [...applications]
    const nextOrders = [...orders]
    const appIdx = nextApps.findIndex((a) => a.id === actionApp.id)
    if (appIdx === -1) {
      setIsSubmitting(false)
      return
    }

    if (actionType === "first_ok") {
      const curBefore = nextApps[appIdx]
      const newAmt = Math.round(Number(firstPassAmountDraft) * 100) / 100
      if (!Number.isFinite(newAmt) || newAmt <= 0) {
        toast.error("请输入有效的退款金额")
        setIsSubmitting(false)
        return
      }
      const newHours =
        curBefore.refundKind === "REGULAR" || curBefore.refundKind === "RENEWAL"
          ? Math.floor(Number(firstPassHoursDraft))
          : undefined
      if (
        (curBefore.refundKind === "REGULAR" || curBefore.refundKind === "RENEWAL") &&
        (!Number.isFinite(newHours) || (newHours ?? 0) <= 0)
      ) {
        toast.error("请输入有效的退款课时")
        setIsSubmitting(false)
        return
      }
      if (newHours != null) {
        const ceil = getRefundableCeilingForApplication(
          order,
          curBefore.refundKind,
          nextApps.filter((a) => a.id !== curBefore.id)
        ).breakdown?.maxRefundableHours
        if (ceil != null && newHours > ceil) {
          toast.error(`退款课时不能超过最大可退 ${ceil} 课时`)
          setIsSubmitting(false)
          return
        }
      }
      const totalPaid = getOrderTotalPaid(order)
      const refundedDone = sumHistoricalRefundedAmount(
        order.id,
        nextApps.filter((a) => a.id !== curBefore.id)
      )
      const frozenPending = sumPendingFrozenAmount(
        order.id,
        nextApps.filter((a) => a.id !== curBefore.id)
      )
      if (newAmt > Math.max(0, totalPaid - refundedDone - frozenPending)) {
        toast.error(`退款金额累计不可超过用户该订单总支付金额 ¥${totalPaid.toLocaleString()}`)
        setIsSubmitting(false)
        return
      }
      const orig = curBefore.userOriginalRequestedAmount ?? curBefore.requestedAmount
      const prevAmt = curBefore.requestedAmount
      const detailParts = [
        `用户原始申请 ¥${orig.toLocaleString()}`,
        prevAmt !== newAmt
          ? `退款金额 ¥${prevAmt.toLocaleString()} → ¥${newAmt.toLocaleString()}`
          : `退款金额 ¥${newAmt.toLocaleString()}（相对申请单未调整）`,
      ]
      if (newHours != null) {
        const prevHours = curBefore.requestedHours ?? 0
        detailParts.push(
          prevHours !== newHours
            ? `退款课时 ${prevHours} → ${newHours}`
            : `退款课时 ${newHours}（相对申请单未调整）`
        )
      }
      if (noteDraft.trim()) detailParts.push(`批注：${noteDraft.trim()}`)
      nextApps[appIdx] = {
        ...nextApps[appIdx],
        requestedHours: newHours,
        requestedAmount: newAmt,
        userOriginalRequestedAmount: curBefore.userOriginalRequestedAmount ?? orig,
        status: RefundApplicationStatus.PENDING_SECOND_REVIEW,
        firstReviewNote: noteDraft.trim() || nextApps[appIdx].firstReviewNote,
        firstReviewerId: opId,
        firstReviewerName: opName,
        firstReviewedAt: now,
        updatedAt: now,
      }
      pushLogs([
        createRefundLog({
          refundApplicationId: actionApp.id,
          orderId: order.id,
          actorRole: "OPERATOR",
          actorUserId: opId,
          actorName: opName,
          action: "一审通过",
          detail: detailParts.join("；"),
        }),
      ])
      toast.success("已进入二审待审")
    } else if (actionType === "first_reject") {
      if (!rejectNote.trim()) {
        toast.error("请填写驳回说明")
        setIsSubmitting(false)
        return
      }
      nextApps[appIdx] = {
        ...nextApps[appIdx],
        status: RefundApplicationStatus.FIRST_REJECTED,
        firstReviewNote: noteDraft.trim() || undefined,
        firstRejectApplicantNote: rejectNote.trim(),
        firstReviewerId: opId,
        firstReviewerName: opName,
        firstReviewedAt: now,
        updatedAt: now,
      }
      const oi = nextOrders.findIndex((o) => o.id === order.id)
      if (oi !== -1) {
        nextOrders[oi] = {
          ...nextOrders[oi],
          refundFreezeActive: false,
          rejectReason: rejectNote.trim(),
          updatedAt: now,
        }
      }
      pushLogs([
        createRefundLog({
          refundApplicationId: actionApp.id,
          orderId: order.id,
          actorRole: "OPERATOR",
          actorUserId: opId,
          actorName: opName,
          action: "一审驳回",
          detail: rejectNote.trim(),
        }),
      ])
      toast.success("已驳回，课时已解冻")
    } else if (actionType === "withdraw_first") {
      const cur = nextApps[appIdx]
      if (cur.status !== RefundApplicationStatus.PENDING_SECOND_REVIEW) {
        toast.error("仅待二审的申请可撤回一审通过")
        setIsSubmitting(false)
        return
      }
      if (cur.secondReviewedAt) {
        toast.error("二审已处理，无法撤回一审通过")
        setIsSubmitting(false)
        return
      }
      if (cur.firstReviewerId !== user.id) {
        toast.error("仅原一审通过人可撤回")
        setIsSubmitting(false)
        return
      }
      nextApps[appIdx] = {
        ...nextApps[appIdx],
        status: RefundApplicationStatus.PENDING_FIRST_REVIEW,
        firstReviewNote: undefined,
        firstReviewerId: undefined,
        firstReviewerName: undefined,
        firstReviewedAt: undefined,
        secondReviewNote: undefined,
        secondReviewerId: undefined,
        secondReviewerName: undefined,
        secondReviewedAt: undefined,
        updatedAt: now,
      }
      pushLogs([
        createRefundLog({
          refundApplicationId: actionApp.id,
          orderId: order.id,
          actorRole: "OPERATOR",
          actorUserId: opId,
          actorName: opName,
          action: "一审撤回",
          detail: "二审处理前撤回一审通过，回到一审待审（课时仍冻结）",
        }),
      ])
      toast.success("已撤回到一审待审")
    } else if (actionType === "second_reject") {
      if (!rejectNote.trim()) {
        toast.error("请填写驳回说明")
        setIsSubmitting(false)
        return
      }
      nextApps[appIdx] = {
        ...nextApps[appIdx],
        status: RefundApplicationStatus.PENDING_FIRST_REVIEW,
        secondReviewNote: noteDraft.trim() || nextApps[appIdx].secondReviewNote,
        secondRejectApplicantNote: rejectNote.trim(),
        secondReviewerId: opId,
        secondReviewerName: opName,
        secondReviewedAt: now,
        updatedAt: now,
      }
      const oi = nextOrders.findIndex((o) => o.id === order.id)
      if (oi !== -1) {
        nextOrders[oi] = {
          ...nextOrders[oi],
          refundFreezeActive: false,
          updatedAt: now,
        }
      }
      pushLogs([
        createRefundLog({
          refundApplicationId: actionApp.id,
          orderId: order.id,
          actorRole: "OPERATOR",
          actorUserId: opId,
          actorName: opName,
          action: "二审驳回",
          detail: `${rejectNote.trim()}；退回一审待审，课时已解冻`,
        }),
      ])
      toast.success("二审已驳回，已退回一审待审并解冻课时")
    } else if (actionType === "second_ok") {
      const curBefore = nextApps[appIdx]
      const amt = Math.round(Number(finalAmountDraft) * 100) / 100
      if (!Number.isFinite(amt) || amt <= 0) {
        toast.error("请输入有效的退款金额")
        setIsSubmitting(false)
        return
      }
      const finalHours =
        curBefore.refundKind === "REGULAR" || curBefore.refundKind === "RENEWAL"
          ? Math.floor(Number(finalHoursDraft))
          : undefined
      if (
        (curBefore.refundKind === "REGULAR" || curBefore.refundKind === "RENEWAL") &&
        (!Number.isFinite(finalHours) || (finalHours ?? 0) <= 0)
      ) {
        toast.error("请输入有效的退款课时")
        setIsSubmitting(false)
        return
      }
      if (finalHours != null) {
        const ceil = getRefundableCeilingForApplication(
          order,
          curBefore.refundKind,
          nextApps.filter((a) => a.id !== curBefore.id)
        ).breakdown?.maxRefundableHours
        if (ceil != null && finalHours > ceil) {
          toast.error(`退款课时不能超过最大可退 ${ceil} 课时`)
          setIsSubmitting(false)
          return
        }
      }
      const totalPaid = getOrderTotalPaid(order)
      const refundedDone = sumHistoricalRefundedAmount(
        order.id,
        nextApps.filter((a) => a.id !== curBefore.id)
      )
      const frozenPending = sumPendingFrozenAmount(
        order.id,
        nextApps.filter((a) => a.id !== curBefore.id)
      )
      if (amt > Math.max(0, totalPaid - refundedDone - frozenPending)) {
        toast.error(`退款金额累计不可超过用户该订单总支付金额 ¥${totalPaid.toLocaleString()}`)
        setIsSubmitting(false)
        return
      }
      const orig = curBefore.userOriginalRequestedAmount ?? curBefore.requestedAmount
      const prevAmt = curBefore.requestedAmount
      const exec = runSecondExecute(nextApps[appIdx], order, amt)
      const detailParts = [
        `用户原始申请 ¥${orig.toLocaleString()}`,
        prevAmt !== amt
          ? `二审确认退款金额 ¥${prevAmt.toLocaleString()} → ¥${amt.toLocaleString()}`
          : `二审确认退款金额 ¥${amt.toLocaleString()}（相对申请单未调整）`,
      ]
      if (finalHours != null) {
        const prevHours = curBefore.requestedHours ?? 0
        detailParts.push(
          prevHours !== finalHours
            ? `二审确认退款课时 ${prevHours} → ${finalHours}`
            : `二审确认退款课时 ${finalHours}（相对申请单未调整）`
        )
      }
      if (noteDraft.trim()) detailParts.push(`批注：${noteDraft.trim()}`)
      detailParts.push(
        exec.success ? `已触发原路退回 ¥${amt.toLocaleString()}` : "退款执行失败（模拟）"
      )
      nextApps[appIdx] = {
        ...nextApps[appIdx],
        requestedHours: finalHours,
        requestedAmount: amt,
        finalRefundHours: finalHours,
        userOriginalRequestedAmount: curBefore.userOriginalRequestedAmount ?? orig,
        secondReviewNote: noteDraft.trim() || nextApps[appIdx].secondReviewNote,
        secondReviewerId: opId,
        secondReviewerName: opName,
        secondReviewedAt: now,
        finalRefundAmount: amt,
        updatedAt: now,
        executionStatus: exec.success ? "SUCCESS" : "FAILED",
        status: exec.success
          ? RefundApplicationStatus.REFUND_SUCCESS
          : RefundApplicationStatus.REFUND_FAILED,
      }
      const oi = nextOrders.findIndex((o) => o.id === order.id)
      if (oi !== -1 && exec.success) {
        const o = nextOrders[oi]
        const refundHours = Math.max(
          0,
          Math.min(o.remainingHours, finalHours ?? o.remainingHours)
        )
        const nextRemaining = Math.max(0, o.remainingHours - refundHours)
        const tx = [
          ...(o.transactions ?? []),
          {
            id: `tx-rfd-${Date.now()}`,
            type: "REFUND" as const,
            amount: -Math.abs(amt),
            hours: refundHours,
            createdAt: now,
          },
        ]
        if (nextApps[appIdx].refundKind === "RED_PACKET") {
          nextOrders[oi] = {
            ...o,
            refundFreezeActive: false,
            transactions: tx,
            updatedAt: now,
          }
        } else {
          nextOrders[oi] = {
            ...o,
            status: nextRemaining === 0 ? OrderStatus.REFUNDED : o.status,
            remainingHours: nextRemaining,
            refundFreezeActive: false,
            transactions: tx,
            updatedAt: now,
          }
        }
      }
      if (oi !== -1 && !exec.success) {
        nextOrders[oi] = {
          ...nextOrders[oi],
          refundFreezeActive: false,
          updatedAt: now,
        }
      }
      pushLogs([
        createRefundLog({
          refundApplicationId: actionApp.id,
          orderId: order.id,
          actorRole: "OPERATOR",
          actorUserId: opId,
          actorName: opName,
          action: "二审通过",
          detail: detailParts.join("；"),
        }),
      ])
    }

    saveRefundApplications(nextApps)
    saveStoredOrders(nextOrders)
    setApplications(nextApps)
    setOrders(nextOrders)
    setIsSubmitting(false)
    setActionType(null)
    setActionApp(null)
    reload()
  }

  const filteredLogs = React.useMemo(() => {
    const q = logQueryId.trim().toLowerCase()
    const matched = q
      ? logs.filter(
          (l) =>
            l.refundApplicationId.toLowerCase().includes(q) ||
            l.orderId.toLowerCase().includes(q)
        )
      : logs
    return sortLogsNewestFirst(matched).slice(0, 500)
  }, [logs, logQueryId])

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">退费审核</h2>
          <p className="text-muted-foreground">
            一审、二审均支持待处理与已处理查询；一审通过人可在「一审 · 已处理」中对仍待二审的申请撤回通过（未被二审处理前）；二审仅支持通过或驳回。操作日志最新在前。
          </p>
        </div>
        <Button variant="outline" onClick={reload}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => {
          setTab(v)
          setCurrentPage(1)
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="first">
            一审
            {firstQueue.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {firstQueue.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="second">
            二审
            {secondQueue.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                {secondQueue.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="logs">操作日志</TabsTrigger>
        </TabsList>

        <TabsContent value="first" className="space-y-4 mt-4">
          <FilterCard filters={filters} setFilters={setFilters} setCurrentPage={setCurrentPage} />
          <Tabs
            value={firstView}
            onValueChange={(v) => {
              setFirstView(v as "pending" | "processed")
              setCurrentPage(1)
            }}
          >
            <TabsList className="w-full max-w-sm">
              <TabsTrigger value="pending">
                待处理
                <Badge variant="outline" className="ml-2 h-5 px-1.5 font-normal">
                  {firstQueue.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="processed">
                已处理
                <Badge variant="outline" className="ml-2 h-5 px-1.5 font-normal">
                  {firstProcessedQueue.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="space-y-4 mt-4">
              <QueueTable
                title="一审待处理"
                apps={paginated}
                orders={orders}
                mode="first"
                onView={(a) => {
                  setViewApp(a)
                  setIsViewOpen(true)
                }}
                onFirstPass={(a) => openAction(a, "first_ok", a.firstReviewNote ?? "")}
                onFirstReject={(a) => openAction(a, "first_reject")}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
            <TabsContent value="processed" className="mt-4">
              <ProcessedRefundTable
                title="一审已处理记录"
                apps={paginated}
                orders={orders}
                stage="first"
                currentUserId={user?.id}
                onWithdrawFirst={(a) => openAction(a, "withdraw_first")}
                isSubmitting={isSubmitting}
                onView={(a) => {
                  setViewApp(a)
                  setIsViewOpen(true)
                }}
              />
            </TabsContent>
          </Tabs>
          <Pager
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            total={activeList.length}
          />
        </TabsContent>

        <TabsContent value="second" className="space-y-4 mt-4">
          <FilterCard filters={filters} setFilters={setFilters} setCurrentPage={setCurrentPage} />
          <Tabs
            value={secondView}
            onValueChange={(v) => {
              setSecondView(v as "pending" | "processed")
              setCurrentPage(1)
            }}
          >
            <TabsList className="w-full max-w-sm">
              <TabsTrigger value="pending">
                待处理
                <Badge variant="outline" className="ml-2 h-5 px-1.5 font-normal">
                  {secondQueue.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="processed">
                已处理
                <Badge variant="outline" className="ml-2 h-5 px-1.5 font-normal">
                  {secondProcessedQueue.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              <QueueTable
                title="二审待处理"
                apps={paginated}
                orders={orders}
                mode="second"
                onView={(a) => {
                  setViewApp(a)
                  setIsViewOpen(true)
                }}
                onSecondPass={(a) =>
                  openAction(a, "second_ok", a.secondReviewNote ?? "", String(a.requestedAmount))
                }
                onSecondReject={(a) => openAction(a, "second_reject")}
                isSubmitting={isSubmitting}
              />
            </TabsContent>
            <TabsContent value="processed" className="mt-4">
              <ProcessedRefundTable
                title="二审已处理记录"
                apps={paginated}
                orders={orders}
                stage="second"
                onView={(a) => {
                  setViewApp(a)
                  setIsViewOpen(true)
                }}
              />
            </TabsContent>
          </Tabs>
          <Pager
            currentPage={currentPage}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            total={activeList.length}
          />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>操作日志</CardTitle>
              <CardDescription>
                最新记录在最上方。支持按退费申请单号或订单号筛选。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 max-w-md">
                <Input
                  placeholder="退费单号 / 订单号"
                  value={logQueryId}
                  onChange={(e) => setLogQueryId(e.target.value)}
                />
              </div>
              <div className="border rounded-md max-h-[480px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>时间</TableHead>
                      <TableHead>操作</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>退费单</TableHead>
                      <TableHead>订单</TableHead>
                      <TableHead>说明</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          暂无日志
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="whitespace-nowrap text-xs">
                            {format(new Date(l.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                          </TableCell>
                          <TableCell className="text-sm">{l.action}</TableCell>
                          <TableCell className="text-xs">{l.actorRole}</TableCell>
                          <TableCell className="font-mono text-xs">{l.refundApplicationId}</TableCell>
                          <TableCell className="font-mono text-xs">{l.orderId}</TableCell>
                          <TableCell className="text-xs max-w-[240px] truncate" title={l.detail}>
                            {l.detail || "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DetailDialog
        open={isViewOpen}
        onOpenChange={setIsViewOpen}
        app={viewApp}
        order={viewApp ? orders.find((o) => o.id === viewApp.orderId) : undefined}
      />

      <ActionDialog
        open={actionType !== null}
        onOpenChange={(o) => {
          if (!o) {
            setActionType(null)
            setActionApp(null)
          }
        }}
        actionType={actionType}
        actionApp={actionApp}
        refundCeilingMax={
          actionApp && orders.find((x) => x.id === actionApp.orderId)
            ? getRefundableCeilingForApplication(
                orders.find((x) => x.id === actionApp.orderId)!,
                actionApp.refundKind,
                applications.filter((a) => a.id !== actionApp.id)
              ).max
            : 0
        }
        refundCeilingHours={
          actionApp && orders.find((x) => x.id === actionApp.orderId)
            ? (getRefundableCeilingForApplication(
                orders.find((x) => x.id === actionApp.orderId)!,
                actionApp.refundKind,
                applications.filter((a) => a.id !== actionApp.id)
              ).breakdown?.maxRefundableHours ?? 0)
            : 0
        }
        noteDraft={noteDraft}
        setNoteDraft={setNoteDraft}
        rejectNote={rejectNote}
        setRejectNote={setRejectNote}
        firstPassHoursDraft={firstPassHoursDraft}
        setFirstPassHoursDraft={setFirstPassHoursDraft}
        firstPassAmountDraft={firstPassAmountDraft}
        setFirstPassAmountDraft={setFirstPassAmountDraft}
        finalHoursDraft={finalHoursDraft}
        setFinalHoursDraft={setFinalHoursDraft}
        finalAmountDraft={finalAmountDraft}
        setFinalAmountDraft={setFinalAmountDraft}
        onConfirm={handleConfirmAction}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}

function FilterCard(props: {
  filters: { orderId: string; dateRange: { start: Date | null; end: Date | null } }
  setFilters: React.Dispatch<React.SetStateAction<typeof props.filters>>
  setCurrentPage: (n: number) => void
}) {
  const { filters, setFilters, setCurrentPage } = props
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">筛选条件</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">订单号</label>
            <Input
              placeholder="输入订单号"
              value={filters.orderId}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, orderId: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">申请开始日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.start && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.start
                    ? format(filters.dateRange.start, "yyyy-MM-dd", { locale: zhCN })
                    : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.start || undefined}
                  onSelect={(date) => {
                    if (date) {
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: startOfDay(date) },
                      }))
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">申请结束日期</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filters.dateRange.end && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange.end
                    ? format(filters.dateRange.end, "yyyy-MM-dd", { locale: zhCN })
                    : "选择日期"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={filters.dateRange.end || undefined}
                  onSelect={(date) => {
                    if (date) {
                      setFilters((prev) => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: endOfDay(date) },
                      }))
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            onClick={() => {
              setCurrentPage(1)
              toast.success("已应用筛选")
            }}
          >
            <Search className="mr-2 h-4 w-4" />
            查询
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setFilters({ orderId: "", dateRange: { start: null, end: null } })
              setCurrentPage(1)
            }}
          >
            重置
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProcessedRefundTable(props: {
  title: string
  apps: RefundApplication[]
  orders: Order[]
  stage: "first" | "second"
  currentUserId?: string
  onWithdrawFirst?: (a: RefundApplication) => void
  isSubmitting?: boolean
  onView: (a: RefundApplication) => void
}) {
  const {
    title,
    apps,
    orders,
    stage,
    onView,
    currentUserId,
    onWithdrawFirst,
    isSubmitting = false,
  } = props

  const keyTime = (a: RefundApplication) => {
    const t = a.secondReviewedAt || a.firstReviewedAt || a.updatedAt
    return format(new Date(t), "yyyy-MM-dd HH:mm", { locale: zhCN })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          共 {apps.length} 条（本页）
          {stage === "first"
            ? "；待二审且未被二审处理时，原一审通过人可在此撤回通过"
            : "，只读查询"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>退费申请单</TableHead>
              <TableHead>订单号</TableHead>
              <TableHead>学员</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>申请金额</TableHead>
              <TableHead>处理结果</TableHead>
              <TableHead>关键时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  暂无记录
                </TableCell>
              </TableRow>
            ) : (
              apps.map((a) => {
                const order = orders.find((o) => o.id === a.orderId)
                const label =
                  stage === "first" ? firstProcessedStatusLabel(a) : secondProcessedStatusLabel(a)
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell className="font-mono text-xs">{a.orderId}</TableCell>
                    <TableCell>
                      {order ? getStudentName(order.studentId) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{a.refundKind}</TableCell>
                    <TableCell>¥{a.requestedAmount.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">{label}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">{keyTime(a)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onView(a)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {stage === "first" &&
                          onWithdrawFirst &&
                          currentUserId &&
                          a.status === RefundApplicationStatus.PENDING_SECOND_REVIEW &&
                          !a.secondReviewedAt &&
                          a.firstReviewerId === currentUserId && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onWithdrawFirst(a)}
                              disabled={isSubmitting}
                            >
                              <Undo2 className="h-4 w-4 mr-1" />
                              撤回一审通过
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function QueueTable(props: {
  title: string
  apps: RefundApplication[]
  orders: Order[]
  mode: "first" | "second"
  onView: (a: RefundApplication) => void
  onFirstPass?: (a: RefundApplication) => void
  onFirstReject?: (a: RefundApplication) => void
  onSecondPass?: (a: RefundApplication) => void
  onSecondReject?: (a: RefundApplication) => void
  isSubmitting: boolean
}) {
  const {
    title,
    apps,
    orders,
    mode,
    onView,
    onFirstPass,
    onFirstReject,
    onSecondPass,
    onSecondReject,
    isSubmitting,
  } = props

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>共 {apps.length} 条（本页）</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>退费申请单</TableHead>
              <TableHead>订单号</TableHead>
              <TableHead>学员</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>申请金额</TableHead>
              <TableHead>申请时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {apps.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              apps.map((a) => {
                const order = orders.find((o) => o.id === a.orderId)
                return (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.id}</TableCell>
                    <TableCell className="font-mono text-xs">{a.orderId}</TableCell>
                    <TableCell>
                      {order ? getStudentName(order.studentId) : "—"}
                    </TableCell>
                    <TableCell className="text-xs">{a.refundKind}</TableCell>
                    <TableCell>¥{a.requestedAmount.toLocaleString()}</TableCell>
                    <TableCell className="whitespace-nowrap text-xs">
                      {format(new Date(a.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end flex-wrap gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onView(a)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {mode === "first" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => onFirstPass?.(a)}
                              disabled={isSubmitting}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              通过
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onFirstReject?.(a)}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4 mr-1" />
                              驳回
                            </Button>
                          </>
                        )}
                        {mode === "second" && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => onSecondPass?.(a)}
                              disabled={isSubmitting}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              通过
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => onSecondReject?.(a)}
                              disabled={isSubmitting}
                            >
                              <X className="h-4 w-4 mr-1" />
                              驳回
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function Pager(props: {
  currentPage: number
  totalPages: number
  setCurrentPage: (n: number) => void
  total: number
}) {
  const { currentPage, totalPages, setCurrentPage, total } = props
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <span>
        共 {total} 条，第 {currentPage} / {totalPages} 页
      </span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          上一页
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          下一页
        </Button>
      </div>
    </div>
  )
}

function DetailDialog(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  app: RefundApplication | null
  order?: Order
}) {
  const { open, onOpenChange, app, order } = props
  if (!app) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>退费申请详情</DialogTitle>
          <DialogDescription>
            退费单 {app.id} · 订单 {app.orderId}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-muted-foreground">申请人</span>
              <div className="font-medium">{app.applicantName || app.applicantUserId}</div>
            </div>
            <div>
              <span className="text-muted-foreground">退费类型</span>
              <div className="font-medium">{app.refundKind}</div>
            </div>
            <div>
              <span className="text-muted-foreground">当前申请金额</span>
              <div className="font-medium text-primary">¥{app.requestedAmount.toLocaleString()}</div>
            </div>
            {app.requestedHours != null && (
              <div>
                <span className="text-muted-foreground">当前申请课时</span>
                <div className="font-medium text-primary">{app.requestedHours} 课时</div>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">用户原始申请</span>
              <div className="font-medium">
                ¥{(app.userOriginalRequestedAmount ?? app.requestedAmount).toLocaleString()}
              </div>
            </div>
            {app.userOriginalRequestedHours != null && (
              <div>
                <span className="text-muted-foreground">用户原始申请课时</span>
                <div className="font-medium">{app.userOriginalRequestedHours} 课时</div>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">提交时上限</span>
              <div className="font-medium">¥{app.computedMaxAtApply.toLocaleString()}</div>
            </div>
          </div>
          {app.reason && (
            <div>
              <span className="text-muted-foreground">申请说明</span>
              <div className="mt-1 rounded border bg-muted/30 p-2">{app.reason}</div>
            </div>
          )}
          {app.breakdown && (
            <div className="rounded-md border p-3 space-y-1 text-xs">
              <div className="font-medium text-foreground mb-2">课时与费用明细</div>
              <div className="grid grid-cols-2 gap-1">
                <span className="text-muted-foreground">总课时</span>
                <span>{app.breakdown.totalHours}</span>
                <span className="text-muted-foreground">已上课时</span>
                <span>{app.breakdown.consumedHours}</span>
                <span className="text-muted-foreground">剩余课时</span>
                <span>{app.breakdown.remainingHours}</span>
                <span className="text-muted-foreground">缴纳总费用</span>
                <span>¥{app.breakdown.totalFee.toLocaleString()}</span>
                <span className="text-muted-foreground">正课实缴</span>
                <span>
                  ¥{(app.breakdown.regularPaidAmount ?? app.breakdown.totalFee).toLocaleString()}
                </span>
                <span className="text-muted-foreground">转正红包</span>
                <span>¥{(app.breakdown.redPacketAmount ?? 0).toLocaleString()}</span>
                <span className="text-muted-foreground">不可退费（×{NON_REFUNDABLE_PER_HOUR}）</span>
                <span>¥{app.breakdown.nonRefundableAmount.toLocaleString()}</span>
                <span className="text-muted-foreground">已消耗课时费用</span>
                <span>¥{app.breakdown.consumedLessonFee.toLocaleString()}</span>
                <span className="text-muted-foreground">剩余最大可退</span>
                <span className="font-semibold">¥{app.breakdown.maxRefundable.toLocaleString()}</span>
              </div>
            </div>
          )}
          {order && (
            <div className="text-xs text-muted-foreground">
              当前订单状态：{order.status}；课时冻结：{order.refundFreezeActive ? "是" : "否"}
            </div>
          )}
          {(app.firstReviewNote || app.secondReviewNote) && (
            <div className="space-y-2 text-xs">
              {app.firstReviewNote && (
                <div>
                  <span className="text-muted-foreground">一审批注</span>
                  <div className="mt-0.5 border rounded p-2">{app.firstReviewNote}</div>
                </div>
              )}
              {app.secondReviewNote && (
                <div>
                  <span className="text-muted-foreground">二审批注</span>
                  <div className="mt-0.5 border rounded p-2">{app.secondReviewNote}</div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ActionDialog(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  actionType: string | null
  actionApp: RefundApplication | null
  refundCeilingMax: number
  refundCeilingHours: number
  noteDraft: string
  setNoteDraft: (s: string) => void
  rejectNote: string
  setRejectNote: (s: string) => void
  firstPassHoursDraft: string
  setFirstPassHoursDraft: (s: string) => void
  firstPassAmountDraft: string
  setFirstPassAmountDraft: (s: string) => void
  finalHoursDraft: string
  setFinalHoursDraft: (s: string) => void
  finalAmountDraft: string
  setFinalAmountDraft: (s: string) => void
  onConfirm: () => void
  isSubmitting: boolean
}) {
  const {
    open,
    onOpenChange,
    actionType,
    actionApp,
    refundCeilingMax,
    refundCeilingHours,
    noteDraft,
    setNoteDraft,
    rejectNote,
    setRejectNote,
    firstPassHoursDraft,
    setFirstPassHoursDraft,
    firstPassAmountDraft,
    setFirstPassAmountDraft,
    finalHoursDraft,
    setFinalHoursDraft,
    finalAmountDraft,
    setFinalAmountDraft,
    onConfirm,
    isSubmitting,
  } = props

  if (!actionType || !actionApp) return null

  const title =
    actionType === "first_ok"
      ? "一审通过"
      : actionType === "first_reject"
        ? "一审驳回"
        : actionType === "second_ok"
          ? "二审通过并执行退款"
          : actionType === "second_reject"
            ? "二审驳回"
            : "一审撤回"

  const isHourEditable = actionApp.refundKind === "REGULAR" || actionApp.refundKind === "RENEWAL"
  const suggestedUnitPrice =
    isHourEditable && refundCeilingHours > 0 ? refundCeilingMax / refundCeilingHours : 0

  React.useEffect(() => {
    if (!isHourEditable || actionType !== "first_ok" || !suggestedUnitPrice) return
    const h = Math.floor(Number(firstPassHoursDraft))
    if (!Number.isFinite(h) || h <= 0) return
    const safeH = Math.min(h, Math.max(0, refundCeilingHours))
    const nextAmt = Math.round(safeH * suggestedUnitPrice * 100) / 100
    setFirstPassAmountDraft(String(nextAmt))
  }, [
    isHourEditable,
    actionType,
    firstPassHoursDraft,
    refundCeilingHours,
    suggestedUnitPrice,
    setFirstPassAmountDraft,
  ])

  React.useEffect(() => {
    if (!isHourEditable || actionType !== "second_ok" || !suggestedUnitPrice) return
    const h = Math.floor(Number(finalHoursDraft))
    if (!Number.isFinite(h) || h <= 0) return
    const safeH = Math.min(h, Math.max(0, refundCeilingHours))
    const nextAmt = Math.round(safeH * suggestedUnitPrice * 100) / 100
    setFinalAmountDraft(String(nextAmt))
  }, [
    isHourEditable,
    actionType,
    finalHoursDraft,
    refundCeilingHours,
    suggestedUnitPrice,
    setFinalAmountDraft,
  ])

  const roughUnit = isHourEditable && refundCeilingMax > 0
    ? refundCeilingMax / Math.max(1, actionApp.requestedHours ?? 1)
    : 0
  const amountWarning =
    actionType === "second_ok" && isHourEditable && roughUnit > 0
      ? (() => {
          const a = Number(finalAmountDraft)
          if (!Number.isFinite(a) || a <= 0) return ""
          const h = a / roughUnit
          const nearest = Math.round(h)
          const reversible = Math.abs(h - nearest) <= 0.2
          if (!reversible) return "当前金额无法反推出整数课时，将按输入金额继续处理。"
          if (nearest > Math.max(0, actionApp.requestedHours ?? nearest)) {
            return "按当前金额反推的课时超过申请单原课时，建议复核。"
          }
          return ""
        })()
      : ""
  const realtimeHint =
    actionType === "first_ok"
      ? "修改课时会自动重算建议退款金额，请优先按课时复核；如手动改金额将保留你的输入。"
      : actionType === "second_ok"
        ? "修改课时会自动重算建议退款金额，请优先按课时复核；如手动改金额将保留你的输入。"
        : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>退费单 {actionApp.id}</DialogDescription>
        </DialogHeader>
        {realtimeHint && (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {realtimeHint}
          </div>
        )}
        <div className="grid gap-4 py-2">
          {actionType === "first_ok" && (
            <div className="grid gap-2">
              {isHourEditable && (
                <>
                  <Label>一审确认退款课时（课时）</Label>
                  <Input
                    type="number"
                    min={1}
                    max={refundCeilingHours > 0 ? refundCeilingHours : undefined}
                    value={firstPassHoursDraft}
                    onChange={(e) => setFirstPassHoursDraft(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    最大可退课时 {refundCeilingHours} 课时
                  </p>
                </>
              )}
              <Label>一审确认退款金额（元）</Label>
              <Input
                type="number"
                min={1}
                value={firstPassAmountDraft}
                onChange={(e) => setFirstPassAmountDraft(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                当前最大可退 ¥{refundCeilingMax.toLocaleString()}；用户原始申请 ¥
                {(actionApp.userOriginalRequestedAmount ?? actionApp.requestedAmount).toLocaleString()}
              </p>
            </div>
          )}
          {(actionType === "first_ok" ||
            actionType === "second_ok" ||
            actionType === "second_reject" ||
            actionType === "withdraw_first") && (
            <div className="grid gap-2">
              <Label>批注（可修改）</Label>
              <Textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="填写审核批注，将保留在申请单上"
              />
            </div>
          )}
          {actionType === "second_ok" && (
            <div className="grid gap-2">
              {isHourEditable && (
                <>
                  <Label>二审确认退款课时（课时）</Label>
                  <Input
                    type="number"
                    min={1}
                    max={refundCeilingHours > 0 ? refundCeilingHours : undefined}
                    value={finalHoursDraft}
                    onChange={(e) => setFinalHoursDraft(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    最大可退课时 {refundCeilingHours} 课时
                  </p>
                </>
              )}
              <Label>二审确认退款金额（元）</Label>
              <Input
                type="number"
                min={1}
                value={finalAmountDraft}
                onChange={(e) => setFinalAmountDraft(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                不超过 ¥{refundCeilingMax.toLocaleString()}；用户原始申请 ¥
                {(actionApp.userOriginalRequestedAmount ?? actionApp.requestedAmount).toLocaleString()}
              </p>
              {amountWarning && <p className="text-xs text-amber-600">{amountWarning}</p>}
            </div>
          )}
          {(actionType === "first_reject" || actionType === "second_reject") && (
            <div className="grid gap-2">
              <Label>向招生老师展示的驳回说明</Label>
              <Textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="请填写驳回原因"
              />
            </div>
          )}
          {actionType === "withdraw_first" && (
            <p className="text-sm text-muted-foreground">
              确认撤回到一审待审？二审尚未处理时，一审可撤回通过结果。课时仍保持冻结直至一审再次处理。
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
