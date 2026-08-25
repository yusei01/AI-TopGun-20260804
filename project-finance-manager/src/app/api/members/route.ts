import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const members = await prisma.member.findMany({ orderBy: { name: 'asc' } })
    return NextResponse.json(members)
  } catch {
    return NextResponse.json({ error: '担当者の取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, employeeType, hourlyRate } = body
    if (!name) return NextResponse.json({ error: '担当者名は必須です' }, { status: 400 })
    if (!employeeType) return NextResponse.json({ error: '社員区分は必須です' }, { status: 400 })
    const member = await prisma.member.create({
      data: { name, employeeType, hourlyRate: hourlyRate ? Number(hourlyRate) : null },
    })
    return NextResponse.json(member, { status: 201 })
  } catch {
    return NextResponse.json({ error: '担当者の登録に失敗しました' }, { status: 500 })
  }
}
