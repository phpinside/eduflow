"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  User as UserIcon,
  Users,
  Phone,
  BookOpen,
  GraduationCap,
  Building2,
  CalendarDays,
  FileText,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { mockUsers } from "@/lib/mock-data/users"
import { OrderStatus, OrderType } from "@/types"

const STATUS_MAP: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "待接单",
  [OrderStatus.ASSIGNED]: "已分配",
  [OrderStatus.IN_PROGRESS]: "进行中",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.CANCEL_REQUESTED]: "取消申请中",
}

const DAY_MAP: Record<string, string> = {
  monday: "周一",
  tuesday: "周二",
  wednesday: "周三",
  thursday: "周四",
  friday: "周五",
  saturday: "周六",
  sunday: "周日",
}

const maskPhone = (phone: string) => {
  if (!phone || phone.length < 11) return phone
  return phone.slice(0, 3) + "****" + phone.slice(-4)
}

const extractCity = (address?: string) => {
  if (!address) return ""
  const match = address.match(/^(.{2,3}[市省])/)
  return match ? match[1].replace(/[市省]$/, "") : ""
}

const generateAnnouncementText = (order: any, student: any, salesPerson: any): string => {
  if (!order || !student) return ""

  const city = extractCity(student.address) || "—"
  const genderEmoji = student.gender === "女" ? "👧" : "👦"

  if (order.type === OrderType.TRIAL) {
    const slotEmojis = ["1️⃣", "2️⃣", "3️⃣"]
    const trialTimesLines =
      order.trialTimeSlots && order.trialTimeSlots.length > 0
        ? order.trialTimeSlots
            .map((t: string, i: number) => `${slotEmojis[i] ?? `${i + 1}.`} ${t.replace(/-\d{1,2}:\d{2}$/, "").trim()}`)
            .join("\n")
        : "待定"

    return `【试听课排课｜${order.subject}】🎯

${genderEmoji} 学生：${student.name}｜${student.gender}｜${order.grade}
📍 地区：${city}｜🏫 学校：${student.school || "待补充"}
📊 成绩：${order.lastExamScore || "—"}${order.examMaxScore ? `/${order.examMaxScore}` : ""}｜📖 ${order.textbookVersion || "待补充"}
📌 进度：${order.schoolProgress || "—"}
📈 其它科均分：${order.otherSubjectsAvgScore || "—"}
🧩 补课：${order.previousTutoringTypes || "—"}

📱 家长：${student.parentPhone || "—"}

校区名称：${order.campusName || "—"}
校区账号：${order.campusAccount || "—"}
学生账号：${order.studentAccount || "—"}

⏰ 试课时间：
${trialTimesLines}

📝 备注：${order.remarks || "—"}`
  } else {
    const scheduleLines =
      order.weeklySchedule && order.weeklySchedule.length > 0
        ? order.weeklySchedule
            .map((s: any) => `${DAY_MAP[s.day] || s.day}｜${s.startTime}-${s.endTime}`)
            .join("\n")
        : "待排课"

    return `【正课排课｜${order.subject}】🎯

${genderEmoji} 学生：${student.name}｜${student.gender}｜${order.grade}
📍 地区：${city}｜🏫 学校：${student.school || "待补充"}
📊 成绩：${order.lastExamScore || "—"}${order.examMaxScore ? `/${order.examMaxScore}` : ""}｜📖 ${order.textbookVersion || "待补充"}
📌 进度：${order.schoolProgress || "—"}
📈 其它科均分：${order.otherSubjectsAvgScore || "—"}
🧩 补课：${order.previousTutoringTypes || "—"}

📱 家长：${student.parentPhone || "—"}

校区名称：${order.campusName || "—"}
校区账号：${order.campusAccount || "—"}

📦 总课时：${order.totalHours ? `${order.totalHours}课时` : "—"}
📅 上课时间：
${scheduleLines}

📍 首次课时间：${order.firstLessonTime || "—"}

📝 备注：${order.remarks || "—"}`
  }
}

// ── 局部复用组件 ────────────────────────────────────────────

function Field({
  label,
  value,
  className,
}: {
  label: string
  value?: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-0.5 ${className ?? ""}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-sm font-medium min-h-[1.25rem]">
        {value != null && value !== "" ? (
          value
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </div>
    </div>
  )
}

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-3">
      <span className="text-muted-foreground">{icon}</span>
      {title}
    </div>
  )
}

// ── 主页面 ────────────────────────────────────────────────────

