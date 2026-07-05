import { FC, useEffect, useState } from "react"
import { Alert, TextInput, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import { addTabNoteToDB, getTabNoteById, updateTabNoteInDB } from "@/utils/database"

type NoteEditorScreenProps = NativeStackScreenProps<AppStackParamList, "NoteEditor">

export const NoteEditorScreen: FC<NoteEditorScreenProps> = function NoteEditorScreen({ route, navigation }) {
  const { tabId, noteId } = route.params
  const [content, setContent] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = noteId !== undefined

  const {
    theme: { colors },
  } = useAppTheme()

  useEffect(() => {
    if (!isEditing || !noteId) return

    const existing = getTabNoteById(noteId) as { content?: string } | null
    if (existing?.content) {
      setContent(existing.content)
    }
  }, [isEditing, noteId])

  const handleSave = () => {
    const trimmed = content.trim()

    if (!trimmed) {
      Alert.alert("Empty note", "Please write something before saving.")
      return
    }

    setIsSaving(true)
    try {
      if (isEditing && noteId) {
        updateTabNoteInDB(noteId, trimmed)
      } else {
        addTabNoteToDB(tabId, trimmed)
      }
      navigation.goBack()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <TextInput
        style={[
          $editor,
          {
            color: colors.text,
            backgroundColor: colors.background,
          },
        ]}
        value={content}
        onChangeText={setContent}
        multiline
        textAlignVertical="top"
        placeholder="Not yazmaya başla..."
        placeholderTextColor={colors.textDim}
      />

      <View style={$floatingActions}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={8}
          style={[$actionButton, { backgroundColor: colors.palette.neutral300 }]}
        >
          <Text text="İptal" style={[$actionText, { color: colors.text }]} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          hitSlop={8}
          style={[$actionButton, $saveButton, isSaving && $disabledButton]}
        >
          <Text text="Kaydet" style={[$actionText, $saveButtonText]} />
        </TouchableOpacity>
      </View>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  paddingHorizontal: 16,
  paddingBottom: 96,
}

const $floatingActions: ViewStyle = {
  position: "absolute",
  left: 16,
  right: 16,
  bottom: 16,
  flexDirection: "row",
  gap: 12,
}

const $actionButton: ViewStyle = {
  flex: 1,
  minHeight: 50,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
}

const $saveButton: ViewStyle = {
  backgroundColor: "#22C55E",
}

const $disabledButton: ViewStyle = {
  opacity: 0.65,
}

const $actionText: TextStyle = {
  fontSize: 16,
  fontWeight: "600",
}

const $saveButtonText: TextStyle = {
  color: "#FFFFFF",
}

const $editor: TextStyle = {
  flex: 1,
  fontSize: 16,
  lineHeight: 24,
  borderRadius: 12,
  padding: 12,
}
