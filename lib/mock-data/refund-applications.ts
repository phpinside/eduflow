import { RefundApplicationStatus, type RefundApplication } from '@/types'

/** 与 mockOrders 中 refund-demo-1 配套的演示退费申请（一审待审） */
export const mockRefundApplications: RefundApplication[] = [
  {
    id: 'rfa-demo-seed-1',
    orderId: 'refund-demo-1',
    applicantUserId: 'sales-1',
    applicantName: '演示招生',
    refundKind: 'REGULAR',
    status: RefundApplicationStatus.PENDING_FIRST_REVIEW,
    reason: '学生跟不上进度，家长要求换机构',
    requestedAmount: 2700,
    computedMaxAtApply: 2700,
    breakdown: {
      totalFee: 4000,
      totalHours: 20,
      consumedHours: 5,
      remainingHours: 15,
      nonRefundableAmount: 400,
      consumedLessonFee: 900,
      maxRefundable: 2700,
    },
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
]
