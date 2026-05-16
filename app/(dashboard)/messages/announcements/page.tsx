"use client"

import Link from "next/link"
import { ChevronRight, Bell, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useSiteMessages } from "@/hooks/useSiteMessages"
import { formatMessageDate, PriorityBadge } from "@/components/messages/MessageListShared"

export default function AnnouncementsPage() {
  const { announcements, userId, receipts } = useSiteMessages()

  const isRead = (id: string) => {
    const r = receipts.find(
      x => x.userId === userId && x.kind === "announcement" && x.messageId === id
    )
    return Boolean(r?.readAt)
  }

  const sorted = [...announcements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">网站公告</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            公告仅供阅读，无需确认；关闭顶栏横幅不影响在此查看全文。
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/messages/notifications">
            <Bell className="mr-2 h-4 w-4" />
            系统通知
          </Link>
        </Button>
      </div>

      <Card>
        {sorted.length === 0 ? (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            暂无有效公告
          </CardContent>
        ) : (
          <div className="divide-y">
            {sorted.map(a => {
              const read = isRead(a.id)
              return (
                <Link
                  key={a.id}
                  href={`/messages/announcements/${a.id}`}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50",
                    !read && "bg-primary/[0.03] dark:bg-primary/[0.06]"
                  )}
                >
                  <div className="flex flex-shrink-0 items-center gap-1.5">
                    <PriorityBadge priority={a.priority} />
                    {a.pinned && (
                      <Pin className="h-3.5 w-3.5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={cn("truncate", read ? "text-muted-foreground" : "font-medium")}>
                        {a.title}
                      </p>
                      {!read && (
                        <Badge variant="secondary" className="flex-shrink-0 bg-primary/10 text-[10px] text-primary">
                          未读
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {a.summary}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-muted-foreground">
                    {formatMessageDate(a.publishedAt)}
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
