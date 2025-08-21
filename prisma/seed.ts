import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  const adminEmail = 'admin@sandalo.com'
  const adminPassword = 'ClubeSandalo2025$$'

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (!existingAdmin) {
      const hashedPassword = await hashPassword(adminPassword)

      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Administrador Sândalo',
          passwordHash: hashedPassword,
          role: 'ADMIN'
        }
      })
    } else {
      console.log('ℹ️ Admin já existe no banco')
    }

  } catch (error) {
    console.error('❌ Erro durante o seed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    console.log('🔌 Conexão com banco fechada')
  })