export default function ManagerOrderDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { id } = params

  const [order, setOrder] = React.useState(() =>
    mockOrders.find((o) => o.id === id)
  )

  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] =
    React.useState(false)
  const [announcementText, setAnnouncementText] = React.useState("")

  const student = React.useMemo(
    () => (order ? mockStudents.find((s) => s.id === order.studentId) : null),
    [order]
  )

  const salesPerson = React.useMemo(
    () => (order ? mockUsers.find((u) => u.id === order.salesPersonId) : null),
    [order]
  )

  const manager = React.useMemo(
    () => (order ? mockUsers.find((u) => u.id === order.managerId) : null),
    [order]
  )

  const applicants = React.useMemo(() => {
    if (!order?.applicantIds) return []
    return mockUsers.filter((u) => order.applicantIds?.includes(u.id))
  }, [order])

  const assignedTeacher = React.useMemo(
    () =>
      order?.assignedTeacherId
        ? mockUsers.find((u) => u.id === order.assignedTeacherId)
        : null,
    [order]
  )

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-2xl font-bold">未找到订单</h2>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> 返回列表
        </Button>
      </div>
    )
  }

  const isTrial = order.type === OrderType.TRIAL

  const examScore =
    order.lastExamScore && order.examMaxScore
      ? `${order.lastExamScore}/${order.examMaxScore}`
      : order.lastExamScore

  const handleAssign = (teacherId: string) => {
    const mockOrderIndex = mockOrders.findIndex((o) => o.id === id)
    if (mockOrderIndex !== -1) {
      mockOrders[mockOrderIndex] = {
        ...mockOrders[mockOrderIndex],
        status: OrderStatus.ASSIGNED,
        assignedTeacherId: teacherId,
      }
    }
    setOrder((prev) => {
      if (!prev) return prev
      return { ...prev, status: OrderStatus.ASSIGNED, assignedTeacherId: teacherId }
    })
    toast.success("已成功匹配老师！")
  }

  const handleSetPending = () => {
    if (!order) return
    const mockOrderIndex = mockOrders.findIndex((o) => o.id === order.id)
    if (mockOrderIndex !== -1) {
      mockOrders[mockOrderIndex] = {
        ...mockOrders[mockOrderIndex],
        status: OrderStatus.PENDING,
        assignedTeacherId: undefined,
        transferredOutFrom: order.assignedTeacherId,
      }
    }
    setOrder((prev) => {
      if (!prev) return prev
      const currentTeacherId = prev.assignedTeacherId
      return {
        ...prev,
        status: OrderStatus.PENDING,
        assignedTeacherId: undefined,
        transferredOutFrom: currentTeacherId,
      }
    })
    toast.success("订单已重置为待接单，原老师处已标记转走")
  }

  const handleOpenAnnouncementDialog = () => {
    if (order && student) {
      const text = generateAnnouncementText(order, student, salesPerson)
      setAnnouncementText(text)
      setIsAnnouncementDialogOpen(true)
    }
  }

  const handleCopyAnnouncement = async () => {
    try {
      await navigator.clipboard.writeText(announcementText)
      toast.success("已复制到剪贴板")
    } catch {
      toast.error("复制失败，请手动复制")
    }
  }

  return (
    <div className="space-y-6 container mx-auto pb-10 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold tracking-tight">订单管理详情</h1>
            <Badge variant="outline">{STATUS_MAP[order.status]}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">订单号：{order.id}</p>
        </div>

        <div className="flex gap-3 shrink-0">
          <Button
            size="lg"
            onClick={handleOpenAnnouncementDialog}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="mr-2 h-5 w-5" />
            生成群公告
          </Button>

          {(order.status === OrderStatus.IN_PROGRESS ||
            order.status === OrderStatus.ASSIGNED) && (
            <Button
              variant="outline"
              className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700"
              onClick={handleSetPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              重新进入接单中心
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* ── 左列：订单全字段 + 申请名单 ── */}
        <div className="md:col-span-2 space-y-6">

          {/* 订单信息（全字段） */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookOpen className="h-5 w-5" />
                {isTrial ? "试听课" : "正式课"}信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* 基本信息 */}
              <div>
                <SectionTitle
                  icon={<UserIcon className="h-4 w-4" />}
                  title="基本信息"
                />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="科目" value={order.subject} />
                  <Field label="年级" value={order.grade} />
                  <Field label="学生姓名" value={student?.name} />
                  <Field label="性别" value={student?.gender} />
                  <Field
                    label="地区"
                    value={student?.address}
                    className="col-span-2"
                  />
                  <Field
                    label="学校名称"
                    value={student?.school}
                    className="col-span-2"
                  />
                </div>
              </div>

              <Separator />

              {/* 学习情况 */}
              <div>
                <SectionTitle
                  icon={<GraduationCap className="h-4 w-4" />}
                  title="学习情况"
                />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="最近一次考试成绩" value={examScore} />
                  <Field label="教材版本" value={order.textbookVersion} />
                  <Field
                    label="校内学习进度"
                    value={order.schoolProgress}
                    className="col-span-2"
                  />
                  <Field
                    label="其它科平均成绩"
                    value={order.otherSubjectsAvgScore}
                  />
                  <Field
                    label="补过什么类型的课"
                    value={order.previousTutoringTypes}
                  />
                </div>
              </div>

              <Separator />

              {/* 家长信息 */}
              <div>
                <SectionTitle
                  icon={<Phone className="h-4 w-4" />}
                  title="家长信息"
                />
                <Field label="家长手机号" value={student?.parentPhone} />
              </div>

              <Separator />

              {/* 校区信息 */}
              <div>
                <SectionTitle
                  icon={<Building2 className="h-4 w-4" />}
                  title="校区信息"
                />
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  <Field label="校区名称" value={order.campusName} />
                  <Field label="校区账号" value={order.campusAccount} />
                  {!isTrial && (
                    <Field label="学生账号" value={order.studentAccount} />
                  )}
                </div>
              </div>

              <Separator />

              {/* 试课时间 / 课程安排 */}
              {isTrial ? (
                <div>
                  <SectionTitle
                    icon={<CalendarDays className="h-4 w-4" />}
                    title="试课时间"
                  />
                  <div className="space-y-4">
                    {[0, 1, 2].map((i) => (
                      <Field
                        key={i}
                        label={`试课时间${i + 1}`}
                        value={order.trialTimeSlots?.[i]?.replace(/-\d{1,2}:\d{2}$/, "").trim()}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <SectionTitle
                    icon={<CalendarDays className="h-4 w-4" />}
                    title="课程安排"
                  />
                  <div className="space-y-4">
                    <Field
                      label="总课时"
                      value={
                        order.totalHours
                          ? `${order.totalHours} 课时`
                          : undefined
                      }
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs text-muted-foreground">
                        上课时间
                      </div>
                      {order.weeklySchedule &&
                      order.weeklySchedule.length > 0 ? (
                        <div className="space-y-1 pt-0.5">
                          {order.weeklySchedule.map((s, i) => (
                            <div key={i} className="text-sm font-medium">
                              {DAY_MAP[s.day] || s.day}｜{s.startTime}-
                              {s.endTime}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm font-medium min-h-[1.25rem]">
                          <span className="text-muted-foreground/50">—</span>
                        </div>
                      )}
                    </div>
                    <Field
                      label="首次课时间"
                      value={order.firstLessonTime}
                    />
                  </div>
                </div>
              )}

              <Separator />

              {/* 备注 */}
              <div>
                <SectionTitle
                  icon={<FileText className="h-4 w-4" />}
                  title="备注"
                />
                <div className="text-sm whitespace-pre-line leading-relaxed">
                  {order.remarks ? (
                    order.remarks
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>

          {/* 申请接课老师名单 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> 申请接课老师名单
              </CardTitle>
            </CardHeader>
            <CardContent>
              {applicants.length > 0 ? (
                <div className="space-y-4">
                  {applicants.map((applicant) => {
                    const isAssigned =
                      order.assignedTeacherId === applicant.id
                    return (
                      <div
                        key={applicant.id}
                        className={`flex flex-col gap-3 p-3 rounded-lg border ${
                          isAssigned
                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                            : "bg-card"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={applicant.avatar} />
                              <AvatarFallback>
                                {applicant.name[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {applicant.name}
                                {isAssigned && (
                                  <Badge className="bg-green-600 hover:bg-green-700">
                                    已分配
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {applicant.phone}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {!isAssigned &&
                              order.status === OrderStatus.PENDING && (
                                <Button
                                  size="sm"
                                  onClick={() => handleAssign(applicant.id)}
                                >
                                  选择匹配
                                </Button>
                              )}
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 pt-2 border-t">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              试课成功率
                            </div>
                            <div className="text-sm font-medium">
                              50% (10/20)
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              正课学员数
                            </div>
                            <div className="text-sm font-medium">8</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground mb-1">
                              累计课时
                            </div>
                            <div className="text-sm font-medium">156</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  暂无老师申请
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── 右列：负责人员信息 ── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">招生老师信息</CardTitle>
            </CardHeader>
            <CardContent>
              {salesPerson ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={salesPerson.avatar} />
                      <AvatarFallback>招</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-medium">
                        {salesPerson.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        招生老师
                      </div>
                    </div>
                  </div>
                  {salesPerson.wechatQrCode ? (
                    <div className="flex flex-col items-center p-2 bg-muted/30 rounded border">
                      <img
                        src={salesPerson.wechatQrCode}
                        alt="Sales QR"
                        className="w-32 h-32 object-contain bg-white rounded"
                      />
                      <span className="text-xs text-muted-foreground mt-1">
                        招生老师微信
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground text-center p-4 bg-muted/30 rounded">
                      暂无二维码
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground text-center py-4">
                  暂无招生老师信息
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 群公告对话框 */}
      <Dialog
        open={isAnnouncementDialogOpen}
        onOpenChange={setIsAnnouncementDialogOpen}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>生成群公告</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <Textarea
              value={announcementText}
              onChange={(e) => setAnnouncementText(e.target.value)}
              className="min-h-[400px] font-mono text-sm resize-none"
              placeholder="群公告内容将在这里生成..."
            />
          </div>

          <DialogFooter className="mt-4">
            <Button
              onClick={handleCopyAnnouncement}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              复制到剪贴板
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
