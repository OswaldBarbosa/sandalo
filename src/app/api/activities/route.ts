import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema de validação para criação de atividade
const createActivitySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  points: z.number().min(1, 'Pontos devem ser pelo menos 1'),
  dueDate: z.union([
    z.string().datetime().optional(),
    z.string().optional(), // Aceita qualquer string
    z.date().optional()
  ]).optional(),
  category: z.string().optional()
})



// GET /api/activities - Listar atividades
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const category = searchParams.get('category') || undefined
    const active = searchParams.get('active') || undefined

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        category ? { category } : {},
        active === 'true' ? {
          OR: [
            { dueDate: null },
            { dueDate: { gte: new Date() } }
          ]
        } : active === 'false' ? {
          dueDate: { lt: new Date() }
        } : {}
      ]
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          points: true,
          dueDate: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              completions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.activity.count({ where })
    ])

    // Adicionar informações de status
    const activitiesWithStatus = activities.map(activity => ({
      ...activity,
      isActive: !activity.dueDate || new Date(activity.dueDate) >= new Date(),
      completionsCount: activity._count.completions
    }))

    return NextResponse.json({
      activities: activitiesWithStatus,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao listar atividades:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/activities - Criar atividade
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createActivitySchema.parse(body)

    // Verificar se o nome já existe
    const existingActivity = await prisma.activity.findFirst({
      where: { name: validatedData.name }
    })

    if (existingActivity) {
      return NextResponse.json(
        { error: 'Atividade com este nome já existe' },
        { status: 400 }
      )
    }

    // Processar a data de vencimento
    let dueDate = null
    if (validatedData.dueDate) {
      try {
        dueDate = new Date(validatedData.dueDate)
        // Verificar se a data é válida
        if (isNaN(dueDate.getTime())) {
          return NextResponse.json(
            { error: 'Data de vencimento inválida' },
            { status: 400 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Data de vencimento inválida' },
          { status: 400 }
        )
      }
    }

    const activity = await prisma.activity.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        points: validatedData.points,
        dueDate: dueDate,
        category: validatedData.category
      },
      select: {
        id: true,
        name: true,
        description: true,
        points: true,
        dueDate: true,
        category: true,
        createdAt: true
      }
    })

    return NextResponse.json(activity, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar atividade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


