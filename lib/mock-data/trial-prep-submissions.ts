import type { TrialPrepSubmission } from '@/types'

export const mockTrialPrepSubmissions: TrialPrepSubmission[] = [
  {
    id: 'trial-prep-submitted-demo',
    orderId: 'ord-feedback-trial-done-with-feedback',
    tutorId: 'user-tutor-1',
    diagnosisNotes: '学生阅读题审题顺序清晰，但概括题容易遗漏关键人物关系。',
    teachingGoals: '试课目标是建立四步阅读法，并完成一题现场迁移。',
    lessonPlanText: '用一篇短文完成关键词标注、中心句定位、分点作答示范。',
    attachments: ['试课教案-周思源-语文阅读.docx'],
    status: 'SUBMITTED',
    submittedAt: new Date('2026-05-01T09:00:00'),
    createdAt: new Date('2026-05-01T08:40:00'),
    updatedAt: new Date('2026-05-01T09:00:00'),
  },
  {
    id: 'trial-prep-draft-demo',
    orderId: 'ord-feedback-trial-inprogress',
    tutorId: 'user-tutor-1',
    diagnosisNotes: '学生函数图像理解较好，但公式迁移慢。',
    teachingGoals: '',
    lessonPlanText: '',
    attachments: [],
    status: 'DRAFT',
    createdAt: new Date('2026-06-14T09:00:00'),
    updatedAt: new Date('2026-06-14T09:00:00'),
  },
]
