"use client"

import * as React from "react"
import {
  Star,
  Shield,
  AlertTriangle,
  Users,
  TrendingUp,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
  ExternalLink,
  User,
  BarChart3,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { TutorCandidate } from "@/types/tutor-recommendation"

interface TutorRecommendationCardProps {
  candidate: TutorCandidate
  isAssigned?: boolean
  canAssign?: boolean
  onAssign?: (tutorId: number) => void
}

function MetricItem({
  label,
  value,
  sub,
  className,
}: {
  label: string
  value: React.ReactNode
  sub?: string
  className?: string
}) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <div className="text-[11px] text-muted-foreground leading-tight">{label}</div>
      <div className="text-sm font-semibold leading-tight">{value}</div>
      {sub && <div className="text-[10px] text-muted-foreground leading-tight">{sub}</div>}
    </div>
  )
}

function formatPct(v?: number): string {
  if (v == null) return "—"
  return `${Math.round(v * 100)}%`
}

function activityDaysLabel(days?: number): string {
  if (!days) return "—"
  const y = Math.floor(days / 365)
  const m = Math.floor((days % 365) / 30)
  if (y > 0) return `${y}年${m > 0 ? `${m}月` : ""}`
  return `${m}个月`
}

function MetricsSection({
  title,
  icon,
  children,
  color = "text-muted-foreground",
  gridCols = 3,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  color?: string
  gridCols?: 3 | 4
}) {
  return (
    <div>
      <div className={cn("flex items-center gap-1 text-xs font-medium mb-1.5", color)}>
        {icon}
        {title}
      </div>
      <div className={cn("gap-x-3 gap-y-1.5", gridCols === 4 ? "grid grid-cols-4" : "grid grid-cols-3")}>
        {children}
      </div>
    </div>
  )
}

function getRankColor(rank: number): string {
  if (rank === 1) return "bg-amber-500 text-white"
  if (rank === 2) return "bg-slate-400 text-white"
  if (rank === 3) return "bg-amber-700 text-white"
  if (rank <= 5) return "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
  return "bg-muted text-muted-foreground"
}

