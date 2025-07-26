// CSS 유틸리티 함수들과 상수들

// 테마 색상 타입 정의
export interface ThemeColors {
  outerContainer: string;
  gridContainer: string;
  centerBlock: string;
  inactiveBlock: string;
  activeBackdrop: string;
  inactiveShadow: string;
  activeShadow: string;
  inactiveInnerShadow: string;
}

// 테마별 색상 반환 함수
export const getThemeColors = (isDarkMode: boolean): ThemeColors => {
  if (isDarkMode) {
    return {
      outerContainer: "#1a1a1a",
      gridContainer: "#111111",
      centerBlock: "#111111",
      inactiveBlock: "#1e1e1e",
      activeBackdrop: "rgba(30,30,30,0.2)",
      inactiveShadow: "rgba(0,0,0,0.3)",
      activeShadow: "rgba(255,255,255,0.1)",
      inactiveInnerShadow: "rgba(255,255,255,0.2)",
    };
  } else {
    return {
      outerContainer: "#D4D4D8",
      gridContainer: "#D4D4D8",
      centerBlock: "#D4D4D8",
      inactiveBlock: "#E4E4E7",
      activeBackdrop: "rgba(212,212,216,0.1)",
      inactiveShadow: "rgba(0,0,0,0.1)",
      activeShadow: "rgba(0,0,0,0.05)",
      inactiveInnerShadow: "rgba(255,255,255,0.75)",
    };
  }
};

// 그리드 영역 반환 함수
export const getGridArea = (row: number, col: number): string => 
  `[grid-area:${row}_/_${col}]`;

// 모서리 반지름 반환 함수 (5x5 그리드 기준)
export const getCornerRadius = (row: number, col: number): string => {
  if (row === 1 && col === 1)
    return "rounded-bl-[12px] rounded-br-[12px] rounded-tl-[22px] rounded-tr-[12px]";
  if (row === 1 && col === 5)
    return "rounded-bl-[12px] rounded-br-[12px] rounded-tl-[12px] rounded-tr-[22px]";
  if (row === 5 && col === 1)
    return "rounded-bl-[22px] rounded-br-[12px] rounded-tl-[12px] rounded-tr-[12px]";
  if (row === 5 && col === 5)
    return "rounded-bl-[12px] rounded-br-[22px] rounded-tl-[12px] rounded-tr-[12px]";
  return "rounded-xl";
};

// 커스터마이즈 가능한 모서리 반지름 함수
export const getCustomCornerRadius = (
  row: number, 
  col: number, 
  maxRow: number, 
  maxCol: number,
  defaultRadius: string = "rounded-xl",
  cornerRadius: string = "22px",
  edgeRadius: string = "12px"
): string => {
  // 좌상단 모서리
  if (row === 1 && col === 1)
    return `rounded-bl-[${edgeRadius}] rounded-br-[${edgeRadius}] rounded-tl-[${cornerRadius}] rounded-tr-[${edgeRadius}]`;
  // 우상단 모서리
  if (row === 1 && col === maxCol)
    return `rounded-bl-[${edgeRadius}] rounded-br-[${edgeRadius}] rounded-tl-[${edgeRadius}] rounded-tr-[${cornerRadius}]`;
  // 좌하단 모서리
  if (row === maxRow && col === 1)
    return `rounded-bl-[${cornerRadius}] rounded-br-[${edgeRadius}] rounded-tl-[${edgeRadius}] rounded-tr-[${edgeRadius}]`;
  // 우하단 모서리
  if (row === maxRow && col === maxCol)
    return `rounded-bl-[${edgeRadius}] rounded-br-[${cornerRadius}] rounded-tl-[${edgeRadius}] rounded-tr-[${edgeRadius}]`;
  
  return defaultRadius;
};

// SVG 그래디언트 상수들
export const GRADIENTS = {
  // 블루 방사형 그래디언트 (활성화 상태용)
  radialBlue: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 86 93\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(-2.6606e-15 3.5982 -4.2735 1.0159e-14 43 46.5)\\'><stop stop-color=\\'rgba(0,102,255,1)\\' offset=\\'0.52\\'/><stop stop-color=\\'rgba(0,102,255,0.5)\\' offset=\\'1\\'/></radialGradient></defs></svg>')",
  
  // 컬러풀 그래디언트 (활성화 상태 배경용)
  colorfulRadial: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 84 84\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'.5\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(1.0273e-15 4.1377 -4.1377 -2.2975e-15 42 61.131)\\'><stop stop-color=\\'rgba(255,255,255,0)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(255,255,255,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>'), url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 84 84\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'1\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(2.5718e-16 4.2 -4.2 2.5718e-16 42 42)\\'><stop stop-color=\\'rgba(220,160,255,1)\\' offset=\\'0.5\\'/><stop stop-color=\\'rgba(159,160,255,1)\\' offset=\\'0.67788\\'/><stop stop-color=\\'rgba(97,160,255,1)\\' offset=\\'0.85577\\'/></radialGradient></defs></svg>')"
} as const;

// 커스텀 그래디언트 생성 함수
export const createRadialGradient = (
  colors: { color: string; offset: string }[],
  opacity: number = 1,
  viewBox: string = "0 0 84 84"
): string => {
  const stops = colors
    .map(({ color, offset }) => `<stop stop-color='${color}' offset='${offset}'/>`)
    .join('');
  
  return `url('data:image/svg+xml;utf8,<svg viewBox='${viewBox}' xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none'><rect x='0' y='0' height='100%' width='100%' fill='url(%23grad)' opacity='${opacity}'/><defs><radialGradient id='grad' gradientUnits='userSpaceOnUse' cx='0' cy='0' r='10' gradientTransform='matrix(2.5718e-16 4.2 -4.2 2.5718e-16 42 42)'>${stops}</radialGradient></defs></svg>')`;
};

// 공통 트랜지션 클래스
export const TRANSITIONS = {
  default: "transition-all duration-200",
  colors: "transition-colors duration-300",
  fast: "transition-all duration-100",
  slow: "transition-all duration-500",
} as const;

// 공통 그림자 스타일
export const SHADOWS = {
  light: {
    inactive: "0px 1px 2px 0px rgba(0,0,0,0.1)",
    active: "0px 1px 2px 0px rgba(0,0,0,0.05)",
    inactiveInner: "0px 1px 2px 0px inset rgba(255,255,255,0.75)",
    activeInner: "0px 1px 2px 1px inset rgba(0,0,0,0.05)",
  },
  dark: {
    inactive: "0px 1px 2px 0px rgba(0,0,0,0.3)",
    active: "0px 1px 2px 1px inset rgba(255,255,255,0.1)",
    inactiveInner: "0px 1px 2px 0px inset rgba(255,255,255,0.2)",
    activeInner: "0px 1px 2px 1px inset rgba(255,255,255,0.1)",
  }
} as const;

// 그림자 스타일 반환 함수
export const getShadowStyles = (isDarkMode: boolean) => {
  return isDarkMode ? SHADOWS.dark : SHADOWS.light;
};

// 반응형 컨테이너 라운드 스타일 반환 함수
export const getResponsiveContainerRounding = (isMobile: boolean): string => {
  return isMobile ? "rounded-0" : "rounded-[30px]";
};

// 반응형 그리드 컨테이너 라운드 스타일 반환 함수  
export const getResponsiveGridRounding = (isMobile: boolean): string => {
  return isMobile ? "rounded-0" : "rounded-[30px]";
}; 