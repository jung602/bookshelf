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
  private lastCollisionCheckTime: number = 0
  private collisionCheckInterval: number = 16 // 60fps로 제한 (16ms)

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
    
    // 마우스 위치 로그는 제거 (너무 빈번함)
  }

  private getIntersectedModels(isInteraction: boolean = false): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    // 모든 모델의 모든 콜라이더 메시 수집
    const colliders: THREE.Mesh[] = []
    const allModels = this.modelManager.getAllModels()
    
    // 실제 인터랙션(클릭, 터치)일 때만 로그 출력
    if (isInteraction) {
      console.log(`Checking ${allModels.length} models for intersection`)
    }
    
    allModels.forEach((model, index) => {
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
    // 콜라이더의 userData에서 modelId 가져오기
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

    // 클릭 시작 시간과 위치 기록
    this.clickStartTime = Date.now()
    this.clickStartPosition = { x: event.clientX, y: event.clientY }
    this.isDragStarted = false

    const intersections = this.getIntersectedModels(true) // 클릭 인터랙션이므로 로그 출력
    
    if (intersections.length > 0) {
      const selectedModel = this.getModelFromIntersection(intersections[0], true) // 클릭 인터랙션
      
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
      this.handleModelClick(this.dragState.selectedModel)
    }

    this.endDrag()
  }

  private onClick(event: MouseEvent): void {
    event.preventDefault()
    console.log('Click event triggered')
    
    // 드래그가 발생했다면 클릭 이벤트 무시
    if (this.isDragStarted) {
      console.log('Click ignored - drag was initiated')
      return
    }
    
    // 클릭 시간이 너무 길면 무시 (드래그로 간주)
    const clickDuration = Date.now() - this.clickStartTime
    if (clickDuration > 200) { // 200ms 이상이면 드래그로 간주
      console.log('Click ignored - too long duration:', clickDuration)
      return
    }
    
    // 클릭 위치가 시작 위치에서 너무 멀리 이동했으면 무시
    const clickDistance = Math.sqrt(
      Math.pow(event.clientX - this.clickStartPosition.x, 2) + 
      Math.pow(event.clientY - this.clickStartPosition.y, 2)
    )
    if (clickDistance > 5) { // 5px 이상 이동했으면 드래그로 간주
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

      // 클릭 시작 시간과 위치 기록 (마우스와 동일)
      this.clickStartTime = Date.now()
      this.clickStartPosition = { x: touch.clientX, y: touch.clientY }
      this.isDragStarted = false

      const intersections = this.getIntersectedModels(true) // 터치 인터랙션이므로 로그 출력
      
      if (intersections.length > 0) {
        const selectedModel = this.getModelFromIntersection(intersections[0], true) // 터치 인터랙션
        
        if (selectedModel) {
          console.log(`Model selected via touch: ${selectedModel.getId()}`)
          // 드래그 준비만 하고 실제 드래그는 터치 이동 시 시작 (마우스와 동일)
          this.prepareForDrag(selectedModel, intersections[0].point)
        }
      } else {
        console.log('No model intersections found via touch')
        // 빈 공간 터치 시 기즈모 숨기기
        this.hideGizmo()
      }
    }
  }

  private onTouchMove(event: TouchEvent): void {
    event.preventDefault()
    if (event.touches.length === 1) {
      const touch = event.touches[0]
      this.updateMousePosition(touch.clientX, touch.clientY)

      // 드래그 시작 조건 확인 (마우스와 동일한 로직)
      if (!this.isDragStarted && this.dragState.selectedModel) {
        const moveDistance = Math.sqrt(
          Math.pow(touch.clientX - this.clickStartPosition.x, 2) +
          Math.pow(touch.clientY - this.clickStartPosition.y, 2)
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
  }

  private onTouchEnd(event: TouchEvent): void {
    event.preventDefault()
    console.log('Touch end event triggered')
    
    // 클릭인지 드래그인지 판단 (마우스와 동일한 로직)
    const clickDuration = Date.now() - this.clickStartTime
    const touch = event.changedTouches[0]
    const moveDistance = Math.sqrt(
      Math.pow(touch.clientX - this.clickStartPosition.x, 2) +
      Math.pow(touch.clientY - this.clickStartPosition.y, 2)
    )

    // 짧은 시간 내에 적은 거리만 움직였다면 클릭으로 간주
    if (clickDuration < 300 && moveDistance < 5 && this.dragState.selectedModel && !this.isDragStarted) {
      this.handleModelClick(this.dragState.selectedModel)
    }

    this.endDrag()
  }

  private startDrag(model: BaseModel, intersectionPoint: THREE.Vector3): void {
    this.dragState.isDragging = true
    this.dragState.selectedModel = model
    
    // 모델의 현재 위치와 클릭 지점 간의 오프셋 계산 (X, Z축만)
    const modelPosition = model.getPosition()
    this.dragState.dragOffset.set(
      modelPosition.x - intersectionPoint.x,
      0, // Y축 오프셋 제거
      modelPosition.z - intersectionPoint.z
    )

    // 드래그 평면을 바닥 평면(Y=0)으로 고정
    this.dragState.dragPlane = this.floorPlane.clone()

    console.log(`Started dragging model ${model.getId()} on horizontal plane`)
  }

  private prepareForDrag(model: BaseModel, intersectionPoint: THREE.Vector3): void {
    this.dragState.selectedModel = model
    
    // 모델의 현재 위치와 클릭 지점 간의 오프셋 계산 (X, Z축만)
    const modelPosition = model.getPosition()
    this.dragState.dragOffset.set(
      modelPosition.x - intersectionPoint.x,
      0, // Y축 오프셋 제거
      modelPosition.z - intersectionPoint.z
    )

    // 드래그 평면을 바닥 평면(Y=0)으로 고정
    this.dragState.dragPlane = this.floorPlane.clone()

    console.log(`Prepared for dragging model ${model.getId()} on horizontal plane`)
  }

  private updateDrag(): void {
    if (!this.dragState.selectedModel) return

    // 바닥 평면과의 교차점 계산
    const dragIntersection = this.getDragPlaneIntersection()
    if (!dragIntersection) return

    // 드래그 오프셋을 적용한 새로운 X, Z 위치 계산 (Y축 제외)
    const newX = dragIntersection.x + this.dragState.dragOffset.x
    const newZ = dragIntersection.z + this.dragState.dragOffset.z

    // 벽 가구인지 확인
    if (this.dragState.selectedModel.getType() === 'wallcube') {
      // 벽 가구는 Y 위치를 유지하면서 X, Z만 업데이트 (드래그 중에는 벽 재부착 없이)
      const currentPosition = this.dragState.selectedModel.getPosition()
      this.dragState.selectedModel.setPosition({
        x: newX,
        y: currentPosition.y, // Y 위치 유지
        z: newZ
      })
    } else {
      // 바닥 가구는 기존 충돌 감지 로직 적용
      const currentTime = Date.now()
      const shouldCheckCollision = currentTime - this.lastCollisionCheckTime > this.collisionCheckInterval

      let adjustedPosition = { x: newX, y: 0, z: newZ } // Y는 임시값

      if (shouldCheckCollision) {
        // 충돌 감지 및 자동 올라가기 적용 (Y축은 ModelManager에서 자동 계산)
        adjustedPosition = this.modelManager.checkCollisionAndAdjust(
          this.dragState.selectedModel, 
          newX, 
          0, // Y값은 ModelManager에서 자동 계산되므로 임시값
          newZ
        )
        
        this.lastCollisionCheckTime = currentTime
      } else {
        // 충돌 검사를 하지 않을 때는 현재 Y 위치 유지하고 X, Z만 업데이트
        const currentPosition = this.dragState.selectedModel.getPosition()
        adjustedPosition.y = currentPosition.y
      }

      // 조정된 위치로 모델 이동
      this.dragState.selectedModel.setPosition({
        x: adjustedPosition.x,
        y: adjustedPosition.y,
        z: adjustedPosition.z
      })
    }
  }

  // 드래그 평면과의 교차점을 계산하는 새로운 메서드
  private getDragPlaneIntersection(): THREE.Vector3 | null {
    this.raycaster.setFromCamera(this.mouse, this.camera)
    
    const intersectionPoint = new THREE.Vector3()
    const intersected = this.raycaster.ray.intersectPlane(this.dragState.dragPlane, intersectionPoint)
    
    return intersected ? intersectionPoint : null
  }

  private endDrag(): void {
    const wasDragging = this.dragState.isDragging
    const selectedModel = this.dragState.selectedModel
    const wasActuallyDragged = this.isDragStarted

    if (wasDragging && selectedModel) {
      console.log(`Ended dragging model ${selectedModel.getId()}`)
      
      // 드래그가 끝날 때 위치 조정
      if (wasActuallyDragged) {
        const currentPosition = selectedModel.getPosition()
        
        // 벽 가구인지 확인
        if (selectedModel.getType() === 'wallcube') {
          // 벽 가구는 ModelManager의 moveModel을 통해 벽 재부착
          this.modelManager.moveModel(selectedModel.getId(), currentPosition.x, currentPosition.z)
        } else {
          // 바닥 가구는 기존 로직 적용
          const clampedPosition = this.modelManager.clampToFloorWithBounds(selectedModel, currentPosition.x, currentPosition.z)
          const surfaceY = this.modelManager.calculateSurfaceY(selectedModel, clampedPosition.x, clampedPosition.z)
          
          selectedModel.setPosition({
            x: clampedPosition.x,
            y: surfaceY,
            z: clampedPosition.z
          })
          
          console.log(`Floor model positioned at (${clampedPosition.x}, ${surfaceY}, ${clampedPosition.z})`)
          
          // 드래그된 모델의 위치가 변경된 후, 다른 모든 모델들의 위치도 재계산
          console.log('Recalculating positions for other models after drag...')
          this.modelManager.recalculateOtherModelPositions(selectedModel.getId())
        }
      }
      
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
          const gizmoScreenX = (topPosition.x + 1) * rect.width / 2 + rect.left
          const gizmoScreenY = (-topPosition.y + 1) * rect.height / 2 + rect.top
          
          console.log(`Showing gizmo at screen position: (${gizmoScreenX}, ${gizmoScreenY})`)
          
          this.gizmoState.selectedModelId = selectedModel.getId()
          this.gizmoState.screenPosition = { x: gizmoScreenX, y: gizmoScreenY }
          
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
    // 호버 효과 구현 (선택사항) - 로그 없이 조용히 작동
    const intersections = this.getIntersectedModels() // 기본값 false로 로그 출력 안함
    
    if (intersections.length > 0) {
      // 마우스 커서 변경
      this.renderer.domElement.style.cursor = 'pointer'
    } else {
      this.renderer.domElement.style.cursor = 'default'
    }
  }

  private handleModelClick(model: BaseModel): void {
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