export function TutorRecommendationCard({
  candidate,
  isAssigned = false,
  canAssign = false,
  onAssign,
}: TutorRecommendationCardProps) {
  const [expanded, setExpanded] = React.useState(false)
  const m = candidate.raw_metrics

  const isEligible = candidate.dispatch_eligibility !== "INELIGIBLE"
  const hasRisk = m && (m.complaint_count || 0) + (m.refund_count || 0) + (m.replacement_count || 0) > 0
  const isForbidden = candidate.forbid_dispatch === true

  const badgeColorMap: Record<string, string> = {
    "高转化": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
    "低退费": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
    "学科强": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
  }

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        isAssigned
          ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
          : isForbidden
            ? "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
            : "bg-card hover:bg-muted/30",
      )}
    >
      {/* ── Header Row ── */}
      <div className="flex items-start gap-3 p-3 pb-2">
        <div className="flex flex-col items-center gap-1 pt-0.5">
          <div
            className={cn(
              "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
              getRankColor(candidate.rank),
            )}
          >
            {candidate.rank}
          </div>
        </div>

        <Avatar className="h-10 w-10 shrink-0">
          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=tutor${candidate.tutor_id}`} />
          <AvatarFallback>{candidate.name[0]}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm">{candidate.name}</span>
            {isAssigned && (
              <Badge className="bg-green-600 hover:bg-green-700 text-[10px] px-1.5 py-0">已分配</Badge>
            )}
            {!isEligible && !isAssigned && (
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">不可派单</Badge>
            )}
            {candidate.is_new_tutor && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">
                新教练
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
            <span>ID: {candidate.tutor_id}</span>
            {candidate.manager_name && (
              <>
                <span className="text-border">·</span>
                <span className="flex items-center gap-0.5">
                  <User className="h-3 w-3" />学管: {candidate.manager_name}
                </span>
              </>
            )}
            {candidate.tutor_home_url && (
              <>
                <span className="text-border">·</span>
                <a
                  href={candidate.tutor_home_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-primary hover:underline"
                >
                  主页 <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </>
            )}
          </div>

          {m && (
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
              {m.gender && <span>{m.gender}</span>}
              {m.age != null && (
                <>
                  <span className="text-border">·</span>
                  <span>{m.age}岁</span>
                </>
              )}
              {m.school && (
                <>
                  <span className="text-border">·</span>
                  <span>{m.school}</span>
                </>
              )}
              {m.teaching_style && (
                <>
                  <span className="text-border">·</span>
                  <span>{m.teaching_style}</span>
                </>
              )}
            </div>
          )}

          {candidate.feature_badges && candidate.feature_badges.length > 0 && (
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              {candidate.feature_badges.map((b) => (
                <span
                  key={b.key}
                  className={cn(
                    "inline-flex items-center px-1.5 py-0 rounded text-[10px] font-medium",
                    badgeColorMap[b.key] || "bg-muted text-muted-foreground",
                  )}
                  title={b.long}
                >
                  <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                  {b.short}
                </span>
              ))}
            </div>
          )}

          {candidate.reasons && candidate.reasons.length > 0 && !expanded && (
            <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
              <Info className="h-3 w-3 shrink-0" />
              <span className="truncate">{candidate.reasons[0]}</span>
              {candidate.reasons.length > 1 && (
                <span className="shrink-0">+{candidate.reasons.length - 1}</span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {candidate.is_new_tutor && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-600">
              新教练(UCB加权)
            </Badge>
          )}
          {canAssign && !isAssigned && isEligible && (
            <Button size="sm" className="h-7 text-xs px-3" onClick={() => onAssign?.(candidate.tutor_id)}>
              选择匹配
            </Button>
          )}
        </div>
      </div>

      {/* ── Quick Metrics (always visible) ── */}
      {m && (
        <div className="px-3 pb-2">
          <div className="grid grid-cols-5 gap-2 p-2 rounded-md bg-muted/40 text-center">
            <MetricItem
              label="信用分"
              value={m.credit_score != null ? `${m.credit_score}/12` : "—"}
              className={
                m.credit_score != null && m.credit_score <= 3
                  ? "text-orange-600"
                  : m.credit_score != null && m.credit_score >= 10
                    ? "text-green-600"
                    : ""
              }
            />
            <MetricItem
              label="试课转化率"
              value={formatPct(m.trial_conversion_rate_30d)}
              sub={m.kpi_roll_trial_converted_num != null && m.kpi_roll_trial_metric_eligible_cnt != null
                ? `${m.kpi_roll_trial_converted_num}/${m.kpi_roll_trial_metric_eligible_cnt}`
                : undefined}
            />
            <MetricItem
              label="续课率"
              value={formatPct(m.renewal_rate)}
              sub={m.kpi_roll_renewal_success_num != null && m.kpi_roll_renewal_eligible_base_cnt != null
                ? `${m.kpi_roll_renewal_success_num}/${m.kpi_roll_renewal_eligible_base_cnt}`
                : undefined}
            />
            <MetricItem
              label="家长评分"
              value={m.bayesian_rating != null ? `${(m.bayesian_rating * 5).toFixed(1)}` : "—"}
              sub={m.rating_count != null ? `${m.rating_count}条评价` : undefined}
            />
            <MetricItem
              label="在读学员"
              value={m.current_student_count ?? "—"}
              sub={m.total_students_distinct != null ? `累计${m.total_students_distinct}人` : undefined}
            />
          </div>
        </div>
      )}

      {/* ── Expand Toggle ── */}
      <div className="px-3 pb-1">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full justify-center py-1"
        >
          {expanded ? (
            <><span>收起详情</span> <ChevronUp className="h-3 w-3" /></>
          ) : (
            <><span>查看详情</span> <ChevronDown className="h-3 w-3" /></>
          )}
        </button>
      </div>

      {/* ── Expanded Details ── */}
      {expanded && m && (
        <div className="px-3 pb-3 space-y-3 border-t pt-3">

          {/* ── 教练画像 ── */}
          <MetricsSection
            title="教练画像"
            icon={<User className="h-3 w-3" />}
            color="text-foreground"
            gridCols={4}
          >
            <MetricItem label="性别" value={m.gender ?? "—"} />
            <MetricItem label="年龄" value={m.age != null ? `${m.age}岁` : "—"} />
            <MetricItem label="学校" value={m.school ?? "—"} />
            <MetricItem label="高考数学" value={m.math_score != null ? `${m.math_score}分` : "—"} />
            <MetricItem label="高考物理" value={m.physics_score != null ? `${m.physics_score}分` : "—"} />
            <MetricItem label="高考化学" value={m.chemistry_score != null ? `${m.chemistry_score}分` : "—"} />
            <MetricItem label="教学特长" value={m.teaching_strengths ?? "—"} />
            <MetricItem label="教学风格" value={m.teaching_style ?? "—"} />
            <MetricItem
              label="竞赛经历"
              value={
                m.has_competition
                  ? (m.competition_level ?? "是")
                  : "无"
              }
              className={m.has_competition ? "text-amber-600" : ""}
            />
            <MetricItem
              label="教学活跃天数"
              value={activityDaysLabel(m.teaching_activity_days)}
            />
          </MetricsSection>

          <Separator />

          {/* ── 服务质量评估 ── */}
          <MetricsSection
            title="服务质量评估"
            icon={<Star className="h-3 w-3" />}
            color="text-blue-600"
            gridCols={4}
          >
            <MetricItem
              label="授课成果得分"
              value={m.achievement_score_norm != null ? `${Math.round(m.achievement_score_norm * 100)}` : "—"}
            />
            <MetricItem
              label="家长评分(贝叶斯)"
              value={m.bayesian_rating != null ? `${(m.bayesian_rating * 5).toFixed(1)}` : "—"}
              sub={m.rating_count != null ? `${m.rating_count}条评价` : undefined}
            />
            <MetricItem
              label="试课转正率"
              value={formatPct(m.trial_conversion_rate_30d)}
              sub={m.kpi_roll_trial_converted_num != null && m.kpi_roll_trial_metric_eligible_cnt != null
                ? `${m.kpi_roll_trial_converted_num}/${m.kpi_roll_trial_metric_eligible_cnt}`
                : undefined}
            />
            <MetricItem
              label="正课续课率"
              value={formatPct(m.renewal_rate)}
              sub={m.kpi_roll_renewal_success_num != null && m.kpi_roll_renewal_eligible_base_cnt != null
                ? `${m.kpi_roll_renewal_success_num}/${m.kpi_roll_renewal_eligible_base_cnt}`
                : undefined}
            />
          </MetricsSection>

          <Separator />

          {/* ── 服务负载评估 ── */}
          <MetricsSection
            title="服务负载评估"
            icon={<BarChart3 className="h-3 w-3" />}
            color="text-slate-600"
            gridCols={4}
          >
            <MetricItem label="当前在读学员" value={m.current_student_count ?? "—"} />
            <MetricItem label="小学学员" value={m.total_students_primary ?? "—"} />
            <MetricItem label="初中学员" value={m.total_students_middle ?? "—"} />
            <MetricItem label="高中学员" value={m.total_students_high ?? "—"} />
            <MetricItem label="已服务学员总数" value={m.total_students_distinct ?? "—"} />
            <MetricItem label="试课指标计单数" value={m.total_trial_metric_eligible_cnt ?? "—"} />
            <MetricItem label="正课完成数" value={m.total_regular_order_cnt ?? "—"} />
            <MetricItem label="同学段课程数(30d)" value={m.grade_level_lesson_count ?? "—"} />
          </MetricsSection>

          <Separator />

          {/* ── 服务风险评估（始终展示，>0 时高亮）── */}
          <MetricsSection
            title="服务风险评估"
            icon={<AlertTriangle className={cn("h-3 w-3", hasRisk ? "text-orange-600" : "")} />}
            color={hasRisk ? "text-orange-600" : "text-muted-foreground"}
          >
            <MetricItem
              label="被投诉次数"
              value={m.complaint_count ?? 0}
              className={(m.complaint_count ?? 0) > 0 ? "text-orange-600" : ""}
            />
            <MetricItem
              label="被退费次数"
              value={m.refund_count ?? 0}
              className={(m.refund_count ?? 0) > 0 ? "text-orange-600" : ""}
            />
            <MetricItem
              label="被换师次数"
              value={m.replacement_count ?? 0}
              className={(m.replacement_count ?? 0) > 0 ? "text-orange-600" : ""}
            />
          </MetricsSection>

          <Separator />

          {/* ── 学管团队评估 ── */}
          <MetricsSection
            title="学管团队评估"
            icon={<Users className="h-3 w-3" />}
            color="text-purple-600"
          >
            <MetricItem
              label="团队试课成功率"
              value={formatPct(m.team_trial_success_rate_30d)}
            />
            <MetricItem
              label="团队家长反馈得分"
              value={m.team_avg_parent_rating?.toFixed(1) ?? "—"}
            />
            <MetricItem
              label="团队规划师通过率"
              value={formatPct(m.team_planner_pass_rate)}
            />
          </MetricsSection>
          <div className="grid grid-cols-3 gap-x-3 gap-y-1.5">
            <MetricItem
              label="团队活跃度"
              value={formatPct(m.team_active_ratio)}
            />
            <MetricItem
              label="团队人均订单(120d)"
              value={m.team_orders_per_tutor_120d?.toFixed(1) ?? "—"}
            />
          </div>

          <Separator />

          {/* ── 服务稳定性评估 ── */}
          <MetricsSection
            title="服务稳定性评估"
            icon={<Shield className="h-3 w-3" />}
            color="text-cyan-600"
            gridCols={4}
          >
            <MetricItem
              label="授课活动天数"
              value={activityDaysLabel(m.cooperation_days)}
            />
            <MetricItem
              label="授课成果积分"
              value={m.achievement_points_total ?? "—"}
            />
            <MetricItem
              label="累计申请接单次数"
              value={m.total_application_count ?? "—"}
            />
            <MetricItem
              label="活跃月数"
              value={m.active_months != null ? `${m.active_months}月` : "—"}
            />
            <MetricItem
              label="连续活跃月"
              value={m.consecutive_active_months != null ? `${m.consecutive_active_months}月` : "—"}
            />
            <MetricItem
              label="最近活跃"
              value={
                m.last_active_at
                  ? new Date(m.last_active_at).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })
                  : "—"
              }
            />
          </MetricsSection>

          <Separator />

          {/* ── 推荐理由 ── */}
          {candidate.reasons && candidate.reasons.length > 0 && (
            <div className="space-y-1">
              <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                推荐理由
              </div>
              <ul className="space-y-0.5">
                {candidate.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5 text-green-500" />
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── 团队处罚标记 ── */}
          {isForbidden && candidate.forbid_dispatch_reason && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 p-2 rounded-md bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800">
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                <span className="text-xs text-red-700 dark:text-red-400">{candidate.forbid_dispatch_reason}</span>
              </div>
              {candidate.forbid_dispatch_events && candidate.forbid_dispatch_events.length > 0 && (
                <div className="space-y-1 pl-1">
                  {candidate.forbid_dispatch_events.map((evt) => (
                    <div key={evt.id} className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3 w-3 shrink-0" />
                      <span>事件: {evt.event_name}（{evt.penalty_type === "dispatch_suspension" ? "暂停派单" : evt.penalty_type}）</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── 底部上下文 ── */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 pt-1">
            <Clock className="h-3 w-3" />
            排名 #{candidate.rank}
            {m.is_new_tutor && " · 新教练(UCB加权)"}
            {m.n_pulls != null && ` · 历史曝光${m.n_pulls}次`}
          </div>
        </div>
      )}
    </div>
  )
}

export function TutorRecommendationList({
  candidates,
  assignedTutorId,
  canAssign,
  onAssign,
  emptyText,
}: {
  candidates: TutorCandidate[]
  assignedTutorId?: number | null
  canAssign?: boolean
  onAssign?: (tutorId: number) => void
  emptyText?: string
}) {
  if (candidates.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm">
        {emptyText || "暂无数据"}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {candidates.map((c) => (
        <TutorRecommendationCard
          key={c.tutor_id}
          candidate={c}
          isAssigned={assignedTutorId != null && c.tutor_id === assignedTutorId}
          canAssign={canAssign}
          onAssign={onAssign}
        />
      ))}
    </div>
  )
}
