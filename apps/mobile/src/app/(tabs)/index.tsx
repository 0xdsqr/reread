import type { Doc } from "@reread/convex/dataModel"
import { useMutation, useQuery } from "convex/react"
import { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import type { Id } from "../../lib/api"
import { api } from "../../lib/api"
import { ACCENT, type ReadingStatus, STATUS_CONFIG } from "../../lib/constants"

type StatusFilter = "all" | ReadingStatus

const STATUS_EMOJIS: Record<ReadingStatus, string> = {
  reading: "📖",
  finished: "✅",
  "want-to-read": "📋",
}

// Return type of userBooks.listMine query - uses Convex generated types
type MyBookItem = {
  userBook: Doc<"userBooks">
  book: Doc<"books"> | null
  wordsCount: number
}

export default function Home() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [selectedUserBookId, setSelectedUserBookId] =
    useState<Id<"userBooks"> | null>(null)
  const [showAddWord, setShowAddWord] = useState(false)
  const [showWords, setShowWords] = useState(false)
  const [wordForm, setWordForm] = useState({
    word: "",
    definition: "",
    context: "",
    pageNumber: "",
  })

  const myBooks = useQuery(api.userBooks.listMine, {
    status: statusFilter === "all" ? undefined : statusFilter,
  })
  const words = useQuery(
    api.words.listByUserBook,
    selectedUserBookId && showWords
      ? { userBookId: selectedUserBookId }
      : "skip",
  )
  const addWord = useMutation(api.words.add)
  const removeWord = useMutation(api.words.remove)
  const removeBook = useMutation(api.userBooks.remove)
  const updateStatus = useMutation(api.userBooks.updateStatus)

  const handleAddWord = useCallback(async () => {
    if (!selectedUserBookId || !wordForm.word.trim()) return
    try {
      await addWord({
        userBookId: selectedUserBookId,
        word: wordForm.word,
        definition: wordForm.definition || undefined,
        context: wordForm.context || undefined,
        pageNumber: wordForm.pageNumber
          ? parseInt(wordForm.pageNumber)
          : undefined,
      })
      setWordForm({ word: "", definition: "", context: "", pageNumber: "" })
      setShowAddWord(false)
      Alert.alert("Saved!", `"${wordForm.word}" added.`)
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add word"
      Alert.alert("Error", msg)
    }
  }, [selectedUserBookId, wordForm, addWord])

  const handleRemoveBook = useCallback(
    async (userBookId: Id<"userBooks">, title: string) => {
      Alert.alert(
        "Remove Book",
        `Remove "${title}" from your library? This will delete all saved words for this book.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              try {
                await removeBook({ userBookId })
              } catch (error: unknown) {
                const msg =
                  error instanceof Error
                    ? error.message
                    : "Failed to remove book"
                Alert.alert("Error", msg)
              }
            },
          },
        ],
      )
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

  const renderBookItem = ({ item }: { item: MyBookItem }) => {
    const { userBook, book, wordsCount } = item
    if (!book) return null
    const status = STATUS_CONFIG[userBook.status]
    const emoji = STATUS_EMOJIS[userBook.status]

    return (
      <View className="mb-3 rounded-xl border border-gray-100 bg-white p-3">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => {
            setSelectedUserBookId(userBook._id)
            setShowWords(true)
          }}
          activeOpacity={0.7}
        >
          {book.coverUrl ? (
            <Image
              source={{ uri: book.coverUrl }}
              className="h-20 w-14 rounded-md"
            />
          ) : (
            <View className="h-20 w-14 items-center justify-center rounded-md bg-gray-200">
              <Text className="text-2xl">📖</Text>
            </View>
          )}
          <View className="ml-3 flex-1">
            <Text
              className="text-base font-semibold text-gray-900"
              numberOfLines={2}
            >
              {book.title}
            </Text>
            <Text className="mt-0.5 text-sm text-gray-500" numberOfLines={1}>
              {book.author}
            </Text>
            <View className="mt-1.5 flex-row items-center gap-2">
              <View
                className="rounded-xl px-2 py-[3px]"
                style={{ backgroundColor: status.color + "20" }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: status.color }}
                >
                  {emoji} {status.label}
                </Text>
              </View>
              <Text className="text-xs text-gray-400">
                {wordsCount} word{wordsCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View className="mt-2.5 flex-row items-center gap-2 border-t border-gray-100 pt-2.5">
          {/* Status quick-change */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(Object.keys(STATUS_CONFIG) as ReadingStatus[]).map((key) => {
              const val = STATUS_CONFIG[key]
              return (
                <TouchableOpacity
                  key={key}
                  className="mr-1.5 h-8 w-8 items-center justify-center rounded-full border border-gray-200"
                  style={
                    userBook.status === key
                      ? {
                          backgroundColor: val.color + "30",
                          borderColor: val.color,
                        }
                      : undefined
                  }
                  onPress={() => handleStatusChange(userBook._id, key)}
                >
                  <Text
                    className="text-sm"
                    style={
                      userBook.status === key ? { color: val.color } : undefined
                    }
                  >
                    {STATUS_EMOJIS[key]}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <TouchableOpacity
            className="ml-auto rounded-lg bg-indigo-500 px-3 py-1.5"
            onPress={() => {
              setSelectedUserBookId(userBook._id)
              setShowAddWord(true)
            }}
          >
            <Text className="text-[13px] font-semibold text-white">+ Word</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleRemoveBook(userBook._id, book.title)}
          >
            <Text className="px-1 text-lg">🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-white">
      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="flex-grow-0 px-3 py-2"
      >
        {(["all", "reading", "finished", "want-to-read"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            className={`mr-2 rounded-full px-3.5 py-2 ${statusFilter === s ? "bg-indigo-500" : "bg-gray-100"}`}
            onPress={() => setStatusFilter(s)}
          >
            <Text
              className={`text-sm ${statusFilter === s ? "font-semibold text-white" : "text-gray-500"}`}
            >
              {s === "all"
                ? "📚 All"
                : `${STATUS_EMOJIS[s]} ${STATUS_CONFIG[s].label}`}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Book list */}
      {myBooks === undefined ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : myBooks.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className="mb-3 text-5xl">📚</Text>
          <Text className="text-xl font-bold text-gray-900">
            {statusFilter === "all"
              ? "No Books Yet"
              : `No ${STATUS_CONFIG[statusFilter].label} Books`}
          </Text>
          <Text className="mt-1 px-10 text-center text-sm text-gray-500">
            Search for books to add them to your library
          </Text>
        </View>
      ) : (
        <FlatList
          data={myBooks}
          keyExtractor={(item) => item.userBook._id}
          renderItem={renderBookItem}
          contentContainerClassName="px-4 pb-5"
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
            className="flex-1 justify-end bg-black/50"
            activeOpacity={1}
            onPress={() => setShowAddWord(false)}
          >
            <View
              className="max-h-[80%] rounded-t-2xl bg-white p-6"
              onStartShouldSetResponder={() => true}
            >
              <Text className="mb-4 text-xl font-bold text-gray-900">
                Add a Word
              </Text>

              <TextInput
                className="mb-3 rounded-xl border border-gray-200 p-3 text-base text-gray-900"
                placeholder="Word *"
                placeholderTextColor="#9ca3af"
                value={wordForm.word}
                onChangeText={(t) => setWordForm((f) => ({ ...f, word: t }))}
                autoCapitalize="none"
              />
              <TextInput
                className="mb-3 rounded-xl border border-gray-200 p-3 text-base text-gray-900"
                placeholder="Definition"
                placeholderTextColor="#9ca3af"
                value={wordForm.definition}
                onChangeText={(t) =>
                  setWordForm((f) => ({ ...f, definition: t }))
                }
                multiline
              />
              <TextInput
                className="mb-3 rounded-xl border border-gray-200 p-3 text-base text-gray-900"
                placeholder="Context (sentence from book)"
                placeholderTextColor="#9ca3af"
                value={wordForm.context}
                onChangeText={(t) => setWordForm((f) => ({ ...f, context: t }))}
                multiline
              />
              <TextInput
                className="mb-3 rounded-xl border border-gray-200 p-3 text-base text-gray-900"
                placeholder="Page number"
                placeholderTextColor="#9ca3af"
                value={wordForm.pageNumber}
                onChangeText={(t) =>
                  setWordForm((f) => ({ ...f, pageNumber: t }))
                }
                keyboardType="numeric"
              />

              <TouchableOpacity
                className="mt-1 items-center rounded-xl bg-indigo-500 p-3.5"
                style={!wordForm.word.trim() ? { opacity: 0.5 } : undefined}
                onPress={handleAddWord}
                disabled={!wordForm.word.trim()}
              >
                <Text className="text-base font-semibold text-white">
                  Save Word
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="mt-1 items-center p-3"
                onPress={() => setShowAddWord(false)}
              >
                <Text className="text-base text-gray-500">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Words List Modal */}
      <Modal
        visible={showWords}
        transparent
        animationType="slide"
        onRequestClose={() => setShowWords(false)}
      >
        <View className="mt-[60px] flex-1 rounded-t-2xl bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-100 p-4">
            <Text className="text-xl font-bold text-gray-900">Words</Text>
            <TouchableOpacity onPress={() => setShowWords(false)}>
              <Text className="p-1 text-xl text-gray-500">✕</Text>
            </TouchableOpacity>
          </View>

          {words === undefined ? (
            <ActivityIndicator size="large" color={ACCENT} className="mt-10" />
          ) : words.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="mb-3 text-5xl">📝</Text>
              <Text className="text-xl font-bold text-gray-900">
                No Words Yet
              </Text>
              <Text className="mt-1 px-10 text-center text-sm text-gray-500">
                Tap "+ Word" on a book to start collecting
              </Text>
            </View>
          ) : (
            <FlatList
              data={words}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View className="mb-2.5 rounded-xl bg-gray-50 p-3.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-bold text-gray-900">
                      {item.word}
                    </Text>
                    {item.pageNumber && (
                      <Text className="text-xs text-gray-400">
                        p. {item.pageNumber}
                      </Text>
                    )}
                  </View>
                  {item.definition && (
                    <Text className="mt-1.5 text-sm text-gray-700">
                      {item.definition}
                    </Text>
                  )}
                  {item.context && (
                    <Text className="mt-1 text-[13px] italic text-gray-500">
                      "{item.context}"
                    </Text>
                  )}
                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert("Delete Word", `Delete "${item.word}"?`, [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => removeWord({ wordId: item._id }),
                        },
                      ])
                    }}
                  >
                    <Text className="mt-2 text-[13px] text-red-500">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerClassName="p-4"
            />
          )}

          <TouchableOpacity
            className="absolute bottom-[30px] right-5 rounded-3xl bg-indigo-500 px-5 py-3 shadow-md elevation-4"
            onPress={() => {
              setShowWords(false)
              setShowAddWord(true)
            }}
          >
            <Text className="text-base font-semibold text-white">
              + Add Word
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}
