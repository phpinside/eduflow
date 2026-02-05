"use client"

import { useState, useRef } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { Upload } from "lucide-react"
import { Role } from "@/types"

// Generate 20 system avatars
const SYSTEM_AVATARS = Array.from({ length: 20 }, (_, i) => ({
  id: `avatar-${i + 1}`,
  src: `https://api.dicebear.com/7.x/notionists/svg?seed=${i + 100}`,
}))

export default function ProfilePage() {
  const { user, updateProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    campusName: user?.campusName || "",
    campusAccount: user?.campusAccount || "",
  })
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || SYSTEM_AVATARS[0].src)
  const [qrCode, setQrCode] = useState<string | null>(user?.wechatQrCode || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!user) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 800))
      
      updateProfile({
        name: formData.name,
        phone: formData.phone,
        campusName: formData.campusName,
        campusAccount: formData.campusAccount,
        avatar: selectedAvatar,
        wechatQrCode: qrCode || undefined
      })
      
      toast.success("个人信息更新成功")
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
            
            {/* Avatar Selection */}
            <div className="space-y-4">
              <Label>选择头像</Label>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center gap-2">
                    <Avatar className="h-24 w-24 border-2 border-primary/20">
                    <AvatarImage src={selectedAvatar} />
                    <AvatarFallback className="text-2xl">{formData.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">当前头像</span>
                </div>
                
                <div className="flex-1">
                    <div className="grid grid-cols-5 gap-3 sm:grid-cols-8 md:grid-cols-10">
                        {SYSTEM_AVATARS.map((avatar) => (
                        <button
                            key={avatar.id}
                            type="button"
                            onClick={() => setSelectedAvatar(avatar.src)}
                            className={`
                            relative flex aspect-square items-center justify-center rounded-full overflow-hidden
                            border-2 transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                            ${selectedAvatar === avatar.src ? 'border-primary ring-2 ring-primary ring-offset-2' : 'border-transparent hover:border-gray-200'}
                            `}
                        >
                            <img src={avatar.src} alt="avatar" className="h-full w-full object-cover" />
                        </button>
                        ))}
                    </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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
              <div className="space-y-2">
                <Label htmlFor="phone">手机号</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

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

            <div className="space-y-2">
              <Label>个人微信二维码</Label>
              <div className="rounded-lg border p-4">
                <div className="flex items-center gap-6">
                    {qrCode ? (
                        <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border bg-white">
                            <img src={qrCode} alt="WeChat QR" className="h-full w-full object-cover" />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute right-1 top-1 h-6 w-6 rounded-full opacity-0 hover:opacity-100 transition-opacity group-hover:opacity-100"
                                onClick={() => setQrCode(null)}
                            >
                                <span className="sr-only">Delete</span>
                                <span aria-hidden="true">×</span>
                            </Button>
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
                                onClick={() => fileInputRef.current?.click()}
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

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={loading} className="w-32">
                {loading ? "保存中..." : "保存更改"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
