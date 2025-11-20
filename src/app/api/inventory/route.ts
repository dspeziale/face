import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const items = await prisma.inventory.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ],
      include: {
        location: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'OPERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const data = await request.json()

    const item = await prisma.inventory.create({
      data: {
        name: data.name,
        category: data.category,
        quantity: data.quantity || 0,
        minQuantity: data.minQuantity || 0,
        unit: data.unit || 'pz',
        locationId: data.locationId
      },
      include: {
        location: true
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating inventory item:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
