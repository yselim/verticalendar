import { FC } from "react"
import { View, ViewStyle } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"

export const NotesScreen: FC = function NotesScreen() {
  return (
    <Screen preset="fixed" contentContainerStyle={$container}>
      <View style={$content}>
        <Text text="Notlar" size="xxl" weight="bold" />
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
}
