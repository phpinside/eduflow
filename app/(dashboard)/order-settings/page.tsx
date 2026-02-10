"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getStoredSubjects } from "@/lib/storage"

const GRADES = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级", "高一", "高二", "高三"] as const
const COURSE_TYPES = ["试课", "正课"] as const

const formSchema = z.object({
  isTakingOrders: z.boolean(),
  subjects: z.array(z.string()).refine((value) => value.length > 0, {
    message: "请至少选择一个科目",
  }),
  grades: z.array(z.string()).refine((value) => value.length > 0, {
    message: "请至少选择一个年级",
  }),
  courseTypes: z.array(z.string()).refine((value) => value.length > 0, {
    message: "请至少选择一个课程类型",
  }),
})

export default function OrderSettingsPage() {
  const [subjects, setSubjects] = useState<string[]>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      isTakingOrders: true,
      subjects: [],
      grades: ["七年级"],
      courseTypes: ["试课", "正课"],
    },
  })

  // 加载科目数据
  useEffect(() => {
    const storedSubjects = getStoredSubjects()
    const enabledSubjects = storedSubjects
      .filter(s => s.enabled)
      .map(s => s.name)
    setSubjects(enabledSubjects)
    
    // 设置默认科目（如果有数学就选中数学）
    if (enabledSubjects.includes("数学")) {
      form.setValue("subjects", ["数学"])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function onSubmit(data: z.infer<typeof formSchema>) {
    toast.success("接单设置已保存", {
      description: "您的接单偏好已更新。",
    })
    console.log(data)
  }

  return (
    <div className="container max-w-2xl py-10 mx-auto">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">接单设置</h1>
        <p className="text-muted-foreground">
          管理您的接单状态和偏好设置，以便系统为您匹配合适的订单。
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <Card>
            <CardHeader>
              <CardTitle>接单开关</CardTitle>
              <CardDescription>
                开启后，系统将根据您的偏好为您推送订单。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isTakingOrders"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(val) => field.onChange(val === "true")}
                        defaultValue={field.value ? "true" : "false"}
                        className="flex flex-row space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="true" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            开启接单
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="false" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            暂停接单
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>科目偏好</CardTitle>
              <CardDescription>选择您擅长和希望教授的科目（多选）。</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="subjects"
                render={() => (
                  <FormItem>
                    {subjects.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4">
                        暂无可用科目，请先在科目配置页面添加科目。
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {subjects.map((item) => (
                          <FormField
                            key={item}
                            control={form.control}
                            name="subjects"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={item}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(item)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, item])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== item
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal cursor-pointer">
                                    {item}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                    )}
                     {form.formState.errors.subjects && (
                        <p className="text-sm font-medium text-destructive mt-2">
                          {form.formState.errors.subjects.message}
                        </p>
                      )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>年级偏好</CardTitle>
              <CardDescription>选择您希望教授的学生年级段（多选）。</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="grades"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-3 gap-4">
                      {GRADES.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="grades"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                     {form.formState.errors.grades && (
                        <p className="text-sm font-medium text-destructive mt-2">
                          {form.formState.errors.grades.message}
                        </p>
                      )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

           <Card>
            <CardHeader>
              <CardTitle>课程类型</CardTitle>
              <CardDescription>选择您接受的课程类型（多选）。</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="courseTypes"
                render={() => (
                  <FormItem>
                    <div className="flex flex-row gap-6">
                      {COURSE_TYPES.map((item) => (
                        <FormField
                          key={item}
                          control={form.control}
                          name="courseTypes"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={item}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(item)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, item])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== item
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {item}
                                </FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                     {form.formState.errors.courseTypes && (
                        <p className="text-sm font-medium text-destructive mt-2">
                          {form.formState.errors.courseTypes.message}
                        </p>
                      )}
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" size="lg">保存设置</Button>
        </form>
      </Form>
    </div>
  )
}
