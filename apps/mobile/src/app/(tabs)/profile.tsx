import { useAuthActions } from "@convex-dev/auth/react"
import { useQuery } from "convex/react"
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { api } from "../../lib/api"

export default function Profile() {
  const user = useQuery(api.users.getMe)
  const allWords = useQuery(api.words.listMine, {})
  const { signOut } = useAuthActions()

  if (user === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    )
  }

  if (!user) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-xl font-bold text-gray-900">Not signed in</Text>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      {/* Profile header */}
      <View className="items-center pb-4 pt-6">
        <View className="mb-3 h-[72px] w-[72px] items-center justify-center rounded-full bg-indigo-500">
          <Text className="text-[28px] font-bold text-white">
            {(user.username || user.email || "?")[0]?.toUpperCase()}
          </Text>
        </View>
        <Text className="text-xl font-bold text-gray-900">
          {user.username || user.email}
        </Text>
        {user.bio && (
          <Text className="mt-1 px-10 text-center text-sm text-gray-500">
            {user.bio}
          </Text>
        )}
      </View>

      {/* Stats row */}
      <View className="mx-6 flex-row items-center justify-center border-y border-gray-100 py-4">
        <View className="flex-1 items-center">
          <Text className="text-[22px] font-bold text-gray-900">
            {user.stats?.booksCount ?? 0}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">Books</Text>
        </View>
        <View className="h-8 w-px bg-gray-200" />
        <View className="flex-1 items-center">
          <Text className="text-[22px] font-bold text-gray-900">
            {user.stats?.wordsCount ?? 0}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">Words</Text>
        </View>
        <View className="h-8 w-px bg-gray-200" />
        <View className="flex-1 items-center">
          <Text className="text-[22px] font-bold text-gray-900">
            {user.stats?.currentStreak ?? 0}
          </Text>
          <Text className="mt-0.5 text-xs text-gray-500">Day Streak</Text>
        </View>
      </View>

      {/* Recent words */}
      <View className="flex-1 px-4 pt-4">
        <Text className="mb-3 text-lg font-bold text-gray-900">
          Recent Words
        </Text>
        {allWords === undefined ? (
          <ActivityIndicator size="small" color="#6366f1" />
        ) : allWords.length === 0 ? (
          <View className="items-center p-5">
            <Text className="text-center text-sm text-gray-400">
              No words saved yet. Start reading and add words from your books!
            </Text>
          </View>
        ) : (
          <FlatList
            data={allWords.slice(0, 20)}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="flex-row items-center justify-between border-b border-gray-100 py-2.5">
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    {item.word}
                  </Text>
                  {item.definition && (
                    <Text
                      className="mt-0.5 text-[13px] text-gray-500"
                      numberOfLines={1}
                    >
                      {item.definition}
                    </Text>
                  )}
                </View>
                <Text
                  className="max-w-[120px] text-right text-xs text-gray-400"
                  numberOfLines={1}
                >
                  {item.bookTitle}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity
        className="m-4 items-center rounded-xl border border-red-500 p-3.5"
        onPress={() => signOut()}
      >
        <Text className="text-base font-semibold text-red-500">Sign Out</Text>
      </TouchableOpacity>
    </View>
  )
}
