import { Subject } from '@/types'

export const mockSubjects: Subject[] = [
  {
    id: 'subj-001',
    code: 'MATH-001',
    name: '数学',
    description: '涵盖小学、初中、高中数学课程，包括代数、几何、函数、概率统计等核心知识点，帮助学生建立扎实的数学基础。',
    enabled: true,
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'subj-002',
    code: 'OLYMPIAD-001',
    name: '小学奥数',
    description: '面向小学生的奥林匹克数学竞赛培训，培养数学思维能力，涵盖计算、几何、组合、数论等专题内容，提升逻辑推理和问题解决能力。',
    enabled: true,
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  },
  {
    id: 'subj-003',
    code: 'PHYSICS-001',
    name: '物理',
    description: '涵盖初中、高中物理课程，包括力学、电学、光学、热学、原子物理等内容，通过实验和理论相结合的方式培养科学素养。',
    enabled: true,
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00')
  }
]
