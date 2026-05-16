"use client"

import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Megaphone, Pin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useSiteMessages } from "@/hooks/useSiteMessages"
import {
  formatMessageDate,
  PriorityBadge,
  RoleTags,
} from "@/components/messages/MessageListShared"

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { announcements, userId, receipts } = useSiteMessages()

  const announcement = announcements.find(a => a.id === params.id)

  if (!announcement) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pt-20 text-center">
        <p className="text-muted-foreground">公告不存在或已过期</p>
        <Button variant="outline" onClick={() => router.push("/messages/announcements")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回公告列表
        </Button>
      </div>
    )
  }

  const receipt = receipts.find(
    x => x.userId === userId && x.kind === "announcement" && x.messageId === announcement.id
  )
  const isRead = Boolean(receipt?.readAt)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/messages/announcements">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回公告列表
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <PriorityBadge priority={announcement.priority} />
            {announcement.pinned && (
              <Badge variant="secondary" className="gap-1 text-[10px]">
                <Pin className="h-3 w-3" />
                置顶
              </Badge>
            )}
            {!isRead && (
              <Badge variant="secondary" className="bg-primary/10 text-[10px] text-primary">
                未读
              </Badge>
            )}
          </div>
          <CardTitle className="text-xl">{announcement.title}</CardTitle>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Megaphone className="h-3.5 w-3.5" />
            <RoleTags roles={announcement.targetRoles} />
            <Separator orientation="vertical" className="h-3" />
            <span>发布于 {formatMessageDate(announcement.publishedAt)}</span>
            {announcement.expiresAt && (
              <>
                <Separator orientation="vertical" className="h-3" />
                <span>有效期至 {formatMessageDate(announcement.expiresAt)}</span>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {announcement.content}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
