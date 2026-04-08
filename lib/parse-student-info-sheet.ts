export type ParsedStudentInfoSheet = {
  campusName: string
  campusAccount: string
  studentName: string
  grade: string
  gender: string
  region: string
  school: string
  lastExamScore: string
  examMaxScore: string
  textbookVersion: string
  schoolProgress: string
  tutoringHistory: string
  otherSubjectsAvg: string
  parentPhone: string
  subject: string
  remarks: string
}

export function parseStudentInfoSheet(
  text: string,
  subjects: readonly string[],
  grades: readonly string[],
  genders: readonly string[]
): ParsedStudentInfoSheet {
  const extract = (label: string): string => {
    const regex = new RegExp(`${label}[：:](.*?)(?:\n|$)`)
    const match = text.match(regex)
    return match ? match[1].trim() : ""
  }

  let subject = ""
  const titleMatch = text.match(/【(.+?)体验课/)
  if (titleMatch) {
    const subjectCandidate = titleMatch[1]
    if (subjects.includes(subjectCandidate)) {
      subject = subjectCandidate
    }
  }

  const gradeRaw = extract("年级")
  const grade = grades.includes(gradeRaw) ? gradeRaw : ""

  const genderRaw = extract("性别")
  const gender = genders.includes(genderRaw) ? genderRaw : ""

  const trialTime = extract("意向试课时间（可多个）")
  const coachGender = extract("对教练性别的要求（不限/男/女）")
  const remarksRaw = extract("备注")
  const remarksParts = [
    trialTime ? `意向试课时间：${trialTime}` : "",
    coachGender ? `教练性别要求：${coachGender}` : "",
    remarksRaw,
  ].filter(Boolean)

  return {
    campusName: extract("校区名称"),
    campusAccount: extract("校区账号"),
    studentName: extract("学生姓名"),
    grade,
    gender,
    region: extract("地区"),
    school: extract("学校名称"),
    lastExamScore: extract("最近数学成绩"),
    examMaxScore: extract("试卷满分（100/120/150）"),
    textbookVersion: extract("数学教材版本") || extract("教材版本"),
    schoolProgress: extract("校内数学学习进度") || extract("校内学习进度"),
    tutoringHistory:
      extract("补过什么类型的数学课") || extract("补过什么类型的课"),
    otherSubjectsAvg: extract("其他科平均成绩"),
    parentPhone: extract("家长手机号"),
    subject,
    remarks: remarksParts.join("\n"),
  }
}
