import * as THREE from 'three'

export function createFloor(
  scene: THREE.Scene, 
  width: number = 1, 
  height: number = 1,
  color: string = '#C0C0C0',
  customGrid?: boolean[][],  // 5x5 격자 패턴
  customTexture?: string     // 사용자 정의 텍스처 (data URL)
) {
  // 기존 바닥 제거 (모델 보호) - 더 안전한 방식

  
  // 모델들을 보호하기 위해 더 엄격한 필터링
  const existingFloors = scene.children.filter(child => {
    // userData.isFloor가 명시적으로 true인 객체만 제거
    // 그리고 모델이 아닌 것만 (모델은 Group이고 다른 특성을 가짐)
    const isFloor = child.userData.isFloor === true
    const isNotModel = !child.userData.modelId
    
    return isFloor && isNotModel
  })
  

  
  existingFloors.forEach((floor) => {

    scene.remove(floor)
    
    // 메모리 정리
    if (floor instanceof THREE.Mesh) {
      if (floor.geometry) floor.geometry.dispose()
      if (floor.material) {
        if (Array.isArray(floor.material)) {
          floor.material.forEach(mat => mat.dispose())
        } else {
          floor.material.dispose()
        }
      }
    }
  })

  // 커스텀 격자가 있는 경우 격자별로 타일 생성
  if (customGrid && Array.isArray(customGrid)) {
    createCustomGridFloor(scene, customGrid, color, customTexture, width, height)
  } else {
    createRegularFloor(scene, width, height, color, customTexture)
  }
}

function createRegularFloor(
  scene: THREE.Scene,
  width: number,
  height: number, 
  color: string,
  customTexture?: string
) {
  // 지오메트리 생성 (텍스처 없이 먼저)
  const geometry = new THREE.PlaneGeometry(width, height)
  
  // 텍스처 없이 임시 material 생성
  const material = new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: 1.0,
    metalness: 0.0,
    side: THREE.DoubleSide
  })

  // 메시 생성
  const floor = new THREE.Mesh(geometry, material)
  
  // 바닥 위치, 스케일, 회전 설정
  floor.position.set(0, 0, 0)
  floor.scale.set(1, 1, 1)
  floor.rotation.set(-Math.PI / 2, 0, 0)
  floor.receiveShadow = true
  floor.userData.isFloor = true

  scene.add(floor)

  // 텍스처 로더
  const textureLoader = new THREE.TextureLoader()
  
  const texturePath = customTexture || 
    (process.env.NODE_ENV === 'production' ? '/bookshelf/ui/BasicTile.png' : '/ui/BasicTile.png')
  
  // 텍스처 로드 완료 후 적용
  textureLoader.load(
    texturePath,
    (texture) => {
      // 텍스처 설정
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping
      texture.minFilter = THREE.NearestFilter
      texture.magFilter = THREE.NearestFilter
      texture.generateMipmaps = false
      texture.repeat.set(width, height)
      
      // material에 텍스처 적용
      material.map = texture
      material.needsUpdate = true
    },
    undefined,
    (error) => {
      console.error('Failed to load floor texture:', error)
    }
  )
}

function createCustomGridFloor(
  scene: THREE.Scene,
  customGrid: boolean[][],
  color: string,
  customTexture?: string,
  repeatX: number = 1,
  repeatY: number = 1
) {
  const gridSize = customGrid.length
  const tileSize = 1 // 각 타일의 크기
  const offset = (gridSize - 1) * tileSize / 2 // 중앙 정렬을 위한 오프셋

  // 텍스처 로더
  const textureLoader = new THREE.TextureLoader()
  
  const texturePath = customTexture || 
    (process.env.NODE_ENV === 'production' ? '/bookshelf/ui/BasicTile.png' : '/ui/BasicTile.png')
  
  // 텍스처 로드 완료 후 타일 생성
  textureLoader.load(
    texturePath,
    (baseTexture) => {
      // 텍스처 설정
      baseTexture.wrapS = baseTexture.wrapT = THREE.RepeatWrapping
      baseTexture.minFilter = THREE.NearestFilter
      baseTexture.magFilter = THREE.NearestFilter
      baseTexture.generateMipmaps = false
      baseTexture.repeat.set(repeatX, repeatY)

      // 격자의 각 셀에 대해 타일 생성
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          if (customGrid[row][col]) {
            // 지오메트리와 머티리얼 생성
            const geometry = new THREE.PlaneGeometry(tileSize, tileSize)
            const material = new THREE.MeshStandardMaterial({
              map: baseTexture.clone(),
              color: new THREE.Color(color),
              roughness: 1.0,
              metalness: 0.0,
              side: THREE.DoubleSide
            })

            // 메시 생성
            const tile = new THREE.Mesh(geometry, material)
            
            // 타일 위치 설정 (격자 좌표를 3D 좌표로 변환)
            const x = col * tileSize - offset
            const z = row * tileSize - offset
            
            tile.position.set(x, 0, z)
            tile.rotation.set(-Math.PI / 2, 0, 0)
            tile.receiveShadow = true
            tile.userData.isFloor = true
            tile.userData.gridPosition = { row, col }

            scene.add(tile)
          }
        }
      }
    },
    undefined,
    (error) => {
      console.error('Failed to load floor texture:', error)
      
      // 에러 발생시 텍스처 없이 타일 생성
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          if (customGrid[row][col]) {
            const geometry = new THREE.PlaneGeometry(tileSize, tileSize)
            const material = new THREE.MeshStandardMaterial({
              color: new THREE.Color(color),
              roughness: 1.0,
              metalness: 0.0,
              side: THREE.DoubleSide
            })

            const tile = new THREE.Mesh(geometry, material)
            const x = col * tileSize - offset
            const z = row * tileSize - offset
            
            tile.position.set(x, 0, z)
            tile.rotation.set(-Math.PI / 2, 0, 0)
            tile.receiveShadow = true
            tile.userData.isFloor = true
            tile.userData.gridPosition = { row, col }

            scene.add(tile)
          }
        }
      }
    }
  )
} 