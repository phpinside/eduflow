import { OrderStatus } from "@/types"

/**
 * 招生侧订单列表 / 详情中展示的「标准订单履约」节点（与 OrderStatus 映射）
 */
export const SALES_ORDER_PIPELINE_KEYS = [
  "PENDING_PAYMENT",
  "PENDING_CS_REVIEW",
  "PENDING_FINANCE_REVIEW",
  "SCHEDULING_RING",
  "ASSIGNED_DONE",
  "IN_PROGRESS",
  "COMPLETED",
] as const

export const SALES_ORDER_PIPELINE_LABELS: Record<(typeof SALES_ORDER_PIPELINE_KEYS)[number], string> = {
  PENDING_PAYMENT: "待支付",
  PENDING_CS_REVIEW: "待客服审核",
  PENDING_FINANCE_REVIEW: "待财务审核",
  SCHEDULING_RING: "排课中",
  ASSIGNED_DONE: "排课完成",
  IN_PROGRESS: "上课进行中",
  COMPLETED: "订单已完成",
}

export type SalesPipelineTerminal = "none" | "cancelled" | "refunded" | "cancel_requested"

export interface SalesOrderPipelineState {
  /** 当前节点下标 0..6；终止态时可能用于估算展示位置 */
  currentIndex: number
  terminal: SalesPipelineTerminal
}

/**
 * 将订单状态映射到招生侧 7 节点流程线。
 * - PENDING（待接单）归入「排课中」阶段（与排单/匹配教练仍在进行一致）。
 */
export function getSalesOrderPipelineState(order: { status: OrderStatus }): SalesOrderPipelineState {
  const s = order.status

  if (s === OrderStatus.CANCELLED) {
    return { currentIndex: 0, terminal: "cancelled" }
  }
  if (s === OrderStatus.REFUNDED) {
    return { currentIndex: 6, terminal: "refunded" }
  }
  if (s === OrderStatus.CANCEL_REQUESTED) {
    return { currentIndex: 0, terminal: "cancel_requested" }
  }

  let idx = 0
  switch (s) {
    case OrderStatus.PENDING_PAYMENT:
      idx = 0
      break
    case OrderStatus.PENDING_CS_REVIEW:
      idx = 1
      break
    case OrderStatus.PENDING_FINANCE_REVIEW:
      idx = 2
      break
    case OrderStatus.SCHEDULING:
    case OrderStatus.PENDING:
      idx = 3
      break
    case OrderStatus.ASSIGNED:
      idx = 4
      break
    case OrderStatus.IN_PROGRESS:
      idx = 5
      break
    case OrderStatus.COMPLETED:
      idx = 6
      break
    default:
      idx = 0
  }

  return { currentIndex: idx, terminal: "none" }
}
