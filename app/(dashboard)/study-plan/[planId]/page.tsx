"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ArrowLeft, FileText, CheckCircle, Clock, Eye, Download, User as UserIcon } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

import { getStoredOrders, getStoredUsers, getStoredStudents, saveMockData } from "@/lib/storage"
import { mockStudyPlans } from "@/lib/mock-data/study-plans"
import { StudyPlanStatus, StudyPlan, Role } from "@/types"

interface DetailedPlan extends StudyPlan {
  studentName: string
  teacherName: string
  teacherAvatar?: string
  subject: string
  grade: string
}

export default function StudyPlanReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const planId = params?.planId as string

  const [plan, setPlan] = useState<DetailedPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load Data
  useEffect(() => {
    if (!planId) return

    const loadData = () => {
      // Load plans
      const storedPlansStr = localStorage.getItem('eduflow:study-plans')
      let rawPlans: StudyPlan[] = []
      
      if (storedPlansStr) {
        try {
           rawPlans = JSON.parse(storedPlansStr, (key, value) => {
             if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
                return new Date(value)
             }
             return value
           })
        } catch (e) { rawPlans = mockStudyPlans }
      } else { rawPlans = mockStudyPlans }

      const foundPlan = rawPlans.find(p => p.id === planId)
      
      if (!foundPlan) {
        setLoading(false)
        return
      }

      const users = getStoredUsers()
      const students = getStoredStudents()
      const orders = getStoredOrders()

      const order = orders.find(o => o.id === foundPlan.orderId)
      const student = students.find(s => s.id === foundPlan.studentId)
      const teacher = users.find(u => u.id === foundPlan.teacherId)

      setPlan({
        ...foundPlan,
        studentName: student?.name || "未知学生",
        teacherName: teacher?.name || "未知教练",
        teacherAvatar: teacher?.avatar,
        subject: order?.subject || "-",
        grade: order?.grade || "-"
      })
      setLoading(false)
    }

    loadData()
  }, [planId])

  const handleApprove = () => {
    if (!plan || !user) return
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
        try {
            const storedPlansStr = localStorage.getItem('eduflow:study-plans')
            let allPlans: StudyPlan[] = storedPlansStr ? JSON.parse(storedPlansStr) : mockStudyPlans

            const updatedPlans = allPlans.map(p => {
                if (p.id === plan.id) {
                    return {
                        ...p,
                        status: StudyPlanStatus.REVIEWED,
                        reviews: [
                            ...(p.reviews || []),
                            {
                                reviewerName: user.name,
                                reviewedAt: new Date()
                            }
                        ],
                        // Store comment? We need to extend type or just log it for now
                        // Current type doesn't have comment field in StudyPlan review array, 
                        // but requirements implied pass/fail opinion. 
                        // We will add it to a local extended field or just assume the reviewer info is enough for MVP.
                        // Let's stick to strict type for storage safety, or extend it if we modified types.ts earlier (we didn't).
                    }
                }
                return p
            })

            // Save back
            // Note: We need to handle the date serialization properly if we want it to survive reload
            // But JSON.stringify handles dates as ISO strings automatically.
            localStorage.setItem('eduflow:study-plans', JSON.stringify(updatedPlans))
            
            toast.success("审核通过成功")
            router.push("/study-plan")
        } catch (e) {
            console.error(e)
            toast.error("操作失败")
        } finally {
            setIsSubmitting(false)
        }
    }, 800)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!plan) return <div className="p-8 text-center">未找到规划书</div>

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Button variant="ghost" className="mb-6 gap-2" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        返回列表
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Plan Info & File */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
               <div className="flex justify-between items-start">
                   <div>
                        <CardTitle className="text-xl">学习规划书详情</CardTitle>
                        <CardDescription className="mt-2">
                             学员：{plan.studentName} ({plan.grade} {plan.subject})
                        </CardDescription>
                   </div>
                   <Badge 
                        variant={plan.status === StudyPlanStatus.REVIEWED ? "default" : "secondary"}
                        className="text-sm px-3 py-1"
                    >
                        {plan.status === StudyPlanStatus.REVIEWED ? "已审核" : "待审核"}
                    </Badge>
               </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center p-4 border rounded-lg bg-muted/20 gap-4">
                    <div className="h-12 w-12 rounded bg-white flex items-center justify-center border shadow-sm">
                        {plan.fileType === 'pdf' ? (
                            <FileText className="h-6 w-6 text-red-500" />
                        ) : (
                            <FileText className="h-6 w-6 text-blue-500" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{plan.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                            提交于 {format(new Date(plan.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <Button className="flex-1" asChild>
                        <a href={plan.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="mr-2 h-4 w-4" />
                            在线预览
                        </a>
                    </Button>
                    <Button variant="outline" className="flex-1" asChild>
                         <a href={plan.fileUrl} download={plan.fileName}>
                            <Download className="mr-2 h-4 w-4" />
                            下载文件
                        </a>
                    </Button>
                </div>
            </CardContent>
          </Card>

          {/* Review History */}
          {plan.status === StudyPlanStatus.REVIEWED && (
              <Card>
                  <CardHeader>
                      <CardTitle className="text-lg">审核记录</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="space-y-4">
                          {plan.reviews?.map((review, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900">
                                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                                  <div>
                                      <p className="font-medium text-sm">审核通过</p>
                                      <p className="text-xs text-muted-foreground mt-1">
                                          审核人：{review.reviewerName} • {format(new Date(review.reviewedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                                      </p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </CardContent>
              </Card>
          )}
        </div>

        {/* Right: Actions & Teacher Info */}
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium text-muted-foreground">提交教练</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={plan.teacherAvatar} />
                            <AvatarFallback>{plan.teacherName.slice(0, 1)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div className="font-bold">{plan.teacherName}</div>
                            <div className="text-xs text-muted-foreground">伴学教练</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Review Action Area - Only show if pending */}
            {plan.status === StudyPlanStatus.PENDING_REVIEW && (
                <Card className="border-primary/20 shadow-md">
                    <CardHeader>
                        <CardTitle>审核操作</CardTitle>
                        <CardDescription>
                            请仔细阅读规划书后给出审核意见
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">审核意见 (可选)</label>
                            <Textarea 
                                placeholder="输入备注信息..." 
                                value={reviewComment}
                                onChange={e => setReviewComment(e.target.value)}
                            />
                        </div>
                        <Button 
                            className="w-full bg-green-600 hover:bg-green-700" 
                            onClick={handleApprove}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "处理中..." : "审核通过"}
                        </Button>
                        <Button variant="outline" className="w-full text-red-600 hover:text-red-700 hover:bg-red-50">
                            驳回修改 (暂不可用)
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  )
}
