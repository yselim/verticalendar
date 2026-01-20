import { FC, useState, useEffect } from "react"
import { View, ViewStyle, TextStyle } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
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
      const d = new Date(date)
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
      const d = new Date(date)
      const noteDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

      if (isEditing) {
        updateNote(noteId, { 
          description: itemText.trim(),
        })
      } else {
        addNote(noteDate, null, itemText.trim(), 0)
      }
      navigation.goBack()
    }
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["bottom"]} contentContainerStyle={$container}>
      <View style={$handleContainer}>
        <View style={$handle} />
      </View>
      <View style={$content}>
        <View style={$titleContainer}>
          <Text text={`${dayNumber} ${monthName} ${year} ${dayName}`} style={$dateText} />
        </View>
        <TextField
          value={itemText}
          onChangeText={setItemText}
          placeholder="Enter item description"
          style={$textField}
          autoFocus
        />
      </View>
      <View style={$buttonContainer}>
        <Button 
          text="Cancel" 
          onPress={() => navigation.goBack()} 
          style={$cancelButton} 
          preset="default"
          LeftAccessory={(props) => <Icon icon="x" size={18} style={{marginRight: 8}} />}
        />
        <Button 
          text="Save" 
          onPress={handleSave} 
          style={$saveButton}
          LeftAccessory={(props) => <Icon icon="check" size={18} style={{marginRight: 8}} />}
        />
      </View>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  padding: 16,
  justifyContent: "space-between",
}

const $handleContainer: ViewStyle = {
  alignItems: "center",
  paddingVertical: 8,
}

const $handle: ViewStyle = {
  width: 40,
  height: 4,
  backgroundColor: "#ccc",
  borderRadius: 2,
}

const $content: ViewStyle = {
  flex: 1,
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

const $buttonContainer: ViewStyle = {
  flexDirection: "row",
  gap: 32,
}

const $cancelButton: ViewStyle = {
  flex: 1,
}

const $saveButton: ViewStyle = {
  flex: 1,
}
