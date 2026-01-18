import { FC } from "react"
import { View, ViewStyle } from "react-native"

interface DayRowProps {
  day: Date
  isToday: boolean
}

export const DayRow: FC<DayRowProps> = function DayRow({ day, isToday }) {
  const containerStyle = [
    $dayRow,
    isToday ? $todayBorder : $defaultBorder,
  ]

  return (
    <View style={containerStyle}>
      {/* ...existing code... */}
    </View>
  )
}

const $dayRow: ViewStyle = {
  // ...existing styles...
}

const $defaultBorder: ViewStyle = {
  borderBottomWidth: 1,
  borderBottomColor: "#e0e0e0",
}

const $todayBorder: ViewStyle = {
  borderWidth: 2,
  borderColor: "red",
}