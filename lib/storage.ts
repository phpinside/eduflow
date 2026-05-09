import { mockUsers } from './mock-data/users'
import { mockOrders } from './mock-data/orders'
import { mockStudents } from './mock-data/students'
import { mockLessons } from './mock-data/lessons'
import { mockIncomeRecords } from './mock-data/income-records'
import { mockTutorIncomeSummary } from './mock-data/tutor-income-summary'
import { mockSubjects } from './mock-data/subjects'
import { mockOrderAccordRecords } from './mock-data/order-accord'
import { mockTeacherAccordRecords } from './mock-data/teacher-accord'
import { mockFinancialRecords } from './mock-data/financial-records'
import type { Order, OrderStatus, Student } from '@/types'
import { OrderStatus as OrderStatusEnum } from '@/types'
import { mockRefundApplications } from './mock-data/refund-applications'
import { mockRefundOperationLogs } from './mock-data/refund-logs'
import { mockBranchCompanies } from './mock-data/branch-companies'
import { mockOperationLogs } from './mock-data/operation-logs'
import type { OperationLog } from '@/types/operation-log'
import { mockPriceRules } from './mock-data/price-settings'
import type { PriceRule } from './mock-data/price-settings'
import { mockAssessments, type MockAssessmentRecord } from './mock-data/assessments'
import { mockTutorCreditRules } from './mock-data/tutor-credit-rules'
import { mockTutorCreditLogs } from './mock-data/tutor-credit-logs'
import { mockManagementIncomeDetails } from './mock-data/management-income'
import type { TutorCreditRule, TutorCreditLog, ManagementIncomeDetail } from '@/types'

export const STORAGE_KEYS = {
  USERS: 'eduflow:users',
  ORDERS: 'eduflow:orders',
  STUDENTS: 'eduflow:students',
  LESSONS: 'eduflow:lessons',
  INCOME_RECORDS: 'eduflow:income-records',
  TUTOR_INCOME_SUMMARY: 'eduflow:tutor-income-summary',
  SUBJECTS: 'eduflow:subjects',
  PRICE_RULES: 'eduflow:price-rules',
  ORDER_ACCORD_RECORDS: 'eduflow:order-accord-records',
  TEACHER_ACCORD_RECORDS: 'eduflow:teacher-accord-records',
  FINANCIAL_RECORDS: 'eduflow:financial-records',
  REFUND_APPLICATIONS: 'eduflow:refund-applications',
  REFUND_OPERATION_LOGS: 'eduflow:refund-operation-logs',
  BRANCH_COMPANIES: 'eduflow:branch-companies',
  OPERATION_LOGS: 'eduflow:operation-logs',
  ASSESSMENTS: 'eduflow:assessments',
  TUTOR_CREDIT_RULES: 'eduflow:tutor-credit-rules',
  TUTOR_CREDIT_LOGS: 'eduflow:tutor-credit-logs',
  MANAGEMENT_INCOME: 'eduflow:management-income',
}

const isBrowser = typeof window !== 'undefined'

export function getMockData<T>(key: string, defaultData: T): T {
  if (!isBrowser) return defaultData
  
  const stored = localStorage.getItem(key)
  if (!stored) {
    localStorage.setItem(key, JSON.stringify(defaultData))
    return defaultData
  }
  
  try {
    // Need to handle Date parsing if JSON.parse doesn't do it automatically (it doesn't)
    // For simplicity in prototype, we might just re-hydrate dates manually where needed
    // or use a reviver function. Here we just return parsed JSON.
    return JSON.parse(stored, (key, value) => {
      // Simple heuristic for date strings
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return new Date(value)
      }
      return value
    })
  } catch (e) {
    console.error('Failed to parse mock data', e)
    return defaultData
  }
}

export function saveMockData<T>(key: string, data: T) {
  if (!isBrowser) return
  localStorage.setItem(key, JSON.stringify(data))
}

