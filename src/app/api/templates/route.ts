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

    const templates = await prisma.activityTemplate.findMany({
      orderBy: [
        { role: 'asc' },
        { type: 'asc' },
        { name: 'asc' }
      ],
      include: {
        steps: {
          orderBy: { order: 'asc' }
        }
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching templates:', error)
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

    // Se è default, rimuovi il flag dagli altri template dello stesso tipo/ruolo
    if (data.isDefault) {
      await prisma.activityTemplate.updateMany({
        where: {
          type: data.type,
          role: data.role,
          isDefault: true
        },
        data: { isDefault: false }
      })
    }

    const template = await prisma.activityTemplate.create({
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

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Error creating template:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
