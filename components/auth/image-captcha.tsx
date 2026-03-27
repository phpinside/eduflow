"use client"

import { useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RefreshCw } from "lucide-react"

const CHARSET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"

function randomCode(length: number): string {
  let s = ""
  const cryptoOrRandom = typeof crypto !== "undefined" && crypto.getRandomValues
  if (cryptoOrRandom) {
    const buf = new Uint8Array(length)
    crypto.getRandomValues(buf)
    for (let i = 0; i < length; i++) {
      s += CHARSET[buf[i] % CHARSET.length]
    }
    return s
  }
  for (let i = 0; i < length; i++) {
    s += CHARSET[Math.floor(Math.random() * CHARSET.length)]
  }
  return s
}

function drawCaptcha(canvas: HTMLCanvasElement | null, code: string) {
  if (!canvas) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return

  const w = canvas.width
  const h = canvas.height
  ctx.fillStyle = "#f4f4f5"
  ctx.fillRect(0, 0, w, h)

  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `rgba(${40 + Math.random() * 80},${40 + Math.random() * 80},${40 + Math.random() * 80},0.35)`
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(Math.random() * w, Math.random() * h)
    ctx.bezierCurveTo(
      Math.random() * w,
      Math.random() * h,
      Math.random() * w,
      Math.random() * h,
      Math.random() * w,
      Math.random() * h
    )
    ctx.stroke()
  }

  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(${100 + Math.random() * 100},${100 + Math.random() * 100},${100 + Math.random() * 100},0.45)`
    ctx.beginPath()
    ctx.arc(Math.random() * w, Math.random() * h, Math.random() * 1.2 + 0.3, 0, Math.PI * 2)
    ctx.fill()
  }

  const charW = w / (code.length + 1)
  for (let i = 0; i < code.length; i++) {
    ctx.save()
    ctx.translate(charW * (i + 1), h / 2)
    ctx.rotate((Math.random() - 0.5) * 0.5)
    ctx.fillStyle = `rgb(${20 + Math.random() * 60},${20 + Math.random() * 80},${40 + Math.random() * 80})`
    ctx.font = `bold ${22 + Math.random() * 6}px ui-sans-serif, system-ui, sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(code[i]!, charW * 0.08 * (Math.random() - 0.5), (Math.random() - 0.5) * 4)
    ctx.restore()
  }
}

export type ImageCaptchaProps = {
  /** 每次生成新验证码时回调，用于表单校验 */
  onCodeReady: (code: string) => void
  /** 点击换一张时调用，可清空输入框 */
  onRefresh?: () => void
  className?: string
}

export function ImageCaptcha({ onCodeReady, onRefresh, className }: ImageCaptchaProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onCodeReadyRef = useRef(onCodeReady)
  const onRefreshRef = useRef(onRefresh)

  useEffect(() => {
    onCodeReadyRef.current = onCodeReady
    onRefreshRef.current = onRefresh
  })

  const refresh = useCallback(() => {
    const code = randomCode(4)
    onCodeReadyRef.current(code)
    drawCaptcha(canvasRef.current, code)
    onRefreshRef.current?.()
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <canvas
        ref={canvasRef}
        width={120}
        height={44}
        className="rounded-md border border-border bg-muted/30 cursor-default select-none"
        aria-hidden
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="h-11 w-11 shrink-0"
        onClick={refresh}
        title="换一张"
      >
        <RefreshCw className="h-4 w-4" />
      </Button>
    </div>
  )
}
