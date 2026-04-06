import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const emptyModule = require.resolve('./lib/empty-module.js');

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config) {
    // Stub out optional peer deps of starkzap that aren't needed by this app
    config.resolve.alias = {
      ...config.resolve.alias,
      '@hyperlane-xyz/sdk': emptyModule,
      '@hyperlane-xyz/registry': emptyModule,
      '@hyperlane-xyz/utils': emptyModule,
      '@fatsolutions/tongo-sdk': emptyModule,
      '@solana/web3.js': emptyModule,
      '@cartridge/controller': emptyModule,
      '@farcaster/mini-app-solana': emptyModule,
    };
    return config;
  },
};

export default nextConfig;
