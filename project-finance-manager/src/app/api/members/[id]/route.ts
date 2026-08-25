import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, employeeType, hourlyRate } = body
    const member = await prisma.member.update({
      where: { id: Number(id) },
      data: { name, employeeType, hourlyRate: hourlyRate ? Number(hourlyRate) : null },
    })
    return NextResponse.json(member)
  } catch {
    return NextResponse.json({ error: '担当者の更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.member.delete({ where: { id: Number(id) } })
    return NextResponse.json({ message: '削除しました' })
  } catch {
    return NextResponse.json({ error: '担当者の削除に失敗しました' }, { status: 500 })
  }
}
