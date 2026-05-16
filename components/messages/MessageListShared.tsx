"use client"

import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import {
  PRIORITY_LABEL,
  ROLE_LABEL,
  priorityBadgeClass,
} from "@/lib/message-display"
import type { MessagePriority } from "@/types/site-message"
import { Role } from "@/types"

export function formatMessageDate(d: Date) {
  return format(new Date(d), "yyyy-MM-dd HH:mm", { locale: zhCN })
}

export function PriorityBadge({ priority }: { priority: MessagePriority }) {
  return (
    <Badge className={cn("border font-normal", priorityBadgeClass(priority))}>
      {PRIORITY_LABEL[priority]}
    </Badge>
  )
}

export function RoleTags({ roles }: { roles: Role[] }) {
  if (!roles.length) {
    return (
      <span className="text-xs text-muted-foreground">全员</span>
    )
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map(r => (
        <Badge key={r} variant="outline" className="text-[10px] font-normal">
          {ROLE_LABEL[r]}
        </Badge>
      ))}
    </div>
  )
}

export function MessageDetailCard({
  title,
  content,
  extra,
}: {
  title: string
  content: string
  extra?: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {content}
        </p>
        {extra}
      </CardContent>
    </Card>
  )
}

export function AcknowledgeButton({
  acknowledged,
  onAck,
}: {
  acknowledged: boolean
  onAck: () => void
}) {
  if (acknowledged) {
    return (
      <Badge variant="secondary" className="font-normal">
        已确认阅读
      </Badge>
    )
  }
  return (
    <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={onAck}>
      确认已阅读
    </Button>
  )
}
