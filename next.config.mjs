/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // allow embedding pdfs or external assets if needed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
