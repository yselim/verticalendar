import { FC } from "react"
import { ViewStyle } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { Button } from "@/components/Button"

interface DayScreenParams {
  date: string
}

type DayScreenProps = NativeStackScreenProps<{ Day: DayScreenParams }, "Day">

export const DayScreen: FC<DayScreenProps> = function DayScreen({ route, navigation }) {
  const { date } = route.params

  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const handleAddPress = () => {
    navigation.navigate("AddEditItem", { date })
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <Text text={formattedDate} preset="heading" />
      <Button text="Add" onPress={handleAddPress} style={$button} />
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  padding: 16,
}

const $button: ViewStyle = {
  marginTop: "auto",
}
