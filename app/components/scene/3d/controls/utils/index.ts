export * from './ButtonFactory';
export * from './ButtonStateManager';
export * from './ColorPaletteUtils';
export * from './UIUtils';

/**
 * 환경에 맞는 정적 리소스 경로를 생성합니다.
 * 개발 모드에서는 절대 경로, GitHub Pages에서는 basePath를 포함한 경로를 반환합니다.
 */
export function getAssetPath(path: string): string {
  // 이미 절대 경로인 경우 그대로 반환
  if (path.startsWith('http')) {
    return path;
  }
  
  // 개발 모드에서는 절대 경로 그대로 사용
  if (process.env.NODE_ENV === 'development') {
    return path;
  }
  
  // 프로덕션 모드 (GitHub Pages)에서는 basePath 추가
  const basePath = '/bookshelf';
  return `${basePath}${path}`;
} 