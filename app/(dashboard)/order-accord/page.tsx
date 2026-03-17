"use client"

import { useState, useEffect, useMemo, useRef } from "react"
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Plus, RotateCcw, Upload, Download } from "lucide-react"
import { toast } from "sonner"
import { OrderAccordRecord } from "@/types"
import {
  getStoredOrderAccordRecords,
  saveOrderAccordRecords,
} from "@/lib/storage"

// ─── 常量 ────────────────────────────────────────────────────
const PHONE_REGEX = /^1[3-9]\d{9}$/
const PAGE_SIZE = 10

// ═══════════════════════════════════════════════════════════
// 订单补录 Tab
// ═══════════════════════════════════════════════════════════

const orderFormSchema = z.object({
  tutorName: z.string().min(1, "伴学教练姓名不能为空"),
  tutorPhone: z.string().regex(PHONE_REGEX, "请输入有效的11位手机号"),
  managerName: z.string().min(1, "学管姓名不能为空"),
  managerPhone: z.string().regex(PHONE_REGEX, "请输入有效的11位手机号"),
  subjectName: z.string().min(1, "科目名称不能为空"),
  studentGAccount: z.string().min(1, "学员G账号不能为空"),
  grade: z.string().min(1, "年级不能为空"),
  remainingHours: z
    .string()
    .min(1, "剩余课时不能为空")
    .refine((v) => Number.isInteger(Number(v)) && Number(v) > 0, {
      message: "剩余课时须为正整数",
    }),
  studentName: z.string().min(1, "学生姓名不能为空"),
  parentPhone: z.string().regex(PHONE_REGEX, "请输入有效的11位手机号"),
})

type OrderFormValues = z.infer<typeof orderFormSchema>

const ORDER_EMPTY: OrderFormValues = {
  tutorName: "",
  tutorPhone: "",
  managerName: "",
  managerPhone: "",
  subjectName: "",
  studentGAccount: "",
  grade: "",
  remainingHours: "",
  studentName: "",
  parentPhone: "",
}

// CSV 列定义（顺序与导出/导入保持一致）
const CSV_HEADERS = [
  "伴学教练姓名", "伴学教练手机号", "学管姓名", "学管手机号",
  "科目名称", "学员G账号", "年级", "剩余课时", "学生姓名", "家长手机号",
]

