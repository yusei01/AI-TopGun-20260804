import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, baseAmount } = body
    const partner = await prisma.partner.update({
      where: { id: Number(id) },
      data: { name, baseAmount: Number(baseAmount) },
    })
    return NextResponse.json(partner)
  } catch {
    return NextResponse.json({ error: '協力会社の更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.partner.delete({ where: { id: Number(id) } })
    return NextResponse.json({ message: '削除しました' })
  } catch {
    return NextResponse.json({ error: '協力会社の削除に失敗しました' }, { status: 500 })
  }
}