// Typed getters
export const getStoredUsers = () => getMockData(STORAGE_KEYS.USERS, mockUsers)
export const getStoredOrders = () => getMockData(STORAGE_KEYS.ORDERS, mockOrders)
export const getStoredStudents = () => getMockData(STORAGE_KEYS.STUDENTS, mockStudents)
export const getStoredLessons = () => getMockData(STORAGE_KEYS.LESSONS, mockLessons)
export const getStoredIncomeRecords = () => getMockData(STORAGE_KEYS.INCOME_RECORDS, mockIncomeRecords)
export const getStoredTutorIncomeSummary = () => getMockData(STORAGE_KEYS.TUTOR_INCOME_SUMMARY, mockTutorIncomeSummary)
export const getStoredSubjects = () => getMockData(STORAGE_KEYS.SUBJECTS, mockSubjects)
export const getStoredPriceRules = (): PriceRule[] =>
  getMockData(STORAGE_KEYS.PRICE_RULES, mockPriceRules)
export const saveStoredPriceRules = (rules: PriceRule[]) =>
  saveMockData(STORAGE_KEYS.PRICE_RULES, rules)

export const getStoredAssessments = (): MockAssessmentRecord[] =>
  getMockData(STORAGE_KEYS.ASSESSMENTS, mockAssessments)

export const saveAssessments = (data: MockAssessmentRecord[]) =>
  saveMockData(STORAGE_KEYS.ASSESSMENTS, data)
export const getStoredOrderAccordRecords = () => getMockData(STORAGE_KEYS.ORDER_ACCORD_RECORDS, mockOrderAccordRecords)
export const saveOrderAccordRecords = (data: typeof mockOrderAccordRecords) => saveMockData(STORAGE_KEYS.ORDER_ACCORD_RECORDS, data)
export const getStoredTeacherAccordRecords = () => getMockData(STORAGE_KEYS.TEACHER_ACCORD_RECORDS, mockTeacherAccordRecords)
export const saveTeacherAccordRecords = (data: typeof mockTeacherAccordRecords) => saveMockData(STORAGE_KEYS.TEACHER_ACCORD_RECORDS, data)

export const saveStoredOrders = (orders: Order[]) =>
  saveMockData(STORAGE_KEYS.ORDERS, orders)

export const getStoredFinancialRecords = () =>
  getMockData(STORAGE_KEYS.FINANCIAL_RECORDS, mockFinancialRecords)

export const saveStoredFinancialRecords = (data: typeof mockFinancialRecords) =>
  saveMockData(STORAGE_KEYS.FINANCIAL_RECORDS, data)

export const getStoredRefundApplications = () =>
  getMockData(STORAGE_KEYS.REFUND_APPLICATIONS, mockRefundApplications)

export const saveRefundApplications = (data: typeof mockRefundApplications) =>
  saveMockData(STORAGE_KEYS.REFUND_APPLICATIONS, data)

export const getStoredRefundOperationLogs = () =>
  getMockData(STORAGE_KEYS.REFUND_OPERATION_LOGS, mockRefundOperationLogs)

export const saveRefundOperationLogs = (data: typeof mockRefundOperationLogs) =>
  saveMockData(STORAGE_KEYS.REFUND_OPERATION_LOGS, data)

// === 新增：分公司管理相关工具函数 ===

export const getStoredBranchCompanies = () =>
  getMockData(STORAGE_KEYS.BRANCH_COMPANIES, mockBranchCompanies)

export const saveStoredBranchCompanies = (data: typeof mockBranchCompanies) =>
  saveMockData(STORAGE_KEYS.BRANCH_COMPANIES, data)

// === 新增：操作日志相关工具函数 ===

export const getStoredOperationLogs = (): OperationLog[] =>
  getMockData(STORAGE_KEYS.OPERATION_LOGS, mockOperationLogs)

export const saveStoredOperationLogs = (data: OperationLog[]) =>
  saveMockData(STORAGE_KEYS.OPERATION_LOGS, data)

/**
 * 添加操作日志
 */
