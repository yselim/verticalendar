import { FC, useState } from "react"
import { ViewStyle } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"

import { Screen } from "@/components/Screen"
import { Text } from "@/components/Text"
import { TextField } from "@/components/TextField"
import { Button } from "@/components/Button"
import type { AppStackParamList } from "@/navigators/navigationTypes"

type AddEditItemScreenProps = NativeStackScreenProps<AppStackParamList, "AddEditItem">

export const AddEditItemScreen: FC<AddEditItemScreenProps> = function AddEditItemScreen({ route }) {
  const { date } = route.params
  const [itemText, setItemText] = useState("")

  const handleSave = () => {
    // TODO: Implement save logic
    console.log("Saving:", itemText)
  }

  return (
    <Screen preset="fixed" safeAreaEdges={["top", "bottom"]} contentContainerStyle={$container}>
      <Text text="Add/Edit Item" preset="heading" />
      <Text text={`Date: ${new Date(date).toLocaleDateString()}`} />
      <TextField
        value={itemText}
        onChangeText={setItemText}
        placeholder="Enter item description"
        style={$textField}
      />
      <Button text="Save" onPress={handleSave} style={$button} />
    </Screen>
  )
}

const $container: ViewStyle = {
  flex: 1,
  padding: 16,
}

const $textField: ViewStyle = {
  marginTop: 16,
}

const $button: ViewStyle = {
  marginTop: 16,
}
