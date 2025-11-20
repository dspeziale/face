import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const data = await request.json()

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
    }

    // Verify current password
    const isValid = await bcrypt.compare(data.currentPassword, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Password attuale non corretta' }, { status: 400 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10)

    // Update password
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating password:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
