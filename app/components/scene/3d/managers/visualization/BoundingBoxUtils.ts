import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'

/**
 * 모델의 바운딩박스를 계산합니다.
 * 커스텀 바운딩박스가 있으면 우선 사용하고, 없으면 메시에서 계산합니다.
 * x, y, z 파라미터로 다른 위치에서의 바운딩박스를 계산할 수 있습니다.
 */
export function calculateBoundingBox(
  model: BaseModel,
  x?: number,
  z?: number,
  y?: number  // Y도 override 가능하도록 추가 (호환성을 위해 마지막 파라미터)
): THREE.Box3 | null {
  const modelGroup = model.getModel()
  if (!modelGroup) return null

  const position = model.getPosition()
  const useX = x !== undefined ? x : position.x
  const useZ = z !== undefined ? z : position.z
  const useY = y !== undefined ? y : position.y  // Y도 override 가능

  // 커스텀 바운딩박스가 있으면 우선 사용
  const customBB = model.getCustomBoundingBox()
  if (customBB) {
    // offsetY를 사용하여 바닥부터 시작
    const offsetY = customBB.offsetY || 0
    const yMin = useY + offsetY
    const yMax = yMin + (customBB.height || 0)

    if (customBB.type === 'cylinder') {
      const radius = customBB.radius || 0

      return new THREE.Box3(
        new THREE.Vector3(useX - radius, yMin, useZ - radius),
        new THREE.Vector3(useX + radius, yMax, useZ + radius)
      )
    } else if (customBB.type === 'box') {
      const width = customBB.width || 0
      const depth = customBB.depth || 0

      return new THREE.Box3(
        new THREE.Vector3(useX - width / 2, yMin, useZ - depth / 2),
        new THREE.Vector3(useX + width / 2, yMax, useZ + depth / 2)
      )
    }
  }

  // 커스텀 바운딩박스가 없으면 메시에서 계산
  const originalPos = modelGroup.position.clone()
  modelGroup.position.set(useX, useY, useZ)
  modelGroup.updateMatrixWorld(true)

  const boundingBox = new THREE.Box3().setFromObject(modelGroup)

  modelGroup.position.copy(originalPos)
  modelGroup.updateMatrixWorld(true)

  return boundingBox
}

/**
 * Box 타입 바운딩박스를 자동으로 계산하여 모델에 설정합니다.
 */
export function setupBoxBoundingBox(model: BaseModel): void {
  const modelGroup = model.getModel()
  if (!modelGroup) return
  
  const boundingBox = new THREE.Box3().setFromObject(modelGroup)
  const width = boundingBox.max.x - boundingBox.min.x
  const height = boundingBox.max.y - boundingBox.min.y
  const depth = boundingBox.max.z - boundingBox.min.z
  const offsetY = boundingBox.min.y - modelGroup.position.y
  
  model.setCustomBoundingBox({ type: 'box', width, height, depth, offsetY })
}

/**
 * Cylinder 타입 바운딩박스를 계산하여 모델에 설정합니다.
 * @param radiusType 'dynamic'이면 width/depth에서 자동 계산, 숫자면 고정 반지름 사용
 */
export function setupCylinderBoundingBox(
  model: BaseModel,
  radiusType: 'dynamic' | number
): void {
  const modelGroup = model.getModel()
  if (!modelGroup) return
  
  const boundingBox = new THREE.Box3().setFromObject(modelGroup)
  const height = boundingBox.max.y - boundingBox.min.y
  const offsetY = boundingBox.min.y - modelGroup.position.y
  
  let radius: number
  if (radiusType === 'dynamic') {
    const width = boundingBox.max.x - boundingBox.min.x
    const depth = boundingBox.max.z - boundingBox.min.z
    radius = Math.max(width, depth) / 2
  } else {
    radius = radiusType
  }
  
  model.setCustomBoundingBox({ type: 'cylinder', radius, height, offsetY })
}

