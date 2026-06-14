import { mockFeedbacks } from '@/lib/mock-data/feedbacks'
import {
  getStoredFinancialRecords,
  getStoredOrders,
  getStoredStudents,
  getStoredTrialPrepSubmissions,
  getStoredWorkbenchTasks,
} from '@/lib/storage'
import {
  OrderStatus,
  OrderType,
  Role,
  type Order,
  type TrialPrepSubmission,
  type User,
  type WorkbenchTask,
  type WorkbenchTaskDetectorId,
  type WorkbenchTaskType,
} from '@/types'

export interface TaskDetectorDefinition {
  id: WorkbenchTaskDetectorId
  name: string
  description: string
  reads: string[]
  completionEvidence: string
  defaultActionHrefTemplate: string
}

interface DetectionContext {
  now: Date
}

export const TASK_DETECTOR_DEFINITIONS: TaskDetectorDefinition[] = [
  {
    id: 'trialPrep',
    name: '试课备课检测器',
    description: '从试课订单中找出已分配教练、处于试课时间窗口内、且尚未提交完整备课资料的任务。',
    reads: ['orders', 'students', 'trialPrepSubmissions'],
    completionEvidence: '存在 SUBMITTED 状态备课资料，且满足必填项与教案正文/附件要求。',
    defaultActionHrefTemplate: '/trial-prep/{orderId}',
  },
  {
    id: 'lessonFeedback',
    name: '课后反馈检测器',
    description: '从已进行或已完成课程中找出尚未提交课后反馈的订单。',
    reads: ['orders', 'feedbacks'],
    completionEvidence: '存在对应 orderId 的课后反馈记录。',
    defaultActionHrefTemplate: '/my-students/feedback/{orderId}/create',
  },
  {
    id: 'homework',
    name: '作业布置检测器',
    description: '从课程反馈中检查是否已填写作业安排；未填写则形成补充作业任务。',
    reads: ['orders', 'feedbacks'],
    completionEvidence: '课后反馈中的 homework 字段非空。',
    defaultActionHrefTemplate: '/my-students/feedback/{orderId}/create',
  },
  {
    id: 'trialFollow',
    name: '试课跟进检测器',
    description: '从已完成且已有反馈的试课订单中生成招生跟进任务。',
    reads: ['orders', 'feedbacks'],
    completionEvidence: '形成转化、复盘或跟进记录；当前原型以静态跟进任务作为演示依据。',
    defaultActionHrefTemplate: '/orders/{orderId}',
  },
  {
    id: 'renewal',
    name: '续费跟进检测器',
    description: '从剩余课时低于阈值的正课订单中生成续费跟进任务。',
    reads: ['orders'],
    completionEvidence: '订单完成续费或剩余课时高于阈值。',
    defaultActionHrefTemplate: '/orders/{orderId}',
  },
  {
    id: 'hoursWarning',
    name: '课时预警检测器',
    description: '从剩余课时不足或冻结异常的正课订单中生成学管处理任务。',
    reads: ['orders'],
    completionEvidence: '剩余课时恢复、冻结解除或学管处理记录完成。',
    defaultActionHrefTemplate: '/manager-order-search',
  },
  {
    id: 'complaint',
    name: '投诉/升级检测器',
    description: '从家长反馈低分、投诉标签或升级事项中生成异常处理任务。',
    reads: ['feedbacks', 'orders'],
    completionEvidence: '投诉处理记录或回访记录完成；当前原型以静态异常任务作为演示依据。',
    defaultActionHrefTemplate: '/teaching-feedback/feedback-search',
  },
  {
    id: 'incomeAudit',
    name: '课时费审核检测器',
    description: '从财务记录、课时费记录和对账状态中生成运营审核任务。',
    reads: ['financialRecords', 'incomeRecords'],
    completionEvidence: '审核状态完成或发放批次确认。',
    defaultActionHrefTemplate: '/financial-records',
  },
]

export const TASK_DETECTOR_MAP = new Map(TASK_DETECTOR_DEFINITIONS.map((item) => [item.id, item]))

function fillTemplate(template: string, values: Record<string, string | undefined>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? '')
}

function getStudentName(studentId?: string) {
  if (!studentId) return undefined
  return getStoredStudents().find((student) => student.id === studentId)?.name
}

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function isWithinWindow(order: Order, type: WorkbenchTaskType, now: Date) {
  if (!order.scheduledAt) return true
  const start = new Date(order.scheduledAt)
  const preStartHours = type.detectorConfig.preStartHours ?? 24
  const postEndHours = type.detectorConfig.postEndHours ?? 24
  return now >= addHours(start, -preStartHours) && now <= addHours(start, postEndHours)
}

function getOwner(order: Order, type: WorkbenchTaskType): string | undefined {
  const ownerField = type.detectorConfig.ownerField
  if (ownerField === 'salesPersonId') return order.salesPersonId
  if (ownerField === 'managerId') return order.managerId
  return order.assignedTeacherId
}

