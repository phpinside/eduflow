"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Info,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import {
  Order,
  CourseTransfer,
  TransferType,
  TransferStatus,
  Student,
} from "@/types"
import { OperationAction } from "@/types/operation-log"
import {
  getStoredOrders,
  saveStoredOrders,
  getStoredStudents,
  getStoredCourseTransfers,
  saveStoredCourseTransfers,
  getStoredPriceRules,
  getStoredTransferOperationLogs,
  saveStoredTransferOperationLogs,
  addOperationLog,
} from "@/lib/storage"
import {
  calculateTransfer,
  isEligibleSourceOrder,
  isEligibleTargetOrder,
  generateTransferId,
  createTransferLog,
  DINGBANXUE_PER_HOUR,
} from "@/lib/course-transfer"
import { getLatestUnitPriceByGrade } from "@/lib/course-pricing"
import type { PriceRule } from "@/lib/mock-data/price-settings"

const PAGE_SIZE = 10

const GRADE_OPTIONS = [
  "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
  "七年级", "八年级", "九年级",
  "高一", "高二", "高三",
]

const TRANSFER_TYPE_OPTIONS = [
  { value: TransferType.GRADE_UPGRADE, label: "年级升级", desc: "同一学员，课时标准升级（如六年级→初一）" },
  { value: TransferType.CROSS_STUDENT, label: "跨学员转移", desc: "将课时从 A 学员转移给 B 学员" },
]

const STATUS_MAP: Record<string, { label: string; color: "default" | "secondary" | "destructive" | "outline" }> = {
  PENDING_FIRST_REVIEW: { label: "待一审", color: "secondary" },
  PENDING_SECOND_REVIEW: { label: "待二审", color: "default" },
  FIRST_REJECTED: { label: "一审驳回", color: "destructive" },
  SECOND_REJECTED: { label: "二审驳回", color: "destructive" },
  APPROVED: { label: "已通过", color: "default" },
  CANCELLED: { label: "已取消", color: "destructive" },
}

