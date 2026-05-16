"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { toast } from "sonner"
import {
  Plus, Pencil, Trash2, Check, ChevronsUpDown, Star,
} from "lucide-react"
import type { HeaderNavConfig } from "@/types"
import { Role } from "@/types"
import { getStoredHeaderNavConfigs, saveStoredHeaderNavConfigs } from "@/lib/storage"
import { getIconComponent, ICON_OPTIONS } from "@/lib/icon-map"

const ROLE_LABELS: Record<Role, string> = {
  [Role.SALES]: '招生老师',
  [Role.TUTOR]: '伴学教练',
  [Role.MANAGER]: '学管',
  [Role.OPERATOR]: '运营人员',
  [Role.ADMIN]: '管理员',
}

const ALL_ROLES = Object.values(Role)

function DynamicIcon({ name, className }: { name: string; className?: string }) {
  return React.createElement(getIconComponent(name), { className })
}

export default function NavSettingsPage() {
  const [navConfigs, setNavConfigs] = React.useState<HeaderNavConfig[]>([])
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<HeaderNavConfig | null>(null)
  const [iconPickerOpen, setIconPickerOpen] = React.useState(false)
  const [formData, setFormData] = React.useState({
    title: "",
    href: "",
    icon: "LayoutDashboard",
    emphasis: false,
    visibleRoles: ALL_ROLES as Role[],
    sortOrder: 1,
    enabled: true,
  })

  React.useEffect(() => {
    setNavConfigs(getStoredHeaderNavConfigs())
  }, [])

  const sortedConfigs = React.useMemo(() =>
    [...navConfigs].sort((a, b) => a.sortOrder - b.sortOrder),
    [navConfigs]
  )

  const handleOpenCreate = () => {
    setEditingItem(null)
    setFormData({
      title: "",
      href: "",
      icon: "LayoutDashboard",
      emphasis: false,
      visibleRoles: [...ALL_ROLES],
      sortOrder: navConfigs.length + 1,
      enabled: true,
    })
    setIsEditOpen(true)
  }

  const handleOpenEdit = (item: HeaderNavConfig) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      href: item.href,
      icon: item.icon,
      emphasis: item.emphasis,
      visibleRoles: [...item.visibleRoles],
      sortOrder: item.sortOrder,
      enabled: item.enabled,
    })
    setIsEditOpen(true)
  }

  const handleSave = () => {
    if (!formData.title.trim()) {
      toast.error("请填写导航标题")
      return
    }
    if (!formData.href.trim()) {
      toast.error("请填写链接地址")
      return
    }
    if (formData.visibleRoles.length === 0) {
      toast.error("请至少选择一个可视角色")
      return
    }

    const now = new Date()
    const updated = [...navConfigs]
    const isExternal = formData.href.startsWith("http")

    if (editingItem) {
      const index = updated.findIndex(c => c.id === editingItem.id)
      if (index !== -1) {
        updated[index] = {
          ...editingItem,
          ...formData,
          external: isExternal,
          updatedAt: now,
        }
      }
      toast.success("导航已更新")
    } else {
      const newItem: HeaderNavConfig = {
        id: `hn-${Date.now()}`,
        ...formData,
        external: isExternal,
        createdAt: now,
        updatedAt: now,
      }
      updated.push(newItem)
      toast.success("导航已创建")
    }

    setNavConfigs(updated)
    saveStoredHeaderNavConfigs(updated)
    window.dispatchEvent(new Event('header-nav-updated'))
    setIsEditOpen(false)
  }

  const handleDelete = (item: HeaderNavConfig) => {
    if (!confirm(`确认删除导航"${item.title}"？`)) return
    const updated = navConfigs.filter(c => c.id !== item.id)
    setNavConfigs(updated)
    saveStoredHeaderNavConfigs(updated)
    window.dispatchEvent(new Event('header-nav-updated'))
    toast.success("导航已删除")
  }

  const handleToggleEnabled = (item: HeaderNavConfig, enabled: boolean) => {
    const updated = navConfigs.map(c =>
      c.id === item.id ? { ...c, enabled, updatedAt: new Date() } : c
    )
    setNavConfigs(updated)
    saveStoredHeaderNavConfigs(updated)
    window.dispatchEvent(new Event('header-nav-updated'))
    toast.success(enabled ? "已启用" : "已停用")
  }

  const toggleRole = (role: Role) => {
    setFormData(prev => ({
      ...prev,
      visibleRoles: prev.visibleRoles.includes(role)
        ? prev.visibleRoles.filter(r => r !== role)
        : [...prev.visibleRoles, role],
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">导航管理</h2>
          <p className="text-muted-foreground">管理顶部快捷导航链接，控制显示内容、排序和可见角色</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          新增导航
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>导航列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">排序</TableHead>
                <TableHead className="w-16">图标</TableHead>
                <TableHead>标题</TableHead>
                <TableHead>链接</TableHead>
                <TableHead className="w-20">强调</TableHead>
                <TableHead>可视角色</TableHead>
                <TableHead className="w-20">状态</TableHead>
                <TableHead className="w-28">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedConfigs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    暂无导航数据
                  </TableCell>
                </TableRow>
              ) : (
                sortedConfigs.map((item) => {
                  return (
                    <TableRow key={item.id} className={!item.enabled ? "opacity-50" : undefined}>
                      <TableCell className="font-mono text-center">{item.sortOrder}</TableCell>
                      <TableCell>
                        <div className="flex justify-center">
                          <DynamicIcon name={item.icon} className="h-4 w-4" />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground" title={item.href}>
                        <span className="flex items-center gap-1.5">
                          {item.href}
                          <Badge variant={item.external ? "outline" : "secondary"} className="text-[10px] shrink-0 px-1.5 py-0">
                            {item.external ? "外链" : "内部"}
                          </Badge>
                        </span>
                      </TableCell>
                      <TableCell>
                        {item.emphasis ? <Star className="h-4 w-4 text-yellow-500 mx-auto" /> : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.visibleRoles.map(role => (
                            <Badge key={role} variant="outline" className="text-[10px] px-1.5 py-0">
                              {ROLE_LABELS[role]}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.enabled}
                            onCheckedChange={(checked) => handleToggleEnabled(item, checked)}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => handleOpenEdit(item)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600" onClick={() => handleDelete(item)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "编辑导航" : "新增导航"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>导航标题 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="如：帮助中心"
              />
            </div>

            <div className="space-y-2">
              <Label>图标</Label>
              <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={iconPickerOpen} className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <DynamicIcon name={formData.icon} className="h-4 w-4" />
                      {formData.icon}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="搜索图标..." />
                    <CommandList>
                      <CommandEmpty>未找到图标</CommandEmpty>
                      <CommandGroup>
                        <div className="grid grid-cols-6 gap-1 p-2">
                          {ICON_OPTIONS.map(opt => (
                              <CommandItem
                                key={opt.name}
                                value={opt.name}
                                onSelect={() => {
                                  setFormData(prev => ({ ...prev, icon: opt.name }))
                                  setIconPickerOpen(false)
                                }}
                                className="flex flex-col items-center justify-center gap-1 p-2 cursor-pointer rounded-md hover:bg-accent"
                              >
                                <DynamicIcon name={opt.name} className="h-5 w-5" />
                                <span className="text-[9px] text-center leading-tight truncate w-full">{opt.name}</span>
                                {formData.icon === opt.name && <Check className="h-3 w-3 absolute top-1 right-1 text-primary" />}
                              </CommandItem>
                          ))}
                        </div>
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>链接地址 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.href}
                onChange={(e) => setFormData(prev => ({ ...prev, href: e.target.value }))}
                placeholder="内部路径如 /analytics 或外部链接如 https://..."
              />
              <p className="text-xs text-muted-foreground">
                {formData.href.startsWith("http")
                  ? "将作为外部链接打开"
                  : formData.href.trim()
                    ? "将作为内部路径打开"
                    : "以 http 开头自动识别为外部链接"}
              </p>
            </div>

            <div className="space-y-2">
              <Label>排序（数字越小越靠前）</Label>
              <Input
                type="number"
                min={1}
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.emphasis}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, emphasis: checked }))}
                />
                <Label>强调样式</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
                />
                <Label>启用</Label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>可视角色</Label>
              <div className="grid grid-cols-2 gap-3 rounded-md border p-3">
                {ALL_ROLES.map(role => (
                  <label key={role} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.visibleRoles.includes(role)}
                      onCheckedChange={() => toggleRole(role)}
                    />
                    <span className="text-sm">{ROLE_LABELS[role]}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              {editingItem ? "保存修改" : "创建导航"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
