"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@/types"
import type { HeaderNavConfig } from "@/types"
import { getStoredHeaderNavConfigs } from "@/lib/storage"
import { getIconComponent } from "@/lib/icon-map"
import {
  LayoutDashboard,
  ShoppingCart,
  GraduationCap,
  Users,
  Calendar,
  Settings,
  ShieldAlert,
  BarChart3,
  BookOpen,
  LogOut,
  Menu,
  X,
  UserCog,
  Wallet,
  ClipboardList,
  UserSearch,
  Store,
  BookUser,
  BadgeDollarSign,
  RefreshCcwDot,
  UsersRound,
  FileText,
  FilePlus,
  DollarSign,
  CircleDollarSign,
  Tag,
  Sliders,
  MessageSquareText,
  Clock,
  Network,
  ChevronDown,
  Search,
  FileSearch,
  ClipboardCheck,
  PanelLeft,
  Sparkles,
  ExternalLink,
  Bell,
  Megaphone,
  Compass,
} from "lucide-react"
import { MessageCenterBell } from "@/components/messages/MessageCenterBell"
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
  /** Required for leaf items; omit when `children` is set (parent row is expand-only). */
  href?: string
  /** When `children` exist, used to expand/highlight when pathname matches deeper routes (e.g. `/students-center/[orderId]`). */
  matchPrefix?: string
  icon: React.ComponentType<{ className?: string }>
  roles: Role[]
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    title: "概览",
    href: "/",
    icon: LayoutDashboard,
    roles: [Role.SALES, Role.TUTOR, Role.MANAGER, Role.OPERATOR, Role.ADMIN]
  },
  {
    title: "订单中心",
    matchPrefix: "/manager-orders",
    icon: ShoppingCart,
    roles: [Role.OPERATOR],
    children: [
      {
        title: "订单管理",
        href: "/manager-orders",
        icon: ClipboardList,
        roles: [Role.OPERATOR],
      },
      {
        title: "订单补录",
        href: "/order-accord",
        icon: FilePlus,
        roles: [Role.OPERATOR],
      },
    ],
  },
  {
    title: "财务中心",
    icon: Wallet,
    roles: [Role.OPERATOR],
    children: [
      {
        title: "财务记录",
        href: "/financial-records",
        icon: CircleDollarSign,
        roles: [Role.OPERATOR],
      },
      {
        title: "退款审核",
        href: "/manager-refund",
        icon: RefreshCcwDot,
        roles: [Role.OPERATOR],
      },
      {
        title: "伴学教练收入",
        href: "/tutor-income",
        icon: BadgeDollarSign,
        roles: [Role.OPERATOR],
      },
      {
        title: "伴学团队收入",
        href: "/management-income",
        icon: UsersRound,
        roles: [Role.OPERATOR],
      },
    ],
  },
  {
    title: "用户管理",
    href: "/user-management",
    icon: Users,
    roles: [Role.OPERATOR],
  },
  {
    title: "订单管理",
    href: "/orders",
    icon: ClipboardList,
    roles: [Role.SALES,]
  },
  {
    title: "订单搜索",
    href: "/manager-order-search",
    icon: Search,
    roles: [Role.MANAGER],
  },
  {
    title: "学员档案",
    href: "/students",
    icon: UserSearch,
    roles: [Role.SALES,]
  },
  {
    title: "接单中心",
    href: "/orders/market",
    icon: Store,
    roles: [Role.TUTOR , Role.MANAGER, ]
  },
  {
    title: "学员中心",
    matchPrefix: "/students-center",
    icon: GraduationCap,
    roles: [Role.TUTOR, Role.MANAGER],
    children: [
      {
        title: "我的学员",
        href: "/my-students",
        icon: BookUser,
        roles: [Role.TUTOR, Role.MANAGER],
      },
      {
        title: "团队学员",
        href: "/team-students",
        icon: UsersRound,
        roles: [Role.MANAGER],
      },
    ],
  },
  {
    title: "教学与反馈",
    matchPrefix: "/teaching-feedback",
    icon: MessageSquareText,
    roles: [Role.TUTOR, Role.MANAGER, Role.OPERATOR],
    children: [
      {
        title: "课后反馈检索",
        href: "/teaching-feedback/feedback-search",
        icon: Search,
        roles: [Role.TUTOR, Role.MANAGER, Role.OPERATOR],
      },
      {
        title: "阶段性测评检索",
        href: "/teaching-feedback/assessment-search",
        icon: ClipboardCheck,
        roles: [Role.TUTOR, Role.MANAGER, Role.OPERATOR],
      },
      {
        title: "学习规划书检索",
        href: "/teaching-feedback/plan-search",
        icon: FileSearch,
        roles: [Role.TUTOR, Role.MANAGER, Role.OPERATOR],
      },
    ],
  },
  {
    title: "组织与人员",
    matchPrefix: "/team-management",
    icon: Network,
    roles: [Role.OPERATOR],
    children: [
      {
        title: "伴学教练检索",
        href: "/team-management/tutor-search",
        icon: UserSearch,
        roles: [Role.OPERATOR],
      },
      {
        title: "伴学团队检索",
        href: "/team-management/manager-search",
        icon: UsersRound,
        roles: [Role.OPERATOR],
      },
      {
        title: "分公司管理",
        href: "/branch-companies",
        icon: Store,
        roles: [Role.OPERATOR],
      },
    ],
  },
  {
    title: "团队管理",
    matchPrefix: "/team-management",
    icon: Network,
    roles: [ Role.MANAGER],
    children: [
      {
        title: "伴学教练检索",
        href: "/team-management/tutor-search",
        icon: UserSearch,
        roles: [ Role.MANAGER],
      },
      {
        title: "伴学团队检索",
        href: "/team-management/manager-search",
        icon: UsersRound,
        roles: [ Role.MANAGER],
      },
    ],
  },
  {
    title: "收入与统计",
    icon: Wallet,
    roles: [Role.TUTOR, Role.MANAGER],
    children: [
      {
        title: "课时收入",
        href: "/lesson-income",
        icon: Wallet,
        roles: [Role.TUTOR, Role.MANAGER],
      },
      {
        title: "管理收入",
        href: "/management-income",
        icon: UsersRound,
        roles: [Role.MANAGER],
      },
    ],
  },
  {
    title: "我的日历",
    href: "/calendar",
    icon: Calendar,
    roles: [Role.TUTOR, Role.MANAGER]
  },
  {
    title: "操作日志",
    href: "/operation-logs",
    icon: FileText,
    roles: [Role.OPERATOR, Role.ADMIN]
  },
  {
    title: "教学科目配置",
    href: "/subject-settings",
    icon: BookOpen,
    roles: [Role.ADMIN]
  },
  {
    title: "价格配置表",
    href: "/price-settings",
    icon: Tag,
    roles: [Role.ADMIN]
  },
  {
    title: "全局配置",
    href: "/global-settings",
    icon: Sliders,
    roles: [Role.ADMIN]
  },
  {
    title: "信用分规则配置",
    href: "/tutor-credit-rule-settings",
    icon: BadgeDollarSign,
    roles: [Role.ADMIN]
  },
  {
    title: "消息中心",
    matchPrefix: "/messages",
    icon: Bell,
    roles: [Role.SALES, Role.TUTOR, Role.MANAGER, Role.OPERATOR, Role.ADMIN],
    children: [
      {
        title: "系统通知",
        href: "/messages/notifications",
        icon: Bell,
        roles: [Role.SALES, Role.TUTOR, Role.MANAGER, Role.OPERATOR, Role.ADMIN],
      },
      {
        title: "网站公告",
        href: "/messages/announcements",
        icon: Megaphone,
        roles: [Role.SALES, Role.TUTOR, Role.MANAGER, Role.OPERATOR, Role.ADMIN],
      },
      {
        title: "通知管理",
        href: "/messages/admin/notifications",
        icon: Bell,
        roles: [Role.OPERATOR],
      },
      {
        title: "公告管理",
        href: "/messages/admin/announcements",
        icon: Megaphone,
        roles: [Role.OPERATOR],
      },
    ],
  },
  {
    title: "导航管理",
    href: "/nav-settings",
    icon: Compass,
    roles: [Role.OPERATOR]
  },
  {
    title: "个人设置",
    href: "/profile",
    icon: UserCog,
    roles: [Role.SALES, Role.TUTOR, Role.MANAGER, Role.OPERATOR, Role.ADMIN]
  }
]

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  return React.createElement(getIconComponent(name), { className })
}

