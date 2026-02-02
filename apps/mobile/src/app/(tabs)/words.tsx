import type { Doc } from "@reread/convex/dataModel"
import { useQuery } from "convex/react"
import { useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
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
    <View style={styles.wordCard}>
      <View style={styles.wordHeader}>
        <Text style={styles.wordText}>{item.word}</Text>
        {item.pageNumber != null && (
          <Text style={styles.pageBadge}>p. {item.pageNumber}</Text>
        )}
      </View>

      {item.definition && (
        <Text style={styles.definition}>{item.definition}</Text>
      )}

      {item.context && (
        <View style={styles.contextBox}>
          <Text style={styles.contextText}>&ldquo;{item.context}&rdquo;</Text>
        </View>
      )}

      {item.notes && <Text style={styles.notes}>Note: {item.notes}</Text>}

      <View style={styles.footer}>
        <View>
          <Text style={styles.bookTitle}>{item.bookTitle}</Text>
          <Text style={styles.bookAuthor}>by {item.bookAuthor}</Text>
        </View>
        <View style={styles.footerRight}>
          <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
          {item.likesCount > 0 && (
            <Text style={styles.likes}>
              {item.likesCount} {item.likesCount === 1 ? "like" : "likes"}
            </Text>
          )}
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>My Words</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search words, definitions, or books..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {myWords === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : filteredWords.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            {myWords.length === 0
              ? "No words saved yet"
              : "No words match your search"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {myWords.length === 0
              ? "Start reading books and save words you want to remember"
              : "Try a different search term"}
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.resultCount}>
            {filteredWords.length}{" "}
            {filteredWords.length === 1 ? "word" : "words"} found
          </Text>
          <FlatList
            data={filteredWords}
            renderItem={renderWordItem}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.list}
          />
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9fafb" },
  pageTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#111827",
    margin: 16,
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  resultCount: {
    fontSize: 14,
    color: "#6b7280",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  list: { paddingBottom: 20 },
  wordCard: {
    backgroundColor: "#fff",
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  wordHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  wordText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#111827",
    flex: 1,
  },
  pageBadge: {
    fontSize: 12,
    color: "#6b7280",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  definition: { fontSize: 16, color: "#374151", marginBottom: 8 },
  contextBox: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
  },
  contextText: { fontSize: 14, color: "#6b7280", fontStyle: "italic" },
  notes: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 8,
  },
  bookTitle: { fontSize: 12, fontWeight: "500", color: "#374151" },
  bookAuthor: { fontSize: 11, color: "#9ca3af" },
  footerRight: { alignItems: "flex-end" },
  date: { fontSize: 11, color: "#9ca3af" },
  likes: { fontSize: 11, color: "#ef4444" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: "#6b7280",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: { color: "#9ca3af", fontSize: 14, textAlign: "center" },
})
