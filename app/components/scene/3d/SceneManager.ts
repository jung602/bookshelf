import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { createLights } from './scenes/createLights'
import { createFloor } from './scenes/createFloor'
import { createWalls } from './scenes/createWalls'
import { RenderPixelatedPass, PixelationParams } from './passes/RenderPixelatedPass'
import { ModelManager } from './managers/ModelManager'
import { InteractionManager, GizmoState } from './managers/InteractionManager'
import { getModelClass } from './objects'

// 타입 정의들
export interface RoomParams {
  wallHeight: number
  customGrid: boolean[][]  // 5x5 격자 패턴
}

export interface StyleParams {
  wallColor?: string
  floorColor?: string
  [key: string]: unknown
}

export interface ColorParams {
  wallColor: string
  floorColor: string
}

export class SceneManager {
  private container: HTMLElement
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.OrthographicCamera
  private controls!: OrbitControls
  private composer!: EffectComposer
  private pixelatedPass!: RenderPixelatedPass
  private modelManager!: ModelManager
  private interactionManager!: InteractionManager
  private animationId: number | null = null
  private pixelationEnabled: boolean = true
  private roomParams: RoomParams = { 
    wallHeight: 1,
    customGrid: (() => {
      const grid = Array(5).fill(null).map(() => Array(5).fill(false))
      grid[2][2] = true // 중앙 타일은 항상 활성화
      return grid
    })()
  }
  private colorParams: ColorParams = { wallColor: '#f3f3f3', floorColor: '#ffffff' }
  private isInitialized: boolean = false
  private gizmoState: GizmoState = { selectedModelId: null, screenPosition: null }
  private onGizmoStateChange?: (gizmoState: GizmoState) => void
  private customFloorTexture?: string
  private themeObserver?: MutationObserver

  // 크기 애니메이션 관련 변수들
  private currentSize: { width: number; height: number } = { width: 0, height: 0 }
  private targetSize: { width: number; height: number } = { width: 0, height: 0 }
  private isResizing: boolean = false
  private resizeAnimationSpeed: number = 0.15 // 애니메이션 속도 (0-1)
  private currentFrustumSize: number = 10 // 현재 frustumSize
  private targetFrustumSize: number = 10 // 목표 frustumSize
  
  constructor(container: HTMLElement, onGizmoStateChange?: (gizmoState: GizmoState) => void) {
    this.container = container
    this.onGizmoStateChange = onGizmoStateChange
    this.init()
    this.initializeScene()
    this.setupPostProcessing()
    this.setupControls()
    this.setupInteraction()
    this.setupCustomTextureListener()
    this.setupThemeObserver()
    this.animate()
  }

  private async initializeScene() {
    if (this.isInitialized) return
    await this.setupScene()
    this.isInitialized = true
  }

