import { FC } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity, Pressable } from "react-native"
import { useNavigation } from "@react-navigation/native"
import type { NativeStackNavigationProp } from "@react-navigation/native-stack"

import { Text } from "@/components/Text"
import { colors } from "@/theme/colors"
import { INote } from "types/types"
import type { AppStackParamList } from "@/navigators/navigationTypes"

interface NoteProps {
  note: INote
  onDelete?: (noteId: number) => void
}

type NavigationProp = NativeStackNavigationProp<AppStackParamList>

export const Note: FC<NoteProps> = function Note({ note, onDelete }) {
  const navigation = useNavigation<NavigationProp>()

  const handlePress = () => {
    navigation.navigate("AddEditItem", {
      date: note.note_date_time,
      noteId: note.id,
    })
  }

  const handleDelete = () => {
    onDelete?.(note.id)
  }

  return (
    <TouchableOpacity style={$noteContainer} onPress={handlePress} activeOpacity={0.7}>
      <View style={$noteContent}>
        <Text text={note.description} style={$descriptionText} numberOfLines={2} />
        {note.alarm_on && (
          <View style={$alarmBadge}>
            <Text text="🔔" style={$alarmIcon} />
          </View>
        )}
      </View>
      {onDelete && (
        <Pressable
          style={$deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text text="✕" style={$deleteText} />
        </Pressable>
      )}
    </TouchableOpacity>
  )
}

const $noteContainer: ViewStyle = {
  padding: 16,
  marginBottom: 12,
  backgroundColor: colors.palette.neutral100,
  borderRadius: 12,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  shadowColor: colors.palette.neutral900,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 3,
  borderWidth: 1,
  borderColor: colors.palette.neutral200,
}

const $noteContent: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
}

const $descriptionText: TextStyle = {
  flex: 1,
  fontSize: 16,
  lineHeight: 22,
  color: colors.palette.neutral800,
}

const $alarmBadge: ViewStyle = {
  backgroundColor: colors.palette.accent100,
  borderRadius: 12,
  paddingHorizontal: 8,
  paddingVertical: 4,
  marginLeft: 8,
}

const $alarmIcon: TextStyle = {
  fontSize: 14,
}

const $deleteButton: ViewStyle = {
  marginLeft: 12,
  padding: 4,
  justifyContent: "center",
  alignItems: "center",
}

const $deleteText: TextStyle = {
  fontSize: 20,
  color: colors.palette.angry500,
  fontWeight: "600",
}
