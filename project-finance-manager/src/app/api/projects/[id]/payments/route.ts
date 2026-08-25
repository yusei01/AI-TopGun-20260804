import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcProperPayment, calcPartnerPayment } from '@/lib/calculations'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payments = await prisma.payment.findMany({
      where: { projectId: Number(id) },
      include: { member: true, partner: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(payments)
  } catch {
    return NextResponse.json({ error: '支払いの取得に失敗しました' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { employeeType, memberId, partnerId, category, workingHours, hourlyRate, baseAmount, fiscalYear } = body

    if (!employeeType) return NextResponse.json({ error: '社員区分は必須です' }, { status: 400 })
    if (!category) return NextResponse.json({ error: '費目は必須です' }, { status: 400 })
    if (!fiscalYear) return NextResponse.json({ error: '年度は必須です' }, { status: 400 })

    const fiscalSetting = await prisma.fiscalSetting.findUnique({
      where: { fiscalYear: Number(fiscalYear) },
    })
    if (!fiscalSetting) {
      return NextResponse.json({ error: `${fiscalYear}年度の設定が見つかりません。マスタ管理で年度設定を登録してください。` }, { status: 400 })
    }

    let calcResult
    if (employeeType === 'PROPER') {
      calcResult = calcProperPayment({
        workingHours: Number(workingHours),
        hourlyRate: Number(hourlyRate),
        indirectRate: fiscalSetting.indirectRate,
        salesRate: fiscalSetting.salesRate,
      })
    } else {
      calcResult = calcPartnerPayment({
        baseAmount: Number(baseAmount),
        workingHours: Number(workingHours),
        salesRate: fiscalSetting.salesRate,
      })
    }

    const payment = await prisma.payment.create({
      data: {
        projectId: Number(id),
        employeeType,
        memberId: memberId ? Number(memberId) : null,
        partnerId: partnerId ? Number(partnerId) : null,
        category,
        workingHours: Number(workingHours),
        hourlyRate: hourlyRate ? Number(hourlyRate) : null,
        baseAmount: baseAmount ? Number(baseAmount) : null,
        baseCost: calcResult.baseCost,
        indirectCost: calcResult.indirectCost,
        salesCost: calcResult.salesCost,
        adjustment: calcResult.adjustment,
        totalPayment: calcResult.totalPayment,
        fiscalYear: Number(fiscalYear),
      },
      include: { member: true, partner: true },
    })
    return NextResponse.json(payment, { status: 201 })
  } catch {
    return NextResponse.json({ error: '支払いの登録に失敗しました' }, { status: 500 })
  }
}
