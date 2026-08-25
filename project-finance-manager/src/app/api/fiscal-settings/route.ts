import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const settings = await prisma.fiscalSetting.findMany({ orderBy: { fiscalYear: 'desc' } })
    return NextResponse.json(settings)
  } catch {
    return NextResponse.json({ error: '年度設定の取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { fiscalYear, indirectRate, salesRate } = body
    if (!fiscalYear) return NextResponse.json({ error: '年度は必須です' }, { status: 400 })
    const setting = await prisma.fiscalSetting.create({
      data: {
        fiscalYear: Number(fiscalYear),
        indirectRate: Number(indirectRate),
        salesRate: Number(salesRate),
      },
    })
    return NextResponse.json(setting, { status: 201 })
  } catch {
    return NextResponse.json({ error: '年度設定の登録に失敗しました' }, { status: 500 })
  }
}
