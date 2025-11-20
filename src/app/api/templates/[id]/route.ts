import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

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

    // If setting as default, remove default from others
    if (data.isDefault) {
      await prisma.activityTemplate.updateMany({
        where: {
          type: data.type,
          role: data.role,
          isDefault: true,
          NOT: { id: params.id }
        },
        data: { isDefault: false }
      })
    }

    // Update template and recreate steps
    const template = await prisma.$transaction(async (tx) => {
      // Delete existing steps
      await tx.templateStep.deleteMany({
        where: { templateId: params.id }
      })

      // Update template with new steps
      return tx.activityTemplate.update({
        where: { id: params.id },
        data: {
          name: data.name,
          description: data.description,
          type: data.type,
          role: data.role,
          isDefault: data.isDefault || false,
          steps: {
            create: data.steps.map((step: any, index: number) => ({
              title: step.title,
              description: step.description,
              order: index,
              isRequired: step.isRequired !== false
            }))
          }
        },
        include: {
          steps: {
            orderBy: { order: 'asc' }
          }
        }
      })
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating template:', error)
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

    await prisma.activityTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting template:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
