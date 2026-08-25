import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcQuasiMandateRevenue, calcSesRevenue } from '@/lib/calculations'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const revenues = await prisma.revenue.findMany({
      where: { projectId: Number(id) },
      include: { member: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(revenues)
  } catch {
    return NextResponse.json({ error: '売上の取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { revenueType, memberId, baseAmount, workingHours, lowerHours, upperHours, calcBaseHours, invoiceDate, paymentStatus } = body

    if (!revenueType) return NextResponse.json({ error: '売上種別は必須です' }, { status: 400 })
    if (!baseAmount) return NextResponse.json({ error: '基準金額は必須です' }, { status: 400 })

    let unitPrice = null
    let adjustment = 0
    let totalRevenue = Number(baseAmount)

    if (revenueType === 'QUASI_MANDATE') {
      const result = calcQuasiMandateRevenue({
        baseAmount: Number(baseAmount),
        workingHours: Number(workingHours),
        lowerHours: Number(lowerHours),
        upperHours: Number(upperHours),
        calcBaseHours: Number(calcBaseHours),
      })
      unitPrice = result.unitPrice
      adjustment = result.adjustment
      totalRevenue = result.totalRevenue
    } else if (revenueType === 'SES') {
      const result = calcSesRevenue({
        baseAmount: Number(baseAmount),
        workingHours: Number(workingHours),
        lowerHours: Number(lowerHours),
        upperHours: Number(upperHours),
        calcBaseHours: Number(calcBaseHours),
      })
      unitPrice = result.unitPrice
      adjustment = result.adjustment
      totalRevenue = result.totalRevenue
    }

    const revenue = await prisma.revenue.create({
      data: {
        projectId: Number(id),
        revenueType,
        memberId: memberId ? Number(memberId) : null,
        baseAmount: Number(baseAmount),
        workingHours: workingHours ? Number(workingHours) : null,
        lowerHours: lowerHours ? Number(lowerHours) : null,
        upperHours: upperHours ? Number(upperHours) : null,
        calcBaseHours: calcBaseHours ? Number(calcBaseHours) : null,
        unitPrice,
        adjustment,
        totalRevenue,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        paymentStatus: paymentStatus ?? null,
      },
      include: { member: true },
    })
    return NextResponse.json(revenue, { status: 201 })
  } catch {
    return NextResponse.json({ error: '売上の登録に失敗しました' }, { status: 500 })
  }
}
