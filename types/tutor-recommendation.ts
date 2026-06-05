export interface TutorFeatureBadge {
  key: string
  short: string
  long: string
}

export interface TutorRawMetrics {
  gender?: string
  age?: number | null
  school?: string | null
  math_score?: number | null
  physics_score?: number | null
  chemistry_score?: number | null
  teaching_strengths?: string | null
  has_competition?: boolean
  competition_level?: string | null
  teaching_style?: string | null
  teaching_activity_days?: number

  achievement_score_norm?: number
  bayesian_rating?: number
  rating_count?: number
  trial_conversion_rate_30d?: number
  renewal_rate?: number
  kpi_roll_trial_converted_num?: number
  kpi_roll_trial_metric_eligible_cnt?: number
  kpi_roll_renewal_success_num?: number
  kpi_roll_renewal_eligible_base_cnt?: number
  credit_score?: number

  current_student_count?: number
  total_students_primary?: number
  total_students_middle?: number
  total_students_high?: number
  total_students_distinct?: number
  total_trial_metric_eligible_cnt?: number
  total_regular_order_cnt?: number
  grade_level_lesson_count?: number

  complaint_count?: number
  refund_count?: number
  replacement_count?: number

  team_trial_success_rate_30d?: number
  team_avg_parent_rating?: number
  team_planner_pass_rate?: number
  team_active_ratio?: number
  team_orders_per_tutor_120d?: number

  cooperation_days?: number
  achievement_points_total?: number
  total_application_count?: number
  active_months?: number
  consecutive_active_months?: number
  last_active_at?: string | null

  is_new_tutor?: boolean
  n_pulls?: number
  feature_tags?: Record<string, boolean>
}

export interface TutorCandidate {
  rank: number
  tutor_id: number
  source_teacher_id?: number | string
  tutor_profile_id?: number
  name: string
  account_display?: string
  tutor_home_url?: string
  manager_name?: string

  coarse_rule_score?: number
  rerank_score?: number
  ucb_score?: number
  final_score?: number
  is_new_tutor?: boolean

  dispatch_eligibility?: 'ELIGIBLE' | 'INELIGIBLE'
  ineligibility_reasons?: string[]

  feature_tags?: Record<string, boolean>
  feature_badges?: TutorFeatureBadge[]
  reasons?: string[]

  raw_metrics?: TutorRawMetrics

  forbid_dispatch?: boolean
  forbid_dispatch_reason?: string
  forbid_dispatch_events?: Array<{
    id: number
    event_name: string
    penalty_type: string
  }>
}

export interface ApplicantEvalMeta {
  total_applicants: number
  batches_run: number
  total_scored: number
  display_cap: number
  displayed_count: number
  truncated_display: boolean
}

export interface TutorRecommendationResponse {
  schema_version?: number
  order_id: number
  model_version?: string
  latency_ms?: number

  request_params: {
    top_k: number
    dispatch_mode?: string
    alpha?: number
    beta?: number
    gamma?: number
    stability_metrics_scope?: string
    applicant_eval?: ApplicantEvalMeta
  }

  pipeline_funnel?: {
    stages: Array<{
      stage_key: string
      label: string
      enter: number
      eliminate: number
      remain: number
      remark: string
    }>
    summary: {
      hard_filter_pass_count: number
      final_return_count: number
      top_k: number
      team_penalty_marked?: number
    }
  }

  candidates: TutorCandidate[]
}

export interface EligibilityCheck {
  order_id: number
  tutor_id: number
  passed: boolean
  hard_filter_passed: boolean
  hard_filter_reasons: string[]
  checks: Array<{
    code: string
    name: string
    passed: boolean
    value: unknown
    help: string
  }>
  help_map?: Record<string, string>
}
