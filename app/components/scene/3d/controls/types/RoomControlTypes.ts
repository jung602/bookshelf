export interface RoomParams {
  wallHeight: number
  customGrid: boolean[][]  // 5x5 격자 패턴
}

export interface PresetPattern {
  title: string
  action: () => void
} 