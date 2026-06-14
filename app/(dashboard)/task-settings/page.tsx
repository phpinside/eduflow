"use client"

import * as React from "react"
import { Calculator, Eye, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  OrderStatus,
  OrderType,
  Role,
  type WorkbenchDetectorConfig,
  type WorkbenchCompletionConfig,
  type WorkbenchTask,
  type WorkbenchTaskDetectorId,
  type WorkbenchTaskPriority,
  type WorkbenchTaskType,
} from "@/types"
import { getStoredWorkbenchTaskTypes, saveStoredWorkbenchTaskTypes } from "@/lib/storage"
import {
  TASK_DETECTOR_DEFINITIONS,
  TASK_DETECTOR_MAP,
  getTaskTypeStats,
} from "@/lib/workbench-detectors"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"

const ROLE_LABELS: Record<Role, string> = {
  [Role.SALES]: "招生老师",
  [Role.TUTOR]: "伴学教练",
  [Role.MANAGER]: "学管",
  [Role.OPERATOR]: "运营人员",
  [Role.ADMIN]: "管理员",
}

const ORDER_TYPE_LABELS: Record<OrderType, string> = {
  [OrderType.TRIAL]: "试课",
  [OrderType.REGULAR]: "正课",
}

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING_PAYMENT]: "待支付",
  [OrderStatus.PENDING_CS_REVIEW]: "待客服审核",
  [OrderStatus.PENDING_FINANCE_REVIEW]: "待财务审核",
  [OrderStatus.SCHEDULING]: "排单中",
  [OrderStatus.PENDING]: "待接单",
  [OrderStatus.ASSIGNED]: "已分配",
  [OrderStatus.IN_PROGRESS]: "进行中",
  [OrderStatus.COMPLETED]: "已完成",
  [OrderStatus.CANCELLED]: "已取消",
  [OrderStatus.CANCEL_REQUESTED]: "取消申请中",
  [OrderStatus.REFUNDED]: "已退款",
}

const ALL_ROLES = Object.values(Role)
const ALL_ORDER_TYPES = Object.values(OrderType)
const COMMON_ORDER_STATUSES = [
  OrderStatus.ASSIGNED,
  OrderStatus.IN_PROGRESS,
  OrderStatus.COMPLETED,
  OrderStatus.PENDING_CS_REVIEW,
  OrderStatus.PENDING_FINANCE_REVIEW,
]

type TaskTypeForm = Omit<WorkbenchTaskType, "id" | "createdAt" | "updatedAt">

const defaultDetector = TASK_DETECTOR_DEFINITIONS[0]

