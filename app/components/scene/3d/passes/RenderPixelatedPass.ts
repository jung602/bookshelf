import * as THREE from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'
import { ColorPalettes } from './ColorPalettes'

// 기본 파라미터 타입
interface BasePixelationParams {
  pixelSize: number
  normalEdgeStrength: number
  ditherStrength: number
  ditherScale: number
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
  private normalRenderTarget: THREE.WebGLRenderTarget
  private normalMaterial: THREE.Material
  private params: PixelationParams

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
    
    this.fsQuad = new FullScreenQuad(this.createMaterial())
    
    this.rgbRenderTarget = this.createPixelRenderTarget(resolution, THREE.RGBAFormat)
    this.normalRenderTarget = this.createPixelRenderTarget(resolution, THREE.RGBFormat)
    this.normalMaterial = new THREE.MeshNormalMaterial()
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    readBuffer: THREE.WebGLRenderTarget
  ) {
    // RGB 렌더링
    renderer.setRenderTarget(this.rgbRenderTarget)
    renderer.render(this.scene, this.camera)

    // Normal 렌더링
    const overrideMaterial_old = this.scene.overrideMaterial
    renderer.setRenderTarget(this.normalRenderTarget)
    this.scene.overrideMaterial = this.normalMaterial
    renderer.render(this.scene, this.camera)
    this.scene.overrideMaterial = overrideMaterial_old

    // 셰이더 유니폼 업데이트
    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms
    uniforms.tDiffuse.value = this.rgbRenderTarget.texture
    uniforms.tNormal.value = this.normalRenderTarget.texture
    uniforms.normalEdgeStrength.value = this.params.normalEdgeStrength
    uniforms.ditherStrength.value = this.params.ditherStrength
    uniforms.ditherScale.value = this.params.ditherScale
    
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
      const screenResolution = new THREE.Vector2(window.innerWidth, window.innerHeight)
      this.resolution = screenResolution.clone().divideScalar(params.pixelSize)
      this.resolution.x = Math.floor(this.resolution.x)
      this.resolution.y = Math.floor(this.resolution.y)
      
      // 렌더 타겟 재생성
      this.rgbRenderTarget.dispose()
      this.normalRenderTarget.dispose()
      this.rgbRenderTarget = this.createPixelRenderTarget(this.resolution, THREE.RGBAFormat)
      this.normalRenderTarget = this.createPixelRenderTarget(this.resolution, THREE.RGBFormat)
      
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

  private createMaterial(): THREE.ShaderMaterial {
    // 기본 유니폼
    const baseUniforms = {
      tDiffuse: { value: null },
      tNormal: { value: null },
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
      ditherScale: { value: this.params.ditherScale }
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
        uniform vec4 resolution;
        uniform float normalEdgeStrength;
        uniform float ditherStrength;
        uniform float ditherScale;
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

        vec3 getNormal(int x, int y) {
          return texture2D(tNormal, vUv + vec2(x, y) * resolution.zw).rgb * 2.0 - 1.0;
        }

        // 주변 픽셀의 실제 RGB 색상을 가져오는 함수 추가
        vec3 getRGBColor(int x, int y) {
          return texture2D(tDiffuse, vUv + vec2(x, y) * resolution.zw).rgb;
        }

        // 가장 간단한 엣지 감지
        float simpleEdge() {
          vec3 center = getNormal(0, 0);
          
          // 오른쪽과 아래쪽 방향 확인 (대각선 포함)
          float rightDiff = distance(center, getNormal(1, 0));
          float downDiff = distance(center, getNormal(0, 1));
          
          // 둘 중 하나라도 임계값을 넘으면 엣지
          float maxDiff = max(rightDiff, downDiff);
          return maxDiff > 0.5 ? 1.0 : 0.0;
        }

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          vec3 finalColor = texel.rgb;
          
          float edge = simpleEdge();
          
          // 엣지가 감지되면 색상별로 명확하게 다른 어두운 색상
          if (edge > 0.5) {
            // 빨간색 계열
            if (texel.r > 0.6 && texel.g < 0.4 && texel.b < 0.4) {
              finalColor = vec3(0.5, 0.1, 0.1); // 어두운 빨강
            }
            // 파란색 계열
            else if (texel.r < 0.4 && texel.g < 0.4 && texel.b > 0.6) {
              finalColor = vec3(0.1, 0.1, 0.5); // 어두운 파랑
            }
            // 노란색 계열 (의자)
            else if (texel.r > 0.6 && texel.g > 0.6 && texel.b < 0.4) {
              finalColor = vec3(0.8, 0.6, 0.0); // 어두운 노란색/갈색
            }
            // 흰색 계열 (바닥)
            else if (texel.r > 0.8 && texel.g > 0.8 && texel.b > 0.8) {
              finalColor = vec3(0.7, 0.7, 0.7); // 회색
            }
            // 회색 계열 (벽)
            else if (texel.r > 0.4 && texel.g > 0.4 && texel.b > 0.4) {
              finalColor = vec3(0.5, 0.5, 0.5); // 진한 회색
            }
            // 기타
            else {
              finalColor = texel.rgb * 0.3; // 30% 어둡게
            }
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
    this.normalRenderTarget.dispose()
    this.fsQuad.dispose()
  }
} 