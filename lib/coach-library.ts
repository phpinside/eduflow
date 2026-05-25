import { getStoredUsers } from "@/lib/storage"
import { Role } from "@/types"

export interface CoachCase {
  studentGrade: string
  originalProblem: string
  tutoringMethod: string
  result: string
  parentReview: string
  scoreChange: string
}

export interface CoachVideo {
  title: string
  status: "已上传" | "待补充"
  thumbnailUrl: string
}

export interface CoachProfile {
  id: string
  displayName: string
  realName: string
  gender: string
  school: string
  major: string
  grade: string
  city: string
  avatar?: string
  subjects: string[]
  studentGrades: string[]
  strengths: string[]
  personalityTags: string[]
  bio: string
  cases: CoachCase[]
  videos: CoachVideo[]
}

const schools = ["华东师范大学", "上海师范大学", "北京师范大学", "华南师范大学", "南京师范大学", "浙江大学"]
const majors = ["数学与应用数学", "物理学", "化学教育", "英语教育", "应用心理学", "教育技术学"]
const cities = ["上海", "北京", "广州", "深圳", "杭州", "南京"]
const personalities = ["温柔耐心", "善于鼓励", "严谨负责", "逻辑清晰", "活泼亲和", "目标感强"]
const strengths = ["基础补弱", "尖子培优", "学习习惯", "中考冲刺", "高考规划", "错题整理"]

function pick<T>(items: T[], index: number) {
  return items[index % items.length]
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function getCoachProfiles(): CoachProfile[] {
  return getStoredUsers()
    .filter(user => user.roles.includes(Role.TUTOR))
    .map((user, index) => {
      const subjects = unique(user.tutorSubjects?.length ? user.tutorSubjects : [pick(["数学", "英语", "物理", "化学"], index)])
      const studentGrades = unique(user.tutorGrades?.length ? user.tutorGrades : [pick(["小学", "初中", "高中"], index)])
      const school = pick(schools, index)
      const major = pick(majors, index)
      const city = pick(cities, index)
      const primarySubject = subjects[0] ?? "数学"

      return {
        id: user.id,
        displayName: user.name,
        realName: user.name,
        gender: index % 2 === 0 ? "女" : "男",
        school,
        major,
        grade: pick(["大三", "大四", "研一", "研二"], index),
        city,
        avatar: user.avatar,
        subjects,
        studentGrades,
        strengths: unique([pick(strengths, index), pick(strengths, index + 2), pick(strengths, index + 4)]),
        personalityTags: unique([pick(personalities, index), pick(personalities, index + 2), pick(personalities, index + 4)]),
        bio: `擅长${primarySubject}学习诊断与阶段提分，能够把复杂知识拆成学生听得懂、做得到的步骤。注重课堂反馈和学习习惯养成，适合需要稳定陪跑与信心建立的学生。`,
        cases: [
          {
            studentGrade: pick(["初二", "初三", "高一", "高二"], index),
            originalProblem: `${primarySubject}基础不够稳定，遇到综合题容易卡住，错题复盘不系统。`,
            tutoringMethod: "先定位薄弱知识点，再用错题归因、限时训练和课后复盘建立稳定解题路径。",
            result: `阶段测评从 ${72 + (index % 8)} 分提升到 ${88 + (index % 7)} 分，答题完整度明显提高。`,
            parentReview: "老师反馈细致，孩子愿意主动整理错题，学习状态比之前稳定很多。",
            scoreChange: `${72 + (index % 8)} -> ${88 + (index % 7)}`,
          },
        ],
        videos: [
          {
            title: "自我介绍",
            status: index % 3 === 0 ? "待补充" : "已上传",
            thumbnailUrl: `https://picsum.photos/seed/${user.id}-intro/960/540`,
          },
          {
            title: "3分钟试讲",
            status: index % 4 === 0 ? "待补充" : "已上传",
            thumbnailUrl: `https://picsum.photos/seed/${user.id}-trial/960/540`,
          },
          {
            title: "课程互动片段",
            status: index % 5 === 0 ? "待补充" : "已上传",
            thumbnailUrl: `https://picsum.photos/seed/${user.id}-classroom/960/540`,
          },
        ],
      }
    })
}
