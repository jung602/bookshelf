import * as THREE from 'three'

export function createFloor(
  scene: THREE.Scene, 
  width: number = 1, 
  height: number = 1,
  color: string = '#ffffff'
) {
  // 기존 바닥 제거
  const existingFloors = scene.children.filter(child => child.userData.isFloor)
  existingFloors.forEach(floor => scene.remove(floor))

  // 텍스처 로더
  const textureLoader = new THREE.TextureLoader()
  
  // 체커보드 텍스처 로드
  const checkerTexture = textureLoader.load('https://threejsfundamentals.org/threejs/resources/images/checker.png')

  // 텍스처 반복 설정
  checkerTexture.wrapS = checkerTexture.wrapT = THREE.RepeatWrapping
  checkerTexture.minFilter = THREE.NearestFilter
  checkerTexture.magFilter = THREE.NearestFilter
  checkerTexture.generateMipmaps = false
  
  // 텍스처 반복 횟수 (각 타일마다 체커보드 패턴이 보이도록)
  checkerTexture.repeat.set(width, height)

  // 지오메트리와 머티리얼 생성
  const geometry = new THREE.PlaneGeometry(width, height)
  const material = new THREE.MeshStandardMaterial({
    map: checkerTexture,
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