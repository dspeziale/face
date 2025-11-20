import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { hash } from 'bcryptjs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const data = await request.json()

    const updateData: any = {}

    if (data.name !== undefined) updateData.name = data.name
    if (data.email !== undefined) updateData.email = data.email
    if (data.phone !== undefined) updateData.phone = data.phone
    if (data.role !== undefined) updateData.role = data.role
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    if (data.password) {
      updateData.password = await hash(data.password, 12)
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
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

    // Non permettere l'eliminazione di se stessi
    if (params.id === session.user.id) {
      return NextResponse.json({ error: 'Non puoi eliminare te stesso' }, { status: 400 })
    }

    // Use a transaction to delete all related records first
    await prisma.$transaction(async (tx) => {
      // Delete notifications
      await tx.notification.deleteMany({
        where: { userId: params.id }
      })

      // Delete attendances
      await tx.attendance.deleteMany({
        where: { userId: params.id }
      })

      // Get activities created by this user
      const createdActivities = await tx.activity.findMany({
        where: { createdById: params.id },
        select: { id: true }
      })

      // Delete checklist items for created activities
      if (createdActivities.length > 0) {
        await tx.checklistItem.deleteMany({
          where: { activityId: { in: createdActivities.map(a => a.id) } }
        })
      }

      // Delete activities created by this user
      await tx.activity.deleteMany({
        where: { createdById: params.id }
      })

      // Unassign activities assigned to this user (don't delete them)
      await tx.activity.updateMany({
        where: { assignedToId: params.id },
        data: { assignedToId: null }
      })

      // Finally delete the user
      await tx.user.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