export const addOperationLog = (log: Omit<OperationLog, 'id' | 'createdAt'>): OperationLog => {
  const logs = getStoredOperationLogs()
  const newLog: OperationLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date(),
  }
  logs.unshift(newLog) // 最新的在前面
  // 保留最近1000条日志
  const trimmedLogs = logs.slice(0, 1000)
  saveStoredOperationLogs(trimmedLogs)
  return newLog
}

/**
 * 检查并更新排单中超时的订单
 * @param timeoutHours 超时时长（小时），默认 3 小时
 * @returns 返回更新的订单数量
 */
export function checkAndUpdateSchedulingTimeout(timeoutHours: number = 3): number {
  const orders = getStoredOrders()
  const now = new Date()
  let updatedCount = 0
  
  const updatedOrders = orders.map(order => {
    if (order.status === OrderStatusEnum.SCHEDULING && order.schedulingStartTime) {
      const start = new Date(order.schedulingStartTime)
      const elapsed = (now.getTime() - start.getTime()) / (1000 * 60 * 60) // 小时
      
      if (elapsed >= timeoutHours) {
        updatedCount++
        return {
          ...order,
          status: OrderStatusEnum.PENDING,
          schedulingStartTime: undefined,
          updatedAt: now
        }
      }
    }
    return order
  })
  
  if (updatedCount > 0) {
    saveStoredOrders(updatedOrders)
  }
  
  return updatedCount
}

