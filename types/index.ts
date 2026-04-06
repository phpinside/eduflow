export enum Role {
  SALES = 'SALES',           // 招生老师
  TUTOR = 'TUTOR',           // 伴学教练
  MANAGER = 'MANAGER',       // 学管
  OPERATOR = 'OPERATOR',     // 运营人员
  ADMIN = 'ADMIN'            // 管理员
}

export enum UserStatus {
  PENDING = 'PENDING',       // 待审核
  APPROVED = 'APPROVED',     // 已审核
  REJECTED = 'REJECTED'      // 已驳回
}

export interface User {
  id: string
  phone: string
  name: string
  password?: string          // 用户密码
  roles: Role[]              // 支持多角色
  status?: UserStatus        // 审核状态
  rejectReason?: string      // 驳回原因
  avatar?: string
  wechatQrCode?: string      // 个人微信二维码图片
  campusName?: string        // 9800校区名称
  campusAccount?: string     // 9800校区账号
  /** 正式支付功能（招生老师）；未设置时视为开启 */
  formalPaymentEnabled?: boolean
  /** 最小起充课时数（招生老师）；未设置时默认 10；最小 0.5，须为 0.5 的倍数 */
  minRechargeHours?: number
  recommendedForTrial?: boolean // 系统推荐试课
  managerId?: string         // 归属的学管ID（伴学教练专用）
  managerName?: string       // 归属的学管姓名（冗余字段，便于展示）
  createdAt: Date
  updatedAt: Date
}

export enum OrderType {
  TRIAL = 'TRIAL',           // 试课
  REGULAR = 'REGULAR'        // 正课
}

export enum OrderStatus {
  PENDING = 'PENDING',       // 待接单
  ASSIGNED = 'ASSIGNED',     // 已分配
  IN_PROGRESS = 'IN_PROGRESS', // 进行中
  COMPLETED = 'COMPLETED',   // 已完成
  CANCELLED = 'CANCELLED',   // 已取消
  CANCEL_REQUESTED = 'CANCEL_REQUESTED', // 取消申请中（历史兼容，新退费请用 RefundApplication）
  REFUNDED = 'REFUNDED'      // 已退款（二审通过并完成原路退回）
}

export interface Order {
  id: string
  type: OrderType
  status: OrderStatus
  studentId: string
  salesPersonId: string      // 招生老师
  subject: string            // 科目
  grade: string              // 年级
  totalHours: number         // 总课时
  remainingHours: number     // 剩余课时
  scheduledAt?: Date         // 预约时间
  assignedTeacherId?: string // 伴学教练
  applicantIds?: string[]    // 申请接课的老师
  managerId?: string         // 学管
  price: number              // 订单金额
  createdAt: Date
  updatedAt: Date
  
  // Extended fields for Regular Course
  lastExamScore?: string
  examMaxScore?: string
  textbookVersion?: string
  schoolProgress?: string        // 校内学习进度
  otherSubjectsAvgScore?: string // 其它科平均成绩
  previousTutoringTypes?: string // 补过什么类型的课
  campusName?: string
  campusAccount?: string
  studentAccount?: string
  weeklySchedule?: { day: string; startTime: string; endTime: string }[]
  trialTimeSlots?: string[]      // 试课时间候选（最多3个），格式：自由文本
  firstLessonTime?: string       // 首次课时间（正式课），格式：自由文本
  remarks?: string
  
  // Refund/Cancellation fields
  cancelReason?: string      // Reason for cancellation
  refundAmount?: number      // Calculated refund amount
  rejectReason?: string      // Reason for rejecting the refund

  // Transaction History
  transactions?: Transaction[]

  // Transfer history for teachers
  transferredOutFrom?: string // ID of the teacher from whom this order was transferred out

  /** 退费流程中课时冻结：为 true 时剩余课时不可排课消耗（原型层提示与校验） */
  refundFreezeActive?: boolean
}

/** 退费申请类型：试课 / 正课(含续课) / 仅转正红包 */
export type RefundKind = 'TRIAL' | 'REGULAR' | 'RENEWAL' | 'RED_PACKET'

/** 退费申请状态（双审流程） */
export enum RefundApplicationStatus {
  PENDING_FIRST_REVIEW = 'PENDING_FIRST_REVIEW',
  PENDING_SECOND_REVIEW = 'PENDING_SECOND_REVIEW',
  FIRST_REJECTED = 'FIRST_REJECTED',
  WITHDRAWN = 'WITHDRAWN',
  REFUND_SUCCESS = 'REFUND_SUCCESS',
  REFUND_FAILED = 'REFUND_FAILED',
}

