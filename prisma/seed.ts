import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Crea utenti di esempio
  const adminPassword = await hash('admin123', 12)
  const userPassword = await hash('user123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bbmanagement.it' },
    update: {},
    create: {
      email: 'admin@bbmanagement.it',
      password: adminPassword,
      name: 'Amministratore',
      role: 'ADMIN',
      phone: '+39 333 1234567'
    }
  })

  const operator = await prisma.user.upsert({
    where: { email: 'operatore@bbmanagement.it' },
    update: {},
    create: {
      email: 'operatore@bbmanagement.it',
      password: userPassword,
      name: 'Mario Rossi',
      role: 'OPERATOR',
      phone: '+39 333 2345678'
    }
  })

  const worker = await prisma.user.upsert({
    where: { email: 'operaio@bbmanagement.it' },
    update: {},
    create: {
      email: 'operaio@bbmanagement.it',
      password: userPassword,
      name: 'Giuseppe Verdi',
      role: 'WORKER',
      phone: '+39 333 3456789'
    }
  })

  const housekeeper = await prisma.user.upsert({
    where: { email: 'cameriera@bbmanagement.it' },
    update: {},
    create: {
      email: 'cameriera@bbmanagement.it',
      password: userPassword,
      name: 'Anna Bianchi',
      role: 'HOUSEKEEPER',
      phone: '+39 333 4567890'
    }
  })

  console.log('Users created:', { admin, operator, worker, housekeeper })

  // Crea location di esempio
  const location1 = await prisma.location.upsert({
    where: { qrCode: 'LOC-001-CENTRO' },
    update: {},
    create: {
      name: 'B&B Centro Storico',
      address: 'Via Roma, 123',
      city: 'Milano',
      postalCode: '20121',
      phone: '+39 02 1234567',
      email: 'centro@bbmanagement.it',
      description: 'Appartamento nel cuore del centro storico',
      capacity: 4,
      rooms: 2,
      bathrooms: 1,
      hasWifi: true,
      hasParking: false,
      hasAC: true,
      qrCode: 'LOC-001-CENTRO'
    }
  })

  const location2 = await prisma.location.upsert({
    where: { qrCode: 'LOC-002-MARE' },
    update: {},
    create: {
      name: 'B&B Vista Mare',
      address: 'Lungomare Colombo, 45',
      city: 'Genova',
      postalCode: '16121',
      phone: '+39 010 2345678',
      email: 'mare@bbmanagement.it',
      description: 'Splendida vista sul mare',
      capacity: 6,
      rooms: 3,
      bathrooms: 2,
      hasWifi: true,
      hasParking: true,
      hasAC: true,
      qrCode: 'LOC-002-MARE'
    }
  })

  const location3 = await prisma.location.upsert({
    where: { qrCode: 'LOC-003-COLLINA' },
    update: {},
    create: {
      name: 'B&B Collina Verde',
      address: 'Via delle Colline, 78',
      city: 'Firenze',
      postalCode: '50125',
      phone: '+39 055 3456789',
      email: 'collina@bbmanagement.it',
      description: 'Immerso nel verde delle colline toscane',
      capacity: 8,
      rooms: 4,
      bathrooms: 2,
      hasWifi: true,
      hasParking: true,
      hasAC: false,
      qrCode: 'LOC-003-COLLINA'
    }
  })

  console.log('Locations created:', { location1, location2, location3 })

  // Crea attività di esempio
  const activities = await Promise.all([
    prisma.activity.create({
      data: {
        title: 'Riparazione rubinetto bagno',
        description: 'Il rubinetto del bagno principale perde acqua',
        type: 'MAINTENANCE',
        priority: 'HIGH',
        status: 'PENDING',
        locationId: location1.id,
        createdById: admin.id,
        assignedToId: worker.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      }
    }),
    prisma.activity.create({
      data: {
        title: 'Cambio biancheria completo',
        description: 'Cambio lenzuola, asciugamani e tovaglie',
        type: 'LAUNDRY',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        locationId: location2.id,
        createdById: operator.id,
        assignedToId: housekeeper.id,
        startedAt: new Date(),
      }
    }),
    prisma.activity.create({
      data: {
        title: 'Pulizia profonda appartamento',
        description: 'Pulizia completa dopo check-out',
        type: 'CLEANING',
        priority: 'HIGH',
        status: 'PENDING',
        locationId: location1.id,
        createdById: admin.id,
        assignedToId: housekeeper.id,
        scheduledAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      }
    }),
    prisma.activity.create({
      data: {
        title: 'Allagamento bagno - URGENTE',
        description: 'Tubo rotto sotto il lavandino',
        type: 'EMERGENCY',
        priority: 'URGENT',
        status: 'COMPLETED',
        locationId: location3.id,
        createdById: operator.id,
        assignedToId: worker.id,
        startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        completedAt: new Date(),
        cost: 150.00,
      }
    }),
  ])

  console.log('Activities created:', activities.length)

  // Crea template attività
  const templates = await Promise.all([
    prisma.activityTemplate.create({
      data: {
        name: 'Pulizia Standard Cameriera',
        description: 'Flow di pulizia standard per cameriera',
        type: 'CLEANING',
        role: 'HOUSEKEEPER',
        isDefault: true,
        steps: {
          create: [
            { title: 'Arieggiare le stanze', order: 1, isRequired: true },
            { title: 'Rifare i letti', order: 2, isRequired: true },
            { title: 'Pulire i bagni', order: 3, isRequired: true },
            { title: 'Aspirare pavimenti', order: 4, isRequired: true },
            { title: 'Lavare pavimenti', order: 5, isRequired: true },
            { title: 'Controllare forniture', order: 6, isRequired: false },
            { title: 'Foto finale appartamento', order: 7, isRequired: true },
          ]
        }
      }
    }),
    prisma.activityTemplate.create({
      data: {
        name: 'Manutenzione Idraulica',
        description: 'Flow per interventi idraulici',
        type: 'MAINTENANCE',
        role: 'WORKER',
        isDefault: true,
        steps: {
          create: [
            { title: 'Ispezione problema', order: 1, isRequired: true },
            { title: 'Chiudere acqua', order: 2, isRequired: true },
            { title: 'Riparazione', order: 3, isRequired: true },
            { title: 'Test funzionamento', order: 4, isRequired: true },
            { title: 'Pulizia area lavoro', order: 5, isRequired: true },
            { title: 'Documentazione costi', order: 6, isRequired: true },
          ]
        }
      }
    }),
  ])

  console.log('Templates created:', templates.length)

  // Crea inventario per le location
  const inventoryItems = await Promise.all([
    prisma.inventory.create({
      data: {
        name: 'Lenzuola matrimoniali',
        category: 'biancheria',
        quantity: 10,
        minQuantity: 4,
        unit: 'set',
        locationId: location1.id
      }
    }),
    prisma.inventory.create({
      data: {
        name: 'Asciugamani grandi',
        category: 'biancheria',
        quantity: 20,
        minQuantity: 8,
        unit: 'pz',
        locationId: location1.id
      }
    }),
    prisma.inventory.create({
      data: {
        name: 'Sapone liquido',
        category: 'prodotti pulizia',
        quantity: 5,
        minQuantity: 2,
        unit: 'lt',
        locationId: location2.id
      }
    }),
  ])

  console.log('Inventory items created:', inventoryItems.length)

  console.log('Seeding completed!')
  console.log('\nCredenziali di accesso:')
  console.log('Admin: admin@bbmanagement.it / admin123')
  console.log('Operatore: operatore@bbmanagement.it / user123')
  console.log('Operaio: operaio@bbmanagement.it / user123')
  console.log('Cameriera: cameriera@bbmanagement.it / user123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
