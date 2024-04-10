/** @type {import('next').NextConfig} */



const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,

  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'sangw.in',
        pathname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'avatar.vercel.sh',
        pathname: '**',
      },

      {
        protocol: 'https',
        hostname: 'utfs.io',
        pathname: '**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '**',
        port: '',
      },
    ],
  }
};


export default nextConfig;
