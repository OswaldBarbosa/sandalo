'use client'

import { PointsChart } from '@/components/charts/PointsChart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

interface Activity {
  id: string
  name: string
  description: string
  points: number
  category: string
  dueDate?: string
}

interface Completion {
  id: string
  activityId: string
  activityName: string
  pointsAwarded: number
  completedAt: string
  note?: string
}

interface RankingEntry {
  position: number
  name: string
  points: number
}

export default function UserPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [activities, setActivities] = useState<Activity[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [ranking, setRanking] = useState<RankingEntry[]>([])
  const [userStats, setUserStats] = useState({
    totalPoints: 0,
    completedActivities: 0,
    memberSince: ''
  })

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
    } else if (session.user.role === 'ADMIN') {
      router.push('/admin')
    }
  }, [session, status, router])

  const fetchUserData = useCallback(async () => {
    try {
      // Fetch available activities
      const activitiesResponse = await fetch('/api/activities')
      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData.activities || [])
      }

      // Fetch user completions
      const completionsResponse = await fetch(`/api/completions?userId=${session?.user.id}`)
      if (completionsResponse.ok) {
        const completionsData = await completionsResponse.json()

        console.log('Completions data received:', completionsData)

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
          activityName: completion.activity?.name || 'N/A',
          pointsAwarded: completion.pointsAwarded,
          completedAt: completion.completedAt,
          note: completion.note
        })) || []

        console.log('Mapped completions:', mappedCompletions)

        setCompletions(mappedCompletions)

        // Calculate user stats
        const totalPoints = mappedCompletions.reduce((sum: number, comp: Completion) => sum + comp.pointsAwarded, 0)
        const completedActivities = mappedCompletions.length

        setUserStats({
          totalPoints,
          completedActivities,
          memberSince: new Date().toISOString()
        })
      }

      // Fetch ranking
      const rankingResponse = await fetch('/api/ranking?period=all')
      if (rankingResponse.ok) {
        const rankingData = await rankingResponse.json()

        console.log('Ranking data received:', rankingData)

        // Mapear os dados do ranking para o formato esperado
        const mappedRanking = rankingData.ranking?.map((entry: {
          position: number
          name: string
          totalPoints: number
        }) => ({
          position: entry.position,
          name: entry.name,
          points: entry.totalPoints || 0
        })) || []

        console.log('Mapped ranking:', mappedRanking)

        setRanking(mappedRanking)
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error)
    }
  }, [session])

  useEffect(() => {
    if (session?.user.role === 'DESBRAVADOR') {
      fetchUserData()
    }
  }, [session, activeTab, fetchUserData])

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

  if (!session || session.user.role === 'ADMIN') {
    return null
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' })
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
                <span className="text-xl text-white font-bold">🌿</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Sândalo
                </h1>
                <p className="text-sm text-muted-foreground">Área do Desbravador</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Bem-vindo,</p>
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

      {/* Navigation */}
      <div className="relative z-10 bg-white/80 backdrop-blur-sm shadow-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm border border-white/20 shadow-lg">
              <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                👤 Meu Perfil
              </TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                ✅ Minhas Atividades
              </TabsTrigger>
              <TabsTrigger value="ranking" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                🏆 Ranking
              </TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200">
                📚 Histórico
              </TabsTrigger>
            </TabsList>

            {/* Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              <div className="px-4 py-6 sm:px-0">
                <TabsContent value="profile" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Meu Perfil</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="text-2xl">🏆</div>
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-primary truncate">
                                    Pontos Totais
                                  </dt>
                                  <dd className="text-lg font-medium text-primary">
                                    {userStats.totalPoints}
                                  </dd>
                                </dl>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card className="bg-secondary/5 border-secondary/20">
                          <CardContent className="p-5">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="text-2xl">✅</div>
                              </div>
                              <div className="ml-5 w-0 flex-1">
                                <dl>
                                  <dt className="text-sm font-medium text-secondary-foreground truncate">
                                    Atividades Concluídas
                                  </dt>
                                  <dd className="text-lg font-medium text-secondary-foreground">
                                    {userStats.completedActivities}
                                  </dd>
                                </dl>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="mt-6">
                        <h4 className="text-md font-medium text-foreground mb-3">
                          Informações Pessoais
                        </h4>
                        <div className="bg-muted rounded-lg p-4">
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Nome</dt>
                              <dd className="mt-1 text-sm text-foreground">
                                {session.user.name || 'Não informado'}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
                              <dd className="mt-1 text-sm text-foreground">
                                {session.user.email}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Tipo de Conta</dt>
                              <dd className="mt-1 text-sm text-foreground">
                                Desbravador
                              </dd>
                            </div>
                            <div>
                              <dt className="text-sm font-medium text-muted-foreground">Membro desde</dt>
                              <dd className="mt-1 text-sm text-foreground">
                                {userStats.memberSince ? new Date(userStats.memberSince).toLocaleDateString('pt-BR') : '--'}
                              </dd>
                            </div>
                          </dl>
                        </div>
                      </div>

                      {/* Gráfico de evolução de pontos */}
                      <div className="mt-6">
                        <PointsChart
                          completions={completions}
                          title="Evolução dos Meus Pontos"
                          description="Acompanhe seu progresso ao longo do tempo"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="activities" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Atividades Disponíveis</CardTitle>
                      <CardDescription>
                        Visualize todas as atividades disponíveis para você.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {activities.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Atividade</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Pontos</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Data Limite</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {activities.map((activity) => {
                                const isCompleted = completions.some(comp => comp.activityId === activity.id)
                                console.log(`Activity ${activity.name} (${activity.id}): isCompleted = ${isCompleted}`)
                                return (
                                  <TableRow key={activity.id}>
                                    <TableCell className="font-medium">{activity.name}</TableCell>
                                    <TableCell>{activity.description}</TableCell>
                                    <TableCell>{activity.points}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{activity.category}</Badge>
                                    </TableCell>
                                    <TableCell>
                                      {activity.dueDate
                                        ? new Date(activity.dueDate).toLocaleDateString('pt-BR')
                                        : 'Sem prazo'
                                      }
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={isCompleted ? 'default' : 'secondary'}>
                                        {isCompleted ? 'Concluída' : 'Pendente'}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <div className="text-4xl mb-2">📋</div>
                          <p>Nenhuma atividade disponível no momento.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="ranking" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Ranking Geral</CardTitle>
                      <CardDescription>
                        Veja sua posição no ranking geral dos desbravadores.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ranking.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Posição</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Pontos</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {ranking.map((entry) => (
                                <TableRow
                                  key={entry.position}
                                  className={entry.name === session.user.name ? 'bg-primary/5' : ''}
                                >
                                  <TableCell className="font-medium">
                                    {entry.position}º
                                  </TableCell>
                                  <TableCell className="font-medium">
                                    {entry.name}
                                    {entry.name === session.user.name && (
                                      <Badge variant="default" className="ml-2">Você</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="secondary">{entry.points} pts</Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <div className="text-4xl mb-2">🏆</div>
                          <p>Ranking em desenvolvimento.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Histórico de Atividades</CardTitle>
                      <CardDescription>
                        Acompanhe todas as atividades que você já concluiu.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {completions.length > 0 ? (
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Atividade</TableHead>
                                <TableHead>Pontos Ganhos</TableHead>
                                <TableHead>Data de Conclusão</TableHead>
                                <TableHead>Observação</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {completions.map((completion) => (
                                <TableRow key={completion.id}>
                                  <TableCell className="font-medium">
                                    {completion.activityName || 'Nome não disponível'}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="default">{completion.pointsAwarded} pts</Badge>
                                  </TableCell>
                                  <TableCell>
                                    {new Date(completion.completedAt).toLocaleDateString('pt-BR')}
                                  </TableCell>
                                  <TableCell>{completion.note || '-'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground py-8">
                          <div className="text-4xl mb-2">📚</div>
                          <p>Nenhuma atividade concluída ainda.</p>
                        </div>
                      )}
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