  private init() {
    // 렌더러 설정
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: false,
      powerPreference: "high-performance",
      alpha: false // 배경색을 사용하므로 alpha를 false로 변경
    })
    
    // 컨테이너 크기 가져오기
    const containerRect = this.container.getBoundingClientRect()
    const width = containerRect.width || window.innerWidth
    const height = containerRect.height || window.innerHeight
    
    console.log(`SceneManager.init: Container size: ${width}x${height}`)
    
    // 초기 크기 설정
    this.currentSize = { width, height }
    this.targetSize = { width, height }
    
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    
    // CSS 변수에서 배경색 가져와서 설정
    this.updateBackgroundColor()
    
    this.container.appendChild(this.renderer.domElement)

    // 씬 설정
    this.scene = new THREE.Scene()
    // 씬 배경색도 CSS 변수에서 가져와서 설정
    this.updateSceneBackground()

    // 카메라 초기 설정
    this.updateCamera(width, height, 10)

    // 컨트롤 설정
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    this.controls.enableZoom = true
    this.controls.enablePan = true
    this.controls.enableRotate = true
    this.controls.rotateSpeed = 0.5
    this.controls.autoRotate = false
    this.controls.target.set(0, 1.5, 0) // 벽 높이 3의 중간인 1.5로 설정
    this.controls.update()

    // ModelManager 초기화
    this.modelManager = new ModelManager(this.scene)
  }

  private async setupScene() {
    // 조명 추가
    createLights(this.scene)

    // 바닥 추가 (격자 기반)
    createFloor(this.scene, 1, 1, this.colorParams.floorColor, this.roomParams.customGrid, this.customFloorTexture)

    // 벽들 추가 (격자 기반)
    createWalls(this.scene, 1, 1, this.roomParams.wallHeight, this.colorParams.wallColor, this.roomParams.customGrid)

    console.log('Scene setup completed')
  }

  private setupPostProcessing() {
    // EffectComposer 설정
    this.composer = new EffectComposer(this.renderer)
    
    // 픽셀화 해상도 계산 (기본값 사용)
    const defaultParams = { 
      pixelSize: 2, 
      ditherStrength: 0, 
      ditherScale: 0, 
      normalEdgeStrength: 0.15,
      useUIPalette: 0.,
      useMSPaintPalette: 0.1,
      // Unity 방식 파라미터 기본값
      depthEdgeStrength: 0.8,
      edgeThreshold: .1,
      outlineDarknessAmount: 0.15,
      useColorAwareOutline: 1.0,
      depthIndicatorStrength: 0.3,
      // 카메라 거리 기반 조절 파라미터 기본값
      cameraDistance: 10,
      edgeScaleFactor: 0.8,
      adaptiveEdgeEnabled: 0
    } as PixelationParams
    
    // 컨테이너 크기 가져오기
    const containerRect = this.container.getBoundingClientRect()
    const width = containerRect.width || window.innerWidth
    const height = containerRect.height || window.innerHeight
    
    const screenResolution = new THREE.Vector2(width, height)
    const renderResolution = screenResolution.clone().divideScalar(defaultParams.pixelSize)
    renderResolution.x = Math.floor(renderResolution.x)
    renderResolution.y = Math.floor(renderResolution.y)

    console.log(`SceneManager.setupPostProcessing: Screen resolution: ${width}x${height}, Render resolution: ${renderResolution.x}x${renderResolution.y}`)

    // 픽셀화 패스 추가
    this.pixelatedPass = new RenderPixelatedPass(renderResolution, this.scene, this.camera, defaultParams)
    this.pixelatedPass.renderToScreen = true
    this.composer.addPass(this.pixelatedPass)
    
    // 화면 해상도 업데이트
    this.pixelatedPass.updateScreenResolution(width, height)
  }

  private setupControls() {
    // 컨트롤 설정은 이제 ControlsContainer에서 관리됩니다
    // 필요한 초기화만 여기서 수행
  }

  private setupInteraction() {
    // InteractionManager 초기화
    this.interactionManager = new InteractionManager(
      this.scene,
      this.camera,
      this.renderer,
      this.modelManager,
      (gizmoState: GizmoState) => {
        console.log('SceneManager received gizmo state change:', gizmoState)
        this.gizmoState = gizmoState
        if (this.onGizmoStateChange) {
          console.log('SceneManager calling onGizmoStateChange callback')
          this.onGizmoStateChange(gizmoState)
        } else {
          console.log('SceneManager: onGizmoStateChange callback is not set')
        }
      }
    )

    // OrbitControls와 드래그 상호작용 조정
    this.setupControlsInteraction()
  }

  private setupCustomTextureListener() {
    // 커스텀 텍스처 적용 이벤트 리스너
    window.addEventListener('applyCustomTexture', (event: Event) => {
      const customEvent = event as CustomEvent<{ textureDataURL: string }>
      const { textureDataURL } = customEvent.detail
      this.customFloorTexture = textureDataURL
      
      // 바닥 재생성
      createFloor(this.scene, 1, 1, this.colorParams.floorColor, this.roomParams.customGrid, this.customFloorTexture)
      
      // 바닥 텍스처 변경은 가구 위치에 영향을 주지 않음 (메시만 교체)
      console.log('Custom texture applied to floor - no model repositioning needed')
      
      console.log('Custom texture applied to floor')
    })
    
    // 커스텀 텍스처 리셋 이벤트 리스너
    window.addEventListener('resetCustomTexture', () => {
      this.customFloorTexture = undefined
      
      // 기본 텍스처로 바닥 재생성
      createFloor(this.scene, 1, 1, this.colorParams.floorColor, this.roomParams.customGrid, this.customFloorTexture)
      
      console.log('Floor texture reset to default')
    })
    
    // 색상 리셋 이벤트 리스너
    window.addEventListener('resetColors', (event: Event) => {
      const customEvent = event as CustomEvent<{ wallColor: string; floorColor: string }>
      const { wallColor, floorColor } = customEvent.detail
      
      // 색상 파라미터 업데이트
      this.colorParams.wallColor = wallColor
      this.colorParams.floorColor = floorColor
      
      // updateColors 메서드 호출하여 3D 씬 업데이트
      this.updateColors(this.colorParams)
      
      console.log('Colors reset to default:', { wallColor, floorColor })
    })
  }

  private setupThemeObserver() {
    // 다크/라이트 모드 변경 감지를 위한 MutationObserver 설정
    this.themeObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // 클래스 변경이 감지되면 배경색과 조명 업데이트
          setTimeout(() => {
            this.updateBackgroundColor()
            this.updateSceneBackground()
            this.updateLights()
            console.log('Theme change detected, background color and lights updated')
          }, 50) // 빌드 환경에서의 안정성을 위해 약간의 지연 추가
        }
      })
    })

    // html 요소의 클래스 변경 감지
    const htmlElement = document.documentElement
    this.themeObserver.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // prefers-color-scheme 미디어 쿼리 변경 감지
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    darkModeMediaQuery.addEventListener('change', () => {
      // 시스템 테마 변경 시에도 배경색과 조명 업데이트
      setTimeout(() => {
        this.updateBackgroundColor()
        this.updateSceneBackground()
        this.updateLights()
        console.log('System theme change detected, background color and lights updated')
      }, 100) // 약간의 지연을 두어 테마가 완전히 적용된 후 실행
    })

    // 초기화 시에도 올바른 테마 적용 보장 (빌드 환경 대응)
    setTimeout(() => {
      this.updateBackgroundColor()
      this.updateSceneBackground()
      this.updateLights()
      console.log('Initial theme applied on setupThemeObserver')
    }, 100)
  }

  private updateBackgroundColor() {
    // CSS 변수 파싱 대신 테마 클래스를 직접 확인
    const isDarkMode = this.getCurrentTheme() === 'dark'
    
    // 테마에 따른 색상 설정 (CSS 변수 값과 동일)
    const color = new THREE.Color()
    if (isDarkMode) {
      // 다크 모드: oklch(0.145 0 0) ≈ 매우 어두운 회색
      color.setRGB(0.145, 0.145, 0.145)
    } else {
      // 라이트 모드: #f3f3f3
      color.setHex(0xf3f3f3)
    }
    
    // 렌더러 배경색 설정
    this.renderer.setClearColor(color)
    
    console.log('Background color updated to:', isDarkMode ? 'dark' : 'light', 'THREE.Color:', color)
  }

  private updateSceneBackground() {
    // CSS 변수 파싱 대신 테마 클래스를 직접 확인
    const isDarkMode = this.getCurrentTheme() === 'dark'
    
    if (this.scene) {
      const color = new THREE.Color()
      if (isDarkMode) {
        // 다크 모드: oklch(0.145 0 0) ≈ 매우 어두운 회색
        color.setRGB(0.145, 0.145, 0.145)
      } else {
        // 라이트 모드: #f3f3f3
        color.setHex(0xf3f3f3)
      }
      
      // 씬 배경색 설정
      this.scene.background = color
      
      console.log('Scene background color updated to:', isDarkMode ? 'dark' : 'light')
    }
  }

  private updateLights() {
    // 조명을 테마에 맞게 업데이트
    if (this.scene) {
      createLights(this.scene)
      console.log('Lights updated for theme change')
    }
  }

  public applyCustomFloorTexture(textureDataURL: string) {
    this.customFloorTexture = textureDataURL
    
    // 바닥 재생성
    createFloor(this.scene, 1, 1, this.colorParams.floorColor, this.roomParams.customGrid, this.customFloorTexture)
    
    // 바닥 텍스처 변경은 가구 위치에 영향을 주지 않음 (메시만 교체)
    console.log('Custom texture applied to floor - no model repositioning needed')
    
    console.log('Custom texture applied to floor')
  }

  private setupControlsInteraction() {
    // 드래그 상태 확인을 위한 인터벌 설정
    const checkDragState = () => {
      const dragState = this.interactionManager.getDragState()
      
      if (dragState.isDragging) {
        // 드래그 중일 때 OrbitControls 비활성화
        this.controls.enabled = false
      } else {
        // 드래그가 끝나면 OrbitControls 활성화
        this.controls.enabled = true
      }
    }

    // 주기적으로 드래그 상태 확인
    setInterval(checkDragState, 16) // 60fps
  }

  public updateRoom(params: Partial<RoomParams>) {
    // 방 파라미터 업데이트
    Object.assign(this.roomParams, params)
    
    // 바닥과 벽 다시 생성 (격자 기반)
    createFloor(this.scene, 1, 1, this.colorParams.floorColor, this.roomParams.customGrid, this.customFloorTexture)
    createWalls(this.scene, 1, 1, this.roomParams.wallHeight, this.colorParams.wallColor, this.roomParams.customGrid)
    
    // 바닥/벽 생성 완료 후 지연된 모델 재배치 (타이밍 문제 해결)
    console.log('Floor/walls updated - scheduling delayed model repositioning...')
    setTimeout(() => {
      console.log('Executing delayed model repositioning after floor/wall generation...')
      // TODO: repositionModelsAfterFloorChange 메서드 구현 필요
      // this.modelManager.repositionModelsAfterFloorChange()
    }, 100) // 100ms 지연으로 바닥/벽 생성 완료 보장
    
    // 카메라 위치 조정 (격자 크기 기반)
    const maxSize = Math.max(5, this.roomParams.wallHeight) // 5x5 격자 고정
    const cameraDistance = maxSize * 2
    this.camera.position.set(cameraDistance, cameraDistance, cameraDistance)
    // 벽의 중간 높이를 화면 중앙에 맞추기 위해 target 조정
    this.controls.target.set(0, 1.5, 0)
    this.controls.update()
  }

  // 간단한 바닥만 업데이트 (카메라 위치 유지)
  public updateFloorOnly(customGrid: boolean[][]) {
    console.log('SceneManager: Updating floor and walls, preserving camera state')
    
    // roomParams 업데이트
    this.roomParams.customGrid = customGrid
    
    // 바닥과 벽 모두 재생성 (카메라는 건드리지 않음)
    createFloor(this.scene, 1, 1, this.colorParams.floorColor, this.roomParams.customGrid, this.customFloorTexture)
    createWalls(this.scene, 1, 1, this.roomParams.wallHeight, this.colorParams.wallColor, this.roomParams.customGrid)
    
    // 바닥 생성 완료 후 지연된 모델 재배치 (타이밍 문제 해결)
    console.log('Floor tiles updated - scheduling delayed model repositioning...')
    setTimeout(() => {
      console.log('Executing delayed model repositioning after floor generation...')
      // TODO: repositionModelsAfterFloorChange 메서드 구현 필요
      // this.modelManager.repositionModelsAfterFloorChange()
    }, 100) // 100ms 지연으로 바닥 생성 완료 보장
  }

  private updateColors(params: ColorParams) {
    // 색상 파라미터 업데이트
    Object.assign(this.colorParams, params)
    
    // 바닥과 벽 다시 생성 (격자 기반)
    createFloor(this.scene, 1, 1, this.colorParams.floorColor, this.roomParams.customGrid, this.customFloorTexture)
    createWalls(this.scene, 1, 1, this.roomParams.wallHeight, this.colorParams.wallColor, this.roomParams.customGrid)
    
    // 바닥/벽 색상 변경은 가구 위치에 영향을 주지 않음 (메시만 교체)
    console.log('Floor/walls color updated - no model repositioning needed')
    
    // 벽 재생성 후 벽 가구들을 자동으로 재부착
    console.log('Walls color updated, repositioning wall models...')
    // TODO: repositionWallModelsAfterWallChange 메서드 구현 필요
    // this.modelManager.repositionWallModelsAfterWallChange()
  }

  public getModelManager(): ModelManager {
    return this.modelManager
  }

  public getInteractionManager(): InteractionManager {
    return this.interactionManager
  }

  // 벽 큐브 테스트용 메서드
  public async addTestWallCube(x: number = 0, z: number = 0): Promise<string | null> {
    return await this.modelManager.addWallCube(x, z)
  }

  // 플로어 램프 추가 메서드
  public async addFloorLamp(x: number = 0, z: number = 0): Promise<string | null> {
    try {
      const FloorLampClass = getModelClass('floorlamp')
      if (!FloorLampClass) {
        console.error('FloorLamp model class not found')
        return null
      }

      // 플로어 램프 인스턴스 생성 (중앙에 배치)
      const floorLamp = new FloorLampClass(
        { x, y: 0, z },
        { x: 1.5, y: 1.5, z: 1.5 }, // 스케일
        { x: 0, y: 0, z: 0 } // 회전
      )

      await this.modelManager.addModel(floorLamp)
      console.log(`FloorLamp added at position (${x}, ${z})`)
      return floorLamp.getId()
    } catch (error) {
      console.error('Failed to add floor lamp:', error)
      return null
    }
  }

  public rotateModel(modelId: string): void {
    this.modelManager.rotateModel(modelId)
  }

  public async deleteModel(modelId: string): Promise<void> {
    await this.modelManager.removeModel(modelId)
    // 모델 삭제 후 기즈모 숨기기
    if (this.gizmoState.selectedModelId === modelId) {
      this.gizmoState = { selectedModelId: null, screenPosition: null }
      if (this.onGizmoStateChange) {
        this.onGizmoStateChange(this.gizmoState)
      }
    }
  }

  public getGizmoState(): GizmoState {
    return this.gizmoState
  }

  /**
   * 현재 실제 바닥 상태를 반환합니다.
   * UI와 실제 렌더된 바닥을 동기화하는데 사용됩니다.
   */
  public getCurrentRoomParams(): RoomParams {
    return { ...this.roomParams }
  }

  /**
   * 현재 실제 색상 파라미터를 반환합니다.
   */
  public getCurrentColorParams(): ColorParams {
    return { ...this.colorParams }
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate)
    
    this.controls.update()
    
    // 크기 변경 애니메이션 업데이트
    this.updateResizeAnimation()
    
    // ModelManager를 통해 모든 모델 업데이트
    this.modelManager.update()
    
    if (this.pixelationEnabled) {
      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

  public dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    
    this.controls.dispose()
    this.pixelatedPass.dispose()
    this.renderer.dispose()
    
    // InteractionManager 정리
    this.interactionManager.dispose()
    
    // ModelManager 정리
    this.modelManager.dispose()
    
    // ThemeObserver 정리
    if (this.themeObserver) {
      this.themeObserver.disconnect()
    }
    
    // 씬의 모든 오브젝트 정리
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose()
        if (object.material instanceof THREE.Material) {
          object.material.dispose()
        }
      }
    })

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement)
    }
  }

  // 반응형 기능을 위한 새로운 메서드들
  public updateSize(width: number, height: number): void {
    console.log(`SceneManager.updateSize: Called with ${width}x${height}`)
    
    // 목표 크기 설정
    this.targetSize = { width, height }
    
    // 현재 크기가 설정되지 않았다면 즉시 적용
    if (this.currentSize.width === 0 || this.currentSize.height === 0) {
      this.currentSize = { width, height }
      this.applySize(width, height)
    } else {
      // 애니메이션 시작
      this.isResizing = true
      console.log(`SceneManager.updateSize: Starting resize animation from ${this.currentSize.width}x${this.currentSize.height} to ${width}x${height}`)
    }
  }

  private applySize(width: number, height: number): void {
    // 렌더러 크기 업데이트
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // 카메라 aspect ratio 업데이트
    const aspectRatio = width / height
    const frustumSize = 10

    this.camera.left = -frustumSize * aspectRatio / 2
    this.camera.right = frustumSize * aspectRatio / 2
    this.camera.top = frustumSize / 2
    this.camera.bottom = -frustumSize / 2
    this.camera.updateProjectionMatrix()

    // 컴포저 크기 업데이트
    this.composer.setSize(width, height)

    // 픽셀화 패스의 해상도 업데이트
    if (this.pixelatedPass) {
      // 화면 해상도 업데이트 후 픽셀 사이즈 적용
      this.pixelatedPass.updateScreenResolution(width, height)
    }
  }

  private updateResizeAnimation(): void {
    if (!this.isResizing) return

    // 현재 크기와 frustumSize를 목표값으로 부드럽게 이동
    const deltaWidth = this.targetSize.width - this.currentSize.width
    const deltaHeight = this.targetSize.height - this.currentSize.height
    const deltaFrustum = this.targetFrustumSize - this.currentFrustumSize

    // 거리가 충분히 작으면 애니메이션 완료
    if (Math.abs(deltaWidth) < 1 && Math.abs(deltaHeight) < 1 && Math.abs(deltaFrustum) < 0.01) {
      this.currentSize = { ...this.targetSize }
      this.currentFrustumSize = this.targetFrustumSize
      this.applySizeAndFrustum(this.currentSize.width, this.currentSize.height, this.currentFrustumSize)
      this.isResizing = false
      console.log(`SceneManager: Animation completed at ${this.currentSize.width}x${this.currentSize.height}, frustum: ${this.currentFrustumSize.toFixed(2)}`)
      return
    }

    // 부드러운 전환
    this.currentSize.width += deltaWidth * this.resizeAnimationSpeed
    this.currentSize.height += deltaHeight * this.resizeAnimationSpeed
    this.currentFrustumSize += deltaFrustum * this.resizeAnimationSpeed

    // 크기와 frustumSize 적용
    this.applySizeAndFrustum(this.currentSize.width, this.currentSize.height, this.currentFrustumSize)
  }

  public updatePixelationParams(params: Partial<PixelationParams>): void {
    if (this.pixelatedPass) {
      this.pixelatedPass.updateParams(params)
    }
  }

  public setResizeAnimationSpeed(speed: number): void {
    this.resizeAnimationSpeed = Math.max(0.01, Math.min(1, speed)) // 0.01 ~ 1 사이로 제한
    console.log(`SceneManager: Resize animation speed set to ${this.resizeAnimationSpeed}`)
  }

  // 크기와 frustumSize를 함께 업데이트하는 메서드
  public updateSizeAndFrustum(width: number, height: number, frustumSize: number): void {
    console.log(`SceneManager.updateSizeAndFrustum: Called with ${width}x${height}, frustumSize: ${frustumSize}`)
    
    // 목표 크기와 frustumSize 설정
    this.targetSize = { width, height }
    this.targetFrustumSize = frustumSize
    
    // 현재 크기가 설정되지 않았다면 즉시 적용
    if (this.currentSize.width === 0 || this.currentSize.height === 0) {
      this.currentSize = { width, height }
      this.currentFrustumSize = frustumSize
      this.applySizeAndFrustum(width, height, frustumSize)
    } else {
      // 애니메이션 시작
      this.isResizing = true
      console.log(`SceneManager.updateSizeAndFrustum: Starting animation from ${this.currentSize.width}x${this.currentSize.height}, frustum: ${this.currentFrustumSize} to ${width}x${height}, frustum: ${frustumSize}`)
    }
  }

  private applySizeAndFrustum(width: number, height: number, frustumSize: number): void {
    // 렌더러 크기 업데이트
    this.renderer.setSize(width, height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // 카메라 업데이트 (크기와 frustumSize 모두 적용)
    const aspectRatio = width / height
    this.camera.left = -frustumSize * aspectRatio / 2
    this.camera.right = frustumSize * aspectRatio / 2
    this.camera.top = frustumSize / 2
    this.camera.bottom = -frustumSize / 2
    this.camera.updateProjectionMatrix()

    // 컴포저 크기 업데이트
    this.composer.setSize(width, height)

    // 픽셀화 패스의 해상도 업데이트
    if (this.pixelatedPass) {
      this.pixelatedPass.updateScreenResolution(width, height)
    }
  }

  private updateCamera(width: number, height: number, frustumSize: number) {
    const aspectRatio = width / height
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspectRatio / 2, // left
      frustumSize * aspectRatio / 2,  // right
      frustumSize / 2,                // top
      -frustumSize / 2,               // bottom
      0.1,                              // near
      1000                          // far
    )
    this.camera.position.set(10, 12, 10)
  }

  // 현재 테마를 감지하는 메서드 추가
  private getCurrentTheme(): 'light' | 'dark' {
    // html 요소의 클래스를 확인
    const htmlElement = document.documentElement
    if (htmlElement.classList.contains('dark')) {
      return 'dark'
    }
    
    // prefers-color-scheme 확인
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    
    return 'light'
  }
} 