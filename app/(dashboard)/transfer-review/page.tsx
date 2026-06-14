"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Loader2,
  CheckCircle2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCcwDot,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import {
  Order,
  OrderStatus,
  OrderType,
  CourseTransfer,
  TransferType,
  TransferStatus,
  Transaction,
  TransferOperationLog,
} from "@/types"
import {
  getStoredOrders,
  saveStoredOrders,
  getStoredCourseTransfers,
  saveStoredCourseTransfers,
  getStoredTransferOperationLogs,
  saveStoredTransferOperationLogs,
} from "@/lib/storage"
import { createTransferLog, DINGBANXUE_PER_HOUR } from "@/lib/course-transfer"

const PAGE_SIZE = 10

type ActionType = "first_ok" | "first_reject" | "second_ok" | "second_reject"

const STATUS_LABEL: Record<string, string> = {
  PENDING_FIRST_REVIEW: "待一审",
  PENDING_SECOND_REVIEW: "待二审",
  FIRST_REJECTED: "一审驳回",
  SECOND_REJECTED: "二审驳回",
  APPROVED: "已通过",
  CANCELLED: "已取消",
}

const STATUS_COLOR: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  PENDING_FIRST_REVIEW: "secondary",
  PENDING_SECOND_REVIEW: "default",
  FIRST_REJECTED: "destructive",
  SECOND_REJECTED: "destructive",
  APPROVED: "default",
  CANCELLED: "destructive",
}

function isFirstStageProcessed(t: CourseTransfer): boolean {
  return [
    TransferStatus.PENDING_SECOND_REVIEW,
    TransferStatus.FIRST_REJECTED,
    TransferStatus.SECOND_REJECTED,
    TransferStatus.APPROVED,
    TransferStatus.CANCELLED,
  ].includes(t.status)
}

function isSecondStageProcessed(t: CourseTransfer): boolean {
  return t.secondReviewedAt != null || t.status === TransferStatus.APPROVED
}

function paginate(list: CourseTransfer[], page: number) {
  const start = (page - 1) * PAGE_SIZE
  return { items: list.slice(start, start + PAGE_SIZE), total: list.length, pages: Math.max(1, Math.ceil(list.length / PAGE_SIZE)) }
}

