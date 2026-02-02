import { Image, Text, View } from "react-native"

interface BookCoverProps {
  coverUrl?: string | null
  size?: "small" | "medium" | "large"
}

const SIZES = {
  small: { width: 48, height: 68 },
  medium: { width: 56, height: 80 },
  large: { width: 80, height: 120 },
}

export function BookCover({ coverUrl, size = "medium" }: BookCoverProps) {
  const dimensions = SIZES[size]

  if (coverUrl) {
    return (
      <Image
        source={{ uri: coverUrl }}
        className="rounded-md"
        style={dimensions}
        resizeMode="cover"
      />
    )
  }

  return (
    <View
      className="items-center justify-center rounded-md bg-gray-200"
      style={dimensions}
    >
      <Text className="text-[10px] text-gray-500">No Cover</Text>
    </View>
  )
}
