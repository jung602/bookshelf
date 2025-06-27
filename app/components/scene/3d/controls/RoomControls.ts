import { BasePanel } from './base/BasePanel'
import { SLIDER_THUMB_CSS } from './styles/RoomControlsStyles'
import { GridPatterns } from './patterns/GridPatterns'
import { GridComponent } from './components/GridComponent'
import type { RoomParams } from './types/RoomControlTypes'

export type { RoomParams }

export class RoomControls extends BasePanel<RoomParams> {
  private gridComponent: GridComponent | null = null
  private heightSlider: HTMLInputElement | null = null
  
  constructor(
    initialParams: RoomParams,
    onParamsChange: (params: Partial<RoomParams>) => void,
    addToDOM: boolean = true
  ) {
    // 중앙 타일 보장
    const safeParams = { ...initialParams }
    if (!Array.isArray(safeParams.customGrid)) {
      safeParams.customGrid = GridPatterns.createEmptyGrid()
    }
    GridPatterns.ensureCenterTile(safeParams.customGrid)

    super(
      safeParams,
      onParamsChange,
      {
        title: 'Room',
        iconSrc: '/icons/grid.svg',
        isOpen: true
      },
      addToDOM
    )
  }

  protected createContent(): void {
    if (!this.panelContent) return
    
    this.createHeightSlider()
    this.createGrid()
    this.createPresetButtons()
  }

  private createHeightSlider(): void {
    if (!this.panelContent) return
    
    // 섹션 컨테이너
    const section = document.createElement('div')
    Object.assign(section.style, {
      marginBottom: '16px',
      padding: '8px'
    })
    
    // 타이틀
    const titleElement = document.createElement('div')
    titleElement.textContent = 'Walls'
    Object.assign(titleElement.style, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: '8px',
      fontFamily: '"W95FA", "MS Sans Serif", sans-serif'
    })
    section.appendChild(titleElement)

    // 높이 슬라이더
    this.heightSlider = document.createElement('input')
    this.heightSlider.type = 'range'
    this.heightSlider.min = '1'
    this.heightSlider.max = '5'
    this.heightSlider.step = '1'
    this.heightSlider.value = this.params.wallHeight.toString()
    Object.assign(this.heightSlider.style, {
      width: '100%',
      height: '24px',
      borderRadius: '0px',
      background: '#FFFFFF',
      boxShadow: 'inset -1px -1px  rgba(38, 38, 38, 1), inset 1px 1px rgba(255, 255, 255, 0.8), inset -2px -2px rgba(126, 126, 126, 1)',
      outline: 'none',
      cursor: 'pointer',
      margin: '0 0 16px 0',
      WebkitAppearance: 'none',
      MozAppearance: 'none',
      appearance: 'none',
      padding: '4px'
    })
    
    // 슬라이더 핸들 스타일 추가
    this.addSliderThumbStyles()
    
