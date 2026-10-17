/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Enable Next.js/Vercel image optimization instead of serving full-size PNGs.
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
