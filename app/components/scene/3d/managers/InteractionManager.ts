import * as THREE from 'three'
import { ModelManager } from './ModelManager'
import { BaseModel } from '../objects/BaseModel'

// 상수 정의
const Y_SCALE = 2.0
const DRAG_THRESHOLD = 5
const CLICK_DURATION_THRESHOLD = 300
const COLLISION_CHECK_INTERVAL = 16

export interface DragState {
  isDragging: boolean
  selectedModel: BaseModel | null
  dragOffset: THREE.Vector3
  dragPlane: THREE.Plane
  startMouseY: number
  startModelY: number
  previousPosition: { x: number, y: number, z: number } | null
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
  private lastCollisionCheckTime: number = 0
  private collisionCheckInterval: number = COLLISION_CHECK_INTERVAL

  // 이벤트 리스너 참조 저장
  private boundMouseDown: (event: MouseEvent) => void
  private boundMouseMove: (event: MouseEvent) => void
  private boundMouseUp: (event: MouseEvent) => void
  private boundClick: (event: MouseEvent) => void
  private boundTouchStart: (event: TouchEvent) => void
  private boundTouchMove: (event: TouchEvent) => void
  private boundTouchEnd: (event: TouchEvent) => void
  private boundContextMenu: (event: Event) => void

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
    
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    
    this.dragState = {
      isDragging: false,
      selectedModel: null,
      dragOffset: new THREE.Vector3(),
      dragPlane: this.floorPlane.clone(),
      startMouseY: 0,
      startModelY: 0,
      previousPosition: null
    }

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

  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement

