// 팔레트 메타데이터 타입 정의
export interface PaletteMetadata {
  key: string
  name: string
  emoji: string
  colorCount: number
  shaderArrayName: string
  description: string
}

// 색상 팔레트 데이터와 관련 함수들
export class ColorPalettes {
  // 팔레트 메타데이터 목록 (새 팔레트 추가 시 여기에만 추가하면 됨!)
  static readonly PALETTE_METADATA: PaletteMetadata[] = [
    {
      key: 'usePalette',
      name: 'Pokemon Palette',
      emoji: '🎮',
      colorCount: 32,
      shaderArrayName: 'pokemonPalette',
      description: 'Pokemon Puzzle Challenge 게임보이 컬러 스타일'
    },
    {
      key: 'useMSPaintPalette',
      name: 'Windows 16',
      emoji: '🖥️',
      colorCount: 16,
      shaderArrayName: 'mspaintPalette',
      description: 'Classic Windows VGA 16색 기본 팔레트'
    },
    {
      key: 'useSupremoPalette',
      name: 'Supremo Art',
      emoji: '🎨',
      colorCount: 12,
      shaderArrayName: 'supremoPalette',
      description: 'Kazimir Malevich의 아방가르드 예술 작품 스타일'
    },
    {
      key: 'useLostGBPalette',
      name: 'LostGB Creepy',
      emoji: '👻',
      colorCount: 4,
      shaderArrayName: 'lostGBPalette',
      description: 'Pokemon Lost Silver 크리피파스타의 어두운 분위기'
    },
    {
      key: 'useUIPalette',
      name: 'UI Palette',
      emoji: '🎯',
      colorCount: 18,
      shaderArrayName: 'uiPalette',
      description: '모던 UI 디자인을 위한 18색 팔레트'
    }
  ]

  // 팔레트 파라미터 타입 자동 생성
  static getPaletteParamsType() {
    const paletteParams: Record<string, number> = {}
    this.PALETTE_METADATA.forEach(palette => {
      paletteParams[palette.key] = 0.0
    })
    return paletteParams
  }

  // Pokemon Puzzle Challenge 팔레트 (32 colors)
  static readonly POKEMON_PALETTE = `
    vec3 pokemonPalette[32] = vec3[](
      vec3(0.094, 0.094, 0.251),  // #181840
      vec3(0.376, 0.251, 0.376),  // #604060
      vec3(0.518, 0.420, 0.388),  // #846b63
      vec3(0.678, 0.710, 0.741),  // #adb5bd
      vec3(1.000, 1.000, 1.000),  // #ffffff
      vec3(0.533, 0.471, 0.816),  // #8878d0
      vec3(0.596, 0.659, 0.973),  // #98a8f8
      vec3(0.157, 0.157, 0.510),  // #282882
      vec3(0.224, 0.157, 1.000),  // #3928ff
      vec3(0.282, 0.408, 0.910),  // #4868e8
      vec3(0.259, 0.349, 0.518),  // #425984
      vec3(0.235, 0.647, 0.800),  // #3ca5cc
      vec3(0.063, 1.000, 1.000),  // #10ffff
      vec3(0.565, 0.251, 0.659),  // #9040a8
      vec3(0.973, 0.157, 0.471),  // #f82878
      vec3(0.973, 0.408, 0.784),  // #f868c8
      vec3(0.973, 0.565, 0.722),  // #f890b8
      vec3(0.612, 0.094, 0.259),  // #9c1842
      vec3(0.839, 0.192, 0.000),  // #d63100
      vec3(1.000, 0.612, 0.282),  // #ff9c47
      vec3(0.973, 0.847, 0.125),  // #f8d820
      vec3(0.098, 0.353, 0.098),  // #195a19
      vec3(0.063, 0.647, 0.000),  // #10a500
      vec3(0.518, 0.808, 0.259),  // #84ce42
      vec3(0.580, 1.000, 0.741),  // #94ffbd
      vec3(0.251, 0.188, 0.000),  // #403000
      vec3(0.678, 0.412, 0.031),  // #ad6908
      vec3(0.839, 0.573, 0.129),  // #d69221
      vec3(0.910, 0.722, 0.376),  // #e8b860
      vec3(1.000, 0.808, 0.549),  // #ffce8c
      vec3(0.808, 0.510, 0.388),  // #ce8263
      vec3(1.000, 0.573, 0.518)   // #ff9284
    );
  `

  // Windows 16색 기본 팔레트 (16 colors) - Classic Windows VGA palette
  static readonly WINDOWS_PALETTE = `
    vec3 mspaintPalette[16] = vec3[](
      vec3(0.000, 0.000, 0.000),  // #000000 - Black
      vec3(0.000, 0.000, 0.502),  // #000080 - Dark Blue
      vec3(0.000, 0.502, 0.000),  // #008000 - Dark Green
      vec3(0.000, 0.502, 0.502),  // #008080 - Dark Cyan
      vec3(0.502, 0.000, 0.000),  // #800000 - Dark Red
      vec3(0.502, 0.000, 0.502),  // #800080 - Dark Magenta
      vec3(0.502, 0.502, 0.000),  // #808000 - Brown
      vec3(0.753, 0.753, 0.753),  // #C0C0C0 - Light Gray
      vec3(0.502, 0.502, 0.502),  // #808080 - Dark Gray
      vec3(0.000, 0.000, 1.000),  // #0000FF - Blue
      vec3(0.000, 1.000, 0.000),  // #00FF00 - Green
      vec3(0.000, 1.000, 1.000),  // #00FFFF - Cyan
      vec3(1.000, 0.000, 0.000),  // #FF0000 - Red
      vec3(1.000, 0.000, 1.000),  // #FF00FF - Magenta
      vec3(1.000, 1.000, 0.000),  // #FFFF00 - Yellow
      vec3(1.000, 1.000, 1.000)   // #FFFFFF - White
    );
  `

