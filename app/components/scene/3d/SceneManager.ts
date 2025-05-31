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
import { InteractionManager } from './managers/InteractionManager'

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
  
  constructor(container: HTMLElement) {
    this.container = container
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
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.setClearColor(0x121212)
    this.container.appendChild(this.renderer.domElement)

    // 씬 설정
    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x121212)

    // 카메라 설정 (Orthographic 카메라로 변경)
    const aspectRatio = window.innerWidth / window.innerHeight
    const frustumSize = 10 // 카메라 시야 크기
    this.camera = new THREE.OrthographicCamera(
      -frustumSize * aspectRatio / 2, // left
      frustumSize * aspectRatio / 2,  // right
      frustumSize / 2,                // top
      -frustumSize / 2,               // bottom
      0.1,                              // near
      1000                          // far
    )
    this.camera.position.set(200, 200, 200)

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
    const screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
    const renderResolution = screenResolution.clone().divideScalar(defaultParams.pixelSize)
    renderResolution.x = Math.floor(renderResolution.x)
    renderResolution.y = Math.floor(renderResolution.y)

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
      this.modelManager
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

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate)
    
    this.controls.update()
    
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
} 