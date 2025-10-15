import * as THREE from 'three'
import { BaseModel } from '../../objects/BaseModel'
import { SceneIndex } from '../SceneIndex'
import { BaseModelManager } from './BaseModelManager'
import { calculateBoundingBox } from '../visualization/BoundingBoxUtils'

// 상수 정의
const CUBE_SIZE = 0.1

export class WallModelManager extends BaseModelManager {
  constructor(scene: THREE.Scene, models: Map<string, BaseModel>, sceneIndex: SceneIndex) {
    super(scene, models, sceneIndex, 0xffff00)
  }

  // BaseModelManager의 추상 메서드 구현
  public async addModel(...args: unknown[]): Promise<string> {
    // addWallModel에 위임
    if (args.length >= 1 && typeof args[0] === 'object') {
      return this.addWallModel(args[0] as BaseModel, args[1] as {
        position?: { x: number, y: number, z: number },
        useOptimalPlacement?: boolean
      })
    }
    throw new Error('Invalid arguments for WallModelManager.addModel')
  }

  // 벽 가구 추가 메소드
  public async addWallModel(
    model: BaseModel, 
    options: {
      position?: { x: number, y: number, z: number },
      useOptimalPlacement?: boolean
    } = {}
  ): Promise<string> {
    try {
      await model.load()
      
      const { position, useOptimalPlacement = true } = options
      const defaultPosition = position || { x: 0, y: 0, z: 0 }
      
      // 벽 가구 배치 가능 여부 검사
      if (!this.canPlaceOnWall(model, defaultPosition.x, defaultPosition.z)) {
        model.dispose()
        throw new Error(`벽 가구를 배치할 수 없습니다. 벽이 가구보다 작거나 벽이 없습니다.`)
      }
      
      if (useOptimalPlacement) {
        // 최적의 위치 찾기 (충돌 회피 포함)
        const optimalPosition = this.findOptimalWallPosition(model, defaultPosition.x, defaultPosition.z, position?.y)
        if (!optimalPosition) {
          model.dispose()
          throw new Error('벽에 배치할 수 있는 적절한 공간이 없습니다.')
        }
        
        // 최적 위치에 벽 가구 부착
        const attached = this.attachToNearestWall(model, optimalPosition.x, optimalPosition.z, optimalPosition.y)
        if (!attached) {
          model.dispose()
          throw new Error('벽에 부착할 수 없습니다.')
        }
      } else {
        // 지정된 위치에 직접 부착
        const attached = this.attachToNearestWall(model, defaultPosition.x, defaultPosition.z, defaultPosition.y)
        if (!attached) {
          model.dispose()
          throw new Error('벽에 부착할 수 없습니다.')
        }
      }
      
      model.addToScene(this.scene)
      this.models.set(model.getId(), model)
      
      // FloorLamp 모델인 경우 현재 테마 적용
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (model.getType() === 'floorlamp' && typeof (model as any).setTheme === 'function') {
        const isDarkMode = typeof window !== 'undefined' && 
          (document.documentElement.classList.contains('dark') || 
           window.matchMedia('(prefers-color-scheme: dark)').matches)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(model as any).setTheme(isDarkMode)
      }
      
      // 바운딩박스 헬퍼 업데이트
      if (this.visualizer.isEnabled()) {
        this.visualizer.updateHelper(model)
      }
      
      return model.getId()
    } catch (error) {
      // 개발 환경에서만 에러 로깅
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to add wall model:', error)
      }
      throw error
    }
  }

  private findNearestWall(x: number, z: number): THREE.Mesh | null {
    const walls: THREE.Mesh[] = this.sceneIndex.getWallMeshes()
    if (walls.length === 0) return null
    let nearestWall: THREE.Mesh | null = null
    let minDistance = Infinity
    walls.forEach(wall => {
      const wallPos = wall.position
      const distance = Math.sqrt(Math.pow(x - wallPos.x, 2) + Math.pow(z - wallPos.z, 2))
      if (distance < minDistance) {
        minDistance = distance
        nearestWall = wall
      }
    })
    return nearestWall
  }

  private isModelSmallerThanWall(model: BaseModel, wall: THREE.Mesh): boolean {
    const modelBox = calculateBoundingBox(model)
    if (!modelBox) return false
    
    const wallScale = wall.scale
    const modelWidth = modelBox.max.x - modelBox.min.x
    const modelHeight = modelBox.max.y - modelBox.min.y
    const wallWidth = wallScale.x
    const wallHeight = wallScale.y
    return modelWidth < wallWidth && modelHeight < wallHeight
  }

  private canPlaceOnWall(model: BaseModel, x: number, z: number): boolean {
    const nearestWall = this.findNearestWall(x, z)
    if (!nearestWall) {
      return false
    }
    return this.isModelSmallerThanWall(model, nearestWall)
  }

  // 특정 점이 벽 범위 안에 있는지 확인
  private isPointInWallBounds(
    point: { x: number; y: number; z: number },
    wall: THREE.Mesh
  ): boolean {
    const wallPos = wall.position
    const wallScale = wall.scale
    const wallRotation = wall.rotation.y
    
    // Y 좌표 범위 체크
    const wallMinY = wallPos.y - wallScale.y / 2
    const wallMaxY = wallPos.y + wallScale.y / 2
    if (point.y < wallMinY || point.y > wallMaxY) {
      return false
    }
    
    // 벽 방향에 따라 X 또는 Z 범위 체크
    if (Math.abs(wallRotation) < 0.1 || Math.abs(wallRotation - Math.PI) < 0.1) {
      // X 방향 벽 (Z축 평행)
      const wallMinX = wallPos.x - wallScale.x / 2
      const wallMaxX = wallPos.x + wallScale.x / 2
      return point.x >= wallMinX && point.x <= wallMaxX
    } else {
      // Z 방향 벽 (X축 평행)
      const wallMinZ = wallPos.z - wallScale.x / 2
      const wallMaxZ = wallPos.z + wallScale.x / 2
      return point.z >= wallMinZ && point.z <= wallMaxZ
    }
  }

  // 특정 위치에서 가구가 벽 범위 안에 완전히 들어가는지 검증
  private canPlaceAtWallPosition(
    model: BaseModel,
    wall: THREE.Mesh,
    x: number,
    y: number,
    z: number
  ): boolean {
    const modelBox = calculateBoundingBox(model, x, z)
    if (!modelBox) return false
    
    // 임시로 Y 위치 조정하여 바운딩 박스 계산
    const modelHeight = modelBox.max.y - modelBox.min.y
    const adjustedMinY = y - modelHeight / 2
    const adjustedMaxY = y + modelHeight / 2
    
    // 가구 바운딩 박스의 주요 샘플 포인트들
    const samplePoints = [
      // 8개 모서리
      { x: modelBox.min.x, y: adjustedMinY, z: modelBox.min.z },
      { x: modelBox.max.x, y: adjustedMinY, z: modelBox.min.z },
      { x: modelBox.min.x, y: adjustedMaxY, z: modelBox.min.z },
      { x: modelBox.max.x, y: adjustedMaxY, z: modelBox.min.z },
      { x: modelBox.min.x, y: adjustedMinY, z: modelBox.max.z },
      { x: modelBox.max.x, y: adjustedMinY, z: modelBox.max.z },
      { x: modelBox.min.x, y: adjustedMaxY, z: modelBox.max.z },
      { x: modelBox.max.x, y: adjustedMaxY, z: modelBox.max.z },
      // 중앙점
      { x: (modelBox.min.x + modelBox.max.x) / 2, y, z: (modelBox.min.z + modelBox.max.z) / 2 },
      // 상/하단 중앙
      { x: (modelBox.min.x + modelBox.max.x) / 2, y: adjustedMinY, z: (modelBox.min.z + modelBox.max.z) / 2 },
      { x: (modelBox.min.x + modelBox.max.x) / 2, y: adjustedMaxY, z: (modelBox.min.z + modelBox.max.z) / 2 }
    ]
    
    // 모든 샘플 포인트가 벽 범위 안에 있는지 확인
    for (const point of samplePoints) {
      if (!this.isPointInWallBounds(point, wall)) {
        return false
      }
    }
    
    return true
  }

  public attachToNearestWall(model: BaseModel, targetX: number, targetZ: number, targetY?: number): boolean {
    const wall = this.findNearestWall(targetX, targetZ)
    if (!wall) {
      return false
    }
    
    // 크기 검증: 벽보다 큰 가구는 부착 불가
    if (!this.isModelSmallerThanWall(model, wall)) {
      return false
    }
    
    // 모델 바운딩 박스 계산 (가구 크기를 고려한 정확한 클램핑)
    const modelBox = calculateBoundingBox(model)
    if (!modelBox) {
      return false
    }
    
    const modelHalfWidth = (modelBox.max.x - modelBox.min.x) / 2
    const modelHalfHeight = (modelBox.max.y - modelBox.min.y) / 2
    
    const wallPos = wall.position
    const wallScale = wall.scale
    const wallRotation = wall.rotation.y
    let attachX = wallPos.x
    let attachY = wallPos.y
    let attachZ = wallPos.z
    
    // 바닥 높이 계산 (바닥 관통 방지)
    const floorHeight = this.getFloorHeight(targetX, targetZ)
    const modelBottomOffset = this.getModelBottomOffset(model)
    const minAllowedY = floorHeight - modelBottomOffset + modelHalfHeight
    
    if (targetY !== undefined) {
      const wallMinY = wallPos.y - wallScale.y/2 + modelHalfHeight
      const wallMaxY = wallPos.y + wallScale.y/2 - modelHalfHeight
      // 사용자 지정 Y 좌표를 벽 범위와 바닥 관통 방지 조건 내에서 적용
      attachY = Math.max(minAllowedY, Math.max(wallMinY, Math.min(wallMaxY, targetY)))
    } else {
      // targetY가 없으면 벽 중앙(1.5) 또는 벽 최소 Y 중 큰 값 사용
      const wallMinY = wallPos.y - wallScale.y/2 + modelHalfHeight
      const preferredY = 1.5 // 벽 중앙 높이
      attachY = Math.max(minAllowedY, Math.max(wallMinY, Math.min(wallPos.y + wallScale.y/2 - modelHalfHeight, preferredY)))
    }
    
    // 벽 방향에 따라 위치 및 회전 설정
    const offsetDistance = 0.01 // 벽에 딱 붙도록 최소 오프셋
    if (Math.abs(wallRotation) < 0.1 || Math.abs(wallRotation - Math.PI) < 0.1) {
      // 가구 크기를 고려한 X 방향 클램핑
      const wallMinX = wallPos.x - wallScale.x/2 + modelHalfWidth
      const wallMaxX = wallPos.x + wallScale.x/2 - modelHalfWidth
      const clampedX = Math.max(wallMinX, Math.min(wallMaxX, targetX))
      attachX = clampedX
      attachZ = wallRotation < 0.1 ? wallPos.z + offsetDistance : wallPos.z - offsetDistance
      // 벽과 평행하게 회전 설정
      this.alignModelToWall(model, wallRotation)
    } else {
      // 가구 크기를 고려한 Z 방향 클램핑
      const wallMinZ = wallPos.z - wallScale.x/2 + modelHalfWidth
      const wallMaxZ = wallPos.z + wallScale.x/2 - modelHalfWidth
      const clampedZ = Math.max(wallMinZ, Math.min(wallMaxZ, targetZ))
      attachZ = clampedZ
      attachX = Math.abs(wallRotation - Math.PI/2) < 0.1 ? wallPos.x + offsetDistance : wallPos.x - offsetDistance
      // 벽과 평행하게 회전 설정
      this.alignModelToWall(model, wallRotation)
    }
    
    // 최종 위치 검증: 가구가 벽 범위 안에 완전히 들어가는지 확인
    if (!this.canPlaceAtWallPosition(model, wall, attachX, attachY, attachZ)) {
      return false // 벽 범위를 벗어나면 부착 실패
    }
    
    model.setPosition({ x: attachX, y: attachY, z: attachZ })
    return true
  }

  // 모델을 벽과 평행하게 정렬 (wallRotation 또는 wallNormal 지원)
  public alignModelToWall(model: BaseModel, wallRotationOrNormal: number | THREE.Vector3, camera?: THREE.Camera): void {
    let targetRotation: number
    
    if (typeof wallRotationOrNormal === 'number') {
      // 회전 각도 직접 사용
      targetRotation = wallRotationOrNormal
    } else {
      // 법선 벡터에서 회전 각도 계산
      const wallNormal = wallRotationOrNormal.clone()
      
      // 카메라가 제공된 경우, 카메라 방향을 고려하여 법선 조정
      if (camera) {
        const cameraDirection = new THREE.Vector3()
        camera.getWorldDirection(cameraDirection)
        
        if (wallNormal.dot(cameraDirection) > 0) {
          wallNormal.negate() // 카메라 쪽을 향하면 반대로
        }
      }
      
      targetRotation = Math.atan2(wallNormal.x, wallNormal.z)
    }
    
    const modelObj = model.getModel()
    if (modelObj) {
      const currentRotation = model.getRotation()
      model.setRotation({ y: targetRotation })
      modelObj.rotation.set(currentRotation.x, targetRotation, currentRotation.z)
    }
  }

  // 벽의 법선 벡터 계산 (카메라 방향 고려 옵션)
  public getWallNormal(wall: THREE.Mesh, camera?: THREE.Camera): THREE.Vector3 {
    // 벽의 월드 매트릭스에서 법선 벡터 추출
    const wallMatrix = wall.matrixWorld
    const wallNormal = new THREE.Vector3(0, 0, 1) // 기본 법선
    wallNormal.transformDirection(wallMatrix).normalize()

    // 카메라 방향과 비교해서 바깥쪽을 향하도록 조정
    if (camera) {
      const cameraDirection = new THREE.Vector3()
      camera.getWorldDirection(cameraDirection)

      if (wallNormal.dot(cameraDirection) > 0) {
        wallNormal.negate() // 카메라 쪽을 향하면 반대로
      }
    }

    return wallNormal
  }

  // 특정 벽 메시에 모델 부착
  public attachToSpecificWall(model: BaseModel, wall: THREE.Mesh, hitPoint: THREE.Vector3, camera?: THREE.Camera): boolean {
    try {
      // 크기 검증: 벽보다 큰 가구는 부착 불가
      if (!this.isModelSmallerThanWall(model, wall)) {
        return false
      }
      
      // 벽의 법선 벡터 계산
      const wallNormal = this.getWallNormal(wall, camera)

      // 벽에 딱 붙도록 설정 (오프셋 최소화)
      const offsetDistance = 0.01
      const attachPosition = hitPoint.clone().add(wallNormal.clone().multiplyScalar(offsetDistance))

      // 벽/모델 AABB 기반 Y 클램프 (폴백 포함)
      let minClamp = 0.3
      let maxClamp = 2.5
      const wallBox = new THREE.Box3().setFromObject(wall)
      const obj = model.getModel()
      if (wallBox && isFinite(wallBox.min.y) && isFinite(wallBox.max.y)) {
        minClamp = wallBox.min.y + 0.05
        maxClamp = wallBox.max.y - 0.05
        if (obj) {
          const mb = new THREE.Box3().setFromObject(obj)
          const mH = mb.max.y - mb.min.y
          if (isFinite(mH) && mH > 0) {
            minClamp = wallBox.min.y + mH * 0.5
            maxClamp = wallBox.max.y - mH * 0.05
          }
        }
      }
      const clampedY = Math.max(minClamp, Math.min(maxClamp, hitPoint.y))
      attachPosition.y = clampedY

      // 모델 위치/방향 설정 (벽을 바라보도록 정렬)
      model.setPosition({ x: attachPosition.x, y: attachPosition.y, z: attachPosition.z })
      this.alignModelToWall(model, wallNormal, camera)

      // 최종 위치 검증: 가구가 벽 범위 안에 완전히 들어가는지 확인
      if (!this.canPlaceAtWallPosition(model, wall, attachPosition.x, attachPosition.y, attachPosition.z)) {
        return false // 벽 범위를 벗어나면 부착 실패
      }

      return true
    } catch {
      return false
    }
  }

  // 레이캐스팅을 통해 보이는 벽에 모델 부착
  public attachToVisibleWall(model: BaseModel, raycaster: THREE.Raycaster, camera: THREE.Camera): boolean {
    // 씬에서 벽 객체들만 가져오기 (userData.isWall === true)
    const walls: THREE.Object3D[] = []
    this.scene.traverse(obj => { 
      if (obj.userData?.isWall === true) walls.push(obj) 
    })

    if (walls.length === 0) {
      return false
    }

    // 벽들과의 교차점 검사 (하위까지 재귀)
    const intersections = raycaster.intersectObjects(walls, true)

    if (intersections.length > 0) {
      const closestIntersection = intersections[0]
      const hitWall = closestIntersection.object as THREE.Mesh
      const hitPoint = closestIntersection.point

      // 히트한 벽에 모델 부착
      return this.attachToSpecificWall(model, hitWall, hitPoint, camera)
    }

    return false
  }

  public repositionWallModelsAfterWallChange(): string[] {
    const idsToDelete: string[] = []
    const wallModels = Array.from(this.models.values()).filter(m => m.getType() === 'wall' && m.isModelLoaded())
    wallModels.forEach(model => {
      const pos = model.getPosition()
      const ok = this.attachToNearestWall(model, pos.x, pos.z, pos.y)
      if (!ok) {
        idsToDelete.push(model.getId())
      }
    })
    return idsToDelete
  }

  // 벽 가구 최적 위치 찾기 (충돌 회피)
  private findOptimalWallPosition(
    model: BaseModel, 
    targetX: number, 
    targetZ: number, 
    preferredY?: number
  ): { x: number; z: number; y: number } | null {
    // 1. 선호하는 Y 위치 설정 (기본값: 1.5 - 벽 중앙)
    const defaultY = preferredY !== undefined ? preferredY : 1.5
    
    // 2. 목표 위치에서 충돌 검사
    if (!this.hasWallCollisionAt(model, targetX, targetZ, defaultY)) {
      return { x: targetX, z: targetZ, y: defaultY }
    }
    

    
    // 3. 같은 벽에서 다른 높이 시도
    const sameWallPositions = this.generateSameWallPositions(targetX, targetZ, defaultY)
    for (const pos of sameWallPositions) {
      if (!this.hasWallCollisionAt(model, pos.x, pos.z, pos.y)) {
        return pos
      }
    }
    
    // 4. 다른 벽에서 시도
    const otherWallPositions = this.generateOtherWallPositions(targetX, targetZ, defaultY)
    for (const pos of otherWallPositions) {
      if (this.canPlaceOnWall(model, pos.x, pos.z) && !this.hasWallCollisionAt(model, pos.x, pos.z, pos.y)) {
        return pos
      }
    }
    
    return null
  }

  // 같은 벽에서 다른 높이 후보 생성
  private generateSameWallPositions(x: number, z: number, originalY: number): { x: number; z: number; y: number }[] {
    const positions: { x: number; z: number; y: number }[] = []
    
    // Y 좌표 후보들 (벽 중앙 기준으로 위아래)
    const yCandidates = [
      originalY + 0.3, // 약간 위
      originalY - 0.3, // 약간 아래  
      originalY + 0.6, // 더 위
      originalY - 0.6, // 더 아래
      2.0,             // 벽 상단 근처
      1.0,             // 벽 하단 근처
      0.5              // 바닥 근처
    ]
    
    // X, Z 위치도 약간씩 변경해서 시도
    const xyOffsets = [
      { x: 0, z: 0 },     // 원래 위치
      { x: 0.2, z: 0 },   // 오른쪽으로
      { x: -0.2, z: 0 },  // 왼쪽으로
      { x: 0, z: 0.2 },   // 앞으로
      { x: 0, z: -0.2 }   // 뒤로
    ]
    
    for (const yCandidate of yCandidates) {
      for (const offset of xyOffsets) {
        positions.push({
          x: x + offset.x,
          z: z + offset.z,
          y: yCandidate
        })
      }
    }
    
    return positions
  }

  // 다른 벽 위치 후보 생성
  private generateOtherWallPositions(originalX: number, originalZ: number, preferredY: number): { x: number; z: number; y: number }[] {
    const positions: { x: number; z: number; y: number }[] = []
    const walls = this.sceneIndex.getWallMeshes()
    
    for (const wall of walls) {
      const wallPos = wall.position
      
      // 원래 위치와 다른 벽인지 확인 (거리로 판단)
      const distance = Math.sqrt(Math.pow(originalX - wallPos.x, 2) + Math.pow(originalZ - wallPos.z, 2))
      if (distance < 0.5) continue // 같은 벽이면 스킵
      
      // 해당 벽의 여러 위치 시도
      const wallPositions = [
        { x: wallPos.x, z: wallPos.z, y: preferredY },       // 벽 중앙, 선호 높이
        { x: wallPos.x, z: wallPos.z, y: 1.5 },              // 벽 중앙, 기본 높이
        { x: wallPos.x + 0.3, z: wallPos.z, y: preferredY }, // 벽 오른쪽
        { x: wallPos.x - 0.3, z: wallPos.z, y: preferredY }, // 벽 왼쪽
        { x: wallPos.x, z: wallPos.z + 0.3, y: preferredY }, // 벽 앞쪽
        { x: wallPos.x, z: wallPos.z - 0.3, y: preferredY }  // 벽 뒤쪽
      ]
      
      positions.push(...wallPositions)
    }
    
    return positions
  }

  // 벽 가구 충돌 검사 (3D 위치 포함)
  private hasWallCollisionAt(model: BaseModel, x: number, z: number, y: number): boolean {
    const modelGroup = model.getModel()
    if (!modelGroup) return false

    // 모델 크기 계산 (캐시 사용)
    const tempBounds = calculateBoundingBox(model)
    if (!tempBounds) return false
    
    const modelSize = {
      width: tempBounds.max.x - tempBounds.min.x,
      height: tempBounds.max.y - tempBounds.min.y,
      depth: tempBounds.max.z - tempBounds.min.z
    }

    // 다른 벽 가구들과의 충돌 검사
    for (const [otherId, otherModel] of this.models) {
      const isOtherWallModel = otherModel.getType() === 'wall'
      if (otherId === model.getId() || !isOtherWallModel) continue
      
      const otherPos = otherModel.getPosition()
      const otherBounds = calculateBoundingBox(otherModel)
      if (!otherBounds) continue

      const otherSize = {
        width: otherBounds.max.x - otherBounds.min.x,
        height: otherBounds.max.y - otherBounds.min.y,
        depth: otherBounds.max.z - otherBounds.min.z
      }

      // 3D 충돌 검사
      const xDistance = Math.abs(x - otherPos.x)
      const yDistance = Math.abs(y - otherPos.y)
      const zDistance = Math.abs(z - otherPos.z)
      
      const xThreshold = (modelSize.width + otherSize.width) / 2 + 0.05
      const yThreshold = (modelSize.height + otherSize.height) / 2 + 0.05  
      const zThreshold = (modelSize.depth + otherSize.depth) / 2 + 0.05

      if (xDistance < xThreshold && yDistance < yThreshold && zDistance < zThreshold) {
        return true // 충돌 발생
      }
    }

    return false // 충돌 없음
  }
}
