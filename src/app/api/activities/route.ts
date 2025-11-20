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
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const locationId = searchParams.get('locationId')
    const assignedToId = searchParams.get('assignedToId')

    const userRole = session.user.role
    const userId = session.user.id

    // Filtri base
    const where: any = {}

    if (status) where.status = status
    if (type) where.type = type
    if (locationId) where.locationId = locationId
    if (assignedToId) where.assignedToId = assignedToId

    // Se non è admin/operator, mostra solo le proprie attività
    if (userRole !== 'ADMIN' && userRole !== 'OPERATOR') {
      where.assignedToId = userId
    }

    const activities = await prisma.activity.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      include: {
        location: true,
        assignedTo: true,
        createdBy: true,
        checklistItems: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activities:', error)
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

    const activity = await prisma.activity.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority || 'MEDIUM',
        status: 'PENDING',
        locationId: data.locationId,
        assignedToId: data.assignedToId,
        createdById: session.user.id,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        checklistItems: data.checklistItems ? {
          create: data.checklistItems.map((item: string, index: number) => ({
            text: item,
            order: index
          }))
        } : undefined
      },
      include: {
        location: true,
        assignedTo: true,
        checklistItems: true
      }
    })

    // Crea notifica per l'utente assegnato
    if (data.assignedToId) {
      await prisma.notification.create({
        data: {
          title: 'Nuova attività assegnata',
          message: `Ti è stata assegnata l'attività: ${data.title}`,
          type: 'info',
          userId: data.assignedToId,
          link: `/activities/${activity.id}`
        }
      })
    }

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
