/** 金額をカンマ区切り表示 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(amount)
}

/** 日付をYYYY/MM/DD形式で表示 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('ja-JP')
}

export const PROJECT_TYPE_LABELS: Record<string, string> = {
  LUMP_SUM: '一括請負',
  QUASI_MANDATE: '準委任契約',
  SES: 'SES',
}

export const STATUS_LABELS: Record<string, string> = {
  IN_PROGRESS: '進行中',
  COMPLETED: '完了',
  CANCELLED: 'キャンセル',
}

export const EMPLOYEE_TYPE_LABELS: Record<string, string> = {
  PROPER: 'プロパー',
  PARTNER: '協力会社',
}

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNINVOICED: '未請求',
  INVOICED: '請求済',
  PAID: '入金済',
}

export const STATUS_COLORS: Record<string, string> = {
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

export const PROJECT_TYPE_COLORS: Record<string, string> = {
  LUMP_SUM: 'bg-purple-100 text-purple-700',
  QUASI_MANDATE: 'bg-orange-100 text-orange-700',
  SES: 'bg-teal-100 text-teal-700',
}
