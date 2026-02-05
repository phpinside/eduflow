"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { format, addMinutes, differenceInSeconds } from "date-fns"
import { zhCN } from "date-fns/locale"
import { 
  Search, 
  Filter, 
  Clock, 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar as CalendarIcon,
  ChevronRight,
  User
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

import { mockOrders } from "@/lib/mock-data/orders"
import { mockStudents } from "@/lib/mock-data/students"
import { Order, OrderStatus, OrderType } from "@/types"
import { cn } from "@/lib/utils"

// --- Constants ---
const SUBJECTS = ["全部科目", "数学", "物理", "英语", "化学", "语文", "生物", "历史", "地理", "政治"] as const
const GRADES = ["全部年级", "四年级", "五年级", "六年级", "初一", "初二", "初三", "高一", "高二", "高三"] as const
const CURRENT_COACH_ID = "current_coach_001"
const ORDER_TIMEOUT_MINUTES = 30

// --- Types ---
interface ExtendedOrder extends Order {
  deadline: Date
  applicants: string[] // List of coach IDs
  isApplied: boolean
  studentName?: string
  studentGender?: string
  studentScore?: string
}

export default function OrderMarketPage() {
  const router = useRouter()
  
  // State for filters
  const [selectedSubject, setSelectedSubject] = React.useState<string>("全部科目")
  const [selectedGrade, setSelectedGrade] = React.useState<string>("全部年级")
  const [searchQuery, setSearchQuery] = React.useState("")

  // State for orders
  const [marketOrders, setMarketOrders] = React.useState<ExtendedOrder[]>([])
  const [now, setNow] = React.useState(new Date())

  // Initialize Data
  React.useEffect(() => {
    // Timer for countdown updates
    const timer = setInterval(() => setNow(new Date()), 1000)

    // Simulate fetching and enriching orders
    const initialOrders: ExtendedOrder[] = mockOrders
      .filter(o => o.status === OrderStatus.PENDING)
      .map((order, index) => {
        const student = mockStudents.find(s => s.id === order.studentId)
        
        const isFresh = index % 2 === 0
        const createdAt = isFresh 
            ? new Date(Date.now() - Math.random() * 20 * 60 * 1000)
            : new Date(Date.now() - 40 * 60 * 1000)
            
        const deadline = addMinutes(createdAt, ORDER_TIMEOUT_MINUTES)
        
        const applicants = Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => `coach_${i}`)
        
        return {
          ...order,
          createdAt,
          deadline,
          applicants,
          isApplied: false,
          studentName: student?.name || "未知学生",
          studentGender: student?.gender,
          studentScore: (order as any).lastExamScore || "暂无成绩"
        }
      })

    // Helper to create random mock order
    const createMockOrder = (i: number): ExtendedOrder => {
      // Ensure unique IDs
      const uniqueId = `market-gen-${Date.now()}-${i}`;
      
      const type = Math.random() > 0.4 ? OrderType.TRIAL : OrderType.REGULAR
      const subject = SUBJECTS[Math.floor(Math.random() * (SUBJECTS.length - 1)) + 1]
      const grade = GRADES[Math.floor(Math.random() * (GRADES.length - 1)) + 1]
      const isFresh = Math.random() > 0.2 // 80% fresh orders
      const createdAt = isFresh 
          ? new Date(Date.now() - Math.random() * 25 * 60 * 1000) // Created 0-25 mins ago
          : new Date(Date.now() - (30 + Math.random() * 60) * 60 * 1000) // Created >30 mins ago
      
      const deadline = addMinutes(createdAt, ORDER_TIMEOUT_MINUTES)
      const scheduledAt = new Date(Date.now() + (1 + Math.random() * 7) * 24 * 60 * 60 * 1000) // 1-7 days later
      
      // Random weekly schedule for regular
      const weekDays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
      const randomDay = weekDays[Math.floor(Math.random() * weekDays.length)]
      const startHour = 9 + Math.floor(Math.random() * 11) // 9:00 - 20:00
      
      return {
        id: uniqueId,
        type,
        status: OrderStatus.PENDING,
        studentId: `stu-gen-${i}`,
        salesPersonId: "sales-1",
        subject,
        grade,
        totalHours: type === OrderType.TRIAL ? 1 : 20 + Math.floor(Math.random() * 40),
        remainingHours: type === OrderType.TRIAL ? 1 : 20 + Math.floor(Math.random() * 40),
        price: type === OrderType.TRIAL ? 0 : 2000 + Math.floor(Math.random() * 5000),
        createdAt,
        updatedAt: new Date(),
        deadline,
        applicants: Array.from({ length: Math.floor(Math.random() * 8) }, (_, k) => `coach_${k}`),
        isApplied: false,
        studentName: ["张", "李", "王", "赵", "陈", "刘", "杨", "黄"][Math.floor(Math.random() * 8)] + (Math.random() > 0.5 ? "同学" : "小" + ["明", "红", "强", "刚"][Math.floor(Math.random() * 4)]),
        studentGender: Math.random() > 0.5 ? "男" : "女",
        studentScore: Math.floor(60 + Math.random() * 40) + "/100",
        scheduledAt: type === OrderType.TRIAL ? scheduledAt : undefined,
        // @ts-ignore
        weeklySchedule: type === OrderType.REGULAR ? [{ 
          day: randomDay, 
          startTime: `${startHour}:00`, 
          endTime: `${startHour + 2}:00` 
        }] : undefined,
        remarks: ["基础较弱，需耐心", "目标考重点", "性格内向", "喜欢互动", "需要提升解题速度"][Math.floor(Math.random() * 5)]
      }
    }

    // Filter out initial orders that might conflict with extra orders logic (if any)
    // But mainly we need to make sure extra orders don't use ids already in initialOrders
    const extraOrders = Array.from({ length: 25 }, (_, i) => createMockOrder(i + 1))
    
    setMarketOrders([...initialOrders, ...extraOrders])

      return () => clearInterval(timer)
  }, [])

  // --- Logic ---

  const checkConflict = (order: ExtendedOrder): boolean => {
    // Find all orders the current user has applied to
    const myAppliedOrders = marketOrders.filter(o => o.isApplied)
    
    // Simple conflict check logic
    // 1. If it's a Trial order, check 'scheduledAt' vs other applied Trial orders
    if (order.type === OrderType.TRIAL && order.scheduledAt) {
      const conflict = myAppliedOrders.find(applied => 
        applied.type === OrderType.TRIAL && 
        applied.scheduledAt && 
        Math.abs(applied.scheduledAt.getTime() - order.scheduledAt!.getTime()) < 60 * 60 * 1000 // Within 1 hour
      )
      if (conflict) return true
    }

    // 2. If it's Regular, check weekly schedule (mock logic: same day overlap)
    if (order.type === OrderType.REGULAR && (order as any).weeklySchedule) {
      const newSchedule = (order as any).weeklySchedule as any[]
      const conflict = myAppliedOrders.find(applied => {
        const appliedSchedule = (applied as any).weeklySchedule as any[]
        if (!appliedSchedule) return false
        // Check if any day matches
        return newSchedule.some(ns => appliedSchedule.some(as => as.day === ns.day))
      })
      if (conflict) return true
    }

    return false
  }

  const handleApply = (orderId: string) => {
    const order = marketOrders.find(o => o.id === orderId)
    if (!order) return

    // 1. Check Deadline
    if (now > order.deadline) {
      toast.error("接单时间已截止")
      return
    }

    // 2. Check Conflict
    if (checkConflict(order)) {
      toast.error("与已申请的订单时间冲突")
      return
    }

    // 3. Apply
    setMarketOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          isApplied: true,
          applicants: [...o.applicants, CURRENT_COACH_ID]
        }
      }
      return o
    }))
    toast.success("申请成功！请等待系统派单")
  }

  const handleCancelApply = (orderId: string) => {
    const order = marketOrders.find(o => o.id === orderId)
    if (!order) return

    if (now > order.deadline) {
        toast.error("倒计时已结束，无法取消，请联系管理员")
        return
    }

    setMarketOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          isApplied: false,
          applicants: o.applicants.filter(id => id !== CURRENT_COACH_ID)
        }
      }
      return o
    }))
    toast.success("已取消申请")
  }

  // --- Filtering ---
  const filteredOrders = marketOrders.filter(order => {
    // Filter by Subject
    if (selectedSubject !== "全部科目" && order.subject !== selectedSubject) return false
    // Filter by Grade
    if (selectedGrade !== "全部年级" && order.grade !== selectedGrade) return false
    // Filter by Search (Student Name)
    if (searchQuery && !order.studentName?.includes(searchQuery)) return false
    
    return true
  })

  // Group by type for Tabs
  const trialOrders = filteredOrders.filter(o => o.type === OrderType.TRIAL)
  const regularOrders = filteredOrders.filter(o => o.type === OrderType.REGULAR)

  // --- Render Helpers ---

  const Countdown = ({ deadline }: { deadline: Date }) => {
    const diff = differenceInSeconds(deadline, now)
    if (diff <= 0) return <span className="text-muted-foreground font-medium">已截止</span>
    
    const minutes = Math.floor(diff / 60)
    const seconds = diff % 60
    return (
      <span className="text-orange-600 font-mono font-bold">
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    )
  }

  const OrderCard = ({ order }: { order: ExtendedOrder }) => {
    const isExpired = now > order.deadline
    const isConflict = !order.isApplied && checkConflict(order) && !isExpired

    return (
      <Card className={cn("hover:shadow-md transition-shadow border-l-4", 
        order.type === OrderType.TRIAL ? "border-l-blue-500" : "border-l-green-500"
      )}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant={order.type === OrderType.TRIAL ? "secondary" : "default"}>
                  {order.type === OrderType.TRIAL ? "试课单" : "正课单"}
                </Badge>
                <CardTitle className="text-lg">
                  {order.grade} {order.subject}
                </CardTitle>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                发布于 {format(order.createdAt, "HH:mm")}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
                <div className="text-xs text-muted-foreground">接单倒计时</div>
                <Countdown deadline={order.deadline} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-3 text-sm space-y-3">
          <div className="grid grid-cols-2 gap-2">
             <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order.studentName} ({order.studentGender})</span>
             </div>
             <div className="flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span>上次成绩: {order.studentScore}</span>
             </div>
          </div>
          
          <div className="bg-muted/50 p-2 rounded flex items-start gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
                <span className="font-medium">时间要求：</span>
                {order.type === OrderType.TRIAL ? (
                    <span>{order.scheduledAt ? format(order.scheduledAt, "MM-dd HH:mm") : "待定"}</span>
                ) : (
                    <span>
                        {/* @ts-ignore */}
                        {order.weeklySchedule?.map((s: any) => `${s.day === 'monday' ? '周一' : s.day === 'tuesday' ? '周二' : s.day === 'wednesday' ? '周三' : s.day === 'thursday' ? '周四' : s.day === 'friday' ? '周五' : s.day === 'saturday' ? '周六' : '周日'} ${s.startTime}-${s.endTime}`).join("、 ")}
                    </span>
                )}
            </div>
          </div>

          {(order as any).remarks && (
             <div className="text-muted-foreground line-clamp-1">
                备注: {(order as any).remarks}
             </div>
          )}
        </CardContent>
        <CardFooter className="pt-3 border-t bg-muted/20 flex justify-between items-center">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{order.applicants.length} 人已申请</span>
            </div>
            
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => router.push(`/orders/market/${order.id}`)}>
                    详情
                </Button>
                
                {order.isApplied ? (
                     <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleCancelApply(order.id)}
                        disabled={isExpired}
                    >
                        {isExpired ? "已结束" : "取消申请"}
                     </Button>
                ) : (
                    <Button 
                        size="sm" 
                        onClick={() => handleApply(order.id)}
                        disabled={isExpired || isConflict}
                    >
                        {isExpired ? "抢单结束" : isConflict ? "时间冲突" : "立即申请"}
                    </Button>
                )}
            </div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6 container mx-auto pb-10 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">接单中心</h1>
        <p className="text-muted-foreground">浏览并申请适合您的教学订单，抢单倒计时结束前均可申请。</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
                <label className="text-sm font-medium">科目筛选</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger>
                        <SelectValue placeholder="选择科目" />
                    </SelectTrigger>
                    <SelectContent>
                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">年级筛选</label>
                <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                    <SelectTrigger>
                        <SelectValue placeholder="选择年级" />
                    </SelectTrigger>
                    <SelectContent>
                        {GRADES.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">搜索</label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="搜索学生姓名..." 
                        className="pl-9" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </CardContent>
      </Card>

      {/* Order Lists */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
            <TabsTrigger value="all">全部订单 ({filteredOrders.length})</TabsTrigger>
            <TabsTrigger value="trial">试课订单 ({trialOrders.length})</TabsTrigger>
            <TabsTrigger value="regular">正课订单 ({regularOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => <OrderCard key={order.id} order={order} />)
                ) : (
                    <div className="col-span-full text-center py-10 text-muted-foreground">暂无符合条件的订单</div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="trial" className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trialOrders.length > 0 ? (
                    trialOrders.map(order => <OrderCard key={order.id} order={order} />)
                ) : (
                    <div className="col-span-full text-center py-10 text-muted-foreground">暂无试课订单</div>
                )}
            </div>
        </TabsContent>
        <TabsContent value="regular" className="space-y-4">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularOrders.length > 0 ? (
                    regularOrders.map(order => <OrderCard key={order.id} order={order} />)
                ) : (
                    <div className="col-span-full text-center py-10 text-muted-foreground">暂无正课订单</div>
                )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
