'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { formatCurrency, formatDate, PROJECT_TYPE_LABELS, STATUS_LABELS, STATUS_COLORS, PROJECT_TYPE_COLORS, PAYMENT_STATUS_LABELS } from '@/lib/utils'

interface Project {
  id: number; projectCode: string; name: string; projectType: string
  client?: { name: string }; dueDate?: string; status: string
  projectMembers: { member: { id: number; name: string } }[]
  revenues: Revenue[]; payments: Payment[]
  totalRevenue: number; totalPayment: number; grossProfit: number
}
interface Revenue {
  id: number; revenueType: string; member?: { name: string }
  baseAmount: number; workingHours?: number; adjustment?: number
  totalRevenue: number; invoiceDate?: string; paymentStatus?: string
}
interface Payment {
  id: number; employeeType: string; category: string
  member?: { name: string }; partner?: { name: string }
  workingHours: number; baseCost: number; indirectCost: number
  salesCost: number; adjustment: number; totalPayment: number
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(setProject).finally(() => setLoading(false))
  }
  useEffect(load, [id])

  const deleteRevenue = async (rid: number) => {
    if (!confirm('売上を削除しますか？')) return
    await fetch(`/api/revenues/${rid}`, { method: 'DELETE' })
    load()
  }
  const deletePayment = async (pid: number) => {
    if (!confirm('支払いを削除しますか？')) return
    await fetch(`/api/payments/${pid}`, { method: 'DELETE' })
    load()
  }
  const deleteProject = async () => {
    if (!confirm('この案件を削除しますか？（売上・支払い明細も全て削除されます）')) return
    await fetch(`/api/projects/${id}`, { method: 'DELETE' })
    router.push('/')
  }

  if (loading) return <Layout><div className="p-8 text-center text-gray-400">読み込み中...</div></Layout>
  if (!project) return <Layout><div className="p-8 text-center text-gray-400">案件が見つかりません</div></Layout>

  return (
    <Layout>
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-gray-500 text-sm">{project.projectCode}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PROJECT_TYPE_COLORS[project.projectType]}`}>{PROJECT_TYPE_LABELS[project.projectType]}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]}`}>{STATUS_LABELS[project.status]}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
          <div className="text-sm text-gray-500 mt-1 flex gap-4">
            {project.client && <span>クライアント: {project.client.name}</span>}
            {project.dueDate && <span>期日: {formatDate(project.dueDate)}</span>}
            {project.projectMembers.length > 0 && <span>担当: {project.projectMembers.map(m => m.member.name).join('、')}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${id}/edit`} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">編集</Link>
          <button onClick={deleteProject} className="border border-red-300 text-red-600 px-4 py-2 rounded-lg text-sm hover:bg-red-50">削除</button>
        </div>
      </div>

      {/* 粗利サマリー */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">売上合計</div>
          <div className="text-xl font-bold text-gray-800">{formatCurrency(project.totalRevenue)}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-xs text-gray-500 mb-1">支払い合計</div>
          <div className="text-xl font-bold text-gray-800">{formatCurrency(project.totalPayment)}</div>
        </div>
        <div className={`rounded-lg border p-4 ${project.grossProfit >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="text-xs text-gray-500 mb-1">粗利</div>
          <div className={`text-xl font-bold ${project.grossProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(project.grossProfit)}</div>
        </div>
      </div>

      {/* 売上明細 */}
      <div className="bg-white rounded-lg border border-gray-200 mb-4">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">売上明細</h2>
          <Link href={`/projects/${id}/revenues/new`} className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100">+ 追加</Link>
        </div>
        {project.revenues.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">売上明細がありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs text-gray-500">担当者</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">基準金額</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">稼働時間</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">調整額</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">売上</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">請求日</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">入金状況</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {project.revenues.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{r.member?.name ?? '-'}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(r.baseAmount)}</td>
                  <td className="px-4 py-2 text-right">{r.workingHours != null ? `${r.workingHours}h` : '-'}</td>
                  <td className={`px-4 py-2 text-right ${(r.adjustment ?? 0) < 0 ? 'text-red-600' : (r.adjustment ?? 0) > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {r.adjustment != null && r.adjustment !== 0 ? formatCurrency(r.adjustment) : '-'}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">{formatCurrency(r.totalRevenue)}</td>
                  <td className="px-4 py-2">{r.invoiceDate ? formatDate(r.invoiceDate) : '-'}</td>
                  <td className="px-4 py-2">{r.paymentStatus ? PAYMENT_STATUS_LABELS[r.paymentStatus] : '-'}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => deleteRevenue(r.id)} className="text-red-400 hover:text-red-600 text-xs">削除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 支払い明細 */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700">支払い明細</h2>
          <Link href={`/projects/${id}/payments/new`} className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-100">+ 追加</Link>
        </div>
        {project.payments.length === 0 ? (
          <div className="p-6 text-center text-gray-400 text-sm">支払い明細がありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-2 text-xs text-gray-500">支払い先</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">区分</th>
                <th className="text-left px-4 py-2 text-xs text-gray-500">費目</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">稼働時間</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">原価</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">間接費</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">基準販売費</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">調整額</th>
                <th className="text-right px-4 py-2 text-xs text-gray-500">合計</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {project.payments.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{p.member?.name ?? p.partner?.name ?? '-'}</td>
                  <td className="px-4 py-2 text-xs">{p.employeeType === 'PROPER' ? 'プロパー' : '協力会社'}</td>
                  <td className="px-4 py-2">{p.category}</td>
                  <td className="px-4 py-2 text-right">{p.workingHours}h</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(p.baseCost)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(p.indirectCost)}</td>
                  <td className="px-4 py-2 text-right">{formatCurrency(p.salesCost)}</td>
                  <td className={`px-4 py-2 text-right ${p.adjustment < 0 ? 'text-red-600' : p.adjustment > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    {p.adjustment !== 0 ? formatCurrency(p.adjustment) : '-'}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold">{formatCurrency(p.totalPayment)}</td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => deletePayment(p.id)} className="text-red-400 hover:text-red-600 text-xs">削除</button>
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
