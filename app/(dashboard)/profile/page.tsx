"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Upload, Camera } from "lucide-react"
import { Role } from "@/types"

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/notionists/svg?seed=default"

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    campusName: user?.campusName || "",
    campusAccount: user?.campusAccount || "",
  })
  const [passwords, setPasswords] = useState({ newPassword: "", confirmPassword: "" })
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || DEFAULT_AVATAR)
  const [qrCode, setQrCode] = useState<string | null>(user?.wechatQrCode || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const qrFileInputRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPasswords(prev => ({ ...prev, [name]: value }))
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("图片大小不能超过 2MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedAvatar(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ""
  }

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("图片大小不能超过 2MB")
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setQrCode(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const passwordsMatch = passwords.newPassword && passwords.confirmPassword && passwords.newPassword === passwords.confirmPassword
  const passwordMismatch = passwords.newPassword && passwords.confirmPassword && passwords.newPassword !== passwords.confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordMismatch) {
      toast.error("两次输入的密码不一致")
      return
    }

    setLoading(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 800))

      const updateData: Parameters<typeof updateProfile>[0] = {
        name: formData.name,
        campusName: formData.campusName,
        campusAccount: formData.campusAccount,
        avatar: selectedAvatar,
        wechatQrCode: qrCode || undefined,
      }

      if (passwordsMatch) {
        updateData.password = passwords.newPassword
      }

      updateProfile(updateData)

      if (passwordsMatch) {
        toast.success("个人信息和密码更新成功")
        setPasswords({ newPassword: "", confirmPassword: "" })
      } else {
        toast.success("个人信息更新成功")
      }
    } catch (error) {
      console.error(error)
      toast.error("更新失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-3xl py-6">
      <Card>
        <CardHeader>
          <CardTitle>个人设置</CardTitle>
          <CardDescription>管理您的个人信息和账户设置</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8">

            {/* Avatar Section */}
            <div className="space-y-4">
              <Label>个人头像</Label>
              <div className="flex gap-6">
                {/* Current avatar with upload overlay */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => avatarInputRef.current?.click()}
                    title="点击上传自定义头像"
                  >
                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                      <AvatarImage src={selectedAvatar} />
                      <AvatarFallback className="text-2xl">{formData.name[0] || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">点击上传</span>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFileChange}
                  />
                </div>

              </div>
            </div>

            {/* Basic Info */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Phone - display only */}
              <div className="space-y-2">
                <Label htmlFor="phone">手机号</Label>
                <Input
                  id="phone"
                  value={user.phone || ""}
                  readOnly
                  disabled
                  className="bg-muted text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">手机号不可修改</p>
              </div>
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            {/* Campus info for SALES role */}
            {user?.roles.includes(Role.SALES) && (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campusName">9800校区名称</Label>
                  <Input
                    id="campusName"
                    name="campusName"
                    value={formData.campusName}
                    onChange={handleInputChange}
                    placeholder="请输入校区名称"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="campusAccount">9800校区账号</Label>
                  <Input
                    id="campusAccount"
                    name="campusAccount"
                    value={formData.campusAccount}
                    onChange={handleInputChange}
                    placeholder="请输入校区账号"
                  />
                </div>
              </div>
            )}

            {/* Password Change */}
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium">修改密码</Label>
                <p className="text-xs text-muted-foreground mt-1">如不需要修改密码，请留空</p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">新密码</Label>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    placeholder="请输入新密码"
                    autoComplete="new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">确认密码</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    placeholder="再次输入新密码"
                    autoComplete="new-password"
                    className={passwordMismatch ? "border-red-400 focus-visible:ring-red-400" : passwordsMatch ? "border-green-400 focus-visible:ring-green-400" : ""}
                  />
                  {passwordMismatch && (
                    <p className="text-xs text-red-500">两次密码输入不一致</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-green-600">密码一致，保存后将更新密码</p>
                  )}
                </div>
              </div>
            </div>

            {/* WeChat QR Code */}
            <div className="space-y-2">
              <Label>个人微信二维码</Label>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-6">
                  {qrCode ? (
                    <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border bg-white">
                      <img src={qrCode} alt="WeChat QR" className="h-full w-full object-cover" />
                    </div>
                  ) : (
                    <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed bg-muted/50">
                      <span className="text-xs text-muted-foreground">无图片</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      请上传您的微信二维码图片，以便学生或家长扫码添加。
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => qrFileInputRef.current?.click()}
                      >
                        <Upload className="mr-2 h-4 w-4" />
                        上传图片
                      </Button>
                      {qrCode && (
                        <Button
                          type="button"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => setQrCode(null)}
                        >
                          移除
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      支持 JPG, PNG 格式，建议尺寸 200x200
                    </p>
                    <input
                      ref={qrFileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleQrFileChange}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={loading || !!passwordMismatch} className="w-32">
                {loading ? "保存中..." : "保存更改"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
