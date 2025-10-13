import * as THREE from 'three'

// 현재 테마를 감지하는 함수
function getCurrentTheme(): 'light' | 'dark' {
  // html 요소의 클래스를 확인
  const htmlElement = document.documentElement
  if (htmlElement.classList.contains('dark')) {
    return 'dark'
  }
  
  // prefers-color-scheme 확인
  if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  
  return 'light'
}

export function createLights(scene: THREE.Scene) {
  const currentTheme = getCurrentTheme()
  
  // 테마에 따른 intensity 설정
  const hemisphereIntensity = currentTheme === 'light' ? 2 : 1
  const ambientIntensity = currentTheme === 'light' ? 2 : 0.3
  
  // 기존 조명들 제거 (업데이트 시를 위해)
  const lightsToRemove: THREE.Light[] = []
  scene.traverse((object) => {
    if (object instanceof THREE.Light) {
      lightsToRemove.push(object)
    }
  })
  lightsToRemove.forEach(light => scene.remove(light))
  
  // 반구광 - 전체적인 부드러운 조명 제공
  const hemisphereLight = new THREE.HemisphereLight(
    0xf3f3f3, // sky color
    0xCACACA, // ground color
    hemisphereIntensity // 테마에 따른 intensity
  )
  scene.add(hemisphereLight)

  // 방향광 - 주요 조명과 그림자 생성
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.3)
  directionalLight.position.set(0, 5, 3)
  directionalLight.castShadow = true
  
  // 그림자 설정 개선
  directionalLight.shadow.mapSize.width = 512
  directionalLight.shadow.mapSize.height = 512
  directionalLight.shadow.camera.near = 0.1
  directionalLight.shadow.camera.far = 50
  directionalLight.shadow.camera.left = -10
  directionalLight.shadow.camera.right = 10
  directionalLight.shadow.camera.top = 10
  directionalLight.shadow.camera.bottom = -10
  
  // 그림자 부드럽게 만들기
  directionalLight.shadow.radius = 5
  directionalLight.shadow.blurSamples = 10
  
  scene.add(directionalLight)

  // 환경광 추가 - 전체적인 최소 밝기 보장
  const ambientLight = new THREE.AmbientLight(0xf0f0f0, ambientIntensity)
  scene.add(ambientLight)
  

} 