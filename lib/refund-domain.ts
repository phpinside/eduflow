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

const round2 = (n: number) => Math.round(n * 100) / 100

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

function sumRedPacketRefundedAmount(
  orderId: string,
  applications: RefundApplication[]
): number {
  return applications
    .filter(
      (a) =>
        a.orderId === orderId &&
        a.refundKind === 'RED_PACKET' &&
        a.status === RefundApplicationStatus.REFUND_SUCCESS
    )
    .reduce((s, a) => s + Math.max(0, a.finalRefundAmount ?? a.requestedAmount ?? 0), 0)
}

function sumRedPacketPendingAmount(
  orderId: string,
  applications: RefundApplication[]
): number {
  return applications
    .filter(
      (a) =>
        a.orderId === orderId &&
        a.refundKind === 'RED_PACKET' &&
        (a.status === RefundApplicationStatus.PENDING_FIRST_REVIEW ||
          a.status === RefundApplicationStatus.PENDING_SECOND_REVIEW)
    )
    .reduce((s, a) => s + Math.max(0, a.requestedAmount ?? 0), 0)
}

function getRegularCoursePaidExcludingReward(order: Order): number {
  const txs = order.transactions?.filter((t) => t.type === 'INITIAL' || t.type === 'RENEWAL')
  if (txs?.length) {
    return txs.reduce((s, t) => s + t.amount, 0)
  }
  // 无交易拆分时回退为订单金额（历史兼容）
  return order.price
}

export function orderHasRedPacket(order: Order): boolean {
  return getRedPacketTotalPaid(order) > 0
}

export function getRegularRefundBreakdown(order: Order): RegularRefundBreakdown {
  return getRegularRefundBreakdownWithApplications(order, [])
}

export function getPaidCourseHours(order: Order): number {
  const fromTx = (order.transactions ?? [])
    .filter((t) => t.type === 'INITIAL' || t.type === 'RENEWAL')
    .reduce((s, t) => s + Math.max(0, t.hours || 0), 0)
  return fromTx > 0 ? fromTx : Math.max(0, order.totalHours || 0)
}

export function getCompletedHours(order: Order, applications: RefundApplication[] = []): number {
  const totalHours = getPaidCourseHours(order)
  const rawRemaining = Math.max(0, order.remainingHours ?? 0)
  const historicalRequestedHours = sumHistoricalRequestedHours(order.id, applications)
  return Math.max(0, totalHours - rawRemaining - historicalRequestedHours)
}

export function sumHistoricalRefundedAmount(orderId: string, applications: RefundApplication[]): number {
  return applications
    .filter((a) => a.orderId === orderId && a.status === RefundApplicationStatus.REFUND_SUCCESS)
    .reduce((s, a) => s + Math.max(0, a.finalRefundAmount ?? a.requestedAmount ?? 0), 0)
}

export function sumPendingFrozenAmount(orderId: string, applications: RefundApplication[]): number {
  return applications
    .filter(
      (a) =>
        a.orderId === orderId &&
        (a.status === RefundApplicationStatus.PENDING_FIRST_REVIEW ||
          a.status === RefundApplicationStatus.PENDING_SECOND_REVIEW)
    )
    .reduce((s, a) => s + Math.max(0, a.requestedAmount ?? 0), 0)
}

export function sumHistoricalRequestedHours(orderId: string, applications: RefundApplication[]): number {
  return applications
    .filter((a) => a.orderId === orderId && a.status === RefundApplicationStatus.REFUND_SUCCESS)
    .reduce((s, a) => s + Math.max(0, a.finalRefundHours ?? a.requestedHours ?? 0), 0)
}

export function sumPendingFrozenHours(orderId: string, applications: RefundApplication[]): number {
  return applications
    .filter(
      (a) =>
        a.orderId === orderId &&
        (a.status === RefundApplicationStatus.PENDING_FIRST_REVIEW ||
          a.status === RefundApplicationStatus.PENDING_SECOND_REVIEW)
    )
    .reduce((s, a) => s + Math.max(0, a.requestedHours ?? 0), 0)
}

export function getRegularRefundBreakdownWithApplications(
  order: Order,
  applications: RefundApplication[]
): RegularRefundBreakdown {
  const totalFee = getOrderTotalPaid(order)
  const regularCourseFee = getRegularCoursePaidExcludingReward(order)
  const totalHours = getPaidCourseHours(order)
  const frozenHours = sumPendingFrozenHours(order.id, applications)
  const historicalRequestedHours = sumHistoricalRequestedHours(order.id, applications)
  const rawRemaining = Math.max(0, order.remainingHours ?? 0)
  const remainingHours = Math.max(0, rawRemaining - frozenHours)
  const consumedHours = getCompletedHours(order, applications)
  const maxRefundableHours = Math.max(0, Math.floor(remainingHours))
  const pendingFrozenAmount = sumPendingFrozenAmount(order.id, applications)
  const historicalRefundedAmount = sumHistoricalRefundedAmount(order.id, applications)
  const nonRefundableAmount = Math.round(totalHours * NON_REFUNDABLE_PER_HOUR)
  // 正课/续课消耗按“非红包实缴”计算，红包不计入课时单价。
  const courseUnitPrice = totalHours > 0 ? regularCourseFee / totalHours : 0
  const consumedLessonFee = Math.max(
    0,
    round2((courseUnitPrice - NON_REFUNDABLE_PER_HOUR) * consumedHours)
  )
  const theoreticalMax = Math.max(0, round2(totalFee - nonRefundableAmount - consumedLessonFee))
  const maxRefundable = Math.max(0, round2(theoreticalMax - historicalRefundedAmount - pendingFrozenAmount))
  return {
    totalFee,
    regularPaidAmount: regularCourseFee,
    redPacketAmount: Math.max(0, totalFee - regularCourseFee),
    totalHours,
    consumedHours,
    remainingHours,
    frozenHours,
    historicalRequestedHours,
    maxRefundableHours,
    historicalRefundedAmount,
    pendingFrozenAmount,
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

/** 按当前订单状态与申请上的退费类型，计算可申请的金额上限（审核改价时以此校验） */
export function getRefundableCeilingForApplication(
  order: Order,
  refundKind: RefundKind,
  applications: RefundApplication[] = []
): { max: number; breakdown?: RegularRefundBreakdown } {
  return getComputedMaxForKind(order, refundKind, applications)
}

export function getComputedMaxForKind(
  order: Order,
  kind: RefundKind,
  applications: RefundApplication[] = []
): { max: number; breakdown?: RegularRefundBreakdown } {
  if (kind === 'RED_PACKET') {
    const redPaid = getRedPacketTotalPaid(order)
    const refunded = sumRedPacketRefundedAmount(order.id, applications)
    const pending = sumRedPacketPendingAmount(order.id, applications)
    return { max: Math.max(0, round2(redPaid - refunded - pending)) }
  }
  if (kind === 'TRIAL') {
    return { max: getTrialMaxRefundable(order) }
  }
  const b = getRegularRefundBreakdownWithApplications(order, applications)
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
  if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.CANCEL_REQUESTED) {
    return false
  }
  // 已退款但仍有剩余课时时，允许继续针对该订单发起后续退费。
  if (order.status === OrderStatus.REFUNDED && (order.remainingHours ?? 0) <= 0) return false
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
