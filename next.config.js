// Принудительно загружаем переменные из .env для перекрытия системных
require('dotenv').config({ override: true })

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client')
    }
    return config
  },
  
  // Environment variables validation
  env: {
    // Ensure DATABASE_URL is available at build time
    DATABASE_URL: process.env.DATABASE_URL,
  },
  
  // Output configuration
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: ['localhost'],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig