"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

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

        <div className="flex justify-end pb-10">
          <Button onClick={handleSave} disabled={loading} size="lg">
            {loading ? "保存中..." : "保存配置"}
          </Button>
        </div>
      </div>
    </div>
  )
}
