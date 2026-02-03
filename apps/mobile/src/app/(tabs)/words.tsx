import { Ionicons } from "@expo/vector-icons"
import type { Doc } from "@reread/convex/dataModel"
import { useQuery } from "convex/react"
import { useCallback, useMemo, useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { EmptyState, WordCard } from "~/components"
import { api } from "~/lib/api"
import { COLORS } from "~/lib/constants"

type WordItem = Doc<"words"> & { bookTitle: string; bookAuthor: string }

export default function Words() {
  const [searchQuery, setSearchQuery] = useState("")
  const myWords = useQuery(api.words.listMine, {})

  const filteredWords = useMemo(() => {
    const words = (myWords as WordItem[] | undefined) ?? []
    if (!searchQuery.trim()) return words
    const q = searchQuery.toLowerCase()
    return words.filter(
      (word: WordItem) =>
        word.word.toLowerCase().includes(q) ||
        word.definition?.toLowerCase().includes(q) ||
        word.bookTitle.toLowerCase().includes(q) ||
        word.bookAuthor.toLowerCase().includes(q),
    )
  }, [myWords, searchQuery])

  const renderWordItem = useCallback(
    ({ item }: { item: WordItem }) => (
      <View className="mx-4 mb-3">
        <WordCard
          word={item.word}
          definition={item.definition}
          context={item.context}
          pageNumber={item.pageNumber}
          notes={item.notes}
          bookTitle={item.bookTitle}
          bookAuthor={item.bookAuthor}
          createdAt={item.createdAt}
          likesCount={item.likesCount}
        />
      </View>
    ),
    [],
  )

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Search bar */}
      <View className="border-b border-border bg-surface px-4 py-3">
        <View className="flex-row items-center rounded-xl bg-surface-secondary px-3 py-2.5">
          <Ionicons name="search" size={18} color={COLORS.textTertiary} />
          <TextInput
            className="ml-2 flex-1 text-base text-text-primary"
            placeholder="Search words, definitions, or books..."
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              className="h-7 w-7 items-center justify-center rounded-full bg-border-strong"
              onPress={() => setSearchQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      {myWords === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : filteredWords.length === 0 ? (
        <EmptyState
          icon="text-outline"
          title={
            myWords.length === 0
              ? "No words saved yet"
              : "No words match your search"
          }
          subtitle={
            myWords.length === 0
              ? "Start reading and save words you want to remember"
              : "Try a different search term"
          }
        />
      ) : (
        <>
          <Text className="mx-4 mt-3 mb-1 text-xs font-medium text-text-tertiary">
            {filteredWords.length}{" "}
            {filteredWords.length === 1 ? "word" : "words"}
            {searchQuery.trim() ? " found" : " total"}
          </Text>
          <FlatList
            data={filteredWords}
            renderItem={renderWordItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pt-2 pb-6"
          />
        </>
      )}
    </View>
  )
}
