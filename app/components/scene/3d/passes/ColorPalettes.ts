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
      name: 'MS Tinta',
      emoji: '🎨',
      colorCount: 36,
      shaderArrayName: 'mspaintPalette',
      description: 'Lospec MS Tinta 팔레트 - 올드스쿨 MS Paint 스타일 36색 (by Bruh Aw Man)'
    },
    {
      key: 'useNeutralPalette',
      name: 'Tailwind Neutral',
      emoji: '⚫',
      colorCount: 11,
      shaderArrayName: 'neutralPalette',
      description: 'Tailwind CSS Neutral 팔레트 - 순수한 그레이스케일 11색'
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

  // MS Tinta 팔레트 (36 colors) - Lospec (by Bruh Aw Man)
  // https://lospec.com/palette-list/ms-tinta
  static readonly WINDOWS_PALETTE = `
    vec3 mspaintPalette[36] = vec3[](
      vec3(0.000, 0.000, 0.000),  // #000000
      vec3(0.000, 0.000, 0.502),  // #000080
      vec3(0.000, 0.251, 0.502),  // #004080
      vec3(0.439, 0.573, 0.745),  // #7092be
      vec3(0.600, 0.851, 0.918),  // #99d9ea
      vec3(0.624, 1.000, 1.000),  // #9fffff
      vec3(1.000, 1.000, 1.000),  // #ffffff
      vec3(0.000, 0.251, 0.251),  // #004040
      vec3(0.000, 0.502, 0.251),  // #008040
      vec3(0.133, 0.694, 0.298),  // #22b14c
      vec3(0.710, 0.902, 0.114),  // #b5e61d
      vec3(1.000, 1.000, 0.502),  // #ffff80
      vec3(0.000, 0.000, 0.251),  // #000040
      vec3(0.173, 0.176, 0.329),  // #2c2d54
      vec3(0.247, 0.282, 0.800),  // #3f48cc
      vec3(0.502, 0.502, 0.753),  // #8080c0
      vec3(0.784, 0.749, 0.906),  // #c8bfe7
      vec3(0.000, 0.635, 0.910),  // #00a2e8
      vec3(0.502, 1.000, 0.502),  // #80ff80
      vec3(0.251, 0.000, 0.251),  // #400040
      vec3(0.639, 0.286, 0.643),  // #a349a4
      vec3(1.000, 0.502, 0.502),  // #ff8080
      vec3(1.000, 0.682, 0.788),  // #ffaec9
      vec3(0.251, 0.000, 0.000),  // #400000
      vec3(0.533, 0.000, 0.082),  // #880015
      vec3(0.929, 0.110, 0.141),  // #ed1c24
      vec3(1.000, 0.502, 0.251),  // #ff8040
      vec3(1.000, 0.886, 0.463),  // #ffe176
      vec3(0.502, 0.000, 0.502),  // #800080
      vec3(1.000, 0.000, 0.502),  // #ff0080
      vec3(0.502, 0.251, 0.251),  // #804040
      vec3(0.725, 0.478, 0.341),  // #b97a57
      vec3(1.000, 0.694, 0.392),  // #ffb164
      vec3(0.251, 0.000, 0.502),  // #400080
      vec3(0.937, 0.894, 0.690),  // #efe4b0
      vec3(0.498, 0.498, 0.498)   // #7f7f7f
    );
  `

  // Tailwind Neutral 팔레트 (11 colors) - 순수한 그레이스케일
  static readonly NEUTRAL_PALETTE = `
    vec3 neutralPalette[11] = vec3[](
      vec3(0.985, 0.985, 0.985),  // neutral-50
      vec3(0.970, 0.970, 0.970),  // neutral-100
      vec3(0.922, 0.922, 0.922),  // neutral-200
      vec3(0.870, 0.870, 0.870),  // neutral-300
      vec3(0.708, 0.708, 0.708),  // neutral-400
      vec3(0.556, 0.556, 0.556),  // neutral-500
      vec3(0.439, 0.439, 0.439),  // neutral-600
      vec3(0.371, 0.371, 0.371),  // neutral-700
      vec3(0.269, 0.269, 0.269),  // neutral-800
      vec3(0.205, 0.205, 0.205),  // neutral-900
      vec3(0.145, 0.145, 0.145)   // neutral-950
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
      ${this.NEUTRAL_PALETTE}
      ${this.LOSTGB_PALETTE}
      ${this.UI_PALETTE}
      ${this.generatePaletteFunctions()}
    `
  }
} 