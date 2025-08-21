import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface User {
    role: 'ADMIN' | 'DESBRAVADOR'
  }
  
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: 'ADMIN' | 'DESBRAVADOR'
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role: 'ADMIN' | 'DESBRAVADOR'
  }
}