function TransferTable({
  list,
  page,
  setPage,
  showActions,
  onViewDetail,
  onAction,
}: {
  list: CourseTransfer[]
  page: number
  setPage: (p: number) => void
  showActions: "first" | "second"
  onViewDetail: (t: CourseTransfer) => void
  onAction: (t: CourseTransfer, type: ActionType) => void
}) {
  const { items, total, pages } = paginate(list, page)
  if (items.length === 0) return <div className="text-center py-8 text-muted-foreground">暂无记录</div>
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>申请时间</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>源订单</TableHead>
            <TableHead>目标</TableHead>
            <TableHead>转移课时</TableHead>
            <TableHead>获得课时</TableHead>
            <TableHead>差额</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(t => (
            <TableRow key={t.id}>
              <TableCell className="whitespace-nowrap text-sm">{new Date(t.createdAt).toLocaleDateString("zh-CN")}</TableCell>
              <TableCell><Badge variant="outline">{t.type === TransferType.GRADE_UPGRADE ? "年级升级" : "跨学员"}</Badge></TableCell>
              <TableCell className="text-sm">
                <div>{t.sourceStudentName}</div>
                <div className="text-muted-foreground text-xs">{t.sourceSubject}·{t.sourceGrade}</div>
              </TableCell>
              <TableCell className="text-sm">
                <div>{t.targetStudentName}</div>
                <div className="text-muted-foreground text-xs">{t.targetSubject}·{t.targetGrade}</div>
              </TableCell>
              <TableCell className="text-sm">{t.sourceTransferredHours}</TableCell>
              <TableCell className="text-sm">{t.targetReceivedHours}</TableCell>
              <TableCell className="text-sm">
                {t.priceDifference > 0 ? <span className="text-orange-600">+{t.priceDifference}</span> :
                 t.priceDifference < 0 ? <span className="text-green-600">{t.priceDifference}</span> : "0"}
              </TableCell>
              <TableCell><Badge variant={STATUS_COLOR[t.status] ?? "outline"}>{STATUS_LABEL[t.status] ?? t.status}</Badge></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => onViewDetail(t)}>详情</Button>
                  {showActions === "first" && t.status === TransferStatus.PENDING_FIRST_REVIEW && (
                    <>
                      <Button size="sm" variant="default" onClick={() => onAction(t, "first_ok")}>通过</Button>
                      <Button size="sm" variant="destructive" onClick={() => onAction(t, "first_reject")}>驳回</Button>
                    </>
                  )}
                  {showActions === "second" && t.status === TransferStatus.PENDING_SECOND_REVIEW && (
                    <>
                      <Button size="sm" variant="default" onClick={() => onAction(t, "second_ok")}>通过</Button>
                      <Button size="sm" variant="destructive" onClick={() => onAction(t, "second_reject")}>驳回</Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-muted-foreground">第 {page}/{pages} 页（共 {total} 条）</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button size="sm" variant="outline" disabled={page >= pages} onClick={() => setPage(page + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </>
  )
}

export default function TransferReviewPage() {
  const { user } = useAuth()

  const [transfers, setTransfers] = React.useState<CourseTransfer[]>([])
  const [orders, setOrders] = React.useState<Order[]>([])
  const [logs, setLogs] = React.useState<TransferOperationLog[]>([])

  const [tab, setTab] = React.useState("first")
  const [firstSub, setFirstSub] = React.useState("pending")
  const [secondSub, setSecondSub] = React.useState("pending")

  const [searchId, setSearchId] = React.useState("")
  const [firstPage, setFirstPage] = React.useState(1)
  const [secondPage, setSecondPage] = React.useState(1)
  const [logPage, setLogPage] = React.useState(1)
  const [logSearch, setLogSearch] = React.useState("")

  const [detailTransfer, setDetailTransfer] = React.useState<CourseTransfer | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const [actionTransfer, setActionTransfer] = React.useState<CourseTransfer | null>(null)
  const [actionType, setActionType] = React.useState<ActionType | null>(null)
  const [noteDraft, setNoteDraft] = React.useState("")
  const [rejectNote, setRejectNote] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)

  const reload = React.useCallback(() => {
    setTransfers(getStoredCourseTransfers())
    setOrders(getStoredOrders())
    setLogs(getStoredTransferOperationLogs())
  }, [])

  React.useEffect(() => { reload() }, [reload])

  const firstQueue = React.useMemo(() => transfers.filter(t => t.status === TransferStatus.PENDING_FIRST_REVIEW), [transfers])
  const secondQueue = React.useMemo(() => transfers.filter(t => t.status === TransferStatus.PENDING_SECOND_REVIEW), [transfers])
  const firstProcessed = React.useMemo(() => transfers.filter(isFirstStageProcessed), [transfers])
  const secondProcessed = React.useMemo(() => transfers.filter(isSecondStageProcessed), [transfers])

  const filteredFirstPending = React.useMemo(() => {
    let list = firstQueue
    if (searchId.trim()) {
      const q = searchId.toLowerCase()
      list = list.filter(t => t.id.toLowerCase().includes(q) || t.sourceOrderId.toLowerCase().includes(q))
    }
    return list
  }, [firstQueue, searchId])

  const filteredFirstProcessed = React.useMemo(() => {
    let list = firstProcessed
    if (searchId.trim()) {
      const q = searchId.toLowerCase()
      list = list.filter(t => t.id.toLowerCase().includes(q) || t.sourceOrderId.toLowerCase().includes(q))
    }
    return list
  }, [firstProcessed, searchId])

  const filteredSecondPending = React.useMemo(() => {
    let list = secondQueue
    if (searchId.trim()) {
      const q = searchId.toLowerCase()
      list = list.filter(t => t.id.toLowerCase().includes(q) || t.sourceOrderId.toLowerCase().includes(q))
    }
    return list
  }, [secondQueue, searchId])

  const filteredSecondProcessed = React.useMemo(() => {
    let list = secondProcessed
    if (searchId.trim()) {
      const q = searchId.toLowerCase()
      list = list.filter(t => t.id.toLowerCase().includes(q) || t.sourceOrderId.toLowerCase().includes(q))
    }
    return list
  }, [secondProcessed, searchId])


  const filteredLogs = React.useMemo(() => {
    let list = [...logs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    if (logSearch.trim()) {
      const q = logSearch.toLowerCase()
      list = list.filter(l =>
        l.transferId.toLowerCase().includes(q) ||
        l.action.includes(q) ||
        (l.detail ?? "").includes(q)
      )
    }
    return list
  }, [logs, logSearch])

  const openAction = (t: CourseTransfer, type: ActionType) => {
    setActionTransfer(t)
    setActionType(type)
    setNoteDraft("")
    setRejectNote("")
  }

  const closeAction = () => {
    setActionTransfer(null)
    setActionType(null)
  }

  const executeTransfer = (transfer: CourseTransfer, currentOrders: Order[]): { targetOrderId: string; refundAppId?: string } => {
    const now = new Date()
    const srcIdx = currentOrders.findIndex(o => o.id === transfer.sourceOrderId)
    const isNewTarget = transfer.targetOrderId.startsWith("ord-reserved-")

    const txOut: Transaction = {
      id: `tx-${Date.now()}-out`,
      type: "TRANSFER_OUT",
      amount: -transfer.sourceValue,
      hours: -transfer.sourceTransferredHours,
      createdAt: now,
      remark: `课程转移至${transfer.targetStudentName}(${transfer.targetGrade})`,
    }

    if (srcIdx >= 0) {
      const src = currentOrders[srcIdx]
      currentOrders[srcIdx] = {
        ...src,
        remainingHours: Math.max(0, src.remainingHours - transfer.sourceTransferredHours),
        transactions: [...(src.transactions ?? []), txOut],
        updatedAt: now,
      }
      if (currentOrders[srcIdx].remainingHours <= 0) {
        currentOrders[srcIdx].status = OrderStatus.COMPLETED
      }
    }

    let actualTargetId = transfer.targetOrderId

    if (isNewTarget) {
      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        type: OrderType.REGULAR,
        status: OrderStatus.IN_PROGRESS,
        studentId: transfer.targetStudentId,
        salesPersonId: currentOrders[srcIdx >= 0 ? srcIdx : 0]?.salesPersonId ?? "",
        subject: transfer.targetSubject,
        grade: transfer.targetGrade,
        totalHours: transfer.targetReceivedHours,
        remainingHours: transfer.targetReceivedHours,
        price: transfer.targetValue,
        assignedTeacherId: currentOrders[srcIdx >= 0 ? srcIdx : 0]?.assignedTeacherId,
        managerId: currentOrders[srcIdx >= 0 ? srcIdx : 0]?.managerId,
        transactions: [{
          id: `tx-${Date.now()}-in`,
          type: "TRANSFER_IN",
          amount: transfer.targetValue,
          hours: transfer.targetReceivedHours,
          createdAt: now,
          remark: "课程转入（转移审核通过后新建）",
        }],
        createdAt: now,
        updatedAt: now,
      }
      currentOrders.push(newOrder)
      actualTargetId = newOrder.id
    } else {
      const tgtIdx = currentOrders.findIndex(o => o.id === transfer.targetOrderId)
      if (tgtIdx >= 0) {
        const tgt = currentOrders[tgtIdx]
        currentOrders[tgtIdx] = {
          ...tgt,
          totalHours: tgt.totalHours + transfer.targetReceivedHours,
          remainingHours: tgt.remainingHours + transfer.targetReceivedHours,
          price: tgt.price + transfer.targetValue,
          transactions: [...(tgt.transactions ?? []), {
            id: `tx-${Date.now()}-in`,
            type: "TRANSFER_IN",
            amount: transfer.targetValue,
            hours: transfer.targetReceivedHours,
            createdAt: now,
            remark: `课程转入：来自${transfer.sourceStudentName}(${transfer.sourceGrade})`,
          }],
          updatedAt: now,
        }
      }
    }

    return { targetOrderId: actualTargetId }
  }

  const handleConfirmAction = async () => {
    if (!actionTransfer || !actionType || !user) return
    setIsProcessing(true)
    await new Promise(r => setTimeout(r, 500))

    const now = new Date()
    const opId = user.id
    const opName = user.name

    const nextTransfers = getStoredCourseTransfers()
    const idx = nextTransfers.findIndex(t => t.id === actionTransfer.id)
    if (idx < 0) { toast.error("记录不存在"); setIsProcessing(false); return }

    const t = nextTransfers[idx]
    const nextOrders = getStoredOrders()
    const newLogs: TransferOperationLog[] = []

    if (actionType === "first_ok") {
      nextTransfers[idx] = {
        ...t,
        status: TransferStatus.PENDING_SECOND_REVIEW,
        firstReviewNote: noteDraft || undefined,
        firstReviewerId: opId,
        firstReviewerName: opName,
        firstReviewedAt: now,
        updatedAt: now,
      }
      newLogs.push(createTransferLog({
        transferId: t.id, sourceOrderId: t.sourceOrderId, targetOrderId: t.targetOrderId,
        actorRole: "OPERATOR", actorUserId: opId, actorName: opName,
        action: "一审通过",
        detail: noteDraft || undefined,
      }))
    } else if (actionType === "first_reject") {
      if (!rejectNote.trim()) { toast.error("请填写驳回原因"); setIsProcessing(false); return }
      nextTransfers[idx] = {
        ...t,
        status: TransferStatus.FIRST_REJECTED,
        firstReviewNote: rejectNote,
        firstReviewerId: opId,
        firstReviewerName: opName,
        firstReviewedAt: now,
        firstRejectApplicantNote: rejectNote,
        updatedAt: now,
      }
      newLogs.push(createTransferLog({
        transferId: t.id, sourceOrderId: t.sourceOrderId, targetOrderId: t.targetOrderId,
        actorRole: "OPERATOR", actorUserId: opId, actorName: opName,
        action: "一审驳回",
        detail: rejectNote,
      }))
    } else if (actionType === "second_ok") {
      const { targetOrderId } = executeTransfer(t, nextOrders)
      saveStoredOrders(nextOrders)
      setOrders(nextOrders)

      nextTransfers[idx] = {
        ...t,
        status: TransferStatus.APPROVED,
        secondReviewNote: noteDraft || undefined,
        secondReviewerId: opId,
        secondReviewerName: opName,
        secondReviewedAt: now,
        targetOrderId,
        updatedAt: now,
      }
      newLogs.push(createTransferLog({
        transferId: t.id, sourceOrderId: t.sourceOrderId, targetOrderId: t.targetOrderId,
        actorRole: "OPERATOR", actorUserId: opId, actorName: opName,
        action: "二审通过（已执行转移）",
        detail: noteDraft || "转移已正式生效",
      }))
    } else if (actionType === "second_reject") {
      if (!rejectNote.trim()) { toast.error("请填写驳回原因"); setIsProcessing(false); return }
      nextTransfers[idx] = {
        ...t,
        status: TransferStatus.PENDING_FIRST_REVIEW,
        secondReviewNote: rejectNote,
        secondReviewerId: opId,
        secondReviewerName: opName,
        secondReviewedAt: now,
        secondRejectApplicantNote: rejectNote,
        updatedAt: now,
      }
      newLogs.push(createTransferLog({
        transferId: t.id, sourceOrderId: t.sourceOrderId, targetOrderId: t.targetOrderId,
        actorRole: "OPERATOR", actorUserId: opId, actorName: opName,
        action: "二审驳回（退回一审）",
        detail: rejectNote,
      }))
    }

    saveStoredCourseTransfers(nextTransfers)

    const nextLogs = getStoredTransferOperationLogs()
    nextLogs.unshift(...newLogs)
    saveStoredTransferOperationLogs(nextLogs)

    reload()
    closeAction()
    toast.success(actionType === "second_ok" ? "审核通过，转移已生效！" : "操作成功")
    setIsProcessing(false)
  }

  const handleViewDetail = (t: CourseTransfer) => {
    setDetailTransfer(t)
    setDetailOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">转移审核</h2>
          <p className="text-muted-foreground mt-2">审核课程转移申请，二审通过后转移正式生效。</p>
        </div>
        <Button variant="outline" onClick={reload}><RefreshCcwDot className="h-4 w-4 mr-2" />刷新</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">转移单号/源订单号</Label>
            <Input placeholder="搜索..." value={searchId} onChange={e => { setSearchId(e.target.value); setFirstPage(1); setSecondPage(1) }} className="w-56" />
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="first">
            一审 {firstQueue.length > 0 && <Badge variant="secondary" className="ml-2 h-5 px-1.5">{firstQueue.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="second">
            二审 {secondQueue.length > 0 && <Badge variant="secondary" className="ml-2 h-5 px-1.5">{secondQueue.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="logs">操作日志</TabsTrigger>
        </TabsList>

        <TabsContent value="first">
          <Tabs value={firstSub} onValueChange={v => { setFirstSub(v); setFirstPage(1) }}>
            <TabsList>
              <TabsTrigger value="pending">待处理 ({firstQueue.length})</TabsTrigger>
              <TabsTrigger value="processed">已处理 ({firstProcessed.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <TransferTable list={filteredFirstPending} page={firstPage} setPage={setFirstPage} showActions="first" onViewDetail={handleViewDetail} onAction={openAction} />
            </TabsContent>
            <TabsContent value="processed">
              <TransferTable list={filteredFirstProcessed} page={firstPage} setPage={setFirstPage} showActions="first" onViewDetail={handleViewDetail} onAction={openAction} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="second">
          <Tabs value={secondSub} onValueChange={v => { setSecondSub(v); setSecondPage(1) }}>
            <TabsList>
              <TabsTrigger value="pending">待处理 ({secondQueue.length})</TabsTrigger>
              <TabsTrigger value="processed">已处理 ({secondProcessed.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="pending">
              <TransferTable list={filteredSecondPending} page={secondPage} setPage={setSecondPage} showActions="second" onViewDetail={handleViewDetail} onAction={openAction} />
            </TabsContent>
            <TabsContent value="processed">
              <TransferTable list={filteredSecondProcessed} page={secondPage} setPage={setSecondPage} showActions="second" onViewDetail={handleViewDetail} onAction={openAction} />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>操作日志</CardTitle>
                <Input placeholder="搜索日志..." value={logSearch} onChange={e => { setLogSearch(e.target.value); setLogPage(1) }} className="w-56" />
              </div>
            </CardHeader>
            <CardContent>
              {(() => {
                const start = (logPage - 1) * PAGE_SIZE
                const pageItems = filteredLogs.slice(start, start + PAGE_SIZE)
                const logPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE))
                return (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>时间</TableHead>
                          <TableHead>转移单号</TableHead>
                          <TableHead>操作人</TableHead>
                          <TableHead>操作</TableHead>
                          <TableHead>详情</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pageItems.length === 0 ? (
                          <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">暂无日志</TableCell></TableRow>
                        ) : pageItems.map(l => (
                          <TableRow key={l.id}>
                            <TableCell className="whitespace-nowrap text-sm">{new Date(l.createdAt).toLocaleString("zh-CN")}</TableCell>
                            <TableCell className="text-sm font-mono">{l.transferId}</TableCell>
                            <TableCell className="text-sm">{l.actorName ?? "-"}</TableCell>
                            <TableCell><Badge variant="outline">{l.action}</Badge></TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{l.detail ?? "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {logPages > 1 && (
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-muted-foreground">第 {logPage}/{logPages} 页</span>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" disabled={logPage <= 1} onClick={() => setLogPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
                          <Button size="sm" variant="outline" disabled={logPage >= logPages} onClick={() => setLogPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    )}
                  </>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ====== Detail Dialog ====== */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>转移详情</DialogTitle>
            <DialogDescription>{detailTransfer?.id}</DialogDescription>
          </DialogHeader>
          {detailTransfer && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium mb-2 text-muted-foreground">源订单</div>
                  <div className="space-y-1">
                    <div>学员：{detailTransfer.sourceStudentName}</div>
                    <div>{detailTransfer.sourceSubject} · {detailTransfer.sourceGrade}</div>
                    <div>转出：{detailTransfer.sourceTransferredHours} 课时 × {detailTransfer.sourceNetUnitPrice} = {detailTransfer.sourceValue} 元</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2 text-muted-foreground">目标订单</div>
                  <div className="space-y-1">
                    <div>学员：{detailTransfer.targetStudentName}</div>
                    <div>{detailTransfer.targetSubject} · {detailTransfer.targetGrade}</div>
                    <div>获得：{detailTransfer.targetReceivedHours} 课时 × {detailTransfer.targetNetUnitPrice} = {detailTransfer.targetValue} 元</div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span>差额</span>
                <span className={`font-bold ${detailTransfer.priceDifference > 0 ? "text-orange-600" : detailTransfer.priceDifference < 0 ? "text-green-600" : ""}`}>
                  {detailTransfer.priceDifference > 0 ? `补缴 ${detailTransfer.priceDifference}` : detailTransfer.priceDifference < 0 ? `退款 ${Math.abs(detailTransfer.priceDifference)}` : "无差额"} 元
                </span>
              </div>
              <div className="flex justify-between">
                <span>状态</span>
                <Badge variant={STATUS_COLOR[detailTransfer.status] ?? "outline"}>{STATUS_LABEL[detailTransfer.status]}</Badge>
              </div>
              {detailTransfer.remarks && (
                <><Separator /><div><span className="font-medium">备注</span><div className="mt-1 text-muted-foreground">{detailTransfer.remarks}</div></div></>
              )}
              {detailTransfer.supplementaryVouchers && detailTransfer.supplementaryVouchers.length > 0 && (
                <><Separator /><div><span className="font-medium">补缴凭证</span><div className="flex flex-wrap gap-2 mt-2">{detailTransfer.supplementaryVouchers.map((v, i) => <img key={i} src={v} alt="" className="w-24 h-24 object-cover border rounded" />)}</div></div></>
              )}
              {(detailTransfer.firstReviewerName || detailTransfer.secondReviewerName) && <Separator />}
              {detailTransfer.firstReviewerName && (
                <div className="space-y-1">
                  <div className="font-medium">一审</div>
                  <div>审核人：{detailTransfer.firstReviewerName} · {detailTransfer.firstReviewedAt ? new Date(detailTransfer.firstReviewedAt).toLocaleString("zh-CN") : "-"}</div>
                  {detailTransfer.firstReviewNote && <div className="text-muted-foreground">批注：{detailTransfer.firstReviewNote}</div>}
                  {detailTransfer.firstRejectApplicantNote && <div className="text-destructive">驳回原因：{detailTransfer.firstRejectApplicantNote}</div>}
                </div>
              )}
              {detailTransfer.secondReviewerName && (
                <div className="space-y-1">
                  <div className="font-medium">二审</div>
                  <div>审核人：{detailTransfer.secondReviewerName} · {detailTransfer.secondReviewedAt ? new Date(detailTransfer.secondReviewedAt).toLocaleString("zh-CN") : "-"}</div>
                  {detailTransfer.secondReviewNote && <div className="text-muted-foreground">批注：{detailTransfer.secondReviewNote}</div>}
                  {detailTransfer.secondRejectApplicantNote && <div className="text-destructive">驳回原因：{detailTransfer.secondRejectApplicantNote}</div>}
                </div>
              )}
              {detailTransfer.status === TransferStatus.APPROVED && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span>鼎伴学课时转移</span>
                    {detailTransfer.dingbanxueReminderStatus === "PENDING" ? (
                      <Badge variant="destructive"><Clock className="h-3 w-3 mr-1" />待处理</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />已确认</Badge>
                    )}
                  </div>
                </>
              )}
              <Separator />
              <div className="text-xs text-muted-foreground">
                申请人：{detailTransfer.createdByName} · {new Date(detailTransfer.createdAt).toLocaleString("zh-CN")}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ====== Action Dialog ====== */}
      <Dialog open={actionType !== null} onOpenChange={v => { if (!v) closeAction() }}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {actionType === "first_ok" && "一审通过"}
              {actionType === "first_reject" && "一审驳回"}
              {actionType === "second_ok" && "二审通过"}
              {actionType === "second_reject" && "二审驳回"}
            </DialogTitle>
            <DialogDescription>
              转移单号：{actionTransfer?.id}
            </DialogDescription>
          </DialogHeader>
          {actionTransfer && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded text-sm">
                <div>{actionTransfer.sourceStudentName}({actionTransfer.sourceGrade}) → {actionTransfer.targetStudentName}({actionTransfer.targetGrade})</div>
                <div className="text-muted-foreground mt-1">转移 {actionTransfer.sourceTransferredHours} 课时 → 获得 {actionTransfer.targetReceivedHours} 课时</div>
                {actionTransfer.priceDifference !== 0 && (
                  <div className="mt-1">
                    差额：{actionTransfer.priceDifference > 0 ? `需补缴 ${actionTransfer.priceDifference}` : `需退款 ${Math.abs(actionTransfer.priceDifference)}`} 元
                  </div>
                )}
              </div>

              {(actionType === "first_ok" || actionType === "second_ok") && (
                <div className="space-y-2">
                  <Label>审核批注</Label>
                  <Textarea value={noteDraft} onChange={e => setNoteDraft(e.target.value)} placeholder="可选填写批注" rows={2} />
                </div>
              )}

              {(actionType === "first_reject" || actionType === "second_reject") && (
                <div className="space-y-2">
                  <Label>驳回原因 <span className="text-destructive">*</span></Label>
                  <Textarea value={rejectNote} onChange={e => setRejectNote(e.target.value)} placeholder="必填，将展示给申请人" rows={3} />
                </div>
              )}

              {actionType === "second_ok" && (
                <div className="flex items-start gap-2 p-3 bg-green-50 text-green-800 rounded text-sm">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>二审通过后转移将正式生效：源订单课时扣减、目标订单课时增加。请确认已线下完成鼎伴学课时转移。</span>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={closeAction}>取消</Button>
            <Button
              variant={actionType?.endsWith("reject") ? "destructive" : "default"}
              disabled={isProcessing}
              onClick={handleConfirmAction}
            >
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确认
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
