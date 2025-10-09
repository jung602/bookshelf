import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'

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

    // 커스텀 바운딩박스가 있으면 사용
    const customBB = model.getCustomBoundingBox()
    if (customBB && customBB.type === 'cylinder') {
      const radius = customBB.radius || 0
      const height = customBB.height || 0
      const offsetY = customBB.offsetY || 0

      // 원기둥 와이어프레임 생성
      const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 16, 1, true)
      const cylinderMaterial = new THREE.LineBasicMaterial({
        color: helperColor,
        linewidth: 2
      })

      // Edges geometry를 사용해서 와이어프레임 생성
      const edges = new THREE.EdgesGeometry(cylinderGeometry)
      const cylinderHelper = new THREE.LineSegments(edges, cylinderMaterial)

      // offsetY를 사용하여 바닥부터 시작하도록 위치 조정
      const yCenter = position.y + offsetY + height / 2
      cylinderHelper.position.set(position.x, yCenter, position.z)
      helper = cylinderHelper

      cylinderGeometry.dispose()
    } else if (customBB && customBB.type === 'box') {
      // 커스텀 박스 바운딩박스
      const width = customBB.width || 0
      const height = customBB.height || 0
      const depth = customBB.depth || 0
      const offsetY = customBB.offsetY || 0

      // offsetY를 사용하여 바닥부터 시작
      const yMin = position.y + offsetY
      const yMax = yMin + height

      const boundingBox = new THREE.Box3(
        new THREE.Vector3(position.x - width / 2, yMin, position.z - depth / 2),
        new THREE.Vector3(position.x + width / 2, yMax, position.z + depth / 2)
      )
      helper = new THREE.Box3Helper(boundingBox, helperColor)
    } else {
      // 커스텀 바운딩박스가 없으면 메시에서 계산
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
    if (helper instanceof THREE.LineSegments) {
      helper.geometry.dispose()
      if (Array.isArray(helper.material)) {
        helper.material.forEach(m => m.dispose())
      } else {
        helper.material.dispose()
      }
    }
  }
}

