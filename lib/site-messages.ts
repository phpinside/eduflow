import { Role } from "@/types"
import type {
  MessageReceipt,
  SiteAnnouncement,
  SiteMessageKind,
  SiteNotification,
} from "@/types/site-message"
import {
  mockSiteAnnouncements,
  mockSiteNotifications,
} from "@/lib/mock-data/site-messages"
import { getMockData, saveMockData } from "@/lib/storage"

export const SITE_MESSAGE_KEYS = {
  ANNOUNCEMENTS: "eduflow:site-announcements",
  NOTIFICATIONS: "eduflow:site-notifications",
  RECEIPTS: "eduflow:message-receipts",
} as const

export const SITE_MESSAGES_UPDATED_EVENT = "eduflow:site-messages-updated"

export function emitSiteMessagesUpdated() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new Event(SITE_MESSAGES_UPDATED_EVENT))
}

export const getStoredAnnouncements = (): SiteAnnouncement[] =>
  getMockData(SITE_MESSAGE_KEYS.ANNOUNCEMENTS, mockSiteAnnouncements)

export const getStoredNotifications = (): SiteNotification[] =>
  getMockData(SITE_MESSAGE_KEYS.NOTIFICATIONS, mockSiteNotifications)

export const getStoredMessageReceipts = (): MessageReceipt[] =>
  getMockData(SITE_MESSAGE_KEYS.RECEIPTS, [] as MessageReceipt[])

export function saveStoredMessageReceipts(receipts: MessageReceipt[]) {
  saveMockData(SITE_MESSAGE_KEYS.RECEIPTS, receipts)
}

function isActiveByDate(publishedAt: Date, expiresAt?: Date) {
  const now = Date.now()
  if (publishedAt.getTime() > now) return false
  if (expiresAt && expiresAt.getTime() < now) return false
  return true
}

export function messageTargetsRole(targetRoles: Role[], role: Role | null) {
  if (!role) return false
  if (!targetRoles.length) return true
  return targetRoles.includes(role)
}

function findReceipt(
  receipts: MessageReceipt[],
  userId: string,
  kind: SiteMessageKind,
  messageId: string
) {
  return receipts.find(
    r => r.userId === userId && r.kind === kind && r.messageId === messageId
  )
}

function upsertReceipt(
  receipts: MessageReceipt[],
  patch: Omit<MessageReceipt, "id"> & { id?: string }
): MessageReceipt[] {
  const existing = findReceipt(
    receipts,
    patch.userId,
    patch.kind,
    patch.messageId
  )
  if (existing) {
    return receipts.map(r =>
      r.id === existing.id
        ? {
            ...r,
            ...patch,
            id: r.id,
          }
        : r
    )
  }
  const row: MessageReceipt = {
    id: patch.id ?? `rcpt-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    userId: patch.userId,
    kind: patch.kind,
    messageId: patch.messageId,
    readAt: patch.readAt,
    acknowledgedAt: patch.acknowledgedAt,
    bannerDismissedAt: patch.bannerDismissedAt,
  }
  return [...receipts, row]
}

export function filterAnnouncementsForRole(
  items: SiteAnnouncement[],
  role: Role | null
) {
  return items
    .filter(a => messageTargetsRole(a.targetRoles, role))
    .filter(a => isActiveByDate(new Date(a.publishedAt), a.expiresAt ? new Date(a.expiresAt) : undefined))
    .sort(
      (a, b) =>
        Number(b.pinned) - Number(a.pinned) ||
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
}

export function filterNotificationsForRole(
  items: SiteNotification[],
  role: Role | null
) {
  return items
    .filter(n => messageTargetsRole(n.targetRoles, role))
    .filter(n => isActiveByDate(new Date(n.publishedAt), n.expiresAt ? new Date(n.expiresAt) : undefined))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
}

export function isNotificationAcknowledged(
  receipts: MessageReceipt[],
  userId: string,
  notificationId: string
) {
  const r = findReceipt(receipts, userId, "notification", notificationId)
  return Boolean(r?.acknowledgedAt)
}

export function isAnnouncementBannerDismissed(
  receipts: MessageReceipt[],
  userId: string,
  announcementId: string
) {
  const r = findReceipt(receipts, userId, "announcement", announcementId)
  return Boolean(r?.bannerDismissedAt)
}

export function markAnnouncementRead(userId: string, announcementId: string) {
  const receipts = getStoredMessageReceipts()
  const next = upsertReceipt(receipts, {
    userId,
    kind: "announcement",
    messageId: announcementId,
    readAt: new Date(),
  })
  saveStoredMessageReceipts(next)
  emitSiteMessagesUpdated()
}

export function dismissAnnouncementBanner(
  userId: string,
  announcementId: string
) {
  const receipts = getStoredMessageReceipts()
  const next = upsertReceipt(receipts, {
    userId,
    kind: "announcement",
    messageId: announcementId,
    bannerDismissedAt: new Date(),
    readAt: new Date(),
  })
  saveStoredMessageReceipts(next)
  emitSiteMessagesUpdated()
}

export function acknowledgeNotification(userId: string, notificationId: string) {
  const receipts = getStoredMessageReceipts()
  const next = upsertReceipt(receipts, {
    userId,
    kind: "notification",
    messageId: notificationId,
    readAt: new Date(),
    acknowledgedAt: new Date(),
  })
  saveStoredMessageReceipts(next)
  emitSiteMessagesUpdated()
}

export function markNotificationRead(userId: string, notificationId: string) {
  const receipts = getStoredMessageReceipts()
  const existing = findReceipt(receipts, userId, "notification", notificationId)
  if (existing?.acknowledgedAt) return
  const next = upsertReceipt(receipts, {
    userId,
    kind: "notification",
    messageId: notificationId,
    readAt: new Date(),
  })
  saveStoredMessageReceipts(next)
  emitSiteMessagesUpdated()
}

export function initializeSiteMessages() {
  if (typeof window === "undefined") return
  if (!localStorage.getItem(SITE_MESSAGE_KEYS.ANNOUNCEMENTS)) {
    saveMockData(SITE_MESSAGE_KEYS.ANNOUNCEMENTS, mockSiteAnnouncements)
  }
  if (!localStorage.getItem(SITE_MESSAGE_KEYS.NOTIFICATIONS)) {
    saveMockData(SITE_MESSAGE_KEYS.NOTIFICATIONS, mockSiteNotifications)
  }
  if (!localStorage.getItem(SITE_MESSAGE_KEYS.RECEIPTS)) {
    saveMockData(SITE_MESSAGE_KEYS.RECEIPTS, [] as MessageReceipt[])
  }
}

export function saveStoredAnnouncements(items: SiteAnnouncement[]) {
  saveMockData(SITE_MESSAGE_KEYS.ANNOUNCEMENTS, items)
  emitSiteMessagesUpdated()
}

export function saveStoredNotifications(items: SiteNotification[]) {
  saveMockData(SITE_MESSAGE_KEYS.NOTIFICATIONS, items)
  emitSiteMessagesUpdated()
}
