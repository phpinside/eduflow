"use client"

import { SiteMessageBanners } from "@/components/messages/SiteMessageBanners"
import { NotificationAckDialog } from "@/components/messages/NotificationAckDialog"

/** 顶栏下方横幅 + 紧急通知确认弹窗 */
export function SiteMessagesProvider() {
  return (
    <>
      <SiteMessageBanners />
      <NotificationAckDialog />
    </>
  )
}
