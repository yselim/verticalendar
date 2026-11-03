import { Image, ImageStyle, StyleProp, View, ViewProps, ViewStyle } from "react-native"

import { colors } from "@/theme/colors"

export type IconTypes = keyof typeof iconRegistry

interface IconProps extends Omit<ViewProps, "style"> {
  /**
   * The name of the icon
   */
  icon: IconTypes
  /**
   * An optional tint color for the icon
   */
  color?: string
  /**
   * An optional size for the icon. If not provided, the icon will be sized to the icon's resolution.
   */
  size?: number
  /**
   * Style overrides for the icon image
   */
  style?: StyleProp<ImageStyle>
  /**
   * Style overrides for the icon container
   */
  containerStyle?: StyleProp<ViewStyle>
}

/**
 * Renders one of the bundled PNG icons, tinted with `color`.
 */
export function Icon(props: IconProps) {
  const {
    icon,
    color,
    size,
    style: $imageStyleOverride,
    containerStyle: $containerStyleOverride,
    ...viewProps
  } = props

  const $imageStyle: StyleProp<ImageStyle> = [
    $imageStyleBase,
    { tintColor: color ?? colors.text },
    size !== undefined && { width: size, height: size },
    $imageStyleOverride,
  ]

  return (
    <View {...viewProps} style={$containerStyleOverride}>
      <Image style={$imageStyle} source={iconRegistry[icon]} />
    </View>
  )
}

export const iconRegistry = {
  bell: require("@assets/icons/bell.png"),
  check: require("@assets/icons/check.png"),
  menu: require("@assets/icons/menu.png"),
  settings: require("@assets/icons/settings.png"),
  x: require("@assets/icons/x.png"),
}

const $imageStyleBase: ImageStyle = {
  resizeMode: "contain",
}
