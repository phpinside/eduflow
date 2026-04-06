"use client"

import * as React from "react"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import type { Order, RefundApplication, User } from "@/types"
import { RefundApplicationStatus } from "@/types"
import {
  generateRefundApplicationId,
  createRefundLog,
  getComputedMaxForKind,
  orderHasRedPacket,
  resolveRefundKind,
} from "@/lib/refund-domain"
import {
  getStoredRefundApplications,
  saveRefundApplications,
  saveStoredOrders,
  getStoredRefundOperationLogs,
  saveRefundOperationLogs,
} from "@/lib/storage"

function SupportQrPlaceholder() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed bg-muted/40 p-4">
      <div className="text-xs text-muted-foreground text-center">
        客服支持：千千（扫码咨询）
      </div>
      <div className="relative h-28 w-28 overflow-hidden rounded-md border bg-background">
        <Image
          src="/support-qianqian.png"
          alt="客服千千二维码"
          fill
          className="object-contain"
          sizes="112px"
        />
      </div>
    </div>
  )
}

type RefundTarget = "ORDER" | "RED_PACKET"

export function RefundApplyDialog(props: {
  open: boolean
  onOpenChange: (v: boolean) => void
  order: Order | null
  user: User | null
  orders: Order[]
  onCommitted: (nextOrders: Order[], nextApps: RefundApplication[]) => void
}) {
  const { open, onOpenChange, order, user, orders, onCommitted } = props
  const [reason, setReason] = React.useState("")
  const [target, setTarget] = React.useState<RefundTarget>("ORDER")
  const [requestedAmount, setRequestedAmount] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  const hasPacket = order ? orderHasRedPacket(order) : false
  const kind = order
    ? resolveRefundKind(order, target === "RED_PACKET" ? "RED_PACKET" : "ORDER")
    : "REGULAR"
  const { max, breakdown } = order ? getComputedMaxForKind(order, kind) : { max: 0 }

  React.useEffect(() => {
    if (!open || !order) return
    setReason("")
    setTarget("ORDER")
  }, [open, order])

  React.useEffect(() => {
    if (!open || !order) return
    const k = resolveRefundKind(order, target === "RED_PACKET" ? "RED_PACKET" : "ORDER")
    const { max: m } = getComputedMaxForKind(order, k)
    setRequestedAmount(String(m > 0 ? m : ""))
  }, [open, order, target])

  const handleSubmit = async () => {
    if (!order || !user) return
    if (target === "RED_PACKET" && !hasPacket) {
      toast.error("该订单无转正红包记录")
      return
    }
    const amt = Math.floor(Number(requestedAmount))
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("申请退款金额须大于 0")
      return
    }
    if (amt > max) {
      toast.error(`申请金额不能超过剩余最大可退金额 ¥${max.toLocaleString()}`)
      return
    }

    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 400))

    const apps = getStoredRefundApplications()
    const now = new Date()
    const app: RefundApplication = {
      id: generateRefundApplicationId(),
      orderId: order.id,
      applicantUserId: user.id,
      applicantName: user.name,
      refundKind: kind,
      status: RefundApplicationStatus.PENDING_FIRST_REVIEW,
      reason: reason.trim() || undefined,
      requestedAmount: amt,
      computedMaxAtApply: max,
      breakdown: breakdown,
      createdAt: now,
      updatedAt: now,
    }
    const nextApps = [...apps, app]

    const nextOrders = orders.map((o) =>
      o.id === order.id
        ? {
            ...o,
            refundFreezeActive: true,
            updatedAt: now,
          }
        : o
    )

    const logs = getStoredRefundOperationLogs()
    const nextLogs = [
      ...logs,
      createRefundLog({
        refundApplicationId: app.id,
        orderId: order.id,
        actorRole: "SALES",
        actorUserId: user.id,
        actorName: user.name,
        action: "发起退费申请",
        detail: `类型 ${kind}，申请金额 ¥${amt}`,
      }),
    ]

    saveRefundApplications(nextApps)
    saveStoredOrders(nextOrders)
    saveRefundOperationLogs(nextLogs)

    toast.success("退费申请已提交，课时已冻结，请等待交付中心审核")
    setSubmitting(false)
    onOpenChange(false)
    onCommitted(nextOrders, nextApps)
  }

  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>申请退费</DialogTitle>
          <DialogDescription>
            订单号 {order.id}，提交后系统将立即冻结本单剩余课时，在审核结束前提请不可再次申请退费。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border bg-muted/30 p-3 space-y-1 text-muted-foreground">
            <p>· 审核完成预计 2–3 个工作日；通过后原路退回预计 3–5 个工作日到账。</p>
            <p>· 一审处理前，您可撤销申请；撤销后课时将恢复可用。</p>
          </div>

          {hasPacket && (
            <div className="space-y-2">
              <Label>退费范围</Label>
              <RadioGroup
                value={target}
                onValueChange={(v) => setTarget(v as RefundTarget)}
                className="flex flex-col gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ORDER" id="rt-order" />
                  <Label htmlFor="rt-order" className="font-normal cursor-pointer">
                    按订单规则退费（试课/正课/续课）
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="RED_PACKET" id="rt-packet" />
                  <Label htmlFor="rt-packet" className="font-normal cursor-pointer">
                    仅退转正红包（全额可退，以实际支付为准）
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {breakdown && target === "ORDER" && (
            <div className="rounded-md border p-3 space-y-2">
              <div className="font-medium text-foreground">可退金额明细</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <span className="text-muted-foreground">总课时</span>
                <span>{breakdown.totalHours} 课时</span>
                <span className="text-muted-foreground">已上课时</span>
                <span>{breakdown.consumedHours} 课时</span>
                <span className="text-muted-foreground">剩余课时</span>
                <span>{breakdown.remainingHours} 课时</span>
                <span className="text-muted-foreground">缴纳总费用</span>
                <span>¥{breakdown.totalFee.toLocaleString()}</span>
                <span className="text-muted-foreground">不可退费部分</span>
                <span>
                  ¥{breakdown.nonRefundableAmount.toLocaleString()}（{breakdown.totalHours}×20 元/课时）
                </span>
                <span className="text-muted-foreground">已消耗课时费用</span>
                <span>¥{breakdown.consumedLessonFee.toLocaleString()}</span>
                <span className="text-muted-foreground font-medium">剩余最大可退</span>
                <span className="font-semibold text-primary">
                  ¥{breakdown.maxRefundable.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {target === "ORDER" && !breakdown && (
            <div className="rounded-md border p-3 space-y-1">
              <div className="font-medium">试课订单</div>
              <p className="text-xs text-muted-foreground">
                原则上按原支付金额全额申请退费，具体以人工审核为准。
              </p>
              <p className="text-sm">
                原支付金额：<span className="font-semibold">¥{max.toLocaleString()}</span>
              </p>
            </div>
          )}

          {target === "RED_PACKET" && (
            <div className="rounded-md border p-3 text-sm">
              转正红包已缴合计{" "}
              <span className="font-semibold">¥{max.toLocaleString()}</span>
              ，可申请全额退还（人工审核）。
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="refund-amt">申请退款金额（元）</Label>
            <Input
              id="refund-amt"
              type="number"
              min={1}
              max={max}
              value={requestedAmount}
              onChange={(e) => setRequestedAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              须大于 0 且不超过 ¥{max.toLocaleString()}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refund-reason">退费原因（选填）</Label>
            <Textarea
              id="refund-reason"
              placeholder="可填写家长诉求、课程问题等，便于审核判断"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <Separator />

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <SupportQrPlaceholder />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || max <= 0}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            提交申请
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
