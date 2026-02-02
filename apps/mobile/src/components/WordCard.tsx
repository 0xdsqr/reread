import type React from "react"
import { StyleSheet, Text, View } from "react-native"
import { formatDate } from "../lib/constants"

interface WordCardProps {
  word: string
  definition?: string | null
  context?: string | null
  pageNumber?: number | null
  notes?: string | null
  createdAt?: number
  /** Book title to show in footer */
  bookTitle?: string
  /** Book author to show in footer */
  bookAuthor?: string
  /** Number of likes */
  likesCount?: number
  /** Optional right-side action (delete button, etc.) */
  action?: React.ReactNode
}

export function WordCard({
  word,
  definition,
  context,
  pageNumber,
  notes,
  createdAt,
  bookTitle,
  bookAuthor,
  likesCount,
  action,
}: WordCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.word}>{word}</Text>
        {pageNumber != null && (
          <Text style={styles.pageBadge}>p. {pageNumber}</Text>
        )}
      </View>

      {definition ? <Text style={styles.definition}>{definition}</Text> : null}

      {context ? (
        <View style={styles.contextBox}>
          <Text style={styles.contextText}>&ldquo;{context}&rdquo;</Text>
        </View>
      ) : null}

      {notes ? <Text style={styles.notes}>Note: {notes}</Text> : null}

      {(bookTitle || createdAt != null || likesCount != null) && (
        <View style={styles.footer}>
          {bookTitle && (
            <View>
              <Text style={styles.bookTitle}>{bookTitle}</Text>
              {bookAuthor && (
                <Text style={styles.bookAuthor}>by {bookAuthor}</Text>
              )}
            </View>
          )}
          <View style={styles.footerRight}>
            {createdAt != null && (
              <Text style={styles.date}>{formatDate(createdAt)}</Text>
            )}
            {(likesCount ?? 0) > 0 && (
              <Text style={styles.likes}>
                {likesCount} {likesCount === 1 ? "like" : "likes"}
              </Text>
            )}
          </View>
        </View>
      )}

      {action}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  word: {
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
})
