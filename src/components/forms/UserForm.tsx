'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'

interface User {
  id?: string
  name: string
  email: string
  role: 'ADMIN' | 'DESBRAVADOR'
  password?: string
}

interface UserFormProps {
  user?: User
  onSuccess: () => void
  mode: 'create' | 'edit'
}

export function UserForm({ user, onSuccess, mode }: UserFormProps) {
  const [formData, setFormData] = useState<User>({
    name: '',
    email: '',
    role: 'DESBRAVADOR',
    password: ''
  })
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user && mode === 'edit') {
      setFormData({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        role: user.role,
        password: ''
      })
    }
  }, [user, mode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const url = mode === 'create' ? '/api/users' : `/api/users/${user?.id}`
      const method = mode === 'create' ? 'POST' : 'PUT'

      // Para edição, remover campos vazios ou não alterados
      const dataToSend: Partial<User> = { ...formData }
      
      if (mode === 'edit') {
        // Remover password se estiver vazio
        if (!dataToSend.password || dataToSend.password.trim() === '') {
          delete dataToSend.password
        }
        
        // Remover campos que não foram alterados
        if (dataToSend.name === user?.name) {
          delete dataToSend.name
        }
        if (dataToSend.email === user?.email) {
          delete dataToSend.email
        }
        if (dataToSend.role === user?.role) {
          delete dataToSend.role
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
        throw new Error('Erro ao salvar usuário')
      }

      toast({
        title: 'Sucesso!',
        description: `Usuário ${mode === 'create' ? 'criado' : 'atualizado'} com sucesso.`,
      })

      setIsOpen(false)
      setFormData({ name: '', email: '', role: 'DESBRAVADOR', password: '' })
      onSuccess()
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar usuário. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (field: keyof User, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={mode === 'create' ? 'default' : 'outline'}>
          {mode === 'create' ? '+ Adicionar Desbravador' : '✏️ Editar'}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Adicionar Novo Desbravador' : 'Editar Desbravador'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? 'Preencha os dados para criar um novo desbravador.'
              : 'Atualize as informações do desbravador.'
            }
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nome completo"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Tipo de Usuário</Label>
            <Select value={formData.role} onValueChange={(value) => handleChange('role', value as 'ADMIN' | 'DESBRAVADOR')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESBRAVADOR">Desbravador</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {mode === 'create' && (
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}
          
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
