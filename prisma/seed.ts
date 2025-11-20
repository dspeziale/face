import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create admin user
  const hashedPassword = await hash('admin123', 12)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Amministratore',
      role: 'ADMIN',
      isActive: true
    }
  })

  console.log('Admin user created:', admin.email)

  // Create default services
  const services = [
    { name: 'WiFi', icon: 'FaWifi' },
    { name: 'Parcheggio', icon: 'FaParking' },
    { name: 'Aria Condizionata', icon: 'FaSnowflake' },
    { name: 'Riscaldamento', icon: 'FaFire' },
    { name: 'TV', icon: 'FaTv' },
    { name: 'Cucina', icon: 'FaUtensils' },
    { name: 'Lavatrice', icon: 'FaTshirt' },
    { name: 'Asciugatrice', icon: 'FaWind' },
    { name: 'Ferro da stiro', icon: 'FaTemperatureHigh' },
    { name: 'Piscina', icon: 'FaSwimmingPool' },
    { name: 'Giardino', icon: 'FaTree' },
    { name: 'Terrazzo', icon: 'FaSun' },
    { name: 'Vista mare', icon: 'FaWater' },
    { name: 'Animali ammessi', icon: 'FaDog' },
    { name: 'Colazione inclusa', icon: 'FaCoffee' },
    { name: 'Cassaforte', icon: 'FaLock' },
    { name: 'Ascensore', icon: 'FaArrowUp' },
    { name: 'Accessibile', icon: 'FaWheelchair' }
  ]

  for (const service of services) {
    await prisma.service.upsert({
      where: { name: service.name },
      update: { icon: service.icon },
      create: service
    })
  }

  console.log('Services created:', services.length)

  console.log('\nSeeding completed!')
  console.log('\nCredenziali di accesso:')
  console.log('Admin: admin@example.com / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
