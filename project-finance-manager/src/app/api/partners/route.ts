import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({
      where: { deleted: 0 },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(partners)
  } catch {
    return NextResponse.json({ error: '協力会社の取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { partnerCode, name, salesRep } = body
    if (!partnerCode) return NextResponse.json({ error: '取引先コードは必須です' }, { status: 400 })
    if (!/^\d{1,9}$/.test(String(partnerCode))) {
      return NextResponse.json({ error: '取引先コードは半角数字1〜9桁で入力してください' }, { status: 400 })
    }
    if (!name) return NextResponse.json({ error: '会社名は必須です' }, { status: 400 })
    const partner = await prisma.partner.create({
      data: { partnerCode: String(partnerCode), name, salesRep: salesRep ?? null },
    })
    return NextResponse.json(partner, { status: 201 })
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code?: string }).code === 'P2002') {
      return NextResponse.json({ error: 'この取引先コードは既に登録されています' }, { status: 409 })
    }
    return NextResponse.json({ error: '協力会社の登録に失敗しました' }, { status: 500 })
  }
}
