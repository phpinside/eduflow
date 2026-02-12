"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Circle } from "lucide-react"
import { toast } from "sonner"

export default function RegularCourseDealPaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  // Get all params to pass them forward
  const params = Object.fromEntries(searchParams.entries())
  const { studentName, subject, grade } = params
  
  // Fixed deal fee for trial to regular conversion
  const dealFee = 199.00
  
  const [paymentMethod, setPaymentMethod] = React.useState<"wechat" | "alipay">("wechat")
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handlePay = async () => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success("转正费支付成功！正在跳转正课创建页面...")
    
    // Construct query string for the next page
    const queryString = new URLSearchParams(params as any).toString()
    
    // Redirect to Regular Course Create page with original params
    setTimeout(() => {
        router.push(`/regular-course/create?${queryString}`)
    }, 1000)
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">试课转正课支付</h2>
        <p className="text-muted-foreground">请先支付试课转正费用</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>费用详情</CardTitle>
          <CardDescription>
            试课转化正课 - {studentName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">关联学生</span>
            <span className="font-medium">{studentName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">意向课程</span>
            <span className="font-medium">{subject} ({grade})</span>
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-bold">转正费</span>
            <span className="text-xl font-bold text-primary">¥{dealFee}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <h3 className="font-medium">选择支付方式</h3>
        
        <div 
            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'wechat' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
            onClick={() => setPaymentMethod('wechat')}
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">微</div>
                <span>微信支付</span>
            </div>
            {paymentMethod === 'wechat' ? <CheckCircle2 className="text-primary h-5 w-5" /> : <Circle className="text-muted-foreground h-5 w-5" />}
        </div>

        <div 
            className={`flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all ${paymentMethod === 'alipay' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}
            onClick={() => setPaymentMethod('alipay')}
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white font-bold">支</div>
                <span>支付宝</span>
            </div>
            {paymentMethod === 'alipay' ? <CheckCircle2 className="text-primary h-5 w-5" /> : <Circle className="text-muted-foreground h-5 w-5" />}
        </div>
      </div>

      <Button className="w-full text-lg h-12" size="lg" onClick={handlePay} disabled={isProcessing}>
        {isProcessing ? "支付中..." : `立即支付 ¥${dealFee}`}
      </Button>
    </div>
  )
}
