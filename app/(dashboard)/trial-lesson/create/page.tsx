"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, Loader2, Check, ChevronsUpDown } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { toast } from "sonner"

// --- Constants & Types ---

const SUBJECTS = ["数学", "物理", "英语", "化学", "语文", "生物", "历史", "地理", "政治"] as const
const GRADES = ["四年级", "五年级", "六年级", "初一", "初二", "初三", "高一", "高二", "高三"] as const
const GENDERS = ["男", "女"] as const

const PRICING: Record<string, number> = {
  "四年级": 100, "五年级": 100,
  "六年级": 100,
  "初一": 150,
  "初二": 150,
  "初三": 200,
  "高一": 200,
  "高二": 250,
  "高三": 280,
}

// Mock Teachers Data
const MOCK_TEACHERS = [
  { 
    id: "t1", 
    name: "张老师", 
    subject: "数学", 
    grades: ["四年级", "五年级", "六年级", "初一", "初二"], 
    slots: ["2024-02-10 10:00", "2024-02-10 14:00", "2024-02-11 09:00", "2024-02-11 15:00"] 
  },
  { 
    id: "t2", 
    name: "李老师", 
    subject: "数学", 
    grades: ["初一", "初二", "初三", "高一", "高二"], 
    slots: ["2024-02-11 19:00", "2024-02-12 20:00", "2024-02-13 18:30", "2024-02-14 19:00"] 
  },
  { 
    id: "t3", 
    name: "王老师", 
    subject: "英语", 
    grades: ["初一", "初二", "初三", "高一"], 
    slots: ["2024-02-10 16:00", "2024-02-12 10:00", "2024-02-14 14:00"] 
  },
  { 
    id: "t4", 
    name: "赵老师", 
    subject: "物理", 
    grades: ["初二", "初三", "高一", "高二"], 
    slots: ["2024-02-13 18:00", "2024-02-15 19:30", "2024-02-16 20:00"] 
  },
  { 
    id: "t5", 
    name: "刘老师", 
    subject: "语文", 
    grades: ["四年级", "五年级", "六年级", "初一"], 
    slots: ["2024-02-10 09:00", "2024-02-11 10:30", "2024-02-12 14:00"] 
  },
  { 
    id: "t6", 
    name: "陈老师", 
    subject: "化学", 
    grades: ["初三", "高一", "高二"], 
    slots: ["2024-02-13 19:00", "2024-02-15 20:00"] 
  },
  { 
    id: "t7", 
    name: "杨老师", 
    subject: "英语", 
    grades: ["高一", "高二", "高三"], 
    slots: ["2024-02-11 16:00", "2024-02-13 18:00", "2024-02-14 20:00"] 
  },
  { 
    id: "t8", 
    name: "孙老师", 
    subject: "数学", 
    grades: ["高一", "高二", "高三"], 
    slots: ["2024-02-12 18:00", "2024-02-14 19:00", "2024-02-16 10:00"] 
  },
  { 
    id: "t9", 
    name: "周老师", 
    subject: "物理", 
    grades: ["高二", "高三"], 
    slots: ["2024-02-15 18:00", "2024-02-17 14:00"] 
  },
  { 
    id: "t10", 
    name: "吴老师", 
    subject: "生物", 
    grades: ["初一", "初二", "初三", "高一"], 
    slots: ["2024-02-11 13:00", "2024-02-13 15:00"] 
  },
]

// --- Schemas ---

const studentInfoSchema = z.object({
  studentName: z.string().min(1, "请输入学生姓名"),
  gender: z.enum(GENDERS, { message: "请选择性别" }),
  region: z.string().min(1, "请输入地区"),
  school: z.string().optional(),
  
  // Learning Status
  lastExamScore: z.string().optional(),
  examMaxScore: z.string().optional(),
  otherSubjectsAvg: z.string().optional(),
  textbookVersion: z.string().optional(),
  schoolProgress: z.string().optional(),
  tutoringHistory: z.string().optional(),
  
  // Contact
  parentPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  
  // Campus
  campusName: z.string().optional(),
  campusAccount: z.string().optional(),
})

