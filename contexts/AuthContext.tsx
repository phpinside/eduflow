"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, Role, UserStatus } from '@/types'
import { getStoredUsers, initializeMockData, saveMockData, STORAGE_KEYS } from '@/lib/storage'
import { useRouter } from 'next/navigation'
// Using simple cookie management for prototype
// import { setCookie, deleteCookie, getCookie } from 'cookies-next'

// We need cookies-next for client-side cookie management to persist auth across reloads
// Since we didn't install it, I'll use a simple localStorage fallback for now + a mock cookie implementation
// or just rely on Context state + localStorage for the prototype as specified in requirements.
// Requirement says: "Context + Cookie". I'll use a simple utility for cookies.

interface AuthContextType {
  user: User | null
  login: (phone: string) => Promise<boolean>
  logout: () => void
  switchRole: (role: Role) => void
  updateProfile: (data: Partial<User>) => void
  currentRole: Role | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [currentRole, setCurrentRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Initialize mock data on load
    initializeMockData()
    
    // Check for existing session
    const clearSession = () => {
      localStorage.removeItem('eduflow:session_user')
      localStorage.removeItem('eduflow:active_role')
      document.cookie = `eduflow_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      setUser(null)
      setCurrentRole(null)
    }

    const checkAuth = () => {
      const storedUserJson = localStorage.getItem('eduflow:session_user')
      if (storedUserJson) {
        const parsedUser = JSON.parse(storedUserJson) as User
        const users = getStoredUsers()
        const fresh = users.find(u => u.id === parsedUser.id)

        if (!fresh || fresh.accountDisabled) {
          clearSession()
          setIsLoading(false)
          return
        }

        fresh.createdAt = new Date(fresh.createdAt)
        fresh.updatedAt = new Date(fresh.updatedAt)
        setUser(fresh)
        localStorage.setItem('eduflow:session_user', JSON.stringify(fresh))

        const storedRole = localStorage.getItem('eduflow:active_role')
        if (storedRole && fresh.roles.includes(storedRole as Role)) {
          setCurrentRole(storedRole as Role)
        } else {
          setCurrentRole(fresh.roles[0])
        }
      }
      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (phone: string): Promise<boolean> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const users = getStoredUsers()
    const foundUser = users.find(u => u.phone === phone)

    if (foundUser) {
      if (foundUser.accountDisabled) {
        throw new Error('该账号已被停用，无法登录。如需恢复请联系管理员。')
      }

      // Check user status
      if (foundUser.status === UserStatus.PENDING) {
        throw new Error('您的账号正在审核中，请耐心等待管理员审核通过后再登录')
      }
      
      if (foundUser.status === UserStatus.REJECTED) {
        const reason = foundUser.rejectReason ? `，原因：${foundUser.rejectReason}` : ''
        throw new Error(`您的账号已被驳回${reason}`)
      }
      
      // Only allow login if status is APPROVED or undefined (old users without status)
      if (foundUser.status && foundUser.status !== UserStatus.APPROVED) {
        throw new Error('账号状态异常，无法登录')
      }

      setUser(foundUser)
      setCurrentRole(foundUser.roles[0])
      
      // Persist session
      localStorage.setItem('eduflow:session_user', JSON.stringify(foundUser))
      localStorage.setItem('eduflow:active_role', foundUser.roles[0])
      // Set a cookie for middleware (if we had it) - skipping actual cookie lib for simplicity unless needed
      document.cookie = `eduflow_auth=true; path=/; max-age=86400`
      
      return true
    }
    return false
  }

  const logout = () => {
    setUser(null)
    setCurrentRole(null)
    localStorage.removeItem('eduflow:session_user')
    localStorage.removeItem('eduflow:active_role')
    document.cookie = `eduflow_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    router.push('/login')
  }

  const switchRole = (role: Role) => {
    if (user && user.roles.includes(role)) {
      setCurrentRole(role)
      localStorage.setItem('eduflow:active_role', role)
      router.push('/') // Redirect to home to refresh dashboard view
    }
  }

  const updateProfile = (data: Partial<User>) => {
    if (!user) return

    const updatedUser = { ...user, ...data, updatedAt: new Date() }
    setUser(updatedUser)
    
    // Update session storage
    localStorage.setItem('eduflow:session_user', JSON.stringify(updatedUser))

    // Update persistent storage
    const users = getStoredUsers()
    const userIndex = users.findIndex(u => u.id === user.id)
    if (userIndex !== -1) {
        users[userIndex] = updatedUser
        saveMockData(STORAGE_KEYS.USERS, users)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, updateProfile, currentRole, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
