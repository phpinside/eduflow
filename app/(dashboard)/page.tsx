"use client"

import { type ComponentType, useMemo, useState } from "react"
import Link from "next/link"
import {
  AlertCircle,
  BarChart3,
  BookOpen,
  CheckCircle,
  ClipboardCheck,
  Clock,
  FileText,
  GraduationCap,
  LineChart,
  Settings,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
} from "lucide-react"
import { toast } from "sonner"

import { useAuth } from "@/contexts/AuthContext"
import { Role, type StudentProfile, type User, type WorkbenchTask, type WorkbenchTaskType } from "@/types"
import {
  getStoredStudentProfiles,
  getStoredUsers,
  getStoredWorkbenchTasks,
  getStoredWorkbenchTaskTypes,
  saveStoredWorkbenchTasks,
} from "@/lib/storage"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const ROLE_TITLES: Record<Role, string> = {
  [Role.SALES]: "招生工作台",
  [Role.TUTOR]: "伴学教练工作台",
  [Role.MANAGER]: "学管工作台",
  [Role.OPERATOR]: "运营/财务工作台",
  [Role.ADMIN]: "系统管理工作台",
}

const PRIORITY_LABEL: Record<WorkbenchTask["priority"], string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
}

const STATUS_LABEL: Record<WorkbenchTask["status"], string> = {
  TODO: "待处理",
  IN_PROGRESS: "处理中",
  DONE: "已完成",
  OVERDUE: "已超时",
}

const ROLE_LABEL: Record<Role, string> = {
  [Role.SALES]: "招生老师",
  [Role.TUTOR]: "伴学教练",
  [Role.MANAGER]: "学管",
  [Role.OPERATOR]: "运营人员",
  [Role.ADMIN]: "管理员",
}

function formatDue(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function rate(done: number, total: number) {
  if (total === 0) return "0%"
  return `${Math.round((done / total) * 100)}%`
}

function getRoleTasks(tasks: WorkbenchTask[], role: Role, user: User | null) {
  return tasks
    .filter((task) => task.ownerRole === role)
    .filter((task) => !task.ownerUserId || !user || task.ownerUserId === user.id || role === Role.OPERATOR)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
}

function MetricCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string
  value: string
  helper: string
  icon: ComponentType<{ className?: string }>
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  )
}

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