// Mode 1: By Teacher
// Step 1: Select Subject/Grade -> Teacher/Time
const teacherSelectionSchema = z.object({
  subject: z.enum(SUBJECTS, { message: "请选择科目" }),
  grade: z.enum(GRADES, { message: "请选择年级" }),
  teacherId: z.string({ message: "请选择老师" }),
  timeSlot: z.string({ message: "请选择时间段" }),
})

const mode1Schema = teacherSelectionSchema.merge(studentInfoSchema)

// Mode 2: By Student
const mode2Schema = studentInfoSchema.extend({
  subject: z.enum(SUBJECTS, { message: "请选择科目" }),
  grade: z.enum(GRADES, { message: "请选择年级" }),
  trialTime1: z.date({ message: "请选择第一个试课时间" }),
  trialTime2: z.date().optional(),
  trialTime3: z.date().optional(),
})

type Mode1FormValues = z.infer<typeof mode1Schema>
type Mode2FormValues = z.infer<typeof mode2Schema>

// --- Components ---

export default function CreateTrialLessonPage() {
  const [activeTab, setActiveTab] = React.useState("by-teacher")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">创建试课单</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="by-teacher">方式一：按老师时间约课</TabsTrigger>
          <TabsTrigger value="by-student">方式二：按学生时间约课</TabsTrigger>
        </TabsList>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-5">
            <TabsContent value="by-teacher">
              <ByTeacherForm />
            </TabsContent>
            <TabsContent value="by-student">
              <ByStudentForm />
            </TabsContent>
          </div>
          
          <div className="lg:col-span-2 space-y-4">
             <Card>
                <CardHeader>
                    <CardTitle>试课费用说明</CardTitle>
                    <CardDescription>试课固定为1课时（约1小时）</CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                        <span>四年级、五年级</span>
                        <span className="font-semibold">¥100</span>
                    </div>
                    <div className="flex justify-between">
                        <span>六年级</span>
                        <span className="font-semibold">¥120</span>
                    </div>
                    <div className="flex justify-between">
                        <span>初一</span>
                        <span className="font-semibold">¥150</span>
                    </div>
                    <div className="flex justify-between">
                        <span>初二</span>
                        <span className="font-semibold">¥180</span>
                    </div>
                    <div className="flex justify-between">
                        <span>初三</span>
                        <span className="font-semibold">¥200</span>
                    </div>
                    <div className="flex justify-between">
                        <span>高一</span>
                        <span className="font-semibold">¥220</span>
                    </div>
                    <div className="flex justify-between">
                        <span>高二</span>
                        <span className="font-semibold">¥250</span>
                    </div>
                    <div className="flex justify-between">
                        <span>高三</span>
                        <span className="font-semibold">¥280</span>
                    </div>
                </CardContent>
             </Card>
             
             <Card>
                 <CardHeader>
                     <CardTitle>方式说明</CardTitle>
                 </CardHeader>
                 <CardContent className="text-sm space-y-4">
                     <div>
                         <p className="font-semibold mb-1">方式一（按老师时间约课）</p>
                         <p className="text-muted-foreground">先选择可用的老师和时间段，再填写学生信息，适合时间灵活的家长。</p>
                     </div>
                     <div>
                         <p className="font-semibold mb-1">方式二（按学生时间约课）</p>
                         <p className="text-muted-foreground">直接填写学生信息和期望的试课时间，由系统后续安排老师，适合时间固定的家长。</p>
                     </div>
                 </CardContent>
             </Card>
          </div>
        </div>
      </Tabs>
    </div>
  )
}

import { StudentSelector } from "@/components/StudentSelector"

