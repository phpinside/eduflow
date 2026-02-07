import { FinancialRecord } from '@/types'
import { mockUsers } from './users'

// 精简财务记录数据：首次充值5条、续费5条、转正奖励5条、退款5条
export const mockFinancialRecords: FinancialRecord[] = []

const salesPerson1 = mockUsers.find(u => u.id === 'user-sales-1')
const salesPerson2 = mockUsers.find(u => u.id === 'user-sales-2')
const salesPerson3 = mockUsers.find(u => u.id === 'user-sales-3')
const salesPerson4 = mockUsers.find(u => u.id === 'user-sales-4')
const salesPerson5 = mockUsers.find(u => u.id === 'user-sales-5')

// ============ 首次充值记录（5条）============
mockFinancialRecords.push(
  {
    id: 'fin-initial-1',
    type: 'RECHARGE',
    orderId: 'ord-sales1-4',
    amount: 6000,
    salesPersonId: 'user-sales-1',
    salesPersonName: salesPerson1?.name,
    salesPersonPhone: salesPerson1?.phone,
    remarks: '首次下单',
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000)
  },
  {
    id: 'fin-initial-2',
    type: 'RECHARGE',
    orderId: 'ord-sales2-1',
    amount: 5000,
    salesPersonId: 'user-sales-2',
    salesPersonName: salesPerson2?.name,
    salesPersonPhone: salesPerson2?.phone,
    remarks: '首次下单',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000)
  },
  {
    id: 'fin-initial-3',
    type: 'RECHARGE',
    orderId: 'ord-sales3-1',
    amount: 13500,
    salesPersonId: 'user-sales-3',
    salesPersonName: salesPerson3?.name,
    salesPersonPhone: salesPerson3?.phone,
    remarks: '首次下单',
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000)
  },
  {
    id: 'fin-initial-4',
    type: 'RECHARGE',
    orderId: 'ord-sales4-1',
    amount: 16000,
    salesPersonId: 'user-sales-4',
    salesPersonName: salesPerson4?.name,
    salesPersonPhone: salesPerson4?.phone,
    remarks: '首次下单',
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000)
  },
  {
    id: 'fin-initial-5',
    type: 'RECHARGE',
    orderId: 'ord-sales5-1',
    amount: 14000,
    salesPersonId: 'user-sales-5',
    salesPersonName: salesPerson5?.name,
    salesPersonPhone: salesPerson5?.phone,
    remarks: '首次下单',
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000)
  }
)

// ============ 续费记录（5条）============
mockFinancialRecords.push(
  {
    id: 'fin-renewal-1',
    type: 'RECHARGE',
    orderId: 'ord-new-today-2',
    amount: 12000,
    salesPersonId: 'user-sales-1',
    salesPersonName: salesPerson1?.name,
    salesPersonPhone: salesPerson1?.phone,
    remarks: '续费',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
  },
  {
    id: 'fin-renewal-2',
    type: 'RECHARGE',
    orderId: 'ord-sales2-2',
    amount: 9800,
    salesPersonId: 'user-sales-2',
    salesPersonName: salesPerson2?.name,
    salesPersonPhone: salesPerson2?.phone,
    remarks: '续费',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
  },
  {
    id: 'fin-renewal-3',
    type: 'RECHARGE',
    orderId: 'ord-sales3-2',
    amount: 8800,
    salesPersonId: 'user-sales-3',
    salesPersonName: salesPerson3?.name,
    salesPersonPhone: salesPerson3?.phone,
    remarks: '续费',
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
  },
  {
    id: 'fin-renewal-4',
    type: 'RECHARGE',
    orderId: 'ord-sales4-2',
    amount: 9000,
    salesPersonId: 'user-sales-4',
    salesPersonName: salesPerson4?.name,
    salesPersonPhone: salesPerson4?.phone,
    remarks: '续费',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
  },
  {
    id: 'fin-renewal-5',
    type: 'RECHARGE',
    orderId: 'ord-sales5-2',
    amount: 6800,
    salesPersonId: 'user-sales-5',
    salesPersonName: salesPerson5?.name,
    salesPersonPhone: salesPerson5?.phone,
    remarks: '续费',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000)
  }
)

