import { Order, OrderStatus, OrderType, TransferOperationLog } from '@/types'
import { getLatestUnitPriceByGrade } from '@/lib/course-pricing'
import type { PriceRule } from '@/lib/mock-data/price-settings'

export const DINGBANXUE_PER_HOUR = 20

const round2 = (n: number) => Math.round(n * 100) / 100

export function getNetUnitPrice(grade: string, priceRules?: PriceRule[], subject?: string): number {
  if (priceRules && subject) {
    const rule = priceRules.find(r => r.isEnabled && r.subject === subject && r.grade === grade)
    if (rule) return rule.regularPrice - DINGBANXUE_PER_HOUR
  }
  return getLatestUnitPriceByGrade(grade) - DINGBANXUE_PER_HOUR
}

export function getGrossUnitPrice(grade: string, priceRules?: PriceRule[], subject?: string): number {
  if (priceRules && subject) {
    const rule = priceRules.find(r => r.isEnabled && r.subject === subject && r.grade === grade)
    if (rule) return rule.regularPrice
  }
  return getLatestUnitPriceByGrade(grade)
}

export interface TransferCalculation {
  sourceNetUnitPrice: number
  sourceGrossUnitPrice: number
  targetNetUnitPrice: number
  targetGrossUnitPrice: number
  sourceValue: number
  targetReceivedHours: number
  targetValue: number
  priceDifference: number
}

export function calculateTransfer(
  sourceGrade: string,
  sourceSubject: string,
  targetGrade: string,
  targetSubject: string,
  transferHours: number,
  priceRules?: PriceRule[],
): TransferCalculation {
  const sourceNet = getNetUnitPrice(sourceGrade, priceRules, sourceSubject)
  const sourceGross = getGrossUnitPrice(sourceGrade, priceRules, sourceSubject)
  const targetNet = getNetUnitPrice(targetGrade, priceRules, targetSubject)
  const targetGross = getGrossUnitPrice(targetGrade, priceRules, targetSubject)

  const sourceValue = round2(transferHours * sourceNet)

  const rawTargetHours = targetNet > 0 ? sourceValue / targetNet : 0
  const targetReceivedHours = Math.max(0, Math.floor(rawTargetHours * 2) / 2)

  const targetValue = round2(targetReceivedHours * targetNet)
  const priceDifference = round2(sourceValue - targetValue)

  return {
    sourceNetUnitPrice: sourceNet,
    sourceGrossUnitPrice: sourceGross,
    targetNetUnitPrice: targetNet,
    targetGrossUnitPrice: targetGross,
    sourceValue,
    targetReceivedHours,
    targetValue,
    priceDifference,
  }
}

export function isEligibleSourceOrder(order: Order): boolean {
  if (order.type !== OrderType.REGULAR) return false
  if (order.status !== OrderStatus.IN_PROGRESS && order.status !== OrderStatus.ASSIGNED) return false
  if ((order.remainingHours ?? 0) <= 0) return false
  if (order.refundFreezeActive) return false
  return true
}

export function isEligibleTargetOrder(order: Order): boolean {
  if (order.type !== OrderType.REGULAR) return false
  if (order.status !== OrderStatus.IN_PROGRESS && order.status !== OrderStatus.ASSIGNED) return false
  if (order.refundFreezeActive) return false
  return true
}

export function generateTransferId(): string {
  return `ct-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

let transferLogSeq = 0
export function createTransferLog(p: Omit<TransferOperationLog, 'id' | 'createdAt'>): TransferOperationLog {
  transferLogSeq += 1
  return {
    ...p,
    id: `tol-${Date.now()}-${transferLogSeq}`,
    createdAt: new Date(),
  }
}
