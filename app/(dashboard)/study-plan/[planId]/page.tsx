"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ArrowLeft, FileText, CheckCircle, Download, Upload, X } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

import { getStoredOrders, getStoredUsers, getStoredStudents } from "@/lib/storage"
import { mockStudyPlans } from "@/lib/mock-data/study-plans"
import { StudyPlanStatus, StudyPlan, Role, OrderType } from "@/types"

interface DetailedPlan extends StudyPlan {
  studentName: string
  studentAccount: string
  teacherName: string
  teacherAvatar?: string
  subject: string
  grade: string
  courseType?: OrderType
}

export default function StudyPlanReviewPage() {
  const params = useParams()
  const router = useRouter()
  const { user, currentRole } = useAuth()
  const planId = params?.planId as string

  const [plan, setPlan] = useState<DetailedPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewComment, setReviewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUpdateArea, setShowUpdateArea] = useState(false)
  const [updateFile, setUpdateFile] = useState<File | null>(null)
  const [isUpdatingFile, setIsUpdatingFile] = useState(false)

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

      const order = foundPlan.orderId ? orders.find(o => o.id === foundPlan.orderId) : null
      const student = students.find(s => s.id === foundPlan.studentId)
      const teacher = users.find(u => u.id === foundPlan.teacherId)

      setPlan({
        ...foundPlan,
        studentName: foundPlan.studentName || student?.name || "未知学生",
        studentAccount: order?.studentAccount || "—",
        teacherName: teacher?.name || "未知教练",
        teacherAvatar: teacher?.avatar,
        subject: order?.subject || "-",
        grade: order?.grade || "-",
        courseType: order?.type,
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

  const handleUpdateFile = () => {
    if (!plan || !updateFile) return
    setIsUpdatingFile(true)

    setTimeout(() => {
      try {
        const storedPlansStr = localStorage.getItem("eduflow:study-plans")
        const allPlans: StudyPlan[] = storedPlansStr ? JSON.parse(storedPlansStr) : mockStudyPlans

        const nextFileType: StudyPlan["fileType"] = updateFile.name.toLowerCase().endsWith(".pdf") ? "pdf" : "word"
        const nextFileUrl = URL.createObjectURL(updateFile)
        const updatedPlans = allPlans.map((item) => {
          if (item.id !== plan.id) return item
          return {
            ...item,
            fileUrl: nextFileUrl,
            fileName: updateFile.name,
            fileType: nextFileType,
            status: StudyPlanStatus.PENDING_REVIEW,
            updatedAt: new Date(),
          }
        })

        localStorage.setItem("eduflow:study-plans", JSON.stringify(updatedPlans))

        setPlan((prev) => {
          if (!prev) return prev
          return {
            ...prev,
            fileUrl: nextFileUrl,
            fileName: updateFile.name,
            fileType: nextFileType,
            status: StudyPlanStatus.PENDING_REVIEW,
            updatedAt: new Date(),
          }
        })
        setShowUpdateArea(false)
        setUpdateFile(null)
        toast.success("学习规划书文件已更新")
      } catch (error) {
        console.error(error)
        toast.error("更新失败，请稍后重试")
      } finally {
        setIsUpdatingFile(false)
      }
    }, 800)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (!plan) return <div className="p-8 text-center">未找到规划书</div>

  return (
    <div className="space-y-6">
      <Button variant="ghost" className="gap-2" onClick={() => router.back()}>
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
                {/* Student Info Grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 rounded-lg border bg-muted/20 p-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">学员姓名</span>
                    <span className="font-medium">{plan.studentName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">学员G账号</span>
                    <span className="font-medium font-mono">{plan.studentAccount}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">课程类型</span>
                    <span>
                      {plan.courseType ? (
                        <Badge variant={plan.courseType === OrderType.TRIAL ? "secondary" : "default"} className="text-xs">
                          {plan.courseType === OrderType.TRIAL ? "试课" : "正课"}
                        </Badge>
                      ) : "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">学科</span>
                    <span className="font-medium">{plan.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-20 shrink-0">年级</span>
                    <span className="font-medium">{plan.grade}</span>
                  </div>
                </div>
                <a
                  href={plan.fileUrl}
                  download={plan.fileName}
                  className="flex items-center gap-4 rounded-lg border bg-muted/20 p-4 transition-colors hover:bg-muted/40"
                >
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
                    <Download className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>

                <div className="space-y-3 rounded-lg border border-dashed p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">支持重新上传最新版本规划书，更新后状态将变为待审核。</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowUpdateArea((prev) => !prev)
                        setUpdateFile(null)
                      }}
                    >
                      <Upload className="mr-1.5 h-4 w-4" />
                      更新规划书文件
                    </Button>
                  </div>

                  {showUpdateArea && (
                    <div className="space-y-3 border-t pt-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="plan-update-file">选择新文件</Label>
                        <Input
                          id="plan-update-file"
                          type="file"
                          accept=".pdf,.doc,.docx"
                          onChange={(e) => setUpdateFile(e.target.files?.[0] ?? null)}
                        />
                        <p className="text-xs text-muted-foreground">支持 .pdf、.doc、.docx 格式。</p>
                      </div>

                      {updateFile && (
                        <div className="flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5 text-sm">
                          <FileText className="h-4 w-4 shrink-0 text-primary" />
                          <span className="flex-1 truncate font-medium">{updateFile.name}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setUpdateFile(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowUpdateArea(false)
                            setUpdateFile(null)
                          }}
                        >
                          取消
                        </Button>
                        <Button onClick={handleUpdateFile} disabled={!updateFile || isUpdatingFile}>
                          {isUpdatingFile ? "更新中..." : "确认更新"}
                        </Button>
                      </div>
                    </div>
                  )}
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

            {/* Review Action Area - Only show for MANAGER when pending */}
            {plan.status === StudyPlanStatus.PENDING_REVIEW && currentRole === Role.MANAGER && (
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
