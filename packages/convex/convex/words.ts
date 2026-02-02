import { getAuthUserId } from "@convex-dev/auth/server"
import { ConvexError, v } from "convex/values"
import { mutation, query } from "./_generated/server"

// Add a word to a book
export const add = mutation({
  args: {
    userBookId: v.id("userBooks"),
    word: v.string(),
    definition: v.optional(v.string()),
    context: v.optional(v.string()),
    pageNumber: v.optional(v.number()),
    notes: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (
    ctx,
    { userBookId, word, definition, context, pageNumber, notes, isPublic },
  ) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError("Not authenticated")

    const userBook = await ctx.db.get(userBookId)
    if (!userBook || userBook.userId !== userId) {
      throw new ConvexError("Book not found in your library")
    }

    const wordId = await ctx.db.insert("words", {
      userId,
      userBookId,
      bookId: userBook.bookId,
      word: word.trim().toLowerCase(),
      definition,
      context,
      pageNumber,
      notes,
      likesCount: 0,
      isPublic: isPublic ?? true,
      createdAt: Date.now(),
    })

    // Increment user word count
    const user = await ctx.db.get(userId)
    if (user) {
      await ctx.db.patch(userId, {
        stats: { ...user.stats, wordsCount: user.stats.wordsCount + 1 },
      })
    }

    // Increment book word count
    const book = await ctx.db.get(userBook.bookId)
    if (book) {
      await ctx.db.patch(userBook.bookId, {
        stats: { ...book.stats, wordsCount: book.stats.wordsCount + 1 },
      })
    }

    // Increment userBook word count
    await ctx.db.patch(userBookId, {
      wordsCount: userBook.wordsCount + 1,
    })

    return wordId
  },
})

// Update a word
export const update = mutation({
  args: {
    wordId: v.id("words"),
    definition: v.optional(v.string()),
    context: v.optional(v.string()),
    pageNumber: v.optional(v.number()),
    notes: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
  },
  handler: async (ctx, { wordId, ...updates }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError("Not authenticated")

    const word = await ctx.db.get(wordId)
    if (!word || word.userId !== userId) {
      throw new ConvexError("Word not found")
    }

    const patch: {
      definition?: string
      context?: string
      pageNumber?: number
      notes?: string
      isPublic?: boolean
    } = {}
    if (updates.definition !== undefined) patch.definition = updates.definition
    if (updates.context !== undefined) patch.context = updates.context
    if (updates.pageNumber !== undefined) patch.pageNumber = updates.pageNumber
    if (updates.notes !== undefined) patch.notes = updates.notes
    if (updates.isPublic !== undefined) patch.isPublic = updates.isPublic

    await ctx.db.patch(wordId, patch)
    return await ctx.db.get(wordId)
  },
})

// Delete a word
export const remove = mutation({
  args: { wordId: v.id("words") },
  handler: async (ctx, { wordId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError("Not authenticated")

    const word = await ctx.db.get(wordId)
    if (!word || word.userId !== userId) {
      throw new ConvexError("Word not found")
    }

    // Delete all likes for this word
    const likes = await ctx.db
      .query("wordLikes")
      .withIndex("by_word", (q) => q.eq("wordId", wordId))
      .collect()

    for (const like of likes) {
      await ctx.db.delete(like._id)
    }

    await ctx.db.delete(wordId)

    // Decrement user word count
    const user = await ctx.db.get(userId)
    if (user) {
      await ctx.db.patch(userId, {
        stats: {
          ...user.stats,
          wordsCount: Math.max(0, user.stats.wordsCount - 1),
        },
      })
    }

    // Decrement book word count
    const book = await ctx.db.get(word.bookId)
    if (book) {
      await ctx.db.patch(word.bookId, {
        stats: {
          ...book.stats,
          wordsCount: Math.max(0, book.stats.wordsCount - 1),
        },
      })
    }

    // Decrement userBook word count
    const userBook = await ctx.db.get(word.userBookId)
    if (userBook) {
      await ctx.db.patch(word.userBookId, {
        wordsCount: Math.max(0, userBook.wordsCount - 1),
      })
    }
  },
})

// List words for a specific userBook (capped at 200)
export const listByUserBook = query({
  args: { userBookId: v.id("userBooks") },
  handler: async (ctx, { userBookId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const userBook = await ctx.db.get(userBookId)
    if (!userBook || userBook.userId !== userId) return []

    return await ctx.db
      .query("words")
      .withIndex("by_userBook", (q) => q.eq("userBookId", userBookId))
      .order("desc")
      .take(200)
  },
})

// List all words for current user (across all books)
export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const words = await ctx.db
      .query("words")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(500)

    // Enrich with book info -- deduplicate book lookups (many words share a book)
    const bookCache = new Map<string, { title: string; author: string }>()
    return await Promise.all(
      words.map(async (word) => {
        const bookIdStr = word.bookId as string
        if (!bookCache.has(bookIdStr)) {
          const book = await ctx.db.get(word.bookId)
          bookCache.set(bookIdStr, {
            title: book?.title ?? "Unknown",
            author: book?.author ?? "Unknown",
          })
        }
        const cached = bookCache.get(bookIdStr)!
        return {
          ...word,
          bookTitle: cached.title,
          bookAuthor: cached.author,
        }
      }),
    )
  },
})

// List public words for a book (from all users).
// Uses the compound index by_book_public to filter at the DB level.
export const listPublicByBook = query({
  args: { bookId: v.id("books") },
  handler: async (ctx, { bookId }) => {
    return await ctx.db
      .query("words")
      .withIndex("by_book_public", (q) =>
        q.eq("bookId", bookId).eq("isPublic", true),
      )
      .order("desc")
      .take(200)
  },
})

// Toggle like on a word
export const toggleLike = mutation({
  args: { wordId: v.id("words") },
  handler: async (ctx, { wordId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new ConvexError("Not authenticated")

    const existing = await ctx.db
      .query("wordLikes")
      .withIndex("by_user_word", (q) =>
        q.eq("userId", userId).eq("wordId", wordId),
      )
      .first()

    const word = await ctx.db.get(wordId)
    if (!word) throw new ConvexError("Word not found")

    if (existing) {
      await ctx.db.delete(existing._id)
      await ctx.db.patch(wordId, {
        likesCount: Math.max(0, word.likesCount - 1),
      })
      return { liked: false }
    } else {
      await ctx.db.insert("wordLikes", {
        userId,
        wordId,
        createdAt: Date.now(),
      })
      await ctx.db.patch(wordId, {
        likesCount: word.likesCount + 1,
      })
      return { liked: true }
    }
  },
})
