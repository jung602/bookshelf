import * as THREE from 'three'
import { ModelManager } from './ModelManager'
import { BaseModel } from '../objects/BaseModel'

export interface DragState {
  isDragging: boolean
  selectedModel: BaseModel | null
  dragOffset: THREE.Vector3
  dragPlane: THREE.Plane
}

export interface GizmoState {
  selectedModelId: string | null
  screenPosition: { x: number; y: number } | null
}

export class InteractionManager {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer
  private modelManager: ModelManager
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private dragState: DragState
  private gizmoState: GizmoState
  private floorPlane: THREE.Plane
  private isDragStarted: boolean = false
  private clickStartTime: number = 0
  private clickStartPosition: { x: number; y: number } = { x: 0, y: 0 }

  // 이벤트 리스너 참조 저장
  private boundMouseDown: (event: MouseEvent) => void
  private boundMouseMove: (event: MouseEvent) => void
  private boundMouseUp: (event: MouseEvent) => void
  private boundClick: (event: MouseEvent) => void
  private boundTouchStart: (event: TouchEvent) => void
  private boundTouchMove: (event: TouchEvent) => void
  private boundTouchEnd: (event: TouchEvent) => void
  private boundContextMenu: (event: Event) => void

  // 기즈모 콜백
  private onGizmoStateChange?: (gizmoState: GizmoState) => void

