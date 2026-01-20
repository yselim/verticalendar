import { FC, useState, useEffect, useRef } from "react"
import {
  View,
  ViewStyle,
  TextStyle,
  Modal,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native"

import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Button } from "@/components/Button"
import { Icon } from "@/components/Icon"
import { useNotesStore } from "@/stores/notesStore"
import { DAY_NAMES_FULL, MONTH_NAMES_FULL } from "@/utils/constants"
import { INote } from "types/types"

interface AddEditNoteModalProps {
  visible: boolean
  onClose: () => void
  date: string
  note?: INote | null
}

export const AddEditNoteModal: FC<AddEditNoteModalProps> = function AddEditNoteModal({
  visible,
  onClose,
  date,
  note,
}) {
  const [itemText, setItemText] = useState("")
  const { addNote, updateNote } = useNotesStore()
  const inputRef = useRef<TextInput>(null)

  const isEditing = note !== null && note !== undefined

  // Reset or populate text when modal opens
  useEffect(() => {
    if (visible) {
      if (isEditing && note) {
        setItemText(note.description)
      } else {
        setItemText("")
      }
      // Focus the input after a short delay to ensure modal is fully rendered
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    }
  }, [visible, note])

  const currentDate = new Date(date)
  const dayNumber = currentDate.getDate()
  const monthName = MONTH_NAMES_FULL[currentDate.getMonth()]
  const year = currentDate.getFullYear()
  const dayName = DAY_NAMES_FULL[currentDate.getDay()]

  const handleSave = () => {
    if (itemText.trim()) {
      const d = new Date(date)
      const noteDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`

      if (isEditing && note) {
        updateNote(note.id, {
          description: itemText.trim(),
        })
      } else {
        addNote(noteDate, null, itemText.trim(), 0)
      }
      onClose()
    }
  }

  const handleCancel = () => {
    setItemText("")
    onClose()
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={handleCancel}>
      <KeyboardAvoidingView
        style={$modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Pressable style={$backdrop} onPress={handleCancel} />
        <View style={$modalContent}>
          <View style={$handleContainer}>
            <View style={$handle} />
          </View>

          <TextField
            ref={inputRef}
            value={itemText}
            onChangeText={setItemText}
            placeholder="Enter item description"
            style={$textField}
          />
          <View style={$buttonContainer}>
            <Button
              text="Cancel"
              onPress={handleCancel}
              style={$cancelButton}
              preset="default"
              LeftAccessory={(props) => <Icon icon="x" size={18} style={{ marginRight: 8 }} />}
            />
            <Button
              text="Save"
              onPress={handleSave}
              style={$saveButton}
              LeftAccessory={(props) => <Icon icon="check" size={18} style={{ marginRight: 8 }} />}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const $modalContainer: ViewStyle = {
  flex: 1,
  justifyContent: "flex-end",
}

const $backdrop: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
}

const $modalContent: ViewStyle = {
  backgroundColor: "#fff",
  borderTopLeftRadius: 20,
  borderTopRightRadius: 20,
  padding: 16,
  paddingBottom: 32,
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

const $titleContainer: ViewStyle = {
  alignItems: "center",
  marginBottom: 12,
}

const $dateText: TextStyle = {
  fontSize: 16,
}

const $textField: ViewStyle = {
  marginTop: 8,
}

const $buttonContainer: ViewStyle = {
  flexDirection: "row",
  gap: 32,
  marginTop: 16,
}

const $cancelButton: ViewStyle = {
  flex: 1,
}

const $saveButton: ViewStyle = {
  flex: 1,
}
