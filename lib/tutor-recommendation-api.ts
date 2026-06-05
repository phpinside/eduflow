import type {
  TutorRecommendationResponse,
  TutorCandidate,
  TutorRawMetrics,
  EligibilityCheck,
} from '@/types/tutor-recommendation'

const API_BASE_URL = process.env.NEXT_PUBLIC_OPS_API_URL || 'http://localhost:8765'
const API_KEY = process.env.NEXT_PUBLIC_OPS_API_KEY || 'ak_eduflow_upstream_2026'
const API_SECRET = process.env.NEXT_PUBLIC_OPS_API_SECRET || ''

async function signRequest(method: string, path: string, body = ''): Promise<Record<string, string>> {
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const stringToSign = `${method}\n${path}\n${timestamp}\n${body}`

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(stringToSign))
  const signature = btoa(String.fromCharCode(...new Uint8Array(sig)))

  return {
    'X-API-Key': API_KEY,
    'X-Timestamp': timestamp,
    'X-Signature': signature,
  }
}

function orderNumericId(orderId: string): number {
  const m = orderId.match(/(\d+)/)
  return m ? parseInt(m[1], 10) : 1
}

async function apiGet<T>(path: string): Promise<T> {
  const headers = await signRequest('GET', path)
  const res = await fetch(`${API_BASE_URL}${path}`, { headers })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return res.json()
}

export async function fetchRecommendations(
  orderId: string,
  topK = 20,
  detail: 'card' | 'full' = 'card',
): Promise<TutorRecommendationResponse> {
  const oid = orderNumericId(orderId)
  const path = `/api/v1/orders/${oid}/recommendations?top_k=${topK}&detail=${detail}`
  return apiGet<TutorRecommendationResponse>(path)
}

export async function fetchApplicantScores(
  orderId: string,
  topK = 25,
  detail: 'card' | 'full' = 'card',
): Promise<TutorRecommendationResponse> {
  const oid = orderNumericId(orderId)
  const path = `/api/v1/orders/${oid}/applicants?top_k=${topK}&detail=${detail}`
  return apiGet<TutorRecommendationResponse>(path)
}

export async function fetchEligibility(
  orderId: string,
  tutorId: number,
): Promise<EligibilityCheck> {
  const oid = orderNumericId(orderId)
  const path = `/api/v1/orders/${oid}/tutors/${tutorId}/eligibility`
  return apiGet<EligibilityCheck>(path)
}

// ── Mock data generation for prototype ──────────────────────────

function seededRandom(seed: number): () => number {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}

