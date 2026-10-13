'use client'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import { formatCurrency, EMPLOYEE_TYPE_LABELS } from '@/lib/utils'

type Tab = 'fiscal' | 'members' | 'grades' | 'partners' | 'clients'

interface FiscalSetting { id: number; fiscalYear: number; indirectRate: number; salesRate: number }
interface Member { id: number; name: string; employeeType: string; hourlyRate?: number; grade?: number }
interface Grade { id: number; grade: number; startYm: string; endYm?: string | null; unitPrice: number }
interface Partner { id: number; name: string; baseAmount: number }
interface Client { id: number; name: string }

// グレードごとのデフォルト単価（登録時の初期値、手で変更可）
const GRADE_DEFAULT_PRICE: Record<number, number> = {
  9: 7800, 8: 7800, 7: 7800, 6: 7800,
  5: 6090,
  4: 4480,
  3: 3650,
  2: 2740, 1: 2740,
}
const GRADE_OPTIONS = [9, 8, 7, 6, 5, 4, 3, 2, 1]
interface Partner { id: number; partnerCode: string; name: string; salesRep?: string }
interface Client { id: number; name: string; department?: string }

export default function MasterPage() {
  const [tab, setTab] = useState<Tab>('fiscal')

  const tabs: { key: Tab; label: string }[] = [
    { key: 'fiscal', label: '年度設定' },
    { key: 'members', label: '担当者' },
    { key: 'grades', label: '等級' },
    { key: 'partners', label: '協力会社' },
    { key: 'clients', label: 'クライアント' },
  ]

  return (
    <Layout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">マスタ管理</h1>
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors -mb-px border-b-2 ${tab === t.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'fiscal' && <FiscalTab />}
      {tab === 'members' && <MembersTab />}
      {tab === 'grades' && <GradesTab />}
      {tab === 'partners' && <PartnersTab />}
      {tab === 'clients' && <ClientsTab />}
    </Layout>
  )
}

