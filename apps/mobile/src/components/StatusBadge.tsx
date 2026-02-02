import { StyleSheet, Text, View } from "react-native"
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
      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.solidText}>{getStatusLabel(status)}</Text>
      </View>
    )
  }

  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
      <Text style={[styles.tintedText, { color }]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  solidText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  tintedText: { fontSize: 12, fontWeight: "500" },
})