function DashboardHeaderNav({ pathname }: { pathname: string }) {
  const { currentRole } = useAuth()
  const [navConfigs, setNavConfigs] = React.useState<HeaderNavConfig[]>([])

  React.useEffect(() => {
    setNavConfigs(getStoredHeaderNavConfigs())

    const handler = () => setNavConfigs(getStoredHeaderNavConfigs())
    window.addEventListener('header-nav-updated', handler)
    return () => window.removeEventListener('header-nav-updated', handler)
  }, [])

  const visibleLinks = React.useMemo(() => {
    return navConfigs
      .filter(c => c.enabled && (!currentRole || c.visibleRoles.includes(currentRole)))
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }, [navConfigs, currentRole])

  return (
    <nav
      aria-label="顶部快捷导航"
      className="hidden min-w-0 flex-1 md:flex md:items-center md:px-2"
    >
      <div className="flex min-w-0 flex-wrap items-center gap-x-0.5 gap-y-1 border-l border-border/80 pl-3 dark:border-border/60">
        {visibleLinks.map(link => {
          const isInternal = !link.external && !link.href.startsWith("http")
          const isActive =
            isInternal &&
            (link.href === "/"
              ? pathname === "/"
              : pathname === link.href || pathname.startsWith(`${link.href}/`))

          const className = cn(
            "group inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[13px] font-medium tracking-tight transition-colors",
            link.emphasis
              ? "bg-primary/5 text-primary ring-1 ring-primary/15 hover:bg-primary/10"
              : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
            isActive && "bg-muted text-foreground shadow-sm ring-1 ring-border/60"
          )

          const content = (
            <>
              <DynamicIcon
                name={link.icon}
                className={cn(
                  "h-3.5 w-3.5 shrink-0 opacity-80 transition-opacity group-hover:opacity-100",
                  link.emphasis && "text-primary"
                )}
              />
              <span className="whitespace-nowrap">{link.title}</span>
              {link.emphasis && (
                <Sparkles className="h-3 w-3 shrink-0 text-primary/70" aria-hidden />
              )}
              {link.external && (
                <ExternalLink className="h-2.5 w-2.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-50" aria-hidden />
              )}
            </>
          )

          if (link.external) {
            return (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            )
          }

          return (
            <Link key={link.id} href={link.href} className={className}>
              {content}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function NavItemLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const hasChildren = Boolean(item.children && item.children.length > 0)
  const matchesGroup =
    hasChildren &&
    (item.children!.some(c => pathname.startsWith(c.href!)) ||
      (item.matchPrefix ? pathname.startsWith(item.matchPrefix) : false))

  const [open, setOpen] = React.useState(() =>
    hasChildren ? Boolean(matchesGroup) : false
  )

  const Icon = item.icon
  const isActive = Boolean(item.href && pathname === item.href)
  const isChildActive = Boolean(matchesGroup)

  if (!hasChildren) {
    const href = item.href!
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
          isActive
            ? "bg-gray-100 text-primary dark:bg-gray-800"
            : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        <Icon className="h-4 w-4" />
        {item.title}
      </Link>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
          isActive || isChildActive
            ? "bg-gray-100 text-primary dark:bg-gray-800"
            : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        <Icon className="h-4 w-4" />
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="ml-4 mt-0.5 grid gap-0.5 border-l border-gray-200 pl-2 dark:border-gray-700">
          {item.children!.map((child, idx) => {
            const ChildIcon = child.icon
            return (
              <Link
                key={idx}
                href={child.href!}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-1.5 text-[13px] transition-all hover:text-primary",
                  pathname.startsWith(child.href!)
                    ? "bg-gray-100 text-primary dark:bg-gray-800"
                    : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800"
                )}
              >
                <ChildIcon className="h-3.5 w-3.5" />
                {child.title}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function DashboardSidebar({ desktopHidden = false }: { desktopHidden?: boolean }) {
  const { currentRole } = useAuth()
  const pathname = usePathname()

  if (!currentRole) return null

  const filteredNavItems = navItems.filter(item => item.roles.includes(currentRole))

  return (
    <div
      className={cn(
        "hidden shrink-0 overflow-hidden border-r bg-gray-50/40 transition-[width] duration-200 ease-in-out dark:bg-gray-800/40 md:flex md:flex-col",
        desktopHidden ? "md:w-0 md:border-transparent md:pointer-events-none" : "md:w-64"
      )}
    >
      <div className="flex min-h-screen w-64 flex-col">
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <Link className="flex items-center gap-2 text-xl font-bold text-primary" href="/">
            <LayoutDashboard className="h-6 w-6" />
            <span>EduFlow</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-4 text-sm font-medium">
            {filteredNavItems.map((item, index) => (
              <NavItemLink key={index} item={item} pathname={pathname} />
            ))}
          </nav>
        </div>
      </div>
    </div>
  )
}

export function DashboardHeader({
  setSidebarOpen,
  desktopSidebarHidden,
  setDesktopSidebarHidden,
}: {
  setSidebarOpen: (open: boolean) => void
  desktopSidebarHidden: boolean
  setDesktopSidebarHidden: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const { user, logout, currentRole, switchRole } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  return (
    <header className="flex min-h-16 w-full flex-wrap items-center gap-2 border-b bg-white px-4 py-2 md:flex-nowrap md:px-6 md:py-0 dark:bg-gray-950">
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
        <Menu className="h-6 w-6" />
        <span className="sr-only">打开菜单</span>
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="hidden shrink-0 md:inline-flex"
        title={desktopSidebarHidden ? "展开左侧菜单" : "隐藏左侧菜单"}
        aria-expanded={!desktopSidebarHidden}
        onClick={() => setDesktopSidebarHidden(prev => !prev)}
      >
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">{desktopSidebarHidden ? "展开左侧菜单" : "隐藏左侧菜单"}</span>
      </Button>
      <DashboardHeaderNav pathname={pathname} />
      <div className="min-w-0 flex-1 font-bold text-lg md:hidden">EduFlow</div>
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <MessageCenterBell />
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
