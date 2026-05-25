"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, BadgeCheck, Film, GraduationCap, MapPin, PauseCircle, PlayCircle, Star, Target, Trophy } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getCoachProfiles } from "@/lib/coach-library"
import { cn } from "@/lib/utils"

export default function CoachLibraryDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tutorId = params?.tutorId as string

  const coach = React.useMemo(() => getCoachProfiles().find(item => item.id === tutorId), [tutorId])
  const [selectedVideoTitle, setSelectedVideoTitle] = React.useState<string | null>(null)
  const [playing, setPlaying] = React.useState(false)
  const selectedVideo = React.useMemo(
    () => coach?.videos.find(video => video.title === selectedVideoTitle) ?? null,
    [coach, selectedVideoTitle]
  )

  if (!coach) {
    return (
      <div className="p-8">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          返回
        </Button>
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          未找到该伴学教练展示页。
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <Button variant="ghost" className="w-fit gap-2 px-0 text-slate-500" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4" />
        返回教练库
      </Button>

      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#0f766e_100%)] p-5 text-white sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <Avatar className="h-20 w-20 border-2 border-white/70 sm:h-24 sm:w-24">
                <AvatarImage src={coach.avatar} />
                <AvatarFallback>{coach.displayName.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{coach.displayName}</h1>
                  <Badge className="rounded-full bg-white/15 text-white hover:bg-white/20">仅供浏览</Badge>
                </div>
                <p className="mt-2 text-sm text-white/75">{coach.school} · {coach.major}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[...coach.subjects, ...coach.strengths.slice(0, 3)].map(tag => (
                    <span key={tag} className="rounded-full bg-white/12 px-3 py-1 text-xs font-medium ring-1 ring-white/20">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 md:w-[420px]">
              <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/15">
                <p className="text-xs text-white/60">学校</p>
                <p className="mt-1 text-base font-semibold">{coach.school}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/15">
                <p className="text-xs text-white/60">可授年级</p>
                <p className="mt-1 text-base font-semibold">{coach.studentGrades.slice(0, 2).join("、")}</p>
              </div>
              <div className="rounded-lg bg-white/10 p-3 ring-1 ring-white/15">
                <p className="text-xs text-white/60">城市</p>
                <p className="mt-1 text-base font-semibold">{coach.city}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 p-4 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 font-medium text-emerald-700"><BadgeCheck className="h-4 w-4" />已认证教练</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-700"><Trophy className="h-4 w-4" />优秀案例导师</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700"><GraduationCap className="h-4 w-4" />{coach.grade}</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600"><MapPin className="h-4 w-4" />{coach.city}</span>
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><Target className="h-5 w-5" />教学能力</h2>
        <p className="mt-3 text-sm leading-7 text-slate-600">{coach.bio}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <TagBlock title="学科" tags={coach.subjects} />
          <TagBlock title="年级" tags={coach.studentGrades} />
          <TagBlock title="擅长方向" tags={coach.strengths} />
        </div>
        <div className="mt-4">
          <TagBlock title="教学风格" tags={coach.personalityTags} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><Star className="h-5 w-5 text-amber-500" />学生提升案例</h2>
        <div className="mt-4 grid gap-4">
          {coach.cases.map(item => (
            <article key={`${item.studentGrade}-${item.scoreChange}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-slate-900">{item.studentGrade} 提升案例</h3>
                <Badge className="rounded-full bg-blue-600">{item.scoreChange}</Badge>
              </div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                <InfoBlock title="原问题" content={item.originalProblem} />
                <InfoBlock title="辅导方式" content={item.tutoringMethod} />
                <InfoBlock title="提升结果" content={item.result} highlight />
                <InfoBlock title="家长评价" content={item.parentReview} />
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-950"><Film className="h-5 w-5" />视频展示</h2>
        {selectedVideo && (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-800 bg-slate-950 text-white">
            <div className="group relative aspect-video overflow-hidden bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedVideo.thumbnailUrl}
                alt={`${selectedVideo.title}视频预览`}
                className={cn("h-full w-full object-cover transition duration-500", playing ? "scale-105 opacity-80" : "opacity-95 group-hover:scale-105")}
              />
              <div className="absolute inset-0 bg-slate-950/35" />
              <button
                type="button"
                onClick={() => setPlaying(prev => !prev)}
                className="absolute left-1/2 top-1/2 rounded-full bg-white/20 p-4 text-white ring-1 ring-white/50 backdrop-blur transition hover:scale-105 hover:bg-white/30"
                style={{ transform: "translate(-50%, -50%)" }}
              >
                {playing ? <PauseCircle className="h-14 w-14" /> : <PlayCircle className="h-14 w-14" />}
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent p-5">
                <p className="text-lg font-semibold">{selectedVideo.title}</p>
                <p className="mt-1 text-sm text-white/60">{playing ? "正在播放" : "已暂停"}</p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/15">
                <div className={cn("h-full rounded-full bg-blue-400", playing ? "w-2/3 transition-all duration-1000" : "w-1/3")} />
              </div>
              <Button variant="secondary" size="sm" onClick={() => setPlaying(prev => !prev)}>
                {playing ? "暂停" : "播放"}
              </Button>
            </div>
          </div>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {coach.videos.map(video => (
            <button
              key={video.title}
              type="button"
              disabled={video.status !== "已上传"}
              onClick={() => {
                setSelectedVideoTitle(video.title)
                setPlaying(true)
              }}
              className={cn(
                "group overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition-all",
                video.status === "已上传"
                  ? "hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                  : "cursor-not-allowed opacity-60"
              )}
            >
              <div className="relative aspect-video overflow-hidden bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={video.thumbnailUrl}
                  alt={`${video.title}视频预览`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                />
                <div className={cn("absolute inset-0", video.status === "已上传" ? "bg-slate-950/25" : "bg-slate-950/55")} />
                <span className="absolute left-1/2 top-1/2 rounded-full bg-white/90 p-2.5 text-slate-950 shadow-lg" style={{ transform: "translate(-50%, -50%)" }}>
                  <PlayCircle className="h-7 w-7" />
                </span>
              </div>
              <div className="p-4">
                <p className="font-medium text-slate-900">{video.title}</p>
                <p className={cn("mt-2 text-sm", video.status === "已上传" ? "text-emerald-600" : "text-slate-400")}>{video.status}</p>
              </div>
              {video.status === "已上传" && (
                <span className="sr-only">点击播放</span>
              )}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function TagBlock({ title, tags }: { title: string; tags: string[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">{title}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{tag}</span>)}
      </div>
    </div>
  )
}

function InfoBlock({ title, content, highlight = false }: { title: string; content: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-lg p-3", highlight ? "bg-emerald-50 text-emerald-800" : "bg-white text-slate-600")}>
      <p className={cn("mb-1 text-sm font-semibold", highlight ? "text-emerald-900" : "text-slate-800")}>{title}</p>
      <p className="text-sm leading-6">{content}</p>
    </div>
  )
}
