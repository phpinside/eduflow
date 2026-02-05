import { User, Role } from '@/types'

const createTutor = (id: number, name: string, phoneSuffix: string, seed: string): User => ({
  id: `user-tutor-${id}`,
  phone: `1380000${phoneSuffix}`,
  name,
  roles: [Role.TUTOR],
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`,
  wechatQrCode: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=wxid_${seed}`,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-01-01')
})

export const mockUsers: User[] = [
  {
    id: 'user-sales-1',
    phone: '13800001001',
    name: '张招生',
    roles: [Role.SALES],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sales1',
    wechatQrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=wxid_sales1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  // Existing Tutors (referenced in orders)
  createTutor(1, '李伴学', '2001', 'tutor1'),
  createTutor(2, '王金牌', '2002', 'tutor2'),
  createTutor(3, '刘资深', '2003', 'tutor3'),
  
  // New Tutors to reach 20
  createTutor(4, '陈老师', '2004', 'tutor4'),
  createTutor(5, '杨老师', '2005', 'tutor5'),
  createTutor(6, '黄老师', '2006', 'tutor6'),
  createTutor(7, '赵老师', '2007', 'tutor7'),
  createTutor(8, '周老师', '2008', 'tutor8'),
  createTutor(9, '吴老师', '2009', 'tutor9'),
  createTutor(10, '徐老师', '2010', 'tutor10'),
  createTutor(11, '孙老师', '2011', 'tutor11'),
  createTutor(12, '马老师', '2012', 'tutor12'),
  createTutor(13, '朱老师', '2013', 'tutor13'),
  createTutor(14, '胡老师', '2014', 'tutor14'),
  createTutor(15, '郭老师', '2015', 'tutor15'),
  createTutor(16, '何老师', '2016', 'tutor16'),
  createTutor(17, '高老师', '2017', 'tutor17'),
  createTutor(18, '林老师', '2018', 'tutor18'),
  createTutor(19, '郑老师', '2019', 'tutor19'),
  createTutor(20, '谢老师', '2020', 'tutor20'),

  {
    id: 'user-manager-1',
    phone: '13800003001',
    name: '王学管',
    roles: [Role.MANAGER],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manager1',
    wechatQrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=wxid_manager1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 'user-operator-1',
    phone: '13800004001',
    name: '赵运营',
    roles: [Role.OPERATOR],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=operator1',
    wechatQrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=wxid_operator1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  },
  {
    id: 'user-admin-1',
    phone: '13800005001',
    name: '孙管理员',
    roles: [Role.ADMIN],
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01')
  }
]