function buildActionHref(type: WorkbenchTaskType, order: Order) {
  return fillTemplate(type.actionHrefTemplate || type.detectorConfig.actionHrefTemplate || '/orders/{orderId}', {
    orderId: order.id,
    studentId: order.studentId,
  })
}

function isCompletePrep(submission: TrialPrepSubmission | undefined, type: WorkbenchTaskType) {
  if (!submission) return false
  if (type.completionConfig.submittedOnly !== false && submission.status !== 'SUBMITTED') return false
  const requiredFields = type.completionConfig.requiredFields ?? []
  const requiredValues: Record<string, string | undefined> = {
    diagnosisNotes: submission.diagnosisNotes,
    teachingGoals: submission.teachingGoals,
    lessonPlanText: submission.lessonPlanText,
  }
  const hasRequiredFields = requiredFields.every((field) => Boolean(requiredValues[field]?.trim()))
  const hasPlanArtifact =
    !type.completionConfig.requireAttachmentOrText ||
    Boolean(submission.lessonPlanText?.trim()) ||
    submission.attachments.length > 0
  return hasRequiredFields && hasPlanArtifact
}

function taskStatus(dueAt: Date, now: Date): WorkbenchTask['status'] {
  return now > dueAt ? 'OVERDUE' : 'TODO'
}

function trialPrepDetector(type: WorkbenchTaskType, ctx: DetectionContext): WorkbenchTask[] {
  const orders = getStoredOrders()
  const submissions = getStoredTrialPrepSubmissions()
  const orderTypes = type.detectorConfig.orderTypes ?? [OrderType.TRIAL]
  const orderStatuses = type.detectorConfig.orderStatuses ?? [OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS]

  return orders
    .filter((order) => orderTypes.includes(order.type))
    .filter((order) => orderStatuses.includes(order.status))
    .filter((order) => Boolean(order.assignedTeacherId))
    .filter((order) => isWithinWindow(order, type, ctx.now))
    .filter((order) => {
      const submission = submissions.find((item) => item.orderId === order.id && item.tutorId === order.assignedTeacherId)
      return !isCompletePrep(submission, type)
    })
    .map((order) => {
      const start = order.scheduledAt ? new Date(order.scheduledAt) : new Date(order.createdAt)
      const dueAt = order.scheduledAt ? addHours(start, type.detectorConfig.dueOffsetHours ?? -1) : addHours(start, type.defaultDeadlineHours)
      const studentName = getStudentName(order.studentId)
      return {
        id: `${type.id}:${order.id}`,
        taskTypeId: type.id,
        ownerRole: Role.TUTOR,
        ownerUserId: order.assignedTeacherId,
        studentId: order.studentId,
        studentName,
        orderId: order.id,
        subjectId: order.id,
        title: `为 ${studentName ?? '学生'} 提交试课备课`,
        description: `试课 ${order.subject} · ${order.grade}，系统检测到尚未提交完整备课教案资料。`,
        status: taskStatus(dueAt, ctx.now),
        priority: type.defaultPriority,
        dueAt,
        progress: 0,
        actionLabel: '提交备课',
        actionHref: buildActionHref(type, order),
        metricLabel: '系统检测',
        createdAt: new Date(order.createdAt),
        updatedAt: ctx.now,
      } satisfies WorkbenchTask
    })
}

function lessonFeedbackDetector(type: WorkbenchTaskType, ctx: DetectionContext): WorkbenchTask[] {
  const orders = getStoredOrders()
  const orderStatuses = type.detectorConfig.orderStatuses ?? [OrderStatus.COMPLETED, OrderStatus.IN_PROGRESS]
  return orders
    .filter((order) => order.assignedTeacherId)
    .filter((order) => orderStatuses.includes(order.status))
    .filter((order) => !mockFeedbacks.some((feedback) => feedback.orderId === order.id))
    .slice(0, 12)
    .map((order) => {
      const dueAt = addHours(order.scheduledAt ? new Date(order.scheduledAt) : new Date(order.updatedAt), type.detectorConfig.dueOffsetHours ?? type.defaultDeadlineHours)
      const studentName = getStudentName(order.studentId)
      return {
        id: `${type.id}:${order.id}`,
        taskTypeId: type.id,
        ownerRole: Role.TUTOR,
        ownerUserId: order.assignedTeacherId,
        studentId: order.studentId,
        studentName,
        orderId: order.id,
        subjectId: order.id,
        title: `补交 ${studentName ?? '学生'} 的课后反馈`,
        description: '系统检测到该课程已有进展，但尚未形成课后反馈记录。',
        status: taskStatus(dueAt, ctx.now),
        priority: type.defaultPriority,
        dueAt,
        progress: 0,
        actionLabel: '提交反馈',
        actionHref: buildActionHref(type, order),
        metricLabel: '反馈缺失',
        createdAt: new Date(order.updatedAt),
        updatedAt: ctx.now,
      } satisfies WorkbenchTask
    })
}

