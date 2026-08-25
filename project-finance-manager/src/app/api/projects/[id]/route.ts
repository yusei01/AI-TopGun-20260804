import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id: Number(id) },
      include: {
        client: true,
        projectMembers: { include: { member: true } },
        revenues: { include: { member: true } },
        payments: { include: { member: true, partner: true } },
      },
    })
    if (!project) return NextResponse.json({ error: '案件が見つかりません' }, { status: 404 })

    const totalRevenue = project.revenues.reduce((s, r) => s + r.totalRevenue, 0)
    const totalPayment = project.payments.reduce((s, p) => s + p.totalPayment, 0)
    return NextResponse.json({ ...project, totalRevenue, totalPayment, grossProfit: totalRevenue - totalPayment })
  } catch {
    return NextResponse.json({ error: '案件の取得に失敗しました' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { projectCode, name, projectType, clientId, dueDate, status, memberIds } = body

    // 担当者を一旦削除して再登録
    await prisma.projectMember.deleteMany({ where: { projectId: Number(id) } })

    const project = await prisma.project.update({
      where: { id: Number(id) },
      data: {
        projectCode,
        name,
        projectType,
        clientId: clientId ? Number(clientId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status,
        projectMembers: memberIds?.length
          ? { create: memberIds.map((mid: number) => ({ memberId: mid })) }
          : undefined,
      },
      include: { client: true, projectMembers: { include: { member: true } } },
    })
    return NextResponse.json(project)
  } catch {
    return NextResponse.json({ error: '案件の更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.project.delete({ where: { id: Number(id) } })
    return NextResponse.json({ message: '削除しました' })
  } catch {
    return NextResponse.json({ error: '案件の削除に失敗しました' }, { status: 500 })
  }
}
