import * as THREE from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { ColorPalettes } from './ColorPalettes'

// 기본 파라미터 타입
interface BasePixelationParams {
  pixelSize: number
  normalEdgeStrength: number
  ditherStrength: number
  ditherScale: number
  // Unity 방식 파라미터 추가
  depthEdgeStrength: number
  edgeThreshold: number
  outlineDarknessAmount: number
  useColorAwareOutline: number
  depthIndicatorStrength: number
  // 카메라 거리 기반 조절 파라미터
  cameraDistance: number
  edgeScaleFactor: number
  adaptiveEdgeEnabled: number
}

// 팔레트 파라미터 타입 자동 생성
type PaletteParams = {
  [K in typeof ColorPalettes.PALETTE_METADATA[number]['key']]: number
}

// 전체 PixelationParams 타입
export type PixelationParams = BasePixelationParams & PaletteParams

export class RenderPixelatedPass extends Pass {
  private fsQuad: FullScreenQuad
  private resolution: THREE.Vector2
  private scene: THREE.Scene
  private camera: THREE.Camera
  private rgbRenderTarget: THREE.WebGLRenderTarget
  private colorRenderTarget: THREE.WebGLRenderTarget
  private normalRenderTarget: THREE.WebGLRenderTarget
  private normalMaterial: THREE.Material
  private params: PixelationParams
  private currentScreenResolution: THREE.Vector2
  private dragModeActive: boolean = false
  private clearDepthController?: (suppress: boolean) => void

  constructor(
    resolution: THREE.Vector2,
    scene: THREE.Scene,
    camera: THREE.Camera,
    params: PixelationParams
  ) {
    super()
    
    this.resolution = resolution
    this.scene = scene
    this.camera = camera
    this.params = params
    this.currentScreenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
    
    this.fsQuad = new FullScreenQuad(this.createMaterial())
    
    this.rgbRenderTarget = this.createPixelRenderTarget(resolution, THREE.RGBAFormat)
    this.colorRenderTarget = this.createPixelRenderTarget(resolution, THREE.RGBAFormat)
    this.normalRenderTarget = this.createPixelRenderTarget(resolution, THREE.RGBFormat)
    this.normalMaterial = new THREE.MeshNormalMaterial()
    
    // RGB 렌더 타겟에 depth texture 추가
    this.rgbRenderTarget.depthTexture = new THREE.DepthTexture(resolution.x, resolution.y)
    this.rgbRenderTarget.depthTexture.format = THREE.DepthFormat
    this.rgbRenderTarget.depthTexture.type = THREE.UnsignedShortType
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    readBuffer: THREE.WebGLRenderTarget
  ) {
    if (this.dragModeActive) {
      // Phase 1: 안전한 Depth/Normal 수집 (clearDepth 억제)
      if (this.clearDepthController) this.clearDepthController(true)
      renderer.setRenderTarget(this.rgbRenderTarget)
      renderer.render(this.scene, this.camera)

      const overrideMaterial_old = this.scene.overrideMaterial
      renderer.setRenderTarget(this.normalRenderTarget)
      this.scene.overrideMaterial = this.normalMaterial
      renderer.render(this.scene, this.camera)
      this.scene.overrideMaterial = overrideMaterial_old

      // Phase 2: 최종 컬러 렌더 (clearDepth 허용으로 드래그 오브젝트 맨 앞)
      if (this.clearDepthController) this.clearDepthController(false)
      renderer.setRenderTarget(this.colorRenderTarget)
      renderer.render(this.scene, this.camera)
    } else {
      // 일반 모드: 기존 방식
      // RGB 렌더링
      renderer.setRenderTarget(this.rgbRenderTarget)
      renderer.render(this.scene, this.camera)

      // Normal 렌더링
      const overrideMaterial_old = this.scene.overrideMaterial
      renderer.setRenderTarget(this.normalRenderTarget)
      this.scene.overrideMaterial = this.normalMaterial
      renderer.render(this.scene, this.camera)
      this.scene.overrideMaterial = overrideMaterial_old
    }

    // 셰이더 유니폼 업데이트
    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms
    uniforms.tDiffuse.value = this.dragModeActive ? this.colorRenderTarget.texture : this.rgbRenderTarget.texture
    uniforms.tNormal.value = this.normalRenderTarget.texture
    uniforms.tDepth.value = this.rgbRenderTarget.depthTexture
    uniforms.normalEdgeStrength.value = this.params.normalEdgeStrength
    uniforms.ditherStrength.value = this.params.ditherStrength
    uniforms.ditherScale.value = this.params.ditherScale
    uniforms.depthEdgeStrength.value = this.params.depthEdgeStrength
    uniforms.edgeThreshold.value = this.params.edgeThreshold
    uniforms.outlineDarknessAmount.value = this.params.outlineDarknessAmount
    uniforms.useColorAwareOutline.value = this.params.useColorAwareOutline
    uniforms.depthIndicatorStrength.value = this.params.depthIndicatorStrength
    
    // 카메라 거리 계산 (scene 중심점을 기준으로)
    const sceneCenter = new THREE.Vector3(0, 0, 0) // 씬 중심점
    const cameraDistance = this.camera.position.distanceTo(sceneCenter)
    uniforms.cameraDistance.value = cameraDistance
    uniforms.edgeScaleFactor.value = this.params.edgeScaleFactor
    uniforms.adaptiveEdgeEnabled.value = this.params.adaptiveEdgeEnabled
    
    // 팔레트 유니폼 자동 업데이트
    ColorPalettes.PALETTE_METADATA.forEach(palette => {
      uniforms[palette.key].value = this.params[palette.key as keyof PixelationParams]
    })

    // 최종 렌더링
    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
    } else {
      renderer.setRenderTarget(writeBuffer)
      if (this.clear) renderer.clear()
    }
    
