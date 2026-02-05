
export enum CourseType {
  TRIAL = "TRIAL",
  REGULAR = "REGULAR"
}

export interface PriceRule {
  id: string;
  subject: string;
  grade: string;
  regularPrice: number; // 正课课时价格
  trialPrice: number; // 试课价格
  trialDuration: number; // 试课时长（分钟）
  trialReward: number; // 试课成交奖励
  isEnabled: boolean;
}

export const SUBJECTS = [
  "数学", "语文", "英语", "物理", "化学", "生物", "历史", "地理", "政治"
];

export const GRADES = [
  "一年级", "二年级", "三年级", "四年级", "五年级", "六年级",
  "初一", "初二", "初三",
  "高一", "高二", "高三"
];

export const mockPriceRules: PriceRule[] = [
  {
    id: "rule-1",
    subject: "数学",
    grade: "一年级",
    regularPrice: 150,
    trialPrice: 0,
    trialDuration: 60,
    trialReward: 30,
    isEnabled: true,
  },
  {
    id: "rule-2",
    subject: "英语",
    grade: "初二",
    regularPrice: 200, 
    trialPrice: 0,
    trialDuration: 45,
    trialReward: 50,
    isEnabled: true,
  },
  {
    id: "rule-3",
    subject: "物理",
    grade: "高一",
    regularPrice: 220,
    trialPrice: 0,
    trialDuration: 60,
    trialReward: 60,
    isEnabled: false,
  }
];