function generateMockMetrics(tutorId: number): TutorRawMetrics {
  const rand = seededRandom(tutorId * 7919)
  const r = (min: number, max: number) => Math.round((rand() * (max - min) + min) * 100) / 100
  const ri = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min

  const gender = tutorId % 3 === 0 ? '女' : '男'
  const schools = ['清华大学', '北京大学', '复旦大学', '浙江大学', '南京大学', '武汉大学', '中山大学', '四川大学', '同济大学', '北京师范大学']
  const styles = ['启发式', '互动式', '严谨细致', '因材施教', '循循善诱', '思维导图式']
  const strengths = ['竞赛,压轴题', '基础巩固', '中高考冲刺', '思维训练', '方法总结', '趣味教学']

  return {
    gender,
    age: ri(22, 35),
    school: schools[tutorId % schools.length],
    math_score: ri(125, 150),
    physics_score: tutorId % 2 === 0 ? ri(80, 100) : null,
    chemistry_score: tutorId % 3 === 0 ? ri(75, 95) : null,
    teaching_strengths: strengths[tutorId % strengths.length],
    has_competition: tutorId % 3 !== 0,
    competition_level: tutorId % 3 !== 0 ? ['省一等奖', '省二等奖', '国家级铜牌'][tutorId % 3] : null,
    teaching_style: styles[tutorId % styles.length],
    teaching_activity_days: ri(90, 720),
    achievement_score_norm: r(0.6, 0.98),
    bayesian_rating: r(0.7, 0.99),
    rating_count: ri(5, 60),
    trial_conversion_rate_30d: r(0.5, 0.95),
    renewal_rate: r(0.4, 0.85),
    kpi_roll_trial_converted_num: ri(5, 40),
    kpi_roll_trial_metric_eligible_cnt: ri(10, 50),
    kpi_roll_renewal_success_num: ri(3, 30),
    kpi_roll_renewal_eligible_base_cnt: ri(8, 45),
    credit_score: ri(4, 12),
    current_student_count: ri(3, 15),
    total_students_primary: ri(0, 8),
    total_students_middle: ri(2, 20),
    total_students_high: ri(1, 12),
    total_students_distinct: ri(10, 50),
    total_trial_metric_eligible_cnt: ri(15, 60),
    total_regular_order_cnt: ri(20, 80),
    grade_level_lesson_count: ri(30, 200),
    complaint_count: rand() > 0.85 ? ri(1, 2) : 0,
    refund_count: rand() > 0.9 ? 1 : 0,
    replacement_count: rand() > 0.92 ? 1 : 0,
    team_trial_success_rate_30d: r(0.5, 0.9),
    team_avg_parent_rating: r(4.0, 5.0),
    team_planner_pass_rate: r(0.4, 0.85),
    team_active_ratio: r(0.6, 0.95),
    team_orders_per_tutor_120d: r(8, 25),
    cooperation_days: ri(90, 600),
    achievement_points_total: ri(40, 120),
    total_application_count: ri(15, 80),
    active_months: ri(3, 24),
    consecutive_active_months: ri(2, 12),
    last_active_at: new Date(Date.now() - ri(0, 7) * 86400000).toISOString(),
    is_new_tutor: tutorId > 15,
    n_pulls: ri(10, 100),
    feature_tags: {
      ...(rand() > 0.4 ? { '高转化': true } : {}),
      ...(rand() > 0.5 ? { '低退费': true } : {}),
      ...(rand() > 0.5 ? { '学科强': true } : {}),
    },
  }
}

