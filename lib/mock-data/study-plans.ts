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
  },
  {
    id: 'sp-3',
    orderId: 'ord-2',
    studentId: 'stu-2',
    teacherId: 'user-tutor-2',
    fileUrl: '/mock-files/study-plan-sp3.pdf',
    fileName: '林小华-初二数学-阶段规划A.pdf',
    fileType: 'pdf',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2026-04-22T10:15:00'),
    updatedAt: new Date('2026-04-22T10:15:00')
  },
  {
    id: 'sp-4',
    orderId: 'ord-4',
    studentId: 'stu-4',
    teacherId: 'user-tutor-3',
    fileUrl: '/mock-files/study-plan-sp4.docx',
    fileName: '张小军-高一英语-提升规划.docx',
    fileType: 'word',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2026-04-23T14:20:00'),
    updatedAt: new Date('2026-04-23T14:20:00')
  },
  {
    id: 'sp-5',
    orderId: 'ord-2',
    studentId: 'stu-5',
    teacherId: 'user-tutor-1',
    fileUrl: '/mock-files/study-plan-sp5.pdf',
    fileName: '刘小丽-三年级语文-学习规划.pdf',
    fileType: 'pdf',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2026-04-24T09:40:00'),
    updatedAt: new Date('2026-04-24T09:40:00')
  },
  {
    id: 'sp-6',
    orderId: 'ord-4',
    studentId: 'stu-1',
    teacherId: 'user-tutor-4',
    fileUrl: '/mock-files/study-plan-sp6.docx',
    fileName: '陈小明-四年级英语-能力提升计划.docx',
    fileType: 'word',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2026-04-24T16:10:00'),
    updatedAt: new Date('2026-04-24T16:10:00')
  },
  {
    id: 'sp-7',
    orderId: 'ord-2',
    studentId: 'stu-demo-1',
    teacherId: 'user-tutor-5',
    fileUrl: '/mock-files/study-plan-sp7.pdf',
    fileName: '张同学-初二物理-冲刺规划.pdf',
    fileType: 'pdf',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2026-04-25T11:30:00'),
    updatedAt: new Date('2026-04-25T11:30:00')
  },
  {
    id: 'sp-8',
    orderId: 'ord-4',
    studentId: 'stu-demo-2',
    teacherId: 'user-tutor-6',
    fileUrl: '/mock-files/study-plan-sp8.pdf',
    fileName: '李同学-高一化学-培优规划.pdf',
    fileType: 'pdf',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2026-04-26T08:50:00'),
    updatedAt: new Date('2026-04-26T08:50:00')
  },
  {
    id: 'sp-9',
    orderId: 'ord-2',
    studentId: 'stu-2',
    teacherId: 'user-tutor-7',
    fileUrl: '/mock-files/study-plan-sp9.docx',
    fileName: '林小华-初二英语-月度规划.docx',
    fileType: 'word',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2026-04-27T13:05:00'),
    updatedAt: new Date('2026-04-27T13:05:00')
  },
  {
    id: 'sp-10',
    orderId: 'ord-4',
    studentId: 'stu-3',
    teacherId: 'user-tutor-8',
    fileUrl: '/mock-files/study-plan-sp10.pdf',
    fileName: '王小红-五年级数学-进阶规划.pdf',
    fileType: 'pdf',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2026-04-28T15:25:00'),
    updatedAt: new Date('2026-04-28T15:25:00')
  },
  {
    id: 'sp-11',
    orderId: 'ord-2',
    studentId: 'stu-4',
    teacherId: 'user-tutor-9',
    fileUrl: '/mock-files/study-plan-sp11.docx',
    fileName: '张小军-高一数学-周规划.docx',
    fileType: 'word',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2026-04-29T10:45:00'),
    updatedAt: new Date('2026-04-29T10:45:00')
  },
  {
    id: 'sp-12',
    orderId: 'ord-4',
    studentId: 'stu-5',
    teacherId: 'user-tutor-10',
    fileUrl: '/mock-files/study-plan-sp12.pdf',
    fileName: '刘小丽-三年级英语-复习规划.pdf',
    fileType: 'pdf',
    status: StudyPlanStatus.PENDING_REVIEW,
    createdAt: new Date('2026-04-30T12:00:00'),
    updatedAt: new Date('2026-04-30T12:00:00')
  }
]
