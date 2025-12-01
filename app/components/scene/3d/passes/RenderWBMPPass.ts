import * as THREE from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

// WBMP 파라미터 타입
export interface WBMPParams {
  ditherStrength: number    // 디더링 강도 (0-1)
  ditherScale: number       // 디더링 스케일
  grayLevels: number        // 그레이스케일 단계 (2, 4, 8, 16 등)
  intensity: number         // 효과 적용 강도 (0-1)
  // 아웃라인 파라미터
  normalEdgeStrength: number
  depthEdgeStrength: number
  edgeThreshold: number
}

export class RenderWBMPPass extends Pass {
  private fsQuad: FullScreenQuad
  private params: WBMPParams
  private scene: THREE.Scene
  private camera: THREE.Camera
  private rgbRenderTarget: THREE.WebGLRenderTarget
  private normalRenderTarget: THREE.WebGLRenderTarget
  private maskRenderTarget: THREE.WebGLRenderTarget  // 책 객체 마스크용
  private normalMaterial: THREE.Material
  private maskMaterial: THREE.MeshBasicMaterial  // 마스크용 재질
  private resolution: THREE.Vector2

  constructor(
    resolution: THREE.Vector2,
    scene: THREE.Scene,
    camera: THREE.Camera,
    params: WBMPParams
  ) {
    super()
    
    this.resolution = resolution
    this.scene = scene
    this.camera = camera
    this.params = params
    
    this.fsQuad = new FullScreenQuad(this.createMaterial())
    
    // RGB 렌더 타겟 생성
    this.rgbRenderTarget = new THREE.WebGLRenderTarget(resolution.x, resolution.y)
    this.rgbRenderTarget.texture.format = THREE.RGBAFormat
    this.rgbRenderTarget.texture.minFilter = THREE.NearestFilter
    this.rgbRenderTarget.texture.magFilter = THREE.NearestFilter
    this.rgbRenderTarget.texture.generateMipmaps = false
    this.rgbRenderTarget.stencilBuffer = false
    
    // Depth texture 추가
    this.rgbRenderTarget.depthTexture = new THREE.DepthTexture(resolution.x, resolution.y)
    this.rgbRenderTarget.depthTexture.format = THREE.DepthFormat
    this.rgbRenderTarget.depthTexture.type = THREE.UnsignedShortType
    
    // Normal 렌더 타겟 생성
    this.normalRenderTarget = new THREE.WebGLRenderTarget(resolution.x, resolution.y)
    this.normalRenderTarget.texture.format = THREE.RGBFormat
    this.normalRenderTarget.texture.minFilter = THREE.NearestFilter
    this.normalRenderTarget.texture.magFilter = THREE.NearestFilter
    this.normalRenderTarget.texture.generateMipmaps = false
    this.normalRenderTarget.stencilBuffer = false
    
    // 마스크 렌더 타겟 생성 (책 객체 구분용)
    this.maskRenderTarget = new THREE.WebGLRenderTarget(resolution.x, resolution.y)
    this.maskRenderTarget.texture.format = THREE.RGBAFormat
    this.maskRenderTarget.texture.minFilter = THREE.NearestFilter
    this.maskRenderTarget.texture.magFilter = THREE.NearestFilter
    this.maskRenderTarget.texture.generateMipmaps = false
    this.maskRenderTarget.stencilBuffer = false
    
    // Normal material 생성
    this.normalMaterial = new THREE.MeshNormalMaterial()
    
    // 마스크 material 생성 (책 객체는 흰색, 나머지는 검정색)
    this.maskMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    readBuffer: THREE.WebGLRenderTarget
  ) {
    // RGB 렌더링 (depth 포함)
    renderer.setRenderTarget(this.rgbRenderTarget)
    renderer.render(this.scene, this.camera)
    
    // Normal 렌더링
    const overrideMaterial_old = this.scene.overrideMaterial
    renderer.setRenderTarget(this.normalRenderTarget)
    this.scene.overrideMaterial = this.normalMaterial
    renderer.render(this.scene, this.camera)
    this.scene.overrideMaterial = overrideMaterial_old
    
    // 마스크 렌더링 (책 객체만 흰색으로)
    renderer.setRenderTarget(this.maskRenderTarget)
    renderer.clear()
    this.renderMask(renderer)
    
    // 셰이더 유니폼 업데이트
    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms
    uniforms.tDiffuse.value = this.rgbRenderTarget.texture
    uniforms.tNormal.value = this.normalRenderTarget.texture
    uniforms.tDepth.value = this.rgbRenderTarget.depthTexture
    uniforms.tMask.value = this.maskRenderTarget.texture  // 마스크 텍스처 추가
    uniforms.ditherStrength.value = this.params.ditherStrength
    uniforms.ditherScale.value = this.params.ditherScale
    uniforms.grayLevels.value = this.params.grayLevels
    uniforms.intensity.value = this.params.intensity
    uniforms.normalEdgeStrength.value = this.params.normalEdgeStrength
    uniforms.depthEdgeStrength.value = this.params.depthEdgeStrength
    uniforms.edgeThreshold.value = this.params.edgeThreshold

    // 최종 렌더링
    if (this.renderToScreen) {
      renderer.setRenderTarget(null)
    } else {
      renderer.setRenderTarget(writeBuffer)
      if (this.clear) renderer.clear()
    }
    
    this.fsQuad.render(renderer)
  }