const emptyForm: TaskTypeForm = {
  name: "",
  description: "",
  applicableRoles: [Role.TUTOR],
  detectorId: defaultDetector.id,
  detectorConfig: {
    orderTypes: [OrderType.TRIAL],
    orderStatuses: [OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS],
    preStartHours: 24,
    postEndHours: 2,
    ownerField: "assignedTeacherId",
    dueOffsetHours: -1,
  },
  completionConfig: {
    requireSubmission: true,
    submittedOnly: true,
    requiredFields: ["diagnosisNotes", "teachingGoals"],
    requireAttachmentOrText: true,
    allowDraft: false,
  },
  actionHrefTemplate: defaultDetector.defaultActionHrefTemplate,
  defaultDeadlineHours: 24,
  defaultPriority: "MEDIUM",
  countsTowardAssessment: true,
  parentVisible: false,
  enabled: true,
  sortOrder: 1,
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

function setDetectorConfigValue<K extends keyof WorkbenchDetectorConfig>(
  config: WorkbenchDetectorConfig,
  key: K,
  value: WorkbenchDetectorConfig[K]
) {
  return { ...config, [key]: value }
}

function setCompletionConfigValue<K extends keyof WorkbenchCompletionConfig>(
  config: WorkbenchCompletionConfig,
  key: K,
  value: WorkbenchCompletionConfig[K]
) {
  return { ...config, [key]: value }
}

export default function TaskSettingsPage() {
  const [taskTypes, setTaskTypes] = React.useState<WorkbenchTaskType[]>(() => getStoredWorkbenchTaskTypes())
  const [editingItem, setEditingItem] = React.useState<WorkbenchTaskType | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [formData, setFormData] = React.useState<TaskTypeForm>(emptyForm)
  const [previewType, setPreviewType] = React.useState<WorkbenchTaskType | null>(null)
  const [previewTasks, setPreviewTasks] = React.useState<WorkbenchTask[]>([])

  const sortedTaskTypes = React.useMemo(
    () => [...taskTypes].sort((a, b) => a.sortOrder - b.sortOrder),
    [taskTypes]
  )

  const statsByType = React.useMemo(() => {
    return Object.fromEntries(taskTypes.map((type) => [type.id, getTaskTypeStats(type)]))
  }, [taskTypes])

  const selectedDetector = TASK_DETECTOR_MAP.get(formData.detectorId)
  const previewFormType = React.useMemo<WorkbenchTaskType>(() => ({
    id: editingItem?.id ?? "task-type-preview",
    ...formData,
    createdAt: editingItem?.createdAt ?? new Date(),
    updatedAt: new Date(),
  }), [editingItem, formData])

  const openCreate = () => {
    setEditingItem(null)
    setFormData({ ...emptyForm, sortOrder: taskTypes.length + 1 })
    setIsOpen(true)
  }

  const openEdit = (item: WorkbenchTaskType) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description,
      applicableRoles: [...item.applicableRoles],
      detectorId: item.detectorId,
      detectorConfig: { ...item.detectorConfig },
      completionConfig: { ...item.completionConfig },
      actionHrefTemplate: item.actionHrefTemplate,
      defaultDeadlineHours: item.defaultDeadlineHours,
      defaultPriority: item.defaultPriority,
      countsTowardAssessment: item.countsTowardAssessment,
      parentVisible: item.parentVisible,
      enabled: item.enabled,
      sortOrder: item.sortOrder,
    })
    setIsOpen(true)
  }

  const toggleRole = (role: Role) => {
    setFormData((prev) => ({
      ...prev,
      applicableRoles: prev.applicableRoles.includes(role)
        ? prev.applicableRoles.filter((item) => item !== role)
        : [...prev.applicableRoles, role],
    }))
  }

  const toggleOrderType = (type: OrderType) => {
    setFormData((prev) => {
      const current = prev.detectorConfig.orderTypes ?? []
      return {
        ...prev,
        detectorConfig: {
          ...prev.detectorConfig,
          orderTypes: current.includes(type) ? current.filter((item) => item !== type) : [...current, type],
        },
      }
    })
  }

  const toggleOrderStatus = (status: OrderStatus) => {
    setFormData((prev) => {
      const current = prev.detectorConfig.orderStatuses ?? []
      return {
        ...prev,
        detectorConfig: {
          ...prev.detectorConfig,
          orderStatuses: current.includes(status) ? current.filter((item) => item !== status) : [...current, status],
        },
      }
    })
  }

  const runPreview = (type: WorkbenchTaskType) => {
    const stats = getTaskTypeStats(type)
    setPreviewType(type)
    setPreviewTasks(stats.tasks.slice(0, 10))
  }

  const saveItem = () => {
    if (!formData.name.trim()) {
      toast.error("请填写任务类型名称")
      return
    }
    if (!formData.description.trim()) {
      toast.error("请填写任务说明")
      return
    }
    if (formData.applicableRoles.length === 0) {
      toast.error("请至少选择一个适用角色")
      return
    }
    if (!formData.detectorId) {
      toast.error("请选择系统检测器")
      return
    }

    const now = new Date()
    const updated = [...taskTypes]

    if (editingItem) {
      const index = updated.findIndex((item) => item.id === editingItem.id)
      if (index !== -1) {
        updated[index] = { ...editingItem, ...formData, updatedAt: now }
      }
      toast.success("任务检测规则已更新")
    } else {
      updated.push({
        id: `task-type-${Date.now()}`,
        ...formData,
        createdAt: now,
        updatedAt: now,
      })
      toast.success("任务检测规则已创建")
    }

    setTaskTypes(updated)
    saveStoredWorkbenchTaskTypes(updated)
    setIsOpen(false)
  }

  const toggleEnabled = (item: WorkbenchTaskType, enabled: boolean) => {
    const updated = taskTypes.map((taskType) =>
      taskType.id === item.id ? { ...taskType, enabled, updatedAt: new Date() } : taskType
    )
    setTaskTypes(updated)
    saveStoredWorkbenchTaskTypes(updated)
    toast.success(enabled ? "任务检测规则已启用" : "任务检测规则已停用")
  }

  const deleteItem = (item: WorkbenchTaskType) => {
    const pending = statsByType[item.id]?.pending ?? 0
    if (pending > 0) {
      toast.error("该规则当前仍有待办命中，建议先停用而不是删除")
      return
    }
    if (!confirm(`确认删除任务检测规则"${item.name}"？`)) return
    const updated = taskTypes.filter((taskType) => taskType.id !== item.id)
    setTaskTypes(updated)
    saveStoredWorkbenchTaskTypes(updated)
    toast.success("任务检测规则已删除")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">任务类型配置</h2>
          <p className="text-muted-foreground">
            通过内置检测器配置任务规则，系统自动计算待处理条数和完成状态。
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增检测规则
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">启用规则</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskTypes.filter((item) => item.enabled).length}</div>
            <p className="text-xs text-muted-foreground">工作台实时读取</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">当前待办</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(statsByType).reduce((sum, stat) => sum + stat.pending, 0)}</div>
            <p className="text-xs text-muted-foreground">由检测器实时计算</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">超时任务</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.values(statsByType).reduce((sum, stat) => sum + stat.overdue, 0)}</div>
            <p className="text-xs text-muted-foreground">已超过截止规则</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">系统检测器</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{TASK_DETECTOR_DEFINITIONS.length}</div>
            <p className="text-xs text-muted-foreground">后台只做参数化配置</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>任务检测规则列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">排序</TableHead>
                <TableHead>任务规则</TableHead>
                <TableHead>检测器</TableHead>
                <TableHead className="w-24">待办</TableHead>
                <TableHead className="w-24">今日新增</TableHead>
                <TableHead className="w-24">超时</TableHead>
                <TableHead className="w-36">最近检测</TableHead>
                <TableHead className="w-20">状态</TableHead>
                <TableHead className="w-36">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTaskTypes.map((item) => {
                const detector = TASK_DETECTOR_MAP.get(item.detectorId)
                const stats = statsByType[item.id]
                return (
                  <TableRow key={item.id} className={!item.enabled ? "opacity-60" : undefined}>
                    <TableCell className="text-center font-mono">{item.sortOrder}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.name}</div>
                      <div className="mt-1 max-w-md text-xs text-muted-foreground">{item.description}</div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.applicableRoles.map((role) => (
                          <Badge key={role} variant="outline" className="text-[10px]">{ROLE_LABELS[role]}</Badge>
                        ))}
                        {item.countsTowardAssessment && <Badge variant="secondary">计入考核</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{detector?.name ?? "未配置"}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{detector?.reads.join("、")}</div>
                    </TableCell>
                    <TableCell><Badge>{stats?.pending ?? 0}</Badge></TableCell>
                    <TableCell>{stats?.todayNew ?? 0}</TableCell>
                    <TableCell className={stats?.overdue ? "font-medium text-red-600" : undefined}>{stats?.overdue ?? 0}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{stats ? formatDateTime(stats.lastCheckedAt) : "—"}</TableCell>
                    <TableCell>
                      <Switch checked={item.enabled} onCheckedChange={(checked) => toggleEnabled(item, checked)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => runPreview(item)} title="预览待办">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)} title="编辑">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600" onClick={() => deleteItem(item)} title="删除">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "编辑任务检测规则" : "新增任务检测规则"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <section className="space-y-4">
              <h3 className="font-semibold">基础信息</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>任务名称 <span className="text-red-500">*</span></Label>
                  <Input value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>排序</Label>
                  <Input type="number" min={1} value={formData.sortOrder} onChange={(event) => setFormData((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 1 }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>任务说明 <span className="text-red-500">*</span></Label>
                <Textarea value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>默认截止时长（小时）</Label>
                  <Input type="number" min={1} value={formData.defaultDeadlineHours} onChange={(event) => setFormData((prev) => ({ ...prev, defaultDeadlineHours: Number(event.target.value) || 1 }))} />
                </div>
                <div className="space-y-2">
                  <Label>默认优先级</Label>
                  <Select value={formData.defaultPriority} onValueChange={(value) => setFormData((prev) => ({ ...prev, defaultPriority: value as WorkbenchTaskPriority }))}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HIGH">高</SelectItem>
                      <SelectItem value="MEDIUM">中</SelectItem>
                      <SelectItem value="LOW">低</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                    <Checkbox checked={formData.applicableRoles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                    {ROLE_LABELS[role]}
                  </label>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <Switch checked={formData.countsTowardAssessment} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, countsTowardAssessment: checked }))} />
                  计入考核
                </label>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <Switch checked={formData.parentVisible} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, parentVisible: checked }))} />
                  家长可见
                </label>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <Switch checked={formData.enabled} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))} />
                  启用
                </label>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-semibold">检测器配置</h3>
              <div className="grid gap-4 md:grid-cols-[1fr_1.3fr]">
                <div className="space-y-2">
                  <Label>系统检测器</Label>
                  <Select
                    value={formData.detectorId}
                    onValueChange={(value) => {
                      const detector = TASK_DETECTOR_MAP.get(value as WorkbenchTaskDetectorId)
                      setFormData((prev) => ({
                        ...prev,
                        detectorId: value as WorkbenchTaskDetectorId,
                        actionHrefTemplate: detector?.defaultActionHrefTemplate ?? prev.actionHrefTemplate,
                      }))
                    }}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_DETECTOR_DEFINITIONS.map((detector) => (
                        <SelectItem key={detector.id} value={detector.id}>{detector.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedDetector && (
                  <Alert>
                    <AlertTitle>{selectedDetector.name}</AlertTitle>
                    <AlertDescription>
                      <div>{selectedDetector.description}</div>
                      <div className="mt-1 text-xs">读取数据：{selectedDetector.reads.join("、")}；完成依据：{selectedDetector.completionEvidence}</div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
              <div className="space-y-2">
                <Label>操作入口模板</Label>
                <Input
                  value={formData.actionHrefTemplate}
                  onChange={(event) => setFormData((prev) => ({ ...prev, actionHrefTemplate: event.target.value }))}
                  placeholder="/trial-prep/{orderId}"
                />
                <p className="text-xs text-muted-foreground">支持变量：{"{orderId}"}、{"{studentId}"}。工作台按钮会跳转到这里处理业务数据。</p>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-semibold">待办范围</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>订单类型</Label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_ORDER_TYPES.map((type) => (
                      <label key={type} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                        <Checkbox checked={(formData.detectorConfig.orderTypes ?? []).includes(type)} onCheckedChange={() => toggleOrderType(type)} />
                        {ORDER_TYPE_LABELS[type]}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>负责人字段</Label>
                  <Select
                    value={formData.detectorConfig.ownerField ?? "assignedTeacherId"}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, detectorConfig: setDetectorConfigValue(prev.detectorConfig, "ownerField", value as WorkbenchDetectorConfig["ownerField"]) }))}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assignedTeacherId">订单 assignedTeacherId（教练）</SelectItem>
                      <SelectItem value="salesPersonId">订单 salesPersonId（招生）</SelectItem>
                      <SelectItem value="managerId">订单 managerId（学管）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>订单状态</Label>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {COMMON_ORDER_STATUSES.map((status) => (
                    <label key={status} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                      <Checkbox checked={(formData.detectorConfig.orderStatuses ?? []).includes(status)} onCheckedChange={() => toggleOrderStatus(status)} />
                      {ORDER_STATUS_LABELS[status]}
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="space-y-2">
                  <Label>试课前窗口（小时）</Label>
                  <Input type="number" value={formData.detectorConfig.preStartHours ?? ""} onChange={(event) => setFormData((prev) => ({ ...prev, detectorConfig: setDetectorConfigValue(prev.detectorConfig, "preStartHours", Number(event.target.value) || 0) }))} />
                </div>
                <div className="space-y-2">
                  <Label>课后窗口（小时）</Label>
                  <Input type="number" value={formData.detectorConfig.postEndHours ?? ""} onChange={(event) => setFormData((prev) => ({ ...prev, detectorConfig: setDetectorConfigValue(prev.detectorConfig, "postEndHours", Number(event.target.value) || 0) }))} />
                </div>
                <div className="space-y-2">
                  <Label>截止偏移（小时）</Label>
                  <Input type="number" value={formData.detectorConfig.dueOffsetHours ?? ""} onChange={(event) => setFormData((prev) => ({ ...prev, detectorConfig: setDetectorConfigValue(prev.detectorConfig, "dueOffsetHours", Number(event.target.value) || 0) }))} />
                </div>
                <div className="space-y-2">
                  <Label>课时预警阈值</Label>
                  <Input type="number" value={formData.detectorConfig.maxRemainingHours ?? ""} onChange={(event) => setFormData((prev) => ({ ...prev, detectorConfig: setDetectorConfigValue(prev.detectorConfig, "maxRemainingHours", Number(event.target.value) || 0) }))} />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="font-semibold">完成条件</h3>
              <div className="grid gap-3 md:grid-cols-4">
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <Switch checked={formData.completionConfig.requireSubmission ?? true} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, completionConfig: setCompletionConfigValue(prev.completionConfig, "requireSubmission", checked) }))} />
                  必须有资料
                </label>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <Switch checked={formData.completionConfig.submittedOnly ?? true} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, completionConfig: setCompletionConfigValue(prev.completionConfig, "submittedOnly", checked) }))} />
                  仅已提交
                </label>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <Switch checked={formData.completionConfig.requireAttachmentOrText ?? false} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, completionConfig: setCompletionConfigValue(prev.completionConfig, "requireAttachmentOrText", checked) }))} />
                  教案或附件
                </label>
                <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                  <Switch checked={formData.completionConfig.allowDraft ?? false} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, completionConfig: setCompletionConfigValue(prev.completionConfig, "allowDraft", checked) }))} />
                  草稿算完成
                </label>
              </div>
              <div className="space-y-2">
                <Label>必填字段（逗号分隔）</Label>
                <Input
                  value={(formData.completionConfig.requiredFields ?? []).join(",")}
                  onChange={(event) => setFormData((prev) => ({
                    ...prev,
                    completionConfig: setCompletionConfigValue(
                      prev.completionConfig,
                      "requiredFields",
                      event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
                    ),
                  }))}
                  placeholder="diagnosisNotes,teachingGoals"
                />
              </div>
            </section>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => runPreview(previewFormType)}>
                <Calculator className="mr-2 h-4 w-4" />
                试算当前待办
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
            <Button onClick={saveItem}>{editingItem ? "保存修改" : "创建检测规则"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!previewType} onOpenChange={(open) => !open && setPreviewType(null)}>
        <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>待办预览：{previewType?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {previewTasks.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                当前规则没有命中待办数据
              </div>
            ) : (
              previewTasks.map((task) => (
                <div key={task.id} className="rounded-lg border p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{task.title}</div>
                    <Badge variant={task.status === "OVERDUE" ? "destructive" : "secondary"}>{task.status === "OVERDUE" ? "已超时" : "待处理"}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{task.description}</p>
                  <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                    <span>负责人：{task.ownerUserId ?? "角色池"}</span>
                    <span>学生：{task.studentName ?? "—"}</span>
                    <span>截止：{formatDateTime(task.dueAt)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
