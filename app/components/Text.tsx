import { ReactNode, Ref } from "react"
// eslint-disable-next-line no-restricted-imports
import { StyleProp, Text as RNText, TextProps as RNTextProps, TextStyle } from "react-native"

import { colors } from "@/theme/colors"
import { typography } from "@/theme/typography"

type Sizes = keyof typeof $sizeStyles
type Weights = keyof typeof typography.primary
type Presets = "default" | "bold" | "heading" | "subheading"

export interface TextProps extends RNTextProps {
  /**
   * The text to display if not using nested components.
   */
  text?: string
  /**
   * An optional style override useful for padding & margin.
   */
  style?: StyleProp<TextStyle>
  /**
   * One of the different types of text presets.
   */
  preset?: Presets
  /**
   * Text weight modifier.
   */
  weight?: Weights
  /**
   * Text size modifier.
   */
  size?: Sizes
  /**
   * Children components.
   */
  children?: ReactNode
  ref?: Ref<RNText>
}

/**
 * Thin wrapper over React Native's Text that applies the app font and size/weight presets.
 */
export function Text(props: TextProps) {
  const { weight, size, text, children, style: $styleOverride, preset = "default", ...rest } = props

  return (
    <RNText
      {...rest}
      style={[
        $presets[preset],
        weight && $fontWeightStyles[weight],
        size && $sizeStyles[size],
        $styleOverride,
      ]}
    >
      {text ?? children}
    </RNText>
  )
}

const $sizeStyles = {
  xxl: { fontSize: 36, lineHeight: 44 } satisfies TextStyle,
  xl: { fontSize: 24, lineHeight: 34 } satisfies TextStyle,
  lg: { fontSize: 20, lineHeight: 32 } satisfies TextStyle,
  md: { fontSize: 18, lineHeight: 26 } satisfies TextStyle,
  sm: { fontSize: 16, lineHeight: 24 } satisfies TextStyle,
  xs: { fontSize: 14, lineHeight: 21 } satisfies TextStyle,
  xxs: { fontSize: 12, lineHeight: 18 } satisfies TextStyle,
}

const $fontWeightStyles: Record<Weights, TextStyle> = {
  normal: { fontFamily: typography.primary.normal },
  medium: { fontFamily: typography.primary.medium },
  bold: { fontFamily: typography.primary.bold },
}

const $baseStyle: TextStyle = {
  ...$sizeStyles.sm,
  ...$fontWeightStyles.normal,
  color: colors.text,
}

const $presets: Record<Presets, TextStyle> = {
  default: $baseStyle,
  bold: { ...$baseStyle, ...$fontWeightStyles.bold },
  heading: { ...$baseStyle, ...$sizeStyles.xxl, ...$fontWeightStyles.bold },
  subheading: { ...$baseStyle, ...$sizeStyles.lg, ...$fontWeightStyles.medium },
}
