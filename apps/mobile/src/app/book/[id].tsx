import { Ionicons } from "@expo/vector-icons"
import { useMutation, useQuery } from "convex/react"
import { Stack, useLocalSearchParams } from "expo-router"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { BookCover, EmptyState, StatusBadge, WordCard } from "~/components"
import type { Id } from "~/lib/api"
import { api } from "~/lib/api"
import { COLORS, formatDate } from "~/lib/constants"

function isValidUserBookId(id: string): id is Id<"userBooks"> {
  return typeof id === "string" && id.startsWith("userBooks:")
}

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [showAddWord, setShowAddWord] = useState(false)
  const [wordForm, setWordForm] = useState({
    word: "",
    definition: "",
    context: "",
    pageNumber: "",
    notes: "",
  })

  const userBookId: Id<"userBooks"> | undefined =
    id && isValidUserBookId(id) ? id : undefined

  const currentBook = useQuery(
    api.userBooks.getById,
    userBookId ? { userBookId } : "skip",
  )
  const wordsForBook = useQuery(
    api.words.listByUserBook,
    userBookId && currentBook ? { userBookId } : "skip",
  )
  const addWord = useMutation(api.words.add)

  const handleAddWord = useCallback(async () => {
    if (!wordForm.word.trim() || !userBookId) return

    try {
      await addWord({
        userBookId,
        word: wordForm.word.trim(),
        definition: wordForm.definition.trim() || undefined,
        context: wordForm.context.trim() || undefined,
        pageNumber: wordForm.pageNumber
          ? parseInt(wordForm.pageNumber, 10)
          : undefined,
        notes: wordForm.notes.trim() || undefined,
      })

      setWordForm({
        word: "",
        definition: "",
        context: "",
        pageNumber: "",
        notes: "",
      })
      setShowAddWord(false)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add word"
      Alert.alert("Error", msg)
    }
  }, [wordForm, userBookId, addWord])

  const renderWordItem = useCallback(
    ({
      item,
    }: {
      item: typeof wordsForBook extends (infer T)[] | undefined ? T : never
    }) => (
      <View className="mx-5 mb-3">
        <WordCard
          word={item.word}
          definition={item.definition}
          context={item.context}
          pageNumber={item.pageNumber}
          notes={item.notes}
          createdAt={item.createdAt}
        />
      </View>
    ),
    [],
  )

  if (currentBook === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-surface-secondary">
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    )
  }

  if (!currentBook) {
    return (
      <View className="flex-1 bg-surface-secondary">
        <Stack.Screen options={{ title: "Not Found" }} />
        <EmptyState
          icon="alert-circle-outline"
          title="Book not found"
          subtitle="This book may have been removed from your library"
        />
      </View>
    )
  }

  const { book, userBook } = currentBook

  return (
    <View className="flex-1 bg-surface-secondary">
      <Stack.Screen
        options={{
          title: book?.title || "Book Detail",
          headerBackTitle: "Library",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: COLORS.surface },
        }}
      />

      <FlatList
        data={wordsForBook ?? []}
        keyExtractor={(item) => item._id}
        renderItem={renderWordItem}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-6"
        ListHeaderComponent={
          <>
            {/* Book header */}
            <View className="bg-surface px-5 pb-5 pt-2">
              <View className="flex-row">
                <BookCover coverUrl={book?.coverUrl} size="lg" />

                <View className="ml-4 flex-1">
                  <Text className="text-xl font-bold text-text-primary">
                    {book?.title || "Unknown Title"}
                  </Text>
                  <Text className="mt-1 text-base text-text-secondary">
                    {book?.author || "Unknown Author"}
                  </Text>

                  <View className="mt-3">
                    <StatusBadge status={userBook.status} solid />
                  </View>

                  {book?.firstPublishYear && (
                    <Text className="mt-2 text-sm text-text-tertiary">
                      Published {book.firstPublishYear}
                    </Text>
                  )}
                </View>
              </View>

              {userBook.notes && (
                <View className="mt-4 rounded-xl bg-surface-secondary p-3">
                  <Text className="text-sm italic leading-5 text-text-secondary">
                    "{userBook.notes}"
                  </Text>
                </View>
              )}
            </View>

            {/* Words header */}
            <View className="flex-row items-center justify-between px-5 pb-3 pt-5">
              <Text className="text-base font-bold text-text-primary">
                Words ({wordsForBook?.length ?? 0})
              </Text>
              <TouchableOpacity
                className="flex-row items-center gap-1 rounded-xl bg-primary px-4 py-2.5"
                onPress={() => setShowAddWord(true)}
                accessibilityRole="button"
              >
                <Ionicons name="add" size={18} color={COLORS.textInverse} />
                <Text className="text-sm font-semibold text-text-inverse">
                  Add Word
                </Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListEmptyComponent={
          wordsForBook === undefined ? (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              className="my-10"
            />
          ) : (
            <View className="items-center px-8 py-10">
              <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-primary-light">
                <Ionicons
                  name="text-outline"
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <Text className="text-center text-base font-semibold text-text-primary">
                No words yet
              </Text>
              <Text className="mt-1 text-center text-sm text-text-secondary">
                Tap "Add Word" to save vocabulary as you read
              </Text>
            </View>
          )
        }
      />

      {/* Add Word Modal */}
      <Modal
        visible={showAddWord}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddWord(false)}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            className="flex-1 justify-end bg-black/40"
            activeOpacity={1}
            onPress={() => setShowAddWord(false)}
          >
            <View
              className="max-h-[85%] rounded-t-3xl bg-surface pt-6"
              onStartShouldSetResponder={() => true}
            >
              <View className="mb-5 self-center h-1 w-10 rounded-full bg-border-strong" />

              <ScrollView className="px-5" keyboardShouldPersistTaps="handled">
                <Text className="mb-5 text-xl font-bold text-text-primary">
                  Add a Word
                </Text>

                <Text className="mb-2 text-sm font-medium text-text-secondary">
                  Word *
                </Text>
                <TextInput
                  className="mb-4 rounded-xl border border-border-strong px-4 py-3 text-base text-text-primary"
                  placeholder="Enter the word"
                  placeholderTextColor={COLORS.textTertiary}
                  value={wordForm.word}
                  onChangeText={(t) => setWordForm((f) => ({ ...f, word: t }))}
                  autoCapitalize="none"
                />

                <Text className="mb-2 text-sm font-medium text-text-secondary">
                  Definition
                </Text>
                <TextInput
                  className="mb-4 min-h-20 rounded-xl border border-border-strong px-4 py-3 text-base text-text-primary"
                  placeholder="What does it mean?"
                  placeholderTextColor={COLORS.textTertiary}
                  value={wordForm.definition}
                  onChangeText={(t) =>
                    setWordForm((f) => ({ ...f, definition: t }))
                  }
                  multiline
                  textAlignVertical="top"
                />

                <Text className="mb-2 text-sm font-medium text-text-secondary">
                  Context
                </Text>
                <TextInput
                  className="mb-4 min-h-20 rounded-xl border border-border-strong px-4 py-3 text-base text-text-primary"
                  placeholder="How was it used in the book?"
                  placeholderTextColor={COLORS.textTertiary}
                  value={wordForm.context}
                  onChangeText={(t) =>
                    setWordForm((f) => ({ ...f, context: t }))
                  }
                  multiline
                  textAlignVertical="top"
                />

                <Text className="mb-2 text-sm font-medium text-text-secondary">
                  Page Number
                </Text>
                <TextInput
                  className="mb-4 rounded-xl border border-border-strong px-4 py-3 text-base text-text-primary"
                  placeholder="Optional"
                  placeholderTextColor={COLORS.textTertiary}
                  value={wordForm.pageNumber}
                  onChangeText={(t) =>
                    setWordForm((f) => ({ ...f, pageNumber: t }))
                  }
                  keyboardType="numeric"
                />

                <Text className="mb-2 text-sm font-medium text-text-secondary">
                  Notes
                </Text>
                <TextInput
                  className="mb-6 min-h-20 rounded-xl border border-border-strong px-4 py-3 text-base text-text-primary"
                  placeholder="Personal notes"
                  placeholderTextColor={COLORS.textTertiary}
                  value={wordForm.notes}
                  onChangeText={(t) => setWordForm((f) => ({ ...f, notes: t }))}
                  multiline
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  className="items-center rounded-xl bg-primary py-4"
                  style={!wordForm.word.trim() ? { opacity: 0.4 } : undefined}
                  onPress={handleAddWord}
                  disabled={!wordForm.word.trim()}
                  accessibilityRole="button"
                >
                  <Text className="text-base font-semibold text-text-inverse">
                    Save Word
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="mb-10 mt-2 items-center py-3"
                  onPress={() => setShowAddWord(false)}
                  accessibilityRole="button"
                >
                  <Text className="text-base text-text-secondary">Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