/** 正课/续课可退金额明细快照（申请时保存便于审核端展示） */
export interface RegularRefundBreakdown {
  totalFee: number
  regularPaidAmount?: number
  redPacketAmount?: number
  totalHours: number
  consumedHours: number
  remainingHours: number
  frozenHours?: number
  historicalRequestedHours?: number
  maxRefundableHours?: number
  historicalRefundedAmount?: number
  pendingFrozenAmount?: number
  nonRefundableAmount: number
  consumedLessonFee: number
  maxRefundable: number
}

export interface RefundApplication {
  id: string
  orderId: string
  applicantUserId: string
  applicantName?: string
  refundKind: RefundKind
  status: RefundApplicationStatus
  reason?: string
  requestedHours?: number
  requestedAmount: number
  finalRefundHours?: number
  /** 用户（或运营代填）首次提交时的申请金额，不因审核调整而改写 */
  userOriginalRequestedAmount?: number
  userOriginalRequestedHours?: number
  computedMaxAtApply: number
  breakdown?: RegularRefundBreakdown
  createdAt: Date
  updatedAt: Date
  firstReviewNote?: string
  firstReviewerId?: string
  firstReviewerName?: string
  firstReviewedAt?: Date
  secondReviewNote?: string
  secondReviewerId?: string
  secondReviewerName?: string
  secondReviewedAt?: Date
  finalRefundAmount?: number
  executionStatus?: 'PENDING' | 'SUCCESS' | 'FAILED'
  /** 一审驳回时向招生老师展示的说明 */
  firstRejectApplicantNote?: string
  /** 二审驳回退回一审时向招生老师展示的说明 */
  secondRejectApplicantNote?: string
}

export interface RefundOperationLog {
  id: string
  refundApplicationId: string
  orderId: string
  actorRole: 'SALES' | 'OPERATOR' | 'SYSTEM'
  actorUserId?: string
  actorName?: string
  action: string
  detail?: string
  createdAt: Date
}

export interface Transaction {
  id: string
  type: 'INITIAL' | 'RENEWAL' | 'REFUND' | 'REWARD'  // 新增 REFUND(退款) 和 REWARD(转正奖励)
  amount: number
  hours: number
  createdAt: Date
}

export interface Student {
  id: string
  name: string
  grade: string
  gender: string
  phone: string
  parentName: string
  parentPhone: string
  address?: string
  school?: string
  createdAt: Date
  updatedAt: Date
}

export interface Lesson {
  id: string
  orderId: string
  teacherId: string
  studentId: string
  startTime: Date
  endTime: Date
  duration: number           // 分钟
  feedbackId?: string
  createdAt: Date            // 只能在反馈提交时生成
}

export interface LessonFeedback {
  id: string
  lessonId: string
  teacherId: string
  content: string
  studentPerformance: 1 | 2 | 3 | 4 | 5  // 表现评分
  homework?: string
  nextPlan?: string
  createdAt: Date
}

export enum SlotStatus {
  AVAILABLE = 'AVAILABLE',   // 可接单
  BOOKED = 'BOOKED',         // 已预约
  LOCKED = 'LOCKED'          // 锁定（课前后缓冲）
}

export interface TeacherCalendarSlot {
  id: string
  teacherId: string
  startTime: Date
  endTime: Date
  status: SlotStatus
  orderId?: string
  createdAt: Date
}

export enum StudyPlanStatus {
  PENDING_REVIEW = 'PENDING_REVIEW', // 审核中
  REVIEWED = 'REVIEWED'              // 已完成审核
}

export interface ReviewInfo {
  reviewerName: string
  reviewedAt: Date
}

export interface StudyPlan {
  id: string
  orderId?: string  // 改为可选，支持弱绑定
  studentId: string
  studentName?: string  // 新增学生姓名字段
  teacherId: string
  fileUrl: string
  fileName: string
  fileType: 'pdf' | 'word'
  status: StudyPlanStatus
  reviews?: ReviewInfo[]
  createdAt: Date
  updatedAt: Date
}

export interface ParentFeedback {
  rating: number
  tags: string[]
  evaluation?: Record<string, string>  // 10项结构化评价，key 对应各评价维度
  remarks?: string
  submittedAt: Date
}

export interface LessonFeedbackRecord {
  id: string
  orderId?: string  // 改为可选，支持弱绑定
  studentId: string
  studentName?: string  // 新增学生姓名字段
  teacherId: string
  date: string
  startTime: string
  endTime: string
  deductHours: string
  /** 课费标准档位（一年级～九年级、高一～高三），可与学生档案年级不同 */
  feeStandardGrade?: string
  /** 学生出勤（单选项文案） */
  studentAttendance?: string
  /** 作业完成情况（单选项文案） */
  homeworkCompletion?: string
  content: string
  methods?: string
  mistakes?: string
  performance?: string
  homework?: string
  parentFeedback?: ParentFeedback
  createdAt: Date
  updatedAt: Date
}

