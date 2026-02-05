import { Lesson } from '@/types'

export const mockLessons: Lesson[] = [
  {
    id: 'les-1',
    orderId: 'ord-1',
    teacherId: 'user-tutor-1',
    studentId: 'stu-1',
    startTime: new Date('2023-09-02T10:00:00'),
    endTime: new Date('2023-09-02T11:00:00'),
    duration: 60,
    feedbackId: 'fb-1',
    createdAt: new Date('2023-09-02T11:15:00')
  },
  {
    id: 'les-2',
    orderId: 'ord-2',
    teacherId: 'user-tutor-1',
    studentId: 'stu-1',
    startTime: new Date('2023-09-10T19:00:00'),
    endTime: new Date('2023-09-10T20:00:00'),
    duration: 60,
    feedbackId: 'fb-2',
    createdAt: new Date('2023-09-10T20:10:00')
  },
  {
    id: 'les-3',
    orderId: 'ord-2',
    teacherId: 'user-tutor-1',
    studentId: 'stu-1',
    startTime: new Date('2023-09-17T19:00:00'),
    endTime: new Date('2023-09-17T20:00:00'),
    duration: 60,
    feedbackId: 'fb-3',
    createdAt: new Date('2023-09-17T20:15:00')
  }
]
