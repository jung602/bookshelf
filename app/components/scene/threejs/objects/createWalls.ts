import * as THREE from 'three'

export function createWalls(scene: THREE.Scene, width: number = 1, height: number = 1, wallHeight: number = 1) {
  // 기존 벽 제거
  const existingWalls = scene.children.filter(child => child.userData.isWall)
  existingWalls.forEach(wall => scene.remove(wall))

  // 간단한 색상 머티리얼 사용 (텍스처 로딩 문제 해결)
  // 나중에 텍스처가 필요하면 다시 추가할 수 있음

  // 벽 생성 함수
  function createWall(
    position: [number, number, number], 
    scale: [number, number, number], 
    rotation: [number, number, number]
  ) {
    const geometry = new THREE.PlaneGeometry(1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: 0xcccccc,
      roughness: 0.8,
      metalness: 0.1,
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