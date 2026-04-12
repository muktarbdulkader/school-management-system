// actions.js
export const SET_USER = 'SET_USER';
export const SET_USER_UNIT = 'SET_USER_UNIT';
export const SIGN_IN = 'SIGN_IN';
export const MENU_OPEN = 'MENU_OPEN';
export const SET_MENU = 'SET_MENU';
export const SET_MENU_MODE = 'SET_MENU_MODE';
export const SET_MENU_TYPE = 'SET_MENU_TYPE';
export const SET_MENU_ACTIVE = 'SET_MENU_ACTIVE';
export const SET_MENU_POSITION = 'SET_MENU_POSITION';
export const SET_MENU_DENSE = 'SET_MENU_DENSE';
export const SET_MENU_SHADOW = 'SET_MENU_SHADOW';
export const SET_MENU_COLLAPSED = 'SET_MENU_COLLAPSED';
export const SET_MENU_FOOTER = 'SET_MENU_FOOTER';
export const SET_MENU_UN_COLLAPSED = 'SET_MENU_UN_COLLAPSED';
export const SET_MENU_HIDDEN = 'SET_MENU_HIDDEN';
export const SET_MENU_FLATTEN = 'SET_MENU_FLATTEN';
export const SET_MENU_NO_STATE = 'SET_MENU_NO_STATE';
export const SET_MENU_STATE = 'SET_MENU_STATE';
export const SET_MENU_SCROLL = 'SET_MENU_SCROLL';
export const SET_MENU_SCROLL_HEIGHT = 'SET_MENU_SCROLL_HEIGHT';
export const SET_SYSTEM_THEME = 'SET_SYSTEM_THEME';
export const SET_MENU_THEME = 'SET_MENU_THEME';
export const SET_MENU_COLOR = 'SET_MENU_COLOR';
export const SET_MENU_BACKGROUND = 'SET_MENU_BACKGROUND';
export const SET_BORDER_RADIUS = 'SET_BORDER_RADIUS';
export const SET_FONT_FAMILY = 'SET_FONT_FAMILY';
export const SET_FISCAL_YEARS = '@customization/SET_FISCAL_YEARS';
export const SET_SELECTED_FISCAL_YEAR = '@customization/SET_SELECTED_FISCAL_YEAR';
export const SET_WEEKLY_TASKS = 'SET_WEEKLY_TASKS';
export const SET_APPROVAL_TASKS = 'SET_APPROVAL_TASKS';
export const SET_NEW_NOTIFICATIONS = 'SET_NEW_NOTIFICATIONS';

export const setUser = (user) => ({
  type: SET_USER,
  payload: user
});

export const setUserUnit = (my_unit) => ({
  type: SET_USER_UNIT,
  payload: my_unit
});

export const setMenuOpen = (isOpen) => ({
  type: MENU_OPEN,
  payload: isOpen
});

export const setWeeklyTasks = (count) => ({
  type: SET_WEEKLY_TASKS,
  payload: count
});

export const setApprovalTasks = (count) => ({
  type: SET_APPROVAL_TASKS,
  payload: count
});

export const setNotifications = (count) => ({
  type: SET_NEW_NOTIFICATIONS,
  payload: count
});
