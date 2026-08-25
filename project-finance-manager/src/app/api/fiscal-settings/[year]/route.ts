import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ year: string }> }) {
  try {
    const { year } = await params
    const body = await req.json()
    const { indirectRate, salesRate } = body
    const setting = await prisma.fiscalSetting.update({
      where: { fiscalYear: Number(year) },
      data: { indirectRate: Number(indirectRate), salesRate: Number(salesRate) },
    })
    return NextResponse.json(setting)
  } catch {
    return NextResponse.json({ error: '年度設定の更新に失敗しました' }, { status: 500 })
  }
}
