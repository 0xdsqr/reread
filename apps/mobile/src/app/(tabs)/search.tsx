import { Ionicons } from "@expo/vector-icons"
import { useAction, useMutation } from "convex/react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { BookCover, EmptyState } from "~/components"
import { api } from "~/lib/api"
import { COLORS, type ReadingStatus, STATUS_CONFIG } from "~/lib/constants"

type BookResult = {
  key: string
  title: string
  author: string
  coverUrl?: string
  isbn?: string
  firstPublishYear?: number
}

export default function Search() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<BookResult[] | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedBook, setSelectedBook] = useState<BookResult | null>(null)
  const [showStatusPicker, setShowStatusPicker] = useState(false)

  const searchBooks = useAction(api.books.search)
  const addBook = useMutation(api.userBooks.add)

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null)
      setIsSearching(false)
      return
    }

    setIsSearching(true)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    const requestId = ++requestIdRef.current
    debounceTimer.current = setTimeout(async () => {
      try {
        const data = await searchBooks({ query: query.trim() })
        if (requestId === requestIdRef.current) {
          setResults(data as BookResult[])
        }
      } catch {
        if (requestId === requestIdRef.current) {
          setResults([])
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setIsSearching(false)
        }
      }
    }, 400)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [query, searchBooks])

  const handleAddBook = useCallback(
    async (status: ReadingStatus) => {
      if (!selectedBook) return
      try {
        await addBook({
          openLibraryKey: selectedBook.key,
          title: selectedBook.title,
          author: selectedBook.author,
          coverUrl: selectedBook.coverUrl,
          isbn: selectedBook.isbn,
          firstPublishYear: selectedBook.firstPublishYear,
          status,
        })
        setShowStatusPicker(false)
        setSelectedBook(null)
        Alert.alert("Added!", `"${selectedBook.title}" added to your library.`)
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Something went wrong"
        Alert.alert("Oops", msg)
      }
    },
    [selectedBook, addBook],
  )

  const renderBook = useCallback(
    ({ item }: { item: BookResult }) => (
      <TouchableOpacity
        className="mx-4 mb-3 flex-row items-center rounded-2xl bg-surface p-3 shadow-sm"
        onPress={() => {
          setSelectedBook(item)
          setShowStatusPicker(true)
        }}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityHint="Tap to add this book to your library"
      >
        <BookCover coverUrl={item.coverUrl} size="sm" />
        <View className="ml-3 flex-1">
          <Text
            className="text-base font-semibold text-text-primary"
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text
            className="mt-0.5 text-sm text-text-secondary"
            numberOfLines={1}
          >
            {item.author}
          </Text>
          {item.firstPublishYear != null && (
            <Text className="mt-0.5 text-xs text-text-tertiary">
              {item.firstPublishYear}
            </Text>
          )}
        </View>
        <View className="ml-2 h-9 w-9 items-center justify-center rounded-full bg-primary-light">
          <Ionicons name="add" size={20} color={COLORS.primary} />
        </View>
      </TouchableOpacity>
    ),
    [],
  )

  const statusOptions: {
    key: ReadingStatus
    label: string
    icon: keyof typeof Ionicons.glyphMap
  }[] = [
    { key: "reading", label: "Currently Reading", icon: "book" },
    { key: "finished", label: "Finished", icon: "checkmark-circle" },
    { key: "want-to-read", label: "Want to Read", icon: "bookmark" },
  ]

  return (
    <View className="flex-1 bg-surface-secondary">
      {/* Search bar */}
      <View className="border-b border-border bg-surface px-4 py-3">
        <View className="flex-row items-center rounded-xl bg-surface-secondary px-3 py-2.5">
          <Ionicons name="search" size={18} color={COLORS.textTertiary} />
          <TextInput
            className="ml-2 flex-1 text-base text-text-primary"
            placeholder="Search by title, author, or ISBN..."
            placeholderTextColor={COLORS.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity
              className="h-7 w-7 items-center justify-center rounded-full bg-border-strong"
              onPress={() => setQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons name="close" size={14} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {query.trim().length < 2 ? (
        <EmptyState
          icon="search-outline"
          title="Find Your Next Read"
          subtitle="Search by title, author, or ISBN"
        />
      ) : isSearching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text className="mt-3 text-sm text-text-secondary">Searching...</Text>
        </View>
      ) : results !== null && results.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="No Results"
          subtitle="Try a different search term"
        />
      ) : results !== null ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.key}
          renderItem={renderBook}
          contentContainerClassName="pt-3 pb-6"
          showsVerticalScrollIndicator={false}
        />
      ) : null}

      {/* Status picker modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-end bg-black/40"
          activeOpacity={1}
          onPress={() => setShowStatusPicker(false)}
        >
          <View
            className="rounded-t-3xl bg-surface px-5 pb-10 pt-6"
            onStartShouldSetResponder={() => true}
          >
            <View className="mb-5 self-center h-1 w-10 rounded-full bg-border-strong" />

            <Text
              className="mb-1 text-center text-lg font-bold text-text-primary"
              numberOfLines={2}
            >
              {selectedBook?.title}
            </Text>
            <Text className="mb-6 text-center text-sm text-text-secondary">
              Choose a reading status
            </Text>

            {statusOptions.map((option) => {
              const config = STATUS_CONFIG[option.key]
              return (
                <TouchableOpacity
                  key={option.key}
                  className="mb-3 flex-row items-center rounded-xl p-4"
                  style={{ backgroundColor: config.lightColor }}
                  onPress={() => handleAddBook(option.key)}
                  accessibilityRole="button"
                >
                  <Ionicons name={option.icon} size={20} color={config.color} />
                  <Text
                    className="ml-3 flex-1 text-base font-semibold"
                    style={{ color: config.color }}
                  >
                    {option.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={config.color}
                  />
                </TouchableOpacity>
              )
            })}

            <TouchableOpacity
              className="mt-2 items-center py-3"
              onPress={() => setShowStatusPicker(false)}
              accessibilityRole="button"
            >
              <Text className="text-base text-text-secondary">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
