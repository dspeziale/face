import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const location = await prisma.location.findUnique({
      where: { id: params.id },
      include: {
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            assignedTo: true
          }
        },
        inventories: true,
        attendances: {
          orderBy: { checkInAt: 'desc' },
          take: 10,
          include: {
            user: true
          }
        }
      }
    })

    if (!location) {
      return NextResponse.json({ error: 'Location non trovata' }, { status: 404 })
    }

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'OPERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const data = await request.json()

    const location = await prisma.location.update({
      where: { id: params.id },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        phone: data.phone,
        email: data.email,
        description: data.description,
        capacity: data.capacity,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        hasWifi: data.hasWifi,
        hasParking: data.hasParking,
        hasAC: data.hasAC,
        notes: data.notes,
        isActive: data.isActive,
      }
    })

    return NextResponse.json(location)
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    // Use a transaction to delete all related records first
    await prisma.$transaction(async (tx) => {
      // Delete related inventories
      await tx.inventory.deleteMany({
        where: { locationId: params.id }
      })

      // Delete related attendances
      await tx.attendance.deleteMany({
        where: { locationId: params.id }
      })

      // Get all activities for this location to delete their checklist items
      const activities = await tx.activity.findMany({
        where: { locationId: params.id },
        select: { id: true }
      })

      // Delete checklist items for each activity
      if (activities.length > 0) {
        await tx.checklistItem.deleteMany({
          where: {
            activityId: { in: activities.map(a => a.id) }
          }
        })
      }

      // Delete related activities
      await tx.activity.deleteMany({
        where: { locationId: params.id }
      })

      // Finally delete the location
      await tx.location.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
