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

    const activity = await prisma.activity.findUnique({
      where: { id: params.id },
      include: {
        location: true,
        assignedTo: true,
        createdBy: true,
        checklistItems: {
          orderBy: { order: 'asc' }
        },
        attendances: {
          include: {
            user: true
          },
          orderBy: { checkInAt: 'desc' }
        }
      }
    })

    if (!activity) {
      return NextResponse.json({ error: 'Attività non trovata' }, { status: 404 })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error fetching activity:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const data = await request.json()

    // Determina se stiamo aggiornando lo stato
    const currentActivity = await prisma.activity.findUnique({
      where: { id: params.id }
    })

    if (!currentActivity) {
      return NextResponse.json({ error: 'Attività non trovata' }, { status: 404 })
    }

    // Aggiorna timestamp basati sullo stato
    let startedAt = currentActivity.startedAt
    let completedAt = currentActivity.completedAt

    if (data.status === 'IN_PROGRESS' && !startedAt) {
      startedAt = new Date()
    }

    if (data.status === 'COMPLETED' && !completedAt) {
      completedAt = new Date()
    }

    const activity = await prisma.activity.update({
      where: { id: params.id },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        priority: data.priority,
        status: data.status,
        assignedToId: data.assignedToId,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: data.notes,
        cost: data.cost,
        startedAt,
        completedAt,
      },
      include: {
        location: true,
        assignedTo: true,
        checklistItems: true
      }
    })

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error updating activity:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'OPERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    await prisma.activity.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
