"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { BellRing } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useSiteMessages } from "@/hooks/useSiteMessages"
import { PRIORITY_LABEL, priorityBadgeClass } from "@/lib/message-display"
import { cn } from "@/lib/utils"

export function NotificationAckDialog() {
  const { blockingNotification, acknowledgeNotification, pendingCount } =
    useSiteMessages()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(Boolean(blockingNotification))
  }, [blockingNotification?.id])

  if (!blockingNotification) return null

  const n = blockingNotification

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={e => e.preventDefault()}
        onEscapeKeyDown={e => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600 text-white">
              <BellRing className="h-5 w-5" />
            </div>
            <div className="space-y-1 text-left">
              <DialogTitle>重要通知待确认</DialogTitle>
              <Badge className={cn("border", priorityBadgeClass(n.priority))}>
                {PRIORITY_LABEL[n.priority]}
              </Badge>
            </div>
          </div>
          <DialogDescription className="sr-only">
            请阅读并确认已阅读本条系统通知
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <p className="font-semibold text-foreground">{n.title}</p>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {n.content}
          </p>
          {pendingCount > 1 && (
            <p className="text-xs text-muted-foreground">
              另有 {pendingCount - 1} 条通知待确认，确认后可继续处理。
            </p>
          )}
        </div>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {n.actionHref && (
            <Button variant="outline" className="w-full" asChild>
              <Link href={n.actionHref}>{n.actionLabel ?? "前往处理"}</Link>
            </Button>
          )}
          <Button
            className="w-full bg-red-600 hover:bg-red-700"
            onClick={() => {
              acknowledgeNotification(n.id)
              setOpen(false)
            }}
          >
            确认已阅读
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
