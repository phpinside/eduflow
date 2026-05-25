"use client"

import * as React from "react"
import {
  BadgeCheck,
  Camera,
  Check,
  ClipboardCheck,
  Eye,
  Film,
  ImagePlus,
  Loader2,
  Pencil,
  Play,
  Plus,
  Save,
  Send,
  Sparkles,
  Star,
  Target,
  Trash2,
  Trophy,
  UploadCloud,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

type CoachStatus = "draft" | "reviewing" | "published"
type UploadStatus = "empty" | "uploading" | "reviewing" | "approved"

interface CoachProfileForm {
  realName: string
  displayName: string
  gender: string
  school: string
  major: string
  grade: string
  city: string
  bio: string
  subjects: string[]
  studentGrades: string[]
  strengths: string[]
  personalityTags: string[]
}

interface StudentCase {
  id: string
  studentGrade: string
  originalProblem: string
  tutoringMethod: string
  result: string
  parentReview: string
  scoreChange: string
  qualityScore: number
  image?: string
}

interface VideoAsset {
  id: string
  title: string
  type: "intro" | "trial" | "classroom"
  status: UploadStatus
  progress: number
  preview?: string
}

const mockProfile: CoachProfileForm = {
  realName: "林知夏",
  displayName: "林知夏",
  gender: "女",
  school: "华东师范大学",
  major: "数学与应用数学",
  grade: "研一",
  city: "上海",
  bio: "擅长把抽象知识拆成学生听得懂的步骤，关注孩子的学习节奏和信心建立。带过多名初高中学生完成基础补弱与阶段提分。",
  subjects: ["数学", "物理"],
  studentGrades: ["八年级", "九年级", "高一"],
  strengths: ["基础补弱", "学习习惯", "中考冲刺"],
  personalityTags: ["温柔耐心", "善于鼓励", "严谨负责"],
}

const mockCases: StudentCase[] = [
  {
    id: "case-1",
    studentGrade: "初二",
    originalProblem: "计算题正确率不稳定，遇到综合题容易放弃。",
    tutoringMethod: "用错题归因表拆解薄弱点，每周安排 2 次限时训练，并在讲题后让学生复述解题路径。",
    result: "6 周后月考数学从 78 分提升到 91 分，压轴题步骤分明显提升。",
    parentReview: "老师反馈很细，孩子愿意主动整理错题了。",
    scoreChange: "78 -> 91",
    qualityScore: 86,
  },
]

const mockVideos: VideoAsset[] = [
  { id: "video-1", title: "自我介绍", type: "intro", status: "reviewing", progress: 100 },
  { id: "video-2", title: "3分钟试讲", type: "trial", status: "empty", progress: 0 },
  { id: "video-3", title: "课程互动片段", type: "classroom", status: "empty", progress: 0 },
]

const subjects = ["数学", "英语", "物理", "化学", "语文", "生物", "地理", "历史"]
const grades = ["一年级", "二年级", "三年级", "四年级", "五年级", "六年级", "七年级", "八年级", "九年级", "高一", "高二", "高三"]
const strengths = ["基础补弱", "尖子培优", "学习习惯", "中考冲刺", "高考规划", "作业陪跑", "错题整理", "表达训练"]
const personalities = ["温柔耐心", "善于鼓励", "严谨负责", "逻辑清晰", "活泼亲和", "目标感强", "擅长沟通", "稳定陪伴"]

function completionOf(profile: CoachProfileForm, cases: StudentCase[], videos: VideoAsset[]) {
  const checks = [
    profile.realName,
    profile.school,
    profile.major,
    profile.city,
    profile.bio.length >= 80,
    profile.subjects.length >= 1,
    profile.studentGrades.length >= 1,
    profile.strengths.length >= 2,
    profile.personalityTags.length >= 2,
    cases.length >= 1,
    cases.length >= 2,
    videos.some(video => video.type === "intro" && video.status !== "empty"),
    videos.some(video => video.type === "trial" && video.status !== "empty"),
    videos.some(video => video.type === "classroom" && video.status !== "empty"),
  ]

  return Math.round((checks.filter(Boolean).length / checks.length) * 100)
}

function createEmptyCase(): StudentCase {
  return {
    id: `case-${Date.now()}`,
    studentGrade: "",
    originalProblem: "",
    tutoringMethod: "",
    result: "",
    parentReview: "",
    scoreChange: "",
    qualityScore: 20,
  }
}

function scoreCaseQuality(item: StudentCase) {
  const checks = [
    item.studentGrade.trim().length > 0,
    item.originalProblem.trim().length >= 18,
    item.tutoringMethod.trim().length >= 24,
    item.result.trim().length >= 20,
    item.parentReview.trim().length >= 8,
    item.scoreChange.trim().length >= 3,
    Boolean(item.image),
  ]

  return Math.min(96, Math.max(20, Math.round((checks.filter(Boolean).length / checks.length) * 100)))
}

function SectionShell({
  eyebrow,
  title,
  description,
  icon: Icon,
  children,
  action,
}: {
  eyebrow: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md sm:p-6">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{title}</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function TagPicker({
  options,
  value,
  onChange,
  tone = "blue",
}: {
  options: string[]
  value: string[]
  onChange: (next: string[]) => void
  tone?: "blue" | "emerald" | "rose" | "amber"
}) {
  const toneClass = {
    blue: "data-[selected=true]:border-blue-500 data-[selected=true]:bg-blue-50 data-[selected=true]:text-blue-700",
    emerald: "data-[selected=true]:border-emerald-500 data-[selected=true]:bg-emerald-50 data-[selected=true]:text-emerald-700",
    rose: "data-[selected=true]:border-rose-500 data-[selected=true]:bg-rose-50 data-[selected=true]:text-rose-700",
    amber: "data-[selected=true]:border-amber-500 data-[selected=true]:bg-amber-50 data-[selected=true]:text-amber-700",
  }[tone]

  return (
    <div className="flex flex-wrap gap-2">
      {options.map(option => {
        const selected = value.includes(option)
        return (
          <button
            key={option}
            type="button"
            data-selected={selected}
            onClick={() =>
              onChange(selected ? value.filter(item => item !== option) : [...value, option])
            }
            className={cn(
              "rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
              toneClass
            )}
          >
            {selected && <Check className="mr-1 inline h-3.5 w-3.5" />}
            {option}
          </button>
        )
      })}
    </div>
  )
}

function UploadPanel({
  asset,
  onUpload,
}: {
  asset: VideoAsset
  onUpload: (id: string, preview?: string) => void
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const statusText = {
    empty: "待上传",
    uploading: "上传中",
    reviewing: "审核中",
    approved: "已通过",
  }[asset.status]

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined
    onUpload(asset.id, preview)
    event.target.value = ""
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      className="group min-h-48 cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-blue-50/50 hover:shadow-md"
    >
      <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleChange} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white shadow-sm">
            <Film className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{asset.title}</p>
            <p className="text-xs text-slate-500">{statusText}</p>
          </div>
        </div>
        <Badge variant="secondary" className="rounded-full">{statusText}</Badge>
      </div>

      <div className="mt-4 flex h-28 items-center justify-center overflow-hidden rounded-lg bg-white">
        {asset.preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={asset.preview} alt={asset.title} className="h-full w-full object-cover" />
        ) : asset.status === "empty" ? (
          <div className="text-center">
            <UploadCloud className="mx-auto h-8 w-8 text-slate-400 transition-transform group-hover:-translate-y-1" />
            <p className="mt-2 text-sm font-medium text-slate-600">拖拽或点击上传</p>
            <p className="text-xs text-slate-400">建议横屏清晰录制，声音稳定</p>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-600">
            <Play className="h-8 w-8 rounded-full bg-slate-950 p-2 text-white" />
            <span className="text-sm">已上传内容预览</span>
          </div>
        )}
      </div>

      {asset.status === "uploading" && (
        <div className="mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-all duration-500" style={{ width: `${asset.progress}%` }} />
          </div>
          <p className="mt-1 text-right text-xs text-slate-500">{asset.progress}%</p>
        </div>
      )}
    </div>
  )
}

