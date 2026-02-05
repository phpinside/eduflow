"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User, Role } from '@/types'
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
    const checkAuth = () => {
      const storedUser = localStorage.getItem('eduflow:session_user')
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser)
        // Re-hydrate dates
        parsedUser.createdAt = new Date(parsedUser.createdAt)
        parsedUser.updatedAt = new Date(parsedUser.updatedAt)
        
        setUser(parsedUser)
        // Get stored active role or default to first role
        const storedRole = localStorage.getItem('eduflow:active_role')
        if (storedRole && parsedUser.roles.includes(storedRole as Role)) {
            setCurrentRole(storedRole as Role)
        } else {
            setCurrentRole(parsedUser.roles[0])
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
