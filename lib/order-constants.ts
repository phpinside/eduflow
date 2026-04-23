/**
 * 订单相关常量配置
 */

// 排单中超时时长的配置（小时）
export const SCHEDULING_TIMEOUT_HOURS = 3

// 状态映射（中文显示）
export const ORDER_STATUS_MAP: Record<string, string> = {
  DRAFT: '草稿订单',
  PENDING_PAYMENT: '待支付',
  PENDING_CS_REVIEW: '待客服审核',
  PENDING_FINANCE_REVIEW: '待财务审核',
  SCHEDULING: '排单中',
  PENDING: '待接单',
  ASSIGNED: '已分配',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  CANCEL_REQUESTED: '取消申请中',
  REFUNDED: '已退款',
}

// 状态颜色映射（用于 Badge 组件）
export const ORDER_STATUS_COLOR_MAP: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  PENDING_PAYMENT: "secondary",
  PENDING_CS_REVIEW: "default",
  PENDING_FINANCE_REVIEW: "default",
  SCHEDULING: "default",
  PENDING: "secondary",
  ASSIGNED: "default",
  IN_PROGRESS: "default",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  CANCEL_REQUESTED: "destructive",
  REFUNDED: "outline",
}
