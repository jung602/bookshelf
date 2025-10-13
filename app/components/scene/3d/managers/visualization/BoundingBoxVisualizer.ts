import * as THREE from 'three'
import { BaseModel } from '../../objects/BaseModel'

export class BoundingBoxVisualizer {
  private scene: THREE.Scene
  private models: Map<string, BaseModel>
  private boundingBoxHelpers: Map<string, THREE.Object3D> = new Map()
  private showBoundingBoxes: boolean = false
  private defaultColor: number

  constructor(scene: THREE.Scene, models: Map<string, BaseModel>, color: number = 0x00ffff) {
    this.scene = scene
    this.models = models
    this.defaultColor = color
  }

  public enable(filterFn?: (model: BaseModel) => boolean): void {
    this.showBoundingBoxes = true
    this.models.forEach((model) => {
      if (!filterFn || filterFn(model)) {
        this.updateHelper(model)
      }
    })
  }

  public disable(): void {
    this.showBoundingBoxes = false
    this.boundingBoxHelpers.forEach((helper) => {
      this.scene.remove(helper)
      this.disposeHelper(helper)
    })
    this.boundingBoxHelpers.clear()
  }

  public toggle(filterFn?: (model: BaseModel) => boolean): boolean {
    if (this.showBoundingBoxes) {
      this.disable()
    } else {
      this.enable(filterFn)
    }
    return this.showBoundingBoxes
  }

  public updateHelper(model: BaseModel, color?: number): void {
    if (!this.showBoundingBoxes) return

    const modelGroup = model.getModel()
    if (!modelGroup) return

    // 기존 헬퍼 제거
    const existingHelper = this.boundingBoxHelpers.get(model.getId())
    if (existingHelper) {
      this.scene.remove(existingHelper)
      this.disposeHelper(existingHelper)
    }

    const helperColor = color || this.defaultColor
    const position = model.getPosition()
    let helper: THREE.Object3D

    const customBB = model.getCustomBoundingBox()
    if (customBB && customBB.type === 'cylinder') {
      const radius = customBB.radius || 0
      const height = customBB.height || 0
      const offsetX = customBB.offsetX || 0
      const offsetY = customBB.offsetY || 0
      const offsetZ = customBB.offsetZ || 0

      const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 16, 1, true)
      const cylinderMaterial = new THREE.LineBasicMaterial({ color: helperColor, linewidth: 2 })
      const edges = new THREE.EdgesGeometry(cylinderGeometry)
      const cylinderHelper = new THREE.LineSegments(edges, cylinderMaterial)

      const yCenter = position.y + offsetY + height / 2
      const centerX = position.x + offsetX
      const centerZ = position.z + offsetZ
      cylinderHelper.position.set(centerX, yCenter, centerZ)
      helper = cylinderHelper

      cylinderGeometry.dispose()
    } else if (customBB && customBB.type === 'box') {
      const width = customBB.width || 0
      const height = customBB.height || 0
      const depth = customBB.depth || 0
      const offsetX = customBB.offsetX || 0
      const offsetY = customBB.offsetY || 0
      const offsetZ = customBB.offsetZ || 0

      const yMin = position.y + offsetY
      const yMax = yMin + height
      const centerX = position.x + offsetX
      const centerZ = position.z + offsetZ

      // 회전을 고려한 바운딩박스 계산
      const rotation = model.getRotation()
      if (rotation.y !== 0) {
        // 회전된 박스의 바운딩박스를 계산
        const cos = Math.cos(rotation.y)
        const sin = Math.sin(rotation.y)
        
        // 회전된 박스의 4개 모서리 점들
        const halfWidth = width / 2
        const halfDepth = depth / 2
        
        const corners = [
          new THREE.Vector3(-halfWidth, 0, -halfDepth),
          new THREE.Vector3(halfWidth, 0, -halfDepth),
          new THREE.Vector3(halfWidth, 0, halfDepth),
          new THREE.Vector3(-halfWidth, 0, halfDepth)
        ]
        
        // 회전 적용
        corners.forEach(corner => {
          const x = corner.x * cos - corner.z * sin
          const z = corner.x * sin + corner.z * cos
          corner.set(x, corner.y, z)
        })
        
        // 회전된 모서리들로부터 바운딩박스 계산 (오프셋 중심 사용)
        const minX = Math.min(...corners.map(c => c.x)) + centerX
        const maxX = Math.max(...corners.map(c => c.x)) + centerX
        const minZ = Math.min(...corners.map(c => c.z)) + centerZ
        const maxZ = Math.max(...corners.map(c => c.z)) + centerZ
        
        const boundingBox = new THREE.Box3(
          new THREE.Vector3(minX, yMin, minZ),
          new THREE.Vector3(maxX, yMax, maxZ)
        )
        helper = new THREE.Box3Helper(boundingBox, helperColor)
      } else {
        // 회전이 없는 경우 오프셋 중심 사용
        const boundingBox = new THREE.Box3(
          new THREE.Vector3(centerX - width / 2, yMin, centerZ - depth / 2),
          new THREE.Vector3(centerX + width / 2, yMax, centerZ + depth / 2)
        )
        helper = new THREE.Box3Helper(boundingBox, helperColor)
      }
    } else {
      // 실제 메시의 바운딩박스를 사용 (OBB 지원)
      const boundingBox = new THREE.Box3().setFromObject(modelGroup)
      helper = new THREE.Box3Helper(boundingBox, helperColor)
    }

    this.scene.add(helper)
    this.boundingBoxHelpers.set(model.getId(), helper)
  }

  public updateAll(filterFn?: (model: BaseModel) => boolean): void {
    if (!this.showBoundingBoxes) return

    this.models.forEach((model) => {
      if (!filterFn || filterFn(model)) {
        this.updateHelper(model)
      }
    })
  }

  public updateModel(modelId: string): void {
    if (!this.showBoundingBoxes) return

    const model = this.models.get(modelId)
    if (model) {
      this.updateHelper(model)
    }
  }

  public isEnabled(): boolean {
    return this.showBoundingBoxes
  }

  private disposeHelper(helper: THREE.Object3D): void {
    if (helper instanceof THREE.LineSegments || helper instanceof THREE.Box3Helper) {
      const mesh = helper as THREE.LineSegments
      if (mesh.geometry) {
        mesh.geometry.dispose()
      }
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose())
        } else {
          mesh.material.dispose()
        }
      }
    }
  }
}

