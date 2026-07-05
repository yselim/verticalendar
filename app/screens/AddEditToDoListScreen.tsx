import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import { useFocusEffect } from "@react-navigation/native"
import { Gesture, GestureDetector } from "react-native-gesture-handler"
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated"
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from "react-native-draggable-flatlist"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import type { AppStackParamList } from "@/navigators/navigationTypes"
import { useAppTheme } from "@/theme/context"
import {
  addToDoListToDB,
  addToDoItemToDB,
  deleteToDoItemFromDB,
  getToDoListById,
  getToDoItemsByListId,
  reorderToDoItemsInDB,
  updateToDoListTitleInDB,
  updateToDoItemCompletedInDB,
  updateToDoItemContentInDB,
} from "@/utils/database"
import type { IToDoItem } from "types/types"

type AddEditToDoListScreenProps = NativeStackScreenProps<AppStackParamList, "AddEditToDoList">

interface ToDoItemRowProps {
  item: IToDoItem
  isActive: boolean
  onLongPress: () => void
  onPress: (item: IToDoItem) => void
  onDelete: (itemId: number) => void
  onToggleComplete: (itemId: number, checked: boolean) => void
}

const SWIPE_DELETE_THRESHOLD = -60
const SWIPE_MAX = -180

const ToDoItemRow: FC<ToDoItemRowProps> = function ToDoItemRow({
  item,
  isActive,
  onLongPress,
  onPress,
  onDelete,
  onToggleComplete,
}) {
  const {
    theme: { colors },
  } = useAppTheme()

  const translateX = useSharedValue(0)
  const opacity = useSharedValue(1)

  const handleDelete = useCallback(() => {
    const direction = translateX.value > 0 ? 1 : -1
    translateX.value = withTiming(direction * 500, { duration: 240 })
    opacity.value = withTiming(0, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onDelete)(item.id)
    })
  }, [item.id, onDelete, opacity, translateX])

  const resetPosition = useCallback(() => {
    translateX.value = withSpring(0, { stiffness: 100, damping: 15 })
  }, [translateX])

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(!isActive)
        .activeOffsetX([-5, 5])
        .failOffsetY([-10, 10])
        .onUpdate((event) => {
          if (event.translationX > Math.abs(SWIPE_MAX)) {
            translateX.value = Math.abs(SWIPE_MAX)
          } else if (event.translationX < SWIPE_MAX) {
            translateX.value = SWIPE_MAX
          } else {
            translateX.value = event.translationX
          }
        })
        .onEnd((event) => {
          if (
            event.translationX < SWIPE_DELETE_THRESHOLD ||
            event.translationX > Math.abs(SWIPE_DELETE_THRESHOLD)
          ) {
            runOnJS(handleDelete)()
          } else {
            runOnJS(resetPosition)()
          }
        }),
    [handleDelete, isActive, resetPosition, translateX],
  )

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    }
  })

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          style={[
            $itemRow,
            {
              backgroundColor: item.completed ? colors.palette.neutral200 : colors.palette.neutral100,
              borderBottomColor: colors.border,
            },
          ]}
          activeOpacity={0.8}
          onPress={() => onPress(item)}
          onLongPress={onLongPress}
          disabled={isActive}
        >
          <TouchableOpacity
            style={[
              $checkbox,
              {
                borderColor: item.completed ? colors.tint : colors.border,
                backgroundColor: item.completed ? colors.tint : colors.transparent,
              },
            ]}
            activeOpacity={0.8}
            onPress={() => onToggleComplete(item.id, item.completed !== 1)}
            hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
          >
            {item.completed === 1 ? <Text text="✓" style={$checkboxTick} /> : null}
          </TouchableOpacity>

          <Text
            text={item.content}
            numberOfLines={1}
            style={[
              $itemText,
              item.completed === 1 && {
                color: colors.textDim,
                textDecorationLine: "line-through",
              },
            ]}
          />
        </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  )
}

