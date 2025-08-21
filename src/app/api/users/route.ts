import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { hashPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Schema de validação para criação de usuário
const createUserSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  role: z.enum(['ADMIN', 'DESBRAVADOR']).default('DESBRAVADOR')
})



// GET /api/users - Listar usuários
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.role) {
      const retrySession = await getServerSession(authOptions)

      if (!retrySession?.user?.role) {
        return NextResponse.json({ error: 'Sessão inválida - role não encontrado' }, { status: 401 })
      }
    }

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || undefined

    const skip = (page - 1) * limit

    const where = {
      AND: [
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        role ? { role: role as 'ADMIN' | 'DESBRAVADOR' } : {}
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              activities: true,
              adjustments: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where })
    ])

    // Calcular pontos totais para cada usuário
    const usersWithPoints = await Promise.all(
      users.map(async (user) => {
        const [activityPoints, adjustmentPoints] = await Promise.all([
          prisma.userActivity.aggregate({
            where: { userId: user.id },
            _sum: { pointsAwarded: true }
          }),
          prisma.pointsAdjustment.aggregate({
            where: { userId: user.id },
            _sum: { points: true }
          })
        ])

        const totalPoints = (activityPoints._sum.pointsAwarded || 0) + (adjustmentPoints._sum.points || 0)

        return {
          ...user,
          totalPoints,
          activitiesCompleted: user._count.activities,
          adjustmentsCount: user._count.adjustments
        }
      })
    )

    return NextResponse.json({
      users: usersWithPoints,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/users - Criar usuário
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Verificar se a sessão tem o campo role
    if (!session?.user?.role) {
      const retrySession = await getServerSession(authOptions)

      if (!retrySession?.user?.role) {
        return NextResponse.json({ error: 'Sessão inválida - role não encontrado' }, { status: 401 })
      }
    }

    if (!session || !session.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Verificar se o email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email já cadastrado' },
        { status: 400 }
      )
    }

    // Hash da senha
    const hashedPassword = await hashPassword(validatedData.password)

    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash: hashedPassword,
        role: validatedData.role
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}


