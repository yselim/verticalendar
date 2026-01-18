import { FC, useRef } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity, Pressable, Animated, PanResponder } from "react-native"
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
  const translateX = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current
  const SWIPE_DELETE_THRESHOLD = -120
  const SWIPE_MAX = -180

  const handlePress = () => {
    navigation.navigate("AddEditItem", {
      date: note.note_date,
      noteId: note.id,
    })
  }

  const handleDelete = () => {
    // Animate out before deleting
    Animated.parallel([
      Animated.timing(translateX, {
        toValue: -500,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDelete?.(note.id)
    })
  }

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start()
  }

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
      },
      onPanResponderGrant: () => {
        translateX.stopAnimation()
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, SWIPE_MAX))
        } else {
          translateX.setValue(0)
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // If swiped more than 120px to the left, delete
        if (gestureState.dx < SWIPE_DELETE_THRESHOLD) {
          handleDelete()
        } else {
          // Otherwise, spring back to original position
          resetPosition()
        }
      },
      onPanResponderTerminate: () => {
        resetPosition()
      },
    }),
  ).current

  return (
    <Animated.View
      style={[
        { transform: [{ translateX }], opacity },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity style={$noteContainer} onPress={handlePress} activeOpacity={0.7}>
      <View style={$noteContent}>
        {note.note_time && (
          <View style={$timeBadge}>
            <Text text={note.note_time} style={$timeText} />
          </View>
        )}
        <Text text={note.description} style={$descriptionText} numberOfLines={2} />
      </View>
    </TouchableOpacity>
    </Animated.View>
  )
}

const $noteContainer: ViewStyle = {
  padding: 4,
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
  minHeight: 48,
}

const $noteContent: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
}

const $descriptionText: TextStyle = {
  flex: 1,
  fontSize: 14,
  lineHeight: 22,
  color: colors.palette.neutral800,
}

const $timeBadge: ViewStyle = {
  backgroundColor: "#f6d61e7e",
  borderRadius: 6,
  paddingHorizontal: 6,
  paddingVertical: 4,
}

const $timeText: TextStyle = {
  fontSize: 14,
  fontWeight: "600",
  color: colors.palette.neutral800,
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
