'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import { formatCurrency, formatDate, PROJECT_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, PROJECT_TYPE_COLORS } from '@/lib/utils'

interface Project {
  id: number
  projectCode: string
  name: string
  projectType: string
  client?: { name: string }
  dueDate?: string
  status: string
  totalRevenue: number
  totalPayment: number
  grossProfit: number
}

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')

  useEffect(() => {
    const params = new URLSearchParams()
    if (filterStatus) params.set('status', filterStatus)
    if (filterType) params.set('projectType', filterType)
    fetch(`/api/projects?${params.toString()}`)
      .then((r) => r.json())
      .then(setProjects)
      .finally(() => setLoading(false))
  }, [filterStatus, filterType])

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">案件一覧</h1>
        <Link href="/projects/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
          + 新規案件登録
        </Link>
      </div>

      {/* フィルター */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4 flex gap-4">
        <div>
          <label className="text-xs text-gray-500 block mb-1">ステータス</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm">
            <option value="">すべて</option>
            <option value="IN_PROGRESS">進行中</option>
            <option value="COMPLETED">完了</option>
            <option value="CANCELLED">キャンセル</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">案件種別</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border border-gray-300 rounded px-3 py-1.5 text-sm">
            <option value="">すべて</option>
            <option value="LUMP_SUM">一括請負</option>
            <option value="QUASI_MANDATE">準委任契約</option>
            <option value="SES">SES</option>
          </select>
        </div>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">読み込み中...</div>
        ) : projects.length === 0 ? (
          <div className="p-8 text-center text-gray-400">案件がありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">工番</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">案件名</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">種別</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">クライアント</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">期日</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">ステータス</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">売上</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">支払い</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">粗利</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-600">{p.projectCode}</td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="text-blue-600 hover:underline font-medium">{p.name}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROJECT_TYPE_COLORS[p.projectType]}`}>
                      {PROJECT_TYPE_LABELS[p.projectType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.client?.name ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(p.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status]}`}>
                      {STATUS_LABELS[p.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(p.totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(p.totalPayment)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${p.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(p.grossProfit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
