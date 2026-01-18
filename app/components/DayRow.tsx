import { FC } from "react"
import { View, ViewStyle } from "react-native"
import { isWeekend } from "date-fns"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface DayRowProps {
  day: Date
  isToday?: boolean
}

export const DayRow: FC<DayRowProps> = function DayRow({ day, isToday }) {
  const { themed } = useAppTheme()
  const isWeekendDay = isWeekend(day)

  const formattedDate = `${day.getDate().toString().padStart(2, "0")}.${(day.getMonth() + 1).toString().padStart(2, "0")}.${day.getFullYear()}`

  return (
    <View
      style={{
        width: "100%",
        height: 50,
        ...(isWeekendDay
          ? {
              borderBottomWidth: isToday ? 2 : 1,
              borderBottomColor: isToday ? "red" : "white",
              backgroundColor: "#e6e6e6",
            }
          : { borderBottomWidth: 1, borderBottomColor: "white", backgroundColor: "#d2cdcd" }),
        ...(isToday && {
          borderWidth: 2,
          borderColor: "red",
        }),
      }}
    >
      <Text text={formattedDate} />
    </View>
  )
}
