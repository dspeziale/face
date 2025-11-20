import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'OPERATOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 })
    }

    const data = await request.json()

    if (!data.to || !data.subject) {
      return NextResponse.json({ error: 'Destinatario e oggetto sono obbligatori' }, { status: 400 })
    }

    const result = await sendEmail({
      to: data.to,
      subject: data.subject,
      text: data.text,
      html: data.html
    })

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    } else {
      return NextResponse.json({ error: 'Errore nell\'invio email' }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending email:', error)
    return NextResponse.json({ error: 'Errore del server' }, { status: 500 })
  }
}
