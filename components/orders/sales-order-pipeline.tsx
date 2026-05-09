"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Order } from "@/types"
import { OrderStatus } from "@/types"
import {
  SALES_ORDER_PIPELINE_KEYS,
  SALES_ORDER_PIPELINE_LABELS,
  getSalesOrderPipelineState,
} from "@/lib/sales-order-pipeline"
import { ORDER_STATUS_MAP } from "@/lib/order-constants"

function TerminalBanner({ order }: { order: Order }) {
  const s = order.status
  if (s === OrderStatus.CANCELLED) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
        该订单已取消，下方流程仅供参考。
      </div>
    )
  }
  if (s === OrderStatus.REFUNDED) {
    return (
      <div className="rounded-md border border-muted bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        该订单已完成退款，流程已结束。
      </div>
    )
  }
  if (s === OrderStatus.CANCEL_REQUESTED) {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        取消申请处理中，请以订单状态「{ORDER_STATUS_MAP[s]}」为准。
      </div>
    )
  }
  return null
}

export function SalesOrderPipeline({ order, className }: { order: Order; className?: string }) {
  const { currentIndex, terminal } = getSalesOrderPipelineState(order)
  const steps = SALES_ORDER_PIPELINE_KEYS
  const refundedPath = terminal === "refunded"
  const brokenPath = terminal === "cancelled" || terminal === "cancel_requested"

  return (
    <div
      className={cn("space-y-2", className)}
      data-no-nav
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">订单流转</span>
        <span className="text-xs text-muted-foreground">
          当前：
          <span className="font-semibold text-foreground">{ORDER_STATUS_MAP[order.status]}</span>
        </span>
      </div>

      <TerminalBanner order={order} />

      <div className="relative overflow-x-auto pb-1 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-[640px] items-start gap-0 px-0.5">
          {steps.map((key, i) => {
            const label = SALES_ORDER_PIPELINE_LABELS[key]
            const doneRefundedLead = refundedPath && i < 6
            const doneRefundedFinal = refundedPath && i === 6
            const isPast =
              doneRefundedLead || (!refundedPath && !brokenPath && i < currentIndex)
            const isCurrent = !refundedPath && !brokenPath && i === currentIndex

            let nodeClass =
              "border-muted-foreground/25 bg-background text-muted-foreground"
            if (brokenPath) {
              nodeClass = "border-muted-foreground/20 bg-muted/40 text-muted-foreground"
            } else if (doneRefundedFinal) {
              nodeClass =
                "border-primary/50 bg-background text-primary ring-2 ring-primary/20 ring-offset-2 ring-offset-background"
            } else if (doneRefundedLead || isPast) {
              nodeClass = "border-primary/35 bg-primary/10 text-primary"
            } else if (isCurrent) {
              nodeClass =
                "border-primary bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/25 ring-offset-2 ring-offset-background"
            }

            const connectorPast = brokenPath
              ? false
              : refundedPath
                ? i < 6
                : i < currentIndex

            return (
              <React.Fragment key={key}>
                <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors",
                      nodeClass
                    )}
                    aria-current={isCurrent ? "step" : undefined}
                  >
                    {brokenPath ? (
                      <span>{i + 1}</span>
                    ) : refundedPath ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : isPast ? (
                      <Check className="h-4 w-4" strokeWidth={2.5} />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "px-0.5 text-center text-[10px] leading-tight sm:text-[11px]",
                      isCurrent || doneRefundedFinal ? "font-semibold text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {label}
                    {doneRefundedFinal ? (
                      <span className="mt-0.5 block text-[9px] font-normal text-muted-foreground">（已退款）</span>
                    ) : null}
                  </span>
                </div>
                {i < steps.length - 1 ? (
                  <div
                    className={cn(
                      "mb-6 h-0.5 min-w-[8px] flex-1 self-center",
                      connectorPast ? "bg-primary/35" : "bg-border"
                    )}
                    aria-hidden
                  />
                ) : null}
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </div>
  )
}
