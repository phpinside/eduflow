"use client"

import * as React from "react"
import { toast } from "sonner"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { Role, type WorkbenchTask, type WorkbenchTaskPriority, type WorkbenchTaskType } from "@/types"
import {
  getStoredWorkbenchTasks,
  getStoredWorkbenchTaskTypes,
  saveStoredWorkbenchTaskTypes,
} from "@/lib/storage"
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

const PRIORITY_LABELS: Record<WorkbenchTaskPriority, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
}

const ALL_ROLES = Object.values(Role)

const emptyForm = {
  name: "",
  description: "",
  applicableRoles: [Role.TUTOR] as Role[],
  defaultDeadlineHours: 24,
  defaultPriority: "MEDIUM" as WorkbenchTaskPriority,
  countsTowardAssessment: true,
  parentVisible: false,
  enabled: true,
  sortOrder: 1,
}

export default function TaskSettingsPage() {
  const [taskTypes, setTaskTypes] = React.useState<WorkbenchTaskType[]>(() => getStoredWorkbenchTaskTypes())
  const [tasks] = React.useState<WorkbenchTask[]>(() => getStoredWorkbenchTasks())
  const [editingItem, setEditingItem] = React.useState<WorkbenchTaskType | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)
  const [formData, setFormData] = React.useState(emptyForm)

  const sortedTaskTypes = React.useMemo(
    () => [...taskTypes].sort((a, b) => a.sortOrder - b.sortOrder),
    [taskTypes]
  )

  const usageCount = React.useMemo(() => {
    return tasks.reduce<Record<string, number>>((acc, task) => {
      acc[task.taskTypeId] = (acc[task.taskTypeId] ?? 0) + 1
      return acc
    }, {})
  }, [tasks])

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

    const now = new Date()
    const updated = [...taskTypes]

    if (editingItem) {
      const index = updated.findIndex((item) => item.id === editingItem.id)
      if (index !== -1) {
        updated[index] = {
          ...editingItem,
          ...formData,
          updatedAt: now,
        }
      }
      toast.success("任务类型已更新")
    } else {
      updated.push({
        id: `task-type-${Date.now()}`,
        ...formData,
        createdAt: now,
        updatedAt: now,
      })
      toast.success("任务类型已创建")
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
    toast.success(enabled ? "任务类型已启用" : "任务类型已停用")
  }

  const deleteItem = (item: WorkbenchTaskType) => {
    if ((usageCount[item.id] ?? 0) > 0) {
      toast.error("该任务类型已有任务引用，不能删除，可选择停用")
      return
    }

    if (!confirm(`确认删除任务类型"${item.name}"？`)) return
    const updated = taskTypes.filter((taskType) => taskType.id !== item.id)
    setTaskTypes(updated)
    saveStoredWorkbenchTaskTypes(updated)
    toast.success("任务类型已删除")
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">任务类型配置</h2>
          <p className="text-muted-foreground">
            动态维护工作台任务类型，支持角色适用范围、考核口径和家长可见标记。
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新增任务类型
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">启用类型</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskTypes.filter((item) => item.enabled).length}</div>
            <p className="text-xs text-muted-foreground">工作台可读取的任务类型</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">计入考核</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskTypes.filter((item) => item.countsTowardAssessment).length}</div>
            <p className="text-xs text-muted-foreground">用于任务完成率与时效性统计</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">家长可见</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskTypes.filter((item) => item.parentVisible).length}</div>
            <p className="text-xs text-muted-foreground">可同步至学生成长足迹</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>任务类型列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">排序</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>适用角色</TableHead>
                <TableHead className="w-28">默认时限</TableHead>
                <TableHead className="w-24">优先级</TableHead>
                <TableHead className="w-28">引用数</TableHead>
                <TableHead className="w-28">状态</TableHead>
                <TableHead className="w-28">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTaskTypes.map((item) => (
                <TableRow key={item.id} className={!item.enabled ? "opacity-60" : undefined}>
                  <TableCell className="text-center font-mono">{item.sortOrder}</TableCell>
                  <TableCell>
                    <div className="font-medium">{item.name}</div>
                    <div className="mt-1 max-w-md text-xs text-muted-foreground">{item.description}</div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {item.countsTowardAssessment && <Badge variant="secondary">计入考核</Badge>}
                      {item.parentVisible && <Badge variant="outline">家长可见</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.applicableRoles.map((role) => (
                        <Badge key={role} variant="outline" className="text-[10px]">
                          {ROLE_LABELS[role]}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{item.defaultDeadlineHours} 小时</TableCell>
                  <TableCell>{PRIORITY_LABELS[item.defaultPriority]}</TableCell>
                  <TableCell>{usageCount[item.id] ?? 0} 条任务</TableCell>
                  <TableCell>
                    <Switch checked={item.enabled} onCheckedChange={(checked) => toggleEnabled(item, checked)} />
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600" onClick={() => deleteItem(item)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "编辑任务类型" : "新增任务类型"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>任务名称 <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="如：续费跟进"
                />
              </div>
              <div className="space-y-2">
                <Label>排序</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.sortOrder}
                  onChange={(event) => setFormData((prev) => ({ ...prev, sortOrder: Number(event.target.value) || 1 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>任务说明 <span className="text-red-500">*</span></Label>
              <Textarea
                value={formData.description}
                onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="说明该任务如何驱动闭环，以及由谁在什么时限内完成"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>默认截止时长（小时）</Label>
                <Input
                  type="number"
                  min={1}
                  value={formData.defaultDeadlineHours}
                  onChange={(event) => setFormData((prev) => ({ ...prev, defaultDeadlineHours: Number(event.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label>默认优先级</Label>
                <Select
                  value={formData.defaultPriority}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, defaultPriority: value as WorkbenchTaskPriority }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">高</SelectItem>
                    <SelectItem value="MEDIUM">中</SelectItem>
                    <SelectItem value="LOW">低</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>适用角色</Label>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {ALL_ROLES.map((role) => (
                  <label key={role} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                    <Checkbox checked={formData.applicableRoles.includes(role)} onCheckedChange={() => toggleRole(role)} />
                    {ROLE_LABELS[role]}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                <Switch
                  checked={formData.countsTowardAssessment}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, countsTowardAssessment: checked }))}
                />
                计入考核
              </label>
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                <Switch
                  checked={formData.parentVisible}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, parentVisible: checked }))}
                />
                家长可见
              </label>
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, enabled: checked }))}
                />
                启用
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>取消</Button>
            <Button onClick={saveItem}>{editingItem ? "保存修改" : "创建任务类型"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
