/**
 * 订单运营审核相关组件和工具
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Check, X, Upload, Clock } from "lucide-react"
import { toast } from "sonner"
import { OrderStatus, type Order } from "@/types"
import { SCHEDULING_TIMEOUT_HOURS } from "@/lib/order-constants"

// === 排单倒计时组件 ===

export function SchedulingCountdown({ startTime }: { startTime: Date }) {
  const [remaining, setRemaining] = React.useState<number>(0)
  
  React.useEffect(() => {
    const updateRemaining = () => {
      const now = new Date()
      const start = new Date(startTime)
      const elapsed = (now.getTime() - start.getTime()) / 1000 // 秒
      const total = SCHEDULING_TIMEOUT_HOURS * 3600
      const rem = Math.max(0, total - elapsed)
      setRemaining(rem)
      
      if (rem <= 0) {
        // 超时，提示用户刷新页面
        toast.warning('排单已超时，请刷新页面查看最新状态')
      }
    }
    
    updateRemaining()
    const timer = setInterval(updateRemaining, 1000)
    return () => clearInterval(timer)
  }, [startTime])
  
  const hours = Math.floor(remaining / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  const seconds = Math.floor(remaining % 60)
  
  const isUrgent = remaining < 3600 // 少于1小时显示警告色
  
  return (
    <Badge 
      variant="outline" 
      className={`text-blue-600 border-blue-600 ${isUrgent ? 'animate-pulse border-red-500 text-red-600' : ''}`}
    >
      <Clock className="mr-1 h-3 w-3" />
      排单中 {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
    </Badge>
  )
}

// === 支付凭证上传组件 ===

interface VoucherUploadProps {
  vouchers: string[]
  onUpload: (base64: string) => void
  onRemove: (index: number) => void
}

export function VoucherUpload({ vouchers, onUpload, onRemove }: VoucherUploadProps) {
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    // 检查文件大小（限制500KB）
    if (file.size > 500 * 1024) {
      toast.error('图片大小不能超过500KB')
      return
    }
    
    // 转换为Base64
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      onUpload(base64)
      toast.success('凭证上传成功')
    }
    reader.onerror = () => {
      toast.error('图片转换失败')
    }
    reader.readAsDataURL(file)
  }
  
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {vouchers.map((voucher, index) => (
          <div key={index} className="relative group">
            <img
              src={voucher}
              alt={`凭证${index + 1}`}
              className="w-24 h-24 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => window.open(voucher, '_blank')}
            />
            <button
              onClick={() => onRemove(index)}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        
        {vouchers.length < 5 && (
          <label className="w-24 h-24 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="h-6 w-6 text-muted-foreground" />
          </label>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        最多上传5张图片，每张不超过500KB（存储在localStorage）
      </p>
    </div>
  )
}

// === 客服审核对话框 ===

interface CsReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onApprove: (note?: string) => void
  onReject: (note: string) => void
}

export function CsReviewDialog({ open, onOpenChange, order, onApprove, onReject }: CsReviewDialogProps) {
  const [note, setNote] = React.useState("")
  const [vouchers, setVouchers] = React.useState<string[]>(order?.paymentVouchers || [])
  
  React.useEffect(() => {
    if (order) {
      setVouchers(order.paymentVouchers || [])
    }
  }, [order])
  
  const handleApprove = () => {
    onApprove(note)
    setNote("")
    onOpenChange(false)
  }
  
  const handleReject = () => {
    if (!note.trim()) {
      toast.error('请填写驳回原因')
      return
    }
    onReject(note)
    setNote("")
    onOpenChange(false)
  }
  
  const handleUpload = (base64: string) => {
    setVouchers(prev => [...prev, base64])
  }
  
  const handleRemove = (index: number) => {
    setVouchers(prev => prev.filter((_, i) => i !== index))
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>客服专员审核</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-sm font-medium mb-2">支付凭证</h4>
            <VoucherUpload
              vouchers={vouchers}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">审核批注（可选）</h4>
            <Textarea
              placeholder="请输入审核意见..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleReject}>
            <X className="mr-2 h-4 w-4" />
            驳回
          </Button>
          <Button onClick={handleApprove}>
            <Check className="mr-2 h-4 w-4" />
            通过
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// === 财务审核对话框 ===

interface FinanceReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: Order | null
  onApprove: (note?: string) => void
  onReject: (note: string) => void
}

export function FinanceReviewDialog({ open, onOpenChange, order, onApprove, onReject }: FinanceReviewDialogProps) {
  const [note, setNote] = React.useState("")
  
  const handleApprove = () => {
    onApprove(note)
    setNote("")
    onOpenChange(false)
  }
  
  const handleReject = () => {
    if (!note.trim()) {
      toast.error('请填写驳回原因')
      return
    }
    onReject(note)
    setNote("")
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>财务审核</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {order?.paymentVouchers && order.paymentVouchers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-2">支付凭证</h4>
              <div className="flex flex-wrap gap-2">
                {order.paymentVouchers.map((voucher, index) => (
                  <img
                    key={index}
                    src={voucher}
                    alt={`凭证${index + 1}`}
                    className="w-20 h-20 object-cover rounded border cursor-pointer hover:opacity-80"
                    onClick={() => window.open(voucher, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}
          
          {order?.csReviewNote && (
            <div>
              <h4 className="text-sm font-medium mb-1">客服审核意见</h4>
              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                {order.csReviewNote}
              </p>
            </div>
          )}
          
          <div>
            <h4 className="text-sm font-medium mb-2">财务审核意见</h4>
            <Textarea
              placeholder={note ? "修改审核意见..." : "请输入审核意见..."}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button variant="destructive" onClick={handleReject}>
            <X className="mr-2 h-4 w-4" />
            驳回
          </Button>
          <Button onClick={handleApprove}>
            <Check className="mr-2 h-4 w-4" />
            通过
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
