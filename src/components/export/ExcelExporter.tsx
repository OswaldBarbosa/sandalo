'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface ExcelExporterProps {
  dataType: 'ranking' | 'users' | 'activities' | 'completions'
  period?: 'month' | 'year' | 'all'
  filename?: string
}

export function ExcelExporter({ dataType, period = 'all', filename }: ExcelExporterProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const generateExcel = async () => {
    setIsLoading(true)
    
    try {
      const url = `/api/export?type=excel&dataType=${dataType}&period=${period}`
      
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Erro ao gerar Excel')
      }

      const blob = await response.blob()
      const url2 = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url2
      a.download = filename || `${dataType}_${period}_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url2)
      document.body.removeChild(a)

      toast({
        title: 'Sucesso!',
        description: 'Excel gerado e baixado com sucesso.',
      })
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao gerar Excel. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    switch (dataType) {
      case 'ranking':
        return `📊 Exportar Ranking (Excel) - ${period === 'month' ? 'Mensal' : period === 'year' ? 'Anual' : 'Geral'}`
      case 'users':
        return '👥 Exportar Usuários (Excel)'
      case 'activities':
        return '✅ Exportar Atividades (Excel)'
      case 'completions':
        return '🎯 Exportar Conclusões (Excel)'
      default:
        return '📊 Exportar Excel'
    }
  }

  return (
    <Button
      onClick={generateExcel}
      disabled={isLoading}
      variant="outline"
    >
      {isLoading ? 'Gerando Excel...' : getButtonText()}
    </Button>
  )
}
