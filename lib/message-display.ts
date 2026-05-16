import type { MessagePriority } from "@/types/site-message"
import { Role } from "@/types"

export const ROLE_LABEL: Record<Role, string> = {
  [Role.SALES]: "招生老师",
  [Role.TUTOR]: "伴学教练",
  [Role.MANAGER]: "学管",
  [Role.OPERATOR]: "运营人员",
  [Role.ADMIN]: "管理员",
}

export const PRIORITY_LABEL: Record<MessagePriority, string> = {
  normal: "普通",
  high: "重要",
  urgent: "紧急",
}

export function priorityBadgeClass(priority: MessagePriority) {
  switch (priority) {
    case "urgent":
      return "bg-red-600 text-white border-red-700"
    case "high":
      return "bg-amber-500 text-white border-amber-600"
    default:
      return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200"
  }
}

export function priorityBannerClass(priority: MessagePriority, kind: "notification" | "announcement") {
  if (kind === "notification") {
    switch (priority) {
      case "urgent":
        return "border-red-300 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/50 dark:to-orange-950/30"
      case "high":
        return "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/40 dark:to-yellow-950/20"
      default:
        return "border-orange-200 bg-orange-50/90 dark:bg-orange-950/30"
    }
  }
  switch (priority) {
    case "urgent":
      return "border-violet-300 bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-violet-950/40 dark:to-indigo-950/30"
    case "high":
      return "border-blue-300 bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-950/40 dark:to-sky-950/20"
    default:
      return "border-slate-200 bg-slate-50 dark:bg-slate-900/50"
  }
}
