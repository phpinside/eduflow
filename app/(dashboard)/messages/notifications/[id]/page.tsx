"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useSiteMessages, getNotificationStatus } from "@/hooks/useSiteMessages"
import {
  AcknowledgeButton,
  formatMessageDate,
  PriorityBadge,
  RoleTags,
} from "@/components/messages/MessageListShared"

export default function NotificationDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const {
    notifications,
    receipts,
    userId,
    acknowledgeNotification,
  } = useSiteMessages()

  const notification = notifications.find(n => n.id === params.id)

  if (!notification) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pt-20 text-center">
        <p className="text-muted-foreground">通知不存在或已被删除</p>
        <Button variant="outline" onClick={() => router.push("/messages/notifications")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回通知列表
        </Button>
      </div>
    )
  }

  const status = getNotificationStatus(receipts, userId, notification)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/messages/notifications">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回通知列表
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={notification.priority} />
            {status === "pending" ? (
              <span className="text-xs font-medium text-red-600">待确认</span>
            ) : (
              <span className="text-xs text-muted-foreground">已确认</span>
            )}
          </div>
          <CardTitle className="text-xl">{notification.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <RoleTags roles={notification.targetRoles} />
            <Separator orientation="vertical" className="h-3" />
            <span>发布于 {formatMessageDate(notification.publishedAt)}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {notification.content}
          </p>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <AcknowledgeButton
              acknowledged={status === "acknowledged"}
              onAck={() => acknowledgeNotification(notification.id)}
            />
            {notification.actionHref && (
              <Button variant="outline" size="sm" asChild>
                <Link href={notification.actionHref}>
                  {notification.actionLabel ?? "相关页面"}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
