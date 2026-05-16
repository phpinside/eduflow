"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import type { MessageReceipt, SiteAnnouncement, SiteNotification } from "@/types/site-message"
import {
  SITE_MESSAGES_UPDATED_EVENT,
  acknowledgeNotification,
  dismissAnnouncementBanner,
  filterAnnouncementsForRole,
  filterNotificationsForRole,
  getStoredAnnouncements,
  getStoredMessageReceipts,
  getStoredNotifications,
  initializeSiteMessages,
  isAnnouncementBannerDismissed,
  isNotificationAcknowledged,
  markAnnouncementRead,
} from "@/lib/site-messages"

export function useSiteMessages() {
  const { user, currentRole } = useAuth()
  const [tick, setTick] = useState(0)

  const refresh = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    initializeSiteMessages()
  }, [])

  useEffect(() => {
    const onUpdate = () => refresh()
    window.addEventListener(SITE_MESSAGES_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(SITE_MESSAGES_UPDATED_EVENT, onUpdate)
  }, [refresh])

  const userId = user?.id ?? ""

  const { announcements, notifications, receipts } = useMemo(() => {
    void tick
    const announcements = filterAnnouncementsForRole(
      getStoredAnnouncements(),
      currentRole
    )
    const notifications = filterNotificationsForRole(
      getStoredNotifications(),
      currentRole
    )
    const receipts = getStoredMessageReceipts()
    return { announcements, notifications, receipts }
  }, [tick, currentRole])

  const pendingNotifications = useMemo(
    () =>
      notifications.filter(
        n => !isNotificationAcknowledged(receipts, userId, n.id)
      ),
    [notifications, receipts, userId]
  )

  const bannerAnnouncements = useMemo(
    () =>
      announcements.filter(a => {
        if (isAnnouncementBannerDismissed(receipts, userId, a.id)) return false
        return a.pinned || a.priority === "high" || a.priority === "urgent"
      }),
    [announcements, receipts, userId]
  )

  const blockingNotification = useMemo(
    () =>
      pendingNotifications.find(n => n.priority === "urgent") ??
      pendingNotifications.find(n => n.priority === "high") ??
      null,
    [pendingNotifications]
  )

  const ack = useCallback(
    (notificationId: string) => {
      if (!userId) return
      acknowledgeNotification(userId, notificationId)
      refresh()
    },
    [userId, refresh]
  )

  const dismissAnnouncement = useCallback(
    (announcementId: string) => {
      if (!userId) return
      dismissAnnouncementBanner(userId, announcementId)
      refresh()
    },
    [userId, refresh]
  )

  const readAnnouncement = useCallback(
    (announcementId: string) => {
      if (!userId) return
      markAnnouncementRead(userId, announcementId)
      refresh()
    },
    [userId, refresh]
  )

  return {
    userId,
    currentRole,
    announcements,
    notifications,
    receipts,
    pendingNotifications,
    bannerAnnouncements,
    blockingNotification,
    pendingCount: pendingNotifications.length,
    acknowledgeNotification: ack,
    dismissAnnouncementBanner: dismissAnnouncement,
    markAnnouncementRead: readAnnouncement,
    refresh,
  }
}

export function getNotificationStatus(
  receipts: MessageReceipt[],
  userId: string,
  notification: SiteNotification
) {
  const acked = isNotificationAcknowledged(receipts, userId, notification.id)
  return acked ? ("acknowledged" as const) : ("pending" as const)
}

export function getAnnouncementBannerVisible(
  receipts: MessageReceipt[],
  userId: string,
  announcement: SiteAnnouncement
) {
  return !isAnnouncementBannerDismissed(receipts, userId, announcement.id)
}
