import { BasePanel, PanelConfig } from './base/BasePanel'

export interface StyleParams {
  wallColor: string
  floorColor: string
}

export class StyleControls extends BasePanel<StyleParams> {
  private wallColorInput: HTMLInputElement | null = null
  private floorColorInput: HTMLInputElement | null = null
  
  constructor(
    initialParams: StyleParams,
    onParamsChange: (params: Partial<StyleParams>) => void,
    addToDOM: boolean = true
  ) {
    const config: PanelConfig = {
      title: 'Style',
      iconSrc: '/icons/style.png',
      isOpen: false,
      addToDOM
    }
    
    super(initialParams, onParamsChange, config, addToDOM)
  }

  protected createContent(): void {
    if (!this.panelContent) return
    
    this.createColorInputs()
  }

  protected applyCustomStyles(): void {
    if (!this.container) return
    
    // Style 패널의 특별한 위치 설정 (화면 하단 중앙)
    this.container.style.bottom = '80px'
    this.container.style.left = '50%'
    this.container.style.transform = 'translateX(-50%)'
    this.container.style.right = 'auto'
    this.container.style.top = 'auto'
  }

  private createColorInputs(): void {
    if (!this.panelContent) return

    // Wall Color 섹션
    this.createWallColorSection()
    
    // Floor Color 섹션  
    this.createFloorColorSection()
  }

  private createWallColorSection(): void {
    if (!this.panelContent) return

    const wallSection = document.createElement('div')
    wallSection.style.marginBottom = '12px'
    
    const wallLabel = document.createElement('label')
    wallLabel.textContent = 'Wall Color:'
    wallLabel.style.display = 'block'
    wallLabel.style.marginBottom = '4px'
    wallLabel.style.fontSize = '12px'
    wallLabel.style.fontWeight = 'bold'
    
    this.wallColorInput = document.createElement('input')
    this.wallColorInput.type = 'color'
    this.wallColorInput.value = this.params.wallColor
    this.wallColorInput.style.width = '100%'
    this.wallColorInput.style.height = '28px'
    this.wallColorInput.style.border = '2px inset #C0C0C0'
    this.wallColorInput.style.cursor = 'pointer'
    
    this.wallColorInput.addEventListener('change', (e) => {
      const newColor = (e.target as HTMLInputElement).value
      this.updateParams({ wallColor: newColor })
    })
    
    wallSection.appendChild(wallLabel)
    wallSection.appendChild(this.wallColorInput)
    this.panelContent.appendChild(wallSection)
  }

  private createFloorColorSection(): void {
    if (!this.panelContent) return

    const floorSection = document.createElement('div')
    floorSection.style.marginBottom = '12px'
    
    const floorLabel = document.createElement('label')
    floorLabel.textContent = 'Floor Color:'
    floorLabel.style.display = 'block'
    floorLabel.style.marginBottom = '4px'
    floorLabel.style.fontSize = '12px'
    floorLabel.style.fontWeight = 'bold'
    
    this.floorColorInput = document.createElement('input')
    this.floorColorInput.type = 'color'
    this.floorColorInput.value = this.params.floorColor
    this.floorColorInput.style.width = '100%'
    this.floorColorInput.style.height = '28px'
    this.floorColorInput.style.border = '2px inset #C0C0C0'
    this.floorColorInput.style.cursor = 'pointer'
    
    this.floorColorInput.addEventListener('change', (e) => {
      const newColor = (e.target as HTMLInputElement).value
      this.updateParams({ floorColor: newColor })
    })
    
    floorSection.appendChild(floorLabel)
    floorSection.appendChild(this.floorColorInput)
    this.panelContent.appendChild(floorSection)
  }

  public dispose(): void {
    this.wallColorInput = null
    this.floorColorInput = null
    super.dispose()
  }
} 