import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação para criação de conclusão
const createCompletionSchema = z.object({
  userId: z.string().min(1, 'ID do usuário é obrigatório'),
  activityId: z.string().min(1, 'ID da atividade é obrigatório'),
  pointsAwarded: z.number().min(1, 'Pontos devem ser pelo menos 1'),
  note: z.string().optional()
})

// GET /api/completions - Listar conclusões
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const userId = searchParams.get('userId') || undefined
    const activityId = searchParams.get('activityId') || undefined
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined

    const skip = (page - 1) * limit

    const where: {
      userId?: string
      activityId?: string
      completedAt?: {
        gte?: Date
        lte?: Date
      }
    } = {}

    if (userId) {
      where.userId = userId
    }
    if (activityId) {
      where.activityId = activityId
    }
    if (startDate) {
      where.completedAt = { ...where.completedAt, gte: new Date(startDate) }
    }
    if (endDate) {
      where.completedAt = { ...where.completedAt, lte: new Date(endDate) }
    }

    const [completions, total] = await Promise.all([
      prisma.userActivity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          activity: {
            select: {
              id: true,
              name: true,
              points: true,
              category: true
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.userActivity.count({ where })
    ])

    console.log('Completions query result:', { where, completions: completions.length, total })

    return NextResponse.json({
      completions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao listar conclusões:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/completions - Registrar conclusão
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createCompletionSchema.parse(body)

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: validatedData.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a atividade existe
    const activity = await prisma.activity.findUnique({
      where: { id: validatedData.activityId }
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      )
    }

    // Verificar se já existe uma conclusão para esta atividade por este usuário
    const existingCompletion = await prisma.userActivity.findFirst({
      where: {
        userId: validatedData.userId,
        activityId: validatedData.activityId
      }
    })

    if (existingCompletion) {
      return NextResponse.json(
        { error: 'Usuário já concluiu esta atividade' },
        { status: 400 }
      )
    }

    // Criar a conclusão
    const completion = await prisma.userActivity.create({
      data: {
        userId: validatedData.userId,
        activityId: validatedData.activityId,
        pointsAwarded: validatedData.pointsAwarded,
        note: validatedData.note
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        activity: {
          select: {
            id: true,
            name: true,
            points: true
          }
        }
      }
    })

    return NextResponse.json(completion, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao registrar conclusão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
