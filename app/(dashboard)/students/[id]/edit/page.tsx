"use client"

import { useRouter, useParams } from "next/navigation"
import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Loader2, Save, Plus, Trash2, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { STUDENTS_MOCK } from "@/lib/mock-data"

const GRADES = ["四年级", "五年级", "六年级", "初一", "初二", "初三", "高一", "高二", "高三"] as const
const GENDERS = ["男", "女"] as const
const SUBJECTS = ["数学", "物理", "英语", "化学", "生物", "语文", "历史", "地理", "政治"] as const

const studentFormSchema = z.object({
  // Basic Info
  name: z.string().min(1, "请输入学生姓名"),
  gender: z.enum(GENDERS, { message: "请选择性别" }),
  grade: z.enum(GRADES, { message: "请选择年级" }),
  school: z.string().optional(),
  region: z.string().min(1, "请输入所在地区"),
  
  // Contact Info
  parentName: z.string().optional(),
  parentPhone: z.string().regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  parentRelation: z.string().optional(),
  wechat: z.string().optional(),

  // Academic Info
  academicRecords: z.array(z.object({
    subject: z.string().min(1, "请选择科目"),
    studentAccount: z.string().optional(),
    currentScore: z.string().optional(),
    fullScore: z.string().optional(),
    textbookVersion: z.string().optional(),
  })).optional(),
  learningStatus: z.string().optional(), // Textarea

  // System Info
  campusName: z.string().optional(),
  salesRep: z.string().optional(), // Sales representative
  source: z.string().optional(), // Lead source
})

type StudentFormValues = z.infer<typeof studentFormSchema>

export default function EditStudentPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const student = STUDENTS_MOCK.find(s => s.id === id)

  // Memoize default values to avoid re-renders if student changes (it won't here but good practice)
  const defaultValues: Partial<StudentFormValues> = React.useMemo(() => {
    if (!student) return {}
    return {
        name: student.name,
        gender: student.gender as any,
        grade: student.grade as any,
        school: student.school,
        region: student.region,
        parentName: student.parentName,
        parentPhone: student.parentPhone,
        parentRelation: student.parentRelation,
        wechat: "", // Mock data doesn't have wechat
        academicRecords: student.academicRecords && student.academicRecords.length > 0 
          ? student.academicRecords 
          : student.subject 
            ? [{ subject: student.subject, studentAccount: student.studentAccount || "", currentScore: "", fullScore: "", textbookVersion: "" }] 
            : [],
        learningStatus: "",
        campusName: student.campusName,
        salesRep: student.campusAccount,
        source: "",
    }
  }, [student])

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: defaultValues,
  })

  // Reset form when student data loads (if it was async) or if we need to force update
  React.useEffect(() => {
    if (student) {
        form.reset(defaultValues)
    }
  }, [student, defaultValues, form])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "academicRecords",
  })

  React.useEffect(() => {
    if (fields.length === 0) {
      append({ subject: "", studentAccount: "", currentScore: "", fullScore: "", textbookVersion: "" })
    }
  }, [fields.length, append])

  const onSubmit = async (data: StudentFormValues) => {
    setIsSubmitting(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    console.log("Update Student:", data)
    toast.success("学生档案更新成功！")
    router.push(`/students/${id}`)
    setIsSubmitting(false)
  }

  if (!student) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
            <h2 className="text-xl font-semibold">未找到学生档案</h2>
            <Button variant="outline" onClick={() => router.back()}>返回列表</Button>
        </div>
      )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
             <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
            <h2 className="text-3xl font-bold tracking-tight">编辑学生档案</h2>
            <p className="text-muted-foreground mt-2">修改学生 {student.name} 的档案信息</p>
            </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* 1. Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>学生的基础身份信息</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="region"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所在地区*</FormLabel>
                    <FormControl>
                      <Input placeholder="省市区" {...field} />
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
                    <FormLabel>就读学校</FormLabel>
                    <FormControl>
                      <Input placeholder="学校名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 2. Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>联系方式</CardTitle>
              <CardDescription>家长及学生的联系渠道</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="parentPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>家长手机号*</FormLabel>
                    <FormControl>
                      <Input placeholder="11位手机号" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>家长称呼</FormLabel>
                    <FormControl>
                      <Input placeholder="如：张先生、李女士" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentRelation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>亲属关系</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="选择关系" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="father">父亲</SelectItem>
                            <SelectItem value="mother">母亲</SelectItem>
                            <SelectItem value="grandparent">祖父母/外祖父母</SelectItem>
                            <SelectItem value="other">其他</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="wechat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>微信号</FormLabel>
                    <FormControl>
                      <Input placeholder="家长或学生微信号" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 3. Academic Background */}
          <Card>
            <CardHeader>
              <CardTitle>学情信息</CardTitle>
              <CardDescription>学生的学习情况和辅导需求</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <FormLabel className="text-base font-semibold">学科情况</FormLabel>
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => append({ subject: "", currentScore: "", textbookVersion: "" })}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        添加学科
                    </Button>
                </div>
                
                {fields.map((field, index) => (
                    <div key={field.id} className="grid gap-4 md:grid-cols-12 items-start p-4 border rounded-lg bg-slate-50/50 dark:bg-slate-900/50 relative">
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name={`academicRecords.${index}.subject`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">意向科目</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="h-9">
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
                        </div>
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name={`academicRecords.${index}.studentAccount`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">学生账号</FormLabel>
                                    <FormControl>
                                    <Input placeholder="如：stu_001" className="h-9" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name={`academicRecords.${index}.currentScore`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">近期成绩</FormLabel>
                                    <FormControl>
                                    <Input placeholder="分数" className="h-9" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <div className="md:col-span-2">
                            <FormField
                                control={form.control}
                                name={`academicRecords.${index}.fullScore`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">卷面满分</FormLabel>
                                    <FormControl>
                                    <Input placeholder="如：100" className="h-9" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <div className="md:col-span-3">
                            <FormField
                                control={form.control}
                                name={`academicRecords.${index}.textbookVersion`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs">教材版本</FormLabel>
                                    <FormControl>
                                    <Input placeholder="如：人教版" className="h-9" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                        <div className="md:col-span-1 flex justify-end pt-8">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive/90 h-9 w-9"
                                onClick={() => remove(index)}
                                disabled={fields.length === 1}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
              </div>

              <Separator />
              
  

              <FormField
                control={form.control}
                name="learningStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>学习情况备注</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="描述学生的学习习惯、薄弱知识点、性格特点等..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 4. System Info (Administrative) */}
          <Card>
            <CardHeader>
              <CardTitle>校区归属</CardTitle>
              <CardDescription>9800校区</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
               <FormField
                control={form.control}
                name="campusName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>校区名称</FormLabel>
                    <FormControl>
                      <Input placeholder="输入校区名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
             
              <FormField
                control={form.control}
                name="salesRep"
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
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              保存更新
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
