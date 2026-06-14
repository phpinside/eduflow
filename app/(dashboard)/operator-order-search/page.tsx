"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  RefreshCw,
  ArrowRight,
  ArrowRightLeft,
  Plus,
  Loader2,
  ShoppingCart,
  Copy,
  History,
} from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"
import {
  Order,
  OrderStatus,
  OrderType,
  Transaction,
  Student,
  User,
  RefundApplication,
  Role,
} from "@/types"
import {
  getStoredOrders,
  saveStoredOrders,
  getStoredStudents,
  getStoredUsers,
  getStoredRefundApplications,
  saveRefundApplications,
  getStoredCoachChangeRecords,
} from "@/lib/storage"
import { getLatestUnitPriceByGrade, LATEST_GRADE_UNIT_PRICE } from "@/lib/course-pricing"
import { computePricingBreakdown, DINGBANXUE_FEE_PER_HOUR } from "@/lib/order-pricing"
import { RefundApplyDialog } from "@/components/refund/refund-apply-dialog"
import { ChangeCoachDialog, CoachChangeHistoryDialog } from "@/components/order/change-coach-dialog"
import { ORDER_STATUS_MAP, ORDER_STATUS_COLOR_MAP } from "@/lib/order-constants"

const GRADES = [
  "四年级", "五年级", "六年级",
  "初一", "初二", "初三",
  "高一", "高二", "高三",
]

const SUBJECTS = ["数学", "语文", "英语", "物理", "化学", "生物", "历史", "地理", "政治"]

const GENDERS = ["男", "女"] as const

const WEEKDAYS = [
  { value: "monday", label: "周一" },
  { value: "tuesday", label: "周二" },
  { value: "wednesday", label: "周三" },
  { value: "thursday", label: "周四" },
  { value: "friday", label: "周五" },
  { value: "saturday", label: "周六" },
  { value: "sunday", label: "周日" },
]

const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2)
  const minutes = (i % 2) * 30
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
})

const PAGE_SIZE = 10

const CONVERSION_REWARD_BY_GRADE: Record<string, number> = {
  "四年级": 100, "五年级": 100, "六年级": 100,
  "初一": 150, "初二": 150, "初三": 150,
  "高一": 200, "高二": 200, "高三": 200,
}

function getConversionRewardFee(grade: string): number {
  return CONVERSION_REWARD_BY_GRADE[grade] ?? 100
}

interface WeeklyScheduleItem {
  day: string
  startTime: string
  endTime: string
}

