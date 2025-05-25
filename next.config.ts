import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // GitHub Pages 설정은 배포시에만 적용
  ...(process.env.NODE_ENV === 'production' && process.env.GITHUB_ACTIONS ? {
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
