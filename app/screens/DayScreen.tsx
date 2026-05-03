import { FC, useEffect, useState } from "react"
import { ViewStyle, ScrollView, View, TextStyle, TouchableOpacity } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Note } from "@/components/Note"
import { AddEditNoteModal } from "@/components/AddEditNoteModal"
import { useNotesStore } from "@/stores/notesStore"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { MONTH_NAMES_FULL, DAY_NAMES_FULL } from "@/utils/constants"
import { INote } from "types/types"
import Feather from "@expo/vector-icons/Feather"
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from "react-native-draggable-flatlist"

type DayScreenProps = NativeStackScreenProps<AppStackParamList, "Day">

export const DayScreen: FC<DayScreenProps> = function DayScreen({ route, navigation }) {
  const { date } = route.params
  const { notes, fetchNotes, deleteNote, reorderNotes } = useNotesStore()
  const [modalVisible, setModalVisible] = useState(false)
  const [editingNote, setEditingNote] = useState<INote | null>(null)

  const currentDate = new Date(date)
  // Use local date to avoid timezone issues
  const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`
  const dayNotes = notes[dateKey] || []

  useEffect(() => {
    fetchNotes(new Date(date))
  }, [date])

  const dayNumber = currentDate.getDate()
  const monthName = MONTH_NAMES_FULL[currentDate.getMonth()]
  const year = currentDate.getFullYear()
  const dayName = DAY_NAMES_FULL[currentDate.getDay()]

  const handleAddPress = () => {
    setEditingNote(null)
    setModalVisible(true)
  }

  const handleEditNote = (note: INote) => {
    setEditingNote(note)
    setModalVisible(true)
  }

  const handleCloseModal = () => {
    setModalVisible(false)
    setEditingNote(null)
  }

  const handleDeleteNote = (noteId: number) => {
    deleteNote(noteId)
  }

  const renderItem = ({ item, drag, isActive }: RenderItemParams<INote>) => {
    return (
      <ScaleDecorator>
        <Note 
          note={item} 
          onDelete={handleDeleteNote} 
          onEdit={handleEditNote} 
          onLongPress={drag}
          disabled={isActive}
        />
      </ScaleDecorator>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <View style={$titleContainer}>
        <Text text={`${dayNumber} ${monthName} ${year}`} preset="heading" style={$dateText} />
        <Text text={dayName} preset="heading" style={$dayNameText} />
      </View>
      <DraggableFlatList
        data={dayNotes}
        onDragEnd={({ data }) => reorderNotes(dateKey, data)}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        containerStyle={$notesContainer}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <TouchableOpacity style={$fab} onPress={handleAddPress} activeOpacity={0.8}>
        <Feather name="plus" size={32} color="#fff" />
      </TouchableOpacity>
      <AddEditNoteModal 
        visible={modalVisible} 
        onClose={handleCloseModal} 
        date={date}
        note={editingNote}
      />
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  padding: 16,
}

const $titleContainer: ViewStyle = {
  marginBottom: 8,
  alignItems: "center",
}

const $dateText: TextStyle = {
  fontSize: 22,
}

const $dayNameText: TextStyle = {
  color: "#666",
  fontSize: 22,
}

const $notesContainer: ViewStyle = {
  flex: 1,
  marginTop: 16,
}

const $fab: ViewStyle = {
  position: "absolute",
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: "#007AFF",
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 4,
  elevation: 5,
}

