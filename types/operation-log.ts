/**
 * 操作日志类型定义
 */

/** 操作日志类型分类 */
export enum OperationLogType {
  ORDER = 'ORDER',               // 订单操作
  REFUND = 'REFUND',             // 退费操作
  USER = 'USER',                 // 用户管理
  STUDY_PLAN = 'STUDY_PLAN',     // 学习规划书
  FINANCE = 'FINANCE',           // 财务操作
  SYSTEM = 'SYSTEM',             // 系统操作
}

/** 操作动作类型 */
export enum OperationAction {
  // 订单相关
  CREATE = 'CREATE',                     // 创建
  UPDATE = 'UPDATE',                     // 更新
  DELETE = 'DELETE',                     // 删除
  STATUS_CHANGE = 'STATUS_CHANGE',       // 状态变更
  ASSIGN = 'ASSIGN',                     // 分配
  REVIEW_APPROVE = 'REVIEW_APPROVE',     // 审核通过
  REVIEW_REJECT = 'REVIEW_REJECT',       // 审核驳回
  PAYMENT = 'PAYMENT',                   // 支付
  
  // 退费相关
  REFUND_APPLY = 'REFUND_APPLY',         // 退费申请
  REFUND_FIRST_APPROVE = 'REFUND_FIRST_APPROVE',     // 一审通过
  REFUND_FIRST_REJECT = 'REFUND_FIRST_REJECT',       // 一审驳回
  REFUND_SECOND_APPROVE = 'REFUND_SECOND_APPROVE',   // 二审通过
  REFUND_SECOND_REJECT = 'REFUND_SECOND_REJECT',     // 二审驳回
  REFUND_WITHDRAW = 'REFUND_WITHDRAW',   // 撤回
  REFUND_EXECUTE = 'REFUND_EXECUTE',     // 执行退费
  
  // 用户相关
  USER_CREATE = 'USER_CREATE',           // 创建用户
  USER_UPDATE = 'USER_UPDATE',           // 更新用户
  USER_APPROVE = 'USER_APPROVE',         // 审核通过
  USER_REJECT = 'USER_REJECT',           // 审核驳回
  USER_ROLE_CHANGE = 'USER_ROLE_CHANGE', // 角色变更
  
  // 财务相关
  RECHARGE_STATUS_CHANGE = 'RECHARGE_STATUS_CHANGE',  // 充值状态变更
  UPLOAD_VOUCHER = 'UPLOAD_VOUCHER',     // 上传凭证
  FINANCE_REVIEW_APPROVE = 'FINANCE_REVIEW_APPROVE',   // 财务审核通过（含课时调整）
  FINANCE_REVIEW_REJECT = 'FINANCE_REVIEW_REJECT',     // 财务审核驳回
  
  // 学生管理相关
  STUDENT_HOURS_ADJUST = 'STUDENT_HOURS_ADJUST',       // 学生课时调整
}

/** 操作日志记录 */
export interface OperationLog {
  id: string
  type: OperationLogType                // 操作类型
  action: OperationAction               // 操作动作
  operatorId: string                    // 操作人ID
  operatorName: string                  // 操作人姓名
  operatorRole: string                  // 操作人角色
  targetId: string                      // 操作对象ID（订单ID、用户ID等）
  targetType: string                    // 操作对象类型（Order、User等）
  targetInfo?: Record<string, any>      // 操作对象关键信息快照
  beforeState?: Record<string, any>     // 操作前状态
  afterState?: Record<string, any>      // 操作后状态
  remark?: string                       // 备注说明
  ipAddress?: string                    // IP地址（预留）
  userAgent?: string                    // 浏览器信息（预留）
  createdAt: Date                       // 操作时间
}

/** 操作日志筛选条件 */
export interface OperationLogFilter {
  type?: OperationLogType | 'all'
  action?: OperationAction | 'all'
  operatorId?: string
  operatorName?: string
  targetId?: string
  dateRange?: {
    start: Date | null
    end: Date | null
  }
  keyword?: string  // 关键词搜索
}