function CaseEditor({
  value,
  mode,
  onChange,
  onCancel,
  onSave,
}: {
  value: StudentCase
  mode: "create" | "edit"
  onChange: (next: StudentCase) => void
  onCancel: () => void
  onSave: () => void
}) {
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const qualityScore = scoreCaseQuality(value)

  function updateCase<K extends keyof StudentCase>(key: K, nextValue: StudentCase[K]) {
    onChange({ ...value, [key]: nextValue })
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    updateCase("image", URL.createObjectURL(file))
    event.target.value = ""
  }

  return (
    <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50/50 p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-blue-950">
          {mode === "create" ? "添加学生提升案例" : "编辑学生提升案例"}
          <span className="ml-2 text-xs font-normal text-blue-600">按问题、方法、结果、评价填写，可直接用于招生素材</span>
        </p>
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm">
          <Star className="h-4 w-4 text-amber-500" />
          案例质量 {qualityScore}
        </div>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <label className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
            学生年级
            <span className="text-xs font-normal text-slate-400">例：初二</span>
          </span>
          <Input
            value={value.studentGrade}
            onChange={event => updateCase("studentGrade", event.target.value)}
            placeholder="初二 / 高一 / 小学五年级"
            className="mt-2 border-0 bg-slate-50 shadow-none focus-visible:ring-blue-200"
          />
        </label>
        <label className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
            成绩变化
            <span className="text-xs font-normal text-slate-400">越具体越好</span>
          </span>
          <Input
            value={value.scoreChange}
            onChange={event => updateCase("scoreChange", event.target.value)}
            placeholder="78 -> 91 / 班级排名提升 12 名"
            className="mt-2 border-0 bg-slate-50 shadow-none focus-visible:ring-blue-200"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <label className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
            学生原问题
            <span className="text-xs font-normal text-slate-400">先讲清痛点</span>
          </span>
          <Textarea
            value={value.originalProblem}
            onChange={event => updateCase("originalProblem", event.target.value)}
            placeholder="例：计算题正确率不稳定，综合题读题慢，遇到压轴题容易放弃。"
            className="mt-2 min-h-24 resize-none border-0 bg-slate-50 shadow-none focus-visible:ring-blue-200"
          />
        </label>
        <label className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
            辅导方式
            <span className="text-xs font-normal text-slate-400">突出你的方法</span>
          </span>
          <Textarea
            value={value.tutoringMethod}
            onChange={event => updateCase("tutoringMethod", event.target.value)}
            placeholder="例：用错题归因表定位薄弱点，再用限时训练和复述法稳定解题路径。"
            className="mt-2 min-h-24 resize-none border-0 bg-slate-50 shadow-none focus-visible:ring-blue-200"
          />
        </label>
        <label className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
            提升结果
            <span className="text-xs font-normal text-slate-400">写可证明变化</span>
          </span>
          <Textarea
            value={value.result}
            onChange={event => updateCase("result", event.target.value)}
            placeholder="例：6 周后月考数学从 78 分提升到 91 分，压轴题步骤分明显提升。"
            className="mt-2 min-h-24 resize-none border-0 bg-slate-50 shadow-none focus-visible:ring-blue-200"
          />
        </label>
        <label className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
          <span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900">
            家长评价
            <span className="text-xs font-normal text-slate-400">可用原话</span>
          </span>
          <Textarea
            value={value.parentReview}
            onChange={event => updateCase("parentReview", event.target.value)}
            placeholder="例：老师反馈很细，孩子愿意主动整理错题了。"
            className="mt-2 min-h-24 resize-none border-0 bg-slate-50 shadow-none focus-visible:ring-blue-200"
          />
        </label>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-stretch">
        <div className="rounded-lg border border-dashed border-blue-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900">
              案例图片
              <span className="ml-2 text-xs font-normal text-slate-400">成绩单局部、错题整理、家长反馈截图，注意隐私</span>
            </p>
            <Button type="button" variant="outline" size="sm" className="gap-2 rounded-lg" onClick={() => imageInputRef.current?.click()}>
              <ImagePlus className="h-4 w-4" />
              上传图片
            </Button>
            <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>
          {value.image && (
            <div className="mt-3 h-28 overflow-hidden rounded-lg bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={value.image} alt="学生案例图片预览" className="h-full w-full object-cover" />
            </div>
          )}
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-800 lg:w-64">
          {qualityScore >= 80 ? "案例结果感不错，补图会更有说服力。" : "建议补充可量化结果和家长评价。"}
        </div>
      </div>

      <div className="mt-3 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" className="rounded-lg" onClick={onCancel}>
          取消
        </Button>
        <Button type="button" className="gap-2 rounded-lg" onClick={onSave}>
          <Save className="h-4 w-4" />
          保存案例
        </Button>
      </div>
    </div>
  )
}
export default function CoachProfileEditorPage() {
  const [profile, setProfile] = React.useState<CoachProfileForm>(mockProfile)
  const [status] = React.useState<CoachStatus>("draft")
  const [avatar, setAvatar] = React.useState("https://api.dicebear.com/7.x/notionists/svg?seed=coach-profile")
  const [cases, setCases] = React.useState<StudentCase[]>(mockCases)
  const [editingCase, setEditingCase] = React.useState<StudentCase | null>(null)
  const [caseEditorMode, setCaseEditorMode] = React.useState<"create" | "edit">("create")
  const [videos, setVideos] = React.useState<VideoAsset[]>(mockVideos)
  const avatarInputRef = React.useRef<HTMLInputElement>(null)
  const completion = completionOf(profile, cases, videos)
  const remainingCases = Math.max(0, 2 - cases.length)

  function updateProfile<K extends keyof CoachProfileForm>(key: K, value: CoachProfileForm[K]) {
    setProfile(prev => ({
      ...prev,
      [key]: value,
      ...(key === "realName" ? { displayName: value as string } : {}),
    }))
  }

  function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatar(URL.createObjectURL(file))
    event.target.value = ""
  }

  function addCase() {
    setCaseEditorMode("create")
    setEditingCase(createEmptyCase())
  }

  function editCase(item: StudentCase) {
    setCaseEditorMode("edit")
    setEditingCase({ ...item })
  }

  function saveCase() {
    if (!editingCase) return

    if (!editingCase.studentGrade.trim() || !editingCase.originalProblem.trim() || !editingCase.tutoringMethod.trim() || !editingCase.result.trim()) {
      toast.error("请至少填写学生年级、原问题、辅导方式和提升结果")
      return
    }

    const nextCase = {
      ...editingCase,
      qualityScore: scoreCaseQuality(editingCase),
    }

    setCases(prev => {
      const exists = prev.some(item => item.id === nextCase.id)
      return exists ? prev.map(item => (item.id === nextCase.id ? nextCase : item)) : [...prev, nextCase]
    })
    setEditingCase(null)
    toast.success(caseEditorMode === "create" ? "案例已添加" : "案例已更新")
  }

  function removeCase(id: string) {
    setCases(prev => prev.filter(item => item.id !== id))
    if (editingCase?.id === id) {
      setEditingCase(null)
    }
    toast.success("案例已删除")
  }

  function uploadVideo(id: string, preview?: string) {
    setVideos(prev =>
      prev.map(video =>
        video.id === id ? { ...video, status: "uploading", progress: 42, preview } : video
      )
    )
    window.setTimeout(() => {
      setVideos(prev =>
        prev.map(video =>
          video.id === id ? { ...video, status: "reviewing", progress: 100, preview: preview ?? video.preview } : video
        )
      )
      toast.success("内容已上传，等待审核")
    }, 700)
  }

  return (
    <div className="min-h-screen bg-[#f7f8fb] pb-28 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_48%,#0f766e_100%)] px-4 py-5 text-white sm:px-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  className="group relative shrink-0 rounded-full ring-4 ring-white/20 transition-transform hover:scale-105"
                >
                  <Avatar className="h-20 w-20 border-2 border-white/70 sm:h-24 sm:w-24">
                    <AvatarImage src={avatar} />
                    <AvatarFallback>{profile.realName.slice(0, 1)}</AvatarFallback>
                  </Avatar>
                  <span className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-950/45 opacity-0 transition-opacity group-hover:opacity-100">
                    <Camera className="h-6 w-6" />
                  </span>
                </button>
                <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{profile.realName}</h1>
                    <Badge className="rounded-full bg-white/15 text-white hover:bg-white/20">展示页草稿</Badge>
                  </div>
                  <p className="mt-1 text-sm text-white/75">{profile.school} · {profile.major}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[...profile.subjects, ...profile.strengths.slice(0, 2)].map(tag => (
                      <span key={tag} className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/20">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:w-[430px]">
                <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                  <p className="text-sm font-medium">优秀展示页更容易获得排课机会</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">把你的教学方法、案例和视频讲清楚，招生老师更敢推荐你。</p>
                </div>
                <div className="rounded-lg bg-white/10 p-4 ring-1 ring-white/15 backdrop-blur">
                  <p className="text-sm font-medium">资料越完整，越容易被校长选择</p>
                  <p className="mt-1 text-xs leading-5 text-white/65">校长筛选时会优先看到案例完整、风格清晰的教练。</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700"><BadgeCheck className="h-4 w-4" />已认证教练</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700"><Trophy className="h-4 w-4" />优秀案例导师</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1 font-medium text-rose-700"><Film className="h-4 w-4" />视频认证待点亮</span>
            </div>
            <Button variant="outline" className="gap-2 rounded-lg">
              <Eye className="h-4 w-4" />
              主页预览
            </Button>
          </div>
        </section>

        <section>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">资料完整度</p>
                <h2 className="mt-1 text-2xl font-semibold tracking-tight">你的教练主页已完成 {completion}%</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {remainingCases > 0 ? `再完善 ${remainingCases} 个学生案例，可提升曝光机会。` : "案例基础已经不错，继续补充视频会更容易被选中。"}
                </p>
              </div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl font-bold text-blue-700 ring-8 ring-blue-100/70">
                {completion}%
              </div>
            </div>
            <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,#2563eb,#14b8a6,#f59e0b)] transition-all duration-700" style={{ width: `${completion}%` }} />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
              {["基础信息完整", "案例达到 2 个", "三类视频完善"].map((item, index) => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  <span className={cn("flex h-5 w-5 items-center justify-center rounded-full", index === 1 && remainingCases > 0 ? "bg-slate-200 text-slate-400" : "bg-emerald-500 text-white")}>
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        <SectionShell eyebrow="Step 01" title="基础信息" description="展示给校长和招生老师看的核心身份信息，保持真实、清楚、好传播。" icon={UserRound}>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">真实姓名 <span className="text-xs font-normal text-slate-400">后台</span></span>
              <Input value={profile.realName} onChange={event => updateProfile("realName", event.target.value)} placeholder="林知夏" className="bg-slate-50 shadow-none" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">性别</span>
              <Input value={profile.gender} onChange={event => updateProfile("gender", event.target.value)} placeholder="女" className="bg-slate-50 shadow-none" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">所在城市</span>
              <Input value={profile.city} onChange={event => updateProfile("city", event.target.value)} placeholder="上海" className="bg-slate-50 shadow-none" />
            </label>
            <label className="space-y-1.5 lg:col-span-2">
              <span className="text-sm font-medium text-slate-700">学校</span>
              <Input value={profile.school} onChange={event => updateProfile("school", event.target.value)} placeholder="华东师范大学" className="bg-slate-50 shadow-none" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">专业</span>
              <Input value={profile.major} onChange={event => updateProfile("major", event.target.value)} placeholder="数学与应用数学" className="bg-slate-50 shadow-none" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">年级</span>
              <Input value={profile.grade} onChange={event => updateProfile("grade", event.target.value)} placeholder="研一 / 大三" className="bg-slate-50 shadow-none" />
            </label>
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">自我介绍</p>
              <span className={cn("text-xs", profile.bio.length > 300 ? "text-rose-600" : "text-slate-400")}>{profile.bio.length}/300</span>
            </div>
            <Textarea
              value={profile.bio}
              maxLength={320}
              onChange={event => updateProfile("bio", event.target.value.slice(0, 300))}
              className="mt-2 min-h-24 resize-none bg-slate-50 shadow-none"
              placeholder="例：擅长把复杂题型拆成清晰步骤，帮助学生建立稳定的解题节奏与学习信心。"
            />
          </div>
        </SectionShell>

        <SectionShell eyebrow="Step 02" title="教学能力" description="用标签把你的教学人设讲清楚，方便招生老师匹配家庭需求。" icon={Target}>
          <div className="grid gap-5">
            <div><p className="mb-3 text-sm font-semibold text-slate-900">学科</p><TagPicker options={subjects} value={profile.subjects} onChange={next => updateProfile("subjects", next)} /></div>
            <div><p className="mb-3 text-sm font-semibold text-slate-900">年级</p><TagPicker options={grades} value={profile.studentGrades} onChange={next => updateProfile("studentGrades", next)} tone="emerald" /></div>
            <div><p className="mb-3 text-sm font-semibold text-slate-900">擅长方向</p><TagPicker options={strengths} value={profile.strengths} onChange={next => updateProfile("strengths", next)} tone="amber" /></div>
            <div><p className="mb-3 text-sm font-semibold text-slate-900">性格风格</p><TagPicker options={personalities} value={profile.personalityTags} onChange={next => updateProfile("personalityTags", next)} tone="rose" /></div>
          </div>
        </SectionShell>

        <SectionShell eyebrow="Step 03" title="学生提升案例" description="案例是被选择的关键。越具体，越能体现你的结果交付能力。" icon={ClipboardCheck} action={<Button onClick={addCase} className="gap-2 rounded-lg"><Plus className="h-4 w-4" />添加案例</Button>}>
          {editingCase && (
            <CaseEditor
              value={editingCase}
              mode={caseEditorMode}
              onChange={setEditingCase}
              onCancel={() => setEditingCase(null)}
              onSave={saveCase}
            />
          )}
          <div className="grid gap-4 lg:grid-cols-2">
            {cases.map(item => (
              <article key={item.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.studentGrade} 提升案例</p>
                    <p className="mt-1 text-xs text-slate-400">结构：原问题 - 辅导方式 - 提升结果</p>
                  </div>
                  <Badge className={cn("rounded-full", item.qualityScore >= 80 ? "bg-emerald-600" : "bg-amber-500")}>质量 {item.qualityScore}</Badge>
                </div>
                <div className="mt-4 grid gap-3 text-sm">
                  {item.image && (
                    <div className="h-36 overflow-hidden rounded-lg bg-slate-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.image} alt={`${item.studentGrade} 案例图片`} className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="rounded-lg bg-slate-50 p-3"><span className="font-medium text-slate-700">原问题：</span><span className="text-slate-600">{item.originalProblem}</span></div>
                  <div className="rounded-lg bg-slate-50 p-3"><span className="font-medium text-slate-700">辅导方式：</span><span className="text-slate-600">{item.tutoringMethod}</span></div>
                  <div className="rounded-lg bg-emerald-50 p-3"><span className="font-medium text-emerald-800">提升结果：</span><span className="text-emerald-700">{item.result}</span></div>
                  <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3 text-blue-800">
                    <span className="font-medium">成绩变化</span>
                    <span className="font-semibold">{item.scoreChange}</span>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3"><span className="font-medium text-slate-700">家长评价：</span><span className="text-slate-600">{item.parentReview}</span></div>
                </div>
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  {item.qualityScore >= 80 ? "这个案例很有结果感，可以继续补充一张错题或反馈截图。" : "你的案例描述较简单，建议增加具体提升结果。"}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="gap-2 rounded-lg" onClick={() => editCase(item)}><Pencil className="h-4 w-4" />编辑案例</Button>
                  <Button variant="outline" size="sm" className="gap-2 rounded-lg text-rose-600 hover:text-rose-700" onClick={() => removeCase(item.id)}><Trash2 className="h-4 w-4" />删除</Button>
                </div>
              </article>
            ))}
            <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <Star className="h-10 w-10 text-amber-500" />
              <p className="mt-3 text-sm font-semibold text-slate-900">优秀案例示例</p>
              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">建议写出学生原始状态、你采取的辅导策略、最终变化，并尽量用分数、排名、习惯动作证明结果。</p>
            </div>
          </div>
        </SectionShell>

        <SectionShell eyebrow="Step 04" title="视频展示" description="视频让家长看到你的表达状态，也让校长更快判断你适合什么学生。" icon={Film}>
          <div className="grid gap-4 lg:grid-cols-3">
            {videos.map(video => <UploadPanel key={video.id} asset={video} onUpload={uploadVideo} />)}
          </div>
          <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm text-cyan-800">
            带互动片段的视频更容易获得排课。建议展示“提问、等待学生思考、纠错、鼓励”的完整过程。
          </div>
        </SectionShell>

      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/90 px-4 py-3 shadow-[0_-12px_30px_rgba(15,23,42,0.08)] backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="hidden h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white sm:flex">
              {status === "reviewing" ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">正在打造你的金牌教练主页</p>
              <p className="text-xs text-slate-500">当前完整度 {completion}%，保存后招生老师可使用最新素材。</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 sm:flex">
            <Button variant="outline" className="gap-2 rounded-lg"><Save className="h-4 w-4" />保存草稿</Button>
            <Button variant="outline" className="gap-2 rounded-lg"><Eye className="h-4 w-4" />预览</Button>
            <Button onClick={() => toast.success("已提交审核")} className="gap-2 rounded-lg"><Send className="h-4 w-4" />提交审核</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
