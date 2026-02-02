import { Text, View } from "react-native"
import { getStatusColor, getStatusLabel } from "../lib/constants"

interface StatusBadgeProps {
  status: string
  /** If true, renders with white text on solid background. Otherwise tinted. */
  solid?: boolean
}

export function StatusBadge({ status, solid = true }: StatusBadgeProps) {
  const color = getStatusColor(status)

  if (solid) {
    return (
      <View
        className="self-start rounded-xl px-2.5 py-1"
        style={{ backgroundColor: color }}
      >
        <Text className="text-xs font-medium text-white">
          {getStatusLabel(status)}
        </Text>
      </View>
    )
  }

  return (
    <View
      className="self-start rounded-xl px-2.5 py-1"
      style={{ backgroundColor: `${color}20` }}
    >
      <Text className="text-xs font-medium" style={{ color }}>
        {getStatusLabel(status)}
      </Text>
    </View>
  )
}