    this.fsQuad.render(renderer)
  }

  updateParams(params: Partial<PixelationParams>) {
    Object.assign(this.params, params)
    
    // 픽셀 크기가 변경되면 해상도 업데이트
    if (params.pixelSize) {
      this.resolution = this.currentScreenResolution.clone().divideScalar(params.pixelSize)
      this.resolution.x = Math.floor(this.resolution.x)
      this.resolution.y = Math.floor(this.resolution.y)
      
      // 렌더 타겟 재생성
      this.rgbRenderTarget.dispose()
      this.colorRenderTarget.dispose()
      this.normalRenderTarget.dispose()
      this.rgbRenderTarget = this.createPixelRenderTarget(this.resolution, THREE.RGBAFormat)
      this.colorRenderTarget = this.createPixelRenderTarget(this.resolution, THREE.RGBAFormat)
      this.normalRenderTarget = this.createPixelRenderTarget(this.resolution, THREE.RGBFormat)
      
      // RGB 렌더 타겟에 depth texture 재추가
      this.rgbRenderTarget.depthTexture = new THREE.DepthTexture(this.resolution.x, this.resolution.y)
      this.rgbRenderTarget.depthTexture.format = THREE.DepthFormat
      this.rgbRenderTarget.depthTexture.type = THREE.UnsignedShortType
      
      // 해상도 유니폼 업데이트
      const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms
      uniforms.resolution.value.set(
        this.resolution.x,
        this.resolution.y,
        1 / this.resolution.x,
        1 / this.resolution.y
      )
    }
  }

  updateScreenResolution(width: number, height: number) {
    this.currentScreenResolution.set(width, height)
    // 현재 픽셀 사이즈로 해상도 다시 계산
    this.resolution = this.currentScreenResolution.clone().divideScalar(this.params.pixelSize)
    this.resolution.x = Math.floor(this.resolution.x)
    this.resolution.y = Math.floor(this.resolution.y)
    
    // 렌더 타겟 재생성
    this.rgbRenderTarget.dispose()
    this.colorRenderTarget.dispose()
    this.normalRenderTarget.dispose()
    this.rgbRenderTarget = this.createPixelRenderTarget(this.resolution, THREE.RGBAFormat)
    this.colorRenderTarget = this.createPixelRenderTarget(this.resolution, THREE.RGBAFormat)
    this.normalRenderTarget = this.createPixelRenderTarget(this.resolution, THREE.RGBFormat)
    
    // RGB 렌더 타겟에 depth texture 재추가
    this.rgbRenderTarget.depthTexture = new THREE.DepthTexture(this.resolution.x, this.resolution.y)
    this.rgbRenderTarget.depthTexture.format = THREE.DepthFormat
    this.rgbRenderTarget.depthTexture.type = THREE.UnsignedShortType
    
    // 해상도 유니폼 업데이트
    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms
    uniforms.resolution.value.set(
      this.resolution.x,
      this.resolution.y,
      1 / this.resolution.x,
      1 / this.resolution.y
    )
  }

  private createMaterial(): THREE.ShaderMaterial {
    // 기본 유니폼
    const baseUniforms = {
      tDiffuse: { value: null },
      tNormal: { value: null },
      tDepth: { value: null },
      resolution: {
        value: new THREE.Vector4(
          this.resolution.x,
          this.resolution.y,
          1 / this.resolution.x,
          1 / this.resolution.y
        )
      },
      normalEdgeStrength: { value: this.params.normalEdgeStrength },
      ditherStrength: { value: this.params.ditherStrength },
      ditherScale: { value: this.params.ditherScale },
      // Unity 방식 파라미터 추가
      depthEdgeStrength: { value: this.params.depthEdgeStrength },
      edgeThreshold: { value: this.params.edgeThreshold },
      outlineDarknessAmount: { value: this.params.outlineDarknessAmount },
      useColorAwareOutline: { value: this.params.useColorAwareOutline },
      depthIndicatorStrength: { value: this.params.depthIndicatorStrength },
      // 카메라 거리 기반 조절 파라미터
      cameraDistance: { value: this.params.cameraDistance },
      edgeScaleFactor: { value: this.params.edgeScaleFactor },
      adaptiveEdgeEnabled: { value: this.params.adaptiveEdgeEnabled }
    }

    // 팔레트 유니폼 자동 생성
    const paletteUniforms: Record<string, { value: number }> = {}
    ColorPalettes.PALETTE_METADATA.forEach(palette => {
      paletteUniforms[palette.key] = { value: this.params[palette.key as keyof PixelationParams] as number }
    })

    // 팔레트 유니폼 선언 자동 생성
    const paletteUniformDeclarations = ColorPalettes.PALETTE_METADATA
      .map(palette => `uniform float ${palette.key};`)
      .join('\n        ')

    return new THREE.ShaderMaterial({
      uniforms: { ...baseUniforms, ...paletteUniforms },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tNormal;
        uniform sampler2D tDepth;
        uniform vec4 resolution;
        uniform float normalEdgeStrength;
        uniform float ditherStrength;
        uniform float ditherScale;
        uniform float depthEdgeStrength;
        uniform float edgeThreshold;
        uniform float outlineDarknessAmount;
        uniform float useColorAwareOutline;
        uniform float depthIndicatorStrength;
        uniform float cameraDistance;
        uniform float edgeScaleFactor;
        uniform float adaptiveEdgeEnabled;
        ${paletteUniformDeclarations}
        varying vec2 vUv;

        ${ColorPalettes.getAllPalettesShaderCode()}

        // Bayer matrix for ordered dithering (4x4)
        float bayerMatrix4x4[16] = float[](
          0.0/16.0,  8.0/16.0,  2.0/16.0, 10.0/16.0,
         12.0/16.0,  4.0/16.0, 14.0/16.0,  6.0/16.0,
          3.0/16.0, 11.0/16.0,  1.0/16.0,  9.0/16.0,
         15.0/16.0,  7.0/16.0, 13.0/16.0,  5.0/16.0
        );

        float getBayerValue(vec2 coord) {
          int x = int(mod(coord.x / ditherScale, 4.0));
          int y = int(mod(coord.y / ditherScale, 4.0));
          return bayerMatrix4x4[y * 4 + x];
        }

        vec3 dither(vec3 color, vec2 coord) {
          float bayerValue = getBayerValue(coord);
          
          // 각 색상 채널에 디더링 적용
          vec3 dithered = color + (bayerValue - 0.5) * ditherStrength;
          return clamp(dithered, 0.0, 1.0);
        }

        // RGB to HSV conversion
        vec3 rgb2hsv(vec3 c) {
          vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
          
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }

        // HSV to RGB conversion
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        // 카메라 거리 기반 적응적 스케일 계산
        float getAdaptiveScale() {
          if (adaptiveEdgeEnabled < 0.5) return 1.0;
          
          // 카메라 거리에 따라 0.2 ~ 1.8 범위로 스케일 조절 (더 얇게)
          float minScale = 0.2;
          float maxScale = 1.8;
          float normalizedDistance = smoothstep(2.0, 30.0, cameraDistance);
          float baseScale = mix(maxScale, minScale, normalizedDistance);
          
          return baseScale * edgeScaleFactor;
        }

        vec3 getNormal(int x, int y) {
          float scale = getAdaptiveScale();
          vec2 offset = vec2(float(x), float(y)) * resolution.zw * scale;
          return texture2D(tNormal, vUv + offset).rgb * 2.0 - 1.0;
        }

        float getDepth(int x, int y) {
          float scale = getAdaptiveScale();
          vec2 offset = vec2(float(x), float(y)) * resolution.zw * scale;
          return texture2D(tDepth, vUv + offset).r;
        }

        vec3 getRGBColor(int x, int y) {
          float scale = getAdaptiveScale();
          vec2 offset = vec2(float(x), float(y)) * resolution.zw * scale;
          return texture2D(tDiffuse, vUv + offset).rgb;
        }

        // Unity 방식의 고급 Edge Detection
        vec2 getAdvancedEdge() {
          vec3 centerNormal = getNormal(0, 0);
          float centerDepth = getDepth(0, 0);
          vec3 directionVector = vec3(1.0, 1.0, 1.0);
          
          float depthStrength = 0.0;
          float normalStrength = 0.0;
          float avgDepthBias = 0.0;
          int neighborCount = 0;
          
          // 8방향 모든 neighbor 체크 (Unity 방식)
          for(int x = -1; x <= 1; x++) {
            for(int y = -1; y <= 1; y++) {
              if(x == 0 && y == 0) continue;
              
              vec3 neighborNormal = getNormal(x, y);
              float neighborDepth = getDepth(x, y);
              
              // Depth edge detection with bias clamping (1픽셀 두께)
              float depthBias = neighborDepth - centerDepth;
              depthStrength += clamp(depthBias, 0.0, 1.0);
              avgDepthBias += depthBias;
              
              // Normal edge detection with direction indicator
              vec3 normalBias = neighborNormal - centerNormal;
              float sharpness = 1.0 - dot(centerNormal, neighborNormal);
              float normalIndicator = smoothstep(-0.01, 0.01, dot(normalBias, directionVector));
              normalStrength += sharpness * normalIndicator;
              
              neighborCount++;
            }
          }
          
          avgDepthBias /= float(neighborCount);
          
          // 부드러운 edge 강도 계산 (임계값 민감하게 조정)
          float depthEdge = smoothstep(0.001, 0.003, depthStrength) * depthEdgeStrength;
          float normalEdge = smoothstep(0.05, 0.1, normalStrength) * normalEdgeStrength;
          
          // Depth indicator로 concave edge 제거 (완화된 버전)
          float depthIndicator = smoothstep(-0.02, 0.02, avgDepthBias);
          
          // 완전히 제거하지 말고 강도 조절로 변경
          float originalNormalEdge = normalEdge;
          float suppressedNormalEdge = normalEdge * depthIndicator;
          normalEdge = mix(originalNormalEdge, suppressedNormalEdge, depthIndicatorStrength);
          
          return vec2(depthEdge, normalEdge);
        }

        // 주변 색상 기반 아웃라인 색상 계산
        vec3 getColorAwareOutline(vec3 centerColor) {
          if (useColorAwareOutline < 0.5) {
            // 기존 방식: 단순히 어둡게
            return centerColor * (1.0 - outlineDarknessAmount);
          }
          
          // 주변 픽셀들의 색상 샘플링
          vec3 avgColor = vec3(0.0);
          int sampleCount = 0;
          
          // 3x3 영역의 색상 평균 계산
          for(int x = -1; x <= 1; x++) {
            for(int y = -1; y <= 1; y++) {
              vec3 neighborColor = getRGBColor(x, y);
              avgColor += neighborColor;
              sampleCount++;
            }
          }
          avgColor /= float(sampleCount);
          
          // 중심 색상과 주변 평균 색상 혼합
          vec3 targetColor = mix(centerColor, avgColor, 0.7);
          
          // HSV 변환 후 명도 조절
          vec3 hsv = rgb2hsv(targetColor);
          hsv.z *= (1.0 - outlineDarknessAmount); // Value(명도) 낮추기
          hsv.y = min(hsv.y * 1.2, 1.0); // 채도 약간 높이기 (더 생생한 색상)
          
          return hsv2rgb(hsv);
        }

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec3 finalColor = texel.rgb;
          
          // Unity 방식의 고급 edge detection (임계값 개선됨)
          vec2 edgeStrengths = getAdvancedEdge();
          float totalEdgeStrength = max(edgeStrengths.x, edgeStrengths.y);
          
          // Edge threshold 적용
          float isEdge = step(edgeThreshold, totalEdgeStrength);
          
          // 주변 색상 기반 아웃라인 적용
          if (isEdge > 0.5) {
            vec3 outlineColor = getColorAwareOutline(texel.rgb);
            
            // 부드러운 혼합을 위한 강도 계산
            float blendAmount = smoothstep(edgeThreshold, edgeThreshold + 0.1, totalEdgeStrength);
            finalColor = mix(texel.rgb, outlineColor, blendAmount);
          }
          
          // 디더링 적용 (픽셀 좌표 사용)
          vec2 pixelCoord = vUv * resolution.xy;
          finalColor = dither(finalColor, pixelCoord);
          
          ${ColorPalettes.generatePaletteApplicationCode()}
          
          gl_FragColor = vec4(finalColor, texel.a);
        }
      `
    })
  }

  private createPixelRenderTarget(
    resolution: THREE.Vector2,
    pixelFormat: THREE.PixelFormat
  ): THREE.WebGLRenderTarget {
    const renderTarget = new THREE.WebGLRenderTarget(
      resolution.x,
      resolution.y
    )
    
    renderTarget.texture.format = pixelFormat
    renderTarget.texture.minFilter = THREE.NearestFilter
    renderTarget.texture.magFilter = THREE.NearestFilter
    renderTarget.texture.generateMipmaps = false
    renderTarget.stencilBuffer = false
    
    return renderTarget
  }

  dispose() {
    this.rgbRenderTarget.dispose()
    this.colorRenderTarget.dispose()
    this.normalRenderTarget.dispose()
    this.fsQuad.dispose()
  }

  public setDragMode(active: boolean) {
    this.dragModeActive = active
  }

  public setClearDepthController(controller: (suppress: boolean) => void) {
    this.clearDepthController = controller
  }
}