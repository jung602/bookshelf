import * as THREE from 'three'

export function createWalls(scene: THREE.Scene, width: number = 1, height: number = 1, wallHeight: number = 1) {
  // 기존 벽 제거
  const existingWalls = scene.children.filter(child => child.userData.isWall)
  existingWalls.forEach(wall => scene.remove(wall))

  // 텍스처 로더
  const textureLoader = new THREE.TextureLoader()
  
  // 텍스처 로드 (GitHub Pages 경로 고려)
  const basePath = process.env.NODE_ENV === 'production' ? '/bookshelf' : ''
  const diffuseMap = textureLoader.load(`${basePath}/3d/main/textures/wall_diffuse.png`)
  const normalMap = textureLoader.load(`${basePath}/3d/main/textures/wall_diffuse.png`)
  const roughnessMap = textureLoader.load(`${basePath}/3d/main/textures/wall_diffuse.png`)

  // 텍스처 반복 설정
  diffuseMap.wrapS = diffuseMap.wrapT = THREE.RepeatWrapping
  normalMap.wrapS = normalMap.wrapT = THREE.RepeatWrapping
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping
  
  // 텍스처 반복 횟수 (벽 크기에 맞게 조정)
  diffuseMap.repeat.set(Math.max(width, height) * 10, wallHeight * 50)
  normalMap.repeat.set(Math.max(width, height) * 10, wallHeight * 50)
  roughnessMap.repeat.set(Math.max(width, height) * 10, wallHeight * 50)

  // 벽 생성 함수
  function createWall(
    position: [number, number, number], 
    scale: [number, number, number], 
    rotation: [number, number, number]
  ) {
    const geometry = new THREE.PlaneGeometry(1, 1)
    const material = new THREE.MeshStandardMaterial({
      map: diffuseMap.clone(),
      normalMap: normalMap.clone(),
      roughnessMap: roughnessMap.clone(),
      normalScale: new THREE.Vector2(1, 1),
      side: THREE.FrontSide
    })

    const wall = new THREE.Mesh(geometry, material)
    wall.position.set(...position)
    wall.scale.set(...scale)
    wall.rotation.set(...rotation)
    wall.receiveShadow = true
    wall.userData.isWall = true // 식별용 플래그
    scene.add(wall)
  }

  // 방 크기에 맞는 벽들 생성
  const halfWidth = width / 2
  const halfHeight = height / 2

  // 왼쪽 벽 (X축 음의 방향)
  createWall(
    [-halfWidth, wallHeight / 2, 0], 
    [height, wallHeight, 1], 
    [0, Math.PI / 2, 0]
  )

  // 오른쪽 벽 (X축 양의 방향)
  createWall(
    [halfWidth, wallHeight / 2, 0], 
    [height, wallHeight, 1], 
    [0, -Math.PI / 2, 0]
  )

  // 앞쪽 벽 (Z축 음의 방향)
  createWall(
    [0, wallHeight / 2, -halfHeight], 
    [width, wallHeight, 1], 
    [0, 0, 0]
  )

  // 뒤쪽 벽 (Z축 양의 방향)
  createWall(
    [0, wallHeight / 2, halfHeight], 
    [width, wallHeight, 1], 
    [0, Math.PI, 0]
  )
} 