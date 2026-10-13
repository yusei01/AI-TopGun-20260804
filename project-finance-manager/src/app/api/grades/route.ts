import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const grades = await prisma.grade.findMany({
      orderBy: [{ grade: 'desc' }, { startYm: 'asc' }],
    })
    return NextResponse.json(grades)
  } catch {
    return NextResponse.json({ error: '等級の取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { grade, startYm, endYm, unitPrice } = body
    if (grade == null) return NextResponse.json({ error: 'グレードは必須です' }, { status: 400 })
    if (!startYm) return NextResponse.json({ error: '適用開始年月は必須です' }, { status: 400 })
    if (unitPrice == null || unitPrice === '') return NextResponse.json({ error: '単価は必須です' }, { status: 400 })

    const created = await prisma.grade.create({
      data: {
        grade: Number(grade),
        startYm,
        endYm: endYm || null,
        unitPrice: Number(unitPrice),
      },
    })
    return NextResponse.json(created, { status: 201 })
  } catch {
    return NextResponse.json({ error: '等級の登録に失敗しました' }, { status: 500 })
  }
}
