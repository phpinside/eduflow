"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  AlertTriangle,
  FileText,
  PenLine,
  RotateCcw,
  CheckCircle2,
  Landmark,
} from "lucide-react"
import { Role, IncomeType, ManagementIncomeSubType } from "@/types"
import {
  getStoredIncomeRecords,
  getStoredManagementIncomeDetails,
  isPaymentAccountComplete,
  isBillConfirmed,
  getBillMonth,
  saveBillConfirmation,
} from "@/lib/storage"

interface BillItem {
  type: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  amount: number
}

function generateBillItems(
  userId: string,
  year: number,
  month: number,
  userRoles: Role[]
): BillItem[] {
  const items: BillItem[] = []

  const allIncome = getStoredIncomeRecords()
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const myIncome = allIncome.filter(r => {
    if (r.teacherId !== userId) return false
    const d = new Date(r.occurredAt)
    return d >= startDate && d <= endDate
  })

  const trialRecords = myIncome.filter(r => r.type === IncomeType.TRIAL_FEE)
  const dealRecords = myIncome.filter(r => r.type === IncomeType.DEAL_REWARD)
  const lessonRecords = myIncome.filter(r => r.type === IncomeType.LESSON_FEE)

  if (trialRecords.length > 0) {
    items.push({
      type: "试课费",
      description: `共完成 ${trialRecords.length} 次试课`,
      quantity: trialRecords.length,
      unit: "次",
      unitPrice: 200,
      amount: trialRecords.reduce((s, r) => s + r.amount, 0),
    })
  }

  if (dealRecords.length > 0) {
    items.push({
      type: "成交奖励",
      description: `共 ${dealRecords.length} 笔成交`,
      quantity: dealRecords.length,
      unit: "单",
      unitPrice: 0,
      amount: dealRecords.reduce((s, r) => s + r.amount, 0),
    })
  }

  if (lessonRecords.length > 0) {
    const totalHours = lessonRecords.reduce((s, r) => s + r.quantity, 0)
    items.push({
      type: "课时费",
      description: `共授课 ${totalHours} 课时`,
      quantity: totalHours,
      unit: "课时",
      unitPrice: 0,
      amount: lessonRecords.reduce((s, r) => s + r.amount, 0),
    })
  }

  if (userRoles.includes(Role.MANAGER)) {
    const allMgmt = getStoredManagementIncomeDetails()
    const myMgmt = allMgmt.filter(r => {
      if (r.teamLeaderId !== userId) return false
      const d = new Date(r.occurredAt)
      return d >= startDate && d <= endDate
    })

    const tutorFee = myMgmt.filter(r => r.subType === ManagementIncomeSubType.TUTOR_MGMT_FEE)
    const mgrFee = myMgmt.filter(r => r.subType === ManagementIncomeSubType.MANAGER_MGMT_FEE)
    const dirFee = myMgmt.filter(r => r.subType === ManagementIncomeSubType.DIRECTOR_TRAIN_FEE)

    if (tutorFee.length > 0) {
      const hours = tutorFee.reduce((s, r) => s + r.regularLessonCount, 0)
      items.push({
        type: "教练管理费",
        description: `团队正课 ${hours} 课时`,
        quantity: hours,
        unit: "课时",
        unitPrice: 5,
        amount: tutorFee.reduce((s, r) => s + r.amount, 0),
      })
    }

    if (mgrFee.length > 0) {
      const hours = mgrFee.reduce((s, r) => s + r.regularLessonCount, 0)
      items.push({
        type: "学管管理费",
        description: `下级学管正课 ${hours} 课时`,
        quantity: hours,
        unit: "课时",
        unitPrice: 5,
        amount: mgrFee.reduce((s, r) => s + r.amount, 0),
      })
    }

    if (dirFee.length > 0) {
      const hours = dirFee.reduce((s, r) => s + r.regularLessonCount, 0)
      items.push({
        type: "总监培养费",
        description: `团队正课 ${hours} 课时`,
        quantity: hours,
        unit: "课时",
        unitPrice: 1,
        amount: dirFee.reduce((s, r) => s + r.amount, 0),
      })
    }
  }

  return items
}

