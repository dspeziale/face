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

    // Send notifications on status change
    if (data.status && data.status !== currentActivity.status) {
      const statusLabels: Record<string, string> = {
        PENDING: 'In attesa',
        IN_PROGRESS: 'In corso',
        COMPLETED: 'Completata',
        CANCELLED: 'Annullata'
      }

      // Notify assigned user about status change
      if (activity.assignedToId && activity.assignedToId !== session.user.id) {
        await prisma.notification.create({
          data: {
            title: `Attività ${statusLabels[data.status]}`,
            message: `L'attività "${activity.title}" è stata aggiornata a: ${statusLabels[data.status]}`,
            type: data.status === 'COMPLETED' ? 'success' : 'info',
            userId: activity.assignedToId,
            link: `/activities/${activity.id}`
          }
        })
      }

      // Notify creator when activity is completed (if different from who completed it)
      if (data.status === 'COMPLETED' && currentActivity.createdById !== session.user.id) {
        await prisma.notification.create({
          data: {
            title: 'Attività completata',
            message: `L'attività "${activity.title}" è stata completata`,
            type: 'success',
            userId: currentActivity.createdById,
            link: `/activities/${activity.id}`
          }
        })
      }
    }

    // Notify if assignment changed
    if (data.assignedToId && data.assignedToId !== currentActivity.assignedToId) {
      await prisma.notification.create({
        data: {
          title: 'Nuova attività assegnata',
          message: `Ti è stata assegnata l'attività: ${activity.title}`,
          type: 'info',
          userId: data.assignedToId,
          link: `/activities/${activity.id}`
        }
      })
    }

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

    // Use a transaction to delete related records first
    await prisma.$transaction(async (tx) => {
      // Delete checklist items
      await tx.checklistItem.deleteMany({
        where: { activityId: params.id }
      })

      // Delete attendances related to this activity
      await tx.attendance.deleteMany({
        where: { activityId: params.id }
      })

      // Delete the activity
      await tx.activity.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting activity:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
