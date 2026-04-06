import {
  Order,
  OrderStatus,
  OrderType,
  RefundApplication,
  RefundApplicationStatus,
  RefundKind,
  RefundOperationLog,
  RegularRefundBreakdown,
} from '@/types'

/** 鼎伴学不可退费部分：课时单价（元/课时） */
export const NON_REFUNDABLE_PER_HOUR = 20

export function getOrderTotalPaid(order: Order): number {
  const txs = order.transactions?.filter(
    (t) => t.type === 'INITIAL' || t.type === 'RENEWAL' || t.type === 'REWARD'
  )
  if (txs?.length) {
    return txs.reduce((s, t) => s + t.amount, 0)
  }
  return order.price
}

export function getRedPacketTotalPaid(order: Order): number {
  if (!order.transactions?.length) return 0
  return order.transactions
    .filter((t) => t.type === 'REWARD')
    .reduce((s, t) => s + t.amount, 0)
}

export function orderHasRedPacket(order: Order): boolean {
  return getRedPacketTotalPaid(order) > 0
}

export function getRegularRefundBreakdown(order: Order): RegularRefundBreakdown {
  const totalFee = getOrderTotalPaid(order)
  const totalHours = Math.max(0, order.totalHours || 0)
  const remainingHours = Math.max(0, order.remainingHours ?? 0)
  const consumedHours = Math.max(0, totalHours - remainingHours)
  const nonRefundableAmount = Math.round(totalHours * NON_REFUNDABLE_PER_HOUR)
  const pool = Math.max(0, totalFee - nonRefundableAmount)
  const consumedLessonFee =
    totalHours > 0 ? Math.floor((consumedHours / totalHours) * pool) : 0
  const maxRefundable = Math.max(0, pool - consumedLessonFee)
  return {
    totalFee,
    totalHours,
    consumedHours,
    remainingHours,
    nonRefundableAmount,
    consumedLessonFee,
    maxRefundable,
  }
}

export function getTrialMaxRefundable(order: Order): number {
  return Math.max(0, Math.floor(order.price))
}

export function resolveRefundKind(
  order: Order,
  target: 'ORDER' | 'RED_PACKET'
): RefundKind {
  if (target === 'RED_PACKET') return 'RED_PACKET'
  if (order.type === OrderType.TRIAL) return 'TRIAL'
  const hasRenewal = order.transactions?.some((t) => t.type === 'RENEWAL')
  if (hasRenewal) return 'RENEWAL'
  return 'REGULAR'
}

export function getComputedMaxForKind(
  order: Order,
  kind: RefundKind
): { max: number; breakdown?: RegularRefundBreakdown } {
  if (kind === 'RED_PACKET') {
    return { max: getRedPacketTotalPaid(order) }
  }
  if (kind === 'TRIAL') {
    return { max: getTrialMaxRefundable(order) }
  }
  const b = getRegularRefundBreakdown(order)
  return { max: b.maxRefundable, breakdown: b }
}

export function isActiveRefundStatus(status: RefundApplicationStatus): boolean {
  return (
    status === RefundApplicationStatus.PENDING_FIRST_REVIEW ||
    status === RefundApplicationStatus.PENDING_SECOND_REVIEW
  )
}

export function findActiveRefundApplication(
  applications: RefundApplication[],
  orderId: string
): RefundApplication | undefined {
  return applications.find((a) => a.orderId === orderId && isActiveRefundStatus(a.status))
}

export function canSalesApplyRefund(
  order: Order,
  applications: RefundApplication[]
): boolean {
  if (order.refundFreezeActive) return false
  if (findActiveRefundApplication(applications, order.id)) return false
  if (
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.REFUNDED ||
    order.status === OrderStatus.CANCEL_REQUESTED
  ) {
    return false
  }
  return true
}

export function canSalesWithdraw(app: RefundApplication | undefined): boolean {
  return app?.status === RefundApplicationStatus.PENDING_FIRST_REVIEW
}

let logSeq = 0
export function createRefundLog(p: Omit<RefundOperationLog, 'id' | 'createdAt'>): RefundOperationLog {
  logSeq += 1
  return {
    ...p,
    id: `rfl-${Date.now()}-${logSeq}`,
    createdAt: new Date(),
  }
}

export function generateRefundApplicationId(): string {
  return `rfa-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
