import { FC, useState, useEffect } from "react"
import { View, ViewStyle, TextStyle, Platform, Switch } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import DateTimePicker from "@react-native-community/datetimepicker"

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
  const [selectedTime, setSelectedTime] = useState(() => {
    const defaultTime = new Date()
    defaultTime.setHours(10, 0, 0, 0)
    return defaultTime
  })
  const [alarmOn, setAlarmOn] = useState(false)
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
        if (existingNote.note_time) {
          setAlarmOn(true)
          const [hours, minutes] = existingNote.note_time.split(':')
          const timeDate = new Date()
          timeDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0)
          setSelectedTime(timeDate)
        }
      }
    }
  }, [noteId, date, notes])

  const currentDate = new Date(date)
  const dayNumber = currentDate.getDate()
  const monthName = MONTH_NAMES_FULL[currentDate.getMonth()]
  const year = currentDate.getFullYear()
  const dayName = DAY_NAMES_FULL[currentDate.getDay()]

  const handleTimeChange = (_event: any, newTime?: Date) => {
    if (newTime) {
      setSelectedTime(newTime)
    }
  }

  const formatTimeString = (time: Date): string => {
    const hours = time.getHours().toString().padStart(2, '0')
    const minutes = time.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  }

  const handleSave = () => {
    if (itemText.trim()) {
      const noteDate = new Date(date).toISOString().split('T')[0]
      const noteTime = alarmOn ? formatTimeString(selectedTime) : null

      if (isEditing) {
        updateNote(noteId, { 
          description: itemText.trim(),
          note_time: noteTime,
        })
      } else {
        addNote(noteDate, noteTime, itemText.trim(), 0)
      }
      navigation.goBack()
    }
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <View style={$content}>
        <View style={$titleContainer}>
          <Text text={`${dayNumber} ${monthName} ${year} ${dayName}`} style={$dateText} />
          {/* <Text text={dayName} style={$dayNameText} /> */}
        </View>
        <TextField
          value={itemText}
          onChangeText={setItemText}
          placeholder="Enter item description"
          style={$textField}
          autoFocus
        />
        <View style={$alarmContainer}>
          <Text text="Alarm" style={$alarmLabel} />
          <Switch
            value={alarmOn}
            onValueChange={setAlarmOn}
          />
        </View>
        {alarmOn && (
          <View style={$timePickerContainer}>
            <Text text="Time:" style={$timeLabel} />
            <DateTimePicker
              value={selectedTime}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleTimeChange}
              minuteInterval={5}
              style={$timePicker}
            />
          </View>
        )}
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

const $alarmContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: 16,
  paddingHorizontal: 4,
}

const $alarmLabel: TextStyle = {
  fontSize: 16,
}

const $timePickerContainer: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
  marginTop: 16,
}

const $timeLabel: TextStyle = {
  fontSize: 16,
  marginRight: 8,
}

const $timePicker: ViewStyle = {
  flex: 1,
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
