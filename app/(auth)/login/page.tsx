"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import type { MutableRefObject } from "react"
import { useMemo, useRef, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { ImageCaptcha } from "@/components/auth/image-captcha"

function createLoginSchema(expectedCaptchaRef: MutableRefObject<string>) {
  return z
    .object({
      phone: z.string().min(11, { message: "请输入有效的11位手机号码" }).max(11, { message: "请输入有效的11位手机号码" }),
      password: z.string().min(6, { message: "密码至少需要6位" }),
      captcha: z.string().min(1, { message: "请输入验证码" }),
    })
    .refine(
      (data) => data.captcha.trim().toLowerCase() === expectedCaptchaRef.current.toLowerCase(),
      { message: "验证码错误，请重新输入", path: ["captcha"] }
    )
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [captchaTick, setCaptchaTick] = useState(0)
  const captchaAnswerRef = useRef("")
  const formSchema = useMemo(() => createLoginSchema(captchaAnswerRef), [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      phone: "",
      password: "",
      captcha: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      // Mock password check - in real app this goes to backend
      if (values.password !== '123456') {
        toast.error("账号或密码错误 (Mock密码: 123456)")
        setCaptchaTick((t) => t + 1)
        setIsLoading(false)
        return
      }

      const success = await login(values.phone)
      if (success) {
        toast.success("登录成功")
        router.push("/")
      } else {
        toast.error("用户不存在，请检查手机号")
        setCaptchaTick((t) => t + 1)
      }
    } catch (error) {
      setCaptchaTick((t) => t + 1)
      if (error instanceof Error) {
        toast.error(error.message)
      } else {
        toast.error("登录发生错误")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const bumpCaptcha = () => setCaptchaTick((t) => t + 1)

  const fillMockData = (role: string) => {
    let phone = ""
    switch(role) {
      case 'sales': phone = '13800001001'; break;
      case 'tutor': phone = '13800002001'; break;
      case 'manager': phone = '13800003001'; break;
      case 'operator': phone = '13800004001'; break;
      case 'admin': phone = '13800005001'; break;
    }
    form.setValue("phone", phone)
    form.setValue("password", "123456")
    bumpCaptcha()
    form.setValue("captcha", "")
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-primary">EduFlow</CardTitle>
          <CardDescription className="text-center">
            教学服务管理系统 - 原型演示
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>手机号码</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入手机号" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="请输入密码" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="captcha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>验证码</FormLabel>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                      <FormControl>
                        <Input placeholder="请输入右侧字符" className="sm:max-w-[160px]" autoComplete="off" {...field} />
                      </FormControl>
                      <ImageCaptcha
                        key={captchaTick}
                        onCodeReady={(code) => {
                          captchaAnswerRef.current = code
                        }}
                        onRefresh={() => form.setValue("captcha", "")}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                登录
              </Button>
            </form>
          </Form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-900 px-2 text-muted-foreground">
                  快速填充 (Mock)
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
              <Button variant="outline" size="sm" onClick={() => fillMockData('sales')}>招生老师</Button>
              <Button variant="outline" size="sm" onClick={() => fillMockData('tutor')}>伴学教练</Button>
              <Button variant="outline" size="sm" onClick={() => fillMockData('manager')}>学管</Button>
              <Button variant="outline" size="sm" onClick={() => fillMockData('operator')}>运营人员</Button>
              <Button variant="outline" size="sm" onClick={() => fillMockData('admin')}>管理员</Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-2">
          <div className="text-sm text-muted-foreground">
            还没有账号？{" "}
            <Link href="/register" className="text-primary hover:underline font-medium">
              立即注册
            </Link>
          </div>
          <div className="text-xs text-muted-foreground">© 2024 EduFlow Prototype</div>
        </CardFooter>
      </Card>
    </div>
  )
}
