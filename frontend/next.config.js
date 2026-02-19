/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  // Silence the workspace root warning from having two package-lock.json files
  output: undefined,
  experimental: {
    outputFileTracingRoot: require('path').join(__dirname, '../../'),
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    // These are Node-only packages used by pino/WalletConnect logger — exclude from browser bundle
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
};

module.exports = nextConfig;
