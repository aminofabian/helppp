/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['sangw.in', 'localhost', 'picsum.photos', 'lh3.googleusercontent.com'] // <== Domain name
  }
};

export default nextConfig;
