"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Upload, X, Plus, Image as ImageIcon } from "lucide-react"

interface CustomerService {
  id: string
  name: string
  qrCodeUrl: string
}

export default function GlobalSettingsPage() {
  const [loading, setLoading] = useState(false)
  
  // Order & Transaction Settings
  const [systemOrderEnabled, setSystemOrderEnabled] = useState(true)
  const [systemDailyOrderLimit, setSystemDailyOrderLimit] = useState("200")
  const [userDailyOrderLimit, setUserDailyOrderLimit] = useState("2")

  // Coach Settings
  const [coachResponseTime, setCoachResponseTime] = useState("30")
  const [coachStudentLimit, setCoachStudentLimit] = useState("10")
  const [coachDailyTrialLimit, setCoachDailyTrialLimit] = useState("5")

  // Team Settings
  const [managerTeamLimit, setManagerTeamLimit] = useState("100")

  // WeChat Customer Service Settings
  const [customerServices, setCustomerServices] = useState<CustomerService[]>([
    {
      id: "1",
      name: "客服小张",
      qrCodeUrl: ""
    }
  ])

  // Customer Service handlers
  const handleAddCustomerService = () => {
    const newService: CustomerService = {
      id: Date.now().toString(),
      name: "",
      qrCodeUrl: ""
    }
    setCustomerServices([...customerServices, newService])
  }

  const handleRemoveCustomerService = (id: string) => {
    setCustomerServices(customerServices.filter(cs => cs.id !== id))
  }

  const handleUpdateCustomerServiceName = (id: string, name: string) => {
    setCustomerServices(customerServices.map(cs => 
      cs.id === id ? { ...cs, name } : cs
    ))
  }

  const handleUploadQRCode = async (id: string, file: File) => {
    try {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast.error("请上传图片文件")
        return
      }

      // 验证文件大小 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("图片大小不能超过 5MB")
        return
      }

      // 创建本地预览 URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const url = e.target?.result as string
        setCustomerServices(customerServices.map(cs => 
          cs.id === id ? { ...cs, qrCodeUrl: url } : cs
        ))
      }
      reader.readAsDataURL(file)

      // TODO: 实际项目中应该上传到服务器
      // const formData = new FormData()
      // formData.append('file', file)
      // const response = await fetch('/api/upload', { method: 'POST', body: formData })
      // const data = await response.json()
      // setCustomerServices(customerServices.map(cs => 
      //   cs.id === id ? { ...cs, qrCodeUrl: data.url } : cs
      // ))

      toast.success("二维码上传成功")
    } catch (error) {
      toast.error("上传失败，请重试")
    }
  }

  const handleSave = async () => {
    setLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setLoading(false)
    toast.success("全局配置已更新")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">全局配置</h1>
        <p className="text-muted-foreground">管理系统的全局运行参数和规则。</p>
      </div>

      <div className="grid gap-6">
        {/* Order & Transaction Settings */}
        <Card>
          <CardHeader>
            <CardTitle>下单与交易</CardTitle>
            <CardDescription>配置系统下单开关及相关限额。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between space-x-2 border p-4 rounded-lg">
              <Label htmlFor="system-order-enabled" className="flex flex-col space-y-1">
                <span className="font-medium">系统下单总开关</span>
                <span className="font-normal text-xs text-muted-foreground">开启后允许系统进行下单操作，关闭后将暂停所有下单功能。</span>
              </Label>
              <Switch 
                id="system-order-enabled" 
                checked={systemOrderEnabled}
                onCheckedChange={setSystemOrderEnabled}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="system-daily-limit">系统每日下单量限额</Label>
                <Input 
                  id="system-daily-limit" 
                  type="number" 
                  value={systemDailyOrderLimit}
                  onChange={(e) => setSystemDailyOrderLimit(e.target.value)}
                />
                <p className="text-[0.8rem] text-muted-foreground">全平台每日允许的最大订单数量。</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-daily-limit">单用户每日下单上限</Label>
                <Input 
                  id="user-daily-limit" 
                  type="number" 
                  value={userDailyOrderLimit}
                  onChange={(e) => setUserDailyOrderLimit(e.target.value)}
                />
                 <p className="text-[0.8rem] text-muted-foreground">单个用户每天允许创建的最大订单数。</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coach Settings */}
        <Card>
          <CardHeader>
            <CardTitle>教练接单</CardTitle>
            <CardDescription>配置教练接单规则及学员管理限制。</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="space-y-2">
                <Label htmlFor="coach-response-time">接单响应时长 (分钟)</Label>
                <Input 
                  id="coach-response-time" 
                  type="number" 
                  value={coachResponseTime}
                  onChange={(e) => setCoachResponseTime(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="coach-student-limit">教练学员数上限</Label>
                <Input 
                  id="coach-student-limit" 
                  type="number" 
                  value={coachStudentLimit}
                  onChange={(e) => setCoachStudentLimit(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coach-trial-limit">教练每日试课上限</Label>
                <Input 
                  id="coach-trial-limit" 
                  type="number" 
                  value={coachDailyTrialLimit}
                  onChange={(e) => setCoachDailyTrialLimit(e.target.value)}
                />
              </div>
          </CardContent>
        </Card>

        {/* Team Settings */}
        <Card>
          <CardHeader>
            <CardTitle>学管与团队</CardTitle>
            <CardDescription>配置学管团队的人员规模限制。</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-2 max-w-md">
                <Label htmlFor="manager-team-limit">学管团队成员数限额 (人)</Label>
                <Input 
                  id="manager-team-limit" 
                  type="number" 
                  value={managerTeamLimit}
                  onChange={(e) => setManagerTeamLimit(e.target.value)}
                />
              </div>
          </CardContent>
        </Card>

        {/* WeChat Customer Service Settings */}
        <Card>
          <CardHeader>
            <CardTitle>企业微信客服</CardTitle>
            <CardDescription>配置企业微信客服信息，支持添加多名客服。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {customerServices.map((service, index) => (
              <div key={service.id} className="border rounded-lg p-6 space-y-4 relative">
                {/* 删除按钮 */}
                {customerServices.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4 h-8 w-8"
                    onClick={() => handleRemoveCustomerService(service.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-muted-foreground">客服 #{index + 1}</span>
                  </div>
                  
                  {/* 客服名称 */}
                  <div className="space-y-2">
                    <Label htmlFor={`service-name-${service.id}`}>客服名称</Label>
                    <Input
                      id={`service-name-${service.id}`}
                      placeholder="请输入客服名称，例如：客服小张"
                      value={service.name}
                      onChange={(e) => handleUpdateCustomerServiceName(service.id, e.target.value)}
                    />
                  </div>

                  {/* 企业微信二维码 */}
                  <div className="space-y-2">
                    <Label>企业微信二维码</Label>
                    <div className="flex items-start gap-4">
                      {/* 二维码预览 */}
                      <div className="flex-shrink-0">
                        {service.qrCodeUrl ? (
                          <div className="relative w-40 h-40 border-2 border-dashed rounded-lg overflow-hidden group">
                            <img 
                              src={service.qrCodeUrl} 
                              alt={`${service.name}的二维码`}
                              className="w-full h-full object-cover"
                            />
                            {/* 重新上传遮罩 */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <label htmlFor={`qr-upload-${service.id}`} className="cursor-pointer">
                                <Upload className="h-8 w-8 text-white" />
                                <input
                                  id={`qr-upload-${service.id}`}
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) handleUploadQRCode(service.id, file)
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <label 
                            htmlFor={`qr-upload-${service.id}`}
                            className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-lg cursor-pointer hover:bg-accent transition-colors"
                          >
                            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                            <span className="text-xs text-muted-foreground text-center px-2">点击上传二维码</span>
                            <input
                              id={`qr-upload-${service.id}`}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleUploadQRCode(service.id, file)
                              }}
                            />
                          </label>
                        )}
                      </div>

                      {/* 上传说明 */}
                      <div className="flex-1 space-y-2 text-sm text-muted-foreground">
                        <p>• 支持 JPG、PNG、GIF 等图片格式</p>
                        <p>• 图片大小不超过 5MB</p>
                        <p>• 建议上传清晰的二维码图片</p>
                        <p>• 用户可通过扫描二维码添加企业微信客服</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 添加客服按钮 */}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddCustomerService}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加客服
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end pb-10">
          <Button onClick={handleSave} disabled={loading} size="lg">
            {loading ? "保存中..." : "保存配置"}
          </Button>
        </div>
      </div>
    </div>
  )
}
