import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPeriodRange, PeriodType } from '@/lib/calculations'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const fiscalYear = Number(searchParams.get('fiscalYear') ?? new Date().getFullYear())
    const periodType = (searchParams.get('periodType') ?? 'annual') as PeriodType
    const month = searchParams.get('month') ? Number(searchParams.get('month')) : undefined

    const { startDate, endDate } = getPeriodRange(fiscalYear, periodType, month)

    const revenues = await prisma.revenue.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { project: { include: { client: true } } },
    })

    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: startDate, lte: endDate } },
      include: { project: true },
    })

    const totalRevenue = revenues.reduce((s, r) => s + r.totalRevenue, 0)
    const totalPayment = payments.reduce((s, p) => s + p.totalPayment, 0)
    const grossProfit = totalRevenue - totalPayment

    // 案件ごとの集計
    const projectMap = new Map<number, { projectId: number; projectName: string; projectCode: string; clientName: string; totalRevenue: number; totalPayment: number; grossProfit: number }>()
    revenues.forEach((r) => {
      const key = r.projectId
      const existing = projectMap.get(key) ?? {
        projectId: r.projectId,
        projectName: r.project.name,
        projectCode: r.project.projectCode,
        clientName: r.project.client?.name ?? '',
        totalRevenue: 0, totalPayment: 0, grossProfit: 0,
      }
      existing.totalRevenue += r.totalRevenue
      projectMap.set(key, existing)
    })
    payments.forEach((p) => {
      const key = p.projectId
      const existing = projectMap.get(key) ?? {
        projectId: p.projectId,
        projectName: p.project.name,
        projectCode: p.project.projectCode,
        clientName: '',
        totalRevenue: 0, totalPayment: 0, grossProfit: 0,
      }
      existing.totalPayment += p.totalPayment
      projectMap.set(key, existing)
    })
    const byProject = Array.from(projectMap.values()).map((p) => ({
      ...p, grossProfit: p.totalRevenue - p.totalPayment,
    }))

    return NextResponse.json({
      fiscalYear, periodType, month, startDate, endDate,
      summary: { totalRevenue, totalPayment, grossProfit },
      byProject,
    })
  } catch {
    return NextResponse.json({ error: '集計の取得に失敗しました' }, { status: 500 })
  }
}
