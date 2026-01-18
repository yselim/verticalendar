import { FC, useState, useEffect } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Button } from "@/components/Button"
import { useNotesStore } from "@/stores/notesStore"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { DAY_NAMES_FULL, MONTH_NAMES_FULL } from "@/utils/constants"

type AddEditItemScreenProps = NativeStackScreenProps<AppStackParamList, "AddEditItem">

export const AddEditItemScreen: FC<AddEditItemScreenProps> = function AddEditItemScreen({ route, navigation }) {
  const { date, noteId } = route.params
  const [itemText, setItemText] = useState("")
  const { notes, addNote, updateNote } = useNotesStore()

  const isEditing = noteId !== undefined

  // Find existing note if editing
  useEffect(() => {
    if (isEditing) {
      const dateKey = new Date(date).toISOString().split('T')[0]
      const dayNotes = notes[dateKey] || []
      const existingNote = dayNotes.find(note => note.id === noteId)
      if (existingNote) {
        setItemText(existingNote.description)
      }
    }
  }, [noteId, date, notes])

  const currentDate = new Date(date)
  const dayNumber = currentDate.getDate()
  const monthName = MONTH_NAMES_FULL[currentDate.getMonth()]
  const year = currentDate.getFullYear()
  const dayName = DAY_NAMES_FULL[currentDate.getDay()]

  const handleSave = () => {
    if (itemText.trim()) {
      if (isEditing) {
        updateNote(noteId, { description: itemText.trim() })
      } else {
        const dateTime = new Date(date)
        dateTime.setHours(0, 0, 0, 0)
        const noteDateTime = dateTime.toISOString()
        addNote(noteDateTime, itemText.trim(), 0, false)
      }
      navigation.goBack()
    }
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <View style={$titleContainer}>
        <Text text="Add/Edit Item" preset="heading" style={$titleText} />
        <Text text={`${dayNumber} ${monthName} ${year}`} style={$dateText} />
        <Text text={dayName} style={$dayNameText} />
      </View>
      <TextField
        value={itemText}
        onChangeText={setItemText}
        placeholder="Enter item description"
        style={$textField}
        autoFocus
      />
      <Button text="Save" onPress={handleSave} style={$button} />
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  padding: 16,
  justifyContent: "flex-start",
}

const $titleContainer: ViewStyle = {
  alignItems: "center",
  marginBottom: 12,
}

const $titleText: TextStyle = {
  fontSize: 18,
  marginBottom: 6,
}

const $dateText: TextStyle = {
  fontSize: 16,
}

const $dayNameText: TextStyle = {
  fontSize: 14,
  color: "#666",
}

const $textField: ViewStyle = {
  marginTop: 8,
}

const $button: ViewStyle = {
  marginTop: 16,
}
