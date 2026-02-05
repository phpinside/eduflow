import { Student } from '@/types'

export const mockStudents: Student[] = [
  {

    id: 'stu-1',
    name: '陈小明',
    grade: '四年级',
    gender: '男',
    phone: '13900001111',
    parentName: '陈爸爸',
    parentPhone: '13900001111',
    school: '实验小学',
    address: '北京市朝阳区阳光花园1号楼',
    createdAt: new Date('2023-09-01'),
    updatedAt: new Date('2023-09-01')
  },
  {
    id: 'stu-2',
    name: '林小华',
    grade: '初二',
    gender: '女',
    phone: '13900002222',
    parentName: '林妈妈',
    parentPhone: '13900002222',
    school: '第一中学',
    address: '上海市浦东新区锦绣路88号',
    createdAt: new Date('2023-10-15'),
    updatedAt: new Date('2023-10-15')
  },
  {
    id: 'stu-3',
    name: '王小红',
    grade: '五年级',
    gender: '女',
    phone: '13900003333',
    parentName: '王爸爸',
    parentPhone: '13900003333',
    school: '中心小学',
    address: '广州市天河区天河路100号',
    createdAt: new Date('2023-11-20'),
    updatedAt: new Date('2023-11-20')
  },
  {
    id: 'stu-4',
    name: '张小军',
    grade: '高一',
    gender: '男',
    phone: '13900004444',
    parentName: '张妈妈',
    parentPhone: '13900004444',
    school: '高级中学',
    address: '深圳市南山区科技园南区',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: 'stu-5',
    name: '刘小丽',
    grade: '三年级',
    gender: '女',
    phone: '13900005555',
    parentName: '刘爸爸',
    parentPhone: '13900005555',
    school: '第二小学',
    address: '成都市武侯区武侯祠大街',
    createdAt: new Date('2024-02-18'),
    updatedAt: new Date('2024-02-18')
  },
  {
    id: 'stu-demo-1',
    name: '张同学',
    grade: '初二',
    gender: '男',
    phone: '13812345678',
    parentName: '张家长',
    parentPhone: '13812345678',
    school: '演示中学',
    address: '演示地址1',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'stu-demo-2',
    name: '李同学',
    grade: '高一',
    gender: '女',
    phone: '13987654321',
    parentName: '李家长',
    parentPhone: '13987654321',
    school: '演示高中',
    address: '演示地址2',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]
