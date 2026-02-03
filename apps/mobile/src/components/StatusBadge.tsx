import { Text, View } from "react-native"
import {
  getStatusColor,
  getStatusLabel,
  getStatusLightColor,
  type ReadingStatus,
} from "../lib/constants"

interface StatusBadgeProps {
  status: ReadingStatus
  /** If true, renders with white text on solid background. Otherwise tinted. */
  solid?: boolean
}

export function StatusBadge({ status, solid = false }: StatusBadgeProps) {
  const color = getStatusColor(status)
  const lightColor = getStatusLightColor(status)

  if (solid) {
    return (
      <View
        className="self-start rounded-lg px-2.5 py-1"
        style={{ backgroundColor: color }}
      >
        <Text className="text-xs font-semibold text-text-inverse">
          {getStatusLabel(status)}
        </Text>
      </View>
    )
  }

  return (
    <View
      className="self-start rounded-lg px-2.5 py-1"
      style={{ backgroundColor: lightColor }}
    >
      <Text className="text-xs font-semibold" style={{ color }}>
        {getStatusLabel(status)}
      </Text>
    </View>
  )
}
