import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'OPERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const where: any = {}

    if (locationId) where.locationId = locationId

    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        where.createdAt.lte = end
      }
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        location: {
          select: {
            name: true,
            address: true,
            city: true
          }
        },
        assignedTo: {
          select: {
            name: true,
            role: true
          }
        },
        createdBy: {
          select: {
            name: true
          }
        },
        attendances: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    })

    // Raggruppa per location
    const grouped = activities.reduce((acc, activity) => {
      const locationName = activity.location.name
      if (!acc[locationName]) {
        acc[locationName] = {
          location: activity.location,
          activities: []
        }
      }
      acc[locationName].activities.push(activity)
      return acc
    }, {} as Record<string, any>)

    return NextResponse.json({
      activities,
      grouped,
      summary: {
        total: activities.length,
        completed: activities.filter(a => a.status === 'COMPLETED').length,
        pending: activities.filter(a => a.status === 'PENDING').length,
        inProgress: activities.filter(a => a.status === 'IN_PROGRESS').length,
        byType: {
          MAINTENANCE: activities.filter(a => a.type === 'MAINTENANCE').length,
          LAUNDRY: activities.filter(a => a.type === 'LAUNDRY').length,
          CLEANING: activities.filter(a => a.type === 'CLEANING').length,
          EMERGENCY: activities.filter(a => a.type === 'EMERGENCY').length,
          OTHER: activities.filter(a => a.type === 'OTHER' || a.type === 'INSPECTION').length,
        }
      }
    })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
