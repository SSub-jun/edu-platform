/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  trailingSlash: false,
  poweredByHeader: false,
  env: {
    NEXT_PUBLIC_PORTAL_API_URL: process.env.NEXT_PUBLIC_PORTAL_API_URL || 'https://portal-api-253826414567.asia-northeast3.run.app',
  },
}

module.exports = nextConfig




