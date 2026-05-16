import { Role } from "@/types"

export type MessagePriority = "normal" | "high" | "urgent"

export interface SiteAnnouncement {
  id: string
  title: string
  summary: string
  content: string
  priority: MessagePriority
  /** 空数组表示全员可见 */
  targetRoles: Role[]
  publishedAt: Date
  expiresAt?: Date
  pinned?: boolean
}

export interface SiteNotification {
  id: string
  title: string
  summary: string
  content: string
  priority: MessagePriority
  targetRoles: Role[]
  publishedAt: Date
  expiresAt?: Date
  actionLabel?: string
  actionHref?: string
}

export type SiteMessageKind = "notification" | "announcement"

export interface MessageReceipt {
  id: string
  userId: string
  kind: SiteMessageKind
  messageId: string
  readAt?: Date
  /** 仅通知：确认已阅读 */
  acknowledgedAt?: Date
  /** 仅公告：关闭顶栏展示（无需确认） */
  bannerDismissedAt?: Date
}
