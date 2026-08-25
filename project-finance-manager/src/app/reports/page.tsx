'use client'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { formatCurrency } from '@/lib/utils'

type PeriodType = 'monthly' | 'first_half' | 'second_half' | 'annual'

interface ProjectSummary {
  projectId: number
  projectCode: string
  projectName: string
  clientName: string
  totalRevenue: number
  totalPayment: number
  grossProfit: number
}

interface SummaryData {
  summary: { totalRevenue: number; totalPayment: number; grossProfit: number }
  byProject: ProjectSummary[]
}

const PERIOD_LABELS: Record<PeriodType, string> = {
  monthly: '月次',
  first_half: '上期（4〜9月）',
  second_half: '下期（10〜3月）',
  annual: '通期（4〜3月）',
}

const MONTHS = [4, 5, 6, 7, 8, 9, 10, 11, 12, 1, 2, 3]

export default function ReportsPage() {
  const currentYear = new Date().getFullYear()
  const [fiscalYear, setFiscalYear] = useState(currentYear)
  const [periodType, setPeriodType] = useState<PeriodType>('annual')
  const [month, setMonth] = useState(4)
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchData = () => {
    setLoading(true)
    const params = new URLSearchParams({ fiscalYear: String(fiscalYear), periodType })
    if (periodType === 'monthly') params.set('month', String(month))
    fetch(`/api/reports/summary?${params.toString()}`)
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [fiscalYear, periodType, month])

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">集計・レポート</h1>

      {/* 絞り込み */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">年度</label>
          <select value={fiscalYear} onChange={e => setFiscalYear(Number(e.target.value))}
            className="border border-gray-300 rounded px-3 py-1.5 text-sm">
            {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(y => (
              <option key={y} value={y}>{y}年度</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">集計期間</label>
          <div className="flex gap-2">
            {(Object.keys(PERIOD_LABELS) as PeriodType[]).map(pt => (
              <button key={pt} onClick={() => setPeriodType(pt)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${periodType === pt ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {PERIOD_LABELS[pt]}
              </button>
            ))}
          </div>
        </div>
        {periodType === 'monthly' && (
          <div>
            <label className="text-xs text-gray-500 block mb-1">月</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded px-3 py-1.5 text-sm">
              {MONTHS.map(m => <option key={m} value={m}>{m}月</option>)}
            </select>
          </div>
        )}
      </div>

      {/* サマリーカード */}
      {data && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">売上合計</div>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(data.summary.totalRevenue)}</div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="text-xs text-gray-500 mb-1">支払い合計</div>
              <div className="text-2xl font-bold text-gray-800">{formatCurrency(data.summary.totalPayment)}</div>
            </div>
            <div className={`rounded-lg border p-4 ${data.summary.grossProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="text-xs text-gray-500 mb-1">粗利合計</div>
              <div className={`text-2xl font-bold ${data.summary.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(data.summary.grossProfit)}
              </div>
            </div>
          </div>

          {/* 案件別内訳 */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="font-semibold text-gray-700">案件別内訳</h2>
            </div>
            {loading ? (
              <div className="p-8 text-center text-gray-400">読み込み中...</div>
            ) : data.byProject.length === 0 ? (
              <div className="p-8 text-center text-gray-400">該当期間のデータがありません</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">工番</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">案件名</th>
                    <th className="text-left px-4 py-2 text-xs text-gray-500">クライアント</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500">売上</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500">支払い</th>
                    <th className="text-right px-4 py-2 text-xs text-gray-500">粗利</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.byProject.map(p => (
                    <tr key={p.projectId} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-gray-500 text-xs">{p.projectCode}</td>
                      <td className="px-4 py-2">{p.projectName}</td>
                      <td className="px-4 py-2 text-gray-500">{p.clientName || '-'}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(p.totalRevenue)}</td>
                      <td className="px-4 py-2 text-right">{formatCurrency(p.totalPayment)}</td>
                      <td className={`px-4 py-2 text-right font-semibold ${p.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(p.grossProfit)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50 border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-2 text-sm font-semibold text-gray-700">合計</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(data.summary.totalRevenue)}</td>
                    <td className="px-4 py-2 text-right font-semibold">{formatCurrency(data.summary.totalPayment)}</td>
                    <td className={`px-4 py-2 text-right font-bold ${data.summary.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(data.summary.grossProfit)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </>
      )}
    </Layout>
  )
}
