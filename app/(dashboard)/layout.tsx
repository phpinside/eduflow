"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { DashboardHeader, DashboardSidebar } from "@/components/layout/DashboardLayout"
import { Loader2 } from "lucide-react"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <DashboardSidebar />
      {/* Mobile Sidebar Overlay - simplified */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="relative bg-white h-full w-64 shadow-xl animate-in slide-in-from-left">
             {/* Re-using sidebar content logic or component would be better, but for prototype just rendering generic menu or duplicate */}
             {/* For now, just a placeholder or duplicate the Sidebar component logic if extracted better. 
                 Since DashboardSidebar is 'hidden md:block', I should probably make it responsive or use Sheet.
                 For this quick prototype, I'll assume desktop primarily or simple mobile check.
              */}
              <div className="p-4">
                  <h2 className="text-xl font-bold mb-4">EduFlow</h2>
                  <p className="text-sm text-muted-foreground">Mobile menu work in progress.</p>
                  <button onClick={() => setSidebarOpen(false)} className="mt-4 text-sm underline">Close</button>
              </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