  // Supremo 팔레트 (12 colors) - Kazimir Malevich inspired
  static readonly SUPREMO_PALETTE = `
    vec3 supremoPalette[12] = vec3[](
      vec3(0.925, 0.906, 0.882),  // #ece7e1
      vec3(0.871, 0.835, 0.769),  // #ded5c4
      vec3(0.886, 0.816, 0.325),  // #e2d053
      vec3(0.875, 0.525, 0.227),  // #df863a
      vec3(0.714, 0.278, 0.180),  // #b6472e
      vec3(0.384, 0.133, 0.110),  // #62221c
      vec3(0.090, 0.086, 0.094),  // #171618
      vec3(0.192, 0.231, 0.322),  // #313b52
      vec3(0.263, 0.380, 0.541),  // #43618a
      vec3(0.553, 0.651, 0.678),  // #8da6ad
      vec3(0.427, 0.463, 0.369),  // #6d765e
      vec3(0.231, 0.333, 0.212)   // #3b5536
    );
  `

  // LostGB 팔레트 (4 colors) - Pokemon Lost Silver creepypasta inspired
  static readonly LOSTGB_PALETTE = `
    vec3 lostGBPalette[4] = vec3[](
      vec3(0.078, 0.075, 0.098),  // #141319
      vec3(0.188, 0.188, 0.239),  // #30303d
      vec3(0.482, 0.478, 0.643),  // #7b7aa4
      vec3(0.855, 0.855, 0.855)   // #dadada
    );
  `

  // UI 팔레트 (18 colors) - 모던 UI 디자인용
  static readonly UI_PALETTE = `
    vec3 uiPalette[18] = vec3[](
      vec3(1.000, 1.000, 1.000),  // #ffffff - White
      vec3(0.000, 0.000, 0.000),  // #000000 - Black
      vec3(0.420, 0.447, 0.502),  // #6b7280 - Gray
      vec3(0.627, 0.322, 0.176),  // #a0522d - Brown
      vec3(0.863, 0.149, 0.149),  // #dc2626 - Red
      vec3(0.925, 0.286, 0.600),  // #ec4899 - Pink
      vec3(0.918, 0.345, 0.047),  // #ea580c - Orange
      vec3(0.918, 0.702, 0.031),  // #eab308 - Yellow
      vec3(0.518, 0.800, 0.086),  // #84cc16 - Lime
      vec3(0.086, 0.639, 0.290),  // #16a34a - Green
      vec3(0.020, 0.588, 0.412),  // #059669 - Emerald
      vec3(0.051, 0.580, 0.533),  // #0d9488 - Teal
      vec3(0.008, 0.518, 0.780),  // #0284c7 - Sky
      vec3(0.149, 0.388, 0.922),  // #2563eb - Blue
      vec3(0.263, 0.220, 0.792),  // #4338ca - Indigo
      vec3(0.486, 0.227, 0.929),  // #7c3aed - Purple
      vec3(0.753, 0.149, 0.827),  // #c026d3 - Fuchsia
      vec3(0.882, 0.114, 0.282)   // #e11d48 - Rose
    );
  `

  // 팔레트 함수 이름 생성 헬퍼
  static getFunctionName(shaderArrayName: string): string {
    // pokemonPalette -> findClosestPokemonColor
    // mspaintPalette -> findClosestMspaintColor
    const baseName = shaderArrayName.replace('Palette', '')
    return `findClosest${baseName.charAt(0).toUpperCase() + baseName.slice(1)}Color`
  }

  // 팔레트 함수들 자동 생성
  static generatePaletteFunctions(): string {
    return this.PALETTE_METADATA.map(palette => {
      const functionName = this.getFunctionName(palette.shaderArrayName)
      return `
        // 가장 가까운 ${palette.name} 색상 찾기
        vec3 ${functionName}(vec3 color) {
          vec3 closestColor = ${palette.shaderArrayName}[0];
          float minDistance = distance(color, closestColor);
          
          for (int i = 1; i < ${palette.colorCount}; i++) {
            float d = distance(color, ${palette.shaderArrayName}[i]);
            if (d < minDistance) {
              minDistance = d;
              closestColor = ${palette.shaderArrayName}[i];
            }
          }
          
          return closestColor;
        }
      `
    }).join('\n')
  }

  // 팔레트 적용 코드 자동 생성
  static generatePaletteApplicationCode(): string {
    return this.PALETTE_METADATA.map(palette => {
      const functionName = this.getFunctionName(palette.shaderArrayName)
      return `
        // ${palette.name} 팔레트 적용 (0-1 범위로 조절 가능)
        if (${palette.key} > 0.0) {
          vec3 paletteColor = ${functionName}(finalColor);
          finalColor = mix(finalColor, paletteColor, ${palette.key});
        }
      `
    }).join('\n')
  }

  // 모든 팔레트 데이터를 합쳐서 반환
  static getAllPalettesShaderCode(): string {
    return `
      ${this.POKEMON_PALETTE}
      ${this.WINDOWS_PALETTE}
      ${this.SUPREMO_PALETTE}
      ${this.LOSTGB_PALETTE}
      ${this.UI_PALETTE}
      ${this.generatePaletteFunctions()}
    `
  }
} 