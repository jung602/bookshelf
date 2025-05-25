import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { createLights } from './objects/createLights'
import { createFloor } from './objects/createFloor'
import { createWalls } from './objects/createWalls'
import { loadGLBModel } from './objects/loadGLBModel'
import { RenderPixelatedPass } from './passes/RenderPixelatedPass'
import { PixelationControls } from './controls/PixelationControls'
import { RoomControls, RoomParams } from './controls/RoomControls'

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
  private animationId: number | null = null
  private pixelationEnabled: boolean = true
  private roomParams: RoomParams = { width: 5, height: 5, wallHeight: 1 }
  private audioModel!: THREE.Group
  private rotationTime: number = 0

  constructor(container: HTMLElement) {
    this.container = container
    this.init()
    this.initializeScene()
    this.setupPostProcessing()
    this.setupControls()
    this.animate()
    this.handleResize()
  }

  private async initializeScene() {
    await this.setupScene()
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
  }

  private async setupScene() {
    // 조명 추가
    createLights(this.scene)

    // 바닥 추가
    createFloor(this.scene, this.roomParams.width, this.roomParams.height)

    // 벽들 추가
    createWalls(this.scene, this.roomParams.width, this.roomParams.height, this.roomParams.wallHeight)

    // audio.glb 모델 로드 및 배치
    await this.loadAudioModel()
  }

  private async loadAudioModel() {
    try {
      // Next.js basePath를 고려한 경로 설정
      const basePath = process.env.NODE_ENV === 'production' ? '/bookshelf' : ''
      this.audioModel = await loadGLBModel(`${basePath}/3d/main/models/audio.glb`)
      
      // 모델을 (0, 0, 0) 위치에 배치
      this.audioModel.position.set(0, .4, 0)
      
      // 모델 크기 조정 (필요에 따라)
      this.audioModel.scale.set(2, 2, 2)

      this.audioModel.rotation.set(0, Math.PI, 0)
      
      // 씬에 추가
      this.scene.add(this.audioModel)
      
      console.log('Audio model loaded successfully at position (0, 0, 0)')
    } catch (error) {
      console.error('Failed to load audio model:', error)
    }
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
  }

  private updateRoom(params: Partial<RoomParams>) {
    // 방 파라미터 업데이트
    Object.assign(this.roomParams, params)
    
    // 바닥과 벽 다시 생성
    createFloor(this.scene, this.roomParams.width, this.roomParams.height)
    createWalls(this.scene, this.roomParams.width, this.roomParams.height, this.roomParams.wallHeight)
    
    // 카메라 위치 조정 (방 크기와 벽 높이에 맞게)
    const maxSize = Math.max(this.roomParams.width, this.roomParams.height, this.roomParams.wallHeight)
    const cameraDistance = maxSize * 2
    this.camera.position.set(cameraDistance, cameraDistance, cameraDistance)
    this.controls.update()
  }

  private animate = () => {
    this.animationId = requestAnimationFrame(this.animate)
    
    this.controls.update()
    
    // 오디오 모델 회전 애니메이션
    if (this.audioModel) {
      this.rotationTime += 0.01
      // ease-in-out 함수를 사용한 좌우 90도 회전
      const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      const normalizedTime = (Math.sin(this.rotationTime) + 1) / 2 // 0~1 사이 값
      const easedTime = easeInOut(normalizedTime)
      const rotationAngle = Math.PI + (easedTime - 0.5) * Math.PI / 2 // 기본 180도에서 ±45도 회전
      this.audioModel.rotation.y = rotationAngle
    }
    
    if (this.pixelationEnabled) {
      this.composer.render()
    } else {
      this.renderer.render(this.scene, this.camera)
    }
  }

  private handleResize = () => {
    window.addEventListener('resize', () => {
      const aspectRatio = window.innerWidth / window.innerHeight
      const frustumSize = 400
      
      this.camera.left = -frustumSize * aspectRatio / 2
      this.camera.right = frustumSize * aspectRatio / 2
      this.camera.top = frustumSize / 2
      this.camera.bottom = -frustumSize / 2
      this.camera.updateProjectionMatrix()
      
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    })
  }

  public dispose() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    
    this.controls.dispose()
    this.pixelationControls.dispose()
    this.roomControls.dispose()
    this.pixelatedPass.dispose()
    this.renderer.dispose()
    
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