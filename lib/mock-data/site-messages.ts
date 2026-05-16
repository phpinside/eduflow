import { Role } from "@/types"
import type { SiteAnnouncement, SiteNotification } from "@/types/site-message"

const allRoles = [
  Role.SALES,
  Role.TUTOR,
  Role.MANAGER,
  Role.OPERATOR,
  Role.ADMIN,
]

const daysAgo = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

export const mockSiteAnnouncements: SiteAnnouncement[] = [
  {
    id: "ann-001",
    title: "五一假期服务安排",
    summary: "客服与财务审核时间调整，请提前安排学员续费与退费申请。",
    content:
      "2026年5月1日至5月5日，在线客服响应时间为 9:00–18:00；财务二审顺延至节后首个工作日处理。\n\n请各角色关注学员侧沟通，避免假期积压。",
    priority: "high",
    targetRoles: allRoles,
    publishedAt: daysAgo(1),
    pinned: true,
  },
  {
    id: "ann-002",
    title: "新版课后反馈模板上线",
    summary: "模板字段优化，历史记录不受影响，请伴学教练与学管知悉。",
    content:
      "自本周起，课后反馈支持「课堂亮点 / 待巩固点 / 家长沟通建议」三段式填写，提交后仍可在原检索入口查询。",
    priority: "normal",
    targetRoles: [Role.TUTOR, Role.MANAGER, Role.OPERATOR],
    publishedAt: daysAgo(4),
  },
  {
    id: "ann-003",
    title: "招生老师正式课支付通道维护通知",
    summary: "4月20日 02:00–04:00 暂停在线支付，请引导线下凭证上传。",
    content:
      "维护期间新建正课订单请选择线下支付并上传凭证，运营将在工作时间内优先审核。",
    priority: "urgent",
    targetRoles: [Role.SALES, Role.OPERATOR],
    publishedAt: daysAgo(0),
    pinned: true,
  },
  {
    id: "ann-004",
    title: "系统演练：周日 00:30–01:00",
    summary: "短时可能无法登录，请提前保存未提交的表单内容。",
    content: "演练仅影响原型环境访问，生产环境不受影响。",
    priority: "normal",
    targetRoles: allRoles,
    publishedAt: daysAgo(7),
    expiresAt: daysAgo(-30),
  },
]

export const mockSiteNotifications: SiteNotification[] = [
  {
    id: "ntf-001",
    title: "您有 2 条退费申请待一审",
    summary: "请尽快处理，避免超过 SLA 影响学员体验。",
    content:
      "运营人员您好：当前队列中有 2 条退费申请处于「待客服专员审核」状态，请进入退费审核模块处理。",
    priority: "urgent",
    targetRoles: [Role.OPERATOR],
    publishedAt: daysAgo(0),
    actionLabel: "前往退费审核",
    actionHref: "/manager-refund",
  },
  {
    id: "ntf-002",
    title: "本周待提交课后反馈",
    summary: "系统检测到 3 名学员缺少本周反馈，请今日内补交。",
    content:
      "伴学教练您好：请在学习中心核对学员名单，完成课后反馈填写，以免影响课时结算统计。",
    priority: "high",
    targetRoles: [Role.TUTOR],
    publishedAt: daysAgo(1),
    actionLabel: "打开反馈检索",
    actionHref: "/teaching-feedback/feedback-search",
  },
  {
    id: "ntf-003",
    title: "新订单待接单提醒",
    summary: "接单中心有符合您科目的新试课订单。",
    content: "请进入接单中心查看详情，试课订单需在 24 小时内响应。",
    priority: "high",
    targetRoles: [Role.TUTOR, Role.MANAGER],
    publishedAt: daysAgo(2),
    actionHref: "/orders/market",
    actionLabel: "前往接单中心",
  },
  {
    id: "ntf-004",
    title: "学员档案信息待完善",
    summary: "您名下 1 名学员缺少年级与科目信息。",
    content: "请补充学员档案，以便后续排课与订单关联。",
    priority: "normal",
    targetRoles: [Role.SALES],
    publishedAt: daysAgo(3),
    actionHref: "/students",
    actionLabel: "学员档案",
  },
  {
    id: "ntf-005",
    title: "团队学员周报已生成",
    summary: "请查阅本周团队学员完课与反馈完成情况。",
    content: "学管可在团队学员模块导出周报，用于周会复盘。",
    priority: "normal",
    targetRoles: [Role.MANAGER],
    publishedAt: daysAgo(2),
    actionHref: "/team-students",
    actionLabel: "团队学员",
  },
  {
    id: "ntf-006",
    title: "安全登录提醒",
    summary: "检测到您的账号在新设备登录，如非本人请立即修改密码。",
    content: "若为您本人操作可忽略本通知；否则请联系运营冻结账号并修改密码。",
    priority: "urgent",
    targetRoles: allRoles,
    publishedAt: daysAgo(0),
  },
  {
    id: "ntf-007",
    title: "价格配置表即将生效",
    summary: "管理员已提交新版本，将于明日 00:00 自动生效。",
    content: "请招生与运营关注新价格规则，生效前创建的订单仍按旧规则结算。",
    priority: "high",
    targetRoles: [Role.ADMIN, Role.OPERATOR, Role.SALES],
    publishedAt: daysAgo(1),
    actionHref: "/price-settings",
    actionLabel: "查看价格配置",
  },
  {
    id: "ntf-008",
    title: "信用分变动通知",
    summary: "上月课堂准时率已计入信用分，请查看明细。",
    content: "伴学教练可在个人相关模块查看信用分变动记录（原型演示数据）。",
    priority: "normal",
    targetRoles: [Role.TUTOR],
    publishedAt: daysAgo(5),
  },
]
