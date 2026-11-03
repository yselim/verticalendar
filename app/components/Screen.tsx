import { ReactNode } from "react"
import { KeyboardAvoidingView, Platform, StyleProp, View, ViewStyle } from "react-native"
import { Edge, useSafeAreaInsets } from "react-native-safe-area-context"

import { colors } from "@/theme/colors"

interface ScreenProps {
  children?: ReactNode
  /**
   * Style for the inner content container useful for padding & margin.
   */
  contentContainerStyle?: StyleProp<ViewStyle>
  /**
   * Edges that get safe-area padding.
   */
  safeAreaEdges?: Edge[]
  /**
   * Background color. Defaults to the theme background.
   */
  backgroundColor?: string
}

/**
 * Root container for every screen: background color, safe-area padding and keyboard avoidance.
 * The app is light-only; system bar styling is set natively (see plugins/withAndroidSystemBars.js).
 */
export function Screen({
  children,
  contentContainerStyle,
  safeAreaEdges = [],
  backgroundColor = colors.background,
}: ScreenProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        $container,
        {
          backgroundColor,
          paddingTop: safeAreaEdges.includes("top") ? insets.top : 0,
          paddingBottom: safeAreaEdges.includes("bottom") ? insets.bottom : 0,
          paddingLeft: safeAreaEdges.includes("left") ? insets.left : 0,
          paddingRight: safeAreaEdges.includes("right") ? insets.right : 0,
        },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={$container}
      >
        <View style={[$container, contentContainerStyle]}>{children}</View>
      </KeyboardAvoidingView>
    </View>
  )
}

const $container: ViewStyle = {
  flex: 1,
}
