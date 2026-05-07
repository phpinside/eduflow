/**
 * 操作日志模拟数据
 * 用于展示和测试操作日志功能
 */

import { OperationLog, OperationLogType, OperationAction } from '@/types/operation-log'

export const mockOperationLogs: OperationLog[] = [
  // ==================== 订单相关操作 ====================
  
  // 1. 订单创建
  {
    id: 'log-order-create-001',
    type: OperationLogType.ORDER,
    action: OperationAction.CREATE,
    operatorId: 'user-sales-001',
    operatorName: '张老师',
    operatorRole: 'SALES',
    targetId: 'order-20240115-001',
    targetType: 'Order',
    targetInfo: {
      studentName: '李小明',
      subject: '数学',
      grade: '初二',
      type: 'REGULAR'
    },
    afterState: {
      status: 'PENDING_PAYMENT',
      price: 3600,
      totalHours: 20
    },
    remark: '创建订单（待支付）',
    createdAt: new Date('2024-01-15T09:30:00'),
  },

  // 2. 模拟支付
  {
    id: 'log-order-payment-001',
    type: OperationLogType.ORDER,
    action: OperationAction.PAYMENT,
    operatorId: 'user-sales-001',
    operatorName: '张老师',
    operatorRole: 'SALES',
    targetId: 'order-20240115-001',
    targetType: 'Order',
    beforeState: { 
      status: 'PENDING_PAYMENT',
      isPaid: false 
    },
    afterState: { 
      status: 'PENDING_CS_REVIEW',
      isPaid: true 
    },
    remark: '完成模拟支付，进入客服审核',
    createdAt: new Date('2024-01-15T09:40:00'),
  },

  // 3. 客服审核通过
  {
    id: 'log-cs-approve-001',
    type: OperationLogType.ORDER,
    action: OperationAction.REVIEW_APPROVE,
    operatorId: 'user-operator-001',
    operatorName: '王运营',
    operatorRole: 'OPERATOR',
    targetId: 'order-20240115-001',
    targetType: 'Order',
    beforeState: { status: 'PENDING_CS_REVIEW' },
    afterState: { status: 'PENDING_FINANCE_REVIEW' },
    remark: '客服审核通过，凭证已上传',
    createdAt: new Date('2024-01-15T10:15:00'),
  },

  // 4. 财务审核通过
  {
    id: 'log-finance-approve-001',
    type: OperationLogType.ORDER,
    action: OperationAction.REVIEW_APPROVE,
    operatorId: 'user-operator-002',
    operatorName: '李财务',
    operatorRole: 'OPERATOR',
    targetId: 'order-20240115-001',
    targetType: 'Order',
    beforeState: { status: 'PENDING_FINANCE_REVIEW' },
    afterState: { 
      status: 'SCHEDULING',
      schedulingStartTime: new Date('2024-01-15T10:30:00')
    },
    remark: '财务审核通过，已进入排单流程',
    createdAt: new Date('2024-01-15T10:30:00'),
  },

  // 5. 分配老师
  {
    id: 'log-order-assign-001',
    type: OperationLogType.ORDER,
    action: OperationAction.ASSIGN,
    operatorId: 'user-manager-001',
    operatorName: '赵学管',
    operatorRole: 'MANAGER',
    targetId: 'order-20240115-001',
    targetType: 'Order',
    beforeState: { 
      status: 'PENDING',
      assignedTeacherId: undefined 
    },
    afterState: { 
      status: 'ASSIGNED',
      assignedTeacherId: 'user-tutor-001'
    },
    remark: '分配伴学教练：刘老师',
    createdAt: new Date('2024-01-15T14:20:00'),
  },

  // 7. 订单状态变更（重新进入接单中心）
  {
    id: 'log-order-status-change-001',
    type: OperationLogType.ORDER,
    action: OperationAction.STATUS_CHANGE,
    operatorId: 'user-operator-001',
    operatorName: '王运营',
    operatorRole: 'OPERATOR',
    targetId: 'order-20240115-001',
    targetType: 'Order',
    beforeState: { 
      status: 'ASSIGNED',
      assignedTeacherId: 'user-tutor-001'
    },
    afterState: { 
      status: 'PENDING',
      assignedTeacherId: undefined,
      transferredOutFrom: 'user-tutor-001'
    },
    remark: '重新进入接单中心，原老师已标记转走',
    createdAt: new Date('2024-01-16T09:00:00'),
  },

  // 8. 订单删除
  {
    id: 'log-order-delete-001',
    type: OperationLogType.ORDER,
    action: OperationAction.DELETE,
    operatorId: 'user-operator-001',
    operatorName: '王运营',
    operatorRole: 'OPERATOR',
    targetId: 'order-20240110-999',
    targetType: 'Order',
    targetInfo: {
      studentName: '测试学生',
      subject: '英语',
      grade: '初三'
    },
    beforeState: { status: 'PENDING_PAYMENT' },
    remark: '删除无效订单（待支付）',
    createdAt: new Date('2024-01-16T11:30:00'),
  },

  // ==================== 退费相关操作 ====================

  // 9. 退费申请
  {
    id: 'log-refund-apply-001',
    type: OperationLogType.REFUND,
    action: OperationAction.REFUND_APPLY,
    operatorId: 'user-sales-002',
    operatorName: '陈老师',
    operatorRole: 'SALES',
    targetId: 'refund-app-001',
    targetType: 'RefundApplication',
    targetInfo: { orderId: 'order-20240105-002' },
    afterState: {
      status: 'PENDING_FIRST_REVIEW',
      requestedAmount: 1800,
      requestedHours: 10
    },
    remark: '家长申请退费，剩余10课时',
    createdAt: new Date('2024-01-17T10:00:00'),
  },

  // 10. 退费一审通过
  {
    id: 'log-refund-first-approve-001',
    type: OperationLogType.REFUND,
    action: OperationAction.REFUND_FIRST_APPROVE,
    operatorId: 'user-operator-003',
    operatorName: '孙运营',
    operatorRole: 'OPERATOR',
    targetId: 'refund-app-001',
    targetType: 'RefundApplication',
    targetInfo: { orderId: 'order-20240105-002' },
    beforeState: { status: 'PENDING_FIRST_REVIEW' },
    afterState: { status: 'PENDING_SECOND_REVIEW' },
    remark: '一审通过，同意退费1800元',
    createdAt: new Date('2024-01-17T14:30:00'),
  },

  // 11. 退费二审通过并执行
  {
    id: 'log-refund-second-approve-001',
    type: OperationLogType.REFUND,
    action: OperationAction.REFUND_SECOND_APPROVE,
    operatorId: 'user-operator-004',
    operatorName: '周主管',
    operatorRole: 'OPERATOR',
    targetId: 'refund-app-001',
    targetType: 'RefundApplication',
    targetInfo: { orderId: 'order-20240105-002' },
    beforeState: { status: 'PENDING_SECOND_REVIEW' },
    afterState: { 
      status: 'REFUND_SUCCESS',
      finalRefundAmount: 1800,
      executionStatus: 'SUCCESS'
    },
    remark: '二审通过，退款已执行成功',
    createdAt: new Date('2024-01-18T09:15:00'),
  },

  // 12. 退费一审驳回
  {
    id: 'log-refund-first-reject-001',
    type: OperationLogType.REFUND,
    action: OperationAction.REFUND_FIRST_REJECT,
    operatorId: 'user-operator-003',
    operatorName: '孙运营',
    operatorRole: 'OPERATOR',
    targetId: 'refund-app-002',
    targetType: 'RefundApplication',
    targetInfo: { orderId: 'order-20240108-003' },
    beforeState: { status: 'PENDING_FIRST_REVIEW' },
    afterState: { status: 'FIRST_REJECTED' },
    remark: '不符合退费条件，课时已消耗超过50%',
    createdAt: new Date('2024-01-18T11:00:00'),
  },

  // 13. 撤回一审通过
  {
    id: 'log-refund-withdraw-001',
    type: OperationLogType.REFUND,
    action: OperationAction.REFUND_WITHDRAW,
    operatorId: 'user-operator-003',
    operatorName: '孙运营',
    operatorRole: 'OPERATOR',
    targetId: 'refund-app-003',
    targetType: 'RefundApplication',
    targetInfo: { orderId: 'order-20240110-004' },
    beforeState: { status: 'PENDING_SECOND_REVIEW' },
    afterState: { status: 'PENDING_FIRST_REVIEW' },
    remark: '发现计算错误，撤回一审通过重新审核',
    createdAt: new Date('2024-01-18T15:45:00'),
  },

  // ==================== 用户管理操作 ====================

  // 14. 用户信息更新
  {
    id: 'log-user-update-001',
    type: OperationLogType.USER,
    action: OperationAction.USER_UPDATE,
    operatorId: 'user-admin-001',
    operatorName: '管理员',
    operatorRole: 'ADMIN',
    targetId: 'user-sales-003',
    targetType: 'User',
    beforeState: {
      name: '刘老师',
      phone: '13800138001',
      minRechargeHours: 10
    },
    afterState: {
      name: '刘老师',
      phone: '13800138002',
      minRechargeHours: 15
    },
    remark: '修改手机号和最小起充课时数',
    createdAt: new Date('2024-01-19T09:00:00'),
  },

  // 15. 用户角色变更
  {
    id: 'log-user-role-change-001',
    type: OperationLogType.USER,
    action: OperationAction.USER_ROLE_CHANGE,
    operatorId: 'user-admin-001',
    operatorName: '管理员',
    operatorRole: 'ADMIN',
    targetId: 'user-tutor-005',
    targetType: 'User',
    beforeState: { roles: ['TUTOR'] },
    afterState: { roles: ['TUTOR', 'MANAGER'] },
    remark: '升级为学管，增加管理权限',
    createdAt: new Date('2024-01-19T10:30:00'),
  },

  // 16. 用户审核通过
  {
    id: 'log-user-approve-001',
    type: OperationLogType.USER,
    action: OperationAction.USER_APPROVE,
    operatorId: 'user-admin-001',
    operatorName: '管理员',
    operatorRole: 'ADMIN',
    targetId: 'user-tutor-010',
    targetType: 'User',
    beforeState: { status: 'PENDING' },
    afterState: { status: 'ACTIVE' },
    remark: '新伴学教练审核通过',
    createdAt: new Date('2024-01-19T14:00:00'),
  },

  // ==================== 财务相关操作 ====================

  // 17. G账号充值状态变更
  {
    id: 'log-finance-recharge-001',
    type: OperationLogType.FINANCE,
    action: OperationAction.RECHARGE_STATUS_CHANGE,
    operatorId: 'user-operator-001',
    operatorName: '王运营',
    operatorRole: 'OPERATOR',
    targetId: 'fin-record-20240120-001',
    targetType: 'FinancialRecord',
    targetInfo: { orderId: 'order-20240115-001' },
    beforeState: { gAccountRechargeStatus: '待充值' },
    afterState: { gAccountRechargeStatus: '已充值' },
    remark: 'G账号充值已完成，课时数20',
    createdAt: new Date('2024-01-20T09:30:00'),
  },

  // 18. 上传充值凭证
  {
    id: 'log-finance-upload-001',
    type: OperationLogType.FINANCE,
    action: OperationAction.UPLOAD_VOUCHER,
    operatorId: 'user-operator-001',
    operatorName: '王运营',
    operatorRole: 'OPERATOR',
    targetId: 'fin-record-20240120-002',
    targetType: 'FinancialRecord',
    targetInfo: { 
      orderId: 'order-20240118-005',
      voucherCount: 2
    },
    afterState: {
      rechargeVouchers: ['data:image/png;base64,...', 'data:image/png;base64,...'],
      rechargeRemark: '已上传转账截图和充值成功截图'
    },
    remark: '上传2张充值凭证图片',
    createdAt: new Date('2024-01-20T10:15:00'),
  },

  // 19. 另一次充值状态变更
  {
    id: 'log-finance-recharge-002',
    type: OperationLogType.FINANCE,
    action: OperationAction.RECHARGE_STATUS_CHANGE,
    operatorId: 'user-operator-002',
    operatorName: '李财务',
    operatorRole: 'OPERATOR',
    targetId: 'fin-record-20240120-003',
    targetType: 'FinancialRecord',
    targetInfo: { orderId: 'order-20240119-006' },
    beforeState: { gAccountRechargeStatus: '待充值' },
    afterState: { gAccountRechargeStatus: '已充值' },
    remark: '批量充值完成，共30课时',
    createdAt: new Date('2024-01-20T11:00:00'),
  },

  // ==================== 学习规划书操作 ====================

  // 20. 规划书审核通过
  {
    id: 'log-study-plan-approve-001',
    type: OperationLogType.STUDY_PLAN,
    action: OperationAction.REVIEW_APPROVE,
    operatorId: 'user-manager-001',
    operatorName: '赵学管',
    operatorRole: 'MANAGER',
    targetId: 'plan-20240121-001',
    targetType: 'StudyPlan',
    targetInfo: {
      orderId: 'order-20240115-001',
      studentName: '李小明',
      subject: '数学'
    },
    beforeState: { status: 'PENDING_REVIEW' },
    afterState: { status: 'REVIEWED' },
    remark: '学习规划书审核通过，方案合理',
    createdAt: new Date('2024-01-21T09:00:00'),
  },

  // 21. 规划书审核驳回
  {
    id: 'log-study-plan-reject-001',
    type: OperationLogType.STUDY_PLAN,
    action: OperationAction.REVIEW_REJECT,
    operatorId: 'user-manager-001',
    operatorName: '赵学管',
    operatorRole: 'MANAGER',
    targetId: 'plan-20240121-002',
    targetType: 'StudyPlan',
    targetInfo: {
      orderId: 'order-20240116-002',
      studentName: '王小华',
      subject: '英语'
    },
    beforeState: { status: 'PENDING_REVIEW' },
    afterState: { status: 'REJECTED' },
    remark: '规划内容过于简单，需要补充详细的学习目标和进度安排',
    createdAt: new Date('2024-01-21T10:30:00'),
  },

  // ==================== 更多订单操作示例 ====================

  // 22. 订单编辑
  {
    id: 'log-order-update-001',
    type: OperationLogType.ORDER,
    action: OperationAction.UPDATE,
    operatorId: 'user-operator-001',
    operatorName: '王运营',
    operatorRole: 'OPERATOR',
    targetId: 'order-20240122-010',
    targetType: 'Order',
    beforeState: {
      studentName: '张三',
      parentPhone: '13900139001',
      address: '北京市朝阳区xxx'
    },
    afterState: {
      studentName: '张三',
      parentPhone: '13900139002',
      address: '北京市海淀区xxx'
    },
    remark: '修正家长电话和地址信息',
    createdAt: new Date('2024-01-22T09:15:00'),
  },

  // 23. 客服审核驳回
  {
    id: 'log-cs-reject-001',
    type: OperationLogType.ORDER,
    action: OperationAction.REVIEW_REJECT,
    operatorId: 'user-operator-001',
    operatorName: '王运营',
    operatorRole: 'OPERATOR',
    targetId: 'order-20240122-011',
    targetType: 'Order',
    beforeState: { status: 'PENDING_CS_REVIEW' },
    afterState: { status: 'PENDING_PAYMENT' },
    remark: '支付凭证不清晰，请重新上传',
    createdAt: new Date('2024-01-22T11:00:00'),
  },

  // 24. 财务审核驳回
  {
    id: 'log-finance-reject-001',
    type: OperationLogType.ORDER,
    action: OperationAction.REVIEW_REJECT,
    operatorId: 'user-operator-002',
    operatorName: '李财务',
    operatorRole: 'OPERATOR',
    targetId: 'order-20240122-012',
    targetType: 'Order',
    beforeState: { status: 'PENDING_FINANCE_REVIEW' },
    afterState: { status: 'PENDING_CS_REVIEW' },
    remark: '金额与凭证不符，退回客服重新核实',
    createdAt: new Date('2024-01-22T14:30:00'),
  },

  // 25. 最近的充值操作
  {
    id: 'log-finance-recharge-003',
    type: OperationLogType.FINANCE,
    action: OperationAction.RECHARGE_STATUS_CHANGE,
    operatorId: 'user-operator-001',
    operatorName: '王运营',
    operatorRole: 'OPERATOR',
    targetId: 'fin-record-20240123-010',
    targetType: 'FinancialRecord',
    targetInfo: { orderId: 'order-20240122-015' },
    beforeState: { gAccountRechargeStatus: '待充值' },
    afterState: { gAccountRechargeStatus: '已充值' },
    remark: '今日第5笔充值，G账号G20240122XXX，20课时',
    createdAt: new Date('2024-01-23T16:45:00'),
  },
]
