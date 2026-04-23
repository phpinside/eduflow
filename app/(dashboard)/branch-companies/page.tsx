"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import { Plus, Search, Pencil, Trash2, X } from "lucide-react"
import type { BranchCompany } from "@/types"
import { getStoredBranchCompanies, saveStoredBranchCompanies } from "@/lib/storage"

export default function BranchCompanyPage() {
  const [companies, setCompanies] = React.useState<BranchCompany[]>([])
  const [searchTerm, setSearchTerm] = React.useState("")
  const [isEditOpen, setIsEditOpen] = React.useState(false)
  const [editingCompany, setEditingCompany] = React.useState<BranchCompany | null>(null)
  const [formData, setFormData] = React.useState({
    name: "",
    managerName: "",
    phone: "",
    wechat: "",
    csName: "",
    csPhone: "",
    enabled: true
  })

  React.useEffect(() => {
    setCompanies(getStoredBranchCompanies())
  }, [])

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.managerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.csName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenCreate = () => {
    setEditingCompany(null)
    setFormData({
      name: "",
      managerName: "",
      phone: "",
      wechat: "",
      csName: "",
      csPhone: "",
      enabled: true
    })
    setIsEditOpen(true)
  }

  const handleOpenEdit = (company: BranchCompany) => {
    setEditingCompany(company)
    setFormData({
      name: company.name,
      managerName: company.managerName,
      phone: company.phone || "",
      wechat: company.wechat || "",
      csName: company.csName,
      csPhone: company.csPhone || "",
      enabled: company.enabled
    })
    setIsEditOpen(true)
  }

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast.error("请填写分公司名称")
      return
    }
    if (!formData.managerName.trim()) {
      toast.error("请填写负责人名称")
      return
    }
    if (!formData.csName.trim()) {
      toast.error("请填写专属客服人员姓名")
      return
    }

    const now = new Date()
    const updatedCompanies = [...companies]

    if (editingCompany) {
      const index = updatedCompanies.findIndex(c => c.id === editingCompany.id)
      if (index !== -1) {
        updatedCompanies[index] = {
          ...editingCompany,
          ...formData,
          updatedAt: now
        }
      }
      toast.success("分公司信息已更新")
    } else {
      const newCompany: BranchCompany = {
        id: `branch-${Date.now()}`,
        ...formData,
        createdAt: now,
        updatedAt: now
      }
      updatedCompanies.push(newCompany)
      toast.success("分公司创建成功")
    }

    setCompanies(updatedCompanies)
    saveStoredBranchCompanies(updatedCompanies)
    setIsEditOpen(false)
  }

  const handleDelete = (company: BranchCompany) => {
    if (!confirm(`确认删除分公司"${company.name}"？`)) return

    const updatedCompanies = companies.filter(c => c.id !== company.id)
    setCompanies(updatedCompanies)
    saveStoredBranchCompanies(updatedCompanies)
    toast.success("分公司已删除")
  }

  const handleToggleEnabled = (company: BranchCompany, enabled: boolean) => {
    const updatedCompanies = companies.map(c =>
      c.id === company.id ? { ...c, enabled, updatedAt: new Date() } : c
    )
    setCompanies(updatedCompanies)
    saveStoredBranchCompanies(updatedCompanies)
    toast.success(enabled ? "已启用" : "已停用")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">分公司管理</h2>
          <p className="text-muted-foreground">管理各分公司信息及专属客服配置</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          新增分公司
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>分公司列表</span>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索分公司名称或负责人"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>分公司名称</TableHead>
                <TableHead>负责人</TableHead>
                <TableHead>联系电话</TableHead>
                <TableHead>微信号</TableHead>
                <TableHead>专属客服</TableHead>
                <TableHead>客服电话</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    暂无分公司数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.managerName}</TableCell>
                    <TableCell>{company.phone || "—"}</TableCell>
                    <TableCell>{company.wechat || "—"}</TableCell>
                    <TableCell>{company.csName}</TableCell>
                    <TableCell>{company.csPhone || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={company.enabled}
                          onCheckedChange={(checked) => handleToggleEnabled(company, checked)}
                        />
                        <Badge variant={company.enabled ? "outline" : "secondary"}>
                          {company.enabled ? "启用" : "停用"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEdit(company)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDelete(company)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 编辑/创建对话框 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingCompany ? "编辑分公司" : "新增分公司"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>分公司名称 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="请输入分公司名称"
              />
            </div>

            <div className="space-y-2">
              <Label>负责人名称 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.managerName}
                onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                placeholder="请输入负责人名称"
              />
            </div>

            <div className="space-y-2">
              <Label>联系电话</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="请输入联系电话（选填）"
              />
            </div>

            <div className="space-y-2">
              <Label>微信号</Label>
              <Input
                value={formData.wechat}
                onChange={(e) => setFormData(prev => ({ ...prev, wechat: e.target.value }))}
                placeholder="请输入微信号（选填）"
              />
            </div>

            <div className="space-y-2">
              <Label>专属客服人员姓名 <span className="text-red-500">*</span></Label>
              <Input
                value={formData.csName}
                onChange={(e) => setFormData(prev => ({ ...prev, csName: e.target.value }))}
                placeholder="请输入专属客服人员姓名"
              />
            </div>

            <div className="space-y-2">
              <Label>专属客服人员电话</Label>
              <Input
                value={formData.csPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, csPhone: e.target.value }))}
                placeholder="请输入客服人员电话（选填）"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSave}>
              {editingCompany ? "保存修改" : "创建分公司"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
