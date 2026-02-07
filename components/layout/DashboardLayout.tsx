"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@/types"
import {
  LayoutDashboard,
  ShoppingCart,
  GraduationCap,
  Users,
  Calendar,
  Settings,
  ShieldAlert,
  BarChart3,
  LogOut,
  Menu,
  X,
  UserCog,
  Wallet
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet" // We need to add Sheet for mobile if we want to follow shadcn pattern properly, but I'll use simple mobile state first or add Sheet component.
// Wait, I didn't add sheet component yet. I'll stick to a custom implementation or simple responsive visibility for now to avoid installing more components if not needed,
// but Sheet is standard for Sidebar. Let's just use CSS hidden/block for now or add Sheet later.
// Actually, I'll assume desktop first and add mobile toggle simple logic.

interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
}

const navItems: NavItem[] = [
  {
    title: "概览",
    href: "/",
    icon: LayoutDashboard,
    roles: [Role.SALES, Role.TUTOR, Role.MANAGER, Role.OPERATOR, Role.ADMIN]
  },
  {
    title: "订单管理",
    href: "/orders",
    icon: ShoppingCart,
    roles: [Role.SALES,]
  },
  {
    title: "接单中心",
    href: "/orders/market", // Special route for tutors
    icon: ShoppingCart,
    roles: [Role.TUTOR , Role.MANAGER, ]
  },
  {
    title: "我的学员",
    href: "/my-students",
    icon: GraduationCap,
    roles: [Role.TUTOR, Role.MANAGER]
  },
  
  {
    title: "我的日历",
    href: "/calendar",
    icon: Calendar,
    roles: [Role.TUTOR, Role.MANAGER]
  },
  {
    title: "我的收入",
    href: "/my-income",
    icon: Wallet,
    roles: [Role.TUTOR, Role.MANAGER]
  },
  {
    title: "伴学教练管理",
    href: "/teachers",
    icon: Users,
    roles: [Role.MANAGER]
  },
  {
    title: "学习规划书管理",
    href: "/study-plan",
    icon: Users,
    roles: [Role.MANAGER]
  },
  {
    title: "接单设置",
    href: "/order-settings",
    icon: Settings,
    roles: [Role.TUTOR, Role.MANAGER]
  },
  {
    title: "订单管理",
    href: "/manager-orders",
    icon: BarChart3,
    roles: [Role.OPERATOR]
  },
  {
    title: "退款审核",
    href: "/manager-refund",
    icon: BarChart3,
    roles: [Role.OPERATOR]
  },
  {
    title: "用户管理",
    href: "/user-management",
    icon: BarChart3,
    roles: [Role.OPERATOR]
  },
  {
    title: "财务记录",
    href: "/financial-records",
    icon: BarChart3,
    roles: [Role.OPERATOR]
  },
  {
    title: "价格配置表",
    href: "/price-settings",
    icon: ShieldAlert,
    roles: [Role.ADMIN]
  },
  {
    title: "全局配置",
    href: "/global-settings",
    icon: ShieldAlert,
    roles: [Role.ADMIN]
  },
  {
    title: "个人设置",
    href: "/profile",
    icon: UserCog,
    roles: [Role.SALES, Role.TUTOR, Role.MANAGER, Role.OPERATOR, Role.ADMIN]
  }
]

export function DashboardSidebar() {
  const { currentRole } = useAuth()
  const pathname = usePathname()

  if (!currentRole) return null

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentRole))

  return (
    <div className="hidden border-r bg-gray-50/40 dark:bg-gray-800/40 md:block w-64 min-h-screen flex-col">
      <div className="flex h-16 items-center border-b px-6">
        <Link className="flex items-center gap-2 font-bold text-xl text-primary" href="/">
          <LayoutDashboard className="h-6 w-6" />
          <span>EduFlow</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-4">
        <nav className="grid items-start px-4 text-sm font-medium">
          {filteredNavItems.map((item, index) => {
            const Icon = item.icon
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  pathname === item.href
                    ? "bg-gray-100 text-primary dark:bg-gray-800"
                    : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

export function DashboardHeader({ setSidebarOpen }: { setSidebarOpen: (open: boolean) => void }) {
  const { user, logout, currentRole, switchRole } = useAuth()
  
  if (!user) return null

  return (
    <header className="flex h-16 items-center gap-4 border-b bg-white dark:bg-gray-950 px-6 w-full">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle menu</span>
      </Button>
      <div className="w-full flex-1">
        <div className="md:hidden font-bold text-lg">EduFlow</div>
      </div>
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user.phone}
                </p>
                <div className="pt-1">
                    <span className="inline-flex items-center rounded-full border border-gray-200 px-2.5 py-0.5 text-xs font-semibold text-gray-900 dark:border-gray-800 dark:text-gray-100">
                        {currentRole}
                    </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>切换角色</DropdownMenuLabel>
            {user.roles.map(role => (
                <DropdownMenuItem key={role} onClick={() => switchRole(role)} disabled={role === currentRole}>
                    {role} {role === currentRole && " (当前)"}
                </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>退出登录</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
