'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  email: string
}

interface Activity {
  id: string
  name: string
  points: number
  category: string
}

interface Completion {
  userId: string
  activityId: string
  pointsAwarded: number
  note?: string
}

interface CompletionFormProps {
  onSuccess: () => void
}

export function CompletionForm({ onSuccess }: CompletionFormProps) {
  const [formData, setFormData] = useState<Completion>({
    userId: '',
    activityId: '',
    pointsAwarded: 0,
    note: ''
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchUsers()
    fetchActivities()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users?role=DESBRAVADOR')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
    }
  }

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activities')
      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities || [])
      }
    } catch (error) {
      console.error('Erro ao buscar atividades:', error)
    }
  }

  const handleActivityChange = (activityId: string) => {
    const activity = activities.find(a => a.id === activityId)
    setSelectedActivity(activity || null)
    setFormData(prev => ({
      ...prev,
      activityId,
      pointsAwarded: activity?.points || 0
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Erro ao registrar conclusão')
      }

      toast({
        title: 'Sucesso!',
        description: 'Conclusão registrada com sucesso.',
      })

      setIsOpen(false)
      setFormData({ userId: '', activityId: '', pointsAwarded: 0, note: '' })
      setSelectedActivity(null)
      onSuccess()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao registrar conclusão. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof Completion, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          🎯 Registrar Conclusão
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registrar Conclusão de Atividade</DialogTitle>
          <DialogDescription>
            Marque quando um desbravador concluir uma atividade.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">Desbravador</Label>
            <Select value={formData.userId} onValueChange={(value) => handleChange('userId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um desbravador" />
              </SelectTrigger>
              <SelectContent>
                {users.map(user => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="activityId">Atividade</Label>
            <Select value={formData.activityId} onValueChange={handleActivityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma atividade" />
              </SelectTrigger>
              <SelectContent>
                {activities.map(activity => (
                  <SelectItem key={activity.id} value={activity.id}>
                    {activity.name} ({activity.points} pts) - {activity.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedActivity && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Atividade selecionada:</strong> {selectedActivity.name}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Categoria:</strong> {selectedActivity.category}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Pontos padrão:</strong> {selectedActivity.points}
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="pointsAwarded">Pontos a Conceder</Label>
            <Input
              id="pointsAwarded"
              type="number"
              min="1"
              value={formData.pointsAwarded}
              onChange={(e) => handleChange('pointsAwarded', parseInt(e.target.value) || 0)}
              placeholder="10"
              required
            />
            <p className="text-xs text-muted-foreground">
              Você pode ajustar os pontos se necessário.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="note">Observação (Opcional)</Label>
            <Textarea
              id="note"
              value={formData.note}
              onChange={(e) => handleChange('note', e.target.value)}
              placeholder="Adicione uma observação sobre a conclusão..."
              rows={2}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !formData.userId || !formData.activityId}>
              {isLoading ? 'Registrando...' : 'Registrar Conclusão'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
