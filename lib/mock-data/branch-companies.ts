import { BranchCompany } from '@/types'

export const mockBranchCompanies: BranchCompany[] = [
  {
    id: 'branch-1',
    name: '上海鼎伴学分公司',
    managerName: '张经理',
    phone: '021-12345678',
    wechat: 'zhang_manager_sh',
    csName: '李客服',
    csPhone: '13800001001',
    enabled: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'branch-2',
    name: '北京鼎伴学分公司',
    managerName: '王经理',
    phone: '010-87654321',
    wechat: 'wang_manager_bj',
    csName: '赵客服',
    csPhone: '13800002002',
    enabled: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'branch-3',
    name: '广州鼎伴学分公司',
    managerName: '陈经理',
    phone: '020-11112222',
    wechat: 'chen_manager_gz',
    csName: '刘客服',
    csPhone: '13800003003',
    enabled: true,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'branch-4',
    name: '深圳鼎伴学分公司',
    managerName: '黄经理',
    phone: '0755-33334444',
    wechat: 'huang_manager_sz',
    csName: '杨客服',
    csPhone: '13800004004',
    enabled: true,
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15')
  },
  {
    id: 'branch-5',
    name: '成都鼎伴学分公司',
    managerName: '吴经理',
    phone: '028-55556666',
    wechat: 'wu_manager_cd',
    csName: '周客服',
    csPhone: '13800005005',
    enabled: false,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01')
  }
]
