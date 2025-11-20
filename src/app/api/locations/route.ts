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

    const locations = await prisma.location.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            activities: true
          }
        }
      }
    })

    return NextResponse.json(locations)
  } catch (error) {
    console.error('Error fetching locations:', error)
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

    const location = await prisma.location.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        phone: data.phone,
        email: data.email,
        description: data.description,
        capacity: data.capacity || 1,
        rooms: data.rooms || 1,
        bathrooms: data.bathrooms || 1,
        hasWifi: data.hasWifi || false,
        hasParking: data.hasParking || false,
        hasAC: data.hasAC || false,
        notes: data.notes,
      }
    })

    return NextResponse.json(location, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
