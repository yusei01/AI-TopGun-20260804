import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { partnerCode, name, salesRep } = body
    if (partnerCode !== undefined && !/^\d{1,9}$/.test(String(partnerCode))) {
      return NextResponse.json({ error: '取引先コードは半角数字1〜9桁で入力してください' }, { status: 400 })
    }
    const partner = await prisma.partner.update({
      where: { id: Number(id) },
      data: {
        ...(partnerCode !== undefined && { partnerCode: String(partnerCode) }),
        ...(name !== undefined && { name }),
        ...(salesRep !== undefined && { salesRep: salesRep ?? null }),
      },
    })
    return NextResponse.json(partner)
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'この取引先コードは既に登録されています' }, { status: 409 })
    }
    return NextResponse.json({ error: '協力会社の更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // 論理削除: deleted を 1(無効) に更新
    await prisma.partner.update({
      where: { id: Number(id) },
      data: { deleted: 1 },
    })
    return NextResponse.json({ message: '削除しました' })
  } catch {
    return NextResponse.json({ error: '協力会社の削除に失敗しました' }, { status: 500 })
  }
}
