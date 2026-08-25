// ==========================================
// 売上計算ロジック
// ==========================================

export interface QuasiMandateRevenueInput {
  baseAmount: number
  workingHours: number
  lowerHours: number
  upperHours: number
  calcBaseHours: number
}

export interface SesRevenueInput {
  baseAmount: number
  workingHours: number
  lowerHours: number
  upperHours: number
  calcBaseHours: number
}

export interface RevenueResult {
  unitPrice: number
  adjustment: number
  totalRevenue: number
}

/**
 * 準委任契約の売上計算
 * - 下限未達でも減額なし
 * - 上限超過分のみ加算
 */
export function calcQuasiMandateRevenue(input: QuasiMandateRevenueInput): RevenueResult {
  const { baseAmount, workingHours, upperHours, calcBaseHours } = input
  const unitPrice = baseAmount / calcBaseHours
  let adjustment = 0

  if (workingHours > upperHours) {
    adjustment = (workingHours - upperHours) * unitPrice
  }

  return {
    unitPrice,
    adjustment,
    totalRevenue: baseAmount + adjustment,
  }
}

/**
 * SESの売上計算
 * - 下限未達：控除あり
 * - 上限超過：加算あり
 */
export function calcSesRevenue(input: SesRevenueInput): RevenueResult {
  const { baseAmount, workingHours, lowerHours, upperHours, calcBaseHours } = input
  const unitPrice = baseAmount / calcBaseHours
  let adjustment = 0

  if (workingHours < lowerHours) {
    adjustment = -(lowerHours - workingHours) * unitPrice
  } else if (workingHours > upperHours) {
    adjustment = (workingHours - upperHours) * unitPrice
  }

  return {
    unitPrice,
    adjustment,
    totalRevenue: baseAmount + adjustment,
  }
}

// ==========================================
// 支払い計算ロジック
// ==========================================

export interface ProperPaymentInput {
  workingHours: number
  hourlyRate: number
  indirectRate: number
  salesRate: number
}

export interface PartnerPaymentInput {
  baseAmount: number
  workingHours: number
  salesRate: number
}

export interface PaymentResult {
  baseCost: number
  indirectCost: number
  salesCost: number
  adjustment: number
  totalPayment: number
}

/**
 * プロパーの支払い計算
 * 基準販売費 = (原価 + 間接費) × 基準販売費係数
 */
export function calcProperPayment(input: ProperPaymentInput): PaymentResult {
  const { workingHours, hourlyRate, indirectRate, salesRate } = input
  const baseCost = workingHours * hourlyRate
  const indirectCost = baseCost * indirectRate
  const salesCost = (baseCost + indirectCost) * salesRate
  const totalPayment = baseCost + indirectCost + salesCost

  return {
    baseCost,
    indirectCost,
    salesCost,
    adjustment: 0,
    totalPayment,
  }
}

/**
 * 協力会社の支払い計算
 * - 140h未満：控除
 * - 140〜180h：基準金額
 * - 180h超過：加算
 */
export function calcPartnerPayment(input: PartnerPaymentInput): PaymentResult {
  const { baseAmount, workingHours, salesRate } = input
  let adjustment = 0

  if (workingHours < 140) {
    adjustment = -(140 - workingHours) * (baseAmount / 140)
  } else if (workingHours > 180) {
    adjustment = (workingHours - 180) * (baseAmount / 180)
  }

  const salesCost = baseAmount * salesRate
  const totalPayment = baseAmount + adjustment + salesCost

  return {
    baseCost: baseAmount,
    indirectCost: 0,
    salesCost,
    adjustment,
    totalPayment,
  }
}

// ==========================================
// 集計ロジック
// ==========================================

export type PeriodType = 'monthly' | 'first_half' | 'second_half' | 'annual'

/**
 * 年度・期間タイプから対象月範囲を返す
 * 年度: 4月始まり〜3月終わり
 */
export function getPeriodRange(
  fiscalYear: number,
  periodType: PeriodType,
  month?: number
): { startDate: Date; endDate: Date } {
  switch (periodType) {
    case 'monthly': {
      const m = month ?? 4
      const year = m >= 4 ? fiscalYear : fiscalYear + 1
      const startDate = new Date(year, m - 1, 1)
      const endDate = new Date(year, m, 0, 23, 59, 59)
      return { startDate, endDate }
    }
    case 'first_half':
      return {
        startDate: new Date(fiscalYear, 3, 1),       // 4月1日
        endDate: new Date(fiscalYear, 8, 30, 23, 59, 59), // 9月30日
      }
    case 'second_half':
      return {
        startDate: new Date(fiscalYear, 9, 1),        // 10月1日
        endDate: new Date(fiscalYear + 1, 2, 31, 23, 59, 59), // 3月31日
      }
    case 'annual':
    default:
      return {
        startDate: new Date(fiscalYear, 3, 1),        // 4月1日
        endDate: new Date(fiscalYear + 1, 2, 31, 23, 59, 59), // 3月31日
      }
  }
}
