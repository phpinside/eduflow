"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { zhCN } from "date-fns/locale"
import { ArrowLeft, Upload, FileText, CheckCircle, Clock, Eye, Info } from "lucide-react"

import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { mockStudents } from "@/lib/mock-data/students"
import { mockStudyPlans } from "@/lib/mock-data/study-plans"
import { StudyPlanStatus, StudyPlan } from "@/types"

export default function CreateStudyPlanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const studentId = searchParams.get('studentId') || ''
  const studentName = searchParams.get('studentName') || ''

  // State
  const [file, setFile] = React.useState<File | null>(null)
  const [isUploading, setIsUploading] = React.useState(false)
  const [currentPlan, setCurrentPlan] = React.useState<StudyPlan | null>(null)

  // 获取学生信息（优先使用传入的 studentName，如果没有则从 mockStudents 查找）
  const student = React.useMemo(() => {
    if (studentName) {
      return { id: studentId, name: studentName }
    }
    return mockStudents.find(s => s.id === studentId) || { id: studentId, name: '未知学生' }
  }, [studentId, studentName])

  React.useEffect(() => {
    // 查找该学生的现有规划书
    const plan = mockStudyPlans.find(p => p.studentId === studentId)
    if (plan) {
      setCurrentPlan(plan)
    }
  }, [studentId])

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = () => {
    if (!file || !user || !studentId) return

    setIsUploading(true)
    
    // Simulate upload delay
    setTimeout(() => {
        const newPlan: StudyPlan = {
            id: `sp-new-${Date.now()}`,
            orderId: undefined, // 弱绑定，不关联订单
            studentId: studentId,
            studentName: student.name, // 保存学生姓名
            teacherId: user.id,
            fileUrl: URL.createObjectURL(file), // Mock URL
            fileName: file.name,
            fileType: file.name.endsWith('.pdf') ? 'pdf' : 'word',
            status: StudyPlanStatus.PENDING_REVIEW,
            createdAt: new Date(),
            updatedAt: new Date()
        }
        
        setCurrentPlan(newPlan)
        setIsUploading(false)
        setFile(null)
        
        alert('学习规划书上传成功！')
    }, 1500)
  }

  if (!studentId) {
    return (
        <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
            <h2 className="text-xl font-bold">缺少学生信息</h2>
            <Button variant="outline" onClick={() => router.back()}>返回</Button>
        </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">学习规划书</h1>
          <p className="text-sm text-muted-foreground mt-1">
             学员：{student.name} {studentId && `(ID: ${studentId})`}
          </p>
        </div>
      </div>

      {currentPlan ? (
        // View Mode
        <div className="space-y-6">
            {/* Status Card */}
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <CardTitle className="text-lg flex items-center gap-2">
                             <FileText className="h-5 w-5 text-primary" />
                             当前规划书
                        </CardTitle>
                         <Badge 
                            variant={currentPlan.status === StudyPlanStatus.REVIEWED ? "default" : "secondary"}
                            className="text-sm px-3 py-1"
                        >
                            {currentPlan.status === StudyPlanStatus.REVIEWED ? (
                                <span className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" /> 已完成审核
                                </span>
                            ) : (
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> 审核中
                                </span>
                            )}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* File Info */}
                    <div className="flex items-center p-4 border rounded-lg bg-muted/20 gap-4">
                        <div className="h-12 w-12 rounded bg-white flex items-center justify-center border shadow-sm">
                            {currentPlan.fileType === 'pdf' ? (
                                <FileText className="h-6 w-6 text-red-500" />
                            ) : (
                                <FileText className="h-6 w-6 text-blue-500" />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{currentPlan.fileName}</p>
                            <p className="text-xs text-muted-foreground">
                                上传于 {format(new Date(currentPlan.createdAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                            </p>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <a href={currentPlan.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Eye className="mr-2 h-4 w-4" />
                                查看内容
                            </a>
                        </Button>
                    </div>
                    
                    {/* Review Info */}
                    {currentPlan.status === StudyPlanStatus.REVIEWED && currentPlan.reviews && currentPlan.reviews.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground">审核记录</h4>
                            <div className="border rounded-md divide-y">
                                {currentPlan.reviews.map((review, idx) => (
                                    <div key={idx} className="p-3 text-sm flex justify-between items-center bg-green-50/50 dark:bg-green-900/10">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <span>由 <strong>{review.reviewerName}</strong> 审核通过</span>
                                        </div>
                                        <span className="text-muted-foreground text-xs">
                                            {format(new Date(review.reviewedAt), "yyyy-MM-dd HH:mm", { locale: zhCN })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentPlan.status === StudyPlanStatus.PENDING_REVIEW && (
                         <Alert>
                            <Info className="h-4 w-4" />
                            <AlertTitle>等待审核</AlertTitle>
                            <AlertDescription>
                                您的规划书已提交，教务团队正在审核中。审核通过后您将收到通知。
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
                <CardFooter className="justify-end border-t pt-4">
                     <Button variant="ghost" className="text-muted-foreground text-xs">
                        重新上传版本 (暂未开放)
                     </Button>
                </CardFooter>
            </Card>
        </div>
      ) : (
        // Upload Mode
        <Card>
            <CardHeader>
                <CardTitle>上传规划书</CardTitle>
                <CardDescription>
                    请上传针对 {student.name} 的阶段性学习规划书。支持 PDF 或 Word 格式。
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                    <Label htmlFor="plan-file">选择文件</Label>
                    <Input id="plan-file" type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
                    <p className="text-xs text-muted-foreground">支持 .pdf, .doc, .docx 格式，大小不超过 10MB</p>
                </div>
            </CardContent>
            <CardFooter className="justify-end">
                <Button onClick={handleUpload} disabled={!file || isUploading}>
                    {isUploading ? (
                        <>
                            <Upload className="mr-2 h-4 w-4 animate-bounce" />
                            上传中...
                        </>
                    ) : (
                        <>
                            <Upload className="mr-2 h-4 w-4" />
                            确认上传
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
      )}
    </div>
  )
}
