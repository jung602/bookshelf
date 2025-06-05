import * as THREE from 'three'

export function createWalls(
  scene: THREE.Scene, 
  width: number = 1, 
  height: number = 1, 
  wallHeight: number = 1,
  color: string = '#cccccc',
  customGrid?: boolean[][]  // 5x5 격자 패턴
) {
  // 기존 벽 제거
  const existingWalls = scene.children.filter(child => child.userData.isWall)
  existingWalls.forEach(wall => scene.remove(wall))

  // 커스텀 격자가 있는 경우 격자별로 벽 생성
  if (customGrid && Array.isArray(customGrid)) {
    createCustomGridWalls(scene, customGrid, wallHeight, color)
  } else {
    createRegularWalls(scene, width, height, wallHeight, color)
  }
}

function createRegularWalls(
  scene: THREE.Scene,
  width: number,
  height: number,
  wallHeight: number,
  color: string
) {
  // 벽 생성 함수
  function createWall(
    position: [number, number, number], 
    scale: [number, number, number], 
    rotation: [number, number, number]
  ) {
    const geometry = new THREE.PlaneGeometry(1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
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

function createCustomGridWalls(
  scene: THREE.Scene,
  customGrid: boolean[][],
  wallHeight: number,
  color: string
) {
  const gridSize = customGrid.length
  const tileSize = 1
  const offset = (gridSize - 1) * tileSize / 2

  // 벽 생성 함수
  function createWallSegment(
    position: [number, number, number], 
    scale: [number, number, number], 
    rotation: [number, number, number]
  ) {
    const geometry = new THREE.PlaneGeometry(1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      roughness: 0.8,
      metalness: 0.1,
      side: THREE.FrontSide
    })

    const wall = new THREE.Mesh(geometry, material)
    wall.position.set(...position)
    wall.scale.set(...scale)
    wall.rotation.set(...rotation)
    wall.receiveShadow = true
    wall.userData.isWall = true
    scene.add(wall)
  }

  // 격자를 분석해서 벽이 필요한 곳 찾기
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (customGrid[row][col]) {
        const x = col * tileSize - offset
        const z = row * tileSize - offset

        // 북쪽 벽 (row - 1 방향) - Z축 음의 방향
        if (row === 0 || !customGrid[row - 1][col]) {
          createWallSegment(
            [x, wallHeight / 2, z - tileSize / 2],
            [tileSize, wallHeight, 1],
            [0, 0, 0]
          )
        }

        // 남쪽 벽 (row + 1 방향) - Z축 양의 방향  
        if (row === gridSize - 1 || !customGrid[row + 1][col]) {
          createWallSegment(
            [x, wallHeight / 2, z + tileSize / 2],
            [tileSize, wallHeight, 1],
            [0, Math.PI, 0]
          )
        }

        // 서쪽 벽 (col - 1 방향) - X축 음의 방향
        if (col === 0 || !customGrid[row][col - 1]) {
          createWallSegment(
            [x - tileSize / 2, wallHeight / 2, z],
            [tileSize, wallHeight, 1],
            [0, Math.PI / 2, 0]
          )
        }

        // 동쪽 벽 (col + 1 방향) - X축 양의 방향
        if (col === gridSize - 1 || !customGrid[row][col + 1]) {
          createWallSegment(
            [x + tileSize / 2, wallHeight / 2, z],
            [tileSize, wallHeight, 1],
            [0, -Math.PI / 2, 0]
          )
        }
      }
    }
  }
} 