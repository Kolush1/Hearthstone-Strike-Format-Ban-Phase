/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Nécessaire pour les images statiques sur Vercel gratuit
  },
}

module.exports = nextConfig
