"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Circle } from "lucide-react"
import { toast } from "sonner"
import { getStoredPriceRules } from "@/lib/storage"
import { computePricingBreakdown, resolveTrialRewardFromRules } from "@/lib/order-pricing"

export default function RegularCoursePaymentPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const studentName = searchParams.get("studentName") || "未知学生"
  const subject = searchParams.get("subject") || "未知科目"
  const grade = searchParams.get("grade") || "未知年级"
  const totalHours = searchParams.get("totalHours") || "0"
  const courseFee = parseFloat(searchParams.get("price") || "0")
  const hoursNum = parseFloat(totalHours || "0")
  // 创建正课单时已选择是否代收鼎伴学费用；确认页只做确认，不允许修改
  // 注意：默认课时单价已包含鼎伴学代收（20元/课时）。若创建时选择“不代收”，则会在应付中扣除该部分。
  const needsDingbanxueRecharge = searchParams.get("needsDingbanxueRecharge") !== "false"
  const dingbanxueFeeApplicable = true
  const fromTrialConversion = searchParams.get("fromTrialConversion") === "true"
  
  const [paymentMethod, setPaymentMethod] = React.useState<"wechat" | "alipay">("wechat")
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [includeConversionRewardInPayment, setIncludeConversionRewardInPayment] =
    React.useState(false)
  const includeDingbanxueFeeInPayment = needsDingbanxueRecharge

  const dingbanxueFee = React.useMemo(() => {
    if (!dingbanxueFeeApplicable) return 0
    return Math.round(Math.max(0, hoursNum) * 20)
  }, [dingbanxueFeeApplicable, hoursNum])

  // 这里的 courseFee 来自创建页透传的“应付金额”（可能已扣减 20×课时）。
  // 为了让确认页展示与创建页一致，补充展示“默认含鼎伴学代收的课时费用”与扣减链路。
  const grossCourseFee = React.useMemo(() => {
    const base = Math.max(0, Number(courseFee) || 0)
    return needsDingbanxueRecharge ? base : base + dingbanxueFee
  }, [courseFee, needsDingbanxueRecharge, dingbanxueFee])

  const lessonFee = React.useMemo(() => {
    if (needsDingbanxueRecharge) return Math.max(0, grossCourseFee - dingbanxueFee)
    return Math.max(0, Number(courseFee) || 0)
  }, [needsDingbanxueRecharge, grossCourseFee, dingbanxueFee, courseFee])

  const conversionRewardFee = React.useMemo(() => {
    if (!fromTrialConversion) return 0
    const rules = getStoredPriceRules()
    return resolveTrialRewardFromRules(rules, subject, grade)
  }, [fromTrialConversion, subject, grade])

  const breakdown = React.useMemo(() => {
    return computePricingBreakdown({
      subject,
      grade,
      totalHours: hoursNum,
      courseFee: lessonFee,
      fromTrialConversion,
      conversionRewardFee,
      includeConversionRewardInPayment: fromTrialConversion && includeConversionRewardInPayment,
      dingbanxueFeeApplicable,
      includeDingbanxueFeeInPayment: dingbanxueFeeApplicable && includeDingbanxueFeeInPayment,
    })
  }, [
    subject,
    grade,
    hoursNum,
    lessonFee,
    fromTrialConversion,
    conversionRewardFee,
    dingbanxueFeeApplicable,
    includeConversionRewardInPayment,
    includeDingbanxueFeeInPayment,
  ])

  const handlePay = async () => {
    setIsProcessing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    toast.success("支付成功！")
    router.push("/orders")
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">确认支付</h2>
        <p className="text-muted-foreground">
          请确认订单信息并完成支付
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>订单详情</CardTitle>
          <CardDescription>
            正课订单 - {subject} ({grade})
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">学生姓名</span>
            <span className="font-medium">{studentName}</span>
          </div>
          <Separator />
          <div className="space-y-3">
            <div className="text-sm font-medium">可选费用（按需勾选合并支付）</div>
            {fromTrialConversion && (
              <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-accent/30">
                <input
                  type="checkbox"
                  checked={includeConversionRewardInPayment}
                  onChange={(e) => setIncludeConversionRewardInPayment(e.target.checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">转正红包费用与本次一起支付</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    金额来自价格配置（试课成交奖励）
                  </div>
                </div>
              </label>
            )}
            <label className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20">
              <input
                type="checkbox"
                checked={includeDingbanxueFeeInPayment}
                disabled
                className="mt-1"
              />
              <div className="flex-1">
                <div className="font-medium text-sm">代收鼎伴学费用与本次一起支付</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  创建正课单时已选择（此处仅确认，不可修改）
                </div>
              </div>
            </label>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>购买课时</span>
              <span>{totalHours} 课时</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>课时费用（默认含鼎伴学代收）</span>
              <span>¥{grossCourseFee}</span>
            </div>
            <div className="flex justify-between text-sm">
              {/* <span>
                鼎伴学代收费用（20元/课时）
                <span className="ml-1 text-xs text-muted-foreground">
                  {needsDingbanxueRecharge ? "本次一起支付" : "本次不代收，已扣减"}
                </span>
              </span> */}
              <span>¥{needsDingbanxueRecharge ? dingbanxueFee : 0}</span>
            </div>
            {!needsDingbanxueRecharge && dingbanxueFee > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>已扣减鼎伴学代收费用</span>
                <span>-¥{dingbanxueFee}</span>
              </div>
            )}
            {/* <div className="flex justify-between text-sm">
              <span>课时费（不含鼎伴学）</span>
              <span>¥{lessonFee}</span>
            </div> */}
            {fromTrialConversion && (
              <div className="flex justify-between text-sm">
                <span>转正红包费用</span>
                <span>
                  ¥{includeConversionRewardInPayment ? breakdown.conversionRewardFee : 100}
                </span>
              </div>
            )}
          </div>
          <Separator />
          <div className="flex justify-between items-center">
            <span className="font-bold">订单总计</span>
            <span className="text-xl font-bold text-primary">¥{breakdown.totalPayable}</span>
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
        {isProcessing ? "支付中..." : `立即支付 ¥${breakdown.totalPayable}`}
      </Button>
    </div>
  )
}
