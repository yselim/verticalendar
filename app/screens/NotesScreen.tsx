import { FC, useCallback, useState } from "react"
import { Modal, Pressable, TextStyle, TouchableOpacity, View, ViewStyle } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Icon } from "@/components/Icon"
import { useAppTheme } from "@/theme/context"
import { MainTabScreenProps } from "@/navigators/navigationTypes"
import {
  deleteTabNoteFromDB,
  getTabNotesByTabId,
  moveTabNoteToTabInDB,
  reorderTabNotesInDB,
} from "@/utils/database"
import type { ITabNote } from "types/types"

const TABS = [1, 2] as const

type NotesScreenProps = MainTabScreenProps<"Notlar">

export const NotesScreen: FC<NotesScreenProps> = function NotesScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(1)
  const [notes, setNotes] = useState<ITabNote[]>([])
  const [menuNoteId, setMenuNoteId] = useState<number | null>(null)
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState<number | null>(null)

  const {
    theme: { colors },
  } = useAppTheme()

  const loadTabNotes = useCallback((tabId: number) => {
    const rows = getTabNotesByTabId(tabId) as ITabNote[]
    setNotes(rows)
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadTabNotes(activeTab)
    }, [activeTab, loadTabNotes]),
  )

  const onTabPress = (tabId: (typeof TABS)[number]) => {
    setActiveTab(tabId)
    loadTabNotes(tabId)
  }

  const getNoteTitle = (content: string) => {
    const [firstLine = ""] = content.split(/\r?\n/)
    return firstLine.trim()
  }

  const handleDeleteNote = useCallback((noteId: number) => {
    deleteTabNoteFromDB(noteId)
    setNotes((prev) => prev.filter((note) => note.id !== noteId))
    setConfirmDeleteNoteId(null)
    setMenuNoteId(null)
  }, [])

  const handleMoveToOtherTab = useCallback(
    (noteId: number) => {
      const targetTabId = activeTab === 1 ? 2 : 1
      moveTabNoteToTabInDB(noteId, targetTabId)
      setNotes((prev) => prev.filter((note) => note.id !== noteId))
      setMenuNoteId(null)
    },
    [activeTab],
  )

  const handleReorder = useCallback(
    (reordered: ITabNote[]) => {
      setNotes(reordered)
      reorderTabNotesInDB(activeTab, reordered)
    },
    [activeTab],
  )

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ITabNote>) => {
    return (
      <ScaleDecorator>
        <TouchableOpacity
          style={[
            $noteRow,
            {
              borderBottomColor: colors.border,
              opacity: isActive ? 0.85 : 1,
            },
          ]}
          activeOpacity={0.8}
          onLongPress={drag}
          onPress={() => navigation.navigate("NoteEditor", { tabId: activeTab, noteId: item.id })}
        >
          <Text text={getNoteTitle(item.content)} numberOfLines={1} weight="medium" style={$noteTitle} />

          <TouchableOpacity
            style={$settingsButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            onPress={() => setMenuNoteId(item.id)}
          >
            <Icon icon="settings" size={18} color={colors.textDim} />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$container}>
      <View style={$tabWrapper}>
        {TABS.map((tabId) => {
          const isActive = activeTab === tabId
          return (
            <TouchableOpacity
              key={tabId}
              style={[
                $tab,
                {
                  width: "50%",
                  borderColor: isActive ? colors.tint : colors.border,
                  backgroundColor: isActive ? colors.palette.neutral100 : colors.background,
                },
              ]}
              onPress={() => onTabPress(tabId)}
              activeOpacity={0.8}
            >
              <Text text={`${tabId}`} style={[isActive ? $activeTabText : $tabText, { color: colors.text }]} />
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={$content}>
        <DraggableFlatList
          data={notes}
          onDragEnd={({ data }) => handleReorder(data)}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={$listContent}
          ListEmptyComponent={
            <View style={$emptyContainer}>
              <Text text="No notes yet." style={{ color: colors.textDim }} />
            </View>
          }
        />
      </View>

      <Modal
        visible={menuNoteId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuNoteId(null)}
      >
        <Pressable style={$modalOverlay} onPress={() => setMenuNoteId(null)}>
          <View style={$modalContent}>
            <TouchableOpacity
              style={$modalButton}
              onPress={() => {
                if (menuNoteId !== null) {
                  setConfirmDeleteNoteId(menuNoteId)
                  setMenuNoteId(null)
                }
              }}
              activeOpacity={0.8}
            >
              <Text text="Sil" style={$modalButtonText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={$modalButton}
              onPress={() => {
                if (menuNoteId !== null) handleMoveToOtherTab(menuNoteId)
              }}
              activeOpacity={0.8}
            >
              <Text text="Yan Sekmeye Taşı" style={$modalButtonText} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={confirmDeleteNoteId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmDeleteNoteId(null)}
      >
        <Pressable style={$confirmOverlay} onPress={() => setConfirmDeleteNoteId(null)}>
          <Pressable style={$confirmSheet} onPress={() => {}}>
            <Text text="Bu not silinsin mi?" weight="medium" style={$confirmTitle} />
            <View style={$confirmButtonsRow}>
              <TouchableOpacity
                style={[$confirmBtn, $confirmCancelBtn]}
                onPress={() => setConfirmDeleteNoteId(null)}
                activeOpacity={0.85}
              >
                <Text text="Vazgeç" style={$confirmCancelText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[$confirmBtn, $confirmDeleteBtn]}
                onPress={() => {
                  if (confirmDeleteNoteId !== null) handleDeleteNote(confirmDeleteNoteId)
                }}
                activeOpacity={0.85}
              >
                <Text text="Sil" style={$confirmDeleteText} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <TouchableOpacity
        style={[$fab, { backgroundColor: colors.tint }]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate("NoteEditor", { tabId: activeTab })}
      >
        <Text text="+" style={$fabText} />
      </TouchableOpacity>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
}

const $tabWrapper: ViewStyle = {
  flexDirection: "row",
  alignItems: "center",
}

const $tab: ViewStyle = {
  alignItems: "center",
  justifyContent: "center",
  paddingVertical: 14,
  borderWidth: 1,
}

const $tabText: TextStyle = {
  fontSize: 18,
}

const $activeTabText: TextStyle = {
  fontSize: 18,
  fontWeight: "700",
}

const $content: ViewStyle = {
  flex: 1,
}

const $listContent: ViewStyle = {
  paddingBottom: 96,
}

const $noteRow: ViewStyle = {
  minHeight: 56,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderBottomWidth: 1,
  paddingHorizontal: 16,
}

const $noteTitle: TextStyle = {
  flex: 1,
}

const $settingsButton: ViewStyle = {
  padding: 6,
  marginLeft: 8,
}

const $emptyContainer: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 24,
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

const $confirmOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.35)",
  justifyContent: "flex-end",
}

const $confirmSheet: ViewStyle = {
  backgroundColor: "#fff",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 24,
}

const $confirmTitle: TextStyle = {
  fontSize: 16,
  marginBottom: 14,
}

const $confirmButtonsRow: ViewStyle = {
  flexDirection: "row",
  gap: 12,
}

const $confirmBtn: ViewStyle = {
  flex: 1,
  minHeight: 46,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
}

const $confirmCancelBtn: ViewStyle = {
  backgroundColor: "#E5E7EB",
}

const $confirmDeleteBtn: ViewStyle = {
  backgroundColor: "#DC2626",
}

const $confirmCancelText: TextStyle = {
  fontSize: 15,
  fontWeight: "600",
}

const $confirmDeleteText: TextStyle = {
  color: "#fff",
  fontSize: 15,
  fontWeight: "600",
}

const $fab: ViewStyle = {
  position: "absolute",
  right: 20,
  bottom: 24,
  width: 56,
  height: 56,
  borderRadius: 28,
  justifyContent: "center",
  alignItems: "center",
  elevation: 6,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
}

const $fabText: TextStyle = {
  color: "#fff",
  fontSize: 32,
  lineHeight: 34,
  fontWeight: "700",
}
