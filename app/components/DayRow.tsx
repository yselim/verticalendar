import { FC, useEffect } from "react"
import { Pressable, View, ViewStyle } from "react-native"
import { isWeekend } from "date-fns"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { Text } from "@/components/Text"
import { useAppTheme } from "@/theme/context"
import type { ThemedStyle } from "@/theme/types"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { useNotesStore } from "@/stores/notesStore"

interface DayRowProps {
  day: Date
  isToday?: boolean
}

export const DayRow: FC<DayRowProps> = function DayRow({ day, isToday }) {
  const { themed } = useAppTheme()
  const isWeekendDay = isWeekend(day)
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()
  const { notes, fetchNotes } = useNotesStore()

  const dateKey = day.toISOString().split('T')[0]
  const dayNotes = notes[dateKey] || []

  useEffect(() => {
    fetchNotes(day)
  }, [day])

  const formattedDate = `${day.getDate().toString().padStart(2, "0")}.${(day.getMonth() + 1).toString().padStart(2, "0")}.${day.getFullYear()}`

  const handlePress = () => {
    navigation.navigate("Day", { date: day.toISOString() })
  }

  return (
    <Pressable onPress={handlePress}>
      <View
        style={{
          width: "100%",
          minHeight: 50,
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
          padding: 8,
        }}
      >
        <Text text={formattedDate} />
        {dayNotes.map((note) => (
          <Text key={note.id} text={note.description} style={{ fontSize: 12, marginTop: 4 }} />
        ))}
      </View>
    </Pressable>
  )
}
