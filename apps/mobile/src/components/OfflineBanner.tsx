import { Ionicons } from "@expo/vector-icons"
import { Text, View } from "react-native"

export function OfflineBanner() {
  return (
    <View className="flex-row items-center justify-center gap-2 bg-warning px-4 py-2.5">
      <Ionicons name="cloud-offline-outline" size={16} color="#ffffff" />
      <Text className="text-sm font-semibold text-text-inverse">
        You're offline
      </Text>
    </View>
  )
}
