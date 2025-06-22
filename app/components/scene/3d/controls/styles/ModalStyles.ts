import { WIN95_COLORS, COMMON_STYLES } from './BaseStyles'

// 모달 및 도구 관련 스타일들
export const MODAL_STYLES = {
  // 도구 섹션
  TOOLS_SECTION_CONTAINER: {
    padding: '0',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY
  },

  TOOLS_GRID_CONTAINER: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '8px',
    padding: '8px'
  },

  // 모델 추가 버튼
  MODEL_ADD_BUTTON: {
    width: '100%',
    height: '40px',
    padding: '8px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    color: WIN95_COLORS.BLACK,
    fontSize: COMMON_STYLES.FONT_SIZE,
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    fontWeight: 'normal',
    textAlign: 'left',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: 'space-between',
    gap: '8px',
    transition: COMMON_STYLES.TRANSITION_NONE,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    border: COMMON_STYLES.BORDER_SOLID
  },

  MODEL_ADD_BUTTON_HOVER: {
    backgroundColor: WIN95_COLORS.BUTTON_HIGHLIGHT,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET_RAISED
  },

  MODEL_DROPDOWN_CONTAINER: {
    position: 'absolute',
    top: '100%',
    left: '0',
    right: '0',
    zIndex: '1001',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    border: '1px solid #000000',
    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
    maxHeight: '200px',
    overflowY: 'auto'
  },

  MODEL_DROPDOWN_ITEM: {
    width: '100%',
    padding: '8px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    color: WIN95_COLORS.BLACK,
    fontSize: COMMON_STYLES.FONT_SIZE,
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    fontWeight: 'normal',
    textAlign: 'left',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    gap: '8px',
    transition: COMMON_STYLES.TRANSITION_NONE,
    border: COMMON_STYLES.BORDER_NONE,
    boxShadow: COMMON_STYLES.BOXSHADOW_NONE,
    borderBottom: '1px solid #808080'
  },

  MODEL_DROPDOWN_ITEM_HOVER: {
    backgroundColor: WIN95_COLORS.BUTTON_HIGHLIGHT,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET_RAISED
  },

  MODEL_DROPDOWN_ITEM_ICON: {
    fontSize: '16px',
    width: '20px',
    textAlign: COMMON_STYLES.ALIGN_CENTER
  },

  MODEL_DROPDOWN_ITEM_TEXT: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    flexDirection: 'column'
  },

  MODEL_DROPDOWN_ITEM_DESC: {
    fontSize: '10px',
    color: WIN95_COLORS.DARK_GRAY,
    marginTop: '2px'
  },

  // 북 크리에이터 모달
  BOOK_CREATOR_MODAL_OVERLAY: {
    position: COMMON_STYLES.POSITION_FIXED,
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    zIndex: '2000'
  },

  BOOK_CREATOR_MODAL_CONTAINER: {
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    border: '2px solid #000000',
    padding: '16px',
    minWidth: '300px',
    maxWidth: '90vw',
    boxShadow: '4px 4px 0px rgba(0, 0, 0, 0.5)'
  },

  BOOK_CREATOR_HEADER: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    justifyContent: 'space-between',
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    marginBottom: '16px',
    backgroundColor: WIN95_COLORS.DARK_BLUE,
    color: WIN95_COLORS.WHITE,
    padding: '4px 8px',
    margin: '-16px -16px 16px -16px'
  },

  BOOK_CREATOR_TITLE: {
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0',
    fontFamily: COMMON_STYLES.FONT_FAMILY
  },

  BOOK_CREATOR_CLOSE_BUTTON: {
    width: '16px',
    height: '16px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    border: '1px solid #000000',
    fontSize: '10px',
    cursor: 'pointer',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    color: WIN95_COLORS.BLACK
  },

  BOOK_CREATOR_CLOSE_BUTTON_HOVER: {
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET
  },

  BOOK_CREATOR_INPUT_GROUP: {
    marginBottom: '12px'
  },

  BOOK_CREATOR_LABEL: {
    display: 'block',
    fontSize: '12px',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    color: WIN95_COLORS.BLACK,
    marginBottom: '4px'
  },

  BOOK_CREATOR_INPUT: {
    width: '100%',
    padding: '4px',
    border: '2px inset #C0C0C0',
    backgroundColor: WIN95_COLORS.WHITE,
    fontSize: '12px',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    outline: 'none',
    boxSizing: 'border-box'
  },

  BOOK_CREATOR_UPLOAD_BUTTON: {
    width: '100%',
    padding: '8px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    border: '2px solid #000000',
    cursor: 'pointer',
    fontSize: '12px',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    color: WIN95_COLORS.BLACK,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    textAlign: COMMON_STYLES.ALIGN_CENTER
  },

  BOOK_CREATOR_UPLOAD_BUTTON_HOVER: {
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET_RAISED
  },

  BOOK_CREATOR_SLIDER_CONTAINER: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    gap: '8px'
  },

  BOOK_CREATOR_SLIDER: {
    flex: '1',
    height: '4px',
    backgroundColor: WIN95_COLORS.WHITE,
    border: '1px inset #C0C0C0',
    outline: 'none',
    cursor: 'pointer'
  },

  BOOK_CREATOR_SLIDER_VALUE: {
    fontSize: '12px',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    color: WIN95_COLORS.BLACK,
    minWidth: '24px',
    textAlign: 'right'
  },

  BOOK_CREATOR_BUTTONS: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    gap: '8px',
    justifyContent: 'flex-end',
    marginTop: '16px'
  },

  BOOK_CREATOR_CANCEL_BUTTON: {
    padding: '6px 12px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    border: '2px solid #000000',
    fontSize: '12px',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    cursor: 'pointer',
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    color: WIN95_COLORS.BLACK
  },

  BOOK_CREATOR_CANCEL_BUTTON_HOVER: {
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET_RAISED
  },

  BOOK_CREATOR_CREATE_BUTTON: {
    padding: '6px 12px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    border: '2px solid #000000',
    fontSize: '12px',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    cursor: 'pointer',
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    color: WIN95_COLORS.BLACK,
    fontWeight: 'bold'
  },

  BOOK_CREATOR_CREATE_BUTTON_HOVER: {
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET_RAISED
  },

  BOOK_CREATOR_CREATE_BUTTON_DISABLED: {
    backgroundColor: WIN95_COLORS.DARK_GRAY,
    color: WIN95_COLORS.LIGHT_GRAY,
    cursor: 'not-allowed',
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET
  },

  BOOK_CREATOR_PREVIEW_CONTAINER: {
    textAlign: COMMON_STYLES.ALIGN_CENTER,
    marginTop: '8px',
    padding: '8px',
    border: '1px inset #C0C0C0',
    backgroundColor: WIN95_COLORS.WHITE
  },

  BOOK_CREATOR_PREVIEW_IMAGE: {
    maxWidth: '100%',
    maxHeight: '120px',
    border: '1px solid #000000'
  }
} as const 