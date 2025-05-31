export interface ColorParams {
  wallColor: string
  floorColor: string
}

export class ColorControls {
  private params: ColorParams
  private onChange: (params: ColorParams) => void

  constructor(
    initialParams: ColorParams,
    onChange: (params: ColorParams) => void
  ) {
    this.params = { ...initialParams }
    this.onChange = onChange
  }

  public updateWallColor(color: string) {
    this.params.wallColor = color
    this.onChange(this.params)
  }

  public updateFloorColor(color: string) {
    this.params.floorColor = color
    this.onChange(this.params)
  }

  public getParams(): ColorParams {
    return { ...this.params }
  }

  public dispose() {
    // 정리 작업이 필요한 경우 여기에 추가
  }

  public static getDefaultParams(): ColorParams {
    return {
      wallColor: '#cccccc',
      floorColor: '#ffffff'
    }
  }
} 