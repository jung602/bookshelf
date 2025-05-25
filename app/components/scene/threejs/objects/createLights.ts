import * as THREE from 'three'

export function createLights(scene: THREE.Scene) {
  // 반구광 (기존 hemisphereLight와 동일)
  const hemisphereLight = new THREE.HemisphereLight(
    0xffffff, // sky color
    0x444444, // ground color
    1 // intensity
  )
  hemisphereLight.position.set(10, 10, 10)
  scene.add(hemisphereLight)

  // 방향광 (기존 directionalLight와 동일)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(0, 10, 0)
  directionalLight.castShadow = true
  
  // 그림자 설정
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 500
  directionalLight.shadow.camera.left = -50
  directionalLight.shadow.camera.right = 50
  directionalLight.shadow.camera.top = 50
  directionalLight.shadow.camera.bottom = -50
  
  scene.add(directionalLight)
} 