export default function OperatorOrderSearchPage() {
  const { user } = useAuth()

  const [orders, setOrders] = React.useState<Order[]>([])
  const [students, setStudents] = React.useState<Student[]>([])
  const [users, setUsers] = React.useState<User[]>([])
  const [refundApps, setRefundApps] = React.useState<RefundApplication[]>([])

  const [searchSubject, setSearchSubject] = React.useState("ALL")
  const [searchType, setSearchType] = React.useState("ALL")
  const [searchStudentName, setSearchStudentName] = React.useState("")
  const [searchStatus, setSearchStatus] = React.useState("ALL")
  const [searchGrade, setSearchGrade] = React.useState("ALL")
  const [searchOrderId, setSearchOrderId] = React.useState("")
  const [page, setPage] = React.useState(1)

  const [renewOpen, setRenewOpen] = React.useState(false)
  const [renewOrder, setRenewOrder] = React.useState<Order | null>(null)
  const [renewHours, setRenewHours] = React.useState(10)
  const [renewGrade, setRenewGrade] = React.useState("")

  const [refundOpen, setRefundOpen] = React.useState(false)
  const [refundOrder, setRefundOrder] = React.useState<Order | null>(null)

  const [changeCoachOpen, setChangeCoachOpen] = React.useState(false)
  const [changeCoachOrder, setChangeCoachOrder] = React.useState<Order | null>(null)
  const [coachHistoryOpen, setCoachHistoryOpen] = React.useState(false)
  const [coachHistoryOrder, setCoachHistoryOrder] = React.useState<Order | null>(null)

  const [trialOpen, setTrialOpen] = React.useState(false)
  const [regularOpen, setRegularOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // ====== Trial Form State ======
  const [trialForm, setTrialForm] = React.useState({
    studentName: "",
    gender: "男" as string,
    subject: "",
    grade: "",
    region: "",
    school: "",
    lastExamScore: "",
    examMaxScore: "",
    otherSubjectsAvg: "",
    textbookVersion: "",
    schoolProgress: "",
    tutoringHistory: "",
    parentPhone: "",
    campusName: "",
    campusAccount: "",
    studentAccount: "",
    trialTime1: "",
    trialTime2: "",
    trialTime3: "",
    remarks: "",
  })

  // ====== Regular Form State ======
  const [regularForm, setRegularForm] = React.useState({
    studentName: "",
    gender: "男" as string,
    subject: "",
    grade: "",
    region: "",
    school: "",
    lastExamScore: "",
    examMaxScore: "",
    textbookVersion: "",
    schoolLearningProgress: "",
    otherSubjectsAvgScore: "",
    previousTutoringTypes: "",
    parentPhone: "",
    needsDingbanxueRecharge: true,
    campusName: "",
    campusAccount: "",
    studentAccount: "",
    totalHours: 20,
    schedulingPattern: "WEEKLY" as string,
    intervalDays: 2,
    firstClassDate: "",
    firstClassStartTime: "",
    firstClassEndTime: "",
    remarks: "",
    fromTrialConversion: false,
  })
  const [regularWeeklySchedule, setRegularWeeklySchedule] = React.useState<WeeklyScheduleItem[]>([])
  const [includeConversionReward, setIncludeConversionReward] = React.useState(false)
  const [conversionRewardCoachId, setConversionRewardCoachId] = React.useState("")
  const [conversionRewardCoachName, setConversionRewardCoachName] = React.useState("")
  const [conversionRewardCoachSearch, setConversionRewardCoachSearch] = React.useState("")

  const reload = React.useCallback(() => {
    setOrders(getStoredOrders())
    setStudents(getStoredStudents())
    setUsers(getStoredUsers())
    setRefundApps(getStoredRefundApplications())
  }, [])

  React.useEffect(() => { reload() }, [reload])

  const getStudentName = (sid: string) => students.find(s => s.id === sid)?.name ?? sid
  const getStudent = (sid: string) => students.find(s => s.id === sid)

  const filtered = React.useMemo(() => {
    let list = orders
    if (searchType !== "ALL") list = list.filter(o => o.type === searchType)
    if (searchSubject !== "ALL") list = list.filter(o => o.subject === searchSubject)
    if (searchGrade !== "ALL") list = list.filter(o => o.grade === searchGrade)
    if (searchStatus !== "ALL") list = list.filter(o => o.status === searchStatus)
    if (searchOrderId.trim()) {
      const q = searchOrderId.toLowerCase()
      list = list.filter(o => o.id.toLowerCase().includes(q))
    }
    if (searchStudentName.trim()) {
      const q = searchStudentName.toLowerCase()
      list = list.filter(o => {
        const sn = getStudentName(o.studentId).toLowerCase()
        return sn.includes(q)
      })
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [orders, searchType, searchSubject, searchGrade, searchStatus, searchOrderId, searchStudentName, students])

  const paged = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return { items: filtered.slice(start, start + PAGE_SIZE), total: filtered.length, pages: Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)) }
  }, [filtered, page])

  React.useEffect(() => { setPage(1) }, [searchType, searchSubject, searchGrade, searchStatus, searchStudentName, searchOrderId])

  // ====== Helpers ======

  const findOrCreateStudent = (name: string, phone: string, grade: string, gender?: string): string => {
    const existing = students.find(s => s.name === name && s.phone === phone)
    if (existing) return existing.id
    const now = new Date()
    const newId = `stu-${Date.now()}`
    const newStudent: Student = {
      id: newId,
      name,
      grade,
      gender: gender ?? "未知",
      phone,
      parentName: "",
      parentPhone: phone,
      createdAt: now,
      updatedAt: now,
    }
    const allStudents = getStoredStudents()
    allStudents.push(newStudent)
    setStudents(allStudents)
    return newId
  }

  const openRenew = (order: Order) => {
    setRenewOrder(order)
    setRenewGrade(order.grade)
    setRenewHours(10)
    setRenewOpen(true)
  }

  const handleRenew = () => {
    if (!renewOrder || !user) return
    const pricePerHour = getLatestUnitPriceByGrade(renewGrade)
    const now = new Date()
    const nextOrders = getStoredOrders()
    const idx = nextOrders.findIndex(o => o.id === renewOrder.id)
    if (idx < 0) { toast.error("订单不存在"); return }

    const amount = pricePerHour * renewHours
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      type: "RENEWAL",
      amount,
      hours: renewHours,
      createdAt: now,
    }
    nextOrders[idx] = {
      ...nextOrders[idx],
      totalHours: nextOrders[idx].totalHours + renewHours,
      remainingHours: nextOrders[idx].remainingHours + renewHours,
      price: nextOrders[idx].price + amount,
      transactions: [...(nextOrders[idx].transactions ?? []), tx],
      updatedAt: now,
    }
    saveStoredOrders(nextOrders)
    reload()
    setRenewOpen(false)
    toast.success(`续费成功：${renewHours} 课时，金额 ¥${amount.toLocaleString()}`)
  }

  // ====== Trial Submit ======
  const handleTrialSubmit = () => {
    if (!trialForm.studentName || !trialForm.grade || !trialForm.subject || !trialForm.parentPhone || !user) {
      toast.error("请填写必填项（学员姓名、科目、年级、家长手机号）")
      return
    }
    setIsSubmitting(true)

    const now = new Date()
    const studentId = findOrCreateStudent(
      trialForm.studentName,
      trialForm.parentPhone,
      trialForm.grade,
      trialForm.gender,
    )

    const trialTimeSlots: string[] = []
    if (trialForm.trialTime1) trialTimeSlots.push(trialForm.trialTime1)
    if (trialForm.trialTime2) trialTimeSlots.push(trialForm.trialTime2)
    if (trialForm.trialTime3) trialTimeSlots.push(trialForm.trialTime3)

    const pricePerHour = getLatestUnitPriceByGrade(trialForm.grade)

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      type: OrderType.TRIAL,
      status: OrderStatus.PENDING,
      studentId,
      salesPersonId: "",
      subject: trialForm.subject,
      grade: trialForm.grade,
      totalHours: 1,
      remainingHours: 1,
      price: pricePerHour,
      scheduledAt: trialForm.trialTime1 ? new Date(trialForm.trialTime1) : undefined,
      trialTimeSlots: trialTimeSlots.length > 0 ? trialTimeSlots : undefined,
      lastExamScore: trialForm.lastExamScore || undefined,
      examMaxScore: trialForm.examMaxScore || undefined,
      otherSubjectsAvgScore: trialForm.otherSubjectsAvg || undefined,
      textbookVersion: trialForm.textbookVersion || undefined,
      schoolProgress: trialForm.schoolProgress || undefined,
      previousTutoringTypes: trialForm.tutoringHistory || undefined,
      campusName: trialForm.campusName || undefined,
      campusAccount: trialForm.campusAccount || undefined,
      studentAccount: trialForm.studentAccount || undefined,
      remarks: trialForm.remarks || undefined,
      trialPaymentMethod: "OFFLINE",
      isPaid: false,
      createdAt: now,
      updatedAt: now,
    }

    const nextOrders = getStoredOrders()
    nextOrders.unshift(newOrder)
    saveStoredOrders(nextOrders)
    reload()
    setTrialOpen(false)
    setIsSubmitting(false)
    toast.success("试课单已创建（线下支付，待接单）")
  }

  // ====== Regular Submit ======
  const handleRegularSubmit = () => {
    if (!regularForm.studentName || !regularForm.grade || !regularForm.subject || !regularForm.parentPhone || !user) {
      toast.error("请填写必填项（学员姓名、科目、年级、家长手机号）")
      return
    }
    if (!regularForm.needsDingbanxueRecharge && (!regularForm.campusName?.trim() || !regularForm.campusAccount?.trim() || !regularForm.studentAccount?.trim())) {
      toast.error("不代充鼎伴学费用时，校区名称/校区账号/学生账号为必填")
      return
    }
    if (regularForm.fromTrialConversion && !conversionRewardCoachId) {
      toast.error("请选择转正红包归属教练")
      return
    }
    setIsSubmitting(true)

    const now = new Date()
    const pricePerHour = getLatestUnitPriceByGrade(regularForm.grade)
    const totalCost = pricePerHour * regularForm.totalHours
    const dingbanxueDeduction = regularForm.needsDingbanxueRecharge ? 0 : DINGBANXUE_FEE_PER_HOUR * regularForm.totalHours
    const courseFee = Math.max(0, totalCost - dingbanxueDeduction)

    const studentId = findOrCreateStudent(
      regularForm.studentName,
      regularForm.parentPhone,
      regularForm.grade,
      regularForm.gender,
    )

    const conversionRewardFee = regularForm.fromTrialConversion
      ? getConversionRewardFee(regularForm.grade)
      : 0

    const pricing = computePricingBreakdown({
      subject: regularForm.subject,
      grade: regularForm.grade,
      totalHours: regularForm.totalHours,
      courseFee,
      fromTrialConversion: regularForm.fromTrialConversion,
      conversionRewardFee,
      includeConversionRewardInPayment: regularForm.fromTrialConversion && includeConversionReward,
      dingbanxueFeeApplicable: true,
      includeDingbanxueFeeInPayment: regularForm.needsDingbanxueRecharge,
    })

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      type: OrderType.REGULAR,
      status: OrderStatus.PENDING_CS_REVIEW,
      studentId,
      salesPersonId: "",
      subject: regularForm.subject,
      grade: regularForm.grade,
      totalHours: regularForm.totalHours,
      remainingHours: regularForm.totalHours,
      price: pricing.totalPayable,
      isPaid: true,
      lastExamScore: regularForm.lastExamScore || undefined,
      examMaxScore: regularForm.examMaxScore || undefined,
      textbookVersion: regularForm.textbookVersion || undefined,
      schoolProgress: regularForm.schoolLearningProgress || undefined,
      otherSubjectsAvgScore: regularForm.otherSubjectsAvgScore || undefined,
      previousTutoringTypes: regularForm.previousTutoringTypes || undefined,
      campusName: regularForm.campusName || undefined,
      campusAccount: regularForm.campusAccount || undefined,
      studentAccount: regularForm.studentAccount || undefined,
      needsDingbanxueRecharge: regularForm.needsDingbanxueRecharge,
      includeDingbanxueFeeInPayment: regularForm.needsDingbanxueRecharge,
      conversionRewardFee: regularForm.fromTrialConversion && includeConversionReward ? conversionRewardFee : undefined,
      conversionRewardPaidMode: regularForm.fromTrialConversion && includeConversionReward ? "BUNDLED" : undefined,
      conversionRewardCoachId: regularForm.fromTrialConversion ? conversionRewardCoachId || undefined : undefined,
      conversionRewardCoachName: regularForm.fromTrialConversion ? conversionRewardCoachName || undefined : undefined,
      weeklySchedule: regularForm.schedulingPattern === "WEEKLY" && regularWeeklySchedule.length > 0 ? regularWeeklySchedule : undefined,
      firstLessonTime: regularForm.firstClassDate ? `${regularForm.firstClassDate} ${regularForm.firstClassStartTime || ""}-${regularForm.firstClassEndTime || ""}` : undefined,
      remarks: regularForm.remarks || undefined,
      transactions: [{
        id: `tx-${Date.now()}`,
        type: "INITIAL",
        amount: pricing.totalPayable,
        hours: regularForm.totalHours,
        createdAt: now,
      }],
      createdAt: now,
      updatedAt: now,
    }

    const nextOrders = getStoredOrders()
    nextOrders.unshift(newOrder)
    saveStoredOrders(nextOrders)
    reload()
    closeRegularDialog()
    setIsSubmitting(false)
    toast.success("正课单已提交，进入客服审核流程")
  }

  const closeRegularDialog = () => {
    setRegularOpen(false)
    setRegularWeeklySchedule([])
    setIncludeConversionReward(false)
    setConversionRewardCoachId("")
    setConversionRewardCoachName("")
    setConversionRewardCoachSearch("")
    setRegularForm({
      studentName: "", gender: "男", subject: "", grade: "",
      region: "", school: "",
      lastExamScore: "", examMaxScore: "", textbookVersion: "",
      schoolLearningProgress: "", otherSubjectsAvgScore: "", previousTutoringTypes: "",
      parentPhone: "",
      needsDingbanxueRecharge: true,
      campusName: "", campusAccount: "", studentAccount: "",
      totalHours: 20, schedulingPattern: "WEEKLY", intervalDays: 2,
      firstClassDate: "", firstClassStartTime: "", firstClassEndTime: "",
      remarks: "",
      fromTrialConversion: false,
    })
  }

  const toggleWeekday = (dayValue: string) => {
    const exists = regularWeeklySchedule.find(s => s.day === dayValue)
    if (exists) {
      setRegularWeeklySchedule(prev => prev.filter(s => s.day !== dayValue))
    } else {
      setRegularWeeklySchedule(prev => [...prev, { day: dayValue, startTime: "18:00", endTime: "20:00" }])
    }
  }

  const updateScheduleTime = (dayValue: string, field: 'startTime' | 'endTime', value: string) => {
    setRegularWeeklySchedule(prev => prev.map(s => s.day === dayValue ? { ...s, [field]: value } : s))
  }

  const tf = (field: keyof typeof trialForm, value: string) => setTrialForm(f => ({ ...f, [field]: value }))
  const rf = (field: keyof typeof regularForm, value: string | number | boolean) => setRegularForm(f => ({ ...f, [field]: value }))

  const tutors = React.useMemo(() => users.filter(u => u.roles?.includes(Role.TUTOR)), [users])
  const filteredCoachOptions = React.useMemo(() => {
    if (!conversionRewardCoachSearch.trim()) return tutors
    const q = conversionRewardCoachSearch.toLowerCase()
    return tutors.filter(t => t.name.toLowerCase().includes(q))
  }, [tutors, conversionRewardCoachSearch])

  // ====== Regular pricing computed ======
  const regPricePerHour = regularForm.grade ? getLatestUnitPriceByGrade(regularForm.grade) : 0
  const regTotalCost = regPricePerHour * regularForm.totalHours
  const regDingbanxueDeduction = regularForm.needsDingbanxueRecharge ? 0 : DINGBANXUE_FEE_PER_HOUR * regularForm.totalHours
  const regCourseFee = Math.max(0, regTotalCost - regDingbanxueDeduction)
  const regDingbanxueFee = DINGBANXUE_FEE_PER_HOUR * regularForm.totalHours
  const regConversionRewardFee = regularForm.fromTrialConversion ? getConversionRewardFee(regularForm.grade) : 0
  const regPricing = computePricingBreakdown({
    subject: regularForm.subject,
    grade: regularForm.grade,
    totalHours: regularForm.totalHours,
    courseFee: regCourseFee,
    fromTrialConversion: regularForm.fromTrialConversion,
    conversionRewardFee: regConversionRewardFee,
    includeConversionRewardInPayment: regularForm.fromTrialConversion && includeConversionReward,
    dingbanxueFeeApplicable: true,
    includeDingbanxueFeeInPayment: regularForm.needsDingbanxueRecharge,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">全局订单处理</h2>
          <p className="text-muted-foreground mt-2">搜索和管理所有订单，支持试课转正、续费、退费、新建订单等操作。运营侧提交的订单视为线下支付，直接进入审核流程。</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => {
            setTrialForm({
              studentName: "", gender: "男", subject: "", grade: "",
              region: "", school: "",
              lastExamScore: "", examMaxScore: "", otherSubjectsAvg: "",
              textbookVersion: "", schoolProgress: "", tutoringHistory: "",
              parentPhone: "",
              campusName: "", campusAccount: "", studentAccount: "",
              trialTime1: "", trialTime2: "", trialTime3: "",
              remarks: "",
            })
            setTrialOpen(true)
          }}>
            <Plus className="h-4 w-4 mr-2" />新建试课单
          </Button>
          <Button variant="outline" onClick={() => {
            closeRegularDialog()
            setRegularOpen(true)
          }}>
            <ShoppingCart className="h-4 w-4 mr-2" />新建正课单
          </Button>
        </div>
      </div>

      {/* ====== Search Filters ====== */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">订单类型</Label>
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                <SelectItem value={OrderType.TRIAL}>试课</SelectItem>
                <SelectItem value={OrderType.REGULAR}>正课</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">科目</Label>
            <Select value={searchSubject} onValueChange={setSearchSubject}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">年级</Label>
            <Select value={searchGrade} onValueChange={setSearchGrade}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">状态</Label>
            <Select value={searchStatus} onValueChange={setSearchStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部</SelectItem>
                {Object.entries(ORDER_STATUS_MAP).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">学员姓名</Label>
            <Input placeholder="搜索..." value={searchStudentName} onChange={e => setSearchStudentName(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">订单号</Label>
            <Input placeholder="搜索..." value={searchOrderId} onChange={e => setSearchOrderId(e.target.value)} />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>共 {filtered.length} 条结果</span>
        <Button size="sm" variant="ghost" onClick={reload}><RefreshCw className="h-3 w-3 mr-1" />刷新</Button>
      </div>

      {/* ====== Order Table ====== */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>订单号</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>学员</TableHead>
            <TableHead>科目·年级</TableHead>
            <TableHead>课时</TableHead>
            <TableHead>金额</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paged.items.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">无匹配结果</TableCell></TableRow>
          ) : paged.items.map(order => {
            const sn = getStudentName(order.studentId)
            const isTrialCompleted = order.type === OrderType.TRIAL && order.status === OrderStatus.COMPLETED
            const isRegularInProgress = order.type === OrderType.REGULAR && (order.status === OrderStatus.IN_PROGRESS || order.status === OrderStatus.ASSIGNED)
            const canRefund = order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.REFUNDED && order.status !== OrderStatus.CANCEL_REQUESTED && !order.refundFreezeActive
            return (
              <TableRow key={order.id}>
                <TableCell className="font-mono text-xs">{order.id.slice(0, 16)}...</TableCell>
                <TableCell>
                  <Badge variant={order.type === OrderType.TRIAL ? "secondary" : "default"}>
                    {order.type === OrderType.TRIAL ? "试课" : "正课"}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">{sn}</TableCell>
                <TableCell>{order.subject} · {order.grade}</TableCell>
                <TableCell>{order.remainingHours}/{order.totalHours}</TableCell>
                <TableCell>¥{order.price.toLocaleString()}</TableCell>
                <TableCell>
                  <Badge variant={ORDER_STATUS_COLOR_MAP[order.status] ?? "outline"}>
                    {ORDER_STATUS_MAP[order.status] ?? order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {isTrialCompleted && (
                      <Button size="sm" variant="default" className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => {
                        const student = getStudent(order.studentId)
                        const trialCoach = users.find(u => u.id === order.assignedTeacherId)
                        setRegularForm({
                          studentName: sn,
                          gender: student?.gender ?? "男",
                          grade: order.grade,
                          subject: order.subject,
                          region: student?.address ?? "",
                          school: student?.school ?? "",
                          lastExamScore: order.lastExamScore ?? "",
                          examMaxScore: order.examMaxScore ?? "",
                          textbookVersion: order.textbookVersion ?? "",
                          schoolLearningProgress: order.schoolProgress ?? "",
                          otherSubjectsAvgScore: order.otherSubjectsAvgScore ?? "",
                          previousTutoringTypes: order.previousTutoringTypes ?? "",
                          parentPhone: student?.parentPhone ?? student?.phone ?? "",
                          needsDingbanxueRecharge: true,
                          campusName: order.campusName ?? "",
                          campusAccount: order.campusAccount ?? "",
                          studentAccount: order.studentAccount ?? "",
                          totalHours: 20,
                          schedulingPattern: "WEEKLY",
                          intervalDays: 2,
                          firstClassDate: "",
                          firstClassStartTime: "",
                          firstClassEndTime: "",
                          remarks: `试课转正：${order.id}`,
                          fromTrialConversion: true,
                        })
                        setRegularWeeklySchedule([])
                        setIncludeConversionReward(false)
                        setConversionRewardCoachSearch(trialCoach?.name ?? "")
                        setRegularOpen(true)
                      }}>
                        <ArrowRight className="h-3 w-3 mr-1" />转正课
                      </Button>
                    )}
                    {isRegularInProgress && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openRenew(order)}>
                        <RefreshCw className="h-3 w-3 mr-1" />续费
                      </Button>
                    )}
                    {order.type === OrderType.REGULAR && order.assignedTeacherId && (
                      <Button size="sm" variant="outline" className="h-7 text-xs text-orange-700 border-orange-300 hover:bg-orange-50" onClick={() => { setChangeCoachOrder(order); setChangeCoachOpen(true) }}>
                        <ArrowRightLeft className="h-3 w-3 mr-1" />换教练
                      </Button>
                    )}
                    {order.type === OrderType.REGULAR && getStoredCoachChangeRecords().some(r => r.orderId === order.id) && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setCoachHistoryOrder(order); setCoachHistoryOpen(true) }}>
                        <History className="h-3 w-3 mr-1" />记录
                      </Button>
                    )}
                    {canRefund && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setRefundOrder(order); setRefundOpen(true) }}>
                        退费
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(order.id); toast.success("已复制") }}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {paged.pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">第 {page}/{paged.pages} 页（共 {paged.total} 条）</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <Button size="sm" variant="outline" disabled={page >= paged.pages} onClick={() => setPage(page + 1)}>下一页</Button>
          </div>
        </div>
      )}

      {/* ====== Renew Dialog ====== */}
      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>正课续费（线下支付）</DialogTitle>
            <DialogDescription>为 {renewOrder ? getStudentName(renewOrder.studentId) : ""} 的 {renewOrder?.subject} 课程续费。运营侧操作，无需在线支付，直接生效。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>续费课时数</Label>
              <Input type="number" min={1} value={renewHours} onChange={e => setRenewHours(parseInt(e.target.value) || 0)} />
            </div>
            <div className="grid gap-2">
              <Label>年级（可调整）</Label>
              <Select value={renewGrade} onValueChange={setRenewGrade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="flex justify-between items-center bg-muted/50 p-3 rounded-md">
              <span className="text-sm text-muted-foreground">续费金额</span>
              <span className="font-bold text-lg">¥{(getLatestUnitPriceByGrade(renewGrade) * renewHours).toLocaleString()}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenewOpen(false)}>取消</Button>
            <Button onClick={handleRenew} disabled={renewHours <= 0}>确认续费</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== Refund Dialog ====== */}
      <RefundApplyDialog
        open={refundOpen}
        onOpenChange={setRefundOpen}
        order={refundOrder}
        user={user}
        orders={orders}
        onCommitted={(nextOrders, nextApps) => { setOrders(nextOrders); setRefundApps(nextApps) }}
      />

      {/* ====== New Trial Dialog ====== */}
      <Dialog open={trialOpen} onOpenChange={setTrialOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建试课单（线下支付）</DialogTitle>
            <DialogDescription>运营侧直接创建试课单，无需在线支付。表单内容与招生端一致。</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* Student Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">学生基本信息</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>学生姓名 *</Label>
                  <Input placeholder="真实姓名" value={trialForm.studentName} onChange={e => tf("studentName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>性别 *</Label>
                  <Select value={trialForm.gender} onValueChange={v => tf("gender", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>科目 *</Label>
                  <Select value={trialForm.subject} onValueChange={v => tf("subject", v)}>
                    <SelectTrigger><SelectValue placeholder="选择科目" /></SelectTrigger>
                    <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>年级 *</Label>
                  <Select value={trialForm.grade} onValueChange={v => tf("grade", v)}>
                    <SelectTrigger><SelectValue placeholder="选择年级" /></SelectTrigger>
                    <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>地区 *</Label>
                  <Input placeholder="省市区" value={trialForm.region} onChange={e => tf("region", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>学校名称</Label>
                  <Input placeholder="就读学校" value={trialForm.school} onChange={e => tf("school", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Academic Info */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">学习成绩信息</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>最近成绩</Label>
                  <Input placeholder="分数" value={trialForm.lastExamScore} onChange={e => tf("lastExamScore", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>卷面满分</Label>
                  <Input placeholder="如100、150" value={trialForm.examMaxScore} onChange={e => tf("examMaxScore", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>其它科平均成绩</Label>
                  <Input placeholder="如：85分" value={trialForm.otherSubjectsAvg} onChange={e => tf("otherSubjectsAvg", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>教材版本</Label>
                  <Input placeholder="版本" value={trialForm.textbookVersion} onChange={e => tf("textbookVersion", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>校内学习进度</Label>
                  <Input placeholder="如：已学到第五章" value={trialForm.schoolProgress} onChange={e => tf("schoolProgress", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>补过什么类型的课</Label>
                  <Input placeholder="如：一对一、小班课" value={trialForm.tutoringHistory} onChange={e => tf("tutoringHistory", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Parent Contact */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">家长联系信息</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label>家长手机号 *</Label>
                  <Input placeholder="11位手机号" value={trialForm.parentPhone} onChange={e => tf("parentPhone", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Campus Info */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">校区相关信息</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>校区名称</Label>
                  <Input placeholder="北京校区" value={trialForm.campusName} onChange={e => tf("campusName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>校区账号</Label>
                  <Input placeholder="beijing_01" value={trialForm.campusAccount} onChange={e => tf("campusAccount", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>学生账号</Label>
                  <Input placeholder="学生G账号" value={trialForm.studentAccount} onChange={e => tf("studentAccount", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Trial Time Slots */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">试课时间</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label>试课时间 1 *</Label>
                  <Input type="datetime-local" value={trialForm.trialTime1} onChange={e => tf("trialTime1", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>试课时间 2（可选）</Label>
                  <Input type="datetime-local" value={trialForm.trialTime2} onChange={e => tf("trialTime2", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>试课时间 3（可选）</Label>
                  <Input type="datetime-local" value={trialForm.trialTime3} onChange={e => tf("trialTime3", e.target.value)} />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea rows={2} placeholder="记录学生的特殊情况或学习需求" value={trialForm.remarks} onChange={e => tf("remarks", e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrialOpen(false)}>取消</Button>
            <Button onClick={handleTrialSubmit} disabled={!trialForm.studentName || !trialForm.grade || !trialForm.subject || !trialForm.parentPhone || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              提交试课单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ====== New Regular Dialog ====== */}
      <Dialog open={regularOpen} onOpenChange={(open) => { if (!open) closeRegularDialog(); else setRegularOpen(true) }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>新建正课单（线下支付）</DialogTitle>
            <DialogDescription>
              运营侧直接创建正课单，视为已线下支付，直接进入客服审核流程。
              {regularForm.fromTrialConversion && " 本单来自试课转正。"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* 1. Campus + Dingbanxue */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">校区相关信息</h3>
              <div className="flex items-start gap-3 rounded-md border p-3">
                <Checkbox
                  checked={regularForm.needsDingbanxueRecharge}
                  onCheckedChange={(v) => rf("needsDingbanxueRecharge", Boolean(v))}
                />
                <div className="space-y-1 text-sm">
                  <span className="font-medium">需要代充鼎伴学费用</span>
                  <p className="text-muted-foreground text-xs">
                    课程默认单价已包含代充鼎伴学费用：20元/课时（代收费用，一经支付，此费用即支付给鼎伴学，交付中心不负责退款，如需退款，请自行联系鼎伴学）。
                    如您已有鼎伴学G账号，则您可取消本选项，直接使用该G账号课时上课（注意：请确保该G账号课时充足/需自行充值，否则将无法上课）。
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>校区名称 {!regularForm.needsDingbanxueRecharge && "*"}</Label>
                  <Input placeholder="北京校区" value={regularForm.campusName} onChange={e => rf("campusName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>校区账号 {!regularForm.needsDingbanxueRecharge && "*"}</Label>
                  <Input placeholder="beijing_01" value={regularForm.campusAccount} onChange={e => rf("campusAccount", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>学生账号 {!regularForm.needsDingbanxueRecharge && "*"}</Label>
                  <Input placeholder="stu_001" value={regularForm.studentAccount} onChange={e => rf("studentAccount", e.target.value)} />
                </div>
              </div>
            </div>

            {/* 2. Student Basic Info */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">学生基本信息</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>学生姓名 *</Label>
                  <Input placeholder="真实姓名" value={regularForm.studentName} onChange={e => rf("studentName", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>性别 *</Label>
                  <Select value={regularForm.gender} onValueChange={v => rf("gender", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{GENDERS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>科目 *</Label>
                  <Select value={regularForm.subject} onValueChange={v => rf("subject", v)}>
                    <SelectTrigger><SelectValue placeholder="选择科目" /></SelectTrigger>
                    <SelectContent>{SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>课费标准（年级） *</Label>
                  <Select value={regularForm.grade} onValueChange={v => rf("grade", v)}>
                    <SelectTrigger><SelectValue placeholder="选择年级" /></SelectTrigger>
                    <SelectContent>{GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>地区 *</Label>
                  <Input placeholder="省市区" value={regularForm.region} onChange={e => rf("region", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>学校名称</Label>
                  <Input placeholder="就读学校" value={regularForm.school} onChange={e => rf("school", e.target.value)} />
                </div>
              </div>
            </div>

            {/* 3. Academic Info */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">学习成绩信息</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>最近成绩</Label>
                  <Input placeholder="分数" value={regularForm.lastExamScore} onChange={e => rf("lastExamScore", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>卷面满分</Label>
                  <Input placeholder="如100、150" value={regularForm.examMaxScore} onChange={e => rf("examMaxScore", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>教材版本</Label>
                  <Input placeholder="版本" value={regularForm.textbookVersion} onChange={e => rf("textbookVersion", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>校内学习进度</Label>
                  <Input placeholder="如：已学到第五章" value={regularForm.schoolLearningProgress} onChange={e => rf("schoolLearningProgress", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>其它科平均成绩</Label>
                  <Input placeholder="如：85分" value={regularForm.otherSubjectsAvgScore} onChange={e => rf("otherSubjectsAvgScore", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>补过什么类型的课</Label>
                  <Input placeholder="如：一对一、小班课" value={regularForm.previousTutoringTypes} onChange={e => rf("previousTutoringTypes", e.target.value)} />
                </div>
              </div>
            </div>

            {/* 4. Parent Contact */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">家长联系信息</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-2">
                  <Label>家长手机号 *</Label>
                  <Input placeholder="11位手机号" value={regularForm.parentPhone} onChange={e => rf("parentPhone", e.target.value)} />
                </div>
              </div>
            </div>

            {/* 5. Scheduling Info */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">排课信息</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>总课时 *</Label>
                  <Input type="number" min={1} max={1000} value={regularForm.totalHours} onChange={e => rf("totalHours", parseInt(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>排课模式 *</Label>
                  <Select value={regularForm.schedulingPattern} onValueChange={v => rf("schedulingPattern", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WEEKLY">每周固定重复</SelectItem>
                      <SelectItem value="INTERVAL_DAYS">每隔N天上课</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {regularForm.schedulingPattern === "INTERVAL_DAYS" && (
                  <div className="space-y-2">
                    <Label>间隔天数 *</Label>
                    <Input type="number" min={1} max={30} value={regularForm.intervalDays} onChange={e => rf("intervalDays", parseInt(e.target.value) || 2)} />
                  </div>
                )}
              </div>

              {/* First Class Time */}
              <div className="grid grid-cols-3 gap-3 items-end">
                <div className="space-y-2">
                  <Label>首次课日期</Label>
                  <Input type="date" value={regularForm.firstClassDate} onChange={e => rf("firstClassDate", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>开始时间</Label>
                  <Select value={regularForm.firstClassStartTime} onValueChange={v => rf("firstClassStartTime", v)}>
                    <SelectTrigger><SelectValue placeholder="开始" /></SelectTrigger>
                    <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={`fs-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>结束时间</Label>
                  <Select value={regularForm.firstClassEndTime} onValueChange={v => rf("firstClassEndTime", v)}>
                    <SelectTrigger><SelectValue placeholder="结束" /></SelectTrigger>
                    <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={`fe-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Weekly Schedule */}
              {regularForm.schedulingPattern === "WEEKLY" && (
                <div className="space-y-3">
                  <Label className="text-xs text-muted-foreground">上课时间安排</Label>
                  {WEEKDAYS.map(day => {
                    const scheduleItem = regularWeeklySchedule.find(s => s.day === day.value)
                    const isSelected = !!scheduleItem
                    return (
                      <div key={day.value} className={`flex items-center gap-4 p-3 rounded-lg border ${isSelected ? "bg-accent/10 border-accent" : "border-border"}`}>
                        <div className="flex items-center gap-2 w-24">
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleWeekday(day.value)} />
                          <span className="text-sm font-medium">{day.label}</span>
                        </div>
                        {isSelected ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Select value={scheduleItem.startTime} onValueChange={(v) => updateScheduleTime(day.value, 'startTime', v)}>
                              <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={`ws-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                            <span className="text-muted-foreground">-</span>
                            <Select value={scheduleItem.endTime} onValueChange={(v) => updateScheduleTime(day.value, 'endTime', v)}>
                              <SelectTrigger className="w-[120px] h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>{TIME_OPTIONS.map(t => <SelectItem key={`we-${t}`} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">未安排</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {regularForm.schedulingPattern === "INTERVAL_DAYS" && (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  当前模式按"首次课 + 间隔天数"自动生成后续课表，不需要每周固定勾选。
                </div>
              )}
            </div>

            {/* Conversion Reward (only for trial conversion) */}
            {regularForm.fromTrialConversion && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-medium text-muted-foreground">转正红包（试课转正专属）</h3>

                <div className="flex items-center justify-between rounded-md border p-3 bg-muted/30">
                  <span className="text-sm">转正红包金额（按年级 {regularForm.grade} 自动带出）</span>
                  <span className="font-bold text-lg text-primary">¥{regConversionRewardFee}</span>
                </div>

                <div className="space-y-2">
                  <Label>转正红包归属教练 *</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="输入教练姓名搜索..."
                      value={conversionRewardCoachSearch}
                      onChange={e => {
                        setConversionRewardCoachSearch(e.target.value)
                        if (conversionRewardCoachId) {
                          setConversionRewardCoachId("")
                          setConversionRewardCoachName("")
                        }
                      }}
                    />
                    {conversionRewardCoachSearch && !conversionRewardCoachId && (
                      <div className="border rounded-md max-h-32 overflow-y-auto">
                        {filteredCoachOptions.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">无匹配教练</div>
                        ) : (
                          filteredCoachOptions.map(t => (
                            <button
                              key={t.id}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex justify-between"
                              onClick={() => {
                                setConversionRewardCoachId(t.id)
                                setConversionRewardCoachName(t.name)
                                setConversionRewardCoachSearch(t.name)
                              }}
                            >
                              <span>{t.name}</span>
                              <span className="text-muted-foreground">{t.phone}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                    {conversionRewardCoachId && (
                      <div className="flex items-center gap-2 text-sm">
                        <Badge variant="secondary">已选择：{conversionRewardCoachName}</Badge>
                        <button className="text-muted-foreground hover:text-foreground text-xs" onClick={() => {
                          setConversionRewardCoachId("")
                          setConversionRewardCoachName("")
                          setConversionRewardCoachSearch("")
                        }}>清除</button>
                      </div>
                    )}
                   </div>
                 </div>

                {regConversionRewardFee > 0 && (
                  <div className="flex items-start gap-3 rounded-md border p-3">
                    <Checkbox
                      checked={includeConversionReward}
                      onCheckedChange={(v) => setIncludeConversionReward(Boolean(v))}
                    />
                    <div className="space-y-1 text-sm">
                      <span className="font-medium">转正红包纳入线上实付（¥{regConversionRewardFee}）</span>
                      <p className="text-muted-foreground text-xs">
                        勾选后红包金额 ¥{regConversionRewardFee} 计入应付总计，不勾选则视为线下单独结算。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-4 border-t pt-4">
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea rows={2} placeholder="记录学生的特殊情况或学习需求" value={regularForm.remarks} onChange={e => rf("remarks", e.target.value)} />
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="space-y-3 border-t pt-4 bg-muted/30 rounded-md p-4">
              <h3 className="text-sm font-medium">费用明细</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">当前年级</span>
                  <span className="font-medium">{regularForm.grade || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">课时单价</span>
                  <span className="font-medium">{regPricePerHour > 0 ? `¥${regPricePerHour}/课时` : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">总课时数</span>
                  <span className="font-medium">{regularForm.totalHours}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">原始总费用</span>
                  <span className="font-medium">¥{regTotalCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">鼎伴学费用（¥{DINGBANXUE_FEE_PER_HOUR}/课时）</span>
                  <span className="font-medium">
                    {regularForm.needsDingbanxueRecharge ? `¥${regDingbanxueFee.toLocaleString()}（代充，已含在总价中）` : `-¥${regDingbanxueDeduction.toLocaleString()}（自充，已扣除）`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">课时费用</span>
                  <span className="font-medium">¥{regCourseFee.toLocaleString()}</span>
                </div>
                {regularForm.fromTrialConversion && regConversionRewardFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">转正红包</span>
                    <span className="font-medium">
                      ¥{regConversionRewardFee}
                      {!includeConversionReward && <span className="text-muted-foreground text-xs ml-1">（未纳入线上实付）</span>}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-bold text-lg">应付总计</span>
                  <span className="font-bold text-2xl text-primary">¥{regPricing.totalPayable.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <p className="font-semibold mb-1">价格参考表：</p>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {Object.entries(LATEST_GRADE_UNIT_PRICE).map(([g, p]) => (
                    <span key={g}>{g}: ¥{p}/课时</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeRegularDialog}>取消</Button>
            <Button onClick={handleRegularSubmit}
              disabled={!regularForm.studentName || !regularForm.grade || !regularForm.subject || !regularForm.parentPhone || isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              提交正课单
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ChangeCoachDialog
        open={changeCoachOpen}
        onOpenChange={setChangeCoachOpen}
        order={changeCoachOrder}
        operatorUser={user ?? null}
        operatorRole="OPERATOR"
        onDone={reload}
      />
      <CoachChangeHistoryDialog
        open={coachHistoryOpen}
        onOpenChange={setCoachHistoryOpen}
        order={coachHistoryOrder}
      />
    </div>
  )
}
