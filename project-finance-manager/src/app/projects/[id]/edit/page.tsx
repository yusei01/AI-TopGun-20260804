'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Layout from '@/components/Layout'

interface Client { id: number; name: string }
interface Member { id: number; name: string }

export default function EditProjectPage() {
  const { id } = useParams()
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [form, setForm] = useState({
    projectCode: '', name: '', projectType: 'LUMP_SUM', clientId: '', dueDate: '', status: 'IN_PROGRESS',
  })
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/projects/${id}`).then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/members').then(r => r.json()),
    ]).then(([project, clientList, memberList]) => {
      setClients(clientList)
      setMembers(memberList)
      setForm({
        projectCode: project.projectCode ?? '',
        name: project.name ?? '',
        projectType: project.projectType ?? 'LUMP_SUM',
        clientId: project.clientId ? String(project.clientId) : '',
        dueDate: project.dueDate ? project.dueDate.slice(0, 10) : '',
        status: project.status ?? 'IN_PROGRESS',
      })
      setSelectedMembers(project.projectMembers?.map((pm: { member: { id: number } }) => pm.member.id) ?? [])
      setLoading(false)
    })
  }, [id])

  const toggleMember = (mid: number) => {
    setSelectedMembers(prev => prev.includes(mid) ? prev.filter(m => m !== mid) : [...prev, mid])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, clientId: form.clientId || null, memberIds: selectedMembers }),
    })
    if (res.ok) {
      router.push(`/projects/${id}`)
    } else {
      const data = await res.json()
      setError(data.error ?? '更新に失敗しました')
    }
  }

  if (loading) return <Layout><div className="p-8 text-center text-gray-400">読み込み中...</div></Layout>

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4">
          <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700">← 戻る</button>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-6">案件編集</h1>
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 px-4 py-2 rounded text-sm">{error}</div>}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">工番 <span className="text-red-500">*</span></label>
              <input value={form.projectCode} onChange={e => setForm({ ...form, projectCode: e.target.value })}
                required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">案件種別 <span className="text-red-500">*</span></label>
              <select value={form.projectType} onChange={e => setForm({ ...form, projectType: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="LUMP_SUM">一括請負</option>
                <option value="QUASI_MANDATE">準委任契約</option>
                <option value="SES">SES</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">案件名 <span className="text-red-500">*</span></label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">クライアント</label>
              <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option value="">選択してください</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm">
              <option value="IN_PROGRESS">進行中</option>
              <option value="COMPLETED">完了</option>
              <option value="CANCELLED">キャンセル</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">担当者</label>
            <div className="border border-gray-200 rounded p-3 flex flex-wrap gap-2">
              {members.map(m => (
                <button type="button" key={m.id} onClick={() => toggleMember(m.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${selectedMembers.includes(m.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'}`}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">更新</button>
            <button type="button" onClick={() => router.back()} className="border border-gray-300 text-gray-600 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">キャンセル</button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
