import { Ionicons } from "@expo/vector-icons"
import { Text, TouchableOpacity, View } from "react-native"
import { COLORS } from "../lib/constants"

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap
  title: string
  subtitle?: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-10">
      {icon && (
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary-light">
          <Ionicons name={icon} size={28} color={COLORS.primary} />
        </View>
      )}
      <Text className="mb-1 text-center text-lg font-semibold text-text-primary">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-center text-sm text-text-secondary">
          {subtitle}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          className="mt-5 rounded-xl bg-primary px-6 py-3"
          onPress={onAction}
          accessibilityRole="button"
        >
          <Text className="text-sm font-semibold text-text-inverse">
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
