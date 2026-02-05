"use client"

import { useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { Suspense } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Plus, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"

// --- Constants ---

const SUBJECTS = ["数学", "物理", "英语", "化学", "生物", "语文", "历史", "地理", "政治"] as const
const GRADES = ["四年级", "五年级", "六年级", "初一", "初二", "初三", "高一", "高二", "高三"] as const
const GENDERS = ["男", "女"] as const
const WEEKDAYS = [
  { value: "monday", label: "周一" },
  { value: "tuesday", label: "周二" },
  { value: "wednesday", label: "周三" },
  { value: "thursday", label: "周四" },
  { value: "friday", label: "周五" },
  { value: "saturday", label: "周六" },
  { value: "sunday", label: "周日" },
]

const PRICING: Record<string, number> = {
  "四年级": 150, "五年级": 150,
  "六年级": 180,
  "初一": 200,
  "初二": 220,
  "初三": 250,
  "高一": 280,
  "高二": 300,
  "高三": 320,
}

// Generate time options (00:00 - 23:30)
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const minutes = (i % 2) * 30
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
})

// --- Schemas ---

const scheduleSchema = z.object({
  day: z.string(),
  startTime: z.string(),
  endTime: z.string(),
}).refine((data) => {
  if (!data.startTime || !data.endTime) return true;
  return data.endTime > data.startTime;
}, {
  message: "结束时间必须晚于开始时间",
  path: ["endTime"],
});

const formSchema = z.object({
  // School/Campus Info
  campusName: z.string().optional(),
  campusAccount: z.string().optional(),
  studentAccount: z.string().optional(),

  // Student Basic Info
  studentName: z.string().min(1, "请输入学生姓名"),
  gender: z.enum(GENDERS, { message: "请选择性别" }),
  subject: z.enum(SUBJECTS, { message: "请选择科目" }),
  grade: z.enum(GRADES, { message: "请选择年级" }),
  region: z.string().min(1, "请输入地区"),
  school: z.string().optional(),

  // Academic Info
  lastExamScore: z.string().optional(),
  examMaxScore: z.string().optional(),
  textbookVersion: z.string().optional(),

  // Parent Info
  parentPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),

  // Scheduling Info
  totalHours: z.coerce.number().min(1, "课时数必须大于0").max(1000, "课时数不能超过1000"),
  
  weeklySchedule: z.array(scheduleSchema).optional(), // We will handle UI specially for this

  firstClassDate: z.date().optional(),
  firstClassStartTime: z.string().optional(),
  firstClassEndTime: z.string().optional(),

  remarks: z.string().optional(),
}).refine((data) => {
    // Logic validation for first class time
    if (data.firstClassStartTime && data.firstClassEndTime) {
        return data.firstClassEndTime > data.firstClassStartTime;
    }
    return true;
}, {
    message: "首次课结束时间必须晚于开始时间",
    path: ["firstClassEndTime"],
});

type FormValues = z.infer<typeof formSchema>

function CreateRegularCourseForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campusName: "",
      campusAccount: "",
      studentAccount: "",
      studentName: "",
      gender: "男",
      subject: undefined,
      grade: undefined,
      region: "",
      school: "",
      lastExamScore: "",
      examMaxScore: "",
      textbookVersion: "",
      parentPhone: "",
      totalHours: 40,
      weeklySchedule: [],
      firstClassStartTime: "",
      firstClassEndTime: "",
      remarks: "",
    },
    mode: "onChange",
  })

  const { watch, setValue } = form

  // Pre-fill form from URL params (e.g. converting from trial lesson)
  React.useEffect(() => {
    const params = Object.fromEntries(searchParams.entries())
    
    if (params.studentName) setValue("studentName", params.studentName)
    if (params.gender && GENDERS.includes(params.gender as any)) setValue("gender", params.gender as any)
    
    // Use manual check instead of includes for subject/grade to avoid type narrowing issues or potential encoding mismatches
    if (params.subject) {
        const foundSubject = SUBJECTS.find(s => s === params.subject)
        if (foundSubject) setValue("subject", foundSubject)
    }
    
    if (params.grade) {
        const foundGrade = GRADES.find(g => g === params.grade)
        if (foundGrade) setValue("grade", foundGrade)
    }

    if (params.region) setValue("region", params.region)
    if (params.school) setValue("school", params.school)
    if (params.parentPhone) setValue("parentPhone", params.parentPhone)
    if (params.campusName) setValue("campusName", params.campusName)
    if (params.campusAccount) setValue("campusAccount", params.campusAccount)
    if (params.studentAccount) setValue("studentAccount", params.studentAccount)
    
  }, [searchParams, setValue])

  const selectedGrade = watch("grade")
  const totalHours = watch("totalHours") || 0
  const weeklySchedule = watch("weeklySchedule") || []
  
  // Cost Calculation
  const pricePerHour = selectedGrade ? PRICING[selectedGrade] : 0
  const totalCost = pricePerHour * totalHours

  // Fill Test Data
  const fillTestData = () => {
    setValue("campusName", "北京校区")
    setValue("campusAccount", "beijing_01")
    setValue("studentAccount", "stu_001")
    setValue("studentName", "张三")
    setValue("gender", "男")
    setValue("subject", "数学")
    setValue("grade", "初一")
    setValue("region", "北京市海淀区")
    setValue("school", "人大附中")
    setValue("lastExamScore", "95")
    setValue("examMaxScore", "100")
    setValue("textbookVersion", "人教版")
    setValue("parentPhone", "13800138000")
    setValue("totalHours", 40)
    setValue("remarks", "学生基础较好，希望提高拔高。")
    setValue("weeklySchedule", [
      { day: "monday", startTime: "18:00", endTime: "20:00" },
      { day: "saturday", startTime: "10:00", endTime: "12:00" }
    ])
    // Clear first class time fields just in case
    setValue("firstClassDate", undefined)
    setValue("firstClassStartTime", "")
    setValue("firstClassEndTime", "")
  }

  const handleStudentSelect = (student: any) => {
    setValue("studentName", student.name)
    setValue("parentPhone", student.parentPhone)
    if (student.gender && GENDERS.includes(student.gender)) setValue("gender", student.gender)
    if (student.region) setValue("region", student.region)
    if (student.school) setValue("school", student.school)
    if (student.grade && GRADES.includes(student.grade)) setValue("grade", student.grade)
    if (student.subject && SUBJECTS.includes(student.subject)) setValue("subject", student.subject)
    if (student.campusName) setValue("campusName", student.campusName)
    if (student.campusAccount) setValue("campusAccount", student.campusAccount)
    if (student.studentAccount) setValue("studentAccount", student.studentAccount)
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log("Submit Regular Course Order:", data)
    console.log("Total Cost:", totalCost)

    // Redirect to payment or success page (mock)
    toast.success("正课单创建成功！即将跳转...")
    
    // Construct query params for demo purposes (in real app, post to API)
    const queryParams = new URLSearchParams({
        type: "regular",
        studentName: data.studentName,
        subject: data.subject,
        grade: data.grade,
        totalHours: totalHours.toString(),
        price: totalCost.toString(),
    }).toString()
    
    router.push(`/regular-course/payment?${queryParams}`)
    setIsSubmitting(false)
  }

  // Helper to manage weekly schedule
  const toggleDay = (dayValue: string) => {
    const currentSchedule = form.getValues("weeklySchedule") || []
    const exists = currentSchedule.find(s => s.day === dayValue)
    
    if (exists) {
      setValue("weeklySchedule", currentSchedule.filter(s => s.day !== dayValue))
    } else {
      setValue("weeklySchedule", [...currentSchedule, { day: dayValue, startTime: "18:00", endTime: "20:00" }])
    }
  }

  const updateScheduleTime = (dayValue: string, field: 'startTime' | 'endTime', value: string) => {
    const currentSchedule = form.getValues("weeklySchedule") || []
    const newSchedule = currentSchedule.map(s => {
      if (s.day === dayValue) {
        return { ...s, [field]: value }
      }
      return s
    })
    setValue("weeklySchedule", newSchedule)
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div>
            <h2 className="text-3xl font-bold tracking-tight">创建正课单</h2>
            <p className="text-muted-foreground mt-2">填写学生信息和排课需求，生成正课订单。</p>
        </div>
        <div className="flex gap-2">
            <StudentSelector onSelect={handleStudentSelect} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* 1. Student Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>一、学生信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Campus Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground">校区相关信息</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="campusName" render={({ field }) => (
                                    <FormItem><FormLabel>校区名称</FormLabel><FormControl><Input placeholder="北京校区" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="campusAccount" render={({ field }) => (
                                    <FormItem><FormLabel>校区账号</FormLabel><FormControl><Input placeholder="beijing_01" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="studentAccount" render={({ field }) => (
                                    <FormItem><FormLabel>学生账号</FormLabel><FormControl><Input placeholder="stu_001" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-sm font-medium text-muted-foreground">学生基本信息</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="studentName" render={({ field }) => (
                                    <FormItem><FormLabel>学生姓名*</FormLabel><FormControl><Input placeholder="真实姓名" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="gender" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>性别*</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="选择性别" /></SelectTrigger></FormControl>
                                            <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="subject" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>科目*</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="选择科目" /></SelectTrigger></FormControl>
                                            <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="grade" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>年级*</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="选择年级" /></SelectTrigger></FormControl>
                                            <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="region" render={({ field }) => (
                                    <FormItem><FormLabel>地区*</FormLabel><FormControl><Input placeholder="省市区" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="school" render={({ field }) => (
                                    <FormItem><FormLabel>学校名称</FormLabel><FormControl><Input placeholder="就读学校" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Academic Info */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-sm font-medium text-muted-foreground">学习成绩信息</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField control={form.control} name="lastExamScore" render={({ field }) => (
                                    <FormItem><FormLabel>最近成绩</FormLabel><FormControl><Input placeholder="分数" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="examMaxScore" render={({ field }) => (
                                    <FormItem><FormLabel>卷面满分</FormLabel><FormControl><Input placeholder="满分" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="textbookVersion" render={({ field }) => (
                                    <FormItem><FormLabel>教材版本</FormLabel><FormControl><Input placeholder="版本" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>

                         {/* Parent Info */}
                         <div className="space-y-4 border-t pt-4">
                            <h3 className="text-sm font-medium text-muted-foreground">家长联系信息</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="parentPhone" render={({ field }) => (
                                    <FormItem><FormLabel>家长手机号*</FormLabel><FormControl><Input placeholder="11位手机号" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Scheduling Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>二、排课信息</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Course Arrangement */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground">课时安排</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name="totalHours" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>总课时* (1-1000)</FormLabel>
                                        <FormControl><Input type="number" min={1} max={1000} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </div>

                        {/* Weekly Schedule */}
                        <div className="space-y-4 border-t pt-4">
                            <h3 className="text-sm font-medium text-muted-foreground">上课时间安排</h3>
                            <div className="space-y-3">
                                {WEEKDAYS.map(day => {
                                    const scheduleItem = weeklySchedule.find(s => s.day === day.value)
                                    const isSelected = !!scheduleItem

                                    return (
                                        <div key={day.value} className={cn("flex items-center gap-4 p-3 rounded-lg border", isSelected ? "bg-accent/10 border-accent" : "border-border")}>
                                            <div className="flex items-center gap-2 w-24">
                                            <Checkbox 
                                                checked={isSelected} 
                                                onCheckedChange={() => toggleDay(day.value)}
                                            />
                                                <span className="text-sm font-medium">{day.label}</span>
                                            </div>
                                            
                                            {isSelected ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Select value={scheduleItem.startTime} onValueChange={(v) => updateScheduleTime(day.value, 'startTime', v)}>
                                                        <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {TIME_OPTIONS.map(t => <SelectItem key={`start-${t}`} value={t}>{t}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <span className="text-muted-foreground">-</span>
                                                    <Select value={scheduleItem.endTime} onValueChange={(v) => updateScheduleTime(day.value, 'endTime', v)}>
                                                        <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {TIME_OPTIONS.map(t => <SelectItem key={`end-${t}`} value={t}>{t}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    {scheduleItem.startTime && scheduleItem.endTime && scheduleItem.startTime >= scheduleItem.endTime && (
                                                        <span className="text-xs text-destructive">结束时间需晚于开始时间</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-sm text-muted-foreground">未安排</div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* First Class Time */}
                         <div className="space-y-4 border-t pt-4">
                            <h3 className="text-sm font-medium text-muted-foreground">首次课时间 (可选)</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <FormField control={form.control} name="firstClassDate" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>日期</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        {field.value ? format(field.value, "yyyy-MM-dd") : <span>选择日期</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date()} initialFocus />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="firstClassStartTime" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>开始时间</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="开始" /></SelectTrigger></FormControl>
                                            <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={`f-start-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="firstClassEndTime" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>结束时间</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="结束" /></SelectTrigger></FormControl>
                                            <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={`f-end-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            {form.formState.errors.firstClassEndTime && (
                                <p className="text-sm font-medium text-destructive">{form.formState.errors.firstClassEndTime.message}</p>
                            )}
                        </div>

                        {/* Remarks */}
                        <div className="space-y-4 border-t pt-4">
                            <FormField control={form.control} name="remarks" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>备注</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="记录学生的特殊情况、学习需求或其他需要注意的事项"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        提交订单
                    </Button>
                </div>
                </form>
            </Form>
        </div>

        {/* 3. Cost Calculation (Sidebar) */}
        <div className="space-y-6">
            <Card className="sticky top-6">
                <CardHeader>
                    <CardTitle>费用计算规则</CardTitle>
                    <CardDescription>根据年级和课时数自动计算</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-muted-foreground">当前年级</span>
                        <span className="font-medium">{selectedGrade || "-"}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-muted-foreground">课时单价</span>
                        <span className="font-medium">
                            {pricePerHour > 0 ? `¥${pricePerHour}/课时` : "-"}
                        </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b">
                        <span className="text-muted-foreground">总课时数</span>
                        <span className="font-medium">{totalHours}</span>
                    </div>
                    <div className="pt-2 flex justify-between items-center">
                        <span className="font-bold text-lg">总费用</span>
                        <span className="font-bold text-2xl text-primary">
                            ¥{totalCost.toLocaleString()}
                        </span>
                    </div>
                </CardContent>
                <CardFooter className="bg-muted/50 p-4 text-xs text-muted-foreground">
                    <div className="space-y-1 w-full">
                        <p className="font-semibold">价格参考表：</p>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span>四年级/五年级: ¥150</span>
                            <span>六年级: ¥180</span>
                            <span>初一: ¥200</span>
                            <span>初二: ¥220</span>
                            <span>初三: ¥250</span>
                            <span>高一: ¥280</span>
                            <span>高二: ¥300</span>
                            <span>高三: ¥320</span>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
      </div>
    </div>
  )
}

import { StudentSelector } from "@/components/StudentSelector"

export default function CreateRegularCoursePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <CreateRegularCourseForm />
    </Suspense>
  )
}
