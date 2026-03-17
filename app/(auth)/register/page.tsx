"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { UserPlus, GraduationCap, Users } from "lucide-react"

export default function RegisterSelectPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-primary">注册账号</h1>
          <p className="text-sm text-muted-foreground">请选择您的账号类型</p>
        </div>

        <div className="grid gap-4">
          <Link href="/register/sales" className="block">
            <Card className="cursor-pointer border-2 hover:border-primary hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">招生老师</CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    负责招生咨询、学员报名等工作
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/register/tutor" className="block">
            <Card className="cursor-pointer border-2 hover:border-primary hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30">
                  <GraduationCap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">伴学教练</CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    负责陪伴学员学习、辅导答疑等工作
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          已有账号？{" "}
          <Link href="/login" className="text-primary hover:underline font-medium">
            立即登录
          </Link>
        </div>
      </div>
    </div>
  )
}
