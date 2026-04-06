import type { RefundOperationLog } from '@/types'

export const mockRefundOperationLogs: RefundOperationLog[] = [
  {
    id: 'rlog-seed-1',
    refundApplicationId: 'rfa-scn-reg-80-success',
    orderId: 'rfd-regular-80-c70',
    actorRole: 'OPERATOR',
    actorUserId: 'user-operator-1',
    actorName: '运营专员',
    action: '一审通过',
    detail: '用户原始申请 ¥1500；退款金额 ¥1500 → ¥1200；批注：一审调整金额',
    createdAt: new Date('2025-09-09T14:00:00'),
  },
  {
    id: 'rlog-seed-2',
    refundApplicationId: 'rfa-scn-reg-80-success',
    orderId: 'rfd-regular-80-c70',
    actorRole: 'OPERATOR',
    actorUserId: 'user-operator-1',
    actorName: '运营专员',
    action: '二审通过',
    detail: '用户原始申请 ¥1500；二审确认退款金额 ¥1200（相对申请单未调整）；已触发原路退回 ¥1200',
    createdAt: new Date('2025-09-09T15:00:00'),
  },
]
