/**
 * Color intention that you want to used in your theme
 * @param {JsonObject} theme Theme customization object
 */
import { useSelector } from 'react-redux';

export default function themePalette(theme) {
  const isDarkMode = useSelector((state) => state.customization.systemTheme);

  const lightTheme = {
    mode: isDarkMode,
    common: {
      black: theme.colors?.lightPaper
    },
    primary: {
      light: theme.colors?.primaryLight,
      main: theme.colors?.primaryMain,
      dark: theme.colors?.primaryDark,
      200: theme.colors?.primary200,
      800: theme.colors?.primary800
    },
    secondary: {
      light: theme.colors?.secondaryLight,
      light_icon: theme.colors?.secondaryLight_icon,
      main: theme.colors?.secondaryMain,
      dark: theme.colors?.secondaryDark,
      dark_icon_hover: theme.colors?.secondaryDark_icon_hover,
      200: theme.colors?.secondary200,
      800: theme.colors?.secondary800
    },
    error: {
      light: theme.colors?.errorLight,
      main: theme.colors?.errorMain,
      dark: theme.colors?.errorDark
    },
    orange: {
      light: theme.colors?.orangeLight,
      main: theme.colors?.orangeMain,
      dark: theme.colors?.orangeDark
    },
    warning: {
      light: theme.colors?.warningLight,
      main: theme.colors?.warningMain,
      dark: theme.colors?.warningDark
    },
    success: {
      light: theme.colors?.successLight,
      200: theme.colors?.success200,
      main: theme.colors?.successMain,
      dark: theme.colors?.successDark
    },
    grey: {
      50: theme.colors?.grey50,
      100: theme.colors?.grey100,
      500: theme.darkTextSecondary,
      600: theme.heading,
      700: theme.darkTextPrimary,
      900: theme.textDark
    },
    dark: {
      light: theme.colors?.darkTextPrimary,
      main: theme.colors?.darkLevel1,
      dark: theme.colors?.darkLevel2,
      800: theme.colors?.darkBackground,
      900: theme.colors?.darkPaper
    },
    text: {
      primary: theme.darkTextPrimary,
      secondary: theme.darkTextSecondary,
      dark: theme.textDark,
      hint: theme.colors?.grey100
    },
    background: {
      paper: theme.paper,
      default: theme.backgroundDefault
    }
  };

  const darkTheme = {
    mode: isDarkMode,
    common: {
      black: theme.colors?.darkPaper
    },
    primary: {
      light: theme.colors?.darkBackground,
      main: theme.colors?.primaryMain,
      dark: theme.colors?.darkPaper,
      200: theme.colors?.primary200,
      800: theme.colors?.primary800
    },
    secondary: {
      light: theme.colors?.secondaryDark,
      light_icon: theme.colors?.secondaryLight_icon,
      main: theme.colors?.secondaryMain,
      dark: theme.colors?.secondary800,
      dark_icon_hover: theme.colors?.secondaryDark_icon_hover,
      200: theme.colors?.secondary200,
      800: theme.colors?.secondary800
    },
    error: {
      light: theme.colors?.errorDark,
      main: theme.colors?.errorMain,
      dark: theme.colors?.error800
    },
    orange: {
      light: theme.colors?.orangeDark,
      main: theme.colors?.orangeMain,
      dark: theme.colors?.orange800
    },
    warning: {
      light: theme.colors?.warningDark,
      main: theme.colors?.warningMain,
      dark: theme.colors?.warning800
    },
    success: {
      light: theme.colors?.successLight,
      200: theme.colors?.success200,
      main: theme.colors?.successMain,
      dark: theme.colors?.successDark
    },
    grey: {
      50: theme.colors?.grey900,
      100: theme.colors?.grey800,
      500: theme.darkTextPrimary,
      600: theme.darkTextSecondary,
      700: theme.textDark,
      900: theme.textDark
    },
    dark: {
      light: theme.colors?.darkTextPrimary,
      main: theme.colors?.darkLevel1,
      dark: theme.colors?.darkLevel2,
      800: theme.colors?.darkBackground,
      900: theme.colors?.darkPaper
    },
    text: {
      primary: theme.colors?.darkTextPrimary,
      secondary: theme.colors?.darkTextSecondary,
      dark: theme.textDark,
      hint: theme.colors?.grey800
    },
    background: {
      paper: theme.colors?.darkPaper,
      default: theme.colors?.darkBackground
    }
  };

  const systemTheme = isDarkMode === 'dark' ? darkTheme : lightTheme;
  return systemTheme;
}
