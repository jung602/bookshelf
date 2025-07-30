import {
  useCallback,
} from "react";
import {
  getThemeColors,
  TRANSITIONS,
  getResponsiveContainerRounding,
  getResponsiveGridRounding,
  getResponsiveGridPadding,
  getResponsiveGridGap,
  getResponsiveButtonRadius,
} from "./utils/cssUtils";
import { useResponsiveDevice } from "../../../../hooks/useResponsiveDevice";

interface MenuButtonState {
  id: string;
  label: string;
  icon?: string;
  isActive: boolean;
}

interface MenuBarProps {
  isDarkMode: boolean;
  onMenuSelect?: (menuId: string) => void;
  menuItems?: MenuButtonState[];
  selectedMenu?: string | null;
}

export default function MenuBar({
  isDarkMode,
  onMenuSelect,
  selectedMenu,
  menuItems = [
    { id: "menu1", label: "메뉴1", isActive: false },
    { id: "menu2", label: "메뉴2", isActive: false },
    { id: "menu3", label: "메뉴3", isActive: false },
    { id: "menu4", label: "메뉴4", isActive: false },
  ],
}: MenuBarProps) {
  // 반응형 디바이스 감지
  const { isMobile } = useResponsiveDevice();

  // Theme-based colors
  const themeColors = getThemeColors(isDarkMode);

  const handleMenuClick = useCallback(
    (menuId: string) => {
      if (onMenuSelect) {
        onMenuSelect(menuId);
      }
    },
    [onMenuSelect],
  );

  const renderMenuButton = (button: MenuButtonState, index: number) => {
    const isActive = button.isActive;

    return (
      <div
        key={button.id}
        className={`relative shrink-0 cursor-pointer ${TRANSITIONS.default} select-none flex items-center justify-center aspect-square`}
        onClick={() => handleMenuClick(button.id)}
      >
        {isActive ? (
          // Active state - Enhanced design
          <div className="absolute contents left-[-0.2px] top-[0.4px]">
            {/* Background with border radius */}
            <div
              className="absolute inset-0 w-full h-full opacity-80"
              style={{
                backgroundColor: themeColors.activeBackdrop,
                borderRadius: getResponsiveButtonRadius(isMobile),
              }}
            />
            <div
              className="absolute backdrop-blur-[20px] backdrop-filter size-full translate-x-[-50%] translate-y-[-50%]"
              style={{
                backgroundColor: themeColors.activeBackdrop,
                top: "calc(50% + 0.4px)",
                left: "calc(50% - 0.2px)",
                borderRadius: getResponsiveButtonRadius(isMobile),
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  boxShadow: `0px 1px 2px 1px inset ${themeColors.activeShadow}`,
                  borderRadius: getResponsiveButtonRadius(isMobile),
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
                borderRadius: getResponsiveButtonRadius(isMobile),
              }}
            >
              <div
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{
                  boxShadow: `0px 1px 2px 0px inset ${themeColors.inactiveInnerShadow}`,
                  borderRadius: getResponsiveButtonRadius(isMobile),
                }}
              />
            </div>
          </div>
        )}
        
        {/* Button content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-2 py-3">
          {button.icon && (
            <div className="mb-1">
              <img 
                src={button.icon} 
                alt={button.label}
                className="w-6 h-6"
              />
            </div>
          )}
          <span 
            className={`text-sm font-medium ${
              isActive 
                ? isDarkMode ? 'text-white' : 'text-gray-900'
                : isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}
          >
            {button.label}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className={`relative ${getResponsiveContainerRounding(isMobile)} w-full ${isMobile ? 'h-full' : 'h-auto'} ${TRANSITIONS.fast}`}
      style={{ backgroundColor: themeColors.outerContainer }}
    >
      <div className={`relative w-full ${isMobile ? 'h-full' : ''}`}>
        <div
          className={`box-border ${getResponsiveGridGap(isMobile)} grid ${isMobile ? 'grid-cols-2 grid-rows-2' : 'grid-cols-4 grid-rows-1'} overflow-clip ${getResponsiveGridPadding(isMobile)} relative w-full ${isMobile ? 'h-full' : 'h-auto'} ${getResponsiveGridRounding(isMobile)} ${TRANSITIONS.fast}`}
          style={{ backgroundColor: themeColors.gridContainer }}
        >
          {menuItems.map((button, index) => renderMenuButton(button, index))}
        </div>
      </div>
    </div>
  );
} 