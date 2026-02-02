import { authTables } from "@convex-dev/auth/server"
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  ...authTables,
  // User profiles and authentication
  users: defineTable({
    username: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    bio: v.optional(v.string()),
    settings: v.object({
      darkMode: v.boolean(),
      dyslexiaFont: v.boolean(),
      publicProfile: v.boolean(),
    }),
    stats: v.object({
      booksCount: v.number(),
      wordsCount: v.number(),
      currentStreak: v.number(),
    }),
    badges: v.array(v.string()),
    createdAt: v.number(),
  })
    .index("by_username", ["username"])
    .index("by_email", ["email"]),

  // Canonical books from Open Library
  books: defineTable({
    openLibraryKey: v.string(),
    title: v.string(),
    author: v.string(),
    coverUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    firstPublishYear: v.optional(v.number()),
    stats: v.object({
      readersCount: v.number(),
      wordsCount: v.number(),
    }),
    createdAt: v.number(),
  })
    .index("by_openLibraryKey", ["openLibraryKey"])
    .index("by_title", ["title"])
    .index("by_author", ["author"]),

  // User's relationship to books
  userBooks: defineTable({
    userId: v.id("users"),
    bookId: v.id("books"),
    status: v.union(
      v.literal("reading"),
      v.literal("finished"),
      v.literal("want-to-read"),
    ),
    notes: v.optional(v.string()),
    wordsCount: v.number(),
    startedAt: v.optional(v.number()),
    finishedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_book", ["bookId"])
    .index("by_user_book", ["userId", "bookId"])
    .index("by_user_status", ["userId", "status"])
    .index("by_status", ["status"]),

  // Words saved by users
  words: defineTable({
    userId: v.id("users"),
    userBookId: v.id("userBooks"),
    bookId: v.id("books"),
    word: v.string(),
    definition: v.optional(v.string()),
    context: v.optional(v.string()),
    pageNumber: v.optional(v.number()),
    notes: v.optional(v.string()),
    likesCount: v.number(),
    isPublic: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_userBook", ["userBookId"])
    .index("by_book", ["bookId"])
    .index("by_book_public", ["bookId", "isPublic"])
    .index("by_word", ["word"])
    .index("by_public", ["isPublic"]),

  // Likes on words
  wordLikes: defineTable({
    userId: v.id("users"),
    wordId: v.id("words"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_word", ["wordId"])
    .index("by_user_word", ["userId", "wordId"]),

  // TODO: Future features (not yet implemented)
  // follows: defineTable({...}) -- social follow relationships
  // badges: defineTable({...}) -- achievement badge definitions
  // userBadges: defineTable({...}) -- user earned badges
})
