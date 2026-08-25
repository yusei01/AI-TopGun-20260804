import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcProperPayment, calcPartnerPayment } from '@/lib/calculations'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { employeeType, memberId, partnerId, category, workingHours, hourlyRate, baseAmount, fiscalYear } = body

    const fiscalSetting = await prisma.fiscalSetting.findUnique({ where: { fiscalYear: Number(fiscalYear) } })
    if (!fiscalSetting) {
      return NextResponse.json({ error: `${fiscalYear}年度の設定が見つかりません` }, { status: 400 })
    }

    let calcResult
    if (employeeType === 'PROPER') {
      calcResult = calcProperPayment({
        workingHours: Number(workingHours), hourlyRate: Number(hourlyRate),
        indirectRate: fiscalSetting.indirectRate, salesRate: fiscalSetting.salesRate,
      })
    } else {
      calcResult = calcPartnerPayment({
        baseAmount: Number(baseAmount), workingHours: Number(workingHours), salesRate: fiscalSetting.salesRate,
      })
    }

    const payment = await prisma.payment.update({
      where: { id: Number(id) },
      data: {
        employeeType, memberId: memberId ? Number(memberId) : null, partnerId: partnerId ? Number(partnerId) : null,
        category, workingHours: Number(workingHours), hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        baseAmount: baseAmount ? Number(baseAmount) : null,
        baseCost: calcResult.baseCost, indirectCost: calcResult.indirectCost,
        salesCost: calcResult.salesCost, adjustment: calcResult.adjustment,
        totalPayment: calcResult.totalPayment, fiscalYear: Number(fiscalYear),
      },
      include: { member: true, partner: true },
    })
    return NextResponse.json(payment)
  } catch {
    return NextResponse.json({ error: '支払いの更新に失敗しました' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.payment.delete({ where: { id: Number(id) } })
    return NextResponse.json({ message: '削除しました' })
  } catch {
    return NextResponse.json({ error: '支払いの削除に失敗しました' }, { status: 500 })
  }
}
