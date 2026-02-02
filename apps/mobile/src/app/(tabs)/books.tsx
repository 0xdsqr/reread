import type { Doc } from "@reread/convex/dataModel"
import { useQuery } from "convex/react"
import { router } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { api } from "../../lib/api"
import type { ReadingStatus } from "../../lib/constants"
import {
  ACCENT,
  getStatusColor,
  getStatusLabel,
  STATUS_CONFIG,
} from "../../lib/constants"

interface BookItem {
  userBook: Doc<"userBooks">
  book: Doc<"books"> | null
  wordsCount: number
}

type StatusFilter = ReadingStatus | "all"

const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All Books" },
  ...(Object.keys(STATUS_CONFIG) as ReadingStatus[]).map((key) => ({
    key,
    label: STATUS_CONFIG[key].label,
  })),
]

export default function Books() {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all")

  const myBooks = useQuery(api.userBooks.listMine, {
    status: selectedStatus === "all" ? undefined : selectedStatus,
  })

  const renderBookItem = ({ item }: { item: BookItem }) => (
    <TouchableOpacity
      onPress={() => router.push(`/book/${item.userBook._id}`)}
      className="mb-3 mx-4 flex-row rounded-lg bg-white p-4 shadow-sm elevation-2"
    >
      {item.book?.coverUrl ? (
        <Image
          source={{ uri: item.book.coverUrl }}
          className="mr-3 h-20 w-[60px] rounded"
          resizeMode="cover"
        />
      ) : (
        <View className="mr-3 h-20 w-[60px] items-center justify-center rounded bg-neutral-200">
          <Text className="text-[10px] text-gray-500">No Cover</Text>
        </View>
      )}

      <View className="flex-1">
        <Text
          className="mb-1 text-base font-semibold text-gray-900"
          numberOfLines={2}
        >
          {item.book?.title || "Unknown Title"}
        </Text>
        <Text className="mb-2 text-sm text-gray-500" numberOfLines={1}>
          by {item.book?.author || "Unknown Author"}
        </Text>

        <View className="flex-row items-center justify-between">
          <View
            className="rounded-xl px-2 py-1"
            style={{ backgroundColor: getStatusColor(item.userBook.status) }}
          >
            <Text className="text-xs font-medium text-white">
              {getStatusLabel(item.userBook.status)}
            </Text>
          </View>
          <Text className="text-xs text-gray-500">
            {item.wordsCount} {item.wordsCount === 1 ? "word" : "words"}
          </Text>
        </View>

        {item.userBook.notes && (
          <Text className="mt-2 text-xs italic text-gray-500" numberOfLines={2}>
            &ldquo;{item.userBook.notes}&rdquo;
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View className="flex-1 bg-gray-50">
      <Text className="m-4 mb-2 text-2xl font-bold text-gray-900">
        My Books
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mb-4"
        contentContainerClassName="px-4"
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            className={`mr-2 rounded-full px-4 py-2 ${selectedStatus === option.key ? "bg-indigo-500" : "bg-gray-100"}`}
            onPress={() => setSelectedStatus(option.key)}
          >
            <Text
              className={`font-medium ${selectedStatus === option.key ? "text-white" : "text-gray-700"}`}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {myBooks === undefined ? (
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : myBooks.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 text-center text-lg text-gray-500">
            {selectedStatus === "all"
              ? "No books in your library yet"
              : `No ${getStatusLabel(selectedStatus).toLowerCase()} books`}
          </Text>
          <Text className="text-center text-sm text-gray-400">
            Use the Search tab to add books to your library
          </Text>
        </View>
      ) : (
        <FlatList
          data={myBooks as BookItem[]}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.userBook._id}
          showsVerticalScrollIndicator={false}
          contentContainerClassName="pb-5"
        />
      )}
    </View>
  )
}
