import { FC } from "react"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { DayRow } from "@/components/DayRow"

export const CalendarScreen: FC = function CalendarScreen() {
  return (
    <Screen
      preset="fixed"
      contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center" }}
    >
      <DayRow day={new Date("2026-01-17")} />
    </Screen>
  )
}
