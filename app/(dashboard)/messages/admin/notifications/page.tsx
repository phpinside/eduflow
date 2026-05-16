"use client"

import { useState } from "react"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Role } from "@/types"
import type { SiteNotification, MessagePriority } from "@/types/site-message"
import {
  getStoredNotifications,
  saveStoredNotifications,
} from "@/lib/site-messages"
import { PRIORITY_LABEL, ROLE_LABEL } from "@/lib/message-display"
import { PriorityBadge } from "@/components/messages/MessageListShared"

const ALL_ROLES: Role[] = [
  Role.SALES,
  Role.TUTOR,
  Role.MANAGER,
  Role.OPERATOR,
  Role.ADMIN,
]

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<SiteNotification[]>(() => getStoredNotifications())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<SiteNotification | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [summary, setSummary] = useState("")
  const [content, setContent] = useState("")
  const [priority, setPriority] = useState<MessagePriority>("normal")
  const [targetRoles, setTargetRoles] = useState<Role[]>([])
  const [actionLabel, setActionLabel] = useState("")
  const [actionHref, setActionHref] = useState("")

  function resetForm() {
    setTitle("")
    setSummary("")
    setContent("")
    setPriority("normal")
    setTargetRoles([])
    setActionLabel("")
    setActionHref("")
    setEditing(null)
  }

  function openCreate() {
    resetForm()
    setDialogOpen(true)
  }

  function openEdit(item: SiteNotification) {
    setEditing(item)
    setTitle(item.title)
    setSummary(item.summary)
    setContent(item.content)
    setPriority(item.priority)
    setTargetRoles(item.targetRoles)
    setActionLabel(item.actionLabel ?? "")
    setActionHref(item.actionHref ?? "")
    setDialogOpen(true)
  }

  function toggleRole(role: Role) {
    setTargetRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    )
  }

  function handleSubmit() {
    if (!title.trim()) {
      toast.error("请输入标题")
      return
    }
    if (!content.trim()) {
      toast.error("请输入内容")
      return
    }

    const data: SiteNotification = {
      id: editing?.id ?? `ntf-${Date.now()}`,
      title: title.trim(),
      summary: summary.trim() || title.trim(),
      content: content.trim(),
      priority,
      targetRoles,
      publishedAt: editing?.publishedAt ?? new Date(),
      actionLabel: actionLabel.trim() || undefined,
      actionHref: actionHref.trim() || undefined,
    }

    const next = editing
      ? items.map(it => (it.id === editing.id ? data : it))
      : [data, ...items]

    saveStoredNotifications(next)
    setItems(next)
    setDialogOpen(false)
    resetForm()
    toast.success(editing ? "通知已更新" : "通知已发布")
  }

  function confirmDelete(id: string) {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  function handleDelete() {
    if (!deletingId) return
    const next = items.filter(it => it.id !== deletingId)
    saveStoredNotifications(next)
    setItems(next)
    setDeleteDialogOpen(false)
    setDeletingId(null)
    toast.success("通知已删除")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">通知管理</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            管理系统通知，支持按角色定向发布。
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新建通知
        </Button>
      </div>

      <Card>
        {items.length === 0 ? (
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            暂无通知，点击上方按钮新建
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">优先级</TableHead>
                <TableHead>标题</TableHead>
                <TableHead className="w-[160px]">接收角色</TableHead>
                <TableHead className="w-[140px]">发布时间</TableHead>
                <TableHead className="w-[100px] text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>
                    <PriorityBadge priority={item.priority} />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground max-w-[300px]">
                        {item.summary}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.targetRoles.length === 0 ? (
                        <Badge variant="outline" className="text-[10px]">全员</Badge>
                      ) : (
                        item.targetRoles.map(r => (
                          <Badge key={r} variant="outline" className="text-[10px]">
                            {ROLE_LABEL[r]}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(item.publishedAt), "MM-dd HH:mm", { locale: zhCN })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => confirmDelete(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Dialog open={dialogOpen} onOpenChange={v => { setDialogOpen(v); if (!v) resetForm() }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑通知" : "新建通知"}</DialogTitle>
            <DialogDescription>
              发布后，符合角色条件的用户将在系统通知中看到此条通知。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="通知标题" />
            </div>
            <div className="space-y-2">
              <Label>摘要</Label>
              <Input value={summary} onChange={e => setSummary(e.target.value)} placeholder="简短描述（可选，留空取标题）" />
            </div>
            <div className="space-y-2">
              <Label>正文</Label>
              <Textarea value={content} onChange={e => setContent(e.target.value)} placeholder="通知正文" rows={5} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>优先级</Label>
                <Select value={priority} onValueChange={v => setPriority(v as MessagePriority)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">{PRIORITY_LABEL.normal}</SelectItem>
                    <SelectItem value="high">{PRIORITY_LABEL.high}</SelectItem>
                    <SelectItem value="urgent">{PRIORITY_LABEL.urgent}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>接收角色（空=全员）</Label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {ALL_ROLES.map(role => (
                    <Badge
                      key={role}
                      variant={targetRoles.includes(role) ? "default" : "outline"}
                      className="cursor-pointer text-[10px]"
                      onClick={() => toggleRole(role)}
                    >
                      {ROLE_LABEL[role]}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>操作按钮文案（可选）</Label>
                <Input value={actionLabel} onChange={e => setActionLabel(e.target.value)} placeholder="如：前往审核" />
              </div>
              <div className="space-y-2">
                <Label>操作跳转链接（可选）</Label>
                <Input value={actionHref} onChange={e => setActionHref(e.target.value)} placeholder="如：/manager-refund" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSubmit}>{editing ? "保存" : "发布"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>删除后无法恢复，确定要删除此通知吗？</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
