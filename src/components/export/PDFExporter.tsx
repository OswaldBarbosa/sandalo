'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface PDFExporterProps {
  data: Record<string, string | number | null>[]
  type: 'ranking' | 'users' | 'activities' | 'completions'
  filename?: string
}

export function PDFExporter({ data, type, filename }: PDFExporterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const generatePDF = async () => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          format: 'pdf',
          data
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao gerar PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename || `${type}_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: 'Sucesso!',
        description: 'PDF gerado e baixado com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar PDF. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    switch (type) {
      case 'ranking':
        return '📊 Exportar Ranking (PDF)'
      case 'users':
        return '👥 Exportar Usuários (PDF)'
      case 'activities':
        return '✅ Exportar Atividades (PDF)'
      case 'completions':
        return '🎯 Exportar Conclusões (PDF)'
      default:
        return '📄 Exportar PDF'
    }
  }

  return (
    <Button
      onClick={generatePDF}
      disabled={isLoading || data.length === 0}
      variant="outline"
    >
      {isLoading ? 'Gerando PDF...' : getButtonText()}
    </Button>
  )
}
