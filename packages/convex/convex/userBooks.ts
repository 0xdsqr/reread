import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import type { Doc } from "./_generated/dataModel"
import { mutation, type QueryCtx, query } from "./_generated/server"

// Shared status validator -- single source of truth
const statusValidator = v.union(
  v.literal("reading"),
  v.literal("finished"),
  v.literal("want-to-read"),
)

// Helper: enrich a userBook with its book data.
// wordsCount is now a field on userBooks -- no document scan needed.
async function enrichUserBook(ctx: QueryCtx, userBook: Doc<"userBooks">) {
  const book = await ctx.db.get(userBook.bookId)
  return { userBook, book, wordsCount: userBook.wordsCount }
}

// Add a book to user's profile
export const add = mutation({
  args: {
    openLibraryKey: v.string(),
    title: v.string(),
    author: v.string(),
    coverUrl: v.optional(v.string()),
    isbn: v.optional(v.string()),
    firstPublishYear: v.optional(v.number()),
    status: statusValidator,
  },
  handler: async (
    ctx,
    { openLibraryKey, title, author, coverUrl, isbn, firstPublishYear, status },
  ) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError("Not authenticated")

    // Create or get book
    const existingBook = await ctx.db
      .query("books")
      .withIndex("by_openLibraryKey", (q) =>
        q.eq("openLibraryKey", openLibraryKey),
      )
      .first()

    const bookId = existingBook
      ? existingBook._id
      : await ctx.db.insert("books", {
          openLibraryKey,
          title,
          author,
          coverUrl,
          isbn,
          firstPublishYear,
          stats: { readersCount: 0, wordsCount: 0 },
          createdAt: Date.now(),
        })

    // Check duplicate
    const existingUserBook = await ctx.db
      .query("userBooks")
      .withIndex("by_user_book", (q) =>
        q.eq("userId", userId).eq("bookId", bookId),
      )
      .first()

    if (existingUserBook) {
      throw new ConvexError("Book already in your library")
    }

    // Create userBook with wordsCount initialized to 0
    const userBookId = await ctx.db.insert("userBooks", {
      userId,
      bookId,
      status,
      wordsCount: 0,
      startedAt: status === "reading" ? Date.now() : undefined,
      createdAt: Date.now(),
    })

    // Increment book readers count
    const book = existingBook ?? (await ctx.db.get(bookId))!
    await ctx.db.patch(bookId, {
      stats: {
        ...book.stats,
        readersCount: book.stats.readersCount + 1,
      },
    })

    // Increment user book count
    const user = await ctx.db.get(userId)
    if (user) {
      await ctx.db.patch(userId, {
        stats: { ...user.stats, booksCount: user.stats.booksCount + 1 },
      })
    }

    return userBookId
  },
})

// Update book status
export const updateStatus = mutation({
  args: {
    userBookId: v.id("userBooks"),
    status: statusValidator,
  },
  handler: async (ctx, { userBookId, status }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError("Not authenticated")

    const userBook = await ctx.db.get(userBookId)
    if (!userBook || userBook.userId !== userId) {
      throw new ConvexError("User book not found")
    }

    const patch: Partial<Doc<"userBooks">> = { status }

    if (status === "reading" && userBook.status !== "reading") {
      patch.startedAt = Date.now()
    }
    if (status === "finished" && userBook.status !== "finished") {
      patch.finishedAt = Date.now()
    }

    await ctx.db.patch(userBookId, patch)
    return await ctx.db.get(userBookId)
  },
})

// Update book notes
export const updateNotes = mutation({
  args: {
    userBookId: v.id("userBooks"),
    notes: v.string(),
  },
  handler: async (ctx, { userBookId, notes }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError("Not authenticated")

    const userBook = await ctx.db.get(userBookId)
    if (!userBook || userBook.userId !== userId) {
      throw new ConvexError("User book not found")
    }

    await ctx.db.patch(userBookId, { notes })
    return await ctx.db.get(userBookId)
  },
})

// Remove book from user's profile
export const remove = mutation({
  args: { userBookId: v.id("userBooks") },
  handler: async (ctx, { userBookId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError("Not authenticated")

    const userBook = await ctx.db.get(userBookId)
    if (!userBook || userBook.userId !== userId) {
      throw new ConvexError("User book not found")
    }

    // Delete all words for this userBook + their likes
    const words = await ctx.db
      .query("words")
      .withIndex("by_userBook", (q) => q.eq("userBookId", userBookId))
      .collect()

    for (const word of words) {
      // Delete all likes for this word
      const likes = await ctx.db
        .query("wordLikes")
        .withIndex("by_word", (q) => q.eq("wordId", word._id))
        .collect()
      for (const like of likes) {
        await ctx.db.delete(like._id)
      }
      await ctx.db.delete(word._id)
    }

    await ctx.db.delete(userBookId)

    // Decrement book readers count + words count
    const book = await ctx.db.get(userBook.bookId)
    if (book) {
      await ctx.db.patch(userBook.bookId, {
        stats: {
          readersCount: Math.max(0, book.stats.readersCount - 1),
          wordsCount: Math.max(0, book.stats.wordsCount - words.length),
        },
      })
    }

    // H1 FIX: Decrement user book count AND words count for all deleted words
    const user = await ctx.db.get(userId)
    if (user) {
      await ctx.db.patch(userId, {
        stats: {
          ...user.stats,
          booksCount: Math.max(0, user.stats.booksCount - 1),
          wordsCount: Math.max(0, user.stats.wordsCount - words.length),
        },
      })
    }
  },
})

// Get a single userBook by ID with its book data and word count
export const getById = query({
  args: { userBookId: v.id("userBooks") },
  handler: async (ctx, { userBookId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const userBook = await ctx.db.get(userBookId)
    if (!userBook || userBook.userId !== userId) return null

    return await enrichUserBook(ctx, userBook)
  },
})

// Get user's books -- uses compound index for status filtering at DB level
export const listMine = query({
  args: { status: v.optional(statusValidator) },
  handler: async (ctx, { status }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    let userBooks: Doc<"userBooks">[]

    if (status) {
      // H3: Filter at DB level using compound index
      userBooks = await ctx.db
        .query("userBooks")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", userId).eq("status", status),
        )
        .collect()
    } else {
      userBooks = await ctx.db
        .query("userBooks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    }

    return await Promise.all(userBooks.map((ub) => enrichUserBook(ctx, ub)))
  },
})

// Get books for a specific user (public)
export const listByUser = query({
  args: {
    userId: v.id("users"),
    status: v.optional(statusValidator),
  },
  handler: async (ctx, { userId, status }) => {
    const user = await ctx.db.get(userId)
    if (!user || !user.settings.publicProfile) {
      return []
    }

    let userBooks: Doc<"userBooks">[]

    if (status) {
      userBooks = await ctx.db
        .query("userBooks")
        .withIndex("by_user_status", (q) =>
          q.eq("userId", userId).eq("status", status),
        )
        .collect()
    } else {
      userBooks = await ctx.db
        .query("userBooks")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect()
    }

    return await Promise.all(userBooks.map((ub) => enrichUserBook(ctx, ub)))
  },
})
