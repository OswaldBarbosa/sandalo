import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import * as XLSX from 'xlsx'

// GET /api/export - Exportar dados via query params
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'excel' // 'excel' ou 'pdf'
    const dataType = searchParams.get('dataType') || 'ranking' // 'ranking', 'users', 'activities'
    const period = searchParams.get('period') || 'all'

    if (type === 'excel') {
      return await exportToExcel(dataType, period)
    } else if (type === 'pdf') {
      return await exportToPDF(dataType, period)
    } else {
      return NextResponse.json(
        { error: 'Tipo de exportação não suportado' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro na exportação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST /api/export - Exportar dados via body
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { type, format, data } = body

    if (format === 'pdf') {
      return await exportDataToPDF(type, data)
    } else {
      return NextResponse.json(
        { error: 'Formato não suportado' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Erro na exportação:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

async function exportToExcel(dataType: string, period: string) {
  try {
    let data: Record<string, string | number | null>[] = []
    let filename = ''

    if (dataType === 'ranking') {
      const rankingData = await getRankingData(period)
      data = rankingData.ranking.map(user => ({
        'Posição': user.position,
        'Nome': user.name,
        'Email': user.email,
        'Pontos Totais': user.totalPoints,
        'Pontos de Atividades': user.activityPoints,
        'Pontos de Ajustes': user.adjustmentPoints,
        'Atividades Concluídas': user.activitiesCompleted,
        'Membro desde': new Date(user.createdAt).toLocaleDateString('pt-BR')
      }))
      filename = `ranking_${period}_${new Date().toISOString().split('T')[0]}.xlsx`
    } else if (dataType === 'users') {
      const users = await prisma.user.findMany({
        where: { role: 'DESBRAVADOR' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      })

      data = users.map(user => ({
        'ID': user.id,
        'Nome': user.name,
        'Email': user.email,
        'Tipo': user.role,
        'Membro desde': new Date(user.createdAt).toLocaleDateString('pt-BR')
      }))
      filename = `usuarios_${new Date().toISOString().split('T')[0]}.xlsx`
    } else if (dataType === 'activities') {
      const activities = await prisma.activity.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          points: true,
          category: true,
          dueDate: true,
          createdAt: true,
          _count: {
            select: {
              completions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      data = activities.map(activity => ({
        'ID': activity.id,
        'Nome': activity.name,
        'Descrição': activity.description || '',
        'Pontos': activity.points,
        'Categoria': activity.category || '',
        'Prazo': activity.dueDate ? new Date(activity.dueDate).toLocaleDateString('pt-BR') : 'Sem prazo',
        'Conclusões': activity._count.completions,
        'Criada em': new Date(activity.createdAt).toLocaleDateString('pt-BR')
      }))
      filename = `atividades_${new Date().toISOString().split('T')[0]}.xlsx`
    }

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(data)

    // Ajustar largura das colunas
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }))
    worksheet['!cols'] = colWidths

    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados')

    // Gerar buffer do Excel
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' })

    // Retornar arquivo Excel
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error)
    throw error
  }
}

async function exportToPDF(dataType: string, period: string) {
  // Por enquanto, retornar erro para PDF (será implementado depois)
  return NextResponse.json(
    { error: 'Exportação para PDF será implementada em breve' },
    { status: 501 }
  )
}

async function exportDataToPDF(type: string, data: Record<string, string | number | null>[]) {
  try {
    const doc = new PDFDocument()
    const chunks: Buffer[] = []

    // Coletar chunks de dados
    doc.on('data', (chunk) => chunks.push(chunk))

    // Configurar o documento
    doc.fontSize(20).text('Relatório Sândalo', { align: 'center' })
    doc.moveDown()
    doc.fontSize(14).text(`Tipo: ${type}`, { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, { align: 'center' })
    doc.moveDown(2)

    if (data.length > 0) {
      // Obter cabeçalhos das colunas
      const headers = Object.keys(data[0])

      // Definir larguras das colunas baseadas no conteúdo
      const columnWidths = headers.map(header => {
        const maxLength = Math.max(
          header.length,
          ...data.map(row => (row[header]?.toString() || '').length)
        )
        return Math.max(80, maxLength * 6) // 6px por caractere
      })

      const startX = 50
      let currentY = doc.y

      // Desenhar cabeçalhos
      headers.forEach((header, index) => {
        const x = startX + headers.slice(0, index).reduce((sum, _, i) => sum + columnWidths[i], 0)
        doc.fontSize(10).font('Helvetica-Bold')
          .text(header, x, currentY, { width: columnWidths[index] })
      })

      currentY += 20

      // Desenhar dados
      data.forEach((row) => {
        if (currentY > 700) { // Nova página se necessário
          doc.addPage()
          currentY = 50
        }

        headers.forEach((header, index) => {
          const x = startX + headers.slice(0, index).reduce((sum, _, i) => sum + columnWidths[i], 0)
          const value = row[header]?.toString() || ''
          doc.fontSize(8).font('Helvetica')
            .text(value, x, currentY, { width: columnWidths[index] })
        })

        currentY += 15
      })
    } else {
      doc.fontSize(12).text('Nenhum dado disponível para exportar.')
    }

    // Finalizar o documento
    doc.end()

    // Aguardar todos os chunks e retornar
    return new Promise<NextResponse>((resolve) => {
      doc.on('end', () => {
        try {
          const result = Buffer.concat(chunks)
          resolve(new NextResponse(result, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `attachment; filename="${type}_${new Date().toISOString().split('T')[0]}.pdf"`
            }
          }))
        } catch (error) {
          console.error('Erro ao processar PDF:', error)
          resolve(new NextResponse(
            JSON.stringify({ error: 'Erro ao processar PDF' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          ))
        }
      })
    })
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error)
    throw error
  }
}

async function getRankingData(period: string) {
  let startDate: Date | undefined
  let endDate: Date | undefined

  if (period === 'month') {
    const now = new Date()
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  } else if (period === 'year') {
    const now = new Date()
    startDate = new Date(now.getFullYear(), 0, 1)
    endDate = new Date(now.getFullYear(), 11, 31)
  }

  const users = await prisma.user.findMany({
    where: { role: 'DESBRAVADOR' },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true
    }
  })

  const usersWithPoints = await Promise.all(
    users.map(async (user) => {
      let activityPoints = 0
      let adjustmentPoints = 0

      if (period === 'all') {
        const [activityResult, adjustmentResult] = await Promise.all([
          prisma.userActivity.aggregate({
            where: { userId: user.id },
            _sum: { pointsAwarded: true }
          }),
          prisma.pointsAdjustment.aggregate({
            where: { userId: user.id },
            _sum: { points: true }
          })
        ])
        activityPoints = activityResult._sum.pointsAwarded || 0
        adjustmentPoints = adjustmentResult._sum.points || 0
      } else if (startDate && endDate) {
        const [activityResult, adjustmentResult] = await Promise.all([
          prisma.userActivity.aggregate({
            where: {
              userId: user.id,
              completedAt: { gte: startDate, lte: endDate }
            },
            _sum: { pointsAwarded: true }
          }),
          prisma.pointsAdjustment.aggregate({
            where: {
              userId: user.id,
              createdAt: { gte: startDate, lte: endDate }
            },
            _sum: { points: true }
          })
        ])
        activityPoints = activityResult._sum.pointsAwarded || 0
        adjustmentPoints = adjustmentResult._sum.points || 0
      }

      const totalPoints = activityPoints + adjustmentPoints

      let activitiesCompleted = 0
      if (period === 'all') {
        activitiesCompleted = await prisma.userActivity.count({
          where: { userId: user.id }
        })
      } else if (startDate && endDate) {
        activitiesCompleted = await prisma.userActivity.count({
          where: {
            userId: user.id,
            completedAt: { gte: startDate, lte: endDate }
          }
        })
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

  const ranking = usersWithPoints
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((user, index) => ({
      ...user,
      position: index + 1
    }))

  return { ranking }
}
