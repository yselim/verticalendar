import { FC, useRef, useState } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity, Pressable, Animated, PanResponder, Modal, Platform } from "react-native"
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker"

import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import { colors } from "@/theme/colors"
import { useNotesStore } from "@/stores/notesStore"
import { INote } from "types/types"

interface NoteProps {
  note: INote
  onDelete?: (noteId: number) => void
  onEdit?: (note: INote) => void
}

export const Note: FC<NoteProps> = function Note({ note, onDelete, onEdit }) {
  const translateX = useRef(new Animated.Value(0)).current
  const opacity = useRef(new Animated.Value(1)).current
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showDatePickerModal, setShowDatePickerModal] = useState(false)
  const [showTimePicker, setShowTimePicker] = useState(false)
  const [selectedTime, setSelectedTime] = useState(() => {
    const defaultTime = new Date()
    defaultTime.setHours(10, 0, 0, 0)
    return defaultTime
  })
  const { moveNoteToDate, updateNote } = useNotesStore()
  const SWIPE_DELETE_THRESHOLD = -120
  const SWIPE_MAX = -180

  const handleSendToNextDay = () => {
    // Parse the note_date and add one day using local date
    const [year, month, day] = note.note_date.split('-').map(Number)
    const currentDate = new Date(year, month - 1, day)
    currentDate.setDate(currentDate.getDate() + 1)
    
    const nextYear = currentDate.getFullYear()
    const nextMonth = String(currentDate.getMonth() + 1).padStart(2, '0')
    const nextDay = String(currentDate.getDate()).padStart(2, '0')
    const nextDayStr = `${nextYear}-${nextMonth}-${nextDay}`
    
    moveNoteToDate(note.id, nextDayStr)
    setShowSettingsModal(false)
  }

  const handleOpenDatePicker = () => {
    setShowSettingsModal(false)
    setShowDatePickerModal(true)
  }

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePickerModal(false)
    if (event.type === 'set' && date) {
      // Use local date to avoid timezone issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const newDate = `${year}-${month}-${day}`

      console.log('newDate: ', newDate)
      moveNoteToDate(note.id, newDate)
    }
  }

  const handleAlarmIconPress = () => {
    // Reset to default time for new alarm
    const defaultTime = new Date()
    defaultTime.setHours(10, 0, 0, 0)
    setSelectedTime(defaultTime)
    setShowTimePicker(true)
  }

  const handleAlarmTimePress = () => {
    // Pre-select current alarm time
    if (note.note_time) {
      const [hours, minutes] = note.note_time.split(':')
      const timeDate = new Date()
      timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
      setSelectedTime(timeDate)
    }
    setShowTimePicker(true)
  }

  const handleTimeChange = (event: DateTimePickerEvent, time?: Date) => {
    if (Platform.OS === "android") {
      setShowTimePicker(false)
    }
    if (event.type === 'set' && time) {
      const hours = time.getHours().toString().padStart(2, '0')
      const minutes = time.getMinutes().toString().padStart(2, '0')
      const timeString = `${hours}:${minutes}`
      updateNote(note.id, { note_time: timeString })
    } else if (event.type === 'dismissed' && note.note_time) {
      // Only remove alarm if user cancels while editing existing alarm
      updateNote(note.id, { note_time: null })
    }
  }

  const handlePress = () => {
    onEdit?.(note)
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
        {note.note_time ? (
          <TouchableOpacity 
            style={$timeBadge} 
            onPress={handleAlarmTimePress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text text={note.note_time} style={$timeText} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={$alarmOffButton} 
            onPress={handleAlarmIconPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon icon="bell" size={18} color={colors.palette.neutral400} />
          </TouchableOpacity>
        )}
        <Text text={note.description} style={$descriptionText} numberOfLines={2} />
        <TouchableOpacity 
          style={$settingsButton} 
          onPress={() => setShowSettingsModal(true)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Icon icon="settings" size={18} color={colors.palette.neutral500} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>

      <Modal
        visible={showSettingsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSettingsModal(false)}
      >
        <Pressable style={$modalOverlay} onPress={() => setShowSettingsModal(false)}>
          <View style={$modalContent}>
            <TouchableOpacity style={$modalButton} onPress={handleOpenDatePicker} activeOpacity={0.8}>
              <Text text="Bir tarihe gönder" style={$modalButtonText} />
            </TouchableOpacity>
            <TouchableOpacity style={$modalButton} onPress={handleSendToNextDay} activeOpacity={0.8}>
              <Text text="Ertesi güne gönder" style={$modalButtonText} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {showDatePickerModal && (
        <DateTimePicker
          value={new Date(note.note_date + 'T12:00:00')}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          display="default"
          onChange={handleTimeChange}
          minuteInterval={5}
        />
      )}
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

const $alarmOffButton: ViewStyle = {
  padding: 4,
}

const $settingsButton: ViewStyle = {
  padding: 4,
  marginLeft: 4,
}

const $modalOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
}

const $modalContent: ViewStyle = {
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: 16,
  width: "80%",
  gap: 8,
}

const $modalButton: ViewStyle = {
  backgroundColor: "#555",
  paddingHorizontal: 16,
  paddingVertical: 14,
  borderRadius: 8,
  alignItems: "center",
}

const $modalButtonText: TextStyle = {
  color: "#fff",
  fontSize: 16,
  fontWeight: "600",
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
