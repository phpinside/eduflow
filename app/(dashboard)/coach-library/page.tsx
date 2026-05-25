"use client"

import * as React from "react"
import Link from "next/link"
import { Check, Search, RotateCcw, GraduationCap, MapPin, ChevronRight } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Pagination } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getCoachProfiles } from "@/lib/coach-library"
import { cn } from "@/lib/utils"

interface Filters {
  displayName: string
  gender: string
  school: string
  subjects: string[]
  studentGrades: string[]
  strengths: string[]
  personalityTags: string[]
}

const DEFAULT_FILTERS: Filters = {
  displayName: "",
  gender: "",
  school: "",
  subjects: [],
  studentGrades: [],
  strengths: [],
  personalityTags: [],
}

const GENDER_ALL = "__all__"
const PAGE_SIZE = 20

const subjects = ["语文", "数学", "英语", "物理", "化学", "生物", "历史", "地理"]
const grades = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级", "高一", "高二", "高三"]
const strengths = ["学习习惯", "基础补弱", "作业陪跑", "错题整理", "表达训练", "尖子培优", "中考冲刺", "高考规划"]
const personalities = ["温柔耐心", "善于鼓励", "活泼亲和", "逻辑清晰", "严谨负责", "擅长沟通", "稳定陪伴", "目标感强"]

function matchesAny(selected: string[], values: string[]) {
  return selected.length === 0 || selected.some(item => values.includes(item))
}

export default function CoachLibraryPage() {
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS)
  const [page, setPage] = React.useState(1)
  const coaches = React.useMemo(() => getCoachProfiles(), [])

  const filtered = React.useMemo(() => {
    return coaches.filter(coach => {
      if (filters.displayName && !coach.displayName.includes(filters.displayName)) return false
      if (filters.gender && coach.gender !== filters.gender) return false
      if (filters.school && !coach.school.includes(filters.school)) return false
      if (!matchesAny(filters.subjects, coach.subjects)) return false
      if (!matchesAny(filters.studentGrades, coach.studentGrades)) return false
      if (!matchesAny(filters.strengths, coach.strengths)) return false
      if (!matchesAny(filters.personalityTags, coach.personalityTags)) return false
      return true
    })
  }, [coaches, filters])

  function setFilter<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pagedCoaches = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const startIndex = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endIndex = Math.min(currentPage * PAGE_SIZE, filtered.length)

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-950">伴学教练库</h1>
          <p className="mt-1 text-sm text-slate-500">按姓名、性别、学校和教学能力筛选教练，查看可用于招生沟通的展示页。</p>
        </div>
        <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">共 {filtered.length} 位教练</Badge>
      </div>

      <Card className="rounded-lg border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Search className="h-4 w-4" />
              筛选条件
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-slate-500"
              onClick={() => {
                setFilters(DEFAULT_FILTERS)
                setPage(1)
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              重置
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">姓名</span>
              <Input value={filters.displayName} onChange={event => setFilter("displayName", event.target.value)} placeholder="例：李伴学" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">性别</span>
              <Select value={filters.gender || GENDER_ALL} onValueChange={value => setFilter("gender", value === GENDER_ALL ? "" : value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="全部" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GENDER_ALL}>全部</SelectItem>
                  <SelectItem value="男">男</SelectItem>
                  <SelectItem value="女">女</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">学校名称</span>
              <Input value={filters.school} onChange={event => setFilter("school", event.target.value)} placeholder="例：师范大学" />
            </label>
            <MultiSelectFilter
              title="学科"
              options={subjects}
              value={filters.subjects}
              onChange={next => setFilter("subjects", next)}
            />
            <MultiSelectFilter
              title="年级"
              options={grades}
              value={filters.studentGrades}
              onChange={next => setFilter("studentGrades", next)}
            />
            <MultiSelectFilter
              title="擅长方向"
              options={strengths}
              value={filters.strengths}
              onChange={next => setFilter("strengths", next)}
            />
            <MultiSelectFilter
              title="性格风格"
              options={personalities}
              value={filters.personalityTags}
              onChange={next => setFilter("personalityTags", next)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3">
        {pagedCoaches.map(coach => (
          <Link
            key={coach.id}
            href={`/coach-library/${coach.id}`}
            className="group rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 gap-3">
                <Avatar className="h-14 w-14 border border-slate-200">
                  <AvatarImage src={coach.avatar} />
                  <AvatarFallback>{coach.displayName.slice(0, 1)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-950">{coach.displayName}</h2>
                    <Badge variant="outline" className="rounded-full">{coach.gender}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                    <span className="inline-flex items-center gap-1"><GraduationCap className="h-4 w-4" />{coach.school} · {coach.major}</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{coach.city}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[...coach.subjects, ...coach.studentGrades.slice(0, 2), ...coach.strengths.slice(0, 2)].map(tag => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 text-sm text-slate-500 lg:min-w-56">
                <span>{coach.cases.length} 个提升案例</span>
                <span className="inline-flex items-center gap-1 font-medium text-blue-600">
                  查看展示页
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            暂无符合条件的伴学教练，请调整筛选条件。
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            第 {currentPage} / {totalPages} 页，当前显示 {startIndex}-{endIndex} 条，共 {filtered.length} 条
          </p>
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

function MultiSelectFilter({
  title,
  options,
  value,
  onChange,
}: {
  title: string
  options: string[]
  value: string[]
  onChange: (next: string[]) => void
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{title}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="h-9 w-full justify-between px-3 font-normal">
            <span className="truncate">
              {value.length === 0 ? "全部" : value.length === 1 ? value[0] : `已选 ${value.length} 项`}
            </span>
            <span className="ml-2 text-xs text-muted-foreground">多选</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-72 w-64 overflow-y-auto" align="start">
          <DropdownMenuLabel>{title}</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => onChange([])}>
            全部
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {options.map(option => {
            const checked = value.includes(option)
            return (
              <DropdownMenuItem
                key={option}
                onSelect={event => event.preventDefault()}
                onClick={() => onChange(checked ? value.filter(item => item !== option) : [...value, option])}
                className="gap-2"
              >
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border-2 shadow-sm",
                    checked
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-slate-400 bg-white"
                  )}
                >
                  {checked && <Check className="h-3 w-3" />}
                </span>
                {option}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </label>
  )
}
