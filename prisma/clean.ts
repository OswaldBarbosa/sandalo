import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function cleanDatabase() {
    console.log('🧹 Iniciando limpeza do banco de dados...')

    try {
        // Limpar dados em ordem (respeitando as foreign keys)
        console.log('🗑️ Limpando UserActivity...')
        await prisma.userActivity.deleteMany({})

        console.log('🗑️ Limpando PointsAdjustment...')
        await prisma.pointsAdjustment.deleteMany({})

        console.log('🗑️ Limpando Activity...')
        await prisma.activity.deleteMany({})

        console.log('🗑️ Limpando Session...')
        await prisma.session.deleteMany({})

        console.log('🗑️ Limpando Account...')
        await prisma.account.deleteMany({})

        console.log('🗑️ Limpando VerificationToken...')
        await prisma.verificationToken.deleteMany({})

        console.log('🗑️ Limpando User...')
        await prisma.user.deleteMany({})

        console.log('✅ Banco de dados limpo com sucesso!')
        console.log('📝 Todas as tabelas estão vazias e prontas para novos dados')

    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error)
        throw error
    }
}

cleanDatabase()
    .catch((e) => {
        console.error('❌ Erro durante a limpeza:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
        console.log('🔌 Conexão com banco fechada')
    })
