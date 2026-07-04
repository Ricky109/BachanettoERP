import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

async function seed() {
  const hash = await bcrypt.hash('admin123', 10)
  const hekartHash = await bcrypt.hash('adminhekart', 10)
  const gladisHash = await bcrypt.hash('admingladis', 10)

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

  await prisma.gEN_USR.upsert({
    where:  { ID_USR: '11111111' },
    update: {},
    create: {
      ID_USR:    '11111111',
      NOM_USR:   'Admin Hekart',
      EMAIL_USR: 'adminhekart@bachanetto.com',
      PWD_USR:   hekartHash,
      ROL_USR:   'ADMIN',
    },
  })

  await prisma.gEN_USR.upsert({
    where:  { ID_USR: '22222222' },
    update: {},
    create: {
      ID_USR:    '22222222',
      NOM_USR:   'Admin Gladis',
      EMAIL_USR: 'admingladis@bachanetto.com',
      PWD_USR:   gladisHash,
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