import { ErrorInfo } from "react"
import { ScrollView, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"

export interface ErrorDetailsProps {
  error: Error
  errorInfo: ErrorInfo | null
  onReset(): void
}

/**
 * Shown by ErrorBoundary when a render error is caught.
 */
export function ErrorDetails(props: ErrorDetailsProps) {
  return (
    <Screen safeAreaEdges={["top", "bottom"]} contentContainerStyle={$contentContainer}>
      <View style={$topSection}>
        <Text style={$heading} preset="subheading" text="Bir hata oluştu" />
        <Text text="Uygulamayı sıfırlayıp tekrar deneyebilirsin." />
      </View>

      <ScrollView style={$errorSection} contentContainerStyle={$errorSectionContentContainer}>
        <Text style={$errorContent} weight="bold" text={`${props.error}`.trim()} />
        <Text
          selectable
          style={$errorBacktrace}
          text={`${props.errorInfo?.componentStack ?? ""}`.trim()}
        />
      </ScrollView>

      <TouchableOpacity style={$resetButton} onPress={props.onReset} activeOpacity={0.85}>
        <Text text="Sıfırla" weight="medium" style={$resetText} />
      </TouchableOpacity>
    </Screen>
  )
}

const $contentContainer: ViewStyle = {
  alignItems: "center",
  paddingHorizontal: 24,
  paddingTop: 32,
  paddingBottom: 16,
}

const $topSection: ViewStyle = {
  alignItems: "center",
  gap: 8,
}

const $heading: TextStyle = {
  color: colors.error,
}

const $errorSection: ViewStyle = {
  flex: 1,
  alignSelf: "stretch",
  backgroundColor: colors.separator,
  marginVertical: 16,
  borderRadius: 6,
}

const $errorSectionContentContainer: ViewStyle = {
  padding: 16,
}

const $errorContent: TextStyle = {
  color: colors.error,
}

const $errorBacktrace: TextStyle = {
  marginTop: 16,
  color: colors.textDim,
}

const $resetButton: ViewStyle = {
  backgroundColor: colors.error,
  paddingHorizontal: 48,
  paddingVertical: 14,
  borderRadius: 8,
}

const $resetText: TextStyle = {
  color: colors.palette.neutral100,
}
