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
  roles: Role[]              // 支持多角色
  status?: UserStatus        // 审核状态
  rejectReason?: string      // 驳回原因
  avatar?: string
  wechatQrCode?: string      // 个人微信二维码图片
  campusName?: string        // 9800校区名称
  campusAccount?: string     // 9800校区账号
  recommendedForTrial?: boolean // 系统推荐试课
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
  CANCEL_REQUESTED = 'CANCEL_REQUESTED' // 取消申请中
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
  campusName?: string
  campusAccount?: string
  studentAccount?: string
  weeklySchedule?: { day: string; startTime: string; endTime: string }[]
  remarks?: string
  
  // Refund/Cancellation fields
  cancelReason?: string      // Reason for cancellation
  refundAmount?: number      // Calculated refund amount
  rejectReason?: string      // Reason for rejecting the refund

  // Transaction History
  transactions?: Transaction[]

  // Transfer history for teachers
  transferredOutFrom?: string // ID of the teacher from whom this order was transferred out
}

export interface Transaction {
  id: string
  type: 'INITIAL' | 'RENEWAL'
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
  orderId: string
  studentId: string
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
  remarks?: string
  submittedAt: Date
}

export interface LessonFeedbackRecord {
  id: string
  orderId: string
  studentId: string
  teacherId: string
  date: string
  startTime: string
  endTime: string
  deductHours: string
  content: string
  methods?: string
  mistakes?: string
  performance?: string
  homework?: string
  parentFeedback?: ParentFeedback
  createdAt: Date
  updatedAt: Date
}
