import { FC, useCallback, useRef, useState } from "react"
import { View, ViewStyle, TouchableOpacity, TextStyle } from "react-native"
import { FlashList, FlashListRef } from "@shopify/flash-list"
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

  const flashListRef = useRef<FlashListRef<DayItem>>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
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
    // Force FlashList to remount by changing its key
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

  const handleDateChange = (event: any, date?: Date) => {
    // Close the picker on any interaction (OK, Cancel, or selection on iOS)
    setShowDatePicker(false)
    if (event.type === 'set' && date) {
      date.setHours(0, 0, 0, 0)
      scrollToDate(date)
    }
  }

  const isLoadingRef = useRef(false)

  const loadMorePast = useCallback(() => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    
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
    
    // Reset loading flag after a short delay
    setTimeout(() => {
      isLoadingRef.current = false
    }, 100)
  }, [])

  const loadMoreFuture = useCallback(() => {
    if (isLoadingRef.current) return
    isLoadingRef.current = true
    
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
    
    // Reset loading flag after a short delay
    setTimeout(() => {
      isLoadingRef.current = false
    }, 100)
  }, [])

  const renderItem = useCallback(
    ({ item }: { item: DayItem }) => {
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
      <FlashList
        key={listKey}
        ref={flashListRef}
        data={days}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        initialScrollIndex={INITIAL_DAYS - 7}
        onEndReached={loadMoreFuture}
        onEndReachedThreshold={0.5}
        onStartReached={loadMorePast}
        onStartReachedThreshold={0.5}
      />
      
      {showDatePicker && (
        <DateTimePicker
          value={today}
          mode="date"
          display="calendar"
          onChange={handleDateChange}
        />
      )}

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