    canvas.addEventListener('mousedown', this.boundMouseDown)
    canvas.addEventListener('mousemove', this.boundMouseMove)
    canvas.addEventListener('mouseup', this.boundMouseUp)
    canvas.addEventListener('click', this.boundClick)
    canvas.addEventListener('touchstart', this.boundTouchStart)
    canvas.addEventListener('touchmove', this.boundTouchMove)
    canvas.addEventListener('touchend', this.boundTouchEnd)
    canvas.addEventListener('contextmenu', this.boundContextMenu)


  }

  private updateMousePosition(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }

  private getIntersectedModels(isInteraction: boolean = false): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const colliders: THREE.Mesh[] = []
    const allModels = this.modelManager.getAllModels()
    
    allModels.forEach((model: BaseModel, index: number) => {
      const modelColliders = model.getAllColliders()
      if (modelColliders.length > 0) {
        colliders.push(...modelColliders)
      }
    })
    
    const intersections = this.raycaster.intersectObjects(colliders, false)
    
    return intersections
  }

  private getModelFromIntersection(intersection: THREE.Intersection, isInteraction: boolean = false): BaseModel | null {
    const intersectedObject = intersection.object
    const modelId = intersectedObject.userData.modelId
    
    if (modelId) {
      const model = this.modelManager.getModel(modelId)
      return model || null
    }
    
    return null
  }



  private onMouseDown(event: MouseEvent): void {
    event.preventDefault()

    this.updateMousePosition(event.clientX, event.clientY)

    this.clickStartTime = Date.now()
    this.clickStartPosition = { x: event.clientX, y: event.clientY }
    this.isDragStarted = false

    const intersections = this.getIntersectedModels(true)
    
    if (intersections.length > 0) {
      const selectedModel = this.getModelFromIntersection(intersections[0], true)
      
      if (selectedModel) {
  
        this.prepareForDrag(selectedModel, intersections[0].point)
      }
    } else {

      this.hideGizmo()
    }
  }

  private onMouseMove(event: MouseEvent): void {
    event.preventDefault()
    this.updateMousePosition(event.clientX, event.clientY)

    if (!this.isDragStarted && this.dragState.selectedModel) {
      const moveDistance = Math.sqrt(
        Math.pow(event.clientX - this.clickStartPosition.x, 2) +
        Math.pow(event.clientY - this.clickStartPosition.y, 2)
      )
      
      if (moveDistance > DRAG_THRESHOLD) {
        this.isDragStarted = true
        this.dragState.isDragging = true
        this.hideGizmo()
      }
    }

    if (this.dragState.isDragging && this.dragState.selectedModel) {
      this.updateDrag()
    } else {
      this.updateHover()
    }
  }

  private onMouseUp(event: MouseEvent): void {
    event.preventDefault()
    
    
    const clickDuration = Date.now() - this.clickStartTime
    const moveDistance = Math.sqrt(
      Math.pow(event.clientX - this.clickStartPosition.x, 2) +
      Math.pow(event.clientY - this.clickStartPosition.y, 2)
    )

    if (clickDuration < 300 && moveDistance < 5 && this.dragState.selectedModel && !this.isDragStarted) {
      this.handleModelClick(this.dragState.selectedModel)
    }

    this.endDrag()
  }

  private onClick(event: MouseEvent): void {
    event.preventDefault()
    
    
    if (this.isDragStarted) {
      
      return
    }
    
    const clickDuration = Date.now() - this.clickStartTime
    if (clickDuration > 200) {
      
      return
    }
    
    const clickDistance = Math.sqrt(
      Math.pow(event.clientX - this.clickStartPosition.x, 2) + 
      Math.pow(event.clientY - this.clickStartPosition.y, 2)
    )
    if (clickDistance > 5) {
      
      return
    }
    
    this.updateMousePosition(event.clientX, event.clientY)
    const intersections = this.getIntersectedModels(true)
    
    if (intersections.length > 0) {
      const selectedModel = this.getModelFromIntersection(intersections[0], true)
      
      if (selectedModel) {
  
        this.handleModelClick(selectedModel)
      }
    } else {

      this.hideGizmo()
    }
  }

  // 터치 이벤트 처리
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault()
    
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      this.updateMousePosition(touch.clientX, touch.clientY)

      this.clickStartTime = Date.now()
      this.clickStartPosition = { x: touch.clientX, y: touch.clientY }
      this.isDragStarted = false

      const intersections = this.getIntersectedModels(true)
      
      if (intersections.length > 0) {
        const selectedModel = this.getModelFromIntersection(intersections[0], true)
        
        if (selectedModel) {
    
          this.prepareForDrag(selectedModel, intersections[0].point)
        }
      } else {
  
        this.hideGizmo()
      }
    }
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault()
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      this.updateMousePosition(touch.clientX, touch.clientY)

      if (!this.isDragStarted && this.dragState.selectedModel) {
        const moveDistance = Math.sqrt(
          Math.pow(touch.clientX - this.clickStartPosition.x, 2) +
          Math.pow(touch.clientY - this.clickStartPosition.y, 2)
        )
        
        if (moveDistance > DRAG_THRESHOLD) {
          this.isDragStarted = true
          this.dragState.isDragging = true
          this.hideGizmo()
        }
      }

      if (this.dragState.isDragging && this.dragState.selectedModel) {
        this.updateDrag()
      } else {
        this.updateHover()
      }
    }
  }

  private onTouchEnd(event: TouchEvent): void {
    event.preventDefault()
    
    
    const clickDuration = Date.now() - this.clickStartTime
    const touch = event.changedTouches[0]
    const moveDistance = Math.sqrt(
      Math.pow(touch.clientX - this.clickStartPosition.x, 2) +
      Math.pow(touch.clientY - this.clickStartPosition.y, 2)
    )

    if (clickDuration < 300 && moveDistance < 5 && this.dragState.selectedModel && !this.isDragStarted) {
      this.handleModelClick(this.dragState.selectedModel)
    }

    this.endDrag()
  }

  private prepareForDrag(model: BaseModel, intersectionPoint: THREE.Vector3): void {
    this.dragState.selectedModel = model
    
    const modelPosition = model.getPosition()
    
    // 드래그 시작 시 이전 위치 저장
    this.dragState.previousPosition = {
      x: modelPosition.x,
      y: modelPosition.y,
      z: modelPosition.z
    }
    
    if (model.getType() === 'wallcube') {
      this.dragState.dragOffset.set(
        modelPosition.x - intersectionPoint.x,
        0,
        modelPosition.z - intersectionPoint.z
      )
      this.dragState.startMouseY = this.mouse.y
      this.dragState.startModelY = modelPosition.y

    } else {
      this.dragState.dragOffset.set(
        modelPosition.x - intersectionPoint.x,
        0,
        modelPosition.z - intersectionPoint.z
      )

    }

    this.dragState.dragPlane = this.floorPlane.clone()
  }

  private updateDrag(): void {
    if (!this.dragState.selectedModel) return

    const dragIntersection = this.getDragPlaneIntersection()
    if (!dragIntersection) return

    const newX = dragIntersection.x + this.dragState.dragOffset.x
    const newZ = dragIntersection.z + this.dragState.dragOffset.z

    if (this.dragState.selectedModel.getType() === 'wallcube') {
      const mouseYDelta = this.mouse.y - this.dragState.startMouseY
              const yScale = Y_SCALE
      const desiredY = this.dragState.startModelY - (mouseYDelta * yScale)
      this.modelManager.getWallManager().attachToNearestWall(this.dragState.selectedModel, newX, newZ, desiredY)
    } else {
      const currentTime = Date.now()
      const shouldCheckCollision = currentTime - this.lastCollisionCheckTime > this.collisionCheckInterval

      let adjustedPosition = { x: newX, y: 0, z: newZ }

      if (shouldCheckCollision) {
        adjustedPosition = this.modelManager.getFloorManager().checkCollisionAndAdjust(
          this.dragState.selectedModel, 
          newX, 
          0,
          newZ
        )
        // 드래그 가능 영역을 바닥 경계 안쪽으로 제한 (벽/경계 깜빡임 방지)
        const inset = 0.05
        const clamped = this.modelManager.getFloorManager().clampToBounds(this.dragState.selectedModel, adjustedPosition.x, adjustedPosition.z)
        adjustedPosition.x = clamped.x
        adjustedPosition.z = clamped.z
        
        this.lastCollisionCheckTime = currentTime
      } else {
        const currentPosition = this.dragState.selectedModel.getPosition()
        adjustedPosition.y = currentPosition.y
      }

      this.dragState.selectedModel.setPosition({
        x: adjustedPosition.x,
        y: adjustedPosition.y,
        z: adjustedPosition.z
      })
    }
  }

  private getDragPlaneIntersection(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const intersectionPoint = new THREE.Vector3()
    const intersected = this.raycaster.ray.intersectPlane(this.dragState.dragPlane, intersectionPoint)
    
    return intersected ? intersectionPoint : null
  }

  // 벽 스냅 계산은 WallModelManager로 위임됨

  private endDrag(): void {
    const wasDragging = this.dragState.isDragging
    const selectedModel = this.dragState.selectedModel
    const wasActuallyDragged = this.isDragStarted

    if (wasDragging && selectedModel) {

      
      if (wasActuallyDragged) {
        const currentPosition = selectedModel.getPosition()
        
        if (selectedModel.getType() === 'wallcube') {
  
        } else {
          // 개선된 바닥 가구 배치 로직 적용
          try {
            this.modelManager.getFloorManager().placeOnFloor(selectedModel, currentPosition.x, currentPosition.z)
    
          } catch {
  
            const clampedPosition = this.modelManager.getFloorManager().clampToBounds(selectedModel, currentPosition.x, currentPosition.z)
            const surfaceY = this.modelManager.getFloorManager().calculateSurfaceY(selectedModel, clampedPosition.x, clampedPosition.z)
            
            selectedModel.setPosition({
              x: clampedPosition.x,
              y: surfaceY,
              z: clampedPosition.z
            })
          }
          
          // 드래그된 모델의 위치가 변경된 후, 다른 모든 모델들의 위치도 재계산
          console.log(`[InteractionManager] Recalculating positions after drag of ${selectedModel.getType()}`)
          this.modelManager.recalculateOtherModelPositions(selectedModel.getId(), this.dragState.previousPosition || undefined)
        }
      }
      
      if (wasActuallyDragged) {
        // 개선된 기즈모 위치 계산
        this.showGizmoAtModelTop(selectedModel)
      }
    }

    this.dragState.isDragging = false
    this.dragState.selectedModel = null
    this.dragState.dragOffset.set(0, 0, 0)
    this.dragState.startMouseY = 0
    this.dragState.startModelY = 0
    this.dragState.previousPosition = null
    this.isDragStarted = false
  }

  private updateHover(): void {
    const intersections = this.getIntersectedModels()
    
    if (intersections.length > 0) {
      this.renderer.domElement.style.cursor = 'pointer'
    } else {
      this.renderer.domElement.style.cursor = 'default'
    }
  }

  private handleModelClick(model: BaseModel): void {

    this.showGizmoAtModelTop(model)
  }

  // 개선된 기즈모 위치 계산 메서드 (현재 버전에서 가져옴)
  private showGizmoAtModelTop(model: BaseModel): void {
    const modelPosition = model.getPosition()
    const modelGroup = model.getModel()
    
    if (modelGroup) {
      // 개선된 바운딩박스 계산으로 더 정확한 기즈모 위치
      const boundingBox = new THREE.Box3().setFromObject(modelGroup)
      
      const topPosition = new THREE.Vector3(
        modelPosition.x,
        boundingBox.max.y + 0.2, // 모델 최상단 + 여유공간
        modelPosition.z
      )
      
      // 3D 위치를 화면 좌표로 변환
      topPosition.project(this.camera)
      
      const rect = this.renderer.domElement.getBoundingClientRect()
      const gizmoScreenX = (topPosition.x + 1) * rect.width / 2 + rect.left
      const gizmoScreenY = (-topPosition.y + 1) * rect.height / 2 + rect.top
      
  
      
      this.gizmoState.selectedModelId = model.getId()
      this.gizmoState.screenPosition = { x: gizmoScreenX, y: gizmoScreenY }
      
      if (this.onGizmoStateChange) {
        this.onGizmoStateChange(this.gizmoState)
      }
    }
  }

  private hideGizmo(): void {
    this.gizmoState.selectedModelId = null
    this.gizmoState.screenPosition = null
    
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

    canvas.removeEventListener('mousedown', this.boundMouseDown)
    canvas.removeEventListener('mousemove', this.boundMouseMove)
    canvas.removeEventListener('mouseup', this.boundMouseUp)
    canvas.removeEventListener('click', this.boundClick)
    canvas.removeEventListener('touchstart', this.boundTouchStart)
    canvas.removeEventListener('touchmove', this.boundTouchMove)
    canvas.removeEventListener('touchend', this.boundTouchEnd)
    canvas.removeEventListener('contextmenu', this.boundContextMenu)


  }
}