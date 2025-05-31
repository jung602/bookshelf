import * as THREE from 'three'
import { ModelManager } from './ModelManager'
import { BaseModel } from '../objects/BaseModel'

export interface DragState {
  isDragging: boolean
  selectedModel: BaseModel | null
  dragOffset: THREE.Vector3
  dragPlane: THREE.Plane
}

export class InteractionManager {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer
  private modelManager: ModelManager
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private dragState: DragState
  private floorPlane: THREE.Plane

  // 이벤트 리스너 참조 저장
  private boundMouseDown: (event: MouseEvent) => void
  private boundMouseMove: (event: MouseEvent) => void
  private boundMouseUp: (event: MouseEvent) => void
  private boundClick: (event: MouseEvent) => void
  private boundTouchStart: (event: TouchEvent) => void
  private boundTouchMove: (event: TouchEvent) => void
  private boundTouchEnd: (event: TouchEvent) => void
  private boundContextMenu: (event: Event) => void

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    modelManager: ModelManager
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.modelManager = modelManager
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    
    // 바닥 평면 정의 (Y=0 평면)
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    
    // 드래그 상태 초기화
    this.dragState = {
      isDragging: false,
      selectedModel: null,
      dragOffset: new THREE.Vector3(),
      dragPlane: this.floorPlane.clone()
    }

    // 이벤트 리스너 바인딩
    this.boundMouseDown = this.onMouseDown.bind(this)
    this.boundMouseMove = this.onMouseMove.bind(this)
    this.boundMouseUp = this.onMouseUp.bind(this)
    this.boundClick = this.onClick.bind(this)
    this.boundTouchStart = this.onTouchStart.bind(this)
    this.boundTouchMove = this.onTouchMove.bind(this)
    this.boundTouchEnd = this.onTouchEnd.bind(this)
    this.boundContextMenu = (event: Event) => event.preventDefault()

    this.setupEventListeners()
    console.log('InteractionManager initialized')
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement

    // 마우스 이벤트 리스너
    canvas.addEventListener('mousedown', this.boundMouseDown)
    canvas.addEventListener('mousemove', this.boundMouseMove)
    canvas.addEventListener('mouseup', this.boundMouseUp)
    canvas.addEventListener('click', this.boundClick)

    // 터치 이벤트 리스너 (모바일 지원)
    canvas.addEventListener('touchstart', this.boundTouchStart)
    canvas.addEventListener('touchmove', this.boundTouchMove)
    canvas.addEventListener('touchend', this.boundTouchEnd)

    // 컨텍스트 메뉴 비활성화
    canvas.addEventListener('contextmenu', this.boundContextMenu)