// ---- 年度設定 ----
function FiscalTab() {
  const [items, setItems] = useState<FiscalSetting[]>([])
  const [form, setForm] = useState({ fiscalYear: String(new Date().getFullYear()), indirectRate: '', salesRate: '' })
  const [editing, setEditing] = useState<FiscalSetting | null>(null)
  const [error, setError] = useState('')

  const load = () => fetch('/api/fiscal-settings').then(r => r.json()).then(setItems)
  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const res = await fetch('/api/fiscal-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ fiscalYear: '', indirectRate: '', salesRate: '' }); load() }
    else { const d = await res.json(); setError(d.error ?? '登録に失敗しました') }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!editing) return
    await fetch(`/api/fiscal-settings/${editing.fiscalYear}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    setEditing(null); load()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-700 mb-3">新規追加</h3>
        {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded text-sm mb-3">{error}</div>}
        <div className="flex gap-3 items-end">
          <div><label className="block text-xs text-gray-500 mb-1">年度</label>
            <input type="number" value={form.fiscalYear} onChange={e => setForm({ ...form, fiscalYear: e.target.value })} required className="border border-gray-300 rounded px-3 py-2 text-sm w-24" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">間接費係数</label>
            <input type="number" step="0.001" value={form.indirectRate} onChange={e => setForm({ ...form, indirectRate: e.target.value })} required placeholder="0.15" className="border border-gray-300 rounded px-3 py-2 text-sm w-28" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">基準販売費係数</label>
            <input type="number" step="0.001" value={form.salesRate} onChange={e => setForm({ ...form, salesRate: e.target.value })} required placeholder="0.10" className="border border-gray-300 rounded px-3 py-2 text-sm w-28" /></div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">追加</button>
        </div>
      </form>
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-2 text-xs text-gray-500">年度</th>
            <th className="text-right px-4 py-2 text-xs text-gray-500">間接費係数</th>
            <th className="text-right px-4 py-2 text-xs text-gray-500">基準販売費係数</th>
            <th className="px-4 py-2"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => editing?.id === item.id ? (
              <tr key={item.id}>
                <td className="px-4 py-2">{item.fiscalYear}年度</td>
                <td className="px-4 py-2"><input type="number" step="0.001" value={editing.indirectRate} onChange={e => setEditing({ ...editing, indirectRate: Number(e.target.value) })} className="border border-gray-300 rounded px-2 py-1 text-sm w-24" /></td>
                <td className="px-4 py-2"><input type="number" step="0.001" value={editing.salesRate} onChange={e => setEditing({ ...editing, salesRate: Number(e.target.value) })} className="border border-gray-300 rounded px-2 py-1 text-sm w-24" /></td>
                <td className="px-4 py-2 text-right flex gap-2 justify-end">
                  <button onClick={handleUpdate} className="text-blue-600 text-xs hover:underline">保存</button>
                  <button onClick={() => setEditing(null)} className="text-gray-400 text-xs hover:underline">キャンセル</button>
                </td>
              </tr>
            ) : (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{item.fiscalYear}年度</td>
                <td className="px-4 py-2 text-right">{(item.indirectRate * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-right">{(item.salesRate * 100).toFixed(1)}%</td>
                <td className="px-4 py-2 text-right"><button onClick={() => setEditing(item)} className="text-blue-400 text-xs hover:underline">編集</button></td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">年度設定がありません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- 担当者マスタ ----
function MembersTab() {
  const [items, setItems] = useState<Member[]>([])
  const [form, setForm] = useState({ name: '', employeeType: 'PROPER', hourlyRate: '', grade: '' })
  const [editing, setEditing] = useState<Member | null>(null)
  const [error, setError] = useState('')

  const load = () => fetch('/api/members').then(r => r.json()).then(setItems)
  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const res = await fetch('/api/members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ name: '', employeeType: 'PROPER', hourlyRate: '', grade: '' }); load() }
    else { const d = await res.json(); setError(d.error ?? '登録に失敗しました') }
  }

  const handleUpdate = async () => {
    if (!editing) return
    await fetch(`/api/members/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    setEditing(null); load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/members/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-700 mb-3">新規追加</h3>
        {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded text-sm mb-3">{error}</div>}
        <div className="flex gap-3 items-end flex-wrap">
          <div><label className="block text-xs text-gray-500 mb-1">氏名</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="border border-gray-300 rounded px-3 py-2 text-sm w-40" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">区分</label>
            <select value={form.employeeType} onChange={e => setForm({ ...form, employeeType: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="PROPER">プロパー</option><option value="PARTNER">協力会社</option>
            </select></div>
          {form.employeeType === 'PROPER' && (
            <div><label className="block text-xs text-gray-500 mb-1">時間単価（円）</label>
              <input type="number" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })} placeholder="0" className="border border-gray-300 rounded px-3 py-2 text-sm w-32" /></div>
          )}
          <div><label className="block text-xs text-gray-500 mb-1">グレード</label>
            <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="">なし</option>
              {GRADE_OPTIONS.map(g => <option key={g} value={g}>グレード{g}</option>)}
            </select></div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">追加</button>
        </div>
      </form>
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-2 text-xs text-gray-500">氏名</th>
            <th className="text-left px-4 py-2 text-xs text-gray-500">区分</th>
            <th className="text-left px-4 py-2 text-xs text-gray-500">グレード</th>
            <th className="text-right px-4 py-2 text-xs text-gray-500">時間単価</th>
            <th className="px-4 py-2"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => editing?.id === item.id ? (
              <tr key={item.id}>
                <td className="px-4 py-2"><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm w-36" /></td>
                <td className="px-4 py-2"><select value={editing.employeeType} onChange={e => setEditing({ ...editing, employeeType: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option value="PROPER">プロパー</option><option value="PARTNER">協力会社</option>
                </select></td>
                <td className="px-4 py-2"><select value={editing.grade ?? ''} onChange={e => setEditing({ ...editing, grade: e.target.value ? Number(e.target.value) : undefined })} className="border border-gray-300 rounded px-2 py-1 text-sm">
                  <option value="">なし</option>
                  {GRADE_OPTIONS.map(g => <option key={g} value={g}>グレード{g}</option>)}
                </select></td>
                <td className="px-4 py-2 text-right">{editing.employeeType === 'PROPER' && <input type="number" value={editing.hourlyRate ?? ''} onChange={e => setEditing({ ...editing, hourlyRate: Number(e.target.value) })} className="border border-gray-300 rounded px-2 py-1 text-sm w-28" />}</td>
                <td className="px-4 py-2 text-right flex gap-2 justify-end">
                  <button onClick={handleUpdate} className="text-blue-600 text-xs hover:underline">保存</button>
                  <button onClick={() => setEditing(null)} className="text-gray-400 text-xs hover:underline">キャンセル</button>
                </td>
              </tr>
            ) : (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{EMPLOYEE_TYPE_LABELS[item.employeeType]}</td>
                <td className="px-4 py-2">{item.grade ? `グレード${item.grade}` : '-'}</td>
                <td className="px-4 py-2 text-right">{item.hourlyRate ? formatCurrency(item.hourlyRate) : '-'}</td>
                <td className="px-4 py-2 text-right flex gap-3 justify-end">
                  <button onClick={() => setEditing(item)} className="text-blue-400 text-xs hover:underline">編集</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 text-xs hover:underline">削除</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">担当者が登録されていません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- 協力会社マスタ ----
function PartnersTab() {
  const [items, setItems] = useState<Partner[]>([])
  const [form, setForm] = useState({ partnerCode: '', name: '', salesRep: '' })
  const [editing, setEditing] = useState<Partner | null>(null)
  const [error, setError] = useState('')

  const load = () => fetch('/api/partners').then(r => r.json()).then(setItems)
  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const res = await fetch('/api/partners', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ partnerCode: '', name: '', salesRep: '' }); load() }
    else { const d = await res.json(); setError(d.error ?? '登録に失敗しました') }
  }

  const handleUpdate = async () => {
    if (!editing) return
    await fetch(`/api/partners/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    setEditing(null); load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/partners/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-700 mb-3">新規追加</h3>
        {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded text-sm mb-3">{error}</div>}
        <div className="flex gap-3 items-end flex-wrap">
          <div><label className="block text-xs text-gray-500 mb-1">取引先コード</label>
            <input value={form.partnerCode} onChange={e => setForm({ ...form, partnerCode: e.target.value })} required maxLength={9} pattern="\d{1,9}" placeholder="最大9桁" className="border border-gray-300 rounded px-3 py-2 text-sm w-32 font-mono" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">会社名</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="border border-gray-300 rounded px-3 py-2 text-sm w-48" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">営業担当者</label>
            <input value={form.salesRep} onChange={e => setForm({ ...form, salesRep: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm w-40" /></div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">追加</button>
        </div>
      </form>
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-2 text-xs text-gray-500">取引先コード</th>
            <th className="text-left px-4 py-2 text-xs text-gray-500">会社名</th>
            <th className="text-left px-4 py-2 text-xs text-gray-500">営業担当者</th>
            <th className="px-4 py-2"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => editing?.id === item.id ? (
              <tr key={item.id}>
                <td className="px-4 py-2"><input value={editing.partnerCode} onChange={e => setEditing({ ...editing, partnerCode: e.target.value })} maxLength={9} className="border border-gray-300 rounded px-2 py-1 text-sm w-32 font-mono" /></td>
                <td className="px-4 py-2"><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm w-48" /></td>
                <td className="px-4 py-2"><input value={editing.salesRep ?? ''} onChange={e => setEditing({ ...editing, salesRep: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm w-40" /></td>
                <td className="px-4 py-2 text-right flex gap-2 justify-end">
                  <button onClick={handleUpdate} className="text-blue-600 text-xs hover:underline">保存</button>
                  <button onClick={() => setEditing(null)} className="text-gray-400 text-xs hover:underline">キャンセル</button>
                </td>
              </tr>
            ) : (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 font-mono">{item.partnerCode}</td>
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.salesRep ?? '-'}</td>
                <td className="px-4 py-2 text-right flex gap-3 justify-end">
                  <button onClick={() => setEditing(item)} className="text-blue-400 text-xs hover:underline">編集</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 text-xs hover:underline">削除</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-400 text-sm">協力会社が登録されていません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- 等級マスタ ----
function GradesTab() {
  const [items, setItems] = useState<Grade[]>([])
  const [form, setForm] = useState({ grade: '9', startYm: '', endYm: '', unitPrice: String(GRADE_DEFAULT_PRICE[9]) })
  const [editing, setEditing] = useState<Grade | null>(null)
  const [error, setError] = useState('')

  const load = () => fetch('/api/grades').then(r => r.json()).then(setItems)
  useEffect(() => { load() }, [])

  // グレード選択で単価のデフォルト値を自動入力
  const handleGradeChange = (grade: string) => {
    const def = GRADE_DEFAULT_PRICE[Number(grade)]
    setForm(f => ({ ...f, grade, unitPrice: def != null ? String(def) : f.unitPrice }))
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const res = await fetch('/api/grades', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ grade: '9', startYm: '', endYm: '', unitPrice: String(GRADE_DEFAULT_PRICE[9]) }); load() }
    else { const d = await res.json(); setError(d.error ?? '登録に失敗しました') }
  }

  const handleUpdate = async () => {
    if (!editing) return
    await fetch(`/api/grades/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    setEditing(null); load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？')) return
    await fetch(`/api/grades/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-700 mb-3">新規追加</h3>
        {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded text-sm mb-3">{error}</div>}
        <div className="flex gap-3 items-end flex-wrap">
          <div><label className="block text-xs text-gray-500 mb-1">グレード</label>
            <select value={form.grade} onChange={e => handleGradeChange(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
              {GRADE_OPTIONS.map(g => <option key={g} value={g}>グレード{g}</option>)}
            </select></div>
          <div><label className="block text-xs text-gray-500 mb-1">適用開始年月</label>
            <input type="month" value={form.startYm} onChange={e => setForm({ ...form, startYm: e.target.value })} required className="border border-gray-300 rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">終了年月（空欄可）</label>
            <input type="month" value={form.endYm} onChange={e => setForm({ ...form, endYm: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">単価（円）</label>
            <input type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} required placeholder="0" className="border border-gray-300 rounded px-3 py-2 text-sm w-32" /></div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">追加</button>
        </div>
      </form>
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-2 text-xs text-gray-500">グレード</th>
            <th className="text-left px-4 py-2 text-xs text-gray-500">適用開始年月</th>
            <th className="text-left px-4 py-2 text-xs text-gray-500">終了年月</th>
            <th className="text-right px-4 py-2 text-xs text-gray-500">単価</th>
            <th className="px-4 py-2"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => editing?.id === item.id ? (
              <tr key={item.id}>
                <td className="px-4 py-2"><select value={editing.grade} onChange={e => setEditing({ ...editing, grade: Number(e.target.value) })} className="border border-gray-300 rounded px-2 py-1 text-sm">
                  {GRADE_OPTIONS.map(g => <option key={g} value={g}>グレード{g}</option>)}
                </select></td>
                <td className="px-4 py-2"><input type="month" value={editing.startYm} onChange={e => setEditing({ ...editing, startYm: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm" /></td>
                <td className="px-4 py-2"><input type="month" value={editing.endYm ?? ''} onChange={e => setEditing({ ...editing, endYm: e.target.value || null })} className="border border-gray-300 rounded px-2 py-1 text-sm" /></td>
                <td className="px-4 py-2 text-right"><input type="number" value={editing.unitPrice} onChange={e => setEditing({ ...editing, unitPrice: Number(e.target.value) })} className="border border-gray-300 rounded px-2 py-1 text-sm w-28" /></td>
                <td className="px-4 py-2 text-right flex gap-2 justify-end">
                  <button onClick={handleUpdate} className="text-blue-600 text-xs hover:underline">保存</button>
                  <button onClick={() => setEditing(null)} className="text-gray-400 text-xs hover:underline">キャンセル</button>
                </td>
              </tr>
            ) : (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">グレード{item.grade}</td>
                <td className="px-4 py-2">{item.startYm}</td>
                <td className="px-4 py-2">{item.endYm ?? '（継続中）'}</td>
                <td className="px-4 py-2 text-right">{formatCurrency(item.unitPrice)}</td>
                <td className="px-4 py-2 text-right flex gap-3 justify-end">
                  <button onClick={() => setEditing(item)} className="text-blue-400 text-xs hover:underline">編集</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 text-xs hover:underline">削除</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400 text-sm">等級が登録されていません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ---- クライアントマスタ ----
function ClientsTab() {
  const [items, setItems] = useState<Client[]>([])
  const [form, setForm] = useState({ name: '', department: '' })
  const [editing, setEditing] = useState<Client | null>(null)
  const [error, setError] = useState('')

  const load = () => fetch('/api/clients').then(r => r.json()).then(setItems)
  useEffect(() => { load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const res = await fetch('/api/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    if (res.ok) { setForm({ name: '', department: '' }); load() }
    else { const d = await res.json(); setError(d.error ?? '登録に失敗しました') }
  }

  const handleUpdate = async () => {
    if (!editing) return
    await fetch(`/api/clients/${editing.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
    setEditing(null); load()
  }

  const handleDelete = async (id: number) => {
    if (!confirm('削除しますか？') ) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-700 mb-3">新規追加</h3>
        {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded text-sm mb-3">{error}</div>}
        <div className="flex gap-3 items-end">
          <div><label className="block text-xs text-gray-500 mb-1">クライアント名</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="border border-gray-300 rounded px-3 py-2 text-sm w-48" /></div>
          <div><label className="block text-xs text-gray-500 mb-1">部署名</label>
            <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="border border-gray-300 rounded px-3 py-2 text-sm w-40" /></div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700">追加</button>
        </div>
      </form>
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>
            <th className="text-left px-4 py-2 text-xs text-gray-500">クライアント名</th>
            <th className="text-left px-4 py-2 text-xs text-gray-500">部署名</th>
            <th className="px-4 py-2"></th>
          </tr></thead>
          <tbody className="divide-y divide-gray-100">
            {items.map(item => editing?.id === item.id ? (
              <tr key={item.id}>
                <td className="px-4 py-2"><input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm w-48" /></td>
                <td className="px-4 py-2"><input value={editing.department ?? ''} onChange={e => setEditing({ ...editing, department: e.target.value })} className="border border-gray-300 rounded px-2 py-1 text-sm w-40" /></td>
                <td className="px-4 py-2 text-right flex gap-2 justify-end">
                  <button onClick={handleUpdate} className="text-blue-600 text-xs hover:underline">保存</button>
                  <button onClick={() => setEditing(null)} className="text-gray-400 text-xs hover:underline">キャンセル</button>
                </td>
              </tr>
            ) : (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-2">{item.name}</td>
                <td className="px-4 py-2">{item.department ?? '-'}</td>
                <td className="px-4 py-2 text-right flex gap-3 justify-end">
                  <button onClick={() => setEditing(item)} className="text-blue-400 text-xs hover:underline">編集</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-400 text-xs hover:underline">削除</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400 text-sm">クライアントが登録されていません</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