function SignaturePad({
  value,
  onChange,
}: {
  value: string
  onChange: (dataUrl: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)

  const getContext = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    return ctx
  }, [])

  const clear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    onChange("")
  }, [onChange])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, rect.width, rect.height)
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawing.current = true
    const ctx = getContext()
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return
    const ctx = getContext()
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing.current) return
    isDrawing.current = false
    const canvas = canvasRef.current
    if (canvas) {
      onChange(canvas.toDataURL("image/png"))
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">在线签名</span>
        <Button type="button" variant="ghost" size="sm" onClick={clear}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          清除
        </Button>
      </div>
      <div className="relative rounded-lg border-2 border-dashed border-gray-300 bg-white">
        <canvas
          ref={canvasRef}
          className="h-32 w-full touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!value && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="text-sm text-gray-400">请在此处签名</span>
          </div>
        )}
      </div>
    </div>
  )
}

export function BillConfirmationModal() {
  const { user } = useAuth()
  const [signatureDataUrl, setSignatureDataUrl] = useState("")
  const [checked, setChecked] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [billItems, setBillItems] = useState<BillItem[]>([])
  const [billPeriod, setBillPeriod] = useState({ year: 0, month: 0 })
  const [accountComplete, setAccountComplete] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [justConfirmed, setJustConfirmed] = useState(false)

  useEffect(() => {
    if (!user) return
    if (!user.roles.includes(Role.TUTOR) && !user.roles.includes(Role.MANAGER)) return

    const { year, month } = getBillMonth()
    setBillPeriod({ year, month })

    if (isBillConfirmed(user.id, year, month)) return

    setAccountComplete(isPaymentAccountComplete(user.id))
    const items = generateBillItems(user.id, year, month, user.roles as Role[])
    setBillItems(items)
    setIsOpen(true)
  }, [user])

  if (!user) return null
  if (!user.roles.includes(Role.TUTOR) && !user.roles.includes(Role.MANAGER)) return null
  if (isBillConfirmed(user.id, billPeriod.year, billPeriod.month) && !justConfirmed) return null

  const totalAmount = billItems.reduce((s, i) => s + i.amount, 0)
  const canSubmit = checked && signatureDataUrl && accountComplete

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      saveBillConfirmation({
        userId: user.id,
        year: billPeriod.year,
        month: billPeriod.month,
        signatureDataUrl,
        confirmedAt: new Date(),
      })
      setJustConfirmed(true)
      toast.success("账单确认成功")
      setTimeout(() => {
        setIsOpen(false)
      }, 1200)
    } catch {
      toast.error("确认失败，请重试")
    } finally {
      setSubmitting(false)
    }
  }

  const monthLabel = `${billPeriod.year}年${billPeriod.month}月`

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent
        className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <DialogTitle>月度账单确认</DialogTitle>
          </div>
          <DialogDescription>
            请核对您 {monthLabel} 的收入明细，确认无误后签名提交。确认前无法使用其他功能。
          </DialogDescription>
        </DialogHeader>

        {!accountComplete && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="flex items-center gap-2">
              <span>您的收款账户信息不完整，请先完善后再进行账单确认。</span>
              <Link
                href="/payment-account"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:no-underline"
              >
                <Landmark className="h-3.5 w-3.5" />
                去完善
              </Link>
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {monthLabel} 收入明细
            </CardTitle>
          </CardHeader>
          <CardContent>
            {billItems.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">本月暂无收入记录</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>收入类型</TableHead>
                    <TableHead>说明</TableHead>
                    <TableHead className="text-right">数量</TableHead>
                    <TableHead className="text-right">金额</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {billItems.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{item.type}</TableCell>
                      <TableCell className="text-muted-foreground">{item.description}</TableCell>
                      <TableCell className="text-right">
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ¥{item.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <Separator className="my-3" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">合计</span>
              <span className="text-xl font-bold text-primary">
                ¥{totalAmount.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>

        <SignaturePad value={signatureDataUrl} onChange={setSignatureDataUrl} />

        <div className="flex items-start gap-2">
          <Checkbox
            id="bill-confirm"
            checked={checked}
            onCheckedChange={v => setChecked(v === true)}
            disabled={!accountComplete}
          />
          <label htmlFor="bill-confirm" className="text-sm leading-relaxed cursor-pointer">
            我已仔细核对以上收入明细，确认金额无误，同意以此作为 {monthLabel} 的结算依据。
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {justConfirmed ? (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle2 className="h-5 w-5" />
              账单已确认
            </div>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                className="min-w-[120px]"
              >
                稍后再确认
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || submitting}
                className="min-w-[120px]"
              >
                {submitting ? (
                  "提交中..."
                ) : (
                  <>
                    <PenLine className="mr-2 h-4 w-4" />
                    确认无误
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
