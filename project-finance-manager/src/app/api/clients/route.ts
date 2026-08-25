import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(clients)
  } catch {
    return NextResponse.json({ error: 'クライアントの取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name } = body
    if (!name) return NextResponse.json({ error: 'クライアント名は必須です' }, { status: 400 })
    const client = await prisma.client.create({ data: { name } })
    return NextResponse.json(client, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'クライアントの登録に失敗しました' }, { status: 500 })
  }
}