    console.log('Event listeners attached to canvas')
  }

  private updateMousePosition(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
    
    console.log(`Mouse position: screen(${clientX}, ${clientY}) -> normalized(${this.mouse.x.toFixed(3)}, ${this.mouse.y.toFixed(3)})`)
  }

  private getIntersectedModels(): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // 모든 모델의 모든 콜라이더 메시 수집
    const colliders: THREE.Mesh[] = []
    const allModels = this.modelManager.getAllModels()
    
    console.log(`Checking ${allModels.length} models for intersection`)
    
    allModels.forEach((model, index) => {
      const modelColliders = model.getAllColliders()
      if (modelColliders.length > 0) {
        colliders.push(...modelColliders)
        console.log(`Model ${index}: ${model.getId()}, ${modelColliders.length} collider(s) available`)
      }
    })

    console.log(`Total colliders for raycasting: ${colliders.length}`)
    
    const intersections = this.raycaster.intersectObjects(colliders, false)
    console.log(`Raycasting found ${intersections.length} intersections`)
    
    if (intersections.length > 0) {
      console.log(`First intersection at: (${intersections[0].point.x.toFixed(3)}, ${intersections[0].point.y.toFixed(3)}, ${intersections[0].point.z.toFixed(3)})`)
    }
    
    return intersections
  }

  private getModelFromIntersection(intersection: THREE.Intersection): BaseModel | null {
    // 콜라이더의 userData에서 modelId 가져오기
    const intersectedObject = intersection.object
    const modelId = intersectedObject.userData.modelId
    
    if (modelId) {
      const model = this.modelManager.getModel(modelId)
      console.log(`Found model from intersection: ${modelId}`)
      return model || null
    }
    
    console.log('No modelId found in intersection userData')
    return null
  }

  private getFloorIntersection(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const intersectionPoint = new THREE.Vector3()
    const intersected = this.raycaster.ray.intersectPlane(this.floorPlane, intersectionPoint)
    
    return intersected ? intersectionPoint : null
  }

  private onMouseDown(event: MouseEvent): void {
    event.preventDefault()
    console.log('Mouse down event triggered')
    this.updateMousePosition(event.clientX, event.clientY)

    const intersections = this.getIntersectedModels()
    
    if (intersections.length > 0) {
      const selectedModel = this.getModelFromIntersection(intersections[0])
      
      if (selectedModel) {
        console.log(`Model selected: ${selectedModel.getId()}`)
        this.startDrag(selectedModel, intersections[0].point)
      }
    } else {
      console.log('No model intersections found')
    }
  }

  private onMouseMove(event: MouseEvent): void {
    event.preventDefault()
    this.updateMousePosition(event.clientX, event.clientY)

    if (this.dragState.isDragging && this.dragState.selectedModel) {
      this.updateDrag()
    } else {
      // 호버 효과 (선택사항)
      this.updateHover()
    }
  }

  private onMouseUp(event: MouseEvent): void {
    event.preventDefault()
    console.log('Mouse up event triggered')
    this.endDrag()
  }

  private onClick(event: MouseEvent): void {
    event.preventDefault()
    console.log('Click event triggered')
  }

  // 터치 이벤트 처리
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault()
    console.log('Touch start event triggered')
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      this.updateMousePosition(touch.clientX, touch.clientY)
      
      const intersections = this.getIntersectedModels()
      if (intersections.length > 0) {
        const selectedModel = this.getModelFromIntersection(intersections[0])
        if (selectedModel) {
          this.startDrag(selectedModel, intersections[0].point)
        }
      }
    }
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault()
    if (event.touches.length === 1 && this.dragState.isDragging) {
      const touch = event.touches[0]
      this.updateMousePosition(touch.clientX, touch.clientY)
      this.updateDrag()
    }
  }

  private onTouchEnd(event: TouchEvent): void {
    event.preventDefault()
    console.log('Touch end event triggered')
    this.endDrag()
  }

  private startDrag(model: BaseModel, intersectionPoint: THREE.Vector3): void {
    this.dragState.isDragging = true
    this.dragState.selectedModel = model
    
    // 모델의 현재 위치와 클릭 지점 간의 오프셋 계산
    const modelPosition = model.getPosition()
    this.dragState.dragOffset.set(
      modelPosition.x - intersectionPoint.x,
      0, // Y축은 고정
      modelPosition.z - intersectionPoint.z
    )

    console.log(`Started dragging model ${model.getId()}`)
  }

  private updateDrag(): void {
    if (!this.dragState.selectedModel) return

    const floorIntersection = this.getFloorIntersection()
    if (!floorIntersection) return

    // 드래그 오프셋을 적용한 새로운 위치 계산
    const newX = floorIntersection.x + this.dragState.dragOffset.x
    const newZ = floorIntersection.z + this.dragState.dragOffset.z

    // ModelManager를 통해 모델 이동 (경계 체크 포함)
    this.modelManager.moveModel(this.dragState.selectedModel.getId(), newX, newZ)
  }

  private endDrag(): void {
    if (this.dragState.isDragging && this.dragState.selectedModel) {
      console.log(`Ended dragging model ${this.dragState.selectedModel.getId()}`)
    }

    this.dragState.isDragging = false
    this.dragState.selectedModel = null
    this.dragState.dragOffset.set(0, 0, 0)
  }

  private updateHover(): void {
    // 호버 효과 구현 (선택사항)
    const intersections = this.getIntersectedModels()
    
    if (intersections.length > 0) {
      // 마우스 커서 변경
      this.renderer.domElement.style.cursor = 'pointer'
    } else {
      this.renderer.domElement.style.cursor = 'default'
    }
  }

  public getDragState(): DragState {
    return { ...this.dragState }
  }

  public dispose(): void {
    const canvas = this.renderer.domElement

    // 이벤트 리스너 제거 (저장된 참조 사용)
    canvas.removeEventListener('mousedown', this.boundMouseDown)
    canvas.removeEventListener('mousemove', this.boundMouseMove)
    canvas.removeEventListener('mouseup', this.boundMouseUp)
    canvas.removeEventListener('click', this.boundClick)
    canvas.removeEventListener('touchstart', this.boundTouchStart)
    canvas.removeEventListener('touchmove', this.boundTouchMove)
    canvas.removeEventListener('touchend', this.boundTouchEnd)
    canvas.removeEventListener('contextmenu', this.boundContextMenu)

    console.log('InteractionManager disposed')
  }
} 