function recordToCsvRow(r: OrderAccordRecord): string {
  return [
    r.tutorName, r.tutorPhone, r.managerName, r.managerPhone,
    r.subjectName, r.studentGAccount, r.grade, r.remainingHours,
    r.studentName, r.parentPhone,
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
}

function OrderAccordTab() {
  const [records, setRecords] = useState<OrderAccordRecord[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterTutorPhone, setFilterTutorPhone] = useState("")
  const [filterStudentName, setFilterStudentName] = useState("")
  const [filterGAccount, setFilterGAccount] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: ORDER_EMPTY,
  })

  useEffect(() => {
    setRecords(getStoredOrderAccordRecords())
  }, [])

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchPhone = filterTutorPhone ? r.tutorPhone.includes(filterTutorPhone.trim()) : true
      const matchName = filterStudentName ? r.studentName.includes(filterStudentName.trim()) : true
      const matchG = filterGAccount
        ? r.studentGAccount.toLowerCase().includes(filterGAccount.trim().toLowerCase())
        : true
      return matchPhone && matchName && matchG
    })
  }, [records, filterTutorPhone, filterStudentName, filterGAccount])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleReset = () => {
    setFilterTutorPhone("")
    setFilterStudentName("")
    setFilterGAccount("")
    setCurrentPage(1)
  }

  const handleFilterChange = (setter: (v: string) => void) => (v: string) => {
    setter(v)
    setCurrentPage(1)
  }

  // 导出：将当前筛选结果导出为 CSV
  const handleExport = () => {
    if (filtered.length === 0) {
      toast.error("当前无可导出的数据")
      return
    }
    const rows = [CSV_HEADERS.join(","), ...filtered.map(recordToCsvRow)]
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `订单补录_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`已导出 ${filtered.length} 条记录`)
  }

  // 导入：解析 CSV 文件，追加到现有记录
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = (event.target?.result as string).replace(/^\uFEFF/, "") // 去 BOM
      const lines = text.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length < 2) {
        toast.error("CSV 文件内容为空或格式不正确")
        return
      }
      const dataLines = lines.slice(1) // 跳过表头
      const now = new Date()
      let successCount = 0
      const newRecords: OrderAccordRecord[] = []

      dataLines.forEach((line, idx) => {
        // 简单 CSV 解析（支持带引号的字段）
        const cols = line.match(/("(?:[^"]|"")*"|[^,]*)/g)
          ?.map((c) => c.replace(/^"|"$/g, "").replace(/""/g, '"').trim()) ?? []

        if (cols.length < 10) return
        const [
          tutorName, tutorPhone, managerName, managerPhone,
          subjectName, studentGAccount, grade, remainingHoursStr,
          studentName, parentPhone,
        ] = cols

        const remainingHours = parseInt(remainingHoursStr, 10)
        if (!tutorName || !tutorPhone || !managerName || !managerPhone ||
            !subjectName || !studentGAccount || !grade || isNaN(remainingHours) ||
            !studentName || !parentPhone) {
          console.warn(`第 ${idx + 2} 行数据不完整，已跳过`)
          return
        }

        newRecords.push({
          id: `accord-import-${Date.now()}-${idx}`,
          tutorName, tutorPhone, managerName, managerPhone,
          subjectName, studentGAccount, grade, remainingHours,
          studentName, parentPhone,
          createdAt: now,
          updatedAt: now,
        })
        successCount++
      })

      if (successCount === 0) {
        toast.error("未能解析到有效数据，请检查 CSV 格式")
      } else {
        const updated = [...records, ...newRecords]
        setRecords(updated)
        saveOrderAccordRecords(updated)
        toast.success(`成功导入 ${successCount} 条记录`)
      }
    }
    reader.readAsText(file, "utf-8")
    // 重置 input，允许重复选同一文件
    e.target.value = ""
  }

  const onSubmit = (values: OrderFormValues) => {
    const now = new Date()
    const newRecord: OrderAccordRecord = {
      id: `accord-${Date.now()}`,
      ...values,
      remainingHours: Number(values.remainingHours),
      createdAt: now,
      updatedAt: now,
    }
    const updated = [...records, newRecord]
    setRecords(updated)
    saveOrderAccordRecords(updated)
    toast.success("补录记录已新增")
    setIsDialogOpen(false)
    form.reset()
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    form.reset()
  }

  return (
    <div className="space-y-4">
      {/* 隐藏文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* 筛选栏 */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="伴学教练手机号"
          value={filterTutorPhone}
          onChange={(e) => handleFilterChange(setFilterTutorPhone)(e.target.value)}
          className="w-44"
        />
        <Input
          placeholder="学员姓名"
          value={filterStudentName}
          onChange={(e) => handleFilterChange(setFilterStudentName)(e.target.value)}
          className="w-36"
        />
        <Input
          placeholder="学员G账号"
          value={filterGAccount}
          onChange={(e) => handleFilterChange(setFilterGAccount)(e.target.value)}
          className="w-36"
        />
        <Button variant="outline" size="sm" onClick={handleReset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          重置
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">共 {filtered.length} 条记录</span>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          导出
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          导入
        </Button>
        <Button size="sm" onClick={() => { form.reset(ORDER_EMPTY); setIsDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" />
          新增补录
        </Button>
      </div>

      {/* 表格 */}
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">伴学教练</TableHead>
              <TableHead className="whitespace-nowrap">教练手机</TableHead>
              <TableHead className="whitespace-nowrap">学管姓名</TableHead>
              <TableHead className="whitespace-nowrap">学管手机</TableHead>
              <TableHead className="whitespace-nowrap">科目</TableHead>
              <TableHead className="whitespace-nowrap">G账号</TableHead>
              <TableHead className="whitespace-nowrap">年级</TableHead>
              <TableHead className="whitespace-nowrap text-right">剩余课时</TableHead>
              <TableHead className="whitespace-nowrap">学生姓名</TableHead>
              <TableHead className="whitespace-nowrap">家长手机</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center text-muted-foreground py-10">
                  暂无补录数据
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium whitespace-nowrap">{record.tutorName}</TableCell>
                  <TableCell className="whitespace-nowrap">{record.tutorPhone}</TableCell>
                  <TableCell className="whitespace-nowrap">{record.managerName}</TableCell>
                  <TableCell className="whitespace-nowrap">{record.managerPhone}</TableCell>
                  <TableCell className="whitespace-nowrap">{record.subjectName}</TableCell>
                  <TableCell className="whitespace-nowrap font-mono text-sm">{record.studentGAccount}</TableCell>
                  <TableCell className="whitespace-nowrap">{record.grade}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">{record.remainingHours}</TableCell>
                  <TableCell className="whitespace-nowrap">{record.studentName}</TableCell>
                  <TableCell className="whitespace-nowrap">{record.parentPhone}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => p - 1)}>
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">第 {currentPage} / {totalPages} 页</span>
          <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => p + 1)}>
            下一页
          </Button>
        </div>
      )}

      {/* 新增 Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[640px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新增补录订单</DialogTitle>
            <DialogDescription>手动录入一条订单数据</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="tutorName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>伴学教练姓名</FormLabel>
                    <FormControl><Input placeholder="张丽" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tutorPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>伴学教练手机号</FormLabel>
                    <FormControl><Input placeholder="13700137001" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="managerName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>学管姓名</FormLabel>
                    <FormControl><Input placeholder="王学管" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="managerPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>学管手机号</FormLabel>
                    <FormControl><Input placeholder="13700137000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="subjectName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>科目名称</FormLabel>
                    <FormControl><Input placeholder="数学" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="studentGAccount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>学员G账号</FormLabel>
                    <FormControl><Input placeholder="G12342" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="grade" render={({ field }) => (
                  <FormItem>
                    <FormLabel>年级</FormLabel>
                    <FormControl><Input placeholder="三年级" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="remainingHours" render={({ field }) => (
                  <FormItem>
                    <FormLabel>剩余课时</FormLabel>
                    <FormControl><Input type="number" min={1} placeholder="19" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="studentName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>学生姓名</FormLabel>
                    <FormControl><Input placeholder="张小明" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="parentPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>家长手机号</FormLabel>
                    <FormControl><Input placeholder="13800138000" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={handleDialogClose}>取消</Button>
                <Button type="submit">新增</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// 页面入口
// ═══════════════════════════════════════════════════════════

export default function OrderAccordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">订单补录</h1>
        <p className="text-muted-foreground mt-1">
          手动录入或导入补录数据
        </p>
      </div>
      <OrderAccordTab />
    </div>
  )
}
