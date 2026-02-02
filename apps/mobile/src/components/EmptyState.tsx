import { Text, View } from "react-native"

interface EmptyStateProps {
  icon?: string
  title: string
  subtitle?: string
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      {icon && <Text className="mb-3 text-5xl">{icon}</Text>}
      <Text className="mb-2 text-center text-lg font-bold text-gray-500">
        {title}
      </Text>
      {subtitle && (
        <Text className="text-center text-sm text-gray-400">{subtitle}</Text>
      )}
    </View>
  )
}
