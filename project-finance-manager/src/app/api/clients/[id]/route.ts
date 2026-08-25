import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name } = body
    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: { name },
    })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: 'クライアントの更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.client.delete({ where: { id: Number(id) } })
    return NextResponse.json({ message: '削除しました' })
  } catch {
    return NextResponse.json({ error: 'クライアントの削除に失敗しました' }, { status: 500 })
  }
}