// ============ 转正奖励记录（5条）============
mockFinancialRecords.push(
  {
    id: 'fin-reward-1',
    type: 'RECHARGE',
    orderId: 'ord-reward-1',
    amount: 300,
    salesPersonId: 'user-sales-1',
    salesPersonName: salesPerson1?.name,
    salesPersonPhone: salesPerson1?.phone,
    remarks: '转正奖励',
    createdAt: new Date(Date.now() - 0.5 * 60 * 60 * 1000)
  },
  {
    id: 'fin-reward-2',
    type: 'RECHARGE',
    orderId: 'ord-reward-2',
    amount: 400,
    salesPersonId: 'user-sales-2',
    salesPersonName: salesPerson2?.name,
    salesPersonPhone: salesPerson2?.phone,
    remarks: '转正奖励',
    createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
  },
  {
    id: 'fin-reward-3',
    type: 'RECHARGE',
    orderId: 'ord-reward-3',
    amount: 350,
    salesPersonId: 'user-sales-3',
    salesPersonName: salesPerson3?.name,
    salesPersonPhone: salesPerson3?.phone,
    remarks: '转正奖励',
    createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000)
  },
  {
    id: 'fin-reward-4',
    type: 'RECHARGE',
    orderId: 'ord-reward-4',
    amount: 450,
    salesPersonId: 'user-sales-4',
    salesPersonName: salesPerson4?.name,
    salesPersonPhone: salesPerson4?.phone,
    remarks: '转正奖励',
    createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000)
  },
  {
    id: 'fin-reward-5',
    type: 'RECHARGE',
    orderId: 'ord-reward-5',
    amount: 250,
    salesPersonId: 'user-sales-5',
    salesPersonName: salesPerson5?.name,
    salesPersonPhone: salesPerson5?.phone,
    remarks: '转正奖励',
    createdAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000)
  }
)

// ============ 退款记录（5条）============
mockFinancialRecords.push(
  {
    id: 'fin-refund-1',
    type: 'REFUND',
    orderId: 'ord-refund-1',
    amount: -1500,
    salesPersonId: 'user-sales-1',
    salesPersonName: salesPerson1?.name,
    salesPersonPhone: salesPerson1?.phone,
    remarks: '课程不满意申请退款',
    createdAt: new Date(Date.now() - 0.8 * 60 * 60 * 1000)
  },
  {
    id: 'fin-refund-2',
    type: 'REFUND',
    orderId: 'ord-sales2-4',
    amount: -2000,
    salesPersonId: 'user-sales-2',
    salesPersonName: salesPerson2?.name,
    salesPersonPhone: salesPerson2?.phone,
    remarks: '时间冲突，申请退款',
    createdAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000)
  },
  {
    id: 'fin-refund-3',
    type: 'REFUND',
    orderId: 'ord-sales3-5',
    amount: -3500,
    salesPersonId: 'user-sales-3',
    salesPersonName: salesPerson3?.name,
    salesPersonPhone: salesPerson3?.phone,
    remarks: '搬家换城市，申请退费',
    createdAt: new Date(Date.now() - 2.8 * 60 * 60 * 1000)
  },
  {
    id: 'fin-refund-4',
    type: 'REFUND',
    orderId: 'ord-sales4-5',
    amount: -2500,
    salesPersonId: 'user-sales-4',
    salesPersonName: salesPerson4?.name,
    salesPersonPhone: salesPerson4?.phone,
    remarks: '学员出国留学，提前退费',
    createdAt: new Date(Date.now() - 3.8 * 60 * 60 * 1000)
  },
  {
    id: 'fin-refund-5',
    type: 'REFUND',
    orderId: 'ord-sales5-4',
    amount: -1800,
    salesPersonId: 'user-sales-5',
    salesPersonName: salesPerson5?.name,
    salesPersonPhone: salesPerson5?.phone,
    remarks: '老师授课风格不匹配',
    createdAt: new Date(Date.now() - 4.8 * 60 * 60 * 1000)
  }
)

// 按时间倒序排列（最新的在前面）
mockFinancialRecords.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
