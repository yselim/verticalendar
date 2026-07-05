import { FC, useCallback, useMemo, useState } from "react"
import {
  Modal,
  Pressable,
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
  getToDoItemsByListId,
  reorderToDoItemsInDB,
  updateToDoItemCompletedInDB,
} from "@/utils/database"
import type { IToDoItem } from "types/types"

type AddEditToDoListScreenProps = NativeStackScreenProps<AppStackParamList, "AddEditToDoList">

interface ToDoItemRowProps {
  item: IToDoItem
  isActive: boolean
  onLongPress: () => void
  onDelete: (itemId: number) => void
  onToggleComplete: (itemId: number, checked: boolean) => void
}

const SWIPE_DELETE_THRESHOLD = -60
const SWIPE_MAX = -180

const ToDoItemRow: FC<ToDoItemRowProps> = function ToDoItemRow({
  item,
  isActive,
  onLongPress,
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
}) {
  const { listId, tabId } = route.params
  const [currentListId, setCurrentListId] = useState<number | null>(listId ?? null)
  const [items, setItems] = useState<IToDoItem[]>([])
  const [showAddItemModal, setShowAddItemModal] = useState(false)
  const [newItemText, setNewItemText] = useState("")

  const {
    theme: { colors },
  } = useAppTheme()

  const loadItems = useCallback(() => {
    if (!currentListId) {
      setItems([])
      return
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
    const trimmed = newItemText.trim()
    if (!trimmed) return

    let targetListId = currentListId
    if (!targetListId) {
      targetListId = addToDoListToDB(tabId) as number
      setCurrentListId(targetListId)
    }

    addToDoItemToDB(targetListId, trimmed)
    setNewItemText("")
    setShowAddItemModal(false)
    loadItems()
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
          onDelete={handleDeleteItem}
          onToggleComplete={handleToggleComplete}
        />
      </ScaleDecorator>
    )
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
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
        onPress={() => setShowAddItemModal(true)}
      >
        <Text text="+" style={$fabText} />
      </TouchableOpacity>

      <Modal
        visible={showAddItemModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <Pressable style={$modalOverlay} onPress={() => setShowAddItemModal(false)}>
          <Pressable style={$modalSheet} onPress={() => {}}>
            <Text text="Yeni ToDo Öğesi" weight="medium" style={$modalTitle} />
            <TextInput
              value={newItemText}
              onChangeText={setNewItemText}
              placeholder="Bir satır yaz..."
              placeholderTextColor={colors.textDim}
              style={[
                $input,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colors.background,
                },
              ]}
              autoFocus
              multiline={false}
              returnKeyType="done"
              onSubmitEditing={handleAddItem}
            />

            <View style={$modalButtonsRow}>
              <TouchableOpacity
                style={[$modalBtn, $cancelBtn]}
                onPress={() => setShowAddItemModal(false)}
                activeOpacity={0.85}
              >
                <Text text="İptal" style={$cancelText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[$modalBtn, $addBtn]}
                onPress={handleAddItem}
                activeOpacity={0.85}
              >
                <Text text="Ekle" style={$addText} />
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
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
