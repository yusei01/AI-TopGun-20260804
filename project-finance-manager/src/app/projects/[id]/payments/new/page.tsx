'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { calcProperPayment, calcPartnerPayment } from '@/lib/calculations'
import { formatCurrency } from '@/lib/utils'

interface Member { id: number; name: string; employeeType: string; hourlyRate?: number }
interface Partner { id: number; name: string; baseAmount: number }
interface FiscalSetting { id: number; fiscalYear: number; indirectRate: number; salesRate: number }

export default function NewPaymentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [fiscalSettings, setFiscalSettings] = useState<FiscalSetting[]>([])
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    employeeType: 'PROPER',
    memberId: '',
    partnerId: '',
    category: '外注費',
    workingHours: '',
    hourlyRate: '',
    baseAmount: '',
    fiscalYear: String(new Date().getFullYear()),
  })

  // 担当者選択で時間単価を自動入力
  const handleMemberChange = (memberId: string) => {
    const member = members.find(m => String(m.id) === memberId)
    setForm(f => ({ ...f, memberId, hourlyRate: member?.hourlyRate ? String(member.hourlyRate) : f.hourlyRate }))
  }

  // 協力会社選択で基準金額を自動入力
  const handlePartnerChange = (partnerId: string) => {
    const partner = partners.find(p => String(p.id) === partnerId)
    setForm(f => ({ ...f, partnerId, baseAmount: partner?.baseAmount ? String(partner.baseAmount) : f.baseAmount }))
  }

  // プレビュー計算
  const preview = (() => {
    const setting = fiscalSettings.find(s => s.fiscalYear === Number(form.fiscalYear))
    if (!setting || !form.workingHours) return null

    if (form.employeeType === 'PROPER' && form.hourlyRate) {
      return calcProperPayment({
        workingHours: Number(form.workingHours),
        hourlyRate: Number(form.hourlyRate),
        indirectRate: setting.indirectRate,
        salesRate: setting.salesRate,
      })
    }
    if (form.employeeType === 'PARTNER' && form.baseAmount) {
      return calcPartnerPayment({
        baseAmount: Number(form.baseAmount),
        workingHours: Number(form.workingHours),
        salesRate: setting.salesRate,
      })
    }
    return null
  })()

  useEffect(() => {
    fetch('/api/members').then(r => r.json()).then(setMembers)
    fetch('/api/partners').then(r => r.json()).then(setPartners)
    fetch('/api/fiscal-settings').then(r => r.json()).then(setFiscalSettings)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`/api/projects/${id}/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employeeType: form.employeeType,
        memberId: form.memberId || null,
        partnerId: form.partnerId || null,
        category: form.category,
        workingHours: form.workingHours,
        hourlyRate: form.hourlyRate || null,
        baseAmount: form.baseAmount || null,
        fiscalYear: form.fiscalYear,
      }),
    })
    if (res.ok) {
      router.push(`/projects/${id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? '登録に失敗しました')
    }
  }

  const properMembers = members.filter(m => m.employeeType === 'PROPER')

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← 戻る</button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">支払い登録</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm">{error}</div>}

          {/* 社員区分 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">社員区分 <span className="text-red-500">*</span></label>
            <div className="flex gap-4">
              {[{ value: 'PROPER', label: 'プロパー' }, { value: 'PARTNER', label: '協力会社' }].map(opt => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="employeeType" value={opt.value} checked={form.employeeType === opt.value}
                    onChange={e => setForm({ ...form, employeeType: e.target.value, memberId: '', partnerId: '', hourlyRate: '', baseAmount: '' })} />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* プロパー：担当者選択 */}
          {form.employeeType === 'PROPER' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">担当者</label>
                <select value={form.memberId} onChange={e => handleMemberChange(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                  <option value="">選択してください</option>
                  {properMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">時間単価（円）<span className="text-red-500">*</span></label>
                <input type="number" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })}
                  required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="0" />
              </div>
            </div>
          )}

          {/* 協力会社：会社選択 */}
          {form.employeeType === 'PARTNER' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">協力会社</label>
                <select value={form.partnerId} onChange={e => handlePartnerChange(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                  <option value="">選択してください</option>
                  {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">基準金額（月額）<span className="text-red-500">*</span></label>
                <input type="number" value={form.baseAmount} onChange={e => setForm({ ...form, baseAmount: e.target.value })}
                  required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="0" />
              </div>
            </div>
          )}

          {/* 費目・稼働時間・年度 */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">費目 <span className="text-red-500">*</span></label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                {['外注費', '交通費', '材料費'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">稼働時間（h）<span className="text-red-500">*</span></label>
              <input type="number" step="0.1" value={form.workingHours} onChange={e => setForm({ ...form, workingHours: e.target.value })}
                required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" placeholder="160" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">適用年度 <span className="text-red-500">*</span></label>
              <select value={form.fiscalYear} onChange={e => setForm({ ...form, fiscalYear: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                {fiscalSettings.length === 0 && <option value="">年度設定がありません</option>}
                {fiscalSettings.map(s => <option key={s.fiscalYear} value={s.fiscalYear}>{s.fiscalYear}年度</option>)}
              </select>
            </div>
          </div>

          {/* 計算プレビュー */}
          {preview && (
            <div className="bg-blue-50 rounded-lg p-4 space-y-1 text-sm">
              <div className="font-medium text-blue-700 mb-2">計算プレビュー</div>
              <div className="flex justify-between text-gray-600">
                <span>原価</span><span>{formatCurrency(preview.baseCost)}</span>
              </div>
              {preview.indirectCost > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>間接費</span><span>{formatCurrency(preview.indirectCost)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>基準販売費</span><span>{formatCurrency(preview.salesCost)}</span>
              </div>
              {preview.adjustment !== 0 && (
                <div className={`flex justify-between ${preview.adjustment < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  <span>{preview.adjustment < 0 ? '控除額' : '超過額'}</span>
                  <span>{formatCurrency(preview.adjustment)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-blue-800 border-t border-blue-200 pt-1 mt-1">
                <span>支払い合計</span><span>{formatCurrency(preview.totalPayment)}</span>
              </div>
            </div>
          )}

          {fiscalSettings.length === 0 && (
            <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded text-sm">
              年度設定が登録されていません。先にマスタ管理で年度設定を登録してください。
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
