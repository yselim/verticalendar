import { memo, useEffect } from "react"
import { Pressable, View, ViewStyle, TextStyle } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { Text } from "@/components/Text"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { useNotesStore } from "@/stores/notesStore"
import { MONTH_NAMES, DAY_NAMES } from "@/utils/constants"
import type { INote } from "types/types"

const NO_NOTES: INote[] = []

interface DayRowProps {
  day: Date
  isToday?: boolean
  isHighlighted?: boolean
}

export const DayRow = memo(function DayRow({ day, isToday, isHighlighted }: DayRowProps) {
  const isWeekendDay = day.getDay() === 0 || day.getDay() === 6
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>()

  // Use local date to avoid timezone issues
  const year = day.getFullYear()
  const month = String(day.getMonth() + 1).padStart(2, '0')
  const dayOfMonthStr = String(day.getDate()).padStart(2, '0')
  const dateKey = `${year}-${month}-${dayOfMonthStr}`

  // Subscribe to this day's notes only: selecting the whole store would re-render every
  // visible row whenever any day changes (e.g. each row's own fetch on mount).
  const dayNotes = useNotesStore((state) => state.notes[dateKey]) ?? NO_NOTES
  const fetchNotes = useNotesStore((state) => state.fetchNotes)

  useEffect(() => {
    fetchNotes(day)
  }, [day, fetchNotes])

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
          borderBottomWidth: isToday || isHighlighted ? 2 : 1,
          borderBottomColor: isToday ? "red" : isHighlighted ? "blue" : "white",
          ...(isWeekendDay
            ? {
                backgroundColor: "#e7e5e5",
              }
            : {
                backgroundColor: "#d2cdcd",
              }),
          ...(isToday && {
            borderTopWidth: 2,
            borderBottomWidth: 2,
            borderTopColor: "red",
            borderBottomColor: "red",
          }),
          ...(!isToday &&
            isHighlighted && {
              borderWidth: 2,
              borderColor: "blue",
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
              {note.note_time && (
                <View style={$timeBadge}>
                  <Text text={note.note_time} style={$timeText} />
                </View>
              )}
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
})

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
  gap: 1,
  paddingLeft: 5,
}

const $noteRow: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  gap: 4,
}

const $timeBadge: ViewStyle = {
  backgroundColor: "#ffd90086",
  borderRadius: 4,
  paddingHorizontal: 4,
  paddingVertical: 0,
}

const $timeText: TextStyle = {
  fontSize: 10,
  fontWeight: "600",
  color: "#333",
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
