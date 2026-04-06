export const LATEST_GRADE_UNIT_PRICE: Record<string, number> = {
  四年级: 150,
  五年级: 150,
  六年级: 180,
  初一: 200,
  初二: 220,
  初三: 250,
  高一: 280,
  高二: 300,
  高三: 320,
}

export function getLatestUnitPriceByGrade(grade: string): number {
  return LATEST_GRADE_UNIT_PRICE[grade] ?? 200
}

