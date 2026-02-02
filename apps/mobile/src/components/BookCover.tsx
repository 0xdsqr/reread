import { Image, StyleSheet, Text, View } from "react-native"

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
        style={[styles.cover, dimensions]}
        resizeMode="cover"
      />
    )
  }

  return (
    <View style={[styles.cover, styles.noCover, dimensions]}>
      <Text style={styles.noCoverText}>No Cover</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  cover: { borderRadius: 6 },
  noCover: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  noCoverText: { fontSize: 10, color: "#6b7280" },
})