function TaskList({
  title,
  tasks,
  taskTypes,
  onComplete,
}: {
  title: string
  tasks: WorkbenchTask[]
  taskTypes: WorkbenchTaskType[]
  onComplete: (task: WorkbenchTask) => void
}) {
  const typeMap = useMemo(() => new Map(taskTypes.map((type) => [type.id, type])), [taskTypes])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-lg">
          <span>{title}</span>
          <Badge variant="secondary">{tasks.filter((task) => task.status !== "DONE").length} 项待闭环</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tasks.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            暂无任务，当前角色没有待办事项
          </div>
        ) : (
          tasks.map((task) => {
            const type = typeMap.get(task.taskTypeId)
            const isDone = task.status === "DONE"
            return (
              <div key={task.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={task.priority === "HIGH" ? "destructive" : "secondary"}>
                        {PRIORITY_LABEL[task.priority]}优先级
                      </Badge>
                      <Badge variant={task.status === "OVERDUE" ? "destructive" : isDone ? "default" : "outline"}>
                        {STATUS_LABEL[task.status]}
                      </Badge>
                      {type?.parentVisible && <Badge variant="outline">家长可见</Badge>}
                      {type?.countsTowardAssessment && <Badge variant="outline">计入考核</Badge>}
                    </div>
                    <div>
                      <h3 className="font-semibold leading-tight">{task.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                      <span>类型：{type?.name ?? "未配置类型"}</span>
                      <span>学生：{task.studentName ?? "无指定学生"}</span>
                      <span>截止：{formatDue(task.dueAt)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <ProgressBar value={task.progress} />
                      <span className="w-10 text-right text-xs text-muted-foreground">{task.progress}%</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2 lg:w-36">
                    {task.metricLabel && <Badge className="justify-center" variant="secondary">{task.metricLabel}</Badge>}
                    <Button size="sm" disabled={isDone} onClick={() => onComplete(task)}>
                      {isDone ? "已闭环" : task.actionLabel}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function StudentProfilePreview({ profiles }: { profiles: StudentProfile[] }) {
  const profile = profiles[0]
  if (!profile) return null

  const parentItems = profile.timeline.filter((item) => item.parentVisible)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <GraduationCap className="h-5 w-5" />
          学生档案与家长可见视图
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">成长画像</h3>
            <Badge>成长分 {profile.growthScore}</Badge>
          </div>
          <p className="text-sm"><span className="font-medium">能力：</span>{profile.abilityProfile}</p>
          <p className="text-sm"><span className="font-medium">性格：</span>{profile.personality}</p>
          <p className="text-sm"><span className="font-medium">作业习惯：</span>{profile.homeworkHabit}</p>
          <p className="text-sm"><span className="font-medium">规划：</span>{profile.learningPlan}</p>
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold">家长端成长足迹预览</h3>
            <p className="text-sm text-muted-foreground">{profile.parentSummary}</p>
          </div>
          <div className="space-y-2">
            {parentItems.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-medium">{item.title}</h4>
                  <Badge variant="outline">{formatDue(item.date)}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RoleSummary({ role, user, tasks, taskTypes }: { role: Role; user: User | null; tasks: WorkbenchTask[]; taskTypes: WorkbenchTaskType[] }) {
  const unfinished = tasks.filter((task) => task.status !== "DONE")
  const done = tasks.filter((task) => task.status === "DONE")
  const overdue = tasks.filter((task) => task.status === "OVERDUE")
  const enabledTypes = taskTypes.filter((type) => type.enabled)
  const activeFeedbackTasks = tasks.filter((task) => task.taskTypeId === "task-type-feedback" && task.status === "DONE")

  if (role === Role.SALES) {
    const level = user?.salesLevel ?? "三星"
    const priority = level === "三星" ? "优先派单" : level === "二星" ? "标准派单" : "培育派单"
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="招生星级" value={level} helper={priority} icon={Star} />
        <MetricCard title="试课待跟进" value={`${unfinished.length}`} helper="反馈回传后需及时沟通" icon={Users} />
        <MetricCard title="本周完成率" value={rate(done.length, tasks.length)} helper="按任务闭环统计" icon={TrendingUp} />
        <MetricCard title="成交转化率" value="82%" helper="模拟数据，较上周 +6%" icon={LineChart} />
      </div>
    )
  }

  if (role === Role.TUTOR) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="今日待上课" value="3" helper="含 1 节试课" icon={BookOpen} />
        <MetricCard title="待反馈" value={`${tasks.filter((task) => task.taskTypeId === "task-type-feedback" && task.status !== "DONE").length}`} helper="需在 24h 内提交" icon={AlertCircle} />
        <MetricCard title="教师活跃度" value={rate(activeFeedbackTasks.length, tasks.filter((task) => task.taskTypeId === "task-type-feedback").length)} helper="口径：提交课后反馈" icon={ClipboardCheck} />
        <MetricCard title="本月课时" value="32.5h" helper="已确认消课" icon={CheckCircle} />
      </div>
    )
  }

  if (role === Role.MANAGER) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="团队任务完成率" value={rate(done.length, tasks.length)} helper="下属教练与学管任务" icon={BarChart3} />
        <MetricCard title="教练活跃度" value="76%" helper="口径：提交课后反馈" icon={ClipboardCheck} />
        <MetricCard title="异常待处理" value={`${unfinished.length}`} helper={`${overdue.length} 项已超时`} icon={AlertCircle} />
        <MetricCard title="低信用分教练" value="3" helper="需重点跟进" icon={ShieldCheck} />
      </div>
    )
  }

  if (role === Role.OPERATOR) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="财务待审核" value="12" helper="课时费与对账确认" icon={FileText} />
        <MetricCard title="升级异常" value={`${tasks.filter((task) => task.escalationFrom).length}`} helper="学管无法独立处理" icon={AlertCircle} />
        <MetricCard title="闭环率" value={rate(done.length, tasks.length)} helper="全局任务闭环" icon={CheckCircle} />
        <MetricCard title="超时排行" value={`${overdue.length}`} helper="需运营介入" icon={Clock} />
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard title="启用任务类型" value={`${enabledTypes.length}`} helper="后台可动态启停" icon={Settings} />
      <MetricCard title="计入考核类型" value={`${enabledTypes.filter((type) => type.countsTowardAssessment).length}`} helper="任务完成率数据来源" icon={ClipboardCheck} />
      <MetricCard title="家长可见类型" value={`${enabledTypes.filter((type) => type.parentVisible).length}`} helper="同步成长足迹" icon={GraduationCap} />
      <MetricCard title="配置覆盖角色" value="5" helper="招生、教练、学管、运营、管理员" icon={Users} />
    </div>
  )
}

function AdminConfigPanel({ taskTypes, tasks }: { taskTypes: WorkbenchTaskType[]; tasks: WorkbenchTask[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3 text-lg">
          <span>任务类型配置概览</span>
          <Button asChild>
            <Link href="/task-settings">
              <Settings className="mr-2 h-4 w-4" />
              进入配置
            </Link>
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-2">
        {taskTypes.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((type) => {
          const count = tasks.filter((task) => task.taskTypeId === type.id).length
          return (
            <div key={type.id} className={cn("rounded-lg border p-4", !type.enabled && "opacity-60")}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold">{type.name}</h3>
                <Badge variant={type.enabled ? "default" : "secondary"}>{type.enabled ? "启用" : "停用"}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{type.description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {type.applicableRoles.map((role) => <Badge key={role} variant="outline">{ROLE_LABEL[role]}</Badge>)}
                <Badge variant="secondary">引用 {count} 条</Badge>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const { currentRole, user } = useAuth()
  const [tasks, setTasks] = useState<WorkbenchTask[]>(() => getStoredWorkbenchTasks())
  const [taskTypes] = useState<WorkbenchTaskType[]>(() => getStoredWorkbenchTaskTypes())
  const [profiles] = useState<StudentProfile[]>(() => getStoredStudentProfiles())
  const [allUsers] = useState<User[]>(() => getStoredUsers())
  const role = currentRole
  const roleTasks = useMemo(() => role ? getRoleTasks(tasks, role, user) : [], [role, tasks, user])

  if (!role) return null

  const completeTask = (task: WorkbenchTask) => {
    const updated = tasks.map((item) =>
      item.id === task.id
        ? { ...item, status: "DONE" as const, progress: 100, completedAt: new Date(), updatedAt: new Date() }
        : item
    )
    setTasks(updated)
    saveStoredWorkbenchTasks(updated)
    toast.success("任务已标记闭环，工作台指标已更新")
  }

  const teamTutors = allUsers.filter((item) => item.roles.includes(Role.TUTOR) && item.managerId === user?.id)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{ROLE_TITLES[role]}</h2>
          <p className="mt-1 text-muted-foreground">
            EDU3.0 以任务清单驱动每日执行，用完成率、时效性和反馈提交形成管理闭环。
          </p>
        </div>
        <Badge className="w-fit" variant="secondary">当前角色：{ROLE_LABEL[role]}</Badge>
      </div>

      <RoleSummary role={role} user={user} tasks={roleTasks} taskTypes={taskTypes} />

      {role === Role.ADMIN ? (
        <AdminConfigPanel taskTypes={taskTypes} tasks={tasks} />
      ) : (
        <TaskList
          title={role === Role.MANAGER ? `团队任务清单（下属教练 ${teamTutors.length} 人）` : "今日任务清单"}
          tasks={roleTasks}
          taskTypes={taskTypes}
          onComplete={completeTask}
        />
      )}

      {(role === Role.SALES || role === Role.TUTOR || role === Role.MANAGER || role === Role.OPERATOR) && (
        <StudentProfilePreview profiles={profiles} />
      )}
    </div>
  )
}
