import { mockUsers } from './mock-data/users'
import { mockOrders } from './mock-data/orders'
import { mockStudents } from './mock-data/students'
import { mockLessons } from './mock-data/lessons'
import { mockIncomeRecords } from './mock-data/income-records'
import { mockTutorIncomeSummary } from './mock-data/tutor-income-summary'

export const STORAGE_KEYS = {
  USERS: 'eduflow:users',
  ORDERS: 'eduflow:orders',
  STUDENTS: 'eduflow:students',
  LESSONS: 'eduflow:lessons',
  INCOME_RECORDS: 'eduflow:income-records',
  TUTOR_INCOME_SUMMARY: 'eduflow:tutor-income-summary'
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

  if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) saveMockData(STORAGE_KEYS.ORDERS, mockOrders)
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) saveMockData(STORAGE_KEYS.STUDENTS, mockStudents)
  if (!localStorage.getItem(STORAGE_KEYS.LESSONS)) saveMockData(STORAGE_KEYS.LESSONS, mockLessons)
  if (!localStorage.getItem(STORAGE_KEYS.INCOME_RECORDS)) saveMockData(STORAGE_KEYS.INCOME_RECORDS, mockIncomeRecords)
  if (!localStorage.getItem(STORAGE_KEYS.TUTOR_INCOME_SUMMARY)) saveMockData(STORAGE_KEYS.TUTOR_INCOME_SUMMARY, mockTutorIncomeSummary)
}
