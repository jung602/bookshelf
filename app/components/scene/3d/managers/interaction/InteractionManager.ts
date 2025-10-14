import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ModelManager } from '../models/ModelManager'
import { BaseModel } from '../../objects/BaseModel'

// 상수 정의 (DPI 보정)
const Y_SCALE = 2.0 // 벽 가구 Y축 드래그 민감도
const BASE_DRAG_PX = 5
const DRAG_THRESHOLD = BASE_DRAG_PX * (typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1)
const CLICK_DURATION_THRESHOLD = 300

export interface DragState {
  isDragging: boolean
  selectedModel: BaseModel | null
  dragOffset: THREE.Vector3
  dragPlane: THREE.Plane
  startMouseY: number
  startModelY: number
  previousPosition: { x: number; y: number; z: number } | null
}

export interface GizmoState {
  visible: boolean
  selectedModelId: string | null
  screenPosition: { x: number; y: number } | null
}

export class InteractionManager {
  private scene: THREE.Scene
  private camera: THREE.Camera
  private renderer: THREE.WebGLRenderer
  private modelManager: ModelManager
  private controls?: OrbitControls
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private dragState: DragState
  private gizmoState: GizmoState
  private floorPlane: THREE.Plane
  private isDragStarted: boolean = false
  private clickStartTime: number = 0
  private clickStartPosition: { x: number; y: number } = { x: 0, y: 0 }
  private clickHandledOnMouseUp: boolean = false
  private _hoverScheduled: boolean = false
  private _dragCache: Map<THREE.Object3D, { renderOrder: Map<THREE.Mesh, number>; onBeforeRender: Map<THREE.Mesh, ((renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group) => void) | null>; material: Map<THREE.Mesh, { transparent?: boolean; opacity?: number; depthTest?: boolean; depthWrite?: boolean }>; } > = new Map()
  private suppressClearDepth: boolean = false
  private renderPixelatedPass?: { setDragMode?: (enabled: boolean) => void; setClearDepthController?: (controller: (suppress: boolean) => void) => void }

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
    onGizmoStateChange?: (gizmoState: GizmoState) => void,
    controls?: OrbitControls,
    renderPixelatedPass?: { setDragMode?: (enabled: boolean) => void; setClearDepthController?: (controller: (suppress: boolean) => void) => void }
  ) {
    this.scene = scene
    this.camera = camera
    this.renderer = renderer
    this.modelManager = modelManager
    this.onGizmoStateChange = onGizmoStateChange
    this.controls = controls
    this.renderPixelatedPass = renderPixelatedPass
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

    this.dragState = {
      isDragging: false,
      selectedModel: null,
      dragOffset: new THREE.Vector3(),
      dragPlane: new THREE.Plane(),
      startMouseY: 0,
      startModelY: 0,
      previousPosition: null
    }

    this.gizmoState = {
      visible: false,
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

  public setClearDepthSuppressed(value: boolean): void {
    this.suppressClearDepth = !!value
  }

  private setupEventListeners(): void {
    const canvas = this.renderer.domElement

    canvas.addEventListener('mousedown', this.boundMouseDown)
    canvas.addEventListener('mousemove', this.boundMouseMove)
    canvas.addEventListener('mouseup', this.boundMouseUp)
    canvas.addEventListener('click', this.boundClick)
    canvas.addEventListener('touchstart', this.boundTouchStart, { passive: false })
    canvas.addEventListener('touchmove', this.boundTouchMove, { passive: false })
    canvas.addEventListener('touchend', this.boundTouchEnd, { passive: false })
    canvas.addEventListener('contextmenu', this.boundContextMenu)
  }

  private updateMousePosition(clientX: number, clientY: number): void {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
  }

  private getIntersectedModels(isInteraction: boolean = false): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const meshes: THREE.Mesh[] = []
    const allModels = this.modelManager.getAllModels()

    allModels.forEach((model: BaseModel) => {
      if (!model.isModelLoaded()) return
      const modelGroup = model.getModel()
      if (!modelGroup) return

      // 모델 그룹 내부의 모든 메시를 찾아서 레이캐스팅 타겟으로 추가
      modelGroup.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.userData.modelId = model.getId()
          meshes.push(child)
        }
      })
    })

    if (meshes.length === 0) return []

    // 교차 검사
    const intersections = this.raycaster.intersectObjects(meshes, false)

    if (isInteraction) {
      // 상호작용 시 화면에 가장 가까운 것만 (closest)
      return intersections
    }

    return intersections
  }

  private getModelFromIntersection(intersection: THREE.Intersection, onlyDraggable: boolean = false): BaseModel | null {
    const intersectedObject = intersection.object
    const modelId = intersectedObject.userData.modelId
    
    if (modelId) {
      const model = this.modelManager.getModel(modelId)
      if (model && onlyDraggable) {
        // 모든 모델이 드래그 가능하다고 가정
        return model
      }
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
        this.prepareForDrag(selectedModel)
        this.dragState.isDragging = true
      }
    } else {
      this.dragState.isDragging = false
      this.dragState.selectedModel = null
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
      }
    }

    if (this.dragState.isDragging && this.dragState.selectedModel) {
      this.updateDrag()
    } else {
      this.scheduleHoverUpdate()
    }
  }

  private onMouseUp(event: MouseEvent): void {
    event.preventDefault()

    const clickDuration = Date.now() - this.clickStartTime
    const moveDistance = Math.hypot(
      event.clientX - this.clickStartPosition.x,
      event.clientY - this.clickStartPosition.y
    )

    const isClick = (clickDuration < CLICK_DURATION_THRESHOLD && moveDistance < DRAG_THRESHOLD && !this.isDragStarted)
    if (isClick) {
      this.clickHandledOnMouseUp = true
      if (this.dragState.selectedModel) {
        this.handleModelClick(this.dragState.selectedModel)
      } else {
        // 새로 피킹해서 클릭 처리
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
    }

    this.endDrag()
  }

  private onClick(event: MouseEvent): void {
    event.preventDefault()
    // mouseup에서 이미 처리된 클릭이면 무시
    if (this.clickHandledOnMouseUp) { this.clickHandledOnMouseUp = false; return }
    if (this.isDragStarted) { return }

    const clickDuration = Date.now() - this.clickStartTime
    const clickDistance = Math.hypot(
      event.clientX - this.clickStartPosition.x,
      event.clientY - this.clickStartPosition.y
    )
    if (clickDuration > CLICK_DURATION_THRESHOLD || clickDistance > DRAG_THRESHOLD) { return }

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
          this.prepareForDrag(selectedModel)
          this.dragState.isDragging = true
        }
      } else {
        this.dragState.isDragging = false
        this.dragState.selectedModel = null
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
        }
      }

      if (this.dragState.isDragging && this.dragState.selectedModel) {
        this.updateDrag()
      } else {
        this.scheduleHoverUpdate()
      }
    }
  }

  private onTouchEnd(event: TouchEvent): void {
    event.preventDefault()

    const clickDuration = Date.now() - this.clickStartTime
    const moveDistance = Math.hypot(
      (event.changedTouches[0]?.clientX ?? this.clickStartPosition.x) - this.clickStartPosition.x,
      (event.changedTouches[0]?.clientY ?? this.clickStartPosition.y) - this.clickStartPosition.y
    )

    const isClick = (clickDuration < CLICK_DURATION_THRESHOLD && moveDistance < DRAG_THRESHOLD && !this.isDragStarted)

    if (isClick) {
      if (this.dragState.selectedModel) {
        this.handleModelClick(this.dragState.selectedModel)
      } else {
        const touch = event.changedTouches[0]
        if (touch) {
          this.updateMousePosition(touch.clientX, touch.clientY)
          const intersections = this.getIntersectedModels(true)
          if (intersections.length > 0) {
            const selectedModel = this.getModelFromIntersection(intersections[0], true)
            if (selectedModel) this.handleModelClick(selectedModel)
          } else {
            this.hideGizmo()
          }
        }
      }
    }

    this.endDrag()
  }

  private prepareForDrag(model: BaseModel): void {
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

    // 2D 드래그를 위한 카메라 기준 평면 생성 (모델 위치를 지나는 평면)
    const cameraDirection = new THREE.Vector3()
    this.camera.getWorldDirection(cameraDirection)
    this.dragState.dragPlane = new THREE.Plane().setFromNormalAndCoplanarPoint(
      cameraDirection,
      new THREE.Vector3(modelPosition.x, modelPosition.y, modelPosition.z)
    )

    // 드래그 중 항상 위에 보이도록 렌더링 우선순위 올리기 (불투명 유지)
    this.setModelAlwaysOnTop(model, true)
    this.renderer.domElement.style.cursor = 'grabbing'
    
    // 드래그 중 orbit controls 비활성화
    if (this.controls) {
      this.controls.enabled = false
    }

    // 포스트프로세싱 패스 드래그 모드 활성화
    if (this.renderPixelatedPass && typeof this.renderPixelatedPass.setDragMode === 'function') {
      this.renderPixelatedPass.setDragMode(true)
    }
  }

  private updateDrag(): void {
    if (!this.dragState.selectedModel) return

    // 드래그 평면과의 교점 계산
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersectionPoint = new THREE.Vector3()
    const intersects = this.raycaster.ray.intersectPlane(this.dragState.dragPlane, intersectionPoint)

    if (!intersects) return

    const selectedModel = this.dragState.selectedModel

    // 모든 가구 공통: 2D 화면 드래그 → 월드 위치로 역투영 이동
    const isWallModel = selectedModel.getType() === 'wall'
    selectedModel.setPosition({
      x: intersectionPoint.x,
      y: isWallModel ? this.dragState.startModelY + (this.mouse.y - this.dragState.startMouseY) * Y_SCALE : intersectionPoint.y,
      z: intersectionPoint.z
    })

    // 기즈모 위치 업데이트
    this.showGizmoAtModelTop(selectedModel)
  }

  private endDrag(): void {
    const wasDragging = this.dragState.isDragging
    const selectedModel = this.dragState.selectedModel
    const wasActuallyDragged = this.isDragStarted

    if (wasDragging && selectedModel) {
      if (wasActuallyDragged) {
        const currentPosition = selectedModel.getPosition()

        // 드래그 종료 시 렌더링 우선순위/상태 복구
        this.setModelAlwaysOnTop(selectedModel, false)

        const isWallModel = selectedModel.getType() === 'wall'
        if (isWallModel) {
          // 벽 가구: 2D 드래그 종료 - 화면 위치에서 벽 레이캐스팅
          this.raycaster.setFromCamera(this.mouse, this.camera)
          const attachedToWall = this.modelManager.getWallManager().attachToVisibleWall(
            selectedModel,
            this.raycaster,
            this.camera
          )

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
            // 폴백: 안전한 위치 찾기
            const floorManager = this.modelManager.getFloorManager()

            // 먼저 현재 위치에서 배치 가능한지 확인
            if (floorManager.canPlaceOnFloor(selectedModel, currentPosition.x, currentPosition.z)) {
              const finalPosition = floorManager.calculateAdjustedPosition(
                selectedModel,
                currentPosition.x,
                currentPosition.y,
                currentPosition.z
              )
              selectedModel.setPosition(finalPosition)
            } else {
              // 현재 위치가 안전하지 않으면 가까운 유효 위치 찾기
              const nearestValid = floorManager.findNearestValidPositionNear(selectedModel, currentPosition.x, currentPosition.z)
              const isRug = selectedModel.getType() === 'rug'
              
              if (nearestValid) {
                let newY = isRug
                  ? floorManager.calculateModelFloorY(selectedModel, nearestValid.x, nearestValid.z)
                  : floorManager.calculateSurfaceY(selectedModel, nearestValid.x, nearestValid.z)
                if (isRug) newY += 0.013
                selectedModel.setPosition({ x: nearestValid.x, y: newY, z: nearestValid.z })
              } else {
                // 마지막 폴백: 경계 클램프 및 표면 높이 계산
                const clamped = floorManager.clampToBounds(selectedModel, currentPosition.x, currentPosition.z)
                let newY = isRug
                  ? floorManager.calculateModelFloorY(selectedModel, clamped.x, clamped.z)
                  : floorManager.calculateSurfaceY(selectedModel, clamped.x, clamped.z)
                if (isRug) newY += 0.013
                selectedModel.setPosition({ x: clamped.x, y: newY, z: clamped.z })
              }
            }

            // 다른 모델들과의 충돌/지지 관계 재계산 (이전 위치 정보 포함)
            floorManager.recalculateOtherModelPositions(
              selectedModel.getId(),
              this.dragState.previousPosition || undefined
            )
          }
          // 드래그가 어떤 방식이든 끝났다면, 주변 모델들의 지지 관계도 안전하게 재계산
          const floorManagerAfter = this.modelManager.getFloorManager()
          floorManagerAfter.recalculateOtherModelPositions(
            selectedModel.getId(),
            this.dragState.previousPosition || undefined
          )
        }

        // 드래그 완료 후 바운딩박스 헬퍼 업데이트
        const isWallModelForBBox = selectedModel.getType() === 'wall'
        if (isWallModelForBBox) {
          this.modelManager.getWallManager().updateModelBoundingBox(selectedModel.getId())
        } else {
          this.modelManager.getFloorManager().updateModelBoundingBox(selectedModel.getId())
        }
      } else {
        // 드래그 안 되었으면 원래 위치로 복귀(필요 시)
        if (this.dragState.previousPosition) {
          selectedModel.setPosition(this.dragState.previousPosition)
        }

        // 렌더링 상태 복구
        this.setModelAlwaysOnTop(selectedModel, false)
      }
    }

    this.dragState.isDragging = false
    this.dragState.selectedModel = null
    this.dragState.dragOffset.set(0, 0, 0)
    this.dragState.startMouseY = 0
    this.dragState.startModelY = 0
    this.dragState.previousPosition = null
    this.isDragStarted = false
    this.renderer.domElement.style.cursor = 'default'
    
    // 드래그 종료 시 orbit controls 다시 활성화
    if (this.controls) {
      this.controls.enabled = true
    }

    // 드래그 모드 해제 및 clearDepth 억제 해제 보장
    this.setClearDepthSuppressed(false)
    if (this.renderPixelatedPass && typeof this.renderPixelatedPass.setDragMode === 'function') {
      this.renderPixelatedPass.setDragMode(false)
    }
  }

  private updateHover(): void {
    const intersections = this.getIntersectedModels()

    if (intersections.length > 0) {
      this.renderer.domElement.style.cursor = 'pointer'
    } else {
      this.renderer.domElement.style.cursor = 'default'
    }
  }

  private scheduleHoverUpdate(): void {
    if (this._hoverScheduled) return
    this._hoverScheduled = true
    requestAnimationFrame(() => {
      this._hoverScheduled = false
      this.updateHover()
    })
  }

  private handleModelClick(model: BaseModel): void {
    this.showGizmoAtModelTop(model)
  }

  private showGizmoAtModelTop(model: BaseModel): void {
    // 모델의 AABB로 상단 월드 좌표 계산
    const object = model.getModel()
    if (!object) return

    // 매트릭스 업데이트를 통해 최신 위치/회전 반영
    object.updateMatrixWorld(true)
    
    // 카메라 매트릭스도 업데이트 (projection 정확도 향상)
    if (this.camera.parent) {
      this.camera.parent.updateMatrixWorld(true)
    }
    this.camera.updateMatrixWorld(true)

    const box = new THREE.Box3().setFromObject(object)
    const topCenter = new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, (box.min.z + box.max.z) / 2)

    // 월드 → 스크린 좌표 변환
    topCenter.project(this.camera)
    const rect = this.renderer.domElement.getBoundingClientRect()
    const screenX = (topCenter.x + 1) / 2 * rect.width + rect.left
    const screenY = (-topCenter.y + 1) / 2 * rect.height + rect.top

    this.gizmoState = {
      visible: true,
      selectedModelId: model.getId(),
      screenPosition: { x: screenX, y: screenY }
    }

    if (this.onGizmoStateChange) this.onGizmoStateChange(this.gizmoState)
  }

  private hideGizmo(): void {
    if (!this.gizmoState.visible) return
    this.gizmoState.visible = false
    this.gizmoState.selectedModelId = null
    this.gizmoState.screenPosition = null
    if (this.onGizmoStateChange) this.onGizmoStateChange(this.gizmoState)
  }

  public rotateModel(modelId: string, direction: 'left' | 'right'): void {
    const model = this.modelManager.getModel(modelId)
    if (!model) return

    // 회전 전 위치 스냅샷 (상부 지지 모델 재계산에 사용)
    const prev = model.getPosition()
    const previousPosition = { x: prev.x, y: prev.y, z: prev.z }

    // BaseModel의 rotateY90 메서드 사용
    if (direction === 'left') {
      // 왼쪽 회전: 3번 90도 회전 = -90도
      model.rotateY90()
      model.rotateY90()
      model.rotateY90()
    } else {
      // 오른쪽 회전: 1번 90도 회전
      model.rotateY90()
    }

    const isWallModel = model.getType() === 'wallcube' || model.getType() === 'wall'
    if (isWallModel) {
      // 벽 가구: 회전 후 벽에 다시 부착
      const pos = model.getPosition()
      this.modelManager.getWallManager().attachToNearestWall(model, pos.x, pos.z, pos.y)
      // 주변 바닥 가구들의 지지 관계 재계산 (안전상 호출)
      this.modelManager.getFloorManager().recalculateOtherModelPositions(modelId, previousPosition)
    } else {
      // 바닥 가구: 회전 후 재배치 및 충돌 안정화
      const pos = model.getPosition()
      const floorManager = this.modelManager.getFloorManager()

      // 1단계: 현재 위치에 배치 가능한지 확인
      let placementSuccessful = false
      
      try {
        if (floorManager.canPlaceOnFloor(model, pos.x, pos.z)) {
          floorManager.placeOnFloor(model, pos.x, pos.z)
          placementSuccessful = true
        }
      } catch {
        // 실패 시 다음 단계로
      }

      // 2단계: 현재 위치가 불가능하면 근처 유효 위치 찾기
      if (!placementSuccessful) {
        const nearestValid = floorManager.findNearestValidPositionNear(model, pos.x, pos.z)
        if (nearestValid) {
          try {
            const newY = floorManager.calculateSurfaceY(model, nearestValid.x, nearestValid.z)
            model.setPosition({ x: nearestValid.x, y: newY, z: nearestValid.z })
            placementSuccessful = true
          } catch {
            // 실패 시 다음 단계로
          }
        }
      }

      // 3단계: 근처에도 없으면 전역 최적 위치 찾기
      if (!placementSuccessful) {
        const optimalPosition = floorManager.findOptimalPlacement(model)
        if (optimalPosition) {
          model.setPosition(optimalPosition)
          placementSuccessful = true
        }
      }

      // 4단계: 배치할 공간이 없으면 모델 삭제
      if (!placementSuccessful) {
        this.modelManager.removeModel(modelId)
        this.hideGizmo()
        return
      }

      // 다른 모델들 재계산
      floorManager.recalculateOtherModelPositions(modelId, previousPosition)
    }

    // 회전 후 기즈모 위치 업데이트
    this.showGizmoAtModelTop(model)
    
    // 회전 후 바운딩박스 업데이트
    this.modelManager.updateModelBoundingBox(modelId)
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
    
    // 드래그 캐시 정리
    this._dragCache.clear()
  }


  /**
   * 2D 드래그 종료 시 화면 위치에서 보이는 표면(바닥 또는 다른 가구)에 floorModel 부착
   */
  private attachFloorModelToVisibleFloor(model: BaseModel): boolean {
    // 현재 마우스 위치에서 레이캐스팅
    this.raycaster.setFromCamera(this.mouse, this.camera)

    const meshes: THREE.Mesh[] = []

    // 바닥 메시 추가
    const floorMeshes = this.modelManager.getFloorManager().getFloorMeshes()
    meshes.push(...floorMeshes)

    // 다른 가구들의 모델 메시 추가 (지지 관계 고려)
    const allModels = this.modelManager.getAllModels()
    allModels.forEach((otherModel) => {
      const isOtherWallModel = otherModel.getType() === 'wall'
      if (otherModel.getId() !== model.getId() &&
          !isOtherWallModel &&
          otherModel.isModelLoaded()) {
        const modelGroup = otherModel.getModel()
        if (modelGroup) {
          // 모델 그룹 내부의 모든 메시를 찾아서 추가
          modelGroup.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.userData.modelId = otherModel.getId()
              meshes.push(child)
            }
          })
        }
      }
    })

    if (meshes.length === 0) {
      return false
    }

    // 모든 모델과의 교차점 검사
    const intersections = this.raycaster.intersectObjects(meshes, false)

    if (intersections.length > 0) {
      const closestIntersection = intersections[0]
      const hitObject = closestIntersection.object as THREE.Mesh
      const hitPoint = closestIntersection.point

      // 히트한 객체가 바닥인지 다른 가구인지 판별
      const isFloor = hitObject.userData.isFloor === true

      if (isFloor) {
        // 바닥 위에 배치
        const floorManager = this.modelManager.getFloorManager()
        const adjusted = floorManager.calculateAdjustedPosition(
          model,
          hitPoint.x,
          hitPoint.y,
          hitPoint.z
        )
        model.setPosition(adjusted)
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
          }
        }
      }
    }

    return false
  }

  /**
   * 모든 가구의 렌더링 우선순위/상태 제어 (드래그 중 항상 위, 불투명 유지)
   */
  private setModelAlwaysOnTop(model: BaseModel, alwaysOnTop: boolean): void {
    try {
      const threeObject = model.getModel()
      if (!threeObject) return
      if (alwaysOnTop) {
        // 스냅샷 준비
        const snap = {
          renderOrder: new Map<THREE.Mesh, number>(),
          onBeforeRender: new Map<THREE.Mesh, ((renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, geometry: THREE.BufferGeometry, material: THREE.Material, group: THREE.Group) => void) | null>(),
          material: new Map<THREE.Mesh, { transparent?: boolean; opacity?: number; depthTest?: boolean; depthWrite?: boolean }>()
        }
        // 저장 + 적용
        threeObject.traverse((child: THREE.Object3D) => {
          const mesh = child as THREE.Mesh
          if (!mesh.isMesh) return
          snap.renderOrder.set(mesh, mesh.renderOrder)
          snap.onBeforeRender.set(mesh, mesh.onBeforeRender ?? null)
          // 머티리얼 플래그도 복원용으로만 저장(변경하지 않음)
          const mat = mesh.material as THREE.MeshStandardMaterial
          if (mat) {
            snap.material.set(mesh, {
              transparent: mat.transparent, opacity: mat.opacity,
              depthTest: mat.depthTest, depthWrite: mat.depthWrite
            })
          }
          mesh.renderOrder = 999999
          mesh.onBeforeRender = (renderer: THREE.WebGLRenderer) => {
            if (!this.suppressClearDepth) {
              renderer.clearDepth()
            }
          }
          // 깊이 테스트/쓰기는 유지(반투명 방지)
          if (mat) {
            mat.depthTest = true
            mat.depthWrite = true
          }
        })
        this._dragCache.set(threeObject, snap)
      } else {
        const snap = this._dragCache.get(threeObject)
        threeObject.traverse((child: THREE.Object3D) => {
          const mesh = child as THREE.Mesh
          if (!mesh.isMesh) return
          const origOrder = snap?.renderOrder.get(mesh)
          if (typeof origOrder === 'number') mesh.renderOrder = origOrder
          const prevBefore = snap?.onBeforeRender.get(mesh)
          if (prevBefore !== undefined) {
            mesh.onBeforeRender = prevBefore || (() => {})
          }
          const origMat = snap?.material.get(mesh)
          const mat = mesh.material as THREE.MeshStandardMaterial
          if (origMat && mat) {
            if (origMat.transparent !== undefined) mat.transparent = origMat.transparent
            if (origMat.opacity !== undefined) mat.opacity = origMat.opacity
            if (origMat.depthTest !== undefined) mat.depthTest = origMat.depthTest
            if (origMat.depthWrite !== undefined) mat.depthWrite = origMat.depthWrite
          }
        })
        if (snap) this._dragCache.delete(threeObject)
      }
    } catch {
      // ignore
    }
  }
}
