"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Landmark, Info } from "lucide-react"
import { getStoredPaymentAccount, saveStoredPaymentAccount } from "@/lib/storage"

export default function PaymentAccountPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    idCardNumber: "",
    bankName: "",
    bankCardNumber: "",
    remarks: "",
  })

  useEffect(() => {
    if (!user) return
    const stored = getStoredPaymentAccount(user.id)
    if (stored) {
      setFormData({
        name: stored.name,
        idCardNumber: stored.idCardNumber,
        bankName: stored.bankName,
        bankCardNumber: stored.bankCardNumber,
        remarks: stored.remarks || "",
      })
    }
  }, [user])

  if (!user) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error("请输入姓名")
      return
    }
    if (!formData.idCardNumber.trim()) {
      toast.error("请输入身份证号")
      return
    }
    if (!formData.bankName.trim()) {
      toast.error("请输入银行名称")
      return
    }
    if (!formData.bankCardNumber.trim()) {
      toast.error("请输入银行卡号")
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      saveStoredPaymentAccount({
        userId: user.id,
        name: formData.name.trim(),
        idCardNumber: formData.idCardNumber.trim(),
        bankName: formData.bankName.trim(),
        bankCardNumber: formData.bankCardNumber.trim(),
        remarks: formData.remarks.trim() || undefined,
        updatedAt: new Date(),
      })
      toast.success("收款账号信息保存成功")
    } catch {
      toast.error("保存失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <CardTitle>收款账号信息</CardTitle>
          </div>
          <CardDescription>设置您的银行收款账户信息，用于结算课时收入</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                姓名请与银行开户姓名保持一致，否则可能导致打款失败。
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="请输入与银行开户一致的姓名"
                required
              />
              <p className="text-xs text-muted-foreground">请确保与银行开户姓名一致</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="idCardNumber">身份证号</Label>
              <Input
                id="idCardNumber"
                name="idCardNumber"
                value={formData.idCardNumber}
                onChange={handleInputChange}
                placeholder="请输入身份证号码"
                maxLength={18}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankName">银行名称</Label>
              <Input
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder="例如：中国工商银行XX支行"
                required
              />
              <p className="text-xs text-muted-foreground">请包含支行名称，例如「中国建设银行广州天河支行」</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankCardNumber">银行卡号</Label>
              <Input
                id="bankCardNumber"
                name="bankCardNumber"
                value={formData.bankCardNumber}
                onChange={handleInputChange}
                placeholder="请输入银行卡号"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">备注</Label>
              <Textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                placeholder="如有其他需要说明的信息，请在此填写"
                rows={3}
              />
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button type="submit" disabled={loading} className="w-32">
                {loading ? "保存中..." : "保存"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
