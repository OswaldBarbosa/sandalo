import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/ranking - Obter ranking dos usuários
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'all' // 'month', 'year', 'all'
    const limit = parseInt(searchParams.get('limit') || '50')

    let startDate: Date | undefined
    let endDate: Date | undefined

    // Definir período para filtro
    if (period === 'month') {
      const now = new Date()
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (period === 'year') {
      const now = new Date()
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31)
    }

    // Buscar todos os usuários desbravadores
    const users = await prisma.user.findMany({
      where: { role: 'DESBRAVADOR' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    // Calcular pontos para cada usuário
    const usersWithPoints = await Promise.all(
      users.map(async (user) => {
        let activityPoints = 0
        let adjustmentPoints = 0

        if (period === 'all') {
          // Pontos de todas as atividades
          const activityResult = await prisma.userActivity.aggregate({
            where: { userId: user.id },
            _sum: { pointsAwarded: true }
          })
          activityPoints = activityResult._sum.pointsAwarded || 0

          // Pontos de ajustes
          const adjustmentResult = await prisma.pointsAdjustment.aggregate({
            where: { userId: user.id },
            _sum: { points: true }
          })
          adjustmentPoints = adjustmentResult._sum.points || 0
        } else {
          // Pontos do período específico
          if (startDate && endDate) {
            const activityResult = await prisma.userActivity.aggregate({
              where: {
                userId: user.id,
                completedAt: {
                  gte: startDate,
                  lte: endDate
                }
              },
              _sum: { pointsAwarded: true }
            })
            activityPoints = activityResult._sum.pointsAwarded || 0

            const adjustmentResult = await prisma.pointsAdjustment.aggregate({
              where: {
                userId: user.id,
                createdAt: {
                  gte: startDate,
                  lte: endDate
                }
              },
              _sum: { points: true }
            })
            adjustmentPoints = adjustmentResult._sum.points || 0
          }
        }

        const totalPoints = activityPoints + adjustmentPoints

        // Contar atividades concluídas no período
        let activitiesCompleted = 0
        if (period === 'all') {
          const count = await prisma.userActivity.count({
            where: { userId: user.id }
          })
          activitiesCompleted = count
        } else if (startDate && endDate) {
          const count = await prisma.userActivity.count({
            where: {
              userId: user.id,
              completedAt: {
                gte: startDate,
                lte: endDate
              }
            }
          })
          activitiesCompleted = count
        }

        return {
          ...user,
          totalPoints,
          activityPoints,
          adjustmentPoints,
          activitiesCompleted
        }
      })
    )

    // Ordenar por pontos (maior para menor)
    const ranking = usersWithPoints
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, limit)
      .map((user, index) => ({
        ...user,
        position: index + 1
      }))

    // Estatísticas gerais
    const stats = {
      totalUsers: users.length,
      period,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      topPerformer: ranking[0] || null,
      averagePoints: ranking.length > 0
        ? Math.round(ranking.reduce((sum, user) => sum + user.totalPoints, 0) / ranking.length)
        : 0
    }

    console.log('Ranking result:', { ranking: ranking.length, stats })

    return NextResponse.json({
      ranking,
      stats
    })
  } catch (error) {
    console.error('Erro ao obter ranking:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}