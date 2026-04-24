/**
 * 操作日志记录工具函数
 * 用于在各个业务模块中便捷地记录操作日志
 */

import { OperationLogType, OperationAction } from '@/types/operation-log'
import { addOperationLog } from '@/lib/storage'
import type { User } from '@/types'

/**
 * 记录订单相关操作日志
 */
export function logOrderOperation(params: {
  action: OperationAction
  operator: Pick<User, 'id' | 'name' | 'roles'>
  orderId: string
  beforeState?: Record<string, any>
  afterState?: Record<string, any>
  remark?: string
  orderInfo?: Record<string, any>
}) {
  return addOperationLog({
    type: OperationLogType.ORDER,
    action: params.action,
    operatorId: params.operator.id,
    operatorName: params.operator.name,
    operatorRole: params.operator.roles[0] || '',
    targetId: params.orderId,
    targetType: 'Order',
    targetInfo: params.orderInfo,
    beforeState: params.beforeState,
    afterState: params.afterState,
    remark: params.remark,
  })
}

/**
 * 记录退费相关操作日志
 */
export function logRefundOperation(params: {
  action: OperationAction
  operator: Pick<User, 'id' | 'name' | 'roles'>
  refundApplicationId: string
  orderId: string
  beforeState?: Record<string, any>
  afterState?: Record<string, any>
  remark?: string
}) {
  return addOperationLog({
    type: OperationLogType.REFUND,
    action: params.action,
    operatorId: params.operator.id,
    operatorName: params.operator.name,
    operatorRole: params.operator.roles[0] || '',
    targetId: params.refundApplicationId,
    targetType: 'RefundApplication',
    targetInfo: { orderId: params.orderId },
    beforeState: params.beforeState,
    afterState: params.afterState,
    remark: params.remark,
  })
}

/**
 * 记录用户管理操作日志
 */
export function logUserOperation(params: {
  action: OperationAction
  operator: Pick<User, 'id' | 'name' | 'roles'>
  userId: string
  beforeState?: Record<string, any>
  afterState?: Record<string, any>
  remark?: string
}) {
  return addOperationLog({
    type: OperationLogType.USER,
    action: params.action,
    operatorId: params.operator.id,
    operatorName: params.operator.name,
    operatorRole: params.operator.roles[0] || '',
    targetId: params.userId,
    targetType: 'User',
    beforeState: params.beforeState,
    afterState: params.afterState,
    remark: params.remark,
  })
}

/**
 * 记录财务相关操作日志
 */
export function logFinanceOperation(params: {
  action: OperationAction
  operator: Pick<User, 'id' | 'name' | 'roles'>
  recordId: string
  orderId?: string
  beforeState?: Record<string, any>
  afterState?: Record<string, any>
  remark?: string
}) {
  return addOperationLog({
    type: OperationLogType.FINANCE,
    action: params.action,
    operatorId: params.operator.id,
    operatorName: params.operator.name,
    operatorRole: params.operator.roles[0] || '',
    targetId: params.recordId,
    targetType: 'FinancialRecord',
    targetInfo: params.orderId ? { orderId: params.orderId } : undefined,
    beforeState: params.beforeState,
    afterState: params.afterState,
    remark: params.remark,
  })
}
