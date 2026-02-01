import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { useQuery, useMutation } from "convex/react";
import { api } from "@reread/convex";

type BookResult = {
  key: string;
  title: string;
  author: string;
  coverUrl?: string;
  isbn?: string;
  firstPublishYear?: number;
};

type ReadingStatus = "reading" | "finished" | "want-to-read";

export default function Search() {
  const [query, setQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const results = useQuery(
    api.books.search,
    query.trim().length >= 2 ? { query: query.trim() } : "skip"
  );
  const addBook = useMutation(api.userBooks.add);

  const handleAddBook = useCallback(
    async (status: ReadingStatus) => {
      if (!selectedBook) return;
      try {
        await addBook({
          openLibraryKey: selectedBook.key,
          title: selectedBook.title,
          author: selectedBook.author,
          coverUrl: selectedBook.coverUrl,
          isbn: selectedBook.isbn,
          firstPublishYear: selectedBook.firstPublishYear,
          status,
        });
        Alert.alert("Added!", `"${selectedBook.title}" added to your library.`);
        setShowStatusPicker(false);
        setSelectedBook(null);
      } catch (error: any) {
        const msg = error?.data || error?.message || "Something went wrong";
        Alert.alert("Oops", String(msg));
      }
    },
    [selectedBook, addBook]
  );

  const renderBook = ({ item }: { item: BookResult }) => (
    <TouchableOpacity
      style={styles.bookRow}
      onPress={() => {
        setSelectedBook(item);
        setShowStatusPicker(true);
      }}
      activeOpacity={0.7}
    >
      {item.coverUrl ? (
        <Image source={{ uri: item.coverUrl }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.noCover]}>
          <Text style={styles.noCoverText}>📖</Text>
        </View>
      )}
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.bookAuthor} numberOfLines={1}>
          {item.author}
        </Text>
        {item.firstPublishYear && (
          <Text style={styles.bookYear}>{item.firstPublishYear}</Text>
        )}
      </View>
      <Text style={styles.addIcon}>+</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search books..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {query.trim().length < 2 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>Find Your Next Read</Text>
          <Text style={styles.emptySubtitle}>
            Search by title, author, or ISBN
          </Text>
        </View>
      ) : results === undefined ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🤷</Text>
          <Text style={styles.emptyTitle}>No Results</Text>
          <Text style={styles.emptySubtitle}>
            Try a different search term
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.key}
          renderItem={renderBook}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Status picker modal */}
      <Modal
        visible={showStatusPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStatusPicker(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowStatusPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle} numberOfLines={2}>
              Add "{selectedBook?.title}"
            </Text>
            <Text style={styles.modalSubtitle}>Choose a status:</Text>

            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: "#6366f1" }]}
              onPress={() => handleAddBook("reading")}
            >
              <Text style={styles.statusButtonText}>📖 Currently Reading</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: "#10b981" }]}
              onPress={() => handleAddBook("finished")}
            >
              <Text style={styles.statusButtonText}>✅ Finished</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusButton, { backgroundColor: "#f59e0b" }]}
              onPress={() => handleAddBook("want-to-read")}
            >
              <Text style={styles.statusButtonText}>📋 Want to Read</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowStatusPicker(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
  },
  searchIcon: { fontSize: 18, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: "#111827" },
  clearIcon: { fontSize: 16, color: "#9ca3af", padding: 4 },
  list: { paddingHorizontal: 16 },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  cover: { width: 48, height: 68, borderRadius: 4 },
  noCover: {
    backgroundColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
  },
  noCoverText: { fontSize: 20 },
  bookInfo: { flex: 1, marginLeft: 12 },
  bookTitle: { fontSize: 16, fontWeight: "600", color: "#111827" },
  bookAuthor: { fontSize: 14, color: "#6b7280", marginTop: 2 },
  bookYear: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  addIcon: {
    fontSize: 24,
    color: "#6366f1",
    fontWeight: "bold",
    paddingHorizontal: 8,
  },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  emptySubtitle: { fontSize: 16, color: "#6b7280", marginTop: 4 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { fontSize: 16, color: "#6b7280", marginTop: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "85%",
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 16,
  },
  statusButton: {
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  statusButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  cancelButton: { padding: 12, alignItems: "center", marginTop: 4 },
  cancelButtonText: { color: "#6b7280", fontSize: 16 },
});
