"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch"
import { Plus, Pencil } from "lucide-react"
import { toast } from "sonner"
import { Subject } from "@/types"
import { getStoredSubjects, saveMockData, STORAGE_KEYS } from "@/lib/storage"

// 表单验证模式
const subjectFormSchema = z.object({
  code: z.string().min(1, "科目编号不能为空"),
  name: z.string().min(1, "科目名称不能为空"),
  description: z.string().min(10, "科目简介至少需要10个字符"),
  enabled: z.boolean(),
})

type SubjectFormValues = z.infer<typeof subjectFormSchema>

export default function SubjectSettingsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      enabled: true,
    },
  })

  // 加载科目数据
  useEffect(() => {
    loadSubjects()
  }, [])

  const loadSubjects = () => {
    const storedSubjects = getStoredSubjects()
    setSubjects(storedSubjects)
  }

  // 打开新增对话框
  const handleAddNew = () => {
    setEditingSubject(null)
    form.reset({
      code: "",
      name: "",
      description: "",
      enabled: true,
    })
    setIsDialogOpen(true)
  }

  // 打开编辑对话框
  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    form.reset({
      code: subject.code,
      name: subject.name,
      description: subject.description,
      enabled: subject.enabled,
    })
    setIsDialogOpen(true)
  }

  // 提交表单
  const onSubmit = (values: SubjectFormValues) => {
    let updatedSubjects: Subject[]

    if (editingSubject) {
      // 编辑现有科目
      updatedSubjects = subjects.map((s) =>
        s.id === editingSubject.id
          ? {
              ...s,
              name: values.name,
              description: values.description,
              enabled: values.enabled,
              updatedAt: new Date(),
            }
          : s
      )
      toast.success(`已更新科目: ${values.name}`)
    } else {
      // 检查科目编号是否已存在
      const codeExists = subjects.some((s) => s.code === values.code)
      if (codeExists) {
        form.setError("code", {
          type: "manual",
          message: "科目编号已存在",
        })
        return
      }

      // 新增科目
      const newSubject: Subject = {
        id: `subj-${Date.now()}`,
        code: values.code,
        name: values.name,
        description: values.description,
        enabled: values.enabled,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      updatedSubjects = [...subjects, newSubject]
      toast.success(`已新增科目: ${values.name}`)
    }

    setSubjects(updatedSubjects)
    saveMockData(STORAGE_KEYS.SUBJECTS, updatedSubjects)
    setIsDialogOpen(false)
    form.reset()
  }

  // 关闭对话框
  const handleDialogClose = () => {
    setIsDialogOpen(false)
    setEditingSubject(null)
    form.reset()
  }

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">教学科目配置</h1>
          <p className="text-muted-foreground mt-2">
            管理系统中的教学科目，支持新增、编辑和删除
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" />
          新增科目
        </Button>
      </div>

      {/* 科目列表表格 */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">科目编号</TableHead>
              <TableHead className="w-[150px]">科目名称</TableHead>
              <TableHead>科目简介</TableHead>
              <TableHead className="w-[100px]">状态</TableHead>
              <TableHead className="w-[100px] text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  暂无科目数据
                </TableCell>
              </TableRow>
            ) : (
              subjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.code}</TableCell>
                  <TableCell className="font-medium">{subject.name}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="line-clamp-2">{subject.description}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={subject.enabled ? "default" : "secondary"}>
                      {subject.enabled ? "已启用" : "已禁用"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(subject)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 新增/编辑对话框 */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? "编辑科目" : "新增科目"}
            </DialogTitle>
            <DialogDescription>
              {editingSubject
                ? "修改科目信息，编号不可更改"
                : "填写科目信息，创建新的教学科目"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>科目编号</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="例如: MATH-001"
                        {...field}
                        disabled={!!editingSubject}
                      />
                    </FormControl>
                    <FormDescription>
                      {editingSubject
                        ? "科目编号不可修改"
                        : "科目的唯一标识符，创建后不可修改"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>科目名称</FormLabel>
                    <FormControl>
                      <Input placeholder="例如: 数学" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>科目简介</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="请输入科目的详细介绍..."
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>至少10个字符</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">启用状态</FormLabel>
                      <FormDescription>
                        控制该科目是否在系统中可用
                      </FormDescription>
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
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  取消
                </Button>
                <Button type="submit">
                  {editingSubject ? "保存" : "创建"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
