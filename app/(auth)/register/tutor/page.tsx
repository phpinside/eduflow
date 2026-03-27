"use client"

import type { MutableRefObject } from "react"
import { useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Upload, X, CheckCircle2, ChevronLeft } from "lucide-react"
import { Role, UserStatus } from "@/types"
import { cn } from "@/lib/utils"
import { getStoredUsers, saveMockData, STORAGE_KEYS } from "@/lib/storage"
import { ImageCaptcha } from "@/components/auth/image-captcha"

function createTutorRegisterSchema(expectedCaptchaRef: MutableRefObject<string>) {
  return z
    .object({
      name: z.string().min(2, { message: "姓名至少需要2个字符" }),
      phone: z.string().length(11, { message: "请输入有效的11位手机号码" }),
      password: z.string().min(6, { message: "密码至少需要6位" }),
      confirmPassword: z.string(),
      wechatQrCode: z.string().min(1, { message: "请上传个人微信二维码" }),
      captcha: z.string().min(1, { message: "请输入验证码" }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "两次输入的密码不一致",
      path: ["confirmPassword"],
    })
    .refine(
      (data) => data.captcha.trim().toLowerCase() === expectedCaptchaRef.current.toLowerCase(),
      { message: "验证码错误，请重新输入", path: ["captcha"] }
    )
}

export default function TutorRegisterPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [captchaTick, setCaptchaTick] = useState(0)
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const captchaAnswerRef = useRef("")
  const formSchema = useMemo(() => createTutorRegisterSchema(captchaAnswerRef), [])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      phone: "",
      password: "",
      confirmPassword: "",
      wechatQrCode: "",
      captcha: "",
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("图片大小不能超过 2MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setQrCodePreview(result)
        form.setValue("wechatQrCode", result)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeQrCode = () => {
    setQrCodePreview(null)
    form.setValue("wechatQrCode", "")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1000))

      const currentUsers = getStoredUsers()
      if (currentUsers.some(u => u.phone === values.phone)) {
        toast.error("该手机号已注册")
        setCaptchaTick((t) => t + 1)
        setIsLoading(false)
        return
      }

      const newUser = {
        id: `user-${Date.now()}`,
        name: values.name,
        phone: values.phone,
        roles: [Role.TUTOR],
        password: values.password,
        wechatQrCode: values.wechatQrCode,
        createdAt: new Date(),
        updatedAt: new Date(),
        avatar: `https://api.dicebear.com/7.x/notionists/svg?seed=${values.name}`,
        status: UserStatus.PENDING,
      }

      const updatedUsers = [...currentUsers, newUser]
      saveMockData(STORAGE_KEYS.USERS, updatedUsers)
      toast.success("注册申请已提交，请等待审核")
      setIsSubmitted(true)
    } catch (error) {
      console.error(error)
      setCaptchaTick((t) => t + 1)
      toast.error("注册发生错误，请重试")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
        <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto bg-yellow-100 p-3 rounded-full w-fit">
              <CheckCircle2 className="h-10 w-10 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-primary">等待审核</CardTitle>
            <CardDescription className="text-lg">
              您的账号正在审核中...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex flex-col items-center">
            <div className="text-center space-y-2">
              <p className="text-muted-foreground">
                伴学教练账号需要管理员审核通过后才能登录
              </p>
              <p className="text-sm text-muted-foreground">请扫码，加运营老师，加快账号审核速度</p>
            </div>
            <div className="relative w-48 h-48 border rounded-lg overflow-hidden bg-white p-2 shadow-sm">
              <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed">
                运营老师微信二维码
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Button variant="outline" onClick={() => router.push("/login")}>
              返回登录
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <Card className="w-full max-w-md shadow-lg border-0 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-1">
            <Link href="/register">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-xs text-muted-foreground">返回选择</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center text-primary">伴学教练注册</CardTitle>
          <CardDescription className="text-center">
            创建您的伴学教练账号，注册后需等待审核
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>姓名 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="请输入真实姓名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>手机号 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="请输入11位手机号" {...field} />
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
                    <FormLabel>密码 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="请输入密码（至少6位）" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>确认密码 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="再次输入密码" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>个人微信二维码 <span className="text-red-500">*</span></FormLabel>
                <div className={cn(
                  "rounded-lg border p-4 bg-white/50",
                  form.formState.errors.wechatQrCode && "border-red-500 bg-red-50/50"
                )}>
                  <div className="flex items-center gap-6">
                    {qrCodePreview ? (
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border bg-white">
                        <img src={qrCodePreview} alt="QR Preview" className="h-full w-full object-cover" />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute right-0 top-0 h-6 w-6 rounded-none rounded-bl-lg opacity-80 hover:opacity-100"
                          onClick={removeQrCode}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/50">
                        <span className="text-xs text-muted-foreground">无图片</span>
                      </div>
                    )}
                    <div className="space-y-2 flex-1">
                      <div className="text-xs text-muted-foreground">
                        上传您的微信二维码，方便联系（支持JPG/PNG，最大5MB）
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        上传图片
                      </Button>
                      {form.formState.errors.wechatQrCode && (
                        <p className="text-xs text-red-500 font-medium">
                          {form.formState.errors.wechatQrCode.message}
                        </p>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="captcha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>验证码 <span className="text-red-500">*</span></FormLabel>
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

              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                提交注册申请
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <div className="text-sm text-muted-foreground">
            已有账号？{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              立即登录
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
