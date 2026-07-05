import { FC, useEffect, useRef, useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"

import { Text } from "@/components/Text"
import { useNotesStore } from "@/stores/notesStore"
import { useAppTheme } from "@/theme/context"
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
  const {
    theme: { colors },
  } = useAppTheme()

  const isEditing = note !== null && note !== undefined

  useEffect(() => {
    if (visible) {
      setItemText(isEditing && note ? note.description : "")
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [visible, note])

  const currentDate = new Date(date)
  const dayNumber = currentDate.getDate()
  const monthName = MONTH_NAMES_FULL[currentDate.getMonth()]
  const year = currentDate.getFullYear()
  const dayName = DAY_NAMES_FULL[currentDate.getDay()]

  const handleSave = () => {
    if (!itemText.trim()) return
    const d = new Date(date)
    const noteDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    if (isEditing && note) {
      updateNote(note.id, { description: itemText.trim() })
    } else {
      addNote(noteDate, null, itemText.trim())
    }
    onClose()
  }

  const handleCancel = () => {
    setItemText("")
    onClose()
  }

  if (!visible) return null

  return (
    <View style={$overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        keyboardVerticalOffset={0}
      >
        <View style={$sheet}>
          <View style={$handleContainer}>
            <View style={$handle} />
          </View>

          <Text
            text={`${dayNumber} ${monthName} ${year} ${dayName}`}
            style={$dateText}
          />

          <TextInput
            ref={inputRef}
            value={itemText}
            onChangeText={setItemText}
            placeholder=""
            placeholderTextColor={colors.textDim}
            style={[$input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
            autoFocus
            multiline={false}
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />

          <View style={$buttonsRow}>
            <TouchableOpacity style={[$btn, $cancelBtn]} onPress={handleCancel} activeOpacity={0.85}>
              <Text text="İptal" style={$cancelText} />
            </TouchableOpacity>
            <TouchableOpacity style={[$btn, $saveBtn]} onPress={handleSave} activeOpacity={0.85}>
              <Text text="Kaydet" style={$saveText} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const $overlay: ViewStyle = {
  ...StyleSheet.absoluteFill,
  zIndex: 1000,
  justifyContent: "flex-end",
  backgroundColor: "rgba(0, 0, 0, 0.35)",
}

const $sheet: ViewStyle = {
  backgroundColor: "#fff",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 24,
}

const $handleContainer: ViewStyle = {
  alignItems: "center",
  marginBottom: 12,
}

const $handle: ViewStyle = {
  width: 40,
  height: 4,
  backgroundColor: "#ccc",
  borderRadius: 2,
}

const $dateText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
  color: "#222",
  marginBottom: 12,
}

const $input: TextStyle = {
  minHeight: 44,
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 12,
  marginBottom: 12,
  fontSize: 16,
}

const $buttonsRow: ViewStyle = {
  flexDirection: "row",
  gap: 12,
}

const $btn: ViewStyle = {
  flex: 1,
  minHeight: 46,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
}

const $cancelBtn: ViewStyle = {
  backgroundColor: "#E5E7EB",
}

const $saveBtn: ViewStyle = {
  backgroundColor: "#22C55E",
}

const $cancelText: TextStyle = {
  fontSize: 15,
  fontWeight: "600",
}

const $saveText: TextStyle = {
  color: "#fff",
  fontSize: 15,
  fontWeight: "600",
}
