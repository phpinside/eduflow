import { Order, OrderStatus, OrderType } from '@/types'

export const mockOrders: Order[] = [
  {
    id: 'ord-1',
    type: OrderType.TRIAL,
    status: OrderStatus.COMPLETED,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-1',
    managerId: 'user-manager-1',
    subject: '数学',
    grade: '四年级',
    totalHours: 1,
    remainingHours: 0,
    scheduledAt: new Date('2023-09-02T10:00:00'),
    assignedTeacherId: 'user-tutor-1',
    price: 0,
    createdAt: new Date('2023-09-01T14:00:00'),
    updatedAt: new Date('2023-09-02T11:00:00')
  },
  {
    id: 'ord-2',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-1',
    managerId: 'user-manager-1',
    subject: '数学',
    grade: '四年级',
    totalHours: 40,
    remainingHours: 32,
    assignedTeacherId: 'user-tutor-1',
    price: 6000,
    createdAt: new Date('2023-09-05T09:00:00'),
    updatedAt: new Date('2023-09-05T09:00:00'),
    // Extended fields
    lastExamScore: "95",
    examMaxScore: "100",
    textbookVersion: "人教版",
    campusName: "北京校区",
    campusAccount: "beijing_01",
    studentAccount: "stu_001",
    remarks: "学生基础扎实，希望进行拔高训练。",
    weeklySchedule: [
      { day: "monday", startTime: "18:00", endTime: "20:00" },
      { day: "saturday", startTime: "10:00", endTime: "12:00" }
    ],
    transactions: [
        { id: 'tx-2-1', type: 'INITIAL', amount: 6000, hours: 40, createdAt: new Date('2023-09-05T09:00:00') }
    ]
  },
  {
    id: 'ord-3',
    type: OrderType.TRIAL,
    status: OrderStatus.PENDING,
    studentId: 'stu-2',
    salesPersonId: 'user-sales-1',
    managerId: 'user-manager-1',
    subject: '英语',
    grade: '初二',
    totalHours: 1,
    remainingHours: 1,
    price: 0,
    applicantIds: ['user-tutor-1', 'user-tutor-2', 'user-tutor-3'],
    createdAt: new Date(),
    updatedAt: new Date(),
    lastExamScore: "85",
    examMaxScore: "120",
    textbookVersion: "仁爱版",
    campusName: "上海校区",
    campusAccount: "shanghai_01",
    studentAccount: "stu_002",
    scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days later
    remarks: "口语较弱，希望加强对话练习"
  },
  {
    id: 'ord-4',
    type: OrderType.REGULAR,
    status: OrderStatus.ASSIGNED,
    studentId: 'stu-3',
    salesPersonId: 'user-sales-1',
    subject: '语文',
    grade: '五年级',
    totalHours: 20,
    remainingHours: 20,
    assignedTeacherId: 'user-tutor-1',
    price: 3000,
    createdAt: new Date('2023-11-25T15:30:00'),
    updatedAt: new Date('2023-11-26T10:00:00'),
    lastExamScore: "88",
    examMaxScore: "100",
    textbookVersion: "部编版",
    campusName: "广州校区",
    campusAccount: "guangzhou_01",
    studentAccount: "stu_003",
    weeklySchedule: [
       { day: "friday", startTime: "16:30", endTime: "18:30" }
    ],
    remarks: "作文写不长，阅读理解扣分多",
    transactions: [
        { id: 'tx-4-1', type: 'INITIAL', amount: 3000, hours: 20, createdAt: new Date('2023-11-25T15:30:00') }
    ]
  },
  {
    id: 'ord-5',
    type: OrderType.TRIAL,
    status: OrderStatus.CANCELLED,
    studentId: 'stu-4',
    salesPersonId: 'user-sales-1',
    subject: '物理',
    grade: '高一',
    totalHours: 1,
    remainingHours: 1,
    price: 0,
    createdAt: new Date('2024-01-10T11:00:00'),
    updatedAt: new Date('2024-01-11T16:00:00'),
    lastExamScore: "60",
    examMaxScore: "100",
    campusName: "深圳校区",
    campusAccount: "shenzhen_01",
    studentAccount: "stu_004",
    remarks: "学生临时有事取消"
  },
  {
    id: 'ord-6',
    type: OrderType.TRIAL,
    status: OrderStatus.COMPLETED,
    studentId: 'stu-3',
    salesPersonId: 'user-sales-1',
    subject: '物理',
    grade: '初三',
    totalHours: 1,
    remainingHours: 0,
    scheduledAt: new Date('2024-02-01T14:00:00'),
    assignedTeacherId: 'user-tutor-2',
    price: 0,
    createdAt: new Date('2024-01-28T10:00:00'),
    updatedAt: new Date('2024-02-01T15:00:00'),
    lastExamScore: "75",
    examMaxScore: "100",
    campusName: "广州校区",
    campusAccount: "guangzhou_01",
    studentAccount: "stu_003",
    remarks: "试课效果不错，已转化"
  },
  {
    id: 'ord-7',
    type: OrderType.TRIAL,
    status: OrderStatus.COMPLETED,
    studentId: 'stu-5',
    salesPersonId: 'user-sales-1',
    subject: '英语',
    grade: '三年级',
    totalHours: 1,
    remainingHours: 0,
    scheduledAt: new Date('2024-02-05T16:00:00'),
    assignedTeacherId: 'user-tutor-3',
    price: 0,
    createdAt: new Date('2024-02-01T09:00:00'),
    updatedAt: new Date('2024-02-05T17:00:00'),
    campusName: "杭州校区",
    campusAccount: "hangzhou_01",
    studentAccount: "stu_005",
    remarks: "零基础启蒙"
  },
  {
    id: 'ord-8',
    type: OrderType.REGULAR,
    status: OrderStatus.COMPLETED,
    studentId: 'stu-2',
    salesPersonId: 'user-sales-1',
    subject: '数学',
    grade: '初二',
    totalHours: 20,
    remainingHours: 0,
    assignedTeacherId: 'user-tutor-2',
    price: 4400,
    createdAt: new Date('2023-10-01T14:00:00'),
    updatedAt: new Date('2023-12-01T15:00:00'),
    weeklySchedule: [
      { day: "sunday", startTime: "14:00", endTime: "16:00" }
    ],
    transactions: [
      { id: 'tx-8-1', type: 'INITIAL', amount: 4400, hours: 20, createdAt: new Date('2023-10-01T14:00:00') }
    ]
  },
  {
    id: 'ord-9',
    type: OrderType.REGULAR,
    status: OrderStatus.COMPLETED,
    studentId: 'stu-4',
    salesPersonId: 'user-sales-1',
    subject: '化学',
    grade: '高一',
    totalHours: 10,
    remainingHours: 1,
    assignedTeacherId: 'user-tutor-3',
    price: 2800,
    createdAt: new Date('2024-01-01T10:00:00'),
    updatedAt: new Date('2024-02-15T11:00:00'),
    weeklySchedule: [
      { day: "wednesday", startTime: "19:00", endTime: "21:00" }
    ],
    transactions: [
      { id: 'tx-9-1', type: 'INITIAL', amount: 2800, hours: 10, createdAt: new Date('2024-01-01T10:00:00') },
      { id: 'tx-9-2', type: 'RENEWAL', amount: 1400, hours: 5, createdAt: new Date('2024-02-01T15:00:00') }
    ]
  },
  // Market Demo Orders for persistent navigation testing
  {
    id: "market-demo-1",
    type: OrderType.TRIAL,
    status: OrderStatus.PENDING,
    studentId: "stu-demo-1",
    salesPersonId: "sales-1",
    managerId: 'user-manager-1',
    subject: "数学",
    grade: "初二",
    totalHours: 1,
    remainingHours: 1,
    price: 0,
    applicantIds: ['user-tutor-4', 'user-tutor-5'],
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    updatedAt: new Date(),
    scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    lastExamScore: "88",
    examMaxScore: "100",
    remarks: "基础薄弱，需要耐心辅导"
  },
  {
    id: "market-demo-2",
    type: OrderType.REGULAR,
    status: OrderStatus.PENDING,
    studentId: "stu-demo-2",
    salesPersonId: "sales-1",
    subject: "英语",
    grade: "高一",
    totalHours: 40,
    remainingHours: 40,
    price: 8000,
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
    updatedAt: new Date(),
    weeklySchedule: [{ day: "saturday", startTime: "14:00", endTime: "16:00" }],
    lastExamScore: "110",
    examMaxScore: "150",
    remarks: "目标冲刺重点班"
  },
  {
    id: "refund-demo-1",
    type: OrderType.REGULAR,
    status: OrderStatus.CANCEL_REQUESTED,
    studentId: "stu-demo-2",
    salesPersonId: "sales-1",
    managerId: 'user-manager-1',
    subject: "化学",
    grade: "高一",
    totalHours: 20,
    remainingHours: 15,
    price: 4000,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    updatedAt: new Date(),
    weeklySchedule: [{ day: "sunday", startTime: "10:00", endTime: "12:00" }],
    cancelReason: "学生跟不上进度，家长要求换机构",
    refundAmount: 3000,
    remarks: "需要尽快处理"
  },
  // 招生老师1的订单
  {
    id: 'ord-new-today-1',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-1',
    subject: '数学',
    grade: '高一',
    totalHours: 40,
    remainingHours: 40,
    price: 8000,
    createdAt: new Date(),
    updatedAt: new Date(),
    transactions: [
      { id: 'tx-sales1-1', type: 'INITIAL', amount: 8000, hours: 40, createdAt: new Date() }
    ]
  },
  {
    id: 'ord-new-today-2',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-2',
    salesPersonId: 'user-sales-1',
    subject: '英语',
    grade: '初二',
    totalHours: 60,
    remainingHours: 60,
    price: 12000,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales1-2', type: 'RENEWAL', amount: 12000, hours: 60, createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-refund-1',
    type: OrderType.REGULAR,
    status: OrderStatus.CANCELLED,
    studentId: 'stu-3',
    salesPersonId: 'user-sales-1',
    subject: '物理',
    grade: '高二',
    totalHours: 20,
    remainingHours: 15,
    price: 4000,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    refundAmount: 1500
  },
  {
    id: 'ord-sales1-4',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-4',
    salesPersonId: 'user-sales-1',
    subject: '化学',
    grade: '高三',
    totalHours: 30,
    remainingHours: 30,
    price: 6000,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales1-4', type: 'INITIAL', amount: 6000, hours: 30, createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales1-5',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-5',
    salesPersonId: 'user-sales-1',
    subject: '数学',
    grade: '高三',
    totalHours: 80,
    remainingHours: 80,
    price: 15000,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales1-5', type: 'INITIAL', amount: 15000, hours: 80, createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000) }
    ]
  },
  // 招生老师2的订单
  {
    id: 'ord-sales2-1',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-2',
    subject: '数学',
    grade: '三年级',
    totalHours: 25,
    remainingHours: 25,
    price: 5000,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales2-1', type: 'INITIAL', amount: 5000, hours: 25, createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales2-2',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-2',
    salesPersonId: 'user-sales-2',
    subject: '英语',
    grade: '初二',
    totalHours: 49,
    remainingHours: 49,
    price: 9800,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales2-2', type: 'RENEWAL', amount: 9800, hours: 49, createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales2-3',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-3',
    salesPersonId: 'user-sales-2',
    subject: '物理',
    grade: '高一',
    totalHours: 36,
    remainingHours: 36,
    price: 7200,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales2-3', type: 'INITIAL', amount: 7200, hours: 36, createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales2-4',
    type: OrderType.REGULAR,
    status: OrderStatus.CANCELLED,
    studentId: 'stu-4',
    salesPersonId: 'user-sales-2',
    subject: '语文',
    grade: '初一',
    totalHours: 20,
    remainingHours: 18,
    price: 4000,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000),
    refundAmount: 2000
  },
  {
    id: 'ord-sales2-5',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-5',
    salesPersonId: 'user-sales-2',
    subject: '化学',
    grade: '初三',
    totalHours: 55,
    remainingHours: 55,
    price: 11000,
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales2-5', type: 'INITIAL', amount: 11000, hours: 55, createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales2-6',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-2',
    subject: '数学',
    grade: '五年级',
    totalHours: 22,
    remainingHours: 22,
    price: 4500,
    createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 11 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales2-6', type: 'REWARD', amount: 4500, hours: 22, createdAt: new Date(Date.now() - 11 * 60 * 60 * 1000) }
    ]
  },
  // 招生老师3的订单
  {
    id: 'ord-sales3-1',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-2',
    salesPersonId: 'user-sales-3',
    subject: '数学',
    grade: '高二',
    totalHours: 67,
    remainingHours: 67,
    price: 13500,
    createdAt: new Date(Date.now() - 0.5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 0.5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales3-1', type: 'INITIAL', amount: 13500, hours: 67, createdAt: new Date(Date.now() - 0.5 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales3-2',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-3',
    salesPersonId: 'user-sales-3',
    subject: '语文',
    grade: '初一',
    totalHours: 44,
    remainingHours: 44,
    price: 8800,
    createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales3-2', type: 'INITIAL', amount: 8800, hours: 44, createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales3-3',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-4',
    salesPersonId: 'user-sales-3',
    subject: '数学',
    grade: '五年级',
    totalHours: 32,
    remainingHours: 32,
    price: 6500,
    createdAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales3-3', type: 'INITIAL', amount: 6500, hours: 32, createdAt: new Date(Date.now() - 4.5 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales3-4',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-5',
    salesPersonId: 'user-sales-3',
    subject: '英语',
    grade: '高三',
    totalHours: 50,
    remainingHours: 50,
    price: 10000,
    createdAt: new Date(Date.now() - 6.5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6.5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales3-4', type: 'INITIAL', amount: 10000, hours: 50, createdAt: new Date(Date.now() - 6.5 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales3-5',
    type: OrderType.REGULAR,
    status: OrderStatus.CANCELLED,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-3',
    subject: '物理',
    grade: '高一',
    totalHours: 30,
    remainingHours: 25,
    price: 6000,
    createdAt: new Date(Date.now() - 9 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    refundAmount: 3500
  },
  {
    id: 'ord-sales3-6',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-2',
    salesPersonId: 'user-sales-3',
    subject: '物理',
    grade: '初二',
    totalHours: 39,
    remainingHours: 39,
    price: 7800,
    createdAt: new Date(Date.now() - 10.5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10.5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales3-6', type: 'INITIAL', amount: 7800, hours: 39, createdAt: new Date(Date.now() - 10.5 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales3-7',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-3',
    salesPersonId: 'user-sales-3',
    subject: '英语',
    grade: '四年级',
    totalHours: 27,
    remainingHours: 27,
    price: 5500,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales3-7', type: 'INITIAL', amount: 5500, hours: 27, createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000) }
    ]
  },
  // 招生老师4的订单
  {
    id: 'ord-sales4-1',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-4',
    salesPersonId: 'user-sales-4',
    subject: '全科',
    grade: '高三',
    totalHours: 80,
    remainingHours: 80,
    price: 16000,
    createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales4-1', type: 'INITIAL', amount: 16000, hours: 80, createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales4-2',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-5',
    salesPersonId: 'user-sales-4',
    subject: '数学',
    grade: '初三',
    totalHours: 45,
    remainingHours: 45,
    price: 9000,
    createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales4-2', type: 'INITIAL', amount: 9000, hours: 45, createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales4-3',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-4',
    subject: '理综',
    grade: '高一',
    totalHours: 62,
    remainingHours: 62,
    price: 12500,
    createdAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales4-3', type: 'INITIAL', amount: 12500, hours: 62, createdAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales4-4',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-2',
    salesPersonId: 'user-sales-4',
    subject: '数学',
    grade: '六年级',
    totalHours: 35,
    remainingHours: 35,
    price: 7000,
    createdAt: new Date(Date.now() - 7.5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7.5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales4-4', type: 'INITIAL', amount: 7000, hours: 35, createdAt: new Date(Date.now() - 7.5 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales4-5',
    type: OrderType.REGULAR,
    status: OrderStatus.CANCELLED,
    studentId: 'stu-3',
    salesPersonId: 'user-sales-4',
    subject: '英语',
    grade: '高二',
    totalHours: 25,
    remainingHours: 20,
    price: 5000,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 9.5 * 60 * 60 * 1000),
    refundAmount: 2500
  },
  {
    id: 'ord-sales4-6',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-4',
    salesPersonId: 'user-sales-4',
    subject: '英语',
    grade: '初二',
    totalHours: 41,
    remainingHours: 41,
    price: 8200,
    createdAt: new Date(Date.now() - 11.5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 11.5 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales4-6', type: 'INITIAL', amount: 8200, hours: 41, createdAt: new Date(Date.now() - 11.5 * 60 * 60 * 1000) }
    ]
  },
  // 招生老师5的订单
  {
    id: 'ord-sales5-1',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-5',
    salesPersonId: 'user-sales-5',
    subject: '化学',
    grade: '高二',
    totalHours: 70,
    remainingHours: 70,
    price: 14000,
    createdAt: new Date(Date.now() - 0.8 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 0.8 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales5-1', type: 'INITIAL', amount: 14000, hours: 70, createdAt: new Date(Date.now() - 0.8 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales5-2',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-5',
    subject: '数学',
    grade: '三年级',
    totalHours: 34,
    remainingHours: 34,
    price: 6800,
    createdAt: new Date(Date.now() - 2.8 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2.8 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales5-2', type: 'INITIAL', amount: 6800, hours: 34, createdAt: new Date(Date.now() - 2.8 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales5-3',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-2',
    salesPersonId: 'user-sales-5',
    subject: '全科',
    grade: '初一',
    totalHours: 56,
    remainingHours: 56,
    price: 11200,
    createdAt: new Date(Date.now() - 4.8 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 4.8 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales5-3', type: 'INITIAL', amount: 11200, hours: 56, createdAt: new Date(Date.now() - 4.8 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales5-4',
    type: OrderType.REGULAR,
    status: OrderStatus.CANCELLED,
    studentId: 'stu-3',
    salesPersonId: 'user-sales-5',
    subject: '物理',
    grade: '高一',
    totalHours: 20,
    remainingHours: 18,
    price: 4000,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6.8 * 60 * 60 * 1000),
    refundAmount: 1800
  },
  {
    id: 'ord-sales5-5',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-4',
    salesPersonId: 'user-sales-5',
    subject: '物理',
    grade: '高一',
    totalHours: 47,
    remainingHours: 47,
    price: 9500,
    createdAt: new Date(Date.now() - 8.8 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 8.8 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales5-5', type: 'INITIAL', amount: 9500, hours: 47, createdAt: new Date(Date.now() - 8.8 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales5-6',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-5',
    salesPersonId: 'user-sales-5',
    subject: '语文',
    grade: '五年级',
    totalHours: 29,
    remainingHours: 29,
    price: 5800,
    createdAt: new Date(Date.now() - 10.8 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 10.8 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales5-6', type: 'INITIAL', amount: 5800, hours: 29, createdAt: new Date(Date.now() - 10.8 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales5-7',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-5',
    subject: '理综',
    grade: '高三',
    totalHours: 69,
    remainingHours: 69,
    price: 13800,
    createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 13 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales5-7', type: 'INITIAL', amount: 13800, hours: 69, createdAt: new Date(Date.now() - 13 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-sales5-8',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-2',
    salesPersonId: 'user-sales-5',
    subject: '数学',
    grade: '初二',
    totalHours: 37,
    remainingHours: 37,
    price: 7500,
    createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 15 * 60 * 60 * 1000),
    transactions: [
      { id: 'tx-sales5-8', type: 'INITIAL', amount: 7500, hours: 37, createdAt: new Date(Date.now() - 15 * 60 * 60 * 1000) }
    ]
  },
  // 试课转正的订单
  {
    id: 'ord-reward-1',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-1',
    subject: '英语',
    grade: '初一',
    totalHours: 30,
    remainingHours: 30,
    price: 6000,
    createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 14 * 60 * 60 * 1000),
    remarks: '试课效果好，转正课',
    transactions: [
      { id: 'tx-reward-1', type: 'REWARD', amount: 300, hours: 0, createdAt: new Date(Date.now() - 14 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-reward-2',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-2',
    salesPersonId: 'user-sales-2',
    subject: '数学',
    grade: '高一',
    totalHours: 40,
    remainingHours: 40,
    price: 8000,
    createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 16 * 60 * 60 * 1000),
    remarks: '家长非常满意，立即转正',
    transactions: [
      { id: 'tx-reward-2', type: 'REWARD', amount: 400, hours: 0, createdAt: new Date(Date.now() - 16 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-reward-3',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-3',
    salesPersonId: 'user-sales-3',
    subject: '物理',
    grade: '初三',
    totalHours: 35,
    remainingHours: 35,
    price: 7000,
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
    remarks: '试课一次后家长决定转正',
    transactions: [
      { id: 'tx-reward-3', type: 'REWARD', amount: 350, hours: 0, createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-reward-4',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-4',
    salesPersonId: 'user-sales-4',
    subject: '化学',
    grade: '高二',
    totalHours: 45,
    remainingHours: 45,
    price: 9000,
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
    remarks: '学生进步明显，转正课继续学习',
    transactions: [
      { id: 'tx-reward-4', type: 'REWARD', amount: 450, hours: 0, createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-reward-5',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-5',
    salesPersonId: 'user-sales-5',
    subject: '语文',
    grade: '六年级',
    totalHours: 25,
    remainingHours: 25,
    price: 5000,
    createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
    remarks: '试课转化成功',
    transactions: [
      { id: 'tx-reward-5', type: 'REWARD', amount: 250, hours: 0, createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000) }
    ]
  },
  {
    id: 'ord-reward-6',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    salesPersonId: 'user-sales-3',
    subject: '数学',
    grade: '三年级',
    totalHours: 20,
    remainingHours: 20,
    price: 4000,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    remarks: '试课后家长认可老师，转正',
    transactions: [
      { id: 'tx-reward-6', type: 'REWARD', amount: 200, hours: 0, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    ]
  },
  // 额外订单数据用于分页测试
  {
    id: 'ord-extra-1',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    assignedTeacherId: 'user-tutor-1',
    salesPersonId: 'user-sales-1',
    subject: '英语',
    grade: '五年级',
    totalHours: 30,
    remainingHours: 25,
    price: 5400,
    createdAt: new Date('2024-01-15T10:00:00'),
    updatedAt: new Date('2024-01-15T10:00:00'),
    weeklySchedule: [
      { day: "wednesday", startTime: "19:00", endTime: "20:30" }
    ]
  },
  {
    id: 'ord-extra-2',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-2',
    assignedTeacherId: 'user-tutor-1',
    salesPersonId: 'user-sales-1',
    subject: '物理',
    grade: '初三',
    totalHours: 40,
    remainingHours: 35,
    price: 7200,
    createdAt: new Date('2024-01-18T14:00:00'),
    updatedAt: new Date('2024-01-18T14:00:00'),
    weeklySchedule: [
      { day: "thursday", startTime: "18:00", endTime: "20:00" }
    ]
  },
  {
    id: 'ord-extra-3',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-3',
    assignedTeacherId: 'user-tutor-1',
    salesPersonId: 'user-sales-1',
    subject: '化学',
    grade: '高一',
    totalHours: 35,
    remainingHours: 30,
    price: 6300,
    createdAt: new Date('2024-01-20T09:00:00'),
    updatedAt: new Date('2024-01-20T09:00:00'),
    weeklySchedule: [
      { day: "friday", startTime: "20:00", endTime: "21:30" }
    ]
  },
  {
    id: 'ord-extra-4',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-4',
    assignedTeacherId: 'user-tutor-1',
    salesPersonId: 'user-sales-2',
    subject: '生物',
    grade: '高二',
    totalHours: 25,
    remainingHours: 20,
    price: 4500,
    createdAt: new Date('2024-01-22T11:00:00'),
    updatedAt: new Date('2024-01-22T11:00:00'),
    weeklySchedule: [
      { day: "saturday", startTime: "14:00", endTime: "16:00" }
    ]
  },
  {
    id: 'ord-extra-5',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-5',
    assignedTeacherId: 'user-tutor-1',
    salesPersonId: 'user-sales-2',
    subject: '历史',
    grade: '初二',
    totalHours: 20,
    remainingHours: 18,
    price: 3600,
    createdAt: new Date('2024-01-25T15:00:00'),
    updatedAt: new Date('2024-01-25T15:00:00'),
    weeklySchedule: [
      { day: "sunday", startTime: "10:00", endTime: "12:00" }
    ]
  },
  {
    id: 'ord-extra-6',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-1',
    assignedTeacherId: 'user-tutor-1',
    salesPersonId: 'user-sales-3',
    subject: '地理',
    grade: '初一',
    totalHours: 30,
    remainingHours: 28,
    price: 5400,
    createdAt: new Date('2024-01-28T13:00:00'),
    updatedAt: new Date('2024-01-28T13:00:00'),
    weeklySchedule: [
      { day: "monday", startTime: "19:00", endTime: "20:30" }
    ]
  },
  {
    id: 'ord-extra-7',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-2',
    assignedTeacherId: 'user-tutor-1',
    salesPersonId: 'user-sales-3',
    subject: '政治',
    grade: '初三',
    totalHours: 25,
    remainingHours: 22,
    price: 4500,
    createdAt: new Date('2024-02-01T10:00:00'),
    updatedAt: new Date('2024-02-01T10:00:00'),
    weeklySchedule: [
      { day: "tuesday", startTime: "18:00", endTime: "19:30" }
    ]
  },
  {
    id: 'ord-extra-8',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-3',
    assignedTeacherId: 'user-tutor-1',
    salesPersonId: 'user-sales-1',
    subject: '数学',
    grade: '六年级',
    totalHours: 40,
    remainingHours: 38,
    price: 7200,
    createdAt: new Date('2024-02-03T14:00:00'),
    updatedAt: new Date('2024-02-03T14:00:00'),
    weeklySchedule: [
      { day: "wednesday", startTime: "16:00", endTime: "18:00" }
    ]
  },
  {
    id: 'ord-extra-9',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-4',
    assignedTeacherId: 'user-tutor-1',
    salesPersonId: 'user-sales-2',
    subject: '英语',
    grade: '初二',
    totalHours: 35,
    remainingHours: 33,
    price: 6300,
    createdAt: new Date('2024-02-05T09:00:00'),
    updatedAt: new Date('2024-02-05T09:00:00'),
    weeklySchedule: [
      { day: "thursday", startTime: "19:30", endTime: "21:00" }
    ]
  },
  {
    id: 'ord-extra-10',
    type: OrderType.REGULAR,
    status: OrderStatus.IN_PROGRESS,
    studentId: 'stu-5',
    assignedTeacherId: 'user-tutor-1',
    salesPersonId: 'user-sales-3',
    subject: '物理',
    grade: '高一',
    totalHours: 30,
    remainingHours: 27,
    price: 5400,
    createdAt: new Date('2024-02-07T11:00:00'),
    updatedAt: new Date('2024-02-07T11:00:00'),
    weeklySchedule: [
      { day: "friday", startTime: "18:00", endTime: "19:30" }
    ]
  }
]