// Initialize all data
export const initializeMockData = () => {
  if (!isBrowser) return

  // Users: Merge new mock users if they don't exist in storage
  const storedUsersStr = localStorage.getItem(STORAGE_KEYS.USERS)
  if (!storedUsersStr) {
    saveMockData(STORAGE_KEYS.USERS, mockUsers)
  } else {
    try {
        const storedUsers = JSON.parse(storedUsersStr, (key, value) => {
            if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                return new Date(value)
            }
            return value
        }) as any[]
        
        const storedIds = new Set(storedUsers.map(u => u.id))
        const newUsers = mockUsers.filter(u => !storedIds.has(u.id))
        
        if (newUsers.length > 0) {
            console.log(`Merging ${newUsers.length} new users into storage`)
            const mergedUsers = [...storedUsers, ...newUsers]
            saveMockData(STORAGE_KEYS.USERS, mergedUsers)
        }
    } catch (e) {
        console.error('Failed to merge users', e)
    }
  }

  // Orders: merge in new mock orders by id when storage already exists (mirrors users merge)
  const storedOrdersStr = localStorage.getItem(STORAGE_KEYS.ORDERS)
  if (!storedOrdersStr) {
    saveMockData(STORAGE_KEYS.ORDERS, mockOrders)
  } else {
    try {
      const storedOrders = JSON.parse(storedOrdersStr, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value)
        }
        return value
      }) as Order[]
      const storedIds = new Set(storedOrders.map((o) => o.id))
      const newOrders = mockOrders.filter((o) => !storedIds.has(o.id))
      if (newOrders.length > 0) {
        console.log(`Merging ${newOrders.length} new orders into storage`)
        saveMockData(STORAGE_KEYS.ORDERS, [...storedOrders, ...newOrders])
      }
    } catch (e) {
      console.error('Failed to merge orders', e)
    }
  }

  const storedStudentsStr = localStorage.getItem(STORAGE_KEYS.STUDENTS)
  if (!storedStudentsStr) {
    saveMockData(STORAGE_KEYS.STUDENTS, mockStudents)
  } else {
    try {
      const storedStudents = JSON.parse(storedStudentsStr, (key, value) => {
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
          return new Date(value)
        }
        return value
      }) as Student[]
      const storedStudentIds = new Set(storedStudents.map((s) => s.id))
      const newStudents = mockStudents.filter((s) => !storedStudentIds.has(s.id))
      if (newStudents.length > 0) {
        console.log(`Merging ${newStudents.length} new students into storage`)
        saveMockData(STORAGE_KEYS.STUDENTS, [...storedStudents, ...newStudents])
      }
    } catch (e) {
      console.error('Failed to merge students', e)
    }
  }
  if (!localStorage.getItem(STORAGE_KEYS.LESSONS)) saveMockData(STORAGE_KEYS.LESSONS, mockLessons)
  if (!localStorage.getItem(STORAGE_KEYS.INCOME_RECORDS)) saveMockData(STORAGE_KEYS.INCOME_RECORDS, mockIncomeRecords)
  if (!localStorage.getItem(STORAGE_KEYS.TUTOR_INCOME_SUMMARY)) saveMockData(STORAGE_KEYS.TUTOR_INCOME_SUMMARY, mockTutorIncomeSummary)
  if (!localStorage.getItem(STORAGE_KEYS.SUBJECTS)) saveMockData(STORAGE_KEYS.SUBJECTS, mockSubjects)
  if (!localStorage.getItem(STORAGE_KEYS.PRICE_RULES)) saveMockData(STORAGE_KEYS.PRICE_RULES, mockPriceRules)
  if (!localStorage.getItem(STORAGE_KEYS.ORDER_ACCORD_RECORDS)) saveMockData(STORAGE_KEYS.ORDER_ACCORD_RECORDS, mockOrderAccordRecords)
  if (!localStorage.getItem(STORAGE_KEYS.TEACHER_ACCORD_RECORDS)) saveMockData(STORAGE_KEYS.TEACHER_ACCORD_RECORDS, mockTeacherAccordRecords)
  if (!localStorage.getItem(STORAGE_KEYS.FINANCIAL_RECORDS)) saveMockData(STORAGE_KEYS.FINANCIAL_RECORDS, mockFinancialRecords)
  if (!localStorage.getItem(STORAGE_KEYS.REFUND_APPLICATIONS)) saveMockData(STORAGE_KEYS.REFUND_APPLICATIONS, mockRefundApplications)
  if (!localStorage.getItem(STORAGE_KEYS.REFUND_OPERATION_LOGS)) saveMockData(STORAGE_KEYS.REFUND_OPERATION_LOGS, mockRefundOperationLogs)
  if (!localStorage.getItem(STORAGE_KEYS.BRANCH_COMPANIES)) saveMockData(STORAGE_KEYS.BRANCH_COMPANIES, mockBranchCompanies)
  if (!localStorage.getItem(STORAGE_KEYS.OPERATION_LOGS)) saveMockData(STORAGE_KEYS.OPERATION_LOGS, mockOperationLogs)
  if (!localStorage.getItem(STORAGE_KEYS.TUTOR_CREDIT_RULES)) saveMockData(STORAGE_KEYS.TUTOR_CREDIT_RULES, mockTutorCreditRules)
  if (!localStorage.getItem(STORAGE_KEYS.TUTOR_CREDIT_LOGS)) saveMockData(STORAGE_KEYS.TUTOR_CREDIT_LOGS, mockTutorCreditLogs)
  if (!localStorage.getItem(STORAGE_KEYS.MANAGEMENT_INCOME)) saveMockData(STORAGE_KEYS.MANAGEMENT_INCOME, mockManagementIncomeDetails)
}

// === 伴学信用分规则 ===

export const getStoredTutorCreditRules = (): TutorCreditRule[] =>
  getMockData(STORAGE_KEYS.TUTOR_CREDIT_RULES, mockTutorCreditRules)

export const saveStoredTutorCreditRules = (data: TutorCreditRule[]) =>
  saveMockData(STORAGE_KEYS.TUTOR_CREDIT_RULES, data)

// === 伴学信用分变动记录 ===

export const getStoredTutorCreditLogs = (): TutorCreditLog[] =>
  getMockData(STORAGE_KEYS.TUTOR_CREDIT_LOGS, mockTutorCreditLogs)

export const saveStoredTutorCreditLogs = (data: TutorCreditLog[]) =>
  saveMockData(STORAGE_KEYS.TUTOR_CREDIT_LOGS, data)

// === 管理收入明细 ===

export const getStoredManagementIncomeDetails = (): ManagementIncomeDetail[] =>
  getMockData(STORAGE_KEYS.MANAGEMENT_INCOME, mockManagementIncomeDetails)
