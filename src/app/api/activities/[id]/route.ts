import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Schema de validação para atualização de atividade
const updateActivitySchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  description: z.string().optional(),
  points: z.number().min(1, 'Pontos devem ser pelo menos 1').optional(),
  dueDate: z.union([
    z.string().datetime().optional(),
    z.string().optional(),
    z.date().optional()
  ]).optional(),
  category: z.string().optional()
})

// PUT /api/activities/[id] - Atualizar atividade
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: activityId } = params

    if (!activityId) {
      return NextResponse.json({ error: 'ID da atividade não fornecido' }, { status: 400 })
    }

    const body = await request.json()
    const validatedData = updateActivitySchema.parse(body)

    // Verificar se a atividade existe
    const existingActivity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!existingActivity) {
      return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })
    }

    // Verificar se o nome já existe (se estiver sendo alterado)
    if (validatedData.name && validatedData.name !== existingActivity.name) {
      const nameExists = await prisma.activity.findFirst({
        where: { name: validatedData.name }
      })

      if (nameExists) {
        return NextResponse.json(
          { error: 'Atividade com este nome já existe' },
          { status: 400 }
        )
      }
    }

    // Processar a data de vencimento
    let dueDate = existingActivity.dueDate
    if (validatedData.dueDate !== undefined) {
      if (validatedData.dueDate) {
        try {
          dueDate = new Date(validatedData.dueDate)
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
      } else {
        dueDate = null
      }
    }

    const updatedActivity = await prisma.activity.update({
      where: { id: activityId },
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
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedActivity)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Erro ao atualizar atividade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE /api/activities/[id] - Excluir atividade
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { id: activityId } = params

    if (!activityId) {
      return NextResponse.json({ error: 'ID da atividade não fornecido' }, { status: 400 })
    }

    // Verificar se a atividade existe
    const existingActivity = await prisma.activity.findUnique({
      where: { id: activityId }
    })

    if (!existingActivity) {
      return NextResponse.json({ error: 'Atividade não encontrada' }, { status: 404 })
    }

    // Excluir atividade
    await prisma.activity.delete({
      where: { id: activityId }
    })

    return NextResponse.json({ message: 'Atividade excluída com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir atividade:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
