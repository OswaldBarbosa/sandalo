'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface Activity {
  id?: string
  name: string
  description: string
  points: number
  dueDate?: string
  category: string
}

interface ActivityFormProps {
  activity?: Activity
  onSuccess: () => void
  mode: 'create' | 'edit'
}

const ACTIVITY_CATEGORIES = [
  'Espiritual',
  'Social',
  'Recreativa',
  'Física',
  'Intelectual',
  'Manual',
  'Outra'
]

export function ActivityForm({ activity, onSuccess, mode }: ActivityFormProps) {
  const [formData, setFormData] = useState<Activity>({
    name: '',
    description: '',
    points: 0,
    dueDate: '',
    category: 'Espiritual'
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (activity && mode === 'edit') {
      setFormData({
        id: activity.id,
        name: activity.name || '',
        description: activity.description || '',
        points: activity.points || 0,
        dueDate: activity.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] : '',
        category: activity.category || 'Espiritual'
      })
    }
  }, [activity, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = mode === 'create' ? '/api/activities' : `/api/activities/${activity?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      // Para edição, remover campos que não foram alterados
      const dataToSend: Partial<Activity> = { ...formData }
      
      if (mode === 'edit' && activity) {
        if (dataToSend.name === activity.name) {
          delete dataToSend.name
        }
        if (dataToSend.description === activity.description) {
          delete dataToSend.description
        }
        if (dataToSend.points === activity.points) {
          delete dataToSend.points
        }
        if (dataToSend.dueDate === (activity.dueDate ? new Date(activity.dueDate).toISOString().split('T')[0] : '')) {
          delete dataToSend.dueDate
        }
        if (dataToSend.category === activity.category) {
          delete dataToSend.category
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSend),
      })

      if (!response.ok) {
        throw new Error('Erro ao salvar atividade')
      }

      toast({
        title: 'Sucesso!',
        description: `Atividade ${mode === 'create' ? 'criada' : 'atualizada'} com sucesso.`,
      })

      setIsOpen(false)
      setFormData({ name: '', description: '', points: 0, dueDate: '', category: 'Espiritual' })
      onSuccess()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar atividade. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof Activity, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === 'create' ? 'default' : 'outline'}>
          {mode === 'create' ? '+ Nova Atividade' : '✏️ Editar'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Criar Nova Atividade' : 'Editar Atividade'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Defina uma nova atividade para os desbravadores.'
              : 'Atualize as informações da atividade.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Atividade</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Participar da escola sabatina"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva detalhes da atividade..."
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="points">Pontos</Label>
              <Input
                id="points"
                type="number"
                min="1"
                value={formData.points}
                onChange={(e) => handleChange('points', parseInt(e.target.value) || 0)}
                placeholder="10"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select value={formData.category} onValueChange={(value) => handleChange('category', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="dueDate">Data Limite (Opcional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : (mode === 'create' ? 'Criar' : 'Atualizar')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
