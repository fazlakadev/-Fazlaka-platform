/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
  serverExternalPackages: ['bcryptjs'],
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/prisma', './node_modules/.prisma'],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Service-Worker-Allowed', value: '/' }]
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization,Cookie,Accept' },
        ]
      }
    ]
  }
}

module.exports = nextConfig