function generateMockCandidate(tutorId: number, rank: number, isApplicant: boolean): TutorCandidate {
  const rand = seededRandom(tutorId * 4217 + rank * 13)
  const r = (min: number, max: number) => Math.round((rand() * (max - min) + min) * 100) / 100
  const isEligible = rand() > 0.1

  const tags: Record<string, boolean> = {}
  if (rand() > 0.35) tags['高转化'] = true
  if (rand() > 0.45) tags['低退费'] = true
  if (rand() > 0.45) tags['学科强'] = true

  const badges = Object.keys(tags).map((key) => {
    const longMap: Record<string, string> = {
      '高转化': '试课转化率高于平台均值 20%+',
      '低退费': '近 90 天无退费记录',
      '学科强': '学科能力评分 Top 30%',
    }
    return { key, short: key, long: longMap[key] || key }
  })

  const nameMap: Record<number, string> = {
    1: '李伴学', 2: '王金牌', 3: '刘资深', 4: '陈老师', 5: '杨老师',
    6: '黄老师', 7: '赵老师', 8: '周老师', 9: '吴老师', 10: '徐老师',
    11: '孙老师', 12: '马老师', 13: '朱老师', 14: '胡老师', 15: '郭老师',
    16: '何老师', 17: '高老师', 18: '林老师', 19: '郑老师', 20: '谢老师',
  }

  const managerMap: Record<number, string> = {
    1: '王学管', 2: '王学管', 3: '王学管', 4: '王学管', 5: '王学管',
    6: '王学管', 7: '李学管', 8: '李学管', 9: '李学管', 10: '李学管',
    11: '李学管', 12: '李学管', 13: '张学管', 14: '张学管', 15: '张学管',
    16: '张学管', 17: '张学管', 18: '张学管', 19: '陈总监', 20: '陈总监',
  }

  const reasonsPool = [
    '试课转化率高于同类教练',
    '家长评分 4.9/5.0',
    '匹配该学段科目 3 年以上经验',
    '无退费/投诉记录',
    '该学段已累计授课 100+ 课时',
    '信用满分，无违规记录',
    '续课率高于团队均值',
    '教练为 A 级，教学能力突出',
    '学员好评率 95%+',
    '同学段同学科经验丰富',
  ]
  const reasonsCount = ri(2, 4, rand)
  const reasons: string[] = []
  for (let i = 0; i < reasonsCount; i++) {
    reasons.push(reasonsPool[(tutorId * 3 + i) % reasonsPool.length])
  }

  const coarseRuleScore = isApplicant ? r(60, 95) : r(70, 98)

  return {
    rank,
    tutor_id: tutorId,
    source_teacher_id: tutorId + 100,
    tutor_profile_id: tutorId + 40,
    name: nameMap[tutorId] || `教练${tutorId}`,
    account_display: `tu***${tutorId}`,
    tutor_home_url: `/coach-home/${tutorId}`,
    manager_name: managerMap[tutorId] || '—',
    coarse_rule_score: Math.round(coarseRuleScore * 100) / 100,
    rerank_score: r(0.3, 0.95),
    ucb_score: r(0, 0.02),
    final_score: r(0.4, 0.96),
    is_new_tutor: tutorId > 15,
    dispatch_eligibility: isEligible ? 'ELIGIBLE' : 'INELIGIBLE',
    ineligibility_reasons: isEligible ? [] : ['TEAM_PENALTY_ACTIVE'],
    feature_tags: tags,
    feature_badges: badges,
    reasons,
    raw_metrics: generateMockMetrics(tutorId),
    ...(isEligible
      ? {}
      : {
          forbid_dispatch: true,
          forbid_dispatch_reason: '团队处罚生效：当前禁止派单',
          forbid_dispatch_events: [
            { id: 7, event_name: '服务品质事件', penalty_type: 'dispatch_suspension' },
          ],
        }),
  }
}

function ri(min: number, max: number, randFn?: () => number): number {
  const r = randFn || Math.random
  return Math.floor(r() * (max - min + 1)) + min
}

export function getMockRecommendations(orderId: string): TutorRecommendationResponse {
  const oid = orderNumericId(orderId)
  const tutorIds = [13, 1, 7, 2, 18, 5, 12, 14, 8, 20, 3, 4, 9, 6, 15, 19, 10, 11, 16, 17]

  return {
    schema_version: 1,
    order_id: oid,
    model_version: 'rule_v1_lgbm_on',
    latency_ms: 342.5,
    request_params: {
      top_k: 20,
      dispatch_mode: 'SYSTEM_RANKED',
      alpha: 0.8,
      beta: 0.0,
      gamma: 0.2,
      stability_metrics_scope: 'full',
    },
    pipeline_funnel: {
      stages: [
        { stage_key: 'order_guard', label: '订单数据', enter: 1, eliminate: 0, remain: 1, remark: '' },
        { stage_key: 'role_candidate_pool', label: '教师角色候选池', enter: 1, eliminate: 0, remain: 620, remark: '' },
        { stage_key: 'exclude_assigned', label: '排除本单已指派教师', enter: 620, eliminate: 1, remain: 619, remark: '' },
        { stage_key: 'hard_filter', label: '硬过滤', enter: 619, eliminate: 480, remain: 139, remark: '' },
        { stage_key: 'coarse_rule_pool', label: '粗排池（规则分）', enter: 139, eliminate: 0, remain: 139, remark: 'cap=150' },
        { stage_key: 'lgbm_rerank', label: '精排（LightGBM）', enter: 139, eliminate: 0, remain: 139, remark: 'applied' },
        { stage_key: 'top_k', label: '截断 Top20', enter: 139, eliminate: 119, remain: 20, remark: '' },
      ],
      summary: {
        hard_filter_pass_count: 139,
        final_return_count: 20,
        top_k: 20,
        team_penalty_marked: 1,
      },
    },
    candidates: tutorIds.map((tid, idx) => generateMockCandidate(tid, idx + 1, false)),
  }
}

