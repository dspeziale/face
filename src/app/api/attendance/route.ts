import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (locationId) where.locationId = locationId
    if (userId) where.userId = userId

    if (startDate || endDate) {
      where.checkInAt = {}
      if (startDate) where.checkInAt.gte = new Date(startDate)
      if (endDate) where.checkInAt.lte = new Date(endDate)
    }

    // Se non è admin/operator, mostra solo le proprie presenze
    const userRole = session.user.role
    if (userRole !== 'ADMIN' && userRole !== 'OPERATOR') {
      where.userId = session.user.id
    }

    const attendances = await prisma.attendance.findMany({
      where,
      orderBy: { checkInAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        location: {
          select: {
            id: true,
            name: true,
            address: true
          }
        },
        activity: {
          select: {
            id: true,
            title: true,
            type: true
          }
        }
      }
    })

    return NextResponse.json(attendances)
  } catch (error) {
    console.error('Error fetching attendances:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const data = await request.json()

    // Verifica che la location esista tramite QR code
    const location = await prisma.location.findUnique({
      where: { qrCode: data.qrCode }
    })

    if (!location) {
      return NextResponse.json({ error: 'QR Code non valido' }, { status: 400 })
    }

    // Verifica se c'è già un check-in aperto
    const openAttendance = await prisma.attendance.findFirst({
      where: {
        userId: session.user.id,
        locationId: location.id,
        checkOutAt: null
      }
    })

    if (openAttendance) {
      // Effettua check-out
      const updated = await prisma.attendance.update({
        where: { id: openAttendance.id },
        data: {
          checkOutAt: new Date(),
          notes: data.notes
        },
        include: {
          location: true
        }
      })

      return NextResponse.json({
        ...updated,
        action: 'checkout',
        message: `Check-out effettuato da ${location.name}`
      })
    } else {
      // Effettua check-in
      const attendance = await prisma.attendance.create({
        data: {
          userId: session.user.id,
          locationId: location.id,
          activityId: data.activityId,
          latitude: data.latitude,
          longitude: data.longitude,
          notes: data.notes
        },
        include: {
          location: true
        }
      })

      return NextResponse.json({
        ...attendance,
        action: 'checkin',
        message: `Check-in effettuato presso ${location.name}`
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating attendance:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
