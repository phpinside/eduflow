"use client"

import { useState, useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Pencil, Trash2, Filter, ShieldAlert, AlertTriangle, AlertCircle, Minus, Info } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { TutorCreditRule, TutorCreditRuleCategory } from "@/types"
import { getStoredTutorCreditRules, saveStoredTutorCreditRules } from "@/lib/storage"

// ── 表单 Schema ──────────────────────────────────────────────
const formSchema = z.object({
  category: z.nativeEnum(TutorCreditRuleCategory),
  title: z.string().min(2, "规则名称至少 2 个字符").max(50, "规则名称不超过 50 个字符"),
  description: z.string().min(5, "说明至少 5 个字符").max(200, "说明不超过 200 个字符"),
  scoreDelta: z.coerce
    .number()
    .int("分值必须为整数")
    .min(-12, "最多扣 12 分")
    .max(-1, "仅能填写负整数扣分"),
  isEnabled: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

// ── 分类元数据 ────────────────────────────────────────────────
const CATEGORY_META: Record<
  TutorCreditRuleCategory,
  { label: string; color: string; bgColor: string; icon: React.ElementType; scoreLabel: string }
> = {
  [TutorCreditRuleCategory.MINOR]: {
    label: "轻微违规",
    color: "text-amber-700",
    bgColor: "bg-amber-50 border-amber-200",
    icon: AlertCircle,
    scoreLabel: "扣 1 分",
  },
  [TutorCreditRuleCategory.GENERAL]: {
    label: "一般违规",
    color: "text-orange-700",
    bgColor: "bg-orange-50 border-orange-200",
    icon: AlertTriangle,
    scoreLabel: "扣 3 分",
  },
  [TutorCreditRuleCategory.SEVERE]: {
    label: "严重违规",
    color: "text-red-700",
    bgColor: "bg-red-50 border-red-200",
    icon: Minus,
    scoreLabel: "扣 6 分",
  },
  [TutorCreditRuleCategory.REDLINE]: {
    label: "红线行为",
    color: "text-rose-900",
    bgColor: "bg-rose-50 border-rose-300",
    icon: ShieldAlert,
    scoreLabel: "立即清退",
  },
}

const CATEGORY_OPTIONS = Object.entries(CATEGORY_META).map(([value, meta]) => ({
  value: value as TutorCreditRuleCategory,
  label: meta.label,
}))

const FILTER_OPTIONS = [
  { value: "ALL", label: "全部类型" },
  ...CATEGORY_OPTIONS,
]

// ── 分值展示 ─────────────────────────────────────────────────
function ScoreBadge({ rule }: { rule: TutorCreditRule }) {
  if (rule.category === TutorCreditRuleCategory.REDLINE) {
    return (
      <Badge variant="destructive" className="font-medium whitespace-nowrap">
        -12 分 + 立即清退
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="text-red-700 border-red-300 bg-red-50">
      {rule.scoreDelta} 分
    </Badge>
  )
}

// ── 分类 Badge ──────────────────────────────────────────────
function CategoryBadge({ category }: { category: TutorCreditRuleCategory }) {
  const meta = CATEGORY_META[category]
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${meta.bgColor} ${meta.color}`}>
      <Icon className="h-3 w-3" />
      {meta.label}
    </span>
  )
}

// ── 主页面 ───────────────────────────────────────────────────
export default function TutorCreditRuleSettingsPage() {
  const [rules, setRules] = useState<TutorCreditRule[]>([])
  const [filterCategory, setFilterCategory] = useState<string>("ALL")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<TutorCreditRule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TutorCreditRule | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      category: TutorCreditRuleCategory.MINOR,
      title: "",
      description: "",
      scoreDelta: -1,
      isEnabled: true,
    },
  })

  const watchCategory = form.watch("category")

  useEffect(() => {
    const raw = getStoredTutorCreditRules()
    const cleaned = raw.filter((r) => (r.category as string) !== "BONUS")
    if (cleaned.length !== raw.length) {
      saveStoredTutorCreditRules(cleaned)
    }
    setRules(cleaned)
  }, [])

  const CATEGORY_DEFAULT_SCORE: Record<TutorCreditRuleCategory, number> = {
    [TutorCreditRuleCategory.MINOR]: -1,
    [TutorCreditRuleCategory.GENERAL]: -3,
    [TutorCreditRuleCategory.SEVERE]: -6,
    [TutorCreditRuleCategory.REDLINE]: -12,
  }

  useEffect(() => {
    form.setValue("scoreDelta", CATEGORY_DEFAULT_SCORE[watchCategory])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchCategory])

  const filteredRules = useMemo(() => {
    const base =
      filterCategory === "ALL"
        ? rules
        : rules.filter((r) => r.category === filterCategory)
    return [...base].sort(
      (a, b) =>
        CATEGORY_OPTIONS.findIndex((c) => c.value === a.category) -
          CATEGORY_OPTIONS.findIndex((c) => c.value === b.category) ||
        a.sortOrder - b.sortOrder
    )
  }, [rules, filterCategory])

  const stats = useMemo(() => {
    const total = rules.length
    const enabled = rules.filter((r) => r.isEnabled).length
    const byCategory = Object.values(TutorCreditRuleCategory).reduce(
      (acc, cat) => {
        acc[cat] = rules.filter((r) => r.category === cat).length
        return acc
      },
      {} as Record<TutorCreditRuleCategory, number>
    )
    return { total, enabled, byCategory }
  }, [rules])

  function openAdd() {
    setEditingRule(null)
    form.reset({
      category: TutorCreditRuleCategory.MINOR,
      title: "",
      description: "",
      scoreDelta: -1,
      isEnabled: true,
    })
    setDialogOpen(true)
  }

  function openEdit(rule: TutorCreditRule) {
    setEditingRule(rule)
    form.reset({
      category: rule.category,
      title: rule.title,
      description: rule.description,
      scoreDelta: rule.scoreDelta,
      isEnabled: rule.isEnabled,
    })
    setDialogOpen(true)
  }

  function onSubmit(values: FormValues) {
    const isDuplicate = rules.some(
      (r) =>
        r.category === values.category &&
        r.title.trim() === values.title.trim() &&
        r.id !== editingRule?.id
    )
    if (isDuplicate) {
      form.setError("title", { type: "manual", message: "同一类型下已存在同名规则" })
      return
    }

    let updated: TutorCreditRule[]
    if (editingRule) {
      updated = rules.map((r) =>
        r.id === editingRule.id
          ? { ...r, ...values, updatedAt: new Date() }
          : r
      )
      toast.success("规则已更新")
    } else {
      const maxOrder = rules
        .filter((r) => r.category === values.category)
        .reduce((m, r) => Math.max(m, r.sortOrder), 0)
      const newRule: TutorCreditRule = {
        id: `tcr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        ...values,
        sortOrder: maxOrder + 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      updated = [...rules, newRule]
      toast.success("规则已创建")
    }

    setRules(updated)
    saveStoredTutorCreditRules(updated)
    setDialogOpen(false)
  }

  function toggleEnabled(id: string) {
    const updated = rules.map((r) =>
      r.id === id ? { ...r, isEnabled: !r.isEnabled, updatedAt: new Date() } : r
    )
    setRules(updated)
    saveStoredTutorCreditRules(updated)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    const updated = rules.filter((r) => r.id !== deleteTarget.id)
    setRules(updated)
    saveStoredTutorCreditRules(updated)
    toast.success(`已删除规则：${deleteTarget.title}`)
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">伴学信用分规则配置</h1>
          <p className="text-muted-foreground mt-2">
            配置伴学教练信用分扣分及红线行为规则。信用分初始 12 分，扣至 0 分进入停单学习期，建议每 6 个月重置一次。
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-2 h-4 w-4" />
          新增规则
        </Button>
      </div>

      {/* 制度说明 */}
      <Card className="border-blue-200 bg-blue-50/60">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-blue-800">
            <Info className="h-4 w-4" />
            信用分制度说明
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-2 text-sm text-blue-900 sm:grid-cols-3">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 font-semibold">初始分值：</span>
            <span>每位伴学教练初始 12 分信用分</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 font-semibold">扣至 0 分：</span>
            <span>暂停接单 15 天，完成复训考核后恢复</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 font-semibold">重置周期：</span>
            <span>建议每 6 个月重置一次信用分</span>
          </div>
        </CardContent>
      </Card>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground mt-1">规则总数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-green-700">{stats.enabled}</div>
            <div className="text-xs text-muted-foreground mt-1">已启用</div>
          </CardContent>
        </Card>
        {Object.values(TutorCreditRuleCategory).map((cat) => {
          const meta = CATEGORY_META[cat]
          return (
            <Card key={cat}>
              <CardContent className="pt-4 pb-3 text-center">
                <div className={`text-2xl font-bold ${meta.color}`}>{stats.byCategory[cat]}</div>
                <div className="text-xs text-muted-foreground mt-1">{meta.label}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 规则列表 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>规则列表</CardTitle>
            <CardDescription>点击启用/停用开关可快速切换规则状态</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-b-lg border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">类型</TableHead>
                  <TableHead className="w-[200px]">规则名称</TableHead>
                  <TableHead>说明</TableHead>
                  <TableHead className="w-[100px]">分值变化</TableHead>
                  <TableHead className="w-[80px]">启用</TableHead>
                  <TableHead className="w-[100px] text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                      暂无规则数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRules.map((rule) => (
                    <TableRow
                      key={rule.id}
                      className={rule.isEnabled ? "" : "opacity-50"}
                    >
                      <TableCell>
                        <CategoryBadge category={rule.category} />
                      </TableCell>
                      <TableCell className="font-medium">{rule.title}</TableCell>
                      <TableCell className="max-w-xs text-sm text-muted-foreground">
                        <div className="line-clamp-2">{rule.description}</div>
                      </TableCell>
                      <TableCell>
                        <ScoreBadge rule={rule} />
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.isEnabled}
                          onCheckedChange={() => toggleEnabled(rule.id)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(rule)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) setDialogOpen(false) }}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? "编辑规则" : "新增规则"}</DialogTitle>
            <DialogDescription>
              {editingRule ? "修改信用分规则的内容与状态" : "创建一条新的信用分规则"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* 规则类型 */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>规则类型</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择规则类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CATEGORY_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 规则名称 */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>规则名称</FormLabel>
                    <FormControl>
                      <Input placeholder="例如：上课迟到" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 规则说明 */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>规则说明</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请详细描述该规则的触发场景及处理方式..."
                        className="min-h-[80px] resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>5 - 200 个字符</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 分值变化 */}
              <FormField
                control={form.control}
                name="scoreDelta"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>分值变化</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="扣分填负整数，红线固定为 -12"
                        {...field}
                        disabled={watchCategory === TutorCreditRuleCategory.REDLINE}
                      />
                    </FormControl>
                    <FormDescription>
                      {watchCategory === TutorCreditRuleCategory.REDLINE
                        ? "红线行为扣除 12 分并立即清退，分值固定为 -12"
                        : "扣分请填写负整数（如 -1、-3、-6）"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 启用状态 */}
              <FormField
                control={form.control}
                name="isEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">启用规则</FormLabel>
                      <FormDescription>停用后该规则不计入信用分计算</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">{editingRule ? "保存" : "创建"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>确认删除规则</DialogTitle>
            <DialogDescription>
              即将删除规则「{deleteTarget?.title}」，此操作不可撤销，确定继续吗？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
