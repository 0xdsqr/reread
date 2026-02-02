import type { Doc } from "@reread/convex/dataModel"
import { useQuery } from "convex/react"
import { useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  View,
} from "react-native"
import { api } from "../../lib/api"
import { ACCENT, formatDate } from "../../lib/constants"

// words.listMine returns word docs enriched with bookTitle/bookAuthor
type WordItem = Doc<"words"> & { bookTitle: string; bookAuthor: string }

export default function Words() {
  const [searchQuery, setSearchQuery] = useState("")
  const myWords = useQuery(api.words.listMine, {})

  const filteredWords =
    (myWords as WordItem[] | undefined)?.filter((word: WordItem) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        word.word.toLowerCase().includes(q) ||
        word.definition?.toLowerCase().includes(q) ||
        word.bookTitle.toLowerCase().includes(q) ||
        word.bookAuthor.toLowerCase().includes(q)
      )
    }) ?? []

  const renderWordItem = ({ item }: { item: WordItem }) => (
    <View className="mb-3 mx-4 rounded-lg bg-white p-4 shadow-sm elevation-2">
      <View className="mb-2 flex-row items-start">
        <Text className="flex-1 text-xl font-bold text-gray-900">
          {item.word}
        </Text>
        {item.pageNumber != null && (
          <Text className="rounded-xl bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            p. {item.pageNumber}
          </Text>
        )}
      </View>

      {item.definition && (
        <Text className="mb-2 text-base text-gray-700">{item.definition}</Text>
      )}

      {item.context && (
        <View className="mb-2 rounded-md bg-gray-50 p-3">
          <Text className="text-sm italic text-gray-500">
            &ldquo;{item.context}&rdquo;
          </Text>
        </View>
      )}

      {item.notes && (
        <Text className="mb-2 text-sm text-gray-500">Note: {item.notes}</Text>
      )}

      <View className="flex-row items-center justify-between border-t border-gray-100 pt-2">
        <View>
          <Text className="text-xs font-medium text-gray-700">
            {item.bookTitle}
          </Text>
          <Text className="text-[11px] text-gray-400">
            by {item.bookAuthor}
          </Text>
        </View>
        <View className="items-end">
          <Text className="text-[11px] text-gray-400">
            {formatDate(item.createdAt)}
          </Text>
          {item.likesCount > 0 && (
            <Text className="text-[11px] text-red-500">
              {item.likesCount} {item.likesCount === 1 ? "like" : "likes"}
            </Text>
          )}
        </View>
      </View>
    </View>
  )

  return (
    <View className="flex-1 bg-gray-50">
      <Text className="m-4 mb-2 text-2xl font-bold text-gray-900">
        My Words
      </Text>

      <TextInput
        className="mx-4 mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-base"
        placeholder="Search words, definitions, or books..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {myWords === undefined ? (
        <View className="flex-1 items-center justify-center px-8">
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : filteredWords.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="mb-2 text-center text-lg text-gray-500">
            {myWords.length === 0
              ? "No words saved yet"
              : "No words match your search"}
          </Text>
          <Text className="text-center text-sm text-gray-400">
            {myWords.length === 0
              ? "Start reading books and save words you want to remember"
              : "Try a different search term"}
          </Text>
        </View>
      ) : (
        <>
          <Text className="mx-4 mb-2 text-sm text-gray-500">
            {filteredWords.length}{" "}
            {filteredWords.length === 1 ? "word" : "words"} found
          </Text>
          <FlatList
            data={filteredWords}
            renderItem={renderWordItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-5"
          />
        </>
      )}
    </View>
  )
}
