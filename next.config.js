/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Enable standalone output for Docker deployment
  output: 'standalone',
  
  webpack: (config, { isServer }) => {
    // Fix for Monaco Editor and Yjs in Next.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    
    // Prevent Yjs from being bundled multiple times
    config.resolve.alias = {
      ...config.resolve.alias,
      yjs: require.resolve('yjs'),
    };
    
    return config;
  },
  // Server Actions are now stable in Next.js 14 - no experimental flag needed
};

module.exports = nextConfig;
