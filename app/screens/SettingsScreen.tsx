import { FC } from "react"
import { View, ViewStyle, TextStyle } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"

export const SettingsScreen: FC = function SettingsScreen() {
  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <View style={$content}>
        <Text text="Ayarlar" preset="heading" style={$title} />
      </View>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
}

const $content: ViewStyle = {
  flex: 1,
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 16,
}

const $title: TextStyle = {
  fontSize: 24,
}
