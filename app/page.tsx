'use client'

import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('./components/scene/Scene'), { 
  ssr: false,
  loading: () => <div className="flex h-[100dvh] w-[100dvw] items-center justify-center">로딩 중...</div>
})

export default function Home() {
  return (
    <div className="w-[100dvw] h-[100dvh] flex items-center justify-center bg-white overflow-hidden">
        <Scene />
    </div>
  );
}
