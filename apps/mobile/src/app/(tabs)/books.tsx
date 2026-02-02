import type { Doc } from "@reread/convex/dataModel"
import { useQuery } from "convex/react"
import { router } from "expo-router"
import { useState } from "react"
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"
import { api } from "../../lib/api"
import type { ReadingStatus } from "../../lib/constants"
import {
  ACCENT,
  getStatusColor,
  getStatusLabel,
  STATUS_CONFIG,
} from "../../lib/constants"

interface BookItem {
  userBook: Doc<"userBooks">
  book: Doc<"books"> | null
  wordsCount: number
}

type StatusFilter = ReadingStatus | "all"

const statusOptions: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All Books" },
  ...(Object.keys(STATUS_CONFIG) as ReadingStatus[]).map((key) => ({
    key,
    label: STATUS_CONFIG[key].label,
  })),
]

export default function Books() {
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("all")

  const myBooks = useQuery(api.userBooks.listMine, {
    status: selectedStatus === "all" ? undefined : selectedStatus,
  })

  const renderBookItem = ({ item }: { item: BookItem }) => (
    <TouchableOpacity
      onPress={() => router.push(`/book/${item.userBook._id}`)}
      style={styles.bookCard}
    >
      {item.book?.coverUrl ? (
        <Image
          source={{ uri: item.book.coverUrl }}
          style={styles.cover}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.cover, styles.noCover]}>
          <Text style={styles.noCoverText}>No Cover</Text>
        </View>
      )}

      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.book?.title || "Unknown Title"}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          by {item.book?.author || "Unknown Author"}
        </Text>

        <View style={styles.metaRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.userBook.status) },
            ]}
          >
            <Text style={styles.statusBadgeText}>
              {getStatusLabel(item.userBook.status)}
            </Text>
          </View>
          <Text style={styles.wordCount}>
            {item.wordsCount} {item.wordsCount === 1 ? "word" : "words"}
          </Text>
        </View>

        {item.userBook.notes && (
          <Text style={styles.notes} numberOfLines={2}>
            &ldquo;{item.userBook.notes}&rdquo;
          </Text>
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <Text style={styles.pageTitle}>My Books</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.filterTab,
              selectedStatus === option.key && styles.filterTabActive,
            ]}
            onPress={() => setSelectedStatus(option.key)}
          >
            <Text
              style={[
                styles.filterTabText,
                selectedStatus === option.key && styles.filterTabTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {myBooks === undefined ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : myBooks.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>
            {selectedStatus === "all"
              ? "No books in your library yet"
              : `No ${getStatusLabel(selectedStatus).toLowerCase()} books`}
          </Text>
          <Text style={styles.emptySubtitle}>
            Use the Search tab to add books to your library
          </Text>
        </View>
      ) : (
        <FlatList
          data={myBooks as BookItem[]}
          renderItem={renderBookItem}
          keyExtractor={(item) => item.userBook._id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
        />
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
  filterRow: { marginBottom: 16 },
  filterContent: { paddingHorizontal: 16 },
  filterTab: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterTabActive: { backgroundColor: ACCENT },
  filterTabText: { color: "#374151", fontWeight: "500" },
  filterTabTextActive: { color: "#fff" },
  list: { paddingBottom: 20 },
  bookCard: {
    flexDirection: "row",
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
  cover: { width: 60, height: 80, borderRadius: 4, marginRight: 12 },
  noCover: {
    backgroundColor: "#e5e5e5",
    alignItems: "center",
    justifyContent: "center",
  },
  noCoverText: { color: "#6b7280", fontSize: 10 },
  bookInfo: { flex: 1 },
  bookTitle: {
    fontWeight: "600",
    fontSize: 16,
    color: "#111827",
    marginBottom: 4,
  },
  bookAuthor: { color: "#6b7280", marginBottom: 8, fontSize: 14 },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { color: "white", fontSize: 12, fontWeight: "500" },
  wordCount: { color: "#6b7280", fontSize: 12 },
  notes: {
    color: "#6b7280",
    fontSize: 12,
    marginTop: 8,
    fontStyle: "italic",
  },
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
