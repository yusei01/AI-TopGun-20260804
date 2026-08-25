import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcQuasiMandateRevenue, calcSesRevenue } from '@/lib/calculations'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { revenueType, memberId, baseAmount, workingHours, lowerHours, upperHours, calcBaseHours, invoiceDate, paymentStatus } = body

    let unitPrice = null
    let adjustment = 0
    let totalRevenue = Number(baseAmount)

    if (revenueType === 'QUASI_MANDATE') {
      const result = calcQuasiMandateRevenue({
        baseAmount: Number(baseAmount), workingHours: Number(workingHours),
        lowerHours: Number(lowerHours), upperHours: Number(upperHours), calcBaseHours: Number(calcBaseHours),
      })
      unitPrice = result.unitPrice; adjustment = result.adjustment; totalRevenue = result.totalRevenue
    } else if (revenueType === 'SES') {
      const result = calcSesRevenue({
        baseAmount: Number(baseAmount), workingHours: Number(workingHours),
        lowerHours: Number(lowerHours), upperHours: Number(upperHours), calcBaseHours: Number(calcBaseHours),
      })
      unitPrice = result.unitPrice; adjustment = result.adjustment; totalRevenue = result.totalRevenue
    }

    const revenue = await prisma.revenue.update({
      where: { id: Number(id) },
      data: {
        revenueType, memberId: memberId ? Number(memberId) : null,
        baseAmount: Number(baseAmount), workingHours: workingHours ? Number(workingHours) : null,
        lowerHours: lowerHours ? Number(lowerHours) : null, upperHours: upperHours ? Number(upperHours) : null,
        calcBaseHours: calcBaseHours ? Number(calcBaseHours) : null,
        unitPrice, adjustment, totalRevenue,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null, paymentStatus: paymentStatus ?? null,
      },
      include: { member: true },
    })
    return NextResponse.json(revenue)
  } catch {
    return NextResponse.json({ error: '売上の更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.revenue.delete({ where: { id: Number(id) } })
    return NextResponse.json({ message: '削除しました' })
  } catch {
    return NextResponse.json({ error: '売上の削除に失敗しました' }, { status: 500 })
  }
}
