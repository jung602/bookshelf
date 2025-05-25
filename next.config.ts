import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
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
