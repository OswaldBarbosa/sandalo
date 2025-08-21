import { verifyPassword } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

export const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Senha', type: 'password' }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                })

                if (!user || !user.passwordHash) {
                    return null
                }

                const isValidPassword = await verifyPassword(credentials.password, user.passwordHash)

                if (!isValidPassword) {
                    return null
                }

                const userData = {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                }

                return userData
            }
        })
    ],
    session: {
        strategy: 'jwt' as const
    },
    callbacks: {
        async jwt({ token, user }: { token: { role?: string; id?: string }; user: { role: string; id: string } | null }) {
            if (user) {
                token.role = user.role
                token.id = user.id
            }
            return token
        },
        async session({ session, token }: { session: { user?: { id: string; role: string } }; token: { role?: string; id?: string } }) {
            if (token) {
                // Garantir que o session.user existe
                if (!session.user) {
                    session.user = {
                        id: '',
                        role: 'DESBRAVADOR'
                    }
                }

                session.user.id = token.id as string
                session.user.role = token.role as 'ADMIN' | 'DESBRAVADOR'
            }
            return session
        }
    },
    pages: {
        signIn: '/login'
    },
    secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

