import type { Doc } from "@reread/convex/dataModel"
import { useMutation, useQuery } from "convex/react"
import React, { useCallback, useState } from "react"
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
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
      <View style={styles.bookCard}>
        <TouchableOpacity
          style={styles.bookRow}
          onPress={() => {
            setSelectedUserBookId(userBook._id)
            setShowWords(true)
          }}
          activeOpacity={0.7}
        >
          {book.coverUrl ? (
            <Image source={{ uri: book.coverUrl }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.noCover]}>
              <Text style={styles.noCoverText}>📖</Text>
            </View>
          )}
          <View style={styles.bookInfo}>
            <Text style={styles.bookTitle} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={styles.bookAuthor} numberOfLines={1}>
              {book.author}
            </Text>
            <View style={styles.metaRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: status.color + "20" },
                ]}
              >
                <Text style={[styles.statusText, { color: status.color }]}>
                  {emoji} {status.label}
                </Text>
              </View>
              <Text style={styles.wordCount}>
                {wordsCount} word{wordsCount !== 1 ? "s" : ""}
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={styles.bookActions}>
          {/* Status quick-change */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(Object.keys(STATUS_CONFIG) as ReadingStatus[]).map((key) => {
              const val = STATUS_CONFIG[key]
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.miniStatusBtn,
                    userBook.status === key && {
                      backgroundColor: val.color + "30",
                      borderColor: val.color,
                    },
                  ]}
                  onPress={() => handleStatusChange(userBook._id, key)}
                >
                  <Text
                    style={[
                      styles.miniStatusText,
                      userBook.status === key && { color: val.color },
                    ]}
                  >
                    {STATUS_EMOJIS[key]}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>

          <TouchableOpacity
            style={styles.addWordBtn}
            onPress={() => {
              setSelectedUserBookId(userBook._id)
              setShowAddWord(true)
            }}
          >
            <Text style={styles.addWordBtnText}>+ Word</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleRemoveBook(userBook._id, book.title)}
          >
            <Text style={styles.removeBtn}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
      >
        {(["all", "reading", "finished", "want-to-read"] as const).map((s) => (
          <TouchableOpacity
            key={s}
            style={[
              styles.filterTab,
              statusFilter === s && styles.filterTabActive,
            ]}
            onPress={() => setStatusFilter(s)}
          >
            <Text
              style={[
                styles.filterTabText,
                statusFilter === s && styles.filterTabTextActive,
              ]}
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
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : myBooks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>
            {statusFilter === "all"
              ? "No Books Yet"
              : `No ${STATUS_CONFIG[statusFilter].label} Books`}
          </Text>
          <Text style={styles.emptySubtitle}>
            Search for books to add them to your library
          </Text>
        </View>
      ) : (
        <FlatList
          data={myBooks}
          keyExtractor={(item) => item.userBook._id}
          renderItem={renderBookItem}
          contentContainerStyle={styles.list}
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
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowAddWord(false)}
          >
            <View
              style={styles.modalContent}
              onStartShouldSetResponder={() => true}
            >
              <Text style={styles.modalTitle}>Add a Word</Text>

              <TextInput
                style={styles.input}
                placeholder="Word *"
                placeholderTextColor="#9ca3af"
                value={wordForm.word}
                onChangeText={(t) => setWordForm((f) => ({ ...f, word: t }))}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Definition"
                placeholderTextColor="#9ca3af"
                value={wordForm.definition}
                onChangeText={(t) =>
                  setWordForm((f) => ({ ...f, definition: t }))
                }
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Context (sentence from book)"
                placeholderTextColor="#9ca3af"
                value={wordForm.context}
                onChangeText={(t) => setWordForm((f) => ({ ...f, context: t }))}
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Page number"
                placeholderTextColor="#9ca3af"
                value={wordForm.pageNumber}
                onChangeText={(t) =>
                  setWordForm((f) => ({ ...f, pageNumber: t }))
                }
                keyboardType="numeric"
              />

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  !wordForm.word.trim() && { opacity: 0.5 },
                ]}
                onPress={handleAddWord}
                disabled={!wordForm.word.trim()}
              >
                <Text style={styles.submitBtnText}>Save Word</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddWord(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
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
        <View style={styles.wordsModal}>
          <View style={styles.wordsHeader}>
            <Text style={styles.wordsTitle}>Words</Text>
            <TouchableOpacity onPress={() => setShowWords(false)}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {words === undefined ? (
            <ActivityIndicator
              size="large"
              color={ACCENT}
              style={{ marginTop: 40 }}
            />
          ) : words.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>No Words Yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap "+ Word" on a book to start collecting
              </Text>
            </View>
          ) : (
            <FlatList
              data={words}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <View style={styles.wordCard}>
                  <View style={styles.wordHeader}>
                    <Text style={styles.wordText}>{item.word}</Text>
                    {item.pageNumber && (
                      <Text style={styles.wordPage}>p. {item.pageNumber}</Text>
                    )}
                  </View>
                  {item.definition && (
                    <Text style={styles.wordDef}>{item.definition}</Text>
                  )}
                  {item.context && (
                    <Text style={styles.wordContext}>"{item.context}"</Text>
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
                    <Text style={styles.wordDelete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={{ padding: 16 }}
            />
          )}

          <TouchableOpacity
            style={styles.floatingAddBtn}
            onPress={() => {
              setShowWords(false)
              setShowAddWord(true)
            }}
          >
            <Text style={styles.floatingAddBtnText}>+ Add Word</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  filterRow: { flexGrow: 0, paddingHorizontal: 12, paddingVertical: 8 },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  filterTabActive: { backgroundColor: ACCENT },
  filterTabText: { fontSize: 14, color: "#6b7280" },
  filterTabTextActive: { color: "#fff", fontWeight: "600" },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  bookCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    padding: 12,
  },
  bookRow: { flexDirection: "row", alignItems: "center" },
  cover: { width: 56, height: 80, borderRadius: 6 },
  noCover: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  noCoverText: { fontSize: 24 },
  bookInfo: { flex: 1, marginLeft: 12 },
  bookTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  bookAuthor: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", marginTop: 6, gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 12, fontWeight: "500" },
  wordCount: { fontSize: 12, color: "#9ca3af" },
  bookActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    gap: 8,
  },
  miniStatusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  miniStatusText: { fontSize: 14 },
  addWordBtn: {
    marginLeft: "auto",
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addWordBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  removeBtn: { fontSize: 18, paddingHorizontal: 4 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    color: "#111827",
  },
  submitBtn: {
    backgroundColor: ACCENT,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelBtn: { padding: 12, alignItems: "center", marginTop: 4 },
  cancelBtnText: { color: "#6b7280", fontSize: 16 },
  wordsModal: {
    flex: 1,
    backgroundColor: "#fff",
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  wordsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  wordsTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  closeBtn: { fontSize: 20, color: "#6b7280", padding: 4 },
  wordCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  wordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  wordText: { fontSize: 18, fontWeight: "700", color: "#111827" },
  wordPage: { fontSize: 12, color: "#9ca3af" },
  wordDef: { fontSize: 14, color: "#374151", marginTop: 6 },
  wordContext: {
    fontSize: 13,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 4,
  },
  wordDelete: { fontSize: 13, color: "#ef4444", marginTop: 8 },
  floatingAddBtn: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: ACCENT,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  floatingAddBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
})
