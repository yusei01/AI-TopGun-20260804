import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, department } = body
    const client = await prisma.client.update({
      where: { id: Number(id) },
      data: {
        ...(name !== undefined && { name }),
        ...(department !== undefined && { department: department ?? null }),
      },
    })
    return NextResponse.json(client)
  } catch {
    return NextResponse.json({ error: 'クライアントの更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    // 論理削除: deleted を 1(無効) に更新
    await prisma.client.update({
      where: { id: Number(id) },
      data: { deleted: 1 },
    })
    return NextResponse.json({ message: '削除しました' })
  } catch {
    return NextResponse.json({ error: 'クライアントの削除に失敗しました' }, { status: 500 })
  }
}
