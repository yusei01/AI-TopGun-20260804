'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { calcQuasiMandateRevenue, calcSesRevenue } from '@/lib/calculations'
import { formatCurrency, PAYMENT_STATUS_LABELS } from '@/lib/utils'

interface Member { id: number; name: string }
interface Project { id: number; name: string; projectType: string }

export default function NewRevenuePage() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    memberId: '',
    baseAmount: '',
    workingHours: '',
    lowerHours: '140',
    upperHours: '180',
    calcBaseHours: '160',
    invoiceDate: '',
    paymentStatus: 'UNINVOICED',
  })

  // プレビュー計算
  const preview = (() => {
    if (!project || !form.baseAmount) return null
    const base = Number(form.baseAmount)
    if (project.projectType === 'QUASI_MANDATE' && form.workingHours) {
      return calcQuasiMandateRevenue({
        baseAmount: base,
        workingHours: Number(form.workingHours),
        lowerHours: Number(form.lowerHours),
        upperHours: Number(form.upperHours),
        calcBaseHours: Number(form.calcBaseHours),
      })
    }
    if (project.projectType === 'SES' && form.workingHours) {
      return calcSesRevenue({
        baseAmount: base,
        workingHours: Number(form.workingHours),
        lowerHours: Number(form.lowerHours),
        upperHours: Number(form.upperHours),
        calcBaseHours: Number(form.calcBaseHours),
      })
    }
    return null
  })()

  useEffect(() => {
    fetch(`/api/projects/${id}`).then(r => r.json()).then(setProject)
    fetch('/api/members').then(r => r.json()).then(setMembers)
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`/api/projects/${id}/revenues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        revenueType: project?.projectType,
        memberId: form.memberId || null,
        baseAmount: form.baseAmount,
        workingHours: form.workingHours || null,
        lowerHours: form.lowerHours || null,
        upperHours: form.upperHours || null,
        calcBaseHours: form.calcBaseHours || null,
        invoiceDate: form.invoiceDate || null,
        paymentStatus: project?.projectType === 'LUMP_SUM' ? form.paymentStatus : null,
      }),
    })
    if (res.ok) {
      router.push(`/projects/${id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? '登録に失敗しました')
    }
  }

  if (!project) return <Layout><div className="p-8 text-center text-gray-400">読み込み中...</div></Layout>

  const isLumpSum = project.projectType === 'LUMP_SUM'
  const isHourly = project.projectType === 'QUASI_MANDATE' || project.projectType === 'SES'

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← 戻る</button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">売上登録</h1>
        <p className="text-sm text-gray-500 mb-6">{project.name}</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm">{error}</div>}

          {/* 担当者（準委任・SES） */}
          {isHourly && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
              <select value={form.memberId} onChange={e => setForm({ ...form, memberId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="">選択してください</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}

          {/* 基準金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isLumpSum ? '請求金額' : '基準金額（月額）'} <span className="text-red-500">*</span>
            </label>
            <input type="number" value={form.baseAmount} onChange={e => setForm({ ...form, baseAmount: e.target.value })}
              required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="0" />
          </div>

          {/* 稼働時間・上下限（準委任・SES） */}
          {isHourly && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">稼働時間（h）</label>
                  <input type="number" step="0.1" value={form.workingHours} onChange={e => setForm({ ...form, workingHours: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="160" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">下限時間（h）</label>
                  <input type="number" step="0.1" value={form.lowerHours} onChange={e => setForm({ ...form, lowerHours: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上限時間（h）</label>
                  <input type="number" step="0.1" value={form.upperHours} onChange={e => setForm({ ...form, upperHours: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">計算基準時間（h）</label>
                <input type="number" step="0.1" value={form.calcBaseHours} onChange={e => setForm({ ...form, calcBaseHours: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                <p className="text-xs text-gray-400 mt-1">単価 = 基準金額 ÷ 計算基準時間</p>
              </div>

              {/* 計算プレビュー */}
              {preview && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-1 text-sm">
                  <div className="font-medium text-blue-700 mb-2">計算プレビュー</div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">時間単価</span>
                    <span>{formatCurrency(preview.unitPrice)}/h</span>
                  </div>
                  <div className={`flex justify-between ${preview.adjustment < 0 ? 'text-red-600' : preview.adjustment > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{preview.adjustment < 0 ? '控除額' : preview.adjustment > 0 ? '超過額' : '調整なし'}</span>
                    <span>{preview.adjustment !== 0 ? formatCurrency(preview.adjustment) : '-'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-blue-800 border-t border-blue-200 pt-1 mt-1">
                    <span>売上合計</span>
                    <span>{formatCurrency(preview.totalRevenue)}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 請求日・入金状況（一括請負） */}
          {isLumpSum && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">請求予定日</label>
                <input type="date" value={form.invoiceDate} onChange={e => setForm({ ...form, invoiceDate: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">入金状況</label>
                <select value={form.paymentStatus} onChange={e => setForm({ ...form, paymentStatus: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                  {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">登録</button>
            <button type="button" onClick={() => router.back()} className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">キャンセル</button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
