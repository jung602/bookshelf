import * as THREE from 'three'

export function createFloor(
  scene: THREE.Scene, 
  width: number = 1, 
  height: number = 1,
  color: string = '#ffffff',
  customGrid?: boolean[][],  // 5x5 격자 패턴
  customTexture?: string     // 사용자 정의 텍스처 (data URL)
) {
  // 기존 바닥 제거
  const existingFloors = scene.children.filter(child => child.userData.isFloor)
  existingFloors.forEach(floor => scene.remove(floor))

  // 커스텀 격자가 있는 경우 격자별로 타일 생성
  if (customGrid && Array.isArray(customGrid)) {
    createCustomGridFloor(scene, customGrid, color, customTexture)
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
  // 텍스처 로더
  const textureLoader = new THREE.TextureLoader()
  
  let floorTexture: THREE.Texture
  
  if (customTexture) {
    // 사용자 정의 텍스처 사용
    floorTexture = textureLoader.load(customTexture)
  } else {
    // 기본 체커보드 텍스처 로드
    floorTexture = textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png')
  }

  // 텍스처 반복 설정
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping
  floorTexture.minFilter = THREE.NearestFilter
  floorTexture.magFilter = THREE.NearestFilter
  floorTexture.generateMipmaps = false
  
  // 텍스처 반복 횟수 (각 타일마다 패턴이 보이도록)
  floorTexture.repeat.set(width, height)

  // 지오메트리와 머티리얼 생성
  const geometry = new THREE.PlaneGeometry(width, height)
  const material = new THREE.MeshStandardMaterial({
    map: floorTexture,
    color: new THREE.Color(color), // 색상을 오버레이로 적용
    side: THREE.DoubleSide
  })

  // 메시 생성
  const floor = new THREE.Mesh(geometry, material)
  
  // 바닥 위치, 스케일, 회전 설정
  floor.position.set(0, 0, 0)
  floor.scale.set(1, 1, 1)
  floor.rotation.set(-Math.PI / 2, 0, 0)
  floor.receiveShadow = true
  floor.userData.isFloor = true // 식별용 플래그

  scene.add(floor)
}

function createCustomGridFloor(
  scene: THREE.Scene,
  customGrid: boolean[][],
  color: string,
  customTexture?: string
) {
  // 텍스처 로더
  const textureLoader = new THREE.TextureLoader()
  
  let baseTexture: THREE.Texture
  
  if (customTexture) {
    // 사용자 정의 텍스처 사용
    baseTexture = textureLoader.load(customTexture)
  } else {
    // 기본 체커보드 텍스처 로드
    baseTexture = textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png')
  }

  // 텍스처 반복 설정
  baseTexture.wrapS = baseTexture.wrapT = THREE.RepeatWrapping
  baseTexture.minFilter = THREE.NearestFilter
  baseTexture.magFilter = THREE.NearestFilter
  baseTexture.generateMipmaps = false
  baseTexture.repeat.set(1, 1) // 각 타일마다 하나의 패턴

  const gridSize = customGrid.length
  const tileSize = 1 // 각 타일의 크기
  const offset = (gridSize - 1) * tileSize / 2 // 중앙 정렬을 위한 오프셋

  // 격자의 각 셀에 대해 타일 생성
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (customGrid[row][col]) {
        // 지오메트리와 머티리얼 생성
        const geometry = new THREE.PlaneGeometry(tileSize, tileSize)
        const material = new THREE.MeshStandardMaterial({
          map: baseTexture.clone(),
          color: new THREE.Color(color),
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
        tile.userData.gridPosition = { row, col } // 격자 위치 정보 저장

        scene.add(tile)
      }
    }
  }
} 