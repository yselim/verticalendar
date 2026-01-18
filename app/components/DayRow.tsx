import { FC } from "react"
import { View, ViewStyle } from "react-native"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"

interface DayRowProps {
  day: Date
}

export const DayRow: FC<DayRowProps> = function DayRow({ day }) {
  const { themed } = useAppTheme()

  const formattedDate = `${day.getDate().toString().padStart(2, "0")}.${(day.getMonth() + 1).toString().padStart(2, "0")}.${day.getFullYear()}`

  return (
    <View style={themed($dayRow)}>
      <Text text={formattedDate} />
    </View>
  )
}

const $dayRow: ThemedStyle<ViewStyle> = ({ colors, spacing }) => ({
  width: "100%",
  height: 100,
  borderWidth: 1,
  borderColor: colors.border,
})
