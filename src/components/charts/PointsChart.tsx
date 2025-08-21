'use client'

import { useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface Completion {
  id: string
  activityName: string
  pointsAwarded: number
  completedAt: string
}

interface PointsChartProps {
  completions: Completion[]
  title?: string
  description?: string
}

export function PointsChart({ completions, title = "Evolução de Pontos", description = "Progresso dos pontos ao longo do tempo" }: PointsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || completions.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Sort completions by date
    const sortedCompletions = [...completions].sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )

    // Calculate cumulative points
    let cumulativePoints = 0
    const dataPoints = sortedCompletions.map(completion => {
      cumulativePoints += completion.pointsAwarded
      return {
        date: new Date(completion.completedAt),
        points: cumulativePoints
      }
    })

    if (dataPoints.length === 0) return

    // Canvas setup
    const padding = 40
    const width = canvas.width - 2 * padding
    const height = canvas.height - 2 * padding

    // Find min/max values
    const minDate = dataPoints[0].date
    const maxDate = dataPoints[dataPoints.length - 1].date
    const minPoints = 0
    const maxPoints = Math.max(...dataPoints.map(d => d.points))

    // Draw grid
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 1

    // Vertical grid lines (dates)
    for (let i = 0; i <= 5; i++) {
      const x = padding + (width * i) / 5
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height + padding)
      ctx.stroke()
    }

    // Horizontal grid lines (points)
    for (let i = 0; i <= 5; i++) {
      const y = height + padding - (height * i) / 5
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width + padding, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 2

    // X-axis
    ctx.beginPath()
    ctx.moveTo(padding, height + padding)
    ctx.lineTo(width + padding, height + padding)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height + padding)
    ctx.stroke()

    // Draw data line
    ctx.strokeStyle = '#006931'
    ctx.lineWidth = 3
    ctx.beginPath()

    dataPoints.forEach((point, index) => {
      const x = padding + (width * (point.date.getTime() - minDate.getTime())) / (maxDate.getTime() - minDate.getTime())
      const y = height + padding - (height * point.points) / maxPoints

      if (index === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw data points
    ctx.fillStyle = '#006931'
    dataPoints.forEach(point => {
      const x = padding + (width * (point.date.getTime() - minDate.getTime())) / (maxDate.getTime() - minDate.getTime())
      const y = height + padding - (height * point.points) / maxPoints

      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    })

    // Draw labels
    ctx.fillStyle = '#374151'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'

    // X-axis labels (dates)
    for (let i = 0; i <= 5; i++) {
      const x = padding + (width * i) / 5
      const date = new Date(minDate.getTime() + (maxDate.getTime() - minDate.getTime()) * i / 5)
      ctx.fillText(date.toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' }), x, height + padding + 20)
    }

    // Y-axis labels (points)
    ctx.textAlign = 'right'
    for (let i = 0; i <= 5; i++) {
      const y = height + padding - (height * i) / 5
      const points = Math.round((maxPoints * i) / 5)
      ctx.fillText(points.toString(), padding - 10, y + 4)
    }

  }, [completions])

  if (completions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <div className="text-4xl mb-2">📊</div>
            <p>Nenhum dado disponível para exibir o gráfico.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64">
          <canvas
            ref={canvasRef}
            width={600}
            height={256}
            className="w-full h-full"
          />
        </div>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Total de pontos acumulados: {completions.reduce((sum, comp) => sum + comp.pointsAwarded, 0)}
        </div>
      </CardContent>
    </Card>
  )
}