  constructor(
    scene: THREE.Scene,
    camera: THREE.Camera,
    renderer: THREE.WebGLRenderer,
    modelManager: ModelManager,
    onGizmoStateChange?: (gizmoState: GizmoState) => void
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.modelManager = modelManager
    this.onGizmoStateChange = onGizmoStateChange
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

    // 기즈모 상태 초기화
    this.gizmoState = {
      selectedModelId: null,
      screenPosition: null
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

    // 클릭 시작 시간과 위치 기록
    this.clickStartTime = Date.now()
    this.clickStartPosition = { x: event.clientX, y: event.clientY }
    this.isDragStarted = false

    const intersections = this.getIntersectedModels()
    
    if (intersections.length > 0) {
      const selectedModel = this.getModelFromIntersection(intersections[0])
      
      if (selectedModel) {
        console.log(`Model selected: ${selectedModel.getId()}`)
        // 드래그 준비만 하고 실제 드래그는 마우스 이동 시 시작
        this.prepareForDrag(selectedModel, intersections[0].point)
      }
    } else {
      console.log('No model intersections found')
      // 빈 공간 클릭 시 기즈모 숨기기
      this.hideGizmo()
    }
  }

  private onMouseMove(event: MouseEvent): void {
    event.preventDefault()
    this.updateMousePosition(event.clientX, event.clientY)

    // 드래그 시작 조건 확인 (마우스가 일정 거리 이상 움직였을 때)
    if (!this.isDragStarted && this.dragState.selectedModel) {
      const moveDistance = Math.sqrt(
        Math.pow(event.clientX - this.clickStartPosition.x, 2) +
        Math.pow(event.clientY - this.clickStartPosition.y, 2)
      )
      
      if (moveDistance > 5) { // 5픽셀 이상 움직이면 드래그 시작
        this.isDragStarted = true
        this.dragState.isDragging = true
        this.hideGizmo() // 드래그 시작 시 기즈모 숨기기
      }
    }

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
    
    // 클릭인지 드래그인지 판단
    const clickDuration = Date.now() - this.clickStartTime
    const moveDistance = Math.sqrt(
      Math.pow(event.clientX - this.clickStartPosition.x, 2) +
      Math.pow(event.clientY - this.clickStartPosition.y, 2)
    )

    // 짧은 시간 내에 적은 거리만 움직였다면 클릭으로 간주
    if (clickDuration < 300 && moveDistance < 5 && this.dragState.selectedModel && !this.isDragStarted) {
      this.handleModelClick(this.dragState.selectedModel, event.clientX, event.clientY)
    }

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

  private prepareForDrag(model: BaseModel, intersectionPoint: THREE.Vector3): void {
    this.dragState.selectedModel = model
    
    // 모델의 현재 위치와 클릭 지점 간의 오프셋 계산
    const modelPosition = model.getPosition()
    this.dragState.dragOffset.set(
      modelPosition.x - intersectionPoint.x,
      0, // Y축은 고정
      modelPosition.z - intersectionPoint.z
    )

    console.log(`Prepared for dragging model ${model.getId()}`)
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
    const wasDragging = this.dragState.isDragging
    const selectedModel = this.dragState.selectedModel
    const wasActuallyDragged = this.isDragStarted

    if (wasDragging && selectedModel) {
      console.log(`Ended dragging model ${selectedModel.getId()}`)
      
      // 실제로 드래그가 발생했을 때만 기즈모를 다시 표시
      if (wasActuallyDragged) {
        // 모델의 바운딩 박스를 구해서 상단 위치 계산
        const modelPosition = selectedModel.getPosition()
        const modelGroup = selectedModel.getModel()
        
        if (modelGroup) {
          // Three.js Box3를 사용해서 바운딩 박스 계산
          const boundingBox = new THREE.Box3().setFromObject(modelGroup)
          
          // 모델의 상단 중앙 위치 계산 (Y축은 바운딩 박스의 최대값 + 약간의 여백)
          const topPosition = new THREE.Vector3(
            modelPosition.x,
            boundingBox.max.y + 0.2, // 모델 상단에서 약간 위
            modelPosition.z
          )
          
          // 3D 위치를 화면 좌표로 변환
          topPosition.project(this.camera)
          
          const rect = this.renderer.domElement.getBoundingClientRect()
          const screenX = (topPosition.x + 1) * rect.width / 2 + rect.left
          const screenY = (-topPosition.y + 1) * rect.height / 2 + rect.top
          
          console.log(`Showing gizmo at screen position: (${screenX}, ${screenY})`)
          
          this.gizmoState.selectedModelId = selectedModel.getId()
          this.gizmoState.screenPosition = { x: screenX, y: screenY }
          
          // 기즈모 상태 변경 콜백 호출
          if (this.onGizmoStateChange) {
            this.onGizmoStateChange(this.gizmoState)
          }
        }
      }
    }

    this.dragState.isDragging = false
    this.dragState.selectedModel = null
    this.dragState.dragOffset.set(0, 0, 0)
    this.isDragStarted = false
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

  private handleModelClick(model: BaseModel, screenX: number, screenY: number): void {
    console.log(`Model clicked: ${model.getId()}`)
    
    // 모델의 바운딩 박스를 구해서 상단 위치 계산
    const modelPosition = model.getPosition()
    const modelGroup = model.getModel()
    
    if (modelGroup) {
      // Three.js Box3를 사용해서 바운딩 박스 계산
      const boundingBox = new THREE.Box3().setFromObject(modelGroup)
      
      // 모델의 상단 중앙 위치 계산 (Y축은 바운딩 박스의 최대값 + 약간의 여백)
      const topPosition = new THREE.Vector3(
        modelPosition.x,
        boundingBox.max.y + 0.2, // 모델 상단에서 약간 위
        modelPosition.z
      )
      
      // 3D 위치를 화면 좌표로 변환
      topPosition.project(this.camera)
      
      const rect = this.renderer.domElement.getBoundingClientRect()
      const gizmoScreenX = (topPosition.x + 1) * rect.width / 2 + rect.left
      const gizmoScreenY = (-topPosition.y + 1) * rect.height / 2 + rect.top
      
      // 기즈모 상태 업데이트
      this.gizmoState.selectedModelId = model.getId()
      this.gizmoState.screenPosition = { x: gizmoScreenX, y: gizmoScreenY }
      
      // 기즈모 상태 변경 콜백 호출
      if (this.onGizmoStateChange) {
        this.onGizmoStateChange(this.gizmoState)
      }
    }
  }

  private hideGizmo(): void {
    this.gizmoState.selectedModelId = null
    this.gizmoState.screenPosition = null
    
    // 기즈모 상태 변경 콜백 호출
    if (this.onGizmoStateChange) {
      this.onGizmoStateChange(this.gizmoState)
    }
  }

  public getDragState(): DragState {
    return { ...this.dragState }
  }

  public getGizmoState(): GizmoState {
    return { ...this.gizmoState }
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