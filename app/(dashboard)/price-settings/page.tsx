"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus, Pencil, Trash2, Filter, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { Input } from "@/components/ui/input"
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

import { 
  PriceRule, 
  mockPriceRules, 
  SUBJECTS, 
  GRADES 
} from "@/lib/mock-data/price-settings"

const formSchema = z.object({
  subject: z.string().min(1, "请选择学科"),
  grade: z.string().min(1, "请选择年级"),
  regularPrice: z.coerce.number().min(0, "价格不能为负数"),
  trialPrice: z.coerce.number().min(0, "价格不能为负数"),
  trialDuration: z.coerce.number().min(0, "时长不能为负数"),
  trialReward: z.coerce.number().min(0, "金额不能为负数"),
  isEnabled: z.boolean(),
})

export default function PriceSettingsPage() {
  const [rules, setRules] = React.useState<PriceRule[]>(mockPriceRules)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [editingRule, setEditingRule] = React.useState<PriceRule | null>(null)
  const [subjectFilter, setSubjectFilter] = React.useState<string>("ALL")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      subject: "",
      grade: "",
      regularPrice: 0,
      trialPrice: 0,
      trialDuration: 60,
      trialReward: 0,
      isEnabled: true,
    },
  })

  // Update form values when editingRule changes
  React.useEffect(() => {
    if (editingRule) {
      form.reset({
        subject: editingRule.subject,
        grade: editingRule.grade,
        regularPrice: editingRule.regularPrice,
        trialPrice: editingRule.trialPrice,
        trialDuration: editingRule.trialDuration,
        trialReward: editingRule.trialReward,
        isEnabled: editingRule.isEnabled,
      })
    } else {
      form.reset({
        subject: "",
        grade: "",
        regularPrice: 0,
        trialPrice: 0,
        trialDuration: 60,
        trialReward: 0,
        isEnabled: true,
      })
    }
  }, [editingRule, form])

  const filteredRules = React.useMemo(() => {
    if (subjectFilter === "ALL") return rules
    return rules.filter((rule) => rule.subject === subjectFilter)
  }, [rules, subjectFilter])

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (editingRule) {
      // Edit existing rule
      setRules((prev) =>
        prev.map((r) =>
          r.id === editingRule.id
            ? { ...values, id: editingRule.id }
            : r
        )
      )
      toast.success("规则更新成功")
    } else {
      // Check for duplicate rule
      const exists = rules.find(
        (r) => r.subject === values.subject && r.grade === values.grade
      )
      if (exists) {
        toast.error("该学科和年级的规则已存在")
        return
      }

      // Create new rule
      const newRule: PriceRule = {
        id: Math.random().toString(36).substr(2, 9),
        ...values,
      }
      setRules((prev) => [...prev, newRule])
      toast.success("规则创建成功")
    }
    setDialogOpen(false)
    setEditingRule(null)
  }

  const handleDelete = (id: string) => {
    if (confirm("确定要删除这条规则吗？")) {
      setRules((prev) => prev.filter((r) => r.id !== id))
      toast.success("规则已删除")
    }
  }

  const handleEdit = (rule: PriceRule) => {
    setEditingRule(rule)
    setDialogOpen(true)
  }

  const handleAddNew = () => {
    setEditingRule(null)
    setDialogOpen(true)
  }

  const toggleEnabled = (id: string, currentStatus: boolean) => {
    setRules((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, isEnabled: !currentStatus }
            : r
        )
      )
  }

  return (
    <div className="space-y-6 container mx-auto pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">价格配置表</h1>
        <p className="text-muted-foreground">管理不同年级、学科的课时价格及试课规则。</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle>配置列表</CardTitle>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            添加规则
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
             <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">筛选:</span>
             </div>
             <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择学科" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部学科</SelectItem>
                {SUBJECTS.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>学科</TableHead>
                  <TableHead>年级</TableHead>
                  <TableHead>正课价格(元/课时)</TableHead>
                  <TableHead>试课价格(元)</TableHead>
                  <TableHead>试课时长(分)</TableHead>
                  <TableHead>试课成交奖励(元)</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRules.length > 0 ? (
                  filteredRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.subject}</TableCell>
                      <TableCell>{rule.grade}</TableCell>
                      <TableCell>¥{rule.regularPrice}</TableCell>
                      <TableCell>¥{rule.trialPrice}</TableCell>
                      <TableCell>{rule.trialDuration}分钟</TableCell>
                      <TableCell>¥{rule.trialReward}</TableCell>
                      <TableCell>
                        <Switch 
                            checked={rule.isEnabled}
                            onCheckedChange={() => toggleEnabled(rule.id, rule.isEnabled)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(rule.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">
                      暂无配置规则
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? "编辑规则" : "添加规则"}</DialogTitle>
            <DialogDescription>
              配置特定年级和学科的价格及课程规则。
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>学科</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择学科" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SUBJECTS.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="grade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>年级</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择年级" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {GRADES.map((g) => (
                            <SelectItem key={g} value={g}>{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="regularPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>正课课时价格 (元)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="trialPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>试课价格 (元)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trialDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>试课时长 (分钟)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trialReward"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>试课成交奖励 (元)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                              <FormLabel className="text-base">启用规则</FormLabel>
                          </div>
                          <FormControl>
                              <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                              />
                          </FormControl>
                      </FormItem>
                  )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button type="submit">保存</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
