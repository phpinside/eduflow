import type { PriceRule } from '@/lib/mock-data/price-settings'

export const DINGBANXUE_FEE_PER_HOUR = 20

export type ConversionRewardPaidMode = 'OFFLINE' | 'BUNDLED'

export type PricingInput = {
  subject?: string
  grade?: string
  totalHours: number
  /** 正课课时费用（不含转正红包、不含鼎伴学代收） */
  courseFee: number

  /** 是否来自试课转正（用于展示/默认值），不影响计算 */
  fromTrialConversion?: boolean

  /** 转正红包金额（从价格配置 trialReward 读取） */
  conversionRewardFee: number
  includeConversionRewardInPayment: boolean

  /** 鼎伴学代收费用是否适用（一般为 true），以及是否并入本次支付 */
  dingbanxueFeeApplicable: boolean
  includeDingbanxueFeeInPayment: boolean
}

export type PricingBreakdown = {
  courseFee: number
  conversionRewardFee: number
  dingbanxueFee: number
  payableConversionRewardFee: number
  payableDingbanxueFee: number
  totalPayable: number
}

export function resolveTrialRewardFromRules(
  rules: PriceRule[],
  subject: string | undefined,
  grade: string | undefined
): number {
  if (!subject || !grade) return 0
  const rule = rules.find((r) => r.isEnabled && r.subject === subject && r.grade === grade)
  return Math.max(0, Number(rule?.trialReward ?? 0) || 0)
}

export function computePricingBreakdown(input: PricingInput): PricingBreakdown {
  const safeCourse = Math.max(0, Number(input.courseFee) || 0)
  const safeReward = Math.max(0, Number(input.conversionRewardFee) || 0)
  const hours = Math.max(0, Number(input.totalHours) || 0)
  const dingbanxueFee = input.dingbanxueFeeApplicable ? Math.round(hours * DINGBANXUE_FEE_PER_HOUR) : 0

  const payableReward = input.includeConversionRewardInPayment ? safeReward : 0
  const payableDing = input.includeDingbanxueFeeInPayment ? dingbanxueFee : 0

  return {
    courseFee: safeCourse,
    conversionRewardFee: safeReward,
    dingbanxueFee,
    payableConversionRewardFee: payableReward,
    payableDingbanxueFee: payableDing,
    totalPayable: Math.max(0, safeCourse + payableReward + payableDing),
  }
}

