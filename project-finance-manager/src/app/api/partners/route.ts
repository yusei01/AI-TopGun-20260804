import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const partners = await prisma.partner.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(partners)
  } catch {
    return NextResponse.json({ error: '協力会社の取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, baseAmount } = body
    if (!name) return NextResponse.json({ error: '会社名は必須です' }, { status: 400 })
    if (!baseAmount) return NextResponse.json({ error: '基準金額は必須です' }, { status: 400 })
    const partner = await prisma.partner.create({
      data: { name, baseAmount: Number(baseAmount) },
    })
    return NextResponse.json(partner, { status: 201 })
  } catch {
    return NextResponse.json({ error: '協力会社の登録に失敗しました' }, { status: 500 })
  }
}
