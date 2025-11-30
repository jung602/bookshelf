import * as THREE from 'three'
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js'

// WBMP 파라미터 타입
export interface WBMPParams {
  ditherStrength: number    // 디더링 강도 (0-1)
  ditherScale: number       // 디더링 스케일
  grayLevels: number        // 그레이스케일 단계 (2, 4, 8, 16 등)
  intensity: number         // 효과 적용 강도 (0-1)
}

export class RenderWBMPPass extends Pass {
  private fsQuad: FullScreenQuad
  private params: WBMPParams

  constructor(params: WBMPParams) {
    super()
    
    this.params = params
    this.fsQuad = new FullScreenQuad(this.createMaterial())
  }

  render(
    renderer: THREE.WebGLRenderer,
    writeBuffer: THREE.WebGLRenderTarget,
    readBuffer: THREE.WebGLRenderTarget
  ) {
    // 셰이더 유니폼 업데이트
    const uniforms = (this.fsQuad.material as THREE.ShaderMaterial).uniforms
    uniforms.tDiffuse.value = readBuffer.texture
    uniforms.ditherStrength.value = this.params.ditherStrength
    uniforms.ditherScale.value = this.params.ditherScale
    uniforms.grayLevels.value = this.params.grayLevels
    uniforms.intensity.value = this.params.intensity

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

  private createMaterial(): THREE.ShaderMaterial {
    return new THREE.ShaderMaterial({
      uniforms: {
        tDiffuse: { value: null },
        ditherStrength: { value: this.params.ditherStrength },
        ditherScale: { value: this.params.ditherScale },
        grayLevels: { value: this.params.grayLevels },
        intensity: { value: this.params.intensity }
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
        uniform float ditherStrength;
        uniform float ditherScale;
        uniform float grayLevels;
        uniform float intensity;
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

        // RGB를 그레이스케일로 변환 (인간 시각 가중치 사용)
        float toGrayscale(vec3 color) {
          return dot(color, vec3(0.299, 0.587, 0.114));
        }

        // 디더링 적용
        float applyDither(float gray, vec2 coord) {
          float bayerValue = getBayerValue(coord);
          // 디더링 적용: Bayer 값을 -0.5~0.5 범위로 변환하고 강도 적용
          float dithered = gray + (bayerValue - 0.5) * ditherStrength;
          return clamp(dithered, 0.0, 1.0);
        }

        // 제한된 그레이스케일 레벨로 양자화
        float quantizeGray(float gray) {
          if (grayLevels <= 1.0) return gray;
          
          // 레벨 수에 맞춰 양자화
          float step = 1.0 / (grayLevels - 1.0);
          float level = floor(gray / step + 0.5);
          return level * step;
        }

        void main() {
          vec4 texel = texture2D(tDiffuse, vUv);
          
          // 1. 그레이스케일로 변환
          float gray = toGrayscale(texel.rgb);
          
          // 2. 디더링 적용 (픽셀 좌표 사용)
          vec2 pixelCoord = gl_FragCoord.xy;
          float ditheredGray = applyDither(gray, pixelCoord);
          
          // 3. 제한된 그레이스케일 레벨로 양자화
          float quantizedGray = quantizeGray(ditheredGray);
          
          // 4. 그레이스케일 값을 RGB로 변환
          vec3 wbmpColor = vec3(quantizedGray);
          
          // 5. intensity 파라미터로 원본과 믹스
          vec3 finalColor = mix(texel.rgb, wbmpColor, intensity);
          
          gl_FragColor = vec4(finalColor, texel.a);
        }
      `
    })
  }

  dispose() {
    this.fsQuad.dispose()
  }
}

