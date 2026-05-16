"use client"

import Link from "next/link"
import { Bell, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSiteMessages } from "@/hooks/useSiteMessages"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"

export function MessageCenterBell() {
  const { pendingNotifications, pendingCount, announcements } = useSiteMessages()
  const recent = pendingNotifications.slice(0, 4)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 shrink-0 border-orange-200 bg-orange-50/80 hover:bg-orange-100 dark:border-orange-900 dark:bg-orange-950/40"
          aria-label="消息中心"
        >
          <Bell className="h-4 w-4 text-orange-700 dark:text-orange-300" />
          {pendingCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-gray-950">
              {pendingCount > 9 ? "9+" : pendingCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>待确认通知</span>
          {pendingCount > 0 && (
            <Badge variant="destructive" className="font-normal">
              {pendingCount} 条
            </Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recent.length === 0 ? (
          <p className="px-2 py-4 text-center text-sm text-muted-foreground">
            暂无待确认通知
          </p>
        ) : (
          recent.map(n => (
            <DropdownMenuItem key={n.id} asChild className="cursor-pointer flex-col items-start gap-0.5 py-2">
              <Link href="/messages/notifications">
                <span className="line-clamp-1 font-medium">{n.title}</span>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(n.publishedAt), "MM-dd HH:mm", { locale: zhCN })}
                </span>
              </Link>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/messages/notifications" className="w-full cursor-pointer">
            <Bell className="mr-2 h-4 w-4" />
            通知列表
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/messages/announcements" className="w-full cursor-pointer">
            <Megaphone className="mr-2 h-4 w-4" />
            公告列表
            {announcements.length > 0 && (
              <span className="ml-auto text-xs text-muted-foreground">
                {announcements.length} 条有效
              </span>
            )}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
