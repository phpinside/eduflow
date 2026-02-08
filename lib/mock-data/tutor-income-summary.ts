import { TutorIncomeSummary } from '@/types'

// 伴学教练收入汇总 Mock 数据
export const mockTutorIncomeSummary: TutorIncomeSummary[] = [
  // ========== 李伴学（user-tutor-1）==========
  {
    id: 'tutor-summary-1',
    tutorId: 'user-tutor-1',
    tutorName: '李伴学',
    period: {
      start: new Date('2025-01-01T00:00:00'),
      end: new Date('2025-01-31T23:59:59')
    },
    trialFee: {
      amount: 400,
      count: 2
    },
    dealReward: {
      amount: 3000,
      count: 2
    },
    lessonFee: {
      amount: 990,
      hours: 9.5
    },
    managementFee: {
      amount: 0,
      hours: 0
    },
    totalIncome: 4390,
    createdAt: new Date('2025-02-01T00:00:00'),
    updatedAt: new Date('2025-02-01T00:00:00')
  },
  {
    id: 'tutor-summary-2',
    tutorId: 'user-tutor-1',
    tutorName: '李伴学',
    period: {
      start: new Date('2025-02-01T00:00:00'),
      end: new Date('2025-02-28T23:59:59')
    },
    trialFee: {
      amount: 200,
      count: 1
    },
    dealReward: {
      amount: 0,
      count: 0
    },
    lessonFee: {
      amount: 660,
      hours: 6.0
    },
    managementFee: {
      amount: 0,
      hours: 0
    },
    totalIncome: 860,
    createdAt: new Date('2025-03-01T00:00:00'),
    updatedAt: new Date('2025-03-01T00:00:00')
  },

  // ========== 王金牌（user-tutor-2）==========
  {
    id: 'tutor-summary-3',
    tutorId: 'user-tutor-2',
    tutorName: '王金牌',
    period: {
      start: new Date('2025-01-01T00:00:00'),
      end: new Date('2025-01-31T23:59:59')
    },
    trialFee: {
      amount: 200,
      count: 1
    },
    dealReward: {
      amount: 2000,
      count: 1
    },
    lessonFee: {
      amount: 720,
      hours: 8.0
    },
    managementFee: {
      amount: 0,
      hours: 0
    },
    totalIncome: 2920,
    createdAt: new Date('2025-02-01T00:00:00'),
    updatedAt: new Date('2025-02-01T00:00:00')
  },
  {
    id: 'tutor-summary-4',
    tutorId: 'user-tutor-2',
    tutorName: '王金牌',
    period: {
      start: new Date('2025-02-01T00:00:00'),
      end: new Date('2025-02-28T23:59:59')
    },
    trialFee: {
      amount: 400,
      count: 2
    },
    dealReward: {
      amount: 1000,
      count: 1
    },
    lessonFee: {
      amount: 540,
      hours: 6.0
    },
    managementFee: {
      amount: 0,
      hours: 0
    },
    totalIncome: 1940,
    createdAt: new Date('2025-03-01T00:00:00'),
    updatedAt: new Date('2025-03-01T00:00:00')
  },

  // ========== 刘资深（user-tutor-3）==========
  {
    id: 'tutor-summary-5',
    tutorId: 'user-tutor-3',
    tutorName: '刘资深',
    period: {
      start: new Date('2025-01-01T00:00:00'),
      end: new Date('2025-01-31T23:59:59')
    },
    trialFee: {
      amount: 600,
      count: 3
    },
    dealReward: {
      amount: 5000,
      count: 2
    },
    lessonFee: {
      amount: 1440,
      hours: 12.0
    },
    managementFee: {
      amount: 0,
      hours: 0
    },
    totalIncome: 7040,
    createdAt: new Date('2025-02-01T00:00:00'),
    updatedAt: new Date('2025-02-01T00:00:00')
  },
  {
    id: 'tutor-summary-6',
    tutorId: 'user-tutor-3',
    tutorName: '刘资深',
    period: {
      start: new Date('2025-02-01T00:00:00'),
      end: new Date('2025-02-28T23:59:59')
    },
    trialFee: {
      amount: 200,
      count: 1
    },
    dealReward: {
      amount: 3000,
      count: 1
    },
    lessonFee: {
      amount: 900,
      hours: 7.5
    },
    managementFee: {
      amount: 0,
      hours: 0
    },
    totalIncome: 4100,
    createdAt: new Date('2025-03-01T00:00:00'),
    updatedAt: new Date('2025-03-01T00:00:00')
  },

  // ========== 12月历史数据 ==========
  {
    id: 'tutor-summary-7',
    tutorId: 'user-tutor-1',
    tutorName: '李伴学',
    period: {
      start: new Date('2024-12-01T00:00:00'),
      end: new Date('2024-12-31T23:59:59')
    },
    trialFee: {
      amount: 200,
      count: 1
    },
    dealReward: {
      amount: 1000,
      count: 1
    },
    lessonFee: {
      amount: 550,
      hours: 5.0
    },
    managementFee: {
      amount: 0,
      hours: 0
    },
    totalIncome: 1750,
    createdAt: new Date('2025-01-01T00:00:00'),
    updatedAt: new Date('2025-01-01T00:00:00')
  },
  {
    id: 'tutor-summary-8',
    tutorId: 'user-tutor-2',
    tutorName: '王金牌',
    period: {
      start: new Date('2024-12-01T00:00:00'),
      end: new Date('2024-12-31T23:59:59')
    },
    trialFee: {
      amount: 400,
      count: 2
    },
    dealReward: {
      amount: 2000,
      count: 1
    },
    lessonFee: {
      amount: 450,
      hours: 5.0
    },
    managementFee: {
      amount: 0,
      hours: 0
    },
    totalIncome: 2850,
    createdAt: new Date('2025-01-01T00:00:00'),
    updatedAt: new Date('2025-01-01T00:00:00')
  },
  {
    id: 'tutor-summary-9',
    tutorId: 'user-tutor-3',
    tutorName: '刘资深',
    period: {
      start: new Date('2024-12-01T00:00:00'),
      end: new Date('2024-12-31T23:59:59')
    },
    trialFee: {
      amount: 400,
      count: 2
    },
    dealReward: {
      amount: 4000,
      count: 2
    },
    lessonFee: {
      amount: 1200,
      hours: 10.0
    },
    managementFee: {
      amount: 0,
      hours: 0
    },
    totalIncome: 5600,
    createdAt: new Date('2025-01-01T00:00:00'),
    updatedAt: new Date('2025-01-01T00:00:00')
  }
]
