import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { createLights } from './scenes/createLights'
import { createFloor } from './scenes/createFloor'
import { createWalls } from './scenes/createWalls'
import { RenderPixelatedPass } from './passes/RenderPixelatedPass'
import { PixelationControls } from './controls/PixelationControls'
import { RoomControls, RoomParams } from './controls/RoomControls'
import { ColorControls, ColorParams } from './controls/ColorControls'
import { ModelManager } from './managers/ModelManager'
import { InteractionManager, GizmoState } from './managers/InteractionManager'

export class SceneManager {
  private container: HTMLElement
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.OrthographicCamera
  private controls!: OrbitControls
  private composer!: EffectComposer
  private pixelatedPass!: RenderPixelatedPass
  private pixelationControls!: PixelationControls
  private roomControls!: RoomControls
  private colorControls!: ColorControls
  private modelManager!: ModelManager
  private interactionManager!: InteractionManager
  private animationId: number | null = null
  private pixelationEnabled: boolean = true
  private roomParams: RoomParams = { width: 5, height: 5, wallHeight: 1 }
  private colorParams: ColorParams = ColorControls.getDefaultParams()
  private isInitialized: boolean = false
  private gizmoState: GizmoState = { selectedModelId: null, screenPosition: null }
  private onGizmoStateChange?: (gizmoState: GizmoState) => void

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
      powerPreference: "high-performance"
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
    this.renderer.setClearColor(0x121212)
    this.container.appendChild(this.renderer.domElement)

    // 씬 설정
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0xffffff)

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
    this.controls.target.set(0, 0, 0)
    this.controls.update()

    // ModelManager 초기화
    this.modelManager = new ModelManager(this.scene, this.roomParams.width, this.roomParams.height)
  }

  private async setupScene() {
    // 조명 추가
    createLights(this.scene)

    // 바닥 추가
    createFloor(this.scene, this.roomParams.width, this.roomParams.height, this.colorParams.floorColor)

    // 벽들 추가
    createWalls(this.scene, this.roomParams.width, this.roomParams.height, this.roomParams.wallHeight, this.colorParams.wallColor)

    // 초기 모델 로드 제거 - 이제 UI에서 추가할 예정
    console.log('Scene setup completed without initial models')
  }

  private setupPostProcessing() {
    // EffectComposer 설정
    this.composer = new EffectComposer(this.renderer)
    
    // 픽셀화 해상도 계산 (컨트롤의 기본값 사용)
    const defaultParams = PixelationControls.getDefaultParams()
    
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
  }

  private setupControls() {
    // 픽셀화 컨트롤 패널 설정 (초기값은 컨트롤에서 관리)
    this.pixelationControls = new PixelationControls(
      (params) => {
        this.pixelatedPass.updateParams(params)
      }
    )

    // 방 크기 컨트롤 패널 설정
    this.roomControls = new RoomControls(
      this.roomParams,
      (params) => {
        this.updateRoom(params)
      }
    )

    // 색상 컨트롤 패널 설정
    this.colorControls = new ColorControls(
      this.colorParams,
      (params) => {
        this.updateColors(params)
      }
    )
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

  private updateRoom(params: Partial<RoomParams>) {
    // 방 파라미터 업데이트
    Object.assign(this.roomParams, params)
    
    // ModelManager에 새로운 바닥 크기 알림
    this.modelManager.updateFloorBounds(this.roomParams.width, this.roomParams.height)
    
    // 바닥과 벽 다시 생성
    createFloor(this.scene, this.roomParams.width, this.roomParams.height, this.colorParams.floorColor)
    createWalls(this.scene, this.roomParams.width, this.roomParams.height, this.roomParams.wallHeight, this.colorParams.wallColor)
    
    // 카메라 위치 조정 (방 크기와 벽 높이에 맞게)
    const maxSize = Math.max(this.roomParams.width, this.roomParams.height, this.roomParams.wallHeight)
    const cameraDistance = maxSize * 2
    this.camera.position.set(cameraDistance, cameraDistance, cameraDistance)
    this.controls.update()
  }

  private updateColors(params: ColorParams) {
    // 색상 파라미터 업데이트
    Object.assign(this.colorParams, params)
    
    // 바닥과 벽 다시 생성
    createFloor(this.scene, this.roomParams.width, this.roomParams.height, this.colorParams.floorColor)
    createWalls(this.scene, this.roomParams.width, this.roomParams.height, this.roomParams.wallHeight, this.colorParams.wallColor)
  }

  public getColorControls(): ColorControls {
    return this.colorControls
  }

  public getModelManager(): ModelManager {
    return this.modelManager
  }

  public getInteractionManager(): InteractionManager {
    return this.interactionManager
  }

  public rotateModel(modelId: string): void {
    this.modelManager.rotateModel(modelId)
  }

  public deleteModel(modelId: string): void {
    this.modelManager.removeModel(modelId)
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
    this.pixelationControls.dispose()
    this.roomControls.dispose()
    this.colorControls.dispose()
    this.pixelatedPass.dispose()
    this.renderer.dispose()
    
    // InteractionManager 정리
    this.interactionManager.dispose()
    
    // ModelManager 정리
    this.modelManager.dispose()
    
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
      const currentParams = this.pixelationControls.getParams()
      // 픽셀 사이즈 변경으로 해상도 업데이트 트리거
      this.pixelatedPass.updateParams({ pixelSize: currentParams.pixelSize })
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

  public updatePixelationParams(params: Partial<any>): void {
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
      const currentParams = this.pixelationControls.getParams()
      this.pixelatedPass.updateParams({ pixelSize: currentParams.pixelSize })
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
    this.camera.position.set(10,10,10)
  }
} 