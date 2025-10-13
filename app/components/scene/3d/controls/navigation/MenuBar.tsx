import {
  useCallback,
} from "react";
import {
  getThemeColors,
  CONTROL_TOKENS,
  getResponsiveGridPadding,
  getControlContainerStyle,
  getResponsiveGridGap,
  TRANSITIONS,
} from "../utils/cssUtils";
import { useResponsiveDevice } from "../../../../../hooks/useResponsiveDevice";

interface MenuButtonState {
  id: string;
  label: string;
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  selectedMenu: _selectedMenu,
  menuItems = [
    { id: "menu1", label: "메뉴1", isActive: false },
    { id: "menu2", label: "메뉴2", isActive: false },
    { id: "menu3", label: "메뉴3", isActive: false },
    { id: "menu4", label: "메뉴4", isActive: false },
  ],
}: MenuBarProps) {
  const { isMobile } = useResponsiveDevice();
  const themeColors = getThemeColors(isDarkMode);

  const handleMenuClick = useCallback(
    (menuId: string) => {
      if (onMenuSelect) {
        onMenuSelect(menuId);
      }
    },
    [onMenuSelect],
  );

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderMenuButton = (button: MenuButtonState, _index: number) => {
    const isActive = button.isActive;

    return (
        <div
          key={button.id}
          className={`cursor-pointer ${TRANSITIONS.default} flex items-center justify-center aspect-square`}
          style={{
            backgroundColor: isActive ? themeColors.activeBackdrop : themeColors.inactiveBlock,
            borderRadius: CONTROL_TOKENS.radius.panel,
          }}
          onClick={() => handleMenuClick(button.id)}
        >
          <span 
            className="text-sm font-medium"
            style={{
              color: isDarkMode 
                ? (isActive ? '#ffffff' : '#d1d5db') 
                : (isActive ? '#111827' : '#6b7280')
            }}
          >
            {button.label}
          </span>
        </div>
    );
  };

  return (
    <div 
      className={`${isMobile ? 'w-full h-full' : ''}`}
      style={{ 
        ...getControlContainerStyle(isMobile),
        backgroundColor: themeColors.outerContainer,
        height: isMobile ? '100%' : 'auto',
      }}
    >
      <div 
        className={`
          ${getResponsiveGridPadding(isMobile)} grid h-auto ${getResponsiveGridGap(isMobile)}
          ${isMobile ? 'grid-cols-2 grid-rows-2' : 'grid-cols-4 grid-rows-1'}
        `}
      >
        {menuItems.map((button, index) => renderMenuButton(button, index))}
      </div>
    </div>
  );
} 