import * as THREE from 'three'
import { ModelManager } from './ModelManager'
import { BaseModel } from '../objects/BaseModel'

export interface DragState {
  isDragging: boolean
  selectedModel: BaseModel | null
  dragOffset: THREE.Vector3
  dragPlane: THREE.Plane
  startMouseY: number
  startModelY: number
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
  private collisionCheckInterval: number = 16

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
      startModelY: 0
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
    console.log('InteractionManager initialized')
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

    console.log('Event listeners attached to canvas')
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
    
    if (isInteraction) {
      console.log(`Checking ${allModels.length} models for intersection`)
    }
    
    allModels.forEach((model: BaseModel, index: number) => {
      const modelColliders = model.getAllColliders()
      if (modelColliders.length > 0) {
        colliders.push(...modelColliders)
        if (isInteraction) {
          console.log(`Model ${index}: ${model.getId()}, ${modelColliders.length} collider(s) available`)
        }
      }
    })

    if (isInteraction) {
      console.log(`Total colliders for raycasting: ${colliders.length}`)
    }
    
    const intersections = this.raycaster.intersectObjects(colliders, false)
    
    if (isInteraction) {
      console.log(`Raycasting found ${intersections.length} intersections`)
      
      if (intersections.length > 0) {
        console.log(`First intersection at: (${intersections[0].point.x.toFixed(3)}, ${intersections[0].point.y.toFixed(3)}, ${intersections[0].point.z.toFixed(3)})`)
      }
    }
    
