import { useMutation, useQuery } from "convex/react"
import { Stack, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"
import type { Id } from "../../lib/api"
import { api } from "../../lib/api"
import {
  ACCENT,
  formatDate,
  getStatusColor,
  getStatusLabel,
} from "../../lib/constants"

// Validate that a string is a valid Convex ID format (starts with table name)
function isValidUserBookId(id: string): id is Id<"userBooks"> {
  return typeof id === "string" && id.startsWith("userBooks:")
}

export default function BookDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [showAddWord, setShowAddWord] = useState(false)
  const [word, setWord] = useState("")
  const [definition, setDefinition] = useState("")
  const [context, setContext] = useState("")
  const [pageNumber, setPageNumber] = useState("")
  const [notes, setNotes] = useState("")

  // Validate the ID parameter before using it
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

  const handleAddWord = async () => {
    if (!word.trim()) {
      Alert.alert("Error", "Please enter a word")
      return
    }

    if (!userBookId) {
      Alert.alert("Error", "Invalid book ID")
      return
    }

    try {
      await addWord({
        userBookId,
        word: word.trim(),
        definition: definition.trim() || undefined,
        context: context.trim() || undefined,
        pageNumber: pageNumber ? parseInt(pageNumber, 10) : undefined,
        notes: notes.trim() || undefined,
      })

      setWord("")
      setDefinition("")
      setContext("")
      setPageNumber("")
      setNotes("")
      setShowAddWord(false)

      Alert.alert("Success", "Word added successfully!")
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add word"
      Alert.alert("Error", msg)
    }
  }

  if (currentBook === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    )
  }

  if (!currentBook) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text className="text-base text-gray-500">Book not found</Text>
      </View>
    )
  }

  const { book, userBook } = currentBook

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: book?.title || "Book Detail",
          headerBackTitle: "Books",
        }}
      />

      <ScrollView>
        {/* Book Header */}
        <View className="mb-2 bg-white p-5">
          <View className="flex-row">
            {book?.coverUrl ? (
              <Image
                source={{ uri: book.coverUrl }}
                className="mr-4 h-[120px] w-20 rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="mr-4 h-[120px] w-20 items-center justify-center rounded-lg bg-neutral-200">
                <Text className="text-base text-gray-500">No Cover</Text>
              </View>
            )}

            <View className="flex-1">
              <Text className="mb-2 text-xl font-bold text-gray-900">
                {book?.title || "Unknown Title"}
              </Text>

              <Text className="mb-3 text-base text-gray-500">
                by {book?.author || "Unknown Author"}
              </Text>

              <View
                className="mb-2 self-start rounded-2xl px-3 py-1.5"
                style={{ backgroundColor: getStatusColor(userBook.status) }}
              >
                <Text className="text-sm font-medium text-white">
                  {getStatusLabel(userBook.status)}
                </Text>
              </View>

              {book?.firstPublishYear && (
                <Text className="text-sm text-gray-400">
                  Published {book.firstPublishYear}
                </Text>
              )}
            </View>
          </View>

          {userBook.notes && (
            <View className="mt-4 rounded-lg bg-gray-50 p-3">
              <Text className="text-sm italic text-gray-500">
                &ldquo;{userBook.notes}&rdquo;
              </Text>
            </View>
          )}
        </View>

        {/* Words Section */}
        <View className="bg-white p-5">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold text-gray-900">
              My Words ({wordsForBook?.length ?? 0})
            </Text>

            <TouchableOpacity
              className="rounded-lg bg-blue-500 px-4 py-2"
              onPress={() => setShowAddWord(true)}
            >
              <Text className="font-medium text-white">+ Add Word</Text>
            </TouchableOpacity>
          </View>

          {wordsForBook === undefined ? (
            <ActivityIndicator size="small" color={ACCENT} className="my-8" />
          ) : wordsForBook.length === 0 ? (
            <View className="items-center py-8">
              <Text className="text-center text-base text-gray-500">
                No words saved for this book yet
              </Text>
              <Text className="mt-1 text-center text-sm text-gray-400">
                Tap &ldquo;Add Word&rdquo; to save vocabulary as you read
              </Text>
            </View>
          ) : (
            <View>
              {wordsForBook.map((wordItem) => (
                <View
                  key={wordItem._id}
                  className="mb-3 rounded-lg bg-gray-50 p-4"
                >
                  <View className="mb-2 flex-row items-start justify-between">
                    <Text className="flex-1 text-lg font-bold text-gray-900">
                      {wordItem.word}
                    </Text>
                    {wordItem.pageNumber != null && (
                      <Text className="rounded-xl bg-white px-2 py-0.5 text-xs text-gray-500">
                        p. {wordItem.pageNumber}
                      </Text>
                    )}
                  </View>

                  {wordItem.definition && (
                    <Text className="mb-2 text-base text-gray-700">
                      {wordItem.definition}
                    </Text>
                  )}

                  {wordItem.context && (
                    <Text className="mb-2 text-sm italic text-gray-500">
                      &ldquo;{wordItem.context}&rdquo;
                    </Text>
                  )}

                  {wordItem.notes && (
                    <Text className="text-sm text-gray-500">
                      Note: {wordItem.notes}
                    </Text>
                  )}

                  <Text className="mt-2 text-xs text-gray-400">
                    Added {formatDate(wordItem.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Add Word Modal */}
      <Modal
        visible={showAddWord}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-200 px-5 py-4">
            <TouchableOpacity onPress={() => setShowAddWord(false)}>
              <Text className="text-base text-red-500">Cancel</Text>
            </TouchableOpacity>

            <Text className="text-lg font-bold text-gray-900">Add Word</Text>

            <TouchableOpacity onPress={handleAddWord}>
              <Text className="text-base font-medium text-blue-500">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="p-5">
            <Text className="mb-2 text-base font-medium text-gray-700">
              Word *
            </Text>
            <TextInput
              className="mb-4 rounded-lg border border-gray-200 px-3 py-3 text-base text-gray-900"
              placeholder="Enter the word"
              placeholderTextColor="#9ca3af"
              value={word}
              onChangeText={setWord}
              autoCapitalize="none"
            />

            <Text className="mb-2 text-base font-medium text-gray-700">
              Definition
            </Text>
            <TextInput
              className="mb-4 min-h-[80px] rounded-lg border border-gray-200 px-3 py-3 text-base text-gray-900"
              placeholder="What does this word mean?"
              placeholderTextColor="#9ca3af"
              value={definition}
              onChangeText={setDefinition}
              multiline
              textAlignVertical="top"
            />

            <Text className="mb-2 text-base font-medium text-gray-700">
              Context
            </Text>
            <TextInput
              className="mb-4 min-h-[80px] rounded-lg border border-gray-200 px-3 py-3 text-base text-gray-900"
              placeholder="How was it used in the book?"
              placeholderTextColor="#9ca3af"
              value={context}
              onChangeText={setContext}
              multiline
              textAlignVertical="top"
            />

            <Text className="mb-2 text-base font-medium text-gray-700">
              Page Number
            </Text>
            <TextInput
              className="mb-4 rounded-lg border border-gray-200 px-3 py-3 text-base text-gray-900"
              placeholder="Page number (optional)"
              placeholderTextColor="#9ca3af"
              value={pageNumber}
              onChangeText={setPageNumber}
              keyboardType="numeric"
            />

            <Text className="mb-2 text-base font-medium text-gray-700">
              Notes
            </Text>
            <TextInput
              className="mb-4 min-h-[80px] rounded-lg border border-gray-200 px-3 py-3 text-base text-gray-900"
              placeholder="Personal notes about this word"
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}
