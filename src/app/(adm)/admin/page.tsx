'use client'

import { ExcelExporter } from '@/components/export/ExcelExporter'
import { PDFExporter } from '@/components/export/PDFExporter'
import { ActivityForm } from '@/components/forms/ActivityForm'
import { CompletionForm } from '@/components/forms/CompletionForm'
import { UserForm } from '@/components/forms/UserForm'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'DESBRAVADOR'
  totalPoints: number
  createdAt: string
}

interface Activity {
  id: string
  name: string
  description: string
  points: number
  category: string
  dueDate?: string
  createdAt: string
}

interface Completion {
  id: string
  activityId: string
  userName: string
  activityName: string
  pointsAwarded: number
  completedAt: string
  note?: string
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState<User[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalActivities: 0,
    totalCompletions: 0,
    topPerformer: 'N/A'
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session || session.user.role !== 'ADMIN') {
      router.push('/login')
    }
  }, [session, status, router])

  const fetchData = useCallback(async () => {
    try {
      // Fetch users
      const usersResponse = await fetch('/api/users')
      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setUsers(usersData.users || [])
        setStats(prev => ({ ...prev, totalUsers: usersData.users?.length || 0 }))
      }

      // Fetch activities
      const activitiesResponse = await fetch('/api/activities')
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData.activities || [])
        setStats(prev => ({ ...prev, totalActivities: activitiesData.activities?.length || 0 }))
      }

      // Fetch completions
      const completionsResponse = await fetch('/api/completions')
      if (completionsResponse.ok) {
        const completionsData = await completionsResponse.json()
        // Mapear os dados para o formato esperado pela interface
        const mappedCompletions = completionsData.completions?.map((completion: {
          id: string
          activityId: string
          user?: { name: string }
          activity?: { name: string; id: string }
          pointsAwarded: number
          completedAt: string
          note?: string
        }) => ({
          id: completion.id,
          activityId: completion.activityId,
          userName: completion.user?.name || 'N/A',
          activityName: completion.activity?.name || 'N/A',
          pointsAwarded: completion.pointsAwarded,
          completedAt: completion.completedAt,
          note: completion.note
        })) || []
        setCompletions(mappedCompletions)
        setStats(prev => ({ ...prev, totalCompletions: mappedCompletions.length }))
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    }
  }, [])

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchData()
    }
  }, [session, activeTab])

  // Atualizar estatísticas quando os dados mudarem
  useEffect(() => {
    if (users.length > 0) {
      const topUser = users.reduce((prev, current) =>
        (prev.totalPoints > current.totalPoints) ? prev : current
      )
      setStats(prev => ({ ...prev, topPerformer: topUser.name || 'N/A' }))
    }
  }, [users])

  const handleSuccess = () => {
    fetchData()
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>
      {/* Header */}
      <header className="relative z-10 bg-white/90 backdrop-blur-sm shadow-lg border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-xl text-white font-bold">⚙️</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Sândalo
                </h1>
                <p className="text-sm text-muted-foreground">Painel Administrativo</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Administrador,</p>
                <p className="font-medium text-foreground">
                  {session.user.name || session.user.email}
                </p>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                size="sm"
                className="border-primary/20 text-primary hover:bg-primary/5 hover:border-primary/40 transition-all duration-200"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation and Content */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <div className="grid w-full grid-cols-6 bg-white/50 backdrop-blur-sm border border-white/20 shadow-lg rounded-lg p-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === 'dashboard' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === 'users' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                👥 Usuários
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === 'activities' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                ✅ Atividades
              </button>
              <button
                onClick={() => setActiveTab('completions')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === 'completions' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                🎯 Conclusões
              </button>
              <button
                onClick={() => setActiveTab('ranking')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === 'ranking' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                🏆 Ranking
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === 'reports' 
                    ? 'bg-primary text-white shadow-md' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                📋 Relatórios
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-start bg-white/50 backdrop-blur-sm border border-white/20 shadow-lg">
                  <Menu className="h-4 w-4 mr-2" />
                  {(() => {
                    const tabLabels = {
                      dashboard: '📊 Dashboard',
                      users: '👥 Usuários',
                      activities: '✅ Atividades',
                      completions: '🎯 Conclusões',
                      ranking: '🏆 Ranking',
                      reports: '📋 Relatórios'
                    }
                    return tabLabels[activeTab as keyof typeof tabLabels] || '📊 Dashboard'
                  })()}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] sm:w-[350px] bg-white/95 backdrop-blur-sm">
                <div className="flex flex-col space-y-2 mt-6">
                  <div className="px-2 py-3">
                    <h3 className="text-lg font-semibold text-primary mb-4">Navegação</h3>
                  </div>
                  {[
                    { value: 'dashboard', label: '📊 Dashboard', icon: '📊' },
                    { value: 'users', label: '👥 Usuários', icon: '👥' },
                    { value: 'activities', label: '✅ Atividades', icon: '✅' },
                    { value: 'completions', label: '🎯 Conclusões', icon: '🎯' },
                    { value: 'ranking', label: '🏆 Ranking', icon: '🏆' },
                    { value: 'reports', label: '📋 Relatórios', icon: '📋' }
                  ].map((tab) => (
                    <Button
                      key={tab.value}
                      variant={activeTab === tab.value ? 'default' : 'ghost'}
                      className={`w-full justify-start text-left h-12 px-4 ${
                        activeTab === tab.value 
                          ? 'bg-primary text-white shadow-md' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setActiveTab(tab.value)}
                    >
                      <span className="text-lg mr-3">{tab.icon}</span>
                      {tab.label}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <main className="max-w-7xl py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                <TabsContent value="dashboard" className="space-y-6 min-h-[800px]">
                  {/* Cards de Estatísticas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-2xl">📊</span>
                        Estatísticas Gerais
                      </CardTitle>
                      <CardDescription>
                        Visão geral do sistema Sândalo em tempo real
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                                  <span className="text-2xl">👨‍👩‍👧‍👦</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-muted-foreground">
                                  Total de Desbravadores
                                </dt>
                                <dd className="text-2xl font-bold text-primary">
                                  {stats.totalUsers}
                                </dd>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Membros ativos no clube
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center">
                                  <span className="text-2xl">📝</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-muted-foreground">
                                  Atividades Ativas
                                </dt>
                                <dd className="text-2xl font-bold text-secondary-foreground">
                                  {stats.totalActivities}
                                </dd>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Disponíveis para realização
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-yellow-200 rounded-xl flex items-center justify-center">
                                  <span className="text-2xl">🏅</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-yellow-700">
                                  Conclusões Totais
                                </dt>
                                <dd className="text-2xl font-bold text-yellow-900">
                                  {stats.totalCompletions}
                                </dd>
                                <p className="text-xs text-yellow-600 mt-1">
                                  Atividades realizadas
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                                  <span className="text-2xl">👑</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-purple-700">
                                  Líder do Ranking
                                </dt>
                                <dd className="text-lg font-bold text-purple-900 truncate">
                                  {stats.topPerformer}
                                </dd>
                                <p className="text-xs text-purple-600 mt-1">
                                  Maior pontuação
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráficos e Análises */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Ranking Top 5 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-xl">🥇</span>
                          Top 5 do Ranking
                        </CardTitle>
                        <CardDescription>
                          Desbravadores com maior pontuação
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {users
                          .filter(user => user.role === 'DESBRAVADOR')
                          .sort((a, b) => b.totalPoints - a.totalPoints)
                          .slice(0, 5)
                          .map((user, index) => (
                            <div key={user.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                  index === 1 ? 'bg-gray-100 text-gray-800' :
                                    index === 2 ? 'bg-orange-100 text-orange-800' :
                                      'bg-blue-100 text-blue-800'
                                  }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{user.name}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">{user.totalPoints} pts</p>
                                <p className="text-xs text-muted-foreground">
                                  {index === 0 ? '🥇 1º Lugar' :
                                    index === 1 ? '🥈 2º Lugar' :
                                      index === 2 ? '🥉 3º Lugar' : `${index + 1}º Lugar`}
                                </p>
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>

                    {/* Atividades por Categoria */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-xl">📊</span>
                          Atividades por Categoria
                        </CardTitle>
                        <CardDescription>
                          Distribuição das atividades disponíveis
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const categoryCount = activities.reduce((acc, activity) => {
                            acc[activity.category] = (acc[activity.category] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)

                          const sortedCategories = Object.entries(categoryCount)
                            .sort(([, a], [, b]) => b - a)
                            .slice(0, 5)

                          return (
                            <div className="space-y-3">
                              {sortedCategories.map(([category, count]) => (
                                <div key={category} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                                    <span className="font-medium text-foreground">{category}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 bg-muted rounded-full h-2">
                                      <div
                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${(count / activities.length) * 100}%` }}
                                      ></div>
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground min-w-[2rem] text-right">
                                      {count}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Resumo de Atividade Recente */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-xl">⚡</span>
                        Atividade Recente
                      </CardTitle>
                      <CardDescription>
                        Últimas conclusões e atividades do sistema
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {completions.slice(0, 5).map((completion) => (
                          <div key={completion.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-lg">✅</span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                <span className="text-primary">{completion.userName}</span> concluiu{' '}
                                <span className="text-secondary-foreground">{completion.activityName}</span>
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(completion.completedAt).toLocaleDateString('pt-BR')} • {completion.pointsAwarded} pontos
                              </p>
                            </div>
                            <Badge variant="secondary" className="text-xs flex items-center gap-1">
                              <span className="text-xs">➕</span>
                              +{completion.pointsAwarded} pts
                            </Badge>
                          </div>
                        ))}
                        {completions.length === 0 && (
                          <div className="text-center py-8 text-muted-foreground">
                            <div className="text-4xl mb-2">📋</div>
                            <p>Nenhuma conclusão registrada ainda.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-6 min-h-[800px]">
                  {/* Cards de Estatísticas de Usuários */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        Estatísticas de Usuários
                      </CardTitle>
                      <CardDescription>
                        Visão geral dos membros do clube Sândalo
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                                  <span className="text-2xl">👥</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-blue-700">
                                  Total de Membros
                                </dt>
                                <dd className="text-2xl font-bold text-blue-900">
                                  {users.length}
                                </dd>
                                <p className="text-xs text-blue-600 mt-1">
                                  Todos os usuários
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                                  <span className="text-2xl">👤</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-green-700">
                                  Desbravadores
                                </dt>
                                <dd className="text-2xl font-bold text-green-900">
                                  {users.filter(u => u.role === 'DESBRAVADOR').length}
                                </dd>
                                <p className="text-xs text-green-600 mt-1">
                                  Membros ativos
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                                  <span className="text-2xl">⚙️</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-purple-700">
                                  Administradores
                                </dt>
                                <dd className="text-2xl font-bold text-purple-900">
                                  {users.filter(u => u.role === 'ADMIN').length}
                                </dd>
                                <p className="text-xs text-purple-600 mt-1">
                                  Gestores do sistema
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                          <CardContent className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                                  <span className="text-2xl">🏆</span>
                                </div>
                              </div>
                              <div className="ml-4 flex-1">
                                <dt className="text-sm font-medium text-orange-700">
                                  Média de Pontos
                                </dt>
                                <dd className="text-2xl font-bold text-orange-900">
                                  {users.length > 0 ? Math.round(users.reduce((sum, u) => sum + u.totalPoints, 0) / users.length) : 0}
                                </dd>
                                <p className="text-xs text-orange-600 mt-1">
                                  Por membro
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Gráficos e Análises */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top 5 Usuários por Pontos */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-xl">🥇</span>
                          Top 5 por Pontos
                        </CardTitle>
                        <CardDescription>
                          Usuários com maior pontuação
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {users
                          .sort((a, b) => b.totalPoints - a.totalPoints)
                          .slice(0, 5)
                          .map((user, index) => (
                            <div key={user.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                  index === 1 ? 'bg-gray-100 text-gray-800' :
                                    index === 2 ? 'bg-orange-100 text-orange-800' :
                                      'bg-blue-100 text-blue-800'
                                  }`}>
                                  {index + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{user.name}</p>
                                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                                    <span className="text-xs">
                                      {user.role === 'ADMIN' ? '⚙️' : '👤'}
                                    </span>
                                    {user.role === 'ADMIN' ? 'Administrador' : 'Desbravador'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold text-primary">{user.totalPoints} pts</p>
                                <p className="text-xs text-muted-foreground">
                                  {index === 0 ? '🥇 1º Lugar' :
                                    index === 1 ? '🥈 2º Lugar' :
                                      index === 2 ? '🥉 3º Lugar' : `${index + 1}º Lugar`}
                                </p>
                              </div>
                            </div>
                          ))}
                      </CardContent>
                    </Card>

                    {/* Distribuição por Tipo */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <span className="text-xl">📈</span>
                          Distribuição por Tipo
                        </CardTitle>
                        <CardDescription>
                          Proporção de administradores e desbravadores
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                              <span className="font-medium text-foreground">Administradores</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-3">
                                <div
                                  className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${users.length > 0 ? (users.filter(u => u.role === 'ADMIN').length / users.length) * 100 : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
                                {users.filter(u => u.role === 'ADMIN').length}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                              <span className="font-medium text-foreground">Desbravadores</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-muted rounded-full h-3">
                                <div
                                  className="bg-green-500 h-3 rounded-full transition-all duration-300"
                                  style={{ width: `${users.length > 0 ? (users.filter(u => u.role === 'DESBRAVADOR').length / users.length) * 100 : 0}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
                                {users.filter(u => u.role === 'DESBRAVADOR').length}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Lista de Usuários */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <span className="text-xl">📋</span>
                        Lista de Usuários
                      </CardTitle>
                      <CardDescription>
                        Gerencie todos os membros do clube
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-medium flex items-center gap-2">
                            <span className="text-lg">👥</span>
                            Membros Registrados
                          </h3>
                          <Badge variant="outline" className="text-sm">
                            {users.length} usuário{users.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                        <UserForm onSuccess={handleSuccess} mode="create" />
                      </div>

                      <div className="rounded-md border shadow-sm">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead className="font-semibold">👤 Nome</TableHead>
                              <TableHead className="font-semibold">📧 Email</TableHead>
                              <TableHead className="font-semibold">🏷️ Tipo</TableHead>
                              <TableHead className="font-semibold">🏆 Pontos</TableHead>
                              <TableHead className="font-semibold">📅 Membro desde</TableHead>
                              <TableHead className="font-semibold">⚙️ Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.map((user) => (
                              <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                      }`}>
                                      {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    {user.name}
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                <TableCell>
                                  <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'default'} className="flex items-center gap-1">
                                    <span className="text-xs">
                                      {user.role === 'ADMIN' ? '⚙️' : '👤'}
                                    </span>
                                    {user.role === 'ADMIN' ? 'Administrador' : 'Desbravador'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                      <span className="text-xs">🏆</span>
                                      {user.totalPoints} pts
                                    </Badge>
                                  </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">📅</span>
                                    {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <UserForm user={user} onSuccess={handleSuccess} mode="edit" />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>

                        {users.length === 0 && (
                          <div className="text-center py-12 text-muted-foreground">
                            <div className="text-4xl mb-3">👥</div>
                            <p className="text-lg font-medium mb-2">Nenhum usuário registrado</p>
                            <p className="text-sm">Comece cadastrando o primeiro membro do clube!</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                                 <TabsContent value="activities" className="space-y-6 min-h-[800px]">
                   {/* Cards de Estatísticas de Atividades */}
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <span className="text-xl">📊</span>
                         Estatísticas de Atividades
                       </CardTitle>
                       <CardDescription>
                         Visão geral das atividades disponíveis no clube Sândalo
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                         <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">📝</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-blue-700">
                                   Total de Atividades
                                 </dt>
                                 <dd className="text-2xl font-bold text-blue-900">
                                   {activities.length}
                                 </dd>
                                 <p className="text-xs text-blue-600 mt-1">
                                   Disponíveis para realização
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">🏷️</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-green-700">
                                   Categorias Únicas
                                 </dt>
                                 <dd className="text-2xl font-bold text-green-900">
                                   {new Set(activities.map(a => a.category)).size}
                                 </dd>
                                 <p className="text-xs text-green-600 mt-1">
                                   Tipos diferentes
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">🎯</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-purple-700">
                                   Total de Pontos
                                 </dt>
                                 <dd className="text-2xl font-bold text-purple-900">
                                   {activities.reduce((sum, a) => sum + a.points, 0)}
                                 </dd>
                                 <p className="text-xs text-purple-600 mt-1">
                                   Pontos disponíveis
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">⏰</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-orange-700">
                                   Com Prazo
                                 </dt>
                                 <dd className="text-2xl font-bold text-orange-900">
                                   {activities.filter(a => a.dueDate).length}
                                 </dd>
                                 <p className="text-xs text-orange-600 mt-1">
                                   Atividades temporais
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                       </div>
                     </CardContent>
                   </Card>

                   {/* Gráficos e Análises */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Atividades por Categoria */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <span className="text-xl">📊</span>
                           Atividades por Categoria
                         </CardTitle>
                         <CardDescription>
                           Distribuição das atividades por tipo
                         </CardDescription>
                       </CardHeader>
                       <CardContent>
                         {(() => {
                           const categoryCount = activities.reduce((acc, activity) => {
                             acc[activity.category] = (acc[activity.category] || 0) + 1
                             return acc
                           }, {} as Record<string, number>)
                           
                           const sortedCategories = Object.entries(categoryCount)
                             .sort(([,a], [,b]) => b - a)
                           
                           return (
                             <div className="space-y-3">
                               {sortedCategories.map(([category, count]) => (
                                 <div key={category} className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                     <div className="w-3 h-3 bg-primary rounded-full"></div>
                                     <span className="font-medium text-foreground">{category}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <div className="w-20 bg-muted rounded-full h-2">
                                       <div 
                                         className="bg-primary h-2 rounded-full transition-all duration-300"
                                         style={{ width: `${(count / activities.length) * 100}%` }}
                                       ></div>
                                     </div>
                                     <span className="text-sm font-medium text-muted-foreground min-w-[2rem] text-right">
                                       {count}
                                     </span>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           )
                         })()}
                       </CardContent>
                     </Card>

                     {/* Top 5 Atividades por Pontos */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <span className="text-xl">🏆</span>
                           Top 5 por Pontos
                         </CardTitle>
                         <CardDescription>
                           Atividades com maior pontuação
                         </CardDescription>
                       </CardHeader>
                       <CardContent>
                         {activities
                           .sort((a, b) => b.points - a.points)
                           .slice(0, 5)
                           .map((activity, index) => (
                             <div key={activity.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
                               <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                   index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                   index === 1 ? 'bg-gray-100 text-gray-800' :
                                   index === 2 ? 'bg-orange-100 text-orange-800' :
                                   'bg-blue-100 text-blue-800'
                                 }`}>
                                   {index + 1}
                                 </div>
                                 <div>
                                   <p className="font-medium text-foreground">{activity.name}</p>
                                   <p className="text-sm text-muted-foreground">{activity.category}</p>
                                 </div>
                               </div>
                               <div className="text-right">
                                 <p className="text-lg font-bold text-primary">{activity.points} pts</p>
                                 <p className="text-xs text-muted-foreground">
                                   {index === 0 ? '🥇 Maior valor' :
                                    index === 1 ? '🥈 2º lugar' :
                                    index === 2 ? '🥉 3º lugar' : `${index + 1}º lugar`}
                                 </p>
                               </div>
                             </div>
                           ))}
                       </CardContent>
                     </Card>
                   </div>

                   {/* Lista de Atividades */}
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <span className="text-xl">📋</span>
                         Lista de Atividades
                       </CardTitle>
                       <CardDescription>
                         Gerencie todas as atividades disponíveis
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-3">
                           <h3 className="text-lg font-medium flex items-center gap-2">
                             <span className="text-lg">📝</span>
                             Atividades Disponíveis
                           </h3>
                           <Badge variant="outline" className="text-sm">
                             {activities.length} atividade{activities.length !== 1 ? 's' : ''}
                           </Badge>
                         </div>
                         <ActivityForm onSuccess={handleSuccess} mode="create" />
                       </div>

                       <div className="rounded-md border shadow-sm">
                         <Table>
                           <TableHeader>
                             <TableRow className="bg-muted/50">
                               <TableHead className="font-semibold">📝 Nome</TableHead>
                               <TableHead className="font-semibold">📄 Descrição</TableHead>
                               <TableHead className="font-semibold">🏆 Pontos</TableHead>
                               <TableHead className="font-semibold">🏷️ Categoria</TableHead>
                               <TableHead className="font-semibold">⏰ Data Limite</TableHead>
                               <TableHead className="font-semibold">⚙️ Ações</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {activities.map((activity) => (
                               <TableRow key={activity.id} className="hover:bg-muted/30 transition-colors">
                                 <TableCell className="font-medium">
                                   <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center text-sm font-bold text-primary">
                                       {activity.name.charAt(0).toUpperCase()}
                                     </div>
                                     {activity.name}
                                   </div>
                                 </TableCell>
                                 <TableCell className="text-muted-foreground max-w-xs truncate">
                                   {activity.description || 'Sem descrição'}
                                 </TableCell>
                                 <TableCell>
                                   <Badge variant="secondary" className="flex items-center gap-1">
                                     <span className="text-xs">🏆</span>
                                     {activity.points} pts
                                   </Badge>
                                 </TableCell>
                                 <TableCell>
                                   <Badge variant="outline" className="flex items-center gap-1">
                                     <span className="text-xs">🏷️</span>
                                     {activity.category}
                                   </Badge>
                                 </TableCell>
                                 <TableCell>
                                   {activity.dueDate ? (
                                     <div className="flex items-center gap-2">
                                       <span className="text-xs">⏰</span>
                                       <span className="text-muted-foreground">
                                         {new Date(activity.dueDate).toLocaleDateString('pt-BR')}
                                       </span>
                                     </div>
                                   ) : (
                                     <span className="text-muted-foreground italic">Sem prazo</span>
                                   )}
                                 </TableCell>
                                 <TableCell>
                                   <ActivityForm activity={activity} onSuccess={handleSuccess} mode="edit" />
                                 </TableCell>
                               </TableRow>
                             ))}
                           </TableBody>
                         </Table>
                         
                         {activities.length === 0 && (
                           <div className="text-center py-12 text-muted-foreground">
                             <div className="text-4xl mb-3">📝</div>
                             <p className="text-lg font-medium mb-2">Nenhuma atividade cadastrada</p>
                             <p className="text-sm">Comece criando a primeira atividade para os desbravadores!</p>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 </TabsContent>

                                 <TabsContent value="completions" className="space-y-6 min-h-[800px]">
                   {/* Cards de Estatísticas de Conclusões */}
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <span className="text-xl">📊</span>
                         Estatísticas de Conclusões
                       </CardTitle>
                       <CardDescription>
                         Visão geral das atividades concluídas pelos desbravadores
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                         <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">✅</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-blue-700">
                                   Total de Conclusões
                                 </dt>
                                 <dd className="text-2xl font-bold text-blue-900">
                                   {completions.length}
                                 </dd>
                                 <p className="text-xs text-blue-600 mt-1">
                                   Atividades realizadas
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">👥</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-green-700">
                                   Desbravadores Ativos
                                 </dt>
                                 <dd className="text-2xl font-bold text-green-900">
                                   {new Set(completions.map(c => c.userName)).size}
                                 </dd>
                                 <p className="text-xs text-green-600 mt-1">
                                   Com atividades concluídas
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">🏆</span>
                                   </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-purple-700">
                                   Total de Pontos
                                 </dt>
                                 <dd className="text-2xl font-bold text-purple-900">
                                   {completions.reduce((sum, c) => sum + c.pointsAwarded, 0)}
                                 </dd>
                                 <p className="text-xs text-purple-600 mt-1">
                                   Pontos distribuídos
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">📈</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-orange-700">
                                   Média por Conclusão
                                 </dt>
                                 <dd className="text-2xl font-bold text-orange-900">
                                   {completions.length > 0 ? Math.round(completions.reduce((sum, c) => sum + c.pointsAwarded, 0) / completions.length) : 0}
                                 </dd>
                                 <p className="text-xs text-orange-600 mt-1">
                                   Pontos por atividade
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                       </div>
                     </CardContent>
                   </Card>

                   {/* Gráficos e Análises */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Top 5 Desbravadores por Conclusões */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <span className="text-xl">🥇</span>
                           Top 5 por Conclusões
                         </CardTitle>
                         <CardDescription>
                           Desbravadores com mais atividades concluídas
                         </CardDescription>
                       </CardHeader>
                       <CardContent>
                         {(() => {
                           const userCompletions = completions.reduce((acc, completion) => {
                             acc[completion.userName] = (acc[completion.userName] || 0) + 1
                             return acc
                           }, {} as Record<string, number>)
                           
                           const sortedUsers = Object.entries(userCompletions)
                             .sort(([,a], [,b]) => b - a)
                             .slice(0, 5)
                           
                           return (
                             <div className="space-y-3">
                               {sortedUsers.map(([userName, count], index) => (
                                 <div key={userName} className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
                                   <div className="flex items-center gap-3">
                                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                       index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                       index === 1 ? 'bg-gray-100 text-gray-800' :
                                       index === 2 ? 'bg-orange-100 text-orange-800' :
                                       'bg-blue-100 text-blue-800'
                                     }`}>
                                       {index + 1}
                                     </div>
                                     <div>
                                       <p className="font-medium text-foreground">{userName}</p>
                                       <p className="text-sm text-muted-foreground">{count} atividade{count !== 1 ? 's' : ''}</p>
                                     </div>
                                   </div>
                                   <div className="text-right">
                                     <p className="text-lg font-bold text-primary">{count}</p>
                                     <p className="text-xs text-muted-foreground">
                                       {index === 0 ? '🥇 1º Lugar' :
                                        index === 1 ? '🥈 2º Lugar' :
                                        index === 2 ? '🥉 3º Lugar' : `${index + 1}º Lugar`}
                                     </p>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           )
                         })()}
                       </CardContent>
                     </Card>

                     {/* Conclusões por Mês */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <span className="text-xl">📅</span>
                           Conclusões por Mês
                         </CardTitle>
                         <CardDescription>
                           Distribuição das conclusões ao longo do tempo
                         </CardDescription>
                       </CardHeader>
                       <CardContent>
                         {(() => {
                           const monthlyCompletions = completions.reduce((acc, completion) => {
                             const month = new Date(completion.completedAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                             acc[month] = (acc[month] || 0) + 1
                             return acc
                           }, {} as Record<string, number>)
                           
                           const sortedMonths = Object.entries(monthlyCompletions)
                             .sort(([,a], [,b]) => b - a)
                             .slice(0, 6)
                           
                           return (
                             <div className="space-y-3">
                               {sortedMonths.map(([month, count]) => (
                                 <div key={month} className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                     <div className="w-3 h-3 bg-primary rounded-full"></div>
                                     <span className="font-medium text-foreground">{month}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <div className="w-20 bg-muted rounded-full h-2">
                                       <div 
                                         className="bg-primary h-2 rounded-full transition-all duration-300"
                                         style={{ width: `${(count / Math.max(...Object.values(monthlyCompletions))) * 100}%` }}
                                       ></div>
                                     </div>
                                     <span className="text-sm font-medium text-muted-foreground min-w-[2rem] text-right">
                                       {count}
                                     </span>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           )
                         })()}
                       </CardContent>
                     </Card>
                   </div>

                   {/* Lista de Conclusões */}
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <span className="text-xl">📋</span>
                         Lista de Conclusões
                       </CardTitle>
                       <CardDescription>
                         Gerencie todas as atividades concluídas
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-3">
                           <h3 className="text-lg font-medium flex items-center gap-2">
                             <span className="text-lg">✅</span>
                             Conclusões Registradas
                           </h3>
                           <Badge variant="outline" className="text-sm">
                             {completions.length} conclusão{completions.length !== 1 ? 'ões' : ''}
                           </Badge>
                         </div>
                         <CompletionForm onSuccess={handleSuccess} />
                       </div>

                       <div className="rounded-md border shadow-sm">
                         <Table>
                           <TableHeader>
                             <TableRow className="bg-muted/50">
                               <TableHead className="font-semibold">👤 Desbravador</TableHead>
                               <TableHead className="font-semibold">📝 Atividade</TableHead>
                               <TableHead className="font-semibold">🏆 Pontos</TableHead>
                               <TableHead className="font-semibold">📅 Data</TableHead>
                               <TableHead className="font-semibold">💬 Observação</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {completions.map((completion) => (
                               <TableRow key={completion.id} className="hover:bg-muted/30 transition-colors">
                                 <TableCell className="font-medium">
                                   <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-sm font-bold text-green-800">
                                       {completion.userName.charAt(0).toUpperCase()}
                                     </div>
                                     {completion.userName}
                                   </div>
                                 </TableCell>
                                 <TableCell className="text-muted-foreground">
                                   <div className="flex items-center gap-2">
                                     <span className="text-xs">📝</span>
                                     {completion.activityName}
                                   </div>
                                 </TableCell>
                                 <TableCell>
                                   <Badge variant="secondary" className="flex items-center gap-1">
                                     <span className="text-xs">🏆</span>
                                     {completion.pointsAwarded} pts
                                   </Badge>
                                 </TableCell>
                                 <TableCell>
                                   <div className="flex items-center gap-2">
                                     <span className="text-xs">📅</span>
                                     <span className="text-muted-foreground">
                                       {new Date(completion.completedAt).toLocaleDateString('pt-BR')}
                                     </span>
                                   </div>
                                 </TableCell>
                                 <TableCell>
                                   {completion.note ? (
                                     <span className="text-muted-foreground text-sm">{completion.note}</span>
                                   ) : (
                                     <span className="text-muted-foreground italic text-sm">-</span>
                                   )}
                                 </TableCell>
                               </TableRow>
                             ))}
                           </TableBody>
                         </Table>
                         
                         {completions.length === 0 && (
                           <div className="text-center py-12 text-muted-foreground">
                             <div className="text-4xl mb-3">✅</div>
                             <p className="text-lg font-medium mb-2">Nenhuma conclusão registrada</p>
                             <p className="text-sm">Comece registrando a primeira conclusão de atividade!</p>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 </TabsContent>

                                 <TabsContent value="ranking" className="space-y-6 min-h-[800px]">
                   {/* Cards de Estatísticas do Ranking */}
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <span className="text-xl">📊</span>
                         Estatísticas do Ranking
                       </CardTitle>
                       <CardDescription>
                         Visão geral do desempenho dos desbravadores
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                         <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">👥</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-blue-700">
                                   Total de Competidores
                                 </dt>
                                 <dd className="text-2xl font-bold text-blue-900">
                                   {users.filter(u => u.role === 'DESBRAVADOR').length}
                                 </dd>
                                 <p className="text-xs text-blue-600 mt-1">
                                   Desbravadores ativos
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">🏆</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-green-700">
                                   Maior Pontuação
                                 </dt>
                                 <dd className="text-2xl font-bold text-green-900">
                                   {users.filter(u => u.role === 'DESBRAVADOR').length > 0 ? 
                                     Math.max(...users.filter(u => u.role === 'DESBRAVADOR').map(u => u.totalPoints)) : 0}
                                 </dd>
                                 <p className="text-xs text-green-600 mt-1">
                                   Pontos do líder
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">📈</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-purple-700">
                                   Média de Pontos
                                 </dt>
                                 <dd className="text-2xl font-bold text-purple-900">
                                   {(() => {
                                     const desbravadores = users.filter(u => u.role === 'DESBRAVADOR')
                                     return desbravadores.length > 0 ? 
                                       Math.round(desbravadores.reduce((sum, u) => sum + u.totalPoints, 0) / desbravadores.length) : 0
                                   })()}
                                 </dd>
                                 <p className="text-xs text-purple-600 mt-1">
                                   Por desbravador
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">🎯</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-orange-700">
                                   Pontos Totais
                                 </dt>
                                 <dd className="text-2xl font-bold text-orange-900">
                                   {users.filter(u => u.role === 'DESBRAVADOR').reduce((sum, u) => sum + u.totalPoints, 0)}
                                 </dd>
                                 <p className="text-xs text-orange-600 mt-1">
                                   Distribuídos
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                       </div>
                     </CardContent>
                   </Card>

                   {/* Gráficos e Análises */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Top 10 do Ranking */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <span className="text-xl">🥇</span>
                           Top 10 do Ranking
                         </CardTitle>
                         <CardDescription>
                           Desbravadores com maior pontuação
                         </CardDescription>
                       </CardHeader>
                       <CardContent>
                         {users
                           .filter(user => user.role === 'DESBRAVADOR')
                           .sort((a, b) => b.totalPoints - a.totalPoints)
                           .slice(0, 10)
                           .map((user, index) => (
                             <div key={user.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-b-0">
                               <div className="flex items-center gap-3">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                   index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                   index === 1 ? 'bg-gray-100 text-gray-800' :
                                   index === 2 ? 'bg-orange-100 text-orange-800' :
                                   index < 5 ? 'bg-blue-100 text-blue-800' :
                                   'bg-green-100 text-green-800'
                                 }`}>
                                   {index + 1}
                                 </div>
                                 <div>
                                   <p className="font-medium text-foreground">{user.name}</p>
                                   <p className="text-sm text-muted-foreground">{user.email}</p>
                                 </div>
                               </div>
                               <div className="text-right">
                                 <p className="text-lg font-bold text-primary">{user.totalPoints} pts</p>
                                 <p className="text-xs text-muted-foreground">
                                   {index === 0 ? '🥇 1º Lugar' :
                                    index === 1 ? '🥈 2º Lugar' :
                                    index === 2 ? '🥉 3º Lugar' : 
                                    index < 5 ? '🏅 Top 5' : '🎯 Top 10'}
                                 </p>
                               </div>
                             </div>
                           ))}
                       </CardContent>
                     </Card>

                     {/* Distribuição de Pontos */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <span className="text-xl">📊</span>
                           Distribuição de Pontos
                         </CardTitle>
                         <CardDescription>
                           Faixas de pontuação dos desbravadores
                         </CardDescription>
                       </CardHeader>
                       <CardContent>
                         {(() => {
                           const desbravadores = users.filter(u => u.role === 'DESBRAVADOR')
                           const ranges = [
                             { min: 0, max: 10, label: '0-10 pts', color: 'bg-red-500' },
                             { min: 11, max: 25, label: '11-25 pts', color: 'bg-orange-500' },
                             { min: 26, max: 50, label: '26-50 pts', color: 'bg-yellow-500' },
                             { min: 51, max: 100, label: '51-100 pts', color: 'bg-green-500' },
                             { min: 101, max: Infinity, label: '100+ pts', color: 'bg-blue-500' }
                           ]
                           
                           const rangeCounts = ranges.map(range => ({
                             ...range,
                             count: desbravadores.filter(u => u.totalPoints >= range.min && u.totalPoints <= range.max).length
                           }))
                           
                           return (
                             <div className="space-y-3">
                               {rangeCounts.map((range) => (
                                 <div key={range.label} className="flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                     <div className={`w-3 h-3 ${range.color} rounded-full`}></div>
                                     <span className="font-medium text-foreground">{range.label}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                     <div className="w-20 bg-muted rounded-full h-2">
                                       <div 
                                         className={`${range.color} h-2 rounded-full transition-all duration-300`}
                                         style={{ width: `${desbravadores.length > 0 ? (range.count / desbravadores.length) * 100 : 0}%` }}
                                       ></div>
                                     </div>
                                     <span className="text-sm font-medium text-muted-foreground min-w-[2rem] text-right">
                                       {range.count}
                                     </span>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           )
                         })()}
                       </CardContent>
                     </Card>
                   </div>

                   {/* Ranking Completo */}
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <span className="text-xl">📋</span>
                         Ranking Completo
                       </CardTitle>
                       <CardDescription>
                         Lista completa de todos os desbravadores ordenados por pontuação
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="flex justify-between items-center mb-6">
                         <div className="flex items-center gap-3">
                           <h3 className="text-lg font-medium flex items-center gap-2">
                             <span className="text-lg">🏆</span>
                             Classificação Geral
                           </h3>
                           <Badge variant="outline" className="text-sm">
                             {users.filter(u => u.role === 'DESBRAVADOR').length} desbravador{users.filter(u => u.role === 'DESBRAVADOR').length !== 1 ? 'es' : ''}
                           </Badge>
                         </div>
                       </div>

                       <div className="rounded-md border shadow-sm">
                         <Table>
                           <TableHeader>
                             <TableRow className="bg-muted/50">
                               <TableHead className="font-semibold">🥇 Posição</TableHead>
                               <TableHead className="font-semibold">👤 Nome</TableHead>
                               <TableHead className="font-semibold">📧 Email</TableHead>
                               <TableHead className="font-semibold">🏆 Pontos</TableHead>
                               <TableHead className="font-semibold">📊 Status</TableHead>
                             </TableRow>
                           </TableHeader>
                           <TableBody>
                             {users
                               .filter(user => user.role === 'DESBRAVADOR')
                               .sort((a, b) => b.totalPoints - a.totalPoints)
                               .map((user, index) => (
                                 <TableRow key={user.id} className="hover:bg-muted/30 transition-colors">
                                   <TableCell className="font-medium">
                                     <div className="flex items-center gap-2">
                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                         index === 0 ? 'bg-yellow-100 text-yellow-800' :
                                         index === 1 ? 'bg-gray-100 text-gray-800' :
                                         index === 2 ? 'bg-orange-100 text-orange-800' :
                                         index < 5 ? 'bg-blue-100 text-blue-800' :
                                         'bg-green-100 text-green-800'
                                       }`}>
                                         {index + 1}
                                       </div>
                                       <span className="text-sm text-muted-foreground">#{index + 1}</span>
                                     </div>
                                   </TableCell>
                                   <TableCell className="font-medium">
                                     <div className="flex items-center gap-2">
                                       <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                                         {user.name.charAt(0).toUpperCase()}
                                       </div>
                                       {user.name}
                                     </div>
                                   </TableCell>
                                   <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                   <TableCell>
                                     <div className="flex items-center gap-2">
                                       <Badge variant="secondary" className="flex items-center gap-1">
                                         <span className="text-xs">🏆</span>
                                         {user.totalPoints} pts
                                       </Badge>
                                       {user.totalPoints > 0 && (
                                         <span className="text-xs text-muted-foreground">
                                           {user.totalPoints === 1 ? '1 ponto' : `${user.totalPoints} pontos`}
                                         </span>
                                       )}
                                     </div>
                                   </TableCell>
                                   <TableCell>
                                     <Badge variant={
                                       index === 0 ? 'default' :
                                       index < 3 ? 'secondary' :
                                       index < 10 ? 'outline' : 'destructive'
                                     } className="flex items-center gap-1">
                                       <span className="text-xs">
                                         {index === 0 ? '🥇' : index < 3 ? '🏅' : index < 10 ? '🎯' : '📊'}
                                       </span>
                                       {index === 0 ? 'Líder' : index < 3 ? 'Top 3' : index < 10 ? 'Top 10' : 'Geral'}
                                     </Badge>
                                   </TableCell>
                                 </TableRow>
                               ))}
                           </TableBody>
                         </Table>
                         
                         {users.filter(u => u.role === 'DESBRAVADOR').length === 0 && (
                           <div className="text-center py-12 text-muted-foreground">
                             <div className="text-4xl mb-3">🏆</div>
                             <p className="text-lg font-medium mb-2">Nenhum desbravador registrado</p>
                             <p className="text-sm">Cadastre desbravadores para começar o ranking!</p>
                           </div>
                         )}
                       </div>
                     </CardContent>
                   </Card>
                 </TabsContent>

                                 <TabsContent value="reports" className="space-y-6 min-h-[800px]">
                   {/* Cards de Estatísticas de Relatórios */}
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <span className="text-xl">📊</span>
                         Estatísticas de Relatórios
                       </CardTitle>
                       <CardDescription>
                         Visão geral dos dados disponíveis para exportação
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                         <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">📄</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-blue-700">
                                   Total de Registros
                                 </dt>
                                 <dd className="text-2xl font-bold text-blue-900">
                                   {users.length + activities.length + completions.length}
                                 </dd>
                                 <p className="text-xs text-blue-600 mt-1">
                                   Dados disponíveis
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">📊</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-green-700">
                                   Tipos de Relatório
                                 </dt>
                                 <dd className="text-2xl font-bold text-green-900">
                                   4
                                 </dd>
                                 <p className="text-xs text-green-600 mt-1">
                                   Ranking, Usuários, Atividades, Conclusões
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">📁</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-purple-700">
                                   Formatos Suportados
                                 </dt>
                                 <dd className="text-2xl font-bold text-purple-900">
                                   2
                                 </dd>
                                 <p className="text-xs text-purple-600 mt-1">
                                   PDF e Excel
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                         
                         <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                           <CardContent className="p-5">
                             <div className="flex items-center">
                               <div className="flex-shrink-0">
                                 <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                                   <span className="text-2xl">⚡</span>
                                 </div>
                               </div>
                               <div className="ml-4 flex-1">
                                 <dt className="text-sm font-medium text-orange-700">
                                   Exportações Disponíveis
                                 </dt>
                                 <dd className="text-2xl font-bold text-orange-900">
                                   8
                                 </dd>
                                 <p className="text-xs text-orange-600 mt-1">
                                   Relatórios + Períodos
                                 </p>
                               </div>
                             </div>
                           </CardContent>
                         </Card>
                       </div>
                     </CardContent>
                   </Card>

                   {/* Gráficos e Análises */}
                   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                     {/* Resumo dos Dados */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <span className="text-xl">📈</span>
                           Resumo dos Dados
                         </CardTitle>
                         <CardDescription>
                           Quantidade de registros por tipo
                         </CardDescription>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-4">
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                               <span className="font-medium text-foreground">Usuários</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="w-24 bg-muted rounded-full h-2">
                                 <div 
                                   className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                   style={{ width: `${(users.length / (users.length + activities.length + completions.length)) * 100}%` }}
                                 ></div>
                               </div>
                               <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
                                 {users.length}
                               </span>
                             </div>
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                               <span className="font-medium text-foreground">Atividades</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="w-24 bg-muted rounded-full h-2">
                                 <div 
                                   className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                   style={{ width: `${(activities.length / (users.length + activities.length + completions.length)) * 100}%` }}
                                 ></div>
                               </div>
                               <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
                                 {activities.length}
                               </span>
                             </div>
                           </div>
                           
                           <div className="flex items-center justify-between">
                             <div className="flex items-center gap-2">
                               <div className="w-4 h-4 bg-purple-500 rounded-full"></div>
                               <span className="font-medium text-foreground">Conclusões</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <div className="w-24 bg-muted rounded-full h-2">
                                 <div 
                                   className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                   style={{ width: `${(completions.length / (users.length + activities.length + completions.length)) * 100}%` }}
                                 ></div>
                               </div>
                               <span className="text-sm font-medium text-muted-foreground min-w-[3rem] text-right">
                                 {completions.length}
                               </span>
                             </div>
                           </div>
                         </div>
                       </CardContent>
                     </Card>

                     {/* Períodos de Ranking */}
                     <Card>
                       <CardHeader>
                         <CardTitle className="flex items-center gap-2">
                           <span className="text-xl">📅</span>
                           Períodos de Ranking
                         </CardTitle>
                         <CardDescription>
                           Diferentes visões temporais disponíveis
                         </CardDescription>
                       </CardHeader>
                       <CardContent>
                         <div className="space-y-3">
                           <div className="flex items-center justify-between py-2 border-b border-border/50">
                             <div className="flex items-center gap-2">
                               <span className="text-lg">📊</span>
                               <span className="font-medium text-foreground">Ranking Geral</span>
                             </div>
                             <Badge variant="outline">Disponível</Badge>
                           </div>
                           
                           <div className="flex items-center justify-between py-2 border-b border-border/50">
                             <div className="flex items-center gap-2">
                               <span className="text-lg">📅</span>
                               <span className="font-medium text-foreground">Ranking Mensal</span>
                             </div>
                             <Badge variant="outline">Disponível</Badge>
                           </div>
                           
                           <div className="flex items-center justify-between py-2">
                             <div className="flex items-center gap-2">
                               <span className="text-lg">📈</span>
                               <span className="font-medium text-foreground">Ranking Anual</span>
                             </div>
                             <Badge variant="outline">Disponível</Badge>
                           </div>
                         </div>
                       </CardContent>
                     </Card>
                   </div>

                   {/* Relatórios Disponíveis */}
                   <Card>
                     <CardHeader>
                       <CardTitle className="flex items-center gap-2">
                         <span className="text-xl">📋</span>
                         Relatórios Disponíveis
                       </CardTitle>
                       <CardDescription>
                         Gere e exporte relatórios em diferentes formatos
                       </CardDescription>
                     </CardHeader>
                     <CardContent>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {/* Ranking */}
                         <div className="space-y-4">
                           <div className="flex items-center gap-3 mb-4">
                             <h4 className="text-lg font-medium flex items-center gap-2">
                               <span className="text-lg">🥇</span>
                               Ranking
                             </h4>
                             <Badge variant="outline" className="text-sm">
                               {users.filter(u => u.role === 'DESBRAVADOR').length} desbravadores
                             </Badge>
                           </div>
                           <div className="space-y-3">
                             <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                               <div className="flex items-center gap-2">
                                 <span className="text-sm">📊</span>
                                 <span className="text-sm font-medium">Ranking Geral</span>
                               </div>
                               <div className="flex gap-2">
                                 <PDFExporter
                                   data={users.filter(u => u.role === 'DESBRAVADOR').map((user, index) => ({
                                     'Posição': index + 1,
                                     'Nome': user.name || '',
                                     'Email': user.email || '',
                                     'Pontos': user.totalPoints
                                   }))}
                                   type="ranking"
                                 />
                                 <ExcelExporter dataType="ranking" period="all" />
                               </div>
                             </div>
                             
                             <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                               <div className="flex items-center gap-2">
                                 <span className="text-sm">📅</span>
                                 <span className="text-sm font-medium">Ranking Mensal</span>
                               </div>
                               <ExcelExporter dataType="ranking" period="month" />
                             </div>
                             
                             <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                               <div className="flex items-center gap-2">
                                 <span className="text-sm">📈</span>
                                 <span className="text-sm font-medium">Ranking Anual</span>
                               </div>
                               <ExcelExporter dataType="ranking" period="year" />
                             </div>
                           </div>
                         </div>

                         {/* Usuários */}
                         <div className="space-y-4">
                           <div className="flex items-center gap-3 mb-4">
                             <h4 className="text-lg font-medium flex items-center gap-2">
                               <span className="text-lg">👥</span>
                               Usuários
                             </h4>
                             <Badge variant="outline" className="text-sm">
                               {users.length} usuários
                             </Badge>
                           </div>
                           <div className="space-y-3">
                             <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                               <div className="flex items-center gap-2">
                                 <span className="text-sm">📊</span>
                                 <span className="text-sm font-medium">Lista Completa</span>
                               </div>
                               <div className="flex gap-2">
                                 <PDFExporter
                                   data={users.map(user => ({
                                     'Nome': user.name || '',
                                     'Email': user.email || '',
                                     'Tipo': user.role === 'ADMIN' ? 'Administrador' : 'Desbravador',
                                     'Pontos': user.totalPoints
                                   }))}
                                   type="users"
                                 />
                                 <ExcelExporter dataType="users" />
                               </div>
                             </div>
                           </div>
                         </div>

                         {/* Atividades */}
                         <div className="space-y-4">
                           <div className="flex items-center gap-3 mb-4">
                             <h4 className="text-lg font-medium flex items-center gap-2">
                               <span className="text-lg">📋</span>
                               Atividades
                             </h4>
                             <Badge variant="outline" className="text-sm">
                               {activities.length} atividades
                             </Badge>
                           </div>
                           <div className="space-y-3">
                             <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                               <div className="flex items-center gap-2">
                                 <span className="text-sm">📊</span>
                                 <span className="text-sm font-medium">Catálogo Completo</span>
                               </div>
                               <div className="flex gap-2">
                                 <PDFExporter
                                   data={activities.map(activity => ({
                                     'Nome': activity.name,
                                     'Descrição': activity.description || '',
                                     'Pontos': activity.points,
                                     'Categoria': activity.category
                                   }))}
                                   type="activities"
                                 />
                                 <ExcelExporter dataType="activities" />
                               </div>
                             </div>
                           </div>
                         </div>

                         {/* Conclusões */}
                         <div className="space-y-4">
                           <div className="flex items-center gap-3 mb-4">
                             <h4 className="text-lg font-medium flex items-center gap-2">
                               <span className="text-lg">✅</span>
                               Conclusões
                             </h4>
                             <Badge variant="outline" className="text-sm">
                               {completions.length} conclusões
                             </Badge>
                           </div>
                           <div className="space-y-3">
                             <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                               <div className="flex items-center gap-2">
                                 <span className="text-sm">📊</span>
                                 <span className="text-sm font-medium">Histórico Completo</span>
                               </div>
                               <div className="flex gap-2">
                                 <PDFExporter
                                   data={completions.map(completion => ({
                                     'Desbravador': completion.userName,
                                     'Atividade': completion.activityName,
                                     'Pontos': completion.pointsAwarded,
                                     'Data': new Date(completion.completedAt).toLocaleDateString('pt-BR')
                                   }))}
                                   type="completions"
                                 />
                                 <ExcelExporter dataType="completions" />
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                     </CardContent>
                   </Card>
                 </TabsContent>
              </div>
            </main>
          </Tabs>
        </div>
      </div>
    </div>
  )
}