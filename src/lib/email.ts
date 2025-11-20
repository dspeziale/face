import nodemailer from 'nodemailer'

// Create reusable transporter object using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
  },
})

interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  try {
    const mailOptions = {
      from: `"B&B Management" <${process.env.GMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      text,
      html,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('Error sending email:', error)
    return { success: false, error }
  }
}

// Email templates
export function activityAssignedEmail(activityTitle: string, userName: string) {
  return {
    subject: `Nuova attività assegnata: ${activityTitle}`,
    html: `
      <h2>Nuova attività assegnata</h2>
      <p>Ciao ${userName},</p>
      <p>Ti è stata assegnata una nuova attività: <strong>${activityTitle}</strong></p>
      <p>Accedi all'applicazione per vedere i dettagli.</p>
      <br>
      <p>B&B Management</p>
    `,
  }
}

export function activityCompletedEmail(activityTitle: string, completedBy: string) {
  return {
    subject: `Attività completata: ${activityTitle}`,
    html: `
      <h2>Attività completata</h2>
      <p>L'attività <strong>${activityTitle}</strong> è stata completata da ${completedBy}.</p>
      <br>
      <p>B&B Management</p>
    `,
  }
}

export function deadlineReminderEmail(activityTitle: string, dueDate: Date, userName: string) {
  const formattedDate = dueDate.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return {
    subject: `Promemoria scadenza: ${activityTitle}`,
    html: `
      <h2>Promemoria scadenza attività</h2>
      <p>Ciao ${userName},</p>
      <p>L'attività <strong>${activityTitle}</strong> ha una scadenza imminente:</p>
      <p><strong>${formattedDate}</strong></p>
      <p>Accedi all'applicazione per completare l'attività.</p>
      <br>
      <p>B&B Management</p>
    `,
  }
}

export function welcomeEmail(userName: string, email: string, tempPassword?: string) {
  return {
    subject: `Benvenuto in B&B Management`,
    html: `
      <h2>Benvenuto in B&B Management</h2>
      <p>Ciao ${userName},</p>
      <p>Il tuo account è stato creato con successo.</p>
      <p><strong>Email:</strong> ${email}</p>
      ${tempPassword ? `<p><strong>Password temporanea:</strong> ${tempPassword}</p>` : ''}
      <p>Accedi all'applicazione e modifica la tua password.</p>
      <br>
      <p>B&B Management</p>
    `,
  }
}
