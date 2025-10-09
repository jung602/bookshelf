import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'
import * as THREE from 'three'

export class FloorLampModel extends BaseModel {
  private lightIntensity: number = 1
  private isLightOn: boolean = true
  private isDarkMode: boolean = true
  private themeListener: MediaQueryList | null = null

  constructor(
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 1.5, y: 1.5, z: 1.5 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    super('/3d/main/models/floorlamp.glb', position, scale, rotation)
    this.setupThemeListener()
  }

  private setupThemeListener(): void {
    if (typeof window !== 'undefined') {
      this.themeListener = window.matchMedia('(prefers-color-scheme: dark)')
      this.isDarkMode = this.themeListener.matches
      
      // 테마 변경 리스너 추가
      this.themeListener.addEventListener('change', (e) => {
        this.isDarkMode = e.matches
        this.updateThemeBasedSettings()
      })
    }
  }

  private updateThemeBasedSettings(): void {
    if (this.model) {
      // 라이트 모드일 때: emission 0, 조명 off
      // 다크 모드일 때: emission 기본값, 조명 on
      const shouldLightBeOn = this.isDarkMode
      const emissionIntensity = this.isDarkMode ? .75 : 0
      
      this.model.traverse((child) => {
        // Material의 emission 값 조정
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial
          if (material.emissive) {
            // emission 색상의 강도 조정
            material.emissive.setRGB(emissionIntensity, emissionIntensity, emissionIntensity)
          }
          // emissiveIntensity 속성이 있는 경우 조정
          if (material.emissiveIntensity !== undefined) {
            material.emissiveIntensity = emissionIntensity
          }
        }
        
        // 조명 on/off 제어 (PointLight는 SpotLight로 변환되므로 제외)
        if (child instanceof THREE.DirectionalLight || child instanceof THREE.SpotLight) {
          child.visible = shouldLightBeOn
          if (shouldLightBeOn) {
            child.intensity = this.lightIntensity
          }
        }
      })
      
      this.isLightOn = shouldLightBeOn

    }
  }

  protected setupModel(): void {
    // 플로어 램프 설정

    
    // 조명이 포함된 모델이므로 추가적인 조명 설정이 필요할 수 있음
    if (this.model) {
      // 램프의 실제 바운딩박스 계산
      const boundingBox = new THREE.Box3().setFromObject(this.model)
      const width = boundingBox.max.x - boundingBox.min.x
      const depth = boundingBox.max.z - boundingBox.min.z
      const height = boundingBox.max.y - boundingBox.min.y
      const radius = Math.max(width, depth) / 2
      const offsetY = boundingBox.min.y - this.model.position.y
      
      // 원기둥 바운딩박스 설정
      this.setCustomBoundingBox({
        type: 'cylinder',
        radius: radius,
        height: height,
        offsetY: offsetY
      })
      

      // glTF 파일에 포함된 조명 처리
      const lightsToReplace: { parent: THREE.Object3D, oldLight: THREE.Light }[] = []
      
      this.model.traverse((child) => {
        if (child instanceof THREE.DirectionalLight || child instanceof THREE.SpotLight) {
          // DirectionalLight와 SpotLight는 기존 처리 유지
          child.intensity = this.lightIntensity
          child.color.setRGB(1, 1, 1)
          child.position.y -= 0.3
          
          if (child instanceof THREE.SpotLight) {
            child.distance = 30
            child.angle = Math.PI / 2
            child.penumbra = 10
            child.decay = 1
            
            if (child.target) {
              child.target.position.set(0, -2, 0)
            }

          }
          

        }
        
        // PointLight를 SpotLight로 교체하기 위해 저장
        if (child instanceof THREE.PointLight) {
          lightsToReplace.push({ parent: child.parent!, oldLight: child })
        }
      })
      
      // PointLight를 SpotLight로 교체
      lightsToReplace.forEach(({ parent, oldLight }) => {
        // 기존 PointLight 위치와 속성 저장
        const position = oldLight.position.clone()
        const pointLight = oldLight as THREE.PointLight
        const intensity = pointLight.intensity || this.lightIntensity
        const color = pointLight.color || new THREE.Color(1, 1, 1)
        
        // 새로운 SpotLight 생성
        const spotLight = new THREE.SpotLight(color, intensity)
        spotLight.position.copy(position)
        spotLight.position.y -= 0.3  // 위치 조정
        
        // SpotLight 속성 설정
        spotLight.distance = 30
        spotLight.angle = Math.PI / 2  // 30도
        spotLight.penumbra = 1
        spotLight.decay = 1
        
        // 타겟 설정 (아래쪽 향하도록)
        spotLight.target.position.set(
          position.x, 
          position.y - 2, 
          position.z
        )
        
        // 기존 PointLight 제거하고 새 SpotLight 추가
        parent.remove(oldLight)
        parent.add(spotLight)
        parent.add(spotLight.target)  // SpotLight의 타겟도 추가
        

      })
      
      // 테마에 따른 초기 설정 적용
      this.updateThemeBasedSettings()
    }
  }

  public update(): void {
    // 필요한 경우 조명 애니메이션이나 상태 업데이트
  }

  public toggleLight(): void {
    // 테마 모드를 무시하고 수동으로 조명을 토글하는 경우
    this.isLightOn = !this.isLightOn
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.DirectionalLight || child instanceof THREE.SpotLight) {
          child.visible = this.isLightOn
        }
      })
    }
  }

  public setLightIntensity(intensity: number): void {
    this.lightIntensity = Math.max(0, Math.min(2, intensity)) // 0-2 범위로 제한
    if (this.model) {
      this.model.traverse((child) => {
        if (child instanceof THREE.DirectionalLight || child instanceof THREE.SpotLight) {
          child.intensity = this.lightIntensity
        }
      })
    }
  }

  public getType(): string {
    return 'floorlamp'
  }

  public isDarkTheme(): boolean {
    return this.isDarkMode
  }

  public cleanup(): void {
    // 테마 리스너 정리
    if (this.themeListener) {
      this.themeListener.removeEventListener('change', this.updateThemeBasedSettings)
    }
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
} 