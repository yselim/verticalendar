import { FC, useEffect } from "react"
import { ViewStyle, ScrollView } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Button } from "@/components/Button"
import { Note } from "@/components/Note"
import { useNotesStore } from "@/stores/notesStore"
import type { AppStackParamList } from "@/navigators/navigationTypes"

type DayScreenProps = NativeStackScreenProps<AppStackParamList, "Day">

export const DayScreen: FC<DayScreenProps> = function DayScreen({ route, navigation }) {
  const { date } = route.params
  const { notes, fetchNotes } = useNotesStore()

  const dateKey = new Date(date).toISOString().split('T')[0]
  const dayNotes = notes[dateKey] || []

  useEffect(() => {
    fetchNotes(new Date(date))
  }, [date])

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const handleAddPress = () => {
    navigation.navigate("AddEditItem", { date })
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <Text text={formattedDate} preset="heading" />
      <ScrollView style={$notesContainer}>
        {dayNotes.map((note) => (
          <Note key={note.id} note={note} />
        ))}
      </ScrollView>
      <Button text="Add" onPress={handleAddPress} style={$button} />
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  padding: 16,
}

const $notesContainer: ViewStyle = {
  flex: 1,
  marginTop: 16,
}

const $button: ViewStyle = {
  marginTop: 16,
}