  updateParams(params: Partial<WBMPParams>) {
    Object.assign(this.params, params)
  }
  
  // 책 객체만 흰색으로 렌더링하는 헬퍼 함수
  private renderMask(renderer: THREE.WebGLRenderer) {
    const whiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff })
    const blackMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 })
    const originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>()
    
    // 씬의 모든 메시를 순회
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        originalMaterials.set(object, object.material)
        // 책 객체는 흰색, 나머지는 검정색
        object.material = object.userData.isBook ? whiteMaterial : blackMaterial
      }
    })
    
    // 렌더링
    renderer.render(this.scene, this.camera)
    
    // 원래 재질로 복원
    originalMaterials.forEach((material, mesh) => {
      mesh.material = material
    })
  }

  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        tNormal: { value: null },
        tDepth: { value: null },
        tMask: { value: null },  // 책 객체 마스크
        resolution: {
          value: new THREE.Vector4(
            this.resolution.x,
            this.resolution.y,
            1 / this.resolution.x,
            1 / this.resolution.y
          )
        },
        ditherStrength: { value: this.params.ditherStrength },
        ditherScale: { value: this.params.ditherScale },
        grayLevels: { value: this.params.grayLevels },
        intensity: { value: this.params.intensity },
        normalEdgeStrength: { value: this.params.normalEdgeStrength },
        depthEdgeStrength: { value: this.params.depthEdgeStrength },
        edgeThreshold: { value: this.params.edgeThreshold }
      },
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
        uniform sampler2D tMask;  // 책 객체 마스크
        uniform vec4 resolution;
        uniform float ditherStrength;
        uniform float ditherScale;
        uniform float grayLevels;
        uniform float intensity;
        uniform float normalEdgeStrength;
        uniform float depthEdgeStrength;
        uniform float edgeThreshold;
        varying vec2 vUv;

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

        // 수평선 패턴 (선 두께 고정)
        float getHorizontalLines(vec2 coord, float scale) {
          float pattern = fract(coord.y / scale);
          // scale이 커져도 선 두께는 일정하게 유지 (약 20%)
          float lineThickness = 0.2 / (scale / ditherScale);
          return step(lineThickness, pattern);  // 검은 선이 얇아지도록 반전
        }

        // 대각선 패턴
        float getDiagonalLines(vec2 coord, float scale) {
          return step(0.5, fract((coord.x + coord.y) / scale));
        }

        // 크로스해치 패턴 (격자)
        float getCrosshatch(vec2 coord, float scale) {
          float h = step(0.5, fract(coord.y / scale));
          float v = step(0.5, fract(coord.x / scale));
          return max(h, v);
        }

        // RGB를 그레이스케일로 변환 (인간 시각 가중치 사용)
        float toGrayscale(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }

        // Bayer 도트 디더링 (기존 방식)
        float applyBayerDither(float gray, vec2 coord) {
          float bayerValue = getBayerValue(coord);
          float dithered = gray + (bayerValue - 0.5) * ditherStrength;
          return clamp(dithered, 0.0, 1.0);
        }

        // 명도에 따라 다른 패턴 적용
        float applyDither(float gray, vec2 coord) {
          if (gray <= 0.3) {
            // 어두운 영역: 순수 검은색 (디더링 없음)
            return 0.0;
          } else if (gray > 0.65) {
            // 밝은 영역: 도트 패턴 (Bayer matrix)
            return applyBayerDither(gray, coord);
          } else {
            // 중간 영역 (0.3 < gray ≤ 0.65): 수평선 패턴
            float line = getHorizontalLines(coord, ditherScale * 1.5);  // 선 간격 2배로 넓게
            // 명도에 따라 선의 밀도 조정
            float threshold = (gray - 0.3) / 0.35;
            return step(threshold, line);
          }
        }

        // 제한된 그레이스케일 레벨로 양자화
        float quantizeGray(float gray) {
          if (grayLevels <= 1.0) return gray;
          
          // 레벨 수에 맞춰 양자화
          float step = 1.0 / (grayLevels - 1.0);
          float level = floor(gray / step + 0.5);
          return level * step;
        }

        // Normal 값 가져오기 (샘플링 간격을 줄여서 줌 레벨에 덜 민감하게)
        vec3 getNormal(int x, int y) {
          vec2 offset = vec2(float(x), float(y)) * resolution.zw * 0.3;
          return texture2D(tNormal, vUv + offset).rgb * 2.0 - 1.0;
        }

        // Depth 값 가져오기
        float getDepth(int x, int y) {
          vec2 offset = vec2(float(x), float(y)) * resolution.zw;
          return texture2D(tDepth, vUv + offset).r;
        }

        // Edge detection (depth와 normal 분리 반환)
        vec2 getEdges() {
          vec3 centerNormal = getNormal(0, 0);
          float centerDepth = getDepth(0, 0);
          
          float depthStrength = 0.0;
          float normalStrength = 0.0;
          
          // 8방향 neighbor 체크
          for(int x = -1; x <= 1; x++) {
            for(int y = -1; y <= 1; y++) {
              if(x == 0 && y == 0) continue;
              
              vec3 neighborNormal = getNormal(x, y);
              float neighborDepth = getDepth(x, y);
              
              // Depth edge detection
              float depthBias = neighborDepth - centerDepth;
              depthStrength += clamp(depthBias, 0.0, 1.0);
              
              // Normal edge detection (절대값 사용으로 안정성 향상)
              float sharpness = 1.0 - abs(dot(centerNormal, neighborNormal));
              normalStrength += sharpness;
            }
          }
          
          // Edge 강도 계산 - 뎁스와 노말 엣지 두께를 비슷하게 유지
          float depthEdge = smoothstep(0.002, 0.006, depthStrength) * depthEdgeStrength;
          // Normal edge: 샘플링 간격을 줄여서 줌 레벨과 무관하게 얇게 유지
          float normalEdge = smoothstep(0.08, 0.12, normalStrength) * normalEdgeStrength;
          
          return vec2(depthEdge, normalEdge);
        }

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          
          // 마스크 값 확인 (책 객체인지 확인)
          float mask = texture2D(tMask, vUv).r;
          bool isBook = mask > 0.5;  // 흰색(1.0)이면 책 객체
          
          // 1. Edge detection (depth와 normal 분리)
          vec2 edges = getEdges();
          float depthEdge = edges.x;
          float normalEdge = edges.y;
          
          // step 대신 smoothstep 사용해서 부드러운 전환
          float isDepthEdge = smoothstep(edgeThreshold - 0.05, edgeThreshold + 0.05, depthEdge);
          float isNormalEdge = smoothstep(edgeThreshold - 0.05, edgeThreshold + 0.05, normalEdge);
          
          // Edge 여부 확인
          float isEdge = max(isDepthEdge, isNormalEdge);
          
          vec3 finalColor;
          
          if (isBook) {
            // 책 객체: 원본 컬러 유지, 엣지만 적용
            if (isEdge > 0.5) {
              // 엣지 영역: 검은색으로
              finalColor = vec3(0.0);
            } else {
              // 일반 영역: 원본 컬러 유지
              finalColor = texel.rgb;
            }
          } else {
            // 일반 객체: 기존 로직 (그레이스케일 + 디더링)
            float gray = toGrayscale(texel.rgb);
            float finalGray;
            
            if (isEdge > 0.5) {
              // Edge 영역: 디더링 없이 직접 적용
              gray = mix(gray, 0.0, isDepthEdge);  // Depth edge: 검은색
              gray = mix(gray, 0.0, isNormalEdge); // Normal edge: 검은색
              finalGray = gray; // 디더링 건너뛰기
            } else {
              // 일반 영역: 디더링 적용
              vec2 pixelCoord = gl_FragCoord.xy;
              float ditheredGray = applyDither(gray, pixelCoord);
              // 제한된 그레이스케일 레벨로 양자화
              finalGray = quantizeGray(ditheredGray);
            }
            
            // 그레이스케일 값을 RGB로 변환
            vec3 wbmpColor = vec3(finalGray);
            
            // intensity 파라미터로 원본과 믹스
            finalColor = mix(texel.rgb, wbmpColor, intensity);
          }
          
          gl_FragColor = vec4(finalColor, texel.a);
        }
      `
    })
  }

  dispose() {
    this.rgbRenderTarget.dispose()
    this.normalRenderTarget.dispose()
    this.maskRenderTarget.dispose()
    this.fsQuad.dispose()
  }
}

