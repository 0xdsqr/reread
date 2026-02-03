import { Ionicons } from "@expo/vector-icons"
import type { Doc } from "@reread/convex/dataModel"
import { useMutation, useQuery } from "convex/react"
import { router } from "expo-router"
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
import { BookCover, EmptyState, StatusBadge } from "~/components"
import type { Id } from "~/lib/api"
import { api } from "~/lib/api"
import { COLORS, type ReadingStatus, STATUS_CONFIG } from "~/lib/constants"

type StatusFilter = "all" | ReadingStatus

type MyBookItem = {
  userBook: Doc<"userBooks">
  book: Doc<"books"> | null
  wordsCount: number
}

const FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "reading", label: "Reading" },
  { key: "finished", label: "Finished" },
  { key: "want-to-read", label: "Want to Read" },
]

export default function Library() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [showAddWord, setShowAddWord] = useState(false)
  const [selectedUserBookId, setSelectedUserBookId] =
    useState<Id<"userBooks"> | null>(null)
  const [wordForm, setWordForm] = useState({
    word: "",
    definition: "",
    context: "",
    pageNumber: "",
  })

  const myBooks = useQuery(api.userBooks.listMine, {
    status: statusFilter === "all" ? undefined : statusFilter,
  })
  const addWord = useMutation(api.words.add)
  const removeBook = useMutation(api.userBooks.remove)
  const updateStatus = useMutation(api.userBooks.updateStatus)

  const handleAddWord = useCallback(async () => {
    if (!selectedUserBookId || !wordForm.word.trim()) return
    try {
      await addWord({
        userBookId: selectedUserBookId,
        word: wordForm.word.trim(),
        definition: wordForm.definition.trim() || undefined,
        context: wordForm.context.trim() || undefined,
        pageNumber: wordForm.pageNumber
          ? parseInt(wordForm.pageNumber)
          : undefined,
      })
      setWordForm({ word: "", definition: "", context: "", pageNumber: "" })
      setShowAddWord(false)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add word"
      Alert.alert("Error", msg)
    }
  }, [selectedUserBookId, wordForm, addWord])

  const handleRemoveBook = useCallback(
    (userBookId: Id<"userBooks">, title: string) => {
      Alert.alert("Remove Book", `Remove "${title}" and all its saved words?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeBook({ userBookId })
            } catch (error: unknown) {
              const msg =
                error instanceof Error ? error.message : "Failed to remove book"
              Alert.alert("Error", msg)
            }
          },
        },
      ])
    },
    [removeBook],
  )

  const handleStatusChange = useCallback(
    async (userBookId: Id<"userBooks">, newStatus: ReadingStatus) => {
      try {
        await updateStatus({ userBookId, status: newStatus })
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Failed to update status"
        Alert.alert("Error", msg)
      }
    },
    [updateStatus],
  )

  const renderBookItem = useCallback(
    ({ item }: { item: MyBookItem }) => {
      const { userBook, book, wordsCount } = item
      if (!book) return null

      return (
        <TouchableOpacity
          className="mx-4 mb-3 rounded-2xl bg-surface p-4 shadow-sm"
          onPress={() => router.push(`/book/${userBook._id}`)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${book.title} by ${book.author}`}
        >
          <View className="flex-row">
            <BookCover coverUrl={book.coverUrl} size="md" />

            <View className="ml-3 flex-1">
              <Text
                className="text-base font-semibold text-text-primary"
                numberOfLines={2}
              >
                {book.title}
              </Text>
              <Text
                className="mt-0.5 text-sm text-text-secondary"
                numberOfLines={1}
              >
                {book.author}
              </Text>

              <View className="mt-2 flex-row items-center gap-2">
                <StatusBadge status={userBook.status} />
                <Text className="text-xs text-text-tertiary">
                  {wordsCount} {wordsCount === 1 ? "word" : "words"}
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View className="mt-3 flex-row items-center gap-2 border-t border-border pt-3">
            {/* Status quick-change */}
            <View className="flex-row gap-1.5">
              {(Object.keys(STATUS_CONFIG) as ReadingStatus[]).map((key) => {
                const isActive = userBook.status === key
                const color = STATUS_CONFIG[key].color
                const lightColor = STATUS_CONFIG[key].lightColor
                return (
                  <TouchableOpacity
                    key={key}
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: isActive
                        ? lightColor
                        : COLORS.surfaceSecondary,
                      borderWidth: isActive ? 1.5 : 0,
                      borderColor: isActive ? color : "transparent",
                    }}
                    onPress={() => handleStatusChange(userBook._id, key)}
                    accessibilityRole="button"
                    accessibilityLabel={`Set status to ${STATUS_CONFIG[key].label}`}
                  >
                    <Ionicons
                      name={
                        key === "reading"
                          ? "book"
                          : key === "finished"
                            ? "checkmark-circle"
                            : "bookmark"
                      }
                      size={16}
                      color={isActive ? color : COLORS.textTertiary}
                    />
                  </TouchableOpacity>
                )
              })}
            </View>

            {/* Add word button */}
            <TouchableOpacity
              className="ml-auto flex-row items-center gap-1 rounded-xl bg-primary px-3 py-2"
              onPress={() => {
                setSelectedUserBookId(userBook._id)
                setShowAddWord(true)
              }}
              accessibilityRole="button"
              accessibilityLabel="Add a word"
            >
              <Ionicons name="add" size={16} color={COLORS.textInverse} />
              <Text className="text-xs font-semibold text-text-inverse">
                Word
              </Text>
            </TouchableOpacity>

            {/* Delete book */}
            <TouchableOpacity
              className="h-9 w-9 items-center justify-center rounded-full"
              onPress={() => handleRemoveBook(userBook._id, book.title)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${book.title}`}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={COLORS.textTertiary}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )
    },
    [handleStatusChange, handleRemoveBook],
  )

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-grow-0 border-b border-border bg-surface"
        contentContainerClassName="px-4 py-3 gap-2"
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            className={`rounded-full px-4 py-2 ${
              statusFilter === f.key ? "bg-primary" : "bg-surface-secondary"
            }`}
            onPress={() => setStatusFilter(f.key)}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${f.label}`}
          >
            <Text
              className={`text-sm font-medium ${
                statusFilter === f.key
                  ? "text-text-inverse"
                  : "text-text-secondary"
              }`}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Book list */}
      {myBooks === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : myBooks.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title={
            statusFilter === "all"
              ? "No books yet"
              : `No ${FILTERS.find((f) => f.key === statusFilter)?.label?.toLowerCase()} books`
          }
          subtitle="Search for books to start building your library"
          actionLabel="Search Books"
          onAction={() => router.push("/(tabs)/search")}
        />
      ) : (
        <FlatList
          data={myBooks}
          keyExtractor={(item) => item.userBook._id}
          renderItem={renderBookItem}
          contentContainerClassName="pt-3 pb-6"
          showsVerticalScrollIndicator={false}
        />
      )}

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
              className="rounded-t-3xl bg-surface px-5 pb-10 pt-6"
              onStartShouldSetResponder={() => true}
            >
              {/* Handle bar */}
              <View className="mb-5 self-center h-1 w-10 rounded-full bg-border-strong" />

              <Text className="mb-5 text-xl font-bold text-text-primary">
                Add a Word
              </Text>

              <TextInput
                className="mb-3 rounded-xl border border-border-strong bg-surface px-4 py-3 text-base text-text-primary"
                placeholder="Word *"
                placeholderTextColor={COLORS.textTertiary}
                value={wordForm.word}
                onChangeText={(t) => setWordForm((f) => ({ ...f, word: t }))}
                autoCapitalize="none"
              />
              <TextInput
                className="mb-3 rounded-xl border border-border-strong bg-surface px-4 py-3 text-base text-text-primary"
                placeholder="Definition"
                placeholderTextColor={COLORS.textTertiary}
                value={wordForm.definition}
                onChangeText={(t) =>
                  setWordForm((f) => ({ ...f, definition: t }))
                }
                multiline
              />
              <TextInput
                className="mb-3 rounded-xl border border-border-strong bg-surface px-4 py-3 text-base text-text-primary"
                placeholder="Context (sentence from book)"
                placeholderTextColor={COLORS.textTertiary}
                value={wordForm.context}
                onChangeText={(t) => setWordForm((f) => ({ ...f, context: t }))}
                multiline
              />
              <TextInput
                className="mb-4 rounded-xl border border-border-strong bg-surface px-4 py-3 text-base text-text-primary"
                placeholder="Page number"
                placeholderTextColor={COLORS.textTertiary}
                value={wordForm.pageNumber}
                onChangeText={(t) =>
                  setWordForm((f) => ({ ...f, pageNumber: t }))
                }
                keyboardType="numeric"
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
                className="mt-2 items-center py-3"
                onPress={() => setShowAddWord(false)}
                accessibilityRole="button"
              >
                <Text className="text-base text-text-secondary">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}
