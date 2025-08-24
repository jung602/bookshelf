import * as THREE from 'three'
import { ModelManager } from './ModelManager'
import { BaseModel } from '../objects/BaseModel'

// 상수 정의
const Y_SCALE = 2.0 // 벽 가구 Y축 드래그 민감도 (더 민감하게 조정)
const DRAG_THRESHOLD = 5
const CLICK_DURATION_THRESHOLD = 300

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
    
    // 모든 가구: 2D UI 드래그 방식 - 화면에서 자유롭게 이동
    this.dragState.dragOffset.set(0, 0, 0) // 2D 드래그용 오프셋 제거
    this.dragState.startMouseY = this.mouse.y
    this.dragState.startModelY = modelPosition.y
    
    // 2D 드래그를 위한 카메라 기준 평면 생성
    const cameraPosition = this.camera.position.clone()
    const cameraDirection = new THREE.Vector3()
    this.camera.getWorldDirection(cameraDirection)
    const distance = cameraPosition.distanceTo(modelPosition)
    this.dragState.dragPlane = new THREE.Plane(cameraDirection, -distance)
    
    // 드래그 중 항상 위에 보이도록 렌더링 우선순위 올리기
    this.setModelAlwaysOnTop(model, true)
  }

  private updateDrag(): void {
    if (!this.dragState.selectedModel) return

    const dragIntersection = this.getDragPlaneIntersection()
    if (!dragIntersection) return

    // 모든 가구: 2D UI 드래그 - 화면에서 자유롭게 이동
    this.dragState.selectedModel.setPosition({
      x: dragIntersection.x,
      y: dragIntersection.y, 
      z: dragIntersection.z
    })
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
        
        // 드래그 종료 시 렌더링 우선순위 원래대로 복구
        this.setModelAlwaysOnTop(selectedModel, false)
        
        if (selectedModel.getType() === 'wallcube') {
          // 벽 가구: 2D 드래그 종료 - 화면 위치에서 벽 레이캐스팅
          const attachedToWall = this.attachWallcubeToVisibleWall(selectedModel)
          
          if (!attachedToWall) {
            // 폴백: 기존 방식으로 가장 가까운 벽에 부착
            this.modelManager.getWallManager().attachToNearestWall(
              selectedModel, 
              currentPosition.x, 
              currentPosition.z, 
              currentPosition.y
            )
          }
        } else {
          // 바닥 가구: 2D 드래그 종료 - 화면 위치에서 바닥 레이캐스팅
          const attachedToFloor = this.attachFloorModelToVisibleFloor(selectedModel)
          
          if (!attachedToFloor) {
            // 폴백: 기존 방식으로 바닥에 배치
            const finalPosition = this.modelManager.getFloorManager().calculateAdjustedPosition(
              selectedModel, 
              currentPosition.x, 
              currentPosition.y,
              currentPosition.z
            )
            selectedModel.setPosition(finalPosition)
          }
          
          // 드래그된 모델의 위치가 변경된 후, 다른 모든 모델들의 위치도 재계산
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

  // 통합 모델 회전 메서드 (벽/바닥 가구 구분하여 처리)
  public rotateModel(modelId: string): void {
    const model = this.modelManager.getModel(modelId)
    if (!model) return

    // 모델 회전 실행
    model.rotateY90()
    
    if (model.getType() === 'wallcube') {
      // 벽 가구: 회전 후 벽에 다시 부착
      const pos = model.getPosition()
      this.modelManager.getWallManager().attachToNearestWall(model, pos.x, pos.z, pos.y)
    } else {
      // 바닥 가구: 회전 후 재배치 및 충돌 안정화
      const pos = model.getPosition()
      const floorManager = this.modelManager.getFloorManager()
      
      try {
        floorManager.placeOnFloor(model, pos.x, pos.z)
      } catch {
        const clamped = floorManager.clampToBounds(model, pos.x, pos.z)
        const newY = floorManager.calculateSurfaceY(model, clamped.x, clamped.z)
        model.setPosition({ x: clamped.x, y: newY, z: clamped.z })
      }
      
      // 다른 모델들 재계산
      floorManager.recalculateOtherModelPositions(modelId)
    }
    
    // 회전 후 기즈모 위치 업데이트
    this.showGizmoAtModelTop(model)
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

  /**
   * 2D 드래그 종료 시 화면 위치에서 보이는 벽에 wallcube 부착
   */
  private attachWallcubeToVisibleWall(model: BaseModel): boolean {
    // 현재 마우스 위치에서 레이캐스팅
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // 씬에서 벽 객체들만 가져오기 (userData.isWall === true)
    const walls = this.scene.children.filter(obj => obj.userData.isWall === true)
    
    if (walls.length === 0) {
      return false
    }
    
    // 벽들과의 교차점 검사 (FrontSide만 자동으로 감지됨)
    const intersections = this.raycaster.intersectObjects(walls)
    
    if (intersections.length > 0) {
      const closestIntersection = intersections[0]
      const hitWall = closestIntersection.object as THREE.Mesh
      const hitPoint = closestIntersection.point
      
      // 히트한 벽에 모델 부착
      return this.attachModelToSpecificWall(model, hitWall, hitPoint)
    }
    
    return false
  }

  /**
   * 특정 벽에 모델을 부착
   */
  private attachModelToSpecificWall(model: BaseModel, wall: THREE.Mesh, hitPoint: THREE.Vector3): boolean {
    try {
      // 벽의 법선 벡터 계산
      const wallNormal = this.getWallNormal(wall)
      
      // 벽에서 약간 떨어진 위치 계산 (0.1 단위)
      const offsetDistance = 0.1
      const attachPosition = hitPoint.clone().add(wallNormal.multiplyScalar(offsetDistance))
      
      // Y 좌표는 hitPoint의 Y를 사용하되, 범위 제한
      const clampedY = Math.max(0.3, Math.min(2.5, hitPoint.y))
      attachPosition.y = clampedY
      
      // 모델 위치 설정
      model.setPosition({
        x: attachPosition.x,
        y: attachPosition.y,
        z: attachPosition.z
      })
      
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 벽의 법선 벡터 계산 (카메라 방향으로)
   */
  private getWallNormal(wall: THREE.Mesh): THREE.Vector3 {
    // 벽의 월드 매트릭스에서 법선 벡터 추출
    const wallMatrix = wall.matrixWorld
    const wallNormal = new THREE.Vector3(0, 0, 1) // 기본 법선
    wallNormal.transformDirection(wallMatrix).normalize()
    
    // 카메라 방향과 비교해서 바깥쪽을 향하도록 조정
    const cameraDirection = new THREE.Vector3()
    this.camera.getWorldDirection(cameraDirection)
    
    if (wallNormal.dot(cameraDirection) > 0) {
      wallNormal.negate() // 카메라 쪽을 향하면 반대로
    }
    
    return wallNormal
  }

  /**
   * 2D 드래그 종료 시 화면 위치에서 보이는 표면(바닥 또는 다른 가구)에 floorModel 부착
   */
  private attachFloorModelToVisibleFloor(model: BaseModel): boolean {
    // 현재 마우스 위치에서 레이캐스팅
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // 바닥과 다른 가구들의 콜라이더 모두 수집
    const colliders: THREE.Mesh[] = []
    
    // 바닥 메시 추가
    const floorMeshes = this.modelManager.getFloorManager().sceneIndex.getFloorMeshes()
    colliders.push(...floorMeshes)
    
    // 다른 가구들의 콜라이더 추가 (지지 관계 고려)
    const allModels = this.modelManager.getAllModels()
    allModels.forEach((otherModel) => {
      if (otherModel.getId() !== model.getId() && 
          otherModel.getType() !== 'wallcube' &&
          otherModel.isModelLoaded() &&
          otherModel.getModel()) {
        const modelColliders = otherModel.getAllColliders()
        if (modelColliders && modelColliders.length > 0) {
          const validColliders = modelColliders.filter(collider => {
            return collider.parent && this.scene.getObjectById(collider.id) !== undefined
          })
          if (validColliders.length > 0) {
            colliders.push(...validColliders)
          }
        }
      }
    })
    
    if (colliders.length === 0) {
      return false
    }
    
    // 모든 콜라이더와의 교차점 검사
    const intersections = this.raycaster.intersectObjects(colliders, false)
    
    if (intersections.length > 0) {
      const closestIntersection = intersections[0]
      const hitObject = closestIntersection.object as THREE.Mesh
      const hitPoint = closestIntersection.point
      
      // 히트한 객체가 바닥인지 다른 가구인지 확인
      const isFloorMesh = hitObject.userData.isFloor
      
      if (isFloorMesh) {
        // 바닥에 배치 - FloorModelManager의 로직 사용
        const floorManager = this.modelManager.getFloorManager()
        const adjustedPosition = floorManager.calculateAdjustedPosition(
          model, 
          hitPoint.x, 
          hitPoint.y, 
          hitPoint.z
        )
        model.setPosition(adjustedPosition)
        return true
      } else {
        // 다른 가구 위에 배치 시도
        const surfaceModelId = hitObject.userData.modelId
        const surfaceModel = this.modelManager.getModel(surfaceModelId)
        
        if (surfaceModel) {
          const floorManager = this.modelManager.getFloorManager()
          
          // 지지 관계 확인
          if (floorManager.canModelSupportAnother(surfaceModel, model, hitPoint.x, hitPoint.z)) {
            // 지지할 수 있으면 해당 가구 위에 배치
            const adjustedPosition = floorManager.calculateAdjustedPosition(
              model, 
              hitPoint.x, 
              hitPoint.y, 
              hitPoint.z
            )
            model.setPosition(adjustedPosition)
            return true
          } else {
            // 지지할 수 없으면 바닥에 배치
            const floorY = floorManager.getFloorHeight(hitPoint.x, hitPoint.z)
            const adjustedPosition = floorManager.calculateAdjustedPosition(
              model, 
              hitPoint.x, 
              floorY, 
              hitPoint.z
            )
            model.setPosition(adjustedPosition)
            return true
          }
        }
      }
    }
    
    return false
  }





  /**
   * 모든 가구의 렌더링 우선순위 설정 (드래그 중 항상 위에 보이도록)
   */
  private setModelAlwaysOnTop(model: BaseModel, alwaysOnTop: boolean): void {
    try {
      // BaseModel에서 Three.js 객체 가져오기
      const threeObject = model.getModel()
      
      if (!threeObject) {
        console.warn(`[setModelAlwaysOnTop] No Three.js object found for model`)
        return
      }
      
      // 모든 메쉬에 대해 재귀적으로 적용
      threeObject.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh) {
          if (alwaysOnTop) {
            // 드래그 중: 항상 위에 보이도록 설정
            child.renderOrder = 999 // 높은 렌더링 우선순위
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.depthTest = false // depth test 비활성화
                  mat.depthWrite = false // depth write 비활성화
                })
              } else {
                child.material.depthTest = false
                child.material.depthWrite = false
              }
            }
          } else {
            // 드래그 종료: 원래 설정으로 복구
            child.renderOrder = 0 // 기본 렌더링 우선순위
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.depthTest = true // depth test 활성화
                  mat.depthWrite = true // depth write 활성화
                })
              } else {
                child.material.depthTest = true
                child.material.depthWrite = true
              }
            }
          }
        }
      })
      
    } catch (error) {
      // 에러 무시 (렌더링 우선순위 설정 실패)
    }
  }
}