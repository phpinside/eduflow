"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronRight, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useSiteMessages, getNotificationStatus } from "@/hooks/useSiteMessages"
import { formatMessageDate, PriorityBadge } from "@/components/messages/MessageListShared"

type FilterTab = "all" | "pending" | "done"

export default function NotificationsPage() {
  const {
    notifications,
    receipts,
    userId,
  } = useSiteMessages()
  const [tab, setTab] = useState<FilterTab>("pending")

  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const status = getNotificationStatus(receipts, userId, n)
      if (tab === "pending") return status === "pending"
      if (tab === "done") return status === "acknowledged"
      return true
    })
  }, [notifications, receipts, userId, tab])

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={v => setTab(v as FilterTab)}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pending">待确认</TabsTrigger>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="done">已确认</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" asChild>
            <Link href="/messages/announcements">
              <Megaphone className="mr-2 h-4 w-4" />
              网站公告
            </Link>
          </Button>
        </div>
      </Tabs>

      <Card>
        {filtered.length === 0 ? (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            当前筛选下暂无通知
          </CardContent>
        ) : (
          <div className="divide-y">
            {filtered.map(n => {
              const status = getNotificationStatus(receipts, userId, n)
              return (
                <Link
                  key={n.id}
                  href={`/messages/notifications/${n.id}`}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50",
                    status === "pending" && "bg-red-50/40 dark:bg-red-950/20"
                  )}
                >
                  <div className="flex-shrink-0">
                    <PriorityBadge priority={n.priority} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{n.title}</p>
                      {status === "pending" && (
                        <span className="flex-shrink-0 text-xs font-medium text-red-600">待确认</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {n.summary}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {formatMessageDate(n.publishedAt)}
                  </span>
                  <ChevronRight className="flex-shrink-0 h-4 w-4 text-muted-foreground/50" />
                </Link>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
