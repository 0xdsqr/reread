import { useMutation, useQuery } from "convex/react"
import { Stack, useLocalSearchParams } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
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
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ACCENT} />
      </View>
    )
  }

  if (!currentBook) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundText}>Book not found</Text>
      </View>
    )
  }

  const { book, userBook } = currentBook

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: book?.title || "Book Detail",
          headerBackTitle: "Books",
        }}
      />

      <ScrollView>
        {/* Book Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerRow}>
            {book?.coverUrl ? (
              <Image
                source={{ uri: book.coverUrl }}
                style={styles.cover}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cover, styles.noCover]}>
                <Text style={styles.noCoverText}>No Cover</Text>
              </View>
            )}

            <View style={styles.headerInfo}>
              <Text style={styles.title}>{book?.title || "Unknown Title"}</Text>

              <Text style={styles.author}>
                by {book?.author || "Unknown Author"}
              </Text>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(userBook.status) },
                ]}
              >
                <Text style={styles.statusBadgeText}>
                  {getStatusLabel(userBook.status)}
                </Text>
              </View>

              {book?.firstPublishYear && (
                <Text style={styles.publishYear}>
                  Published {book.firstPublishYear}
                </Text>
              )}
            </View>
          </View>

          {userBook.notes && (
            <View style={styles.notesBox}>
              <Text style={styles.notesText}>
                &ldquo;{userBook.notes}&rdquo;
              </Text>
            </View>
          )}
        </View>

        {/* Words Section */}
        <View style={styles.wordsSection}>
          <View style={styles.wordsSectionHeader}>
            <Text style={styles.wordsSectionTitle}>
              My Words ({wordsForBook?.length ?? 0})
            </Text>

            <TouchableOpacity
              style={styles.addWordBtn}
              onPress={() => setShowAddWord(true)}
            >
              <Text style={styles.addWordBtnText}>+ Add Word</Text>
            </TouchableOpacity>
          </View>

          {wordsForBook === undefined ? (
            <ActivityIndicator
              size="small"
              color={ACCENT}
              style={styles.wordsLoader}
            />
          ) : wordsForBook.length === 0 ? (
            <View style={styles.wordsEmpty}>
              <Text style={styles.wordsEmptyTitle}>
                No words saved for this book yet
              </Text>
              <Text style={styles.wordsEmptySubtitle}>
                Tap &ldquo;Add Word&rdquo; to save vocabulary as you read
              </Text>
            </View>
          ) : (
            <View>
              {wordsForBook.map((wordItem) => (
                <View key={wordItem._id} style={styles.wordCard}>
                  <View style={styles.wordCardHeader}>
                    <Text style={styles.wordCardWord}>{wordItem.word}</Text>
                    {wordItem.pageNumber != null && (
                      <Text style={styles.wordCardPage}>
                        p. {wordItem.pageNumber}
                      </Text>
                    )}
                  </View>

                  {wordItem.definition && (
                    <Text style={styles.wordCardDef}>
                      {wordItem.definition}
                    </Text>
                  )}

                  {wordItem.context && (
                    <Text style={styles.wordCardContext}>
                      &ldquo;{wordItem.context}&rdquo;
                    </Text>
                  )}

                  {wordItem.notes && (
                    <Text style={styles.wordCardNotes}>
                      Note: {wordItem.notes}
                    </Text>
                  )}

                  <Text style={styles.wordCardDate}>
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
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddWord(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Add Word</Text>

            <TouchableOpacity onPress={handleAddWord}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.inputLabel}>Word *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the word"
              placeholderTextColor="#9ca3af"
              value={word}
              onChangeText={setWord}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Definition</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="What does this word mean?"
              placeholderTextColor="#9ca3af"
              value={definition}
              onChangeText={setDefinition}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>Context</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="How was it used in the book?"
              placeholderTextColor="#9ca3af"
              value={context}
              onChangeText={setContext}
              multiline
              textAlignVertical="top"
            />

            <Text style={styles.inputLabel}>Page Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Page number (optional)"
              placeholderTextColor="#9ca3af"
              value={pageNumber}
              onChangeText={setPageNumber}
              keyboardType="numeric"
            />

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFoundText: { color: "#6b7280", fontSize: 16 },

  // Header
  headerSection: { backgroundColor: "#fff", padding: 20, marginBottom: 8 },
  headerRow: { flexDirection: "row" },
  cover: { width: 80, height: 120, borderRadius: 8, marginRight: 16 },
  noCover: {
    backgroundColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
  },
  noCoverText: { color: "#6b7280", fontSize: 16 },
  headerInfo: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  author: { fontSize: 16, color: "#6b7280", marginBottom: 12 },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  statusBadgeText: { color: "#fff", fontSize: 14, fontWeight: "500" },
  publishYear: { color: "#9ca3af", fontSize: 14 },
  notesBox: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  notesText: { fontSize: 14, color: "#6b7280", fontStyle: "italic" },

  // Words section
  wordsSection: { backgroundColor: "#fff", padding: 20 },
  wordsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  wordsSectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  addWordBtn: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addWordBtnText: { color: "#fff", fontWeight: "500" },
  wordsLoader: { marginVertical: 32 },
  wordsEmpty: { alignItems: "center", paddingVertical: 32 },
  wordsEmptyTitle: { color: "#6b7280", fontSize: 16, textAlign: "center" },
  wordsEmptySubtitle: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    marginTop: 4,
  },

  // Word cards
  wordCard: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  wordCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  wordCardWord: { fontSize: 18, fontWeight: "bold", color: "#111827", flex: 1 },
  wordCardPage: {
    fontSize: 12,
    color: "#6b7280",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  wordCardDef: { fontSize: 16, color: "#374151", marginBottom: 8 },
  wordCardContext: {
    fontSize: 14,
    color: "#6b7280",
    fontStyle: "italic",
    marginBottom: 8,
  },
  wordCardNotes: { fontSize: 14, color: "#6b7280" },
  wordCardDate: { fontSize: 12, color: "#9ca3af", marginTop: 8 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalCancel: { color: "#ef4444", fontSize: 16 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  modalSave: { color: "#3b82f6", fontSize: 16, fontWeight: "500" },
  modalBody: { padding: 20 },
  inputLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
    color: "#374151",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    color: "#111827",
  },
  inputMultiline: { minHeight: 80 },
})
