import { Text, View } from "react-native"

export function OfflineBanner() {
  return (
    <View className="bg-amber-500 py-2 px-4 items-center">
      <Text className="text-white font-semibold text-sm">⚠️ Offline Mode</Text>
    </View>
  )
}
