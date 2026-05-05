"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function TeachingFeedbackPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/teaching-feedback/feedback-search")
  }, [router])

  return null
}
