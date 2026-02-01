import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "@reread/convex";

export default function Profile() {
  const user = useQuery(api.users.getMe);
  const allWords = useQuery(api.words.listMine, {});
  const { signOut } = useAuthActions();

  if (user === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Not signed in</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.username || user.email || "?")[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.username}>{user.username || user.email}</Text>
        {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.stats?.booksCount ?? 0}</Text>
          <Text style={styles.statLabel}>Books</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.stats?.wordsCount ?? 0}</Text>
          <Text style={styles.statLabel}>Words</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{user.stats?.currentStreak ?? 0}</Text>
          <Text style={styles.statLabel}>Day Streak</Text>
        </View>
      </View>

      {/* Recent words */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Words</Text>
        {allWords === undefined ? (
          <ActivityIndicator size="small" color="#6366f1" />
        ) : allWords.length === 0 ? (
          <View style={styles.emptySection}>
            <Text style={styles.emptySectionText}>
              No words saved yet. Start reading and add words from your books!
            </Text>
          </View>
        ) : (
          <FlatList
            data={allWords.slice(0, 20)}
            keyExtractor={(item) => item._id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.wordRow}>
                <View style={styles.wordInfo}>
                  <Text style={styles.wordText}>{item.word}</Text>
                  {item.definition && (
                    <Text style={styles.wordDef} numberOfLines={1}>
                      {item.definition}
                    </Text>
                  )}
                </View>
                <Text style={styles.wordBook} numberOfLines={1}>
                  {item.bookTitle}
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={() => signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { alignItems: "center", paddingTop: 24, paddingBottom: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { fontSize: 28, fontWeight: "bold", color: "#fff" },
  username: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  bio: { fontSize: 14, color: "#6b7280", marginTop: 4, textAlign: "center", paddingHorizontal: 40 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    marginHorizontal: 24,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: { fontSize: 22, fontWeight: "bold", color: "#111827" },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: "#e5e7eb" },
  section: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 12 },
  emptySection: { padding: 20, alignItems: "center" },
  emptySectionText: { fontSize: 14, color: "#9ca3af", textAlign: "center" },
  wordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  wordInfo: { flex: 1 },
  wordText: { fontSize: 16, fontWeight: "600", color: "#111827" },
  wordDef: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  wordBook: { fontSize: 12, color: "#9ca3af", maxWidth: 120, textAlign: "right" },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: "#111827" },
  signOutBtn: {
    margin: 16,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ef4444",
    alignItems: "center",
  },
  signOutText: { color: "#ef4444", fontSize: 16, fontWeight: "600" },
});
