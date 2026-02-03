import { useAuthActions } from "@convex-dev/auth/react"
import { Ionicons } from "@expo/vector-icons"
import { useQuery } from "convex/react"
import { router } from "expo-router"
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { EmptyState } from "~/components"
import { api } from "~/lib/api"
import { COLORS, formatDate } from "~/lib/constants"

export default function Profile() {
  const user = useQuery(api.users.getMe)
  const allWords = useQuery(api.words.listMine, {})
  const { signOut } = useAuthActions()

  if (user === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-surface">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!user) {
    return (
      <EmptyState
        icon="person-outline"
        title="Not signed in"
        subtitle="Please sign in to view your profile"
      />
    )
  }

  const recentWords = (allWords ?? []).slice(0, 15)
  const stats = [
    {
      label: "Books",
      value: user.stats?.booksCount ?? 0,
      icon: "library-outline" as const,
    },
    {
      label: "Words",
      value: user.stats?.wordsCount ?? 0,
      icon: "text-outline" as const,
    },
    {
      label: "Streak",
      value: user.stats?.currentStreak ?? 0,
      icon: "flame-outline" as const,
    },
  ]

  return (
    <ScrollView className="flex-1 bg-surface-secondary">
      {/* Profile header */}
      <View className="items-center bg-surface px-6 pb-6 pt-8">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary">
          <Text className="text-3xl font-bold text-text-inverse">
            {(user.username || user.email || "?")[0]?.toUpperCase()}
          </Text>
        </View>
        <Text className="text-xl font-bold text-text-primary">
          {user.username || user.email}
        </Text>
        {user.bio && (
          <Text className="mt-1 text-center text-sm text-text-secondary">
            {user.bio}
          </Text>
        )}
      </View>

      {/* Stats */}
      <View className="mx-4 -mt-1 mb-4 flex-row rounded-2xl bg-surface p-4 shadow-sm">
        {stats.map((stat, i) => (
          <View key={stat.label} className="flex-1 items-center">
            {i > 0 && (
              <View className="absolute left-0 top-1 bottom-1 w-px bg-border" />
            )}
            <Ionicons name={stat.icon} size={20} color={COLORS.primary} />
            <Text className="mt-1 text-2xl font-bold text-text-primary">
              {stat.value}
            </Text>
            <Text className="mt-0.5 text-xs text-text-secondary">
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Recent words */}
      <View className="mx-4 mb-4 rounded-2xl bg-surface p-4 shadow-sm">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-base font-bold text-text-primary">
            Recent Words
          </Text>
          {(allWords?.length ?? 0) > 0 && (
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/words")}
              accessibilityRole="button"
            >
              <Text className="text-sm font-medium text-primary">See All</Text>
            </TouchableOpacity>
          )}
        </View>

        {allWords === undefined ? (
          <ActivityIndicator size="small" color={COLORS.primary} />
        ) : allWords.length === 0 ? (
          <View className="items-center py-4">
            <Text className="text-center text-sm text-text-tertiary">
              No words saved yet. Start reading!
            </Text>
          </View>
        ) : (
          recentWords.map((item, i) => (
            <View
              key={item._id}
              className={`flex-row items-center justify-between py-3 ${
                i < recentWords.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <View className="flex-1 mr-3">
                <Text className="text-base font-semibold text-text-primary">
                  {item.word}
                </Text>
                {item.definition && (
                  <Text
                    className="mt-0.5 text-sm text-text-secondary"
                    numberOfLines={1}
                  >
                    {item.definition}
                  </Text>
                )}
              </View>
              <View className="items-end">
                <Text className="text-xs text-text-tertiary" numberOfLines={1}>
                  {item.bookTitle}
                </Text>
                <Text className="mt-0.5 text-xs text-text-tertiary">
                  {formatDate(item.createdAt)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity
        className="mx-4 mb-10 flex-row items-center justify-center gap-2 rounded-xl border border-danger py-4"
        onPress={() => signOut()}
        accessibilityRole="button"
        accessibilityLabel="Sign out"
      >
        <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
        <Text className="text-base font-semibold text-danger">Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}