    this.heightSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      this.updateParams({ wallHeight: value })
    })

    section.appendChild(this.heightSlider)
    this.panelContent.appendChild(section)
  }

  private addSliderThumbStyles(): void {
    if (document.getElementById('slider-thumb-styles')) return
    
    const style = document.createElement('style')
    style.id = 'slider-thumb-styles'
    style.textContent = SLIDER_THUMB_CSS
    document.head.appendChild(style)
  }

  private createGrid(): void {
    if (!this.panelContent) return
    
    // 섹션 컨테이너
    const section = document.createElement('div')
    Object.assign(section.style, {
      marginBottom: '16px',
      padding: '8px'
    })
    
    // 타이틀
    const titleElement = document.createElement('div')
    titleElement.textContent = 'Floors'
    Object.assign(titleElement.style, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: '8px',
      fontFamily: '"W95FA", "MS Sans Serif", sans-serif'
    })
    section.appendChild(titleElement)

    // GridComponent 사용
    this.gridComponent = new GridComponent(
      section,
      this.params.customGrid,
      (newGrid) => {
        this.updateParams({ customGrid: newGrid })
      }
    )
    
    const gridContainer = this.gridComponent.create()
    section.appendChild(gridContainer)
    this.panelContent.appendChild(section)
  }

  private createPresetButtons(): void {
    if (!this.panelContent) return
    
    // 섹션 컨테이너
    const section = document.createElement('div')
    Object.assign(section.style, {
      padding: '8px'
    })
    
    // 타이틀
    const titleElement = document.createElement('div')
    titleElement.textContent = 'Shapes'
    Object.assign(titleElement.style, {
      fontSize: '12px',
      fontWeight: 'bold',
      color: '#000000',
      marginBottom: '8px',
      fontFamily: '"W95FA", "MS Sans Serif", sans-serif'
    })
    section.appendChild(titleElement)
    
    // 프리셋 버튼 컨테이너
    const presetsContainer = document.createElement('div')
    Object.assign(presetsContainer.style, {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '4px',
      width: '100%',
      padding: '4px',
      background: '#C0C0C0',
      border: '1px solid rgba(0, 0, 0, 1)',
      boxShadow: 'inset -1px -1px  rgba(38, 38, 38, 1), inset 1px 1px rgba(255, 255, 255, 0.8), inset -2px -2px rgba(126, 126, 126, 1)'
    })
    
    const presets = [
      { icon: 'preA.svg', action: () => this.applyPattern(GridPatterns.createFullPattern()) },
      { icon: 'preB.svg', action: () => this.applyPattern(GridPatterns.createLPattern()) },
      { icon: 'preC.svg', action: () => this.applyPattern(GridPatterns.createReverseLPattern()) },
      { icon: 'PreD.svg', action: () => this.applyPattern(GridPatterns.createTPattern()) },
      { icon: 'preE.svg', action: () => this.applyPattern(GridPatterns.createCompactCrossPattern()) }
    ]
    
    presets.forEach(preset => {
      const button = this.createIconPresetButton(preset.icon, preset.action)
      presetsContainer.appendChild(button)
    })
    
    section.appendChild(presetsContainer)
    this.panelContent.appendChild(section)
  }

  private createIconPresetButton(iconFileName: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button')
    Object.assign(button.style, {
      width: '100%',
      aspectRatio: '1',
      border: 'none',
      background: '#C0C0C0',
      cursor: 'pointer',
      padding: '2px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'none',
      boxShadow: 'inset -2px -2px rgba(126, 126, 126, 1), inset 2px 2px rgba(240, 240, 240, 1), inset 2px 2px rgba(179, 179, 179, 1)'
    })

    const iconImg = document.createElement('img')
    iconImg.src = `/icons/presets/${iconFileName}`
    Object.assign(iconImg.style, {
      width: '16px',
      height: '16px',
      imageRendering: 'pixelated',
      filter: 'none'
    })
    button.appendChild(iconImg)
    
    button.addEventListener('mouseenter', () => {
      button.style.boxShadow = 'inset -2px -2px rgba(126, 126, 126, 1), inset 2px 2px rgba(240, 240, 240, 1)'
    })
    
    button.addEventListener('mouseleave', () => {
      button.style.boxShadow = 'inset -2px -2px rgba(126, 126, 126, 1), inset 2px 2px rgba(240, 240, 240, 1), inset 2px 2px rgba(179, 179, 179, 1)'
    })
    
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      action()
    })

    return button
  }

  private applyPattern(pattern: boolean[][]): void {
    this.gridComponent?.updateGrid(pattern)
    this.updateParams({ customGrid: pattern })
  }

  public override updateParams(params: Partial<RoomParams>): void {
    super.updateParams(params)
    
    // 높이 슬라이더 업데이트
    if (params.wallHeight !== undefined && this.heightSlider) {
      this.heightSlider.value = params.wallHeight.toString()
    }
    
    // 그리드 업데이트
    if (params.customGrid !== undefined && this.gridComponent) {
      this.gridComponent.updateGrid(params.customGrid)
    }
  }

  public override dispose(): void {
    this.gridComponent?.dispose()
    this.gridComponent = null
    this.heightSlider = null
    super.dispose()
  }
} 