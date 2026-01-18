import { FC, useCallback, useRef, useState } from "react"
import { FlatList, ListRenderItem, View, ViewStyle } from "react-native"

import { DayRow } from "@/components/DayRow"
import { Screen } from "@/components/Screen"

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
      return <DayRow day={item.date} isToday={isToday} />
    },
    [today],
  )

  return (
    <Screen preset="fixed" contentContainerStyle={$screenContainer}>
      <FlatList
        ref={flatListRef}
        data={days}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        initialScrollIndex={INITIAL_DAYS}
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
    </Screen>
  )
}

const $screenContainer: ViewStyle = {
  flex: 1,
}

const $flatList: ViewStyle = {
  flex: 1,
}