export function getMockApplicantScores(
  orderId: string,
  applicantTutorIds: number[],
): TutorRecommendationResponse {
  const oid = orderNumericId(orderId)

  return {
    order_id: oid,
    model_version: 'rule_v1_lgbm_on',
    request_params: {
      top_k: 25,
      applicant_eval: {
        total_applicants: applicantTutorIds.length,
        batches_run: 1,
        total_scored: applicantTutorIds.length,
        display_cap: 25,
        displayed_count: applicantTutorIds.length,
        truncated_display: false,
      },
    },
    pipeline_funnel: {
      stages: [
        { stage_key: 'applicants', label: '已报名教练', enter: applicantTutorIds.length, eliminate: 0, remain: applicantTutorIds.length, remark: '' },
        { stage_key: 'scoring', label: '评分计算', enter: applicantTutorIds.length, eliminate: 0, remain: applicantTutorIds.length, remark: '' },
      ],
      summary: {
        hard_filter_pass_count: applicantTutorIds.length,
        final_return_count: applicantTutorIds.length,
        top_k: 25,
      },
    },
    candidates: applicantTutorIds.map((tid, idx) =>
      generateMockCandidate(tid, idx + 1, true),
    ),
  }
}

export function getMockEligibility(orderId: string, tutorId: number): EligibilityCheck {
  const rand = seededRandom(tutorId * 3571)
  const passed = rand() > 0.2

  return {
    order_id: orderNumericId(orderId),
    tutor_id: tutorId,
    passed,
    hard_filter_passed: passed,
    hard_filter_reasons: passed ? [] : ['GRADE_NOT_ACCEPTED'],
    checks: [
      {
        code: 'REGISTRATION_STATUS',
        name: 'ByteMath 注册状态（仅参考）',
        passed: true,
        value: 'COMPLETED',
        help: 'ByteMath teachers.status（仅参考，不参与派单过滤）。',
      },
      {
        code: 'NEW_TUTOR_GRACE_PERIOD',
        name: '新教练观察期（2周）',
        passed: true,
        value: 'ok',
        help: '注册未满观察期且从未带生…',
      },
      {
        code: 'STOPPED_ACCEPTING',
        name: '状态/停单',
        passed: true,
        value: { dispatch_status: 'ACTIVE', suspension_until: null },
        help: '教练非 ACTIVE 或处于暂停接单期…',
      },
      {
        code: 'POLICY_OR_CREDIT',
        name: '信用分>0',
        passed: true,
        value: 100,
        help: '信用分为 0 或黑名单/违规等…',
      },
      ...(passed
        ? []
        : [
            {
              code: 'GRADE_NOT_ACCEPTED',
              name: '学段/科目接单配置',
              passed: false as const,
              value: {
                school_level: 'middle',
                order_subject: 'MATH',
                resolve_mode: 'reject_no_match',
                matched_config: null,
              },
              help: '该学段/科目不接单…',
            },
          ]),
      {
        code: 'CAPABILITY_MISMATCH',
        name: '数学分数要求',
        passed: true,
        value: { required_min: 130, math_score: 140 },
        help: '能力不匹配（数学分/科目能力等硬约束）。',
      },
      {
        code: 'CAPABILITY_MISMATCH',
        name: '科目能力匹配',
        passed: true,
        value: { order_subject: 'MATH', tutor_subjects: ['MATH', 'PHYSICS'] },
        help: '能力不匹配（数学分/科目能力等硬约束）。',
      },
      {
        code: 'AT_CAPACITY',
        name: '新教练梯度容量',
        passed: true,
        value: { applies: false },
        help: '日历新教练…按入职周累计上限…',
      },
    ],
  }
}

export function isApiConfigured(): boolean {
  return !!(API_BASE_URL && API_KEY && API_SECRET)
}
