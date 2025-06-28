import type { NextConfig } from "next";

// GitHub Pages 여부 확인 (더 간단한 조건)
const isGitHubPages = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // GitHub Pages 설정
  ...(isGitHubPages ? {
    output: 'export',
    trailingSlash: true,
    basePath: '/bookshelf',
    assetPrefix: '/bookshelf/',
    images: {
      unoptimized: true
    }
  } : {}),
  webpack: (config) => {
    // 캔버스 지원 설정 추가
    config.externals.push({
      canvas: 'canvas',
    });

    // WebGPU 관련 future 플래그 설정
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
    };

    return config;
  },
};

export default nextConfig;
