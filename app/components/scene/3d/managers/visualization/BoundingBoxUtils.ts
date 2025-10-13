import * as THREE from 'three'
import { BaseModel } from '../../objects/BaseModel'

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

  // 항상 실제 메시의 바운딩박스를 사용 (OBB 지원)
  const originalPos = modelGroup.position.clone()
  const originalRot = modelGroup.rotation.clone()
  const originalScale = modelGroup.scale.clone()
  
  // 임시로 위치 설정하여 바운딩박스 계산
  modelGroup.position.set(useX, useY, useZ)
  modelGroup.updateMatrixWorld(true)

  const boundingBox = new THREE.Box3().setFromObject(modelGroup)

  // 원본 변환 정보 복원
  modelGroup.position.copy(originalPos)
  modelGroup.rotation.copy(originalRot)
  modelGroup.scale.copy(originalScale)
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
  
  // 모델 position 기준 오프셋 계산
  const offsetX = (boundingBox.min.x + boundingBox.max.x) / 2 - modelGroup.position.x
  const offsetY = boundingBox.min.y - modelGroup.position.y
  const offsetZ = (boundingBox.min.z + boundingBox.max.z) / 2 - modelGroup.position.z
  
  model.setCustomBoundingBox({ 
    type: 'box', 
    width, 
    height, 
    depth, 
    offsetX,
    offsetY,
    offsetZ
  })
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
  
  // 오프셋 계산
  const offsetX = (boundingBox.min.x + boundingBox.max.x) / 2 - modelGroup.position.x
  const offsetY = boundingBox.min.y - modelGroup.position.y
  const offsetZ = (boundingBox.min.z + boundingBox.max.z) / 2 - modelGroup.position.z
  
  let radius: number
  if (radiusType === 'dynamic') {
    const width = boundingBox.max.x - boundingBox.min.x
    const depth = boundingBox.max.z - boundingBox.min.z
    radius = Math.max(width, depth) / 2
  } else {
    radius = radiusType
  }
  
  model.setCustomBoundingBox({ 
    type: 'cylinder', 
    radius, 
    height, 
    offsetX,
    offsetY,
    offsetZ
  })
}

