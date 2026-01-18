import { FC } from "react"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"

export const CalendarScreen: FC = function CalendarScreen() {
  return (
    <Screen
      preset="fixed"
      contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center" }}
    >
      <Text text="Hello world" />
    </Screen>
  )
}
