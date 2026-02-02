import { useAction, useMutation } from "convex/react"
import { useCallback, useEffect, useRef, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import { api } from "../../lib/api"
import type { ReadingStatus } from "../../lib/constants"

// Book search result from Open Library API
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

  // Debounced search
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

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

    debounceTimer.current = setTimeout(async () => {
      try {
        const data = await searchBooks({ query: query.trim() })
        setResults(data as BookResult[])
      } catch {
        setResults([])
      } finally {
        setIsSearching(false)
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
        Alert.alert("Added!", `"${selectedBook.title}" added to your library.`)
        setShowStatusPicker(false)
        setSelectedBook(null)
      } catch (error: unknown) {
        const msg =
          error instanceof Error ? error.message : "Something went wrong"
        Alert.alert("Oops", msg)
      }
    },
    [selectedBook, addBook],
  )

  const renderBook = ({ item }: { item: BookResult }) => (
    <TouchableOpacity
      className="flex-row items-center border-b border-gray-100 py-3"
      onPress={() => {
        setSelectedBook(item)
        setShowStatusPicker(true)
      }}
      activeOpacity={0.7}
    >
      {item.coverUrl ? (
        <Image
          source={{ uri: item.coverUrl }}
          className="h-[68px] w-12 rounded"
        />
      ) : (
        <View className="h-[68px] w-12 items-center justify-center rounded bg-gray-200">
          <Text className="text-[10px] text-gray-500">No Cover</Text>
        </View>
      )}
      <View className="ml-3 flex-1">
        <Text
          className="text-base font-semibold text-gray-900"
          numberOfLines={2}
        >
          {item.title}
        </Text>
        <Text className="mt-0.5 text-sm text-gray-500" numberOfLines={1}>
          {item.author}
        </Text>
        {item.firstPublishYear != null && (
          <Text className="mt-0.5 text-xs text-gray-400">
            {item.firstPublishYear}
          </Text>
        )}
      </View>
      <Text className="px-2 text-2xl font-bold text-indigo-500">+</Text>
    </TouchableOpacity>
  )

  return (
    <View className="flex-1 bg-white">
      <View className="m-4 flex-row items-center rounded-xl bg-gray-100 px-3 py-2.5">
        <TextInput
          className="flex-1 text-base text-gray-900"
          placeholder="Search books by title, author, or ISBN..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Text className="p-1 text-base text-gray-400">X</Text>
          </TouchableOpacity>
        )}
      </View>

      {query.trim().length < 2 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-xl font-bold text-gray-900">
            Find Your Next Read
          </Text>
          <Text className="mt-1 text-base text-gray-500">
            Search by title, author, or ISBN
          </Text>
        </View>
      ) : isSearching ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6366f1" />
          <Text className="mt-3 text-base text-gray-500">Searching...</Text>
        </View>
      ) : results !== null && results.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-xl font-bold text-gray-900">No Results</Text>
          <Text className="mt-1 text-base text-gray-500">
            Try a different search term
          </Text>
        </View>
      ) : results !== null ? (
        <FlatList
          data={results}
          keyExtractor={(item) => item.key}
          renderItem={renderBook}
          contentContainerClassName="px-4"
        />
      ) : null}

      {/* Status picker modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <TouchableOpacity
          className="flex-1 items-center justify-center bg-black/50"
          activeOpacity={1}
          onPress={() => setShowStatusPicker(false)}
        >
          <View className="w-[85%] max-w-[360px] rounded-2xl bg-white p-6">
            <Text
              className="text-center text-lg font-bold text-gray-900"
              numberOfLines={2}
            >
              Add &ldquo;{selectedBook?.title}&rdquo;
            </Text>
            <Text className="mt-1 mb-4 text-center text-sm text-gray-500">
              Choose a status:
            </Text>

            <TouchableOpacity
              className="mb-2.5 items-center rounded-xl bg-indigo-500 p-3.5"
              onPress={() => handleAddBook("reading")}
            >
              <Text className="text-base font-semibold text-white">
                Currently Reading
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mb-2.5 items-center rounded-xl bg-emerald-500 p-3.5"
              onPress={() => handleAddBook("finished")}
            >
              <Text className="text-base font-semibold text-white">
                Finished
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mb-2.5 items-center rounded-xl bg-amber-500 p-3.5"
              onPress={() => handleAddBook("want-to-read")}
            >
              <Text className="text-base font-semibold text-white">
                Want to Read
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="mt-1 items-center p-3"
              onPress={() => setShowStatusPicker(false)}
            >
              <Text className="text-base text-gray-500">Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}