function renewalDetector(type: WorkbenchTaskType, ctx: DetectionContext): WorkbenchTask[] {
  const orders = getStoredOrders()
  const maxRemainingHours = type.detectorConfig.maxRemainingHours ?? 5
  return orders
    .filter((order) => order.type === OrderType.REGULAR)
    .filter((order) => [OrderStatus.IN_PROGRESS, OrderStatus.ASSIGNED].includes(order.status))
    .filter((order) => order.remainingHours <= maxRemainingHours)
    .slice(0, 12)
    .map((order) => {
      const ownerUserId = getOwner(order, type)
      const ownerRole = type.applicableRoles.includes(Role.MANAGER) && type.detectorConfig.ownerField === 'managerId' ? Role.MANAGER : Role.SALES
      const dueAt = addHours(new Date(order.updatedAt), type.detectorConfig.dueOffsetHours ?? type.defaultDeadlineHours)
      const studentName = getStudentName(order.studentId)
      return {
        id: `${type.id}:${order.id}`,
        taskTypeId: type.id,
        ownerRole,
        ownerUserId,
        studentId: order.studentId,
        studentName,
        orderId: order.id,
        subjectId: order.id,
        title: `${studentName ?? '学生'} 剩余 ${order.remainingHours}h，需续费跟进`,
        description: '系统按剩余课时阈值生成续费/排课预案任务。',
        status: taskStatus(dueAt, ctx.now),
        priority: type.defaultPriority,
        dueAt,
        progress: 0,
        actionLabel: '查看订单',
        actionHref: buildActionHref(type, order),
        metricLabel: `剩余 ${order.remainingHours}h`,
        createdAt: new Date(order.updatedAt),
        updatedAt: ctx.now,
      } satisfies WorkbenchTask
    })
}

function staticDetector(type: WorkbenchTaskType): WorkbenchTask[] {
  return getStoredWorkbenchTasks()
    .filter((task) => task.taskTypeId === type.id)
    .map((task) => ({
      ...task,
      actionHref: task.actionHref || type.actionHrefTemplate,
      metricLabel: task.metricLabel ?? '静态演示',
    }))
}

function incomeAuditDetector(type: WorkbenchTaskType, ctx: DetectionContext): WorkbenchTask[] {
  const pendingRecords = getStoredFinancialRecords().slice(0, 8)
  if (pendingRecords.length === 0) return staticDetector(type)
  return pendingRecords.slice(0, 5).map((record, index) => {
    const dueAt = addHours(new Date(record.createdAt ?? ctx.now), type.detectorConfig.dueOffsetHours ?? type.defaultDeadlineHours)
    return {
      id: `${type.id}:${record.id}`,
      taskTypeId: type.id,
      ownerRole: Role.OPERATOR,
      title: `审核财务记录 ${record.id}`,
      description: '系统检测到财务记录需要运营/财务确认。',
      status: taskStatus(dueAt, ctx.now),
      priority: type.defaultPriority,
      dueAt,
      progress: 0,
      actionLabel: '去审核',
      actionHref: type.actionHrefTemplate,
      metricLabel: `第 ${index + 1} 条`,
      createdAt: new Date(record.createdAt ?? ctx.now),
      updatedAt: ctx.now,
    } satisfies WorkbenchTask
  })
}

export function detectTasksForType(type: WorkbenchTaskType, now = new Date()): WorkbenchTask[] {
  if (!type.enabled) return []
  const ctx = { now }
  switch (type.detectorId) {
    case 'trialPrep':
      return trialPrepDetector(type, ctx)
    case 'lessonFeedback':
    case 'homework':
      return lessonFeedbackDetector(type, ctx)
    case 'renewal':
    case 'hoursWarning':
      return renewalDetector(type, ctx)
    case 'incomeAudit':
      return incomeAuditDetector(type, ctx)
    case 'trialFollow':
    case 'complaint':
    default:
      return staticDetector(type)
  }
}

export function detectWorkbenchTasks(taskTypes: WorkbenchTaskType[], now = new Date()) {
  return taskTypes.flatMap((type) => detectTasksForType(type, now))
}

export function getTasksForRole(tasks: WorkbenchTask[], role: Role, user: User | null) {
  return tasks
    .filter((task) => task.ownerRole === role)
    .filter((task) => !task.ownerUserId || !user || task.ownerUserId === user.id || role === Role.OPERATOR)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
}

export function getTaskTypeStats(type: WorkbenchTaskType, now = new Date()) {
  const tasks = detectTasksForType(type, now)
  const today = now.toDateString()
  return {
    pending: tasks.filter((task) => task.status !== 'DONE').length,
    todayNew: tasks.filter((task) => new Date(task.createdAt).toDateString() === today).length,
    overdue: tasks.filter((task) => task.status === 'OVERDUE').length,
    lastCheckedAt: now,
    tasks,
  }
}
