"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Order,
  User,
  CoachChangeRecord,
  CoachChangeReason,
  COACH_CHANGE_REASON_LABELS,
  Role,
} from "@/types"
import {
  getStoredUsers,
  getStoredCoachChangeRecords,
  saveStoredCoachChangeRecords,
  saveStoredOrders,
  getStoredOrders,
} from "@/lib/storage"

const CHANGE_WARNING_THRESHOLD = 3

interface ChangeCoachDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  operatorUser: User | null
  operatorRole: "MANAGER" | "OPERATOR"
  onDone?: () => void
}

export function ChangeCoachDialog({
  open,
  onOpenChange,
  order,
  operatorUser,
  operatorRole,
  onDone,
}: ChangeCoachDialogProps) {
  const [allRecords, setAllRecords] = React.useState<CoachChangeRecord[]>([])
  const [tutors, setTutors] = React.useState<User[]>([])

  const [confirmCommunicated, setConfirmCommunicated] = React.useState(false)
  const [reason, setReason] = React.useState<CoachChangeReason | "">("")
  const [reasonDetail, setReasonDetail] = React.useState("")
  const [note, setNote] = React.useState("")
  const [newCoachId, setNewCoachId] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const load = React.useCallback(() => {
    setAllRecords(getStoredCoachChangeRecords())
    const users = getStoredUsers()
    setTutors(users.filter(u => u.roles?.includes(Role.TUTOR)))
  }, [])

  React.useEffect(() => {
    if (open) load()
  }, [open, load])

  const orderRecords = React.useMemo(() => {
    if (!order) return []
    return allRecords
      .filter(r => r.orderId === order.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [allRecords, order])

  const changeCount = orderRecords.length
  const exceedsThreshold = changeCount >= CHANGE_WARNING_THRESHOLD

  const currentCoachId = order?.assignedTeacherId
  const availableTutors = tutors.filter(t => t.id !== currentCoachId)

  const resetForm = () => {
    setConfirmCommunicated(false)
    setReason("")
    setReasonDetail("")
    setNote("")
    setNewCoachId("")
    setIsSubmitting(false)
  }

  const handleSubmit = () => {
    if (!order || !operatorUser) return
    if (!newCoachId) { toast.error("请选择新教练"); return }
    if (!confirmCommunicated) { toast.error("请确认已与校长及家长提前沟通"); return }
    if (!reason) { toast.error("请选择更换教练原因"); return }
    if (reason === "OTHER" && !reasonDetail.trim()) { toast.error("请填写具体原因"); return }
    setIsSubmitting(true)

    const now = new Date()
    const newCoach = tutors.find(t => t.id === newCoachId)
    const currentCoach = tutors.find(t => t.id === currentCoachId)

    const record: CoachChangeRecord = {
      id: `ccr-${Date.now()}`,
      orderId: order.id,
      previousCoachId: currentCoachId ?? "",
      previousCoachName: currentCoach?.name ?? currentCoachId ?? "未知",
      newCoachId,
      newCoachName: newCoach?.name ?? newCoachId,
      reason: reason as CoachChangeReason,
      reasonDetail: reason === "OTHER" ? reasonDetail : undefined,
      note: note.trim() || undefined,
      operatorId: operatorUser.id,
      operatorName: operatorUser.name,
      operatorRole,
      createdAt: now,
    }

    const nextRecords = getStoredCoachChangeRecords()
    nextRecords.unshift(record)
    saveStoredCoachChangeRecords(nextRecords)

    const nextOrders = getStoredOrders()
    const idx = nextOrders.findIndex(o => o.id === order.id)
    if (idx >= 0) {
      nextOrders[idx] = {
        ...nextOrders[idx],
        assignedTeacherId: newCoachId,
        updatedAt: now,
      }
      saveStoredOrders(nextOrders)
    }

    setAllRecords(nextRecords)
    resetForm()
    toast.success(`教练已更换为 ${newCoach?.name ?? newCoachId}`)
    onDone?.()
  }

  const handleClose = (v: boolean) => {
    if (!v) resetForm()
    onOpenChange(v)
  }

  if (!order) return null

  const currentCoach = tutors.find(t => t.id === currentCoachId)

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>更换教练</DialogTitle>
          <DialogDescription>
            订单 {order.id.slice(0, 16)}... · {order.subject} · {order.grade}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Warning */}
          {exceedsThreshold && (
            <div className="flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <span className="font-semibold">警示：</span>
                该订单已累计更换教练 {changeCount} 次，超过 {CHANGE_WARNING_THRESHOLD} 次。
                继续更换可能导致原教练及团队的信用值受到影响，请谨慎操作。
              </div>
            </div>
          )}

          {/* Current coach info */}
          <div className="flex items-center gap-3 rounded-md border p-3 bg-muted/30">
            <span className="text-sm text-muted-foreground">当前教练：</span>
            <span className="font-medium">{currentCoach?.name ?? currentCoachId ?? "未分配"}</span>
          </div>

          {/* Select new coach */}
          <div className="space-y-2">
            <Label>选择新教练 *</Label>
            <Select value={newCoachId} onValueChange={setNewCoachId}>
              <SelectTrigger><SelectValue placeholder="请选择教练" /></SelectTrigger>
              <SelectContent>
                {availableTutors.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}（{t.phone}）</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Confirmation checkboxes */}
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                checked={confirmCommunicated}
                onCheckedChange={(v) => setConfirmCommunicated(Boolean(v))}
              />
              <Label className="text-sm font-normal leading-relaxed cursor-pointer">
                确认更换教练已经与校长及家长提前沟通，并达成一致 *
              </Label>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>更换教练原因 *</Label>
              <Select value={reason} onValueChange={(v) => { setReason(v as CoachChangeReason); setReasonDetail("") }}>
                <SelectTrigger><SelectValue placeholder="请选择原因" /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(COACH_CHANGE_REASON_LABELS) as [CoachChangeReason, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {reason === "OTHER" && (
              <div className="space-y-2">
                <Label>请填写具体原因 *</Label>
                <Input
                  placeholder="请描述具体原因"
                  value={reasonDetail}
                  onChange={e => setReasonDetail(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Label>备注</Label>
            <Textarea
              rows={2}
              placeholder="补充说明（选填）"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* History */}
          {orderRecords.length > 0 && (
            <div className="space-y-3 border-t pt-4">
              <h4 className="text-sm font-medium text-muted-foreground">更换教练历史记录</h4>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">时间</TableHead>
                      <TableHead className="text-xs">原教练</TableHead>
                      <TableHead className="text-xs">新教练</TableHead>
                      <TableHead className="text-xs">原因</TableHead>
                      <TableHead className="text-xs">备注</TableHead>
                      <TableHead className="text-xs">操作人</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderRecords.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs whitespace-nowrap">
                          {new Date(r.createdAt).toLocaleString("zh-CN")}
                        </TableCell>
                        <TableCell className="text-xs">{r.previousCoachName}</TableCell>
                        <TableCell className="text-xs">{r.newCoachName}</TableCell>
                        <TableCell className="text-xs">
                          {COACH_CHANGE_REASON_LABELS[r.reason]}
                          {r.reason === "OTHER" && r.reasonDetail ? `：${r.reasonDetail}` : ""}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.note ?? "—"}</TableCell>
                        <TableCell className="text-xs">
                          {r.operatorName}
                          <span className="text-muted-foreground ml-1">
                            ({r.operatorRole === "MANAGER" ? "学管" : "运营"})
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>取消</Button>
          <Button
            onClick={handleSubmit}
            disabled={!newCoachId || !confirmCommunicated || !reason || (reason === "OTHER" && !reasonDetail.trim()) || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            确认更换
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CoachChangeHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
}

export function CoachChangeHistoryDialog({
  open,
  onOpenChange,
  order,
}: CoachChangeHistoryDialogProps) {
  const [records, setRecords] = React.useState<CoachChangeRecord[]>([])

  React.useEffect(() => {
    if (open) {
      const all = getStoredCoachChangeRecords()
      setRecords(
        all
          .filter(r => r.orderId === order?.id)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      )
    }
  }, [open, order])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>更换教练历史记录</DialogTitle>
          <DialogDescription>订单 {order?.id.slice(0, 16)}...</DialogDescription>
        </DialogHeader>
        {records.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">暂无更换记录</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">时间</TableHead>
                  <TableHead className="text-xs">原教练</TableHead>
                  <TableHead className="text-xs">新教练</TableHead>
                  <TableHead className="text-xs">原因</TableHead>
                  <TableHead className="text-xs">备注</TableHead>
                  <TableHead className="text-xs">操作人</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString("zh-CN")}
                    </TableCell>
                    <TableCell className="text-xs">{r.previousCoachName}</TableCell>
                    <TableCell className="text-xs">{r.newCoachName}</TableCell>
                    <TableCell className="text-xs">
                      {COACH_CHANGE_REASON_LABELS[r.reason]}
                      {r.reason === "OTHER" && r.reasonDetail ? `：${r.reasonDetail}` : ""}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.note ?? "—"}</TableCell>
                    <TableCell className="text-xs">
                      {r.operatorName}
                      <span className="text-muted-foreground ml-1">
                        ({r.operatorRole === "MANAGER" ? "学管" : "运营"})
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