export const AddEditToDoListScreen: FC<AddEditToDoListScreenProps> = function AddEditToDoListScreen({
  route,
  navigation,
}) {
  const { listId, tabId } = route.params
  const [currentListId, setCurrentListId] = useState<number | null>(listId ?? null)
  const [listTitle, setListTitle] = useState("")
  const [titleInput, setTitleInput] = useState("")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [showCreateListModal, setShowCreateListModal] = useState(listId == null)
  const [items, setItems] = useState<IToDoItem[]>([])
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [newItemText, setNewItemText] = useState("")
  const [editingItem, setEditingItem] = useState<IToDoItem | null>(null)

  const createListInputRef = useRef<TextInput>(null)
  const addItemInputRef = useRef<TextInput>(null)
  const editTitleInputRef = useRef<TextInput>(null)

  const {
    theme: { colors },
  } = useAppTheme()

  useEffect(() => {
    if (showCreateListModal) {
      setTimeout(() => createListInputRef.current?.focus(), 150)
    }
  }, [showCreateListModal])

  useEffect(() => {
    if (showAddItemModal) {
      setTimeout(() => addItemInputRef.current?.focus(), 150)
    }
  }, [showAddItemModal])

  useEffect(() => {
    if (isEditingTitle) {
      setTimeout(() => editTitleInputRef.current?.focus(), 150)
    }
  }, [isEditingTitle])

  const loadItems = useCallback(() => {
    if (!currentListId) {
      setItems([])
      return
    }

    const listRow = getToDoListById(currentListId) as { title?: string } | null
    if (listRow?.title) {
      setListTitle(listRow.title)
      setTitleInput(listRow.title)
    }

    const rows = getToDoItemsByListId(currentListId) as IToDoItem[]
    setItems(rows)
  }, [currentListId])

  useFocusEffect(
    useCallback(() => {
      loadItems()
    }, [loadItems]),
  )

  const handleAddItem = () => {
    if (!currentListId) {
      setShowCreateListModal(true)
      return
    }

    const trimmed = newItemText.trim()
    if (!trimmed) return

    if (editingItem) {
      updateToDoItemContentInDB(editingItem.id, trimmed)
    } else {
      addToDoItemToDB(currentListId, trimmed)
    }

    setNewItemText("")
    setEditingItem(null)
    setShowAddItemModal(false)
    loadItems()
  }

  const handleCreateList = () => {
    const trimmed = titleInput.trim()
    if (trimmed.length < 1) {
      Alert.alert("Geçersiz başlık", "Liste başlığı en az 1 karakter olmalı.")
      return
    }

    const createdId = addToDoListToDB(tabId, trimmed) as number
    setCurrentListId(createdId)
    setListTitle(trimmed)
    setTitleInput(trimmed)
    setShowCreateListModal(false)
  }

  const saveEditedTitle = () => {
    if (!currentListId) return

    const trimmed = titleInput.trim()
    if (trimmed.length < 1) {
      Alert.alert("Geçersiz başlık", "Liste başlığı en az 1 karakter olmalı.")
      setTitleInput(listTitle)
      setIsEditingTitle(false)
      return
    }

    updateToDoListTitleInDB(currentListId, trimmed)
    setListTitle(trimmed)
    setTitleInput(trimmed)
    setIsEditingTitle(false)
  }

  const handleDeleteItem = useCallback(
    (itemId: number) => {
      deleteToDoItemFromDB(itemId)
      setItems((prev) => prev.filter((it) => it.id !== itemId))
    },
    [setItems],
  )

  const handleReorder = useCallback(
    (reordered: IToDoItem[]) => {
      if (!currentListId) return
      setItems(reordered)
      reorderToDoItemsInDB(currentListId, reordered)
    },
    [currentListId],
  )

  const handleToggleComplete = useCallback((itemId: number, checked: boolean) => {
    updateToDoItemCompletedInDB(itemId, checked)
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, completed: checked ? 1 : 0 } : it)),
    )
  }, [])

  const renderItem = ({ item, drag, isActive }: RenderItemParams<IToDoItem>) => {
    return (
      <ScaleDecorator>
        <ToDoItemRow
          item={item}
          isActive={isActive}
          onLongPress={drag}
          onPress={(it) => {
            setEditingItem(it)
            setNewItemText(it.content)
            setShowAddItemModal(true)
          }}
          onDelete={handleDeleteItem}
          onToggleComplete={handleToggleComplete}
        />
      </ScaleDecorator>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <View style={$titleContainer}>
        {isEditingTitle ? (
          <TextInput
            ref={editTitleInputRef}
            value={titleInput}
            onChangeText={setTitleInput}
            style={[$titleInput, { color: colors.text, borderColor: colors.border }]}
            maxLength={120}
            returnKeyType="done"
            onSubmitEditing={saveEditedTitle}
            onBlur={saveEditedTitle}
          />
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (!currentListId) return
              setTitleInput(listTitle)
              setIsEditingTitle(true)
            }}
            disabled={!currentListId}
          >
            <Text text={listTitle || "Liste Başlığı"} weight="bold" size="lg" />
          </TouchableOpacity>
        )}
      </View>

      <DraggableFlatList
        data={items}
        onDragEnd={({ data }) => handleReorder(data)}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        containerStyle={$listContainer}
        contentContainerStyle={$listContent}
        ListEmptyComponent={
          <View style={$emptyContainer}>
            <Text text="Henüz öğe yok." style={{ color: colors.textDim }} />
          </View>
        }
      />

      <TouchableOpacity
        style={[$fab, { backgroundColor: colors.tint }]}
        activeOpacity={0.85}
        onPress={() => {
          if (!currentListId) {
            setShowCreateListModal(true)
            return
          }
          setShowAddItemModal(true)
        }}
      >
        <Text text="+" style={$fabText} />
      </TouchableOpacity>

      <Modal
        visible={showCreateListModal}
        transparent
        animationType="slide"
        onRequestClose={() => navigation.goBack()}
      >
        <KeyboardAvoidingView
          style={$modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={() => navigation.goBack()} />
          <Pressable style={$modalSheet} onPress={() => {}}>
            <Text text="Liste Başlığı" weight="medium" style={$modalTitle} />
            <TextInput
              ref={createListInputRef}
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder="Liste başlığı yaz..."
              placeholderTextColor={colors.textDim}
              style={[
                $input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              multiline={false}
              returnKeyType="done"
              onSubmitEditing={handleCreateList}
            />

            <View style={$modalButtonsRow}>
              <TouchableOpacity
                style={[$modalBtn, $cancelBtn]}
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <Text text="İptal" style={$cancelText} />
              </TouchableOpacity>
              <TouchableOpacity style={[$modalBtn, $addBtn]} onPress={handleCreateList} activeOpacity={0.85}>
                <Text text="Liste Ekle" style={$addText} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={showAddItemModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowAddItemModal(false)
          setEditingItem(null)
          setNewItemText("")
        }}
      >
        <KeyboardAvoidingView
          style={$modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              setShowAddItemModal(false)
              setEditingItem(null)
              setNewItemText("")
            }}
          />
          <Pressable style={$modalSheet} onPress={() => {}}>
            <Text
              text={editingItem ? "Satırı Düzenle" : "Yeni Satır"}
              weight="medium"
              style={$modalTitle}
            />
            <TextInput
              ref={addItemInputRef}
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder=""
              placeholderTextColor={colors.textDim}
              style={[
                $input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              multiline={false}
              returnKeyType="done"
              onSubmitEditing={handleAddItem}
            />

            <View style={$modalButtonsRow}>
              <TouchableOpacity
                style={[$modalBtn, $cancelBtn]}
                onPress={() => {
                  setShowAddItemModal(false)
                  setEditingItem(null)
                  setNewItemText("")
                }}
                activeOpacity={0.85}
              >
                <Text text="İptal" style={$cancelText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[$modalBtn, $addBtn]}
                onPress={handleAddItem}
                activeOpacity={0.85}
              >
                <Text text={editingItem ? "Güncelle" : "Ekle"} style={$addText} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
}

const $titleContainer: ViewStyle = {
  minHeight: 56,
  justifyContent: "center",
  alignItems: "center",
  paddingHorizontal: 16,
}

const $titleInput: TextStyle = {
  minWidth: "80%",
  textAlign: "center",
  fontSize: 24,
  fontWeight: "700",
  borderBottomWidth: 1,
  paddingVertical: 4,
}

const $listContent: ViewStyle = {
  paddingBottom: 96,
}

const $listContainer: ViewStyle = {
  flex: 1,
}

const $itemRow: ViewStyle = {
  minHeight: 56,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderBottomWidth: 1,
  paddingHorizontal: 16,
}

const $checkbox: ViewStyle = {
  width: 22,
  height: 22,
  borderRadius: 6,
  borderWidth: 1.5,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 10,
}

const $checkboxTick: TextStyle = {
  color: "#fff",
  fontSize: 13,
  lineHeight: 14,
  fontWeight: "700",
}

const $itemText: TextStyle = {
  flex: 1,
  fontSize: 16,
  lineHeight: 22,
}

const $emptyContainer: ViewStyle = {
  paddingHorizontal: 16,
  paddingVertical: 24,
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

const $modalOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.35)",
  justifyContent: "flex-end",
}

const $modalSheet: ViewStyle = {
  backgroundColor: "#fff",
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  paddingHorizontal: 16,
  paddingTop: 16,
  paddingBottom: 24,
}

const $modalTitle: TextStyle = {
  fontSize: 16,
  marginBottom: 12,
}

const $input: TextStyle = {
  minHeight: 44,
  borderWidth: 1,
  borderRadius: 10,
  paddingHorizontal: 12,
  marginBottom: 12,
}

const $modalButtonsRow: ViewStyle = {
  flexDirection: "row",
  gap: 12,
}

const $modalBtn: ViewStyle = {
  flex: 1,
  minHeight: 46,
  borderRadius: 10,
  alignItems: "center",
  justifyContent: "center",
}

const $cancelBtn: ViewStyle = {
  backgroundColor: "#E5E7EB",
}

const $addBtn: ViewStyle = {
  backgroundColor: "#22C55E",
}

const $cancelText: TextStyle = {
  fontSize: 15,
  fontWeight: "600",
}

const $addText: TextStyle = {
  color: "#fff",
  fontSize: 15,
  fontWeight: "600",
}
