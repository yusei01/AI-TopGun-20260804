import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { grade, startYm, endYm, unitPrice } = body

    const updated = await prisma.grade.update({
      where: { id: Number(id) },
      data: {
        grade: grade != null ? Number(grade) : undefined,
        startYm: startYm ?? undefined,
        endYm: endYm !== undefined ? (endYm || null) : undefined,
        unitPrice: unitPrice != null ? Number(unitPrice) : undefined,
      },
    })
    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: '等級の更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.grade.delete({ where: { id: Number(id) } })
    return NextResponse.json({ message: '削除しました' })
  } catch {
    return NextResponse.json({ error: '等級の削除に失敗しました' }, { status: 500 })
  }
}
