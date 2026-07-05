import { FC, useCallback, useMemo, useState } from "react"
import { View, ViewStyle, TextStyle, TouchableOpacity, FlatList } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Note } from "@/components/Note"
import { AddEditNoteModal } from "@/components/AddEditNoteModal"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { useNotesStore } from "@/stores/notesStore"
import { getFutureCalendarItemsFromNow, getPastCalendarItemsFromNow } from "@/utils/database"
import type { INote } from "types/types"

type AllCalendarItemsScreenProps = NativeStackScreenProps<AppStackParamList, "AllCalendarItems">
type ItemsTab = "past" | "future"

const mapRowsToNotes = (rows: any[]): INote[] => {
  return rows.map((item) => ({
    id: item.id,
    note_date: item.note_date,
    note_time: item.note_time || null,
    description: item.description,
    order_index: item.order_index,
    notification_id: item.notification_id || null,
  }))
}

export const AllCalendarItemsScreen: FC<AllCalendarItemsScreenProps> = function AllCalendarItemsScreen() {
  const [activeTab, setActiveTab] = useState<ItemsTab>("past")
  const [pastItems, setPastItems] = useState<INote[]>([])
  const [futureItems, setFutureItems] = useState<INote[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingNote, setEditingNote] = useState<INote | null>(null)

  const { deleteNote } = useNotesStore()

  const loadItems = useCallback(() => {
    const pastRows = getPastCalendarItemsFromNow() as any[]
    const futureRows = getFutureCalendarItemsFromNow() as any[]

    setPastItems(mapRowsToNotes(pastRows))
    setFutureItems(mapRowsToNotes(futureRows))
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadItems()
    }, [loadItems]),
  )

  const currentItems = useMemo(
    () => (activeTab === "past" ? pastItems : futureItems),
    [activeTab, pastItems, futureItems],
  )

  const handleDeleteNote = useCallback(
    (noteId: number) => {
      deleteNote(noteId)
      loadItems()
    },
    [deleteNote, loadItems],
  )

  const handleEditNote = useCallback((note: INote) => {
    setEditingNote(note)
    setModalVisible(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalVisible(false)
    setEditingNote(null)
    loadItems()
  }, [loadItems])

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <Text text="Tüm Hatırlatmalar" preset="heading" style={$title} />

      <View style={$tabsRow}>
        <TouchableOpacity
          style={[$tabButton, activeTab === "past" && $tabButtonActive]}
          onPress={() => setActiveTab("past")}
          activeOpacity={0.8}
        >
          <Text text="Geçmiş" style={[$tabText, activeTab === "past" && $tabTextActive]} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[$tabButton, activeTab === "future" && $tabButtonActive]}
          onPress={() => setActiveTab("future")}
          activeOpacity={0.8}
        >
          <Text text="Gelecek" style={[$tabText, activeTab === "future" && $tabTextActive]} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={currentItems}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={$listContent}
        renderItem={({ item }) => (
          <Note
            note={item}
            onDelete={handleDeleteNote}
            onEdit={handleEditNote}
            settingsMode="allCalendarItems"
            onNoteChanged={loadItems}
          />
        )}
        ListEmptyComponent={
          <View style={$emptyState}>
            <Text
              text={activeTab === "past" ? "Geçmiş hatırlatma bulunamadı" : "Gelecek hatırlatma bulunamadı"}
              style={$emptyText}
            />
          </View>
        }
      />

      <AddEditNoteModal
        visible={modalVisible}
        onClose={handleCloseModal}
        date={editingNote?.note_date ?? new Date().toISOString()}
        note={editingNote}
      />
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  paddingHorizontal: 16,
  paddingTop: 8,
}

const $title: TextStyle = {
  textAlign: "center",
  marginBottom: 12,
  fontSize: 24,
}

const $tabsRow: ViewStyle = {
  flexDirection: "row",
  gap: 8,
  marginBottom: 12,
}

const $tabButton: ViewStyle = {
  flex: 1,
  borderWidth: 1,
  borderColor: "#d0d0d0",
  borderRadius: 10,
  paddingVertical: 10,
  alignItems: "center",
  backgroundColor: "#f6f6f6",
}

const $tabButtonActive: ViewStyle = {
  backgroundColor: "#333",
  borderColor: "#333",
}

const $tabText: TextStyle = {
  fontSize: 14,
  color: "#333",
  fontWeight: "600",
}

const $tabTextActive: TextStyle = {
  color: "#fff",
}

const $listContent: ViewStyle = {
  paddingBottom: 24,
}

const $emptyState: ViewStyle = {
  paddingTop: 40,
  alignItems: "center",
}

const $emptyText: TextStyle = {
  color: "#777",
  fontSize: 14,
}
