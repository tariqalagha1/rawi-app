import { Platform } from "react-native";

const tintColor = "#00C8FF";

export const Colors = {
  light: {
    text: "#E2F0FF",
    buttonText: "#080C14",
    tabIconDefault: "#8AA0C0",
    tabIconSelected: tintColor,
    link: "#00C8FF",
    backgroundRoot: "#080C14",
    backgroundDefault: "#0D1526",
    backgroundSecondary: "#1A2D4D",
    backgroundTertiary: "#223A5E",
  },
  dark: {
    text: "#E2F0FF",
    buttonText: "#080C14",
    tabIconDefault: "#8AA0C0",
    tabIconSelected: tintColor,
    link: "#00C8FF",
    backgroundRoot: "#080C14",
    backgroundDefault: "#0D1526",
    backgroundSecondary: "#1A2D4D",
    backgroundTertiary: "#223A5E",
  },
};

export const RawiColors = {
  primary: "#00C8FF",
  secondary: "#1A2D4D",
  background: "#080C14",
  surface: "#0D1526",
  userBubble: "#1A2D4D",
  aiBubble: "#0D1526",
  systemBubble: "#1A2D4D",
  textPrimary: "#E2F0FF",
  textSecondary: "#8AA0C0",
  textDisabled: "#223A5E",
  success: "#00C8FF",
  error: "#f44336",
  warning: "#FFC107",
  primaryGlow: "rgba(0, 200, 255, 0.12)",
  headerBg: "rgba(13, 21, 38, 0.95)",
  headerBorder: "rgba(0, 200, 255, 0.2)",
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  "2xl": 40,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700" as const,
  },
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700" as const,
  },
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400" as const,
  },
  link: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