    return intersections
  }

  private getModelFromIntersection(intersection: THREE.Intersection, isInteraction: boolean = false): BaseModel | null {
    const intersectedObject = intersection.object
    const modelId = intersectedObject.userData.modelId
    
    if (modelId) {
      const model = this.modelManager.getModel(modelId)
      if (isInteraction) {
        console.log(`Found model from intersection: ${modelId}`)
      }
      return model || null
    }
    
    if (isInteraction) {
      console.log('No modelId found in intersection userData')
    }
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

    this.clickStartTime = Date.now()
    this.clickStartPosition = { x: event.clientX, y: event.clientY }
    this.isDragStarted = false

    const intersections = this.getIntersectedModels(true)
    
    if (intersections.length > 0) {
      const selectedModel = this.getModelFromIntersection(intersections[0], true)
      
      if (selectedModel) {
        console.log(`Model selected: ${selectedModel.getId()}`)
        this.prepareForDrag(selectedModel, intersections[0].point)
      }
    } else {
      console.log('No model intersections found')
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
      
      if (moveDistance > 5) {
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
    console.log('Mouse up event triggered')
    
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
    console.log('Click event triggered')
    
    if (this.isDragStarted) {
      console.log('Click ignored - drag was initiated')
      return
    }
    
    const clickDuration = Date.now() - this.clickStartTime
    if (clickDuration > 200) {
      console.log('Click ignored - too long duration:', clickDuration)
      return
    }
    
    const clickDistance = Math.sqrt(
      Math.pow(event.clientX - this.clickStartPosition.x, 2) + 
      Math.pow(event.clientY - this.clickStartPosition.y, 2)
    )
    if (clickDistance > 5) {
      console.log('Click ignored - too much movement:', clickDistance)
      return
    }
    
    this.updateMousePosition(event.clientX, event.clientY)
    const intersections = this.getIntersectedModels(true)
    
    if (intersections.length > 0) {
      const selectedModel = this.getModelFromIntersection(intersections[0], true)
      
      if (selectedModel) {
        console.log(`Model clicked for gizmo: ${selectedModel.getId()}`)
        this.handleModelClick(selectedModel)
      }
    } else {
      console.log('No model clicked - hiding gizmo')
      this.hideGizmo()
    }
  }

  // 터치 이벤트 처리
  private onTouchStart(event: TouchEvent): void {
    event.preventDefault()
    console.log('Touch start event triggered')
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
          console.log(`Model selected via touch: ${selectedModel.getId()}`)
          this.prepareForDrag(selectedModel, intersections[0].point)
        }
      } else {
        console.log('No model intersections found via touch')
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
        
        if (moveDistance > 5) {
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
    console.log('Touch end event triggered')
    
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
    
    if (model.getType() === 'wallcube') {
      this.dragState.dragOffset.set(
        modelPosition.x - intersectionPoint.x,
        0,
        modelPosition.z - intersectionPoint.z
      )
      this.dragState.startMouseY = this.mouse.y
      this.dragState.startModelY = modelPosition.y
      console.log(`Prepared for dragging wall cube ${model.getId()} in 3D space (Y: ${modelPosition.y.toFixed(3)})`)
    } else {
      this.dragState.dragOffset.set(
        modelPosition.x - intersectionPoint.x,
        0,
        modelPosition.z - intersectionPoint.z
      )
      console.log(`Prepared for dragging floor model ${model.getId()} on horizontal plane`)
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
      const wallSurfacePosition = this.findNearestWallSurface(newX, newZ)
      
      if (wallSurfacePosition) {
        const mouseYDelta = this.mouse.y - this.dragState.startMouseY
        const yScale = 2.0
        const desiredY = this.dragState.startModelY - (mouseYDelta * yScale)
        
        const wallHeight = wallSurfacePosition.wallHeight
        const constrainedY = Math.max(0.1, Math.min(wallHeight - 0.1, desiredY))
        
        this.dragState.selectedModel.setPosition({
          x: wallSurfacePosition.x,
          y: constrainedY,
          z: wallSurfacePosition.z
        })
        
        console.log(`Wall cube constrained to wall surface at (${wallSurfacePosition.x.toFixed(3)}, ${constrainedY.toFixed(3)}, ${wallSurfacePosition.z.toFixed(3)})`)
      } else {
        console.log('No wall surface found - keeping current position')
      }
    } else {
      const currentTime = Date.now()
      const shouldCheckCollision = currentTime - this.lastCollisionCheckTime > this.collisionCheckInterval

      let adjustedPosition = { x: newX, y: 0, z: newZ }

      if (shouldCheckCollision) {
        adjustedPosition = this.modelManager.checkCollisionAndAdjust(
          this.dragState.selectedModel, 
          newX, 
          0,
          newZ
        )
        
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

  private findNearestWallSurface(targetX: number, targetZ: number): { x: number, z: number, wallHeight: number } | null {
    const wallMeshes: THREE.Mesh[] = []
    this.scene.traverse((child) => {
      if (child.userData.isWall && child instanceof THREE.Mesh) {
        wallMeshes.push(child)
      }
    })

    if (wallMeshes.length === 0) {
      return null
    }

    let nearestWall: THREE.Mesh | null = null
    let minDistance = Infinity
    let nearestPosition = { x: targetX, z: targetZ }

    wallMeshes.forEach(wall => {
      const wallPos = wall.position
      const wallScale = wall.scale
      const wallRotation = wall.rotation.y
      
      let surfacePosition: { x: number, z: number }
      
      if (Math.abs(wallRotation) < 0.1 || Math.abs(wallRotation - Math.PI) < 0.1) {
        const wallMinX = wallPos.x - wallScale.x/2
        const wallMaxX = wallPos.x + wallScale.x/2
        const clampedX = Math.max(wallMinX, Math.min(wallMaxX, targetX))
        
        if (wallRotation < 0.1) {
          surfacePosition = { x: clampedX, z: wallPos.z + 0.1 }
        } else {
          surfacePosition = { x: clampedX, z: wallPos.z - 0.1 }
        }
      } else {
        const wallMinZ = wallPos.z - wallScale.x/2
        const wallMaxZ = wallPos.z + wallScale.x/2
        const clampedZ = Math.max(wallMinZ, Math.min(wallMaxZ, targetZ))
        
        if (Math.abs(wallRotation - Math.PI/2) < 0.1) {
          surfacePosition = { x: wallPos.x + 0.1, z: clampedZ }
        } else {
          surfacePosition = { x: wallPos.x - 0.1, z: clampedZ }
        }
      }
      
      const distance = Math.sqrt(
        Math.pow(targetX - surfacePosition.x, 2) + 
        Math.pow(targetZ - surfacePosition.z, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        nearestWall = wall
        nearestPosition = surfacePosition
      }
    })

    if (nearestWall) {
      return {
        x: nearestPosition.x,
        z: nearestPosition.z,
        wallHeight: (nearestWall as THREE.Mesh).scale.y || 2.0
      }
    }

    return null
  }

  private endDrag(): void {
    const wasDragging = this.dragState.isDragging
    const selectedModel = this.dragState.selectedModel
    const wasActuallyDragged = this.isDragStarted

    if (wasDragging && selectedModel) {
      console.log(`Ended dragging model ${selectedModel.getId()}`)
      
      if (wasActuallyDragged) {
        const currentPosition = selectedModel.getPosition()
        
        if (selectedModel.getType() === 'wallcube') {
          console.log(`Wall cube positioned at (${currentPosition.x.toFixed(3)}, ${currentPosition.y.toFixed(3)}, ${currentPosition.z.toFixed(3)}) - no auto-attachment`)
        } else {
          // 개선된 바닥 가구 배치 로직 적용
          try {
            this.modelManager.placeOnFloor(selectedModel, currentPosition.x, currentPosition.z)
            console.log(`Floor model positioned using improved placement logic`)
          } catch {
            console.log('Failed to place on floor, using fallback positioning')
            const clampedPosition = this.modelManager.clampToFloorWithBounds(selectedModel, currentPosition.x, currentPosition.z)
            const surfaceY = this.modelManager.calculateSurfaceY(selectedModel, clampedPosition.x, clampedPosition.z)
            
            selectedModel.setPosition({
              x: clampedPosition.x,
              y: surfaceY,
              z: clampedPosition.z
            })
          }
          
          // 드래그된 모델의 위치가 변경된 후, 다른 모든 모델들의 위치도 재계산
          console.log('Recalculating positions for other models after drag...')
          this.modelManager.recalculateOtherModelPositions(selectedModel.getId())
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
    console.log(`Model clicked: ${model.getId()}`)
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
      
      console.log(`Showing gizmo at screen position: (${gizmoScreenX.toFixed(1)}, ${gizmoScreenY.toFixed(1)}) for model top Y: ${boundingBox.max.y.toFixed(3)}`)
      
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

    console.log('InteractionManager disposed')
  }
}