export default function CourseTransferPage() {
  const { user } = useAuth()

  const [orders, setOrders] = React.useState<Order[]>([])
  const [students, setStudents] = React.useState<Student[]>([])
  const [transfers, setTransfers] = React.useState<CourseTransfer[]>([])
  const [priceRules, setPriceRules] = React.useState<PriceRule[]>([])
  const [activeTab, setActiveTab] = React.useState("create")

  React.useEffect(() => {
    setOrders(getStoredOrders())
    setStudents(getStoredStudents())
    setTransfers(getStoredCourseTransfers())
    setPriceRules(getStoredPriceRules())
  }, [])

  const [step, setStep] = React.useState(1)

  const [transferType, setTransferType] = React.useState<TransferType>(TransferType.GRADE_UPGRADE)

  const [sourceOrder, setSourceOrder] = React.useState<Order | null>(null)
  const [sourceSearch, setSourceSearch] = React.useState("")
  const [sourceDropdownOpen, setSourceDropdownOpen] = React.useState(false)

  const [transferHours, setTransferHours] = React.useState<string>("")

  const [targetGrade, setTargetGrade] = React.useState("")
  const [targetSubject, setTargetSubject] = React.useState("")
  const [targetStudentId, setTargetStudentId] = React.useState("")
  const [targetStudentSearch, setTargetStudentSearch] = React.useState("")
  const [targetStudentDropdownOpen, setTargetStudentDropdownOpen] = React.useState(false)

  const [targetMode, setTargetMode] = React.useState<"existing" | "new">("existing")
  const [targetOrder, setTargetOrder] = React.useState<Order | null>(null)
  const [targetOrderSearch, setTargetOrderSearch] = React.useState("")
  const [targetOrderDropdownOpen, setTargetOrderDropdownOpen] = React.useState(false)

  const [remarks, setRemarks] = React.useState("")
  const [supplementaryVouchers, setSupplementaryVouchers] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const [historyPage, setHistoryPage] = React.useState(1)
  const [detailTransfer, setDetailTransfer] = React.useState<CourseTransfer | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = React.useState(false)

  const voucherInputRef = React.useRef<HTMLInputElement>(null)

  const resetForm = () => {
    setStep(1)
    setSourceOrder(null)
    setSourceSearch("")
    setTransferHours("")
    setTargetGrade("")
    setTargetSubject("")
    setTargetStudentId("")
    setTargetStudentSearch("")
    setTargetMode("existing")
    setTargetOrder(null)
    setTargetOrderSearch("")
    setRemarks("")
    setSupplementaryVouchers([])
  }

  const eligibleSourceOrders = React.useMemo(() => {
    return orders.filter(isEligibleSourceOrder)
  }, [orders])

  const filteredSourceOrders = React.useMemo(() => {
    if (!sourceSearch.trim()) return eligibleSourceOrders.slice(0, 20)
    const q = sourceSearch.toLowerCase()
    return eligibleSourceOrders.filter(o => {
      const student = students.find(s => s.id === o.studentId)
      const studentName = student?.name ?? ""
      const parentPhone = student?.parentPhone ?? ""
      return (
        o.id.toLowerCase().includes(q) ||
        studentName.toLowerCase().includes(q) ||
        o.subject.toLowerCase().includes(q) ||
        o.grade.toLowerCase().includes(q) ||
        parentPhone.includes(q)
      )
    }).slice(0, 20)
  }, [eligibleSourceOrders, sourceSearch, students])

  const sourceStudentName = React.useMemo(() => {
    if (!sourceOrder) return ""
    return students.find(s => s.id === sourceOrder.studentId)?.name ?? ""
  }, [sourceOrder, students])

  const maxTransferHours = sourceOrder?.remainingHours ?? 0

  const effectiveTargetGrade = React.useMemo(() => {
    if (transferType === TransferType.GRADE_UPGRADE) return targetGrade
    if (targetMode === "existing" && targetOrder) return targetOrder.grade
    return targetGrade
  }, [transferType, targetGrade, targetMode, targetOrder])

  const effectiveTargetSubject = React.useMemo(() => {
    if (targetSubject) return targetSubject
    return sourceOrder?.subject ?? ""
  }, [targetSubject, sourceOrder])

  const calcResult = React.useMemo(() => {
    if (!sourceOrder || !effectiveTargetGrade || !transferHours || Number(transferHours) <= 0) return null
    const hours = Math.min(Number(transferHours), maxTransferHours)
    return calculateTransfer(
      sourceOrder.grade,
      sourceOrder.subject,
      effectiveTargetGrade,
      effectiveTargetSubject,
      hours,
      priceRules,
    )
  }, [sourceOrder, effectiveTargetGrade, effectiveTargetSubject, transferHours, maxTransferHours, priceRules])

  const targetStudentName = React.useMemo(() => {
    if (transferType === TransferType.GRADE_UPGRADE) return sourceStudentName
    if (!targetStudentId) return ""
    return students.find(s => s.id === targetStudentId)?.name ?? ""
  }, [transferType, sourceStudentName, targetStudentId, students])

  const eligibleTargetOrders = React.useMemo(() => {
    if (transferType === TransferType.GRADE_UPGRADE) {
      return orders.filter(o =>
        isEligibleTargetOrder(o) &&
        o.studentId === (sourceOrder?.studentId ?? "") &&
        o.id !== (sourceOrder?.id ?? "")
      )
    }
    if (!targetStudentId) return []
    return orders.filter(o =>
      isEligibleTargetOrder(o) &&
      o.studentId === targetStudentId &&
      o.id !== (sourceOrder?.id ?? "")
    )
  }, [orders, transferType, sourceOrder, targetStudentId])

  const filteredTargetOrders = React.useMemo(() => {
    if (!targetOrderSearch.trim()) return eligibleTargetOrders.slice(0, 20)
    const q = targetOrderSearch.toLowerCase()
    return eligibleTargetOrders.filter(o => {
      const student = students.find(s => s.id === o.studentId)
      return (
        o.id.toLowerCase().includes(q) ||
        (student?.name ?? "").toLowerCase().includes(q) ||
        o.subject.toLowerCase().includes(q)
      )
    }).slice(0, 20)
  }, [eligibleTargetOrders, targetOrderSearch, students])

  const filteredTargetStudents = React.useMemo(() => {
    if (!targetStudentSearch.trim()) return students.slice(0, 20)
    const q = targetStudentSearch.toLowerCase()
    return students.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.parentPhone.includes(q)
    ).slice(0, 20)
  }, [students, targetStudentSearch])

  const isStep1Valid = !!sourceOrder
  const isStep2Valid = (() => {
    if (!transferHours || Number(transferHours) <= 0 || Number(transferHours) > maxTransferHours) return false
    if (transferType === TransferType.GRADE_UPGRADE) {
      if (!targetGrade) return false
      if (targetGrade === sourceOrder?.grade) return false
    } else {
      if (!targetStudentId) return false
      if (targetMode === "existing" && !targetOrder) return false
      if (targetMode === "new" && !targetGrade) return false
    }
    return true
  })()
  const isStep3Valid = (() => {
    if (!calcResult) return false
    if (calcResult.priceDifference > 0 && supplementaryVouchers.length === 0) return false
    return true
  })()

  const handleVoucherUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string
        if (dataUrl) {
          setSupplementaryVouchers(prev => [...prev, dataUrl])
        }
      }
      reader.readAsDataURL(file)
    })
    if (voucherInputRef.current) voucherInputRef.current.value = ""
  }

  const removeVoucher = (index: number) => {
    setSupplementaryVouchers(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!sourceOrder || !calcResult || !user) return
    setIsSubmitting(true)

    await new Promise(r => setTimeout(r, 600))

    const now = new Date()
    const transferId = generateTransferId()
    const reservedTargetId = (targetMode === "existing" && targetOrder)
      ? targetOrder.id
      : `ord-reserved-${Date.now()}`

    const transferRecord: CourseTransfer = {
      id: transferId,
      type: transferType,
      sourceOrderId: sourceOrder.id,
      sourceStudentId: sourceOrder.studentId,
      sourceStudentName: sourceStudentName,
      sourceSubject: sourceOrder.subject,
      sourceGrade: sourceOrder.grade,
      sourceUnitPrice: calcResult.sourceGrossUnitPrice,
      sourceNetUnitPrice: calcResult.sourceNetUnitPrice,
      sourceTransferredHours: Number(transferHours),
      sourceRemainingBefore: sourceOrder.remainingHours,
      targetOrderId: reservedTargetId,
      targetStudentId: transferType === TransferType.GRADE_UPGRADE
        ? sourceOrder.studentId
        : targetStudentId,
      targetStudentName: transferType === TransferType.GRADE_UPGRADE
        ? sourceStudentName
        : targetStudentName,
      targetSubject: effectiveTargetSubject,
      targetGrade: effectiveTargetGrade,
      targetUnitPrice: calcResult.targetGrossUnitPrice,
      targetNetUnitPrice: calcResult.targetNetUnitPrice,
      targetReceivedHours: calcResult.targetReceivedHours,
      sourceValue: calcResult.sourceValue,
      targetValue: calcResult.targetValue,
      priceDifference: calcResult.priceDifference,
      status: TransferStatus.PENDING_FIRST_REVIEW,
      remarks: remarks || undefined,
      supplementaryVouchers: supplementaryVouchers.length > 0 ? supplementaryVouchers : undefined,
      dingbanxueReminderStatus: "PENDING",
      createdBy: user.id,
      createdByName: user.name,
      createdAt: now,
      updatedAt: now,
    }

    const currentTransfers = getStoredCourseTransfers()
    currentTransfers.unshift(transferRecord)
    saveStoredCourseTransfers(currentTransfers)
    setTransfers(currentTransfers)

    const logs = getStoredTransferOperationLogs()
    logs.unshift(createTransferLog({
      transferId,
      sourceOrderId: sourceOrder.id,
      targetOrderId: reservedTargetId,
      actorRole: "OPERATOR",
      actorUserId: user.id,
      actorName: user.name,
      action: "提交转移申请",
      detail: `${sourceStudentName}(${sourceOrder.grade} ${sourceOrder.subject}) → ${transferRecord.targetStudentName}(${effectiveTargetGrade} ${effectiveTargetSubject})，转移 ${transferHours} 课时`,
    }))
    saveStoredTransferOperationLogs(logs)

    addOperationLog({
      type: "ORDER" as any,
      action: OperationAction.COURSE_TRANSFER,
      operatorId: user.id,
      operatorName: user.name,
      operatorRole: "OPERATOR",
      targetId: transferId,
      targetType: "CourseTransfer",
      remark: `提交转移申请：${sourceStudentName}(${sourceOrder.grade}) → ${transferRecord.targetStudentName}(${effectiveTargetGrade})，${transferHours} 课时`,
    })

    toast.success("转移申请已提交，等待财务审核。")
    resetForm()
    setActiveTab("history")
    setIsSubmitting(false)
  }

  const handleConfirmDingbanxue = (transfer: CourseTransfer) => {
    const currentTransfers = getStoredCourseTransfers()
    const idx = currentTransfers.findIndex(t => t.id === transfer.id)
    if (idx < 0) return
    currentTransfers[idx] = {
      ...currentTransfers[idx],
      dingbanxueReminderStatus: "CONFIRMED",
      updatedAt: new Date(),
    }
    saveStoredCourseTransfers(currentTransfers)
    setTransfers([...currentTransfers])
    toast.success("已确认鼎伴学课时转移完成")
  }

  const handleCancelTransfer = (transfer: CourseTransfer) => {
    if (transfer.status !== TransferStatus.PENDING_FIRST_REVIEW && transfer.status !== TransferStatus.FIRST_REJECTED) {
      toast.error("仅待一审或已驳回的申请可取消")
      return
    }
    const currentTransfers = getStoredCourseTransfers()
    const idx = currentTransfers.findIndex(t => t.id === transfer.id)
    if (idx < 0) return
    currentTransfers[idx] = {
      ...currentTransfers[idx],
      status: TransferStatus.CANCELLED,
      updatedAt: new Date(),
    }
    saveStoredCourseTransfers(currentTransfers)
    setTransfers([...currentTransfers])

    const logs = getStoredTransferOperationLogs()
    logs.unshift(createTransferLog({
      transferId: transfer.id,
      sourceOrderId: transfer.sourceOrderId,
      targetOrderId: transfer.targetOrderId,
      actorRole: "OPERATOR",
      actorUserId: user?.id,
      actorName: user?.name,
      action: "取消转移申请",
    }))
    saveStoredTransferOperationLogs(logs)

    toast.success("转移申请已取消")
  }

  const pagedTransfers = React.useMemo(() => {
    const sorted = [...transfers].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    const start = (historyPage - 1) * PAGE_SIZE
    return {
      items: sorted.slice(start, start + PAGE_SIZE),
      totalPages: Math.ceil(sorted.length / PAGE_SIZE),
      total: sorted.length,
    }
  }, [transfers, historyPage])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">课程转移</h2>
        <p className="text-muted-foreground mt-2">
          将源订单剩余课时转移至目标订单，支持年级升级和跨学员转移。转移完成后需提醒财务线下处理鼎伴学课时。
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="create">发起转移</TabsTrigger>
          <TabsTrigger value="history">
            转移记录
            {transfers.filter(t => t.dingbanxueReminderStatus === "PENDING").length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center rounded-full">
                {transfers.filter(t => t.dingbanxueReminderStatus === "PENDING").length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ====== 发起转移 Tab ====== */}
        <TabsContent value="create">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2 space-y-6">

              {/* Step 1: 选择源订单 */}
              <Card className={step < 1 ? "opacity-50 pointer-events-none" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className={`flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold ${step > 1 ? "bg-green-100 text-green-700" : "bg-primary text-primary-foreground"}`}>
                        {step > 1 ? "✓" : "1"}
                      </span>
                      选择源订单
                    </CardTitle>
                    {step > 1 && sourceOrder && (
                      <Badge variant="outline">{sourceStudentName} · {sourceOrder.subject} · {sourceOrder.grade}</Badge>
                    )}
                  </div>
                </CardHeader>
                {step === 1 && (
                  <CardContent className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索学员姓名 / 手机号 / 订单号 / 科目"
                        value={sourceSearch}
                        onChange={e => { setSourceSearch(e.target.value); setSourceDropdownOpen(true) }}
                        onFocus={() => setSourceDropdownOpen(true)}
                        className="pl-9"
                      />
                      {sourceDropdownOpen && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-64 overflow-y-auto">
                          {filteredSourceOrders.length === 0 ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">无匹配订单</div>
                          ) : (
                            filteredSourceOrders.map(o => {
                              const sName = students.find(s => s.id === o.studentId)?.name ?? ""
                              return (
                                <button
                                  key={o.id}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                                  onClick={() => {
                                    setSourceOrder(o)
                                    setSourceSearch("")
                                    setSourceDropdownOpen(false)
                                    setTargetSubject(o.subject)
                                  }}
                                >
                                  <span>{sName} · {o.subject} · {o.grade}</span>
                                  <span className="text-muted-foreground">剩余 {o.remainingHours} 课时</span>
                                </button>
                              )
                            })
                          )}
                        </div>
                      )}
                    </div>
                    {sourceOrder && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-muted/50 rounded-lg text-sm">
                        <div><span className="text-muted-foreground">学员</span><br />{sourceStudentName}</div>
                        <div><span className="text-muted-foreground">科目</span><br />{sourceOrder.subject}</div>
                        <div><span className="text-muted-foreground">年级</span><br />{sourceOrder.grade}</div>
                        <div><span className="text-muted-foreground">剩余课时</span><br />{sourceOrder.remainingHours} 课时</div>
                      </div>
                    )}
                    <div className="flex justify-end">
                      <Button disabled={!isStep1Valid} onClick={() => setStep(2)}>
                        下一步
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Step 2: 转移配置 */}
              <Card className={step < 2 ? "opacity-50 pointer-events-none" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className={`flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold ${step > 2 ? "bg-green-100 text-green-700" : step === 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      {step > 2 ? "✓" : "2"}
                    </span>
                    转移配置
                  </CardTitle>
                </CardHeader>
                {step === 2 && (
                  <CardContent className="space-y-5">
                    <div className="space-y-3">
                      <Label>转移类型</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {TRANSFER_TYPE_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            className={`p-3 border rounded-lg text-left text-sm transition-colors ${transferType === opt.value ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}
                            onClick={() => {
                              setTransferType(opt.value as TransferType)
                              setTargetGrade("")
                              setTargetStudentId("")
                              setTargetOrder(null)
                              setTargetMode("existing")
                            }}
                          >
                            <div className="font-medium">{opt.label}</div>
                            <div className="text-muted-foreground text-xs mt-1">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>转移课时数</Label>
                        <Input
                          type="number"
                          min={0.5}
                          max={maxTransferHours}
                          step={0.5}
                          value={transferHours}
                          onChange={e => setTransferHours(e.target.value)}
                          placeholder={`最多 ${maxTransferHours} 课时`}
                        />
                        <p className="text-xs text-muted-foreground">
                          可转移范围：0.5 ~ {maxTransferHours} 课时，步长 0.5
                        </p>
                      </div>

                      {transferType === TransferType.GRADE_UPGRADE && sourceOrder && (
                        <div className="space-y-2">
                          <Label>目标年级</Label>
                          <Select value={targetGrade} onValueChange={setTargetGrade}>
                            <SelectTrigger>
                              <SelectValue placeholder="选择升级后年级" />
                            </SelectTrigger>
                            <SelectContent>
                              {GRADE_OPTIONS.filter(g => g !== sourceOrder.grade).map(g => (
                                <SelectItem key={g} value={g}>{g}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {transferType === TransferType.GRADE_UPGRADE && sourceOrder && (
                        <div className="space-y-2">
                          <Label>目标科目（默认与源一致）</Label>
                          <Input
                            value={targetSubject}
                            onChange={e => setTargetSubject(e.target.value)}
                            placeholder={sourceOrder.subject}
                          />
                        </div>
                      )}
                    </div>

                    {transferType === TransferType.CROSS_STUDENT && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label>目标学员</Label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="搜索学员姓名 / 手机号"
                              value={targetStudentSearch}
                              onChange={e => { setTargetStudentSearch(e.target.value); setTargetStudentDropdownOpen(true) }}
                              onFocus={() => setTargetStudentDropdownOpen(true)}
                              className="pl-9"
                            />
                            {targetStudentDropdownOpen && (
                              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                {filteredTargetStudents.length === 0 ? (
                                  <div className="px-3 py-2 text-sm text-muted-foreground">无匹配学员</div>
                                ) : (
                                  filteredTargetStudents.map(s => (
                                    <button
                                      key={s.id}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                                      onClick={() => {
                                        setTargetStudentId(s.id)
                                        setTargetStudentSearch("")
                                        setTargetStudentDropdownOpen(false)
                                        setTargetOrder(null)
                                      }}
                                    >
                                      {s.name} · {s.grade} · {s.phone}
                                    </button>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                          {targetStudentId && (
                            <Badge variant="outline">
                              {students.find(s => s.id === targetStudentId)?.name}
                            </Badge>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>目标订单</Label>
                          <div className="flex gap-2 mb-2">
                            <Button
                              size="sm"
                              variant={targetMode === "existing" ? "default" : "outline"}
                              onClick={() => setTargetMode("existing")}
                            >
                              选择已有订单
                            </Button>
                            <Button
                              size="sm"
                              variant={targetMode === "new" ? "default" : "outline"}
                              onClick={() => { setTargetMode("new"); setTargetOrder(null) }}
                            >
                              新建目标订单
                            </Button>
                          </div>

                          {targetMode === "existing" && targetStudentId && (
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="搜索目标学员的订单"
                                value={targetOrderSearch}
                                onChange={e => { setTargetOrderSearch(e.target.value); setTargetOrderDropdownOpen(true) }}
                                onFocus={() => setTargetOrderDropdownOpen(true)}
                                className="pl-9"
                              />
                              {targetOrderDropdownOpen && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                                  {filteredTargetOrders.length === 0 ? (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">无匹配订单</div>
                                  ) : (
                                    filteredTargetOrders.map(o => {
                                      const sName = students.find(s => s.id === o.studentId)?.name ?? ""
                                      return (
                                        <button
                                          key={o.id}
                                          className="w-full px-3 py-2 text-left text-sm hover:bg-accent flex items-center justify-between"
                                          onClick={() => {
                                            setTargetOrder(o)
                                            setTargetOrderSearch("")
                                            setTargetOrderDropdownOpen(false)
                                            setTargetGrade(o.grade)
                                            setTargetSubject(o.subject)
                                          }}
                                        >
                                          <span>{sName} · {o.subject} · {o.grade}</span>
                                          <span className="text-muted-foreground">剩余 {o.remainingHours} 课时</span>
                                        </button>
                                      )
                                    })
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          {targetMode === "existing" && targetOrder && (
                            <div className="grid grid-cols-3 gap-2 p-2 bg-muted/50 rounded text-sm">
                              <div><span className="text-muted-foreground">科目</span><br />{targetOrder.subject}</div>
                              <div><span className="text-muted-foreground">年级</span><br />{targetOrder.grade}</div>
                              <div><span className="text-muted-foreground">剩余课时</span><br />{targetOrder.remainingHours}</div>
                            </div>
                          )}

                          {targetMode === "new" && targetStudentId && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs">目标年级</Label>
                                  <Select value={targetGrade} onValueChange={setTargetGrade}>
                                    <SelectTrigger><SelectValue placeholder="选择年级" /></SelectTrigger>
                                    <SelectContent>
                                      {GRADE_OPTIONS.map(g => (
                                        <SelectItem key={g} value={g}>{g}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">目标科目</Label>
                                  <Input
                                    value={targetSubject}
                                    onChange={e => setTargetSubject(e.target.value)}
                                    placeholder={sourceOrder?.subject ?? "科目"}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(1)}>上一步</Button>
                      <Button disabled={!isStep2Valid} onClick={() => setStep(3)}>下一步</Button>
                    </div>
                  </CardContent>
                )}
              </Card>

              {/* Step 3: 差额处理 & 确认 */}
              <Card className={step < 3 ? "opacity-50 pointer-events-none" : ""}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="flex items-center justify-center h-7 w-7 rounded-full text-sm font-bold bg-primary text-primary-foreground">
                      3
                    </span>
                    确认转移
                  </CardTitle>
                </CardHeader>
                {step === 3 && calcResult && (
                  <CardContent className="space-y-5">
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2 text-sm">
                      <div className="font-medium">转移概要</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-muted-foreground">源订单</span>
                          <div>{sourceStudentName} · {sourceOrder!.subject} · {sourceOrder!.grade}</div>
                          <div>转出 {transferHours} 课时 × {calcResult.sourceNetUnitPrice} 元/课时（净价）= {calcResult.sourceValue} 元</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">目标订单</span>
                          <div>{targetStudentName || sourceStudentName} · {effectiveTargetSubject} · {effectiveTargetGrade}</div>
                          <div>获得 {calcResult.targetReceivedHours} 课时 × {calcResult.targetNetUnitPrice} 元/课时（净价）= {calcResult.targetValue} 元</div>
                        </div>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center">
                        <span className="font-medium">差额</span>
                        <span className={`font-bold text-lg ${calcResult.priceDifference > 0 ? "text-orange-600" : calcResult.priceDifference < 0 ? "text-green-600" : ""}`}>
                          {calcResult.priceDifference > 0 ? `需补缴 ${calcResult.priceDifference} 元` :
                           calcResult.priceDifference < 0 ? `需退款 ${Math.abs(calcResult.priceDifference)} 元` :
                           "无差额"}
                        </span>
                      </div>
                      {Number(transferHours) > 0 && (
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          鼎伴学课时 {Number(transferHours)} 课时需线下转移（{DINGBANXUE_PER_HOUR} 元/课时固定成本不计入本次资金转移）
                        </div>
                      )}
                    </div>

                    {calcResult.priceDifference > 0 && (
                      <div className="space-y-2 border-t pt-4">
                        <Label>补缴凭证截图</Label>
                        <p className="text-xs text-muted-foreground">请上传家长补缴差价的支付凭证</p>
                        <div className="flex flex-wrap gap-2">
                          {supplementaryVouchers.map((v, i) => (
                            <div key={i} className="relative w-20 h-20 border rounded overflow-hidden">
                              <img src={v} alt={`凭证${i + 1}`} className="w-full h-full object-cover" />
                              <button
                                className="absolute top-0 right-0 bg-black/60 text-white rounded-bl p-0.5"
                                onClick={() => removeVoucher(i)}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <label className="w-20 h-20 border-2 border-dashed rounded flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                            <Upload className="h-5 w-5 text-muted-foreground" />
                            <input
                              ref={voucherInputRef}
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleVoucherUpload}
                            />
                          </label>
                        </div>
                      </div>
                    )}

                    {calcResult.priceDifference < 0 && (
                      <div className="space-y-2 border-t pt-4">
                        <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-800 rounded-lg text-sm">
                          <Info className="h-4 w-4 shrink-0" />
                          <span>系统将自动创建退款申请（{Math.abs(calcResult.priceDifference)} 元），走退费双审流程。财务审核通过后手动打款至家长支付宝。</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 border-t pt-4">
                      <Label>备注信息</Label>
                      <Textarea
                        value={remarks}
                        onChange={e => setRemarks(e.target.value)}
                        placeholder="填写转移原因、备注信息等"
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setStep(2)}>上一步</Button>
                      <Button
                        disabled={!isStep3Valid || isSubmitting}
                        onClick={handleSubmit}
                      >
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        确认转移
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* ====== 右侧预览区 ====== */}
            <div className="space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">操作步骤</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {[
                    { n: 1, label: "选择源订单（待转移课时的订单）" },
                    { n: 2, label: "配置转移参数（类型、课时、目标）" },
                    { n: 3, label: "确认转移并处理差额" },
                  ].map(s => (
                    <div key={s.n} className={`flex items-start gap-2 ${step >= s.n ? "" : "opacity-40"}`}>
                      <span className={`flex items-center justify-center h-5 w-5 rounded-full text-xs font-bold shrink-0 ${step > s.n ? "bg-green-100 text-green-700" : step === s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {s.n}
                      </span>
                      <span>{s.label}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-orange-500" />
                    <span className="text-xs">转移完成后需提醒财务线下处理鼎伴学课时转移</span>
                  </div>
                </CardContent>
              </Card>

              {sourceOrder && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">源订单信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">学员</span><span>{sourceStudentName}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">科目</span><span>{sourceOrder.subject}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">年级</span><span>{sourceOrder.grade}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">总课时</span><span>{sourceOrder.totalHours}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">剩余课时</span><span className="font-medium">{sourceOrder.remainingHours}</span></div>
                    <Separator />
                    <div className="flex justify-between"><span className="text-muted-foreground">含鼎伴学单价</span><span>{getLatestUnitPriceByGrade(sourceOrder.grade)} 元/课时</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">净课时单价</span><span>{getLatestUnitPriceByGrade(sourceOrder.grade) - DINGBANXUE_PER_HOUR} 元/课时</span></div>
                  </CardContent>
                </Card>
              )}

              {calcResult && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">转移计算明细</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">转移课时</span><span>{transferHours}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">源净价</span><span>{calcResult.sourceNetUnitPrice} 元/课时</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">源课时价值</span><span className="font-medium">{calcResult.sourceValue} 元</span></div>
                    <Separator />
                    <div className="flex justify-between"><span className="text-muted-foreground">目标净价</span><span>{calcResult.targetNetUnitPrice} 元/课时</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">目标获得课时</span><span className="font-medium">{calcResult.targetReceivedHours}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">目标课时价值</span><span>{calcResult.targetValue} 元</span></div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="font-medium">差额</span>
                      <span className={`font-bold ${calcResult.priceDifference > 0 ? "text-orange-600" : calcResult.priceDifference < 0 ? "text-green-600" : ""}`}>
                        {calcResult.priceDifference > 0 ? `+${calcResult.priceDifference}` : calcResult.priceDifference === 0 ? "0" : calcResult.priceDifference} 元
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ====== 转移记录 Tab ====== */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>转移记录</CardTitle>
              <CardDescription>共 {pagedTransfers.total} 条记录</CardDescription>
            </CardHeader>
            <CardContent>
              {pagedTransfers.items.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">暂无转移记录</div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>时间</TableHead>
                        <TableHead>类型</TableHead>
                        <TableHead>源订单</TableHead>
                        <TableHead>目标订单</TableHead>
                        <TableHead>转移课时</TableHead>
                        <TableHead>获得课时</TableHead>
                        <TableHead>差额</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>鼎伴学</TableHead>
                        <TableHead>操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedTransfers.items.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="whitespace-nowrap text-sm">
                            {new Date(t.createdAt).toLocaleDateString("zh-CN")} {new Date(t.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {t.type === TransferType.GRADE_UPGRADE ? "年级升级" : "跨学员"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{t.sourceStudentName}</div>
                            <div className="text-muted-foreground text-xs">{t.sourceSubject} · {t.sourceGrade}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div>{t.targetStudentName}</div>
                            <div className="text-muted-foreground text-xs">{t.targetSubject} · {t.targetGrade}</div>
                          </TableCell>
                          <TableCell className="text-sm">{t.sourceTransferredHours}</TableCell>
                          <TableCell className="text-sm">{t.targetReceivedHours}</TableCell>
                          <TableCell className="text-sm">
                            {t.priceDifference > 0 ? (
                              <span className="text-orange-600">+{t.priceDifference}</span>
                            ) : t.priceDifference < 0 ? (
                              <span className="text-green-600">{t.priceDifference}</span>
                            ) : (
                              <span>0</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_MAP[t.status]?.color ?? "outline"}>
                              {STATUS_MAP[t.status]?.label ?? t.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {t.dingbanxueReminderStatus === "PENDING" ? (
                              <Badge variant="destructive" className="cursor-pointer" onClick={() => handleConfirmDingbanxue(t)}>
                                <Clock className="h-3 w-3 mr-1" />
                                待处理
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600">
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                已确认
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => { setDetailTransfer(t); setDetailDialogOpen(true) }}>
                                详情
                              </Button>
                              {(t.status === TransferStatus.PENDING_FIRST_REVIEW || t.status === TransferStatus.FIRST_REJECTED) && (
                                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleCancelTransfer(t)}>
                                  取消
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {pagedTransfers.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-sm text-muted-foreground">
                        第 {historyPage} / {pagedTransfers.totalPages} 页
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={historyPage <= 1}
                          onClick={() => setHistoryPage(p => p - 1)}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={historyPage >= pagedTransfers.totalPages}
                          onClick={() => setHistoryPage(p => p + 1)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ====== 转移详情弹窗 ====== */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>转移详情</DialogTitle>
            <DialogDescription>转移编号：{detailTransfer?.id}</DialogDescription>
          </DialogHeader>
          {detailTransfer && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-medium mb-2 text-muted-foreground">源订单</div>
                  <div className="space-y-1">
                    <div>学员：{detailTransfer.sourceStudentName}</div>
                    <div>科目：{detailTransfer.sourceSubject} · 年级：{detailTransfer.sourceGrade}</div>
                    <div>转出课时：{detailTransfer.sourceTransferredHours}</div>
                    <div>净单价：{detailTransfer.sourceNetUnitPrice} 元/课时</div>
                    <div>课时价值：{detailTransfer.sourceValue} 元</div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2 text-muted-foreground">目标订单</div>
                  <div className="space-y-1">
                    <div>学员：{detailTransfer.targetStudentName}</div>
                    <div>科目：{detailTransfer.targetSubject} · 年级：{detailTransfer.targetGrade}</div>
                    <div>获得课时：{detailTransfer.targetReceivedHours}</div>
                    <div>净单价：{detailTransfer.targetNetUnitPrice} 元/课时</div>
                    <div>课时价值：{detailTransfer.targetValue} 元</div>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="font-medium">差额</span>
                <span className={`font-bold ${detailTransfer.priceDifference > 0 ? "text-orange-600" : detailTransfer.priceDifference < 0 ? "text-green-600" : ""}`}>
                  {detailTransfer.priceDifference > 0 ? `补缴 ${detailTransfer.priceDifference} 元` :
                   detailTransfer.priceDifference < 0 ? `退款 ${Math.abs(detailTransfer.priceDifference)} 元` :
                   "无差额"}
                </span>
              </div>
              {detailTransfer.remarks && (
                <>
                  <Separator />
                  <div>
                    <span className="font-medium">备注</span>
                    <div className="mt-1 text-muted-foreground">{detailTransfer.remarks}</div>
                  </div>
                </>
              )}
              {detailTransfer.supplementaryVouchers && detailTransfer.supplementaryVouchers.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <span className="font-medium">补缴凭证</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {detailTransfer.supplementaryVouchers.map((v, i) => (
                        <img key={i} src={v} alt={`凭证${i + 1}`} className="w-24 h-24 object-cover border rounded" />
                      ))}
                    </div>
                  </div>
                </>
              )}
              {detailTransfer.refundApplicationId && (
                <div className="flex items-center gap-2 p-2 bg-blue-50 text-blue-800 rounded">
                  <Info className="h-4 w-4 shrink-0" />
                  <span>已自动创建退费申请：{detailTransfer.refundApplicationId}</span>
                </div>
              )}
              <Separator />
              <div className="flex items-center justify-between">
                <span className="font-medium">鼎伴学课时转移</span>
                {detailTransfer.dingbanxueReminderStatus === "PENDING" ? (
                  <Button size="sm" variant="outline" onClick={() => { handleConfirmDingbanxue(detailTransfer); setDetailTransfer({ ...detailTransfer, dingbanxueReminderStatus: "CONFIRMED" }) }}>
                    确认已完成
                  </Button>
                ) : (
                  <Badge variant="outline" className="text-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> 已确认
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                转移课时数：{detailTransfer.sourceTransferredHours} 课时 × {DINGBANXUE_PER_HOUR} 元/课时 = {detailTransfer.sourceTransferredHours * DINGBANXUE_PER_HOUR} 元（线下鼎伴学平台处理）
              </div>
              <Separator />
              <div className="text-xs text-muted-foreground">
                操作人：{detailTransfer.createdByName} · {new Date(detailTransfer.createdAt).toLocaleString("zh-CN")}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 点击空白关闭下拉 */}
      {(sourceDropdownOpen || targetStudentDropdownOpen || targetOrderDropdownOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setSourceDropdownOpen(false)
            setTargetStudentDropdownOpen(false)
            setTargetOrderDropdownOpen(false)
          }}
        />
      )}
    </div>
  )
}
