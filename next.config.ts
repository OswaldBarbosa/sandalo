/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'bcrypt'],
  images: {
    domains: ['localhost']
  },
  // Otimizações para produção
  compress: true,
  poweredByHeader: false,
  generateEtags: false
}

module.exports = nextConfig
