import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

async function seed() {
  const hash = await bcrypt.hash('admin123', 10)

  await prisma.gEN_USR.upsert({
    where:  { ID_USR: '00000001' },
    update: {},
    create: {
      ID_USR:    '00000001',
      NOM_USR:   'Administrador',
      EMAIL_USR: 'admin@bachanetto.com',
      PWD_USR:   hash,
      ROL_USR:   'ADMIN',
    },
  })

  console.log('✅ Usuario admin creado')
  console.log('   Email:      admin@bachanetto.com')
  console.log('   Contraseña: admin123')
  console.log('   DNI:        00000001')
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect())