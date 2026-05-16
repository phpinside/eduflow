"use client"

import Link from "next/link"
import { BellRing, Megaphone, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSiteMessages } from "@/hooks/useSiteMessages"
import { PRIORITY_LABEL, priorityBadgeClass, priorityBannerClass } from "@/lib/message-display"

export function SiteMessageBanners() {
  const {
    pendingNotifications,
    bannerAnnouncements,
    acknowledgeNotification,
    dismissAnnouncementBanner,
  } = useSiteMessages()

  const topNotifications = pendingNotifications.slice(0, 2)
  const topAnnouncements = bannerAnnouncements.slice(0, 2)

  if (topNotifications.length === 0 && topAnnouncements.length === 0) {
    return null
  }

  return (
    <div className="shrink-0 space-y-2 border-b bg-white px-4 py-3 dark:bg-gray-950 md:px-6">
      {topNotifications.map(n => (
        <div
          key={n.id}
          className={cn(
            "relative flex flex-col gap-3 rounded-lg border px-4 py-3 shadow-sm md:flex-row md:items-center md:justify-between",
            priorityBannerClass(n.priority, "notification")
          )}
        >
          <div className="flex min-w-0 gap-3 pr-8 md:pr-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-md">
              <BellRing className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                  系统通知 · 待确认
                </span>
                <Badge className={cn("border", priorityBadgeClass(n.priority))}>
                  {PRIORITY_LABEL[n.priority]}
                </Badge>
              </div>
              <p className="font-semibold text-foreground">{n.title}</p>
              <p className="text-sm text-muted-foreground">{n.summary}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:shrink-0">
            {n.actionHref && (
              <Button variant="outline" size="sm" asChild>
                <Link href={n.actionHref}>{n.actionLabel ?? "查看详情"}</Link>
              </Button>
            )}
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              onClick={() => acknowledgeNotification(n.id)}
            >
              确认已阅读
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/messages/notifications">
                全部通知
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      ))}

      {topAnnouncements.map(a => (
        <div
          key={a.id}
          className={cn(
            "relative flex flex-col gap-2 rounded-lg border px-4 py-3 shadow-sm md:flex-row md:items-start md:justify-between",
            priorityBannerClass(a.priority, "announcement")
          )}
        >
          <div className="flex min-w-0 gap-3 pr-8">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
              <Megaphone className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                  网站公告
                </span>
                {a.pinned && (
                  <Badge variant="secondary" className="text-[10px]">
                    置顶
                  </Badge>
                )}
                <Badge className={cn("border", priorityBadgeClass(a.priority))}>
                  {PRIORITY_LABEL[a.priority]}
                </Badge>
              </div>
              <p className="font-semibold text-foreground">{a.title}</p>
              <p className="text-sm text-muted-foreground">{a.summary}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:pt-1">
            <Button variant="outline" size="sm" asChild>
              <Link href="/messages/announcements">查看公告</Link>
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-8 w-8 text-muted-foreground"
            aria-label="关闭本条公告展示"
            onClick={() => dismissAnnouncementBanner(a.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
