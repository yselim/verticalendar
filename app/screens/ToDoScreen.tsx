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
  deleteToDoListFromDB,
  getToDoListsByTabId,
  moveToDoListToTabInDB,
  reorderToDoListsInDB,
} from "@/utils/database"
import type { IToDoList } from "types/types"

const TABS = [1, 2] as const

const toDoPalette = {
  background: "#F2FAF7",
  title: "#0D4A3E",
  text: "#16584A",
  muted: "#4B7E73",
  tabActiveBg: "#DDF3EC",
  tabInactiveBg: "#F2FAF7",
  tabActiveBorder: "#26A17B",
  tabInactiveBorder: "#A7D5C8",
  rowBg: "#FFFFFF",
  rowBorder: "#CAE7DE",
  menuButton: "#1F8E6E",
  fab: "#1F8E6E",
} as const

type ToDoScreenProps = MainTabScreenProps<"Listeler">

export const ToDoScreen: FC<ToDoScreenProps> = function ToDoScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>(1)
  const [lists, setLists] = useState<IToDoList[]>([])
  const [menuListId, setMenuListId] = useState<number | null>(null)
  const [confirmDeleteListId, setConfirmDeleteListId] = useState<number | null>(null)

  useAppTheme()

  const loadLists = useCallback((tabId: number) => {
    const rows = getToDoListsByTabId(tabId) as IToDoList[]
    setLists(rows)
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadLists(activeTab)
    }, [activeTab, loadLists]),
  )

  const onTabPress = (tabId: (typeof TABS)[number]) => {
    setActiveTab(tabId)
    loadLists(tabId)
  }

  const handleAddList = () => {
    navigation.navigate("AddEditToDoList", { tabId: activeTab })
  }

  const handleDeleteList = useCallback((listId: number) => {
    deleteToDoListFromDB(listId)
    setLists((prev) => prev.filter((list) => list.id !== listId))
    setConfirmDeleteListId(null)
    setMenuListId(null)
  }, [])

  const handleMoveToOtherTab = useCallback(
    (listId: number) => {
      const targetTabId = activeTab === 1 ? 2 : 1
      moveToDoListToTabInDB(listId, targetTabId)
      setLists((prev) => prev.filter((list) => list.id !== listId))
      setMenuListId(null)
    },
    [activeTab],
  )

  const handleReorder = useCallback(
    (reordered: IToDoList[]) => {
      setLists(reordered)
      reorderToDoListsInDB(activeTab, reordered)
    },
    [activeTab],
  )

  const renderItem = ({ item, drag, isActive }: RenderItemParams<IToDoList>) => {
    const title = item.title?.trim() || item.first_item?.trim() || "Yeni ToDo Listesi"

    return (
      <ScaleDecorator>
        <TouchableOpacity
          style={[
            $listRow,
            {
              borderBottomColor: toDoPalette.rowBorder,
              backgroundColor: toDoPalette.rowBg,
              opacity: isActive ? 0.85 : 1,
            },
          ]}
          activeOpacity={0.8}
          onLongPress={drag}
          onPress={() => navigation.navigate("AddEditToDoList", { listId: item.id, tabId: activeTab })}
        >
          <View style={$listRowTextContainer}>
            <Text text={title} numberOfLines={1} weight="medium" style={{ color: toDoPalette.text }} />
            <Text text={`${item.item_count} öğe`} numberOfLines={1} style={{ color: toDoPalette.muted }} size="xxs" />
          </View>

          <TouchableOpacity
            style={$settingsButton}
            activeOpacity={0.7}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
            onPress={() => setMenuListId(item.id)}
          >
            <Icon icon="settings" size={18} color={toDoPalette.muted} />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    )
  }

  return (
    <Screen
      preset="fixed"
      safeAreaEdges={["top"]}
      backgroundColor={toDoPalette.background}
      contentContainerStyle={$container}
    >
      <View style={$titleContainer}>
        <Icon icon="check" size={20} color={toDoPalette.title} />
        <Text text="LİSTELER" weight="bold" size="lg" style={{ color: toDoPalette.title }} />
      </View>

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
                  borderColor: isActive ? toDoPalette.tabActiveBorder : toDoPalette.tabInactiveBorder,
                  backgroundColor: isActive ? toDoPalette.tabActiveBg : toDoPalette.tabInactiveBg,
                },
              ]}
              onPress={() => onTabPress(tabId)}
              activeOpacity={0.8}
            >
              <Text text={`${tabId}`} style={[isActive ? $activeTabText : $tabText, { color: toDoPalette.text }]} />
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={$content}>
        <DraggableFlatList
          data={lists}
          onDragEnd={({ data }) => handleReorder(data)}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={$listContent}
          ListEmptyComponent={
            <View style={$emptyContainer}>
              <Text text="No lists yet." style={{ color: toDoPalette.muted }} />
            </View>
          }
        />
      </View>

      <Modal
        visible={menuListId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuListId(null)}
      >
        <Pressable style={$modalOverlay} onPress={() => setMenuListId(null)}>
          <View style={$modalContent}>
            <TouchableOpacity
              style={[$modalButton, { backgroundColor: toDoPalette.menuButton }]}
              onPress={() => {
                if (menuListId !== null) {
                  setConfirmDeleteListId(menuListId)
                  setMenuListId(null)
                }
              }}
              activeOpacity={0.8}
            >
              <Text text="Sil" style={$modalButtonText} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[$modalButton, { backgroundColor: toDoPalette.menuButton }]}
              onPress={() => {
                if (menuListId !== null) handleMoveToOtherTab(menuListId)
              }}
              activeOpacity={0.8}
            >
              <Text text="Yan Sekmeye Taşı" style={$modalButtonText} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={confirmDeleteListId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmDeleteListId(null)}
      >
        <Pressable style={$confirmOverlay} onPress={() => setConfirmDeleteListId(null)}>
          <Pressable style={$confirmSheet} onPress={() => {}}>
            <Text text="Bu liste silinsin mi?" weight="medium" style={$confirmTitle} />
            <View style={$confirmButtonsRow}>
              <TouchableOpacity
                style={[$confirmBtn, $confirmCancelBtn]}
                onPress={() => setConfirmDeleteListId(null)}
                activeOpacity={0.85}
              >
                <Text text="Vazgeç" style={$confirmCancelText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[$confirmBtn, $confirmDeleteBtn]}
                onPress={() => {
                  if (confirmDeleteListId !== null) handleDeleteList(confirmDeleteListId)
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
        style={[$fab, { backgroundColor: toDoPalette.fab }]}
        activeOpacity={0.8}
        onPress={handleAddList}
      >
        <Text text="+" style={$fabText} />
      </TouchableOpacity>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
}

const $titleContainer: ViewStyle = {
  minHeight: 52,
  flexDirection: "row",
  gap: 8,
  alignItems: "center",
  justifyContent: "center",
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

const $listRow: ViewStyle = {
  minHeight: 64,
  flexDirection: "row",
  alignItems: "center",
  borderBottomWidth: 1,
  paddingHorizontal: 16,
}

const $listRowTextContainer: ViewStyle = {
  flex: 1,
  justifyContent: "center",
  gap: 2,
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
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: 28,
  alignItems: "center",
  justifyContent: "center",
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
  fontWeight: "bold",
}
