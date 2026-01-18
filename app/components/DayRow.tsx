import { FC, useEffect } from "react"
import { Pressable, View, ViewStyle, TextStyle } from "react-native"
import { isWeekend } from "date-fns"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { useNotesStore } from "@/stores/notesStore"
import { MONTH_NAMES, DAY_NAMES } from "@/utils/constants"

interface DayRowProps {
  day: Date
  isToday?: boolean
}

export const DayRow: FC<DayRowProps> = function DayRow({ day, isToday }) {
  const { themed } = useAppTheme()
  const isWeekendDay = isWeekend(day)
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const { notes, fetchNotes } = useNotesStore()

  const dateKey = day.toISOString().split("T")[0]
  const dayNotes = notes[dateKey] || []

  useEffect(() => {
    fetchNotes(day)
  }, [day])

  const dayOfMonth = day.getDate()
  const monthName = MONTH_NAMES[day.getMonth()]
  const dayName = DAY_NAMES[day.getDay()]

  const handlePress = () => {
    navigation.navigate("Day", { date: day.toISOString() })
  }

  return (
    <Pressable onPress={handlePress}>
      <View
        style={{
          width: "100%",
          minHeight: 50,
          flexDirection: "row",
          ...(isWeekendDay
            ? {
                borderBottomWidth: isToday ? 2 : 1,
                borderBottomColor: isToday ? "red" : "white",
                backgroundColor: "#e7e5e5",
              }
            : { borderBottomWidth: 1, borderBottomColor: "white", backgroundColor: "#d2cdcd" }),
          ...(isToday && {
            borderWidth: 2,
            borderColor: "red",
          }),
        }}
      >
        <View style={$column1}>
          <Text text={dayOfMonth.toString()} style={$dayNumber} />
          <Text text={monthName} style={$monthName} />
        </View>

        {/* Column 2: Day Name */}
        <View style={$column2}>
          <Text text={dayName} style={$dayName} />
        </View>

        {/* Column 3: Note Descriptions */}
        <View style={$column3}>
          {dayNotes.map((note) => (
            <View key={note.id} style={$noteRow}>
              {/* <Text text="•" style={$noteDot} /> */}
              <Text
                text={note.description}
                style={$noteDescription}
                numberOfLines={1}
                ellipsizeMode="tail"
              />
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  )
}

const $column1: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  borderRightWidth: 1,
  borderRightColor: "#c6c6c6",
  width: 35,
}

const $column2: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  borderRightWidth: 1,
  borderRightColor: "#c6c6c6",
  width: 35,
}

const $column3: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  flexDirection: "column",
  gap: 4,
  paddingLeft: 5,
}

const $noteRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
}

const $noteDot: TextStyle = {
  fontSize: 12,
  color: "#666",
}

const $dayNumber: TextStyle = {
  fontSize: 16,
  fontWeight: "black",
  marginBottom: -3,
}

const $monthName: TextStyle = {
  fontSize: 11,
  marginTop: -3,
}

const $dayName: TextStyle = {
  fontSize: 12,
  fontWeight: "600",
}

const $noteDescription: TextStyle = {
  fontSize: 12,
}
