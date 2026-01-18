import { FC, useCallback, useRef, useState } from "react"
import { FlatList, ListRenderItem, View, ViewStyle, TouchableOpacity, TextStyle, Platform, Modal } from "react-native"
import DateTimePicker from "@react-native-community/datetimepicker"

import { DayRow } from "@/components/DayRow"
import { Screen } from "@/components/Screen"
import { Icon } from "@/components/Icon"
import { Text } from "@/components/Text"

const INITIAL_DAYS = 100 // Days to load in each direction initially
const LOAD_MORE_DAYS = 50 // Days to add when reaching the end

interface DayItem {
  date: Date
  key: string
}

export const CalendarScreen: FC = function CalendarScreen() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [days, setDays] = useState<DayItem[]>(() => {
    const initialDays: DayItem[] = []
    for (let i = -INITIAL_DAYS; i <= INITIAL_DAYS; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      initialDays.push({
        date,
        key: date.toISOString(),
      })
    }
    return initialDays
  })

  const flatListRef = useRef<FlatList>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [selectedDate, setSelectedDate] = useState(today)
  const [listKey, setListKey] = useState(0)
  const [highlightedDate, setHighlightedDate] = useState<Date | null>(null)

  const scrollToDate = useCallback((targetDate: Date) => {
    // Check if target is today
    const isTargetToday = 
      targetDate.getDate() === today.getDate() &&
      targetDate.getMonth() === today.getMonth() &&
      targetDate.getFullYear() === today.getFullYear()
    
    // Set highlighted date only if it's not today
    setHighlightedDate(isTargetToday ? null : targetDate)
    
    // Regenerate days around target date
    const newDays: DayItem[] = []
    for (let i = -INITIAL_DAYS; i <= INITIAL_DAYS; i++) {
      const date = new Date(targetDate)
      date.setDate(targetDate.getDate() + i)
      newDays.push({
        date,
        key: date.toISOString(),
      })
    }
    setDays(newDays)
    // Force FlatList to remount by changing its key
    setListKey(prev => prev + 1)
  }, [])

  const handleGoToDate = () => {
    setMenuOpen(false)
    setShowDatePicker(true)
  }

  const handleGoToToday = () => {
    setMenuOpen(false)
    scrollToDate(today)
  }

  const handleDateChange = (_event: any, date?: Date) => {
    if (date) {
      date.setHours(0, 0, 0, 0)
      setSelectedDate(date)
    }
  }

  const handleGoButton = () => {
    setShowDatePicker(false)
    scrollToDate(selectedDate)
  }

  const loadMorePast = useCallback(() => {
    setDays((prevDays) => {
      const firstDate = prevDays[0].date
      const newDays: DayItem[] = []
      for (let i = LOAD_MORE_DAYS; i > 0; i--) {
        const date = new Date(firstDate)
        date.setDate(firstDate.getDate() - i)
        newDays.push({
          date,
          key: date.toISOString(),
        })
      }
      return [...newDays, ...prevDays]
    })
  }, [])

  const loadMoreFuture = useCallback(() => {
    setDays((prevDays) => {
      const lastDate = prevDays[prevDays.length - 1].date
      const newDays: DayItem[] = []
      for (let i = 1; i <= LOAD_MORE_DAYS; i++) {
        const date = new Date(lastDate)
        date.setDate(lastDate.getDate() + i)
        newDays.push({
          date,
          key: date.toISOString(),
        })
      }
      return [...prevDays, ...newDays]
    })
  }, [])

  const renderItem: ListRenderItem<DayItem> = useCallback(
    ({ item }) => {
      const isToday =
        item.date.getDate() === today.getDate() &&
        item.date.getMonth() === today.getMonth() &&
        item.date.getFullYear() === today.getFullYear()
      const isHighlighted = highlightedDate !== null &&
        item.date.getDate() === highlightedDate.getDate() &&
        item.date.getMonth() === highlightedDate.getMonth() &&
        item.date.getFullYear() === highlightedDate.getFullYear()
      return <DayRow day={item.date} isToday={isToday} isHighlighted={isHighlighted} />
    },
    [today, highlightedDate],
  )

  return (
    <Screen preset="fixed" contentContainerStyle={$screenContainer}>
      <FlatList
        key={listKey}
        ref={flatListRef}
        data={days}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        initialScrollIndex={INITIAL_DAYS - 7}
        getItemLayout={(_, index) => ({
          length: 100,
          offset: 100 * index,
          index,
        })}
        onEndReached={loadMoreFuture}
        onEndReachedThreshold={0.5}
        onStartReached={loadMorePast}
        onStartReachedThreshold={0.5}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
        }}
        style={$flatList}
      />
      
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={$modalOverlay}>
          <View style={$modalContent}>
            <Text text="Bir Tarihe Git" style={$modalTitle} />
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
              style={$datePicker}
            />
            <TouchableOpacity style={$goButton} onPress={handleGoButton} activeOpacity={0.8}>
              <Text text="GİT" style={$goButtonText} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {menuOpen && (
        <View style={$menuContainer}>
          <TouchableOpacity style={$menuButton} onPress={handleGoToDate} activeOpacity={0.8}>
            <Text text="Bir Tarihe Git" style={$menuButtonText} />
          </TouchableOpacity>
          <TouchableOpacity style={$menuButton} onPress={handleGoToToday} activeOpacity={0.8}>
            <Text text="Bugüne Git" style={$menuButtonText} />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={$fab} onPress={() => setMenuOpen(!menuOpen)} activeOpacity={0.8}>
        <Icon icon={menuOpen ? "x" : "menu"} size={24} color="#fff" />
      </TouchableOpacity>
    </Screen>
  )
}

const $screenContainer: ViewStyle = {
  flex: 1,
}

const $flatList: ViewStyle = {
  flex: 1,
}

const $fab: ViewStyle = {
  position: "absolute",
  bottom: 24,
  right: 24,
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: "#333",
  justifyContent: "center",
  alignItems: "center",
  elevation: 6,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.3,
  shadowRadius: 4,
}

const $menuContainer: ViewStyle = {
  position: "absolute",
  bottom: 90,
  right: 24,
  gap: 8,
}

const $menuButton: ViewStyle = {
  backgroundColor: "#555",
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderRadius: 8,
  elevation: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.25,
  shadowRadius: 3,
}

const $menuButtonText: TextStyle = {
  color: "#fff",
  fontSize: 14,
  fontWeight: "600",
}

const $modalOverlay: ViewStyle = {
  flex: 1,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  justifyContent: "center",
  alignItems: "center",
}

const $modalContent: ViewStyle = {
  backgroundColor: "#fff",
  borderRadius: 16,
  padding: 20,
  width: "85%",
  alignItems: "center",
}

const $modalTitle: TextStyle = {
  fontSize: 18,
  fontWeight: "600",
  marginBottom: 16,
  color: "#333",
}

const $datePicker: ViewStyle = {
  width: "100%",
  height: 200,
}

const $goButton: ViewStyle = {
  backgroundColor: "#333",
  paddingHorizontal: 40,
  paddingVertical: 14,
  borderRadius: 8,
  marginTop: 16,
}

const $goButtonText: TextStyle = {
  color: "#fff",
  fontSize: 16,
  fontWeight: "700",
}
