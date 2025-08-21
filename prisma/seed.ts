import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')
  
  const adminEmail = 'admin@sandalo.com'
  const adminPassword = 'admin123'

  try {
    // Verificar se o admin já existe
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail }
    })

    if (!existingAdmin) {
      console.log('👤 Criando conta de administrador...')
      const hashedPassword = await hashPassword(adminPassword)

      const admin = await prisma.user.create({
        data: {
          email: adminEmail,
          name: 'Administrador Sândalo',
          passwordHash: hashedPassword,
          role: 'ADMIN'
        }
      })
      
      console.log('✅ Admin criado com sucesso!')
      console.log(`📧 Email: ${adminEmail}`)
      console.log(`🔑 Senha: ${adminPassword}`)
      console.log(`🆔 ID: ${admin.id}`)
    } else {
      console.log('ℹ️ Admin já existe no banco')
    }

    // Criar algumas atividades de exemplo
    console.log('📝 Criando atividades de exemplo...')
    
    const activities = [
      {
        name: 'Leitura Bíblica Diária',
        description: 'Ler pelo menos um capítulo da Bíblia por dia',
        points: 10,
        category: 'Espiritual'
      },
      {
        name: 'Exercício Físico',
        description: 'Praticar atividade física por 30 minutos',
        points: 15,
        category: 'Saúde'
      },
      {
        name: 'Estudo Escolar',
        description: 'Dedicar tempo para estudos escolares',
        points: 20,
        category: 'Educação'
      }
    ]

    for (const activity of activities) {
      const existing = await prisma.activity.findFirst({
        where: { name: activity.name }
      })
      
      if (!existing) {
        await prisma.activity.create({
          data: activity
        })
        console.log(`✅ Atividade criada: ${activity.name}`)
      }
    }

    console.log('🎉 Seed concluído com sucesso!')
    
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