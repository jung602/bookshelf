import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { SceneManager } from "../SceneManager";
import {
  getThemeColors,
  getGridArea,
  getCornerRadiusStyle,
  GRADIENTS,
  TRANSITIONS,
  getResponsiveContainerRounding,
  getResponsiveGridRounding,
  getCenterBlockRounding,
} from "./cssUtils";
import { useResponsiveDevice } from "../../../../hooks/useResponsiveDevice";

interface BlockState {
  row: number;
  col: number;
  isActive: boolean;
}

interface FloorTileControlProps {
  isDarkMode: boolean;
  onChange?: (grid: boolean[][]) => void;
  initialGrid?: boolean[][]; // 초기 그리드 상태
  sceneManager?: SceneManager; // 직접 호출을 위한 SceneManager
}

export default function FloorTileControl({
  isDarkMode,
  onChange,
  initialGrid,
  sceneManager,
}: FloorTileControlProps) {
  console.log('FloorTileControl: Component rendering, isDarkMode:', isDarkMode, 'onChange:', !!onChange, 'initialGrid:', initialGrid, 'sceneManager:', !!sceneManager);

  // 반응형 디바이스 감지
  const { isMobile } = useResponsiveDevice();

  const [blocks, setBlocks] = useState<BlockState[]>(() => {
    const initialBlocks: BlockState[] = [];
    
    // initialGrid가 있으면 그것을 기준으로 초기화
    if (initialGrid && initialGrid.length === 5 && initialGrid[0].length === 5) {
      for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= 5; col++) {
          if (row === 3 && col === 3) continue; // 가운데는 제외
          initialBlocks.push({
            row,
            col,
            isActive: initialGrid[row - 1][col - 1], // initialGrid에서 상태 가져오기
          });
        }
      }
    } else {
      // 기본 초기화 (모두 비활성화)
      for (let row = 1; row <= 5; row++) {
        for (let col = 1; col <= 5; col++) {
          if (row === 3 && col === 3) continue;
          initialBlocks.push({
            row,
            col,
            isActive: false,
          });
        }
      }
    }
    
    console.log('FloorTileControl: Initial blocks created:', initialBlocks.length, 'with active blocks:', initialBlocks.filter(b => b.isActive).length);
    return initialBlocks;
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<
    "activate" | "deactivate" | null
  >(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMountRef = useRef(true); // 초기 마운트 추적

  // Initialize Web Audio Context for sound generation
  const audioContextRef = useRef<AudioContext | null>(null);

  // Convert blocks to boolean grid (5x5)
  const convertBlocksToGrid = useCallback((blocks: BlockState[]): boolean[][] => {
    const grid: boolean[][] = Array(5).fill(null).map(() => Array(5).fill(false));
    
    // 가운데(3,3)는 항상 true
    grid[2][2] = true;
    
    // 나머지 블록들 적용
    blocks.forEach(block => {
      grid[block.row - 1][block.col - 1] = block.isActive;
    });
    
    console.log('FloorTileControl: convertBlocksToGrid result:', {
      activeBlocks: blocks.filter(b => b.isActive),
      grid: grid.map((row, i) => `Row ${i}: [${row.map(cell => cell ? '■' : '□').join(', ')}]`).join('\n')
    });
    
    return grid;
  }, []);

  // 간단한 바닥 업데이트 (직접 호출)
  const updateFloorDirect = useCallback((blocks: BlockState[]) => {
    if (sceneManager && !isInitialMountRef.current) {
      const grid = convertBlocksToGrid(blocks);
      console.log('FloorTileControl: Calling sceneManager.updateFloorOnly directly');
      sceneManager.updateFloorOnly(grid);
    }
  }, [sceneManager, convertBlocksToGrid]);

  // 디바운싱된 업데이트
  const debouncedUpdate = useCallback((blocks: BlockState[]) => {
    // 초기 마운트시에는 업데이트하지 않음
    if (isInitialMountRef.current) {
      console.log('FloorTileControl: Skipping update - still in initial mount');
      return;
    }

    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      // SceneManager가 있으면 직접 호출, 없으면 기존 onChange 사용
      if (sceneManager) {
        updateFloorDirect(blocks);
      } else if (onChange) {
        const grid = convertBlocksToGrid(blocks);
        console.log('FloorTileControl: Using fallback onChange');
        onChange(grid);
      }
    }, 100); // 100ms로 더 빠르게
  }, [sceneManager, updateFloorDirect, onChange, convertBlocksToGrid]);

  // 초기 마운트 완료 후 플래그 해제
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
      console.log('FloorTileControl: Initial mount completed, updates enabled');
    }, 200); // 200ms로 더 빠르게

    return () => clearTimeout(timer);
  }, []);

  // blocks 상태가 변경될 때마다 디바운싱된 onChange 호출
  useEffect(() => {
    if (!isInitialMountRef.current) {
      debouncedUpdate(blocks);
    }
  }, [blocks, debouncedUpdate]);

  // initialGrid가 변경되었을 때 blocks 상태 업데이트
  useEffect(() => {
    if (initialGrid && initialGrid.length === 5 && initialGrid[0].length === 5) {
      console.log('FloorTileControl: initialGrid changed, updating blocks');
      
      setBlocks(prevBlocks => {
        const newBlocks = prevBlocks.map(block => {
          const newIsActive = initialGrid[block.row - 1][block.col - 1];
          if (block.isActive !== newIsActive) {
            console.log(`FloorTileControl: Updating block (${block.row}, ${block.col}) from ${block.isActive} to ${newIsActive}`);
          }
          return {
            ...block,
            isActive: newIsActive
          };
        });
        
        return newBlocks;
      });
    }
  }, [initialGrid]);

  useEffect(() => {
    // Initialize AudioContext
    try {
      audioContextRef.current = new (window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    } catch {
      console.log("Web Audio API not supported");
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Function to play click sound using Web Audio API
  const playClickSound = useCallback(() => {
    if (!audioContextRef.current) return;

    try {
      const ctx = audioContextRef.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Create a pleasant click sound
      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(
        200,
        ctx.currentTime + 0.1,
      );

      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        ctx.currentTime + 0.1,
      );

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.log("Sound play failed:", e);
    }
  }, []);

  // Theme-based colors
  const themeColors = getThemeColors(isDarkMode);

  const toggleBlock = useCallback(
    (row: number, col: number) => {
      console.log(`FloorTileControl: toggleBlock called for (${row}, ${col})`);
      setBlocks((prevBlocks) => {
        const currentBlock = prevBlocks.find(b => b.row === row && b.col === col);
        const currentState = currentBlock?.isActive || false;
        console.log(`FloorTileControl: Current state for (${row}, ${col}): ${currentState} -> ${!currentState}`);
        
        const newBlocks = prevBlocks.map((block) => {
          if (block.row === row && block.col === col) {
            const newState = !block.isActive;
            // Play sound only when activating (not when deactivating)
            if (newState) {
              playClickSound();
            }
            return { ...block, isActive: newState };
          }
          return block;
        });
        
        console.log('FloorTileControl: Updated blocks state:', newBlocks);
        return newBlocks;
      });
    },
    [playClickSound],
  );

  const setBlockState = useCallback(
    (row: number, col: number, isActive: boolean) => {
      console.log(`FloorTileControl: setBlockState called for (${row}, ${col}) -> ${isActive}`);
      setBlocks((prevBlocks) => {
        const currentBlock = prevBlocks.find(
          (b) => b.row === row && b.col === col,
        );
        const wasActive = currentBlock?.isActive || false;

        const newBlocks = prevBlocks.map((block) => {
          if (block.row === row && block.col === col) {
            // Play sound only when activating (transition from false to true)
            if (!wasActive && isActive) {
              playClickSound();
            }
            return { ...block, isActive };
          }
          return block;
        });
        return newBlocks;
      });
    },
    [playClickSound],
  );

  const getBlockState = (row: number, col: number) => {
    const block = blocks.find(
      (b) => b.row === row && b.col === col,
    );
    return block?.isActive || false;
  };



  const handleMouseDown = (
    row: number,
    col: number,
    e: React.MouseEvent,
  ) => {
    console.log(`FloorTileControl: handleMouseDown called for (${row}, ${col})`);
    e.preventDefault();
    setIsDragging(true);
    const currentState = getBlockState(row, col);
    const newMode = currentState ? "deactivate" : "activate";
    setDragMode(newMode);
    toggleBlock(row, col);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (isDragging && dragMode) {
      const currentState = getBlockState(row, col);
      if (dragMode === "activate" && !currentState) {
        setBlockState(row, col, true);
      } else if (dragMode === "deactivate" && currentState) {
        setBlockState(row, col, false);
      }
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragMode(null);
  };

  // Add global mouse up listener
  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp);
    return () =>
      document.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const renderBlock = (row: number, col: number) => {
    const isActive = getBlockState(row, col);
    const gridArea = getGridArea(row, col);
    const cornerRadiusStyle = getCornerRadiusStyle(row, col, isMobile);

    return (
      <div
        key={`${row}-${col}`}
        className={`${gridArea} relative shrink-0 cursor-pointer ${TRANSITIONS.default} select-none`}
        onMouseDown={(e) => handleMouseDown(row, col, e)}
        onMouseEnter={() => handleMouseEnter(row, col)}
      >
        {isActive ? (
          // Active state - Onclick design
          <div className="absolute contents left-[-0.2px] top-[0.4px]">
            {/* Colorful gradient background layer */}
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                backgroundImage: GRADIENTS.colorfulRadial,
                ...cornerRadiusStyle,
              }}
            />
            {/* Blue gradient layer */}
            <div
              className="absolute inset-0 w-full h-full opacity-60"
              style={{
                backgroundImage: GRADIENTS.radialBlue,
                ...cornerRadiusStyle,
              }}
            />
            <div
              className="absolute backdrop-blur-[20px] backdrop-filter size-full translate-x-[-50%] translate-y-[-50%]"
              style={{
                backgroundColor: themeColors.activeBackdrop,
                top: "calc(50% + 0.4px)",
                left: "calc(50% - 0.2px)",
                ...cornerRadiusStyle,
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: `0px 1px 2px 1px inset ${themeColors.activeShadow}`,
                  ...cornerRadiusStyle,
                }}
              />
            </div>
          </div>
        ) : (
          // Inactive state - Basic design
          <div className="absolute contents left-[-0.2px] top-[0.4px]">
            <div
              className="absolute backdrop-blur-[20px] backdrop-filter size-full translate-x-[-50%] translate-y-[-50%]"
              style={{
                backgroundColor: themeColors.inactiveBlock,
                boxShadow: `0px 1px 2px 0px ${themeColors.inactiveShadow}`,
                top: "calc(50% + 0.4px)",
                left: "calc(50% - 0.2px)",
                ...cornerRadiusStyle,
              }}
            >
              <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  boxShadow: `0px 1px 2px 0px inset ${themeColors.inactiveInnerShadow}`,
                  ...cornerRadiusStyle,
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className={`relative ${getResponsiveContainerRounding(isMobile)} size-full ${TRANSITIONS.fast}`}
      style={{ backgroundColor: themeColors.outerContainer }}
      ref={gridRef}
    >
      <div className="relative size-full">
        <div
          className={`box-border gap-[2px] grid grid-cols-[repeat(5,_minmax(0px,_1fr))] grid-rows-[repeat(5,_minmax(0px,_1fr))] overflow-clip p-[8px] relative size-full ${getResponsiveGridRounding(isMobile)} ${TRANSITIONS.fast}`}
          style={{ backgroundColor: themeColors.gridContainer }}
        >
          {Array.from({ length: 5 }, (_, rowIndex) =>
            Array.from({ length: 5 }, (_, colIndex) => {
              const row = rowIndex + 1;
              const col = colIndex + 1;
              if (row === 3 && col === 3) {
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`[grid-area:3_/_3] ${getCenterBlockRounding()} shrink-0 ${TRANSITIONS.fast}`}
                    style={{
                      backgroundColor: themeColors.centerBlock,
                    }}
                  />
                );
              }
              return renderBlock(row, col);
            }),
          )}
        </div>
      </div>
    </div>
  );
}