export interface FinancialRecord {
  id: string
  type: 'RECHARGE' | 'REFUND'  // 充值/退款
  orderId: string              // 关联订单号
  amount: number               // 金额（退款为负数）
  salesPersonId: string        // 招生老师ID
  salesPersonName?: string     // 招生老师姓名（冗余字段）
  salesPersonPhone?: string    // 招生老师手机号（冗余字段）
  remarks?: string             // 备注
  createdAt: Date              // 交易时间
}

// 收入类型枚举
export enum IncomeType {
  TRIAL_FEE = 'TRIAL_FEE',           // 试课费
  DEAL_REWARD = 'DEAL_REWARD',       // 成交奖励
  LESSON_FEE = 'LESSON_FEE',         // 课时费
  MANAGEMENT_FEE = 'MANAGEMENT_FEE'  // 管理费
}

// 收入记录状态
export enum IncomeStatus {
  PENDING = 'PENDING',               // 待结算
  SETTLED = 'SETTLED'                // 已结算
}

// 收入记录接口
export interface IncomeRecord {
  id: string
  type: IncomeType                   // 收入类型
  teacherId: string                  // 伴学教练/学管ID
  teacherName: string                // 教师姓名（冗余字段）
  studentId?: string                 // 学员ID
  studentName?: string               // 学员姓名
  orderId?: string                   // 订单号（成交奖励需要）
  feedbackId?: string                // 课后反馈ID（课时费需要）
  courseName?: string                // 课程名称（课时费需要）
  subject?: string                   // 科目
  grade?: string                     // 年级
  relatedTeacherId?: string          // 关联的伴学教练ID（管理费需要）
  relatedTeacherName?: string        // 关联的伴学教练姓名（管理费需要）
  managementFeeRate?: number         // 管理费单价（如 5元/课时）
  quantity: number                   // 数量（次数/单数/课时数）
  unitPrice: number                  // 单价
  amount: number                     // 收入金额
  status: IncomeStatus               // 结算状态
  remarks?: string                   // 备注
  occurredAt: Date                   // 发生时间
  settledAt?: Date                   // 结算时间
  createdAt: Date
  updatedAt: Date
}

// ========== 伴学教练收入汇总 ==========

// 伴学教练收入汇总（按教练聚合）
export interface TutorIncomeSummary {
  id: string
  tutorId: string                    // 伴学教练ID
  tutorName: string                  // 伴学教练姓名
  period: {
    start: Date                      // 统计周期开始时间
    end: Date                        // 统计周期结束时间
  }
  trialFee: {
    amount: number                   // 试课费金额
    count: number                    // 试课笔数
  }
  dealReward: {
    amount: number                   // 成交奖励金额
    count: number                    // 成交笔数
  }
  lessonFee: {
    amount: number                   // 课时费金额
    hours: number                    // 课时数
  }
  managementFee: {
    amount: number                   // 管理费金额
    hours: number                    // 课时数
  }
  totalIncome: number                // 总收入
  createdAt: Date
  updatedAt: Date
}

// 伴学教练收入汇总（按教练聚合）
export interface TutorIncomeSummary {
  id: string
  tutorId: string                    // 伴学教练ID
  tutorName: string                  // 伴学教练姓名
  period: {
    start: Date                      // 统计周期开始时间
    end: Date                        // 统计周期结束时间
  }
  trialFee: {
    amount: number                   // 试课费金额
    count: number                    // 试课费笔数
  }
  dealReward: {
    amount: number                   // 成交奖励金额
    count: number                    // 成交奖励笔数
  }
  lessonFee: {
    amount: number                   // 课时费金额
    hours: number                    // 课时数
  }
  managementFee: {
    amount: number                   // 管理费金额
    hours: number                    // 管理课时数
  }
  totalIncome: number                // 总收入
  createdAt: Date
  updatedAt: Date
}

// ========== 老师数据补录 ==========

export type TeacherAccordRole = 'study_manager' | 'tutor'

export interface TeacherAccordRecord {
  id: string
  name: string                // 姓名
  phone: string               // 手机号
  role: TeacherAccordRole     // 角色
  createdAt: Date
}

// ========== 订单数据补录 ==========

export interface OrderAccordRecord {
  id: string
  tutorName: string          // 伴学教练姓名
  tutorPhone: string         // 伴学教练手机号
  subjectName: string        // 科目名称
  studentGAccount: string    // 学员G账号
  grade: string              // 年级
  remainingHours: number     // 剩余课时
  studentName: string        // 学生姓名
  parentPhone: string        // 家长手机号
  createdAt: Date
  updatedAt: Date
}

// ========== 教学科目 ==========

// 教学科目接口
export interface Subject {
  id: string
  code: string                       // 科目编号
  name: string                       // 科目名称
  description: string                // 科目简介
  enabled: boolean                   // 是否启用
  createdAt: Date
  updatedAt: Date
}
