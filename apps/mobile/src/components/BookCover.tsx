import { Ionicons } from "@expo/vector-icons"
import { Image, View } from "react-native"
import { COLORS } from "../lib/constants"

interface BookCoverProps {
  coverUrl?: string | null
  size?: "sm" | "md" | "lg"
}

const SIZES = {
  sm: { width: 48, height: 72 },
  md: { width: 60, height: 90 },
  lg: { width: 80, height: 120 },
} as const

const ICON_SIZES = { sm: 18, md: 22, lg: 28 } as const

export function BookCover({ coverUrl, size = "md" }: BookCoverProps) {
  const dimensions = SIZES[size]
  const iconSize = ICON_SIZES[size]

  if (coverUrl) {
    return (
      <Image
        source={{ uri: coverUrl }}
        className="rounded-xl"
        style={dimensions}
        resizeMode="cover"
        accessibilityLabel="Book cover"
      />
    )
  }

  return (
    <View
      className="items-center justify-center rounded-xl bg-surface-secondary"
      style={dimensions}
    >
      <Ionicons
        name="book-outline"
        size={iconSize}
        color={COLORS.textTertiary}
      />
    </View>
  )
}
