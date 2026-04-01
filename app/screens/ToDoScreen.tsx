import { FC } from "react"
import { View, ViewStyle, TouchableOpacity, TextStyle } from "react-native"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"

export const ToDoScreen: FC = function ToDoScreen() {
  const {
    theme: { colors },
  } = useAppTheme()

  return (
    <Screen preset="fixed" contentContainerStyle={$container}>
      <View style={$content}>
        <Text text="ToDo" size="xxl" weight="bold" />
      </View>
      <TouchableOpacity
        style={[$fab, { backgroundColor: colors.tint }]}
        activeOpacity={0.8}
        onPress={() => {
          // TODO: handle add
        }}
      >
        <Text text="+" style={$fabText} />
      </TouchableOpacity>
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

const $fab: ViewStyle = {
  position: "absolute",
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: 28,
  alignItems: "center",
  justifyContent: "center",
  elevation: 6,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
}

const $fabText: TextStyle = {
  color: "#fff",
  fontSize: 32,
  lineHeight: 34,
  fontWeight: "bold",
}
