import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const clientId = searchParams.get('clientId')
    const projectType = searchParams.get('projectType')

    const projects = await prisma.project.findMany({
      where: {
        ...(status ? { status: status as never } : {}),
        ...(clientId ? { clientId: Number(clientId) } : {}),
        ...(projectType ? { projectType: projectType as never } : {}),
      },
      include: {
        client: true,
        projectMembers: { include: { member: true } },
        revenues: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // 粗利を計算して付与
    const projectsWithGrossProfit = projects.map((p) => {
      const totalRevenue = p.revenues.reduce((s, r) => s + r.totalRevenue, 0)
      const totalPayment = p.payments.reduce((s, pay) => s + pay.totalPayment, 0)
      return { ...p, totalRevenue, totalPayment, grossProfit: totalRevenue - totalPayment }
    })

    return NextResponse.json(projectsWithGrossProfit)
  } catch {
    return NextResponse.json({ error: '案件の取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { projectCode, name, projectType, clientId, dueDate, status, memberIds } = body
    if (!projectCode) return NextResponse.json({ error: '工番は必須です' }, { status: 400 })
    if (!name) return NextResponse.json({ error: '案件名は必須です' }, { status: 400 })
    if (!projectType) return NextResponse.json({ error: '案件種別は必須です' }, { status: 400 })

    const project = await prisma.project.create({
      data: {
        projectCode,
        name,
        projectType,
        clientId: clientId ? Number(clientId) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: status ?? 'IN_PROGRESS',
        projectMembers: memberIds?.length
          ? { create: memberIds.map((id: number) => ({ memberId: id })) }
          : undefined,
      },
      include: { client: true, projectMembers: { include: { member: true } } },
    })
    return NextResponse.json(project, { status: 201 })
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
      return NextResponse.json({ error: 'この工番は既に使用されています' }, { status: 400 })
    }
    return NextResponse.json({ error: '案件の登録に失敗しました' }, { status: 500 })
  }
}
