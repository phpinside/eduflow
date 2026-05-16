"use client"

import { useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { getStoredUsers } from "@/lib/storage"
import { Role } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, ChevronRight } from "lucide-react"

function getScoreColor(score: number): string {
  if (score >= 10) return "text-emerald-600"
  if (score >= 7) return "text-amber-600"
  if (score >= 4) return "text-orange-600"
  return "text-red-600"
}

function getScoreBg(score: number): string {
  if (score >= 10) return "bg-emerald-50 border-emerald-200"
  if (score >= 7) return "bg-amber-50 border-amber-200"
  if (score >= 4) return "bg-orange-50 border-orange-200"
  return "bg-red-50 border-red-200"
}

function getScoreRingColor(score: number): string {
  if (score >= 10) return "stroke-emerald-500"
  if (score >= 7) return "stroke-amber-500"
  if (score >= 4) return "stroke-orange-500"
  return "stroke-red-500"
}

function ScoreRing({ score }: { score: number }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = Math.min(score / 12, 1)
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" className="stroke-muted" strokeWidth="6" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          className={getScoreRingColor(score)}
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}</span>
        <span className="text-[10px] text-muted-foreground">/12</span>
      </div>
    </div>
  )
}

export function TutorCreditScoreCard() {
  const { user, currentRole } = useAuth()
  const creditScore = user?.creditScore ?? 12
  const href = currentRole === Role.MANAGER ? "/credit-history?tab=my" : "/credit-history"

  return (
    <Link href={href} className="block">
      <Card className={`cursor-pointer border transition-all hover:shadow-md ${getScoreBg(creditScore)}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">我的信用分</CardTitle>
          <Shield className={`h-4 w-4 ${getScoreColor(creditScore)}`} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ScoreRing score={creditScore} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${getScoreColor(creditScore)}`}>{creditScore}</span>
                <span className="text-sm text-muted-foreground">/ 12 分</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {creditScore >= 10 ? "信用良好，继续保持" : creditScore >= 7 ? "信用一般，请注意" : creditScore >= 4 ? "信用较差，需改善" : "信用极低，即将清退"}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <span>查看变动记录</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ManagerTutorCreditCard() {
  const { user } = useAuth()

  const { tutors, avgScore, lowCreditTutors } = useMemo(() => {
    if (!user) return { tutors: [], avgScore: 0, lowCreditTutors: [] }
    const allUsers = getStoredUsers()
    const myTutors = allUsers.filter(
      (u) => u.roles.includes(Role.TUTOR) && u.managerId === user.id
    )
    const scores = myTutors.map((t) => t.creditScore ?? 12)
    const avg = scores.length > 0 ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : 0
    const low = myTutors.filter((t) => (t.creditScore ?? 12) < 7)
    return { tutors: myTutors, avgScore: avg, lowCreditTutors: low }
  }, [user])

  return (
    <Link href="/credit-history" className="block">
      <Card className={`cursor-pointer border transition-all hover:shadow-md ${getScoreBg(avgScore || 12)}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">教练信用分概况</CardTitle>
          <Shield className={`h-4 w-4 ${getScoreColor(avgScore || 12)}`} />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <ScoreRing score={avgScore || 12} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-3xl font-bold ${getScoreColor(avgScore || 12)}`}>{avgScore}</span>
                <span className="text-sm text-muted-foreground">平均分 / 12</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                共 {tutors.length} 名教练
                {lowCreditTutors.length > 0 && (
                  <span className="text-red-600 ml-1">
                    · {lowCreditTutors.length} 人低信用
                  </span>
                )}
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <span>查看详情</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