function ByTeacherForm() {
  const router = useRouter()
  const [step, setStep] = React.useState(1)
  const [matchingTeachers, setMatchingTeachers] = React.useState<typeof MOCK_TEACHERS>([])
  
  const form = useForm<Mode1FormValues>({
    resolver: zodResolver(mode1Schema),
    defaultValues: {
        subject: undefined,
        grade: undefined,
        teacherId: "",
        timeSlot: "",
        studentName: "",
        gender: "男",
        region: "",
        parentPhone: "",
        school: "",
        lastExamScore: "",
        examMaxScore: "",
        otherSubjectsAvg: "",
        textbookVersion: "",
        schoolProgress: "",
        tutoringHistory: "",
        campusName: "",
        campusAccount: "",
    },
    mode: "onChange"
  })

  const { watch, setValue, trigger } = form

  const handleStudentSelect = (student: any) => {
    setValue("studentName", student.name)
    setValue("parentPhone", student.parentPhone)
    // Cast to any to bypass strict type checking for initial load
    if (student.gender && GENDERS.includes(student.gender as any)) setValue("gender", student.gender as any)
    if (student.region) setValue("region", student.region)
    if (student.school) setValue("school", student.school)
    
    // We don't automatically set subject/grade in "By Teacher" mode as user selects them first
    // But we could potentially suggest them if step 1 wasn't completed, but here step 1 is teacher selection
  }
  const selectedSubject = watch("subject")
  const selectedGrade = watch("grade")
  const selectedTeacherId = watch("teacherId")
  const selectedGradePrice = selectedGrade ? PRICING[selectedGrade] : 0

  // Filter teachers when Subject/Grade changes
  React.useEffect(() => {
    if (selectedSubject && selectedGrade) {
        const teachers = MOCK_TEACHERS.filter(t => 
            t.subject === selectedSubject && 
            t.grades.includes(selectedGrade)
        )
        setMatchingTeachers(teachers)
        // Reset selection if current selection is invalid
        const currentTeacher = MOCK_TEACHERS.find(t => t.id === selectedTeacherId)
        if (currentTeacher && (currentTeacher.subject !== selectedSubject || !currentTeacher.grades.includes(selectedGrade))) {
            setValue("teacherId", "")
            setValue("timeSlot", "")
        }
    } else {
        setMatchingTeachers([])
    }
  }, [selectedSubject, selectedGrade, selectedTeacherId, setValue])

  const handleNextStep = async () => {
    const isValid = await trigger(["subject", "grade", "teacherId", "timeSlot"])
    if (isValid) {
      setStep(2)
    }
  }

  const onSubmit = (data: Mode1FormValues) => {
    console.log("Submit Mode 1:", data)
    // Calculate price
    const price = data.grade ? PRICING[data.grade] : 0
    const queryParams = new URLSearchParams({
        studentName: data.studentName,
        subject: data.subject,
        grade: data.grade,
        price: price.toString(),
    }).toString()
    
    router.push(`/trial-lesson/payment?${queryParams}`)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{step === 1 ? "第一步：选择老师和时间" : "第二步：填写孩子信息"}</CardTitle>
        <CardDescription>
            {step === 1 ? "根据科目和年级筛选可用老师" : "完善学生基本信息及学习情况"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className={cn("space-y-6", step !== 1 && "hidden")}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>科目*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="选择科目" />
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
                        <FormLabel>年级*</FormLabel>
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
                        <FormDescription>
                            {field.value && PRICING[field.value] ? `当前费用：¥${PRICING[field.value]}/课时` : "选择年级以查看费用"}
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <div className="space-y-4">
                    <FormLabel className={cn((!selectedSubject || !selectedGrade) && "text-muted-foreground")}>
                        试课老师和时间*
                    </FormLabel>
                    
                    {selectedSubject && selectedGrade ? (
                        matchingTeachers.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4">
                                {matchingTeachers.map(teacher => (
                                    <div key={teacher.id} className="border rounded-lg p-4 space-y-3">
                                        <div className="font-medium flex items-center gap-2">
                                            <span>{teacher.name}</span>
                                            <span className="text-xs bg-secondary px-2 py-0.5 rounded text-secondary-foreground">{teacher.subject}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {teacher.slots.map(slot => (
                                                <Button
                                                    key={slot}
                                                    type="button"
                                                    variant={watch("teacherId") === teacher.id && watch("timeSlot") === slot ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => {
                                                        setValue("teacherId", teacher.id)
                                                        setValue("timeSlot", slot)
                                                    }}
                                                >
                                                    {slot}
                                                </Button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                                暂无符合条件的老师
                            </div>
                        )
                    ) : (
                        <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg text-center">
                            请先选择科目和年级
                        </div>
                    )}
                    <input type="hidden" {...form.register("teacherId")} />
                    <input type="hidden" {...form.register("timeSlot")} />
                    {(form.formState.errors.teacherId || form.formState.errors.timeSlot) && (
                         <p className="text-sm font-medium text-destructive">请选择老师和时间段</p>
                    )}
                </div>
            </div>

            <div className={cn("space-y-6", step !== 2 && "hidden")}>
                <StudentInfoFields form={form} />
            </div>

            <div className="flex justify-between pt-4">
                {step === 2 && (
                    <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        上一步
                    </Button>
                )}
                {step === 1 ? (
                    <Button type="button" onClick={handleNextStep} className="ml-auto">
                        下一步：填写孩子信息
                    </Button>
                ) : (
                    <Button type="submit" className="ml-auto">
                        创建试课单
                    </Button>
                )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function ByStudentForm() {
  const router = useRouter()
  const form = useForm<Mode2FormValues>({
    resolver: zodResolver(mode2Schema),
    defaultValues: {
        gender: "男",
        studentName: "",
        region: "",
        parentPhone: "",
        school: "",
        lastExamScore: "",
        examMaxScore: "",
        otherSubjectsAvg: "",
        textbookVersion: "",
        schoolProgress: "",
        tutoringHistory: "",
        campusName: "",
        campusAccount: "",
        subject: undefined,
        grade: undefined,
    }
  })

  const onSubmit = (data: Mode2FormValues) => {
    console.log("Submit Mode 2:", data)
    // Calculate price
    const price = data.grade ? PRICING[data.grade] : 0
    const queryParams = new URLSearchParams({
        studentName: data.studentName,
        subject: data.subject,
        grade: data.grade,
        price: price.toString(),
    }).toString()
    
    router.push(`/trial-lesson/payment?${queryParams}`)
  }

  const selectedGrade = form.watch("grade")

  return (
    <Card>
      <CardHeader>
        <CardTitle>填写预约信息</CardTitle>
        <CardDescription>
            填写学生信息及期望时间，系统将为您匹配老师
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="space-y-6">
                <h3 className="text-lg font-medium">基本信息</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <StudentInfoFields form={form} showSubjectGrade={true} />
                </div>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">试课时间</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                    control={form.control}
                    name="trialTime1"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>试课时间1*</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP HH:mm")
                                ) : (
                                    <span>选择日期时间</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date < new Date()
                                }
                                initialFocus
                            />
                            <div className="p-3 border-t">
                                <Input 
                                    type="time" 
                                    className="w-full"
                                    onChange={(e) => {
                                        const date = field.value || new Date()
                                        const [hours, minutes] = e.target.value.split(':')
                                        date.setHours(parseInt(hours), parseInt(minutes))
                                        field.onChange(date)
                                    }}
                                />
                            </div>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    
                     <FormField
                    control={form.control}
                    name="trialTime2"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>试课时间2 (可选)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP HH:mm")
                                ) : (
                                    <span>选择日期时间</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date < new Date()
                                }
                                initialFocus
                            />
                            <div className="p-3 border-t">
                                <Input 
                                    type="time" 
                                    className="w-full"
                                    onChange={(e) => {
                                        const date = field.value || new Date()
                                        const [hours, minutes] = e.target.value.split(':')
                                        date.setHours(parseInt(hours), parseInt(minutes))
                                        field.onChange(date)
                                    }}
                                />
                            </div>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="trialTime3"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>试课时间3 (可选)</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                {field.value ? (
                                    format(field.value, "PPP HH:mm")
                                ) : (
                                    <span>选择日期时间</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date < new Date()
                                }
                                initialFocus
                            />
                            <div className="p-3 border-t">
                                <Input 
                                    type="time" 
                                    className="w-full"
                                    onChange={(e) => {
                                        const date = field.value || new Date()
                                        const [hours, minutes] = e.target.value.split(':')
                                        date.setHours(parseInt(hours), parseInt(minutes))
                                        field.onChange(date)
                                    }}
                                />
                            </div>
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
            </div>

            <Button type="submit" className="w-full">创建试课单</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

function StudentInfoFields({ form, showSubjectGrade = false, onStudentSelect }: { form: any, showSubjectGrade?: boolean, onStudentSelect?: (student: any) => void }) {
    return (
        <div className="grid gap-6">
            <div className="flex justify-end">
                <StudentSelector onSelect={(student) => {
                    // Update form fields
                    form.setValue("studentName", student.name)
                    form.setValue("parentPhone", student.parentPhone)
                    if (student.gender) form.setValue("gender", student.gender)
                    if (student.region) form.setValue("region", student.region)
                    if (student.school) form.setValue("school", student.school)
                    
                    if (showSubjectGrade) {
                        if (student.subject) form.setValue("subject", student.subject)
                        if (student.grade) form.setValue("grade", student.grade)
                    }
                    
                    if (onStudentSelect) onStudentSelect(student)
                }} />
            </div>
            {showSubjectGrade && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>科目*</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="选择科目" />
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
                            <FormLabel>年级*</FormLabel>
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
                            <FormDescription>
                                {field.value && PRICING[field.value] ? `当前费用：¥${PRICING[field.value]}/课时` : "选择年级以查看费用"}
                            </FormDescription>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="studentName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>学生姓名*</FormLabel>
                        <FormControl>
                            <Input placeholder="真实姓名" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>性别*</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="选择性别" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                            {GENDERS.map((g) => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                            ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="region"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>地区*</FormLabel>
                        <FormControl>
                            <Input placeholder="学生所在地区" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="school"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>学校名称</FormLabel>
                        <FormControl>
                            <Input placeholder="就读学校" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-4 text-muted-foreground">学习情况</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="lastExamScore"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>最近一次考试成绩</FormLabel>
                            <FormControl>
                                <Input placeholder="分数" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="examMaxScore"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>卷面满分</FormLabel>
                            <FormControl>
                                <Input placeholder="如100、150" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="otherSubjectsAvg"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>其他科平均成绩</FormLabel>
                            <FormControl>
                                <Input placeholder="平均分" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="textbookVersion"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>教材版本</FormLabel>
                            <FormControl>
                                <Input placeholder="如人教版、北师大版" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="schoolProgress"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>校内学习进度</FormLabel>
                            <FormControl>
                                <Input placeholder="正在学习哪一章节" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="tutoringHistory"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>补过什么类型的课</FormLabel>
                            <FormControl>
                                <Input placeholder="之前的补课经历" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
            </div>

            <div className="border-t pt-4">
                 <h3 className="text-sm font-medium mb-4 text-muted-foreground">联系与校区信息</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="parentPhone"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>家长手机号*</FormLabel>
                            <FormControl>
                                <Input placeholder="联系电话" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                        control={form.control}
                        name="campusName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>校区名称</FormLabel>
                            <FormControl>
                                <Input placeholder="9800校区名称" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="campusAccount"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>校区账号</FormLabel>
                            <FormControl>
                                <Input placeholder="9800校区账号" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>
            </div>
        </div>
    )
}
