import { StudyPlan, StudyPlanStatus } from '@/types'

export const mockStudyPlans: StudyPlan[] = [
  {
    id: 'sp-1',
    orderId: 'ord-2', // Matches order in mockOrders (Regular Course)
    studentId: 'stu-1',
    teacherId: 'user-tutor-1',
    fileUrl: '/mock-files/study-plan-v1.pdf', // Placeholder URL
    fileName: '陈小明-四年级数学-第一阶段学习规划.pdf',
    fileType: 'pdf',
    status: StudyPlanStatus.REVIEWED,
    reviews: [
      {
        reviewerName: '张主管',
        reviewedAt: new Date('2023-09-06T10:00:00')
      }
    ],
    createdAt: new Date('2023-09-05T15:00:00'),
    updatedAt: new Date('2023-09-06T10:00:00')
  },
  {
    id: 'sp-2',
    orderId: 'ord-4', // Matches order in mockOrders
    studentId: 'stu-3',
    teacherId: 'user-tutor-1',
    fileUrl: '/mock-files/study-plan-stu3.docx',
    fileName: '王小红-五年级语文-提升计划.docx',
    fileType: 'word',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2023-11-26T09:00:00'),
    updatedAt: new Date('2023-11-26T09:00:00')
  }
]
